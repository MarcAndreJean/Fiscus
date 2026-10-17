import boto3
import keys
import pytest
from moto import mock_aws

STARTER_VALUE = "starterstarterstarterstarter0001"


@pytest.fixture
def aws():
    with mock_aws():
        yield


@pytest.fixture
def apigateway(aws):
    return boto3.client("apigateway", region_name="ca-central-1")


@pytest.fixture
def plan(apigateway):
    """A usage plan holding one starter key, plus a second plan with its own key."""
    plan_id = apigateway.create_usage_plan(name="plan")["id"]
    starter = apigateway.create_api_key(name="starter", enabled=True, value=STARTER_VALUE)
    apigateway.create_usage_plan_key(usagePlanId=plan_id, keyId=starter["id"], keyType="API_KEY")
    other_plan = apigateway.create_usage_plan(name="other")["id"]
    other = apigateway.create_api_key(name="elsewhere", enabled=True)
    apigateway.create_usage_plan_key(usagePlanId=other_plan, keyId=other["id"], keyType="API_KEY")
    return plan_id


def test_add_returns_value_and_attaches_to_plan(apigateway, plan):
    value = keys.add_key(apigateway, plan, "phone")
    assert value and isinstance(value, str)
    attached = apigateway.get_usage_plan_keys(usagePlanId=plan)["items"]
    phone = next(k for k in attached if k["name"] == "phone")
    assert phone["value"] == value
    assert apigateway.get_api_key(apiKey=phone["id"])["enabled"] is True


def test_add_attach_failure_leaves_no_orphan_key(apigateway, plan):
    class FailingAttach:
        def __init__(self, client):
            self._client = client

        def __getattr__(self, name):
            return getattr(self._client, name)

        def create_usage_plan_key(self, **kwargs):
            raise RuntimeError("attach failed")

    before = {k["id"] for k in apigateway.get_api_keys()["items"]}
    with pytest.raises(RuntimeError, match="attach failed"):
        keys.add_key(FailingAttach(apigateway), plan, "phone")
    after = {k["id"] for k in apigateway.get_api_keys()["items"]}
    assert after == before


def test_add_duplicate_name_raises(apigateway, plan):
    with pytest.raises(ValueError, match="starter"):
        keys.add_key(apigateway, plan, "starter")


def test_list_returns_only_keys_on_this_plan(apigateway, plan):
    names = [k["name"] for k in keys.list_keys(apigateway, plan)]
    assert names == ["starter"]


def test_list_includes_keys_not_in_template(apigateway, plan):
    keys.add_key(apigateway, plan, "phone")
    keys.add_key(apigateway, plan, "laptop")
    listed = keys.list_keys(apigateway, plan)
    assert [k["name"] for k in listed] == ["laptop", "phone", "starter"]


def test_list_never_contains_values(apigateway, plan):
    value = keys.add_key(apigateway, plan, "phone")
    listed = keys.list_keys(apigateway, plan)
    for entry in listed:
        assert set(entry) == {"name", "id", "created", "enabled"}
        assert entry["enabled"] is True
    assert value not in repr(listed)
    assert STARTER_VALUE not in repr(listed)


def test_remove_deletes_key(apigateway, plan):
    keys.add_key(apigateway, plan, "phone")
    keys.remove_key(apigateway, plan, "phone")
    assert [k["name"] for k in keys.list_keys(apigateway, plan)] == ["starter"]
    all_names = [k["name"] for k in apigateway.get_api_keys()["items"]]
    assert "phone" not in all_names


def test_remove_unknown_name_raises(apigateway, plan):
    with pytest.raises(ValueError, match="nope"):
        keys.remove_key(apigateway, plan, "nope")
    # a key that exists but on another plan is also unknown here
    with pytest.raises(ValueError, match="elsewhere"):
        keys.remove_key(apigateway, plan, "elsewhere")


class FakeCloudFormation:
    def __init__(self, outputs):
        self.outputs = outputs
        self.asked = None

    def describe_stacks(self, StackName):  # noqa: N803 - mirrors the boto3 keyword
        self.asked = StackName
        return {"Stacks": [{"StackName": StackName, "Outputs": self.outputs}]}


def test_find_usage_plan_id_reads_output():
    cfn = FakeCloudFormation(
        [
            {"OutputKey": "ApiUrl", "OutputValue": "https://x"},
            {"OutputKey": "UsagePlanId", "OutputValue": "abc123"},
        ]
    )
    assert keys.find_usage_plan_id(cfn, "fiscus") == "abc123"
    assert cfn.asked == "fiscus"


def test_find_usage_plan_id_missing_raises_keyerror():
    cfn = FakeCloudFormation([{"OutputKey": "ApiUrl", "OutputValue": "https://x"}])
    with pytest.raises(KeyError, match="UsagePlanId"):
        keys.find_usage_plan_id(cfn, "fiscus")


