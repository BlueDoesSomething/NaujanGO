import express from 'express';
import axios from 'axios';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimit.js';
import { redactPII, detectFlags } from '../utils/moderation.js';
import { getNaujanLiveWeather } from './weatherController.js';
import { getIo } from '../socket.js';
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INTENTS_DIR = path.resolve(__dirname, '../MULTILINGUAL_CHATBOT/intents');
const intentsCache = new Map();
const supportedLanguages = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de'];
const pythonExecutable = process.env.PYTHON_PATH || 'python';
const scriptPath = path.resolve(__dirname, '../MULTILINGUAL_CHATBOT/scripts/chatbot_multilingual.py');
const PYTHON_TIMEOUT_MS = 12000;
const MODEL_API_URL = process.env.CHATBOT_MODEL_URL ? process.env.CHATBOT_MODEL_URL.trim().replace(/\/$/, '') : null;
const STAFF_ROLES = ['admin', 'agent'];

const humanAgentStartLimiter = createRateLimiter({
  name: 'chatbot-human-agent-start',
  windowMs: 15000,
  maxRequests: 1,
  message: 'Please wait a moment before starting another human agent chat.',
  errorCode: 'AGENT_START_RATE_LIMITED',
  keyGenerator: (req) => String(req.body?.user_id || req.ip || 'anonymous')
});

const getConversationAssignment = async (conversationId) => {
  const [rows] = await db.promise().query(
    `SELECT c.conversation_id, c.claimed_by, c.claimed_at, u.username AS claimed_by_username, u.role AS claimed_by_role
     FROM chatbot_conversations c
     LEFT JOIN users u ON u.user_id = c.claimed_by
     WHERE c.conversation_id = ?
     LIMIT 1`,
    [conversationId]
  );

  return rows[0] || null;
};

const setConversationAssignment = async (conversationId, userId, force = false) => {
  const assignment = await getConversationAssignment(conversationId);
  if (!assignment) {
    return { ok: false, status: 404, error: 'Conversation not found' };
  }

  if (assignment.claimed_by && assignment.claimed_by !== userId && !force) {
    return {
      ok: false,
      status: 409,
      error: 'Conversation is already claimed by another agent',
      assignment
    };
  }

  await db.promise().query(
    'UPDATE chatbot_conversations SET claimed_by = ?, claimed_at = CURRENT_TIMESTAMP WHERE conversation_id = ?',
    [userId, conversationId]
  );

  return { ok: true, assignment: await getConversationAssignment(conversationId) };
};

const releaseConversationAssignment = async (conversationId, userId, force = false) => {
  const assignment = await getConversationAssignment(conversationId);
  if (!assignment) {
    return { ok: false, status: 404, error: 'Conversation not found' };
  }

  if (assignment.claimed_by && assignment.claimed_by !== userId && !force) {
    return {
      ok: false,
      status: 409,
      error: 'Conversation is claimed by another agent',
      assignment
    };
  }

  await db.promise().query(
    'UPDATE chatbot_conversations SET claimed_by = NULL, claimed_at = NULL WHERE conversation_id = ?',
    [conversationId]
  );

  return { ok: true, assignment: await getConversationAssignment(conversationId) };
};

const persistHumanReply = async ({ conversationId, message, language, flagged, flagReason, sender = 'human' }) => {
  const redacted = redactPII(message.trim());
  const flags = detectFlags(message.trim());
  const shouldFlag = Boolean(flagged) || Boolean(flags);
  const reason = flagReason || flags || null;

  try {
    const [result] = await db.promise().query(
      'INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language, sender, flagged, flag_reason) VALUES (?, ?, NULL, ?, ?, ?, ?)',
      [conversationId, redacted, language || 'en', sender, shouldFlag ? 1 : 0, reason]
    );

    try {
      const io = getIo();
      io.to(`conv_${conversationId}`).emit('chat:message', {
        conversation_id: conversationId,
        message: {
          sender,
          text: redacted,
          sent_at: new Date(),
          message_id: result.insertId,
          language: language || 'en'
        }
      });
    } catch (e) {}

    return {
      success: true,
      message_id: result.insertId,
      message: redacted,
      sent_at: new Date()
    };
  } catch (error) {
    console.error('Error saving reply:', error);
    throw error;
  }
};

let pythonWorker = null;
let pythonBuffer = '';
let nextRequestId = 1;
const pendingRequests = new Map();

