import aio_pika
from aio_pika import Channel, Connection, ExchangeType

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
    - Declare the direct exchange, primary queue, and dead-letter queue.
    - Apply Quality of Service (QoS).
    - Gracefully close the connection during shutdown.
    - Expose connection health status.
    """

    def __init__(self) -> None:
        self._connection: Optional[Connection] = None
        self._channel: Optional[Channel] = None

    @property
    def connection(self) -> Optional[Connection]:
        return self._connection

    @property
    def channel(self) -> Optional[Channel]:
        return self._channel

    async def connect(self) -> None:
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

            await self._declare_topology()

            logger.info(
                "Successfully connected to RabbitMQ and configured QoS."
            )

        except Exception:
            logger.exception("Failed to establish RabbitMQ connection.")
            self._connection = None
            self._channel = None
            raise

    async def _declare_topology(self) -> None:
        if self._channel is None:
            raise RuntimeError("RabbitMQ channel is not initialized.")

        exchange = await self._channel.declare_exchange(
            settings.EXCHANGE_NAME,
            ExchangeType.DIRECT,
            durable=True,
        )

        dlq = await self._channel.declare_queue(
            settings.DLQ_QUEUE_NAME,
            durable=True,
        )

        queue = await self._channel.declare_queue(
            settings.QUEUE_NAME,
            durable=True,
            arguments={
                "x-dead-letter-exchange": "",
                "x-dead-letter-routing-key": settings.DLQ_QUEUE_NAME,
            },
        )

        await queue.bind(exchange, routing_key=settings.ROUTING_KEY)
        logger.info(
            "Declared exchange=%s queue=%s dlq=%s.",
            settings.EXCHANGE_NAME,
            settings.QUEUE_NAME,
            settings.DLQ_QUEUE_NAME,
        )

    async def disconnect(self) -> None:
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
        return (
            self._connection is not None
            and not self._connection.is_closed
            and self._channel is not None
            and not self._channel.is_closed
        )


rabbitmq = RabbitMQManager()
