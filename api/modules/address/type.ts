

export enum ErrorField {
    ID = 'id',
    NAME_EN = 'name_en',
}
export enum ErrorMessage {
    ID_REQUIRED = 'Supplier ID is required.',
    SHIP_VIA_REQUIRED = 'Ship via is required.',
    SHIP_VIA_MAX_LENGTH = 'Ship via must not exceed 150 characters.',
    QT_ON_REQUIRED = 'QT on is required.',
    QT_ON_MAX_LENGTH = 'QT on must not exceed 50 characters.',
    SHIPPING_TERMS_REQUIRED = 'Shipping terms is required.',
    SHIPPING_TERMS_MIN_LENGTH = 'Shipping terms must be at least 100 characters.',
    TAX_RATE_REQUIRED = 'Tax rate is required.',
    TAX_RATE_INVALID_MIN = 'Tax rate must be at least 0.',
    TAX_RATE_INVALID_MAX = 'Tax rate must not exceed 3.4e+38.',
    SUPPLIER_ID_INVALID = 'Supplier ID format is invalid.',
    RECIPIENT_ID_INVALID = 'Recipient ID format is invalid.',
    PHONE_INVALID = 'Phone number must be 9-10 characters long.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid.',
    STATUS_CONFLICT = 'Status update conflicts with current supplier status.',
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}