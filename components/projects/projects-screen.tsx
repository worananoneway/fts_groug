"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Pencil, Plus, RefreshCw, Search } from "lucide-react";

import { DivisionNav } from "../shell/division-nav";
import { FactoryAppShell } from "../shell/factory-app-shell";
import { AlertBanner } from "../ui/alert-banner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DataTable } from "../ui/data-table";
import { EmptyState } from "../ui/empty-state";
import { Field } from "../ui/field";
import { IconButton } from "../ui/icon-button";
import { Modal } from "../ui/modal";
import { Autocomplete } from "../ui/autocomplete";
import { TimedToast } from "../ui/timed-toast";
import { loadActiveEmployees } from "@/services/division/employees";
import { createProject, loadCustomerOptions, loadProjects, updateProject } from "@/services/division/projects";
import type {
  CustomerOption,
  DataStatus,
  DataTableColumn,
  EmployeeOption,
  Notice,
  Project,
  ProjectFields,
  ProjectStatusValue,
} from "@/types/division";

const STATUS_OPTIONS: ProjectStatusValue[] = ["Opened", "Waiting - PO", "Closed", "Completed", "Cancelled"];

const STATUS_LABELS: Record<string, string> = {
  Opened: "เปิดโครงการ",
  "Waiting - PO": "รอใบสั่งซื้อ",
  Closed: "ปิดโครงการ",
  Completed: "เสร็จสมบูรณ์",
  Cancelled: "ยกเลิก",
};

const STATUS_TONES: Record<string, "slate" | "blue" | "amber" | "emerald" | "red"> = {
  Opened: "emerald",
  "Waiting - PO": "amber",
  Closed: "slate",
  Completed: "blue",
  Cancelled: "red",
};

// regex เดียวกับ validate_email ฝั่ง backend — email เป็นฟิลด์บังคับของ API ทั้ง POST และ PUT
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)+$/;

function emptyForm(): ProjectFields {
  return {
    nameTh: "",
    nameEn: "",
    contactName: "",
    contactPhone: "",
    contactFax: "",
    contactEmail: "",
    customerId: "",
    managerId: "",
    budget: 0,
    closingDate: "",
    note: "",
    status: "Opened",
  };
}

function projectToForm(project: Project): ProjectFields {
  const status = STATUS_OPTIONS.includes(project.status as ProjectStatusValue)
    ? (project.status as ProjectStatusValue)
    : "Opened";
  return {
    nameTh: project.nameTh,
    nameEn: project.nameEn,
    contactName: project.contactName,
    contactPhone: project.contactPhone,
    contactFax: project.contactFax,
    contactEmail: project.contactEmail,
    customerId: project.customerId,
    managerId: project.managerId,
    budget: project.budget,
    closingDate: project.closingDate.slice(0, 10),
    note: project.note,
    status,
  };
}

// กติกาตรงกับ validation ของ backend (ความยาวชื่อ 5-100, email บังคับ, โทร/แฟกซ์ไม่เกิน 15 ตาม varchar(15))
function validateForm(form: ProjectFields): string | null {
  if (form.nameTh.trim().length < 5 || form.nameTh.trim().length > 100)
    return "ชื่อโครงการ (ไทย) ต้องยาว 5-100 ตัวอักษร";
  if (form.nameEn.trim().length < 5 || form.nameEn.trim().length > 100)
    return "ชื่อโครงการ (อังกฤษ) ต้องยาว 5-100 ตัวอักษร";
  if (!form.customerId) return "กรุณาเลือกลูกค้า";
  if (!form.managerId.trim()) return "กรุณาระบุรหัสพนักงานผู้จัดการโครงการ";
  if (!EMAIL_REGEX.test(form.contactEmail.trim())) return "กรุณาระบุอีเมลผู้ติดต่อให้ถูกต้อง";
  if (form.contactPhone.trim().length > 15) return "เบอร์โทรศัพท์ต้องไม่เกิน 15 ตัวอักษร";
  if (form.contactFax.trim().length > 15) return "แฟกซ์ต้องไม่เกิน 15 ตัวอักษร";
  if (!form.closingDate) return "กรุณาระบุวันที่ปิดโครงการ";
  if (form.budget < 0) return "งบประมาณต้องไม่ติดลบ";
  if (form.note.trim().length > 400) return "หมายเหตุต้องไม่เกิน 400 ตัวอักษร";
  return null;
}

