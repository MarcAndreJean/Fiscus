"""Behaviour tests for the Create/Update/Delete handlers (moto-backed)."""

from decimal import Decimal
from types import SimpleNamespace

import boto3
import pytest
from helpers import load_handler, make_table
from moto import mock_aws

# ---------------------------------------------------------------------------
# Expense kinds: business expenses, car expenses, house expenses
# ---------------------------------------------------------------------------

EXPENSE_KINDS = {
    "expense": dict(
        folder="lambda/expenses",
        name="Expense",
        table="test-Expenses",
        archive="test-ArchiveExpenses",
        owner="businessId",
        label="Expense",
    ),
    "car": dict(
        folder="lambda/car-expenses",
        name="CarExpense",
        table="test-CarExpenses",
        archive="test-ArchiveCarExpenses",
        owner="carId",
        label="Car expense",
    ),
    "house": dict(
        folder="lambda/house-expenses",
        name="HouseExpense",
        table="test-HouseExpenses",
        archive="test-ArchiveHouseExpenses",
        owner="houseId",
        label="House expense",
    ),
}


@pytest.fixture(params=list(EXPENSE_KINDS))
def expense_kind(request):
    kind = EXPENSE_KINDS[request.param]
    with mock_aws():
        yield SimpleNamespace(
            key=request.param,
            owner=kind["owner"],
            label=kind["label"],
            table=make_table(kind["table"], "invoiceDate"),
            archive=make_table(kind["archive"], "archiveDate"),
            create=load_handler(f"{kind['folder']}/Create{kind['name']}.py"),
            update=load_handler(f"{kind['folder']}/Update{kind['name']}.py"),
            delete=load_handler(f"{kind['folder']}/Delete{kind['name']}.py"),
        )


def expense_fields(kind, **overrides):
    fields = {
        kind.owner: "owner-1",
        "invoiceDate": "2025-03-01T10:00:00.000",
        "description": "Paper",
        "expenseType": "unclassified",
        "subtotal": 10.01,
        "hasTps": True,
        "hasTvq": True,
        "tps": 0.5,
        "tvq": 1.0,
        "total": 11.51,
        "notes": "",
        "images": [{"s3key": "k", "fileName": "f.png", "size": 1}],
        "files": [],
    }
    if kind.key == "expense":
        fields.update(userId="u", dpaCategory=None, deductiblePercentage=50)
    fields.update(overrides)
    return fields


def create_event(kind, **overrides):
    return {"userId": "u", "expenseGroupId": "group-1", **expense_fields(kind, **overrides)}


def update_event(kind, item_id, **overrides):
    event = {"id": item_id, "oldInvoiceDate": "2025-03-01T10:00:00.000", **expense_fields(kind)}
    event.pop("userId", None)
    event.update(overrides)
    return event


def test_create_stores_the_expense(expense_kind):
    result = expense_kind.create.lambda_handler(create_event(expense_kind), None)

    assert result["statusCode"] == 200
    [stored] = expense_kind.table.scan()["Items"]
    assert stored["id"] == result["data"]["id"]
    assert stored[expense_kind.owner] == "owner-1"
    assert stored["subtotal"] == Decimal("10.01")
    assert stored["tps"] == Decimal("0.5")
    assert stored["total"] == Decimal("11.51")
    assert stored["images"] == '[{"s3key": "k", "fileName": "f.png", "size": 1}]'
    assert "+" not in stored["creationDate"]


@pytest.mark.parametrize("expense_kind", ["expense"], indirect=True)
def test_create_business_expense_computes_deductible_amounts(expense_kind):
    expense_kind.create.lambda_handler(create_event(expense_kind), None)
    [stored] = expense_kind.table.scan()["Items"]
    assert stored["deductibleSubtotal"] == Decimal("5.00")
    assert stored["deductibleTps"] == Decimal("0.25")
    assert stored["deductibleTvq"] == Decimal("0.50")
    assert stored["deductibleTotal"] == Decimal("5.75")


def test_create_with_text_amount_is_400(expense_kind):
    result = expense_kind.create.lambda_handler(create_event(expense_kind, subtotal="abc"), None)
    assert result == {"statusCode": 400, "message": "subtotal must be a number"}
    assert expense_kind.table.scan()["Items"] == []


def test_create_missing_fields_is_400_naming_them(expense_kind):
    event = create_event(expense_kind)
    del event["total"], event[expense_kind.owner]
    result = expense_kind.create.lambda_handler(event, None)
    assert result["statusCode"] == 400
    assert "total" in result["message"] and expense_kind.owner in result["message"]


