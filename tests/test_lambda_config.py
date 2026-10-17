import pytest
from helpers import ENV_VARS, HANDLER_FILES, REPO_ROOT, load_handler

HARDCODED_LITERALS = [
    "'Incomes'",
    "'Expenses'",
    "'CarExpenses'",
    "'HouseExpenses'",
    "'TravelLogs'",
    "'MiscFiles'",
    "'ArchiveIncomes'",
    "'ArchiveExpenses'",
    "'ArchiveCarExpenses'",
    "'ArchiveHouseExpenses'",
]


def test_handler_files_found():
    assert len(HANDLER_FILES) == 33


@pytest.mark.parametrize("path", HANDLER_FILES)
def test_no_hardcoded_resource_names(path):
    src = (REPO_ROOT / path).read_text(encoding="utf-8")
    for literal in HARDCODED_LITERALS:
        assert literal not in src


@pytest.mark.parametrize("path", HANDLER_FILES)
def test_module_reads_names_from_env(path):
    if path.endswith("FindDuplicates.py"):
        pytest.skip("covered by test_find_duplicates_uses_env_names")
    mod = load_handler(path)
    used = {
        v
        for k, v in vars(mod).items()
        if k.startswith(("TABLE_", "BUCKET_")) and isinstance(v, str)
    }
    assert used, f"{path} exposes no TABLE_/BUCKET_ constant"
    assert used <= set(ENV_VARS.values())


def test_find_duplicates_uses_env_names():
    mod = load_handler("lambda/report/FindDuplicates.py")
    assert {t["name"] for t in mod.TABLES} <= set(ENV_VARS.values())
