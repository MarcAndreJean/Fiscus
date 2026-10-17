"""Checks on scripts/gen_api.py, which builds openapi.yaml and template.yaml from api/."""

import copy

import gen_api
import pytest
import yaml
from test_openapi import EXPECTED


@pytest.fixture(scope="module")
def outputs():
    return gen_api.build()


@pytest.fixture(scope="module")
def spec():
    return yaml.safe_load(gen_api.ROUTES_PATH.read_text(encoding="utf-8"))


def test_committed_files_are_up_to_date():
    # Fails after editing api/ without running: python scripts/gen_api.py
    assert gen_api.stale_files(gen_api.build(), gen_api.ROOT) == []


def test_generated_routes_are_the_expected_ones(outputs):
    paths = yaml.safe_load(outputs["openapi.yaml"])["paths"]
    operations = {
        (path, method)
        for path, item in paths.items()
        for method in item
        if method in gen_api.HTTP_METHODS
    }
    assert operations == EXPECTED


def test_stale_files_reports_what_differs(outputs, tmp_path):
    assert gen_api.stale_files(outputs, tmp_path) == ["openapi.yaml", "template.yaml"]
    for name, text in outputs.items():
        (tmp_path / name).write_text(text, encoding="utf-8", newline="\n")
    assert gen_api.stale_files(outputs, tmp_path) == []
    (tmp_path / "openapi.yaml").write_text("changed", encoding="utf-8")
    assert gen_api.stale_files(outputs, tmp_path) == ["openapi.yaml"]


def test_main_writes_both_files(tmp_path):
    assert gen_api.main(["--out-dir", str(tmp_path)]) == 0
    assert sorted(path.name for path in tmp_path.iterdir()) == ["openapi.yaml", "template.yaml"]


def test_request_template_puts_optional_parameters_in_if_blocks():
    template = gen_api.request_template([("year", False), ("month", True), ("userId", False)])
    lines = template.split("\n")
    assert lines[0] == "{" and lines[-1] == "}"
    assert lines[1] == """#if($input.params('month') != "")"""
    assert lines[2].startswith('  "month": "') and lines[2].endswith('",')
    assert lines[3] == "#end"
    assert lines[4].endswith('",') and lines[5].endswith('")"')
    assert [line.split('"')[1] for line in lines if line.startswith('  "')] == [
        "month",
        "year",
        "userId",
    ]


def test_request_template_needs_a_required_parameter():
    with pytest.raises(ValueError):
        gen_api.request_template([("month", True)])


@pytest.mark.parametrize(
    "change, message",
    [
        (lambda s: s["routes"]["/incomes"]["get"].update(fn="Nope"), "unknown function"),
        (lambda s: s["routes"]["/incomes"]["put"].update(body="Nope"), "unknown model"),
        (lambda s: s["routes"]["/incomes"]["put"].pop("body"), "a body goes with"),
        (lambda s: s["routes"]["/incomes"].update(patch={"fn": "ReadIncomes"}), "unsupported"),
        (lambda s: s["functions"]["incomes"].update(Spare={"policies": []}), "without a route"),
        (
            lambda s: s["functions"]["incomes"]["ReadIncomes"].update(policies=["wild X"]),
            "unknown policy",
        ),
    ],
)
def test_check_spec_rejects_a_broken_spec(spec, change, message):
    broken = copy.deepcopy(spec)
    change(broken)
    with pytest.raises(ValueError, match=message):
        gen_api.check_spec(broken)


def test_template_needs_exactly_one_marker(spec):
    with pytest.raises(ValueError, match="exactly once"):
        gen_api.build_template(spec, "Resources: {}\n")
