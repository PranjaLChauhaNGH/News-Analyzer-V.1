// ✅ FILE: src/components/ChatInput.jsx
import React, { useState, useRef } from 'react';

const ChatInput = ({ onSend, onImageUpload, disabled }) => {
  const [input, setInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
        e.target.value = ''; // Reset file input
      } else {
        alert('Please select a valid image file.');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      } else {
        alert('Please drop a valid image file.');
      }
    }
  };

  const triggerFileInput = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Sample prompts for better UX
  const samplePrompts = [];

  const handleSamplePrompt = (prompt) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="chat-input-container">
      {/* Sample prompts (show when input is empty) */}
      {input.length === 0 && (
        <div className="sample-prompts">
          <div className="sample-prompts-list">
            {samplePrompts.map((prompt, index) => (
              <button
                key={index}
                className="sample-prompt-btn"
                onClick={() => handleSamplePrompt(prompt)}
                disabled={disabled}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div 
        className={`chat-input ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder={isDragOver ? "Drop image here..." : "Type your news article or question here... (Press Shift+Enter for new line)"}
            disabled={disabled}
            rows={1}
            className="chat-textarea"
          />
          
          <div className="input-actions">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={disabled}
              className="upload-btn"
              title="Upload image"
            >
              📷
            </button>
            
            <button
              type="button"
              onClick={handleSend}
              disabled={disabled || !input.trim()}
              className={`send-btn ${input.trim() ? 'active' : ''}`}
              title="Send message"
            >
              {disabled ? (
                <div className="send-spinner"></div>
              ) : (
                '➤'
              )}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="input-footer">
        <span className="input-hint">
          📝 Paste news text • 📷 Upload screenshots • 🔍 Get instant fact-checks
        </span>
        {!disabled && (
          <span className="input-shortcut">
            Press <kbd>Enter</kbd> to send
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
