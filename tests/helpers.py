import importlib.util
import itertools
import types
from pathlib import Path

import boto3

REPO_ROOT = Path(__file__).resolve().parent.parent

ENV_VARS = {
    "TABLE_INCOMES": "test-Incomes",
    "TABLE_EXPENSES": "test-Expenses",
    "TABLE_CAR_EXPENSES": "test-CarExpenses",
    "TABLE_HOUSE_EXPENSES": "test-HouseExpenses",
    "TABLE_TRAVEL_LOGS": "test-TravelLogs",
    "TABLE_MISC_FILES": "test-MiscFiles",
    "TABLE_ARCHIVE_INCOMES": "test-ArchiveIncomes",
    "TABLE_ARCHIVE_EXPENSES": "test-ArchiveExpenses",
    "TABLE_ARCHIVE_CAR_EXPENSES": "test-ArchiveCarExpenses",
    "TABLE_ARCHIVE_HOUSE_EXPENSES": "test-ArchiveHouseExpenses",
    "BUCKET_NAME": "test-bucket",
}

# Every Lambda handler; each one is a deployed function.
HANDLER_FILES = sorted(
    p.relative_to(REPO_ROOT).as_posix() for p in (REPO_ROOT / "lambda").rglob("*.py")
)

_counter = itertools.count()


def make_table(name: str, range_key: str):
    """Create a (moto) table keyed like every Fiscus table: ``id`` plus a date sort key."""
    boto3.client("dynamodb").create_table(
        TableName=name,
        KeySchema=[
            {"AttributeName": "id", "KeyType": "HASH"},
            {"AttributeName": range_key, "KeyType": "RANGE"},
        ],
        AttributeDefinitions=[
            {"AttributeName": "id", "AttributeType": "S"},
            {"AttributeName": range_key, "AttributeType": "S"},
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    return boto3.resource("dynamodb").Table(name)


def load_handler(relative_path: str) -> types.ModuleType:
    """Import lambda/<area>/<File>.py by path, fresh on every call."""
    path = REPO_ROOT / relative_path
    name = f"_lambda_under_test_{next(_counter)}_{path.stem}"
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
