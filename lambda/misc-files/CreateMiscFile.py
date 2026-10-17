"""POST /misc-files — create one misc file entry.

Body: userId, date, category (required); description, notes, amount (optional number,
null allowed), images, files (optional).
"""

import os
import uuid

import boto3
from fiscus.api import api_handler, ok
from fiscus.dates import utc_now_iso
from fiscus.validation import attachments_json, optional_decimal, optional_text, require

TABLE_MISC_FILES = os.environ["TABLE_MISC_FILES"]

table = boto3.resource("dynamodb").Table(TABLE_MISC_FILES)


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "date", "category")
    item = {
        "id": str(uuid.uuid4()),
        "userId": data["userId"],
        "date": data["date"],
        "description": optional_text(data, "description"),
        "notes": optional_text(data, "notes"),
        "category": data["category"],
        "amount": optional_decimal(data, "amount"),
        "creationDate": utc_now_iso(),
        **attachments_json(data),
    }
    table.put_item(Item=item)
    return ok("Misc file created successfully!", item)
