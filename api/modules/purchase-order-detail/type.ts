import { PodetailDepartment, PodetailType } from '@/api/utils/shared_types';

export enum ErrorField {
    ID = 'id',
    PO_ID = 'po_id',
    DEPARTMENT = 'department',
    TYPE = 'type',
    DESCRIPTION = 'description',
    QTY = 'qty',
    DISCOUNT = 'discount',
    UNIT_PRICE = 'unit_price',
    STATUS = 'status',
}
export enum ErrorMessage {
    ID_REQUIRED = 'Supplier ID is required.',
    DEPARTMENT_REQUIRED = 'Department is required.',
    DEPARTMENT_INVALID = 'Department is invalid.',
    TYPE_REQUIRED = 'Type is required.',
    TYPE_INVALID = 'Type is invalid.',
    DESCRIPTION_REQUIRED = 'Description is required.',
    DESCRIPTION_MAX_LENGTH = 'Description must not exceed 6000 characters.',
    QTY_REQUIRED = 'Quantity is required.',
    QTY_MIN_VALUE = 'Quantity must be at least -2147483647.',
    QTY_MAX_VALUE = 'Quantity must not exceed 2147483647.',
    UNIT_PRICE_REQUIRED = 'Unit price is required.',
    UNIT_PRICE_MIN_VALUE = 'Unit price must be at least -3.4e+38.',
    UNIT_PRICE_MAX_VALUE = 'Unit price must not exceed 3.4e+38.',
    DISCOUNT_REQUIRED = 'Discount is required.',
    DISCOUNT_MIN_VALUE = 'Discount must be at least -3.4e+38.',
    DISCOUNT_MAX_VALUE = 'Discount must not exceed 3.4e+38.',
    MULTIPLE_PO_IDS = 'Multiple Purchase Order IDs provided; only one is allowed per detail.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid.',
    STATUS_CONFLICT = 'Status update conflicts with current supplier status.',
}
export interface Payload {
    po_id: string;
    department: PodetailDepartment;
    type: PodetailType;
    description: string;
    qty: number;
    discount: number;
    unit_price: number;
    no: number;
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}