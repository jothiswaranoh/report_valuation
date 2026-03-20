# Report Valuation - Full Stack Application

This application handles the valuation of reports using an asynchronous document processing pipeline. It consists of a FastAPI backend (with Celery workers for async processing) and a React (Vite + TypeScript) frontend.

## Project Structure

```
.
├── api/                     # FastAPI backend & Celery Workers
│   ├── app/                 # Application code (API, Core, DB, Models, Tasks)
│   ├── requirements.txt
│   └── .env.example
│
├── web_app/                 # React frontend
│   ├── src/                 # React components, pages, services, etc.
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml       # Docker configuration for the entire stack
└── SETUP.md                 # Detailed setup instructions
```

## Core Technologies

- **Backend:** FastAPI, Python, MongoDB, Redis, Celery (for async tasks).
- **Frontend:** React, TypeScript, Vite, Tailwind CSS.
- **Infrastructure:** Docker, Docker Compose.

## Prerequisites

- **Docker:** We highly recommend using Docker and Docker Compose for running the application, as it handles all external services like MongoDB and Redis automatically.
- **Python 3.8+** (If running backend locally)
- **Node.js 18+** (If running frontend locally)
- **Tesseract OCR:** Required if you are processing documents directly on your local system without Docker.

## Configuration

1. **Backend Environment:**
   Navigate to the `api` directory and configure the environment:
   ```bash
   cd api
   cp .env.example .env
   ```
   Add your required keys (e.g. OpenAI API key, MongoDB settings) to `.env`.

2. **Frontend Environment:**
   Navigate to the `web_app` directory:
   ```bash
   cd web_app
   cp .env.example .env
   ```

## Running the Application (Recommended)

The easiest way to start the entire system (MongoDB, Redis, FastAPI Backend, Celery Worker, Flower Dashboard, and React Frontend) is using Docker Compose.

```bash
# In the project root directory
docker-compose up --build
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **API Documentation:** `http://localhost:8000/docs`
- **Flower Dashboard (Celery Monitor):** `http://localhost:5555`

## Running Locally Without Docker

If you prefer to run the services individually without Docker, see [SETUP.md](SETUP.md) for detailed step-by-step instructions.

## Features

### Backend API
- ✅ Async document processing (Celery + Redis)
- ✅ MongoDB for robust data storage
- ✅ AI-powered translation and synthesis
- ✅ Real-time processing updates (Server-Sent Events)
- ✅ Scalable worker architecture

### Frontend
- ✅ Intuitive Vite + React Dashboard
- ✅ Real-time processing status updates
- ✅ Interactive Report Viewer & Editor
- ✅ Drag-and-drop file upload
- ✅ Responsive UI powered by Tailwind CSS

## API Endpoints

### POST `/api/v1/process`
Upload and process a document incrementally via Celery.

### GET `/health`
Health check endpoint.

For more details, visit `http://localhost:8000/docs`.

## Database Seeds (Initial Data)

Seeds are used to populate the database with initial users or default configuration.

1. Start MongoDB (via Docker):
   ```bash
   docker-compose up mongodb -d
   ```
2. Run the seed script:
   ```bash
   cd api
   # Ensure your virtual environment is active
   python -m app.db.seeds  # (or equivalent seed module if implemented)
   ```

## License

MIT

## Support
For issues or questions, please check the detailed documentation or create an issue in the repository.
