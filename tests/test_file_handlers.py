"""Tests for the file upload (CreateFile) and download URL (ReadFile) handlers."""

import base64
import re

import boto3
import pytest
from helpers import load_handler
from moto import mock_aws

CONTENT = base64.b64encode(b"hello").decode()
UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"


@pytest.fixture
def s3():
    with mock_aws():
        client = boto3.client("s3")
        client.create_bucket(
            Bucket="test-bucket",
            CreateBucketConfiguration={"LocationConstraint": "ca-central-1"},
        )
        yield client


@pytest.fixture
def create_file(s3):
    return load_handler("lambda/files/CreateFile.py")


def upload_event(**overrides):
    event = {
        "fileContent": CONTENT,
        "fileName": "receipt.png",
        "userId": "u",
        "tagId": None,
        "category": "invoice",
        "year": 2025,
    }
    event.update(overrides)
    return event


@pytest.mark.parametrize(
    "category,tag,pattern",
    [
        ("invoice", None, rf"2025/invoice/u/{UUID}\.png"),
        ("expense", "biz", rf"2025/expense/u-biz/{UUID}\.png"),
        ("misc-file", None, rf"2025/misc-file/u/{UUID}\.png"),
        ("car-expense", "car1", rf"2025/car-expense/car1/{UUID}\.png"),
    ],
)
def test_upload_keeps_the_key_layout(s3, create_file, category, tag, pattern):
    result = create_file.lambda_handler(upload_event(category=category, tagId=tag), None)

    assert result["statusCode"] == 200
    assert re.fullmatch(pattern, result["data"]), result["data"]
    body = s3.get_object(Bucket="test-bucket", Key=result["data"])["Body"].read()
    assert body == b"hello"


@pytest.mark.parametrize(
    "file_name", ["README", "notes.", "scan./a/b", "x.e\x00e", "x.averyverylongext"]
)
def test_upload_without_a_safe_extension_has_none(create_file, file_name):
    result = create_file.lambda_handler(upload_event(fileName=file_name), None)
    assert re.fullmatch(rf"2025/invoice/u/{UUID}", result["data"])


def test_upload_lowercases_the_extension(create_file):
    result = create_file.lambda_handler(upload_event(fileName="Receipt.PDF"), None)
    assert re.fullmatch(rf"2025/invoice/u/{UUID}\.pdf", result["data"])


def test_budget_category_is_400(create_file):
    assert create_file.lambda_handler(upload_event(category="budget"), None)["statusCode"] == 400


def test_unknown_category_is_400(create_file):
    result = create_file.lambda_handler(upload_event(category="secrets"), None)
    assert result["statusCode"] == 400
    assert "category" in result["message"]


def test_missing_year_is_400(s3, create_file):
    event = upload_event()
    del event["year"]
    result = create_file.lambda_handler(event, None)
    assert result["statusCode"] == 400
    assert "year" in result["message"]
    assert s3.list_objects_v2(Bucket="test-bucket").get("KeyCount") == 0


def test_text_year_is_400(create_file):
    assert create_file.lambda_handler(upload_event(year="soon"), None)["statusCode"] == 400


@pytest.mark.parametrize(
    "field,value", [("userId", "../other"), ("tagId", "a/b"), ("userId", "..")]
)
def test_path_traversal_is_400(s3, create_file, field, value):
    result = create_file.lambda_handler(upload_event(**{field: value}), None)
    assert result["statusCode"] == 400
    assert s3.list_objects_v2(Bucket="test-bucket").get("KeyCount") == 0


def test_bad_base64_is_400(create_file):
    result = create_file.lambda_handler(upload_event(fileContent="not base64!"), None)
    assert result == {"statusCode": 400, "message": "fileContent must be base64"}


def test_read_file_returns_a_presigned_url(s3):
    s3.put_object(Bucket="test-bucket", Key="2025/invoice/u/a.png", Body=b"x")
    read_file = load_handler("lambda/files/ReadFile.py")

    result = read_file.lambda_handler({"s3key": "2025/invoice/u/a.png"}, None)

    assert result["statusCode"] == 200
    assert result["data"].startswith("https://test-bucket.s3")
    assert "2025/invoice/u/a.png" in result["data"]
    assert "X-Amz-Expires=3600" in result["data"]


def test_read_file_without_key_is_400(s3):
    read_file = load_handler("lambda/files/ReadFile.py")
    assert read_file.lambda_handler({"s3key": ""}, None)["statusCode"] == 400


@pytest.mark.parametrize("field,value", [("userId", 42), ("tagId", 7), ("fileName", 3)])
def test_non_text_ids_are_400(create_file, field, value):
    assert create_file.lambda_handler(upload_event(**{field: value}), None)["statusCode"] == 400
