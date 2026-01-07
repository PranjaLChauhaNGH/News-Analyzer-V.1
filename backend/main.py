from fastapi import FastAPI, Request, File, UploadFile, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import Optional
import torch
from transformers import BartTokenizer, BartForConditionalGeneration
import google.generativeai as genai
from googleapiclient.discovery import build
import json
from PIL import Image
import pytesseract
import io
import time
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId
import uuid

from config import settings
from database import users_collection, chat_history_collection
from models import UserCreate, NewsRequest, NewsResponse, CredibilityResponse, Token, ChatStatsResponse

genai.configure(api_key=settings.GEMINI_API_KEY)
gemini_flash_model = genai.GenerativeModel('gemini-1.5-flash')

device = 'cuda' if torch.cuda.is_available() else 'cpu'
model_name = "facebook/bart-base"

try:
    print("Loading BART model... (this may take a few minutes)")
    bart_tokenizer = BartTokenizer.from_pretrained(model_name)
    bart_model = BartForConditionalGeneration.from_pretrained(model_name).to(device)
    bart_model.eval()
    print("BART model loaded successfully!")
except Exception as e:
    print(f"BART model loading failed: {e}")
    print("Using fallback summarization")
    bart_tokenizer = None
    bart_model = None

app = FastAPI(
    title="News Analyzer API - Complete Fixed System",
    version="2.1.0",
    description="FIXED: AI-powered news analysis with authentication and database management",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    if users_collection is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Database service temporarily unavailable")
    user = users_collection.find_one({"email": email})
    if user is None:
        raise credentials_exception
    return user

async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme_optional)) -> Optional[dict]:
    if not token or users_collection is None:
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if email:
            user = users_collection.find_one({"email": email})
            return user
    except JWTError:
        pass
    return None

def generate_news_summary(text: str) -> str:
    if not bart_model or not bart_tokenizer:
        return text[:200] + "..." if len(text) > 200 else text
    try:
        inputs = bart_tokenizer([text], max_length=1024, return_tensors="pt", truncation=True).to(device)
        summary_ids = bart_model.generate(
            inputs["input_ids"],
            num_beams=4,
            max_length=150,
            early_stopping=True
        )
        return bart_tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    except Exception as e:
        print(f"BART summarization error: {e}")
        return text[:200] + "..." if len(text) > 200 else text

def get_news_credibility_sources(news_summary: str, num_results=5) -> list:
    try:
        service = build("customsearch", "v1", developerKey=settings.GOOGLE_API_KEY)
        search_results = service.cse().list(
            q=news_summary,
            cx=settings.GOOGLE_CSE_ID,
            num=min(num_results, 10)
        ).execute()
        return [{
            "title": item.get("title"),
            "link": item.get("link"),
            "snippet": item.get("snippet")
        } for item in search_results.get("items", [])]
    except Exception as e:
        print(f"Google search error: {e}")
        return []

def check_news_credibility_conditional(article_text: str) -> dict:
    prompt = f"""
Analyze the following news article for credibility and accuracy:
Article: {article_text}
Provide a comprehensive analysis including:
1. If the article is shorter than 20 words, skip summary generation
2. Extract key claims and facts
3. Assess overall credibility (true/false)
4. Provide detailed reasoning for credibility assessment
5. Generate search terms for fact-checking
Respond in JSON format:
{{
"summary": "brief summary or empty if too short",
"search_title": "key terms for searching",
"isCredible": true/false,
"reasoning": "detailed reasoning for credibility assessment",
"key_claims": ["claim1", "claim2"],
"confidence_score": 0.0-1.0
}}
"""
    try:
        response = gemini_flash_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json"
            )
        )
        raw = response.candidates[0].content.parts[0].text
        result = json.loads(raw)
        result["search_title"] = result.get("search_title") or article_text[:100]
        result["sources"] = get_news_credibility_sources(result["search_title"])
        return result
    except Exception as e:
        print(f"Gemini analysis error: {e}")
        return {
            "summary": "",
            "search_title": article_text[:100],
            "isCredible": False,
            "reasoning": f"Analysis failed: {str(e)}",
            "sources": [],
            "key_claims": [],
            "confidence_score": 0.0
        }

