# บันทึกประกอบ `db/schema_local.sql`

สร้างจาก 4 แหล่ง: `data_structure/steel_factory_db_schema_ai.md`,
`data_structure/steel_factory_enum_summary.md`, `db/add_scrap_location.sql`
และคำสั่ง SQL ทุกที่ใน `api/modules/**` ที่ไม่ใช่ `legacy_*`
(โมดูล `legacy_sales_orders` / `legacy_steel_stock` วิ่งบน MySQL คนละฐานผ่าน
`api/utils/mysql_query.ts` — ข้ามทั้งหมด)

**สถานะการทดสอบ:** ไฟล์นี้ถูกรันจริงบน PostgreSQL 16 เปล่า ผ่านทั้ง
(1) `psql -f` แบบ statement ต่อ statement (2) ส่งทั้งไฟล์เป็น multi-statement
string เดียวแบบเดียวกับ `client.query(text)` ของ node-postgres
(3) รันซ้ำ 3 ครั้งไม่มี ERROR (เหลือแต่ NOTICE "already exists, skipping")
แล้ว seed ข้อมูลและรัน **ทุก INSERT / UPDATE / SELECT ของทุกโมดูล** ผ่านหมด

---

## 1. ตารางที่โค้ด backend ใช้ แต่เอกสาร YAML ไม่ได้ระบุ (เพิ่มเข้ามาแล้ว)

| ตาราง | ใครใช้ | หมายเหตุ |
|---|---|---|
| `provinces`, `districts`, `subdistricts` | `api/modules/address/service.ts` (SELECT ตรง), `customers`, `purchase_orders` (JOIN) | ชื่อคอลัมน์ถอดจาก SELECT list ตรง ๆ ครบทุกคอลัมน์ที่โค้ดอ้าง |
| `employees` | ถูก JOIN จาก customer / projects / purchase_orders / wastrel_* | ใส่เฉพาะคอลัมน์ที่มีคำสั่ง SQL อ้างถึงจริง 14 คอลัมน์ + created/updated |
| `customers` | `master_data/customer`, `projects`, `purchase_orders`, `orders_out` | เอกสารระบุแค่ `external_dependencies: customers.customer_id varchar(20)` ที่เหลือถอดจาก INSERT/UPDATE/SELECT ของ `master_data/customer/service.ts` |
| `orders` | `orders_out/service.ts` (SELECT + UPDATE), `stock_reservations/service.ts` (LEFT JOIN) | **ต้องเป็นตารางจริง ไม่ใช่ view** เพราะมี `UPDATE public.orders SET ord_status = ...` |
| `order_details` | `orders_out/service.ts` (SELECT + **INSERT** + UPDATE), `stock_reservations/service.ts` (LEFT JOIN) | **ต้องเป็นตารางจริง** เพราะมี `INSERT INTO public.order_details (...)` |

`orders` / `order_details` เป็นสคีมาคนละชุดกับ `purchase_orders` /
`purchase_orders_details` (prefix `ord_` / `odd_` ไม่ใช่ `po_` / `podetail_`)
ทั้งสองตารางใช้ PK ชื่อ `po_id` และ `podetail_id` ตามที่โค้ดอ้างถึง

## 2. คอลัมน์ที่โค้ด backend ใช้ แต่เอกสาร YAML ไม่ได้ระบุ (เพิ่มเข้ามาแล้ว)

