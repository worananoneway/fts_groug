export enum LocationType {
    WAREHOUSE = 'WAREHOUSE',
    ZONE = 'ZONE',
    RACK = 'RACK',
    SHELF = 'SHELF',
    OTHER = 'OTHER',
}

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
    STOCK_CODE = 'stock_code',
    LENGTH = 'length',
    WIDTH = 'width',
    THICKNESS = 'thickness',
    QUANTITY = 'quantity',
    AVAILABLE_QUANTITY = 'available_quantity',
    LOC_ID = 'loc_id',
    LOCATION_TYPE = 'location_type',
    LOCATION = 'location',
    STATUS = 'status',
    ORD_ID = 'ord_id',
    ODD_ID = 'odd_id',
    REMARK = 'remark',
}

export enum ErrorMessage {
    ID_REQUIRED = 'Wastrel MS plate ID is required.',
    PARAM_ID_REQUIRED = 'param wmsp_id is required.',
    MM_ID_REQUIRED = 'Material master ID is required.',
    MM_ID_MAX_LENGTH = 'Material master ID must be at most 20 characters long.',
    MSP_ID_MAX_LENGTH = 'MS plate ID must be at most 20 characters long.',
    STOCK_CODE_REQUIRED = 'Wastrel MS plate stock code is required.',
    STOCK_CODE_MAX_LENGTH = 'Wastrel MS plate stock code must be at most 50 characters long.',
    STOCK_CODE_DUPLICATE = 'Wastrel MS plate with this stock code already exists.',
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
    LOC_ID_MAX_LENGTH = 'Location ID must be at most 20 characters long.',
    LOCATION_TYPE_INVALID = 'Location type is invalid.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid in ENUM.',
    STATUS_CONFLICT = 'Status update conflicts with current wastrel MS plate status.',
    ORD_ID_MAX_LENGTH = 'Order ID must be at most 20 characters long.',
    ODD_ID_MAX_LENGTH = 'Order detail ID must be at most 20 characters long.',
}

export interface Payload {
    mm_id: string;
    msp_id?: string | null;
    stock_code: string;
    length: number;
    width: number;
    thickness: number;
    quantity?: number;
    available_quantity?: number;
    po_id?: string | null;
    podetail_id?: string | null;
    remark?: string | null;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
