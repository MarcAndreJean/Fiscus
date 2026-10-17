"""GET /report/travel-logs — Excel report of one car's business trips in a date range.

Query: userId, businessId, carId, fromDate, toDate (required; dates are YYYY-MM-DD,
both days included). One flat table, oldest first, with a TOTAL row for the kilometres.
"""

import os

import boto3
from boto3.dynamodb.conditions import Attr
from fiscus.api import api_handler
from fiscus.dates import date_range, within_dates
from fiscus.dynamo import scan_all
from fiscus.validation import require
from fiscus.xlsx import workbook_response, write_flat_table
from openpyxl import Workbook

TABLE_TRAVEL_LOGS = os.environ["TABLE_TRAVEL_LOGS"]

table = boto3.resource("dynamodb").Table(TABLE_TRAVEL_LOGS)

COLUMNS = [
    "id",
    "travelDate",
    "businessId",
    "carId",
    "reason",
    "notes",
    "totalKm",
    "consumption",
    "creationDate",
    "images",
    "files",
    "userId",
]


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "businessId", "carId", "fromDate", "toDate")
    from_date, to_date = date_range(data)
    items = scan_all(
        table,
        FilterExpression=Attr("userId").eq(data["userId"])
        & Attr("businessId").eq(data["businessId"])
        & Attr("carId").eq(data["carId"])
        & within_dates("travelDate", from_date, to_date),
    )
    items.sort(key=lambda item: item["travelDate"])
    workbook = Workbook()
    workbook.active.title = "Travel Logs Report"
    write_flat_table(workbook.active, items, COLUMNS, ["totalKm"])
    return workbook_response(workbook, "TravelLogsReport.xlsx")
