import { BranchType, ProjectStatus, TaxType } from '@/api/utils/shared_types';

export enum ErrorField {
    ID = 'id',
    BUDGET = 'budget',
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
    CUSTOMER_ID = 'customer_id',
    MANAGER_ID = 'manager_id',
}
export enum ErrorMessage {
    ID_REQUIRED = 'Project ID is required.',
    NAME_TH_REQUIRED = 'Project name (TH) is required.',
    NAME_TH_MIN_LENGTH = 'Project name (TH) must be at least 5 characters long.',
    NAME_TH_MAX_LENGTH = 'Project name (TH) must be at most 100 characters long.',
    NAME_TH_DUPLICATE = 'Project with this name (TH) already exists.',
    NAME_EN_REQUIRED = 'Project name (EN) is required.',
    NAME_EN_MIN_LENGTH = 'Project name (EN) must be at least 5 characters long.',
    NAME_EN_MAX_LENGTH = 'Project name (EN) must be at most 100 characters long.',
    NAME_EN_DUPLICATE = 'Project with this name (EN) already exists.',
    TAX_ID_REQUIRED = 'Project tax ID is required.',
    TAX_ID_DUPLICATE = 'Project with this tax ID already exists.',
    TAX_ID_INVALID = 'Project tax ID must be exactly 13 digits.',
    TAX_TYPE_REQUIRED = 'Project tax type is required.',
    TAX_TYPE_INVALID = 'Project tax type is invalid.',
    CONTACT_NAME_REQUIRED = 'Project contact name is required.',
    CONTACT_NAME_MAX_LENGTH = 'Project contact name must be at most 100 characters long.',
    CONTACT_PHONE_REQUIRED = 'Project contact phone is required.',
    CONTACT_PHONE_MAX_LENGTH = 'Project contact phone must be at most 20 characters long.',
    CONTACT_FAX_REQUIRED = 'Project contact fax is required.',
    CONTACT_FAX_MAX_LENGTH = 'Project contact fax must be at most 20 characters long.',
    CONTACT_EMAIL_REQUIRED = 'Project contact email is required.',
    CONTACT_EMAIL_INVALID = 'Project contact email is invalid.',
    CONTACT_EMAIL_MAX_LENGTH = 'Project contact email must be at most 150 characters long.',
    BUDGET_MIN_VALUE = 'Project budget must be at least 0.',
    BUDGET_MAX_VALUE = 'Project budget must be at most 1000000000.',
    STATUS_REQUIRED = 'Status is required.',
    STATUS_INVALID = 'Status is invalid.',
    STATUS_CONFLICT = 'Status update conflicts with current Project status.',
    CUSTOMER_ID_NOT_FOUND = 'Customer not found or inactive.',
    MANAGER_ID_NOT_FOUND = 'Manager not found or inactive.',
}
export interface Payload {
    name_th: string;
    name_en: string;
    contact_name: string;
    contact_phone: string;
    contact_fax: string;
    contact_email: string;
    customer_id: string;
    manager_id: string;
    budget: number;
    closing_date: string;
    note: string;
    status?: ProjectStatus;
}
export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}