"""DELETE /house-expenses — archive then delete one house expense.

Body: id, invoiceDate. The item is copied to the archive table (with archiveDate) and
removed from the house expenses table in one transaction.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import archive_and_delete
from fiscus.validation import require

TABLE_HOUSE_EXPENSES = os.environ["TABLE_HOUSE_EXPENSES"]
TABLE_ARCHIVE_HOUSE_EXPENSES = os.environ["TABLE_ARCHIVE_HOUSE_EXPENSES"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_HOUSE_EXPENSES)
archive_table = dynamodb.Table(TABLE_ARCHIVE_HOUSE_EXPENSES)


@api_handler
def lambda_handler(data, context):
    require(data, "id", "invoiceDate")
    key = {"id": data["id"], "invoiceDate": data["invoiceDate"]}
    archive_and_delete(table, archive_table, key, "House expense")
    return ok("House Expense deleted and archived successfully!", data["id"])