| ตาราง.คอลัมน์ | ชนิดที่ใส่ | หลักฐานในโค้ด |
|---|---|---|
| `steel_round_bars.srb_emp_id` | `varchar(20)` FK → employees | `master_data/steel_round_bars/service.ts` INSERT / UPDATE / soft_delete |
| `ms_plates.msp_emp_id` | `varchar(20)` FK → employees | `master_data/ms_plates/service.ts` INSERT / UPDATE / SELECT ใน CTE |
| `wastrel_steel_round_bars.wsrb_emp_id` | `varchar(20)` FK → employees | `wastrel_steel_round_bars/service.ts` ทุกคำสั่ง |
| `wastrel_ms_plates.wmsp_emp_id` | `varchar(20)` FK → employees | `wastrel_ms_plates/service.ts` ทุกคำสั่ง |
| `timeline_wmsps.tlwmsp_emp_id` | `varchar(20)` FK → employees | `timeline_wmsps/service.ts` INSERT + SELECT (โมดูล timeline อื่นไม่มีคอลัมน์นี้) |
| `wastrel_steel_round_bars.wsrb_display_id` | `varchar(20)` + default | `wastrel_steel_round_bars/service.ts` SELECT `wsrb_display_id` |
| `wastrel_ms_plates.wmsp_display_id` | `varchar(20)` + default | `wastrel_ms_plates/service.ts` SELECT `wmsp_display_id` |
| `wastrel_*.{wsrb,wmsp}_location` | `text` | มีอยู่ในเอกสารแล้ว และตรงกับ `db/add_scrap_location.sql` — โค้ดยังมี `ensureLocationColumn()` คอย `ADD COLUMN IF NOT EXISTS` ให้ซ้ำอีกชั้น (ไม่มีผลเมื่อคอลัมน์มีอยู่แล้ว) |

## 3. จุดที่ต้องเดา / ตัดสินใจเอง

### 3.1 ค่า DEFAULT ของคอลัมน์สถานะ — เอกสารสองไฟล์ขัดกัน

`steel_factory_db_schema_ai.md` ระบุ default เป็นตัวพิมพ์ใหญ่ที่ไม่มีอยู่ใน ENUM
ตามที่ `steel_factory_enum_summary.md` ระบุ จึงเลือกตาม enum_summary
(ไฟล์ที่เป็นแหล่งข้อมูลของค่า ENUM โดยตรง) เพราะถ้าใช้ตามไฟล์แรกจะสร้างตารางไม่ผ่าน

| คอลัมน์ | schema_ai.md | enum_summary.md | **ที่ใช้ในไฟล์** |
|---|---|---|---|
| `srb_status`, `msp_status` | `'AVAILABLE'` | `Active` | `'Active'` |
| `wsrb_status`, `wmsp_status` | `'AVAILABLE'` | `Reserved` | `'Reserved'` |
| `sr_status` | `'RESERVED'` | `Reserved` | `'Reserved'` |
| `podetail_status` | `'PENDING'` | `Pending` | `'Pending'` |

### 3.2 `stock_status_enum` ทำเป็น superset

โค้ดเขียนค่าลงคอลัมน์สถานะสต็อกจาก enum ฝั่ง TypeScript **3 ชุดที่ไม่ตรงกัน**:

- `wastrel_*/type.ts` → `Active | Inactive | Deleted | Reserved | Used | AVAILABLE`
- `master_data/steel_round_bars/type.ts` → `AVAILABLE | RESERVED | USED | SCRAP` (ตัวพิมพ์ใหญ่ทั้งชุด, เขียนลง `srb_status` ผ่าน `update_status`)
- `master_data/ms_plates/controller.ts` → ใช้ enum `Status` ทั่วไปจาก `shared_types.ts` (`Added`, `Approved`, `Waiting`, ...) เขียนลง `msp_status`

`stock_status_enum` จึงถูกประกาศเป็น superset ของทั้งสามชุด (20 ค่า) เพื่อให้
dev local ไม่ล้มด้วย `invalid input value for enum`
**นี่คือความไม่สอดคล้องฝั่งแอป ไม่ใช่ของสคีมา** — ถ้าจะแก้ให้ถูกต้องควรทำให้
ทั้ง 3 โมดูลใช้ enum ชุดเดียวกัน แล้วค่อยตัด `stock_status_enum` ให้เหลือ 5 ค่าตาม enum_summary

### 3.3 ค่าที่เพิ่มใน ENUM อื่นเพราะ SQL เขียนลงไปจริง

- `reservation_status_enum` เพิ่ม `'Deleted'` — `stock_reservations/service.ts`
  มีทั้ง `SET sr_status = 'Deleted'` และ `WHERE sr_status != 'Deleted'`
  ถ้าไม่มีค่านี้ทั้ง soft delete และคำสั่ง get จะ error ทันที