def _seed(kind):
    created = kind.create.lambda_handler(create_event(kind), None)
    return created["data"]["id"]


def test_update_same_date_updates_in_place(expense_kind):
    item_id = _seed(expense_kind)
    result = expense_kind.update.lambda_handler(
        update_event(expense_kind, item_id, description="Ink", total=20), None
    )
    assert result["statusCode"] == 200
    [stored] = expense_kind.table.scan()["Items"]
    assert (stored["description"], stored["total"]) == ("Ink", Decimal("20"))
    assert stored["invoiceDate"] == "2025-03-01T10:00:00.000"


def test_update_new_date_moves_the_item(expense_kind):
    item_id = _seed(expense_kind)
    result = expense_kind.update.lambda_handler(
        update_event(expense_kind, item_id, invoiceDate="2025-04-02T09:00:00.000"), None
    )
    assert result["statusCode"] == 200
    items = expense_kind.table.scan()["Items"]
    assert [(i["id"], i["invoiceDate"]) for i in items] == [(item_id, "2025-04-02T09:00:00.000")]


def test_update_keeps_creation_date(expense_kind):
    item_id = _seed(expense_kind)
    [before] = expense_kind.table.scan()["Items"]
    expense_kind.update.lambda_handler(update_event(expense_kind, item_id, notes="n"), None)
    [after] = expense_kind.table.scan()["Items"]
    assert after["creationDate"] == before["creationDate"]


@pytest.mark.parametrize("expense_kind", ["expense"], indirect=True)
def test_update_business_expense_recomputes_deductible(expense_kind):
    item_id = _seed(expense_kind)
    expense_kind.update.lambda_handler(
        update_event(expense_kind, item_id, deductiblePercentage=100), None
    )
    [stored] = expense_kind.table.scan()["Items"]
    assert stored["deductibleTotal"] == Decimal("11.51")


@pytest.mark.parametrize("expense_kind", ["expense"], indirect=True)
@pytest.mark.parametrize("percentage", [-0.01, 100.01, 150])
def test_deductible_percentage_outside_0_to_100_is_400(expense_kind, percentage):
    expected = {"statusCode": 400, "message": "deductiblePercentage must be from 0 to 100"}
    created = expense_kind.create.lambda_handler(
        create_event(expense_kind, deductiblePercentage=percentage), None
    )
    assert created == expected
    assert expense_kind.table.scan()["Items"] == []

    item_id = _seed(expense_kind)
    updated = expense_kind.update.lambda_handler(
        update_event(expense_kind, item_id, deductiblePercentage=percentage), None
    )
    assert updated == expected
    [stored] = expense_kind.table.scan()["Items"]
    assert stored["deductiblePercentage"] == Decimal("50")


@pytest.mark.parametrize("expense_kind", ["expense"], indirect=True)
@pytest.mark.parametrize("percentage", [0, 100, 33.5])
def test_deductible_percentage_bounds_are_accepted(expense_kind, percentage):
    result = expense_kind.create.lambda_handler(
        create_event(expense_kind, deductiblePercentage=percentage), None
    )
    assert result["statusCode"] == 200
    assert result["data"]["deductiblePercentage"] == Decimal(str(percentage))


@pytest.mark.parametrize("expense_kind", ["expense"], indirect=True)
def test_update_business_expense_without_payment_method(expense_kind):
    item_id = _seed(expense_kind)
    event = update_event(expense_kind, item_id)
    assert "paymentMethod" not in event
    assert expense_kind.update.lambda_handler(event, None)["statusCode"] == 200


def test_update_missing_item_is_404(expense_kind):
    result = expense_kind.update.lambda_handler(update_event(expense_kind, "nope"), None)
    assert result == {"statusCode": 404, "message": f"{expense_kind.label} not found"}


def test_update_missing_keys_is_400_naming_them(expense_kind):
    event = update_event(expense_kind, "x")
    del event["id"], event["oldInvoiceDate"]
    result = expense_kind.update.lambda_handler(event, None)
    assert result["statusCode"] == 400
    assert "id" in result["message"] and "oldInvoiceDate" in result["message"]


def test_delete_archives_then_removes(expense_kind):
    item_id = _seed(expense_kind)
    result = expense_kind.delete.lambda_handler(
        {"id": item_id, "invoiceDate": "2025-03-01T10:00:00.000"}, None
    )
    assert result["statusCode"] == 200
    assert result["data"] == item_id
    assert expense_kind.table.scan()["Items"] == []
    [archived] = expense_kind.archive.scan()["Items"]
    assert archived["id"] == item_id and archived["description"] == "Paper"
    assert "+" not in archived["archiveDate"]


