// enum ประเภทสต็อก ตรงกับ public."stock_location_type_enum" ในฐานข้อมูล
export enum StockLocationType {
    MS_PLATE = 'Ms_plate',
    ROUND_BAR = 'Round_bar',
    WASTREL_MS_PLATE = 'Wastrel_ms_plate',
    WASTREL_ROUND_BAR = 'Wastrel_round_bar',
}

export enum ErrorField {
    ID = 'id',
    PARAM_ID = 'sl_id',
    STOCK_TYPE = 'stock_type',
    STOCK_CODE = 'stock_code',
    LOC_ID = 'loc_id',
    SCHEDULED_AT = 'scheduled_at',
    REMARK = 'remark',
    STATUS = 'status',
}

export enum ErrorMessage {
    ID_REQUIRED = 'Stock location ID is required.',
    PARAM_ID_REQUIRED = 'param sl_id is required.',
    STOCK_TYPE_REQUIRED = 'Stock type is required.',
    STOCK_TYPE_INVALID = 'Stock type is invalid in ENUM.',
    STOCK_CODE_REQUIRED = 'Stock code is required.',
    STOCK_CODE_MAX_LENGTH = 'Stock code must be at most 100 characters long.',
    LOC_ID_MAX_LENGTH = 'Location ID must be at most 20 characters long.',
    LOC_ID_INVALID = 'Location ID does not exist.',
    SCHEDULED_AT_INVALID = 'Scheduled at must be a valid ISO-8601 date-time.',
    STATUS_INVALID = 'Status is invalid in ENUM.',
    STATUS_CONFLICT = 'Status update conflicts with current stock location status.',
}

export interface Payload {
    stock_type: StockLocationType;
    stock_code: string;
    loc_id: string | null;
    /** วัน-เวลาที่กำหนด (ISO-8601) — null = ยังไม่ได้ระบุ */
    scheduled_at: string | null;
    remark: string | null;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
