from fastapi import APIRouter
from models.user import CategoryEnum

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=list[str])
async def get_all_categories():
    return [c.value for c in CategoryEnum]
