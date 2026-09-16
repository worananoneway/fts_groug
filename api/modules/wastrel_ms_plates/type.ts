export enum StockStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    DELETED = 'Deleted',
    RESERVED = 'Reserved',
    USED = 'Used',
    AVAILABLE = 'AVAILABLE',
}

export enum ErrorField {
    PARAM_ID = 'wmsp_id',
    ID = 'id',
    MM_ID = 'mm_id',
    MSP_ID = 'msp_id',
    LENGTH = 'length',
    WIDTH = 'width',
    THICKNESS = 'thickness',
    QUANTITY = 'quantity',
    AVAILABLE_QUANTITY = 'available_quantity',
    STATUS = 'status',
    PO_ID = 'po_id',
    PODETAIL_ID = 'podetail_id',
    REMARK = 'remark',
    SCHEDULED_AT = 'scheduled_at',
}

export enum ErrorMessage {
    ID_REQUIRED = 'Wastrel MS plate ID is required.',
    PARAM_ID_REQUIRED = 'param wmsp_id is required.',
    MM_ID_REQUIRED = 'Material master ID is required.',
    MM_ID_MAX_LENGTH = 'Material master ID must be at most 20 characters long.',
    MSP_ID_MAX_LENGTH = 'MS plate ID must be at most 20 characters long.',
    LENGTH_REQUIRED = 'Length is required.',
    LENGTH_INVALID = 'Length must be a positive number.',
    WIDTH_REQUIRED = 'Width is required.',
    WIDTH_INVALID = 'Width must be a positive number.',
    THICKNESS_REQUIRED = 'Thickness is required.',
    THICKNESS_INVALID = 'Thickness must be a positive number.',
    QUANTITY_REQUIRED = 'Quantity is required.',
    QUANTITY_INVALID = 'Quantity must be a positive integer.',
    AVAILABLE_QUANTITY_REQUIRED = 'Available quantity is required.',
    AVAILABLE_QUANTITY_INVALID = 'Available quantity must be a non-negative integer no greater than quantity.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid in ENUM.',
    STATUS_CONFLICT = 'Status update conflicts with current wastrel MS plate status.',
    PO_ID_MAX_LENGTH = 'Purchase order ID must be at most 20 characters long.',
    PODETAIL_ID_MAX_LENGTH = 'Purchase order detail ID must be at most 20 characters long.',
    SCHEDULED_AT_INVALID = 'Scheduled at must be a valid ISO-8601 date-time.',
}

export interface Payload {
    mm_id: string;
    msp_id: string | null;
    /** รหัสเศษ (คอลัมน์ wmsp_stock_code) — ไม่ส่งมา backend จะออกให้เอง */
    stock_code?: string | null;
    length: number;
    width: number;
    thickness: number;
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
