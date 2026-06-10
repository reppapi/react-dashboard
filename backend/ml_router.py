from flask import Blueprint, jsonify
from datetime import datetime
from backend.database import SessionLocal, ActivityHistory
from backend.sleep_metrics import compute_sleep_metrics

ml_bp = Blueprint('ml', __name__, url_prefix='/api')

@ml_bp.route('/quality', methods=['GET'])
def get_quality():
    """Return an aggregated quality score based on activity and sleep metrics."""
    db_session = SessionLocal()
    try:
        activity_rec = db_session.query(ActivityHistory).order_by(ActivityHistory.id.desc()).first()
        activity_pred = activity_rec.prediction if activity_rec else None
        sleep_metrics = compute_sleep_metrics(db_session)
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
