from app.schemas.threat_event import ThreatEvent


def test_threat_event_schema_accepts_minimal_worker_payload() -> None:
    event = ThreatEvent(
        event_id="evt-1",
        correlation_id="corr-1",
        user_id="user-1",
        origin_ip="127.0.0.1",
        payload_text="hello",
        burst_velocity=0.0,
        target_recipient_ratio=0.0,
        uri_hyperlink_density=0.0,
        session_dwell_duration=0.0,
    )

    assert event.payload_text == "hello"