- `purchase_order_enum` เพิ่ม `'Deleted'` — `purchase_orders/service.ts` soft_delete
  (ตรงกับ enum `POStatus` ใน `shared_types.ts` ที่มี `DELETED` อยู่แล้ว)
- `status_enum` (เอกสาร YAML อ้างถึงแต่ enum_summary ไม่ได้ระบุค่า) — ใช้ค่าจาก
  enum `Status` ใน `api/utils/shared_types.ts` ตรง ๆ 15 ค่า
- `location_type_enum` (เอกสารอ้างถึงแต่ไม่ระบุค่า) — ใช้ค่าจาก enum `LocationType`
  ใน `master_data/steel_round_bars/type.ts`: `WAREHOUSE, ZONE, RACK, SHELF, OTHER`
- `project_enum` (เอกสารอ้างถึงแต่ไม่ระบุค่า) — ใช้ค่าจาก enum `ProjectStatus`
  ใน `shared_types.ts`: `Opened, Waiting - PO, Closed, Completed, Cancelled`
- `order_status_enum` / `order_detail_status_enum` (**ไม่มีในเอกสารทั้งสองไฟล์**) —
  `orders_out/service.ts` cast ตรง ๆ (`$1::public."order_status_enum"`)
  ค่าที่ใส่เอามาจาก map `order_statuses` ใน `orders_out/controller.ts`
- `purchase_order_detail_status_enum` คงไว้ 7 ค่าตามเอกสาร —
  `purchase-order-detail/controller.ts` เทียบค่า `'Deleted'` และ `'Waiting'`
  กับ `podetail_status` แต่เทียบในฝั่ง JavaScript ไม่ใช่ใน SQL จึงไม่ทำให้ ENUM error

### 3.4 `wsrb_code` และ `wmsp_stock_code` ต้องมี DEFAULT

เอกสารระบุทั้งสองคอลัมน์เป็น `NOT NULL` และไม่มี default แต่ INSERT ของ
`wastrel_steel_round_bars/service.ts` และ `wastrel_ms_plates/service.ts`
**ไม่ส่งค่าคอลัมน์นี้มาเลย** ถ้าไม่ใส่ default การสร้างเศษเหล็กจะพังทุกครั้ง
จึงเพิ่มฟังก์ชัน `gen_wsrb_code()` / `gen_wmsp_stock_code()` (sequence-based,
รูปแบบ `WSRB-00000001` / `WMSP-00000001`) เป็น default โดยยังคง `NOT NULL` + `UNIQUE`
ตามเอกสารไว้ครบ — **รูปแบบรหัสเป็นการเดา** ถ้าฐานข้อมูลจริงมีรูปแบบอื่น
(หรือมี trigger สร้างรหัสให้) ให้แก้ที่ฟังก์ชันสองตัวนี้จุดเดียว

### 3.5 ฟังก์ชันสร้าง id

เอกสารอ้างถึง 3 ฟังก์ชันแต่ไม่ให้ตัวโค้ด จึง implement เองทั้งหมด:

- `generate_unique_id()` → `varchar(20)`: `upper(substr(md5(random() || clock_timestamp()),1,20))`
- `gen_project_display_id()` → `varchar(11)`: `PJ` + ปี 2 หลัก + running 6 หลัก (sequence)
- `gen_purchase_order_number()` → `varchar(20)`: `PO` + ปีเดือน 4 หลัก + running 5 หลัก (sequence)

และเพิ่มฟังก์ชันที่เอกสารไม่ได้อ้างแต่จำเป็นกับตารางที่ไม่ได้ documented:
`gen_customer_display_id()`, `gen_employee_display_id()`,
`gen_wsrb_display_id()`, `gen_wmsp_display_id()`, `gen_wsrb_code()`, `gen_wmsp_stock_code()`

**รูปแบบของทุก id เป็นการเดา** — เอกสารไม่ได้ระบุ format ไว้เลย
ถ้าต้องตรงกับฐานข้อมูลจริง ให้แก้เฉพาะ body ของฟังก์ชันเหล่านี้

### 3.6 ไม่ผูก FOREIGN KEY บน `orders` / `order_details`

