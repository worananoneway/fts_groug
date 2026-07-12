// ชนิดข้อมูลฝั่งหน้าบ้านของ Master Data — โครงสร้าง row อิงตาม reply_options ของแต่ละ api module

export type MasterDataNavKey =
  | "customer"
  | "ms_plates"
  | "steel_round_bars"
  | "wastrel_ms_plates"
  | "wastrel_steel_round_bars";

export interface MasterDataNavItem {
  key: MasterDataNavKey;
  label: string;
  href: string;
}

export interface LocaleName {
  th: string | null;
  en: string | null;
}

export interface EmployeeRef {
  id: string | null;
  prefix: string | null;
  name: LocaleName | null;
}

export interface AddressPartRef {
  id: number | null;
  name: LocaleName | null;
}

export interface CustomerRow {
  id: string;
  display_id: string | null;
  name_th: string | null;
  name_en: string | null;
  tax_id: string | null;
  tax_type: string | null;
  contact: {
    name: string | null;
    phone: string | null;
    fax: string | null;
    email: string | null;
  } | null;
  address: {
    detail: string | null;
    subdistrict: AddressPartRef | null;
    district: AddressPartRef | null;
    province: AddressPartRef | null;
    postcode: string | null;
  } | null;
  branch_type: string | null;
  branch_number: string | null;
  pp20_file: string | null;
  certificate_file: string | null;
  created_at: string | null;
  updated_at: string | null;
  employee: EmployeeRef | null;
  status: string | null;
}

export interface MsPlateRow {
  id: string;
  mm_id: string | null;
  code: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  quantity: number | null;
  available_quantity: number | null;
  loc_id: string | null;
  location_type: string | null;
  location: string | null;
  status: string | null;
  received_date: string | null;
  remark: string | null;
  created_at: string | null;
  updated_at: string | null;
  employee: EmployeeRef | null;
  material: {
    id: string | null;
    name: string | null;
    type: string | null;
  } | null;
}

export interface SteelRoundBarRow {
  id: string;
  mm_id: string | null;
  code: string | null;
  diameter: number | null;
  length: number | null;
  quantity: number | null;
  available_quantity: number | null;
  loc_id: string | null;
  location_type: string | null;
  location: string | null;
  status: string | null;
  received_date: string | null;
  remark: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MaterialRef {
  id: string | null;
  code: string | null;
  name: string | null;
  shape_type: string | null;
  grade: string | null;
}

export interface OrderRef {
  id: string | null;
  no: string | null;
}

export interface WastrelMsPlateRow {
  id: string;
  material: MaterialRef | null;
  source_ms_plate: { id: string | null; code: string | null } | null;
  display_id: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  quantity: number | null;
  available_quantity: number | null;
  status: string | null;
  order: OrderRef | null;
  order_detail: { id: string | null; order_id: string | null } | null;
  remark: string | null;
  created_at: string | null;
  updated_at: string | null;
  emp: EmployeeRef | null;
}

export interface WastrelSteelRoundBarRow {
  id: string;
  material: MaterialRef | null;
  source_steel_round_bar: { id: string | null; code: string | null } | null;
  display_id: string | null;
  diameter: number | null;
  length: number | null;
  quantity: number | null;
  available_quantity: number | null;
  status: string | null;
  order: OrderRef | null;
  order_detail: { id: string | null; order_id: string | null } | null;
  remark: string | null;
  created_at: string | null;
  updated_at: string | null;
  emp: EmployeeRef | null;
}