def extract_text_from_image(image: Image.Image) -> str:
    try:
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?:;-() "'
        extracted_text = pytesseract.image_to_string(image, config=custom_config)
        return extracted_text.strip()
    except Exception as e:
        print(f"OCR error: {e}")
        return ""

async def save_chat_history(user_id: str, input_text: str, response_text: str, analysis_type: str = "text",
                            credibility_score: Optional[float] = None, sources_found: int = 0,
                            processing_time: Optional[float] = None) -> str:
    try:
        if chat_history_collection is None:
            return ""
        chat_document = {
            "user_id": ObjectId(user_id),
            "session_id": str(uuid.uuid4()),
            "input_text": input_text,
            "response_text": response_text,
            "analysis_type": analysis_type,
            "credibility_score": credibility_score,
            "sources_found": sources_found,
            "processing_time": processing_time,
            "created_at": datetime.now(timezone.utc)
        }
        result = chat_history_collection.insert_one(chat_document)
        if users_collection:
            users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"total_analyses": 1}}
            )
        return str(result.inserted_id)
    except Exception as e:
        print(f"Failed to save chat history: {e}")
        return ""

@app.get("/")
async def root():
    return {
        "message": "News Analyzer API - FIXED Complete System v2.1",
        "status": "running",
        "database_connected": users_collection is not None,
        "version": "2.1.0"
    }

@app.get("/health")
async def health_check():
    health_data = {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc),
        "version": "2.1.0",
        "services": {}
    }
    if users_collection is not None and chat_history_collection is not None:
        try:
            users_count = users_collection.count_documents({})
            chats_count = chat_history_collection.count_documents({})
            health_data["services"]["database"] = {
                "status": "connected",
                "users_count": users_count,
                "chats_count": chats_count
            }
        except Exception as e:
            health_data["services"]["database"] = {"status": "error", "error": str(e)}
            health_data["status"] = "degraded"
    else:
        health_data["services"]["database"] = {"status": "disconnected"}
        health_data["status"] = "degraded"
    try:
        gemini_flash_model.generate_content("test")
        health_data["services"]["gemini"] = {"status": "connected"}
    except Exception as e:
        health_data["services"]["gemini"] = {"status": "error", "error": str(e)}
        health_data["status"] = "degraded"
    health_data["services"]["bart"] = {
        "status": "loaded" if bart_model and bart_tokenizer else "not_loaded"
    }
    return health_data

