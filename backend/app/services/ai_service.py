import json

from app.config import get_settings
from app.models import ObdCode
from app.schemas import DiagnosisResponse


SAFETY_CATEGORIES = {"brakes", "cooling", "oil_pressure", "charging", "steering", "transmission"}


class DiagnosisGenerator:
    """AI boundary for PitWise.

    Fallback mode is deterministic and seeded. Live mode is intentionally isolated
    so a real LLM provider can be added without changing routes or UI contracts.
    """

    def __init__(self) -> None:
        self.settings = get_settings()

    def generate(self, code_data: ObdCode, symptoms: str | None = None) -> DiagnosisResponse:
        if self.settings.ai_mode == "live" and self.settings.llm_api_key:
            # The MVP keeps live mode behind this boundary. Add provider-specific
            # code here later and preserve the DiagnosisResponse contract.
            return self._fallback_response(code_data, symptoms, live_requested=True)
        return self._fallback_response(code_data, symptoms)

    def _fallback_response(
        self,
        code_data: ObdCode,
        symptoms: str | None,
        live_requested: bool = False,
    ) -> DiagnosisResponse:
        likely_causes = json.loads(code_data.likely_causes)
        repair_paths = json.loads(code_data.repair_paths)
        mechanic_questions = json.loads(code_data.mechanic_questions)
        urgency = self._conservative_urgency(code_data.urgency, code_data.category)
        safety = self._conservative_safety(code_data.drive_safety, code_data.category, urgency)

        symptoms_note = None
        if symptoms:
            symptoms_note = (
                "You also mentioned symptoms. Share those exact details with the mechanic because they can help "
                "separate a common simple fix from a deeper issue."
            )

        confidence = "This is a likely-direction guide based on the code and common repair patterns, not proof of a failed part."
        if live_requested:
            confidence += " Live AI mode was requested, but the MVP is using the seeded fallback response until a provider is wired in."

        return DiagnosisResponse(
            code=code_data.code,
            title=code_data.title,
            plain_english_explanation=code_data.explanation,
            urgency=urgency,
            drive_safety_guidance=safety,
            likely_causes=likely_causes,
            common_repair_paths=repair_paths,
            estimated_repair_cost_range=code_data.cost_range,
            mechanic_questions_to_ask=mechanic_questions,
            proof_to_request=self._proof_to_request(code_data.category),
            upsell_watchouts=self._upsell_watchouts(code_data.category),
            before_approving_repairs=self._before_approving(code_data.category),
            confidence_note=confidence,
            disclaimer="PitWise provides guidance and preparation, not a confirmed diagnosis or a replacement for a qualified mechanic.",
            symptoms_note=symptoms_note,
        )

    def _conservative_urgency(self, urgency: str, category: str) -> str:
        if category in SAFETY_CATEGORIES and urgency in {"low", "moderate"}:
            return "high" if category in {"transmission", "oil_pressure", "brakes", "steering"} else "moderate"
        return urgency

    def _conservative_safety(self, drive_safety: str, category: str, urgency: str) -> str:
        if urgency == "critical":
            return "avoid driving"
        if category in SAFETY_CATEGORIES and drive_safety == "safe":
            return "caution"
        return drive_safety

    def _proof_to_request(self, category: str) -> list[str]:
        common = [
            "A scan report showing the code and any related codes",
            "Live data or test results that support the recommendation",
            "Photos of damaged, leaking, or worn parts when visible",
        ]
        if category in {"engine", "engine_timing", "fuel_air"}:
            common.append("Before-and-after data after the repair or test drive")
        if category == "transmission":
            common.append("Transmission module codes, not only the generic P0700 code")
        return common

    def _upsell_watchouts(self, category: str) -> list[str]:
        watchouts = [
            "A costly part is recommended without a test result or visual proof",
            "The shop wants to replace several unrelated parts at once without explaining the order of checks",
            "You are told the code alone proves the part is bad",
        ]
        if category == "emissions":
            watchouts.append("A catalytic converter is recommended before misfires, leaks, or sensor data are checked")
        return watchouts

    def _before_approving(self, category: str) -> list[str]:
        items = [
            "Confirm the exact code and whether there are related codes",
            "Ask what test confirmed the suspected cause",
            "Ask whether the repair is urgent or can be monitored briefly",
            "Request the old part back when practical",
        ]
        if category in SAFETY_CATEGORIES:
            items.insert(0, "Ask whether the vehicle is safe to drive home or should be towed")
        return items