def test_delete_missing_is_404(expense_kind):
    result = expense_kind.delete.lambda_handler(
        {"id": "nope", "invoiceDate": "2025-03-01T10:00:00.000"}, None
    )
    assert result == {"statusCode": 404, "message": f"{expense_kind.label} not found"}


def test_delete_gone_after_the_lookup_is_404(expense_kind, monkeypatch):
    # The lookup still finds it, but another request deletes it before the transaction.
    monkeypatch.setattr(
        expense_kind.delete.table, "get_item", lambda **kwargs: {"Item": {"id": "a"}}
    )
    result = expense_kind.delete.lambda_handler(
        {"id": "a", "invoiceDate": "2025-03-01T10:00:00.000"}, None
    )
    assert result == {"statusCode": 404, "message": f"{expense_kind.label} not found"}
    assert expense_kind.archive.scan()["Items"] == []


# ---------------------------------------------------------------------------
# Incomes
# ---------------------------------------------------------------------------


@pytest.fixture
def incomes():
    with mock_aws():
        yield SimpleNamespace(
            table=make_table("test-Incomes", "invoiceDate"),
            archive=make_table("test-ArchiveIncomes", "archiveDate"),
            create=load_handler("lambda/incomes/CreateIncome.py"),
            update=load_handler("lambda/incomes/UpdateIncome.py"),
            delete=load_handler("lambda/incomes/DeleteIncome.py"),
        )


def income_fields(**overrides):
    fields = {
        "businessId": "b",
        "invoiceDate": "2025-03-01T10:00:00.000",
        "clientName": "ACME",
        "description": "Consulting",
        "subtotal": 100,
        "hasTps": True,
        "hasTvq": True,
        "tps": 5,
        "tvq": 9.98,
        "total": 114.98,
        "notes": "",
        "items": [{"item": "hours", "subtotal": 100}],
        "images": [],
        "files": [],
    }
    fields.update(overrides)
    return fields


def _seed_income(incomes):
    created = incomes.create.lambda_handler({"userId": "u", **income_fields()}, None)
    assert created["statusCode"] == 200
    return created["data"]["id"]


def test_income_create_without_payment_method(incomes):
    _seed_income(incomes)
    [stored] = incomes.table.scan()["Items"]
    assert stored["paymentMethod"] is None
    assert stored["tvq"] == Decimal("9.98")
    assert stored["items"] == '[{"item": "hours", "subtotal": 100}]'


def test_income_update_moves_date_and_keeps_payment_method(incomes):
    item_id = _seed_income(incomes)
    incomes.table.update_item(
        Key={"id": item_id, "invoiceDate": "2025-03-01T10:00:00.000"},
        UpdateExpression="SET paymentMethod = :p",
        ExpressionAttributeValues={":p": "cash"},
    )
    event = {
        "id": item_id,
        "oldInvoiceDate": "2025-03-01T10:00:00.000",
        **income_fields(invoiceDate="2025-05-01T10:00:00.000", clientName="Other"),
    }
    assert incomes.update.lambda_handler(event, None)["statusCode"] == 200
    [stored] = incomes.table.scan()["Items"]
    assert stored["invoiceDate"] == "2025-05-01T10:00:00.000"
    assert stored["clientName"] == "Other"
    assert stored["paymentMethod"] == "cash"


def test_income_update_missing_is_404(incomes):
    event = {"id": "nope", "oldInvoiceDate": "2025-03-01T10:00:00.000", **income_fields()}
    assert incomes.update.lambda_handler(event, None) == {
        "statusCode": 404,
        "message": "Income not found",
    }


def test_income_create_missing_fields_is_400(incomes):
    result = incomes.create.lambda_handler({"userId": "u"}, None)
    assert result["statusCode"] == 400
    assert "businessId" in result["message"] and "total" in result["message"]


def test_income_delete_archives(incomes):
    item_id = _seed_income(incomes)
    result = incomes.delete.lambda_handler(
        {"id": item_id, "invoiceDate": "2025-03-01T10:00:00.000"}, None
    )
    assert result["statusCode"] == 200
    assert incomes.table.scan()["Items"] == []
    assert [i["id"] for i in incomes.archive.scan()["Items"]] == [item_id]


def test_income_delete_missing_is_404(incomes):
    result = incomes.delete.lambda_handler({"id": "x", "invoiceDate": "y"}, None)
    assert result == {"statusCode": 404, "message": "Income not found"}


