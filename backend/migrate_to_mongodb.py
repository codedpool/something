import sqlite3
from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_to_mongodb():
    # Load environment variables
    load_dotenv()
    
    try:
        # Connect to MongoDB
        client = MongoClient(os.getenv('MONGODB_URI'))
        db = client.portfolio_db
        collection = db.portfolio_items
        
        # Connect to SQLite
        conn = sqlite3.connect('portfolio.db')
        c = conn.cursor()
        
        # Get all items from SQLite
        c.execute('SELECT * FROM portfolio_items')
        items = c.fetchall()
        
        # Migrate each item
        for item in items:
            try:
                # Convert SQLite row to MongoDB document
                doc = {
                    "user_id": item[1],
                    "symbol": item[2],
                    "name": item[3],
                    "item_type": item[4],
                    "added_at": item[5]
                }
                
                # Insert into MongoDB
                collection.update_one(
                    {
                        "user_id": doc["user_id"],
                        "symbol": doc["symbol"]
                    },
                    {"$setOnInsert": doc},
                    upsert=True
                )
                
                logger.info(f"Migrated item: {doc['symbol']} for user: {doc['user_id']}")
            except Exception as e:
                logger.error(f"Error migrating item {item}: {str(e)}")
        
        logger.info(f"Migration completed. Migrated {len(items)} items.")
        
    except Exception as e:
        logger.error(f"Migration failed: {str(e)}")
    finally:
        conn.close()
        client.close()

if __name__ == "__main__":
    migrate_to_mongodb()