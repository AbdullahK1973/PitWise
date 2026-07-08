import re


CODE_PATTERN = re.compile(r"^[PCBU][0-3][0-9A-F]{3}$")


def normalize_obd_code(raw_code: str) -> str:
    return raw_code.strip().upper().replace(" ", "")


def is_valid_obd_code(raw_code: str) -> bool:
    return bool(CODE_PATTERN.match(normalize_obd_code(raw_code)))
