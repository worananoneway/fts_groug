"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createWastrelBar,
  createWastrelPlate,
  deleteWastrelBar,
  deleteWastrelPlate,
  loadFactoryData,
  loadWastrelBars,
  loadWastrelPlates,
  updateOrderDetailStatus,
  updateOrderStatus,
} from "./api";
import { ITEM_COLORS, MODULE_SUBTITLES } from "./constants";
import { nextCode, packGuillotine, packRoundBars } from "./mappers";
import type {
  CalculationDivisionContextValue,
  DataStatus,
  ModuleKey,
  Notice,
  OrderDetail,
  OrderDetailStatus,
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
} from "./types";

const CalculationDivisionContext = createContext<CalculationDivisionContextValue | null>(null);

export function CalculationDivisionProvider({ children }: { children: ReactNode }) {
  const [module, setModule] = useState<ModuleKey>("po");
  const [plateTab, setPlateTab] = useState<SubTabKey>("settings");
  const [roundTab, setRoundTab] = useState<SubTabKey>("settings");
  const [dataStatus, setDataStatus] = useState<DataStatus>({
    loading: true,
    error: null,
    source: "none",
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail[]>>({});
  const [poSearch, setPoSearch] = useState("");
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);

  const [stockPlates, setStockPlates] = useState<PlateStock[]>([]);
  const [scrapPlates, setScrapPlates] = useState<SavedPlateScrap[]>([]);
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
    width: "",
    height: "",
    quantity: "1",
  });
  const [plateEditingItemId, setPlateEditingItemId] = useState<number | null>(null);
  const [plateSavedScrapKeys, setPlateSavedScrapKeys] = useState<string[]>([]);
  const [plateScrapMessage, setPlateScrapMessage] = useState<Notice | null>(null);
  const [plateLoadedFromPo, setPlateLoadedFromPo] = useState<string | null>(null);

  const [stockBars, setStockBars] = useState<RoundBarStock[]>([]);
  const [scrapBars, setScrapBars] = useState<SavedRoundScrap[]>([]);
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
    length: "",
    quantity: "1",
  });
  const [roundEditingItemId, setRoundEditingItemId] = useState<number | null>(null);
  const [roundSavedScrapKeys, setRoundSavedScrapKeys] = useState<string[]>([]);
  const [roundScrapMessage, setRoundScrapMessage] = useState<Notice | null>(null);
  const [roundLoadedFromPo, setRoundLoadedFromPo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadFactoryData()
      .then((data) => {
        if (!active) return;
        setPurchaseOrders(data.purchaseOrders ?? []);
        setOrderDetails(data.orderDetails ?? {});
        setStockPlates(data.stockPlates ?? []);
        setStockBars(data.stockBars ?? []);
        setScrapPlates(data.scrapPlates ?? []);
        setScrapBars(data.scrapBars ?? []);
        setDataStatus({
          loading: false,
          error: null,
          source: "api",
        });
      })
      .catch((error) => {
        if (!active) return;
        setDataStatus({
          loading: false,
          error: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
          source: "none",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const headerSubtitle = MODULE_SUBTITLES[module];
  const selectedPlate = stockPlates.find((plate) => plate.id === selectedPlateId) ?? null;
  const selectedBar = stockBars.find((bar) => bar.id === selectedBarId) ?? null;

  const filteredPurchaseOrders = useMemo(() => {
    const query = poSearch.trim().toLowerCase();
    if (!query) return purchaseOrders;
    return purchaseOrders.filter(
      (po) => po.no.toLowerCase().includes(query) || po.customer.toLowerCase().includes(query),
    );
  }, [poSearch, purchaseOrders]);

  const selectedPo = selectedPoId ? purchaseOrders.find((po) => po.id === selectedPoId) ?? null : null;
  const selectedOrderRows = selectedPoId ? orderDetails[selectedPoId] ?? [] : [];
  const selectedRoundRows = selectedOrderRows.filter((row) => row.shape === "ROUND");
  const selectedPlateRows = selectedOrderRows.filter((row) => row.shape === "PLATE");
  const activePlateOrderDetailIds = uniqueIds(plateItems.map((item) => item.orderDetailId));
  const activeRoundOrderDetailIds = uniqueIds(roundItems.map((item) => item.orderDetailId));
  const visibleScrapPlates = selectedPoId
    ? scrapPlates.filter((scrap) => scrap.orderId === selectedPoId)
    : scrapPlates;
  const visibleScrapBars = selectedPoId
    ? scrapBars.filter((scrap) => scrap.orderId === selectedPoId)
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

  function selectPo(id: string) {
    setSelectedPoId((current) => (current === id ? null : id));
  }

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

  function beginNewPlateItem() {
    setPlateEditingItemId(null);
    setPlateForm({ code: "", width: "", height: "", quantity: "1" });
  }

  function addPlateItem() {
    const w = Number(plateForm.width);
    const h = Number(plateForm.height);
    if (!w || !h || w <= 0 || h <= 0) return;

    const codeSourceItems = plateEditingItemId
      ? plateItems.filter((item) => item.id !== plateEditingItemId)
      : plateItems;
    const code = (plateForm.code.trim().toUpperCase() || nextCode(codeSourceItems.map((item) => item.code))).slice(0, 3);
    const qty = Math.max(1, Math.floor(Number(plateForm.quantity) || 1));
    if (plateEditingItemId) {
      setPlateItems((items) =>
        items.map((item) => (item.id === plateEditingItemId ? { ...item, code, w, h, qty } : item)),
      );
      setPlateEditingItemId(null);
      setPlateForm({ code: "", width: "", height: "", quantity: "1" });
      setPlateResult(null);
      return;
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
      },
    ]);
    setPlateNextId((id) => id + 1);
    setPlateForm({ code: "", width: "", height: "", quantity: "1" });
    setPlateResult(null);
  }

  function removePlateItem(id: number) {
    setPlateItems((items) => items.filter((item) => item.id !== id));
    if (plateEditingItemId === id) {
      setPlateEditingItemId(null);
      setPlateForm({ code: "", width: "", height: "", quantity: "1" });
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

  async function setSelectedOrderDetailsStatus(detailIds: string[], status: OrderDetailStatus) {
    if (!selectedPoId || detailIds.length === 0) return;

    const remoteDetailIds = detailIds.filter((detailId) => !isLocalOrderDetailId(detailId));
    await Promise.all(remoteDetailIds.map((detailId) => updateOrderDetailStatus(detailId, status)));

    const nextRows = (orderDetails[selectedPoId] ?? []).map((row) =>
      detailIds.includes(row.id) ? { ...row, status } : row,
    );
    setOrderDetails((current) => ({ ...current, [selectedPoId]: nextRows }));

    const nextOrderStatus =
      status === "IN_PROCESS"
        ? "IN_PROCESS"
        : nextRows.every((row) => row.status !== "PENDING" && row.status !== "IN_PROCESS")
          ? "COMPLETED"
          : null;

    if (!nextOrderStatus) return;
    await updateOrderStatus(selectedPoId, nextOrderStatus);
    setPurchaseOrders((orders) =>
      orders.map((order) =>
        order.id === selectedPoId
          ? { ...order, status: nextOrderStatus === "COMPLETED" ? "DONE" : "IN_PROGRESS" }
          : order,
      ),
    );
  }

  async function cancelOrderDetail(orderDetailId: string): Promise<Notice> {
    try {
      await setSelectedOrderDetailsStatus([orderDetailId], "CANCELLED");
      return { ok: true, text: "ลบรายการสำเร็จ" };
    } catch {
      return { ok: false, text: "ลบรายการไม่สำเร็จ" };
    }
  }

  function addOrderDetailLocal(detail: OrderDetail): Notice {
    if (!selectedPoId) return { ok: false, text: "ไม่พบใบสั่งซื้อที่เลือก" };
    setOrderDetails((current) => ({
      ...current,
      [selectedPoId]: [...(current[selectedPoId] ?? []), detail],
    }));
    return { ok: true, text: "เพิ่มรายการสำเร็จ" };
  }

  function updateOrderDetailLocal(detail: OrderDetail): Notice {
    if (!selectedPoId) return { ok: false, text: "ไม่พบใบสั่งซื้อที่เลือก" };
    setOrderDetails((current) => ({
      ...current,
      [selectedPoId]: (current[selectedPoId] ?? []).map((row) => (row.id === detail.id ? detail : row)),
    }));
    return { ok: true, text: "แก้ไขรายละเอียดสำเร็จ" };
  }

  async function calculatePlate() {
    if (plateItems.length === 0) return;
    setPlateResult(packGuillotine(sheetW, sheetH, kerf, plateItems));
    setPlateSavedScrapKeys([]);
    setPlateScrapMessage(null);
    try {
      await setSelectedOrderDetailsStatus(activePlateOrderDetailIds, "IN_PROCESS");
    } catch {
      setPlateScrapMessage({ ok: false, text: "อัปเดตสถานะรายการเป็น In Process ไม่สำเร็จ" });
    }
    setPlateTab("layout");
  }

  async function persistPlateScraps() {
    if (unsavedPlateScraps.length === 0) return;
    if (!selectedPlate?.material_master_id) {
      throw new Error("กรุณาเลือกแผ่นจากคลังก่อนบันทึกเศษ เพื่อระบุวัสดุของเศษ");
    }

    const stamp = Date.now().toString(36).toUpperCase();
    const ordId = selectedPoId ?? purchaseOrders.find((po) => po.no === plateLoadedFromPo)?.id;
    const oddId = firstRemoteOrderDetailId(activePlateOrderDetailIds);
    const scraps = unsavedPlateScraps;

    for (const [index, scrap] of scraps.entries()) {
      await createWastrelPlate({
        mm_id: selectedPlate.material_master_id,
        msp_id: selectedPlate.id,
        stock_code: `SCRAP-${stamp}-${index + 1}`,
        length: Math.max(1, Math.floor(scrap.w)),
        width: Math.max(1, Math.floor(scrap.h)),
        thickness: selectedPlate.thickness || 1,
        quantity: 1,
        available_quantity: 1,
        ord_id: ordId,
        odd_id: oddId,
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

  async function confirmPlatePlan(): Promise<Notice> {
    try {
      const count = await persistPlateScraps();
      await setSelectedOrderDetailsStatus(activePlateOrderDetailIds, "COMPLETED");
      return { ok: true, text: `ยืนยันแผนการตัดแล้ว และบันทึกเศษ ${count ?? 0} ชิ้น` };
    } catch (error) {
      return {
        ok: false,
        text: error instanceof Error ? error.message : "ยืนยันแผนการตัดไม่สำเร็จ",
      };
    }
  }

  async function cancelPlatePlan(): Promise<Notice> {
    try {
      await setSelectedOrderDetailsStatus(activePlateOrderDetailIds, "CANCELLED");
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

  function addRoundItem() {
    const length = Number(roundForm.length);
    if (!length || length <= 0) return;

    const codeSourceItems = roundEditingItemId
      ? roundItems.filter((item) => item.id !== roundEditingItemId)
      : roundItems;
    const code = (roundForm.code.trim().toUpperCase() || nextCode(codeSourceItems.map((item) => item.code))).slice(0, 3);
    const qty = Math.max(1, Math.floor(Number(roundForm.quantity) || 1));
    if (roundEditingItemId) {
      setRoundItems((items) =>
        items.map((item) => (item.id === roundEditingItemId ? { ...item, code, length, qty } : item)),
      );
      setRoundEditingItemId(null);
      setRoundForm({ code: "", length: "", quantity: "1" });
      setRoundResult(null);
      return;
    }

    setRoundItems((items) => [
      ...items,
      {
        id: roundNextId,
        code,
        length,
        qty,
        color: ITEM_COLORS[items.length % ITEM_COLORS.length],
      },
    ]);
    setRoundNextId((id) => id + 1);
    setRoundForm({ code: "", length: "", quantity: "1" });
    setRoundResult(null);
  }

  function removeRoundItem(id: number) {
    setRoundItems((items) => items.filter((item) => item.id !== id));
    if (roundEditingItemId === id) {
      setRoundEditingItemId(null);
      setRoundForm({ code: "", length: "", quantity: "1" });
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
    setRoundForm({ code: "", length: "", quantity: "1" });
  }

  async function calculateRound() {
    if (roundMatchedItems.length === 0) return;
    setRoundResult(packRoundBars(barLength, rKerf, roundMatchedItems));
    setRoundSavedScrapKeys([]);
    setRoundScrapMessage(null);
    try {
      await setSelectedOrderDetailsStatus(activeRoundOrderDetailIds, "IN_PROCESS");
    } catch {
      setRoundScrapMessage({ ok: false, text: "อัปเดตสถานะรายการเป็น In Process ไม่สำเร็จ" });
    }
    setRoundTab("layout");
  }

  async function persistRoundScraps() {
    if (unsavedRoundScraps.length === 0) return;
    if (!selectedBar?.material_master_id) {
      throw new Error("กรุณาเลือกแท่งจากคลังก่อนบันทึกเศษ เพื่อระบุวัสดุของเศษ");
    }

    const stamp = Date.now().toString(36).toUpperCase();
    const ordId = selectedPoId ?? purchaseOrders.find((po) => po.no === roundLoadedFromPo)?.id;
    const oddId = firstRemoteOrderDetailId(activeRoundOrderDetailIds);
    const scraps = unsavedRoundScraps;

    for (const [index, scrap] of scraps.entries()) {
      await createWastrelBar({
        mm_id: selectedBar.material_master_id,
        srb_id: selectedBar.id,
        code: `WSRB-${stamp}-${index + 1}`,
        diameter: barDiameter,
        length: Math.max(1, Math.floor(scrap.length)),
        quantity: 1,
        available_quantity: 1,
        ord_id: ordId,
        odd_id: oddId,
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

  async function confirmRoundPlan(): Promise<Notice> {
    try {
      const count = await persistRoundScraps();
      await setSelectedOrderDetailsStatus(activeRoundOrderDetailIds, "COMPLETED");
      return { ok: true, text: `ยืนยันแผนการตัดแล้ว และบันทึกเศษ ${count ?? 0} ชิ้น` };
    } catch (error) {
      return {
        ok: false,
        text: error instanceof Error ? error.message : "ยืนยันแผนการตัดไม่สำเร็จ",
      };
    }
  }

  async function cancelRoundPlan(): Promise<Notice> {
    try {
      await setSelectedOrderDetailsStatus(activeRoundOrderDetailIds, "CANCELLED");
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

  function pushOrderDetailToCutting(orderDetailId: string) {
    if (!selectedPoId) return;
    const row = (orderDetails[selectedPoId] ?? []).find((item) => item.id === orderDetailId);
    const po = purchaseOrders.find((item) => item.id === selectedPoId);
    if (!row) return;

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
      setRoundForm({ code: "", length: "", quantity: "1" });
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
    setPlateForm({ code: "", width: "", height: "", quantity: "1" });
    setPlateResult(shouldShowLayout ? packGuillotine(nextSheetW, nextSheetH, kerf, [nextItem]) : null);
    setPlateSavedScrapKeys([]);
    setPlateScrapMessage(null);
  }

  function pushRoundFromPo(poId: string | null) {
    if (!poId) return;
    const rows = (orderDetails[poId] ?? []).filter((row) => row.shape === "ROUND");
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
    const po = purchaseOrders.find((item) => item.id === poId);

    setModule("roundbar");
    setRoundTab("settings");
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
    setRoundForm({ code: "", length: "", quantity: "1" });
    setRoundResult(null);
    setRoundSavedScrapKeys([]);
    setRoundScrapMessage(null);
  }

  function pushPlateFromPo(poId: string | null) {
    if (!poId) return;
    const rows = (orderDetails[poId] ?? []).filter((row) => row.shape === "PLATE");
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
    const po = purchaseOrders.find((item) => item.id === poId);

    setModule("plate");
    setPlateTab("settings");
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
    setPlateForm({ code: "", width: "", height: "", quantity: "1" });
    setPlateResult(null);
    setPlateSavedScrapKeys([]);
    setPlateScrapMessage(null);
  }

  const value: CalculationDivisionContextValue = {
    module,
    setModule,
    plateTab,
    setPlateTab,
    roundTab,
    setRoundTab,
    headerSubtitle,
    dataStatus,

    purchaseOrders,
    orderDetails,
    poSearch,
    setPoSearch,
    selectedPoId,
    selectPo,
    filteredPurchaseOrders,
    selectedPo,
    selectedOrderRows,
    selectedRoundRows,
    selectedPlateRows,
    pushOrderDetailToCutting,
    addOrderDetailLocal,
    cancelOrderDetail,
    updateOrderDetailLocal,
    pushRoundFromPo,
    pushPlateFromPo,

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
    clearPlatePoLoad: () => setPlateLoadedFromPo(null),
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
    clearRoundPoLoad: () => setRoundLoadedFromPo(null),
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
    <CalculationDivisionContext.Provider value={value}>
      {children}
    </CalculationDivisionContext.Provider>
  );
}

export function useCalculationDivisionContext() {
  const context = useContext(CalculationDivisionContext);
  if (!context) {
    throw new Error("useCalculationDivision must be used inside CalculationDivisionProvider");
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