function saveErrorText(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("409")) return "ชื่อโครงการนี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น";
  if (message.includes("422") || message.includes("400")) return "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแล้วลองใหม่";
  return "บันทึกโปรเจคไม่สำเร็จ กรุณาลองใหม่";
}

function formatBudget(value: number): string {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}

export function ProjectsScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>({ loading: true, error: null, source: "none" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFields>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    setDataStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [nextProjects, nextCustomers, nextEmployees] = await Promise.all([
        loadProjects(),
        loadCustomerOptions(),
        loadActiveEmployees(),
      ]);
      setProjects(nextProjects);
      setCustomers(nextCustomers);
      setEmployees(nextEmployees);
      setDataStatus({ loading: false, error: null, source: "api" });
    } catch (error) {
      console.error("[Projects] โหลดข้อมูลไม่สำเร็จ:", error);
      setDataStatus({ loading: false, error: "ไม่สามารถเชื่อมต่อ API ได้", source: "none" });
    }
  }, []);

  // โหลดครั้งแรกตอน mount — pattern เดียวกับ master-data-screen
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void load();
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchSearch =
        query === "" ||
        [project.displayId, project.nameTh, project.nameEn, project.customerName]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchStatus = statusFilter === "" || project.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(project: Project) {
    setEditingId(project.id);
    setForm(projectToForm(project));
    setFormOpen(true);
  }

  async function saveForm() {
    const validation = validateForm(form);
    if (validation) {
      setNotice({ ok: false, text: validation });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateProject(editingId, form);
      } else {
        await createProject(form);
      }
      await load();
      setNotice({ ok: true, text: editingId ? "แก้ไขโปรเจคสำเร็จ" : "สร้างโปรเจคสำเร็จ" });
      setFormOpen(false);
    } catch (error) {
      console.error("[Projects] บันทึกไม่สำเร็จ:", error);
      setNotice({ ok: false, text: saveErrorText(error) });
    } finally {
      setSaving(false);
    }
  }

  const columns: Array<DataTableColumn<Project>> = [
    {
      key: "display_id",
      header: "รหัสโครงการ",
      cell: (row) => <span className="font-mono text-xs text-slate-500">{row.displayId}</span>,
    },
    {
      key: "name",
      header: "ชื่อโครงการ",
      cell: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.nameTh || "—"}</p>
          <p className="text-xs text-slate-400">{row.nameEn || "—"}</p>
        </div>
      ),
    },
    { key: "customer", header: "ลูกค้า", cell: (row) => row.customerName || "—" },
    { key: "manager", header: "ผู้จัดการโครงการ", cell: (row) => row.managerName || "—" },
    { key: "budget", header: "งบประมาณ (บาท)", cell: (row) => <span className="font-mono">{formatBudget(row.budget)}</span> },
    { key: "closing", header: "กำหนดปิด", cell: (row) => formatDate(row.closingDate) },
    {
      key: "status",
      header: "สถานะ",
      cell: (row) => (
        <Badge tone={STATUS_TONES[row.status] ?? "slate"}>{STATUS_LABELS[row.status] ?? row.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <IconButton
          icon={<Pencil className="h-4 w-4" />}
          label="แก้ไขโปรเจค"
          onClick={(event) => {
            event.stopPropagation();
            openEdit(row);
          }}
          tone="primary"
        />
      ),
    },
  ];

  return (
    <FactoryAppShell
      dataStatus={dataStatus}
      moduleTabs={<DivisionNav active="projects" />}
      subtitle="โปรเจคของลูกค้าและใบสั่งซื้อภายใต้โปรเจค | Projects"
    >
      <TimedToast notice={notice} onClose={() => setNotice(null)} />
      <section className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-700">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
                โปรเจค
                <Badge tone="blue">{filteredProjects.length} รายการ</Badge>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-56 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                placeholder="ค้นหาชื่อโครงการ / ลูกค้า"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <Autocomplete
              className="w-44"
              options={STATUS_OPTIONS.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
              placeholder="สถานะทั้งหมด"
              value={statusFilter}
              onValueChange={setStatusFilter}
            />
            <Button
              icon={<RefreshCw className={dataStatus.loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />}
              size="sm"
              variant="secondary"
              disabled={dataStatus.loading}
              onClick={() => void load()}
            >
              รีเฟรช
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              สร้างโปรเจค
            </Button>
          </div>
        </div>

        {dataStatus.error ? (
          <div className="p-5">
            <AlertBanner tone="danger">
              {dataStatus.error} — ตรวจสอบว่า API server ทำงานอยู่ แล้วกดรีเฟรชอีกครั้ง
            </AlertBanner>
          </div>
        ) : dataStatus.loading && projects.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">กำลังโหลดข้อมูล...</p>
        ) : (
          <DataTable<Project>
            columns={columns}
            rows={filteredProjects}
            rowKey={(row) => row.id}
            onRowClick={(row) => router.push(`/projects/${row.id}`)}
            empty={
              <div className="p-5">
                <EmptyState>
                  {projects.length === 0
                    ? "ยังไม่มีโปรเจคในระบบ — กดปุ่ม “สร้างโปรเจค” เพื่อเริ่มต้น"
                    : "ไม่พบโปรเจคที่ตรงกับเงื่อนไขการค้นหา"}
                </EmptyState>
              </div>
            }
          />
        )}
      </section>

      <Modal
        open={formOpen}
        title={editingId ? "แก้ไขโปรเจค" : "สร้างโปรเจค"}
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button disabled={saving} onClick={() => setFormOpen(false)} variant="secondary">
              ยกเลิก
            </Button>
            <Button disabled={saving} onClick={() => void saveForm()}>
              {saving ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "สร้างโปรเจค"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="ชื่อโครงการ (ไทย)"
              inputClassName="font-sans"
              onChange={(event) => setForm((current) => ({ ...current, nameTh: event.target.value }))}
              value={form.nameTh}
            />
            <Field
              label="ชื่อโครงการ (อังกฤษ)"
              inputClassName="font-sans"
              onChange={(event) => setForm((current) => ({ ...current, nameEn: event.target.value }))}
              value={form.nameEn}
            />
            <Autocomplete
              label="ลูกค้า"
              options={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
              placeholder="เลือกลูกค้า"
              value={form.customerId}
              onValueChange={(value) => setForm((current) => ({ ...current, customerId: value }))}
            />
            <Autocomplete
              label="ผู้จัดการโครงการ"
              options={employees.map((employee) => ({ value: employee.id, label: employee.name }))}
              placeholder="เลือกพนักงาน"
              value={form.managerId}
              onValueChange={(value) => setForm((current) => ({ ...current, managerId: value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="ผู้ติดต่อ"
              inputClassName="font-sans"
              onChange={(event) => setForm((current) => ({ ...current, contactName: event.target.value }))}
              value={form.contactName}
            />
            <Field
              label="โทรศัพท์"
              maxLength={15}
              onChange={(event) => setForm((current) => ({ ...current, contactPhone: event.target.value }))}
              value={form.contactPhone}
            />
            <Field
              label="แฟกซ์"
              maxLength={15}
              onChange={(event) => setForm((current) => ({ ...current, contactFax: event.target.value }))}
              value={form.contactFax}
            />
          </div>
          <Field
            label="อีเมลผู้ติดต่อ"
            type="email"
            onChange={(event) => setForm((current) => ({ ...current, contactEmail: event.target.value }))}
            value={form.contactEmail}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="งบประมาณ (บาท)"
              min={0}
              step="0.01"
              type="number"
              onChange={(event) => setForm((current) => ({ ...current, budget: Number(event.target.value) || 0 }))}
              value={String(form.budget)}
            />
            <Field
              label="วันที่ปิดโครงการ"
              type="date"
              onChange={(event) => setForm((current) => ({ ...current, closingDate: event.target.value }))}
              value={form.closingDate}
            />
            <Autocomplete
              label="สถานะ"
              options={STATUS_OPTIONS.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
              value={form.status}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, status: value as ProjectStatusValue }))
              }
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">หมายเหตุ</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              maxLength={400}
              rows={3}
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            />
          </label>
        </div>
      </Modal>
    </FactoryAppShell>
  );
}
