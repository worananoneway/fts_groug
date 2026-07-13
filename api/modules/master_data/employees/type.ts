export enum ErrorField {
    STATUS = 'status',
}
export enum ErrorMessage {
    STATUS_INVALID = 'Status is invalid.',
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
