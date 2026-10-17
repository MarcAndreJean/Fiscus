"""Tests for the shared fiscus layer (layers/common/python/fiscus)."""

import logging
from decimal import Decimal

import pytest
from botocore.exceptions import ClientError
from fiscus.api import NotFoundError, ValidationError, api_handler, ok
from fiscus.dates import date_prefix, date_range, utc_now_iso, within_dates
from fiscus.dynamo import (
    archive_and_delete,
    delete_or_404,
    get_or_404,
    put_moving_key,
    scan_all,
)
from fiscus.money import deductible_amounts, deductible_percentage, taxed_amounts
from fiscus.validation import (
    attachments_json,
    optional_decimal,
    optional_text,
    require,
    to_decimal,
)
from helpers import make_table
from moto import mock_aws


@pytest.fixture
def table():
    with mock_aws():
        yield make_table("test-Expenses", "invoiceDate")


@pytest.fixture
def archive_table(table):
    return make_table("test-ArchiveExpenses", "archiveDate")


def test_require_lists_every_missing_field():
    with pytest.raises(ValidationError, match=r"Missing required field\(s\): id, year"):
        require({"id": "", "name": "x"}, "id", "name", "year")


def test_require_treats_none_as_missing():
    with pytest.raises(ValidationError, match="name"):
        require({"name": None}, "name")


def test_require_accepts_false_and_zero():
    require({"hasTps": False, "subtotal": 0}, "hasTps", "subtotal")


def test_to_decimal_rejects_text():
    with pytest.raises(ValidationError, match="subtotal must be a number"):
        to_decimal("abc", "subtotal")


def test_to_decimal_keeps_float_digits():
    assert to_decimal(0.1, "tps") == Decimal("0.1")


def test_optional_decimal_keeps_none():
    assert optional_decimal({"amount": None}, "amount") is None
    assert optional_decimal({}, "amount") is None
    assert optional_decimal({"amount": 10.5}, "amount") == Decimal("10.5")


@pytest.mark.parametrize(
    "year,month,expected",
    [
        ("2025", None, "2025"),
        (2025, 6, "2025-06"),
        ("2025", "6", "2025-06"),
        ("2025", "12", "2025-12"),
    ],
)
def test_date_prefix(year, month, expected):
    assert date_prefix(year, month) == expected


@pytest.mark.parametrize("month", ["13", "0", "abc"])
def test_date_prefix_rejects_bad_month(month):
    with pytest.raises(ValidationError):
        date_prefix("2025", month)


def test_date_prefix_rejects_bad_year():
    with pytest.raises(ValidationError):
        date_prefix("twenty")


def test_date_range_returns_both_dates():
    assert date_range({"fromDate": "2025-01-01", "toDate": "2025-12-31"}) == (
        "2025-01-01",
        "2025-12-31",
    )


def test_date_range_rejects_reversed_dates():
    with pytest.raises(ValidationError, match="fromDate must be on or before toDate"):
        date_range({"fromDate": "2025-12-31", "toDate": "2025-01-01"})


@pytest.mark.parametrize(
    "value", ["2025-1-1", "2025-02-30", "20250101", "2025-12-31T10:00:00", "abc", 2025]
)
def test_date_range_rejects_anything_but_a_plain_date(value):
    with pytest.raises(ValidationError, match=r"toDate must be a date \(YYYY-MM-DD\)"):
        date_range({"fromDate": "2025-01-01", "toDate": value})


def test_within_dates_keeps_the_whole_last_day(table):
    stored_dates = [
        "2024-12-31T23:59:59.999",  # before fromDate
        "2025-01-01",
        "2025-01-01T00:00:00.000",
        "2025-12-31",
        "2025-12-31T10:00:00.000",
        "2025-12-31T23:59:59.999Z",
        "2026-01-01T00:00:00.000",  # after toDate
    ]
    for index, invoice_date in enumerate(stored_dates):
        table.put_item(Item={"id": f"i{index}", "invoiceDate": invoice_date})

    items = scan_all(
        table, FilterExpression=within_dates("invoiceDate", "2025-01-01", "2025-12-31")
    )

    assert sorted(item["invoiceDate"] for item in items) == stored_dates[1:-1]


