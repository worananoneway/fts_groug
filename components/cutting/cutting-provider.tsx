"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";

import { ITEM_COLORS, MODULE_SUBTITLES } from "@/constants/division";
import { loadOrders, updateOrderDetail, updateOrderDetailStatus, createOrderDetail } from "@/services/division/purchase-orders";
import {
  createWastrelPlate,
  deleteWastrelPlate,
  loadMsPlates,
  loadWastrelPlates,
} from "@/services/division/plates";
import {
  createWastrelBar,
  deleteWastrelBar,
  loadSteelRoundBars,
  loadWastrelBars,
} from "@/services/division/round-bars";
import { safeRequest } from "@/services/division/http";
import { nextCode, packGuillotine, packRoundBars } from "@/utils/packing";
import type {
  CuttingType,
  DataStatus,
  Notice,
  OrderDetail,
  OrderDetailStatus,
  PlanActionOptions,
  PlateFormState,
  PlateItem,
  PlateResult,
  PlateScrap,
  PlateStock,
  PurchaseOrder,
  RoundBarStock,
  RoundFormState,
  RoundItem,
  RoundResult,
  RoundScrap,
  SavedPlateScrap,
  SavedRoundScrap,
  SubTabKey,
} from "@/types/division";

export interface CuttingContextValue {
  module: CuttingType;
  plateTab: SubTabKey;
  setPlateTab: (tab: SubTabKey) => void;
  roundTab: SubTabKey;
  setRoundTab: (tab: SubTabKey) => void;
  headerSubtitle: string;
  dataStatus: DataStatus;

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
  addPlateItem: () => Promise<Notice | null>;
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
  addRoundItem: () => Promise<Notice | null>;
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

const CuttingContext = createContext<CuttingContextValue | null>(null);
 
export function CuttingProvider({
  children,
  initialType,
  poId,
  detailId,
}: {
  children: ReactNode;
  initialType: CuttingType;
  poId?: string;
  detailId?: string;
}) {
  const router = useRouter();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const [module, setModule] = useState<CuttingType>(initialType);
  const [plateTab, setPlateTab] = useState<SubTabKey>("settings");
  const [roundTab, setRoundTab] = useState<SubTabKey>("settings");

  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail[]>>({});

  useEffect(() => {
    let active = true;
    loadOrders()
      .then((data) => {
        if (!active) return;
        setPurchaseOrders(data.purchaseOrders ?? []);
        setOrderDetails(data.orderDetails ?? {});
        setOrdersLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setOrdersError(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
        setOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function refreshOrders() {
    const data = await loadOrders();
    if (!mountedRef.current) return;
    setPurchaseOrders(data.purchaseOrders ?? []);
    setOrderDetails(data.orderDetails ?? {});
  }

  const [plateLoading, setPlateLoading] = useState(initialType === "plate");
  const [roundLoading, setRoundLoading] = useState(initialType === "roundbar");
  const startedPlateLoad = useRef(false);
  const startedRoundLoad = useRef(false);

  const [stockPlates, setStockPlates] = useState<PlateStock[]>([]);
  const [scrapPlates, setScrapPlates] = useState<SavedPlateScrap[]>([]);
  const [stockBars, setStockBars] = useState<RoundBarStock[]>([]);
  const [scrapBars, setScrapBars] = useState<SavedRoundScrap[]>([]);

  const [platePoId, setPlatePoId] = useState<string | null>(null);
  const [selectedPlateId, rawSetSelectedPlateId] = useState("");
  const [sheetW, setSheetW] = useState(2400);
  const [sheetH, setSheetH] = useState(1200);
  const [kerf, setKerf] = useState(3);
  const [minScrap, setMinScrap] = useState(150);
  const [plateItems, setPlateItems] = useState<PlateItem[]>([]);
  const [plateNextId, setPlateNextId] = useState(1);
  const [plateResult, setPlateResult] = useState<PlateResult | null>(null);
  const [plateForm, setPlateForm] = useState<PlateFormState>({
    code: "",
    width: "1",
    height: "1",
    quantity: "1",
  });
  const [plateEditingItemId, setPlateEditingItemId] = useState<number | null>(null);
  const [plateSavedScrapKeys, setPlateSavedScrapKeys] = useState<string[]>([]);
  const [plateScrapMessage, setPlateScrapMessage] = useState<Notice | null>(null);
  const [plateLoadedFromPo, setPlateLoadedFromPo] = useState<string | null>(null);

  const [roundPoId, setRoundPoId] = useState<string | null>(null);
  const [selectedBarId, rawSetSelectedBarId] = useState("");
  const [barDiameter, setBarDiameter] = useState(50);
  const [barLength, setBarLength] = useState(6000);
  const [rKerf, setRKerf] = useState(3);
  const [rMinScrap, setRMinScrap] = useState(300);
  const [roundItems, setRoundItems] = useState<RoundItem[]>([]);
  const [roundNextId, setRoundNextId] = useState(1);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [roundForm, setRoundForm] = useState<RoundFormState>({
    code: "",
    length: "1",
    quantity: "1",
  });
  const [roundEditingItemId, setRoundEditingItemId] = useState<number | null>(null);
  const [roundSavedScrapKeys, setRoundSavedScrapKeys] = useState<string[]>([]);
  const [roundScrapMessage, setRoundScrapMessage] = useState<Notice | null>(null);
  const [roundLoadedFromPo, setRoundLoadedFromPo] = useState<string | null>(null);

  useEffect(() => {
    if (module !== "plate" || startedPlateLoad.current) return;
    startedPlateLoad.current = true;
    setPlateLoading(true);
    Promise.all([safeRequest(loadMsPlates), safeRequest(loadWastrelPlates)]).then(([stock, scraps]) => {
      if (!mountedRef.current) return;
      setStockPlates(stock);
      setScrapPlates(scraps);
      // ขนาดแผ่นมาจากคลังเท่านั้น จึงเลือกแผ่นแรกเป็นค่าตั้งต้นไว้ก่อน (seed จาก PO จะทับทีหลังถ้ามี)
      const firstPlate = stock[0];
      if (firstPlate) {
        rawSetSelectedPlateId(firstPlate.id);
        setSheetW(firstPlate.length);
        setSheetH(firstPlate.width);
      }
      setPlateLoading(false);
    });
  }, [module]);

  useEffect(() => {
    if (module !== "roundbar" || startedRoundLoad.current) return;
    startedRoundLoad.current = true;
    setRoundLoading(true);
    Promise.all([safeRequest(loadSteelRoundBars), safeRequest(loadWastrelBars)]).then(([stock, scraps]) => {
      if (!mountedRef.current) return;
      setStockBars(stock);
      setScrapBars(scraps);
      // ขนาดแท่งมาจากคลังเท่านั้น จึงเลือกแท่งแรกเป็นค่าตั้งต้นไว้ก่อน (seed จาก PO จะทับทีหลังถ้ามี)
      const firstBar = stock[0];
      if (firstBar) {
        rawSetSelectedBarId(firstBar.id);
        setBarDiameter(firstBar.diameter);
        setBarLength(firstBar.length);
      }
      setRoundLoading(false);
    });
  }, [module]);

  const moduleLoading = module === "plate" ? plateLoading : roundLoading;
  const dataStatus: DataStatus = {
    loading: ordersLoading || moduleLoading,
    error: ordersError,
    source: !ordersLoading && !moduleLoading && !ordersError ? "api" : "none",
  };

  const headerSubtitle = MODULE_SUBTITLES[module];
  const selectedPlate = stockPlates.find((plate) => plate.id === selectedPlateId) ?? null;
  const selectedBar = stockBars.find((bar) => bar.id === selectedBarId) ?? null;

  const visibleScrapPlates = platePoId
    ? scrapPlates.filter((scrap) => scrap.orderId === platePoId)
    : scrapPlates;
  const visibleScrapBars = roundPoId
    ? scrapBars.filter((scrap) => scrap.orderId === roundPoId)
    : scrapBars;

  const plateScraps = useMemo<PlateScrap[]>(() => {
    if (!plateResult) return [];
    return plateResult.sheets.flatMap((sheet, sheetIndex) =>
      sheet.freeRects
        .filter((rect) => rect.w >= minScrap && rect.h >= minScrap)
        .map((rect) => ({ ...rect, sheetNo: sheetIndex + 1 })),
    );
  }, [minScrap, plateResult]);

  const unsavedPlateScraps = plateScraps.filter((scrap) => !plateSavedScrapKeys.includes(plateScrapKey(scrap)));
  const plateTotalPieces = plateItems.reduce((sum, item) => sum + item.qty, 0);
  const plateAverageUtilization = useMemo(() => {
    if (!plateResult || plateResult.sheets.length === 0) return "0.0";
    const totalUsed = plateResult.sheets.reduce(
      (sum, sheet) => sum + sheet.pieces.reduce((pieceSum, piece) => pieceSum + piece.w * piece.h, 0),
      0,
    );
    return ((totalUsed / (plateResult.sheets.length * sheetW * sheetH || 1)) * 100).toFixed(1);
  }, [plateResult, sheetH, sheetW]);

  const roundMatchedItems = roundItems.filter(
    (item) => !item.diameter || Number(item.diameter) === Number(barDiameter),
  );
  const roundMatchedCount = roundMatchedItems.length;
  const roundMismatchedCount = roundItems.length - roundMatchedCount;
  const roundMismatchText = `มี ${roundMismatchedCount} รายการที่เส้นผ่านศูนย์กลางไม่ตรงกับแท่งที่เลือก (Ø${barDiameter}) และจะไม่ถูกนำไปคำนวณ`;
  const roundScraps = useMemo<RoundScrap[]>(() => {
    if (!roundResult) return [];
    return roundResult.bars
      .map((bar, index) => ({ barNo: index + 1, length: barLength - bar.used }))
      .filter((scrap) => scrap.length >= rMinScrap);
  }, [barLength, rMinScrap, roundResult]);
  const unsavedRoundScraps = roundScraps.filter((scrap) => !roundSavedScrapKeys.includes(roundScrapKey(scrap)));
  const roundTotalPieces = roundItems.reduce((sum, item) => sum + item.qty, 0);
  const roundAverageUtilization = useMemo(() => {
    if (!roundResult || roundResult.bars.length === 0) return "0.0";
    const totalUsed = roundResult.bars.reduce((sum, bar) => sum + bar.used, 0);
    return ((totalUsed / (roundResult.bars.length * barLength || 1)) * 100).toFixed(1);
  }, [barLength, roundResult]);

  // ---- seed รายการตัดจาก query params (?po=...&detail=...) ตอนกดส่งมาจากหน้า PO ----
  const seededKeyRef = useRef<string | null>(null);

  function seedFromOrderDetail(orderId: string, orderDetailId: string) {
    const row = (orderDetails[orderId] ?? []).find((item) => item.id === orderDetailId);
    if (!row) return;
    const po = purchaseOrders.find((item) => item.id === orderId);

    if (row.shape === "ROUND") {
      const startId = roundNextId;
      const nextItem: RoundItem = {
        id: startId,
        code: "R1",
        length: row.length,
        qty: row.qty,
        diameter: row.diameter,
        color: ITEM_COLORS[0],
        orderDetailId: row.id,
      };
      const diameter = Number(row.diameter ?? barDiameter);
      const matchBar = stockBars.find((bar) => Number(bar.diameter) === diameter);
      const shouldShowLayout = row.status === "IN_PROCESS";
      const nextBarLength = matchBar?.length ?? barLength;

      setModule("roundbar");
      setRoundTab(shouldShowLayout ? "layout" : "settings");
      setRoundPoId(orderId);
      setRoundItems([nextItem]);
      setRoundNextId(startId + 1);
      setBarDiameter(diameter);
      if (matchBar) {
        rawSetSelectedBarId(matchBar.id);
        setBarLength(matchBar.length);
      } else {
        rawSetSelectedBarId("");
      }
      setRoundLoadedFromPo(po?.no ?? null);
      setRoundEditingItemId(null);
      setRoundForm({ code: "", length: "1", quantity: "1" });
      setRoundResult(shouldShowLayout ? packRoundBars(nextBarLength, rKerf, [nextItem]) : null);
      setRoundSavedScrapKeys([]);
      setRoundScrapMessage(null);
      return;
    }

    const startId = plateNextId;
    const nextItem: PlateItem = {
      id: startId,
      code: "P1",
      w: row.width ?? 0,
      h: row.length,
      qty: row.qty,
      thickness: row.thickness,
      color: ITEM_COLORS[0],
      orderDetailId: row.id,
    };
    const matchPlate = stockPlates.find((plate) => Number(plate.thickness) === Number(row.thickness));
    const shouldShowLayout = row.status === "IN_PROCESS";
    const nextSheetW = matchPlate?.length ?? sheetW;
    const nextSheetH = matchPlate?.width ?? sheetH;

    setModule("plate");
    setPlateTab(shouldShowLayout ? "layout" : "settings");
    setPlatePoId(orderId);
    setPlateItems([nextItem]);
    setPlateNextId(startId + 1);
    if (matchPlate) {
      rawSetSelectedPlateId(matchPlate.id);
      setSheetW(matchPlate.length);
      setSheetH(matchPlate.width);
    } else {
      rawSetSelectedPlateId("");
    }
    setPlateLoadedFromPo(po?.no ?? null);
    setPlateEditingItemId(null);
    setPlateForm({ code: "", width: "1", height: "1", quantity: "1" });
    setPlateResult(shouldShowLayout ? packGuillotine(nextSheetW, nextSheetH, kerf, [nextItem]) : null);
    setPlateSavedScrapKeys([]);
    setPlateScrapMessage(null);
  }

  function seedRoundFromPo(orderId: string) {
    const rows = (orderDetails[orderId] ?? []).filter((row) => row.shape === "ROUND" && isCuttableOrderDetail(row));
    if (!rows.length) return;

    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row.diameter ?? 0);
      acc[key] = (acc[key] ?? 0) + row.qty;
      return acc;
    }, {});
    const dominant = Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0]);
    const startId = roundNextId;
    const nextItems: RoundItem[] = rows.map((row, index) => ({
      id: startId + index,
      code: `R${index + 1}`,
      length: row.length,
      qty: row.qty,
      diameter: row.diameter,
      color: ITEM_COLORS[index % ITEM_COLORS.length],
      orderDetailId: row.id,
    }));
    const matchBar = stockBars.find((bar) => Number(bar.diameter) === dominant);
    const po = purchaseOrders.find((item) => item.id === orderId);

    setModule("roundbar");
    setRoundTab("settings");
    setRoundPoId(orderId);
    setRoundItems(nextItems);
    setRoundNextId(startId + nextItems.length);
    setBarDiameter(dominant);
    if (matchBar) {
      rawSetSelectedBarId(matchBar.id);
      setBarLength(matchBar.length);
    } else {
      rawSetSelectedBarId("");
    }
    setRoundLoadedFromPo(po?.no ?? null);
    setRoundEditingItemId(null);
    setRoundForm({ code: "", length: "1", quantity: "1" });
    setRoundResult(null);
    setRoundSavedScrapKeys([]);
    setRoundScrapMessage(null);
  }

  function seedPlateFromPo(orderId: string) {
    const rows = (orderDetails[orderId] ?? []).filter((row) => row.shape === "PLATE" && isCuttableOrderDetail(row));
    if (!rows.length) return;

    const startId = plateNextId;
    const nextItems: PlateItem[] = rows.map((row, index) => ({
      id: startId + index,
      code: `P${index + 1}`,
      w: row.width ?? 0,
      h: row.length,
      qty: row.qty,
      thickness: row.thickness,
      color: ITEM_COLORS[index % ITEM_COLORS.length],
      orderDetailId: row.id,
    }));
    const dominantThickness = rows[0]?.thickness;
    const matchPlate = stockPlates.find((plate) => Number(plate.thickness) === Number(dominantThickness));
    const po = purchaseOrders.find((item) => item.id === orderId);

    setModule("plate");
    setPlateTab("settings");
    setPlatePoId(orderId);
    setPlateItems(nextItems);
    setPlateNextId(startId + nextItems.length);
    if (matchPlate) {
      rawSetSelectedPlateId(matchPlate.id);
      setSheetW(matchPlate.length);
      setSheetH(matchPlate.width);
    } else {
      rawSetSelectedPlateId("");
    }
    setPlateLoadedFromPo(po?.no ?? null);
    setPlateEditingItemId(null);
    setPlateForm({ code: "", width: "1", height: "1", quantity: "1" });
    setPlateResult(null);
    setPlateSavedScrapKeys([]);
    setPlateScrapMessage(null);
  }

  // sync จาก URL params (?po=...&detail=...) ซึ่งเป็น external state เข้าสู่ state ของโมดูล
  // ทำครั้งเดียวต่อชุด params (กันไม่ให้ทับรายการที่ผู้ใช้แก้เอง)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!poId) return;
    if (ordersLoading) return;
    if (initialType === "plate" ? plateLoading : roundLoading) return;

    const key = `${initialType}|${poId}|${detailId ?? ""}`;
    if (seededKeyRef.current === key) return;
    seededKeyRef.current = key;

    if (detailId) {
      seedFromOrderDetail(poId, detailId);
    } else if (initialType === "plate") {
      seedPlateFromPo(poId);
    } else {
      seedRoundFromPo(poId);
    }
    // ฟังก์ชัน seed อ่าน state ล่าสุดผ่าน closure — effect นี้ตั้งใจให้วิ่งเมื่อ params/การโหลดเปลี่ยนเท่านั้น
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialType, poId, detailId, ordersLoading, plateLoading, roundLoading]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const activePlateOrderDetailIds = uniqueIds(plateItems.map((item) => item.orderDetailId));
  const activeRoundOrderDetailIds = uniqueIds(roundItems.map((item) => item.orderDetailId));

