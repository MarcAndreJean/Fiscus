"""GET /misc-files — list a user's misc files for a year or month.

Query: userId, year (required); month (optional, 1-12).
Returns the files newest first.
"""

import os

import boto3
from boto3.dynamodb.conditions import Attr
from fiscus.api import api_handler, ok
from fiscus.dates import date_prefix
from fiscus.dynamo import scan_all
from fiscus.validation import require

TABLE_MISC_FILES = os.environ["TABLE_MISC_FILES"]

table = boto3.resource("dynamodb").Table(TABLE_MISC_FILES)


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "year")
    prefix = date_prefix(data["year"], data.get("month"))
    items = scan_all(
        table,
        FilterExpression=Attr("userId").eq(data["userId"]) & Attr("date").begins_with(prefix),
    )
    items.sort(key=lambda item: item["date"], reverse=True)
    return ok("Misc files retrieved successfully!", items)
