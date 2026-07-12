import type { ReactNode } from "react";

export type ModuleKey = "po" | "plate" | "roundbar";
export type CuttingType = "plate" | "roundbar";
export type SubTabKey = "settings" | "layout" | "scrap";
export type PurchaseOrderStatus = "PENDING" | "IN_PROGRESS" | "DONE";
export type OrderDetailStatus = "DRAFT" | "REVISED" | "PENDING" | "IN_PROCESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
export type OrderShape = "ROUND" | "PLATE";

export interface TabDefinition<T extends string> {
  key: T;
  label: string;
}

export type DivisionNavKey = "po" | "cutting";

export interface DivisionNavItem {
  key: DivisionNavKey;
  label: string;
  href: string;
}

export interface PurchaseOrder {
  id: string;
  no: string;
  customer: string;
  date: string;
  due: string;
  status: PurchaseOrderStatus;
}

export interface MaterialMaster {
  id: string;
  name: string;
  shape: OrderShape;
  status?: string;
}

export interface OrderDetail {
  id: string;
  shape: OrderShape;
  materialId?: string;
  material: string;
  diameter?: number;
  length: number;
  width?: number;
  thickness?: number;
  qty: number;
  remaining: number;
  status: OrderDetailStatus;
  /** Raw purchase_orders_details row, kept so updates round-trip pricing fields untouched by this screen. */
  raw?: Record<string, unknown>;
}

export interface PlateStock {
  id: string;
  code: string;
  length: number;
  width: number;
  thickness: number;
  available_quantity: number;
  status?: string;
  material_master_id?: string;
}

export interface RoundBarStock {
  id: string;
  code: string;
  diameter: number;
  length: number;
  available_quantity: number;
  status?: string;
  material_master_id?: string;
}

export interface PlateItem {
  id: number;
  code: string;
  w: number;
  h: number;
  qty: number;
  color: string;
  thickness?: number;
  orderDetailId?: string;
}

export interface RoundItem {
  id: number;
  code: string;
  length: number;
  qty: number;
  color: string;
  diameter?: number;
  orderDetailId?: string;
}

export interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlatePiece {
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  orderDetailId?: string;
  rotated: boolean;
}

export interface PlateSheet {
  pieces: PlatePiece[];
  freeRects: FreeRect[];
}

export interface PlateResult {
  sheets: PlateSheet[];
  unplaced: Array<{ code: string; w: number; h: number; orderDetailId?: string }>;
}

export interface RoundPiece {
  code: string;
  start: number;
  length: number;
  color: string;
  orderDetailId?: string;
}

export interface RoundBarLayout {
  pieces: RoundPiece[];
  used: number;
}

export interface RoundResult {
  bars: RoundBarLayout[];
  unplaced: Array<{ code: string; length: number; color?: string; orderDetailId?: string }>;
}

export interface PlateScrap {
  sheetNo: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoundScrap {
  barNo: number;
  length: number;
}

export interface SavedPlateScrap {
  id: string;
  code: string;
  length: number;
  width: number;
  thickness: number;
  remark: string;
  orderId?: string;
  orderDetailId?: string;
}

export interface SavedRoundScrap {
  id: string;
  code: string;
  diameter: number;
  length: number;
  quantity: number;
  remark: string;
  orderId?: string;
  orderDetailId?: string;
}

export interface FormState {
  code: string;
  quantity: string;
}

export interface PlateFormState extends FormState {
  width: string;
  height: string;
}

export interface RoundFormState extends FormState {
  length: string;
}

export interface Notice {
  ok: boolean;
  text: string;
}

export interface DataStatus {
  loading: boolean;
  error: string | null;
  source: "api" | "none";
}

export interface PlanActionOptions {
  detailIds?: string[];
  scrapSourceNo?: number;
}

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  className?: string;
}
