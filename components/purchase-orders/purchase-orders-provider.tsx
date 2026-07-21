"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { MODULE_SUBTITLES } from "@/constants/division";
import {
  createOrderDetail,
  deletePurchaseOrder,
  loadOrders,
  updateOrderDetail,
  updateOrderDetailStatus,
  updatePurchaseOrder,
} from "@/services/division/purchase-orders";
import { importLegacyOrder, legacyOrderToLivePO, loadLegacyOrders } from "@/services/division/legacy-orders";
import type {
  DataStatus,
  MaterialMaster,
  Notice,
  OrderDetail,
  OrderDetailStatus,
  PurchaseOrder,
  PurchaseOrderUpdateFields,
} from "@/types/division";

export interface PurchaseOrdersContextValue {
  dataStatus: DataStatus;
  headerSubtitle: string;

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

  addOrderDetail: (detail: OrderDetail) => Promise<Notice>;
  cancelOrderDetail: (orderDetailId: string) => Promise<Notice>;
  updateOrderDetail: (detail: OrderDetail) => Promise<Notice>;
  updatePurchaseOrderFields: (fields: PurchaseOrderUpdateFields) => Promise<Notice>;
  deletePurchaseOrder: (poId: string) => Promise<Notice>;
  importFromLegacy: (docId: string) => Promise<Notice>;

  pushOrderDetailToCutting: (orderDetailId: string) => void;
  pushRoundFromPo: (poId: string | null) => void;
  pushPlateFromPo: (poId: string | null) => void;
}

const PurchaseOrdersContext = createContext<PurchaseOrdersContextValue | null>(null);

