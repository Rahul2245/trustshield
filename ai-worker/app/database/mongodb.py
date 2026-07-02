from typing import Optional

from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorCollection,
    AsyncIOMotorDatabase,
)

from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class MongoDBManager:
    """
    Manages the lifecycle of the MongoDB connection pool.

    Responsibilities:
    - Establish the MongoDB connection pool.
    - Verify connectivity.
    - Gracefully close the connection.
    - Provide access to the application database and collections.

    This class intentionally contains no business logic.
    """

    def __init__(self) -> None:
        self._client: Optional[AsyncIOMotorClient] = None
        self._database: Optional[AsyncIOMotorDatabase] = None

    async def connect(self) -> None:
        """
        Initialize the MongoDB connection pool and verify connectivity.
        """
        if self._client is not None:
            logger.warning("MongoDB connection is already initialized.")
            return

        try:
            logger.info("Initializing MongoDB connection pool...")

            self._client = AsyncIOMotorClient(
                str(settings.MONGO_URI),
                maxPoolSize=50,
                minPoolSize=5,
                maxIdleTimeMS=30000,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
                retryWrites=True,
            )

            # Verify connection
            await self._client.admin.command("ping")

            # Cache database reference
            self._database = self._client[settings.DATABASE_NAME]

            logger.info(
                "Successfully connected to MongoDB database '%s'.",
                settings.DATABASE_NAME,
            )

            # Future:
            # await self.create_indexes()

        except Exception:
            logger.exception("Failed to connect to MongoDB.")
            self._client = None
            self._database = None
            raise

    async def disconnect(self) -> None:
        """
        Close the MongoDB connection pool.
        """
        if self._client is None:
            logger.warning("MongoDB disconnect called with no active connection.")
            return

        logger.info("Closing MongoDB connection pool...")

        self._client.close()

        self._client = None
        self._database = None

        logger.info("MongoDB connection pool closed successfully.")

    async def health_check(self) -> bool:
        """
        Verify database availability.

        Returns:
            True if MongoDB responds to a ping request.
        """
        if self._client is None:
            return False

        try:
            await self._client.admin.command("ping")
            return True
        except Exception:
            logger.exception("MongoDB health check failed.")
            return False

    @property
    def is_connected(self) -> bool:
        """
        Whether a MongoDB client is currently connected.
        """
        return self._client is not None

    @property
    def client(self) -> AsyncIOMotorClient:
        """
        Return the underlying Motor client.
        """
        if self._client is None:
            raise RuntimeError(
                "MongoDB client is not initialized. Call connect() first."
            )

        return self._client

    @property
    def database(self) -> AsyncIOMotorDatabase:
        """
        Return the configured application database.
        """
        if self._database is None:
            raise RuntimeError(
                "MongoDB database is not initialized. Call connect() first."
            )

        return self._database

    def get_collection(self, name: str) -> AsyncIOMotorCollection:
        """
        Return any collection from the configured database.

        Args:
            name: Collection name.

        Returns:
            AsyncIOMotorCollection
        """
        return self.database[name]

    @property
    def security_logs_collection(self) -> AsyncIOMotorCollection:
        """
        Convenience accessor for the security logs collection.
        """
        return self.get_collection(settings.SECURITY_LOG_COLLECTION)


# Global MongoDB manager instance
mongodb = MongoDBManager()