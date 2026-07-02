import aio_pika
from aio_pika import Connection, Channel

from typing import Optional

from app.config.settings import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class RabbitMQManager:
    """
    Manages the RabbitMQ connection lifecycle for the AI Worker.

    Responsibilities:
    - Establish a robust RabbitMQ connection.
    - Create and configure an AMQP channel.
    - Apply Quality of Service (QoS).
    - Gracefully close the connection during shutdown.
    - Expose connection health status.

    This class intentionally contains no message processing logic.
    """

    def __init__(self) -> None:
        self._connection: Optional[Connection] = None
        self._channel: Optional[Channel] = None

    @property
    def connection(self) -> Optional[Connection]:
        """
        Return the active RabbitMQ connection.
        """
        return self._connection  

    @property
    def channel(self) -> Optional[Channel]:
        """
        Return the active RabbitMQ channel.
        """
        return self._channel  
    
    async def connect(self) -> None:
        """
        Establish a robust connection to RabbitMQ, create a channel,
        and configure Quality of Service (QoS).
        """
        if self._connection and not self._connection.is_closed:
            logger.warning("RabbitMQ connection is already established.")
            return

        try:
            logger.info("Initializing RabbitMQ connection...")

            self._connection = await aio_pika.connect_robust(
                url=str(settings.AMQP_URL)
            )

            self._channel = await self._connection.channel()

            await self._channel.set_qos(
                prefetch_count=settings.PREFETCH_COUNT
            )

            logger.info(
                "Successfully connected to RabbitMQ and configured QoS."
            )

        except Exception:
            logger.exception("Failed to establish RabbitMQ connection.")
            self._connection = None
            self._channel = None
            raise

    async def disconnect(self) -> None:
        """
        Gracefully close the RabbitMQ channel and connection.
        """
        logger.info("Shutting down RabbitMQ connection...")

        try:
            if self._channel and not self._channel.is_closed:
                await self._channel.close()

            if self._connection and not self._connection.is_closed:
                await self._connection.close()

            logger.info("RabbitMQ connection closed successfully.")

        except Exception:
            logger.exception("Error occurred while disconnecting RabbitMQ.")

        finally:
            self._channel = None
            self._connection = None

    def health_check(self) -> bool:
        """
        Verify the health of the RabbitMQ connection.

        Returns:
            True if both the connection and channel are active.
        """
        return (
            self._connection is not None
            and not self._connection.is_closed
            and self._channel is not None
            and not self._channel.is_closed
        )


# Singleton instance used across the application
rabbitmq = RabbitMQManager()