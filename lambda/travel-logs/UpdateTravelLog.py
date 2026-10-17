"""PUT /travel-logs — replace one travel log.

Body: id, oldTravelDate (the stored sort key), travelDate, carId, businessId
(required); reason, notes, totalKm, consumption, images, files (optional). userId is never
changed. A new travelDate moves the item atomically.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import get_or_404, put_moving_key
from fiscus.validation import attachments_json, optional_decimal, optional_text, require

TABLE_TRAVEL_LOGS = os.environ["TABLE_TRAVEL_LOGS"]

table = boto3.resource("dynamodb").Table(TABLE_TRAVEL_LOGS)

REQUIRED = ("id", "oldTravelDate", "travelDate", "carId", "businessId")


@api_handler
def lambda_handler(data, context):
    require(data, *REQUIRED)
    key = {"id": data["id"], "travelDate": data["oldTravelDate"]}
    item = get_or_404(table, key, "Travel log")
    item.update(
        {
            "carId": data["carId"],
            "businessId": data["businessId"],
            "travelDate": data["travelDate"],
            "reason": optional_text(data, "reason"),
            "notes": optional_text(data, "notes"),
            "totalKm": optional_decimal(data, "totalKm"),
            "consumption": optional_decimal(data, "consumption"),
            **attachments_json(data),
        }
    )
    put_moving_key(table, item, "travelDate", data["oldTravelDate"])
    return ok("Travel log updated successfully!", item)
