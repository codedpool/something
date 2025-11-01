from fastapi import APIRouter, HTTPException
import requests
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/mutual", tags=["Mutual Funds"])

MFAPI_BASE_URL = "https://api.mfapi.in"

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

@router.get("/schemes")
async def get_schemes(search: str = ""):
    all_schemes = fetch_all_schemes()
    if search:
        filtered = {code: name for code, name in all_schemes.items() if search.lower() in name.lower()}
        return filtered if filtered else {}
    return all_schemes

@router.get("/scheme-details/{scheme_code}")
async def get_scheme_details(scheme_code: str):
    return fetch_scheme_details(scheme_code) or {}

@router.get("/historical-nav/{scheme_code}")
async def get_historical_nav(scheme_code: str):
    return fetch_historical_nav(scheme_code) or []

@router.get("/compare-navs")
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

@router.get("/performance-heatmap/{scheme_code}")
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

@router.get("/risk-volatility/{scheme_code}")
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
    risk_free_rate = 0.06
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

@router.get("/monte-carlo-prediction/{scheme_code}")
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
