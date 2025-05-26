from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from database import engine, Base
from controllers import book_controller, review_controller
from controllers import user_controller
from controllers import event_controller
from controllers import notification_controller
from controllers import forum_controller
from controllers import category_controller
from controllers import auth_controller

import traceback


app = FastAPI(
    title="Bookify",
    description="API za upravljanje korisnicima i knjigama"
)

app.mount("/book_files", StaticFiles(directory="book_files"), name="book_files")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("⚠️ [VALIDATION ERROR] 422 Unprocessable Entity")
    print(f"🔗 Path: {request.url.path}")
    print("📦 Body:")
    try:
        body = await request.body()
        print(body.decode())
    except Exception as e:
        print("Nije moguće pročitati body:", str(e))

    print("🧠 Validation errors:")
    print(exc.errors())
    print("🔚 Kraj traceback-a")
    print("-" * 80)

    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# CORS konfiguracija
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Uključivanje ruta
app.include_router(book_controller.router)
app.include_router(review_controller.router)
app.include_router(user_controller.router)
app.include_router(event_controller.router)
app.include_router(notification_controller.router)
app.include_router(forum_controller.router)
app.include_router(category_controller.router)
app.include_router(auth_controller.router)


# Kreiranje tabela na startu
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "Dobrodošli na Bookify API!"}
