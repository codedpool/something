from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize MongoDB client
try:
    client = MongoClient(os.getenv('MONGODB_URI'))
    db = client.portfolio_db  # Use a database named portfolio_db
    collection = db.portfolio_items  # Use a collection named portfolio_items
    
    # Create indexes for efficient querying
    collection.create_index([("user_id", 1), ("symbol", 1)], unique=True)
    logger.info("MongoDB connection established successfully")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {str(e)}")
    raise

router = APIRouter()

# Pydantic models
class PortfolioItem(BaseModel):
    symbol: str
    name: str
    item_type: str = "stock"  # "stock" or "mutual_fund"

class PortfolioItemResponse(BaseModel):
    id: str  # MongoDB uses string IDs
    symbol: str
    name: str
    item_type: str
    added_at: str

@router.post("/api/portfolio/add/{user_id}", response_model=PortfolioItemResponse)
async def add_to_portfolio(user_id: str, item: PortfolioItem):
    logger.info(f"Attempting to add item to portfolio for user {user_id}: {item}")
    try:
        # Check if item already exists
        existing_item = collection.find_one({
            "user_id": user_id,
            "symbol": item.symbol
        })
        
        if existing_item:
            logger.warning(f"Item {item.symbol} already exists in portfolio for user {user_id}")
            raise HTTPException(status_code=400, detail="Item already in portfolio")
        
        # Add new item
        new_item = {
            "user_id": user_id,
            "symbol": item.symbol,
            "name": item.name,
            "item_type": item.item_type,
            "added_at": datetime.datetime.utcnow().isoformat()
        }
        
        result = collection.insert_one(new_item)
        
        # Get the inserted item
        inserted_item = collection.find_one({"_id": result.inserted_id})
        
        if not inserted_item:
            logger.error(f"Failed to retrieve inserted item with id {result.inserted_id}")
            raise HTTPException(status_code=500, detail="Failed to retrieve inserted item")
        
        return PortfolioItemResponse(
            id=str(inserted_item["_id"]),
            symbol=inserted_item["symbol"],
            name=inserted_item["name"],
            item_type=inserted_item["item_type"],
            added_at=inserted_item["added_at"]
        )
        
    except Exception as e:
        logger.error(f"Error adding item to portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/portfolio/{user_id}", response_model=List[PortfolioItemResponse])
async def get_portfolio(user_id: str):
    logger.info(f"Fetching portfolio for user {user_id}")
    try:
        items = list(collection.find({"user_id": user_id}))
        
        return [
            PortfolioItemResponse(
                id=str(item["_id"]),
                symbol=item["symbol"],
                name=item["name"],
                item_type=item["item_type"],
                added_at=item["added_at"]
            )
            for item in items
        ]
    except Exception as e:
        logger.error(f"Error fetching portfolio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api/portfolio/{user_id}/{item_id}")
async def remove_from_portfolio(user_id: str, item_id: str):
    logger.info(f"Attempting to remove item {item_id} for user {user_id}")
    try:
        from bson.objectid import ObjectId
        
        # Convert string ID to MongoDB ObjectId
        try:
            obj_id = ObjectId(item_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid item ID format")
        
        # Check if item exists and belongs to user
        result = collection.delete_one({
            "_id": obj_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            logger.warning(f"Item {item_id} not found in portfolio for user {user_id}")
            raise HTTPException(status_code=404, detail="Item not found in portfolio")
        
        logger.info(f"Successfully removed item {item_id}")
        return {"message": "Item removed successfully"}
    except Exception as e:
        logger.error(f"Error removing item from portfolio: {str(e)}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))