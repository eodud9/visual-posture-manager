from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.calibration import CalibrationCreate, CalibrationResponse, CalibrationDetailResponse
from app.crud.calibration import create_calibration, get_latest_calibration

router = APIRouter(prefix = "/calibrations", tags = ["Calibrations"])

@router.post("", response_model = CalibrationResponse)
def save_calibration(body: CalibrationCreate, db: Session = Depends(get_db)):

    if len(body.featureNames) == 0:
        raise HTTPException(status_code = 400, detail = "featureNames는 최소 1개 이상이어야 합니다.")

    if len(body.featureNames) != len(body.featureMedian):
        raise HTTPException(
            status_code = 400,
            detail = "featureNames와 featureMedian의 길이가 일치해야 합니다."
        )

    feature_count = len(body.featureNames)

    if len(body.covarianceMatrix) != feature_count:
        raise HTTPException(
            status_code = 400,
            detail = "covarianceMatrix의 행 개수는 featureNames 길이와 같아야 합니다."
        )

    for row in body.covarianceMatrix:
        if len(row) != feature_count:
            raise HTTPException(
                status_code = 400,
                detail = "covarianceMatrix는 feature 개수에 맞는 정사각 행렬이어야 합니다."
            )

    calibration = create_calibration(db, body)

    return {
        "calibrationId": calibration.calibration_id,
        "message": "캘리브레이션 기준값 저장 성공"
    }

@router.get("/latest", response_model = CalibrationDetailResponse)
def read_latest_calibration(db: Session = Depends(get_db)):
    calibration = get_latest_calibration(db)

    return {
        "calibrationId": calibration.calibration_id,
        "sampleFrameCount": calibration.sample_frame_count,
        "featureNames": calibration.feature_names,
        "featureMedian": calibration.feature_median,
        "covarianceMatrix": calibration.covariance_matrix,
        "threshold": calibration.threshold,
        "alpha": calibration.alpha,
        "landmarksUsed": calibration.landmarks_used,
        "ridgeApplied": calibration.ridge_applied,
        "createdAt": calibration.created_at
    }