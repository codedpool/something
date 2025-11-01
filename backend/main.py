from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mf_api import router as mf_router
from stock_api import router as stock_router
from portfolio_mongodb import router as portfolio_router  # Using MongoDB version

app = FastAPI(title="Combined Stock + Mutual Fund API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mf_router)
app.include_router(stock_router)
app.include_router(portfolio_router)

@app.get("/")
def root():
    return {"message": "Stock and Mutual Fund unified API is running!"}
