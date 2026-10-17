"""GET /report/incomes — Excel report of a business's incomes in a date range.

Query: userId, businessId, fromDate, toDate (required; dates are YYYY-MM-DD, both days
included). One flat table, oldest first, with a TOTAL row.
"""

import os

import boto3
from boto3.dynamodb.conditions import Attr
from fiscus.api import api_handler
from fiscus.dates import date_range, within_dates
from fiscus.dynamo import scan_all
from fiscus.validation import require
from fiscus.xlsx import TAXED_AMOUNT_SUMS, workbook_response, write_flat_table
from openpyxl import Workbook

TABLE_INCOMES = os.environ["TABLE_INCOMES"]

table = boto3.resource("dynamodb").Table(TABLE_INCOMES)

COLUMNS = [
    "id",
    "invoiceDate",
    "businessId",
    "clientName",
    "creationDate",
    "description",
    "files",
    "hasTps",
    "hasTvq",
    "images",
    "items",
    "notes",
    "paymentMethod",
    "subtotal",
    "tps",
    "tvq",
    "total",
    "userId",
]


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "businessId", "fromDate", "toDate")
    from_date, to_date = date_range(data)
    items = scan_all(
        table,
        FilterExpression=Attr("userId").eq(data["userId"])
        & Attr("businessId").eq(data["businessId"])
        & within_dates("invoiceDate", from_date, to_date),
    )
    items.sort(key=lambda item: item["invoiceDate"])
    workbook = Workbook()
    workbook.active.title = "Incomes Report"
    write_flat_table(workbook.active, items, COLUMNS, TAXED_AMOUNT_SUMS)
    return workbook_response(workbook, "IncomesReport.xlsx")
