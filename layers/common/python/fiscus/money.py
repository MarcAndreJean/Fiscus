"""Money fields and math.

Every expense or income carries the same taxed amounts (subtotal, TPS, TVQ, total).
The deductible part of a business expense is ``amount * percentage / 100`` rounded down
to the cent, so the deduction never exceeds what was paid.
"""

from decimal import ROUND_DOWN, Decimal
from typing import Any

from fiscus.api import ValidationError
from fiscus.validation import flag, to_decimal

TAXED_AMOUNT_FIELDS = ("subtotal", "hasTps", "hasTvq", "tps", "tvq", "total")

_CENT = Decimal("0.01")


def taxed_amounts(data: dict) -> dict[str, Any]:
    return {
        "subtotal": to_decimal(data["subtotal"], "subtotal"),
        "hasTps": flag(data, "hasTps"),
        "hasTvq": flag(data, "hasTvq"),
        "tps": to_decimal(data["tps"], "tps"),
        "tvq": to_decimal(data["tvq"], "tvq"),
        "total": to_decimal(data["total"], "total"),
    }


def deductible_percentage(data: dict) -> Decimal:
    """``deductiblePercentage`` as a Decimal from 0 to 100 (a 400 otherwise)."""
    percentage = to_decimal(data["deductiblePercentage"], "deductiblePercentage")
    if not 0 <= percentage <= 100:
        raise ValidationError("deductiblePercentage must be from 0 to 100")
    return percentage


def deductible_amounts(amounts: dict[str, Any], percentage: Any) -> dict[str, Decimal]:
    """The deductible part of the ``taxed_amounts`` result, for ``percentage`` from 0 to 100."""
    rate = Decimal(str(percentage)) / 100

    def part(amount: Decimal) -> Decimal:
        return (amount * rate).quantize(_CENT, rounding=ROUND_DOWN)

    return {
        "deductibleSubtotal": part(amounts["subtotal"]),
        "deductibleTps": part(amounts["tps"]),
        "deductibleTvq": part(amounts["tvq"]),
        "deductibleTotal": part(amounts["total"]),
    }
