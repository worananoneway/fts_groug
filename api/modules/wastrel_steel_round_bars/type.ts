export enum StockStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    DELETED = 'Deleted',
    RESERVED = 'Reserved',
    USED = 'Used',
    AVAILABLE = 'AVAILABLE',
}

export enum ErrorField {
    PARAM_ID = 'wsrb_id',
    ID = 'id',
    MM_ID = 'mm_id',
    SRB_ID = 'srb_id',
    CODE = 'code',
    DIAMETER = 'diameter',
    LENGTH = 'length',
    QUANTITY = 'quantity',
    AVAILABLE_QUANTITY = 'available_quantity',
    STATUS = 'status',
    PO_ID = 'po_id',
    PODETAIL_ID = 'podetail_id',
    REMARK = 'remark',
    SCHEDULED_AT = 'scheduled_at',
}

export enum ErrorMessage {
    ID_REQUIRED = 'Wastrel steel round bar ID is required.',
    PARAM_ID_REQUIRED = 'Wastrel steel round bar parameter ID is required.',
    MM_ID_REQUIRED = 'Material master ID is required.',
    MM_ID_MAX_LENGTH = 'Material master ID must be at most 20 characters long.',
    SRB_ID_MAX_LENGTH = 'Steel round bar ID must be at most 20 characters long.',
    CODE_REQUIRED = 'Wastrel steel round bar code is required.',
    CODE_MAX_LENGTH = 'Wastrel steel round bar code must be at most 50 characters long.',
    CODE_DUPLICATE = 'Wastrel steel round bar with this code already exists.',
    DIAMETER_REQUIRED = 'Diameter is required.',
    DIAMETER_INVALID = 'Diameter must be a positive number.',
    LENGTH_REQUIRED = 'Length is required.',
    LENGTH_INVALID = 'Length must be a positive number.',
    QUANTITY_REQUIRED = 'Quantity is required.',
    QUANTITY_INVALID = 'Quantity must be a positive integer.',
    AVAILABLE_QUANTITY_REQUIRED = 'Available quantity is required.',
    AVAILABLE_QUANTITY_INVALID = 'Available quantity must be a non-negative integer no greater than quantity.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid.',
    STATUS_CONFLICT = 'Status update conflicts with current wastrel steel round bar status.',
    PO_ID_MAX_LENGTH = 'Purchase order ID must be at most 20 characters long.',
    PODETAIL_ID_MAX_LENGTH = 'Purchase order detail ID must be at most 20 characters long.',
    SCHEDULED_AT_INVALID = 'Scheduled at must be a valid ISO-8601 date-time.',
}

export interface Payload {
    mm_id: string;
    srb_id: string | null;
    code: string;
    diameter: number;
    length: number;
    quantity: number;
    available_quantity: number;
    po_id: string | null;
    podetail_id: string | null;
    remark: string | null;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
