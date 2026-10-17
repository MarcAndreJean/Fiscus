"""Manual smoke test for a deployed Fiscus API (standard library only).

    python scripts/smoke_test.py --key KEY [--write] \
        --url https://<id>.execute-api.<region>.amazonaws.com/<stage>

Calls every GET route with harmless parameters and checks the HTTP status is 200 and the
body is JSON with a Lambda `statusCode` of 200. API Gateway answers HTTP 200 with the
Lambda's {statusCode, message, data} as the body, so both are checked.

With --write, also does POST -> PUT -> DELETE on /misc-files and /travel-logs using a
`smoke-test` userId. Each created record is deleted again at the end (a failed run may
leave a `smoke-test` record behind). GET /files/{s3key+} is skipped: no write creates a file.

Prints one line per call; exits 1 if any call fails.
"""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

USER = "smoke-test"
DATE = "2000-06-01T12:00:00Z"
NEW_DATE = "2000-06-02T12:00:00Z"

COMMON = {
    "userId": USER,
    "businessId": USER,
    "carId": USER,
    "houseId": USER,
    "year": "2000",
    "month": "1",
    "fromDate": "2000-01-01",
    "toDate": "2000-01-31",
}

# path -> query parameter names the route takes (values come from COMMON)
GET_ROUTES = {
    "/incomes": ["userId", "businessId", "year", "month"],
    "/expenses": ["userId", "businessId", "year", "month"],
    "/car-expenses": ["carId", "year", "month"],
    "/house-expenses": ["houseId", "year", "month"],
    "/travel-logs": ["userId", "carId", "businessId", "year", "month"],
    "/misc-files": ["userId", "year", "month"],
    "/report/incomes": ["userId", "businessId", "fromDate", "toDate"],
    "/report/expenses": ["userId", "businessId", "fromDate", "toDate"],
    "/report/car-expenses": ["fromDate", "toDate"],
    "/report/house-expenses": ["fromDate", "toDate"],
    "/report/travel-logs": ["userId", "carId", "businessId", "fromDate", "toDate"],
    "/report/misc-files": ["userId", "fromDate", "toDate"],
    "/report/duplicates": ["fromDate", "toDate"],
}


def call(base_url, key, method, path, query=None, body=None):
    """Return (http_status, parsed_json_or_None, error_text)."""
    url = base_url.rstrip("/") + path
    if query:
        url += "?" + urllib.parse.urlencode(query)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("x-api-key", key)
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status, raw = resp.status, resp.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    except OSError as e:  # URLError, timeouts, dropped connections
        return None, None, f"request failed: {getattr(e, 'reason', e)}"
    try:
        return status, json.loads(raw), ""
    except ValueError:
        return status, None, f"body is not JSON: {raw[:200]!r}"


class Runner:
    def __init__(self, url, key):
        self.url, self.key = url, key
        self.failures = 0

    def check(self, method, path, query=None, body=None):
        """Make one call, print one line, return the parsed body (or None on failure)."""
        status, payload, err = call(self.url, self.key, method, path, query, body)
        if not err and status != 200:
            err = f"HTTP {status}"
        if not err and not (isinstance(payload, dict) and "statusCode" in payload):
            err = "body has no statusCode"
        if not err and payload["statusCode"] != 200:
            err = f"statusCode {payload['statusCode']}: {payload.get('message')}"
        label = f"{method:6} {path}"
        if err:
            self.failures += 1
            print(f"FAIL  {label}  {err}")
            return None
        print(f"ok    {label}  HTTP {status} statusCode {payload['statusCode']}")
        return payload

    def reads(self):
        for path, names in GET_ROUTES.items():
            self.check("GET", path, {n: COMMON[n] for n in names})
        print("skip  GET    /files/{s3key+}  no write creates a file")

    def write_cycle(self, path, create, update, delete_keys):
        """POST -> PUT -> DELETE one record; `update` and `delete_keys` use the new id."""
        created = self.check("POST", path, body=create)
        if created is None or not (created.get("data") or {}).get("id"):
            if created is not None:
                self.failures += 1
                print(f"FAIL  POST   {path}  response has no data.id")
            return
        record_id = created["data"]["id"]
        updated = self.check("PUT", path, body=update(record_id))
        keys = delete_keys(record_id, moved=updated is not None)
        self.check("DELETE", path, body=keys)

    def writes(self):
        self.write_cycle(
            "/misc-files",
            {
                "userId": USER,
                "date": DATE,
                "description": "smoke test",
                "category": "medical",
                "notes": "created by smoke_test.py",
                "amount": 1.5,
                "images": [],
                "files": [],
            },
            lambda i: {
                "id": i,
                "oldDate": DATE,
                "date": NEW_DATE,
                "description": "smoke test updated",
                "category": "medical",
                "notes": "updated by smoke_test.py",
                "amount": 2.5,
                "images": [],
                "files": [],
            },
            lambda i, moved: {"id": i, "date": NEW_DATE if moved else DATE},
        )
        self.write_cycle(
            "/travel-logs",
            {
                "userId": USER,
                "carId": USER,
                "businessId": USER,
                "travelDate": DATE,
                "reason": "smoke test",
                "notes": "created by smoke_test.py",
                "totalKm": 10.5,
                "consumption": 8,
                "images": [],
                "files": [],
            },
            lambda i: {
                "id": i,
                "userId": USER,
                "carId": USER,
                "businessId": USER,
                "oldTravelDate": DATE,
                "travelDate": NEW_DATE,
                "reason": "smoke test updated",
                "notes": "updated by smoke_test.py",
                "totalKm": 12.5,
                "consumption": 9,
                "images": [],
                "files": [],
            },
            lambda i, moved: {"id": i, "travelDate": NEW_DATE if moved else DATE},
        )


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Smoke test a deployed Fiscus API.")
    parser.add_argument("--url", required=True, help="API base URL including the stage")
    parser.add_argument("--key", required=True, help="API key (sent as x-api-key)")
    parser.add_argument(
        "--write",
        action="store_true",
        help="also POST, PUT and DELETE a smoke-test record on /misc-files and /travel-logs",
    )
    args = parser.parse_args(argv)

    runner = Runner(args.url, args.key)
    runner.reads()
    if args.write:
        runner.writes()
    else:
        print("skip  write checks (pass --write to run them)")
    print(f"{'FAILED' if runner.failures else 'PASSED'}: {runner.failures} failure(s)")
    return 1 if runner.failures else 0


if __name__ == "__main__":
    sys.exit(main())
