// ✅ FIXED: src/App.jsx - Complete fixed frontend with proper error handling
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import ChatHistory from './components/ChatHistory';
import ImageCropper from './components/ImageCropper';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

function ChatUI() {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: "🚀 **Welcome to News Analyzer!**\n\nI'm your AI-powered fact-checking assistant. I can help you:\n\n📝 **Analyze news articles** for credibility and accuracy\n📷 **Process news screenshots** with OCR technology\n🔍 **Verify sources** and provide fact-checking\n⚡ **Get instant summaries** of complex news stories\n\n**New:** You can now use the analyzer as a guest or sign in for history tracking!\n\nTry pasting a news article or uploading a screenshot to get started!" 
    }
  ]);
  
  const [imageToCrop, setImageToCrop] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserEmail(payload.sub || 'User');
      } catch (error) {
        console.log('Token decode failed, using default');
      }
    }
  }, []);

  // FIXED: Enhanced handleSend with proper error handling
  const handleSend = async (text) => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    const newMessages = [...messages, { role: 'user', text }];
    setMessages(newMessages);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      const headers = { 'Content-Type': 'application/json' };
      
      // FIXED: Authentication is now optional
      const token = localStorage.getItem('token');
      if (token && isAuthenticated) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8000/analyze-news', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        // Token expired
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserEmail('');
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          text: '🔐 **Session Expired**\n\nYour session has expired, but you can continue as a guest. [Sign in](/login) to save your analysis history.' 
        }]);
        setIsLoading(false);
        return;
      }

      if (response.status === 503) {
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          text: '🔧 **Service Temporarily Unavailable**\n\nOur database is currently unavailable. You can still analyze content, but your history won\'t be saved. Please try again later.' 
        }]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Format response
      let reply;
      if (data.hide_summary_and_credibility) {
        reply = `📄 **Quick Analysis**\n\n${data.credibility.reasoning}`;
        if (data.credibility.sources && data.credibility.sources.length > 0) {
          reply += '\n\n🔗 **Related Sources:**\n' + 
            data.credibility.sources.map((s, i) => 
              `${i + 1}. **[${s.title}](${s.link})**\n   *${s.snippet}*`
            ).join('\n\n');
        }
      } else {
        const credibilityEmoji = data.credibility.isCredible ? '✅' : '❌';
        const credibilityText = data.credibility.isCredible ? 'Credible' : 'Not Credible';
        
        reply = `📝 **Summary**\n${data.summary}\n\n🔍 **Credibility Assessment**\n${credibilityEmoji} **${credibilityText}**\n\n📊 **Source Verification**`;
        
        if (data.credibility.sources && data.credibility.sources.length > 0) {
          reply += '\n' + data.credibility.sources.map((s, i) => 
            `${i + 1}. **[${s.title}](${s.link})**\n   *${s.snippet}*`
          ).join('\n\n');
        } else {
          reply += '\nNo external sources found for verification.';
        }
        
        if (!isAuthenticated) {
          reply += '\n\n💡 **Tip:** [Sign in](/login) to save your analysis history and track your fact-checking progress!';
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      
    } catch (error) {
      console.error('Analysis error:', error);
      let errorMessage = '❌ **Connection Error**\n\n';
      
      if (error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try with shorter text or check your connection.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += `Cannot connect to backend server.\n\n**Troubleshooting:**\n1. Check if backend is running: \`cd backend && python -m uvicorn main:app --reload\`\n2. Verify MongoDB Atlas connection\n3. Check network connectivity`;
      } else {
        errorMessage += `Analysis failed: ${error.message}`;
      }
      
      setMessages((prev) => [...prev, { role: 'assistant', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Enhanced image handling
  const handleImageUpload = (imageFile) => {
    if (!imageFile.type.startsWith('image/')) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '❌ **Invalid File Type**\n\nPlease upload a valid image file (JPG, PNG, WebP, etc.).' }
      ]);
      return;
    }
    
    if (imageFile.size > 10 * 1024 * 1024) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '❌ **File Too Large**\n\nPlease upload an image smaller than 10MB.' }
      ]);
      return;
    }
    
    setImageToCrop(imageFile);
  };

  const handleCancelCrop = () => {
    setImageToCrop(null);
  };

  const handleCroppedImage = async (croppedBlob) => {
    setImageToCrop(null);
    setIsLoading(true);
    
    const newMessages = [...messages, { 
      role: 'user', 
      text: '📷 **Image uploaded for analysis**\n\n*Processing image content with OCR...*' 
    }];
    setMessages(newMessages);

    const formData = new FormData();
    formData.append('file', croppedBlob, 'cropped-image.jpg');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const headers = {};
      const token = localStorage.getItem('token');
      if (token && isAuthenticated) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('http://localhost:8000/analyze-image', {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUserEmail('');
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          text: '🔐 **Session Expired**\n\nContinuing as guest. [Sign in](/login) to save your analysis history.' 
        }]);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [...prev, { 
          role: 'assistant', 
          text: `❌ **Image Processing Error**\n\n${data.error}` 
        }]);
        return;
      }

      // Format image analysis response (same as text)
      let reply;
      if (data.hide_summary_and_credibility) {
        reply = `📄 **Image Analysis Result**\n\n${data.credibility.reasoning}`;
        if (data.credibility.sources && data.credibility.sources.length > 0) {
          reply += '\n\n🔗 **Related Sources:**\n' + 
            data.credibility.sources.map((s, i) => 
              `${i + 1}. **[${s.title}](${s.link})**\n   *${s.snippet}*`
            ).join('\n\n');
        }
      } else {
        const credibilityEmoji = data.credibility.isCredible ? '✅' : '❌';
        const credibilityText = data.credibility.isCredible ? 'Credible' : 'Not Credible';
        
        reply = `📝 **Extracted Content Summary**\n${data.summary}\n\n🔍 **Credibility Assessment**\n${credibilityEmoji} **${credibilityText}**\n\n📊 **Source Verification**`;
        
        if (data.credibility.sources && data.credibility.sources.length > 0) {
          reply += '\n' + data.credibility.sources.map((s, i) => 
            `${i + 1}. **[${s.title}](${s.link})**\n   *${s.snippet}*`
          ).join('\n\n');
        } else {
          reply += '\nNo external sources found for verification.';
        }
        
        if (!isAuthenticated) {
          reply += '\n\n💡 **Tip:** [Sign in](/login) for history tracking and advanced features!';
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      
    } catch (error) {
      console.error('Image upload error:', error);
      let errorMessage = '❌ **Image Upload Error**\n\n';
      
      if (error.name === 'AbortError') {
        errorMessage += 'Image processing timed out. Please try with a smaller or clearer image.';
      } else {
        errorMessage += `Could not process the image: ${error.message}`;
      }
      
      setMessages((prev) => [...prev, { role: 'assistant', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserEmail('');
    setShowHistory(false);
    setMessages([
      { 
        role: 'assistant', 
        text: "👋 **Logged out successfully!**\n\nYou can continue using News Analyzer as a guest. Your analyses won't be saved, but all features remain available. Sign in anytime to track your fact-checking history!" 
      }
    ]);
  };

  return (
    <div className="app">
      <div className="chat-header">
        <div className="header-left">
          <h1>📰 News Analyzer <span className="version-badge">v2.1 FIXED</span></h1>
          <div className="header-subtitle">AI-Powered Fact Checking & Source Verification</div>
        </div>
        <div className="header-buttons">
          {isAuthenticated ? (
            <>
              {showHistory && (
                <button 
                  onClick={() => setShowHistory(false)}
                  className="back-to-chat-btn"
                >
                  ← Back to Chat
                </button>
              )}
              {!showHistory && (
                <button 
                  onClick={() => setShowHistory(true)}
                  className="history-btn"
                >
                  📊 History
                </button>
              )}
              <div className="user-info">
                <span className="user-email">{userEmail}</span>
                <div className="user-status">✅ Authenticated</div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <div className="guest-indicator">👤 Guest Mode</div>
              <button 
                onClick={() => window.location.href = '/login'} 
                className="login-btn"
              >
                Sign In
              </button>
              <button 
                onClick={() => window.location.href = '/register'} 
                className="register-btn"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="main-content">
        {showHistory ? (
          <ChatHistory onClose={() => setShowHistory(false)} />
        ) : (
          <>
            <ChatWindow messages={messages} isLoading={isLoading} />
            <ChatInput 
              onSend={handleSend} 
              onImageUpload={handleImageUpload}
              disabled={isLoading}
            />
          </>
        )}
      </div>

      {imageToCrop && (
        <ImageCropper
          imageFile={imageToCrop}
          onCropped={handleCroppedImage}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<ChatUI />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
