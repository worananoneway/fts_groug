"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { MasterDataNav } from "./master-data-nav";
import { StatusBadge, formatDate, dash } from "./master-data-screen";
import { DivisionNav } from "@/components/shell/division-nav";
import { FactoryAppShell } from "@/components/shell/factory-app-shell";
import { LoadingGate, LoadingOverlay, SkeletonTable } from "@/components/loading";
import { AlertBanner } from "@/components/ui/alert-banner";
import { Autocomplete } from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { TimedToast } from "@/components/ui/timed-toast";
import { MASTER_DATA_SUBTITLE } from "@/constants/master-data";
import {
  LOCATION_TYPES,
  createLocation,
  deleteLocation,
  loadLocationRows,
  locationTypeLabel,
  updateLocation,
  type LocationFields,
  type LocationRow,
} from "@/services/master-data/locations";
import type { DataStatus, DataTableColumn, Notice } from "@/types/division";

function emptyForm(): LocationFields {
  return { code: "", name: "", type: "ZONE", parentId: "", detail: "" };
}

/** หน้าจัดการ "ที่จัดเก็บ" — ข้อมูลหลักของตาราง locations ในฐานข้อมูล */
export function LocationsScreen() {
  const [rows, setRows] = useState<LocationRow[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>({ isLoading: true, error: null, source: "none" });
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LocationFields>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocationRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    setDataStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      setRows(await loadLocationRows());
      setDataStatus({ isLoading: false, error: null, source: "api" });
    } catch (error) {
      console.error("[Locations] โหลดที่จัดเก็บไม่สำเร็จ:", error);
      setRows([]);
      setDataStatus({ isLoading: false, error: "ไม่สามารถเชื่อมต่อ API ได้", source: "none" });
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") return rows;
    return rows.filter((row) =>
      [row.code, row.name, row.type, row.parent?.name, row.detail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [rows, search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(row: LocationRow) {
    setEditingId(row.id);
    setForm({
      code: row.code,
      name: row.name,
      type: row.type || "ZONE",
      parentId: row.parent?.id ?? "",
      detail: row.detail ?? "",
    });
    setFormOpen(true);
  }

  async function saveForm() {
    if (form.code.trim() === "" || form.name.trim() === "") {
      setNotice({ ok: false, text: "กรอกรหัสและชื่อที่จัดเก็บให้ครบก่อน" });
      return;
    }
    setIsSaving(true);
    try {
      if (editingId) {
        await updateLocation(editingId, form);
      } else {
        await createLocation(form);
      }
      setFormOpen(false);
      setNotice({ ok: true, text: editingId ? "บันทึกการแก้ไขแล้ว" : "เพิ่มที่จัดเก็บแล้ว" });
      await load();
    } catch (error) {
      console.error("[Locations] บันทึกไม่สำเร็จ:", error);
      setNotice({ ok: false, text: "บันทึกไม่สำเร็จ — รหัสอาจซ้ำกับที่มีอยู่แล้ว" });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteLocation(deleteTarget.id);
      setDeleteTarget(null);
      setNotice({ ok: true, text: "ลบที่จัดเก็บแล้ว" });
      await load();
    } catch (error) {
      console.error("[Locations] ลบไม่สำเร็จ:", error);
      setNotice({ ok: false, text: "ลบไม่สำเร็จ — อาจมีสต็อกอ้างอิงที่จัดเก็บนี้อยู่" });
    } finally {
      setIsDeleting(false);
    }
  }

  const columns: Array<DataTableColumn<LocationRow>> = [
    {
      key: "code",
      header: "รหัส",
      cell: (row) => <span className="font-mono text-xs font-semibold text-slate-700">{row.code}</span>,
    },
    {
      key: "name",
      header: "ชื่อที่จัดเก็บ",
      cell: (row) => <span className="font-semibold text-slate-800">{row.name}</span>,
    },
    {
      key: "type",
      header: "ประเภท",
      cell: (row) => <Badge tone="blue">{locationTypeLabel(row.type)}</Badge>,
    },
    {
      key: "parent",
      header: "อยู่ภายใต้",
      cell: (row) => dash(row.parent?.name),
    },
    {
      key: "detail",
      header: "รายละเอียด",
      cell: (row) => dash(row.detail),
    },
    {
      key: "status",
      header: "สถานะ",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "updated_at",
      header: "แก้ไขล่าสุด",
      cell: (row) => formatDate(row.updated_at ?? row.created_at),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Pencil className="h-4 w-4" />}
            label="แก้ไข"
            tone="primary"
            onClick={() => openEdit(row)}
          />
          <IconButton
            icon={<Trash2 className="h-4 w-4" />}
            label="ลบ"
            tone="danger"
            onClick={() => setDeleteTarget(row)}
          />
        </div>
      ),
    },
  ];

  // เลือกที่จัดเก็บแม่ได้ทุกแถว ยกเว้นตัวเอง (กันผูกวนกลับ)
  const parentOptions = rows
    .filter((row) => row.id !== editingId)
    .map((row) => ({ value: row.id, label: `${row.name} (${row.code})` }));

  return (
    <FactoryAppShell
      dataStatus={dataStatus}
      masterDataActive
      moduleTabs={<DivisionNav active="master-data" />}
      subTabs={<MasterDataNav active="locations" />}
      subtitle={MASTER_DATA_SUBTITLE}
    >
      <TimedToast notice={notice} onClose={() => setNotice(null)} />

      <section className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                ที่จัดเก็บ
                <Badge tone="blue">{filteredRows.length} รายการ</Badge>
              </h2>
              <p className="mt-0.5 text-sm text-slate-400">
                คลัง / โซน / ชั้นวาง ที่ใช้ระบุตำแหน่งจัดเก็บของเหล็กและเศษเหล็ก
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="ค้นหารหัส / ชื่อ / ประเภท"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
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
            <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              เพิ่มที่จัดเก็บ
            </Button>
          </div>
        </div>

        {dataStatus.error ? (
          <div className="p-5">
            <AlertBanner tone="danger">
              {dataStatus.error} — ตรวจสอบว่า API server ทำงานอยู่ แล้วกดรีเฟรชอีกครั้ง
            </AlertBanner>
          </div>
        ) : (
          <LoadingGate
            isLoading={dataStatus.isLoading && rows.length === 0}
            fallback={<SkeletonTable columns={6} rows={6} />}
          >
            <div className="relative">
              <DataTable<LocationRow>
                columns={columns}
                rows={filteredRows}
                rowKey={(row) => row.id}
                empty={
                  <div className="p-5">
                    <EmptyState>
                      {rows.length === 0
                        ? "ยังไม่มีที่จัดเก็บในระบบ — กดปุ่ม “เพิ่มที่จัดเก็บ” เพื่อเริ่มต้น"
                        : "ไม่พบที่จัดเก็บที่ตรงกับคำค้นหา"}
                    </EmptyState>
                  </div>
                }
              />
              <LoadingOverlay isLoading={dataStatus.isLoading && rows.length > 0} label="กำลังรีเฟรช..." />
            </div>
          </LoadingGate>
        )}
      </section>

      <Modal
        open={formOpen}
        title={editingId ? "แก้ไขที่จัดเก็บ" : "เพิ่มที่จัดเก็บ"}
        onClose={() => {
          if (!isSaving) setFormOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button disabled={isSaving} onClick={() => setFormOpen(false)} variant="secondary">
              ยกเลิก
            </Button>
            <Button isLoading={isSaving} loadingLabel="กำลังบันทึก..." onClick={() => void saveForm()}>
              {editingId ? "บันทึกการแก้ไข" : "เพิ่มที่จัดเก็บ"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="รหัสที่จัดเก็บ *"
            placeholder="เช่น ZONE-D"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
          />
          <Field
            label="ชื่อที่จัดเก็บ *"
            inputClassName="font-sans"
            placeholder="เช่น โซน D"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">ประเภท *</span>
            <Autocomplete
              options={LOCATION_TYPES.map((type) => ({
                value: type,
                label: `${locationTypeLabel(type)} (${type})`,
              }))}
              placeholder="เลือกประเภท"
              value={form.type}
              onValueChange={(value) => setForm((current) => ({ ...current, type: value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">อยู่ภายใต้ (ไม่บังคับ)</span>
            <Autocomplete
              emptyMessage="ไม่มีที่จัดเก็บอื่น"
              options={parentOptions}
              placeholder="— ไม่อยู่ใต้ที่ใด —"
              value={form.parentId}
              onValueChange={(value) => setForm((current) => ({ ...current, parentId: value }))}
            />
          </label>
          <Field
            className="sm:col-span-2"
            inputClassName="font-sans"
            label="รายละเอียด"
            placeholder="เช่น ชั้นวางแผ่นหนา ด้านซ้ายของประตู 2"
            value={form.detail}
            onChange={(event) => setForm((current) => ({ ...current, detail: event.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="ยืนยันการลบที่จัดเก็บ"
        isLoading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      >
        ต้องการลบ “{deleteTarget?.name}” ({deleteTarget?.code}) จริงหรือไม่? ระบบจะเปลี่ยนสถานะเป็น Deleted
        และซ่อนออกจากรายการ
      </ConfirmDialog>
    </FactoryAppShell>
  );
}
