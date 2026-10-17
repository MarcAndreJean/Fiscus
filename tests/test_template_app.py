"""Checks on the application part of template.yaml.

Covers functions, layers, API, usage plan, key and outputs.
"""

import re
from pathlib import Path

import pytest
from helpers import ENV_VARS, HANDLER_FILES, REPO_ROOT
from template_loader import load_template

OPENAPI_PATH = REPO_ROOT / "openapi.yaml"

EXPECTED_FUNCTIONS = {Path(p).stem for p in HANDLER_FILES}  # the 33 handlers
HANDLER_PATHS = {Path(p).stem: p for p in HANDLER_FILES}

ENV_TO_RESOURCE = {
    "TABLE_INCOMES": "IncomesTable",
    "TABLE_EXPENSES": "ExpensesTable",
    "TABLE_CAR_EXPENSES": "CarExpensesTable",
    "TABLE_HOUSE_EXPENSES": "HouseExpensesTable",
    "TABLE_TRAVEL_LOGS": "TravelLogsTable",
    "TABLE_MISC_FILES": "MiscFilesTable",
    "TABLE_ARCHIVE_INCOMES": "ArchiveIncomesTable",
    "TABLE_ARCHIVE_EXPENSES": "ArchiveExpensesTable",
    "TABLE_ARCHIVE_CAR_EXPENSES": "ArchiveCarExpensesTable",
    "TABLE_ARCHIVE_HOUSE_EXPENSES": "ArchiveHouseExpensesTable",
    "BUCKET_NAME": "FilesBucket",
}

TIMEOUT_OVERRIDES = {
    "ReadIncomes": 15,
    "ReadExpenses": 15,
    "DeleteExpense": 3,
    "DeleteIncome": 3,
    "ReadFile": 3,
    "FindDuplicates": 15,
    **{name: 15 for name in EXPECTED_FUNCTIONS if name.startswith("Report")},
}

ENV_RE = re.compile(r"""os\.environ\[['"](\w+)['"]\]""")


@pytest.fixture(scope="module")
def template():
    return load_template()


@pytest.fixture(scope="module")
def resources(template):
    return template["Resources"]


@pytest.fixture(scope="module")
def functions(resources):
    return {
        lid: res for lid, res in resources.items() if res["Type"] == "AWS::Serverless::Function"
    }


def _of_type(resources, type_name):
    return {lid: res for lid, res in resources.items() if res["Type"] == type_name}


def _is_write(handler):
    return handler.startswith(("Create", "Update", "Delete"))


def test_handler_count():
    assert len(EXPECTED_FUNCTIONS) == 33
    areas = {}
    for p in HANDLER_FILES:
        areas[Path(p).parent.name] = areas.get(Path(p).parent.name, 0) + 1
    assert areas == {
        "incomes": 4,
        "expenses": 4,
        "car-expenses": 4,
        "house-expenses": 4,
        "misc-files": 4,
        "travel-logs": 4,
        "files": 2,
        "report": 7,
    }


def test_function_set(functions):
    assert all(lid.endswith("Function") for lid in functions)
    assert {lid.removesuffix("Function") for lid in functions} == EXPECTED_FUNCTIONS


def test_handlers_exist(functions):
    for lid, res in functions.items():
        name = lid.removesuffix("Function")
        props = res["Properties"]
        expected_dir = Path(HANDLER_PATHS[name]).parent.as_posix() + "/"
        assert props["CodeUri"] == expected_dir, lid
        assert props["Handler"] == f"{name}.lambda_handler", lid
        assert (REPO_ROOT / props["CodeUri"] / f"{name}.py").is_file(), lid
        assert "Events" not in props, lid


