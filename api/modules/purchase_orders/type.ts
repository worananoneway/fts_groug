import { POStatus } from "@/api/utils/shared_types";

export const created_reply_options = {
    fieldPrefix: 'po_',
    createdFields: [
        'po_id',
        'po_number',
        'po_cus_id',
        'po_due_date',
        'po_remark',
        'po_issue_date',
        'po_ship_via',
        'po_qt_on',
        'po_shipping_terms',
        'po_tax_rate',
        'po_recipient_id',
        'po_comment',
        'po_status_sent_date',
        'po_status_goods_received_',
        'po_status_paid_date',
        'po_status_note',
        'po_emp_id',
        'po_created_at',
        'po_updated_at',
        'po_status',
        'po_project_id',
        'po_condition_paid',
        'po_delivery_province_id',
        'po_delivery_district_id',
        'po_delivery_subdistrict_id',
        'po_approved_by_emp_id',
        'po_purchasing_fname',
        'po_purchasing_lname'
    ]
}

export enum ErrorField {
    ID = "id",
    NUMBER = "number",
    CUSTOMER_ID = "customer_id",
    SHIP_VIA = "ship_via",
    QT_ON = "qt_on",
    SHIPPING_TERMS = "shipping_terms",
    TAX_RATE = "tax_rate",
    RECIPIENT_ID = "recipient_id",
    COMMENT = "comment",
    STATUS_NOTE = "status_note",
    CONDITION_PAID = "condition_paid",
    DELIVERY_PROVINCE_ID = "delivery_province_id",
    DELIVERY_DISTRICT_ID = "delivery_district_id",
    DELIVERY_SUBDISTRICT_ID = "delivery_subdistrict_id",
    PROJECT_ID = "project_id",
    APPROVED_BY_EMP_ID = "approved_by_emp_id",
    PURCHASING_FNAME = "purchasing_fname",
    PURCHASING_LNAME = "purchasing_lname",
    STATUS = "status"
}

export enum ErrorMessage {
    ID_REQUIRED = "Purchase order ID is required.",
    NUMBER_REQUIRED = "Purchase order number is required.",
    NUMBER_MAX_LENGTH = "Purchase order number must not exceed 20 characters.",
    CUSTOMER_ID_REQUIRED = "Customer ID is required.",
    CUSTOMER_ID_MAX_LENGTH = "Customer ID must not exceed 20 characters.",
    SHIP_VIA_MAX_LENGTH = "Ship via must not exceed 150 characters.",
    SHIPPING_TERMS_MIN_LENGTH = "Shipping terms must be a 32-bit integer.",
    QT_ON_MAX_LENGTH = "QT on must not exceed 50 characters.",
    SHIPPING_TERMS_MAX_LENGTH = "Shipping terms must not exceed 100 characters.",
    TAX_RATE_REQUIRED = "Tax rate is required.",
    TAX_RATE_INVALID_MIN = "Tax rate must be at least 0.",
    TAX_RATE_INVALID_MAX = "Tax rate must not exceed the PostgreSQL real range.",
    RECIPIENT_ID_MAX_LENGTH = "Recipient ID must not exceed 20 characters.",
    COMMENT_MAX_LENGTH = "Comment must not exceed 300 characters.",
    STATUS_NOTE_MAX_LENGTH = "Status note must not exceed 200 characters.",
    CONDITION_PAID_INVALID = "Condition paid must be a 32-bit integer.",
    DELIVERY_PROVINCE_ID_INVALID = "Delivery province ID must be a 32-bit integer.",
    DELIVERY_DISTRICT_ID_INVALID = "Delivery district ID must be a 32-bit integer.",
    DELIVERY_SUBDISTRICT_ID_INVALID = "Delivery subdistrict ID must be a 32-bit integer.",
    PROJECT_ID_MAX_LENGTH = "Project ID must not exceed 20 characters.",
    APPROVED_BY_EMP_ID_MAX_LENGTH = "Approved employee ID must not exceed 20 characters.",
    PURCHASING_FNAME_MAX_LENGTH = "Purchasing first name must not exceed 80 characters.",
    PURCHASING_LNAME_MAX_LENGTH = "Purchasing last name must not exceed 80 characters.",
    STATUS_REQUIRED = "Status is required.",
    STATUS_INVALID = "Status is invalid."
}

export interface Payload {
    number?: string;
    cus_id: string;
    due_date: string | null;
    remark: string | null;
    issue_date: string | null;
    ship_via: string | null;
    qt_on: string | null;
    shipping_terms: string | null;
    tax_rate: number;
    recipient_id: string | null;
    comment: string | null;
    sent_date: string | null;
    goods_received_date: string | null;
    paid_date: string | null;
    status_note: string | null;
    project_id: string | null;
    condition_paid: number | null;
    delivery_province_id: number | null;
    delivery_district_id: number | null;
    delivery_subdistrict_id: number | null;
    approved_by_emp_id: string | null;
    purchasing_fname: string | null;
    purchasing_lname: string | null;
    status?: POStatus;
}

export interface StatusPayload {
    sent_date: string | null;
    goods_received_date: string | null;
    paid_date: string | null;
    status_note: string | null;
    status: POStatus;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
