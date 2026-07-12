"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardList, FolderKanban, Plus } from "lucide-react";

import { DivisionNav } from "../shell/division-nav";
import { FactoryAppShell } from "../shell/factory-app-shell";
import { AlertBanner } from "../ui/alert-banner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DataTable } from "../ui/data-table";
import { EmptyState } from "../ui/empty-state";
import { Field } from "../ui/field";
import { Modal } from "../ui/modal";
import { Select } from "../ui/select";
import { TimedToast } from "../ui/timed-toast";
import { createProjectOrder, loadProjectOrders } from "@/services/division/purchase-orders";
import { loadCustomerOptions, loadProject } from "@/services/division/projects";
import { statusLabel } from "@/utils/format";
import type {
  CustomerOption,
  DataStatus,
  DataTableColumn,
  Notice,
  Project,
  PurchaseOrder,
  PurchaseOrderCreateFields,
  PurchaseOrderStatus,
} from "@/types/division";

const PROJECT_STATUS_LABELS: Record<string, string> = {
  Opened: "เปิดโครงการ",
  "Waiting - PO": "รอใบสั่งซื้อ",
  Closed: "ปิดโครงการ",
  Completed: "เสร็จสมบูรณ์",
  Cancelled: "ยกเลิก",
};

const PROJECT_STATUS_TONES: Record<string, "slate" | "blue" | "amber" | "emerald" | "red"> = {
  Opened: "emerald",
  "Waiting - PO": "amber",
  Closed: "slate",
  Completed: "blue",
  Cancelled: "red",
};

