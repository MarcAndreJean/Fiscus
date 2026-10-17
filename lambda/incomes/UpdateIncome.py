"""PUT /incomes — replace one income.

Body: id, oldInvoiceDate (the stored sort key), invoiceDate, businessId, subtotal,
hasTps, hasTvq, tps, tvq, total (required); clientName, description, notes,
paymentMethod, items, images, files (optional).
A new invoiceDate moves the item atomically. A missing paymentMethod keeps the stored one.
"""

import json
import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import get_or_404, put_moving_key
from fiscus.money import TAXED_AMOUNT_FIELDS, taxed_amounts
from fiscus.validation import attachments_json, optional_text, require

TABLE_INCOMES = os.environ["TABLE_INCOMES"]

table = boto3.resource("dynamodb").Table(TABLE_INCOMES)

REQUIRED = ("id", "oldInvoiceDate", "invoiceDate", "businessId", *TAXED_AMOUNT_FIELDS)


@api_handler
def lambda_handler(data, context):
    require(data, *REQUIRED)
    item = get_or_404(table, {"id": data["id"], "invoiceDate": data["oldInvoiceDate"]}, "Income")
    item.update(
        {
            "businessId": data["businessId"],
            "invoiceDate": data["invoiceDate"],
            "clientName": optional_text(data, "clientName"),
            "description": optional_text(data, "description"),
            **taxed_amounts(data),
            "paymentMethod": data.get("paymentMethod", item.get("paymentMethod")),
            "notes": optional_text(data, "notes"),
            "items": json.dumps(data.get("items") or []),
            **attachments_json(data),
        }
    )
    put_moving_key(table, item, "invoiceDate", data["oldInvoiceDate"])
    return ok("Income updated successfully!", item)
