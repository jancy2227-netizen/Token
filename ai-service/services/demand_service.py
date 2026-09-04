from models.predictor import MealDemandPredictor

predictor = MealDemandPredictor()

def compute_demand_prediction(veg_bookings: int, non_veg_bookings: int, cancellations: int = 0, attendance_rate: float = 0.94):
    """
    Computes meal demand predictions and optimal buffer quantities.
    """
    return predictor.predict(
        current_veg_bookings=veg_bookings,
        current_non_veg_bookings=non_veg_bookings,
        cancellations=cancellations,
        turnout_rate=attendance_rate
    )
