// ✅ FILE: src/components/ChatHistory.jsx
import React, { useState, useEffect } from 'react';

const ChatHistory = ({ onClose }) => {
  const [chatHistory, setChatHistory] = useState([]);
  const [chatStats, setChatStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchChatHistory();
    fetchChatStats();
  }, []);

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://localhost:8000/chat-history?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to fetch chat history');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/chat-history/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatStats(data);
      }
    } catch (error) {
      console.error('Error fetching chat stats:', error);
    }
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    setDeleting(chatId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/chat-history/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove the deleted chat from the list
        setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
        // Refresh stats
        await fetchChatStats();
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to delete chat');
      }
    } catch (error) {
      alert('Network error. Please try again.');
      console.error('Error deleting chat:', error);
    } finally {
      setDeleting(null);
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/chat-history', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory([]);
        await fetchChatStats();
        alert(data.message || 'Chat history cleared successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to clear chat history');
      }
    } catch (error) {
      alert('Network error. Please try again.');
      console.error('Error clearing chat history:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getAnalysisTypeIcon = (type) => {
    return type === 'text' ? '📝' : '📷';
  };

  const getAnalysisTypeLabel = (type) => {
    return type === 'text' ? 'Text Analysis' : 'Image Analysis';
  };

  if (loading) {
    return (
      <div className="chat-history">
        <div className="chat-history-header">
          <h2>📊 Chat History</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close chat history">
            ×
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your chat history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-history">
        <div className="chat-history-header">
          <h2>📊 Chat History</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close chat history">
            ×
          </button>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading History</h3>
          <p>{error}</p>
          <button onClick={fetchChatHistory} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-history">
      <div className="chat-history-header">
        <h2>📊 Chat History</h2>
        <button onClick={onClose} className="close-btn" aria-label="Close chat history">
          ×
        </button>
      </div>

      {chatStats && (
        <div className="chat-stats">
          <h3>📈 Your Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">{chatStats.total_chats}</div>
              <div className="stat-label">Total Chats</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{chatStats.text_analyses}</div>
              <div className="stat-label">Text Analyses</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{chatStats.image_analyses}</div>
              <div className="stat-label">Image Analyses</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{chatStats.recent_chats}</div>
              <div className="stat-label">Recent (30d)</div>
            </div>
          </div>
          
          {chatHistory.length > 0 && (
            <div className="history-actions">
              <button onClick={clearAllHistory} className="clear-all-btn">
                🗑️ Clear All History
              </button>
            </div>
          )}
        </div>
      )}

      <div className="chat-history-content">
        {chatHistory.length === 0 ? (
          <div className="no-history">
            <div className="no-history-icon">💬</div>
            <h3>No Chat History Yet</h3>
            <p>Start analyzing news articles or images to see your conversation history here!</p>
          </div>
        ) : (
          <div className="chat-history-list">
            <h3>💭 Recent Conversations ({chatHistory.length})</h3>
            {chatHistory.map((chat) => (
              <div key={chat.id} className="chat-history-item">
                <div className="chat-item-header">
                  <div className="analysis-info">
                    <span className={`analysis-type ${chat.analysis_type}`}>
                      {getAnalysisTypeIcon(chat.analysis_type)} {getAnalysisTypeLabel(chat.analysis_type)}
                    </span>
                    <span className="chat-date">{formatDate(chat.created_at)}</span>
                  </div>
                  <button 
                    onClick={() => deleteChat(chat.id)}
                    className={`delete-chat-btn ${deleting === chat.id ? 'deleting' : ''}`}
                    disabled={deleting === chat.id}
                    title="Delete this chat"
                    aria-label="Delete chat"
                  >
                    {deleting === chat.id ? '⏳' : '🗑️'}
                  </button>
                </div>
                
                <div className="chat-item-content">
                  <div className="input-section">
                    <div className="section-label">📥 Your Input:</div>
                    <div className="text-content">
                      {truncateText(chat.input_text, 150)}
                    </div>
                  </div>
                  
                  {chat.response_text && (
                    <div className="response-section">
                      <div className="section-label">🤖 AI Response:</div>
                      <div className="text-content">
                        {truncateText(chat.response_text, 150)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistory;
