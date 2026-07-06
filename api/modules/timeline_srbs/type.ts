export enum TimelineEventType {
    ADD = 'Add',
    EDIT = 'Edit',
    USED = 'Used',
}

export enum StockStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    DELETED = 'Deleted',
    RESERVED = 'Reserved',
    USED = 'Used',
}

export enum ErrorField {
    ID = 'id',
    SRB_ID = 'srb_id',
    ORD_ID = 'ord_id',
    ODD_ID = 'odd_id',
    SR_ID = 'sr_id',
    EVENT_TYPE = 'event_type',
    QUANTITY_CHANGE = 'quantity_change',
    LENGTH_BEFORE = 'length_before',
    LENGTH_AFTER = 'length_after',
    STATUS_BEFORE = 'status_before',
    STATUS_AFTER = 'status_after',
    LOCATION_BEFORE = 'location_before',
    LOCATION_AFTER = 'location_after',
    EVENT_AT = 'event_at',
    REMARK = 'remark',
}

export enum ErrorMessage {
    ID_REQUIRED = 'Timeline SRB ID is required.',
    ID_MAX_LENGTH = 'Timeline SRB ID must be at most 20 characters long.',
    SRB_ID_REQUIRED = 'Steel round bar ID is required.',
    SRB_ID_MAX_LENGTH = 'Steel round bar ID must be at most 20 characters long.',
    ORD_ID_MAX_LENGTH = 'Order ID must be at most 20 characters long.',
    ODD_ID_MAX_LENGTH = 'Order detail ID must be at most 20 characters long.',
    SR_ID_MAX_LENGTH = 'Stock reservation ID must be at most 20 characters long.',
    EVENT_TYPE_REQUIRED = 'Timeline event type is required.',
    EVENT_TYPE_INVALID = 'Timeline event type is invalid.',
    QUANTITY_CHANGE_INVALID = 'Quantity change must be an integer.',
    LENGTH_BEFORE_INVALID = 'Length before must be a number.',
    LENGTH_AFTER_INVALID = 'Length after must be a number.',
    STATUS_BEFORE_INVALID = 'Status before is invalid.',
    STATUS_AFTER_INVALID = 'Status after is invalid.',
    EVENT_AT_INVALID = 'Event date/time is invalid.',
}

export interface Payload {
    srb_id: string;
    ord_id?: string | null;
    odd_id?: string | null;
    sr_id?: string | null;
    event_type: TimelineEventType;
    quantity_change?: number | null;
    length_before?: number | null;
    length_after?: number | null;
    status_before?: StockStatus | null;
    status_after?: StockStatus | null;
    location_before?: string | null;
    location_after?: string | null;
    event_at?: string | null;
    remark?: string | null;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
