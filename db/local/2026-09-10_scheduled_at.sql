-- ============================================================================
--  ช่อง "วัน-เวลาที่กำหนด" (scheduled_at) ให้สต็อกและเศษเหล็ก
--  ผู้ใช้กรอกเองจากหน้าเว็บ — ว่างได้ (NULL = ยังไม่กำหนด)
--  รันซ้ำได้
-- ============================================================================

ALTER TABLE public.wastrel_ms_plates        ADD COLUMN IF NOT EXISTS wmsp_scheduled_at timestamptz;
ALTER TABLE public.wastrel_steel_round_bars ADD COLUMN IF NOT EXISTS wsrb_scheduled_at timestamptz;
ALTER TABLE public.stock_locations          ADD COLUMN IF NOT EXISTS sl_scheduled_at   timestamptz;
