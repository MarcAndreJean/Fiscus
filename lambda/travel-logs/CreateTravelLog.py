"""POST /travel-logs — create one travel log.

Body: userId, carId, businessId, travelDate (required); reason, notes, totalKm,
consumption (optional numbers, null allowed), images, files (optional).
"""

import os
import uuid

import boto3
from fiscus.api import api_handler, ok
from fiscus.dates import utc_now_iso
from fiscus.validation import attachments_json, optional_decimal, optional_text, require

TABLE_TRAVEL_LOGS = os.environ["TABLE_TRAVEL_LOGS"]

table = boto3.resource("dynamodb").Table(TABLE_TRAVEL_LOGS)


@api_handler
def lambda_handler(data, context):
    require(data, "userId", "carId", "businessId", "travelDate")
    item = {
        "id": str(uuid.uuid4()),
        "userId": data["userId"],
        "carId": data["carId"],
        "businessId": data["businessId"],
        "travelDate": data["travelDate"],
        "reason": optional_text(data, "reason"),
        "notes": optional_text(data, "notes"),
        "totalKm": optional_decimal(data, "totalKm"),
        "consumption": optional_decimal(data, "consumption"),
        "creationDate": utc_now_iso(),
        **attachments_json(data),
    }
    table.put_item(Item=item)
    return ok("Travel log created successfully!", item)
