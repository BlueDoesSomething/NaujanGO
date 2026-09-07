import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { io as ioClient } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import './Chatbot.css';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl } from '../api';

const API_BASE_URL = getApiBaseUrl();

const getApiHeaders = (extra = {}) => {
  let csrf = '';
  try {
    const cookie = document.cookie.split('; ').find((c) => c.startsWith('csrf_token='));
    if (cookie) csrf = decodeURIComponent(cookie.split('=').slice(1).join('='));
  } catch (err) {
    csrf = '';
  }
  return {
    'Content-Type': 'application/json',
    ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    ...extra
  };
};

// Static map of chatbot language codes → Web Speech API BCP-47 tags
const SPEECH_LANG_MAP = {
  tl: 'fil-PH',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
};

// Chatbot-specific translations
const chatbotTexts = {
  en: {
    welcome: 'Hello! How can I assist you today?',
    agent_greeting: 'Hello, I am a human agent. How can I help you today?',
    assistant: 'Naujan Travel Assistant',
    typing: 'Typing...',
    online: 'Online',
    close: 'Close chat',
    placeholder: 'Type your message...',
    suggested: 'Try asking:'
  },
  es: {
    welcome: '¡Hola! ¿Cómo puedo ayudarte hoy?',
    agent_greeting: 'Hola, soy un agente humano. ¿En qué puedo ayudarte hoy?',
    assistant: 'Asistente de Viajes de Naujan',
    typing: 'Escribiendo...',
    online: 'En línea',
    close: 'Cerrar chat',
    placeholder: 'Escribe tu mensaje...',
    suggested: 'Prueba preguntando:'
  },
  tl: {
    welcome: 'Kumusta! Paano kita matutulungan ngayon?',
    agent_greeting: 'Kumusta, ako ang human agent. Paano kita matutulungan ngayon?',
    assistant: 'Naujan Travel Assistant',
    typing: 'Nagtatype...',
    online: 'Online',
    close: 'Isara ang chat',
    placeholder: 'I-type ang iyong mensahe...',
    suggested: 'Subukan mong magtanong:'
  },
  zh: {
    welcome: '你好！我可以如何帮助你？',
    agent_greeting: '你好，我是真人客服。今天我可以怎样帮助你？',
    assistant: 'Naujan 旅行助手',
    typing: '正在输入...',
    online: '在线',
    close: '关闭聊天',
    placeholder: '输入你的消息...',
    suggested: '尝试询问：'
  },
  ja: {
    welcome: 'こんにちは！どのようにお手伝いできますか？',
    agent_greeting: 'こんにちは、私は人間の担当者です。どのようにお手伝いできますか？',
    assistant: 'Naujan トラベルアシスタント',
    typing: '入力中...',
    online: 'オンライン',
    close: 'チャットを閉じる',
    placeholder: 'メッセージを入力してください...',
    suggested: '次のように聞いてみてください：'
  },
  ko: {
    welcome: '안녕하세요! 어떻게 도와드릴까요?',
    agent_greeting: '안녕하세요, 저는 사람 상담원입니다. 어떻게 도와드릴까요?',
    assistant: 'Naujan 여행 도우미',
    typing: '입력 중...',
    online: '온라인',
    close: '채팅 닫기',
    placeholder: '메시지를 입력하세요...',
    suggested: '다음과 같이 물어보세요:'
  },
  fr: {
    welcome: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
    agent_greeting: 'Bonjour, je suis un agent humain. Comment puis-je vous aider aujourd\'hui?',
    assistant: 'Assistant de voyage Naujan',
    typing: 'Saisie...',
    online: 'En ligne',
    close: 'Fermer le chat',
    placeholder: 'Tapez votre message...',
    suggested: 'Essayez de demander:'
  },
  de: {
    welcome: 'Hallo! Wie kann ich Ihnen heute helfen?',
    agent_greeting: 'Hallo, ich bin ein menschlicher Agent. Wie kann ich Ihnen heute helfen?',
    assistant: 'Naujan Reiseassistent',
    typing: 'Tippt...',
    online: 'Online',
    close: 'Chat schließen',
    placeholder: 'Geben Sie Ihre Nachricht ein...',
    suggested: 'Versuchen Sie zu fragen:'
  }
};

