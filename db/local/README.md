# ฐานข้อมูล Postgres สำหรับรันในเครื่อง (local dev)

`api/config/db.env` ชี้มาที่ Postgres ในเครื่อง (`127.0.0.1:5432`, user `oneway`,
database `fts_group_project`) เพราะ Railway ตัวเดิมต่อไม่ได้แล้ว (ECONNRESET)
ค่าเชื่อมต่อ Railway เดิมเก็บไว้ที่ `api/config/db_railway.env`
ถ้าจะกลับไปใช้คลาวด์ ให้ใส่ `DATABASE_URL=` ใน `db.env` (มีค่าแล้วจะใช้ตัวนั้นก่อน)

## สร้างฐานข้อมูลใหม่ทั้งชุด

```bash
createdb fts_group_project
psql -d fts_group_project -f db/local/schema.sql                        # โครงตาราง + enum + ฟังก์ชัน
psql -d fts_group_project -f db/local/seed.sql                          # ข้อมูลตัวอย่าง
psql -d fts_group_project -f db/local/2026-09-07_storage_locations.sql  # ที่จัดเก็บ + stock_locations
```

ทุกไฟล์รันซ้ำได้ (idempotent)

## ที่จัดเก็บ (ตำแหน่งจัดเก็บ)

- `locations` = ข้อมูลหลักที่จัดเก็บ (คลัง / โซน / ชั้นวาง / ชั้น / อื่น ๆ)
  จัดการได้จากหน้า **ข้อมูลหลัก → ที่จัดเก็บ** (`/master-data/setting/locations`)
- `stock_locations` = ผูก "รหัสสินค้า" กับ "ที่จัดเก็บ" หนึ่งแถวต่อ (ประเภท, รหัส)
  ใช้กับสต็อกที่ดึงจากระบบคลังเดิม (Express) ที่ไม่มีช่องที่จัดเก็บของตัวเอง
  ตั้งค่าได้จากหน้าเหล็กแผ่น / เพลาเหล็กกลม → คลิกแถว → ช่อง "ตำแหน่งจัดเก็บ"
- ตารางเศษเหล็ก (`wastrel_ms_plates.wmsp_location`, `wastrel_steel_round_bars.wsrb_location`)
  ยังเก็บเป็นข้อความเหมือนเดิม แต่ตัวเลือกใน dropdown ดึงมาจากตาราง `locations` แล้ว
  (`constants/scrap-locations.ts` เหลือไว้เป็นค่าสำรองตอนต่อ API ไม่ได้)

## เอกสารอ้างอิงอื่น

- `db/schema_local.sql` + `db/schema_local_notes.md` — DDL ฉบับเต็มที่สร้างจากเอกสาร schema
  (ครบกว่า `schema.sql` เพราะมี `orders` / `order_details` ด้วย ยังไม่ได้ใช้ในเครื่อง)
- `db/api_sql_inventory.md` — สรุปว่า backend แต่ละโมดูลแตะตาราง/คอลัมน์อะไร
