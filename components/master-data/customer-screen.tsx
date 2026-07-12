"use client";

import {
  dash,
  formatDate,
  MasterDataScreen,
  StatusBadge,
  unwrapListReply,
} from "./master-data-screen";
import useCustomerApi from "@/hooks/master-data/customer";
import type { DataTableColumn } from "@/types/division";
import type { CustomerRow } from "@/types/master-data";

const customerApi = useCustomerApi();

async function fetchCustomers(): Promise<CustomerRow[]> {
  return unwrapListReply<CustomerRow>(await customerApi.get());
}

function branchLabel(row: CustomerRow): string {
  if (row.branch_type === "head_office") return "สำนักงานใหญ่";
  if (row.branch_type === "branch") return `สาขา ${dash(row.branch_number)}`;
  return dash(row.branch_type);
}

const columns: Array<DataTableColumn<CustomerRow>> = [
  {
    key: "display_id",
    header: "รหัสลูกค้า",
    cell: (row) => <span className="font-mono text-xs text-slate-500">{dash(row.display_id ?? row.id)}</span>,
  },
  {
    key: "name",
    header: "ชื่อลูกค้า",
    cell: (row) => (
      <div>
        <p className="font-semibold text-slate-800">{dash(row.name_th)}</p>
        <p className="text-xs text-slate-400">{dash(row.name_en)}</p>
      </div>
    ),
  },
  {
    key: "tax_id",
    header: "เลขผู้เสียภาษี",
    cell: (row) => <span className="font-mono text-xs">{dash(row.tax_id)}</span>,
  },
  {
    key: "contact",
    header: "ผู้ติดต่อ",
    cell: (row) => (
      <div>
        <p>{dash(row.contact?.name)}</p>
        <p className="font-mono text-xs text-slate-400">{dash(row.contact?.phone)}</p>
      </div>
    ),
  },
  {
    key: "province",
    header: "จังหวัด",
    cell: (row) => dash(row.address?.province?.name?.th),
  },
  {
    key: "branch",
    header: "สาขา",
    cell: (row) => branchLabel(row),
  },
  {
    key: "status",
    header: "สถานะ",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

export function CustomerScreen() {
  return (
    <MasterDataScreen<CustomerRow>
      navKey="customer"
      title="ลูกค้า"
      description="ข้อมูลหลักลูกค้า | Customers"
      columns={columns}
      fetchRows={fetchCustomers}
      rowKey={(row, index) => row.id ?? `customer-${index}`}
      searchText={(row) =>
        [row.display_id, row.name_th, row.name_en, row.tax_id, row.contact?.name, row.contact?.phone]
          .filter(Boolean)
          .join(" ")
      }
      searchPlaceholder="ค้นหาชื่อ / เลขภาษี / ผู้ติดต่อ"
      statusOf={(row) => row.status}
      statusOptions={["Active", "Inactive", "Deleted"]}
      detailTitle={(row) => `ลูกค้า: ${dash(row.name_th)}`}
      detailItems={(row) => [
        { label: "รหัสลูกค้า", value: dash(row.display_id ?? row.id) },
        { label: "สถานะ", value: <StatusBadge status={row.status} /> },
        { label: "ชื่อ (ไทย)", value: dash(row.name_th) },
        { label: "ชื่อ (อังกฤษ)", value: dash(row.name_en) },
        { label: "เลขผู้เสียภาษี", value: dash(row.tax_id) },
        { label: "ประเภทภาษี", value: dash(row.tax_type) },
        { label: "สาขา", value: branchLabel(row) },
        { label: "ผู้ติดต่อ", value: dash(row.contact?.name) },
        { label: "โทรศัพท์", value: dash(row.contact?.phone) },
        { label: "แฟกซ์", value: dash(row.contact?.fax) },
        { label: "อีเมล", value: dash(row.contact?.email) },
        {
          label: "ที่อยู่",
          value: [
            row.address?.detail,
            row.address?.subdistrict?.name?.th,
            row.address?.district?.name?.th,
            row.address?.province?.name?.th,
            row.address?.postcode,
          ]
            .filter(Boolean)
            .join(" ") || "—",
        },
        { label: "สร้างเมื่อ", value: formatDate(row.created_at) },
        { label: "แก้ไขล่าสุด", value: formatDate(row.updated_at) },
      ]}
    />
  );
}
