-- ============================================================================
--  purchase_orders_details.podetail_mm_id ต้องเป็น NULL ได้
--
--  เหตุผล: รายการที่นำเข้าจากระบบคลังเดิม (Express) ยังไม่รู้ว่าเป็นวัสดุตัวไหน
--  ในตาราง material_masters (ผู้ใช้ค่อยมาเลือกทีหลังก่อนส่งไปตัด) โค้ดจึงส่ง mm_id = null
--  แต่ schema ตั้งเป็น NOT NULL ทำให้ POST /purchase-order-details ตอบ 500
--  รันซ้ำได้
-- ============================================================================

ALTER TABLE public.purchase_orders_details ALTER COLUMN podetail_mm_id DROP NOT NULL;