def test_within_dates_handles_month_and_year_ends(table):
    table.put_item(Item={"id": "a", "invoiceDate": "2024-02-29T12:00:00.000"})
    table.put_item(Item={"id": "b", "invoiceDate": "2024-03-01T00:00:00.000"})
    items = scan_all(
        table, FilterExpression=within_dates("invoiceDate", "2024-02-29", "2024-02-29")
    )
    assert [item["id"] for item in items] == ["a"]


def test_within_dates_accepts_the_last_possible_day(table):
    table.put_item(Item={"id": "a", "invoiceDate": "9999-12-31T23:59:59.999"})
    items = scan_all(
        table, FilterExpression=within_dates("invoiceDate", "2025-01-01", "9999-12-31")
    )
    assert [item["id"] for item in items] == ["a"]


def test_utc_now_iso_has_no_offset():
    value = utc_now_iso()
    assert "+" not in value and not value.endswith("Z")
    assert value[4] == "-" and value[10] == "T"


def test_deductible_amounts_rounds_down():
    amounts = {
        "subtotal": Decimal("10.01"),
        "tps": Decimal("0.50"),
        "tvq": Decimal("1.00"),
        "total": Decimal("11.51"),
    }
    d = deductible_amounts(amounts, 50)
    assert d == {
        "deductibleSubtotal": Decimal("5.00"),
        "deductibleTps": Decimal("0.25"),
        "deductibleTvq": Decimal("0.50"),
        "deductibleTotal": Decimal("5.75"),
    }


@pytest.mark.parametrize("value", [0, 100, "50", 12.5])
def test_deductible_percentage_accepts_0_to_100(value):
    assert deductible_percentage({"deductiblePercentage": value}) == Decimal(str(value))


@pytest.mark.parametrize("value", [-1, 100.5, 150])
def test_deductible_percentage_rejects_out_of_range(value):
    with pytest.raises(ValidationError, match="deductiblePercentage must be from 0 to 100"):
        deductible_percentage({"deductiblePercentage": value})


def test_deductible_percentage_rejects_text():
    with pytest.raises(ValidationError, match="deductiblePercentage must be a number"):
        deductible_percentage({"deductiblePercentage": "half"})


def test_api_handler_maps_errors(caplog):
    errors = {
        "v": ValidationError("bad"),
        "n": NotFoundError("Thing not found"),
        "x": KeyError("secret"),
    }

    @api_handler
    def handler(data, context):
        raise errors[data["k"]]

    with caplog.at_level(logging.ERROR, logger="fiscus"):
        assert handler({"k": "v"}, None) == {"statusCode": 400, "message": "bad"}
        assert handler({"k": "n"}, None) == {"statusCode": 404, "message": "Thing not found"}
        assert handler({"k": "x"}, None) == {"statusCode": 500, "message": "Internal server error"}
    assert "secret" in caplog.text


def test_api_handler_passes_success_through():
    @api_handler
    def handler(data, context):
        return ok("Done", data["id"])

    assert handler({"id": "a"}, None) == {"statusCode": 200, "message": "Done", "data": "a"}


def test_ok_shape():
    assert ok("Done", {"id": "a"}) == {"statusCode": 200, "message": "Done", "data": {"id": "a"}}


def test_scan_all_follows_pages(table):
    for i in range(5):
        table.put_item(Item={"id": f"i{i}", "invoiceDate": "2025-01-01"})
    assert len(scan_all(table, Limit=1)) == 5


def test_put_moving_key_same_key_updates_in_place(table):
    table.put_item(Item={"id": "a", "invoiceDate": "2025-01-01", "x": Decimal("0")})
    put_moving_key(
        table,
        {"id": "a", "invoiceDate": "2025-01-01", "x": Decimal("1")},
        "invoiceDate",
        "2025-01-01",
    )
    assert table.scan()["Items"] == [{"id": "a", "invoiceDate": "2025-01-01", "x": Decimal("1")}]


def test_put_moving_key_moves_atomically(table):
    table.put_item(Item={"id": "a", "invoiceDate": "2025-01-01"})
    put_moving_key(
        table,
        {"id": "a", "invoiceDate": "2025-02-01", "x": Decimal("1")},
        "invoiceDate",
        "2025-01-01",
    )
    assert table.scan()["Items"] == [{"id": "a", "invoiceDate": "2025-02-01", "x": Decimal("1")}]


