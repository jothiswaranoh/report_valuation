# Detailed Setup Guide

This guide covers setting up the Report Valuation project fully locally, without using Docker for the application code (though Docker is still recommended for MongoDB and Redis).

## Prerequisites Installation

### 1. Install Tesseract OCR (Required for Backend on Local Machine)

**macOS:**
```bash
brew install tesseract tesseract-lang
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-tam
```

**Windows:**
Download from: https://github.com/UB-Mannheim/tesseract/wiki

### 2. Verify Installation

```bash
tesseract --version
python3 --version
node --version
```

## Configuration

### Backend Configuration

1. Copy the environment template:
```bash
cd api
cp .env.example .env
```

2. Edit `.env` to include your configuration strings:
```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
MONGO_URI=mongodb://localhost:27017
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Frontend Configuration

```bash
cd web_app
cp .env.example .env
```

Default configuration works for local development connecting to `http://localhost:8000`.

## Quick Start (Local Run)

You will need **MongoDB** and **Redis** running locally (e.g. via local installation or partial docker-compose).

1. **Start Infrastructure Services:**
   Normally, you can just extract them from docker-compose:
   ```bash
   docker-compose up -d mongodb redis
   ```

2. **Terminal 1 - Backend API:**
   ```bash
   cd api
   python -m venv env
   source env/bin/activate  # or: env\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Terminal 2 - Celery Worker:**
   ```bash
   cd api
   source env/bin/activate
   celery -A app.celery_app:celery_app worker --loglevel=info --queues=document_processing
   ```

4. **Terminal 3 - Frontend:**
   ```bash
   cd web_app
   npm install
   npm run dev
   ```

## Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Flower (If started):** http://localhost:5555

## Troubleshooting

### Backend won't start

1. **Dependencies missing:**
   ```bash
   cd api
   source env/bin/activate
   pip install -r requirements.txt
   ```

2. **Redis / MongoDB connection error:**
   Make sure you have MongoDB and Redis running on their default ports.

3. **Check Tesseract:**
   ```bash
   which tesseract  # Should show path to tesseract
   ```

### Frontend won't start

1. **Dependencies:**
   ```bash
   cd web_app
   npm install
   ```

2. **Port 5173 in use:**
   Kill the existing process or it will default to the next available port.

### CORS Errors

Ensure the backend `.env` includes:
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```