function poStatusTone(status: PurchaseOrderStatus) {
  if (status === "IN_PROGRESS") return "blue";
  if (status === "DONE") return "emerald";
  return "amber";
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyPoForm(customerId: string): PurchaseOrderCreateFields {
  return {
    customerId,
    issueDate: todayInputValue(),
    dueDate: "",
    taxRate: 7,
    remark: "",
  };
}

export function ProjectDetailScreen({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>({ loading: true, error: null, source: "none" });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PurchaseOrderCreateFields>(emptyPoForm(""));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    setDataStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [nextProject, nextOrders, nextCustomers] = await Promise.all([
        loadProject(projectId),
        loadProjectOrders(projectId),
        loadCustomerOptions(),
      ]);
      setProject(nextProject);
      setOrders(nextOrders);
      setCustomers(nextCustomers);
      setDataStatus({ loading: false, error: nextProject ? null : "ไม่พบโปรเจคนี้", source: "api" });
    } catch (error) {
      console.error("[ProjectDetail] โหลดข้อมูลไม่สำเร็จ:", error);
      setDataStatus({ loading: false, error: "ไม่สามารถเชื่อมต่อ API ได้", source: "none" });
    }
  }, [projectId]);

  // โหลดตอน mount — pattern เดียวกับหน้าอื่นในโปรเจค
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function openCreate() {
    setForm(emptyPoForm(project?.customerId ?? ""));
    setFormOpen(true);
  }

  async function saveForm() {
    if (!form.customerId) {
      setNotice({ ok: false, text: "กรุณาเลือกลูกค้า" });
      return;
    }
    if (!form.issueDate) {
      setNotice({ ok: false, text: "กรุณาระบุวันที่ออกใบสั่งซื้อ" });
      return;
    }
    setSaving(true);
    try {
      await createProjectOrder(projectId, form);
      await load();
      setNotice({ ok: true, text: "สร้างใบสั่งซื้อสำเร็จ" });
      setFormOpen(false);
    } catch (error) {
      console.error("[ProjectDetail] สร้าง PO ไม่สำเร็จ:", error);
      setNotice({ ok: false, text: "สร้างใบสั่งซื้อไม่สำเร็จ กรุณาลองใหม่" });
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<Array<DataTableColumn<PurchaseOrder>>>(
    () => [
      {
        key: "no",
        header: "เลขที่ใบสั่งซื้อ",
        cell: (row) => <span className="font-mono text-sm font-semibold text-slate-800">{row.no}</span>,
      },
      { key: "customer", header: "ลูกค้า", cell: (row) => row.customer },
      { key: "date", header: "วันที่ออก", cell: (row) => row.date },
      { key: "due", header: "กำหนดส่ง", cell: (row) => row.due },
      {
        key: "status",
        header: "สถานะ",
        cell: (row) => <Badge tone={poStatusTone(row.status)}>{statusLabel(row.status)}</Badge>,
      },
    ],
    [],
  );

  return (
    <FactoryAppShell
      dataStatus={dataStatus}
      moduleTabs={<DivisionNav active="projects" />}
      subtitle="รายละเอียดโปรเจคและใบสั่งซื้อ | Project Detail"
    >
      <TimedToast notice={notice} onClose={() => setNotice(null)} />

      <button
        type="button"
        onClick={() => router.push("/projects")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าโปรเจคทั้งหมด
      </button>

      {dataStatus.error && !project ? (
        <AlertBanner tone="danger">{dataStatus.error}</AlertBanner>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                  <FolderKanban className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-800">{project?.nameTh || "—"}</h1>
                    {project ? (
                      <Badge tone={PROJECT_STATUS_TONES[project.status] ?? "slate"}>
                        {PROJECT_STATUS_LABELS[project.status] ?? project.status}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-500">{project?.nameEn || "—"}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">{project?.displayId}</p>
                </div>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-4">
              <InfoItem label="ลูกค้า" value={project?.customerName} />
              <InfoItem label="ผู้จัดการโครงการ" value={project?.managerName} />
              <InfoItem label="งบประมาณ (บาท)" value={project ? project.budget.toLocaleString("th-TH") : ""} />
              <InfoItem label="ผู้ติดต่อ" value={project?.contactName} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                    ใบสั่งซื้อ PO
                    <Badge tone="blue">{orders.length} รายการ</Badge>
                  </h2>
                  <p className="text-sm text-slate-400">ใบสั่งซื้อทั้งหมดภายใต้โปรเจคนี้</p>
                </div>
              </div>
              <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                สร้างใบสั่งซื้อ
              </Button>
            </div>

            {dataStatus.loading && orders.length === 0 ? (
              <p className="p-10 text-center text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
            ) : (
              <DataTable<PurchaseOrder>
                columns={columns}
                rows={orders}
                rowKey={(row) => row.id}
                onRowClick={(row) => router.push(`/po?po=${row.id}`)}
                empty={
                  <div className="p-5">
                    <EmptyState>ยังไม่มีใบสั่งซื้อในโปรเจคนี้ — กดปุ่ม “สร้างใบสั่งซื้อ” เพื่อเริ่มต้น</EmptyState>
                  </div>
                }
              />
            )}
          </section>
        </div>
      )}

      <Modal
        open={formOpen}
        title="สร้างใบสั่งซื้อ PO"
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button disabled={saving} onClick={() => setFormOpen(false)} variant="secondary">
              ยกเลิก
            </Button>
            <Button disabled={saving} onClick={() => void saveForm()}>
              {saving ? "กำลังบันทึก..." : "สร้างใบสั่งซื้อ"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            ใบสั่งซื้อจะถูกผูกกับโปรเจค {project?.nameTh || project?.displayId} โดยอัตโนมัติ — เลขที่ PO
            ระบบจะออกให้เอง
          </p>
          <Select
            label="ลูกค้า"
            options={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
            placeholder="เลือกลูกค้า"
            value={form.customerId}
            onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="วันที่ออกใบสั่งซื้อ"
              type="date"
              value={form.issueDate}
              onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))}
            />
            <Field
              label="กำหนดส่ง"
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
            />
          </div>
          <Field
            label="อัตราภาษี %"
            min={0}
            step="0.01"
            type="number"
            value={String(form.taxRate)}
            onChange={(event) => setForm((current) => ({ ...current, taxRate: Number(event.target.value) || 0 }))}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">หมายเหตุ</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              rows={2}
              value={form.remark}
              onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))}
            />
          </label>
        </div>
      </Modal>
    </FactoryAppShell>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-700">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
