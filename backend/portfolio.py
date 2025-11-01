import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('portfolio.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS portfolio_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            symbol TEXT NOT NULL,
            name TEXT NOT NULL,
            item_type TEXT NOT NULL,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, symbol)
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Pydantic models
class PortfolioItem(BaseModel):
    symbol: str
    name: str
    item_type: str = "stock"  # "stock" or "mutual_fund"

class PortfolioItemResponse(BaseModel):
    id: int
    symbol: str
    name: str
    item_type: str
    added_at: str

@router.post("/api/portfolio/add/{user_id}", response_model=PortfolioItemResponse)
async def add_to_portfolio(user_id: str, item: PortfolioItem):
    try:
        conn = sqlite3.connect('portfolio.db')
        c = conn.cursor()
        
        # Check if item already exists
        c.execute('SELECT id FROM portfolio_items WHERE user_id = ? AND symbol = ?', 
                 (user_id, item.symbol))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="Item already in portfolio")
        
        # Add new item
        c.execute('''
            INSERT INTO portfolio_items (user_id, symbol, name, item_type)
            VALUES (?, ?, ?, ?)
        ''', (user_id, item.symbol, item.name, item.item_type))
        
        item_id = c.lastrowid
        conn.commit()
        
        # Get the inserted item
        c.execute('SELECT * FROM portfolio_items WHERE id = ?', (item_id,))
        row = c.fetchone()
        conn.close()
        
        return PortfolioItemResponse(
            id=row[0],
            symbol=row[2],
            name=row[3],
            item_type=row[4],
            added_at=row[5]
        )
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/portfolio/{user_id}", response_model=List[PortfolioItemResponse])
async def get_portfolio(user_id: str):
    try:
        conn = sqlite3.connect('portfolio.db')
        c = conn.cursor()
        c.execute('SELECT * FROM portfolio_items WHERE user_id = ?', (user_id,))
        items = c.fetchall()
        conn.close()
        
        return [
            PortfolioItemResponse(
                id=item[0],
                symbol=item[2],
                name=item[3],
                item_type=item[4],
                added_at=item[5]
            )
            for item in items
        ]
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/portfolio/{user_id}/{item_id}")
async def remove_from_portfolio(user_id: str, item_id: int):
    try:
        conn = sqlite3.connect('portfolio.db')
        c = conn.cursor()
        
        # Check if item exists and belongs to user
        c.execute('SELECT id FROM portfolio_items WHERE id = ? AND user_id = ?', 
                 (item_id, user_id))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Item not found in portfolio")
        
        c.execute('DELETE FROM portfolio_items WHERE id = ? AND user_id = ?', 
                 (item_id, user_id))
        conn.commit()
        conn.close()
        
        return {"message": "Item removed successfully"}
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=str(e))