"""GET /travel-logs — list a user's travel logs for a year or month.

Query: userId, year (required); month (optional, 1-12); businessId and carId
(optional filters). Returns the travel logs newest first.
"""

import os

import boto3
from boto3.dynamodb.conditions import Attr
from fiscus.api import api_handler, ok
from fiscus.dates import date_prefix
from fiscus.dynamo import scan_all
from fiscus.validation import require

TABLE_TRAVEL_LOGS = os.environ["TABLE_TRAVEL_LOGS"]

table = boto3.resource("dynamodb").Table(TABLE_TRAVEL_LOGS)


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "year")
    prefix = date_prefix(data["year"], data.get("month"))
    expression = Attr("userId").eq(data["userId"]) & Attr("travelDate").begins_with(prefix)
    for optional_filter in ("businessId", "carId"):
        if data.get(optional_filter):
            expression &= Attr(optional_filter).eq(data[optional_filter])
    items = scan_all(table, FilterExpression=expression)
    items.sort(key=lambda item: item["travelDate"], reverse=True)
    return ok("Travel logs retrieved successfully!", items)
