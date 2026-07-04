import { BranchType, Status, TaxType } from '@/api/utils/shared_types';

export enum ErrorField {
    ID = 'id',
    NAME_TH = 'name_th',
    NAME_EN = 'name_en',
    TAX_ID = 'tax_id',
    TAX_TYPE = 'tax_type',
    CONTACT_NAME = 'contact_name',
    CONTACT_PHONE = 'contact_phone',
    CONTACT_FAX = 'contact_fax',
    CONTACT_EMAIL = 'contact_email',
    ADDRESS = 'address',
    SUBDISTRICT_ID = 'subdistrict_id',
    DISTRICT_ID = 'district_id',
    PROVINCE_ID = 'province_id',
    POSTCODE = 'postcode',
    BRANCH_TYPE = 'branch_type',
    BRANCH_NUMBER = 'branch_number',
    STATUS = 'status',
}
export enum ErrorMessage {
    ID_REQUIRED = 'Supplier ID is required.',
    NAME_TH_REQUIRED = 'Supplier name (TH) is required.',
    NAME_TH_MIN_LENGTH = 'Supplier name (TH) must be at least 3 characters long.',
    NAME_TH_MAX_LENGTH = 'Supplier name (TH) must be at most 100 characters long.',
    NAME_TH_DUPLICATE = 'Supplier with this name (TH) already exists.',
    NAME_EN_REQUIRED = 'Supplier name (EN) is required.',
    NAME_EN_MIN_LENGTH = 'Supplier name (EN) must be at least 3 characters long.',
    NAME_EN_MAX_LENGTH = 'Supplier name (EN) must be at most 100 characters long.',
    NAME_EN_DUPLICATE = 'Supplier with this name (EN) already exists.',
    TAX_ID_REQUIRED = 'Supplier tax ID is required.',
    TAX_ID_DUPLICATE = 'Supplier with this tax ID already exists.',
    TAX_ID_INVALID = 'Supplier tax ID must be exactly 13 digits.',
    TAX_TYPE_REQUIRED = 'Supplier tax type is required.',
    TAX_TYPE_INVALID = 'Supplier tax type is invalid.',
    CONTACT_NAME_REQUIRED = 'Supplier contact name is required.',
    CONTACT_NAME_MAX_LENGTH = 'Supplier contact name must be at most 100 characters long.',
    CONTACT_PHONE_REQUIRED = 'Supplier contact phone is required.',
    CONTACT_PHONE_MAX_LENGTH = 'Supplier contact phone must be at most 20 characters long.',
    CONTACT_FAX_REQUIRED = 'Supplier contact fax is required.',
    CONTACT_FAX_MAX_LENGTH = 'Supplier contact fax must be at most 20 characters long.',
    CONTACT_EMAIL_REQUIRED = 'Supplier contact email is required.',
    CONTACT_EMAIL_INVALID = 'Supplier contact email is invalid.',
    CONTACT_EMAIL_MAX_LENGTH = 'Supplier contact email must be at most 150 characters long.',
    ADDRESS_REQUIRED = 'Supplier address is required.',
    ADDRESS_MAX_LENGTH = 'Supplier address must be at most 268,435,455 characters long.',
    SUBDISTRICT_ID_REQUIRED = 'Supplier subdistrict ID is required.',
    SUBDISTRICT_ID_NAN = 'Supplier subdistrict ID must be a number.',
    SUBDISTRICT_ID_INVALID = 'Supplier subdistrict ID is invalid.',
    DISTRICT_ID_REQUIRED = 'Supplier district ID is required.',
    DISTRICT_ID_NAN = 'Supplier district ID must be a number.',
    DISTRICT_ID_INVALID = 'Supplier district ID is invalid.',
    PROVINCE_ID_REQUIRED = 'Supplier province ID is required.',
    PROVINCE_ID_NAN = 'Supplier province ID must be a number.',
    PROVINCE_ID_INVALID = 'Supplier province ID is invalid.',
    POSTCODE_REQUIRED = 'Supplier postcode is required.',
    POSTCODE_INVALID = 'Supplier postcode must be at most 10 characters long.',
    BRANCH_TYPE_REQUIRED = 'Supplier branch type is required.',
    BRANCH_TYPE_INVALID = 'Supplier branch type is invalid.',
    BRANCH_NUMBER_REQUIRED = 'Supplier branch number is required.',
    BRANCH_NUMBER_MAX_LENGTH = 'Supplier branch number must be at most 20 characters long.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid.',
    STATUS_CONFLICT = 'Status update conflicts with current supplier status.',
}
export interface Payload {
    name_th: string;
    name_en: string;
    tax_id: string;
    tax_type: TaxType;
    contact_name: string;
    contact_phone: string;
    contact_fax: string;
    contact_email: string;
    address: string;
    subdistrict_id: number;
    district_id: number;
    province_id: number;
    postcode: string;
    branch_type: BranchType;
    branch_number: string;
    status?: Status;
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}