  function setSelectedPlateId(id: string) {
    rawSetSelectedPlateId(id);
    const plate = stockPlates.find((item) => item.id === id);
    if (plate) {
      setSheetW(plate.length);
      setSheetH(plate.width);
    }
  }

  function setSelectedBarId(id: string) {
    rawSetSelectedBarId(id);
    const bar = stockBars.find((item) => item.id === id);
    if (bar) {
      setBarDiameter(bar.diameter);
      setBarLength(bar.length);
    }
  }

  async function setOrderDetailsStatus(orderId: string | null, detailIds: string[], status: OrderDetailStatus) {
    if (!orderId || detailIds.length === 0) return;

    const currentRows = orderDetails[orderId] ?? [];
    const remoteRows = currentRows.filter((row) => detailIds.includes(row.id) && !isLocalOrderDetailId(row.id));
    await Promise.all(remoteRows.map((row) => updateOrderDetailStatus(orderId, row, status)));

    const nextRows = currentRows.map((row) =>
      detailIds.includes(row.id) ? { ...row, status } : row,
    );
    setOrderDetails((current) => ({ ...current, [orderId]: nextRows }));

    if (remoteRows.length > 0) {
      await refreshOrders();
    }
  }

  // บันทึกขนาด/จำนวนที่แก้จาก modal กลับลง purchase_order_details (เฉพาะรายการที่มีแถวใน DB)
  async function persistOrderDetailEdit(orderDetailId: string, changes: Partial<OrderDetail>) {
    if (isLocalOrderDetailId(orderDetailId)) return;
    for (const [orderId, rows] of Object.entries(orderDetails)) {
      const row = rows.find((item) => item.id === orderDetailId);
      if (!row) continue;
      const nextRow = { ...row, ...changes };
      await updateOrderDetail(orderId, nextRow);
      setOrderDetails((current) => ({
        ...current,
        [orderId]: (current[orderId] ?? []).map((item) => (item.id === orderDetailId ? nextRow : item)),
      }));
      return;
    }
  }

