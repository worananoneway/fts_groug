"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { RefreshCw, Search } from "lucide-react";

import { MasterDataNav } from "./master-data-nav";
import { DivisionNav } from "@/components/shell/division-nav";
import { FactoryAppShell } from "@/components/shell/factory-app-shell";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Autocomplete } from "@/components/ui/autocomplete";
import { MASTER_DATA_SUBTITLE, STATUS_TONES } from "@/constants/master-data";
import type { DataStatus, DataTableColumn } from "@/types/division";
import type { MasterDataNavKey } from "@/types/master-data";
import { LoadingGate, LoadingOverlay, SkeletonTable } from "@/components/loading";

export interface DetailItem {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}

interface MasterDataScreenProps<T> {
  navKey: MasterDataNavKey;
  title: string;
  description: string;
  columns: Array<DataTableColumn<T>>;
  fetchRows: () => Promise<T[]>;
  rowKey: (row: T, index: number) => string;
  searchText: (row: T) => string;
  searchPlaceholder?: string;
  statusOf?: (row: T) => string | null;
  statusOptions?: string[];
  detailTitle?: (row: T) => string;
  detailItems?: (row: T) => DetailItem[];
}

/**
 * แปลง error ตอนโหลดข้อมูลให้เป็นข้อความที่ผู้ใช้อ่านรู้เรื่อง
 * ถ้าเป็นข้อความที่เราตั้งเอง (เช่น คลังเดิมต่อไม่ได้) ให้แสดงตรง ๆ
 * ถ้าเป็น error ดิบจาก fetch ค่อยใช้ข้อความกลาง
 */
export function describeLoadError(error: unknown): string {
  const message = error instanceof Error ? error.message.trim() : "";
  const isRawError = message === "" || /^(Request failed|Failed to fetch|NetworkError|TypeError)/i.test(message);
  if (!isRawError) return message;
  return "ไม่สามารถเชื่อมต่อ API ได้ — ตรวจสอบว่า API server ทำงานอยู่ แล้วกดรีเฟรชอีกครั้ง";
}

export function unwrapListReply<T>(reply: unknown): T[] {
  const result = reply as { statuscode?: number; details?: unknown } | null;
  if (result?.statuscode === 200 && Array.isArray(result.details)) {
    return result.details as T[];
  }
  if (result?.statuscode === 404) {
    return [];
  }
  throw new Error(`Unexpected reply statuscode: ${result?.statuscode}`);
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-slate-300">—</span>;
  return <Badge tone={STATUS_TONES[status.toUpperCase()] ?? "slate"}>{status}</Badge>;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString("th-TH");
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export function dash(value: string | null | undefined): string {
  return value && value.trim() !== "" ? value : "—";
}

export function MasterDataScreen<T>({
  columns,
  description,
  detailItems,
  detailTitle,
  fetchRows,
  navKey,
  rowKey,
  searchPlaceholder,
  searchText,
  statusOf,
  statusOptions,
  title,
}: MasterDataScreenProps<T>) {
  const [rows, setRows] = useState<T[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>({ isLoading: true, error: null, source: "none" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState<T | null>(null);

  const load = useCallback(async () => {
    setDataStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const nextRows = await fetchRows();
      setRows(nextRows);
      setDataStatus({ isLoading: false, error: null, source: "api" });
    } catch (error) {
      console.error(`[MasterData] โหลดข้อมูล ${title} ไม่สำเร็จ:`, error);
      setRows([]);
      setDataStatus({ isLoading: false, error: describeLoadError(error), source: "none" });
    }
  }, [fetchRows, title]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchSearch = query === "" || searchText(row).toLowerCase().includes(query);
      const matchStatus =
        statusFilter === "" || (statusOf?.(row) ?? "").toUpperCase() === statusFilter.toUpperCase();
      return matchSearch && matchStatus;
    });
  }, [rows, search, searchText, statusFilter, statusOf]);

  return (
    <FactoryAppShell
      dataStatus={dataStatus}
      masterDataActive
      moduleTabs={<DivisionNav active="master-data" />}
      subTabs={<MasterDataNav active={navKey} />}
      subtitle={MASTER_DATA_SUBTITLE}
    >
      <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              {title}
              <Badge tone="blue">{formatNumber(filteredRows.length)} รายการ</Badge>
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder={searchPlaceholder ?? "ค้นหา..."}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {statusOptions && statusOptions.length > 0 ? (
              <Autocomplete
                className="w-44"
                options={statusOptions.map((status) => ({ value: status, label: status }))}
                placeholder="สถานะทั้งหมด"
                value={statusFilter}
                onValueChange={setStatusFilter}
              />
            ) : null}
            <Button
              icon={<RefreshCw className="h-4 w-4" />}
              isLoading={dataStatus.isLoading}
              loadingLabel="กำลังโหลด..."
              size="sm"
              variant="secondary"
              onClick={() => void load()}
            >
              รีเฟรช
            </Button>
          </div>
        </div>

        {dataStatus.error ? (
          <div className="p-5">
            <AlertBanner tone="danger">{dataStatus.error}</AlertBanner>
          </div>
        ) : (
          // ยังไม่มีข้อมูลเลย = โครงตาราง / มีข้อมูลแล้วกำลังรีเฟรช = ทับด้วย overlay
          <LoadingGate
            isLoading={dataStatus.isLoading && rows.length === 0}
            fallback={<SkeletonTable columns={columns.length} rows={8} />}
          >
            <div className="relative">
              <DataTable<T>
                columns={columns}
                rows={filteredRows}
                rowKey={rowKey}
                onRowClick={detailItems ? (row) => setSelectedRow(row) : undefined}
                empty={
                  <div className="p-5">
                    <EmptyState>
                      {rows.length === 0 ? "ยังไม่มีข้อมูลในระบบ" : "ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา"}
                    </EmptyState>
                  </div>
                }
              />
              <LoadingOverlay isLoading={dataStatus.isLoading && rows.length > 0} label="กำลังรีเฟรช..." />
            </div>
          </LoadingGate>
        )}
      </section>

      {detailItems ? (
        <Modal
          open={selectedRow !== null}
          onClose={() => setSelectedRow(null)}
          title={selectedRow && detailTitle ? detailTitle(selectedRow) : "รายละเอียด"}
          wide={selectedRow ? detailItems(selectedRow).some((item) => item.fullWidth) : false}
        >
          {selectedRow ? (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {detailItems(selectedRow).map((item) => (
                <div
                  key={item.label}
                  className={`border-b border-slate-100 pb-2 ${item.fullWidth ? "sm:col-span-2" : ""}`}
                >
                  <dt className="text-xs text-slate-400">{item.label}</dt>
                  <dd className="mt-1 text-sm text-slate-700">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </Modal>
      ) : null}
    </FactoryAppShell>
  );
}
