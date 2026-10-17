"""POST /house-expenses — create one house expense.

Body: houseId, expenseGroupId, invoiceDate, expenseType, subtotal, hasTps, hasTvq, tps,
tvq, total (required); description, notes, images, files (optional).
"""

import os
import uuid

import boto3
from fiscus.api import api_handler, ok
from fiscus.dates import utc_now_iso
from fiscus.money import TAXED_AMOUNT_FIELDS, taxed_amounts
from fiscus.validation import attachments_json, optional_text, require

TABLE_HOUSE_EXPENSES = os.environ["TABLE_HOUSE_EXPENSES"]

table = boto3.resource("dynamodb").Table(TABLE_HOUSE_EXPENSES)

REQUIRED = ("houseId", "expenseGroupId", "invoiceDate", "expenseType", *TAXED_AMOUNT_FIELDS)


@api_handler
def lambda_handler(data, context):
    require(data, *REQUIRED)
    item = {
        "id": str(uuid.uuid4()),
        "houseId": data["houseId"],
        "expenseGroupId": data["expenseGroupId"],
        "invoiceDate": data["invoiceDate"],
        "description": optional_text(data, "description"),
        "expenseType": data["expenseType"],
        **taxed_amounts(data),
        "notes": optional_text(data, "notes"),
        "creationDate": utc_now_iso(),
        **attachments_json(data),
    }
    table.put_item(Item=item)
    return ok("House expense created successfully!", item)
