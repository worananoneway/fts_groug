export enum PurchaseOrderDetailStatus {
    DRAFT = 'Draft',
    REVISED = 'Revised',
    PENDING = 'Pending',
    IN_PROCESS = 'In Process',
    COMPLETED = 'Completed',
    REJECTED = 'Rejected',
    CANCELLED = 'Cancelled',
}

export enum ErrorField {
    ID = 'id',
    PO_ID = 'po_id',
    MM_ID = 'mm_id',
    REQUIRED_LENGTH_MM = 'required_length_mm',
    REQUIRED_WIDTH_MM = 'required_width_mm',
    REQUIRED_THICKNESS_MM = 'required_thickness_mm',
    REQUIRED_DIAMETER_MM = 'required_diameter_mm',
    CUT_QUANTITY = 'cut_quantity',
    REMAINING_QUANTITY = 'remaining_quantity',
    ALLOW_WASTREL = 'allow_wastrel',
    ALLOW_ROTATION = 'allow_rotation',
    STATUS = 'status',
    REMARK = 'remark',
    ON = 'on',
    UNIT = 'unit',
    DESCRIPTION = 'description',
    QTY = 'qty',
    DISCOUNT = 'discount',
    UNIT_PRICE = 'unit_price',
}
export enum ErrorMessage {
    ID_INVALID = 'Purchase order detail ID must be a non-empty string of at most 20 characters.',
    PO_ID_INVALID = 'Purchase order ID must be a non-empty string of at most 20 characters.',
    MM_ID_INVALID = 'Material master ID must be a non-empty string of at most 20 characters.',
    REQUIRED_LENGTH_MM_INVALID = 'Required length must fit numeric(12, 3).',
    REQUIRED_WIDTH_MM_INVALID = 'Required width must be null or fit numeric(12, 3).',
    REQUIRED_THICKNESS_MM_INVALID = 'Required thickness must be null or fit numeric(12, 3).',
    REQUIRED_DIAMETER_MM_INVALID = 'Required diameter must be null or fit numeric(12, 3).',
    CUT_QUANTITY_INVALID = 'Cut quantity must be a 32-bit integer.',
    REMAINING_QUANTITY_INVALID = 'Remaining quantity must be a 32-bit integer.',
    ALLOW_WASTREL_INVALID = 'Allow wastrel must be a boolean.',
    ALLOW_ROTATION_INVALID = 'Allow rotation must be a boolean.',
    STATUS_INVALID = 'Status is invalid.',
    REMARK_INVALID = 'Remark must be null or a string.',
    ON_INVALID = 'On must be null or a 32-bit integer.',
    UNIT_INVALID = 'Unit must be null or a string of at most 80 characters.',
    DESCRIPTION_INVALID = 'Description must be null or a string of at most 1000 characters.',
    QTY_INVALID = 'Quantity must be null or a 32-bit integer.',
    DISCOUNT_INVALID = 'Discount must be null or fit numeric(15, 2).',
    UNIT_PRICE_INVALID = 'Unit price must be null or fit numeric(15, 2).',
    MULTIPLE_PO_IDS = 'Multiple Purchase Order IDs provided; only one is allowed per detail.',
}
export interface Payload {
    id?: string;
    po_id: string;
    mm_id: string;
    required_length_mm: number;
    required_width_mm: number | null;
    required_thickness_mm: number | null;
    required_diameter_mm: number | null;
    cut_quantity: number;
    remaining_quantity: number;
    allow_wastrel: boolean;
    allow_rotation: boolean;
    status: PurchaseOrderDetailStatus;
    remark: string | null;
    on: number | null;
    unit: string | null;
    description: string | null;
    qty: number | null;
    discount: number | null;
    unit_price: number | null;
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
