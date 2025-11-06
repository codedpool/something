from fastapi import APIRouter, HTTPException, Query
import requests
import pandas as pd
import numpy as np

router = APIRouter(prefix="/api/crypto", tags=["Crypto"])
COINGECKO_BASE = "https://api.coingecko.com/api/v3"


def fetch_top_market_coins(per_page=100, page=1, vs_currency="usd"):
    url = (
        f"{COINGECKO_BASE}/coins/markets"
        f"?vs_currency={vs_currency}&order=market_cap_desc"
        f"&per_page={per_page}&page={page}&sparkline=false"
    )
    r = requests.get(url)
    if r.ok:
        return r.json()
    return []

def fetch_markets_search(query, vs_currency="usd"):
    url = (
        f"{COINGECKO_BASE}/coins/markets?vs_currency={vs_currency}"
        "&order=market_cap_desc&per_page=100&page=1&sparkline=false"
    )
    r = requests.get(url)
    if not r.ok:
        return []
    results = r.json()
    if query:
        results = [
            c for c in results
            if query.lower() in (c.get('id','') + c.get('symbol','') + c.get('name','')).lower()
        ]
        # prioritize exact match
        prioritized = [
            c for c in results if
            c.get('id','').lower() == query.lower() or
            c.get('symbol','').lower() == query.lower() or
            c.get('name','').lower() == query.lower()
        ]
        # remove dups, prioritized first
        seen = set()
        coins = []
        for c in prioritized + results:
            if c['id'] not in seen:
                coins.append(c)
                seen.add(c['id'])
        return coins
    return results

def fetch_coin_market_data(coin_id, vs_currency="usd", days=365):
    url = f"{COINGECKO_BASE}/coins/{coin_id}/market_chart?vs_currency={vs_currency}&days={days}"
    r = requests.get(url)
    if r.ok:
        prices = r.json().get("prices", [])
        df = pd.DataFrame(prices, columns=["timestamp", "price"])
        df["date"] = pd.to_datetime(df["timestamp"], unit="ms")
        df["price"] = pd.to_numeric(df["price"], errors="coerce")
        return df
    return pd.DataFrame([])

def fetch_coin_details(coin_id):
    url = f"{COINGECKO_BASE}/coins/{coin_id}"
    r = requests.get(url)
    if r.ok:
        return r.json()
    return {}

def safeget(d, *path):
    for p in path:
        if isinstance(d, dict):
            d = d.get(p)
        elif isinstance(d, list) and isinstance(p, int):
            d = d[p] if len(d) > p else None
        else:
            return None
        if d is None:
            return None
    return d

# --- Routes ---

@router.get("/coins")
async def get_coins(search: str = ""):
    if not search:
        coins = fetch_top_market_coins(per_page=100)
    else:
        coins = fetch_markets_search(search)
    return [{
        "id": c["id"],
        "symbol": c["symbol"],
        "name": c["name"],
        "image": c.get("image"),
        "current_price": c.get("current_price"),
        "market_cap": c.get("market_cap"),
        "market_cap_rank": c.get("market_cap_rank"),
    } for c in coins][:100]

@router.get("/coin-details/{coin_id}")
async def get_coin_details(coin_id: str):
    # Defensive logging: helpful during debugging and to surface not-found issues
    print(f"DEBUG: get_coin_details received {coin_id}")
    data = fetch_coin_details(coin_id)
    if not data or "error" in data:
        # Optionally log this failure for debugging
        print(f"DEBUG: Coin {coin_id} not found or error in data")
        raise HTTPException(status_code=404, detail="Coin not found")
    market = data.get("market_data", {})
    description = safeget(data, "description", "en")
    return {
        "id": data.get("id"),
        "symbol": data.get("symbol"),
        "name": data.get("name"),
        "description": description if description else "",
        "image": safeget(data, "image", "large"),
        "categories": data.get("categories"),
        "homepage": safeget(data, "links", "homepage", 0),
        "current_price": safeget(market, "current_price", "usd"),
        "market_cap": safeget(market, "market_cap", "usd"),
        "circulating_supply": market.get("circulating_supply"),
        "max_supply": market.get("max_supply"),
        "ath": safeget(market, "ath", "usd"),
        "atl": safeget(market, "atl", "usd"),
        "high_24h": safeget(market, "high_24h", "usd"),
        "low_24h": safeget(market, "low_24h", "usd"),
        "price_change_percentage_1y": safeget(market, "price_change_percentage_1y_in_currency", "usd"),
        "price_change_percentage_24h": safeget(market, "price_change_percentage_24h_in_currency", "usd"),
        "twitter": safeget(data, "links", "twitter_screen_name"),
        "official_forum": safeget(data, "links", "official_forum_url", 0),
        "blockchain_site": safeget(data, "links", "blockchain_site", 0),
    }