const fallbackDefaults = {
  en: "I'm not quite sure I understand. Could you rephrase that?",
  es: "No estoy seguro de entender. ¿Puedes reformular eso?",
  tl: "Hindi ko po masyadong maintindihan. Pwede po bang ulitin?",
  zh: "我不太确定我理解了。你能重新表述一下吗？",
  ja: "申し訳ございませんが、よく理解できませんでした。言い直していただけますか？",
  ko: "죄송하지만 이해를 못했습니다. 다시 말씀해 주시겠어요?",
  fr: "Je ne suis pas sûr de bien comprendre. Pouvez-vous reformuler?",
  de: "Ich bin mir nicht sicher, dass ich das verstanden habe. Können Sie umformulieren?"
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[?!¡¿.,;:()\[\]{}"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getHumanAgentExplanation(language = 'en') {
  const responses = {
    en: 'Human agents on this site are real staff members. They review flagged chats in the moderation page, reply from the admin moderation panel or inline reply box, and their messages are saved as human replies in the conversation thread. If you need a person, ask for a human agent and I can point you to that flow.',
    es: 'Los agentes humanos en este sitio son miembros reales del personal. Revisan los chats marcados en la página de moderación, responden desde el panel de moderación admin o la caja de respuesta en línea, y sus mensajes se guardan como respuestas humanas en la conversación. Si necesitas una persona, pídeme un agente humano y te indicaré ese flujo.',
    tl: 'Ang human agents sa site na ito ay totoong staff members. Nire-review nila ang mga naka-flag na chat sa moderation page, sumasagot sila mula sa admin moderation panel o inline reply box, at nai-save ang mga mensahe nila bilang human replies sa usapan. Kung kailangan mo ng tao, sabihin mo lang na human agent at ituturo kita sa flow na iyon.',
    zh: '这个网站上的人工客服是真实的工作人员。他们会在审核页面查看被标记的聊天内容，通过管理员审核面板或内联回复框进行回复，并且他们的消息会作为人工回复保存在对话里。如果你需要真人帮助，告诉我你要人工客服，我可以指引你到这个流程。',
    ja: 'このサイトの有人対応は実際のスタッフです。モデレーションページでフラグ付きのチャットを確認し、管理者モデレーション画面またはインライン返信欄から返信し、そのメッセージは会話内で人間の返信として保存されます。人の対応が必要なら、有人スタッフを希望すると伝えてください。',
    ko: '이 사이트의 사람 상담원은 실제 직원입니다. 모더레이션 페이지에서 플래그된 채팅을 검토하고, 관리자 모더레이션 패널이나 인라인 답장 칸에서 답변하며, 그 메시지는 대화에 사람 답변으로 저장됩니다. 사람이 필요하면 human agent가 필요하다고 말해 주세요.',
    fr: 'Les agents humains sur ce site sont de vrais membres du personnel. Ils consultent les discussions signalées dans la page de modération, répondent depuis le panneau de modération administrateur ou la zone de réponse intégrée, et leurs messages sont enregistrés comme réponses humaines dans la conversation. Si vous avez besoin d’une personne, demandez un agent humain et je vous orienterai vers ce flux.',
    de: 'Die menschlichen Agenten auf dieser Website sind echte Mitarbeiter. Sie prüfen markierte Chats auf der Moderationsseite, antworten über das Admin-Moderationspanel oder das Inline-Antwortfeld, und ihre Nachrichten werden als menschliche Antworten im Gespräch gespeichert. Wenn Sie eine Person brauchen, fragen Sie nach einem Human Agent und ich leite Sie zu diesem Ablauf weiter.'
  };

  return responses[language] || responses.en;
}

function isHumanAgentQuestion(message) {
  const normalizedMessage = normalizeText(message);
  return /(human agent|live agent|real person|talk to a person|talk to human|human support|support staff|admin reply|moderation page|moderator reply|owner reply|person in charge)/.test(normalizedMessage);
}

function loadIntents(language) {
  if (intentsCache.has(language)) {
    return intentsCache.get(language);
  }

  const filePath = path.join(INTENTS_DIR, `intents_${language}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    intentsCache.set(language, parsed);
    return parsed;
  } catch (error) {
    intentsCache.set(language, null);
    return null;
  }
}

function preloadIntents() {
  supportedLanguages.forEach((lang) => {
    if (!intentsCache.has(lang)) {
      loadIntents(lang);
    }
  });
}

preloadIntents();

function resetPythonWorker(error) {
  if (pythonWorker) {
    try {
      pythonWorker.kill();
    } catch (err) {
      console.error('Error stopping python worker:', err);
    }
  }
  pythonWorker = null;
  pythonBuffer = '';

  for (const { reject, timeoutId } of pendingRequests.values()) {
    clearTimeout(timeoutId);
    reject(error || new Error('Python worker stopped'));
  }
  pendingRequests.clear();
}

function startPythonWorker() {
  if (pythonWorker) return pythonWorker;

  pythonWorker = spawn(pythonExecutable, [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
      TF_ENABLE_ONEDNN_OPTS: '0',
      TF_CPP_MIN_LOG_LEVEL: '3',
      PYTHONWARNINGS: 'ignore'
    }
  });

  pythonWorker.on('error', (error) => {
    console.error('Python worker failed to start:', error.message);
    resetPythonWorker(error);
  });

  pythonWorker.stdout.on('data', (data) => {
    pythonBuffer += data.toString();
    const lines = pythonBuffer.split('\n');
    pythonBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        const requestId = parsed?.id;
        if (requestId && pendingRequests.has(requestId)) {
          const { resolve, timeoutId } = pendingRequests.get(requestId);
          clearTimeout(timeoutId);
          pendingRequests.delete(requestId);
          resolve(parsed.response || '');
        }
      } catch (err) {
        console.error('Failed to parse python response:', err);
      }
    }
  });

  pythonWorker.stderr.on('data', (data) => {
    const message = data.toString().trim();
    if (!message) return;
    if (message.includes('tensorflow/') || message.includes('oneDNN') || message.startsWith('WARNING:tensorflow')) {
      console.log('Python worker info:', message);
      return;
    }
    console.error('Python worker error:', message);
  });

  pythonWorker.on('close', (code) => {
    resetPythonWorker(new Error(`Python worker exited with code ${code}`));
  });

  return pythonWorker;
}

function sendToPython(payload) {
  return new Promise((resolve, reject) => {
    const worker = startPythonWorker();
    const requestId = nextRequestId++;
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Python worker timeout'));
    }, PYTHON_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, reject, timeoutId });

    const message = JSON.stringify({ ...payload, id: requestId }) + '\n';
    worker.stdin.write(message);
  });
}

async function queryModel(payload) {
  if (MODEL_API_URL) {
    const response = await axios.post(`${MODEL_API_URL}/predict`, payload, {
      timeout: 8000,
      headers: { 'Content-Type': 'application/json' }
    });
    const text = response.data?.response;
    if (text === undefined || text === null || text === '') {
      throw new Error('Empty response from model API');
    }
    return text;
  }
  return sendToPython(payload);
}

function findBestIntent(message, language = 'en') {
  const lang = supportedLanguages.includes(language) ? language : 'en';

  const intentsData = loadIntents(lang) || (lang !== 'en' ? loadIntents('en') : null);
  if (!intentsData?.intents) {
    return null;
  }

  const normalizedMessage = normalizeText(message);
  const messageWords = new Set(normalizedMessage.split(' '));
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of intentsData.intents) {
    if (!intent?.patterns || !intent?.responses?.length) continue;
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalizeText(pattern);
      if (!normalizedPattern) {
        continue;
      }

      const patternWords = normalizedPattern.split(' ');
      if (intent.tag === 'Historical_Mayors' && patternWords.length < 2) {
        continue;
      }

      const patternWordsMatch = patternWords.every((word) => messageWords.has(word));
      const phraseMatch = normalizedMessage.includes(normalizedPattern);

      if (!phraseMatch && !patternWordsMatch) {
        continue;
      }

      const specificityScore = patternWords.length * 10 + (phraseMatch ? 1 : 0);
      if (specificityScore > bestScore) {
        bestScore = specificityScore;
        bestMatch = intent;
      }
    }
  }

  return bestMatch;
}

function getIntentFallbackResponse(message, language = 'en') {
  const lang = supportedLanguages.includes(language) ? language : 'en';

  if (isHumanAgentQuestion(message)) {
    return getHumanAgentExplanation(lang);
  }

  const bestMatch = findBestIntent(message, lang);
  if (bestMatch) {
    return bestMatch.responses[0];
  }

  return fallbackDefaults[lang] || fallbackDefaults.en;
}

function detectIntentTag(message, language = 'en') {
  const bestMatch = findBestIntent(message, language);
  return bestMatch ? bestMatch.tag : null;
}

const WEATHER_LANG_LOCALES = {
  en: 'en-US', es: 'es-ES', tl: 'fil-PH', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', fr: 'fr-FR', de: 'de-DE'
};

const WEATHER_LABELS = {
  en: { header: 'Live weather in Naujan town', updated: 'Updated', temp: 'Temperature', feels: 'feels like', condition: 'Condition', humidity: 'Humidity', wind: 'Wind', forecast: 'Next days', live: 'Live forecast & map', pagasa: 'PAGASA', hazards: { heat: 'Extreme heat - stay hydrated', cool: 'Cool weather - bring layers', storm: 'Thunderstorm - seek shelter', rain: 'Rain expected - bring umbrella', wind_high: 'Strong winds - be cautious', wind_med: 'Moderate winds', visibility: 'Low visibility - drive carefully', humidity_high: 'High humidity' }, safe: 'No major weather hazards today' },
  es: { header: 'Clima en vivo en el pueblo de Naujan', updated: 'Actualizado', temp: 'Temperatura', feels: 'sensación', condition: 'Condición', humidity: 'Humedad', wind: 'Viento', forecast: 'Próximos días', live: 'Pronóstico y mapa en vivo', pagasa: 'PAGASA', hazards: { heat: 'Calor extremo: hidrátate', cool: 'Clima fresco: lleva ropa de abrigo', storm: 'Tormenta eléctrica: busca refugio', rain: 'Lluvia esperada: lleva paraguas', wind_high: 'Vientos fuertes: ten precaución', wind_med: 'Vientos moderados', visibility: 'Baja visibilidad: conduce con cuidado', humidity_high: 'Alta humedad' }, safe: 'Sin riesgos climáticos importantes hoy' },
  tl: { header: 'Live na panahon sa bayan ng Naujan', updated: 'Na-update', temp: 'Temperatura', feels: 'parang', condition: 'Kondisyon', humidity: 'Halumigmig', wind: 'Hangin', forecast: 'Susunod na mga araw', live: 'Live forecast at mapa', pagasa: 'PAGASA', hazards: { heat: 'Matinding init - uminom ng tubig', cool: 'Malamig - magdala ng damit panlabas', storm: 'Bagyo at kulog - humanap ng silungan', rain: 'Asahan ang ulan - magdala ng payong', wind_high: 'Malakas na hangin - mag-ingat', wind_med: 'Katamtamang hangin', visibility: 'Mahina ang visibility - mag-ingat sa pagmamaneho', humidity_high: 'Mataas na halumigmig' }, safe: 'Walang malaking panganib sa panahon ngayon' },
  zh: { header: '瑙汉镇实时天气', updated: '更新于', temp: '温度', feels: '体感', condition: '天气状况', humidity: '湿度', wind: '风速', forecast: '未来几天', live: '实时预报与地图', pagasa: 'PAGASA 气象局', hazards: { heat: '极端高温 - 注意补水', cool: '天气凉爽 - 请带外套', storm: '雷暴 - 请寻找庇护所', rain: '预计有雨 - 请带伞', wind_high: '强风 - 请小心', wind_med: '中等风', visibility: '能见度低 - 小心驾驶', humidity_high: '高湿度' }, safe: '今天无重大天气风险' },
  ja: { header: 'ナウハン町のライブ天気', updated: '更新', temp: '気温', feels: '体感', condition: '天気', humidity: '湿度', wind: '風速', forecast: '今後数日', live: 'ライブ予報と地図', pagasa: 'PAGASA', hazards: { heat: '猛暑 - 水分補給を', cool: '肌寒い - 上着を', storm: '雷雨 - 屋内待避を', rain: '雨の見込み - 傘を', wind_high: '強風 - ご注意', wind_med: '並の風', visibility: '視界不良 - 運転注意', humidity_high: '高湿度' }, safe: '今日は大きな天気リスクはありません' },
  ko: { header: '나우한 읍 실시간 날씨', updated: '업데이트', temp: '기온', feels: '체감', condition: '날씨', humidity: '습도', wind: '바람', forecast: '향후 며칠', live: '라이브 예보 및 지도', pagasa: 'PAGASA', hazards: { heat: '폭염 - 수분 섭취하세요', cool: '서늘함 - 겉옷 챙기세요', storm: '뇌우 - 대피하세요', rain: '비 예상 - 우산 챙기세요', wind_high: '강풍 - 주의하세요', wind_med: '보통 바람', visibility: '시야 낮음 - 운전 주의', humidity_high: '높은 습도' }, safe: '오늘은 큰 날씨 위험이 없습니다' },
  fr: { header: 'Météo en direct à Naujan', updated: 'Mis à jour', temp: 'Température', feels: 'ressenti', condition: 'Condition', humidity: 'Humidité', wind: 'Vent', forecast: 'Prochains jours', live: 'Prévisions et carte en direct', pagasa: 'PAGASA', hazards: { heat: 'Chaleur extrême - hydratez-vous', cool: 'Temps frais - prévoyez une couche', storm: 'Orage - mettez-vous à l’abri', rain: 'Pluie attendue - prenez un parapluie', wind_high: 'Vents forts - prudence', wind_med: 'Vents modérés', visibility: 'Faible visibilité - conduisez prudemment', humidity_high: 'Humidité élevée' }, safe: 'Aucun risque météo majeur aujourd’hui' },
  de: { header: 'Live-Wetter in der Stadt Naujan', updated: 'Aktualisiert', temp: 'Temperatur', feels: 'gefühlt', condition: 'Bedingung', humidity: 'Luftfeuchtigkeit', wind: 'Wind', forecast: 'Nächste Tage', live: 'Live-Vorhersage & Karte', pagasa: 'PAGASA', hazards: { heat: 'Extreme Hitze - viel trinken', cool: 'Kühles Wetter - warm anziehen', storm: 'Gewitter - Schutz suchen', rain: 'Regen erwartet - Schirm mitnehmen', wind_high: 'Starker Wind - Vorsicht', wind_med: 'Mäßiger Wind', visibility: 'Schlechte Sicht - vorsichtig fahren', humidity_high: 'Hohe Luftfeuchtigkeit' }, safe: 'Heute keine größeren Wetterrisiken' }
};

const WEATHER_CONDITION_TRANSLATIONS = {
  en: { Clear: 'Clear', Clouds: 'Cloudy', Rain: 'Rain', Thunderstorm: 'Thunderstorm', Drizzle: 'Drizzle', Snow: 'Snow', Mist: 'Mist', Smoke: 'Smoke', Haze: 'Haze', Fog: 'Fog', Dust: 'Dust', Sand: 'Sand', Squall: 'Squall', Tornado: 'Tornado' },
  es: { Clear: 'Despejado', Clouds: 'Nublado', Rain: 'Lluvia', Thunderstorm: 'Tormenta', Drizzle: 'Llovizna', Snow: 'Nieve', Mist: 'Niebla', Smoke: 'Humo', Haze: 'Calima', Fog: 'Niebla espesa', Dust: 'Polvo', Sand: 'Arena', Squall: 'Chubasco', Tornado: 'Tornado' },
  tl: { Clear: 'Maaliwalas', Clouds: 'Maulap', Rain: 'Ulan', Thunderstorm: 'Bagyo/ Kulog', Drizzle: 'Ambun', Snow: 'Niyebe', Mist: 'Ulap', Smoke: 'Usok', Haze: 'Alikabok', Fog: 'Makapal na ulap', Dust: 'Alikabok', Sand: 'Buhangin', Squall: 'Mahangin', Tornado: 'Ipuran' },
  zh: { Clear: '晴朗', Clouds: '多云', Rain: '有雨', Thunderstorm: '雷暴', Drizzle: '毛毛雨', Snow: '下雪', Mist: '薄雾', Smoke: '烟雾', Haze: '霾', Fog: '雾', Dust: '沙尘', Sand: '沙', Squall: '狂风', Tornado: '龙卷风' },
  ja: { Clear: '晴れ', Clouds: '曇り', Rain: '雨', Thunderstorm: '雷雨', Drizzle: '霧雨', Snow: '雪', Mist: 'もや', Smoke: '煙霧', Haze: '煙霧', Fog: '霧', Dust: '砂塵', Sand: '砂', Squall: '突風', Tornado: '竜巻' },
  ko: { Clear: '맑음', Clouds: '흐림', Rain: '비', Thunderstorm: '천둥번개', Drizzle: '이슬비', Snow: '눈', Mist: '안개', Smoke: '연기', Haze: '실안개', Fog: '짙은 안개', Dust: '먼지', Sand: '모래', Squall: '돌풍', Tornado: '토네이도' },
  fr: { Clear: 'Dégagé', Clouds: 'Nuageux', Rain: 'Pluie', Thunderstorm: 'Orage', Drizzle: 'Bruine', Snow: 'Neige', Mist: 'Brume', Smoke: 'Fumée', Haze: 'Brume sèche', Fog: 'Brouillard', Dust: 'Poussière', Sand: 'Sable', Squall: 'Rafales', Tornado: 'Tornade' },
  de: { Clear: 'Klar', Clouds: 'Bewölkt', Rain: 'Regen', Thunderstorm: 'Gewitter', Drizzle: 'Nieselregen', Snow: 'Schnee', Mist: 'Nebel', Smoke: 'Rauch', Haze: 'Dunst', Fog: 'Nebelig', Dust: 'Staub', Sand: 'Sand', Squall: 'Böen', Tornado: 'Tornado' }
};

function translateCondition(condition, language) {
  const lang = supportedLanguages.includes(language) ? language : 'en';
  const map = WEATHER_CONDITION_TRANSLATIONS[lang] || WEATHER_CONDITION_TRANSLATIONS.en;
  return map[condition] || condition || '';
}

function translateHazard(message, language) {
  const lang = supportedLanguages.includes(language) ? language : 'en';
  const labels = WEATHER_LABELS[lang] || WEATHER_LABELS.en;
  const m = (message || '').toLowerCase();
  let key = 'rain';
  if (m.includes('heat')) key = 'heat';
  else if (m.includes('cool')) key = 'cool';
  else if (m.includes('thunder')) key = 'storm';
  else if (m.includes('strong wind')) key = 'wind_high';
  else if (m.includes('wind')) key = 'wind_med';
  else if (m.includes('visibility')) key = 'visibility';
  else if (m.includes('humidity')) key = 'humidity_high';
  else key = 'rain';
  return labels.hazards[key] || message;
}

function formatTimestamp(ts, language) {
  const locale = WEATHER_LANG_LOCALES[language] || 'en-US';
  const date = ts instanceof Date ? ts : new Date(ts);
  try {
    return date.toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return date.toLocaleString();
  }
}

function buildLiveWeatherResponse(weatherPayload, language = 'en') {
  if (!weatherPayload || !weatherPayload.current) return null;

  const lang = supportedLanguages.includes(language) ? language : 'en';
  const labels = WEATHER_LABELS[lang] || WEATHER_LABELS.en;
  const { current, forecast, hazards } = weatherPayload;

  const line = (emoji, rest) => `${emoji} ${rest}`;
  const lines = [];

  lines.push(line('🌤️', labels.header));
  lines.push(line('🕒', `${labels.updated}: ${formatTimestamp(current.timestamp || new Date(), lang)}`));
  lines.push(line('🌡️', `${labels.temp}: ${current.temperature}°C (${labels.feels} ${current.feelsLike}°C)`));
  lines.push(line('☁️', `${labels.condition}: ${translateCondition(current.condition, lang)}${current.description ? ` (${current.description})` : ''}`));
  lines.push(line('💧', `${labels.humidity}: ${current.humidity}%  ·  ${labels.wind}: ${current.windSpeed} km/h`));

  if (Array.isArray(hazards) && hazards.length > 0) {
    const hazardLines = hazards.slice(0, 2).map((h) => line('⚠️', translateHazard(h.message, lang)));
    lines.push(...hazardLines);
  } else {
    lines.push(line('✅', labels.safe));
  }

  if (Array.isArray(forecast) && forecast.length > 0) {
    const locale = WEATHER_LANG_LOCALES[lang] || 'en-US';
    const fore = forecast.slice(0, 3).map((f) => {
      let day;
      const d = f.datetime instanceof Date ? f.datetime : new Date(f.datetime);
      try { day = d.toLocaleDateString(locale, { weekday: 'short' }); } catch (e) { day = d.toLocaleDateString(); }
      return `${day} ${f.temperature}°C ${translateCondition(f.condition, lang)}`;
    });
    lines.push(line('📅', `${labels.forecast}: ${fore.join(' · ')}`));
  }

  lines.push(line('🔗', `${labels.live}: https://www.windy.com/13.3333/121.3000`));
  lines.push(`   ℹ️ ${labels.pagasa}: https://www.pagasa.dost.gov.ph/`);

  return lines.join('\n');
}

const WEATHER_QUESTION_KEYWORDS = {
  en: ['weather', 'forecast', 'rain', 'raining', 'rainy', 'temperature', 'typhoon', 'humidity', 'sunny', 'sun', 'storm', 'climate', 'degrees', 'hot today', 'cold today'],
  es: ['clima', 'tiempo', 'pronostico', 'pronóstico', 'lluvia', 'lluvioso', 'temperatura', 'tifon', 'tifón', 'humedad', 'soleado', 'sol', 'tormenta', 'calor', 'frio', 'frío'],
  tl: ['panahon', 'weather', 'ulan', 'umuulan', 'maulan', 'temperatura', 'bagyo', 'halumigmig', 'araw', 'sikat', 'init', 'lamig', 'clima', 'typhoon', 'sunny'],
  zh: ['天气', '天气怎么样', '预报', '下雨', '温度', '台风', '湿度', '晴天', '阳光', '风暴', '气候', '热', '冷'],
  ja: ['天気', '天気予報', '予報', '雨', '気温', '台風', '湿度', '晴れ', '晴', 'サン', '暴風', '気候', '暑い', '寒い'],
  ko: ['날씨', '예보', '비', '비가', '기온', '태풍', '습도', '맑음', '태양', '폭풍', '기후', '덥', '춥'],
  fr: ['météo', 'meteo', 'prévision', 'prevision', 'pluie', 'température', 'typhon', 'humidité', 'ensoleillé', 'soleil', 'orage', 'climat', 'chaud', 'froid'],
  de: ['wetter', 'vorhersage', 'regen', 'regnerisch', 'temperatur', 'taifun', 'feuchtigkeit', 'sonnig', 'sonne', 'sturm', 'klima', 'heiß', 'kalt']
};

function isWeatherQuestion(message, language = 'en') {
  const lang = supportedLanguages.includes(language) ? language : 'en';
  const keywords = WEATHER_QUESTION_KEYWORDS[lang] || WEATHER_QUESTION_KEYWORDS.en;
  const normalized = normalizeText(message);
  return keywords.some((kw) => normalized.includes(normalizeText(kw)));
}

async function augmentWeatherResponse(message, response, language = 'en') {
  const intentTag = (response && typeof response === 'object' && response.intent) ? response.intent : detectIntentTag(message, language);
  const directWeatherQuery = intentTag === 'Weather_Info' || isWeatherQuestion(message, language);
  if (!directWeatherQuery && intentTag !== 'Best_Time_To_Visit') {
    return response;
  }

  let weatherPayload = null;
  try {
    weatherPayload = await Promise.race([
      getNaujanLiveWeather(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Weather timeout')), 4000))
    ]);
  } catch (e) {
    weatherPayload = null;
  }

  let baseText = (response && typeof response === 'object') ? (response.text || '') : response;
  const objects = (response && typeof response === 'object') ? response : null;

  const liveBlock = buildLiveWeatherResponse(weatherPayload, language);
  if (!liveBlock) {
    return response;
  }

  if (directWeatherQuery) {
    return { text: liveBlock, actions: objects?.actions || [], intent: 'Weather_Info' };
  }

  const joined = `${liveBlock}\n\n${baseText}`;
  if (objects) {
    return { ...objects, text: joined };
  }
  return joined;
}

export { detectIntentTag, buildLiveWeatherResponse, translateCondition, translateHazard, isWeatherQuestion, augmentWeatherResponse };

// Helper function to save last conversation for logged-in users
function saveLastConversationForUser(user_id, conversation_id, callback) {
  if (!user_id) {
    // Only save for logged-in users
    if (callback) callback();
    return;
  }

  db.query(
    `INSERT INTO user_last_conversation (user_id, conversation_id, last_updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE 
       conversation_id = VALUES(conversation_id),
       last_updated_at = CURRENT_TIMESTAMP`,
    [user_id, conversation_id],
    (err) => {
      if (err) {
        console.error('Error saving last conversation for user:', err);
      }
      if (callback) callback();
    }
  );
}

// Helper function to save messages to database
function saveMessageToDB(conversation_id, user_id, message, botResponse, language, callback) {
  const convId = conversation_id || null;
  const lang = language || 'en';

  const saveMessage = (cid) => {
    try {
      const redactedUser = redactPII(message);
      const redactedBot = redactPII(botResponse);
      const userFlag = detectFlags(message);
      const botFlag = detectFlags(botResponse);
      const combinedFlags = [userFlag, botFlag].filter(Boolean).join(',') || null;

      // Try to insert with moderation fields; if DB doesn't have them yet, fallback
      const tryInsertWithModeration = () => {
        db.query(
          'INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language, sender, flagged, flag_reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [cid, redactedUser, redactedBot, lang, 'user', combinedFlags ? 1 : 0, combinedFlags],
          (err, result) => {
            if (err) {
              // fallback to basic insert if schema differs
              db.query(
                'INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language, sender) VALUES (?, ?, ?, ?, ?)',
                [cid, redactedUser, redactedBot, lang, 'user'],
                (err2, result2) => {
                  if (err2) console.error('chat message save error (fallback)', err2);
                  saveLastConversationForUser(user_id, cid, () => {
                    if (callback) callback(cid);
                    // emit via socket (best-effort)
                    try {
                      const io = getIo();
                      io.to(`conv_${cid}`).emit('chat:message', { conversation_id: cid, message: { sender: 'user', text: redactedUser, response_text: redactedBot, sent_at: new Date(), message_id: result2 ? result2.insertId : null, language: lang } });
                    } catch (e) {}
                  });
                }
              );
            } else {
              saveLastConversationForUser(user_id, cid, () => {
                if (callback) callback(cid);
                try {
                  const io = getIo();
                  io.to(`conv_${cid}`).emit('chat:message', { conversation_id: cid, message: { sender: 'user', text: redactedUser, response_text: redactedBot, sent_at: new Date(), message_id: result.insertId, language: lang } });
                } catch (e) {}
              });
            }
          }
        );
      };

      tryInsertWithModeration();
    } catch (e) {
      console.error('saveMessageToDB error', e);
      db.query(
        'INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language) VALUES (?, ?, ?, ?)',
        [cid, message, botResponse, lang],
        (err) => {
          if (err) console.error('chat message save error', err);
          saveLastConversationForUser(user_id, cid, () => {
            if (callback) callback(cid);
          });
        }
      );
    }
  };

  if (convId) {
    saveMessage(convId);
  } else {
    // Create a new conversation
    db.query('INSERT INTO chatbot_conversations (user_id, started_at) VALUES (?, CURRENT_TIMESTAMP)', [user_id || null], (err, result) => {
      if (err) {
        console.error('create conversation error', err);
        if (callback) callback(null);
      } else {
        const newConvId = result.insertId;
        saveMessage(newConvId);
      }
    });
  }
}

/**
 * POST /chatbot
 * Send a message to the chatbot and get a response
 * 
 * Request body:
 * {
 *   message: string (required) - User's message
 *   language: string (optional) - Language code (en, es, tl, zh, ja, ko, fr, de)
 *   user_id: number (optional) - User ID for conversation tracking
 *   user_name: string (optional) - User name
 *   conversation_id: number (optional) - Existing conversation ID
 *   auto_detect: boolean (optional, default: true) - Enable automatic language detection
 * }
 * 
 * Response:
 * {
 *   response: string - Chatbot's response
 *   conversation_id: number - ID of the conversation
 *   detected_language: string (optional) - Detected language code
 * }
 */
router.post('/', async (req, res) => {
  const { user_name, user_id, conversation_id, message, language, auto_detect = true } = req.body;

  // Validate message
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ error: 'Message is required and must be a non-empty string' });
  }

  const pythonInput = {
    message: message.trim(),
    language: language || null,
    auto_detect: auto_detect,
    use_cache: true
  };

  // Try Python worker with quick timeout, fallback immediately if slow
  let botResponse = '';
  let usedFallback = false;
  
  try {
    botResponse = await Promise.race([
      queryModel(pythonInput),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
    ]);
  } catch (error) {
    usedFallback = true;
    botResponse = getIntentFallbackResponse(message, language);
  }

  if (!botResponse) {
    usedFallback = true;
    botResponse = getIntentFallbackResponse(message, language);
  }

  botResponse = await augmentWeatherResponse(message, botResponse, language || 'en');

  const botTextForDB = (botResponse && typeof botResponse === 'object') ? (botResponse.text || '') : botResponse;

  saveMessageToDB(conversation_id, user_id, message, botTextForDB, language, (convId) => {
    return res.json({
      response: botResponse,
      conversation_id: convId,
      detected_language: language || 'en',
      fallback_mode: usedFallback
    });
  });
});

