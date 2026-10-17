"""Checks on openapi.yaml (the API Gateway definition used by template.yaml)."""

import re
from pathlib import Path

import pytest
import yaml

OPENAPI_PATH = Path(__file__).resolve().parent.parent / "openapi.yaml"
TEMPLATE_PATH = OPENAPI_PATH.with_name("template.yaml")
CRUD = ("get", "post", "put", "delete")
HTTP_METHODS = {"get", "post", "put", "delete", "patch", "head"}

EXPECTED = (
    {("/incomes", m) for m in CRUD}
    | {("/expenses", m) for m in CRUD}
    | {("/car-expenses", m) for m in CRUD}
    | {("/house-expenses", m) for m in CRUD}
    | {("/misc-files", m) for m in CRUD}
    | {("/travel-logs", m) for m in CRUD}
    | {("/files", "post"), ("/files/{s3key+}", "get")}
    | {
        (f"/report/{r}", "get")
        for r in (
            "car-expenses",
            "duplicates",
            "expenses",
            "house-expenses",
            "incomes",
            "misc-files",
            "travel-logs",
        )
    }
)


@pytest.fixture(scope="module")
def spec():
    return yaml.safe_load(OPENAPI_PATH.read_text(encoding="utf-8"))


def _operations(spec):
    for path, item in spec["paths"].items():
        for method, op in item.items():
            if method in HTTP_METHODS:
                yield path, method, op


def test_route_set_matches(spec):
    assert {(p, m) for p, m, _ in _operations(spec)} == EXPECTED


def test_every_route_has_cors_options(spec):
    paths = {p for p, _ in EXPECTED} | {"/report"}
    for path in paths:
        options = spec["paths"][path].get("options")
        assert options is not None, f"{path} has no OPTIONS"
        assert options["x-amazon-apigateway-integration"]["type"] == "mock"


def test_every_route_requires_api_key(spec):
    for path, method, op in _operations(spec):
        assert op["security"] == [{"api_key": []}], f"{method} {path}"
    assert spec["components"]["securitySchemes"]["api_key"]["name"] == "x-api-key"
    assert spec["x-amazon-apigateway-api-key-source"] == "HEADER"


def test_no_account_or_region_literals():
    for path in (OPENAPI_PATH, TEMPLATE_PATH):
        text = path.read_text(encoding="utf-8")
        assert not re.search(r"\b\d{12}\b", text), f"{path.name}: 12-digit (account id) number"
        # template.yaml legitimately builds "${Api}.execute-api.${AWS::Region}..." for its output;
        # what must never appear is a concrete API id in front of the host.
        assert not re.search(r"[a-z0-9]{10}\.execute-api\.", text), (
            f"{path.name}: literal execute-api host"
        )
        assert "ca-central-1" not in text, f"{path.name}: literal region"


def test_integrations_reference_functions(spec):
    for path, method, op in _operations(spec):
        uri = op["x-amazon-apigateway-integration"]["uri"]
        assert list(uri) == ["Fn::Sub"], f"{method} {path}"
        sub = uri["Fn::Sub"]
        assert sub.startswith(
            "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${"
        )
        assert sub.endswith("Function.Arn}/invocations"), f"{method} {path}"


ESCAPED_PARAM = re.compile(
    r"""\$util\.escapeJavaScript\(\$input\.params\('\w+'\)\)\.replaceAll\("\\\\'","'"\)"""
)
PARAM_CHECK = re.compile(r"""#if\(\$input\.params\('\w+'\) != ""\)""")


def _request_templates(spec):
    for path, method, op in _operations(spec):
        templates = op["x-amazon-apigateway-integration"].get("requestTemplates", {})
        for template in templates.values():
            yield f"{method} {path}", template


def test_request_templates_escape_every_query_value(spec):
    # A raw "$input.params('x')" lets a '"' in the query break or inject into the JSON body.
    escaped_count = 0
    for route, template in _request_templates(spec):
        escaped_count += len(ESCAPED_PARAM.findall(template))
        rest = PARAM_CHECK.sub("", ESCAPED_PARAM.sub("", template))
        assert "$input.params(" not in rest, f"{route}: unescaped query value"
    assert escaped_count > 0


def test_info_has_a_version(spec):
    assert spec["info"]["version"]


def test_schema_titles_match_their_names(spec):
    for name, schema in spec["components"]["schemas"].items():
        if name != "Empty":
            assert schema["title"] == name


def test_lists_in_bodies_are_arrays(spec):
    # The handlers store images, files and income items as JSON lists.
    schemas = spec["components"]["schemas"]
    element_models = {
        "images": "AttachmentModel",
        "files": "AttachmentModel",
        "items": "IncomeItemModel",
    }
    checked = set()
    for name, schema in schemas.items():
        for field, model in element_models.items():
            if field in schema.get("properties", {}):
                expected = {"type": "array", "items": {"$ref": f"#/components/schemas/{model}"}}
                assert schema["properties"][field] == expected, f"{name}.{field}"
                checked.add(f"{name}.{field}")
    # A few known fields, so a renamed model cannot make this test check nothing.
    assert {
        "CreateExpenseModel.images",
        "UpdateExpenseModel.files",
        "CreateIncomeModel.items",
    } <= checked
    assert set(schemas["AttachmentModel"]["properties"]) == {"s3key", "fileName", "size"}
    assert schemas["IncomeItemModel"]["properties"]["item"] == {"type": "string"}


def test_deductible_percentage_is_a_number_from_0_to_100(spec):
    for name in ("CreateExpenseModel", "UpdateExpenseModel"):
        field = spec["components"]["schemas"][name]["properties"]["deductiblePercentage"]
        assert field == {"type": "number", "minimum": 0, "maximum": 100}, name


def test_new_routes_follow_sibling_pattern(spec):
    models = {
        ("/travel-logs", "put"): "UpdateTravelLogModel",
        ("/travel-logs", "delete"): "DeleteTravelLogModel",
        ("/misc-files", "put"): "UpdateMiscFileModel",
        ("/misc-files", "delete"): "DeleteMiscFileModel",
    }
    functions = {
        ("/travel-logs", "put"): "UpdateTravelLogFunction",
        ("/travel-logs", "delete"): "DeleteTravelLogFunction",
        ("/misc-files", "put"): "UpdateMiscFileFunction",
        ("/misc-files", "delete"): "DeleteMiscFileFunction",
    }
    for (path, method), model in models.items():
        op = spec["paths"][path][method]
        integ = op["x-amazon-apigateway-integration"]
        assert integ["type"] == "aws"
        assert integ["httpMethod"] == "POST"
        assert integ["requestTemplates"] == {"application/json": "$input.body"}
        ref = op["requestBody"]["content"]["application/json"]["schema"]["$ref"]
        assert ref == f"#/components/schemas/{model}"
        assert model in spec["components"]["schemas"]
        assert "${" + functions[(path, method)] + ".Arn}" in integ["uri"]["Fn::Sub"]
    for path in ("/travel-logs", "/misc-files"):
        allow = spec["paths"][path]["options"]["x-amazon-apigateway-integration"]["responses"][
            "default"
        ]["responseParameters"]["method.response.header.Access-Control-Allow-Methods"]
        assert allow == "'DELETE,GET,OPTIONS,POST,PUT'"
