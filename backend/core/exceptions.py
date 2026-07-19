class BaseAppException(Exception):
    """Base exception for StadiumMind AI application."""

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class EntityNotFoundException(BaseAppException):
    """Exception raised when a requested resource is not found."""

    pass


class InvalidCredentialsException(BaseAppException):
    """Exception raised when credential authentication fails."""

    pass


class ForbiddenException(BaseAppException):
    """Exception raised when permissions are insufficient."""

    pass


class ValidationException(BaseAppException):
    """Exception raised when schema constraints or input rules are violated."""

    pass


class ServiceUnavailableException(BaseAppException):
    """Exception raised when third-party API or downstream services fail."""

    pass
