import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBaseUrl } from '../api';
import { useAuth } from '../context/AuthContext';
import './Moderation.css';

const API_BASE_URL = getApiBaseUrl();

export default function Moderation() {
  const { user, logout } = useAuth();
  const isStaffModerator = user?.role === 'admin' || user?.role === 'agent';
  const isAdmin = user?.role === 'admin';
  const [flagged, setFlagged] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isStaffModerator) return;
    loadFlagged();
  }, [isStaffModerator, user]);

  const loadFlagged = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/chatbot/flagged`, {
        credentials: 'include'
      });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      setFlagged(data.flagged || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = useMemo(() => {
    return flagged.filter((message) => {
      const senderLabel = message.sender === 'human' ? 'agent' : (message.sender || 'user');
      const searchText = `${message.message_text || ''} ${message.flag_reason || ''} ${senderLabel}`.toLowerCase();
      if (query && !searchText.includes(query.toLowerCase())) return false;
      if (filter === 'agent') return message.sender === 'human';
      if (filter === 'user') return message.sender === 'user';
      if (filter === 'bot') return message.sender === 'bot';
      return true;
    });
  }, [flagged, query, filter]);

  const conversations = useMemo(() => {
    const grouped = new Map();

    filteredMessages.forEach((message) => {
      const key = message.conversation_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          conversation_id: key,
          messages: []
        });
      }
      grouped.get(key).messages.push(message);
    });

    return Array.from(grouped.values())
      .map((conversation) => ({
        ...conversation,
        messages: conversation.messages.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at)),
        claimed_by: conversation.messages.find((message) => message.claimed_by !== undefined && message.claimed_by !== null)?.claimed_by || null,
        claimed_at: conversation.messages.find((message) => message.claimed_at)?.claimed_at || null,
        claimed_by_username: conversation.messages.find((message) => message.claimed_by_username)?.claimed_by_username || null,
        claimed_by_role: conversation.messages.find((message) => message.claimed_by_role)?.claimed_by_role || null
      }))
      .sort((a, b) => new Date(b.messages[b.messages.length - 1]?.sent_at || 0) - new Date(a.messages[a.messages.length - 1]?.sent_at || 0));
  }, [filteredMessages]);

  const allConversations = useMemo(() => {
    const grouped = new Set();
    flagged.forEach((message) => grouped.add(message.conversation_id));
    return grouped.size;
  }, [flagged]);

  const selectedConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.conversation_id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const selectedConversationDraft = selectedConversation
    ? (replyDrafts[selectedConversation.conversation_id] || '')
    : '';

  const isConversationOwnedByMe = (conversation) => {
    if (!conversation || !user?.user_id) return false;
    return Number(conversation.claimed_by) === Number(user.user_id);
  };

  const canManageConversation = (conversation) => {
    if (!conversation) return false;
    return isAdmin || isConversationOwnedByMe(conversation);
  };

  const claimConversation = async (conversation) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/chatbot/moderation/claim`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.conversation_id })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to claim conversation');
      }

      await loadFlagged();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Failed to claim conversation');
    }
  };

  const releaseConversation = async (conversation) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/chatbot/moderation/release`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.conversation_id })
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to release conversation');
      }

      await loadFlagged();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Failed to release conversation');
    }
  };

  const sendReply = async (conversation) => {
    const reply = (replyDrafts[conversation.conversation_id] || '').trim();
    if (!reply) return;

    const targetLanguage = conversation.messages[conversation.messages.length - 1]?.language || 'en';
    const canReply = canManageConversation(conversation);

    if (!canReply) {
      alert('Claim the conversation before replying.');
      return;
    }

    try {
      const r = await fetch(`${API_BASE_URL}/api/chatbot/staff-reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversation.conversation_id,
          message: reply,
          language: targetLanguage
        })
      });
      if (!r.ok) throw new Error('Failed');

      const data = await r.json();
      const replyMessage = {
        message_id: data.message_id || `reply-${Date.now()}`,
        conversation_id: conversation.conversation_id,
        message_text: data.message || reply,
        language: targetLanguage,
        sender: 'human',
        isAgentReply: true,
        sent_at: data.sent_at || new Date().toISOString(),
        flag_reason: null,
        claimed_by: data.assignment?.claimed_by ?? conversation.claimed_by ?? user.user_id,
        claimed_by_username: data.assignment?.claimed_by_username ?? conversation.claimed_by_username ?? user.username,
        claimed_by_role: data.assignment?.claimed_by_role ?? conversation.claimed_by_role ?? user.role,
        claimed_at: data.assignment?.claimed_at ?? conversation.claimed_at ?? new Date().toISOString()
      };

      setFlagged((prev) => [...prev, replyMessage]);

      setReplyDrafts((prev) => ({ ...prev, [conversation.conversation_id]: '' }));
    } catch (e) {
      console.error(e);
      alert('Failed to send reply');
    }
  };

  const openConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };

  const closeConversation = () => {
    setSelectedConversationId(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      window.location.href = '/login';
    }
  };

  if (!isStaffModerator) {
    return (
      <div className="moderation-page moderation-page--locked">
        <div className="moderation-hero">
          <div className="moderation-pill">Staff only</div>
          <h1>Moderation Workspace</h1>
          <p>Sign in as an admin or agent to review flagged messages, reply as staff, and mark conversations reviewed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moderation-page">
        
        <section className="moderation-hero">
          {user?.role === 'admin' ? (
            <Link to="/admin" className="back-button">← Back to Dashboard</Link>
          ) : (
            <div className="moderation-workspace-controls">
              <div className="back-button moderation-back-button--readonly">Agent workspace</div>
              <button className="moderation-logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
          <div>
            <div className="moderation-pill">Live moderation</div>
            <h1>Flagged Messages</h1>
            <p>Review flagged messages, respond inline as an agent, and clear items after moderation.</p>
            <div className="moderation-user-card">
              <div className="moderation-user-card__label">Signed in as</div>
              <div className="moderation-user-card__name">{user?.name || user?.username || 'Staff member'}</div>
              <div className="moderation-user-card__role">{user?.role === 'agent' ? 'Agent' : 'Admin'}</div>
            </div>
          </div>
          <div className="moderation-hero-stats">
            <div className="stat-card">
              <span className="stat-label">Flagged</span>
              <strong>{allConversations}</strong>
            </div>
            <div className="stat-card">
              <span className="stat-label">Visible</span>
              <strong>{conversations.length}</strong>
            </div>
          </div>
        </section>

        <section className="moderation-toolbar">
          <input
            className="moderation-search"
            placeholder="Search flagged text or reason"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select className="moderation-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All senders</option>
            <option value="user">User</option>
            <option value="bot">Bot</option>
            <option value="agent">Agent</option>
          </select>
          <button className="moderation-refresh" onClick={loadFlagged} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </section>

        <section className="moderation-grid">
          {conversations.length === 0 ? (
            <div className="moderation-empty-state">
              <h3>No matching flagged messages</h3>
              <p>Try clearing the search or changing the sender filter.</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <article key={conversation.conversation_id} className="moderation-card moderation-card--conversation">
                <div className="moderation-card__top">
                  <div>
                    <div className="moderation-meta">
                      Conv #{conversation.conversation_id} • {conversation.messages.length} message{conversation.messages.length === 1 ? '' : 's'}
                    </div>
                    <div className="moderation-conversation-label">Agent conversation</div>
                    <div className="moderation-assignment-badge">
                      {conversation.claimed_by
                        ? `Assigned to ${conversation.claimed_by_username || `#${conversation.claimed_by}`}`
                        : 'Unassigned'}
                    </div>
                  </div>
                </div>

                <div className="moderation-thread">
                  {conversation.messages.map((message) => {
                    const senderLabel = message.sender === 'human' ? 'agent' : (message.sender || 'user');
                    return (
                      <div key={message.message_id} className={`moderation-thread__item ${message.isAgentReply ? 'moderation-thread__item--agent-reply' : ''}`}>
                        <div className="moderation-thread__meta">
                          <div className={`sender-badge sender-badge--${message.sender || 'user'}`}>{senderLabel}</div>
                          <div className="moderation-thread__time">{new Date(message.sent_at).toLocaleString()}</div>
                        </div>

                        <div className="moderation-message">{message.message_text}</div>

                        {message.flag_reason && (
                          <div className="flag-reasons">
                            {message.flag_reason.split(',').map((reason) => (
                              <span key={reason} className="flag-chip">{reason.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="moderation-actions">
                  {!conversation.claimed_by && (
                    <button className="ghost-button" onClick={() => claimConversation(conversation)}>
                      Claim
                    </button>
                  )}
                  {conversation.claimed_by && isConversationOwnedByMe(conversation) && (
                    <button className="ghost-button" onClick={() => releaseConversation(conversation)}>
                      Release
                    </button>
                  )}
                  {conversation.claimed_by && !isConversationOwnedByMe(conversation) && isAdmin && (
                    <button className="ghost-button" onClick={() => claimConversation(conversation)}>
                      Take Over
                    </button>
                  )}
                  <button
                    className="primary-button"
                    onClick={async () => {
                      if (!canManageConversation(conversation)) {
                        alert('Claim the conversation before marking it reviewed.');
                        return;
                      }
                      try {
                        await Promise.all(
                          conversation.messages.map((message) => fetch(`${API_BASE_URL}/api/chatbot/moderate`, {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              message_id: message.message_id,
                              conversation_id: conversation.conversation_id
                            })
                          }).then((response) => {
                            if (!response.ok) throw new Error('Failed');
                          }))
                        );
                        await loadFlagged();
                      } catch (e) {
                        console.error(e);
                        alert('Failed to mark reviewed');
                      }
                    }}
                  >
                    Mark Reviewed
                  </button>
                  <button className="ghost-button" onClick={() => openConversation(conversation.conversation_id)}>
                    View in Conversation
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        {selectedConversation && (
          <div className="moderation-modal-backdrop" onClick={closeConversation} role="presentation">
            <div
              className="moderation-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="moderation-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="moderation-modal__header">
                <div>
                  <div className="moderation-conversation-label">Agent chat</div>
                  <h2 id="moderation-modal-title">Conversation #{selectedConversation.conversation_id}</h2>
                  <p>Keep the chat here and reply inline as the agent.</p>
                  <div className="moderation-assignment-badge">
                    {selectedConversation.claimed_by
                      ? `Assigned to ${selectedConversation.claimed_by_username || `#${selectedConversation.claimed_by}`}`
                      : 'Unassigned'}
                  </div>
                </div>
                <button className="moderation-modal__close" onClick={closeConversation} aria-label="Close chat modal">✕</button>
              </div>

              <div className="moderation-modal__body">
                <div className="moderation-thread moderation-thread--modal">
                  {selectedConversation.messages.map((message) => {
                    const senderLabel = message.sender === 'human' ? 'agent' : (message.sender || 'user');
                    return (
                      <div key={message.message_id} className="moderation-thread__item">
                        <div className="moderation-thread__meta">
                          <div className={`sender-badge sender-badge--${message.sender || 'user'}`}>{senderLabel}</div>
                          <div className="moderation-thread__time">{new Date(message.sent_at).toLocaleString()}</div>
                        </div>
                        <div className="moderation-message">{message.message_text}</div>
                        {message.flag_reason && (
                          <div className="flag-reasons">
                            {message.flag_reason.split(',').map((reason) => (
                              <span key={reason} className="flag-chip">{reason.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="moderation-modal__footer">
                {!isConversationOwnedByMe(selectedConversation) && !isAdmin && (
                  <div className="moderation-assignment-hint">
                    Claim this conversation before replying.
                  </div>
                )}
                <textarea
                  className="reply-input moderation-modal__input"
                  rows={4}
                  placeholder="Type the agent reply here..."
                  value={selectedConversationDraft}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [selectedConversation.conversation_id]: e.target.value }))}
                  disabled={!canManageConversation(selectedConversation)}
                />
                <div className="reply-actions moderation-modal__actions">
                  {!selectedConversation.claimed_by && (
                    <button className="ghost-button" onClick={() => claimConversation(selectedConversation)}>
                      Claim
                    </button>
                  )}
                  {selectedConversation.claimed_by && isConversationOwnedByMe(selectedConversation) && (
                    <button className="ghost-button" onClick={() => releaseConversation(selectedConversation)}>
                      Release
                    </button>
                  )}
                  {selectedConversation.claimed_by && !isConversationOwnedByMe(selectedConversation) && isAdmin && (
                    <button className="ghost-button" onClick={() => claimConversation(selectedConversation)}>
                      Take Over
                    </button>
                  )}
                  <button className="primary-button" onClick={() => sendReply(selectedConversation)} disabled={!selectedConversationDraft.trim() || !canManageConversation(selectedConversation)}>
                    Send Reply
                  </button>
                  <button className="ghost-button" onClick={closeConversation}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