@router.get("/historical-price/{coin_id}")
async def get_historical_price(coin_id: str, vs_currency: str = "usd", days: int = 365):
    df = fetch_coin_market_data(coin_id, vs_currency, days)
    if df.empty or "date" not in df.columns:
        return []
    df["date_str"] = df["date"].dt.strftime("%Y-%m-%d")
    return [{"date": row["date_str"], "price": row["price"]} for _, row in df.iterrows()]

@router.get("/performance-heatmap/{coin_id}")
async def get_performance_heatmap(coin_id: str, vs_currency: str = "usd", days: int = 365):
    df = fetch_coin_market_data(coin_id, vs_currency, days)
    if df.empty or "date" not in df.columns:
        return []
    df["dayChange"] = df["price"].pct_change().fillna(0)
    df["month"] = df["date"].dt.month
    heatmap = df.groupby("month")["dayChange"].mean().reset_index()
    heatmap["month"] = heatmap["month"].astype(str)
    return heatmap.to_dict(orient="records")

@router.get("/risk-volatility/{coin_id}")
async def get_risk_volatility(coin_id: str, vs_currency: str = "usd", days: int = 365):
    df = fetch_coin_market_data(coin_id, vs_currency, days)
    if df.empty or "date" not in df.columns:
        return {
            "annualized_volatility": 0.0,
            "annualized_return": 0.0,
            "sharpe_ratio": 0.0,
            "returns": []
        }
    df["returns"] = df["price"].pct_change()
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

@router.get("/monte-carlo-prediction/{coin_id}")
async def monte_carlo_prediction(coin_id: str, vs_currency: str = "usd", num_simulations: int = 1000, days: int = 252):
    df = fetch_coin_market_data(coin_id, vs_currency, 365)
    if not len(df) or len(df) < 50:
        return {"message": "No price data"}
    df["returns"] = df["price"].pct_change()
    df = df.dropna(subset=["returns"])
    mu = df["returns"].mean()
    sigma = df["returns"].std()
    last_price = float(df["price"].iloc[-1])
    simulations = np.zeros((num_simulations, days))
    simulations[:, 0] = last_price
    for t in range(1, days):
        random_returns = np.random.normal(mu, sigma, num_simulations)
        simulations[:, t] = simulations[:, t - 1] * (1 + random_returns)
    expected_price = float(np.mean(simulations[:, -1]))
    prob_positive = float(np.mean(simulations[:, -1] > last_price))
    percentile_5 = float(np.percentile(simulations[:, -1], 5))
    percentile_95 = float(np.percentile(simulations[:, -1], 95))
    return {
        "expected_price": expected_price,
        "probability_positive_return": prob_positive * 100,
        "lower_bound_5th_percentile": percentile_5,
        "upper_bound_95th_percentile": percentile_95,
        "last_price": last_price,
    }

@router.get("/famous")
async def get_famous_coins(vs_currency: str = "usd"):
    famous_ids = [
        "bitcoin", "ethereum", "solana", "binancecoin", "tether", "ripple",
        "cardano", "dogecoin", "tron", "avalanche-2"
        # add/remove IDs as needed
    ]
    url = (
        f"{COINGECKO_BASE}/coins/markets"
        f"?vs_currency={vs_currency}&ids={','.join(famous_ids)}"
        f"&order=market_cap_desc&per_page=10&page=1&sparkline=false"
    )
    r = requests.get(url)
    if not r.ok:
        return []
    coins = r.json()
    return [{
        "id": c["id"],
        "symbol": c["symbol"],
        "name": c["name"],
        "image": c.get("image"),
        "current_price": c.get("current_price"),
        "market_cap": c.get("market_cap"),
        "market_cap_rank": c.get("market_cap_rank"),
    } for c in coins]


@router.get("/compare-prices")
async def compare_prices(coin_ids: str, vs_currency: str = "usd", days: int = 365):
    ids = [c.strip() for c in coin_ids.split(",")]
    comparison_data = {}
    for coin_id in ids:
        df = fetch_coin_market_data(coin_id, vs_currency, days)
        if df.empty or "date" not in df.columns:
            continue
        df["date_str"] = df["date"].dt.strftime("%Y-%m-%d")
        comparison_data[coin_id] = df.set_index("date_str")["price"]
    if comparison_data:
        combined = pd.concat(comparison_data.values(), axis=1, keys=comparison_data.keys()).reset_index()
        combined.columns = ["date"] + [f"{cid}_price" for cid in comparison_data.keys()]
        return combined.fillna("").astype(str).to_dict(orient="records")
    return []