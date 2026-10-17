"""DELETE /car-expenses — archive then delete one car expense.

Body: id, invoiceDate. The item is copied to the archive table (with archiveDate) and
removed from the car expenses table in one transaction.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import archive_and_delete
from fiscus.validation import require

TABLE_CAR_EXPENSES = os.environ["TABLE_CAR_EXPENSES"]
TABLE_ARCHIVE_CAR_EXPENSES = os.environ["TABLE_ARCHIVE_CAR_EXPENSES"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_CAR_EXPENSES)
archive_table = dynamodb.Table(TABLE_ARCHIVE_CAR_EXPENSES)


@api_handler
def lambda_handler(data, context):
    require(data, "id", "invoiceDate")
    key = {"id": data["id"], "invoiceDate": data["invoiceDate"]}
    archive_and_delete(table, archive_table, key, "Car expense")
    return ok("Car Expense deleted and archived successfully!", data["id"])
