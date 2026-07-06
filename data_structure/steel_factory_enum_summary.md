# สรุป ENUM ของระบบโรงงานเหล็ก

> แหล่งข้อมูล: `steel_factory_enum_review_1(1).xlsx`

หลักการอ่าน:

- แต่ละหัวข้อแสดง `table.column` ว่าใช้ ENUM ชื่ออะไร
- รายการ `ค่าใน ENUM` คือค่ารวมของ ENUM ชื่อนั้นจาก Excel ล่าสุด
- ENUM ชื่อเดียวกันใน PostgreSQL เป็น type กลาง ดังนั้นทุกคอลัมน์ที่ใช้ ENUM เดียวกันจะรองรับค่าชุดเดียวกัน

## `material_masters`

### `mm_shape_type`

- ENUM: `shape_type_enum`
- Nullable: `NO`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Round_bar`
  - `Ms_plate`

## `orders`

### `ord_status`

- ENUM: `order_status_enum`
- Nullable: `NO`
- Default: `Draft`
- ค่าใน ENUM:
  - `Draft`
  - `Revised`
  - `Pending`
  - `In Process`
  - `Completed`
  - `Rejected`
  - `Cancelled`

## `order_details`

### `odd_shape_type`

- ENUM: `shape_type_enum`
- Nullable: `NO`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Round_bar`
  - `Ms_plate`

### `odd_status`

- ENUM: `order_detail_status_enum`
- Nullable: `NO`
- Default: `Draft`
- ค่าใน ENUM:
  - `Draft`
  - `Revised`
  - `Pending`
  - `In Process`
  - `Completed`
  - `Rejected`
  - `Cancelled`

## `stock_reservations`

### `sr_stock_type`

- ENUM: `reservation_stock_type_enum`
- Nullable: `NO`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Round_bar`
  - `Wastrel_round_bar`
  - `Ms_plate`
  - `Wastrel_ms_plate`

### `sr_status`

- ENUM: `reservation_status_enum`
- Nullable: `NO`
- Default: `Reserved`
- ค่าใน ENUM:
  - `Reserved`
  - `Used`
  - `Active`
  - `Inactive`

## `steel_round_bars`

### `srb_status`

- ENUM: `stock_status_enum`
- Nullable: `NO`
- Default: `Active`
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

## `ms_plates`

### `msp_status`

- ENUM: `stock_status_enum`
- Nullable: `NO`
- Default: `Active`
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

## `wastrel_steel_round_bars`

### `wsrb_status`

- ENUM: `stock_status_enum`
- Nullable: `NO`
- Default: `Reserved`
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

## `wastrel_ms_plates`

### `wmsp_status`

- ENUM: `stock_status_enum`
- Nullable: `NO`
- Default: `Reserved`
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

## `timeline_srbs`

### `tlsrb_event_type`

- ENUM: `timeline_event_type_enum`
- Nullable: `NO`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Add`
  - `Edit`
  - `Used`

### `tlsrb_status_before`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

### `tlsrb_status_after`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

## `timeline_wsrbs`

### `tlwsrb_event_type`

- ENUM: `timeline_event_type_enum`
- Nullable: `NO`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Add`
  - `Edit`
  - `Used`

### `tlwsrb_status_before`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

### `tlwsrb_status_after`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

## `timeline_msps`

### `tlmsp_event_type`

- ENUM: `timeline_event_type_enum`
- Nullable: `NO`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Add`
  - `Edit`
  - `Used`

### `tlmsp_status_before`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

### `tlmsp_status_after`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

## `timeline_wmsps`

### `tlwmsp_event_type`

- ENUM: `timeline_event_type_enum`
- Nullable: `NO`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Add`
  - `Edit`
  - `Used`

### `tlwmsp_status_before`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

### `tlwmsp_status_after`

- ENUM: `stock_status_enum`
- Nullable: `YES`
- Default: ไม่มี
- ค่าใน ENUM:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

---

# สรุป ENUM กลาง

## `shape_type_enum`

- `Round_bar`
- `Ms_plate`

## `order_status_enum`

- `Draft`
- `Revised`
- `Pending`
- `In Process`
- `Completed`
- `Rejected`
- `Cancelled`

## `order_detail_status_enum`

- `Draft`
- `Revised`
- `Pending`
- `In Process`
- `Completed`
- `Rejected`
- `Cancelled`

## `reservation_stock_type_enum`

- `Round_bar`
- `Wastrel_round_bar`
- `Ms_plate`
- `Wastrel_ms_plate`

## `reservation_status_enum`

- `Reserved`
- `Used`
- `Active`
- `Inactive`

## `stock_status_enum`

- `Active`
- `Inactive`
- `Deleted`
- `Reserved`
- `Used`

## `timeline_event_type_enum`

- `Add`
- `Edit`
- `Used`

---

# หมายเหตุจากการตรวจไฟล์

- ใน sheet `timeline_srbs` คอลัมน์ `tlsrb_status_after` ไม่มีแถวค่า `Reserved` แต่คอลัมน์นี้ใช้ `stock_status_enum` เดียวกับคอลัมน์อื่น ดังนั้นใน PostgreSQL ค่าที่รองรับจริงของ `stock_status_enum` จะเป็นชุดกลางทั้งหมด:
  - `Active`
  - `Inactive`
  - `Deleted`
  - `Reserved`
  - `Used`

- ถ้าคุณต้องการให้บางคอลัมน์รับได้เพียงบางค่าของ ENUM เดียวกัน ต้องเพิ่ม `CHECK CONSTRAINT` แยกในแต่ละคอลัมน์ เพราะ ENUM อย่างเดียวจำกัดรายคอลัมน์ไม่ได้
