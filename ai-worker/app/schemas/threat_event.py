from datetime import datetime

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
    IPvAnyAddress,
)


class ThreatEvent(BaseModel):
    """
    Represents the incoming RabbitMQ message containing raw telemetry
    and payload data for a specific user action.
    """

    model_config = ConfigDict(
        frozen=True,
        extra="ignore",
    )

    event_id: str = Field(
        ...,
        description="Unique identifier for this specific event.",
    )

    event_type: str = Field(
        default="auth_login",
        description="The type of event (e.g. auth_login, new_post, new_comment).",
    )

    correlation_id: str = Field(
        ...,
        description="Identifier used to trace the event across microservices.",
    )

    user_id: str = Field(
        ...,
        description="Unique identifier of the user who triggered the event.",
    )

    origin_ip: IPvAnyAddress = Field(
        ...,
        description="IPv4 or IPv6 address from which the event originated.",
    )

    payload_text: str = Field(
        ...,
        min_length=1,
        description="The actual text content or payload of the event.",
    )

    burst_velocity: float = Field(
        ...,
        ge=0.0,
        description="Rate of actions taken by the user in a short timeframe.",
    )

    target_recipient_ratio: float = Field(
        ...,
        ge=0.0,
        description="Ratio of targets to recipients used for abuse detection.",
    )

    uri_hyperlink_density: float = Field(
        ...,
        ge=0.0,
        description="Density of hyperlinks contained in the payload.",
    )

    session_dwell_duration: float = Field(
        ...,
        ge=0.0,
        description="Duration (seconds) the user spent in the session.",
    )

    created_at: AwareDatetime = Field(
        default_factory=lambda: datetime.now().astimezone(),
        description="Timezone-aware timestamp when the event occurred.",
    )