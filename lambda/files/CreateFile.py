"""POST /files — upload one base64-encoded file to the files bucket.

Body: fileContent (base64), fileName, userId, category, year (required); tagId
(optional: the businessId, carId or houseId the file belongs to).
Returns the new object's S3 key. The file is stored under a random name that keeps the
original extension, lowercased, when it is 1-10 letters or digits; otherwise it has none.
"""

import base64
import binascii
import os
import re
import uuid

import boto3
from fiscus.api import ValidationError, api_handler, ok
from fiscus.validation import require

BUCKET_NAME = os.environ["BUCKET_NAME"]

s3 = boto3.client("s3")

ALLOWED_CATEGORIES = frozenset(
    {"invoice", "expense", "car-expense", "house-expense", "travel-log", "misc-file"}
)
# Categories whose tagged files live under "<userId>-<tagId>".
USER_TAGGED_CATEGORIES = frozenset({"invoice", "expense", "travel-log", "misc-file"})
EXTENSION = re.compile(r"[A-Za-z0-9]{1,10}")


def _path_segment(value: object, field: str) -> str:
    if not isinstance(value, str):
        raise ValidationError(f"{field} must be text")
    if "/" in value or "\\" in value or ".." in value:
        raise ValidationError(f"{field} must not contain '/' or '..'")
    return value


def _s3_key(year: int, category: str, user_id: str, tag_id: str | None, file_name: str) -> str:
    if tag_id is None:
        return f"{year}/{category}/{user_id}/{file_name}"
    if category in USER_TAGGED_CATEGORIES:
        return f"{year}/{category}/{user_id}-{tag_id}/{file_name}"
    return f"{year}/{category}/{tag_id}/{file_name}"


@api_handler
def lambda_handler(data, context):
    require(data, "fileContent", "fileName", "userId", "category", "year")
    category = data["category"]
    if category not in ALLOWED_CATEGORIES:
        raise ValidationError(f"category must be one of: {', '.join(sorted(ALLOWED_CATEGORIES))}")
    try:
        year = int(data["year"])
    except (TypeError, ValueError):
        raise ValidationError("year must be a number") from None
    try:
        content = base64.b64decode(data["fileContent"], validate=True)
    except (binascii.Error, ValueError):
        raise ValidationError("fileContent must be base64") from None

    user_id = _path_segment(data["userId"], "userId")
    tag_id = data.get("tagId") or None
    if tag_id is not None:
        tag_id = _path_segment(tag_id, "tagId")

    if not isinstance(data["fileName"], str):
        raise ValidationError("fileName must be text")
    _, dot, extension = data["fileName"].rpartition(".")
    if dot and EXTENSION.fullmatch(extension):
        file_name = f"{uuid.uuid4()}.{extension.lower()}"
    else:
        file_name = str(uuid.uuid4())

    s3_key = _s3_key(year, category, user_id, tag_id, file_name)
    s3.put_object(Bucket=BUCKET_NAME, Key=s3_key, Body=content)
    return ok("File uploaded successfully!", s3_key)