const Chatbot = ({ language }) => {
  const { t } = useLanguage();
  const [chatbotLanguage, setChatbotLanguage] = useState(language || 'en');
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [hasManualLanguage, setHasManualLanguage] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => ([
    { sender: 'bot', text: (chatbotTexts[language]?.welcome || chatbotTexts.en.welcome), timestamp: new Date() },
  ]));
  const [conversationId, setConversationId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showModeration, setShowModeration] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const socketRef = useRef(null);
  const lastJoinedRoomRef = useRef(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  // Agent mode: route messages as a human chat conversation
  const [agentMode, setAgentMode] = useState(false);
  const [agentGreetingSent, setAgentGreetingSent] = useState(false);
  const [startingAgentConversation, setStartingAgentConversation] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const inputTextRef = useRef('');
  const interimTextRef = useRef('');
  const startingAgentConversationRef = useRef(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'tl', name: 'Tagalog', flag: '🇵🇭' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  const suggestions = {
    en: [
      "What are the top attractions in Naujan?",
      "Tell me about Naujan Lake",
      "How do I get to Naujan?",
      "What's the best time to visit?",
      "Where should I stay in Naujan?",
      "Tell me about local food and cuisine",
      "What are beach activities available?",
      "Tell me about Mangyan culture",
      "Is there hiking available?",
      "What's the weather like?",
      "How much does a budget trip cost?",
      "Help me plan an itinerary"
    ],
    es: [
      "¿Cuáles son las principales atracciones de Naujan?",
      "Cuéntame sobre el lago Naujan",
      "¿Cómo llego a Naujan?",
      "¿Cuál es la mejor época para visitar?",
      "¿Dónde debo alojarme en Naujan?",
      "Cuéntame sobre la comida local",
      "¿Qué actividades en la playa hay?",
      "Explícame sobre la cultura Mangyan",
      "¿Hay senderismo disponible?",
      "¿Cómo es el clima?",
      "¿Cuánto cuesta un viaje económico?",
      "Ayúdame a planificar un itinerario"
    ],
    tl: [
      "Ano ang mga pangunahing atraksyon sa Naujan?",
      "Sabihin mo tungkol sa Naujan Lake",
      "Paano pumunta sa Naujan?",
      "Kailan ang pinakamainam na panahon?",
      "Saan dapat ako matulog sa Naujan?",
      "Sabihin mo sa akin ang local food",
      "Anong beach activities ang available?",
      "Gallerin mo ang Mangyan culture",
      "May hiking ba dito?",
      "Ano ang weather ngayong panahon?",
      "Magkano ang budget trip?",
      "Tulungan mo akong magplano ng itinerary"
    ],
    zh: [
      "瑙詹有哪些主要景点？",
      "告诉我关于瑙汉湖",
      "如何到达瑙詹？",
      "最佳访问时间是什么时候？",
      "我应该在瑙詹哪里住？",
      "告诉我当地美食",
      "有哪些海滩活动？",
      "介绍一下芒雅人文化",
      "有登山吗？",
      "天气怎么样？",
      "预算旅游要多少钱？",
      "帮我计划行程"
    ],
    ja: [
      "ナウジャンの主要観光地は？",
      "ナウジャン湖について教えて",
      "ナウジャンへの行き方は？",
      "訪問に最適な時期はいつ？",
      "ナウジャンのどこに泊まるべき？",
      "地元の食べ物について教えて",
      "ビーチアクティビティは何がある？",
      "マンヤン文化について教えて",
      "ハイキングはできる？",
      "天気はどう？",
      "予算旅行はいくら？",
      "旅程を計画するのを手伝って"
    ],
    ko: [
      "나우한의 주요 관광지는 무엇입니까?",
      "나우한 호수에 대해 알려주세요",
      "나우한에 어떻게 가나요?",
      "방문하기 가장 좋은 시기는 언제인가요?",
      "나우한에 어디서 묵어야 할까요?",
      "현지 음식에 대해 알려주세요",
      "어떤 해변 활동이 있나요?",
      "망얀 문화에 대해 알려주세요",
      "등산할 수 있나요?",
      "날씨는 어떤가요?",
      "예산 여행은 얼마인가요?",
      "여행 계획을 도와주세요"
    ],
    fr: [
      "Quelles sont les principales attractions de Naujan?",
      "Parlez-moi du lac Naujan",
      "Comment se rendre à Naujan?",
      "Quelle est la meilleure période pour visiter?",
      "Où devrais-je séjourner à Naujan?",
      "Parlez-moi de la cuisine locale",
      "Quelles activités de plage y a-t-il?",
      "Parlez-moi de la culture Mangyan",
      "Y a-t-il de la randonnée?",
      "Quel temps fait-il?",
      "Combien coûte un voyage économique?",
      "Aidez-moi à planifier un itinéraire"
    ],
    de: [
      "Was sind die Hauptattraktionen von Naujan?",
      "Erzählen Sie mir vom Naujan-See",
      "Wie komme ich nach Naujan?",
      "Wann ist die beste Reisezeit?",
      "Wo sollte ich in Naujan übernachten?",
      "Erzählen Sie mir von der lokalen Küche",
      "Welche Strandaktivitäten gibt es?",
      "Erzählen Sie mir von der Mangyan-Kultur",
      "Gibt es Wanderungen?",
      "Wie ist das Wetter?",
      "Wie viel kostet eine Budgetreise?",
      "Helfen Sie mir eine Route zu planen"
    ]
  };

  const quickActions = {
    en: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "View Map", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "Weather", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "Attractions", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "Plan Trip", action: "plan_trip" }
    ],
    es: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "Ver Mapa", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "Clima", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "Atracciones", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "Planear Viaje", action: "plan_trip" }
    ],
    tl: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "Tingnan ang Mapa", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "Panahon", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "Mga Atraksyon", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "Planuhin ang Biyahe", action: "plan_trip" }
    ],
    zh: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "查看地图", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "天气", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "景点", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "计划行程", action: "plan_trip" }
    ],
    ja: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "地図を見る", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "天気", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "観光地", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "旅行を計画", action: "plan_trip" }
    ],
    ko: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "지도 보기", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "날씨", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "관광지", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "여행 계획", action: "plan_trip" }
    ],
    fr: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "Voir la carte", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "Météo", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "Attractions", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "Planifier", action: "plan_trip" }
    ],
    de: [
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>, text: "Karte ansehen", action: "show_map" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>, text: "Wetter", action: "weather" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, text: "Sehenswürdigkeiten", action: "attractions" },
      { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>, text: "Reise planen", action: "plan_trip" }
    ]
  };

  const currentSuggestions = suggestions[chatbotLanguage] || suggestions.en;
  const hotelQuickAction = {
    en: "Hotels",
    es: "Hoteles",
    tl: "Mga Hotel",
    zh: "酒店",
    ja: "ホテル",
    ko: "호텔",
    fr: "Hotels",
    de: "Hotels"
  };

  const currentQuickActions = [
    ...(quickActions[chatbotLanguage] || quickActions.en),
    {
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11h18v10H3z"></path><path d="M7 11V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v4"></path><line x1="3" y1="16" x2="21" y2="16"></line></svg>,
      text: hotelQuickAction[chatbotLanguage] || hotelQuickAction.en,
      action: "hotels"
    }
  ];

  const getText = (key) => chatbotTexts[chatbotLanguage]?.[key] || chatbotTexts.en[key];

  useEffect(() => {
    if (hasManualLanguage) return;
    if (!language || language === chatbotLanguage) return;
    setChatbotLanguage(language);
    setShowLanguageDropdown(false);
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        const newTexts = chatbotTexts[language] || chatbotTexts.en;
        return [{ ...prev[0], text: newTexts.welcome, timestamp: new Date() }];
      }
      return prev;
    });
  }, [language, chatbotLanguage, chatbotTexts, hasManualLanguage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasNewMessage(false);
      // Load last conversation when opening chatbot if user is logged in
      if (isLoggedIn && user && user.user_id) {
        loadLastConversation();
      }
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputText(suggestion);
    inputTextRef.current = suggestion;
    setShowSuggestions(false);
  };

  const handleQuickAction = (action) => {
    const actionMessages = {
      en: {
        show_map: "Show me the interactive map of Naujan with attractions, hotels, and routes",
        weather: "What's the best time to visit Naujan?",
        attractions: "What are the top tourist attractions in Naujan?",
        plan_trip: "Help me plan a full day trip to Naujan with the map, attractions, food, and hotel options",
        hotels: "Show me budget-friendly hotels and accommodations in Naujan near the main attractions"
      },
      es: {
        show_map: "Muéstrame el mapa interactivo de Naujan con atracciones, hoteles y rutas",
        weather: "¿Cuál es la mejor época para visitar Naujan?",
        attractions: "¿Cuáles son las principales atracciones turísticas de Naujan?",
        plan_trip: "Ayúdame a planificar un viaje completo de un día a Naujan con el mapa, atracciones, comida y hoteles",
        hotels: "Muéstrame hoteles y alojamientos económicos en Naujan cerca de las principales atracciones"
      },
      tl: {
        show_map: "Ipakita sa akin ang interactive na mapa ng Naujan na may attractions, hotel, at ruta",
        weather: "Kailan ang pinakamainam na panahon para bumisita sa Naujan?",
        attractions: "Ano ang mga nangungunang tourist attraction sa Naujan?",
        plan_trip: "Tulungan mo akong magplano ng kumpletong isang araw na biyahe sa Naujan kasama ang mapa, attractions, pagkain, at hotel",
        hotels: "Ipakita ang mga budget-friendly na hotel at accommodation sa Naujan malapit sa mga pangunahing attractions"
      },
      zh: {
        show_map: "给我看瑙汉的互动地图，包括景点、酒店和路线",
        weather: "访问瑙詹最好的时间是什么时候？",
        attractions: "瑙詹的主要旅游景点有哪些？",
        plan_trip: "帮我计划瑙詹完整的一日游，包含地图、景点、美食和酒店选项",
        hotels: "给我看瑙詹靠近主要景点的经济型酒店和住宿"
      },
      ja: {
        show_map: "ナウハンの観光地、ホテル、ルートが見えるインタラクティブマップを見せて",
        weather: "ナウジャンを訪れるのに最適な時期は？",
        attractions: "ナウジャンの主要観光地は？",
        plan_trip: "ナウジャンの地図、観光地、食事、ホテルを含む1日旅行の計画を手伝って",
        hotels: "主要観光地の近くにあるナウジャンの手頃なホテルや宿泊施設を見せて"
      },
      ko: {
        show_map: "나우한의 관광지, 호텔, 경로가 보이는 인터랙티브 지도를 보여주세요",
        weather: "나우한을 방문하기 가장 좋은 시기는 언제인가요?",
        attractions: "나우한의 주요 관광 명소는 무엇입니까?",
        plan_trip: "나우한의 지도, 관광지, 음식, 호텔 옵션을 포함한 하루 여행 계획을 도와주세요",
        hotels: "주요 관광지 근처의 저렴한 나우한 호텔과 숙박 시설을 보여주세요"
      },
      fr: {
        show_map: "Montrez-moi la carte interactive de Naujan avec les attractions, hôtels et itinéraires",
        weather: "Quelle est la meilleure période pour visiter Naujan?",
        attractions: "Quelles sont les principales attractions touristiques de Naujan?",
        plan_trip: "Aidez-moi à planifier une excursion complète d'une journée à Naujan avec la carte, les attractions, la nourriture et les hôtels",
        hotels: "Montrez-moi des hôtels et hébergements abordables à Naujan près des principales attractions"
      },
      de: {
        show_map: "Zeig mir die interaktive Karte von Naujan mit Sehenswürdigkeiten, Hotels und Routen",
        weather: "Wann ist die beste Reisezeit für Naujan?",
        attractions: "Was sind die wichtigsten Touristenattraktionen in Naujan?",
        plan_trip: "Hilf mir, einen kompletten Tagesausflug nach Naujan mit Karte, Sehenswürdigkeiten, Essen und Hoteloptionen zu planen",
        hotels: "Zeig mir günstige Hotels und Unterkünfte in Naujan in der Nähe der wichtigsten Sehenswürdigkeiten"
      }
    };

    // Map quick actions to their navigation targets
    const navigationMap = {
      show_map: '/map',
      plan_trip: '/itinerary',
      hotels: '/hotels'
    };

    const langMessages = actionMessages[chatbotLanguage] || actionMessages.en;
    const message = langMessages[action];
    
    if (message && !isTyping) {
      // Send the message to the chatbot
      sendMessage(message);
      setShowSuggestions(false);
      
      // Navigate to the corresponding page if it's a primary action button
      if (navigationMap[action]) {
        // Add a small delay so the message appears in the chat first
        setTimeout(() => {
          navigate(navigationMap[action]);
        }, 300);
      }
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    inputTextRef.current = val;
    if (voiceError) setVoiceError('');
  };

  const stopVoiceRecognition = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
    interimTextRef.current = '';
  }, []);

  // Stop recognition on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const toggleVoiceRecognition = useCallback(async () => {
    if (isListeningRef.current) {
      // Capture accumulated text before stopping
      const textToSend = (inputTextRef.current + ' ' + interimTextRef.current).trim();
      stopVoiceRecognition();
      // Auto-send if there's accumulated voice text
      if (textToSend) {
        inputTextRef.current = '';
        sendMessage(textToSend);
      }
      return;
    }

    setVoiceError('');

    // Check browser support
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setVoiceError('Voice recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    // Request mic permission then immediately release the stream so
    // the Web Speech API can claim the microphone itself
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch {
      setVoiceError('Microphone access denied. Please allow it in your browser settings.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = SPEECH_LANG_MAP[chatbotLanguage] || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setVoiceError('');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setInputText(prev => {
          const newVal = (prev + ' ' + finalTranscript).trim();
          inputTextRef.current = newVal;
          return newVal;
        });
        setInterimText('');
        interimTextRef.current = '';
      } else {
        setInterimText(interimTranscript);
        interimTextRef.current = interimTranscript;
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setVoiceError('Microphone access denied. Check your browser permissions.');
        stopVoiceRecognition();
      } else if (event.error === 'audio-capture') {
        setVoiceError('Microphone is busy or unavailable. Close other apps using the mic and try again.');
        stopVoiceRecognition();
      } else if (event.error === 'network') {
        setVoiceError('Network error. Voice recognition requires an internet connection.');
        stopVoiceRecognition();
      } else if (event.error === 'no-speech') {
        // non-fatal — keep listening
      } else if (event.error !== 'aborted') {
        setVoiceError(`Voice error: ${event.error}`);
        stopVoiceRecognition();
      }
    };

    recognition.onend = () => {
      // Auto-restart while still in listening mode.
      // Must create a NEW instance — Chrome cannot restart a stopped SpeechRecognition.
      if (isListeningRef.current) {
        try {
          const SpeechRecognitionAPI2 = window.SpeechRecognition || window.webkitSpeechRecognition;
          const newRec = new SpeechRecognitionAPI2();
          newRec.lang = recognition.lang;
          newRec.continuous = true;
          newRec.interimResults = true;
          newRec.maxAlternatives = 1;
          newRec.onstart = recognition.onstart;
          newRec.onresult = recognition.onresult;
          newRec.onerror = recognition.onerror;
          newRec.onend = recognition.onend;
          recognitionRef.current = newRec;
          newRec.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
          setInterimText('');
          interimTextRef.current = '';
        }
      } else {
        setIsListening(false);
        setInterimText('');
        interimTextRef.current = '';
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setVoiceError('Could not start voice recognition. Please try again.');
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [chatbotLanguage, stopVoiceRecognition]);

  // Load conversation history
  const loadConversationHistory = async () => {
    if (!isLoggedIn || !user) {
      return;
    }

    setLoadingHistory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/history/${user.user_id}?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setConversationHistory(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load flagged messages for moderation (admin only)
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [moderationReplyDraft, setModerationReplyDraft] = useState('');
  const [activeModerationReplyId, setActiveModerationReplyId] = useState(null);
  const loadFlaggedMessages = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/chatbot/flagged`);
      if (resp.ok) {
        const data = await resp.json();
        setFlaggedMessages(data.flagged || []);
      }
    } catch (e) {
      console.error('Failed to load flagged messages', e);
    }
  };

  // Load last conversation for logged-in users
  const loadLastConversation = async () => {
    if (!isLoggedIn || !user || !user.user_id) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/last-conversation/${user.user_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          // Backend returns normalized messages with sender and text
          const loadedMessages = mapMessagesForDisplay(data.messages);
          setMessages(loadedMessages);
          setConversationId(data.conversation_id);
          setShowSuggestions(false);
        }
      } else if (response.status === 404) {
        // No previous conversation found, start fresh
        console.log('No previous conversation found');
      }
    } catch (error) {
      console.error('Failed to load last conversation:', error);
    }
  };

  const mapMessagesForDisplay = (sourceMessages = []) => {
    const hasHumanMessage = sourceMessages.some((m) => (m.sender || 'user').toLowerCase() === 'human');

    return sourceMessages.map((m) => {
      const sender = (m.sender || 'user').toLowerCase();

      return {
        sender,
        text: m.text || m.message_text || m.response_text,
        timestamp: new Date(m.sent_at || Date.now()),
        language: m.language,
        message_id: m.message_id,
        isAgentConversation: hasHumanMessage,
        deliveryStatus: sender === 'user' && hasHumanMessage ? 'seen' : undefined
      };
    });
  };

  const markUserMessagesSeen = () => {
    setMessages((prev) => prev.map((msg) => (
      msg.isAgentConversation && msg.sender === 'user' && msg.deliveryStatus !== 'seen'
        ? { ...msg, deliveryStatus: 'seen' }
        : msg
    )));
  };

  // Initialize socket connection for live updates
  useEffect(() => {
    if (!API_BASE_URL) return;
    const socket = ioClient(API_BASE_URL.replace(/\/api$/,'') || API_BASE_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (conversationId) {
        socket.emit('join', `conv_${conversationId}`);
        lastJoinedRoomRef.current = `conv_${conversationId}`;
      }
      if (isLoggedIn && user?.role === 'admin') {
        socket.emit('join', 'moderation');
      }
    });

    socket.on('chat:message', (payload) => {
      try {
        if (!payload || !payload.conversation_id) return;
        // If this message belongs to the current conversation, append it
        if (payload.conversation_id === conversationId) {
          const m = payload.message || {};
          setMessages((prev) => {
            // avoid duplicate: if last message matches text+sender, skip
            const last = prev[prev.length - 1];
            if (last && last.sender === m.sender && last.text === m.text) return prev;
            const sender = (m.sender || 'user').toLowerCase();
            return [...prev, {
              sender,
              text: m.text || m.response_text || '',
              timestamp: new Date(m.sent_at || Date.now()),
              message_id: m.message_id,
              language: m.language,
              isAgentConversation: sender === 'human' || prev.some((message) => message.isAgentConversation),
              deliveryStatus: sender === 'user' ? 'seen' : undefined
            }];
          });
          if ((m.sender || '').toLowerCase() === 'human') {
            markUserMessagesSeen();
          }
        }
      } catch (e) { console.error(e); }
    });

    socket.on('chat:moderated', (payload) => {
      // If moderation affects current conversation, refresh
      if (payload && payload.conversation_id && payload.conversation_id === conversationId) {
        loadConversation(conversationId);
      } else {
        // otherwise refresh flagged list if open
        if (showModeration) loadFlaggedMessages();
      }
    });

    return () => {
      try { socket.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [conversationId, showModeration, isLoggedIn, user]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const nextRoom = conversationId ? `conv_${conversationId}` : null;
    const previousRoom = lastJoinedRoomRef.current;

    if (previousRoom && previousRoom !== nextRoom) {
      socket.emit('leave', previousRoom);
    }
    if (nextRoom) {
      socket.emit('join', nextRoom);
      lastJoinedRoomRef.current = nextRoom;
    } else {
      lastJoinedRoomRef.current = null;
    }
  }, [conversationId]);

  // Load a specific conversation
  const loadConversation = async (convId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/conversation/${convId}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages = mapMessagesForDisplay(data.messages);
        setMessages(loadedMessages);
        setConversationId(convId);
        setShowHistory(false);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  // Delete a specific conversation
  const deleteConversation = async (convId) => {
    if (!window.confirm(t('confirm_delete_conversation'))) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/conversation/${convId}?userId=${user.user_id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadConversationHistory();
        if (conversationId === convId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Clear all history
  const clearAllHistory = async () => {
    if (!window.confirm(t('confirm_clear_history'))) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/history/${user.user_id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setConversationHistory([]);
        startNewConversation();
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  // Start a new conversation
  const startNewConversation = () => {
    setMessages([{ sender: 'bot', text: getText('welcome'), timestamp: new Date() }]);
    setConversationId(null);
    setShowSuggestions(true);
    setShowHistory(false);
    setAgentMode(false);
    setAgentGreetingSent(false);
  };

  const startAgentConversation = async () => {
    if (agentMode || startingAgentConversationRef.current) return;

    const greeting = getText('agent_greeting') || 'Hello, I am a human agent. How can I help you today?';

    startingAgentConversationRef.current = true;
    setStartingAgentConversation(true);
    setAgentMode(true);
    setAgentGreetingSent(false);
    setShowSuggestions(false);
    setConversationId(null);
    setMessages([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot/human`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          conversation_id: null,
          user_id: isLoggedIn && user ? user.user_id : null,
          message: greeting,
          language: chatbotLanguage,
          flagged: true,
          flag_reason: 'agent_greeting'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start agent conversation');
      }

      const data = await response.json();
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      setAgentGreetingSent(true);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === 'human' && last.text === greeting) {
          return prev;
        }
        return [...prev, { sender: 'human', text: greeting, timestamp: new Date(), isGreeting: true, isAgentConversation: true }];
      });
    } catch (error) {
      console.error('Failed to start agent conversation:', error);
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: 'A human agent conversation could not be started right now. Please try again.',
        timestamp: new Date(),
        isError: true
      }]);
      setAgentMode(false);
    }
    finally {
      startingAgentConversationRef.current = false;
      setStartingAgentConversation(false);
    }
  };

  const sendMessage = async (messageText) => {
    if (!messageText || isTyping) return;

    if (agentMode) {
      const humanText = messageText.trim();
      const localMessageId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setMessages((prev) => [...prev, { sender: 'user', text: humanText, timestamp: new Date(), message_id: localMessageId, isAgentConversation: true, deliveryStatus: 'sent' }]);
      setInputText('');
      inputTextRef.current = '';
      setShowSuggestions(false);

      try {
        const response = await fetch(`${API_BASE_URL}/api/chatbot/agent`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            conversation_id: conversationId,
            user_id: isLoggedIn && user ? user.user_id : null,
            message: humanText,
            language: chatbotLanguage
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
        setMessages((prev) => prev.map((msg) => (
          msg.message_id === localMessageId && msg.deliveryStatus !== 'seen'
            ? { ...msg, deliveryStatus: 'delivered' }
            : msg
        )));
        if (!isOpen) {
          setHasNewMessage(true);
        }
      } catch (error) {
        console.error('Human chat error:', error);
        setMessages((prev) => [...prev, {
          sender: 'bot',
          text: 'Unable to send to the human agent right now. Please try again.',
          timestamp: new Date(),
          isError: true
        }]);
      }

      return;
    }

    const userMessage = messageText.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMessage, timestamp: new Date() }]);
    setInputText('');
    inputTextRef.current = '';
    setShowSuggestions(false);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ 
          message: userMessage, 
          conversation_id: conversationId, 
          language: chatbotLanguage,
          user_id: isLoggedIn && user ? user.user_id : null,
          user_name: isLoggedIn && user ? user.username : 'Guest'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setIsTyping(false);
        if (data.response) {
          const responseMessage = {
            sender: 'bot',
            text: data.response,
            timestamp: new Date()
          };
          
          // Add indicator if running in fallback mode
          if (data.fallback_mode) {
            responseMessage.isFallback = true;
          }
          
          setMessages((prev) => [...prev, responseMessage]);
          if (data.conversation_id) {
            setConversationId(data.conversation_id);
          }
          if (!isOpen) {
            setHasNewMessage(true);
          }
        }
      }, 200);
    } catch (error) {
      console.error('Chatbot error:', error);
      setIsTyping(false);
      
      // Better error messages based on error type
      let errorMessage = t('chatbot_error') || 'Sorry, I am having trouble responding right now.';
      
      if (error.message.includes('504') || error.message.includes('timeout')) {
        errorMessage = t('chatbot_timeout') || "I'm taking a bit longer than usual. Our AI assistant is currently busy, but I can still help with basic questions! Try asking about Naujan's location, weather, or attractions.";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = t('chatbot_offline') || 'Unable to connect to the chatbot service. Please check your internet connection and try again.';
      }
      
      setMessages((prev) => [...prev, { 
        sender: 'bot', 
        text: errorMessage,
        timestamp: new Date(),
        isError: true
      }]);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendAsHuman = () => {
    const text = inputText.trim();
    if (!text) return;
    // Persist human message to backend
    (async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/chatbot/human`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({ conversation_id: conversationId, user_id: isLoggedIn && user ? user.user_id : null, message: text, language: chatbotLanguage })
        });
        if (!resp.ok) throw new Error('Failed to save human message');
        const data = await resp.json();
        // Note: UI will be updated via socket event; clear input and reset state
        // Avoid double-appending by not inserting locally here
        setInputText('');
        inputTextRef.current = '';
        // keep conversation id if returned
        if (data.conversation_id) setConversationId(data.conversation_id);
      } catch (err) {
        console.error('Failed to send human reply:', err);
      }
    })();
  };

  const clearChat = () => {
    setMessages([{ sender: 'bot', text: getText('welcome'), timestamp: new Date() }]);
    setConversationId(null);
    setShowSuggestions(true);
  };

  if (!isOpen) {
    return (
      <div className="chatbot-widget-wrapper">
        {hasNewMessage && <div className="notification-badge"></div>}
        <button className="chatbot-widget" onClick={toggleChatbot} aria-label="Open chat">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>
    );
  }

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <div className="header-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <div className="header-title">{getText('assistant')}</div>
            <div className="header-status">{isTyping ? getText('typing') : getText('online')}</div>
          </div>
        </div>
        <div className="header-actions">
          <div className="language-selector-container">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              aria-label="Select language"
              className="chatbot-action-button language-btn"
              title="Change language"
            >
              {languages.find((l) => l.code === chatbotLanguage)?.flag || '🌐'}
            </button>
            {showLanguageDropdown && (
              <div className="language-dropdown">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${chatbotLanguage === lang.code ? 'active' : ''}`}
                    onClick={() => {
                      setHasManualLanguage(true);
                      setChatbotLanguage(lang.code);
                      setShowLanguageDropdown(false);
                      setShowSuggestions(true);
                      const newTexts = chatbotTexts[lang.code] || chatbotTexts.en;
                      setMessages([{ sender: 'bot', text: newTexts.welcome, timestamp: new Date() }]);
                    }}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-name">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {isLoggedIn && (
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory) loadConversationHistory();
              }}
              aria-label="Conversation history"
              className="chatbot-action-button"
              title="View conversation history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </button>
          )}
          {isLoggedIn && (
            <button
              onClick={() => {
                if (startingAgentConversation) {
                  return;
                }
                if (agentMode) {
                  setAgentMode(false);
                  setAgentGreetingSent(false);
                } else {
                  startAgentConversation();
                }
              }}
              aria-pressed={agentMode}
              className={`chatbot-action-button ${(agentMode || startingAgentConversation) ? 'active' : ''}`}
              title={startingAgentConversation ? 'Starting human agent chat...' : (agentMode ? 'Disable agent chat' : 'Switch to human agent chat')}
              aria-label={startingAgentConversation ? 'Starting human agent chat' : (agentMode ? 'Human agent chat enabled' : 'Human agent chat disabled')}
              disabled={startingAgentConversation}
            >
              <span className="agent-human-logo" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 21v-2a4 4 0 0 1 4-4h0" />
                  <circle cx="8" cy="7" r="3" />
                  <rect x="13" y="6" width="6" height="6" rx="1" />
                  <path d="M16 12v2" />
                  <path d="M13 9h6" />
                </svg>
                <span className={`demo-dot ${(agentMode || startingAgentConversation) ? 'on' : 'off'}`} style={{ width: 12, height: 12, borderRadius: 12, display: 'inline-block', background: (agentMode || startingAgentConversation) ? '#22c55e' : '#9ca3af' }} />
              </span>
            </button>
          )}
          {isLoggedIn && user && user.role === 'admin' && (
            <button
              onClick={() => setShowModeration((v) => !v)}
              className="chatbot-action-button"
              title="Open moderation panel"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <circle cx="18" cy="6" r="3"></circle>
              </svg>
            </button>
          )}
          <button onClick={startNewConversation} aria-label={t('chatbot_new_conversation')} className="chatbot-action-button" title={t('chatbot_new_conversation')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button onClick={clearChat} aria-label={t('chatbot_clear_chat')} className="chatbot-action-button" title={t('chatbot_clear_chat')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button onClick={toggleChatbot} aria-label={getText('close')} className="chatbot-close-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Conversation History Panel */}
      {showHistory && isLoggedIn && (
        <div className="chatbot-history-panel">
          <div className="history-header">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', marginRight: '8px'}}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              Conversation History
            </h3>
            {conversationHistory.length > 0 && (
              <button onClick={clearAllHistory} className="clear-all-btn" title={t('chatbot_clear_all_history')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Clear All
              </button>
            )}
          </div>
          {loadingHistory ? (
            <div className="history-loading">Loading...</div>
          ) : conversationHistory.length === 0 ? (
            <div className="history-empty">No conversation history yet</div>
          ) : (
            <div className="history-list">
              {conversationHistory.map((conv) => (
                <div key={conv.conversation_id} className={`history-item ${conv.has_human_message ? 'history-item--agent' : 'history-item--ai'}`}>
                  <div className="history-item-header" onClick={() => loadConversation(conv.conversation_id)}>
                    <div className="history-item-info">
                      <div className={`history-source-badge ${conv.has_human_message ? 'history-source-badge--agent' : 'history-source-badge--ai'}`}>
                        {conv.has_human_message ? 'Agent' : 'AI Chatbot'}
                      </div>
                      <div className="history-date">
                        {new Date(conv.started_at).toLocaleDateString()} {new Date(conv.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <div className="history-count">{conv.message_count} messages</div>
                    </div>
                    <button 
                      className="history-delete-btn" 
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.conversation_id); }}
                      title={t('chatbot_delete_conversation')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Moderation Panel (Admin) */}
      {showModeration && user && user.role === 'admin' && (
        <div className="chatbot-moderation-panel">
          <div className="moderation-header">
            <h3>Flagged Messages</h3>
            <div>
              <button onClick={loadFlaggedMessages} className="chatbot-action-button" title="Refresh">Refresh</button>
              <button onClick={() => setShowModeration(false)} className="chatbot-action-button">Close</button>
            </div>
          </div>
          <div className="moderation-list">
            {flaggedMessages.length === 0 ? (
              <div className="moderation-empty">No flagged messages</div>
            ) : (
              flaggedMessages.map((m) => (
                <div key={m.message_id} className="moderation-item">
                  <div className="moderation-meta">Conv #{m.conversation_id} • {new Date(m.sent_at).toLocaleString()}</div>
                  <div className="moderation-text">{m.message_text}</div>
                  <div className="moderation-actions">
                    <button onClick={() => {
                      setActiveModerationReplyId((current) => current === m.message_id ? null : m.message_id);
                      setModerationReplyDraft('');
                    }}>Reply</button>
                    <button onClick={async () => {
                      try {
                        const r = await fetch(`${API_BASE_URL}/api/chatbot/moderate`, { method: 'POST', headers: getApiHeaders(), body: JSON.stringify({ message_id: m.message_id, moderated_by: user.user_id }) });
                        if (!r.ok) throw new Error('Failed');
                        await loadFlaggedMessages();
                      } catch (err) { console.error(err); alert('Failed to mark reviewed'); }
                    }}>Mark Reviewed</button>
                    <button onClick={() => loadConversation(m.conversation_id)}>Open Conversation</button>
                  </div>
                  {activeModerationReplyId === m.message_id && (
                    <div className="moderation-reply-box">
                      <textarea
                        className="moderation-reply-input"
                        rows={3}
                        placeholder="Type the human reply here..."
                        value={moderationReplyDraft}
                        onChange={(e) => setModerationReplyDraft(e.target.value)}
                      />
                      <div className="moderation-reply-actions">
                        <button
                          className="moderation-reply-send"
                          disabled={!moderationReplyDraft.trim()}
                          onClick={async () => {
                            const reply = moderationReplyDraft.trim();
                            if (!reply) return;
                            try {
                              const r = await fetch(`${API_BASE_URL}/api/chatbot/human`, {
                                method: 'POST',
                                headers: getApiHeaders(),
                                body: JSON.stringify({ conversation_id: m.conversation_id, user_id: user.user_id, message: reply, language: m.language || chatbotLanguage })
                              });
                              if (!r.ok) throw new Error('Failed to send human reply');
                              await fetch(`${API_BASE_URL}/api/chatbot/moderate`, {
                                method: 'POST',
                                headers: getApiHeaders(),
                                body: JSON.stringify({ message_id: m.message_id, moderated_by: user.user_id, conversation_id: m.conversation_id })
                              });
                              setModerationReplyDraft('');
                              setActiveModerationReplyId(null);
                              await loadFlaggedMessages();
                              if (conversationId === m.conversation_id) {
                                await loadConversation(m.conversation_id);
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Failed to send reply');
                            }
                          }}
                        >
                          Send Reply
                        </button>
                        <button className="moderation-reply-cancel" onClick={() => { setModerationReplyDraft(''); setActiveModerationReplyId(null); }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className={`chatbot-messages ${showHistory ? 'chatbot-messages--hidden' : ''}`}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`chatbot-message-wrapper ${msg.sender} ${msg.sender === 'human' ? 'chatbot-message-wrapper--human' : ''}`}>
            <div className={`chatbot-message-row ${msg.sender === 'human' ? 'chatbot-message-row--human' : ''}`}>
              {msg.sender === 'human' && (
                <div className="chatbot-avatar chatbot-avatar--human" aria-hidden="true" title="Agent">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              )}
              <div className={`chatbot-message-content ${msg.sender === 'user' ? 'chatbot-message-content--user' : ''}`}>
                <div className={`chatbot-message ${msg.sender} ${msg.isFallback ? 'fallback' : ''} ${msg.isError ? 'error' : ''}`}>
                  {typeof msg.text === 'object' && msg.text.text ? (
                    <>
                      <div>{msg.text.text}</div>
                      {msg.text.actions && msg.text.actions.length > 0 && (
                        <div className="message-actions">
                          {msg.text.actions.map((action, aIdx) => (
                            <button
                              key={aIdx}
                              className="message-action-btn"
                              onClick={() => handleQuickAction(action.action)}
                              title={action.text}
                            >
                              <span className="action-emoji">{action.icon}</span>
                              <span>{action.text}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    msg.text
                  )}
                </div>
                <div className={`message-meta ${msg.sender === 'user' ? 'message-meta--user' : ''}`}>
                  <div className="message-timestamp">{formatTime(msg.timestamp)}</div>
                  {msg.isAgentConversation && msg.sender === 'user' && msg.deliveryStatus && (
                    <div className={`message-status message-status--${msg.deliveryStatus}`}>
                      {msg.deliveryStatus === 'sent' && 'Sent'}
                      {msg.deliveryStatus === 'delivered' && 'Delivered'}
                      {msg.deliveryStatus === 'seen' && 'Seen'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chatbot-message-wrapper bot">
            <div className="chatbot-message bot typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        {showSuggestions && messages.length <= 1 && !isTyping && (
          <div className="chatbot-suggestions">
            <div className="suggestions-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: 'inline', marginRight: '6px'}}>
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              {getText('suggested')}
            </div>
            <div className="suggestions-grid">
              {currentSuggestions.map((suggestion, idx) => (
                <button 
                  key={idx} 
                  className="suggestion-chip"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={`quick-actions-bar ${showHistory ? 'quick-actions-bar--hidden' : ''}`}>
        {currentQuickActions.map((action, idx) => (
          <button
            key={idx}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action.action)}
            disabled={isTyping}
            title={action.text}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-text">{action.text}</span>
          </button>
        ))}
      </div>
      <div className="chatbot-input-area">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={isListening ? (interimText || t('chatbot_listening')) : getText('placeholder')}
          rows={2}
          disabled={isTyping}
        />
        <button 
          onClick={toggleVoiceRecognition}
          className={`voice-button ${isListening ? 'listening' : ''}`}
          aria-label={t('chatbot_voice_input')}
          disabled={isTyping}
          title={isListening ? t('chatbot_stop_recording_title') : t('chatbot_start_recording')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
        <button 
          onClick={handleSendMessage} 
          className={`send-button ${agentMode ? 'human-send' : ''}`} 
          aria-label={agentMode ? 'Send to human agent' : (t('send_message') || 'Send message')}
          disabled={!inputText.trim() || isTyping}
        >
          {isTyping && !agentMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          ) : agentMode ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16"></path>
              <path d="M13 5l7 7-7 7"></path>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </div>
      {voiceError && (
        <div className="voice-error">
          ⚠️ {voiceError}
        </div>
      )}
      {isListening && (
        <div className="voice-indicator">
          {/* Pulsing mic icon */}
          <div className="voice-mic-badge">
            <div className="voice-mic-ring" />
            <div className="voice-mic-ring voice-mic-ring--2" />
            <div className="voice-mic-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          {/* Sound waves */}
          <div className="voice-waves">
            <span style={{'--i':1}} />
            <span style={{'--i':2}} />
            <span style={{'--i':3}} />
            <span style={{'--i':4}} />
            <span style={{'--i':5}} />
            <span style={{'--i':6}} />
            <span style={{'--i':7}} />
            <span style={{'--i':8}} />
            <span style={{'--i':9}} />
          </div>
          {/* Label + interim text */}
          <div className="voice-indicator__label">
            <span className="voice-indicator__title">Listening</span>
            {interimText && (
              <span className="voice-indicator__interim">{interimText}</span>
            )}
          </div>
          {/* Stop button */}
          <button className="voice-stop-btn" onClick={stopVoiceRecognition} title={t('chatbot_stop_recording')}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
              <rect width="10" height="10" rx="2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
