from sqlalchemy.orm import Session
from app.models.calibration import Calibration
from app.schemas.calibration import CalibrationCreate
from fastapi import HTTPException

def create_calibration(db: Session, body: CalibrationCreate):
    calibration = Calibration(
        sample_frame_count = body.sampleFrameCount,
        feature_names = body.featureNames,
        feature_median = body.featureMedian,
        covariance_matrix = body.covarianceMatrix,
        threshold = body.threshold,
        alpha = body.alpha,
        landmarks_used = body.landmarksUsed,
        ridge_applied = body.ridgeApplied
    )

    db.add(calibration)
    db.commit()
    db.refresh(calibration)

    return calibration

def get_calibration(db: Session, calibration_id: int):
    calibration = db.query(Calibration).filter(
        Calibration.calibration_id == calibration_id
    ).first()

    if calibration is None:
        raise HTTPException(status_code=404, detail="캘리브레이션 정보가 없습니다.")

    return calibration


def get_latest_calibration(db: Session):
    calibration = db.query(Calibration).order_by(
        Calibration.created_at.desc()
    ).first()

    if calibration is None:
        raise HTTPException(status_code=404, detail="캘리브레이션 정보가 없습니다.")

    return calibration