def test_income_delete_gone_after_the_lookup_is_404(incomes, monkeypatch):
    monkeypatch.setattr(incomes.delete.table, "get_item", lambda **kwargs: {"Item": {"id": "x"}})
    result = incomes.delete.lambda_handler({"id": "x", "invoiceDate": "y"}, None)
    assert result == {"statusCode": 404, "message": "Income not found"}
    assert incomes.archive.scan()["Items"] == []


# ---------------------------------------------------------------------------
# Travel logs
# ---------------------------------------------------------------------------


def _raw_item(table_name, key):
    """Item as DynamoDB stores it (typed attribute values)."""
    return boto3.client("dynamodb").get_item(TableName=table_name, Key=key)["Item"]


@pytest.fixture
def travel():
    with mock_aws():
        yield SimpleNamespace(
            table=make_table("test-TravelLogs", "travelDate"),
            create=load_handler("lambda/travel-logs/CreateTravelLog.py"),
            update=load_handler("lambda/travel-logs/UpdateTravelLog.py"),
            delete=load_handler("lambda/travel-logs/DeleteTravelLog.py"),
        )


def travel_event(**overrides):
    event = {
        "id": "a",
        "oldTravelDate": "2025-01-01",
        "travelDate": "2025-01-01",
        "userId": "u",
        "carId": "c",
        "businessId": "b",
        "reason": "new",
        "notes": "n",
        "totalKm": 12.5,
        "consumption": 7,
        "images": [],
        "files": [],
    }
    event.update(overrides)
    return event


def seed_travel(table, date="2025-01-01"):
    table.put_item(
        Item={
            "id": "a",
            "userId": "u",
            "carId": "c",
            "businessId": "b",
            "travelDate": date,
            "reason": "old",
            "notes": "",
            "images": "[]",
            "files": "[]",
            "creationDate": "2024-01-01",
        }
    )


def test_update_travel_log_same_date_updates_in_place(travel):
    seed_travel(travel.table)
    assert travel.update.lambda_handler(travel_event(), None)["statusCode"] == 200
    [stored] = travel.table.scan()["Items"]
    assert stored["reason"] == "new"
    assert stored["totalKm"] == Decimal("12.5")


def test_update_travel_log_new_date_moves_item(travel):
    seed_travel(travel.table)
    result = travel.update.lambda_handler(travel_event(travelDate="2025-02-01"), None)
    assert result["statusCode"] == 200
    assert [i["travelDate"] for i in travel.table.scan()["Items"]] == ["2025-02-01"]


def test_update_travel_log_keeps_user_id(travel):
    seed_travel(travel.table)
    travel.update.lambda_handler(travel_event(userId="other"), None)
    [stored] = travel.table.scan()["Items"]
    assert stored["userId"] == "u"


def test_update_travel_log_accepts_null_numbers(travel):
    seed_travel(travel.table)
    # What the create handler stores for null numbers.
    create_event = {
        k: v
        for k, v in travel_event(totalKm=None, consumption=None).items()
        if k not in ("id", "oldTravelDate")
    }
    created = travel.create.lambda_handler(create_event, None)
    assert created["statusCode"] == 200
    expected = _raw_item(
        "test-TravelLogs",
        {"id": {"S": created["data"]["id"]}, "travelDate": {"S": "2025-01-01"}},
    )

    result = travel.update.lambda_handler(travel_event(totalKm=None, consumption=None), None)
    assert result["statusCode"] == 200
    stored = _raw_item("test-TravelLogs", {"id": {"S": "a"}, "travelDate": {"S": "2025-01-01"}})
    assert stored["totalKm"] == expected["totalKm"]
    assert stored["consumption"] == expected["consumption"]
    assert "N" not in stored["totalKm"] and "N" not in stored["consumption"]


def test_travel_log_with_empty_reason_is_saved(travel):
    # The app starts the form with reason "" and lets the user save it as is.
    event = {k: v for k, v in travel_event(reason="").items() if k not in ("id", "oldTravelDate")}
    assert travel.create.lambda_handler(event, None)["statusCode"] == 200
    seed_travel(travel.table)
    assert travel.update.lambda_handler(travel_event(reason=""), None)["statusCode"] == 200


def test_travel_log_text_number_is_400(travel):
    seed_travel(travel.table)
    result = travel.update.lambda_handler(travel_event(totalKm="abc"), None)
    assert result == {"statusCode": 400, "message": "totalKm must be a number"}


