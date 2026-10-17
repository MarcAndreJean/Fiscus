"""Tests for the six Read* list handlers (moto-backed)."""

import pytest
from helpers import load_handler, make_table
from moto import mock_aws

# (handler path, table name, date field, filters a request must send)
READ_CASES = [
    (
        "lambda/expenses/ReadExpenses.py",
        "test-Expenses",
        "invoiceDate",
        {"userId": "u", "businessId": "b"},
    ),
    (
        "lambda/incomes/ReadIncomes.py",
        "test-Incomes",
        "invoiceDate",
        {"userId": "u", "businessId": "b"},
    ),
    ("lambda/car-expenses/ReadCarExpenses.py", "test-CarExpenses", "invoiceDate", {"carId": "c"}),
    (
        "lambda/house-expenses/ReadHouseExpenses.py",
        "test-HouseExpenses",
        "invoiceDate",
        {"houseId": "h"},
    ),
    ("lambda/misc-files/ReadMiscFiles.py", "test-MiscFiles", "date", {"userId": "u"}),
    ("lambda/travel-logs/ReadTravelLogs.py", "test-TravelLogs", "travelDate", {"userId": "u"}),
]
CASE_IDS = [case[1].removeprefix("test-") for case in READ_CASES]


@pytest.fixture(params=READ_CASES, ids=CASE_IDS)
def reader(request):
    path, table_name, date_field, filters = request.param
    with mock_aws():
        table = make_table(table_name, date_field)

        def seed(item_id, date, **extra):
            table.put_item(Item={"id": item_id, date_field: date, **filters, **extra})

        yield load_handler(path), seed, date_field, filters


def test_month_as_string_filters_to_that_month(reader):
    handler, seed, date_field, filters = reader
    seed("june", "2025-06-03T10:00:00.000")
    seed("july", "2025-07-01T10:00:00.000")
    seed("other-year", "2024-06-03T10:00:00.000")

    result = handler.lambda_handler({**filters, "year": "2025", "month": "6"}, None)

    assert result["statusCode"] == 200
    assert [item["id"] for item in result["data"]] == ["june"]


def test_year_only_returns_the_year_newest_first(reader):
    handler, seed, date_field, filters = reader
    seed("a", "2025-01-05T00:00:00.000")
    seed("b", "2025-11-20T00:00:00.000")
    seed("c", "2024-12-31T00:00:00.000")

    result = handler.lambda_handler({**filters, "year": "2025"}, None)

    assert [item["id"] for item in result["data"]] == ["b", "a"]


def test_returns_every_row_beyond_one_scan_page(reader):
    handler, seed, date_field, filters = reader
    padding = "x" * 40_000  # 30 rows of ~40 KB is more than the 1 MB a scan page holds
    for day in range(1, 31):
        seed(f"row{day:02d}", f"2025-03-{day:02d}T00:00:00.000", padding=padding)

    data = handler.lambda_handler({**filters, "year": "2025"}, None)["data"]

    assert len(data) == 30
    assert [item["id"] for item in data] == [f"row{day:02d}" for day in range(30, 0, -1)]


@pytest.mark.parametrize("month", ["13", "abc"])
def test_bad_month_is_400(reader, month):
    handler, _, _, filters = reader
    result = handler.lambda_handler({**filters, "year": "2025", "month": month}, None)
    assert result["statusCode"] == 400


def test_missing_filters_is_400_naming_them(reader):
    handler, _, _, filters = reader
    result = handler.lambda_handler({"year": "2025"}, None)
    assert result["statusCode"] == 400
    for field in filters:
        assert field in result["message"]


def test_travel_logs_optional_filters():
    with mock_aws():
        table = make_table("test-TravelLogs", "travelDate")
        for item_id, business, car in [("1", "b1", "c1"), ("2", "b2", "c1"), ("3", "b1", "c2")]:
            table.put_item(
                Item={
                    "id": item_id,
                    "travelDate": "2025-05-0" + item_id,
                    "userId": "u",
                    "businessId": business,
                    "carId": car,
                }
            )
        handler = load_handler("lambda/travel-logs/ReadTravelLogs.py")

        def ids(**filters):
            event = {"userId": "u", "year": "2025", **filters}
            return [item["id"] for item in handler.lambda_handler(event, None)["data"]]

        assert ids() == ["3", "2", "1"]
        assert ids(businessId="b1") == ["3", "1"]
        assert ids(businessId="b1", carId="c1") == ["1"]
