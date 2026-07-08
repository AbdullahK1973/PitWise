import json
import re
from dataclasses import dataclass

from app.models import ObdCode


TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
MIN_MATCH_SCORE = 3
STOPWORDS = {
    "a",
    "an",
    "and",
    "but",
    "car",
    "happening",
    "issue",
    "it",
    "my",
    "no",
    "sometimes",
    "strange",
    "the",
    "there",
    "thing",
    "vehicle",
    "with",
}

SYMPTOM_KEYWORDS: dict[str, set[str]] = {
    "engine": {
        "check",
        "engine",
        "flash",
        "flashes",
        "flashing",
        "hesitate",
        "hesitation",
        "idle",
        "light",
        "misfire",
        "misfires",
        "rough",
        "shake",
        "shakes",
        "shaking",
        "stall",
        "stalls",
        "stop",
        "stopped",
        "stoplight",
        "stoplights",
        "vibrate",
        "vibrates",
        "vibration",
    },
    "emissions": {"catalytic", "converter", "emissions", "exhaust", "smell", "fuel", "gas", "cap", "evap", "leak", "readiness"},
    "fuel_air": {"lean", "vacuum", "air", "maf", "fuel", "surge", "hiss", "whistle", "stumble", "intake"},
    "cooling": {"coolant", "temperature", "thermostat", "heat", "heater", "cold", "warm", "overheat", "overheating"},
    "sensor": {"sensor", "temperature", "connector", "wiring", "intake", "iat", "unplugged"},
    "engine_timing": {"oil", "timing", "camshaft", "rattle", "sludge", "vvt", "solenoid", "startup"},
    "drivetrain": {"speedometer", "speed", "abs", "traction", "shift", "shifting", "wheel"},
    "transmission": {"transmission", "gear", "shift", "slip", "slipping", "limp", "fluid", "jerk"},
}

CODE_KEYWORDS: dict[str, set[str]] = {
    "P0300": {"multiple", "random", "many", "all"},
    "P0301": {"cylinder", "1", "one"},
    "P0302": {"cylinder", "2", "two"},
    "P0420": {"catalytic", "converter", "rotten", "egg", "sulfur", "exhaust"},
    "P0455": {"large", "gas", "cap", "fuel", "smell", "evap"},
    "P0442": {"small", "gas", "cap", "evap"},
    "P0128": {"thermostat", "cold", "heater", "warm", "temperature"},
    "P0113": {"iat", "intake", "air", "temperature"},
    "P0010": {"actuator", "circuit", "vvt", "solenoid", "wiring"},
    "P0011": {"advanced", "timing", "oil", "rattle", "sludge"},
    "P0021": {"bank", "2", "two", "advanced", "timing"},
    "P0500": {"speedometer", "vehicle", "speed", "abs"},
    "P0700": {"transmission", "gear", "shift", "limp", "slip"},
    "P0141": {"oxygen", "o2", "heater", "downstream", "sensor"},
    "P0171": {"lean", "vacuum", "hiss", "maf", "fuel", "stumble"},
}


@dataclass(frozen=True)
class SymptomMatch:
    code_data: ObdCode
    note: str


class SymptomMatcher:
    def match(self, codes: list[ObdCode], description: str) -> SymptomMatch | None:
        tokens = set(TOKEN_PATTERN.findall(description.lower())) - STOPWORDS
        if not tokens:
            return None

        scored = [(self._score(code_data, tokens), code_data) for code_data in codes]
        scored = [(score, code_data) for score, code_data in scored if score >= MIN_MATCH_SCORE]
        if not scored:
            return None

        scored.sort(key=lambda item: (-item[0], item[1].code))
        best_score, best_code = scored[0]
        note = (
            f"Based on your description, PitWise matched this to {best_code.code} as the closest OBD2 pattern. "
            "Treat it as a starting point and confirm with a scan when possible."
        )
        if len(scored) > 1 and scored[1][0] >= best_score - 1:
            note += f" A nearby possibility is {scored[1][1].code}, so related codes matter."
        return SymptomMatch(code_data=best_code, note=note)

    def _score(self, code_data: ObdCode, tokens: set[str]) -> int:
        text_tokens = self._code_tokens(code_data)
        score = len(tokens & text_tokens)
        score += 3 * len(tokens & SYMPTOM_KEYWORDS.get(code_data.category, set()))
        score += 4 * len(tokens & CODE_KEYWORDS.get(code_data.code, set()))
        return score

    def _code_tokens(self, code_data: ObdCode) -> set[str]:
        likely_causes = " ".join(json.loads(code_data.likely_causes))
        repair_paths = " ".join(json.loads(code_data.repair_paths))
        source_text = f"{code_data.title} {code_data.explanation} {likely_causes} {repair_paths} {code_data.category}"
        return set(TOKEN_PATTERN.findall(source_text.lower()))
