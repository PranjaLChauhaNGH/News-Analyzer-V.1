// ✅ FILE: src/components/ChatWindow.jsx
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown'; // Import ReactMarkdown

const ChatWindow = ({ messages, isLoading }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const formatMessageText = (text) => { // Renamed from formatMessageText to parseMarkdown
    // This function is no longer needed as ReactMarkdown handles parsing directly.
    // Keeping it as a placeholder or if specific pre-processing is required.
 return text;
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isLatest = index === messages.length - 1;

    return (
      <div key={index} className={`message-row ${message.role}`}>
        <div className="message-container">
          {!isUser && (
            <div className="message-avatar">
              🤖
            </div>
          )}
          <div className={`message-bubble ${isLatest && !isUser ? 'latest-response' : ''} ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
            {/* Use ReactMarkdown to render the message text */}
            <ReactMarkdown components={{
              // Enhanced link component with accessibility
              a: ({ node, href, children, ...props }) => (
                <a
                  {...props}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="message-link"
                  aria-label={`External link: ${children}`}
                >
                  {children}
                </a>
              ),
              // Custom paragraph component
              p: ({ node, ...props }) => (
                <p {...props} className="message-paragraph" />
              ),
              // Custom strong component
              strong: ({ node, ...props }) => (
                <strong {...props} className="message-strong" />
              ),
              // Custom em component
              em: ({ node, ...props }) => (
                <em {...props} className="message-emphasis" />
              ),
            }}>
              {message.text}
            </ReactMarkdown> {/* Render message.text directly with ReactMarkdown */}
          </div>
          {isUser && (
            <div className="message-avatar user-avatar">
              👤
            </div>
          )}
        </div>
        {!isUser && (
          <div className="message-timestamp">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="chat-window">
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="welcome-icon">🚀</div>
            <h3>Welcome to News Analyzer!</h3>
            <p>Ready to fact-check any news article or image. Start by typing below or uploading an image.</p>
          </div>
        )}
        
        {messages.map((message, index) => renderMessage(message, index))}
        
        {isLoading && (
          <div className="message-row assistant">
            <div className="message-container">
              <div className="message-avatar">
                🤖
              </div>
              <div className="loading-message">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="loading-text">Analyzing content...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
