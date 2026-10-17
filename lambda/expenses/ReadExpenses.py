"""GET /expenses — list a business's expenses for a year or month.

Query: userId, businessId, year (required); month (optional, 1-12).
Returns the expenses newest first.
"""

import os

import boto3
from boto3.dynamodb.conditions import Attr
from fiscus.api import api_handler, ok
from fiscus.dates import date_prefix
from fiscus.dynamo import scan_all
from fiscus.validation import require

TABLE_EXPENSES = os.environ["TABLE_EXPENSES"]

table = boto3.resource("dynamodb").Table(TABLE_EXPENSES)


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "businessId", "year")
    prefix = date_prefix(data["year"], data.get("month"))
    items = scan_all(
        table,
        FilterExpression=Attr("userId").eq(data["userId"])
        & Attr("businessId").eq(data["businessId"])
        & Attr("invoiceDate").begins_with(prefix),
    )
    items.sort(key=lambda item: item["invoiceDate"], reverse=True)
    return ok("Expenses retrieved successfully!", items)