def test_update_travel_log_missing_item_is_404(travel):
    result = travel.update.lambda_handler(travel_event(id="nope"), None)
    assert result == {"statusCode": 404, "message": "Travel log not found"}


def test_update_travel_log_missing_fields_is_400(travel):
    event = travel_event()
    del event["oldTravelDate"], event["carId"]
    result = travel.update.lambda_handler(event, None)
    assert result["statusCode"] == 400
    assert "oldTravelDate" in result["message"] and "carId" in result["message"]


def test_delete_travel_log_removes_item(travel):
    seed_travel(travel.table)
    result = travel.delete.lambda_handler({"id": "a", "travelDate": "2025-01-01"}, None)
    assert result["statusCode"] == 200
    assert result["data"] == "a"
    assert travel.table.scan()["Items"] == []


def test_delete_travel_log_missing_is_404(travel):
    result = travel.delete.lambda_handler({"id": "a", "travelDate": "2025-01-01"}, None)
    assert result == {"statusCode": 404, "message": "Travel log not found"}


# ---------------------------------------------------------------------------
# Misc files
# ---------------------------------------------------------------------------


@pytest.fixture
def misc():
    with mock_aws():
        yield SimpleNamespace(
            table=make_table("test-MiscFiles", "date"),
            create=load_handler("lambda/misc-files/CreateMiscFile.py"),
            update=load_handler("lambda/misc-files/UpdateMiscFile.py"),
            delete=load_handler("lambda/misc-files/DeleteMiscFile.py"),
        )


def misc_event(**overrides):
    event = {
        "id": "m",
        "oldDate": "2025-01-01",
        "date": "2025-01-01",
        "description": "d",
        "category": "medical",
        "notes": "n",
        "amount": 10.5,
        "images": [],
        "files": [],
    }
    event.update(overrides)
    return event


def seed_misc(table, date="2025-01-01"):
    table.put_item(
        Item={
            "id": "m",
            "userId": "u",
            "date": date,
            "description": "old",
            "category": "medical",
            "notes": "",
            "images": "[]",
            "files": "[]",
            "creationDate": "2024-01-01",
        }
    )


def test_update_misc_file_new_date_moves_item(misc):
    seed_misc(misc.table)
    result = misc.update.lambda_handler(misc_event(date="2025-02-01"), None)
    assert result["statusCode"] == 200
    [stored] = misc.table.scan()["Items"]
    assert stored["date"] == "2025-02-01"
    assert stored["description"] == "d"
    assert stored["images"] == "[]"


def test_update_misc_file_accepts_null_amount(misc):
    seed_misc(misc.table)
    created = misc.create.lambda_handler(
        {
            "userId": "u",
            "date": "2025-01-01",
            "description": "d",
            "category": "medical",
            "notes": "n",
            "amount": None,
            "images": [],
            "files": [],
        },
        None,
    )
    assert created["statusCode"] == 200
    expected = _raw_item(
        "test-MiscFiles",
        {"id": {"S": created["data"]["id"]}, "date": {"S": "2025-01-01"}},
    )

    result = misc.update.lambda_handler(misc_event(amount=None), None)
    assert result["statusCode"] == 200
    stored = _raw_item("test-MiscFiles", {"id": {"S": "m"}, "date": {"S": "2025-01-01"}})
    assert stored["amount"] == expected["amount"]
    assert "N" not in stored["amount"]


def test_update_misc_file_missing_is_404(misc):
    assert misc.update.lambda_handler(misc_event(), None) == {
        "statusCode": 404,
        "message": "Misc file not found",
    }


def test_create_misc_file_missing_fields_is_400(misc):
    result = misc.create.lambda_handler({"userId": "u", "description": "d"}, None)
    assert result["statusCode"] == 400
    assert "date" in result["message"] and "category" in result["message"]


def test_delete_misc_file_removes_item(misc):
    seed_misc(misc.table)
    result = misc.delete.lambda_handler({"id": "m", "date": "2025-01-01"}, None)
    assert result["statusCode"] == 200
    assert misc.table.scan()["Items"] == []


def test_delete_misc_file_missing_is_404(misc):
    result = misc.delete.lambda_handler({"id": "m", "date": "2025-01-01"}, None)
    assert result == {"statusCode": 404, "message": "Misc file not found"}


def test_explicit_null_text_is_stored_as_empty(expense_kind):
    expense_kind.create.lambda_handler(
        create_event(expense_kind, notes=None, description=None), None
    )
    [stored] = expense_kind.table.scan()["Items"]
    assert stored["notes"] == ""
    assert stored["description"] == ""
