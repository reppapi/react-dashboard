from flask import Blueprint, jsonify, request, current_app
from datetime import datetime
from sqlalchemy.orm import Session
import json
import numpy as np

# Assuming models are loaded in app context
ml_bp = Blueprint('ml', __name__, url_prefix='/api')

@ml_bp.route('/quality', methods=['GET'])
def get_quality():
    """Return an aggregated quality score based on activity and sleep metrics."""
    # Access models and DB via current_app
    db_session: Session = current_app.session_factory()
    try:
        # Get latest activity prediction
        activity_rec = db_session.query(current_app.ActivityHistory).order_by(current_app.ActivityHistory.id.desc()).first()
        activity_pred = activity_rec.prediction if activity_rec else None
        # Get sleep metrics via existing logic (reuse get_sleep_analysis implementation)
        from .app import compute_sleep_metrics
        sleep_metrics = compute_sleep_metrics(db_session)
        # Simple composite: normalize activity (sedentary=0, active=1) and sleep score (0-100)
        activity_score = 0 if activity_pred == 'Sedentary' else 1
        quality_score = int((activity_score * 0.4 + (sleep_metrics.get('score', 0) / 100) * 0.6) * 100)
        return jsonify({
            'activity_prediction': activity_pred,
            'sleep_score': sleep_metrics.get('score'),
            'quality_score': quality_score,
            'timestamp': datetime.now().isoformat()
        })
    finally:
        db_session.close()
