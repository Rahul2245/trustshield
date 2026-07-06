from app.rabbitmq.consumer import ThreatEventConsumer


def test_consumer_coerces_gateway_like_payload() -> None:
    consumer = ThreatEventConsumer()

    event = consumer._coerce_event(
        {
            "eventId": "evt-1",
            "correlationId": "corr-1",
            "userId": "user-1",
            "originIp": "127.0.0.1",
            "payloadText": "urgent login verification",
        }
    )

    assert event.event_id == "evt-1"
    assert event.correlation_id == "corr-1"
    assert event.payload_text == "urgent login verification"