export function PurchaseOrdersProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dataStatus, setDataStatus] = useState<DataStatus>({
    loading: true,
    error: null,
    source: "none",
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [liveOrders, setLiveOrders] = useState<PurchaseOrder[]>([]);
  const [orderDetails, setOrderDetails] = useState<Record<string, OrderDetail[]>>({});
  const [materialMasters, setMaterialMasters] = useState<MaterialMaster[]>([]);
  const [poSearch, setPoSearch] = useState("");
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);

  function applyOrders(data: Awaited<ReturnType<typeof loadOrders>>) {
    setPurchaseOrders(data.purchaseOrders ?? []);
    setOrderDetails(data.orderDetails ?? {});
    setMaterialMasters(data.materialMasters ?? []);
    setDataStatus({ loading: false, error: null, source: "api" });
  }

  // โหลดใบสั่งตัดสดจาก Express (เฉพาะที่ยังไม่ได้นำเข้า) มาแสดงในลิสต์
  async function refreshLiveOrders() {
    try {
      const legacy = await loadLegacyOrders("");
      setLiveOrders(legacy.map(legacyOrderToLivePO));
    } catch {
      // ถ้า Express ต่อไม่ได้ ก็แค่ไม่มีรายการสด — ไม่ทำให้หน้าพัง
      setLiveOrders([]);
    }
  }

  useEffect(() => {
    let active = true;
    loadOrders()
      .then((data) => {
        if (!active) return;
        applyOrders(data);
        // เปิดจากหน้าโปรเจค (/po?po=<id>) — เลือก PO นั้นให้อัตโนมัติถ้ามีอยู่จริง
        const requestedPoId = new URLSearchParams(window.location.search).get("po");
        if (requestedPoId && (data.purchaseOrders ?? []).some((po) => po.id === requestedPoId)) {
          setSelectedPoId(requestedPoId);
        }
      })
      .catch((error) => {
        if (!active) return;
        setDataStatus({
          loading: false,
          error: error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ",
          source: "none",
        });
      });
    // ดึงรายการสดจาก Express มาแสดงคู่กันในลิสต์
    void refreshLiveOrders();

    return () => {
      active = false;
    };
  }, []);

  async function refreshOrders() {
    const data = await loadOrders();
    applyOrders(data);
  }

  // รวมรายการ: PO ที่นำเข้าแล้ว + ใบสั่งตัดสดจาก Express ที่ยังไม่ถูกนำเข้า (กันซ้ำด้วยเลข JP)
  const mergedPurchaseOrders = useMemo(() => {
    const importedNos = new Set(purchaseOrders.map((po) => po.no));
    const pendingLive = liveOrders.filter((live) => !importedNos.has(live.no));
    return [...purchaseOrders, ...pendingLive];
  }, [purchaseOrders, liveOrders]);

  const filteredPurchaseOrders = useMemo(() => {
    const query = poSearch.trim().toLowerCase();
    if (!query) return mergedPurchaseOrders;
    return mergedPurchaseOrders.filter(
      (po) => po.no.toLowerCase().includes(query) || po.customer.toLowerCase().includes(query),
    );
  }, [poSearch, mergedPurchaseOrders]);

  const selectedPo = selectedPoId ? mergedPurchaseOrders.find((po) => po.id === selectedPoId) ?? null : null;
  const selectedOrderRows = selectedPoId ? orderDetails[selectedPoId] ?? [] : [];
  const selectedRoundRows = selectedOrderRows.filter((row) => row.shape === "ROUND" && isCuttableOrderDetail(row));
  const selectedPlateRows = selectedOrderRows.filter((row) => row.shape === "PLATE" && isCuttableOrderDetail(row));

  // เลือก PO — ถ้าเป็นรายการสดจาก Express ให้นำเข้าเงียบ ๆ ก่อนแล้วค่อยเปิด
  async function selectPo(id: string) {
    const target = mergedPurchaseOrders.find((po) => po.id === id);
    if (target?.isLive && target.legacyDocId) {
      // นำเข้าอัตโนมัติ (ไม่ต้องกดปุ่ม) แล้วเลือก PO ที่เพิ่งสร้าง
      await importFromLegacy(target.legacyDocId);
      await refreshLiveOrders();
      return;
    }
    setSelectedPoId((current) => (current === id ? null : id));
  }

  async function setSelectedOrderDetailsStatus(detailIds: string[], status: OrderDetailStatus) {
    if (!selectedPoId || detailIds.length === 0) return;

    const currentRows = orderDetails[selectedPoId] ?? [];
    const remoteRows = currentRows.filter((row) => detailIds.includes(row.id) && !isLocalOrderDetailId(row.id));
    await Promise.all(remoteRows.map((row) => updateOrderDetailStatus(selectedPoId, row, status)));

    const nextRows = currentRows.map((row) =>
      detailIds.includes(row.id) ? { ...row, status } : row,
    );
    setOrderDetails((current) => ({ ...current, [selectedPoId]: nextRows }));

    if (remoteRows.length > 0) {
      await refreshOrders();
    }
  }

  async function cancelOrderDetail(orderDetailId: string): Promise<Notice> {
    try {
      await setSelectedOrderDetailsStatus([orderDetailId], "CANCELLED");
      return { ok: true, text: "ลบรายการสำเร็จ" };
    } catch {
      return { ok: false, text: "ลบรายการไม่สำเร็จ" };
    }
  }

  async function addOrderDetail(detail: OrderDetail): Promise<Notice> {
    if (!selectedPoId) return { ok: false, text: "ไม่พบใบสั่งซื้อที่เลือก" };
    if (!detail.materialId) return { ok: false, text: "กรุณาเลือกวัสดุจากรายการ" };
    try {
      await createOrderDetail(selectedPoId, detail);
      await refreshOrders();
      return { ok: true, text: "เพิ่มรายการสำเร็จ" };
    } catch {
      return { ok: false, text: "เพิ่มรายการไม่สำเร็จ" };
    }
  }

  async function updateOrderDetailRow(detail: OrderDetail): Promise<Notice> {
    if (!selectedPoId) return { ok: false, text: "ไม่พบใบสั่งซื้อที่เลือก" };
    if (!detail.materialId) return { ok: false, text: "กรุณาเลือกวัสดุจากรายการ" };
    try {
      if (isLocalOrderDetailId(detail.id)) {
        await createOrderDetail(selectedPoId, detail);
      } else {
        await updateOrderDetail(selectedPoId, detail);
      }
      await refreshOrders();
      return { ok: true, text: "แก้ไขรายละเอียดสำเร็จ" };
    } catch {
      return { ok: false, text: "แก้ไขรายละเอียดไม่สำเร็จ" };
    }
  }

  async function updatePurchaseOrderFields(fields: PurchaseOrderUpdateFields): Promise<Notice> {
    if (!selectedPoId || !selectedPo?.raw) return { ok: false, text: "ไม่พบใบสั่งซื้อที่เลือก" };
    try {
      await updatePurchaseOrder(selectedPoId, fields, selectedPo.raw);
      await refreshOrders();
      return { ok: true, text: "บันทึกรายละเอียดใบสั่งซื้อสำเร็จ" };
    } catch {
      return { ok: false, text: "บันทึกรายละเอียดใบสั่งซื้อไม่สำเร็จ" };
    }
  }

  // นำเข้าใบสั่งขายจากระบบคลังเดิม (Express/ftsgroupstore) มาเป็น PO ใหม่
  async function importFromLegacy(docId: string): Promise<Notice> {
    try {
      const newPoId = await importLegacyOrder(docId);
      await refreshOrders();
      setSelectedPoId(newPoId);
      return { ok: true, text: "นำเข้าใบสั่งขายสำเร็จ — กรุณาเลือกวัสดุให้แต่ละรายการก่อนส่งตัด" };
    } catch {
      return { ok: false, text: "นำเข้าใบสั่งขายไม่สำเร็จ" };
    }
  }

  async function removePurchaseOrder(poId: string): Promise<Notice> {
    try {
      await deletePurchaseOrder(poId);
      if (selectedPoId === poId) setSelectedPoId(null);
      await refreshOrders();
      return { ok: true, text: "ลบใบสั่งซื้อสำเร็จ" };
    } catch {
      return { ok: false, text: "ลบใบสั่งซื้อไม่สำเร็จ" };
    }
  }

  // ส่งงานไปหน้า /cutting ผ่าน query params — หน้า cutting โหลดข้อมูลของตัวเองจาก params
  function pushPlateFromPo(poId: string | null) {
    if (!poId) return;
    const params = new URLSearchParams({ type: "plate", po: poId });
    router.push(`/cutting?${params.toString()}`);
  }

  function pushRoundFromPo(poId: string | null) {
    if (!poId) return;
    const params = new URLSearchParams({ type: "roundbar", po: poId });
    router.push(`/cutting?${params.toString()}`);
  }

  function pushOrderDetailToCutting(orderDetailId: string) {
    if (!selectedPoId) return;
    const row = (orderDetails[selectedPoId] ?? []).find((item) => item.id === orderDetailId);
    if (!row) return;

    const params = new URLSearchParams({
      type: row.shape === "ROUND" ? "roundbar" : "plate",
      po: selectedPoId,
      detail: row.id,
    });
    router.push(`/cutting?${params.toString()}`);
  }

  const value: PurchaseOrdersContextValue = {
    dataStatus,
    headerSubtitle: MODULE_SUBTITLES.po,

    purchaseOrders,
    orderDetails,
    poSearch,
    setPoSearch,
    selectedPoId,
    selectPo,
    filteredPurchaseOrders,
    selectedPo,
    materialMasters,
    selectedOrderRows,
    selectedRoundRows,
    selectedPlateRows,

    addOrderDetail,
    cancelOrderDetail,
    updateOrderDetail: updateOrderDetailRow,
    updatePurchaseOrderFields,
    deletePurchaseOrder: removePurchaseOrder,
    importFromLegacy,

    pushOrderDetailToCutting,
    pushRoundFromPo,
    pushPlateFromPo,
  };

  return (
    <PurchaseOrdersContext.Provider value={value}>
      {children}
    </PurchaseOrdersContext.Provider>
  );
}

export function usePurchaseOrdersContext() {
  const context = useContext(PurchaseOrdersContext);
  if (!context) {
    throw new Error("usePurchaseOrders must be used inside PurchaseOrdersProvider");
  }
  return context;
}

function isLocalOrderDetailId(id: string): boolean {
  return id.startsWith("LOCAL-");
}

function isCuttableOrderDetail(row: OrderDetail): boolean {
  return row.status === "PENDING" || row.status === "IN_PROCESS";
}
