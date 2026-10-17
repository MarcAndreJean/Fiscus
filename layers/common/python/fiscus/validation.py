"""Request validation: required fields and numeric conversion.

Numbers are converted through ``str`` so a float such as ``0.1`` becomes
``Decimal("0.1")`` (DynamoDB rejects floats, and ``Decimal(0.1)`` keeps binary noise).
"""

import json
from decimal import Decimal, InvalidOperation
from typing import Any

from fiscus.api import ValidationError


def require(data: dict, *fields: str) -> None:
    missing = [f for f in fields if data.get(f) is None or data.get(f) == ""]
    if missing:
        raise ValidationError(f"Missing required field(s): {', '.join(missing)}")


def to_decimal(value: Any, field: str) -> Decimal:
    if isinstance(value, bool):
        raise ValidationError(f"{field} must be a number")
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise ValidationError(f"{field} must be a number") from None
    if not result.is_finite():
        raise ValidationError(f"{field} must be a number")
    return result


def optional_decimal(data: dict, field: str) -> Decimal | None:
    """A number that may be absent or null; stored as null then."""
    value = data.get(field)
    return None if value is None else to_decimal(value, field)


def optional_text(data: dict, field: str) -> str:
    """Free text that may be absent or null; stored as an empty string then."""
    value = data.get(field)
    return "" if value is None else str(value)


def flag(data: dict, field: str) -> bool:
    """A true/false field; "false", 0 or null are rejected rather than guessed."""
    value = data.get(field)
    if not isinstance(value, bool):
        raise ValidationError(f"{field} must be true or false")
    return value


def attachments_json(data: dict) -> dict[str, str]:
    """``images``/``files`` lists as the JSON strings the tables store."""
    return {
        "images": json.dumps(data.get("images") or []),
        "files": json.dumps(data.get("files") or []),
    }
