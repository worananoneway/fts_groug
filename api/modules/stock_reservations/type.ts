export enum ReservationStockType {
    ROUND_BAR = 'Round_bar',
    WASTREL_ROUND_BAR = 'Wastrel_round_bar',
    MS_PLATE = 'Ms_plate',
    WASTREL_MS_PLATE = 'Wastrel_ms_plate',
}

export enum ReservationStatus {
    RESERVED = 'Reserved',
    USED = 'Used',
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export enum ErrorField {
    ID = 'id',
    po_id = 'po_id',
    podetail_id = 'podetail_id',
    STOCK_TYPE = 'stock_type',
    STOCK_ID = 'stock_id',
    RESERVED_QUANTITY = 'reserved_quantity',
    RESERVED_LENGTH_MM = 'reserved_length_mm',
    RESERVED_WIDTH_MM = 'reserved_width_mm',
    STATUS = 'status',
}

export enum ErrorMessage {
    ID_REQUIRED = 'Stock reservation ID is required.',
    po_id_REQUIRED = 'Order ID is required.',
    po_id_MAX_LENGTH = 'Order ID must be at most 20 characters long.',
    podetail_id_REQUIRED = 'Order detail ID is required.',
    podetail_id_MAX_LENGTH = 'Order detail ID must be at most 20 characters long.',
    STOCK_TYPE_REQUIRED = 'Reservation stock type is required.',
    STOCK_TYPE_INVALID = 'Reservation stock type is invalid.',
    STOCK_ID_REQUIRED = 'Stock ID is required.',
    STOCK_ID_MAX_LENGTH = 'Stock ID must be at most 20 characters long.',
    RESERVED_QUANTITY_INVALID = 'Reserved quantity must be a positive integer.',
    RESERVED_LENGTH_MM_INVALID = 'Reserved length must be a positive number.',
    RESERVED_WIDTH_MM_INVALID = 'Reserved width must be a positive number.',
    STATUS_INVALID = 'Reservation status is invalid.',
    STATUS_CONFLICT = 'Reservation status conflicts with the requested action.',
}

export interface Payload {
    po_id: string;
    podetail_id: string;
    stock_type: ReservationStockType;
    stock_id: string;
    reserved_quantity?: number;
    reserved_length_mm?: number | null;
    reserved_width_mm?: number | null;
    status?: ReservationStatus;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
