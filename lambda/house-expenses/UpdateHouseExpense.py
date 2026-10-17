"""PUT /house-expenses — replace one house expense.

Body: id, oldInvoiceDate (the stored sort key), invoiceDate, houseId, expenseType,
subtotal, hasTps, hasTvq, tps, tvq, total (required); description, notes, images,
files (optional). A new invoiceDate moves the item atomically.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import get_or_404, put_moving_key
from fiscus.money import TAXED_AMOUNT_FIELDS, taxed_amounts
from fiscus.validation import attachments_json, optional_text, require

TABLE_HOUSE_EXPENSES = os.environ["TABLE_HOUSE_EXPENSES"]

table = boto3.resource("dynamodb").Table(TABLE_HOUSE_EXPENSES)

REQUIRED = ("id", "oldInvoiceDate", "invoiceDate", "houseId", "expenseType", *TAXED_AMOUNT_FIELDS)


@api_handler
def lambda_handler(data, context):
    require(data, *REQUIRED)
    key = {"id": data["id"], "invoiceDate": data["oldInvoiceDate"]}
    item = get_or_404(table, key, "House expense")
    item.update(
        {
            "houseId": data["houseId"],
            "invoiceDate": data["invoiceDate"],
            "description": optional_text(data, "description"),
            "expenseType": data["expenseType"],
            **taxed_amounts(data),
            "notes": optional_text(data, "notes"),
            **attachments_json(data),
        }
    )
    put_moving_key(table, item, "invoiceDate", data["oldInvoiceDate"])
    return ok("House Expense updated successfully!", item)
