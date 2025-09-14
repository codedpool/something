from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, List
from starlette.responses import JSONResponse
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from datetime import datetime

# Load .env (for MongoDB etc)
load_dotenv()

# Logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mutual Fund Analysis API with mfapi.in")

# CORS (for local Next.js dev and deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB ONLY needed for portfolio/user routes (edit/remove if not using these)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
try:
    client = MongoClient(MONGODB_URL)
    db = client["codezen"]
    users_collection = db["users"]
    portfolio_collection = db["portfolio"]
except Exception as e:
    logger.error(f"MongoDB connection failed: {e}")
    users_collection = None
    portfolio_collection = None

MFAPI_BASE_URL = "https://api.mfapi.in"

# --- Helper functions ---
def fetch_all_schemes():
    url = f"{MFAPI_BASE_URL}/mf"
    r = requests.get(url)
    if r.ok:
        return {item["schemeCode"]: item["schemeName"] for item in r.json()}
    return {}

def fetch_scheme_details(scheme_code):
    url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
    r = requests.get(url)
    if r.ok:
        meta = r.json().get("meta", {})
        return meta
    return {}

def fetch_historical_nav(scheme_code):
    url = f"{MFAPI_BASE_URL}/mf/{scheme_code}"
    r = requests.get(url)
    if r.ok:
        return r.json().get("data", [])
    return []

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "API is running using mfapi.in as backend source."}

@app.get("/api/schemes")
async def get_schemes(search: str = ""):
    all_schemes = fetch_all_schemes()
    if search:
        filtered = {code: name for code, name in all_schemes.items() if search.lower() in name.lower()}
        return filtered if filtered else {}
    return all_schemes

@app.get("/api/scheme-details/{scheme_code}")
async def get_scheme_details(scheme_code: str):
    return fetch_scheme_details(scheme_code) or {}

@app.get("/api/historical-nav/{scheme_code}")
async def get_historical_nav(scheme_code: str):
    return fetch_historical_nav(scheme_code) or []

@app.get("/api/compare-navs")
async def compare_navs(scheme_codes: str):
    codes = scheme_codes.split(",")
    comparison_data = {}
    for code in codes:
        navs = fetch_historical_nav(code.strip())
        if navs:
            df = pd.DataFrame(navs)
            df["date"] = pd.to_datetime(df["date"], dayfirst=True)
            df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
            df = df.dropna(subset=["nav"])
            df = df.set_index("date")
            comparison_data[code] = df["nav"]
    if comparison_data:
        combined = pd.concat(comparison_data.values(), axis=1, keys=comparison_data.keys()).reset_index()
        combined.columns = ["date"] + [f"{code}_nav" for code in comparison_data.keys()]
        return combined.fillna("").astype(str).to_dict(orient="records")
    return []

@app.get("/api/average-aum")
async def get_average_aum(period: str = ""):
    # Not supported by mfapi.in; AUM data unavailable.
    return []

@app.get("/api/performance-heatmap/{scheme_code}")
async def get_performance_heatmap(scheme_code: str):
    navs = fetch_historical_nav(scheme_code)
    if navs:
        df = pd.DataFrame(navs)
        df["date"] = pd.to_datetime(df["date"], dayfirst=True)
        df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
        df["dayChange"] = df["nav"].pct_change().fillna(0)
        df["month"] = df["date"].dt.month
        heatmap = df.groupby("month")["dayChange"].mean().reset_index()
        heatmap["month"] = heatmap["month"].astype(str)
        return heatmap.to_dict(orient="records")
    return []

@app.get("/api/risk-volatility/{scheme_code}")
async def get_risk_volatility(scheme_code: str):
    navs = fetch_historical_nav(scheme_code)
    if not navs:
        return {
            "annualized_volatility": 0.0,
            "annualized_return": 0.0,
            "sharpe_ratio": 0.0,
            "returns": []
        }
    df = pd.DataFrame(navs)
    df["date"] = pd.to_datetime(df["date"], dayfirst=True)
    df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
    df.dropna(subset=["nav"], inplace=True)
    df["returns"] = df["nav"].pct_change()
    df.dropna(subset=["returns"], inplace=True)
    annualized_volatility = df["returns"].std() * (252**0.5)
    annualized_return = (df["returns"].mean() + 1) ** 252 - 1
    risk_free_rate = 0.06  # 6%
    sharpe_ratio = (annualized_return - risk_free_rate) / annualized_volatility if annualized_volatility > 0 else 0.0
    returns_list = [
        {"date": row["date"].strftime("%Y-%m-%d"), "returns": round(row["returns"], 8)}
        for idx, row in df.iterrows()
    ]
    return {
        "annualized_volatility": float(annualized_volatility),
        "annualized_return": float(annualized_return),
        "sharpe_ratio": float(sharpe_ratio),
        "returns": returns_list
    }

