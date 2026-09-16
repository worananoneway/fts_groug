-- ============================================================================
--  db/schema_local.sql — สคีมาฐานข้อมูลของระบบ (schema `public`) สำหรับสร้างใหม่ทั้งชุด
--
--  ไฟล์นี้คืออะไร
--    DDL ชุดเดียวที่สร้าง ENUM / ฟังก์ชัน / ตาราง / FOREIGN KEY / INDEX ทั้งหมด
--    ที่ backend (api/modules/**) ใช้งานจริง บน PostgreSQL 14 ขึ้นไป
--    ประกอบขึ้นจาก
--      1) data_structure/steel_factory_db_schema_ai.md   (โครงตารางหลัก)
--      2) data_structure/steel_factory_enum_summary.md   (ค่าใน ENUM)
--      3) db/add_scrap_location.sql                      (รวมผลลัพธ์เข้ามาแล้ว)
--      4) คำสั่ง SQL ทุกที่ใน api/modules/** ที่ไม่ใช่ legacy_* (MySQL คนละฐาน — ข้าม)
--
--  วิธีรัน (idempotent — รันซ้ำได้ ไม่พัง)
--    psql:            psql -d <database> -f db/schema_local.sql
--    node-postgres:   await client.query(fs.readFileSync('db/schema_local.sql','utf8'))
--                     (ทั้งไฟล์เป็น multi-statement string เดียว ไม่มี meta-command ของ psql
--                      ไม่มี CREATE DATABASE และไม่เปิด/ปิด transaction เอง)
--
--  หมายเหตุ: ต้องสร้าง database เปล่าไว้ก่อน แล้วจึงรันไฟล์นี้ใส่ schema `public`
-- ============================================================================

-- ============================================================================
--  1) ฟังก์ชันและ SEQUENCE ที่ใช้เป็น DEFAULT ของคอลัมน์
-- ============================================================================

-- id หลักของทุกตาราง (varchar(20)) — เอกสารระบุ default ว่า generate_unique_id()
CREATE OR REPLACE FUNCTION public.generate_unique_id() RETURNS varchar(20)
    LANGUAGE sql VOLATILE AS
'SELECT upper(substr(md5(random()::text || clock_timestamp()::text), 1, 20))::varchar(20)';

-- project_display_id (varchar(11)) — เอกสารระบุ default ว่า gen_project_display_id()
CREATE SEQUENCE IF NOT EXISTS public.project_display_id_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_project_display_id() RETURNS varchar(11)
    LANGUAGE sql VOLATILE AS
'SELECT (''PJ'' || to_char(CURRENT_DATE, ''YY'') || lpad(nextval(''public.project_display_id_seq'')::text, 6, ''0''))::varchar(11)';

-- po_number (varchar(20)) — เอกสารระบุ default ว่า gen_purchase_order_number()
CREATE SEQUENCE IF NOT EXISTS public.purchase_order_number_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_purchase_order_number() RETURNS varchar(20)
    LANGUAGE sql VOLATILE AS
'SELECT (''PO'' || to_char(CURRENT_DATE, ''YYMM'') || lpad(nextval(''public.purchase_order_number_seq'')::text, 5, ''0''))::varchar(20)';

-- ---- ฟังก์ชันเพิ่มเติม (ไม่อยู่ในเอกสาร แต่จำเป็นให้ INSERT ของ backend ผ่าน) ----

CREATE SEQUENCE IF NOT EXISTS public.customer_display_id_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_customer_display_id() RETURNS varchar(20)
    LANGUAGE sql VOLATILE AS
'SELECT (''CUS'' || lpad(nextval(''public.customer_display_id_seq'')::text, 6, ''0''))::varchar(20)';

CREATE SEQUENCE IF NOT EXISTS public.employee_display_id_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_employee_display_id() RETURNS varchar(20)
    LANGUAGE sql VOLATILE AS
'SELECT (''EMP'' || lpad(nextval(''public.employee_display_id_seq'')::text, 6, ''0''))::varchar(20)';

-- wastrel_steel_round_bars: backend INSERT ไม่ส่ง wsrb_code / wsrb_display_id มาด้วย
CREATE SEQUENCE IF NOT EXISTS public.wsrb_code_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_wsrb_code() RETURNS varchar(50)
    LANGUAGE sql VOLATILE AS
'SELECT (''WSRB-'' || lpad(nextval(''public.wsrb_code_seq'')::text, 8, ''0''))::varchar(50)';

CREATE SEQUENCE IF NOT EXISTS public.wsrb_display_id_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_wsrb_display_id() RETURNS varchar(20)
    LANGUAGE sql VOLATILE AS
'SELECT (''WSRB'' || lpad(nextval(''public.wsrb_display_id_seq'')::text, 6, ''0''))::varchar(20)';

-- wastrel_ms_plates: backend INSERT ไม่ส่ง wmsp_stock_code / wmsp_display_id มาด้วย
CREATE SEQUENCE IF NOT EXISTS public.wmsp_stock_code_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_wmsp_stock_code() RETURNS varchar(50)
    LANGUAGE sql VOLATILE AS
'SELECT (''WMSP-'' || lpad(nextval(''public.wmsp_stock_code_seq'')::text, 8, ''0''))::varchar(50)';

CREATE SEQUENCE IF NOT EXISTS public.wmsp_display_id_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_wmsp_display_id() RETURNS varchar(20)
    LANGUAGE sql VOLATILE AS
'SELECT (''WMSP'' || lpad(nextval(''public.wmsp_display_id_seq'')::text, 6, ''0''))::varchar(20)';

-- ============================================================================
--  2) ENUM TYPES  (ห่อด้วย DO ... EXCEPTION duplicate_object เพื่อให้รันซ้ำได้)
-- ============================================================================

-- ใช้กับ mm_status, loc_status, customer_status, emp_status
-- ค่าตรงกับ enum `Status` ใน api/utils/shared_types.ts
DO $enum$ BEGIN
    CREATE TYPE public."status_enum" AS ENUM (
        'Active', 'Added', 'Approved', 'Authorized', 'Completed', 'Deleted', 'Edited',
        'Inactive', 'Pending', 'Rejected', 'Revised', 'Unauthorized', 'Verified',
        'Waiting', 'Reserved'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

DO $enum$ BEGIN
    CREATE TYPE public."shape_type_enum" AS ENUM ('Round_bar', 'Ms_plate');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

-- 5 ค่าแรก = ชุดกลางจาก enum_summary
-- ที่เหลือเป็นค่าที่โค้ดฝั่ง backend ยังเขียนลงคอลัมน์สถานะสต็อกได้จริง
-- (api/modules/master_data/steel_round_bars/type.ts -> StockStatus แบบตัวพิมพ์ใหญ่,
--  api/modules/master_data/ms_plates/controller.ts -> ใช้ enum `Status` ทั่วไป)
-- เก็บเป็น superset เพื่อให้ dev local ไม่ล้มด้วย invalid input value for enum
DO $enum$ BEGIN
    CREATE TYPE public."stock_status_enum" AS ENUM (
        'Active', 'Inactive', 'Deleted', 'Reserved', 'Used',
        'Added', 'Approved', 'Authorized', 'Completed', 'Edited', 'Pending',
        'Rejected', 'Revised', 'Unauthorized', 'Verified', 'Waiting',
        'AVAILABLE', 'RESERVED', 'USED', 'SCRAP'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

-- ค่าตรงกับ enum `LocationType` ใน api/modules/master_data/steel_round_bars/type.ts
DO $enum$ BEGIN
    CREATE TYPE public."location_type_enum" AS ENUM ('WAREHOUSE', 'ZONE', 'RACK', 'SHELF', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

-- ค่าตรงกับ enum `ProjectStatus` ใน api/utils/shared_types.ts
DO $enum$ BEGIN
    CREATE TYPE public."project_enum" AS ENUM ('Opened', 'Waiting - PO', 'Closed', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

-- enum_summary + 'Deleted' (purchase_orders/service.ts soft_delete เขียนค่านี้ลง po_status)
DO $enum$ BEGIN
    CREATE TYPE public."purchase_order_enum" AS ENUM (
        'Paid', 'Waiting Delivery', 'Goods Received', 'Wait Payment', 'Post Sent',
        'Cancelled', 'Deleted'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

DO $enum$ BEGIN
    CREATE TYPE public."purchase_order_detail_status_enum" AS ENUM (
        'Draft', 'Revised', 'Pending', 'In Process', 'Completed', 'Rejected', 'Cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

DO $enum$ BEGIN
    CREATE TYPE public."reservation_stock_type_enum" AS ENUM (
        'Round_bar', 'Wastrel_round_bar', 'Ms_plate', 'Wastrel_ms_plate'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

-- enum_summary + 'Deleted' (stock_reservations/service.ts soft_delete และ WHERE sr_status != 'Deleted')
DO $enum$ BEGIN
    CREATE TYPE public."reservation_status_enum" AS ENUM ('Reserved', 'Used', 'Active', 'Inactive', 'Deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

DO $enum$ BEGIN
    CREATE TYPE public."timeline_event_type_enum" AS ENUM ('Add', 'Edit', 'Used');
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

-- สอง ENUM ต่อไปนี้ไม่อยู่ในเอกสารเลย แต่ api/modules/orders_out/service.ts cast ตรง ๆ
-- ($1::public."order_status_enum" และ 'Pending'::public."order_detail_status_enum")
-- ค่าเอามาจาก map `order_statuses` ใน api/modules/orders_out/controller.ts
DO $enum$ BEGIN
    CREATE TYPE public."order_status_enum" AS ENUM (
        'Draft', 'Revised', 'Pending', 'In Process', 'Completed', 'Rejected', 'Cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

DO $enum$ BEGIN
    CREATE TYPE public."order_detail_status_enum" AS ENUM (
        'Draft', 'Revised', 'Pending', 'In Process', 'Completed', 'Rejected', 'Cancelled'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $enum$;

-- ============================================================================
--  3) ตารางที่อยู่ (ไม่อยู่ในเอกสาร — api/modules/address/service.ts ใช้ตรง ๆ)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.provinces (
    province_id             int4        NOT NULL,
    province_name_th        varchar(100) NOT NULL,
    province_name_en        varchar(100),
    province_geography_id   int4,
    CONSTRAINT provinces_pkey PRIMARY KEY (province_id)
);

CREATE TABLE IF NOT EXISTS public.districts (
    district_id             int4        NOT NULL,
    district_name_th        varchar(100) NOT NULL,
    district_name_en        varchar(100),
    district_province_id    int4,
    CONSTRAINT districts_pkey PRIMARY KEY (district_id)
);

CREATE TABLE IF NOT EXISTS public.subdistricts (
    subdistrict_id          int4        NOT NULL,
    subdistrict_name_th     varchar(100) NOT NULL,
    subdistrict_name_en     varchar(100),
    subdistrict_district_id int4,
    subdistrict_zip_code    varchar(10),
    CONSTRAINT subdistricts_pkey PRIMARY KEY (subdistrict_id)
);

-- ============================================================================
--  4) พนักงาน (ไม่อยู่ในเอกสาร — ถูก JOIN จากหลายโมดูล)
--     คอลัมน์ที่ใส่ = คอลัมน์ที่คำสั่ง SQL ใน backend อ้างถึงจริง
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.employees (
    emp_id              varchar(20)  DEFAULT public.generate_unique_id() NOT NULL,
    emp_display_id      varchar(20)  DEFAULT public.gen_employee_display_id(),
    emp_prefix          varchar(20),
    emp_firstname_th    varchar(100),
    emp_lastname_th     varchar(100),
    emp_firstname_en    varchar(100),
    emp_lastname_en     varchar(100),
    emp_email           varchar(100),
    emp_phone           varchar(20),
    emp_number_id       varchar(20),
    emp_department_id   varchar(20),
    emp_position_id     varchar(20),
    emp_photo_file      varchar(400),
    emp_status          public."status_enum" DEFAULT 'Active'::public."status_enum" NOT NULL,
    emp_created_at      timestamptz  DEFAULT CURRENT_TIMESTAMP NOT NULL,
    emp_updated_at      timestamptz,
    CONSTRAINT employees_pkey PRIMARY KEY (emp_id)
);

-- ============================================================================
--  5) ลูกค้า (เอกสารระบุเป็น external_dependencies: customers.customer_id varchar(20))
--     คอลัมน์ที่ใส่ = คอลัมน์ที่ master_data/customer, projects, purchase_orders ใช้
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.customers (
    customer_id                 varchar(20)  DEFAULT public.generate_unique_id() NOT NULL,
    customer_display_id         varchar(20)  DEFAULT public.gen_customer_display_id(),
    customer_name_th            varchar(200),
    customer_name_en            varchar(200),
    customer_tax_id             varchar(20),
    customer_tax_type           varchar(30),
    customer_contact_name       varchar(100),
    customer_contact_phone      varchar(20),
    customer_contact_fax        varchar(20),
    customer_contact_email      varchar(150),
    customer_address            text,
    customer_subdistrict_id     int4,
    customer_district_id        int4,
    customer_province_id        int4,
    customer_postcode           varchar(10),
    customer_branch_type        varchar(20),
    customer_branch_number      varchar(20),
    customer_pp20_file          varchar(400),
    customer_certificate_file   varchar(400),
    customer_emp_id             varchar(20),
    customer_status             public."status_enum" DEFAULT 'Active'::public."status_enum" NOT NULL,
    customer_created_at         timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    customer_updated_at         timestamptz,
    CONSTRAINT customers_pkey PRIMARY KEY (customer_id)
);

-- ============================================================================
--  6) ตารางหลักของโมดูลโรงงานเหล็ก (ตามเอกสาร steel_factory_db_schema_ai.md)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.material_masters (
    mm_id           varchar(20)  DEFAULT public.generate_unique_id() NOT NULL,
    mm_code         varchar(50)  NOT NULL,
    mm_name         varchar(100) NOT NULL,
    mm_shape_type   public."shape_type_enum" NOT NULL,
    mm_grade        varchar(50),
    mm_status       public."status_enum" DEFAULT 'Active'::public."status_enum" NOT NULL,
    mm_created_at   timestamptz  DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mm_updated_at   timestamptz,
    CONSTRAINT material_masters_pkey PRIMARY KEY (mm_id),
    CONSTRAINT material_masters_mm_code_key UNIQUE (mm_code)
);

CREATE TABLE IF NOT EXISTS public.locations (
    loc_id          varchar(20)  DEFAULT public.generate_unique_id() NOT NULL,
    loc_code        varchar(50)  NOT NULL,
    loc_name        varchar(100) NOT NULL,
    loc_type        public."location_type_enum" NOT NULL,
    loc_parent_id   varchar(20),
    loc_detail      text,
    loc_status      public."status_enum" DEFAULT 'Active'::public."status_enum" NOT NULL,
    loc_created_at  timestamptz  DEFAULT CURRENT_TIMESTAMP NOT NULL,
    loc_updated_at  timestamptz,
    CONSTRAINT locations_pkey PRIMARY KEY (loc_id),
    CONSTRAINT locations_loc_code_key UNIQUE (loc_code)
);

CREATE TABLE IF NOT EXISTS public.projects (
    project_id              varchar(20)  DEFAULT public.generate_unique_id() NOT NULL,
    project_display_id      varchar(11)  DEFAULT public.gen_project_display_id() NOT NULL,
    project_name_th         varchar(100),
    project_name_en         varchar(100) NOT NULL,
    project_contact_email   varchar(100),
    project_contact_fax     varchar(15),
    project_contact_name    varchar(100),
    project_contact_phone   varchar(15),
    project_customer_id     varchar(20),
    project_budget          numeric(15, 2),
    project_closing_date    date,
    project_note            varchar(400),
    project_manager_id      varchar(20),
    project_status          public."project_enum" DEFAULT 'Opened'::public."project_enum" NOT NULL,
    project_emp_id          varchar(20),
    project_created_at      timestamptz  DEFAULT CURRENT_TIMESTAMP NOT NULL,
    project_updated_at      timestamptz  DEFAULT CURRENT_TIMESTAMP NOT NULL,
    project_customer_po     varchar,
    CONSTRAINT projects_pkey PRIMARY KEY (project_id)
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    po_cus_id                   varchar(20) NOT NULL,
    po_due_date                 date,
    po_remark                   text,
    po_id                       varchar(20) DEFAULT public.generate_unique_id() NOT NULL,
    po_number                   varchar(20) DEFAULT public.gen_purchase_order_number() NOT NULL,
    po_issue_date               date,
    po_ship_via                 varchar(150),
    po_qt_on                    varchar(50),
    po_shipping_terms           varchar(100),
    po_tax_rate                 float4      NOT NULL,
    po_recipient_id             varchar(20),
    po_comment                  varchar(300),
    po_status_sent_date         date,
    po_status_goods_received_   date,
    po_status_paid_date         date,
    po_status_note              varchar(200),
    po_emp_id                   varchar(20),
    po_created_at               timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    po_updated_at               timestamptz DEFAULT CURRENT_TIMESTAMP,
    po_status                   public."purchase_order_enum" DEFAULT 'Post Sent'::public."purchase_order_enum" NOT NULL,
    po_project_id               varchar(20),
    po_condition_paid           int4,
    po_delivery_province_id     int4,
    po_delivery_district_id     int4,
    po_delivery_subdistrict_id  int4,
    po_approved_by_emp_id       varchar(20),
    po_purchasing_fname         varchar(80),
    po_purchasing_lname         varchar(80),
    CONSTRAINT purchase_orders_pkey PRIMARY KEY (po_id)
);

CREATE TABLE IF NOT EXISTS public.purchase_orders_details (
    podetail_mm_id                  varchar(20)    NOT NULL,
    podetail_required_length_mm     numeric(12, 3) NOT NULL,
    podetail_required_width_mm      numeric(12, 3),
    podetail_required_thickness_mm  numeric(12, 3),
    podetail_required_diameter_mm   numeric(12, 3),
    podetail_cut_quantity           int4           DEFAULT 0 NOT NULL,
    podetail_remaining_quantity     int4           DEFAULT 0 NOT NULL,
    podetail_allow_wastrel          bool           DEFAULT true NOT NULL,
    podetail_allow_rotation         bool           DEFAULT false NOT NULL,
    podetail_status                 public."purchase_order_detail_status_enum"
                                        DEFAULT 'Pending'::public."purchase_order_detail_status_enum" NOT NULL,
    podetail_remark                 text,
    podetail_id                     varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    podetail_on                     int4,
    podetail_unit                   varchar(80),
    podetail_description            varchar(1000),
    podetail_qty                    int4,
    podetail_discount               numeric(15, 2),
    podetail_unit_price             numeric(15, 2),
    podetail_emp_id                 varchar(20)    NOT NULL,
    podetail_created_at             timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    podetail_updated_at             timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    podetail_po_id                  varchar(20)    NOT NULL,
    CONSTRAINT purchase_orders_details_pkey PRIMARY KEY (podetail_id)
);

CREATE TABLE IF NOT EXISTS public.stock_reservations (
    sr_id                   varchar(20) DEFAULT public.generate_unique_id() NOT NULL,
    sr_po_id                varchar(20) NOT NULL,
    sr_podetail_id          varchar(20) NOT NULL,
    sr_stock_type           public."reservation_stock_type_enum" NOT NULL,
    -- polymorphic reference (ไม่มี FK จริง) ชี้ไป srb_id / wsrb_id / msp_id / wmsp_id
    -- ตาม sr_stock_type
    sr_stock_id             varchar(20) NOT NULL,
    sr_reserved_quantity    int4        DEFAULT 1 NOT NULL,
    sr_reserved_length_mm   numeric(12, 3),
    sr_reserved_width_mm    numeric(12, 3),
    sr_status               public."reservation_status_enum"
                                DEFAULT 'Reserved'::public."reservation_status_enum" NOT NULL,
    sr_reserved_at          timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sr_used_at              timestamptz,
    sr_created_at           timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sr_updated_at           timestamptz,
    CONSTRAINT stock_reservations_pkey PRIMARY KEY (sr_id)
);

CREATE TABLE IF NOT EXISTS public.steel_round_bars (
    srb_id                  varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    srb_mm_id               varchar(20)    NOT NULL,
    srb_code                varchar(50)    NOT NULL,
    srb_diameter            numeric(12, 3) NOT NULL,
    srb_length              numeric(12, 3) NOT NULL,
    srb_quantity            int4           DEFAULT 1 NOT NULL,
    srb_available_quantity  int4           DEFAULT 1 NOT NULL,
    srb_loc_id              varchar(20),
    srb_location_type       public."location_type_enum",
    srb_location            text,
    srb_status              public."stock_status_enum"
                                DEFAULT 'Active'::public."stock_status_enum" NOT NULL,
    srb_received_date       date,
    srb_remark              text,
    -- ไม่อยู่ในเอกสาร: master_data/steel_round_bars/service.ts เขียน/อ่านคอลัมน์นี้
    srb_emp_id              varchar(20),
    srb_created_at          timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    srb_updated_at          timestamptz,
    CONSTRAINT steel_round_bars_pkey PRIMARY KEY (srb_id),
    CONSTRAINT steel_round_bars_srb_code_key UNIQUE (srb_code)
);

CREATE TABLE IF NOT EXISTS public.ms_plates (
    msp_id                  varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    msp_mm_id               varchar(20)    NOT NULL,
    msp_code                varchar(50)    NOT NULL,
    msp_length              numeric(12, 3) NOT NULL,
    msp_width               numeric(12, 3) NOT NULL,
    msp_thickness           numeric(12, 3) NOT NULL,
    msp_quantity            int4           DEFAULT 1 NOT NULL,
    msp_available_quantity  int4           DEFAULT 1 NOT NULL,
    msp_loc_id              varchar(20),
    msp_location_type       public."location_type_enum",
    msp_location            text,
    msp_status              public."stock_status_enum"
                                DEFAULT 'Active'::public."stock_status_enum" NOT NULL,
    msp_received_date       date,
    msp_remark              text,
    -- ไม่อยู่ในเอกสาร: master_data/ms_plates/service.ts เขียน/อ่านคอลัมน์นี้
    msp_emp_id              varchar(20),
    msp_created_at          timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    msp_updated_at          timestamptz,
    CONSTRAINT ms_plates_pkey PRIMARY KEY (msp_id),
    CONSTRAINT ms_plates_msp_code_key UNIQUE (msp_code)
);

CREATE TABLE IF NOT EXISTS public.wastrel_steel_round_bars (
    wsrb_id                     varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    wsrb_mm_id                  varchar(20)    NOT NULL,
    wsrb_srb_id                 varchar(20),
    -- เอกสารระบุ NOT NULL ไม่มี default แต่ INSERT ของ backend ไม่ส่งค่ามา
    -- จึงใส่ default ให้ (ดู db/schema_local_notes.md)
    wsrb_code                   varchar(50)    DEFAULT public.gen_wsrb_code() NOT NULL,
    -- ไม่อยู่ในเอกสาร: wastrel_steel_round_bars/service.ts SELECT คอลัมน์นี้
    wsrb_display_id             varchar(20)    DEFAULT public.gen_wsrb_display_id(),
    wsrb_diameter               numeric(12, 3) NOT NULL,
    wsrb_length                 numeric(12, 3) NOT NULL,
    wsrb_quantity               int4           DEFAULT 1 NOT NULL,
    wsrb_available_quantity     int4           DEFAULT 1 NOT NULL,
    wsrb_loc_id                 varchar(20),
    wsrb_location_type          public."location_type_enum",
    -- มาจาก db/add_scrap_location.sql (พื้นที่จัดเก็บเศษ)
    wsrb_location               text,
    wsrb_status                 public."stock_status_enum"
                                    DEFAULT 'Reserved'::public."stock_status_enum" NOT NULL,
    wsrb_po_id                  varchar(20),
    wsrb_podetail_id            varchar(20),
    wsrb_remark                 text,
    -- ไม่อยู่ในเอกสาร: wastrel_steel_round_bars/service.ts เขียน/อ่านคอลัมน์นี้
    wsrb_emp_id                 varchar(20),
    wsrb_created_at             timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    wsrb_updated_at             timestamptz,
    CONSTRAINT wastrel_steel_round_bars_pkey PRIMARY KEY (wsrb_id),
    CONSTRAINT wastrel_steel_round_bars_wsrb_code_key UNIQUE (wsrb_code)
);

CREATE TABLE IF NOT EXISTS public.wastrel_ms_plates (
    wmsp_id                     varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    wmsp_mm_id                  varchar(20)    NOT NULL,
    wmsp_msp_id                 varchar(20),
    -- เอกสารระบุ NOT NULL ไม่มี default แต่ INSERT ของ backend ไม่ส่งค่ามา
    wmsp_stock_code             varchar(50)    DEFAULT public.gen_wmsp_stock_code() NOT NULL,
    -- ไม่อยู่ในเอกสาร: wastrel_ms_plates/service.ts SELECT คอลัมน์นี้
    wmsp_display_id             varchar(20)    DEFAULT public.gen_wmsp_display_id(),
    wmsp_length                 numeric(12, 3) NOT NULL,
    wmsp_width                  numeric(12, 3) NOT NULL,
    wmsp_thickness              numeric(12, 3) NOT NULL,
    wmsp_quantity               int4           DEFAULT 1 NOT NULL,
    wmsp_available_quantity     int4           DEFAULT 1 NOT NULL,
    wmsp_loc_id                 varchar(20),
    wmsp_location_type          public."location_type_enum",
    -- มาจาก db/add_scrap_location.sql (พื้นที่จัดเก็บเศษ)
    wmsp_location               text,
    wmsp_status                 public."stock_status_enum"
                                    DEFAULT 'Reserved'::public."stock_status_enum" NOT NULL,
    wmsp_po_id                  varchar(20),
    wmsp_podetail_id            varchar(20),
    wmsp_remark                 text,
    -- ไม่อยู่ในเอกสาร: wastrel_ms_plates/service.ts เขียน/อ่านคอลัมน์นี้
    wmsp_emp_id                 varchar(20),
    wmsp_created_at             timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    wmsp_updated_at             timestamptz,
    CONSTRAINT wastrel_ms_plates_pkey PRIMARY KEY (wmsp_id),
    CONSTRAINT wastrel_ms_plates_wmsp_stock_code_key UNIQUE (wmsp_stock_code)
);

CREATE TABLE IF NOT EXISTS public.timeline_srbs (
    tlsrb_id                varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    tlsrb_srb_id            varchar(20)    NOT NULL,
    tlsrb_po_id             varchar(20),
    tlsrb_podetail_id       varchar(20),
    tlsrb_sr_id             varchar(20),
    tlsrb_event_type        public."timeline_event_type_enum" NOT NULL,
    tlsrb_quantity_change   int4,
    tlsrb_length_before     numeric(12, 3),
    tlsrb_length_after      numeric(12, 3),
    tlsrb_status_before     public."stock_status_enum",
    tlsrb_status_after      public."stock_status_enum",
    tlsrb_location_before   text,
    tlsrb_location_after    text,
    tlsrb_event_at          timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlsrb_remark            text,
    tlsrb_created_at        timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlsrb_updated_at        timestamptz,
    CONSTRAINT timeline_srbs_pkey PRIMARY KEY (tlsrb_id)
);

CREATE TABLE IF NOT EXISTS public.timeline_wsrbs (
    tlwsrb_id               varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    tlwsrb_wsrb_id          varchar(20)    NOT NULL,
    tlwsrb_po_id            varchar(20),
    tlwsrb_podetail_id      varchar(20),
    tlwsrb_sr_id            varchar(20),
    tlwsrb_event_type       public."timeline_event_type_enum" NOT NULL,
    tlwsrb_quantity_change  int4,
    tlwsrb_length_before    numeric(12, 3),
    tlwsrb_length_after     numeric(12, 3),
    tlwsrb_status_before    public."stock_status_enum",
    tlwsrb_status_after     public."stock_status_enum",
    tlwsrb_location_before  text,
    tlwsrb_location_after   text,
    tlwsrb_event_at         timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwsrb_remark           text,
    tlwsrb_created_at       timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwsrb_updated_at       timestamptz,
    CONSTRAINT timeline_wsrbs_pkey PRIMARY KEY (tlwsrb_id)
);

CREATE TABLE IF NOT EXISTS public.timeline_msps (
    tlmsp_id                varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    tlmsp_msp_id            varchar(20)    NOT NULL,
    tlmsp_po_id             varchar(20),
    tlmsp_podetail_id       varchar(20),
    tlmsp_sr_id             varchar(20),
    tlmsp_event_type        public."timeline_event_type_enum" NOT NULL,
    tlmsp_quantity_change   int4,
    tlmsp_length_before     numeric(12, 3),
    tlmsp_width_before      numeric(12, 3),
    tlmsp_length_after      numeric(12, 3),
    tlmsp_width_after       numeric(12, 3),
    tlmsp_status_before     public."stock_status_enum",
    tlmsp_status_after      public."stock_status_enum",
    tlmsp_location_before   text,
    tlmsp_location_after    text,
    tlmsp_event_at          timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlmsp_remark            text,
    tlmsp_created_at        timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlmsp_updated_at        timestamptz,
    CONSTRAINT timeline_msps_pkey PRIMARY KEY (tlmsp_id)
);

CREATE TABLE IF NOT EXISTS public.timeline_wmsps (
    tlwmsp_id               varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    tlwmsp_wmsp_id          varchar(20)    NOT NULL,
    tlwmsp_po_id            varchar(20),
    tlwmsp_podetail_id      varchar(20),
    tlwmsp_sr_id            varchar(20),
    tlwmsp_event_type       public."timeline_event_type_enum" NOT NULL,
    tlwmsp_quantity_change  int4,
    tlwmsp_length_before    numeric(12, 3),
    tlwmsp_width_before     numeric(12, 3),
    tlwmsp_length_after     numeric(12, 3),
    tlwmsp_width_after      numeric(12, 3),
    tlwmsp_status_before    public."stock_status_enum",
    tlwmsp_status_after     public."stock_status_enum",
    tlwmsp_location_before  text,
    tlwmsp_location_after   text,
    tlwmsp_event_at         timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwmsp_remark           text,
    tlwmsp_created_at       timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwmsp_updated_at       timestamptz,
    -- ไม่อยู่ในเอกสาร: timeline_wmsps/service.ts เขียน/อ่านคอลัมน์นี้
    tlwmsp_emp_id           varchar(20),
    CONSTRAINT timeline_wmsps_pkey PRIMARY KEY (tlwmsp_id)
);

-- ============================================================================
--  7) ตาราง orders / order_details (ไม่อยู่ในเอกสารทั้งสองไฟล์)
--
--     api/modules/orders_out/service.ts ทำ SELECT / INSERT / UPDATE บนสองตารางนี้
--     และ api/modules/stock_reservations/service.ts LEFT JOIN เข้ามาด้วย
--     -> ต้องเป็น "ตารางจริง" ไม่ใช่ view เพราะมีทั้ง INSERT และ UPDATE
--     ชื่อ/ชนิดคอลัมน์อนุมานจากคำสั่ง SQL ที่ใช้จริง (ดู db/schema_local_notes.md)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    po_id           varchar(20) DEFAULT public.generate_unique_id() NOT NULL,
    ord_no          varchar(20),
    ord_cus_id      varchar(20),
    ord_date        date,
    ord_due_date    date,
    ord_status      public."order_status_enum"
                        DEFAULT 'Pending'::public."order_status_enum" NOT NULL,
    ord_total_items int4        DEFAULT 0 NOT NULL,
    ord_remark      text,
    ord_created_at  timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ord_updated_at  timestamptz,
    CONSTRAINT orders_pkey PRIMARY KEY (po_id)
);

CREATE TABLE IF NOT EXISTS public.order_details (
    podetail_id                 varchar(20)    DEFAULT public.generate_unique_id() NOT NULL,
    odd_po_id                   varchar(20)    NOT NULL,
    odd_mm_id                   varchar(20)    NOT NULL,
    odd_shape_type              public."shape_type_enum" NOT NULL,
    odd_required_length_mm      numeric(12, 3) NOT NULL,
    odd_required_width_mm       numeric(12, 3),
    odd_required_thickness_mm   numeric(12, 3),
    odd_required_diameter_mm    numeric(12, 3),
    odd_quantity                int4           DEFAULT 0 NOT NULL,
    odd_remaining_quantity      int4           DEFAULT 0 NOT NULL,
    odd_status                  public."order_detail_status_enum"
                                    DEFAULT 'Pending'::public."order_detail_status_enum" NOT NULL,
    odd_created_at              timestamptz    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    odd_updated_at              timestamptz,
    CONSTRAINT order_details_pkey PRIMARY KEY (podetail_id)
);

-- ============================================================================
--  8) FOREIGN KEYS — เพิ่มหลังสร้างตารางครบแล้ว แต่ละตัวห่อไว้ให้รันซ้ำได้
-- ============================================================================

-- ---- ที่อยู่ ----
DO $fk$ BEGIN
    ALTER TABLE public.districts ADD CONSTRAINT districts_district_province_id_fkey
        FOREIGN KEY (district_province_id) REFERENCES public.provinces(province_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.subdistricts ADD CONSTRAINT subdistricts_subdistrict_district_id_fkey
        FOREIGN KEY (subdistrict_district_id) REFERENCES public.districts(district_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

-- ---- ลูกค้า ----
DO $fk$ BEGIN
    ALTER TABLE public.customers ADD CONSTRAINT customers_customer_subdistrict_id_fkey
        FOREIGN KEY (customer_subdistrict_id) REFERENCES public.subdistricts(subdistrict_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.customers ADD CONSTRAINT customers_customer_district_id_fkey
        FOREIGN KEY (customer_district_id) REFERENCES public.districts(district_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.customers ADD CONSTRAINT customers_customer_province_id_fkey
        FOREIGN KEY (customer_province_id) REFERENCES public.provinces(province_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.customers ADD CONSTRAINT customers_customer_emp_id_fkey
        FOREIGN KEY (customer_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

-- ---- FK ตามเอกสาร (foreign_keys section) ----
DO $fk$ BEGIN
    ALTER TABLE public.locations ADD CONSTRAINT locations_loc_parent_id_fkey
        FOREIGN KEY (loc_parent_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_cus_id_fkey
        FOREIGN KEY (po_cus_id) REFERENCES public.customers(customer_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders_details ADD CONSTRAINT purchase_orders_details_podetail_po_id_fkey
        FOREIGN KEY (podetail_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders_details ADD CONSTRAINT purchase_orders_details_podetail_mm_id_fkey
        FOREIGN KEY (podetail_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.stock_reservations ADD CONSTRAINT stock_reservations_sr_po_id_fkey
        FOREIGN KEY (sr_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.stock_reservations ADD CONSTRAINT stock_reservations_sr_podetail_id_fkey
        FOREIGN KEY (sr_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.steel_round_bars ADD CONSTRAINT steel_round_bars_srb_mm_id_fkey
        FOREIGN KEY (srb_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.steel_round_bars ADD CONSTRAINT steel_round_bars_srb_loc_id_fkey
        FOREIGN KEY (srb_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.ms_plates ADD CONSTRAINT ms_plates_msp_mm_id_fkey
        FOREIGN KEY (msp_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.ms_plates ADD CONSTRAINT ms_plates_msp_loc_id_fkey
        FOREIGN KEY (msp_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_mm_id_fkey
        FOREIGN KEY (wsrb_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_srb_id_fkey
        FOREIGN KEY (wsrb_srb_id) REFERENCES public.steel_round_bars(srb_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_loc_id_fkey
        FOREIGN KEY (wsrb_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_po_id_fkey
        FOREIGN KEY (wsrb_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_podetail_id_fkey
        FOREIGN KEY (wsrb_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_mm_id_fkey
        FOREIGN KEY (wmsp_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_msp_id_fkey
        FOREIGN KEY (wmsp_msp_id) REFERENCES public.ms_plates(msp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_loc_id_fkey
        FOREIGN KEY (wmsp_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_po_id_fkey
        FOREIGN KEY (wmsp_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_podetail_id_fkey
        FOREIGN KEY (wmsp_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_srb_id_fkey
        FOREIGN KEY (tlsrb_srb_id) REFERENCES public.steel_round_bars(srb_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_po_id_fkey
        FOREIGN KEY (tlsrb_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_podetail_id_fkey
        FOREIGN KEY (tlsrb_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_sr_id_fkey
        FOREIGN KEY (tlsrb_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_wsrb_id_fkey
        FOREIGN KEY (tlwsrb_wsrb_id) REFERENCES public.wastrel_steel_round_bars(wsrb_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_po_id_fkey
        FOREIGN KEY (tlwsrb_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_podetail_id_fkey
        FOREIGN KEY (tlwsrb_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_sr_id_fkey
        FOREIGN KEY (tlwsrb_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_msp_id_fkey
        FOREIGN KEY (tlmsp_msp_id) REFERENCES public.ms_plates(msp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_po_id_fkey
        FOREIGN KEY (tlmsp_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_podetail_id_fkey
        FOREIGN KEY (tlmsp_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_sr_id_fkey
        FOREIGN KEY (tlmsp_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_wmsp_id_fkey
        FOREIGN KEY (tlwmsp_wmsp_id) REFERENCES public.wastrel_ms_plates(wmsp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_po_id_fkey
        FOREIGN KEY (tlwmsp_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_podetail_id_fkey
        FOREIGN KEY (tlwmsp_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_sr_id_fkey
        FOREIGN KEY (tlwmsp_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

-- ---- FK เพิ่มเติมที่เอกสารไม่ได้ระบุ แต่คำสั่ง JOIN ในโค้ดบอกความสัมพันธ์ชัดเจน ----
DO $fk$ BEGIN
    ALTER TABLE public.projects ADD CONSTRAINT projects_project_customer_id_fkey
        FOREIGN KEY (project_customer_id) REFERENCES public.customers(customer_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.projects ADD CONSTRAINT projects_project_manager_id_fkey
        FOREIGN KEY (project_manager_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.projects ADD CONSTRAINT projects_project_emp_id_fkey
        FOREIGN KEY (project_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_project_id_fkey
        FOREIGN KEY (po_project_id) REFERENCES public.projects(project_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_emp_id_fkey
        FOREIGN KEY (po_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_recipient_id_fkey
        FOREIGN KEY (po_recipient_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_approved_by_emp_id_fkey
        FOREIGN KEY (po_approved_by_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_delivery_province_id_fkey
        FOREIGN KEY (po_delivery_province_id) REFERENCES public.provinces(province_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_delivery_district_id_fkey
        FOREIGN KEY (po_delivery_district_id) REFERENCES public.districts(district_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_delivery_subdistrict_id_fkey
        FOREIGN KEY (po_delivery_subdistrict_id) REFERENCES public.subdistricts(subdistrict_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.purchase_orders_details ADD CONSTRAINT purchase_orders_details_podetail_emp_id_fkey
        FOREIGN KEY (podetail_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.steel_round_bars ADD CONSTRAINT steel_round_bars_srb_emp_id_fkey
        FOREIGN KEY (srb_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.ms_plates ADD CONSTRAINT ms_plates_msp_emp_id_fkey
        FOREIGN KEY (msp_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_emp_id_fkey
        FOREIGN KEY (wsrb_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_emp_id_fkey
        FOREIGN KEY (wmsp_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

DO $fk$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_emp_id_fkey
        FOREIGN KEY (tlwmsp_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $fk$;

-- หมายเหตุ: ตาราง orders / order_details ตั้งใจไม่ผูก FOREIGN KEY ใด ๆ
-- เพราะ orders_out เขียน odd_po_id จาก path parameter :po_id ซึ่งอาจเป็น
-- purchase_orders.po_id หรือ orders.po_id ก็ได้ ยังตีความไม่ชัด — ดู notes

-- ============================================================================
--  9) INDEXES (เอกสารไม่ได้ระบุรายการ index ไว้ — ที่ใส่คือคอลัมน์ FK
--     กับคอลัมน์ที่ WHERE / ORDER BY ในโค้ดใช้บ่อย)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_districts_province             ON public.districts(district_province_id);
CREATE INDEX IF NOT EXISTS idx_subdistricts_district          ON public.subdistricts(subdistrict_district_id);

CREATE INDEX IF NOT EXISTS idx_customers_emp                  ON public.customers(customer_emp_id);
CREATE INDEX IF NOT EXISTS idx_customers_subdistrict          ON public.customers(customer_subdistrict_id);
CREATE INDEX IF NOT EXISTS idx_customers_district             ON public.customers(customer_district_id);
CREATE INDEX IF NOT EXISTS idx_customers_province             ON public.customers(customer_province_id);
CREATE INDEX IF NOT EXISTS idx_customers_status               ON public.customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_tax_id               ON public.customers(customer_tax_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_at           ON public.customers(customer_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_employees_status               ON public.employees(emp_status);

CREATE INDEX IF NOT EXISTS idx_material_masters_status        ON public.material_masters(mm_status);
CREATE INDEX IF NOT EXISTS idx_locations_parent               ON public.locations(loc_parent_id);

CREATE INDEX IF NOT EXISTS idx_projects_customer              ON public.projects(project_customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_manager               ON public.projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_emp                   ON public.projects(project_emp_id);
CREATE INDEX IF NOT EXISTS idx_projects_status                ON public.projects(project_status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at            ON public.projects(project_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_po_cus                         ON public.purchase_orders(po_cus_id);
CREATE INDEX IF NOT EXISTS idx_po_project                     ON public.purchase_orders(po_project_id);
CREATE INDEX IF NOT EXISTS idx_po_emp                         ON public.purchase_orders(po_emp_id);
CREATE INDEX IF NOT EXISTS idx_po_recipient                   ON public.purchase_orders(po_recipient_id);
CREATE INDEX IF NOT EXISTS idx_po_approved_by                 ON public.purchase_orders(po_approved_by_emp_id);
CREATE INDEX IF NOT EXISTS idx_po_delivery_province           ON public.purchase_orders(po_delivery_province_id);
CREATE INDEX IF NOT EXISTS idx_po_delivery_district           ON public.purchase_orders(po_delivery_district_id);
CREATE INDEX IF NOT EXISTS idx_po_delivery_subdistrict        ON public.purchase_orders(po_delivery_subdistrict_id);
CREATE INDEX IF NOT EXISTS idx_po_status                      ON public.purchase_orders(po_status);
CREATE INDEX IF NOT EXISTS idx_po_number                      ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_po_created_at                  ON public.purchase_orders(po_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_podetail_po                    ON public.purchase_orders_details(podetail_po_id);
CREATE INDEX IF NOT EXISTS idx_podetail_mm                    ON public.purchase_orders_details(podetail_mm_id);
CREATE INDEX IF NOT EXISTS idx_podetail_emp                   ON public.purchase_orders_details(podetail_emp_id);
CREATE INDEX IF NOT EXISTS idx_podetail_status                ON public.purchase_orders_details(podetail_status);

CREATE INDEX IF NOT EXISTS idx_sr_po                          ON public.stock_reservations(sr_po_id);
CREATE INDEX IF NOT EXISTS idx_sr_podetail                    ON public.stock_reservations(sr_podetail_id);
CREATE INDEX IF NOT EXISTS idx_sr_stock                       ON public.stock_reservations(sr_stock_type, sr_stock_id);
CREATE INDEX IF NOT EXISTS idx_sr_status                      ON public.stock_reservations(sr_status);
CREATE INDEX IF NOT EXISTS idx_sr_created_at                  ON public.stock_reservations(sr_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_srb_mm                         ON public.steel_round_bars(srb_mm_id);
CREATE INDEX IF NOT EXISTS idx_srb_loc                        ON public.steel_round_bars(srb_loc_id);
CREATE INDEX IF NOT EXISTS idx_srb_emp                        ON public.steel_round_bars(srb_emp_id);
CREATE INDEX IF NOT EXISTS idx_srb_status                     ON public.steel_round_bars(srb_status);
CREATE INDEX IF NOT EXISTS idx_srb_created_at                 ON public.steel_round_bars(srb_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_msp_mm                         ON public.ms_plates(msp_mm_id);
CREATE INDEX IF NOT EXISTS idx_msp_loc                        ON public.ms_plates(msp_loc_id);
CREATE INDEX IF NOT EXISTS idx_msp_emp                        ON public.ms_plates(msp_emp_id);
CREATE INDEX IF NOT EXISTS idx_msp_status                     ON public.ms_plates(msp_status);
CREATE INDEX IF NOT EXISTS idx_msp_created_at                 ON public.ms_plates(msp_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wsrb_mm                        ON public.wastrel_steel_round_bars(wsrb_mm_id);
CREATE INDEX IF NOT EXISTS idx_wsrb_srb                       ON public.wastrel_steel_round_bars(wsrb_srb_id);
CREATE INDEX IF NOT EXISTS idx_wsrb_loc                       ON public.wastrel_steel_round_bars(wsrb_loc_id);
CREATE INDEX IF NOT EXISTS idx_wsrb_po                        ON public.wastrel_steel_round_bars(wsrb_po_id);
CREATE INDEX IF NOT EXISTS idx_wsrb_podetail                  ON public.wastrel_steel_round_bars(wsrb_podetail_id);
CREATE INDEX IF NOT EXISTS idx_wsrb_emp                       ON public.wastrel_steel_round_bars(wsrb_emp_id);
CREATE INDEX IF NOT EXISTS idx_wsrb_status                    ON public.wastrel_steel_round_bars(wsrb_status);
CREATE INDEX IF NOT EXISTS idx_wsrb_created_at                ON public.wastrel_steel_round_bars(wsrb_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wmsp_mm                        ON public.wastrel_ms_plates(wmsp_mm_id);
CREATE INDEX IF NOT EXISTS idx_wmsp_msp                       ON public.wastrel_ms_plates(wmsp_msp_id);
CREATE INDEX IF NOT EXISTS idx_wmsp_loc                       ON public.wastrel_ms_plates(wmsp_loc_id);
CREATE INDEX IF NOT EXISTS idx_wmsp_po                        ON public.wastrel_ms_plates(wmsp_po_id);
CREATE INDEX IF NOT EXISTS idx_wmsp_podetail                  ON public.wastrel_ms_plates(wmsp_podetail_id);
CREATE INDEX IF NOT EXISTS idx_wmsp_emp                       ON public.wastrel_ms_plates(wmsp_emp_id);
CREATE INDEX IF NOT EXISTS idx_wmsp_status                    ON public.wastrel_ms_plates(wmsp_status);
CREATE INDEX IF NOT EXISTS idx_wmsp_created_at                ON public.wastrel_ms_plates(wmsp_created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tlsrb_srb                      ON public.timeline_srbs(tlsrb_srb_id);
CREATE INDEX IF NOT EXISTS idx_tlsrb_po                       ON public.timeline_srbs(tlsrb_po_id);
CREATE INDEX IF NOT EXISTS idx_tlsrb_podetail                 ON public.timeline_srbs(tlsrb_podetail_id);
CREATE INDEX IF NOT EXISTS idx_tlsrb_sr                       ON public.timeline_srbs(tlsrb_sr_id);
CREATE INDEX IF NOT EXISTS idx_tlsrb_event_at                 ON public.timeline_srbs(tlsrb_event_at DESC);

CREATE INDEX IF NOT EXISTS idx_tlwsrb_wsrb                    ON public.timeline_wsrbs(tlwsrb_wsrb_id);
CREATE INDEX IF NOT EXISTS idx_tlwsrb_po                      ON public.timeline_wsrbs(tlwsrb_po_id);
CREATE INDEX IF NOT EXISTS idx_tlwsrb_podetail                ON public.timeline_wsrbs(tlwsrb_podetail_id);
CREATE INDEX IF NOT EXISTS idx_tlwsrb_sr                      ON public.timeline_wsrbs(tlwsrb_sr_id);
CREATE INDEX IF NOT EXISTS idx_tlwsrb_event_at                ON public.timeline_wsrbs(tlwsrb_event_at DESC);

CREATE INDEX IF NOT EXISTS idx_tlmsp_msp                      ON public.timeline_msps(tlmsp_msp_id);
CREATE INDEX IF NOT EXISTS idx_tlmsp_po                       ON public.timeline_msps(tlmsp_po_id);
CREATE INDEX IF NOT EXISTS idx_tlmsp_podetail                 ON public.timeline_msps(tlmsp_podetail_id);
CREATE INDEX IF NOT EXISTS idx_tlmsp_sr                       ON public.timeline_msps(tlmsp_sr_id);
CREATE INDEX IF NOT EXISTS idx_tlmsp_event_at                 ON public.timeline_msps(tlmsp_event_at DESC);

CREATE INDEX IF NOT EXISTS idx_tlwmsp_wmsp                    ON public.timeline_wmsps(tlwmsp_wmsp_id);
CREATE INDEX IF NOT EXISTS idx_tlwmsp_po                      ON public.timeline_wmsps(tlwmsp_po_id);
CREATE INDEX IF NOT EXISTS idx_tlwmsp_podetail                ON public.timeline_wmsps(tlwmsp_podetail_id);
CREATE INDEX IF NOT EXISTS idx_tlwmsp_sr                      ON public.timeline_wmsps(tlwmsp_sr_id);
CREATE INDEX IF NOT EXISTS idx_tlwmsp_emp                     ON public.timeline_wmsps(tlwmsp_emp_id);
CREATE INDEX IF NOT EXISTS idx_tlwmsp_event_at                ON public.timeline_wmsps(tlwmsp_event_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_cus                     ON public.orders(ord_cus_id);
CREATE INDEX IF NOT EXISTS idx_orders_status                   ON public.orders(ord_status);
CREATE INDEX IF NOT EXISTS idx_orders_date                    ON public.orders(ord_date DESC);

CREATE INDEX IF NOT EXISTS idx_order_details_po               ON public.order_details(odd_po_id);
CREATE INDEX IF NOT EXISTS idx_order_details_mm               ON public.order_details(odd_mm_id);
CREATE INDEX IF NOT EXISTS idx_order_details_status           ON public.order_details(odd_status);
CREATE INDEX IF NOT EXISTS idx_order_details_created_at       ON public.order_details(odd_created_at ASC);

-- ============================================================================
--  10) สิ่งที่ตั้งใจไม่ใส่ไว้ในไฟล์นี้ (รายละเอียดเพิ่มเติมใน db/schema_local_notes.md)
-- ============================================================================
--  * ตารางของโมดูล legacy_sales_orders และ legacy_steel_stock
--    (sthead, stcrd ฯลฯ) — พวกนั้นวิ่งบน MySQL คนละฐานผ่าน api/utils/mysql_query.ts
--  * ตาราง departments / positions — purchase_orders/service.ts SELECT ชื่อแผนก/ตำแหน่ง
--    เป็น NULL::text ตรง ๆ ยังไม่มี JOIN ไปตารางใด จึงยังไม่ต้องมีตาราง
--  * ตาราง users / auth — ไม่มีคำสั่ง SQL ใดในโปรเจกต์แตะถึง
--    (emp_authentication ใน api/utils/controller_auth.ts เป็นฟังก์ชัน ไม่ใช่คอลัมน์)
--  * TRIGGER อัปเดต *_updated_at — เอกสารไม่ได้ระบุ trigger ไว้ และ backend
--    ตั้งค่า updated_at = NOW() ในคำสั่ง UPDATE เองอยู่แล้ว
--  * CHECK CONSTRAINT จำกัดค่า ENUM รายคอลัมน์ (ตามที่ enum_summary เสนอไว้ท้ายไฟล์)
--    — ไม่ได้ใส่ เพราะจะทำให้ค่าที่โค้ดปัจจุบันเขียนลงไปบางค่าถูกปฏิเสธ
--  * ข้อมูลตั้งต้น (จังหวัด/อำเภอ/ตำบล, พนักงาน, material_masters) — ไฟล์นี้เป็น DDL
--    เพียว ๆ ไม่มี INSERT; ใช้ db/local/seed.sql หรือชุด seed ของทีมต่างหาก
--  * FOREIGN KEY บน orders / order_details — ดูหมายเหตุในหัวข้อ 8
-- ============================================================================
