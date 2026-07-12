export enum StockStatus {
    AVAILABLE = 'AVAILABLE',
    RESERVED = 'RESERVED',
    USED = 'USED',
    SCRAP = 'SCRAP',
}
export enum LocationType {
    WAREHOUSE = 'WAREHOUSE',
    ZONE = 'ZONE',
    RACK = 'RACK',
    SHELF = 'SHELF',
    OTHER = 'OTHER',
}
export enum ErrorField {
    PARAM_ID = 'srb_id',
    ID = 'id',
    MM_ID = 'mm_id',
    CODE = 'code',
    DIAMETER = 'diameter',
    LENGTH = 'length',
    QUANTITY = 'quantity',
    AVAILABLE_QUANTITY = 'available_quantity',
    LOC_ID = 'loc_id',
    LOCATION_TYPE = 'location_type',
    LOCATION = 'location',
    STATUS = 'status',
    RECEIVED_DATE = 'received_date',
    REMARK = 'remark',
}
export enum ErrorMessage {
    ID_REQUIRED = 'Steel round bar ID is required.',
    PARAM_ID_REQUIRED = 'Parameter ID is required.',
    MM_ID_REQUIRED = 'Material master ID is required.',
    MM_ID_MAX_LENGTH = 'Material master ID must be at most 20 characters long.',
    CODE_REQUIRED = 'Steel round bar code is required.',
    CODE_MAX_LENGTH = 'Steel round bar code must be at most 50 characters long.',
    CODE_DUPLICATE = 'Steel round bar with this code already exists.',
    DIAMETER_REQUIRED = 'Diameter is required.',
    DIAMETER_INVALID = 'Diameter must be a positive number.',
    LENGTH_REQUIRED = 'Length is required.',
    LENGTH_INVALID = 'Length must be a positive number.',
    QUANTITY_INVALID = 'Quantity must be a positive integer.',
    AVAILABLE_QUANTITY_INVALID = 'Available quantity must be a non-negative integer no greater than quantity.',
    LOC_ID_MAX_LENGTH = 'Location ID must be at most 20 characters long.',
    LOCATION_TYPE_INVALID = 'Location type is invalid.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid.',
    STATUS_CONFLICT = 'Status update conflicts with current steel round bar status.',
    RECEIVED_DATE_INVALID = 'Received date is invalid.',
}
export interface Payload {
    mm_id: string;
    code: string;
    diameter: number;
    length: number;
    quantity?: number;
    available_quantity?: number;
    loc_id?: string;
    location_type?: LocationType;
    location?: string;
    received_date?: string;
    remark?: string;
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
