"""GET /report/house-expenses — Excel report of every house's expenses in a date range.

Query: fromDate, toDate (required, YYYY-MM-DD, both days included). One section per
expense type, a block per house inside it, type totals and a grand total.
"""

import os

import boto3
from fiscus.api import api_handler
from fiscus.dates import date_range, within_dates
from fiscus.dynamo import scan_all
from fiscus.xlsx import TAXED_AMOUNT_SUMS, workbook_response, write_owner_sections
from openpyxl import Workbook

TABLE_HOUSE_EXPENSES = os.environ["TABLE_HOUSE_EXPENSES"]

table = boto3.resource("dynamodb").Table(TABLE_HOUSE_EXPENSES)

COLUMNS = [
    "id",
    "invoiceDate",
    "houseId",
    "expenseGroupId",
    "expenseType",
    "description",
    "notes",
    "hasTps",
    "hasTvq",
    "subtotal",
    "tps",
    "tvq",
    "total",
    "creationDate",
    "images",
    "files",
]


@api_handler
def lambda_handler(data, context):
    from_date, to_date = date_range(data)
    items = scan_all(table, FilterExpression=within_dates("invoiceDate", from_date, to_date))
    workbook = Workbook()
    workbook.active.title = "House Expenses Report"
    write_owner_sections(
        workbook.active,
        items,
        owner_field="houseId",
        owner_title="House",
        columns=COLUMNS,
        sum_names=TAXED_AMOUNT_SUMS,
    )
    return workbook_response(workbook, "HouseExpensesReport.xlsx")
