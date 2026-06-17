"""Custom exceptions and FastAPI exception handlers."""

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class AppException(Exception):
    """Base application exception with status code and detail code."""

    def __init__(self, status_code: int, detail_code: int, message: str):
        self.status_code = status_code
        self.detail_code = detail_code
        self.message = message


class NotFoundException(AppException):
    def __init__(self, detail_code: int, message: str):
        super().__init__(404, detail_code, message)


class ValidationException(AppException):
    def __init__(self, detail_code: int, message: str):
        super().__init__(400, detail_code, message)


class TaskException(AppException):
    def __init__(self, detail_code: int, message: str):
        super().__init__(409, detail_code, message)


def register_exception_handlers(app):
    """Register custom exception handlers on the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": exc.detail_code,
                "data": None,
                "msg": exc.message,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        details = exc.errors()
        messages = []
        for err in details:
            loc = " -> ".join(str(l) for l in err["loc"])
            messages.append(f"{loc}: {err['msg']}")
        return JSONResponse(
            status_code=400,
            content={
                "code": 40001,
                "data": None,
                "msg": "请求参数校验失败: " + "; ".join(messages),
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={
                "code": 50000,
                "data": None,
                "msg": f"服务器内部错误: {str(exc)}",
            },
        )
