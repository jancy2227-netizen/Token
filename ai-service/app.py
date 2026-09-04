from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.demand_service import compute_demand_prediction

app = FastAPI(
    title="Hostel Mess AI Food Demand Prediction Microservice",
    description="Predicts Sunday meal demand & buffer requirements to reduce food wastage.",
    version="1.0.0"
)

class PredictRequest(BaseModel):
    sessionId: Optional[str] = None
    vegBookings: Optional[int] = 185
    nonVegBookings: Optional[int] = 315
    cancellations: Optional[int] = 5
    attendanceRate: Optional[float] = 0.94

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Hostel Mess AI Demand Predictor",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict")
def predict_endpoint(req: PredictRequest):
    try:
        veg = req.vegBookings if req.vegBookings is not None else 185
        non_veg = req.nonVegBookings if req.nonVegBookings is not None else 315
        canc = req.cancellations if req.cancellations is not None else 5
        att = req.attendanceRate if req.attendanceRate is not None else 0.94

        result = compute_demand_prediction(
            veg_bookings=veg,
            non_veg_bookings=non_veg,
            cancellations=canc,
            attendance_rate=att
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