`orders_out/router.ts` รับ `POST /:po_id/details` แล้วเขียน `odd_po_id = :po_id`
แต่ยังตีความไม่ได้ว่า `po_id` ตัวนั้นมาจาก `purchase_orders.po_id` หรือ
`orders.po_id` (ทั้งสองตารางมี PK ชื่อ `po_id`) ถ้าผูก FK ผิดตัวจะทำให้
INSERT พังทั้งเส้น จึงเว้น FK ไว้ทั้งสองตาราง ใส่แต่ index
เมื่อยืนยันความสัมพันธ์ได้แล้วค่อยเพิ่ม FK ทีหลัง

### 3.7 ชนิดข้อมูลที่เดาไว้ (เพราะไม่ได้ documented)

- `customers.customer_address` → `text` (ข้อความ error ใน `customer/type.ts` บอก
  "at most 268,435,455 characters" ซึ่งเป็นขนาดของ `text`)
- `customers.customer_contact_email` → `varchar(150)` (ตาม `CONTACT_EMAIL_MAX_LENGTH`)
- `provinces/districts/subdistricts.*_id` → `int4` (สอดคล้องกับ
  `po_delivery_province_id int4` ที่เอกสารระบุไว้)
- `employees.emp_*` ความยาว varchar เดาจากคอลัมน์ที่คล้ายกันในตารางที่ documented
- `orders.ord_no` → `varchar(20)` (เทียบกับ `po_number varchar(20)`)
- `orders.ord_total_items` → `int4` (controller ประกาศ TypeScript type เป็น `number`)

### 3.8 คอลัมน์ชื่อแปลกที่คงไว้ตามเอกสารเป๊ะ ๆ

- `purchase_orders.po_status_goods_received_` — มี underscore ต่อท้ายจริง
  (`purchase_orders/service.ts` ใช้ชื่อนี้ตรง ๆ ทั้ง INSERT/UPDATE/SELECT)
- `projects.project_customer_po` — `varchar` ไม่ระบุความยาว ตามเอกสาร
- `purchase_orders.po_tax_rate` — `float4` `NOT NULL` **และไม่มี default**
  ตามเอกสาร ดังนั้น INSERT ต้องส่งค่ามาเสมอ (โค้ดปัจจุบันส่งอยู่แล้ว)

## 4. สิ่งที่ตั้งใจไม่ใส่

- ตารางฝั่ง MySQL ของ `legacy_*` (`sthead`, `stcrd` ฯลฯ)
- ตาราง `departments` / `positions` — `purchase_orders/service.ts` SELECT ชื่อแผนก
  และตำแหน่งเป็น `NULL::text` ตรง ๆ ยังไม่มี JOIN ไปตารางใด
- ตาราง `users` / auth — ไม่มีคำสั่ง SQL ใดแตะถึง
  (`emp_authentication` ใน `api/utils/controller_auth.ts` เป็นชื่อฟังก์ชัน ไม่ใช่คอลัมน์)
- TRIGGER อัปเดต `*_updated_at` — เอกสารไม่ได้ระบุ trigger ไว้ และ backend
  ตั้ง `updated_at = NOW()` ในคำสั่ง UPDATE เองอยู่แล้ว
- `CHECK CONSTRAINT` จำกัดค่า ENUM รายคอลัมน์ (ที่ enum_summary เสนอไว้ท้ายไฟล์) —
  จะทำให้ค่าที่โค้ดปัจจุบันเขียนลงไปบางค่าถูกปฏิเสธ
- ข้อมูลตั้งต้น (จังหวัด/อำเภอ/ตำบล, พนักงาน, material_masters) —
  ไฟล์นี้เป็น DDL เพียว ๆ ไม่มี INSERT

## 5. สรุปตัวเลข

- ENUM types: **12**
- ตาราง: **21** (documented 14 + เพิ่มจากโค้ด 7)
- ฟังก์ชัน: **9** / SEQUENCE: **8**
- FOREIGN KEY: **58** (จากเอกสาร 34 + อนุมานจาก JOIN ในโค้ด 24)
- INDEX: **118** (รวม PK/UNIQUE ที่ Postgres สร้างให้อัตโนมัติ)
