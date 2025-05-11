from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from controllers import book_controller, review_controller
from controllers import user_controller
from controllers import event_controller
from controllers import notification_controller
from controllers import forum_controller
from controllers import category_controller
from controllers import auth_controller


app = FastAPI(
    title="Bookify",
    description="API za upravljanje korisnicima i knjigama"
)

# CORS konfiguracija
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
