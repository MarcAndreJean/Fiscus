"""Date helpers.

Stored dates are ISO strings compared by prefix (``"2025"`` or ``"2025-06"``).
Creation timestamps are naive UTC ISO strings. A stored date may also be a plain date or
end in ``Z``; ``within_dates`` matches them all.
"""

from datetime import UTC, date, datetime, timedelta
from typing import Any

from boto3.dynamodb.conditions import Attr, ConditionBase

from fiscus.api import ValidationError
from fiscus.validation import require


def date_prefix(year: Any, month: Any = None) -> str:
    try:
        year_number = int(year)
    except (TypeError, ValueError):
        raise ValidationError("year must be a number") from None
    if month is None or month == "":
        return f"{year_number}"
    try:
        month_number = int(month)
    except (TypeError, ValueError):
        raise ValidationError("month must be a number from 1 to 12") from None
    if not 1 <= month_number <= 12:
        raise ValidationError("month must be a number from 1 to 12")
    return f"{year_number}-{month_number:02d}"


def _plain_date(data: dict, field: str) -> date:
    value = data[field]
    try:
        parsed = date.fromisoformat(value)
    except (TypeError, ValueError):
        parsed = None
    # fromisoformat also accepts "20250101"; only "2025-01-01" is allowed.
    if parsed is None or parsed.isoformat() != value:
        raise ValidationError(f"{field} must be a date (YYYY-MM-DD)")
    return parsed


def date_range(data: dict) -> tuple[str, str]:
    """``(fromDate, toDate)`` from a report request: two ``YYYY-MM-DD`` dates, in order."""
    require(data, "fromDate", "toDate")
    if _plain_date(data, "fromDate") > _plain_date(data, "toDate"):
        raise ValidationError("fromDate must be on or before toDate")
    return data["fromDate"], data["toDate"]


def within_dates(field: str, from_date: str, to_date: str) -> ConditionBase:
    """Scan filter for ``field`` from the start of ``from_date`` to the end of ``to_date``.

    Stored values carry a time (``"2025-12-31T10:00:00.000"``), which sorts after
    ``"2025-12-31"``; comparing with the next day keeps the whole last day.
    """
    last_day = date.fromisoformat(to_date)
    if last_day == date.max:  # no next day to compare with: nothing comes later anyway
        return Attr(field).gte(from_date)
    day_after = (last_day + timedelta(days=1)).isoformat()
    return Attr(field).gte(from_date) & Attr(field).lt(day_after)


def utc_now_iso() -> str:
    return datetime.now(UTC).replace(tzinfo=None).isoformat()
