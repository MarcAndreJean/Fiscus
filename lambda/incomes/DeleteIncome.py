"""DELETE /incomes — archive then delete one income.

Body: id, invoiceDate. The item is copied to the archive table (with archiveDate) and
removed from the incomes table in one transaction.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import archive_and_delete
from fiscus.validation import require

TABLE_INCOMES = os.environ["TABLE_INCOMES"]
TABLE_ARCHIVE_INCOMES = os.environ["TABLE_ARCHIVE_INCOMES"]

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_INCOMES)
archive_table = dynamodb.Table(TABLE_ARCHIVE_INCOMES)


@api_handler
def lambda_handler(data, context):
    require(data, "id", "invoiceDate")
    key = {"id": data["id"], "invoiceDate": data["invoiceDate"]}
    archive_and_delete(table, archive_table, key, "Income")
    return ok("Income deleted and archived successfully!", data["id"])