def test_put_moving_key_is_all_or_nothing(table):
    # The old key does not exist, so the delete half fails and the put must not happen either.
    with pytest.raises(ClientError):
        put_moving_key(table, {"id": "a", "invoiceDate": "2025-02-01"}, "invoiceDate", "2025-01-01")
    assert table.scan()["Items"] == []


def test_taxed_amounts_converts_every_amount():
    data = {
        "subtotal": 10.01,
        "hasTps": True,
        "hasTvq": False,
        "tps": 0.5,
        "tvq": 0,
        "total": "10.51",
    }
    assert taxed_amounts(data) == {
        "subtotal": Decimal("10.01"),
        "hasTps": True,
        "hasTvq": False,
        "tps": Decimal("0.5"),
        "tvq": Decimal("0"),
        "total": Decimal("10.51"),
    }


def test_taxed_amounts_rejects_text():
    data = {"subtotal": "x", "hasTps": True, "hasTvq": True, "tps": 0, "tvq": 0, "total": 0}
    with pytest.raises(ValidationError, match="subtotal must be a number"):
        taxed_amounts(data)


def test_attachments_json_defaults_to_empty_lists():
    assert attachments_json({"images": [{"s3key": "k"}]}) == {
        "images": '[{"s3key": "k"}]',
        "files": "[]",
    }


def test_archive_and_delete_moves_item_to_archive(table, archive_table):
    item = {"id": "a", "invoiceDate": "2025-01-01", "x": Decimal("1")}
    table.put_item(Item=item)
    archive_and_delete(table, archive_table, {"id": "a", "invoiceDate": "2025-01-01"}, "Expense")
    assert table.scan()["Items"] == []
    [archived] = archive_table.scan()["Items"]
    archive_date = archived.pop("archiveDate")
    assert archived == item
    assert "+" not in archive_date and archive_date[10] == "T"


def test_archive_and_delete_of_a_missing_item_is_404_and_archives_nothing(table, archive_table):
    with pytest.raises(NotFoundError, match="Expense not found"):
        archive_and_delete(
            table, archive_table, {"id": "a", "invoiceDate": "2025-01-01"}, "Expense"
        )
    assert archive_table.scan()["Items"] == []


def test_archive_and_delete_of_an_item_gone_after_the_lookup_is_404(
    table, archive_table, monkeypatch
):
    # The lookup still finds it, but another request deletes it before the transaction.
    monkeypatch.setattr(table, "get_item", lambda **kwargs: {"Item": {"id": "a"}})
    with pytest.raises(NotFoundError, match="Expense not found"):
        archive_and_delete(
            table, archive_table, {"id": "a", "invoiceDate": "2025-01-01"}, "Expense"
        )
    assert archive_table.scan()["Items"] == []


def test_get_or_404(table):
    with pytest.raises(NotFoundError, match="Expense not found"):
        get_or_404(table, {"id": "nope", "invoiceDate": "x"}, "Expense")


def test_delete_or_404_removes_the_item(table):
    table.put_item(Item={"id": "a", "invoiceDate": "x"})
    table.put_item(Item={"id": "b", "invoiceDate": "x"})
    delete_or_404(table, {"id": "a", "invoiceDate": "x"}, "Expense")
    assert table.scan()["Items"] == [{"id": "b", "invoiceDate": "x"}]


def test_delete_or_404_missing_item(table):
    with pytest.raises(NotFoundError, match="Expense not found"):
        delete_or_404(table, {"id": "nope", "invoiceDate": "x"}, "Expense")


def test_get_or_404_returns_item(table):
    table.put_item(Item={"id": "a", "invoiceDate": "x"})
    assert get_or_404(table, {"id": "a", "invoiceDate": "x"}, "Expense") == {
        "id": "a",
        "invoiceDate": "x",
    }


@pytest.mark.parametrize("flag", ["false", 1, None])
def test_taxed_amounts_requires_real_booleans(flag):
    data = {"subtotal": 1, "hasTps": flag, "hasTvq": True, "tps": 0, "tvq": 0, "total": 1}
    with pytest.raises(ValidationError, match="hasTps must be true or false"):
        taxed_amounts(data)


@pytest.mark.parametrize("value,expected", [(None, ""), ("", ""), ("  hi ", "  hi "), (5, "5")])
def test_optional_text(value, expected):
    assert optional_text({"notes": value}, "notes") == expected
    assert optional_text({}, "notes") == ""
