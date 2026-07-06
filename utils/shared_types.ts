export enum ActionType {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    READ = 'READ',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    UPLOAD = 'UPLOAD',
    EXPORT = 'EXPORT',
    OTHER = 'OTHER'
}
export enum BranchType {
    HEAD_OFFICE = 'head_office',
    BRANCH = 'branch'
}
export enum EmployeePrefix {
    MR = 'Mr.',
    MRS = 'Mrs.',
    MS = 'Ms.',
    MISS = 'Miss',
    DR = 'Dr.',
    OTHER = 'Other'
}
export enum EventStatus {
    SUCCESS = 'Success',
    FAILED = 'Failed'
}
export enum HttpStatus {
    OK = 'OK',
    CREATED = 'Created',
    ACCEPTED = 'Accepted',
    NO_CONTENT = 'No Content',
    BAD_REQUEST = 'Bad Request',
    UNAUTHORIZED = 'Unauthorized',
    FORBIDDEN = 'Forbidden',
    NOT_FOUND = 'Not Found',
    CONFLICT = 'Conflict',
    UNSUPPORTED_MEDIA_TYPE = 'Unsupported Media Type',
    UNPROCESSABLE_CONTENT = 'Unprocessable Content',
    INTERNAL_SERVER_ERROR = 'Internal Server Error'
}
export enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    UNSUPPORTED_MEDIA_TYPE = 415,
    UNPROCESSABLE_CONTENT = 422,
    INTERNAL_SERVER_ERROR = 500
}
export enum Payroll {
    INCOME = 'income',
    DEDUCTION = 'deduction',
}
export enum ReplyErrorField {
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
    DUPLICATE_REQUEST_FIELDS = 'DUPLICATE_REQUEST_FIELDS',
    DUPLICATE_REQUEST_QUERY = 'DUPLICATE_REQUEST_QUERY',
    FORBIDDEN = 'FORBIDDEN',
    ENDPOINT_NOT_FOUND = 'ENDPOINT_NOT_FOUND',
    INSUFFICIENT_CLEARANCE = 'INSUFFICIENT_CLEARANCE',
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    INVALID_REQUEST_FIELDS = 'INVALID_REQUEST_FIELDS',
    INVALID_REQUEST_PARAMS = 'INVALID_REQUEST_PARAMS',
    INVALID_REQUEST_QUERY = 'INVALID_REQUEST_QUERY',
    INVALID_TOKEN = 'INVALID_TOKEN',
    METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
    MISSING_AUTHORIZATION_HEADER = 'MISSING_AUTHORIZATION_HEADER',
    MISSING_REQUEST_BODY = 'MISSING_REQUEST_BODY',
    MISSING_REQUEST_FIELDS = 'MISSING_REQUEST_FIELDS',
    NOT_FOUND = 'NOT_FOUND',
    SANITIZATION_FAILED = 'SANITIZATION_FAILED',
    UNAUTHORIZED = 'UNAUTHORIZED',
    UNRECOGNIZED_STATUSCODE = 'UNRECOGNIZED_STATUSCODE',
    UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
}
export enum ReplyErrorMessage {
    DUPLICATE_ENTRY = 'An entry with the same unique fields already exists.',
    DUPLICATE_REQUEST_FIELDS = 'There are duplicate fields in the request body.',
    DUPLICATE_REQUEST_QUERY = 'There are duplicate fields in the request query.',
    ENDPOINT_NOT_FOUND = 'The requested endpoint does not exist.',
    FORBIDDEN = 'You do not have permission to access this resource.',
    INSUFFICIENT_CLEARANCE = 'You do not have sufficient clearance to access this resource.',
    INTERNAL_SERVER_ERROR = 'An internal server error occurred, please check server logs for details.',
    INVALID_REQUEST_FIELDS = 'The request body contains invalid fields.',
    INVALID_REQUEST_PARAMS = 'The request contains invalid parameters.',
    INVALID_REQUEST_QUERY = 'The request contains invalid query parameters.',
    INVALID_TOKEN = 'The provided token is invalid or has expired.',
    METHOD_NOT_ALLOWED = 'The HTTP method used is not allowed for this endpoint.',
    MISSING_AUTHORIZATION_HEADER = 'The Authorization header is missing or malformed.',
    MISSING_REQUEST_BODY = 'The request body is missing.',
    MISSING_REQUEST_FIELDS = 'The request body is missing required fields.',
    NOT_FOUND = 'The requested resource was not found.',
    SANITIZATION_FAILED = 'Input sanitization failed.',
    UNAUTHORIZED = 'Invalid or expired token.',
    UNRECOGNIZED_STATUSCODE = 'An unrecognized status code was encountered, please check server logs for details.',
    UNSUPPORTED_MEDIA_TYPE = 'The request media type is unsupported. Please use application/json.',
    VALIDATION_ERROR = 'There was a validation error with the provided data.',
}
export enum ReplySuccessMessage {
    CREATED = 'created successfully.',
    UPDATED = 'updated successfully.',
    STATUS_UPDATED = 'status updated successfully.',
    DELETED = 'deleted successfully.',
}
export enum Status {
    ACTIVE = 'Active',
    ADDED = 'Added',
    APPROVED = 'Approved',
    AUTHORIZED = 'Authorized',
    COMPLETED = 'Completed',
    DELETED = 'Deleted',
    EDITED = 'Edited',
    INACTIVE = 'Inactive',
    PENDING = 'Pending',
    REJECTED = 'Rejected',
    REVISED = 'Revised',
    UNAUTHORIZED = 'Unauthorized',
    VERIFIED = 'Verified',
    WAITING = 'Waiting'
}
export enum TaxType {
    PERSONAL_ID = 'personal_id',
    COMPANY_TAX_ID = 'company_tax_id',
    OTHER = 'other'
}
export interface Reply {
    status: HttpStatus;
    statuscode: HttpStatusCode;
    details: {
        [key: string]: any;
    }
}
export enum ProjectStatus {
    OPENED = "Opened",
    CLOSED = "Closed",
    CANCELLED = "Cancelled",
    WAITING_PO = "Waiting - PO",
}