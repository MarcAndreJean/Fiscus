"""PUT /expenses — replace one business expense.

Body: id, oldInvoiceDate (the stored sort key), invoiceDate, businessId, expenseType,
subtotal, hasTps, hasTvq, tps, tvq, total, deductiblePercentage (required);
description, notes, dpaCategory, paymentMethod, images, files (optional).
A new invoiceDate moves the item atomically. A missing paymentMethod keeps the stored one.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import get_or_404, put_moving_key
from fiscus.money import (
    TAXED_AMOUNT_FIELDS,
    deductible_amounts,
    deductible_percentage,
    taxed_amounts,
)
from fiscus.validation import attachments_json, optional_text, require

TABLE_EXPENSES = os.environ["TABLE_EXPENSES"]

table = boto3.resource("dynamodb").Table(TABLE_EXPENSES)

REQUIRED = (
    "id",
    "oldInvoiceDate",
    "invoiceDate",
    "businessId",
    "expenseType",
    *TAXED_AMOUNT_FIELDS,
    "deductiblePercentage",
)


@api_handler
def lambda_handler(data, context):
    require(data, *REQUIRED)
    item = get_or_404(table, {"id": data["id"], "invoiceDate": data["oldInvoiceDate"]}, "Expense")
    amounts = taxed_amounts(data)
    percentage = deductible_percentage(data)
    item.update(
        {
            "businessId": data["businessId"],
            "invoiceDate": data["invoiceDate"],
            "description": optional_text(data, "description"),
            "expenseType": data["expenseType"],
            "dpaCategory": data.get("dpaCategory"),
            **amounts,
            "deductiblePercentage": percentage,
            **deductible_amounts(amounts, percentage),
            "paymentMethod": data.get("paymentMethod", item.get("paymentMethod")),
            "notes": optional_text(data, "notes"),
            **attachments_json(data),
        }
    )
    put_moving_key(table, item, "invoiceDate", data["oldInvoiceDate"])
    return ok("Expense updated successfully!", item)
