import json
from functools import lru_cache
from importlib import resources
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import ObdCode
from app.schemas import CodeSearchResult
from app.utils.code_normalizer import is_valid_obd_code, normalize_obd_code


HEX_DIGITS = "0123456789ABCDEF"
SYSTEM_CODES = "PCBU"
ORIGIN_DIGITS = "0123"
REFERENCE_CODE_COUNT = len(SYSTEM_CODES) * len(ORIGIN_DIGITS) * len(HEX_DIGITS) ** 3


def iter_curated_code_payloads() -> list[dict[str, Any]]:
    return list(_curated_by_code().values())


def to_model_payload(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "code": item["code"],
        "title": item["title"],
        "explanation": item["explanation"],
        "urgency": item["urgency"],
        "drive_safety": item["drive_safety"],
        "likely_causes": json.dumps(item["likely_causes"]),
        "repair_paths": json.dumps(item["repair_paths"]),
        "cost_range": item["cost_range"],
        "mechanic_questions": json.dumps(item["mechanic_questions"]),
        "category": item.get("category", "general"),
    }


def ensure_reference_code(db: Session, code: str) -> ObdCode | None:
    normalized = normalize_obd_code(code)
    existing = db.get(ObdCode, normalized)
    if existing:
        return existing

    payload = get_reference_payload(normalized)
    if not payload:
        return None

    code_data = ObdCode(**to_model_payload(payload))
    db.add(code_data)
    db.flush()
    return code_data


def get_reference_payload(code: str) -> dict[str, Any] | None:
    normalized = normalize_obd_code(code)
    if not is_valid_obd_code(normalized):
        return None

    curated = _curated_by_code().get(normalized)
    if curated:
        return curated
    return _generate_payload(normalized)


def search_reference_codes(q: str | None, db: Session, limit: int = 50) -> list[CodeSearchResult]:
    results: list[CodeSearchResult] = []
    seen: set[str] = set()
    query = db.query(ObdCode)
    if q:
        stripped = q.strip()
        term = f"%{stripped.upper()}%"
        query = query.filter(or_(ObdCode.code.like(term), ObdCode.title.like(f"%{stripped}%")))

    for row in query.order_by(ObdCode.code.asc()).limit(limit).all():
        results.append(CodeSearchResult.model_validate(row))
        seen.add(row.code)

    if len(results) >= limit:
        return results

    for payload in iter_reference_payloads(q):
        if payload["code"] in seen:
            continue
        results.append(_search_result_from_payload(payload))
        seen.add(payload["code"])
        if len(results) >= limit:
            break
    return results


def iter_reference_payloads(q: str | None = None):
    normalized_query = normalize_obd_code(q or "")
    text_query = (q or "").strip().lower()
    for code in _iter_candidate_codes(normalized_query):
        payload = get_reference_payload(code)
        if not payload:
            continue
        if text_query and text_query not in payload["code"].lower() and text_query not in payload["title"].lower():
            continue
        yield payload


def _iter_candidate_codes(prefix: str):
    prefix = prefix.upper()
    if prefix and any(char not in f"{SYSTEM_CODES}{ORIGIN_DIGITS}{HEX_DIGITS}" for char in prefix):
        return

    for system in SYSTEM_CODES:
        if prefix and not system.startswith(prefix[0]):
            continue
        for origin in ORIGIN_DIGITS:
            head = f"{system}{origin}"
            if prefix and not _can_match_prefix(head, prefix):
                continue
            for family in HEX_DIGITS:
                family_head = f"{head}{family}"
                if prefix and not _can_match_prefix(family_head, prefix):
                    continue
                for high in HEX_DIGITS:
                    high_head = f"{family_head}{high}"
                    if prefix and not _can_match_prefix(high_head, prefix):
                        continue
                    for low in HEX_DIGITS:
                        code = f"{high_head}{low}"
                        if not prefix or code.startswith(prefix):
                            yield code


def _can_match_prefix(candidate: str, prefix: str) -> bool:
    compare_len = min(len(candidate), len(prefix))
    return candidate[:compare_len] == prefix[:compare_len]


def _generate_payload(code: str) -> dict[str, Any]:
    templates = _templates()
    system = code[0]
    origin = code[1]
    family = code[2]
    family_key = f"{system}{family}"
    category, family_title = templates["family_templates"].get(family_key) or templates["family_templates"][system]
    defaults = templates["category_defaults"][category]
    system_name = templates["systems"][system]
    origin_label = templates["origins"][origin]
    title = f"{origin_label} {system_name} {family_title}"
    explanation = (
        f"{code} is a {origin_label.lower()} {system_name.lower()} diagnostic trouble code in the "
        f"{family_title.lower()} family. PitWise has general guidance for this code family, but the exact "
        "component test can vary by year, make, model, engine, and module. Use this as mechanic-prep guidance "
        "and ask the shop to confirm the fault with scan data and pinpoint tests."
    )
    return {
        "code": code,
        "title": title[:180],
        "explanation": explanation,
        "urgency": defaults["urgency"],
        "drive_safety": defaults["drive_safety"],
        "likely_causes": defaults["likely_causes"],
        "repair_paths": defaults["repair_paths"],
        "cost_range": defaults["cost_range"],
        "mechanic_questions": defaults["mechanic_questions"],
        "category": category,
    }


def _search_result_from_payload(payload: dict[str, Any]) -> CodeSearchResult:
    return CodeSearchResult(
        code=payload["code"],
        title=payload["title"],
        urgency=payload["urgency"],
        drive_safety=payload["drive_safety"],
    )


@lru_cache
def _curated_by_code() -> dict[str, dict[str, Any]]:
    with resources.files("app.data").joinpath("obd_curated_codes.json").open(encoding="utf-8") as file:
        items = json.load(file)
    return {item["code"]: item for item in items}


@lru_cache
def _templates() -> dict[str, Any]:
    with resources.files("app.data").joinpath("obd_reference_templates.json").open(encoding="utf-8") as file:
        return json.load(file)
