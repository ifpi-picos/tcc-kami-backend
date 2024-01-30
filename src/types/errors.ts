enum LoginErrorCodes {
    EMAIL_NOT_FOUND = 'EMAIL_NOT_FOUND',
    USERNAME_NOT_FOUND = 'USERNAME_NOT_FOUND',
    PASSWORD_INCORRECT = 'PASSWORD_INCORRECT',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

class LoginError extends Error {
    code: LoginErrorCodes
    constructor(message: string, code: LoginErrorCodes) {
        super(message)
        this.name = 'LoginError'
        this.code = code
    }
}

class ValidationError extends Error {
    code: string
    constructor(message: string, code: string) {
        super(message)
        this.name = 'ValidationError'
        this.code = code
    }
}

export { LoginError, LoginErrorCodes, ValidationError }