def test_no_fixed_physical_names(resources, functions):
    for lid, res in functions.items():
        assert "FunctionName" not in res["Properties"], lid
    for lid, res in resources.items():
        assert "RoleName" not in res.get("Properties", {}), lid
    # A name is allowed only if it is per-stack: Fn::Sub containing ${AWS::StackName}.
    named = {
        "AWS::Serverless::Api": "Name",
        "AWS::Serverless::LayerVersion": "LayerName",
        "AWS::ApiGateway::UsagePlan": "UsagePlanName",
        "AWS::ApiGateway::ApiKey": "Name",
    }
    for rtype, prop in named.items():
        for lid, res in _of_type(resources, rtype).items():
            value = res["Properties"].get(prop)
            if value is None:
                continue
            assert isinstance(value, dict) and list(value) == ["Fn::Sub"], (
                f"{lid}.{prop} is a fixed name"
            )
            assert "${AWS::StackName}" in value["Fn::Sub"], f"{lid}.{prop} is not per-stack"


def test_api_name_is_per_stack(resources):
    # Two stacks in one account must not share an API name.
    api = resources["Api"]["Properties"]
    assert api["Name"] == {"Fn::Sub": "${AWS::StackName}-api"}


def test_function_settings(template, functions):
    glob = template["Globals"]["Function"]
    assert glob["Runtime"] == "python3.14"
    assert glob["Architectures"] == ["arm64"]
    assert glob["MemorySize"] == 128
    assert glob["EphemeralStorage"] == {"Size": 512}
    assert glob["Timeout"] == 5
    assert glob["Environment"]["Variables"] == {
        name: {"Ref": logical_id} for name, logical_id in ENV_TO_RESOURCE.items()
    }
    assert set(glob["Environment"]["Variables"]) == set(ENV_VARS)
    for lid, res in functions.items():
        props = res["Properties"]
        for key in ("Runtime", "Architectures", "MemorySize", "EphemeralStorage", "Environment"):
            assert key not in props, f"{lid} overrides {key}"
        name = lid.removesuffix("Function")
        timeout = props.get("Timeout", glob["Timeout"])
        assert timeout == TIMEOUT_OVERRIDES.get(name, 5), lid


def test_every_function_gets_the_common_layer(template, resources):
    assert template["Globals"]["Function"]["Layers"] == [{"Ref": "CommonLayer"}]
    layer = resources["CommonLayer"]
    assert layer["Type"] == "AWS::Serverless::LayerVersion"
    assert layer["Properties"]["ContentUri"] == "layers/common/"
    assert layer["Properties"]["CompatibleRuntimes"] == ["python3.14"]
    assert layer["Properties"]["CompatibleArchitectures"] == ["arm64"]
    assert "Metadata" not in layer
    assert (REPO_ROOT / "layers/common/python/fiscus/__init__.py").is_file()


def test_report_functions_use_layer(resources, functions):
    layer = resources["OpenpyxlLayer"]
    assert layer["Type"] == "AWS::Serverless::LayerVersion"
    assert layer["Properties"]["ContentUri"] == "layers/openpyxl/"
    assert layer["Properties"]["CompatibleRuntimes"] == ["python3.14"]
    assert layer["Properties"]["CompatibleArchitectures"] == ["arm64"]
    assert layer["Metadata"]["BuildMethod"] == "python3.14"
    reqs = (REPO_ROOT / "layers/openpyxl/requirements.txt").read_text(encoding="utf-8")
    assert reqs.split() == ["openpyxl==3.1.5"]
    for lid, res in functions.items():
        layers = res["Properties"].get("Layers")
        if res["Properties"]["CodeUri"] == "lambda/report/":
            assert layers == [{"Ref": "OpenpyxlLayer"}], lid
        else:
            assert layers is None, lid


def _expected_policies(name):
    source = (REPO_ROOT / HANDLER_PATHS[name]).read_text(encoding="utf-8")
    env_names = sorted(set(ENV_RE.findall(source)))
    assert env_names, f"{name} reads no env vars"
    write = _is_write(name)
    expected = []
    for env in env_names:
        logical_id = ENV_TO_RESOURCE[env]
        if env == "BUCKET_NAME":
            policy = "S3CrudPolicy" if write else "S3ReadPolicy"
            expected.append({policy: {"BucketName": {"Ref": logical_id}}})
        else:
            policy = "DynamoDBCrudPolicy" if write else "DynamoDBReadPolicy"
            expected.append({policy: {"TableName": {"Ref": logical_id}}})
    return expected


