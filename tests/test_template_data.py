import pytest
from template_loader import load_template, resolve_name

THROUGHPUT = (10, 10)
IA = "STANDARD_INFREQUENT_ACCESS"

# logical id -> (name, hash, range, class, throughput or None, gsis)
# gsis: list of (index name, hash, range, throughput)
TABLES = {
    "IncomesTable": (
        "Incomes",
        "id",
        "invoiceDate",
        "STANDARD",
        THROUGHPUT,
        [("userId-invoiceDate-index", "userId", "invoiceDate", THROUGHPUT)],
    ),
    "ExpensesTable": (
        "Expenses",
        "id",
        "invoiceDate",
        "STANDARD",
        THROUGHPUT,
        [("userId-invoiceDate-index", "userId", "invoiceDate", THROUGHPUT)],
    ),
    "CarExpensesTable": (
        "CarExpenses",
        "id",
        "invoiceDate",
        "STANDARD",
        THROUGHPUT,
        [("carId-invoiceDate-index", "carId", "invoiceDate", THROUGHPUT)],
    ),
    "HouseExpensesTable": (
        "HouseExpenses",
        "id",
        "invoiceDate",
        "STANDARD",
        THROUGHPUT,
        [("houseId-invoiceDate-index", "houseId", "invoiceDate", THROUGHPUT)],
    ),
    "TravelLogsTable": (
        "TravelLogs",
        "id",
        "travelDate",
        "STANDARD",
        THROUGHPUT,
        [("userId-invoiceDate-index", "userId", "invoiceDate", THROUGHPUT)],
    ),
    "MiscFilesTable": ("MiscFiles", "id", "date", "STANDARD", THROUGHPUT, []),
    "ArchiveIncomesTable": ("ArchiveIncomes", "id", "archiveDate", IA, None, []),
    "ArchiveExpensesTable": ("ArchiveExpenses", "id", "archiveDate", IA, None, []),
    "ArchiveCarExpensesTable": ("ArchiveCarExpenses", "id", "archiveDate", IA, (4, 4), []),
    "ArchiveHouseExpensesTable": ("ArchiveHouseExpenses", "id", "archiveDate", IA, (1, 4), []),
}

PROD_PARAMS = {"TableNamePrefix": "", "BucketName": "my-files-bucket"}
TEST_PARAMS = {"TableNamePrefix": "test-", "BucketName": ""}


@pytest.fixture(scope="module")
def template():
    return load_template()


def _throughput(props):
    odt = props.get("OnDemandThroughput")
    if odt is None:
        return None
    return (odt["MaxReadRequestUnits"], odt["MaxWriteRequestUnits"])


def _keys(schema):
    return [(k["AttributeName"], k["KeyType"]) for k in schema]


def test_transform_and_parameters(template):
    assert template["Transform"] == "AWS::Serverless-2016-10-31"
    for name in ("TableNamePrefix", "BucketName"):
        assert template["Parameters"][name]["Type"] == "String"
        assert template["Parameters"][name]["Default"] == ""
    assert "UseDefaultBucketName" in template["Conditions"]


@pytest.mark.parametrize("logical_id", TABLES)
def test_table_definition(template, logical_id):
    name, hash_key, range_key, table_class, throughput, gsis = TABLES[logical_id]
    res = template["Resources"][logical_id]
    assert res["Type"] == "AWS::DynamoDB::Table"
    props = res["Properties"]

    assert resolve_name(props["TableName"], PROD_PARAMS, template) == name
    assert props["BillingMode"] == "PAY_PER_REQUEST"
    assert props["DeletionProtectionEnabled"] is True
    assert props["TableClass"] == table_class
    assert _keys(props["KeySchema"]) == [(hash_key, "HASH"), (range_key, "RANGE")]
    assert _throughput(props) == throughput

    expected_attrs = {hash_key, range_key}
    for _, g_hash, g_range, _ in gsis:
        expected_attrs |= {g_hash, g_range}
    attr_defs = props["AttributeDefinitions"]
    assert {a["AttributeName"] for a in attr_defs} == expected_attrs
    assert len(attr_defs) == len(expected_attrs)
    assert all(a["AttributeType"] == "S" for a in attr_defs)

    actual_gsis = props.get("GlobalSecondaryIndexes", [])
    assert len(actual_gsis) == len(gsis)
    for actual, (g_name, g_hash, g_range, g_tp) in zip(actual_gsis, gsis, strict=True):
        assert actual["IndexName"] == g_name
        assert _keys(actual["KeySchema"]) == [(g_hash, "HASH"), (g_range, "RANGE")]
        assert actual["Projection"] == {"ProjectionType": "ALL"}
        assert _throughput(actual) == g_tp

    for unexpected in (
        "StreamSpecification",
        "LocalSecondaryIndexes",
        "TimeToLiveSpecification",
        "PointInTimeRecoverySpecification",
        "SSESpecification",
        "ProvisionedThroughput",
    ):
        assert unexpected not in props


@pytest.mark.parametrize("logical_id", [*TABLES, "FilesBucket"])
def test_stateful_resources_retained(template, logical_id):
    res = template["Resources"][logical_id]
    assert res["DeletionPolicy"] == "Retain"
    assert res["UpdateReplacePolicy"] == "Retain"


def test_names_without_prefix_and_with_a_bucket_name(template):
    for logical_id, (name, *_rest) in TABLES.items():
        props = template["Resources"][logical_id]["Properties"]
        assert resolve_name(props["TableName"], PROD_PARAMS, template) == name
    bucket = template["Resources"]["FilesBucket"]["Properties"]["BucketName"]
    assert resolve_name(bucket, PROD_PARAMS, template) == "my-files-bucket"


def test_test_stack_names_differ(template):
    for logical_id, (name, *_rest) in TABLES.items():
        props = template["Resources"][logical_id]["Properties"]
        resolved = resolve_name(props["TableName"], TEST_PARAMS, template)
        assert resolved == f"test-{name}"
    bucket = template["Resources"]["FilesBucket"]["Properties"]["BucketName"]
    assert resolve_name(bucket, TEST_PARAMS, template) == "fiscus-files-123456789012-ca-central-1"


def test_bucket_definition(template):
    res = template["Resources"]["FilesBucket"]
    assert res["Type"] == "AWS::S3::Bucket"
    props = res["Properties"]
    (rule,) = props["BucketEncryption"]["ServerSideEncryptionConfiguration"]
    assert rule["BucketKeyEnabled"] is True
    assert rule["ServerSideEncryptionByDefault"] == {"SSEAlgorithm": "AES256"}
    assert rule["BlockedEncryptionTypes"] == {"EncryptionType": ["SSE-C"]}
    assert props["PublicAccessBlockConfiguration"] == {
        "BlockPublicAcls": True,
        "BlockPublicPolicy": True,
        "IgnorePublicAcls": True,
        "RestrictPublicBuckets": True,
    }
    assert props["OwnershipControls"] == {"Rules": [{"ObjectOwnership": "BucketOwnerEnforced"}]}
    for unexpected in (
        "VersioningConfiguration",
        "CorsConfiguration",
        "LifecycleConfiguration",
        "Tags",
    ):
        assert unexpected not in props


def test_bucket_name_output(template):
    assert template["Outputs"]["BucketName"]["Value"] == {"Ref": "FilesBucket"}
