"""GET /report/misc-files — Excel report of a user's misc files in a date range.

Query: userId, fromDate, toDate (required; dates are YYYY-MM-DD, both days included).
One section per category with an amount subtotal, then a grand total.
"""

import os

import boto3
from boto3.dynamodb.conditions import Attr
from fiscus.api import api_handler
from fiscus.dates import date_range, within_dates
from fiscus.dynamo import scan_all
from fiscus.validation import require
from fiscus.xlsx import workbook_response, write_grouped_sections
from openpyxl import Workbook

TABLE_MISC_FILES = os.environ["TABLE_MISC_FILES"]

table = boto3.resource("dynamodb").Table(TABLE_MISC_FILES)

COLUMNS = [
    "id",
    "date",
    "description",
    "category",
    "notes",
    "amount",
    "creationDate",
    "images",
    "files",
    "userId",
]


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "fromDate", "toDate")
    from_date, to_date = date_range(data)
    items = scan_all(
        table,
        FilterExpression=Attr("userId").eq(data["userId"])
        & within_dates("date", from_date, to_date),
    )
    workbook = Workbook()
    workbook.active.title = "Misc Files Report"
    write_grouped_sections(
        workbook.active,
        items,
        group_field="category",
        group_title="Category",
        date_field="date",
        columns=COLUMNS,
        sum_names=["amount"],
    )
    return workbook_response(workbook, "MiscFilesReport.xlsx")
