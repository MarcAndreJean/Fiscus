"""Helpers for reading template.yaml in tests.

``resolve_name`` evaluates the few CloudFormation intrinsics used in resource names: Ref,
string-form Fn::Sub and Fn::If over an Fn::Equals condition. Anything else fails the test.
"""

from pathlib import Path

from cfnlint.decode import decode

TEMPLATE_PATH = Path(__file__).resolve().parent.parent / "template.yaml"

PSEUDO_PARAMS = {
    "AWS::AccountId": "123456789012",
    "AWS::Region": "ca-central-1",
}


def load_template() -> dict:
    template, matches = decode(str(TEMPLATE_PATH))
    assert not matches, f"template.yaml failed to decode: {matches}"
    return template


def _condition_true(name: str, template: dict, params: dict) -> bool:
    cond = template["Conditions"][name]
    assert list(cond) == ["Fn::Equals"], f"unsupported condition form: {cond!r}"
    left, right = cond["Fn::Equals"]
    return resolve_name(left, params, template) == resolve_name(right, params, template)


def resolve_name(value, params: dict, template: dict | None = None) -> str:
    """Evaluate Fn::Sub / Ref / Fn::If over parameter values (name properties only)."""
    if isinstance(value, str):
        return value
    assert isinstance(value, dict) and len(value) == 1, f"unsupported value: {value!r}"
    ((key, arg),) = value.items()
    if key == "Ref":
        if arg in PSEUDO_PARAMS:
            return PSEUDO_PARAMS[arg]
        return params[arg]
    if key == "Fn::Sub":
        assert isinstance(arg, str), "only string-form Fn::Sub is supported"
        lookup = {**PSEUDO_PARAMS, **params}
        out = arg
        for name, val in lookup.items():
            out = out.replace("${" + name + "}", val)
        assert "${" not in out, f"unresolved substitution in {arg!r}"
        return out
    if key == "Fn::If":
        cond_name, when_true, when_false = arg
        tpl = template if template is not None else load_template()
        chosen = when_true if _condition_true(cond_name, tpl, params) else when_false
        return resolve_name(chosen, params, tpl)
    raise AssertionError(f"unsupported intrinsic: {key}")