def _key(policy):
    return repr(sorted(policy.items()))


def test_policies_cover_every_resource_the_code_reads(functions):
    for lid, res in functions.items():
        name = lid.removesuffix("Function")
        actual = res["Properties"].get("Policies", [])
        expected = _expected_policies(name)
        assert sorted(map(_key, actual)) == sorted(map(_key, expected)), lid


def test_every_function_has_api_permission(resources, functions):
    for lid in functions:
        perm_id = lid.removesuffix("Function") + "ApiPermission"
        perm = resources[perm_id]
        assert perm["Type"] == "AWS::Lambda::Permission", perm_id
        props = perm["Properties"]
        assert props["Action"] == "lambda:InvokeFunction"
        assert props["FunctionName"] in ({"Ref": lid}, {"Fn::GetAtt": [lid, "Arn"]}), perm_id
        assert props["Principal"] == "apigateway.amazonaws.com"
        assert props["SourceArn"] == {
            "Fn::Sub": "arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${Api}/*"
        }
    assert len(_of_type(resources, "AWS::Lambda::Permission")) == len(functions)


def test_api(resources):
    api = resources["Api"]
    assert api["Type"] == "AWS::Serverless::Api"
    props = api["Properties"]
    assert props["StageName"] == "prod"
    assert props["OpenApiVersion"] == "3.0.1"
    assert props["EndpointConfiguration"] in ("REGIONAL", {"Type": "REGIONAL"})
    assert props["MethodSettings"] == [
        {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "ThrottlingBurstLimit": 25,
            "ThrottlingRateLimit": 25,
            "MetricsEnabled": False,
            "DataTraceEnabled": False,
        }
    ]
    assert props["DefinitionBody"] == {
        "Fn::Transform": {"Name": "AWS::Include", "Parameters": {"Location": "openapi.yaml"}}
    }


def test_every_openapi_function_ref_exists(functions):
    refs = set(re.findall(r"\$\{(\w+)\.Arn\}", OPENAPI_PATH.read_text(encoding="utf-8")))
    assert refs, "no function references found in openapi.yaml"
    assert refs <= set(functions)
    assert refs == set(functions)


def test_only_one_api_key_in_template(resources):
    assert list(_of_type(resources, "AWS::ApiGateway::ApiKey")) == ["StarterApiKey"]
    props = resources["StarterApiKey"]["Properties"]
    assert props["Enabled"] is True
    assert "Value" not in props
    assert len(_of_type(resources, "AWS::ApiGateway::UsagePlanKey")) == 1
    link = resources["StarterUsagePlanKey"]
    assert link["Type"] == "AWS::ApiGateway::UsagePlanKey"
    assert link["Properties"] == {
        "KeyId": {"Ref": "StarterApiKey"},
        "KeyType": "API_KEY",
        "UsagePlanId": {"Ref": "UsagePlan"},
    }


def test_usage_plan_limits(resources):
    plan = resources["UsagePlan"]
    assert plan["Type"] == "AWS::ApiGateway::UsagePlan"
    props = plan["Properties"]
    assert props["ApiStages"] == [{"ApiId": {"Ref": "Api"}, "Stage": {"Ref": "Api.Stage"}}]
    assert props["Throttle"] == {"BurstLimit": 100, "RateLimit": 25}
    assert props["Quota"] == {"Limit": 5000, "Period": "DAY"}


def test_outputs(template):
    outputs = template["Outputs"]
    assert set(outputs) == {"ApiUrl", "StarterApiKeyId", "UsagePlanId", "BucketName"}
    assert outputs["ApiUrl"]["Value"] == {
        "Fn::Sub": "https://${Api}.execute-api.${AWS::Region}.amazonaws.com/prod"
    }
    assert outputs["StarterApiKeyId"]["Value"] == {"Ref": "StarterApiKey"}
    assert outputs["UsagePlanId"]["Value"] == {"Ref": "UsagePlan"}
    assert outputs["BucketName"]["Value"] == {"Ref": "FilesBucket"}
