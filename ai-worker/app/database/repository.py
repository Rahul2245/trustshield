"""MongoDB repository layer for security event persistence."""

from __future__ import annotations

from typing import Any

from app.config.settings import settings
from app.core.logging import get_logger
from app.database.mongodb import mongodb

logger = get_logger(__name__)


class SecurityLogRepository:
    """CRUD operations for unified threat matrix documents."""

    @property
    def _collection(self):
        return mongodb.security_logs_collection

    async def insert_threat_log(self, document: dict[str, Any]) -> str:
        if not mongodb.is_connected:
            raise RuntimeError("MongoDB is not connected.")
        result = await self._collection.insert_one(document)
        logger.debug("Persisted threat log with id=%s.", result.inserted_id)
        return str(result.inserted_id)

    async def find_by_event_id(self, event_id: str) -> dict[str, Any] | None:
        if not mongodb.is_connected:
            return None
        return await self._collection.find_one(
            {"threat_matrix.event_id": event_id},
            projection={"_id": 0},
        )

    async def find_by_correlation_id(
        self,
        correlation_id: str,
        *,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        if not mongodb.is_connected:
            return []
        cursor = self._collection.find(
            {"threat_matrix.correlation_id": correlation_id},
            projection={"_id": 0},
        ).sort("created_at", -1).limit(limit)
        return await cursor.to_list(length=limit)

    async def count_documents(self) -> int:
        if not mongodb.is_connected:
            return 0
        return await self._collection.count_documents({})


security_log_repository = SecurityLogRepository()
