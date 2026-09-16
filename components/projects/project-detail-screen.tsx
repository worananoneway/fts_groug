"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { useNavigate } from "@/hooks/use-navigate";
import { ArrowLeft, ClipboardList, FolderKanban, Pencil, Plus, Trash2 } from "lucide-react";

import { newOrderDetailDraft, OrderDetailFields, validateDetail } from "../purchase-orders/order-detail-fields";
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
import { loadDistricts, loadProvinces, loadSubdistricts } from "@/services/division/address";
import { loadActiveEmployees } from "@/services/division/employees";
import {
  createOrderDetail,
  createProjectOrder,
  loadOrders,
  loadProjectOrders,
  nestedId,
  updateProjectOrder,
} from "@/services/division/purchase-orders";
import { loadCustomerOptions, loadProject } from "@/services/division/projects";
import { statusLabel } from "@/utils/format";
import type {
  AddressOption,
  CustomerOption,
  DataStatus,
  DataTableColumn,
  EmployeeOption,
  MaterialMaster,
  Notice,
  OrderDetail,
  Project,
  PurchaseOrder,
  PurchaseOrderCreateFields,
  PurchaseOrderStatus,
} from "@/types/division";
import { LoadingGate, LoadingOverlay, SkeletonTable } from "@/components/loading";

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
  if (status === "CANCELLED") return "red";
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
    comment: "",
    qtOn: "",
    shipVia: "",
    shippingTerms: "",
    conditionPaid: 30,
    recipientId: "",
    approvedByEmpId: "",
    purchasingFname: "",
    purchasingLname: "",
    deliveryProvinceId: "",
    deliveryDistrictId: "",
    deliverySubdistrictId: "",
  };
}

function toDateInputValue(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 10) : "";
}

function stringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numberOrZero(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

// PO ที่โหลดมาแสดงในตารางมีแค่ฟิลด์สรุป (shipVia, qtOn, ...) — ฟิลด์ที่เหลือต้องดึงจาก raw
// (แถวดิบจาก GET) ซึ่งเก็บไว้ตอน map แล้วเท่านั้น
function orderToFields(order: PurchaseOrder): PurchaseOrderCreateFields {
  const raw = order.raw ?? {};
  return {
    customerId: order.customerId ?? "",
    issueDate: toDateInputValue(raw.issue_date),
    dueDate: toDateInputValue(raw.due_date),
    taxRate: order.taxRate ?? 0,
    remark: stringOrEmpty(raw.remark),
    comment: order.comment ?? "",
    qtOn: order.qtOn ?? "",
    shipVia: order.shipVia ?? "",
    shippingTerms: order.shippingTerms ?? "",
    conditionPaid: numberOrZero(raw.condition_paid),
    recipientId: nestedId(raw, "recipient", "id") ?? "",
    approvedByEmpId: nestedId(raw, "approved_by", "id") ?? "",
    purchasingFname: stringOrEmpty(raw.purchasing_fname),
    purchasingLname: stringOrEmpty(raw.purchasing_lname),
    deliveryProvinceId: nestedId(raw, "delivery_address", "province", "id") ?? "",
    deliveryDistrictId: nestedId(raw, "delivery_address", "district", "id") ?? "",
    deliverySubdistrictId: nestedId(raw, "delivery_address", "subdistrict", "id") ?? "",
  };
}

export function ProjectDetailScreen({ projectId }: { projectId: string }) {
  const router = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [materials, setMaterials] = useState<MaterialMaster[]>([]);
  const [provinces, setProvinces] = useState<AddressOption[]>([]);
  const [districts, setDistricts] = useState<AddressOption[]>([]);
  const [subdistricts, setSubdistricts] = useState<AddressOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [dataStatus, setDataStatus] = useState<DataStatus>({ isLoading: true, error: null, source: "none" });
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PurchaseOrderCreateFields>(emptyPoForm(""));
  const [items, setItems] = useState<OrderDetail[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [editForm, setEditForm] = useState<PurchaseOrderCreateFields>(emptyPoForm(""));
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async () => {
    setDataStatus((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [
        nextProject,
        nextOrders,
        nextCustomers,
        allOrders,
        nextProvinces,
        nextDistricts,
        nextSubdistricts,
        nextEmployees,
      ] = await Promise.all([
        loadProject(projectId),
        loadProjectOrders(projectId),
        loadCustomerOptions(),
        // material_masters ยังไม่มี endpoint แยก — รวบรวมจากรายการตัดที่มีอยู่ในระบบผ่าน loadOrders
        loadOrders(),
        loadProvinces(),
        loadDistricts(),
        loadSubdistricts(),
        loadActiveEmployees(),
      ]);
      setProject(nextProject);
      setOrders(nextOrders);
      setCustomers(nextCustomers);
      setMaterials(allOrders.materialMasters);
      setProvinces(nextProvinces);
      setDistricts(nextDistricts);
      setSubdistricts(nextSubdistricts);
      setEmployees(nextEmployees);
      setDataStatus({ isLoading: false, error: nextProject ? null : "ไม่พบโปรเจคนี้", source: "api" });
    } catch (error) {
      console.error("[ProjectDetail] โหลดข้อมูลไม่สำเร็จ:", error);
      setDataStatus({ isLoading: false, error: "ไม่สามารถเชื่อมต่อ API ได้", source: "none" });
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
    setItems([newOrderDetailDraft()]);
    setFormOpen(true);
  }

  function updateItem(id: string, next: OrderDetail) {
    setItems((current) => current.map((item) => (item.id === id ? next : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
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
    // ตรวจรายการเหล็กก่อน (ถ้ามี) — เพื่อไม่ให้สร้าง PO ค้างไว้แล้วบันทึกรายการไม่ผ่าน
    for (const [index, item] of items.entries()) {
      const invalid = validateDetail(item);
      if (invalid) {
        setNotice({ ok: false, text: `รายการเหล็กที่ ${index + 1}: ${invalid}` });
        return;
      }
    }
    setIsSaving(true);
    try {
      const newPoId = await createProjectOrder(projectId, form);
      // สร้างรายการเหล็กตามลำดับ ให้ผูกกับ PO ที่เพิ่งสร้าง
      for (const item of items) {
        await createOrderDetail(newPoId, {
          ...item,
          qty: Math.max(1, Math.floor(item.qty || 1)),
          remaining: Math.max(0, Math.floor(item.remaining || item.qty || 1)),
        });
      }
      await load();
      setNotice({
        ok: true,
        text: items.length > 0 ? `สร้างใบสั่งซื้อและ ${items.length} รายการเหล็กสำเร็จ` : "สร้างใบสั่งซื้อสำเร็จ",
      });
      setFormOpen(false);
    } catch (error) {
      console.error("[ProjectDetail] สร้าง PO ไม่สำเร็จ:", error);
      setNotice({ ok: false, text: "สร้างใบสั่งซื้อไม่สำเร็จ กรุณาลองใหม่" });
    } finally {
      setIsSaving(false);
    }
  }

  function openEdit(order: PurchaseOrder) {
    setEditingOrder(order);
    setEditForm(orderToFields(order));
  }

  async function saveEdit() {
    if (!editingOrder) return;
    if (!editForm.customerId) {
      setNotice({ ok: false, text: "กรุณาเลือกลูกค้า" });
      return;
    }
    setIsEditSaving(true);
    try {
      await updateProjectOrder(editingOrder.id, editForm, projectId);
      await load();
      setNotice({ ok: true, text: "แก้ไขใบสั่งซื้อสำเร็จ" });
      setEditingOrder(null);
    } catch (error) {
      console.error("[ProjectDetail] แก้ไข PO ไม่สำเร็จ:", error);
      setNotice({ ok: false, text: "แก้ไขใบสั่งซื้อไม่สำเร็จ กรุณาลองใหม่" });
    } finally {
      setIsEditSaving(false);
    }
  }

  const districtOptions = useMemo(
    () => districts.filter((district) => district.parentId === form.deliveryProvinceId),
    [districts, form.deliveryProvinceId],
  );
  const subdistrictOptions = useMemo(
    () => subdistricts.filter((subdistrict) => subdistrict.parentId === form.deliveryDistrictId),
    [subdistricts, form.deliveryDistrictId],
  );
  const editDistrictOptions = useMemo(
    () => districts.filter((district) => district.parentId === editForm.deliveryProvinceId),
    [districts, editForm.deliveryProvinceId],
  );
  const editSubdistrictOptions = useMemo(
    () => subdistricts.filter((subdistrict) => subdistrict.parentId === editForm.deliveryDistrictId),
    [subdistricts, editForm.deliveryDistrictId],
  );

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
      {
        key: "actions",
        header: "",
        cell: (row) => (
          <IconButton
            icon={<Pencil className="h-4 w-4" />}
            label={`แก้ไข ${row.no}`}
            onClick={(event) => {
              event.stopPropagation();
              openEdit(row);
            }}
            tone="primary"
          />
        ),
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

            <LoadingGate
              isLoading={dataStatus.isLoading && orders.length === 0}
              fallback={<SkeletonTable columns={columns.length} rows={5} />}
            >
              <div className="relative">
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
                <LoadingOverlay isLoading={dataStatus.isLoading && orders.length > 0} label="กำลังรีเฟรช..." />
              </div>
            </LoadingGate>
          </section>
        </div>
      )}

      <Modal
        open={formOpen}
        title="สร้างใบสั่งซื้อ PO"
        onClose={() => {
          if (!isSaving) setFormOpen(false);
        }}
        fullscreen
        footer={
          <div className="flex justify-end gap-3">
            <Button disabled={isSaving} onClick={() => setFormOpen(false)} variant="secondary">
              ยกเลิก
            </Button>
            <Button isLoading={isSaving} loadingLabel="กำลังบันทึก..." onClick={() => void saveForm()}>
              สร้างใบสั่งซื้อ
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            ใบสั่งซื้อจะถูกผูกกับโปรเจค {project?.nameTh || project?.displayId} โดยอัตโนมัติ — เลขที่ PO
            ระบบจะออกให้เอง
          </p>

          <PurchaseOrderFieldsSections
            customers={customers}
            districtOptions={districtOptions}
            employees={employees}
            form={form}
            provinces={provinces}
            setForm={setForm}
            subdistrictOptions={subdistrictOptions}
          />

          <FormSection
            title="รายการเหล็กที่ลูกค้าสั่ง"
            helper="ระบุวัสดุและขนาดที่ลูกค้าต้องการ (ไม่บังคับ เพิ่มภายหลังได้)"
            action={
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setItems((current) => [...current, newOrderDetailDraft()])}
                size="sm"
                variant="secondary"
              >
                เพิ่มรายการ
              </Button>
            }
          >
            {items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-xs text-slate-400">
                ยังไม่มีรายการเหล็ก — กด “เพิ่มรายการ” เพื่อระบุ หรือปล่อยว่างแล้วสร้าง PO เปล่าก่อนก็ได้
              </p>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">รายการที่ {index + 1}</span>
                      <IconButton
                        icon={<Trash2 className="h-4 w-4" />}
                        label={`ลบรายการที่ ${index + 1}`}
                        onClick={() => removeItem(item.id)}
                        tone="danger"
                      />
                    </div>
                    <OrderDetailFields
                      detail={item}
                      materials={materials}
                      onChange={(next) => updateItem(item.id, next)}
                    />
                  </div>
                ))}
              </div>
            )}
          </FormSection>
        </div>
      </Modal>

      <Modal
        open={Boolean(editingOrder)}
        title={editingOrder ? `แก้ไขใบสั่งซื้อ ${editingOrder.no}` : "แก้ไขใบสั่งซื้อ"}
        onClose={() => {
          if (!isEditSaving) setEditingOrder(null);
        }}
        fullscreen
        footer={
          <div className="flex justify-end gap-3">
            <Button disabled={isEditSaving} onClick={() => setEditingOrder(null)} variant="secondary">
              ยกเลิก
            </Button>
            <Button isLoading={isEditSaving} loadingLabel="กำลังบันทึก..." onClick={() => void saveEdit()}>
              บันทึกการแก้ไข
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <PurchaseOrderFieldsSections
            customers={customers}
            districtOptions={editDistrictOptions}
            employees={employees}
            form={editForm}
            provinces={provinces}
            setForm={setEditForm}
            subdistrictOptions={editSubdistrictOptions}
          />
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

function FormSection({
  action,
  children,
  helper,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  helper?: string;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-700">{title}</h3>
          {helper ? <p className="mt-0.5 text-xs text-slate-400">{helper}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ฟิลด์หลักของ PO (ไม่รวมรายการเหล็ก) ใช้ร่วมกันทั้งฟอร์มสร้างและฟอร์มแก้ไข
function PurchaseOrderFieldsSections({
  customers,
  districtOptions,
  employees,
  form,
  provinces,
  setForm,
  subdistrictOptions,
}: {
  customers: CustomerOption[];
  districtOptions: AddressOption[];
  employees: EmployeeOption[];
  form: PurchaseOrderCreateFields;
  provinces: AddressOption[];
  setForm: Dispatch<SetStateAction<PurchaseOrderCreateFields>>;
  subdistrictOptions: AddressOption[];
}) {
  return (
    <>
      <FormSection title="ข้อมูลใบสั่งซื้อ">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Autocomplete
            label="ลูกค้า"
            options={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
            placeholder="เลือกลูกค้า"
            value={form.customerId}
            onValueChange={(value) => setForm((current) => ({ ...current, customerId: value }))}
          />
          <Field
            label="เลขประจำตัวผู้เสียภาษี"
            value={form.qtOn}
            onChange={(event) => setForm((current) => ({ ...current, qtOn: event.target.value }))}
          />
          <Field
            label="อัตราภาษี %"
            min={0}
            step="0.01"
            type="number"
            value={String(form.taxRate)}
            onChange={(event) => setForm((current) => ({ ...current, taxRate: Number(event.target.value) || 0 }))}
          />
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
          <Field
            label="เงื่อนไขการชำระเงิน (วัน)"
            min={0}
            step={1}
            type="number"
            value={String(form.conditionPaid)}
            onChange={(event) =>
              setForm((current) => ({ ...current, conditionPaid: Number(event.target.value) || 0 }))
            }
          />
        </div>
      </FormSection>

      <FormSection title="การขนส่ง">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="ช่องทางขนส่ง"
            value={form.shipVia}
            onChange={(event) => setForm((current) => ({ ...current, shipVia: event.target.value }))}
          />
          <Field
            label="เงื่อนไขการส่ง"
            value={form.shippingTerms}
            onChange={(event) => setForm((current) => ({ ...current, shippingTerms: event.target.value }))}
          />
        </div>
      </FormSection>

      <FormSection title="ผู้เกี่ยวข้อง">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Autocomplete
            label="ผู้รับ"
            options={employees.map((employee) => ({ value: employee.id, label: employee.name }))}
            placeholder="เลือกพนักงาน"
            value={form.recipientId}
            onValueChange={(value) => setForm((current) => ({ ...current, recipientId: value }))}
          />
          <Autocomplete
            label="ผู้อนุมัติ"
            options={employees.map((employee) => ({ value: employee.id, label: employee.name }))}
            placeholder="เลือกพนักงาน"
            value={form.approvedByEmpId}
            onValueChange={(value) => setForm((current) => ({ ...current, approvedByEmpId: value }))}
          />
          <Field
            label="ผู้จัดซื้อ (ชื่อ)"
            value={form.purchasingFname}
            onChange={(event) => setForm((current) => ({ ...current, purchasingFname: event.target.value }))}
          />
          <Field
            label="ผู้จัดซื้อ (นามสกุล)"
            value={form.purchasingLname}
            onChange={(event) => setForm((current) => ({ ...current, purchasingLname: event.target.value }))}
          />
        </div>
      </FormSection>

      <FormSection title="ที่อยู่จัดส่ง">
        <div className="grid gap-4 sm:grid-cols-3">
          <Autocomplete
            label="จังหวัด"
            options={provinces.map((province) => ({ value: province.id, label: province.name }))}
            placeholder="เลือกจังหวัด"
            value={form.deliveryProvinceId}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                deliveryProvinceId: value,
                deliveryDistrictId: "",
                deliverySubdistrictId: "",
              }))
            }
          />
          <Autocomplete
            label="อำเภอ/เขต"
            options={districtOptions.map((district) => ({ value: district.id, label: district.name }))}
            placeholder={form.deliveryProvinceId ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"}
            value={form.deliveryDistrictId}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                deliveryDistrictId: value,
                deliverySubdistrictId: "",
              }))
            }
          />
          <Autocomplete
            label="ตำบล/แขวง"
            options={subdistrictOptions.map((subdistrict) => ({ value: subdistrict.id, label: subdistrict.name }))}
            placeholder={form.deliveryDistrictId ? "เลือกตำบล/แขวง" : "เลือกอำเภอ/เขตก่อน"}
            value={form.deliverySubdistrictId}
            onValueChange={(value) => setForm((current) => ({ ...current, deliverySubdistrictId: value }))}
          />
        </div>
      </FormSection>

      <FormSection title="หมายเหตุ">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">หมายเหตุใบสั่งซื้อ (remark)</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              rows={2}
              value={form.remark}
              onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-600">ข้อความถึงลูกค้า (comment)</span>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              rows={2}
              value={form.comment}
              onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
            />
          </label>
        </div>
      </FormSection>
    </>
  );
}
