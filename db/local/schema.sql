-- ============================================================================
--  fts_group_project — schema สำหรับรันในเครื่อง (local development)
--  สร้างจาก data_structure/steel_factory_db_schema_ai.md + enum_summary
--  ใช้กับ Postgres ในเครื่อง: psql -d fts_group_project -f db/local/schema.sql
-- ============================================================================

-- ---------- ฟังก์ชันสร้าง id (ตาราง default อ้างถึง) ----------
CREATE OR REPLACE FUNCTION public.generate_unique_id() RETURNS varchar(20)
LANGUAGE sql VOLATILE AS $$
    SELECT to_char(clock_timestamp(), 'YYMMDDHH24MISSMS') || lpad((floor(random()*1000))::int::text, 3, '0')
$$;

CREATE SEQUENCE IF NOT EXISTS public.project_display_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_project_display_id() RETURNS varchar(11)
LANGUAGE sql VOLATILE AS $$
    SELECT 'PJ' || to_char(CURRENT_DATE, 'YY') || lpad(nextval('public.project_display_seq')::text, 6, '0')
$$;

CREATE SEQUENCE IF NOT EXISTS public.purchase_order_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_purchase_order_number() RETURNS varchar(20)
LANGUAGE sql VOLATILE AS $$
    SELECT 'PO' || to_char(CURRENT_DATE, 'YYMM') || lpad(nextval('public.purchase_order_seq')::text, 5, '0')
$$;

CREATE SEQUENCE IF NOT EXISTS public.customer_display_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_customer_display_id() RETURNS varchar(20)
LANGUAGE sql VOLATILE AS $$
    SELECT 'CUS' || lpad(nextval('public.customer_display_seq')::text, 6, '0')
$$;

CREATE SEQUENCE IF NOT EXISTS public.employee_display_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_employee_display_id() RETURNS varchar(20)
LANGUAGE sql VOLATILE AS $$
    SELECT 'EMP' || lpad(nextval('public.employee_display_seq')::text, 6, '0')
$$;

