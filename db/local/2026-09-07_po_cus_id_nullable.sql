-- ============================================================================
--  purchase_orders.po_cus_id ต้องเป็น NULL ได้
--
--  เหตุผล: การ "นำเข้าจากระบบคลังเดิม (Express)" สร้าง PO โดยยังไม่รู้ว่า
--  ลูกค้าคนไหนในตาราง customers (services/division/legacy-orders.ts ส่ง cus_id: null
--  แล้วเก็บชื่อลูกค้าจริงไว้ใน po_remark) — schema ที่สร้างจากเอกสารตั้งเป็น NOT NULL
--  ทำให้ POST /api/v1/purchase-orders ตอบ 500:
--    null value in column "po_cus_id" violates not-null constraint
--  รันซ้ำได้
-- ============================================================================

ALTER TABLE public.purchase_orders ALTER COLUMN po_cus_id DROP NOT NULL;
