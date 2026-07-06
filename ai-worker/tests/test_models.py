from app.ai.fusion_engine import fusion_engine
from app.ai.model_loader import model_loader
from app.ai.preprocessing import preprocessor


def test_preprocessor_normalizes_text() -> None:
    assert preprocessor.clean_text("Hello <b>WORLD</b> https://x.test 123!") == "hello world"


def test_fusion_engine_returns_allow_for_low_scores() -> None:
    result = fusion_engine.fuse(nlp_risk_score=10.0, if_risk_score=10.0)

    assert result.decision == "ALLOW"
    assert result.risk_level == "LOW"


def test_model_loader_health_reports_artifacts() -> None:
    health = model_loader.health()

    assert "artifacts" in health
    assert "tfidf" in health["artifacts"]
