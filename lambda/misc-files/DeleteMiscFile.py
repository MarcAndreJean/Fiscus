"""DELETE /misc-files — delete one misc file entry.

Body: id, date. Misc files have no archive table.
"""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.dynamo import delete_or_404
from fiscus.validation import require

TABLE_MISC_FILES = os.environ["TABLE_MISC_FILES"]

table = boto3.resource("dynamodb").Table(TABLE_MISC_FILES)


@api_handler
def lambda_handler(data, context):
    require(data, "id", "date")
    delete_or_404(table, {"id": data["id"], "date": data["date"]}, "Misc file")
    return ok("Misc file deleted successfully!", data["id"])
