import type { Dispatch, ReactNode, SetStateAction } from "react";

export type ModuleKey = "po" | "plate" | "roundbar";
export type SubTabKey = "settings" | "layout" | "scrap";
export type PurchaseOrderStatus = "PENDING" | "IN_PROGRESS" | "DONE";
export type OrderDetailStatus = "DRAFT" | "REVISED" | "PENDING" | "IN_PROCESS" | "COMPLETED" | "REJECTED" | "CANCELLED";
export type OrderShape = "ROUND" | "PLATE";

export interface TabDefinition<T extends string> {
  key: T;
  label: string;
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

export interface CalculationDivisionContextValue {
  module: ModuleKey;
  setModule: (module: ModuleKey) => void;
  plateTab: SubTabKey;
  setPlateTab: (tab: SubTabKey) => void;
  roundTab: SubTabKey;
  setRoundTab: (tab: SubTabKey) => void;
  headerSubtitle: string;
  dataStatus: DataStatus;

  purchaseOrders: PurchaseOrder[];
  orderDetails: Record<string, OrderDetail[]>;
  poSearch: string;
  setPoSearch: (value: string) => void;
  selectedPoId: string | null;
  selectPo: (id: string) => void;
  filteredPurchaseOrders: PurchaseOrder[];
  selectedPo: PurchaseOrder | null;
  materialMasters: MaterialMaster[];
  selectedOrderRows: OrderDetail[];
  selectedRoundRows: OrderDetail[];
  selectedPlateRows: OrderDetail[];
  pushOrderDetailToCutting: (orderDetailId: string) => void;
  addOrderDetail: (detail: OrderDetail) => Promise<Notice>;
  cancelOrderDetail: (orderDetailId: string) => Promise<Notice>;
  updateOrderDetail: (detail: OrderDetail) => Promise<Notice>;
  pushRoundFromPo: (poId: string | null) => void;
  pushPlateFromPo: (poId: string | null) => void;

  stockPlates: PlateStock[];
  scrapPlates: SavedPlateScrap[];
  selectedPlateId: string;
  selectedPlate: PlateStock | null;
  setSelectedPlateId: (id: string) => void;
  sheetW: number;
  setSheetW: (value: number) => void;
  sheetH: number;
  setSheetH: (value: number) => void;
  kerf: number;
  setKerf: (value: number) => void;
  minScrap: number;
  setMinScrap: (value: number) => void;
  plateItems: PlateItem[];
  plateForm: PlateFormState;
  setPlateForm: Dispatch<SetStateAction<PlateFormState>>;
  plateEditingItemId: number | null;
  plateLoadedFromPo: string | null;
  clearPlatePoLoad: () => void;
  addPlateItem: () => void;
  beginNewPlateItem: () => void;
  editPlateItem: (id: number) => void;
  removePlateItem: (id: number) => void;
  calculatePlate: () => Promise<void>;
  confirmPlatePlan: (options?: PlanActionOptions) => Promise<Notice>;
  cancelPlatePlan: (options?: PlanActionOptions) => Promise<Notice>;
  plateResult: PlateResult | null;
  plateTotalPieces: number;
  plateAverageUtilization: string;
  plateScraps: PlateScrap[];
  unsavedPlateScraps: PlateScrap[];
  plateSavedScrapKeys: string[];
  plateScrapMessage: Notice | null;
  savePlateScraps: () => void;
  removeScrapPlate: (id: string) => void;

  stockBars: RoundBarStock[];
  scrapBars: SavedRoundScrap[];
  selectedBarId: string;
  selectedBar: RoundBarStock | null;
  setSelectedBarId: (id: string) => void;
  barDiameter: number;
  setBarDiameter: (value: number) => void;
  barLength: number;
  setBarLength: (value: number) => void;
  rKerf: number;
  setRKerf: (value: number) => void;
  rMinScrap: number;
  setRMinScrap: (value: number) => void;
  roundItems: RoundItem[];
  roundForm: RoundFormState;
  setRoundForm: Dispatch<SetStateAction<RoundFormState>>;
  roundEditingItemId: number | null;
  roundLoadedFromPo: string | null;
  clearRoundPoLoad: () => void;
  addRoundItem: () => void;
  beginNewRoundItem: () => void;
  editRoundItem: (id: number) => void;
  removeRoundItem: (id: number) => void;
  calculateRound: () => Promise<void>;
  confirmRoundPlan: (options?: PlanActionOptions) => Promise<Notice>;
  cancelRoundPlan: (options?: PlanActionOptions) => Promise<Notice>;
  roundResult: RoundResult | null;
  roundTotalPieces: number;
  roundMatchedCount: number;
  roundMismatchedCount: number;
  roundMismatchText: string;
  roundAverageUtilization: string;
  roundScraps: RoundScrap[];
  unsavedRoundScraps: RoundScrap[];
  roundSavedScrapKeys: string[];
  roundScrapMessage: Notice | null;
  saveRoundScraps: () => void;
  removeScrapBar: (id: string) => void;
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
