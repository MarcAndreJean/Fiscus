"""GET /files/{s3key+} — a presigned download URL for one file, valid for one hour."""

import os

import boto3
from fiscus.api import api_handler, ok
from fiscus.validation import require

BUCKET_NAME = os.environ["BUCKET_NAME"]

s3 = boto3.client("s3")

URL_LIFETIME_SECONDS = 3600


@api_handler
def lambda_handler(data, context):
    require(data, "s3key")
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": BUCKET_NAME, "Key": data["s3key"]},
        ExpiresIn=URL_LIFETIME_SECONDS,
    )
    return ok("Presigned URL generated successfully!", url)
