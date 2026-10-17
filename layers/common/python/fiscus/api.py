"""Response building and error handling for API Gateway (non-proxy) handlers.

API Gateway always answers HTTP 200; the outcome travels in the body as
``{"statusCode", "message", "data"}``. ``api_handler`` maps the two expected error
types to 400/404 and logs anything else before returning a generic 500, so internal
details never reach the client.
"""

import functools
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger("fiscus")
logger.setLevel(logging.INFO)

Handler = Callable[[dict, Any], dict]


class ValidationError(ValueError):
    """The request is malformed or misses a required field (400)."""


class NotFoundError(LookupError):
    """The requested item does not exist (404)."""


def ok(message: str, data: Any = None) -> dict:
    return {"statusCode": 200, "message": message, "data": data}


def _error(status_code: int, message: str) -> dict:
    return {"statusCode": status_code, "message": message}


def api_handler(fn: Handler) -> Handler:
    @functools.wraps(fn)
    def wrapper(data: dict, context: Any) -> dict:
        try:
            return fn(data, context)
        except ValidationError as e:
            return _error(400, str(e))
        except NotFoundError as e:
            return _error(404, str(e))
        except Exception:
            logger.exception("Unhandled error in %s", fn.__module__)
            return _error(500, "Internal server error")

    return wrapper
