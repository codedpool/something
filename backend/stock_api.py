from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import pandas as pd
import numpy as np
import yfinance as yf
from typing import List, Optional

router = APIRouter(prefix="/api/stock", tags=["Stock"])

class StockProfile(BaseModel):
    symbol: str
    longName: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    summary: Optional[str] = None

class StockQuote(BaseModel):
    symbol: str
    price: Optional[float]
    open: Optional[float]
    dayHigh: Optional[float]
    dayLow: Optional[float]
    previousClose: Optional[float]
    currency: Optional[str]
    marketCap: Optional[float]
    volume: Optional[int]

class HistoryRow(BaseModel):
    date: str
    open: Optional[float]
    high: Optional[float]
    low: Optional[float]
    close: Optional[float]
    volume: Optional[int]
    returns: Optional[float] = None
    ma20: Optional[float] = None
    ma50: Optional[float] = None

class NewsItem(BaseModel):
    title: str
    publisher: Optional[str] = None
    link: str
    datetime: str

def get_yf_ticker(symbol: str) -> yf.Ticker:
    return yf.Ticker(symbol)

def get_history_df(symbol: str, period="1y", interval="1d") -> pd.DataFrame:
    hist = get_yf_ticker(symbol).history(period=period, interval=interval)
    if hist.empty:
        raise Exception(f"No historical data found for {symbol}")
    hist = hist.reset_index()
    hist['returns'] = hist['Close'].pct_change()
    hist['ma20'] = hist['Close'].rolling(window=20).mean()
    hist['ma50'] = hist['Close'].rolling(window=50).mean()
    return hist

