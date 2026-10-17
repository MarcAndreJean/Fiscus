"""GET /report/expenses — Excel report of a business's expenses in a date range.

Query: userId, businessId, fromDate, toDate (required; dates are YYYY-MM-DD, both days
included). One section per expense type with a subtotal, then a grand total.
"""

import os

import boto3
from boto3.dynamodb.conditions import Attr
from fiscus.api import api_handler
from fiscus.dates import date_range, within_dates
from fiscus.dynamo import scan_all
from fiscus.validation import require
from fiscus.xlsx import TAXED_AMOUNT_SUMS, workbook_response, write_grouped_sections
from openpyxl import Workbook

TABLE_EXPENSES = os.environ["TABLE_EXPENSES"]

table = boto3.resource("dynamodb").Table(TABLE_EXPENSES)

COLUMNS = [
    "id",
    "invoiceDate",
    "businessId",
    "expenseGroupId",
    "expenseType",
    "dpaCategory",
    "description",
    "notes",
    "hasTps",
    "hasTvq",
    "subtotal",
    "tps",
    "tvq",
    "total",
    "deductiblePercentage",
    "deductibleSubtotal",
    "deductibleTps",
    "deductibleTvq",
    "deductibleTotal",
    "paymentMethod",
    "creationDate",
    "images",
    "files",
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
    workbook = Workbook()
    workbook.active.title = "Expenses Report"
    write_grouped_sections(
        workbook.active,
        items,
        group_field="expenseType",
        group_title="Expense Type",
        date_field="invoiceDate",
        columns=COLUMNS,
        sum_names=TAXED_AMOUNT_SUMS,
    )
    return workbook_response(workbook, "ExpensesReport.xlsx")