  // ล้างป้าย PO = ตัดความเชื่อมโยงกับใบสั่งซื้อ และเอา params ออกจาก URL กัน refresh แล้ว seed ซ้ำ
  function clearPlatePoLoad() {
    setPlateLoadedFromPo(null);
    setPlatePoId(null);
    seededKeyRef.current = null;
    router.replace("/cutting");
  }

  function clearRoundPoLoad() {
    setRoundLoadedFromPo(null);
    setRoundPoId(null);
    seededKeyRef.current = null;
    router.replace("/cutting");
  }

  function beginNewPlateItem() {
    setPlateEditingItemId(null);
    setPlateForm({ code: "", width: "1", height: "1", quantity: "1" });
  }

  async function addPlateItem(): Promise<Notice | null> {
    const w = Number(plateForm.width);
    const h = Number(plateForm.height);
    if (!w || !h || w <= 0 || h <= 0) return null;

    const codeSourceItems = plateEditingItemId
      ? plateItems.filter((item) => item.id !== plateEditingItemId)
      : plateItems;
    const code = (plateForm.code.trim().toUpperCase() || nextCode(codeSourceItems.map((item) => item.code))).slice(0, 3);
    const qty = Math.max(1, Math.floor(Number(plateForm.quantity) || 1));
    if (plateEditingItemId) {
      // รายการที่มาจาก PO ต้องบันทึกกลับลง DB ก่อน ถ้าไม่สำเร็จให้คงค่าเดิมไว้
      const editingItem = plateItems.find((item) => item.id === plateEditingItemId);
      if (editingItem?.orderDetailId) {
        try {
          await persistOrderDetailEdit(editingItem.orderDetailId, { width: w, length: h, qty });
        } catch {
          return { ok: false, text: "บันทึกรายการลงฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
        }
      }
      setPlateItems((items) =>
        items.map((item) => (item.id === plateEditingItemId ? { ...item, code, w, h, qty } : item)),
      );
      setPlateEditingItemId(null);
      setPlateForm({ code: "", width: "1", height: "1", quantity: "1" });
      setPlateResult(null);
      return null;
    }

    // ถ้าหน้ากำลังผูกกับ PO อยู่ ให้สร้างแถวใหม่ลง purchase_order_details ด้วย
    // แล้วเก็บ id ที่ได้ไว้กับรายการ เพื่อให้การแก้ไขครั้งถัดไปอัปเดตแถวเดิมได้
    const plateOrdId = platePoId ?? purchaseOrders.find((po) => po.no === plateLoadedFromPo)?.id;
    let createdDetailId: string | undefined;
    if (plateOrdId) {
      try {
        createdDetailId = await createOrderDetail(plateOrdId, {
          id: "",
          shape: "PLATE",
          materialId: selectedPlate?.material_master_id,
          material: selectedPlate?.code ?? "",
          length: h,
          width: w,
          thickness: selectedPlate?.thickness,
          qty,
          remaining: qty,
          status: "PENDING",
        });
        await refreshOrders();
      } catch {
        return { ok: false, text: "บันทึกรายการลงฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
      }
    }

    setPlateItems((items) => [
      ...items,
      {
        id: plateNextId,
        code,
        w,
        h,
        qty,
        color: ITEM_COLORS[items.length % ITEM_COLORS.length],
        orderDetailId: createdDetailId,
      },
    ]);
    setPlateNextId((id) => id + 1);
    setPlateForm({ code: "", width: "1", height: "1", quantity: "1" });
    setPlateResult(null);
    return null;
  }

  function removePlateItem(id: number) {
    setPlateItems((items) => items.filter((item) => item.id !== id));
    if (plateEditingItemId === id) {
      setPlateEditingItemId(null);
      setPlateForm({ code: "", width: "1", height: "1", quantity: "1" });
    }
    setPlateResult(null);
  }

  function editPlateItem(id: number) {
    const item = plateItems.find((plateItem) => plateItem.id === id);
    if (!item) return;
    setPlateEditingItemId(id);
    setPlateForm({
      code: item.code,
      width: String(item.w),
      height: String(item.h),
      quantity: String(item.qty),
    });
  }

  async function calculatePlate() {
    if (plateItems.length === 0) return;
    setPlateResult(packGuillotine(sheetW, sheetH, kerf, plateItems));
    setPlateSavedScrapKeys([]);
    setPlateScrapMessage(null);
    try {
      await setOrderDetailsStatus(platePoId, activePlateOrderDetailIds, "IN_PROCESS");
    } catch {
      setPlateScrapMessage({ ok: false, text: "อัปเดตสถานะรายการเป็น In Process ไม่สำเร็จ" });
    }
    setPlateTab("layout");
  }

  // หาแถวรายการใน PO ที่กำลังตัดอยู่ ใช้ระบุวัสดุ/ความหนาของเศษเมื่อไม่ได้เลือกสต็อกจากคลัง
  function activeOrderRow(orderId: string | null, detailIds: string[]) {
    const rows = orderId ? orderDetails[orderId] ?? [] : [];
    return rows.find((row) => detailIds.includes(row.id));
  }

  async function persistPlateScraps(sourceNo?: number) {
    const targetScraps = sourceNo
      ? unsavedPlateScraps.filter((scrap) => scrap.sheetNo === sourceNo)
      : unsavedPlateScraps;
    if (targetScraps.length === 0) return;

    const orderRow = activeOrderRow(platePoId, activePlateOrderDetailIds);
    const mmId = selectedPlate?.material_master_id || orderRow?.materialId;
    if (!mmId) {
      throw new Error("ไม่พบวัสดุของเศษ กรุณาเลือกแผ่นจากคลัง เพื่อระบุวัสดุของเศษ");
    }

    const stamp = Date.now().toString(36).toUpperCase();
    const ordId = platePoId ?? purchaseOrders.find((po) => po.no === plateLoadedFromPo)?.id;
    const oddId = firstRemoteOrderDetailId(activePlateOrderDetailIds);
    const scraps = targetScraps;

    for (const [index, scrap] of scraps.entries()) {
      await createWastrelPlate({
        mm_id: mmId,
        msp_id: selectedPlate?.id ?? null,
        stock_code: `SCRAP-${stamp}-${index + 1}`,
        length: Math.max(1, Math.floor(scrap.w)),
        width: Math.max(1, Math.floor(scrap.h)),
        thickness: selectedPlate?.thickness || orderRow?.thickness || 1,
        quantity: 1,
        available_quantity: 1,
        po_id: ordId ?? null,
        podetail_id: oddId ?? null,
        remark: `เศษจากแผ่นที่ ${scrap.sheetNo}${plateLoadedFromPo ? ` (${plateLoadedFromPo})` : ""}`,
      });
    }
    setScrapPlates(await loadWastrelPlates());
    setPlateSavedScrapKeys((keys) => [...keys, ...scraps.map(plateScrapKey)]);
    return scraps.length;
  }

  async function savePlateScraps() {
    try {
      const count = await persistPlateScraps();
      setPlateScrapMessage({ ok: true, text: `บันทึกเศษลงคลัง (wastrel_ms_plates) แล้ว ${count ?? 0} ชิ้น` });
    } catch (error) {
      setPlateScrapMessage({
        ok: false,
        text: error instanceof Error ? error.message : "บันทึกเศษลงคลังไม่สำเร็จ กรุณาลองใหม่",
      });
    }
  }

  async function confirmPlatePlan(options: PlanActionOptions = {}): Promise<Notice> {
    try {
      const detailIds = options.detailIds?.length ? options.detailIds : activePlateOrderDetailIds;
      const count = await persistPlateScraps(options.scrapSourceNo);
      await setOrderDetailsStatus(platePoId, detailIds, "COMPLETED");
      return { ok: true, text: `ยืนยันแผนการตัดแล้ว และบันทึกเศษ ${count ?? 0} ชิ้น` };
    } catch (error) {
      return {
        ok: false,
        text: error instanceof Error ? error.message : "ยืนยันแผนการตัดไม่สำเร็จ",
      };
    }
  }

  async function cancelPlatePlan(options: PlanActionOptions = {}): Promise<Notice> {
    try {
      const detailIds = options.detailIds?.length ? options.detailIds : activePlateOrderDetailIds;
      await setOrderDetailsStatus(platePoId, detailIds, "CANCELLED");
      return { ok: true, text: "ยกเลิกแผนการตัดแล้ว" };
    } catch {
      return { ok: false, text: "ยกเลิกแผนการตัดไม่สำเร็จ" };
    }
  }

  async function removeScrapPlate(id: string) {
    try {
      await deleteWastrelPlate(id);
      setScrapPlates((items) => items.filter((item) => item.id !== id));
    } catch {
      setPlateScrapMessage({ ok: false, text: "ลบเศษออกจากคลังไม่สำเร็จ กรุณาลองใหม่" });
    }
  }

  async function addRoundItem(): Promise<Notice | null> {
    const length = Number(roundForm.length);
    if (!length || length <= 0) return null;

    const codeSourceItems = roundEditingItemId
      ? roundItems.filter((item) => item.id !== roundEditingItemId)
      : roundItems;
    const code = (roundForm.code.trim().toUpperCase() || nextCode(codeSourceItems.map((item) => item.code))).slice(0, 3);
    const qty = Math.max(1, Math.floor(Number(roundForm.quantity) || 1));
    if (roundEditingItemId) {
      // รายการที่มาจาก PO ต้องบันทึกกลับลง DB ก่อน ถ้าไม่สำเร็จให้คงค่าเดิมไว้
      const editingItem = roundItems.find((item) => item.id === roundEditingItemId);
      if (editingItem?.orderDetailId) {
        try {
          await persistOrderDetailEdit(editingItem.orderDetailId, { length, qty });
        } catch {
          return { ok: false, text: "บันทึกรายการลงฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
        }
      }
      setRoundItems((items) =>
        items.map((item) => (item.id === roundEditingItemId ? { ...item, code, length, qty } : item)),
      );
      setRoundEditingItemId(null);
      setRoundForm({ code: "", length: "1", quantity: "1" });
      setRoundResult(null);
      return null;
    }

    // ถ้าหน้ากำลังผูกกับ PO อยู่ ให้สร้างแถวใหม่ลง purchase_order_details ด้วย
    // แล้วเก็บ id ที่ได้ไว้กับรายการ เพื่อให้การแก้ไขครั้งถัดไปอัปเดตแถวเดิมได้
    const roundOrdId = roundPoId ?? purchaseOrders.find((po) => po.no === roundLoadedFromPo)?.id;
    let createdDetailId: string | undefined;
    if (roundOrdId) {
      try {
        createdDetailId = await createOrderDetail(roundOrdId, {
          id: "",
          shape: "ROUND",
          materialId: selectedBar?.material_master_id,
          material: selectedBar?.code ?? "",
          diameter: barDiameter,
          length,
          qty,
          remaining: qty,
          status: "PENDING",
        });
        await refreshOrders();
      } catch {
        return { ok: false, text: "บันทึกรายการลงฐานข้อมูลไม่สำเร็จ กรุณาลองใหม่" };
      }
    }

    setRoundItems((items) => [
      ...items,
      {
        id: roundNextId,
        code,
        length,
        qty,
        color: ITEM_COLORS[items.length % ITEM_COLORS.length],
        orderDetailId: createdDetailId,
      },
    ]);
    setRoundNextId((id) => id + 1);
    setRoundForm({ code: "", length: "1", quantity: "1" });
    setRoundResult(null);
    return null;
  }

  function removeRoundItem(id: number) {
    setRoundItems((items) => items.filter((item) => item.id !== id));
    if (roundEditingItemId === id) {
      setRoundEditingItemId(null);
      setRoundForm({ code: "", length: "1", quantity: "1" });
    }
    setRoundResult(null);
  }

  function editRoundItem(id: number) {
    const item = roundItems.find((roundItem) => roundItem.id === id);
    if (!item) return;
    setRoundEditingItemId(id);
    setRoundForm({
      code: item.code,
      length: String(item.length),
      quantity: String(item.qty),
    });
  }

  function beginNewRoundItem() {
    setRoundEditingItemId(null);
    setRoundForm({ code: "", length: "1", quantity: "1" });
  }

  async function calculateRound() {
    if (roundMatchedItems.length === 0) return;
    setRoundResult(packRoundBars(barLength, rKerf, roundMatchedItems));
    setRoundSavedScrapKeys([]);
    setRoundScrapMessage(null);
    try {
      await setOrderDetailsStatus(roundPoId, activeRoundOrderDetailIds, "IN_PROCESS");
    } catch {
      setRoundScrapMessage({ ok: false, text: "อัปเดตสถานะรายการเป็น In Process ไม่สำเร็จ" });
    }
    setRoundTab("layout");
  }

  async function persistRoundScraps(sourceNo?: number) {
    const targetScraps = sourceNo
      ? unsavedRoundScraps.filter((scrap) => scrap.barNo === sourceNo)
      : unsavedRoundScraps;
    if (targetScraps.length === 0) return;

    const orderRow = activeOrderRow(roundPoId, activeRoundOrderDetailIds);
    const mmId = selectedBar?.material_master_id || orderRow?.materialId;
    if (!mmId) {
      throw new Error("ไม่พบวัสดุของเศษ กรุณาเลือกแท่งจากคลัง เพื่อระบุวัสดุของเศษ");
    }

    const stamp = Date.now().toString(36).toUpperCase();
    const ordId = roundPoId ?? purchaseOrders.find((po) => po.no === roundLoadedFromPo)?.id;
    const oddId = firstRemoteOrderDetailId(activeRoundOrderDetailIds);
    const scraps = targetScraps;

    for (const [index, scrap] of scraps.entries()) {
      await createWastrelBar({
        mm_id: mmId,
        srb_id: selectedBar?.id ?? null,
        code: `WSRB-${stamp}-${index + 1}`,
        diameter: barDiameter,
        length: Math.max(1, Math.floor(scrap.length)),
        quantity: 1,
        available_quantity: 1,
        po_id: ordId ?? null,
        podetail_id: oddId ?? null,
        remark: `เศษจากแท่งที่ ${scrap.barNo}${roundLoadedFromPo ? ` (${roundLoadedFromPo})` : ""}`,
      });
    }
    setScrapBars(await loadWastrelBars());
    setRoundSavedScrapKeys((keys) => [...keys, ...scraps.map(roundScrapKey)]);
    return scraps.length;
  }

  async function saveRoundScraps() {
    try {
      const count = await persistRoundScraps();
      setRoundScrapMessage({ ok: true, text: `บันทึกเศษลงคลัง (wastrel_steel_round_bars) แล้ว ${count ?? 0} ชิ้น` });
    } catch (error) {
      setRoundScrapMessage({
        ok: false,
        text: error instanceof Error ? error.message : "บันทึกเศษลงคลังไม่สำเร็จ กรุณาลองใหม่",
      });
    }
  }

  async function confirmRoundPlan(options: PlanActionOptions = {}): Promise<Notice> {
    try {
      const detailIds = options.detailIds?.length ? options.detailIds : activeRoundOrderDetailIds;
      const count = await persistRoundScraps(options.scrapSourceNo);
      await setOrderDetailsStatus(roundPoId, detailIds, "COMPLETED");
      return { ok: true, text: `ยืนยันแผนการตัดแล้ว และบันทึกเศษ ${count ?? 0} ชิ้น` };
    } catch (error) {
      return {
        ok: false,
        text: error instanceof Error ? error.message : "ยืนยันแผนการตัดไม่สำเร็จ",
      };
    }
  }

  async function cancelRoundPlan(options: PlanActionOptions = {}): Promise<Notice> {
    try {
      const detailIds = options.detailIds?.length ? options.detailIds : activeRoundOrderDetailIds;
      await setOrderDetailsStatus(roundPoId, detailIds, "CANCELLED");
      return { ok: true, text: "ยกเลิกแผนการตัดแล้ว" };
    } catch {
      return { ok: false, text: "ยกเลิกแผนการตัดไม่สำเร็จ" };
    }
  }

  async function removeScrapBar(id: string) {
    try {
      await deleteWastrelBar(id);
      setScrapBars((items) => items.filter((item) => item.id !== id));
    } catch {
      setRoundScrapMessage({ ok: false, text: "ลบเศษออกจากคลังไม่สำเร็จ กรุณาลองใหม่" });
    }
  }

  const value: CuttingContextValue = {
    module,
    plateTab,
    setPlateTab,
    roundTab,
    setRoundTab,
    headerSubtitle,
    dataStatus,

    stockPlates,
    scrapPlates: visibleScrapPlates,
    selectedPlateId,
    selectedPlate,
    setSelectedPlateId,
    sheetW,
    setSheetW: (value) => {
      setSheetW(value);
      rawSetSelectedPlateId("");
    },
    sheetH,
    setSheetH: (value) => {
      setSheetH(value);
      rawSetSelectedPlateId("");
    },
    kerf,
    setKerf,
    minScrap,
    setMinScrap,
    plateItems,
    plateForm,
    setPlateForm,
    plateEditingItemId,
    plateLoadedFromPo,
    clearPlatePoLoad,
    addPlateItem,
    beginNewPlateItem,
    editPlateItem,
    removePlateItem,
    calculatePlate,
    confirmPlatePlan,
    cancelPlatePlan,
    plateResult,
    plateTotalPieces,
    plateAverageUtilization,
    plateScraps,
    unsavedPlateScraps,
    plateSavedScrapKeys,
    plateScrapMessage,
    savePlateScraps,
    removeScrapPlate,

    stockBars,
    scrapBars: visibleScrapBars,
    selectedBarId,
    selectedBar,
    setSelectedBarId,
    barDiameter,
    setBarDiameter: (value) => {
      setBarDiameter(value);
      rawSetSelectedBarId("");
    },
    barLength,
    setBarLength: (value) => {
      setBarLength(value);
      rawSetSelectedBarId("");
    },
    rKerf,
    setRKerf,
    rMinScrap,
    setRMinScrap,
    roundItems,
    roundForm,
    setRoundForm,
    roundEditingItemId,
    roundLoadedFromPo,
    clearRoundPoLoad,
    addRoundItem,
    beginNewRoundItem,
    editRoundItem,
    removeRoundItem,
    calculateRound,
    confirmRoundPlan,
    cancelRoundPlan,
    roundResult,
    roundTotalPieces,
    roundMatchedCount,
    roundMismatchedCount,
    roundMismatchText,
    roundAverageUtilization,
    roundScraps,
    unsavedRoundScraps,
    roundSavedScrapKeys,
    roundScrapMessage,
    saveRoundScraps,
    removeScrapBar,
  };

  return (
    <CuttingContext.Provider value={value}>
      {children}
    </CuttingContext.Provider>
  );
}

export function useCuttingContext() {
  const context = useContext(CuttingContext);
  if (!context) {
    throw new Error("useCutting must be used inside CuttingProvider");
  }
  return context;
}

function plateScrapKey(scrap: PlateScrap): string {
  return `${scrap.sheetNo}:${scrap.x}:${scrap.y}`;
}

function roundScrapKey(scrap: RoundScrap): string {
  return `${scrap.barNo}:${scrap.length}`;
}

function uniqueIds(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function isLocalOrderDetailId(id: string): boolean {
  return id.startsWith("LOCAL-");
}

function firstRemoteOrderDetailId(ids: string[]): string | undefined {
  return ids.find((id) => !isLocalOrderDetailId(id));
}

function isCuttableOrderDetail(row: OrderDetail): boolean {
  return row.status === "PENDING" || row.status === "IN_PROCESS";
}
