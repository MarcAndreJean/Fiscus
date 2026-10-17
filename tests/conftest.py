import pytest
from helpers import ENV_VARS


@pytest.fixture(autouse=True)
def lambda_env(monkeypatch):
    for name, value in ENV_VARS.items():
        monkeypatch.setenv(name, value)
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ca-central-1")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "testing")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "testing")
