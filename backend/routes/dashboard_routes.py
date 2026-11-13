
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Product, User, OrganizationSetting
from dependencies import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    products = db.query(Product).filter(
        Product.organization_id == current_user.organization_id
    ).all()

    total_products = len(products)

    total_quantity = sum(
        product.quantity for product in products
    )

    settings = db.query(OrganizationSetting).filter(
        OrganizationSetting.organization_id == current_user.organization_id
    ).first()

    default_threshold = (
        settings.default_low_stock_threshold if settings else 5
    )

    low_stock_products = [
        product for product in products
        if product.quantity <= (
            product.low_stock_threshold
            if product.low_stock_threshold is not None
            else default_threshold
        )
    ]

    return {
        "total_products": total_products,
        "total_quantity": total_quantity,
        "low_stock_count": len(low_stock_products),
        "default_low_stock_threshold": default_threshold,
        "low_stock_products": [
            {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "quantity": product.quantity,
                "low_stock_threshold": product.low_stock_threshold
            }
            for product in low_stock_products
        ]
    }