def test_cli_error_exits_1(capsys, plan, monkeypatch):
    monkeypatch.setattr(keys, "read_samconfig", lambda *a, **k: {})
    monkeypatch.setattr(keys, "find_usage_plan_id", lambda cfn, stack: plan)
    monkeypatch.setattr(keys, "find_starter_key_id", lambda cfn, stack: None)
    code = keys.main(["--stack", "fiscus", "--region", "ca-central-1", "remove", "nope"])
    captured = capsys.readouterr()
    assert code == 1
    assert "nope" in captured.err
    assert captured.out == ""


def test_cli_add_prints_only_value(capsys, plan, monkeypatch):
    monkeypatch.setattr(keys, "read_samconfig", lambda *a, **k: {})
    monkeypatch.setattr(keys, "find_usage_plan_id", lambda cfn, stack: plan)
    code = keys.main(["--stack", "fiscus", "--region", "ca-central-1", "add", "phone"])
    captured = capsys.readouterr()
    assert code == 0
    value = captured.out.strip()
    assert value and "\n" not in value and " " not in value


def test_stack_name_from_samconfig(tmp_path):
    cfg = tmp_path / "samconfig.toml"
    cfg.write_text(
        "version = 0.1\n[default.deploy.parameters]\n"
        'stack_name = "mystack"\nregion = "ca-central-1"\nprofile = "fiscus-deploy"\n'
    )
    params = keys.read_samconfig(cfg)
    assert params["stack_name"] == "mystack"
    assert params["region"] == "ca-central-1"
    assert params["profile"] == "fiscus-deploy"


def test_samconfig_missing_gives_empty(tmp_path):
    assert keys.read_samconfig(tmp_path / "nope.toml") == {}


def test_remove_refuses_protected_starter_key(apigateway, plan):
    starter_id = next(k["id"] for k in keys.list_keys(apigateway, plan) if k["name"] == "starter")
    with pytest.raises(ValueError, match="starter"):
        keys.remove_key(apigateway, plan, "starter", protected_ids={starter_id})
    # nothing was deleted
    assert [k["name"] for k in keys.list_keys(apigateway, plan)] == ["starter"]
    # other keys are still removable with the same protection set
    keys.add_key(apigateway, plan, "phone")
    keys.remove_key(apigateway, plan, "phone", protected_ids={starter_id})
    assert [k["name"] for k in keys.list_keys(apigateway, plan)] == ["starter"]


def test_find_starter_key_id_reads_output():
    cfn = FakeCloudFormation(
        [
            {"OutputKey": "UsagePlanId", "OutputValue": "abc123"},
            {"OutputKey": "StarterApiKeyId", "OutputValue": "key999"},
        ]
    )
    assert keys.find_starter_key_id(cfn, "fiscus") == "key999"
    assert keys.find_starter_key_id(FakeCloudFormation([]), "fiscus") is None


def test_cli_remove_refuses_starter_key(capsys, apigateway, plan, monkeypatch):
    starter_id = next(k["id"] for k in keys.list_keys(apigateway, plan) if k["name"] == "starter")
    monkeypatch.setattr(keys, "read_samconfig", lambda *a, **k: {})
    monkeypatch.setattr(keys, "find_usage_plan_id", lambda cfn, stack: plan)
    monkeypatch.setattr(keys, "find_starter_key_id", lambda cfn, stack: starter_id)
    code = keys.main(["--stack", "fiscus", "--region", "ca-central-1", "remove", "starter"])
    captured = capsys.readouterr()
    assert code == 1
    assert "starter" in captured.err
    assert [k["name"] for k in keys.list_keys(apigateway, plan)] == ["starter"]


def test_samconfig_falls_back_to_global_parameters(tmp_path):
    cfg = tmp_path / "samconfig.toml"
    cfg.write_text(
        "version = 0.1\n"
        "[default.global.parameters]\n"
        'stack_name = "globalstack"\nregion = "ca-central-1"\nprofile = "fiscus-deploy"\n'
        "[default.deploy.parameters]\n"
        'capabilities = "CAPABILITY_IAM"\n'
    )
    params = keys.read_samconfig(cfg)
    assert params["stack_name"] == "globalstack"
    assert params["region"] == "ca-central-1"
    assert params["profile"] == "fiscus-deploy"


def test_samconfig_deploy_parameters_override_global(tmp_path):
    cfg = tmp_path / "samconfig.toml"
    cfg.write_text(
        "version = 0.1\n"
        '[default.global.parameters]\nstack_name = "globalstack"\nregion = "us-east-1"\n'
        '[default.deploy.parameters]\nstack_name = "deploystack"\n'
    )
    params = keys.read_samconfig(cfg)
    assert params["stack_name"] == "deploystack"
    assert params["region"] == "us-east-1"