@app.get("/api/monte-carlo-prediction/{scheme_code}")
async def get_monte_carlo_prediction(scheme_code: str, num_simulations: int = 1000, days: int = 252):
    navs = fetch_historical_nav(scheme_code)
    if not navs:
        return {"message": "No NAV data"}
    df = pd.DataFrame(navs)
    df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
    df = df.dropna(subset=["nav"])
    df["returns"] = df["nav"].pct_change()
    df = df.dropna(subset=["returns"])
    if len(df["returns"]) < 2:
        return {"message": "Insufficient data for Monte Carlo simulation"}
    mu = df["returns"].mean()
    sigma = df["returns"].std()
    last_nav = float(df["nav"].iloc[-1])
    simulations = np.zeros((num_simulations, days))
    simulations[:, 0] = last_nav
    for t in range(1, days):
        random_returns = np.random.normal(mu, sigma, num_simulations)
        simulations[:, t] = simulations[:, t - 1] * (1 + random_returns)
    expected_nav = float(np.mean(simulations[:, -1]))
    prob_positive = float(np.mean(simulations[:, -1] > last_nav))
    percentile_5 = float(np.percentile(simulations[:, -1], 5))
    percentile_95 = float(np.percentile(simulations[:, -1], 95))
    return {
        "expected_nav": expected_nav,
        "probability_positive_return": prob_positive * 100,
        "lower_bound_5th_percentile": percentile_5,
        "upper_bound_95th_percentile": percentile_95,
        "last_nav": last_nav,
    }

# -------- Portfolio/User Endpoints --------
# (No mftool logic, just database; leave unchanged unless you did analytics within.)
@app.post("/api/save-user")
async def save_user(user: Dict[str, Any]):
    user_id = user.get("sub")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID (sub) is required")
    result = users_collection.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "email": user.get("email"),
            "given_name": user.get("given_name"),
            "family_name": user.get("family_name"),
            "name": user.get("name"),
            "picture": user.get("picture"),
            "last_login": user.get("updated_at"),
        }},
        upsert=True
    )
    return {"message": "User saved successfully", "modified_count": result.modified_count}

@app.get("/api/get-user/{user_id}")
async def get_user(user_id: str):
    user_data = users_collection.find_one({"user_id": user_id})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    user_data.pop("_id", None)
    return user_data

@app.post("/api/add-to-portfolio")
async def add_to_portfolio(item: Dict[str, Any]):
    user_id = item.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    existing_item = portfolio_collection.find_one({
        "user_id": user_id,
        "item_type": item.get("item_type"),
        "item_id": item.get("item_id")
    })
    if existing_item:
        raise HTTPException(status_code=400, detail="Item already in portfolio")
    result = portfolio_collection.insert_one({
        "user_id": user_id,
        "item_type": item.get("item_type"),
        "item_id": item.get("item_id"),
        "name": item.get("name"),
        "added_at": datetime.now().isoformat()
    })
    return {"message": "Item added to portfolio", "id": str(result.inserted_id)}

@app.delete("/api/remove-from-portfolio/{user_id}/{item_id}")
async def remove_from_portfolio(user_id: str, item_id: str):
    result = portfolio_collection.delete_one({"user_id": user_id, "item_id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in portfolio")
    return {"message": "Item removed from portfolio"}

@app.get("/api/get-portfolio/{user_id}")
async def get_portfolio(user_id: str):
    portfolio_items = list(portfolio_collection.find({"user_id": user_id}))
    for item in portfolio_items:
        item.pop("_id", None)
    return portfolio_items

@app.get("/api/portfolio-summary/{user_id}")
async def get_portfolio_summary(user_id: str):
    portfolio_items = list(portfolio_collection.find({"user_id": user_id}))
    if not portfolio_items:
        return {"items": [], "total_latest_nav": 0.0}
    summary_items = []
    total_latest_nav = 0.0
    for item in portfolio_items:
        if item["item_type"] == "mutual_fund":
            navs = fetch_historical_nav(item["item_id"])
            monte_carlo = await get_monte_carlo_prediction(item["item_id"])
            risk = await get_risk_volatility(item["item_id"])
            if navs:
                df = pd.DataFrame(navs)
                df["nav"] = pd.to_numeric(df["nav"], errors="coerce")
                df = df.dropna(subset=["nav"])
                latest_nav = float(df["nav"].iloc[-1])
                one_year_ago_idx = max(0, len(df) - 252)
                one_year_ago_nav = float(df["nav"].iloc[one_year_ago_idx])
                one_year_growth = ((latest_nav - one_year_ago_nav) / one_year_ago_nav * 100) if one_year_ago_nav > 0 else "N/A"
                total_latest_nav += latest_nav
            else:
                latest_nav = "N/A"
                one_year_growth = "N/A"
            summary_items.append({
                "name": item["name"],
                "type": item["item_type"],
                "latest_nav": latest_nav,
                "one_year_growth": one_year_growth,
                "monte_carlo": {
                    "expected_nav": monte_carlo.get("expected_nav", "N/A"),
                    "probability_positive": monte_carlo.get("probability_positive_return", "N/A"),
                } if monte_carlo else "N/A",
                "risk_volatility": {
                    "volatility": risk.get("annualized_volatility", "N/A"),
                    "sharpe_ratio": risk.get("sharpe_ratio", "N/A")
                } if risk else "N/A",
            })
        else:
            summary_items.append({
                "name": item["name"],
                "type": item["item_type"],
                "latest_nav": "N/A",
                "one_year_growth": "N/A",
                "monte_carlo": "N/A",
                "risk_volatility": "N/A",
            })
    return {"items": summary_items, "total_latest_nav": total_latest_nav}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
