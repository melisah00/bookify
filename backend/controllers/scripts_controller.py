from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import get_db
from models.book import Script
from schemas.script import *
from typing import List
from services.auth_service import *
from fastapi.responses import FileResponse
import shutil, os, uuid

router = APIRouter()

UPLOAD_DIRECTORY = "uploaded_scripts"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

@router.get("/scripts", response_model=List[ScriptSchema])
async def get_all_scripts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Script))
    return result.scalars().all()

@router.post("/scripts/upload", status_code=201)
async def upload_script(
    name: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    author_username = current_user["username"]  # ✅ username iz tokena

    # Snimi fajl
    file_ext = os.path.splitext(file.filename)[-1]
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join("uploaded_scripts", filename)
    os.makedirs("uploaded_scripts", exist_ok=True)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Unesi u bazu
    new_script = Script(
        name=name,
        subject=subject,
        file_path=file_path,
        author_username=author_username
    )
    db.add(new_script)
    await db.commit()
    return {"message": "Script uploaded successfully."}

@router.get("/scripts/download/{script_id}")
async def download_script(script_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()

    if not script or not os.path.exists(script.file_path):
        raise HTTPException(status_code=404, detail="Script not found.")
    
    return FileResponse(script.file_path, media_type="application/pdf", filename=script.name + ".pdf")

@router.get("/scripts/me", response_model=List[ScriptSchema])
async def get_my_scripts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    username = current_user.get("username")
    if not username:
        raise HTTPException(status_code=401, detail="User not authenticated")

    result = await db.execute(
        select(Script).where(Script.author_username == username)
    )
    return result.scalars().all()

@router.delete("/scripts/{script_id}")
async def delete_script(
    script_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()

    if not script or script.author_username != current_user["username"]:
        raise HTTPException(status_code=403, detail="Not allowed.")

    await db.delete(script)
    await db.commit()
    return {"message": "Deleted"}

@router.put("/scripts/{script_id}", response_model=ScriptSchema)
async def update_script(
    script_id: int,
    name: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()

    if not script or script.author_username != current_user["username"]:
        raise HTTPException(status_code=403, detail="Not allowed.")

    # Ažuriraj tekstualne podatke
    script.name = name
    script.subject = subject

    # Ako je novi fajl poslan, zamijeni stari
    if file:
        # Obriši stari fajl
        if os.path.exists(script.file_path):
            os.remove(script.file_path)

        # Snimi novi fajl
        file_ext = os.path.splitext(file.filename)[-1]
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIRECTORY, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        script.file_path = file_path

    await db.commit()
    await db.refresh(script)
    return script


@router.get("/scripts/{script_id}", response_model=ScriptSchema)
async def get_script_by_id(script_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found.")
    return script
