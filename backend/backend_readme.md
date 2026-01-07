# News Analyzer API

AI-powered news analysis with credibility checking, built with FastAPI, MongoDB, and Google AI.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 📰 **News Analysis** - AI-powered summarization and credibility checking
- 🖼️ **Image OCR** - Extract and analyze text from images
- 🔍 **Source Verification** - Google Search integration for fact-checking
- 💾 **MongoDB Storage** - Scalable database for users and chat history
- 🚀 **Production Ready** - Environment-based configuration

## Quick Start

### Prerequisites

- Python 3.8+
- MongoDB (local or Atlas)
- Google API keys (Gemini, Custom Search)

### Installation

1. **Clone and install dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Set up environment variables:**
```bash
# For development (local MongoDB)
export MONGO_URL="mongodb://localhost:27017/"

# For production (MongoDB Atlas)
export MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/"
export SECRET_KEY="your-super-secret-key"
export ENVIRONMENT="production"
```

3. **Run the server:**
```bash
python -m uvicorn main:app --reload
```

## MongoDB Setup

### Option 1: MongoDB Atlas (Recommended for Production)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Set up database user and network access
4. Get your connection string
5. Set `MONGO_URL` environment variable

### Option 2: Local MongoDB

1. Download [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. Install and start the service
3. Use `mongodb://localhost:27017/` as your `MONGO_URL`

## API Endpoints

### Authentication
- `POST /register` - Register new user
- `POST /login` - Login user

### Analysis
- `POST /analyze-news` - Analyze text (requires auth)
- `POST /analyze-image` - Analyze image (requires auth)

### Health
- `GET /` - API status
- `GET /health` - Health check

## Production Deployment

### Environment Variables

```bash
# Required
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
SECRET_KEY=your-super-secret-key-change-this

# Optional (with defaults)
ENVIRONMENT=production
GEMINI_API_KEY=your-gemini-api-key
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CSE_ID=your-google-cse-id
```

### Deployment Platforms

#### Railway
1. Connect your GitHub repo
2. Set environment variables
3. Deploy automatically

#### Render
1. Create new Web Service
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables

#### Heroku
1. Create new app
2. Connect GitHub repo
3. Set environment variables
4. Deploy

### Frontend Deployment

Update your frontend API URL to point to your deployed backend:

```javascript
// In your React app
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
```

## Development

### Local Development

1. **Start MongoDB locally**
2. **Set environment:**
```bash
export ENVIRONMENT=development
```

3. **Run with auto-reload:**
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing

Test the API at `http://localhost:8000/docs` (Swagger UI)

## Security

- ✅ JWT tokens with expiration
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Environment-based secrets
- ✅ Input validation with Pydantic

## Monitoring

- Health check endpoint: `/health`
- Database connection status
- Environment information

## Troubleshooting

### MongoDB Connection Issues
- Check if MongoDB is running
- Verify connection string
- Check network access (for Atlas)

### API Key Issues
- Verify Google API keys are valid
- Check API quotas and billing

### CORS Issues
- Update `ALLOWED_ORIGINS` in config.py
- Add your frontend domain to the list 