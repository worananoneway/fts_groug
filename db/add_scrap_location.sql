-- เพิ่มช่อง "พื้นที่จัดเก็บเศษ" (ที่เก็บ) ให้ตารางเศษเหล็ก
-- รันครั้งเดียวบนฐานข้อมูล PostgreSQL ของเว็บ (psql / pgAdmin / Navicat)
-- ปลอดภัย: IF NOT EXISTS + เป็นคอลัมน์ nullable ไม่กระทบข้อมูลเดิม

ALTER TABLE public.wastrel_ms_plates
    ADD COLUMN IF NOT EXISTS wmsp_location text;

ALTER TABLE public.wastrel_steel_round_bars
    ADD COLUMN IF NOT EXISTS wsrb_location text;
