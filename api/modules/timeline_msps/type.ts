import { StockStatus, TimelineEventType } from "@/api/utils/shared_types";
export enum ErrorField {
    ID = 'id',
    MSP_ID = 'msp_id',
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
    ID_REQUIRED = 'Timeline MSP ID is required.',
    ID_MAX_LENGTH = 'Timeline MSP ID must be at most 20 characters long.',
    MSP_ID_REQUIRED = 'MS plate ID is required.',
    MSP_ID_MAX_LENGTH = 'MS plate ID must be at most 20 characters long.',
    po_id_MAX_LENGTH = 'Order ID must be at most 20 characters long.',
    podetail_id_MAX_LENGTH = 'Order detail ID must be at most 20 characters long.',
    SR_ID_MAX_LENGTH = 'Stock reservation ID must be at most 20 characters long.',
    EVENT_TYPE_REQUIRED = 'Timeline event type is required.',
    EVENT_TYPE_INVALID = 'Invalid event type out of enum values.',
    QUANTITY_CHANGE_INVALID = 'Quantity change must be an integer.',
    LENGTH_BEFORE_INVALID = 'Length before must be a number.',
    WIDTH_BEFORE_INVALID = 'Width before must be a number.',
    LENGTH_AFTER_INVALID = 'Length after must be a number.',
    WIDTH_AFTER_INVALID = 'Width after must be a number.',
    STATUS_BEFORE_INVALID = 'Status before is invalid.',
    STATUS_AFTER_INVALID = 'Status after is invalid.',
    EVENT_AT_INVALID = 'Event date/time is invalid.',
}

export interface Payload {
    msp_id: string;
    po_id?: string | null;
    podetail_id?: string | null;
    sr_id?: string | null;
    event_type: TimelineEventType;
    quantity_change?: number | null;
    length_before?: number | null;
    width_before?: number | null;
    length_after?: number | null;
    width_after?: number | null;
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