/**
 * GET /chatbot/languages
 * Get list of supported languages
 */
router.get('/languages', (req, res) => {
  res.json({
    supported_languages: {
      'en': 'English',
      'es': 'Spanish',
      'tl': 'Tagalog (Filipino)',
      'zh': 'Chinese (Simplified)',
      'ja': 'Japanese',
      'ko': 'Korean',
      'fr': 'French',
      'de': 'German'
    },
    auto_detection: 'Enabled - Language is automatically detected from user message'
  });
});

/**
 * GET /chatbot/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    fallback_available: true,
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /chatbot/history/:userId
 * Get conversation history for a user
 */
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    db.query(
      `SELECT 
        c.conversation_id,
        c.started_at,
        COUNT(m.message_id) as message_count,
        MAX(m.sent_at) as last_message_at,
        MAX(CASE WHEN LOWER(m.sender) = 'human' THEN 1 ELSE 0 END) as has_human_message
      FROM chatbot_conversations c
      LEFT JOIN chatbot_messages m ON c.conversation_id = m.conversation_id
      WHERE c.user_id = ?
      GROUP BY c.conversation_id
      ORDER BY c.started_at DESC
      LIMIT ?`,
      [userId, limit],
      (err, conversations) => {
        if (err) {
          console.error('Error fetching conversation history:', err);
          return res.status(500).json({ error: 'Failed to fetch conversation history' });
        }
        res.json({ conversations });
      }
    );
  } catch (error) {
    console.error('Error in history route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /chatbot/conversation/:conversationId
 * Get all messages in a specific conversation
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    db.query(
      `SELECT 
        message_id,
        message_text,
        response_text,
        language,
        sender,
        sent_at
      FROM chatbot_messages
      WHERE conversation_id = ?
      ORDER BY sent_at ASC`,
      [conversationId],
      (err, rows) => {
        if (err) {
          console.error('Error fetching conversation messages:', err);
          return res.status(500).json({ error: 'Failed to fetch messages' });
        }

        // Normalize rows into a sequential messages array for frontend
        const messages = [];
        for (const r of rows) {
          const sender = (r.sender || 'user').toLowerCase();
          if (sender === 'human') {
            messages.push({ sender: 'human', text: r.message_text, sent_at: r.sent_at, language: r.language });
          } else if (sender === 'user') {
            // legacy combined row: user message and bot response in same row
            messages.push({ sender: 'user', text: r.message_text, sent_at: r.sent_at, language: r.language });
            if (r.response_text) {
              messages.push({ sender: 'bot', text: r.response_text, sent_at: r.sent_at, language: r.language });
            }
          } else if (sender === 'bot') {
            messages.push({ sender: 'bot', text: r.response_text || r.message_text, sent_at: r.sent_at, language: r.language });
          } else {
            // fallback
            messages.push({ sender: 'user', text: r.message_text, sent_at: r.sent_at, language: r.language });
            if (r.response_text) messages.push({ sender: 'bot', text: r.response_text, sent_at: r.sent_at, language: r.language });
          }
        }

        res.json({ messages });
      }
    );
  } catch (error) {
    console.error('Error in conversation route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /chatbot/conversation/:conversationId
 * Delete a specific conversation and all its messages
 */
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.query.userId;
    
    // First verify the conversation belongs to the user
    db.query(
      'SELECT user_id FROM chatbot_conversations WHERE conversation_id = ?',
      [conversationId],
      (err, results) => {
        if (err) {
          console.error('Error verifying conversation:', err);
          return res.status(500).json({ error: 'Failed to verify conversation' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
        
        if (results[0].user_id != userId) {
          return res.status(403).json({ error: 'Not authorized to delete this conversation' });
        }
        
        // Delete messages first (foreign key constraint)
        db.query('DELETE FROM chatbot_messages WHERE conversation_id = ?', [conversationId], (err) => {
          if (err) {
            console.error('Error deleting messages:', err);
            return res.status(500).json({ error: 'Failed to delete messages' });
          }
          
          // Then delete conversation
          db.query('DELETE FROM chatbot_conversations WHERE conversation_id = ?', [conversationId], (err) => {
            if (err) {
              console.error('Error deleting conversation:', err);
              return res.status(500).json({ error: 'Failed to delete conversation' });
            }
            
            res.json({ success: true, message: 'Conversation deleted successfully' });
          });
        });
      }
    );
  } catch (error) {
    console.error('Error in delete conversation route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /chatbot/history/:userId
 * Clear all conversation history for a user
 */
router.delete('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all conversation IDs for the user
    db.query(
      'SELECT conversation_id FROM chatbot_conversations WHERE user_id = ?',
      [userId],
      (err, conversations) => {
        if (err) {
          console.error('Error fetching conversations:', err);
          return res.status(500).json({ error: 'Failed to fetch conversations' });
        }
        
        if (conversations.length === 0) {
          return res.json({ success: true, message: 'No conversations to delete', deleted: 0 });
        }
        
        const conversationIds = conversations.map(c => c.conversation_id);
        
        // Delete all messages for these conversations
        db.query(
          'DELETE FROM chatbot_messages WHERE conversation_id IN (?)',
          [conversationIds],
          (err) => {
            if (err) {
              console.error('Error deleting messages:', err);
              return res.status(500).json({ error: 'Failed to delete messages' });
            }
            
            // Delete all conversations
            db.query(
              'DELETE FROM chatbot_conversations WHERE user_id = ?',
              [userId],
              (err) => {
                if (err) {
                  console.error('Error deleting conversations:', err);
                  return res.status(500).json({ error: 'Failed to delete conversations' });
                }
                
                res.json({ 
                  success: true, 
                  message: 'All conversation history cleared', 
                  deleted: conversations.length 
                });
              }
            );
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in clear history route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /chatbot/last-conversation/:userId
 * Get the last conversation for a logged-in user
 */
router.get('/last-conversation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get the last conversation ID for the user
    db.query(
      `SELECT ulc.conversation_id, ulc.last_updated_at, c.started_at
       FROM user_last_conversation ulc
       JOIN chatbot_conversations c ON ulc.conversation_id = c.conversation_id
       WHERE ulc.user_id = ?
       LIMIT 1`,
      [userId],
      (err, results) => {
        if (err) {
          console.error('Error fetching last conversation:', err);
          return res.status(500).json({ error: 'Failed to fetch last conversation' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'No previous conversation found' });
        }

        const lastConversation = results[0];

        // Now fetch all messages from this conversation
        db.query(
          `SELECT 
            message_id,
            message_text,
            response_text,
            language,
            sender,
            sent_at
           FROM chatbot_messages
           WHERE conversation_id = ?
           ORDER BY sent_at ASC`,
          [lastConversation.conversation_id],
          (err, messages) => {
            if (err) {
              console.error('Error fetching conversation messages:', err);
              return res.status(500).json({ error: 'Failed to fetch messages' });
            }

            // Normalize like the conversation endpoint
            const normalized = [];
            for (const r of messages) {
              const sender = (r.sender || 'user').toLowerCase();
              if (sender === 'human') {
                normalized.push({ sender: 'human', text: r.message_text, sent_at: r.sent_at, language: r.language });
              } else if (sender === 'user') {
                normalized.push({ sender: 'user', text: r.message_text, sent_at: r.sent_at, language: r.language });
                if (r.response_text) normalized.push({ sender: 'bot', text: r.response_text, sent_at: r.sent_at, language: r.language });
              } else if (sender === 'bot') {
                normalized.push({ sender: 'bot', text: r.response_text || r.message_text, sent_at: r.sent_at, language: r.language });
              } else {
                normalized.push({ sender: 'user', text: r.message_text, sent_at: r.sent_at, language: r.language });
                if (r.response_text) normalized.push({ sender: 'bot', text: r.response_text, sent_at: r.sent_at, language: r.language });
              }
            }

            res.json({ 
              conversation_id: lastConversation.conversation_id,
              started_at: lastConversation.started_at,
              last_updated_at: lastConversation.last_updated_at,
              messages: normalized 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in last conversation route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

/**
 * GET /chatbot/flagged
 * Returns a list of flagged messages for moderation
 */
router.get('/flagged', authenticateToken, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    db.query(
      `SELECT m.message_id, m.conversation_id, m.message_text, m.response_text, m.language, m.sender, m.flagged, m.flag_reason, m.sent_at,
              c.claimed_by, c.claimed_at,
              u.username AS claimed_by_username, u.role AS claimed_by_role
       FROM chatbot_messages m
       LEFT JOIN chatbot_conversations c ON c.conversation_id = m.conversation_id
       LEFT JOIN users u ON u.user_id = c.claimed_by
       WHERE m.flagged = 1
       ORDER BY m.sent_at DESC
       LIMIT 200`,
      (err, rows) => {
        if (err) {
          console.error('Error fetching flagged messages:', err);
          return res.status(500).json({ error: 'Failed to fetch flagged messages' });
        }
        res.json({ flagged: rows });
      }
    );
  } catch (error) {
    console.error('Error in flagged route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /chatbot/moderate
 * Mark a flagged message as reviewed / moderated
 * Body: { message_id, moderated_by }
 */
router.post('/moderate', authenticateToken, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const { message_id } = req.body;
    if (!message_id) return res.status(400).json({ error: 'message_id is required' });

    db.query(
      'UPDATE chatbot_messages SET flagged = 0, moderated_by = ?, moderated_at = CURRENT_TIMESTAMP WHERE message_id = ?',
      [req.user.user_id, message_id],
      (err, result) => {
        if (err) {
          console.error('Error moderating message:', err);
          return res.status(500).json({ error: 'Failed to moderate message' });
        }
        try { const io = getIo(); io.emit('chat:moderated', { message_id, conversation_id: req.body.conversation_id || null }); } catch (e) {}
        res.json({ success: true, affectedRows: result.affectedRows });
      }
    );
  } catch (error) {
    console.error('Error in moderate route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/moderation/claim', authenticateToken, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const { conversation_id } = req.body;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    const assignment = await setConversationAssignment(conversation_id, req.user.user_id, req.user.role === 'admin');
    if (!assignment.ok) {
      return res.status(assignment.status || 400).json({ error: assignment.error, assignment: assignment.assignment || null });
    }

    try {
      const io = getIo();
      io.to('moderation').emit('chat:assignment', { conversation_id, assignment: assignment.assignment, action: 'claim' });
    } catch (e) {}

    return res.json({ success: true, assignment: assignment.assignment });
  } catch (error) {
    console.error('Error claiming conversation:', error);
    return res.status(500).json({ error: 'Failed to claim conversation' });
  }
});

router.post('/moderation/release', authenticateToken, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const { conversation_id } = req.body;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }

    const assignment = await releaseConversationAssignment(conversation_id, req.user.user_id, req.user.role === 'admin');
    if (!assignment.ok) {
      return res.status(assignment.status || 400).json({ error: assignment.error, assignment: assignment.assignment || null });
    }

    try {
      const io = getIo();
      io.to('moderation').emit('chat:assignment', { conversation_id, assignment: assignment.assignment, action: 'release' });
    } catch (e) {}

    return res.json({ success: true, assignment: assignment.assignment });
  } catch (error) {
    console.error('Error releasing conversation:', error);
    return res.status(500).json({ error: 'Failed to release conversation' });
  }
});

/**
 * POST /chatbot/human
 * Save a human reply into the conversation (persisted)
 * Request body: { conversation_id, user_id, message, language }
 */
router.post('/human', humanAgentStartLimiter, async (req, res) => {
  try {
    const { conversation_id, user_id, message, language, flagged, flag_reason } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const convId = conversation_id || null;

    const insertHuman = (cid) => {
      try {
        const redacted = redactPII(message.trim());
        const flags = detectFlags(message.trim());
        const shouldFlag = Boolean(flagged) || Boolean(flags);
        const reason = flag_reason || flags || null;

        // Try insert with moderation columns, fallback to legacy insert
        db.query(
          'INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language, sender, flagged, flag_reason) VALUES (?, ?, NULL, ?, ?, ?, ?)',
          [cid, redacted, language || 'en', 'human', shouldFlag ? 1 : 0, reason],
          (err, result) => {
            if (err) {
              // fallback
              db.query(
                'INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language, sender) VALUES (?, ?, NULL, ?, ?)',
                [cid, redacted, language || 'en', 'human'],
                (err2, result2) => {
                  if (err2) {
                    console.error('Error saving human message (fallback):', err2);
                    return res.status(500).json({ error: 'Failed to save message' });
                  }
                  // emit event
                  try { const io = getIo(); io.to(`conv_${cid}`).emit('chat:message', { conversation_id: cid, message: { sender: 'human', text: redacted, sent_at: new Date(), message_id: result2.insertId, language: language || 'en' } }); } catch (e) {}
                  return res.json({ success: true, conversation_id: cid, message_id: result2.insertId, sender: 'human', message: redacted, sent_at: new Date() });
                }
              );
            } else {
              try { const io = getIo(); io.to(`conv_${cid}`).emit('chat:message', { conversation_id: cid, message: { sender: 'human', text: redacted, sent_at: new Date(), message_id: result.insertId, language: language || 'en' } }); } catch (e) {}
              return res.json({ success: true, conversation_id: cid, message_id: result.insertId, sender: 'human', message: redacted, sent_at: new Date() });
            }
          }
        );
      } catch (e) {
        console.error('Error in insertHuman:', e);
        db.query('INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language, sender) VALUES (?, ?, NULL, ?, ?)', [cid, message.trim(), language || 'en', 'human'], (err, result) => {
          if (err) {
            console.error('Error saving human message:', err);
            return res.status(500).json({ error: 'Failed to save message' });
          }
          return res.json({ success: true, conversation_id: cid, message_id: result.insertId, sender: 'human', message: message.trim(), sent_at: new Date() });
        });
      }
    };

    if (convId) {
      insertHuman(convId);
    } else {
      // create conversation
      db.query('INSERT INTO chatbot_conversations (user_id, started_at) VALUES (?, CURRENT_TIMESTAMP)', [user_id || null], (err, result) => {
        if (err) {
          console.error('create conversation error', err);
          return res.status(500).json({ error: 'Failed to create conversation' });
        }
        const newConvId = result.insertId;
        insertHuman(newConvId);
      });
    }
  } catch (error) {
    console.error('Error in human reply route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/staff-reply', authenticateToken, requireRole(...STAFF_ROLES), async (req, res) => {
  try {
    const { conversation_id, message, language, flagged, flag_reason } = req.body;
    if (!conversation_id) {
      return res.status(400).json({ error: 'conversation_id is required' });
    }
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const assignment = await getConversationAssignment(conversation_id);
    if (!assignment) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isOwner = assignment.claimed_by === req.user.user_id;
    const isAdmin = req.user.role === 'admin';

    if (assignment.claimed_by && !isOwner && !isAdmin) {
      return res.status(409).json({
        error: 'Conversation is assigned to another agent',
        assignment
      });
    }

    if (!assignment.claimed_by) {
      await setConversationAssignment(conversation_id, req.user.user_id, isAdmin);
    }

    const result = await persistHumanReply({
      conversationId: conversation_id,
      message,
      language,
      flagged,
      flagReason: flag_reason,
      sender: 'human'
    });

    return res.json({
      success: true,
      conversation_id,
      message_id: result.message_id,
      sender: 'human',
      message: result.message,
      sent_at: result.sent_at,
      assignment: await getConversationAssignment(conversation_id)
    });
  } catch (error) {
    console.error('Error in staff reply route:', error);
    return res.status(500).json({ error: 'Failed to save staff reply' });
  }
});

/**
 * POST /chatbot/agent
 * Save a user message while in human-agent mode and flag it for moderation.
 * Request body: { conversation_id, user_id, message, language }
 */
router.post('/agent', async (req, res) => {
  try {
    const { conversation_id, user_id, message, language } = req.body;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const convId = conversation_id || null;

    const insertAgentMessage = (cid) => {
      try {
        const redacted = redactPII(message.trim());
        const flags = detectFlags(message.trim());
        const flagReason = ['human_agent_chat', flags].filter(Boolean).join(',') || 'human_agent_chat';

        db.query(
          'INSERT INTO chatbot_messages (conversation_id, message_text, response_text, language, sender, flagged, flag_reason) VALUES (?, ?, NULL, ?, ?, ?, ?)',
          [cid, redacted, language || 'en', 'user', 1, flagReason],
          (err, result) => {
            if (err) {
              console.error('Error saving agent-mode message:', err);
              return res.status(500).json({ error: 'Failed to save message' });
            }

            try {
              const io = getIo();
              io.to(`conv_${cid}`).emit('chat:message', {
                conversation_id: cid,
                message: {
                  sender: 'user',
                  text: redacted,
                  sent_at: new Date(),
                  message_id: result.insertId,
                  language: language || 'en'
                }
              });
            } catch (e) {}

            return res.json({
              success: true,
              conversation_id: cid,
              message_id: result.insertId,
              sender: 'user',
              message: redacted,
              sent_at: new Date()
            });
          }
        );
      } catch (e) {
        console.error('Error in insertAgentMessage:', e);
        return res.status(500).json({ error: 'Failed to save message' });
      }
    };

    if (convId) {
      insertAgentMessage(convId);
    } else {
      db.query('INSERT INTO chatbot_conversations (user_id, started_at) VALUES (?, CURRENT_TIMESTAMP)', [user_id || null], (err, result) => {
        if (err) {
          console.error('create conversation error', err);
          return res.status(500).json({ error: 'Failed to create conversation' });
        }
        insertAgentMessage(result.insertId);
      });
    }
  } catch (error) {
    console.error('Error in agent message route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
