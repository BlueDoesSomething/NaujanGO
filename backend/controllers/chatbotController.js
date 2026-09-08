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
import { getIo } from '../socket.js';
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INTENTS_DIR = path.resolve(__dirname, '../../MULTILINGUAL_CHATBOT/intents');
const intentsCache = new Map();
const supportedLanguages = ['en', 'es', 'tl', 'zh', 'ja', 'ko', 'fr', 'de'];
const pythonExecutable = process.env.PYTHON_PATH || 'python';
const scriptPath = path.resolve(__dirname, '../../MULTILINGUAL_CHATBOT/scripts/chatbot_multilingual.py');
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

function getIntentFallbackResponse(message, language = 'en') {
  const lang = supportedLanguages.includes(language) ? language : 'en';

  if (isHumanAgentQuestion(message)) {
    return getHumanAgentExplanation(lang);
  }

  const intentsData = loadIntents(lang) || (lang !== 'en' ? loadIntents('en') : null);
  if (!intentsData?.intents) {
    return fallbackDefaults[lang] || fallbackDefaults.en;
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

  if (bestMatch) {
    return bestMatch.responses[0];
  }

  return fallbackDefaults[lang] || fallbackDefaults.en;
}

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

  saveMessageToDB(conversation_id, user_id, message, botResponse, language, (convId) => {
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
