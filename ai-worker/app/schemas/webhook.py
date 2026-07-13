from typing import Any, Dict, Literal, Optional

from pydantic import (
    AwareDatetime,
    BaseModel,
    ConfigDict,
    Field,
)


class WebhookPayload(BaseModel):
    """
    Represents the standardized payload dispatched via callback
    to the Node Gateway upon processing completion.
    """

    model_config = ConfigDict(frozen=True)

    event_id: str = Field(
        ...,
        description="Unique identifier linking back to the original ThreatEvent.",
    )

    event_type: str = Field(
        default="auth_login",
        description="The type of event.",
    )

    correlation_id: str = Field(
        ...,
        description="Trace identifier for tracking.",
    )

    user_id: str = Field(
        ...,
        description="Identifier of the user who triggered the event.",
    )

    risk_score: float = Field(
        ...,
        description="The final computed risk score.",
    )

    action: Literal[
        "ALLOW",
        "MONITOR",
        "SHADOW",
        "BLOCK",
    ] = Field(
        ...,
        description="The enforcement action the Gateway needs to apply.",
    )

    timestamp: AwareDatetime = Field(
        ...,
        description="Timezone-aware timestamp of the webhook dispatch.",
    )

    # Full threat document included so the gateway can write it to
    # security_event_logs as a guaranteed fallback if the AI worker's
    # own MongoDB write failed silently.
    threat_document: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Full security_event_log document for gateway-side persistence fallback.",
    )