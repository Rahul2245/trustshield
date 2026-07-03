from typing import Literal

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