# AI Food Demand Prediction Microservice

This microservice uses Python, FastAPI, and Scikit-Learn to predict food preparation demands for Sunday mess meals based on historical turnout rates and active booking volumes.

## Setup & Execution

1. Create and activate a Python virtual environment:
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the FastAPI microservice:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Health Check
- API Status: `http://localhost:8000/health`
- Prediction Endpoint: `POST http://localhost:8000/predict`
- Interactive Swagger UI: `http://localhost:8000/docs`

> Note: The Express backend includes an automatic fallback that seamlessly calculates identical ML predictions if this Python service is not running.
