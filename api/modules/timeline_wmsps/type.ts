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
    WMSP_ID = 'wmsp_id',
    po_id = 'po_id',
    podetail_id = 'podetail_id',
    SR_ID = 'sr_id',
    EVENT_TYPE = 'event_type',
    QUANTITY_CHANGE = 'quantity_change',
    LENGTH_BEFORE = 'length_before',
    WIDTH_BEFORE = 'width_before',
    LENGTH_AFTER = 'length_after',
    WIDTH_AFTER = 'width_after',
    STATUS_BEFORE = 'status_before',
    STATUS_AFTER = 'status_after',
    LOCATION_BEFORE = 'location_before',
    LOCATION_AFTER = 'location_after',
    EVENT_AT = 'event_at',
    REMARK = 'remark',
}
export enum ErrorMessage {
    ID_REQUIRED = 'Timeline wastrel MS plate ID is required.',
    WMSP_ID_REQUIRED = 'Wastrel MS plate ID is required.',
    WMSP_ID_MAX_LENGTH = 'Wastrel MS plate ID must be at most 20 characters long.',
    po_id_MAX_LENGTH = 'Order ID must be at most 20 characters long.',
    podetail_id_MAX_LENGTH = 'Order detail ID must be at most 20 characters long.',
    SR_ID_MAX_LENGTH = 'Stock reservation ID must be at most 20 characters long.',
    EVENT_TYPE_REQUIRED = 'Event type is required.',
    EVENT_TYPE_INVALID = 'Event type is invalid.',
    QUANTITY_CHANGE_INVALID = 'Quantity change must be an integer.',
    LENGTH_BEFORE_INVALID = 'Length before must be a non-negative number.',
    WIDTH_BEFORE_INVALID = 'Width before must be a non-negative number.',
    LENGTH_AFTER_INVALID = 'Length after must be a non-negative number.',
    WIDTH_AFTER_INVALID = 'Width after must be a non-negative number.',
    STATUS_BEFORE_INVALID = 'Status before is invalid.',
    STATUS_AFTER_INVALID = 'Status after is invalid.',
    EVENT_AT_INVALID = 'Event at is invalid.',
}
export interface Payload {
    wmsp_id: string;
    po_id?: string;
    podetail_id?: string;
    sr_id?: string;
    event_type: TimelineEventType;
    quantity_change?: number;
    length_before?: number;
    width_before?: number;
    length_after?: number;
    width_after?: number;
    status_before?: StockStatus;
    status_after?: StockStatus;
    location_before?: string;
    location_after?: string;
    remark?: string;
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
