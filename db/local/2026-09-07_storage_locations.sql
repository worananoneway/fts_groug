-- ============================================================================
--  ตำแหน่งจัดเก็บ (storage locations)
--  1) เติมข้อมูลหลักของที่จัดเก็บลงตาราง locations ให้ครบตามหน้างาน
--  2) เพิ่มตาราง stock_locations = ผูก "รหัสสินค้า" กับ "ที่จัดเก็บ"
--     ใช้กับสต็อกที่ดึงมาจากระบบคลังเดิม (Express) ซึ่งไม่มีช่องที่จัดเก็บของตัวเอง
--  รันซ้ำได้ (idempotent)
--  วิธีรัน: psql -d fts_group_project -f db/local/2026-09-07_storage_locations.sql
-- ============================================================================

-- ---------- 1) ข้อมูลหลัก: ที่จัดเก็บ ----------
INSERT INTO public.locations (loc_code, loc_name, loc_type, loc_detail)
VALUES ('WH-1', 'คลังหลัก', 'WAREHOUSE', 'คลังเหล็กหลักของโรงงาน')
ON CONFLICT (loc_code) DO NOTHING;

-- โซน / ชั้นวาง อยู่ใต้คลังหลัก
INSERT INTO public.locations (loc_code, loc_name, loc_type, loc_parent_id, loc_detail)
SELECT v.code, v.name, v.type::public."location_type_enum", wh.loc_id, v.detail
FROM (VALUES
        ('ZONE-A', 'โซน A', 'ZONE', 'โซนเก็บเหล็กแผ่น'),
        ('ZONE-B', 'โซน B', 'ZONE', 'โซนเก็บเพลาเหล็กกลม'),
        ('ZONE-C', 'โซน C', 'ZONE', 'โซนเก็บงานรอตัด'),
        ('RACK-1', 'ชั้นวาง 1', 'RACK', 'ชั้นวางแผ่นบาง'),
        ('RACK-2', 'ชั้นวาง 2', 'RACK', 'ชั้นวางแผ่นหนา'),
        ('RACK-3', 'ชั้นวาง 3', 'RACK', 'ชั้นวางเศษเหล็ก')
     ) AS v(code, name, type, detail)
JOIN public.locations wh ON wh.loc_code = 'WH-1'
ON CONFLICT (loc_code) DO NOTHING;

-- พื้นที่นอกอาคาร ไม่อยู่ใต้คลัง
INSERT INTO public.locations (loc_code, loc_name, loc_type, loc_detail)
VALUES ('OUTDOOR', 'พื้นที่นอกอาคาร', 'OTHER', 'ลานเก็บเหล็กนอกอาคาร')
ON CONFLICT (loc_code) DO NOTHING;

-- ---------- 2) enum ประเภทสต็อกที่ผูกที่จัดเก็บได้ ----------
DO $$ BEGIN
    CREATE TYPE public."stock_location_type_enum" AS ENUM
        ('Ms_plate', 'Round_bar', 'Wastrel_ms_plate', 'Wastrel_round_bar');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 3) ตาราง stock_locations ----------
CREATE TABLE IF NOT EXISTS public.stock_locations (
    sl_id           varchar(20) DEFAULT generate_unique_id() NOT NULL,
    sl_stock_type   public."stock_location_type_enum" NOT NULL,
    sl_stock_code   varchar(100) NOT NULL,
    sl_loc_id       varchar(20),
    sl_remark       text,
    sl_emp_id       varchar(20),
    sl_status       public."status_enum" DEFAULT 'Active'::public."status_enum" NOT NULL,
    sl_created_at   timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sl_updated_at   timestamptz,
    CONSTRAINT stock_locations_pkey PRIMARY KEY (sl_id)
);

-- หนึ่งรหัสสินค้าต่อหนึ่งประเภท มีที่จัดเก็บได้แถวเดียว (ใช้กับ ON CONFLICT ของ upsert)
CREATE UNIQUE INDEX IF NOT EXISTS stock_locations_stock_uk
    ON public.stock_locations (sl_stock_type, sl_stock_code);

CREATE INDEX IF NOT EXISTS stock_locations_loc_idx ON public.stock_locations (sl_loc_id);

DO $$ BEGIN
    ALTER TABLE public.stock_locations
        ADD CONSTRAINT stock_locations_loc_fk
        FOREIGN KEY (sl_loc_id) REFERENCES public.locations (loc_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE public.stock_locations
        ADD CONSTRAINT stock_locations_emp_fk
        FOREIGN KEY (sl_emp_id) REFERENCES public.employees (emp_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