@router.get("/search")
async def search_stock(symbol: str = Query(..., description="e.g. TCS.NS")):
    try:
        stock = get_yf_ticker(symbol)
        info = stock.info
        found = bool(info and 'regularMarketPrice' in info)
        return {
            "found": found,
            "symbol": symbol,
            "longName": info.get("longName"),
            "exchange": info.get("exchange"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
        }
    except Exception:
        return {"found": False}

@router.get("/search-stocks")
async def search_stocks(q: str = Query(..., description="Search query for stocks")):
    """Search for stocks by name or symbol and return multiple results"""
    try:
        # For now, return a curated list of popular stocks that match the query
        popular_stocks = [
            {"symbol": "TCS.NS", "name": "Tata Consultancy Services", "exchange": "NSE"},
            {"symbol": "INFY.NS", "name": "Infosys Ltd", "exchange": "NSE"},
            {"symbol": "RELIANCE.NS", "name": "Reliance Industries", "exchange": "NSE"},
            {"symbol": "HDFCBANK.NS", "name": "HDFC Bank", "exchange": "NSE"},
            {"symbol": "SBIN.NS", "name": "State Bank of India", "exchange": "NSE"},
            {"symbol": "ICICIBANK.NS", "name": "ICICI Bank", "exchange": "NSE"},
            {"symbol": "HINDUNILVR.NS", "name": "Hindustan Unilever", "exchange": "NSE"},
            {"symbol": "MARUTI.NS", "name": "Maruti Suzuki", "exchange": "NSE"},
            {"symbol": "BAJFINANCE.NS", "name": "Bajaj Finance", "exchange": "NSE"},
            {"symbol": "KOTAKBANK.NS", "name": "Kotak Mahindra Bank", "exchange": "NSE"},
            {"symbol": "LT.NS", "name": "Larsen & Toubro", "exchange": "NSE"},
            {"symbol": "ITC.NS", "name": "ITC Ltd", "exchange": "NSE"},
            {"symbol": "AXISBANK.NS", "name": "Axis Bank", "exchange": "NSE"},
            {"symbol": "BHARTIARTL.NS", "name": "Bharti Airtel", "exchange": "NSE"},
            {"symbol": "WIPRO.NS", "name": "Wipro Ltd", "exchange": "NSE"},
        ]

        # Filter stocks based on query
        query_lower = q.lower()
        filtered_stocks = [
            stock for stock in popular_stocks
            if query_lower in stock["name"].lower() or query_lower in stock["symbol"].lower()
        ]

        # Return up to 8 results
        return filtered_stocks[:8]

    except Exception as e:
        print(f"Error in search_stocks: {e}")
        return []

@router.get("/profile/{symbol}", response_model=StockProfile)
async def get_stock_profile(symbol: str):
    try:
        info = get_yf_ticker(symbol).info
        return StockProfile(
            symbol=symbol,
            longName=info.get("longName"),
            sector=info.get("sector"),
            industry=info.get("industry"),
            website=info.get("website"),
            summary=info.get("longBusinessSummary", ""),
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/quote/{symbol}", response_model=StockQuote)
async def get_stock_quote(symbol: str):
    try:
        info = get_yf_ticker(symbol).info
        return StockQuote(
            symbol=symbol,
            price=info.get("regularMarketPrice"),
            open=info.get("regularMarketOpen"),
            dayHigh=info.get("dayHigh"),
            dayLow=info.get("dayLow"),
            previousClose=info.get("regularMarketPreviousClose"),
            currency=info.get("currency"),
            marketCap=info.get("marketCap"),
            volume=info.get("regularMarketVolume"),
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/history/{symbol}", response_model=List[HistoryRow])
async def get_stock_history(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    include_returns: bool = True
):
    try:
        hist = get_history_df(symbol, period, interval)
        hist['date'] = pd.to_datetime(hist['Date']).dt.strftime('%Y-%m-%d')
        rows = []
        for _, r in hist.iterrows():
            row = {
                "date": r["date"],
                "open": r.get("Open"),
                "high": r.get("High"),
                "low": r.get("Low"),
                "close": r.get("Close"),
                "volume": r.get("Volume"),
                "ma20": float(r["ma20"]) if not np.isnan(r["ma20"]) else None,
                "ma50": float(r["ma50"]) if not np.isnan(r["ma50"]) else None
            }
            if include_returns:
                row["returns"] = float(r["returns"]) if not np.isnan(r["returns"]) else None
            rows.append(row)
        return rows
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/risk-volatility/{symbol}")
async def get_stock_risk(symbol: str, period: str="1y", interval: str="1d"):
    try:
        hist = get_history_df(symbol, period, interval)
        annualized_volatility = hist["returns"].std() * (252 ** 0.5)
        annualized_return = (hist["returns"].mean() + 1) ** 252 - 1
        risk_free_rate = 0.06
        sharpe_ratio = ((annualized_return - risk_free_rate) / annualized_volatility) if annualized_volatility > 0 else 0
        returns_list = [
            {"date": row["Date"].strftime("%Y-%m-%d"), "returns": float(row["returns"])}
            for _, row in hist.iterrows() if not np.isnan(row["returns"])
        ]
        return {
            "annualized_volatility": float(annualized_volatility),
            "annualized_return": float(annualized_return),
            "sharpe_ratio": float(sharpe_ratio),
            "returns": returns_list,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")

@router.get("/monte-carlo-prediction/{symbol}")
async def get_stock_monte_carlo(
    symbol: str, num_simulations: int = 1000, days: int = 252
):
    try:
        hist = get_history_df(symbol, period="2y", interval="1d")
        mu = hist["returns"].mean()
        sigma = hist["returns"].std()
        last_price = float(hist["Close"].iloc[-1])
        simulations = np.zeros((num_simulations, days))
        simulations[:, 0] = last_price
        for t in range(1, days):
            random_returns = np.random.normal(mu, sigma, num_simulations)
            simulations[:, t] = simulations[:, t - 1] * (1 + random_returns)
        expected_price = float(np.mean(simulations[:, -1]))
        prob_positive = float(np.mean(simulations[:, -1] > last_price)) * 100
        percentile_5 = float(np.percentile(simulations[:, -1], 5))
        percentile_95 = float(np.percentile(simulations[:, -1], 95))
        return {
            "expected_price": expected_price,
            "probability_positive_return": prob_positive,
            "lower_bound_5th_percentile": percentile_5,
            "upper_bound_95th_percentile": percentile_95,
            "last_price": last_price,
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")
    
@router.get("/list")
async def list_stocks():
    stocks = [
        {"symbol": "TCS.NS", "longName": "Tata Consultancy Services"},
        {"symbol": "INFY.NS", "longName": "Infosys Ltd"},
        {"symbol": "RELIANCE.NS", "longName": "Reliance Industries"},
        {"symbol": "HDFCBANK.NS", "longName": "HDFC Bank"},
        {"symbol": "SBIN.NS", "longName": "State Bank of India"},
        {"symbol": "ICICIBANK.NS", "longName": "ICICI Bank"},
        {"symbol": "HINDUNILVR.NS", "longName": "Hindustan Unilever"},
        {"symbol": "MARUTI.NS", "longName": "Maruti Suzuki"},
        {"symbol": "BAJFINANCE.NS", "longName": "Bajaj Finance"},
        {"symbol": "KOTAKBANK.NS", "longName": "Kotak Mahindra Bank"},
    ]
    return stocks


@router.get("/news/{symbol}", response_model=List[NewsItem])
async def get_stock_news(symbol: str, limit: int = 8):
    try:
        stock = yf.Ticker(symbol)
        news = getattr(stock, "news", [])
        news_items = []
        for i, n in enumerate(news[:limit]):
            title = n.get("title", "")
            publisher = n.get("publisher", "")
            link = n.get("link", "")
            ts = n.get("providerPublishTime", None)
            if ts:
                dt_txt = pd.to_datetime(ts, unit="s").strftime('%Y-%m-%d %H:%M:%S')
            else:
                dt_txt = ""
            news_items.append(NewsItem(
                title=title, publisher=publisher, link=link, datetime=dt_txt
            ))
        return news_items
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Error: {e}")
