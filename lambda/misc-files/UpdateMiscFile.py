"""PUT /misc-files — replace one misc file entry.

Body: id, oldDate (the stored sort key), date, category (required); description, notes,
amount, images, files (optional). A new date moves the item atomically.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import get_or_404, put_moving_key
from fiscus.validation import attachments_json, optional_decimal, optional_text, require

TABLE_MISC_FILES = os.environ["TABLE_MISC_FILES"]

table = boto3.resource("dynamodb").Table(TABLE_MISC_FILES)


@api_handler
def lambda_handler(data, context):
    require(data, "id", "oldDate", "date", "category")
    item = get_or_404(table, {"id": data["id"], "date": data["oldDate"]}, "Misc file")
    item.update(
        {
            "date": data["date"],
            "description": optional_text(data, "description"),
            "notes": optional_text(data, "notes"),
            "category": data["category"],
            "amount": optional_decimal(data, "amount"),
            **attachments_json(data),
        }
    )
    put_moving_key(table, item, "date", data["oldDate"])
    return ok("Misc file updated successfully!", item)
