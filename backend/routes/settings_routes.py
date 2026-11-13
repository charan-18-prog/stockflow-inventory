
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import OrganizationSetting, User
from dependencies import get_current_user

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


def get_or_create_settings(db: Session, organization_id: int):
    settings = db.query(OrganizationSetting).filter(
        OrganizationSetting.organization_id == organization_id
    ).first()

    if not settings:
        settings = OrganizationSetting(
            organization_id=organization_id,
            default_low_stock_threshold=5
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.get("/")
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    settings = get_or_create_settings(
        db, current_user.organization_id
    )

    return {
        "default_low_stock_threshold":
            settings.default_low_stock_threshold
    }


@router.put("/")
def update_settings(
    threshold: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if threshold < 0:
        raise HTTPException(
            status_code=400,
            detail="Threshold cannot be negative"
        )

    settings = get_or_create_settings(
        db, current_user.organization_id
    )

    settings.default_low_stock_threshold = threshold
    db.commit()
    db.refresh(settings)

    return {
        "message": "Settings updated successfully",
        "default_low_stock_threshold":
            settings.default_low_stock_threshold
    }
