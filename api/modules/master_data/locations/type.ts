// enum ประเภทตำแหน่งจัดเก็บ ตรงกับ public."location_type_enum" ในฐานข้อมูล
export enum LocationType {
    WAREHOUSE = 'WAREHOUSE',
    ZONE = 'ZONE',
    RACK = 'RACK',
    SHELF = 'SHELF',
    OTHER = 'OTHER',
}

export enum ErrorField {
    ID = 'id',
    PARAM_ID = 'loc_id',
    CODE = 'code',
    NAME = 'name',
    TYPE = 'type',
    PARENT_ID = 'parent_id',
    DETAIL = 'detail',
    STATUS = 'status',
}

export enum ErrorMessage {
    ID_REQUIRED = 'Location ID is required.',
    PARAM_ID_REQUIRED = 'param loc_id is required.',
    CODE_REQUIRED = 'Location code is required.',
    CODE_MAX_LENGTH = 'Location code must be at most 50 characters long.',
    CODE_DUPLICATE = 'Location with this code already exists.',
    NAME_REQUIRED = 'Location name is required.',
    NAME_MAX_LENGTH = 'Location name must be at most 100 characters long.',
    TYPE_REQUIRED = 'Location type is required.',
    TYPE_INVALID = 'Location type is invalid in ENUM.',
    PARENT_ID_MAX_LENGTH = 'Location parent ID must be at most 20 characters long.',
    PARENT_ID_INVALID = 'Location parent ID does not exist.',
    PARENT_ID_SELF = 'Location parent ID must not be the location itself.',
    DETAIL_MAX_LENGTH = 'Location detail must be at most 268,435,455 characters long.',
    STATUS_INVALID = 'Status is invalid in ENUM.',
    STATUS_CONFLICT = 'Status update conflicts with current location status.',
}

export interface Payload {
    code: string;
    name: string;
    type: LocationType;
    parent_id: string | null;
    detail: string | null;
}

export interface ValidationError {
    field: ErrorField;
    message: ErrorMessage;
}
