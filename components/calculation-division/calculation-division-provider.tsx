"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loadFactoryData } from "./api";
import {
  ITEM_COLORS,
  MODULE_SUBTITLES,
  SAMPLE_ORDER_DETAILS,
  SAMPLE_PLATE_ITEMS,
  SAMPLE_PLATE_STOCK,
  SAMPLE_PURCHASE_ORDERS,
  SAMPLE_ROUND_ITEMS,
  SAMPLE_ROUND_STOCK,
  SAMPLE_SAVED_PLATE_SCRAPS,
  SAMPLE_SAVED_ROUND_SCRAPS,
} from "./constants";
import { nextCode, packGuillotine, packRoundBars } from "./mappers";
import type {
  CalculationDivisionContextValue,
  DataStatus,
  ModuleKey,
  Notice,
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
    source: "sample",
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(SAMPLE_PURCHASE_ORDERS);
  const [orderDetails, setOrderDetails] = useState(SAMPLE_ORDER_DETAILS);
  const [poSearch, setPoSearch] = useState("");
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);

  const [stockPlates, setStockPlates] = useState<PlateStock[]>(SAMPLE_PLATE_STOCK);
  const [scrapPlates, setScrapPlates] = useState<SavedPlateScrap[]>(SAMPLE_SAVED_PLATE_SCRAPS);
  const [selectedPlateId, rawSetSelectedPlateId] = useState("");
  const [sheetW, setSheetW] = useState(2400);
  const [sheetH, setSheetH] = useState(1200);
  const [kerf, setKerf] = useState(3);
  const [minScrap, setMinScrap] = useState(150);
  const [plateItems, setPlateItems] = useState<PlateItem[]>(SAMPLE_PLATE_ITEMS);
  const [plateNextId, setPlateNextId] = useState(5);
  const [plateResult, setPlateResult] = useState<PlateResult | null>(null);
  const [plateForm, setPlateForm] = useState<PlateFormState>({
    code: "",
    width: "",
    height: "",
    quantity: "1",
  });
  const [plateSavedScrapKeys, setPlateSavedScrapKeys] = useState<string[]>([]);
  const [plateScrapMessage, setPlateScrapMessage] = useState<Notice | null>(null);
  const [plateLoadedFromPo, setPlateLoadedFromPo] = useState<string | null>(null);

  const [stockBars, setStockBars] = useState<RoundBarStock[]>(SAMPLE_ROUND_STOCK);
  const [scrapBars, setScrapBars] = useState<SavedRoundScrap[]>(SAMPLE_SAVED_ROUND_SCRAPS);
  const [selectedBarId, rawSetSelectedBarId] = useState("");
  const [barDiameter, setBarDiameter] = useState(50);
  const [barLength, setBarLength] = useState(6000);
  const [rKerf, setRKerf] = useState(3);
  const [rMinScrap, setRMinScrap] = useState(300);
  const [roundItems, setRoundItems] = useState<RoundItem[]>(SAMPLE_ROUND_ITEMS);
  const [roundNextId, setRoundNextId] = useState(4);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [roundForm, setRoundForm] = useState<RoundFormState>({
    code: "",
    length: "",
    quantity: "1",
  });
  const [roundSavedScrapKeys, setRoundSavedScrapKeys] = useState<string[]>([]);
  const [roundScrapMessage, setRoundScrapMessage] = useState<Notice | null>(null);
  const [roundLoadedFromPo, setRoundLoadedFromPo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadFactoryData()
      .then((data) => {
        if (!active) return;
        if (data.purchaseOrders?.length) setPurchaseOrders(data.purchaseOrders);
        if (data.orderDetails && Object.keys(data.orderDetails).length) setOrderDetails(data.orderDetails);
        if (data.stockPlates?.length) setStockPlates(data.stockPlates);
        if (data.stockBars?.length) setStockBars(data.stockBars);
        setDataStatus({
          loading: false,
          error: null,
          source:
            data.purchaseOrders?.length || data.stockPlates?.length || data.stockBars?.length ? "api" : "sample",
        });
      })
      .catch((error) => {
        if (!active) return;
        setDataStatus({
          loading: false,
          error: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
          source: "sample",
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

  function addPlateItem() {
    const w = Number(plateForm.width);
    const h = Number(plateForm.height);
    if (!w || !h || w <= 0 || h <= 0) return;

    const code = (plateForm.code.trim().toUpperCase() || nextCode(plateItems.map((item) => item.code))).slice(0, 3);
    const qty = Math.max(1, Math.floor(Number(plateForm.quantity) || 1));
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
  }

  function removePlateItem(id: number) {
    setPlateItems((items) => items.filter((item) => item.id !== id));
  }

  function calculatePlate() {
    if (plateItems.length === 0) return;
    setPlateResult(packGuillotine(sheetW, sheetH, kerf, plateItems));
    setPlateSavedScrapKeys([]);
    setPlateScrapMessage(null);
    setPlateTab("layout");
  }

  function savePlateScraps() {
    if (unsavedPlateScraps.length === 0) return;
    const stamp = Date.now().toString(36).toUpperCase();
    const rows = unsavedPlateScraps.map((scrap, index) => ({
      id: `sp${Date.now()}${index}`,
      code: `SCRAP-${stamp}-${index + 1}`,
      length: Math.floor(scrap.w),
      width: Math.floor(scrap.h),
      thickness: selectedPlate?.thickness ?? 1,
      remark: `เศษจากแผ่นที่ ${scrap.sheetNo}${plateLoadedFromPo ? ` (${plateLoadedFromPo})` : ""}`,
    }));

    setScrapPlates((current) => [...rows, ...current]);
    setPlateSavedScrapKeys((keys) => [...keys, ...unsavedPlateScraps.map(plateScrapKey)]);
    setPlateScrapMessage({ ok: true, text: `บันทึกเศษลงคลังแล้ว ${rows.length} ชิ้น` });
  }

  function removeScrapPlate(id: string) {
    setScrapPlates((items) => items.filter((item) => item.id !== id));
  }

  function addRoundItem() {
    const length = Number(roundForm.length);
    if (!length || length <= 0) return;

    const code = (roundForm.code.trim().toUpperCase() || nextCode(roundItems.map((item) => item.code))).slice(0, 3);
    const qty = Math.max(1, Math.floor(Number(roundForm.quantity) || 1));
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
  }

  function removeRoundItem(id: number) {
    setRoundItems((items) => items.filter((item) => item.id !== id));
  }

  function calculateRound() {
    if (roundMatchedItems.length === 0) return;
    setRoundResult(packRoundBars(barLength, rKerf, roundMatchedItems));
    setRoundSavedScrapKeys([]);
    setRoundScrapMessage(null);
    setRoundTab("layout");
  }

  function saveRoundScraps() {
    if (unsavedRoundScraps.length === 0) return;
    const stamp = Date.now().toString(36).toUpperCase();
    const rows = unsavedRoundScraps.map((scrap, index) => ({
      id: `sb${Date.now()}${index}`,
      code: `WSRB-${stamp}-${index + 1}`,
      diameter: barDiameter,
      length: Math.floor(scrap.length),
      quantity: 1,
      remark: `เศษจากแท่งที่ ${scrap.barNo}${roundLoadedFromPo ? ` (${roundLoadedFromPo})` : ""}`,
    }));

    setScrapBars((current) => [...rows, ...current]);
    setRoundSavedScrapKeys((keys) => [...keys, ...unsavedRoundScraps.map(roundScrapKey)]);
    setRoundScrapMessage({ ok: true, text: `บันทึกเศษลงคลังแล้ว ${rows.length} ชิ้น` });
  }

  function removeScrapBar(id: string) {
    setScrapBars((items) => items.filter((item) => item.id !== id));
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
    pushRoundFromPo,
    pushPlateFromPo,

    stockPlates,
    scrapPlates,
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
    plateLoadedFromPo,
    clearPlatePoLoad: () => setPlateLoadedFromPo(null),
    addPlateItem,
    removePlateItem,
    calculatePlate,
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
    scrapBars,
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
    roundLoadedFromPo,
    clearRoundPoLoad: () => setRoundLoadedFromPo(null),
    addRoundItem,
    removeRoundItem,
    calculateRound,
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

