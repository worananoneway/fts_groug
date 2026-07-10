import { POStatus } from '@/api/utils/shared_types';

export enum ErrorField {
    ID = 'id',
    SHIP_VIA = 'ship_via',
    QT_ON = 'qt_on',
    SHIPPING_TERMS = 'shipping_terms',
    TAX_RATE = 'tax_rate',
    SUPPLIER_ID = 'supplier_id',
    RECIPIENT_ID = 'recipient_id',
    STATUS = 'status',
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
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid.',
    STATUS_CONFLICT = 'Status update conflicts with current supplier status.',
}
export interface Payload {
    number: string;
    issue_date: string;
    supplier_id: string;
    ship_via: string;
    qt_on: string;
    shipping_terms: string;
    tax_rate: number;
    recipient_id: string;
    comment: string;
    project_id: string;
    sent_date: string;
    goods_received_date: string;
    paid_date: string;
    status_note: string;
    status?: POStatus;
}
export interface PVPayload {
    date: string;
    supplier_id: string;
    po_id: string;
    project_id: string;
    approved_id: string | null;
    received_by: string | null;
    issued_id: string | null;
    recorded_id: string | null;
    verified_id: string | null;
    identification_number: string | null;
    position: string | null;
    agency: string | null;
    sector: string | null;
    phone: string | null;
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}