@app.post("/register", response_model=Token)
async def register_user(user: UserCreate):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service temporarily unavailable. Please try again later."
        )
    try:
        existing_user = users_collection.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        hashed_password = get_password_hash(user.password)
        user_data = {
            "email": user.email,
            "password_hash": hashed_password,
            "full_name": getattr(user, 'full_name', ''),
            "created_at": datetime.now(timezone.utc),
            "last_login": None,
            "is_active": True,
            "subscription": "free",
            "total_analyses": 0
        }
        result = users_collection.insert_one(user_data)
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        print(f"✅ New user registered: {user.email}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@app.post("/login", response_model=Token)
async def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    if users_collection is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service temporarily unavailable. Please try again later."
        )
    try:
        user = users_collection.find_one({"email": form_data.username})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc)}}
        )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        print(f"✅ User logged in: {user['email']}")
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@app.post("/analyze-news", response_model=NewsResponse)
async def analyze_news(request: NewsRequest, current_user: Optional[dict] = Depends(get_current_user_optional)):
    start_time = time.time()
    text = request.text.strip()
    if not text:
        return NewsResponse(
            summary="",
            credibility=CredibilityResponse(
                isCredible=False,
                reasoning="No input text provided.",
                sources=[]
            ),
            hide_summary_and_credibility=True
        )
    try:
        if len(text.split()) < 10:
            sources = get_news_credibility_sources(text)
            processing_time = time.time() - start_time
            if current_user:
                await save_chat_history(
                    user_id=str(current_user["_id"]),
                    input_text=text,
                    response_text="Text too short for analysis",
                    analysis_type="text",
                    sources_found=len(sources),
                    processing_time=processing_time
                )
            return NewsResponse(
                summary="",
                credibility=CredibilityResponse(
                    isCredible=False,
                    reasoning="Text too short for comprehensive analysis. Please provide more detailed content.",
                    sources=sources
                ),
                hide_summary_and_credibility=True
            )
        credibility_analysis = check_news_credibility_conditional(text)
        summary = credibility_analysis.get("summary", "")
        if not summary and len(text.split()) >= 10:
            summary = generate_news_summary(text)
        processing_time = time.time() - start_time
        if current_user:
            await save_chat_history(
                user_id=str(current_user["_id"]),
                input_text=text,
                response_text=summary or credibility_analysis.get("reasoning", ""),
                analysis_type="text",
                credibility_score=credibility_analysis.get("confidence_score", 0.5),
                sources_found=len(credibility_analysis.get("sources", [])),
                processing_time=processing_time
            )
        return NewsResponse(
            summary=summary,
            credibility=CredibilityResponse(
                isCredible=credibility_analysis.get("isCredible", False),
                reasoning=credibility_analysis.get("reasoning", "Analysis completed."),
                sources=credibility_analysis.get("sources", [])
            ),
            hide_summary_and_credibility=False
        )
    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        processing_time = time.time() - start_time
        if current_user:
            await save_chat_history(
                user_id=str(current_user["_id"]),
                input_text=text,
                response_text=error_msg,
                analysis_type="text",
                processing_time=processing_time
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...), current_user: Optional[dict] = Depends(get_current_user_optional)):
    start_time = time.time()
    try:
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please upload a valid image file"
            )
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        extracted_text = extract_text_from_image(image)
        if not extracted_text.strip():
            processing_time = time.time() - start_time
            if current_user:
                await save_chat_history(
                    user_id=str(current_user["_id"]),
                    input_text="[Image upload - OCR failed]",
                    response_text="No readable text found",
                    analysis_type="image",
                    processing_time=processing_time
                )
            return JSONResponse(
                status_code=400,
                content={"error": "No readable text found in the image"}
            )
        if len(extracted_text.split()) >= 10:
            credibility_analysis = check_news_credibility_conditional(extracted_text)
            summary = credibility_analysis.get("summary", "") or generate_news_summary(extracted_text)
            processing_time = time.time() - start_time
            if current_user:
                await save_chat_history(
                    user_id=str(current_user["_id"]),
                    input_text=f"[Image] {extracted_text[:200]}...",
                    response_text=summary,
                    analysis_type="image",
                    credibility_score=credibility_analysis.get("confidence_score", 0.5),
                    sources_found=len(credibility_analysis.get("sources", [])),
                    processing_time=processing_time
                )
            return NewsResponse(
                summary=summary,
                credibility=CredibilityResponse(
                    isCredible=credibility_analysis.get("isCredible", False),
                    reasoning=credibility_analysis.get("reasoning", "Image analysis completed."),
                    sources=credibility_analysis.get("sources", [])
                ),
                hide_summary_and_credibility=False
            )
        else:
            sources = get_news_credibility_sources(extracted_text)
            processing_time = time.time() - start_time
            if current_user:
                await save_chat_history(
                    user_id=str(current_user["_id"]),
                    input_text=f"[Image] {extracted_text}",
                    response_text="Extracted text too short",
                    analysis_type="image",
                    processing_time=processing_time
                )
            return NewsResponse(
                summary="",
                credibility=CredibilityResponse(
                    isCredible=False,
                    reasoning="Extracted text too short for analysis",
                    sources=sources
                ),
                hide_summary_and_credibility=True
            )
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        error_msg = f"Image processing failed: {str(e)}"
        if current_user:
            await save_chat_history(
                user_id=str(current_user["_id"]),
                input_text="[Image upload failed]",
                response_text=error_msg,
                analysis_type="image",
                processing_time=processing_time
            )
        return JSONResponse(
            status_code=500,
            content={"error": error_msg}
        )

# Additional endpoints like chat history, stats, delete etc., can be added similarly with proper security checks.

# Startup event for logging status
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting News Analyzer API - Enhanced System")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    if users_collection is not None and chat_history_collection is not None:
        try:
            users_collection.find_one({})
            print("🔗 Database: Connected and Healthy")
        except Exception as e:
            print(f"🔗 Database: Connected but Error - {e}")
    else:
        print("🔗 Database: Disconnected")
    print(f"🤖 AI Models: Gemini + {'BART' if bart_model is not None else 'No BART'}")
    print("✅ Enhanced News Analyzer API v2.2 ready!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
