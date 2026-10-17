"""POST /incomes — create one income.

Body: userId, businessId, invoiceDate, subtotal, hasTps, hasTvq, tps, tvq, total
(required); clientName, description, notes, paymentMethod, items, images, files (optional).
"""

import json
import os
import uuid

import boto3
from fiscus.api import api_handler, ok
from fiscus.dates import utc_now_iso
from fiscus.money import TAXED_AMOUNT_FIELDS, taxed_amounts
from fiscus.validation import attachments_json, optional_text, require

TABLE_INCOMES = os.environ["TABLE_INCOMES"]

table = boto3.resource("dynamodb").Table(TABLE_INCOMES)

REQUIRED = ("userId", "businessId", "invoiceDate", *TAXED_AMOUNT_FIELDS)


@api_handler
def lambda_handler(data, context):
    require(data, *REQUIRED)
    item = {
        "id": str(uuid.uuid4()),
        "userId": data["userId"],
        "businessId": data["businessId"],
        "invoiceDate": data["invoiceDate"],
        "clientName": optional_text(data, "clientName"),
        "description": optional_text(data, "description"),
        **taxed_amounts(data),
        "paymentMethod": data.get("paymentMethod"),
        "notes": optional_text(data, "notes"),
        "creationDate": utc_now_iso(),
        "items": json.dumps(data.get("items") or []),
        **attachments_json(data),
    }
    table.put_item(Item=item)
    return ok("Income created successfully!", item)
