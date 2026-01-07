// ✅ COMPLETE: src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // We'll create this CSS file

const Home = () => {
  const navigate = useNavigate();

  const handleTryDemo = () => {
  navigate('/chat');
  };

const handleGetStarted = () => {
  navigate('/register');
  };

const handleSignIn = () => {
  navigate('/login');
  };

  return (
    <div className="home-container">
      {/* Navigation Header */}
      <nav className="home-nav">
        <div className="nav-brand">
          <h2>📰 News Analyzer</h2>
        </div>
        <div className="nav-actions">
          <button onClick={handleSignIn} className="nav-btn signin-btn">
            Sign In
          </button>
          <button onClick={handleGetStarted} className="nav-btn primary-btn">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🚀 AI-Powered Fact Checking</span>
          </div>
          
          <h1 className="hero-title">
            Verify News with
            <span className="gradient-text"> AI Precision</span>
          </h1>
          
          <p className="hero-subtitle">
            Get quick summaries, credibility checks, and real sources for any news article or screenshot. 
            Stop misinformation in its tracks with our advanced AI analysis.
          </p>
          
          <div className="hero-actions">
            <button onClick={handleGetStarted} className="cta-btn primary">
              <span>Start Analyzing Free</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            
            <button onClick={handleTryDemo} className="cta-btn secondary">
              <span>Try Demo</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Articles Analyzed</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Accuracy Rate</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Active Users</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="demo-chat">
            <div className="chat-header-demo">
              <div className="chat-dots">
                <span></span><span></span><span></span>
              </div>
              <span>News Analyzer</span>
            </div>
            <div className="chat-messages">
              <div className="message user-message">
                <span>Analyze: "Breaking: Scientists discover cure for aging"</span>
              </div>
              <div className="message ai-message">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
                <div className="analysis-result">
                  <div className="credibility-badge not-credible">❌ Not Credible</div>
                  <p><strong>Analysis:</strong> No verified scientific sources found. Likely clickbait or misinformation.</p>
                  <div className="sources">📊 <strong>Sources:</strong> 0 reliable sources found</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features for News Verification</h2>
            <p>Everything you need to fact-check news in real-time</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Text Analysis</h3>
              <p>Paste any news article and get instant AI-powered credibility analysis with source verification.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📷</div>
              <h3>Image OCR</h3>
              <p>Upload screenshots of news stories and extract text for analysis using advanced OCR technology.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Source Verification</h3>
              <p>Cross-reference claims with reliable sources using Google Search integration and fact-checking databases.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Results</h3>
              <p>Get instant summaries, credibility scores, and analysis results in seconds, not minutes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>Chat History</h3>
              <p>Save and organize your analysis history. Track patterns and build your fact-checking knowledge base.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure & Private</h3>
              <p>Your data is encrypted and secure. We respect your privacy and never share your analysis history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Fact-check any news in 3 simple steps</p>
          </div>

          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Submit Content</h3>
                <p>Paste a news article or upload a screenshot of the news story you want to verify.</p>
              </div>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>AI Analysis</h3>
                <p>Our AI analyzes the content, checks facts, and searches for reliable sources and verification.</p>
              </div>
            </div>

            <div className="step-arrow">→</div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Get Results</h3>
                <p>Receive a comprehensive report with credibility score, summary, and source references.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Stop Misinformation?</h2>
            <p>Join thousands of users who trust News Analyzer for accurate fact-checking</p>
            <div className="cta-actions">
              <button onClick={handleGetStarted} className="cta-btn primary large">
                Get Started Free
              </button>
              <button onClick={handleTryDemo} className="cta-btn secondary large">
                Try Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>📰 News Analyzer</h3>
              <p>AI-powered fact-checking for the modern world</p>
            </div>
            
            <div className="footer-links">
              <div className="link-group">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#pricing">Pricing</a>
              </div>
              
              <div className="link-group">
                <h4>Company</h4>
                <a href="#about">About Us</a>
                <a href="#contact">Contact</a>
                <a href="#privacy">Privacy Policy</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 News Analyzer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
