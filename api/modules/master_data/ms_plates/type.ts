import { BranchType, Status, TaxType } from "@/api/utils/shared_types";

export enum ErrorField {
    ID = 'id',
    MM_ID = 'msp_mm_id',
    CODE = 'msp_code',
    LENGTH = 'msp_length',
    WIDTH = 'msp_width',
    THICKNESS = 'msp_thickness',
    QUANTITY = 'msp_quantity',
    AVAILABLE_QUANTITY = 'msp_available_quantity',
    LOC_ID = 'msp_loc_id',
    LOCATION_TYPE = 'msp_location_type',
    LOCATION = 'msp_location',
    STATUS = 'msp_status',
    RECEIVED_DATE = 'msp_received_date',
    REMARK = 'msp_remark',
    CREATED_AT = 'msp_created_at',
    UPDATED_AT = 'msp_updated_at',
}
export enum ErrorMessage {
    MM_ID_REQUIRED = 'msp_mm_id is required.',
    CODE_REQUIRED = 'msp_code is required.',
    LENGTH_REQUIRED = 'msp_length is required.',
    WIDTH_REQUIRED = 'msp_width is required.',
    THICKNESS_REQUIRED = 'msp_thickness is required.',
    QUANTITY_REQUIRED = 'msp_quantity is required.',
    AVAILABLE_QUANTITY_REQUIRED = 'msp_available_quantity is required.',
    LOC_ID_REQUIRED = 'msp_loc_id is required.',
    LOCATION_TYPE_REQUIRED = 'msp_location_type is required.',
    LOCATION_REQUIRED = 'msp_location is required.',
    RECEIVED_DATE_REQUIRED = 'msp_received_date is required.',
    REMARK_REQUIRED = 'msp_remark is required.',
    CREATED_AT_REQUIRED = 'msp_created_at is required.',
    CODE_DUPLICATE = 'msp_code already exists.',
    UPDATED_AT_REQUIRED = 'msp_updated_at is required.',
    ID_REQUIRED = 'msp_id is required.',
    NAME_TH_REQUIRED = 'msp_name (TH) is required.',
    NAME_TH_MIN_LENGTH = 'msp_name (TH) must be at least 5 characters long.',
    NAME_TH_MAX_LENGTH = 'msp_name (TH) must be at most 100 characters long.',
    NAME_TH_DUPLICATE = 'msp_name (TH) already exists.',
    NAME_EN_REQUIRED = 'msp_name (EN) is required.',
    NAME_EN_MIN_LENGTH = 'msp_name (EN) must be at least 5 characters long.',
    NAME_EN_MAX_LENGTH = 'msp_name (EN) must be at most 100 characters long.',
    NAME_EN_DUPLICATE = 'msp_name (EN) already exists.',
    TAX_ID_REQUIRED = 'msp_tax_id is required.',
    TAX_ID_DUPLICATE = 'msp_tax_id already exists.',
    TAX_ID_INVALID = 'msp_tax_id must be exactly 13 digits.',
    TAX_TYPE_REQUIRED = 'msp_tax_type is required.',
    TAX_TYPE_INVALID = 'msp_tax_type is invalid.',
    CONTACT_NAME_REQUIRED = 'msp_contact_name is required.',
    CONTACT_NAME_MAX_LENGTH = 'msp_contact_name must be at most 100 characters long.',
    CONTACT_PHONE_REQUIRED = 'msp_contact_phone is required.',
    CONTACT_PHONE_MAX_LENGTH = 'msp_contact_phone must be at most 20 characters long.',
    CONTACT_FAX_REQUIRED = 'msp_contact_fax is required.',
    CONTACT_FAX_MAX_LENGTH = 'msp_contact_fax must be at most 20 characters long.',
    CONTACT_EMAIL_REQUIRED = 'msp_contact_email is required.',
    CONTACT_EMAIL_INVALID = 'msp_contact_email is invalid.',
    CONTACT_EMAIL_MAX_LENGTH = 'msp_contact_email must be at most 150 characters long.',
    ADDRESS_REQUIRED = 'msp_address is required.',
    ADDRESS_MAX_LENGTH = 'msp_address must be at most 268,435,455 characters long.',
    SUBDISTRICT_ID_REQUIRED = 'msp_subdistrict_id is required.',
    SUBDISTRICT_ID_INVALID = 'msp_subdistrict_id is invalid.',
    DISTRICT_ID_REQUIRED = 'msp_district_id is required.',
    DISTRICT_ID_INVALID = 'msp_district_id is invalid.',
    PROVINCE_ID_REQUIRED = 'msp_province_id is required.',
    PROVINCE_ID_INVALID = 'msp_province_id is invalid.',
    POSTCODE_REQUIRED = 'msp_postcode is required.',
    POSTCODE_INVALID = 'msp_postcode is invalid.',
    BRANCH_TYPE_REQUIRED = 'msp_branch_type is required.',
    BRANCH_TYPE_INVALID = 'msp_branch_type is invalid.',
    BRANCH_NUMBER_INVALID = 'msp_branch_number is invalid.',
    BRANCH_NUMBER_REQUIRED = 'msp_branch_number is required.',
    BRANCH_NUMBER_MAX_LENGTH = 'msp_branch_number must be at most 20 characters long.',
    STATUS_REQUIRED = 'msp_status is required.',
    STATUS_INVALID = 'msp_status is invalid.',
    STATUS_CONFLICT = 'msp_status update conflicts with current customer status.',
    STATUS_DELETED_INVALID = 'msp_status cannot be updated to deleted.'
}
export interface Payload {
    id: string
    mm_id: string
    code: string
    length: number
    width: number
    thickness: number
    quantity: number
    available_quantity: number
    loc_id: string
    location_type: string
    location: string
    status: string
    received_date: Date
    remark: string
    created_at: Date
    updated_at: Date
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}