-- ---------- ENUM ----------
DO $$ BEGIN
    CREATE TYPE public."shape_type_enum" AS ENUM ('Round_bar', 'Ms_plate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."status_enum" AS ENUM ('Active', 'Added', 'Approved', 'Authorized', 'Completed', 'Deleted', 'Edited', 'Inactive', 'Pending', 'Rejected', 'Revised', 'Unauthorized', 'Verified', 'Waiting', 'Reserved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."stock_status_enum" AS ENUM ('Active', 'Inactive', 'Deleted', 'Reserved', 'Used');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."location_type_enum" AS ENUM ('WAREHOUSE', 'ZONE', 'RACK', 'SHELF', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."project_enum" AS ENUM ('Opened', 'Waiting - PO', 'Closed', 'Completed', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."purchase_order_enum" AS ENUM ('Paid', 'Waiting Delivery', 'Goods Received', 'Wait Payment', 'Post Sent', 'Cancelled', 'Deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."purchase_order_detail_status_enum" AS ENUM ('Draft', 'Revised', 'Pending', 'In Process', 'Completed', 'Rejected', 'Cancelled', 'Deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."reservation_stock_type_enum" AS ENUM ('Round_bar', 'Wastrel_round_bar', 'Ms_plate', 'Wastrel_ms_plate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."reservation_status_enum" AS ENUM ('Reserved', 'Used', 'Active', 'Inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE TYPE public."timeline_event_type_enum" AS ENUM ('Add', 'Edit', 'Used');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- ตารางอ้างอิงภายนอก (ที่อยู่ / พนักงาน / ลูกค้า) ----------
CREATE TABLE IF NOT EXISTS public.provinces (
    province_id            int4 PRIMARY KEY,
    province_name_th       varchar(100) NOT NULL,
    province_name_en       varchar(100),
    province_geography_id  int4
);

CREATE TABLE IF NOT EXISTS public.districts (
    district_id           int4 PRIMARY KEY,
    district_name_th      varchar(100) NOT NULL,
    district_name_en      varchar(100),
    district_province_id  int4 REFERENCES public.provinces(province_id)
);

CREATE TABLE IF NOT EXISTS public.subdistricts (
    subdistrict_id           int4 PRIMARY KEY,
    subdistrict_name_th      varchar(100) NOT NULL,
    subdistrict_name_en      varchar(100),
    subdistrict_district_id  int4 REFERENCES public.districts(district_id),
    subdistrict_zip_code     varchar(10)
);

CREATE TABLE IF NOT EXISTS public.employees (
    emp_id             varchar(20) PRIMARY KEY DEFAULT public.generate_unique_id(),
    emp_display_id     varchar(20) DEFAULT public.gen_employee_display_id(),
    emp_prefix         varchar(20),
    emp_firstname_th   varchar(100),
    emp_lastname_th    varchar(100),
    emp_firstname_en   varchar(100),
    emp_lastname_en    varchar(100),
    emp_email          varchar(100),
    emp_phone          varchar(20),
    emp_department_id  varchar(20),
    emp_position_id    varchar(20),
    emp_number_id      varchar(20),
    emp_photo_file     varchar(400),
    emp_authentication varchar(200),
    emp_status         public."status_enum" NOT NULL DEFAULT 'Active',
    emp_created_at     timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    emp_updated_at     timestamptz
);

CREATE TABLE IF NOT EXISTS public.customers (
    customer_id                varchar(20) PRIMARY KEY DEFAULT public.generate_unique_id(),
    customer_display_id        varchar(20) DEFAULT public.gen_customer_display_id(),
    customer_name_th           varchar(200),
    customer_name_en           varchar(200),
    customer_tax_id            varchar(20),
    customer_tax_type          varchar(30),
    customer_contact_name      varchar(100),
    customer_contact_phone     varchar(20),
    customer_contact_fax       varchar(20),
    customer_contact_email     varchar(100),
    customer_address           varchar(400),
    customer_subdistrict_id    int4 REFERENCES public.subdistricts(subdistrict_id),
    customer_district_id       int4 REFERENCES public.districts(district_id),
    customer_province_id       int4 REFERENCES public.provinces(province_id),
    customer_postcode          varchar(10),
    customer_branch_type       varchar(20),
    customer_branch_number     varchar(20),
    customer_pp20_file         varchar(400),
    customer_certificate_file  varchar(400),
    customer_emp_id            varchar(20) REFERENCES public.employees(emp_id),
    customer_status            public."status_enum" NOT NULL DEFAULT 'Active',
    customer_created_at        timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    customer_updated_at        timestamptz
);

-- ---------- ตารางหลักของโมดูลโรงงานเหล็ก ----------
CREATE TABLE IF NOT EXISTS public.material_masters (
    mm_id                              varchar(20) DEFAULT generate_unique_id() NOT NULL,
    mm_code                            varchar(50) NOT NULL,
    mm_name                            varchar(100) NOT NULL,
    mm_shape_type                      public."shape_type_enum" NOT NULL,
    mm_grade                           varchar(50),
    mm_status                          public."status_enum" DEFAULT 'Active'::public."status_enum" NOT NULL,
    mm_created_at                      timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    mm_updated_at                      timestamptz,
    CONSTRAINT material_masters_pkey PRIMARY KEY (mm_id),
    UNIQUE (mm_code)
);

CREATE TABLE IF NOT EXISTS public.locations (
    loc_id                             varchar(20) DEFAULT generate_unique_id() NOT NULL,
    loc_code                           varchar(50) NOT NULL,
    loc_name                           varchar(100) NOT NULL,
    loc_type                           public."location_type_enum" NOT NULL,
    loc_parent_id                      varchar(20),
    loc_detail                         text,
    loc_status                         public."status_enum" DEFAULT 'Active'::public."status_enum" NOT NULL,
    loc_created_at                     timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    loc_updated_at                     timestamptz,
    CONSTRAINT locations_pkey PRIMARY KEY (loc_id),
    UNIQUE (loc_code)
);

CREATE TABLE IF NOT EXISTS public.stock_reservations (
    sr_id                              varchar(20) DEFAULT generate_unique_id() NOT NULL,
    sr_po_id                           varchar(20) NOT NULL,
    sr_podetail_id                     varchar(20) NOT NULL,
    sr_stock_type                      public."reservation_stock_type_enum" NOT NULL,
    sr_stock_id                        varchar(20) NOT NULL,
    sr_reserved_quantity               int4 DEFAULT 1 NOT NULL,
    sr_reserved_length_mm              numeric(12, 3),
    sr_reserved_width_mm               numeric(12, 3),
    sr_status                          public."reservation_status_enum" DEFAULT 'Reserved'::public."reservation_status_enum" NOT NULL,
    sr_reserved_at                     timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sr_used_at                         timestamptz,
    sr_created_at                      timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sr_updated_at                      timestamptz,
    CONSTRAINT stock_reservations_pkey PRIMARY KEY (sr_id)
);

CREATE TABLE IF NOT EXISTS public.steel_round_bars (
    srb_id                             varchar(20) DEFAULT generate_unique_id() NOT NULL,
    srb_mm_id                          varchar(20) NOT NULL,
    srb_code                           varchar(50) NOT NULL,
    srb_diameter                       numeric(12, 3) NOT NULL,
    srb_length                         numeric(12, 3) NOT NULL,
    srb_quantity                       int4 DEFAULT 1 NOT NULL,
    srb_available_quantity             int4 DEFAULT 1 NOT NULL,
    srb_loc_id                         varchar(20),
    srb_location_type                  public."location_type_enum",
    srb_location                       text,
    srb_status                         public."stock_status_enum" DEFAULT 'Active'::public."stock_status_enum" NOT NULL,
    srb_received_date                  date,
    srb_remark                         text,
    srb_created_at                     timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    srb_updated_at                     timestamptz,
    CONSTRAINT steel_round_bars_pkey PRIMARY KEY (srb_id),
    UNIQUE (srb_code)
);

CREATE TABLE IF NOT EXISTS public.ms_plates (
    msp_id                             varchar(20) DEFAULT generate_unique_id() NOT NULL,
    msp_mm_id                          varchar(20) NOT NULL,
    msp_code                           varchar(50) NOT NULL,
    msp_length                         numeric(12, 3) NOT NULL,
    msp_width                          numeric(12, 3) NOT NULL,
    msp_thickness                      numeric(12, 3) NOT NULL,
    msp_quantity                       int4 DEFAULT 1 NOT NULL,
    msp_available_quantity             int4 DEFAULT 1 NOT NULL,
    msp_loc_id                         varchar(20),
    msp_location_type                  public."location_type_enum",
    msp_location                       text,
    msp_status                         public."stock_status_enum" DEFAULT 'Active'::public."stock_status_enum" NOT NULL,
    msp_received_date                  date,
    msp_remark                         text,
    msp_created_at                     timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    msp_updated_at                     timestamptz,
    CONSTRAINT ms_plates_pkey PRIMARY KEY (msp_id),
    UNIQUE (msp_code)
);

CREATE TABLE IF NOT EXISTS public.wastrel_steel_round_bars (
    wsrb_id                            varchar(20) DEFAULT generate_unique_id() NOT NULL,
    wsrb_mm_id                         varchar(20) NOT NULL,
    wsrb_srb_id                        varchar(20),
    wsrb_code                          varchar(50) NOT NULL,
    wsrb_diameter                      numeric(12, 3) NOT NULL,
    wsrb_length                        numeric(12, 3) NOT NULL,
    wsrb_quantity                      int4 DEFAULT 1 NOT NULL,
    wsrb_available_quantity            int4 DEFAULT 1 NOT NULL,
    wsrb_loc_id                        varchar(20),
    wsrb_location_type                 public."location_type_enum",
    wsrb_location                      text,
    wsrb_status                        public."stock_status_enum" DEFAULT 'Active'::public."stock_status_enum" NOT NULL,
    wsrb_po_id                         varchar(20),
    wsrb_podetail_id                   varchar(20),
    wsrb_remark                        text,
    wsrb_created_at                    timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    wsrb_updated_at                    timestamptz,
    CONSTRAINT wastrel_steel_round_bars_pkey PRIMARY KEY (wsrb_id),
    UNIQUE (wsrb_code)
);

CREATE TABLE IF NOT EXISTS public.wastrel_ms_plates (
    wmsp_id                            varchar(20) DEFAULT generate_unique_id() NOT NULL,
    wmsp_mm_id                         varchar(20) NOT NULL,
    wmsp_msp_id                        varchar(20),
    wmsp_stock_code                    varchar(50) NOT NULL,
    wmsp_length                        numeric(12, 3) NOT NULL,
    wmsp_width                         numeric(12, 3) NOT NULL,
    wmsp_thickness                     numeric(12, 3) NOT NULL,
    wmsp_quantity                      int4 DEFAULT 1 NOT NULL,
    wmsp_available_quantity            int4 DEFAULT 1 NOT NULL,
    wmsp_loc_id                        varchar(20),
    wmsp_location_type                 public."location_type_enum",
    wmsp_location                      text,
    wmsp_status                        public."stock_status_enum" DEFAULT 'Active'::public."stock_status_enum" NOT NULL,
    wmsp_po_id                         varchar(20),
    wmsp_podetail_id                   varchar(20),
    wmsp_remark                        text,
    wmsp_created_at                    timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    wmsp_updated_at                    timestamptz,
    CONSTRAINT wastrel_ms_plates_pkey PRIMARY KEY (wmsp_id),
    UNIQUE (wmsp_stock_code)
);

CREATE TABLE IF NOT EXISTS public.timeline_srbs (
    tlsrb_id                           varchar(20) DEFAULT generate_unique_id() NOT NULL,
    tlsrb_srb_id                       varchar(20) NOT NULL,
    tlsrb_po_id                        varchar(20),
    tlsrb_podetail_id                  varchar(20),
    tlsrb_sr_id                        varchar(20),
    tlsrb_event_type                   public."timeline_event_type_enum" NOT NULL,
    tlsrb_quantity_change              int4,
    tlsrb_length_before                numeric(12, 3),
    tlsrb_length_after                 numeric(12, 3),
    tlsrb_status_before                public."stock_status_enum",
    tlsrb_status_after                 public."stock_status_enum",
    tlsrb_location_before              text,
    tlsrb_location_after               text,
    tlsrb_event_at                     timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlsrb_remark                       text,
    tlsrb_created_at                   timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlsrb_updated_at                   timestamptz,
    CONSTRAINT timeline_srbs_pkey PRIMARY KEY (tlsrb_id)
);

CREATE TABLE IF NOT EXISTS public.timeline_wsrbs (
    tlwsrb_id                          varchar(20) DEFAULT generate_unique_id() NOT NULL,
    tlwsrb_wsrb_id                     varchar(20) NOT NULL,
    tlwsrb_po_id                       varchar(20),
    tlwsrb_podetail_id                 varchar(20),
    tlwsrb_sr_id                       varchar(20),
    tlwsrb_event_type                  public."timeline_event_type_enum" NOT NULL,
    tlwsrb_quantity_change             int4,
    tlwsrb_length_before               numeric(12, 3),
    tlwsrb_length_after                numeric(12, 3),
    tlwsrb_status_before               public."stock_status_enum",
    tlwsrb_status_after                public."stock_status_enum",
    tlwsrb_location_before             text,
    tlwsrb_location_after              text,
    tlwsrb_event_at                    timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwsrb_remark                      text,
    tlwsrb_created_at                  timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwsrb_updated_at                  timestamptz,
    CONSTRAINT timeline_wsrbs_pkey PRIMARY KEY (tlwsrb_id)
);

CREATE TABLE IF NOT EXISTS public.timeline_msps (
    tlmsp_id                           varchar(20) DEFAULT generate_unique_id() NOT NULL,
    tlmsp_msp_id                       varchar(20) NOT NULL,
    tlmsp_po_id                        varchar(20),
    tlmsp_podetail_id                  varchar(20),
    tlmsp_sr_id                        varchar(20),
    tlmsp_event_type                   public."timeline_event_type_enum" NOT NULL,
    tlmsp_quantity_change              int4,
    tlmsp_length_before                numeric(12, 3),
    tlmsp_width_before                 numeric(12, 3),
    tlmsp_length_after                 numeric(12, 3),
    tlmsp_width_after                  numeric(12, 3),
    tlmsp_status_before                public."stock_status_enum",
    tlmsp_status_after                 public."stock_status_enum",
    tlmsp_location_before              text,
    tlmsp_location_after               text,
    tlmsp_event_at                     timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlmsp_remark                       text,
    tlmsp_created_at                   timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlmsp_updated_at                   timestamptz,
    CONSTRAINT timeline_msps_pkey PRIMARY KEY (tlmsp_id)
);

CREATE TABLE IF NOT EXISTS public.timeline_wmsps (
    tlwmsp_id                          varchar(20) DEFAULT generate_unique_id() NOT NULL,
    tlwmsp_wmsp_id                     varchar(20) NOT NULL,
    tlwmsp_po_id                       varchar(20),
    tlwmsp_podetail_id                 varchar(20),
    tlwmsp_sr_id                       varchar(20),
    tlwmsp_event_type                  public."timeline_event_type_enum" NOT NULL,
    tlwmsp_quantity_change             int4,
    tlwmsp_length_before               numeric(12, 3),
    tlwmsp_width_before                numeric(12, 3),
    tlwmsp_length_after                numeric(12, 3),
    tlwmsp_width_after                 numeric(12, 3),
    tlwmsp_status_before               public."stock_status_enum",
    tlwmsp_status_after                public."stock_status_enum",
    tlwmsp_location_before             text,
    tlwmsp_location_after              text,
    tlwmsp_event_at                    timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwmsp_remark                      text,
    tlwmsp_created_at                  timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tlwmsp_updated_at                  timestamptz,
    CONSTRAINT timeline_wmsps_pkey PRIMARY KEY (tlwmsp_id)
);

CREATE TABLE IF NOT EXISTS public.projects (
    project_id                         varchar(20) DEFAULT generate_unique_id() NOT NULL,
    project_display_id                 varchar(11) DEFAULT gen_project_display_id() NOT NULL,
    project_name_th                    varchar(100),
    project_name_en                    varchar(100) NOT NULL,
    project_contact_email              varchar(100),
    project_contact_fax                varchar(15),
    project_contact_name               varchar(100),
    project_contact_phone              varchar(15),
    project_customer_id                varchar(20),
    project_budget                     numeric(15, 2),
    project_closing_date               date,
    project_note                       varchar(400),
    project_manager_id                 varchar(20),
    project_status                     public."project_enum" DEFAULT 'Opened'::public."project_enum" NOT NULL,
    project_emp_id                     varchar(20),
    project_created_at                 timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    project_updated_at                 timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    project_customer_po                varchar,
    CONSTRAINT projects_pkey PRIMARY KEY (project_id)
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    po_cus_id                          varchar(20) NOT NULL,
    po_due_date                        date,
    po_remark                          text,
    po_id                              varchar(20) DEFAULT generate_unique_id() NOT NULL,
    po_number                          varchar(20) DEFAULT gen_purchase_order_number() NOT NULL,
    po_issue_date                      date,
    po_ship_via                        varchar(150),
    po_qt_on                           varchar(50),
    po_shipping_terms                  varchar(100),
    po_tax_rate                        float4 NOT NULL,
    po_recipient_id                    varchar(20),
    po_comment                         varchar(300),
    po_status_sent_date                date,
    po_status_goods_received_          date,
    po_status_paid_date                date,
    po_status_note                     varchar(200),
    po_emp_id                          varchar(20),
    po_created_at                      timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    po_updated_at                      timestamptz DEFAULT CURRENT_TIMESTAMP,
    po_status                          public."purchase_order_enum" DEFAULT 'Post Sent'::public."purchase_order_enum" NOT NULL,
    po_project_id                      varchar(20),
    po_condition_paid                  int4,
    po_delivery_province_id            int4,
    po_delivery_district_id            int4,
    po_delivery_subdistrict_id         int4,
    po_approved_by_emp_id              varchar(20),
    po_purchasing_fname                varchar(80),
    po_purchasing_lname                varchar(80),
    CONSTRAINT purchase_orders_pkey PRIMARY KEY (po_id)
);

CREATE TABLE IF NOT EXISTS public.purchase_orders_details (
    podetail_mm_id                     varchar(20) NOT NULL,
    podetail_required_length_mm        numeric(12, 3) NOT NULL,
    podetail_required_width_mm         numeric(12, 3),
    podetail_required_thickness_mm     numeric(12, 3),
    podetail_required_diameter_mm      numeric(12, 3),
    podetail_cut_quantity              int4 DEFAULT 0 NOT NULL,
    podetail_remaining_quantity        int4 DEFAULT 0 NOT NULL,
    podetail_allow_wastrel             bool DEFAULT true NOT NULL,
    podetail_allow_rotation            bool DEFAULT false NOT NULL,
    podetail_status                    public."purchase_order_detail_status_enum" DEFAULT 'Pending'::public."purchase_order_detail_status_enum" NOT NULL,
    podetail_remark                    text,
    podetail_id                        varchar(20) DEFAULT generate_unique_id() NOT NULL,
    podetail_on                        int4,
    podetail_unit                      varchar(80),
    podetail_description               varchar(1000),
    podetail_qty                       int4,
    podetail_discount                  numeric(15, 2),
    podetail_unit_price                numeric(15, 2),
    podetail_emp_id                    varchar(20) NOT NULL,
    podetail_created_at                timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    podetail_updated_at                timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    podetail_po_id                     varchar(20) NOT NULL,
    CONSTRAINT purchase_orders_details_pkey PRIMARY KEY (podetail_id)
);

-- ---------- Foreign keys ----------
DO $$ BEGIN
    ALTER TABLE public.locations ADD CONSTRAINT locations_loc_parent_id_fkey FOREIGN KEY (loc_parent_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_cus_id_fkey FOREIGN KEY (po_cus_id) REFERENCES public.customers(customer_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.purchase_orders_details ADD CONSTRAINT purchase_orders_details_podetail_po_id_fkey FOREIGN KEY (podetail_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.purchase_orders_details ADD CONSTRAINT purchase_orders_details_podetail_mm_id_fkey FOREIGN KEY (podetail_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.stock_reservations ADD CONSTRAINT stock_reservations_sr_po_id_fkey FOREIGN KEY (sr_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.stock_reservations ADD CONSTRAINT stock_reservations_sr_podetail_id_fkey FOREIGN KEY (sr_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.steel_round_bars ADD CONSTRAINT steel_round_bars_srb_mm_id_fkey FOREIGN KEY (srb_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.steel_round_bars ADD CONSTRAINT steel_round_bars_srb_loc_id_fkey FOREIGN KEY (srb_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.ms_plates ADD CONSTRAINT ms_plates_msp_mm_id_fkey FOREIGN KEY (msp_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.ms_plates ADD CONSTRAINT ms_plates_msp_loc_id_fkey FOREIGN KEY (msp_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_mm_id_fkey FOREIGN KEY (wsrb_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_srb_id_fkey FOREIGN KEY (wsrb_srb_id) REFERENCES public.steel_round_bars(srb_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_loc_id_fkey FOREIGN KEY (wsrb_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_po_id_fkey FOREIGN KEY (wsrb_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_steel_round_bars ADD CONSTRAINT wastrel_steel_round_bars_wsrb_podetail_id_fkey FOREIGN KEY (wsrb_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_mm_id_fkey FOREIGN KEY (wmsp_mm_id) REFERENCES public.material_masters(mm_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_msp_id_fkey FOREIGN KEY (wmsp_msp_id) REFERENCES public.ms_plates(msp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_loc_id_fkey FOREIGN KEY (wmsp_loc_id) REFERENCES public.locations(loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_po_id_fkey FOREIGN KEY (wmsp_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.wastrel_ms_plates ADD CONSTRAINT wastrel_ms_plates_wmsp_podetail_id_fkey FOREIGN KEY (wmsp_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_srb_id_fkey FOREIGN KEY (tlsrb_srb_id) REFERENCES public.steel_round_bars(srb_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_po_id_fkey FOREIGN KEY (tlsrb_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_podetail_id_fkey FOREIGN KEY (tlsrb_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_srbs ADD CONSTRAINT timeline_srbs_tlsrb_sr_id_fkey FOREIGN KEY (tlsrb_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_wsrb_id_fkey FOREIGN KEY (tlwsrb_wsrb_id) REFERENCES public.wastrel_steel_round_bars(wsrb_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_po_id_fkey FOREIGN KEY (tlwsrb_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_podetail_id_fkey FOREIGN KEY (tlwsrb_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wsrbs ADD CONSTRAINT timeline_wsrbs_tlwsrb_sr_id_fkey FOREIGN KEY (tlwsrb_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_msp_id_fkey FOREIGN KEY (tlmsp_msp_id) REFERENCES public.ms_plates(msp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_po_id_fkey FOREIGN KEY (tlmsp_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_podetail_id_fkey FOREIGN KEY (tlmsp_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_msps ADD CONSTRAINT timeline_msps_tlmsp_sr_id_fkey FOREIGN KEY (tlmsp_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_wmsp_id_fkey FOREIGN KEY (tlwmsp_wmsp_id) REFERENCES public.wastrel_ms_plates(wmsp_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_po_id_fkey FOREIGN KEY (tlwmsp_po_id) REFERENCES public.purchase_orders(po_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_podetail_id_fkey FOREIGN KEY (tlwmsp_podetail_id) REFERENCES public.purchase_orders_details(podetail_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.timeline_wmsps ADD CONSTRAINT timeline_wmsps_tlwmsp_sr_id_fkey FOREIGN KEY (tlwmsp_sr_id) REFERENCES public.stock_reservations(sr_id);
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

-- ---------- FK เพิ่มเติมที่ไม่ได้อยู่ในเอกสาร ----------
DO $$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_project_id_fkey FOREIGN KEY (po_project_id) REFERENCES public.projects(project_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.purchase_orders ADD CONSTRAINT purchase_orders_po_emp_id_fkey FOREIGN KEY (po_emp_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.projects ADD CONSTRAINT projects_project_customer_id_fkey FOREIGN KEY (project_customer_id) REFERENCES public.customers(customer_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    ALTER TABLE public.projects ADD CONSTRAINT projects_project_manager_id_fkey FOREIGN KEY (project_manager_id) REFERENCES public.employees(emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- คอลัมน์ที่โค้ด API ใช้ แต่เอกสาร schema ไม่ได้ระบุไว้ ----------
ALTER TABLE public.ms_plates                ADD COLUMN IF NOT EXISTS msp_emp_id    varchar(20) REFERENCES public.employees(emp_id);
ALTER TABLE public.steel_round_bars         ADD COLUMN IF NOT EXISTS srb_emp_id    varchar(20) REFERENCES public.employees(emp_id);
ALTER TABLE public.wastrel_ms_plates        ADD COLUMN IF NOT EXISTS wmsp_emp_id   varchar(20) REFERENCES public.employees(emp_id);
ALTER TABLE public.wastrel_steel_round_bars ADD COLUMN IF NOT EXISTS wsrb_emp_id   varchar(20) REFERENCES public.employees(emp_id);
ALTER TABLE public.timeline_wmsps           ADD COLUMN IF NOT EXISTS tlwmsp_emp_id varchar(20) REFERENCES public.employees(emp_id);

CREATE SEQUENCE IF NOT EXISTS public.wmsp_display_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_wmsp_display_id() RETURNS varchar(20)
LANGUAGE sql VOLATILE AS $$
    SELECT 'WMSP' || lpad(nextval('public.wmsp_display_seq')::text, 6, '0')
$$;

CREATE SEQUENCE IF NOT EXISTS public.wsrb_display_seq START 1;
CREATE OR REPLACE FUNCTION public.gen_wsrb_display_id() RETURNS varchar(20)
LANGUAGE sql VOLATILE AS $$
    SELECT 'WSRB' || lpad(nextval('public.wsrb_display_seq')::text, 6, '0')
$$;

ALTER TABLE public.wastrel_ms_plates        ADD COLUMN IF NOT EXISTS wmsp_display_id varchar(20) DEFAULT public.gen_wmsp_display_id();
ALTER TABLE public.wastrel_steel_round_bars ADD COLUMN IF NOT EXISTS wsrb_display_id varchar(20) DEFAULT public.gen_wsrb_display_id();
UPDATE public.wastrel_ms_plates        SET wmsp_display_id = public.gen_wmsp_display_id() WHERE wmsp_display_id IS NULL;
UPDATE public.wastrel_steel_round_bars SET wsrb_display_id = public.gen_wsrb_display_id() WHERE wsrb_display_id IS NULL;

-- ---------- VIEW ชื่อเดิม (orders / order_details) ให้ endpoint เก่าที่ยังอ้างถึงไม่พัง ----------
CREATE OR REPLACE VIEW public.orders AS
    SELECT po_id, po_number AS ord_no, po_cus_id, po_status, po_created_at
    FROM public.purchase_orders;

CREATE OR REPLACE VIEW public.order_details AS
    SELECT
        pod.podetail_id,
        pod.podetail_po_id,
        mm.mm_shape_type          AS odd_shape_type,
        pod.podetail_required_length_mm    AS odd_required_length_mm,
        pod.podetail_required_width_mm     AS odd_required_width_mm,
        pod.podetail_required_thickness_mm AS odd_required_thickness_mm,
        pod.podetail_required_diameter_mm  AS odd_required_diameter_mm,
        pod.podetail_cut_quantity          AS odd_quantity,
        pod.podetail_status                AS odd_status
    FROM public.purchase_orders_details pod
    LEFT JOIN public.material_masters mm ON pod.podetail_mm_id = mm.mm_id;
