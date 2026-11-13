
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

from database import get_db
from models import Product, User
from schemas import ProductCreate, ProductUpdate, ProductResponse
from dependencies import get_current_user


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


# Create Product
@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED
)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    existing_product = db.query(Product).filter(
        Product.organization_id == current_user.organization_id,
        Product.sku == data.sku.strip()
    ).first()

    if existing_product:
        raise HTTPException(
            status_code=409,
            detail="SKU already exists in your organization"
        )

    product = Product(
        organization_id=current_user.organization_id,
        name=data.name.strip(),
        sku=data.sku.strip(),
        description=data.description,
        quantity=data.quantity,
        cost_price=data.cost_price,
        selling_price=data.selling_price,
        low_stock_threshold=data.low_stock_threshold
    )

    db.add(product)

    try:
        db.commit()
        db.refresh(product)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="SKU already exists in your organization"
        )

    return product


# Get All Products and Search
@router.get("/", response_model=list[ProductResponse])
def get_products(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    query = db.query(Product).filter(
        Product.organization_id == current_user.organization_id
    )

    if search and search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                Product.name.ilike(search_value),
                Product.sku.ilike(search_value)
            )
        )

    return query.order_by(Product.id.desc()).all()


# Get Single Product
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.organization_id == current_user.organization_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


# Update Product
@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.organization_id == current_user.organization_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    # Required fields cannot be set to null
    for field in ("name", "sku", "quantity"):
        if field in update_data and update_data[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null"
            )

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip()

    if "sku" in update_data:
        update_data["sku"] = update_data["sku"].strip()

        existing_product = db.query(Product).filter(
            Product.organization_id == current_user.organization_id,
            Product.sku == update_data["sku"],
            Product.id != product.id
        ).first()

        if existing_product:
            raise HTTPException(
                status_code=409,
                detail="SKU already exists in your organization"
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    try:
        db.commit()
        db.refresh(product)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="SKU already exists in your organization"
        )

    return product


# Delete Product
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.organization_id == current_user.organization_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }
