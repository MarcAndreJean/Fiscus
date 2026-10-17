"""POST /expenses — create one business expense.

Body: userId, businessId, expenseGroupId, invoiceDate, expenseType, subtotal, hasTps,
hasTvq, tps, tvq, total, deductiblePercentage (required); description, notes,
dpaCategory, paymentMethod, images, files (optional).
The deductible amounts are computed here from deductiblePercentage.
"""

import os
import uuid

import boto3
from fiscus.api import api_handler, ok
from fiscus.dates import utc_now_iso
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
    "userId",
    "businessId",
    "expenseGroupId",
    "invoiceDate",
    "expenseType",
    *TAXED_AMOUNT_FIELDS,
    "deductiblePercentage",
)


@api_handler
def lambda_handler(data, context):
    require(data, *REQUIRED)
    amounts = taxed_amounts(data)
    percentage = deductible_percentage(data)
    item = {
        "id": str(uuid.uuid4()),
        "userId": data["userId"],
        "businessId": data["businessId"],
        "expenseGroupId": data["expenseGroupId"],
        "invoiceDate": data["invoiceDate"],
        "description": optional_text(data, "description"),
        "expenseType": data["expenseType"],
        "dpaCategory": data.get("dpaCategory"),
        **amounts,
        "deductiblePercentage": percentage,
        **deductible_amounts(amounts, percentage),
        "paymentMethod": data.get("paymentMethod"),
        "notes": optional_text(data, "notes"),
        "creationDate": utc_now_iso(),
        **attachments_json(data),
    }
    table.put_item(Item=item)
    return ok("Expense created successfully!", item)
