"""Add, list and remove API Gateway keys on the Fiscus usage plan.

Keys made here are never part of template.yaml, so `sam deploy` leaves them alone.

    python scripts/keys.py [--stack NAME] [--profile P] [--region R] add NAME
    python scripts/keys.py [--stack NAME] [--profile P] [--region R] list
    python scripts/keys.py [--stack NAME] [--profile P] [--region R] remove NAME
"""

import argparse
import sys
import tomllib
from pathlib import Path

import boto3

SAMCONFIG = Path(__file__).resolve().parent.parent / "samconfig.toml"


def read_samconfig(path=SAMCONFIG) -> dict:
    """Return the samconfig.toml parameters for the default environment, or {} if absent.

    [default.deploy.parameters] wins; [default.global.parameters] fills in what it lacks.
    """
    try:
        with open(path, "rb") as f:
            data = tomllib.load(f)
    except FileNotFoundError:
        return {}
    default = data.get("default", {})
    return {
        **default.get("global", {}).get("parameters", {}),
        **default.get("deploy", {}).get("parameters", {}),
    }


def _stack_output(cloudformation, stack_name: str, key: str):
    stack = cloudformation.describe_stacks(StackName=stack_name)["Stacks"][0]
    for output in stack.get("Outputs", []):
        if output["OutputKey"] == key:
            return output["OutputValue"]
    return None


def find_usage_plan_id(cloudformation, stack_name: str) -> str:
    value = _stack_output(cloudformation, stack_name, "UsagePlanId")
    if value is None:
        raise KeyError(f"Stack '{stack_name}' has no UsagePlanId output")
    return value


def find_starter_key_id(cloudformation, stack_name: str):
    """Id of the template-managed starter key (stack output StarterApiKeyId), or None."""
    return _stack_output(cloudformation, stack_name, "StarterApiKeyId")


def _plan_keys(apigateway, usage_plan_id: str) -> list[dict]:
    items = []
    paginator = apigateway.get_paginator("get_usage_plan_keys")
    for page in paginator.paginate(usagePlanId=usage_plan_id):
        items.extend(page["items"])
    return items


def _find_on_plan(apigateway, usage_plan_id: str, name: str):
    return next((k for k in _plan_keys(apigateway, usage_plan_id) if k["name"] == name), None)


def add_key(apigateway, usage_plan_id: str, name: str) -> str:
    if _find_on_plan(apigateway, usage_plan_id, name):
        raise ValueError(f"A key named '{name}' is already on the usage plan")
    key = apigateway.create_api_key(name=name, enabled=True)
    try:
        apigateway.create_usage_plan_key(
            usagePlanId=usage_plan_id, keyId=key["id"], keyType="API_KEY"
        )
    except Exception:
        # Don't leave an unattached key that list/remove can't see.
        apigateway.delete_api_key(apiKey=key["id"])
        raise
    return key["value"]


def list_keys(apigateway, usage_plan_id: str) -> list[dict]:
    result = []
    for item in _plan_keys(apigateway, usage_plan_id):
        key = apigateway.get_api_key(apiKey=item["id"], includeValue=False)
        result.append(
            {
                "name": key["name"],
                "id": key["id"],
                "created": key["createdDate"],
                "enabled": key["enabled"],
            }
        )
    return sorted(result, key=lambda k: k["name"])


def remove_key(
    apigateway, usage_plan_id: str, name: str, *, protected_ids: set[str] = frozenset()
) -> None:
    item = _find_on_plan(apigateway, usage_plan_id, name)
    if not item:
        raise ValueError(f"No key named '{name}' is on the usage plan")
    if item["id"] in protected_ids:
        raise ValueError(
            f"'{name}' is the starter key managed by template.yaml; "
            "removing it here would make the next deploy fail or recreate it"
        )
    apigateway.delete_usage_plan_key(usagePlanId=usage_plan_id, keyId=item["id"])
    apigateway.delete_api_key(apiKey=item["id"])


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Manage Fiscus API keys")
    parser.add_argument("--stack", help="CloudFormation stack name (default: samconfig.toml)")
    parser.add_argument("--profile", help="AWS profile (default: samconfig.toml)")
    parser.add_argument("--region", help="AWS region (default: samconfig.toml)")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("add", help="create a key and print its value").add_argument("name")
    commands.add_parser("list", help="list keys on the usage plan")
    commands.add_parser("remove", help="delete a key").add_argument("name")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    config = read_samconfig()
    stack = args.stack or config.get("stack_name")
    if not stack:
        print("No stack name: pass --stack or run sam deploy --guided", file=sys.stderr)
        return 1
    session = boto3.Session(
        profile_name=args.profile or config.get("profile"),
        region_name=args.region or config.get("region"),
    )
    cloudformation = session.client("cloudformation")
    try:
        plan_id = find_usage_plan_id(cloudformation, stack)
        apigateway = session.client("apigateway")
        if args.command == "add":
            print(add_key(apigateway, plan_id, args.name))
        elif args.command == "list":
            for key in list_keys(apigateway, plan_id):
                state = "enabled" if key["enabled"] else "disabled"
                print(f"{key['name']}\t{key['id']}\t{key['created']:%Y-%m-%d}\t{state}")
        else:
            starter_id = find_starter_key_id(cloudformation, stack)
            protected = {starter_id} if starter_id else set()
            remove_key(apigateway, plan_id, args.name, protected_ids=protected)
    except (ValueError, KeyError) as error:
        message = error.args[0] if isinstance(error, KeyError) and error.args else error
        print(message, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
