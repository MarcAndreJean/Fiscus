"""DELETE /travel-logs — delete one travel log.

Body: id, travelDate. Travel logs have no archive table.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import delete_or_404
from fiscus.validation import require

TABLE_TRAVEL_LOGS = os.environ["TABLE_TRAVEL_LOGS"]

table = boto3.resource("dynamodb").Table(TABLE_TRAVEL_LOGS)


@api_handler
def lambda_handler(data, context):
    require(data, "id", "travelDate")
    delete_or_404(table, {"id": data["id"], "travelDate": data["travelDate"]}, "Travel log")
    return ok("Travel log deleted successfully!", data["id"])
