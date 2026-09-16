-- ============================================================================
--  ให้คอลัมน์ผู้บันทึก (emp_id) เป็น NULL ได้
--
--  เหตุผล: ระบบยังไม่มีระบบล็อกอิน (controller ใช้ bypass authenticated user)
--  จึงไม่มี emp_id ส่งมากับ request — แต่ schema ที่สร้างจากเอกสารตั้งเป็น NOT NULL
--  ทำให้กด "ยืนยัน" ในหน้าตัดเหล็กแล้ว PUT /purchase-order-details ตอบ 500:
--    null value in column "podetail_emp_id" violates not-null constraint
--  รันซ้ำได้
-- ============================================================================

ALTER TABLE public.purchase_orders_details ALTER COLUMN podetail_emp_id DROP NOT NULL;
