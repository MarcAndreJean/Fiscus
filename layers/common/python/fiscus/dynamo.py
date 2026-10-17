"""DynamoDB helpers: full scans, lookups and deletes that 404, and atomic sort-key moves.

Every table is keyed by ``id`` plus a date sort key. Changing the date therefore means
writing a new item and deleting the old one; ``put_moving_key`` does both in one
transaction so a failure can never leave two copies (or none). ``table.meta.client``
belongs to a boto3 resource, so it takes plain Python values and serialises them itself.
"""

from typing import Any

from fiscus.api import NotFoundError
from fiscus.dates import utc_now_iso

ITEM_EXISTS = "attribute_exists(id)"


def scan_all(table: Any, **scan_kwargs: Any) -> list[dict]:
    items: list[dict] = []
    while True:
        response = table.scan(**scan_kwargs)
        items.extend(response.get("Items", []))
        last_key = response.get("LastEvaluatedKey")
        if not last_key:
            return items
        scan_kwargs["ExclusiveStartKey"] = last_key


def get_or_404(table: Any, key: dict, label: str) -> dict:
    item = table.get_item(Key=key).get("Item")
    if item is None:
        raise NotFoundError(f"{label} not found")
    return item


def delete_or_404(table: Any, key: dict, label: str) -> None:
    """Delete the item, or raise the same NotFoundError as ``get_or_404`` if it is missing.

    The existence check is part of the delete itself, so nothing can remove the item
    in between.
    """
    try:
        table.delete_item(Key=key, ConditionExpression=ITEM_EXISTS)
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        raise NotFoundError(f"{label} not found") from None


def archive_and_delete(table: Any, archive_table: Any, key: dict, label: str) -> None:
    """Move the item, stamped with ``archiveDate``, to the archive table in one transaction.

    If the item is missing, or deleted by another request between the lookup and the
    transaction, nothing is archived and the same NotFoundError as ``get_or_404`` is raised.
    """
    archived_item = {**get_or_404(table, key, label), "archiveDate": utc_now_iso()}
    client = table.meta.client
    try:
        client.transact_write_items(
            TransactItems=[
                {"Put": {"TableName": archive_table.name, "Item": archived_item}},
                {
                    "Delete": {
                        "TableName": table.name,
                        "Key": key,
                        "ConditionExpression": ITEM_EXISTS,
                    }
                },
            ]
        )
    except client.exceptions.TransactionCanceledException as error:
        reasons = error.response.get("CancellationReasons", [])
        if any(reason.get("Code") == "ConditionalCheckFailed" for reason in reasons):
            raise NotFoundError(f"{label} not found") from None
        raise


def put_moving_key(table: Any, item: dict, key_name: str, old_value: str) -> None:
    if item[key_name] == old_value:
        table.put_item(Item=item)
        return
    table.meta.client.transact_write_items(
        TransactItems=[
            {"Put": {"TableName": table.name, "Item": item}},
            {
                "Delete": {
                    "TableName": table.name,
                    "Key": {"id": item["id"], key_name: old_value},
                    "ConditionExpression": ITEM_EXISTS,
                }
            },
        ]
    )
