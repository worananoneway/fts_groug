# Steel Factory DB Schema — สำหรับคนอ่าน

> อ้างอิงจาก `steel_factory_postgresql_schema_v3_current_db.sql`
> ขอบเขต: ตารางของโมดูลโรงงานเหล็กใน `public` schema

## 1. material_masters

 mm_id
 mm_code
 mm_name
 mm_shape_type
 mm_grade
 mm_status
 mm_created_at
 mm_updated_at

## 2. locations

 loc_id
 loc_code
 loc_name
 loc_type
 loc_parent_id
 loc_detail
 loc_status
 loc_created_at
 loc_updated_at

## 3. orders

 ord_id
 ord_no
 ord_cus_id
 ord_date
 ord_due_date
 ord_status
 ord_total_items
 ord_remark
 ord_created_by
 ord_created_at
 ord_updated_at

## 4. order_details

 odd_id
 odd_ord_id
 odd_mm_id
 odd_shape_type
 odd_required_length_mm
 odd_required_width_mm
 odd_required_thickness_mm
 odd_required_diameter_mm
 odd_quantity
 odd_cut_quantity
 odd_remaining_quantity
 odd_allow_wastrel
 odd_allow_rotation
 odd_status
 odd_remark
 odd_created_at
 odd_updated_at

## 5. stock_reservations

 sr_id
 sr_ord_id
 sr_odd_id
 sr_stock_type
 sr_stock_id
 sr_reserved_quantity
 sr_reserved_length_mm
 sr_reserved_width_mm
 sr_status
 sr_reserved_at
 sr_used_at
 sr_created_at
 sr_updated_at

## 6. steel_round_bars

 srb_id
 srb_mm_id
 srb_code
 srb_diameter
 srb_length
 srb_quantity
 srb_available_quantity
 srb_loc_id
 srb_location_type
 srb_location
 srb_status
 srb_received_date
 srb_remark
 srb_created_at
 srb_updated_at

## 7. ms_plates

 msp_id
 msp_mm_id
 msp_code
 msp_length
 msp_width
 msp_thickness
 msp_quantity
 msp_available_quantity
 msp_loc_id
 msp_location_type
 msp_location
 msp_status
 msp_received_date
 msp_remark
 msp_created_at
 msp_updated_at

## 8. wastrel_steel_round_bars

 wsrb_id
 wsrb_mm_id
 wsrb_srb_id
 wsrb_code
 wsrb_diameter
 wsrb_length
 wsrb_quantity
 wsrb_available_quantity
 wsrb_loc_id
 wsrb_location_type
 wsrb_location
 wsrb_status
 wsrb_ord_id
 wsrb_odd_id
 wsrb_remark
 wsrb_created_at
 wsrb_updated_at

## 9. wastrel_ms_plates

 wmsp_id
 wmsp_mm_id
 wmsp_msp_id
 wmsp_stock_code
 wmsp_length
 wmsp_width
 wmsp_thickness
 wmsp_quantity
 wmsp_available_quantity
 wmsp_loc_id
 wmsp_location_type
 wmsp_location
 wmsp_status
 wmsp_ord_id
 wmsp_odd_id
 wmsp_remark
 wmsp_created_at
 wmsp_updated_at

## 10. timeline_srbs

 tlsrb_id
 tlsrb_srb_id
 tlsrb_ord_id
 tlsrb_odd_id
 tlsrb_sr_id
 tlsrb_event_type
 tlsrb_quantity_change
 tlsrb_length_before
 tlsrb_length_after
 tlsrb_status_before
 tlsrb_status_after
 tlsrb_location_before
 tlsrb_location_after
 tlsrb_event_at
 tlsrb_remark
 tlsrb_created_at
 tlsrb_updated_at

## 11. timeline_wsrbs

 tlwsrb_id
 tlwsrb_wsrb_id
 tlwsrb_ord_id
 tlwsrb_odd_id
 tlwsrb_sr_id
 tlwsrb_event_type
 tlwsrb_quantity_change
 tlwsrb_length_before
 tlwsrb_length_after
 tlwsrb_status_before
 tlwsrb_status_after
 tlwsrb_location_before
 tlwsrb_location_after
 tlwsrb_event_at
 tlwsrb_remark
 tlwsrb_created_at
 tlwsrb_updated_at

## 12. timeline_msps

 tlmsp_id
 tlmsp_msp_id
 tlmsp_ord_id
 tlmsp_odd_id
 tlmsp_sr_id
 tlmsp_event_type
 tlmsp_quantity_change
 tlmsp_length_before
 tlmsp_width_before
 tlmsp_length_after
 tlmsp_width_after
 tlmsp_status_before
 tlmsp_status_after
 tlmsp_location_before
 tlmsp_location_after
 tlmsp_event_at
 tlmsp_remark
 tlmsp_created_at
 tlmsp_updated_at

## 13. timeline_wmsps

 tlwmsp_id
 tlwmsp_wmsp_id
 tlwmsp_ord_id
 tlwmsp_odd_id
 tlwmsp_sr_id
 tlwmsp_event_type
 tlwmsp_quantity_change
 tlwmsp_length_before
 tlwmsp_width_before
 tlwmsp_length_after
 tlwmsp_width_after
 tlwmsp_status_before
 tlwmsp_status_after
 tlwmsp_location_before
 tlwmsp_location_after
 tlwmsp_event_at
 tlwmsp_remark
 tlwmsp_created_at
 tlwmsp_updated_at

---

# สรุป Primary Key (PK)

- `material_masters.mm_id`
- `locations.loc_id`
- `orders.ord_id`
- `order_details.odd_id`
- `stock_reservations.sr_id`
- `steel_round_bars.srb_id`
- `ms_plates.msp_id`
- `wastrel_steel_round_bars.wsrb_id`
- `wastrel_ms_plates.wmsp_id`
- `timeline_srbs.tlsrb_id`
- `timeline_wsrbs.tlwsrb_id`
- `timeline_msps.tlmsp_id`
- `timeline_wmsps.tlwmsp_id`

# สรุป Foreign Key (FK)

- `locations.loc_parent_id` → `locations.loc_id`
- `orders.ord_cus_id` → `customers.customer_id`
- `order_details.odd_ord_id` → `orders.ord_id`
- `order_details.odd_mm_id` → `material_masters.mm_id`
- `stock_reservations.sr_ord_id` → `orders.ord_id`
- `stock_reservations.sr_odd_id` → `order_details.odd_id`
- `steel_round_bars.srb_mm_id` → `material_masters.mm_id`
- `steel_round_bars.srb_loc_id` → `locations.loc_id`
- `ms_plates.msp_mm_id` → `material_masters.mm_id`
- `ms_plates.msp_loc_id` → `locations.loc_id`
- `wastrel_steel_round_bars.wsrb_mm_id` → `material_masters.mm_id`
- `wastrel_steel_round_bars.wsrb_srb_id` → `steel_round_bars.srb_id`
- `wastrel_steel_round_bars.wsrb_loc_id` → `locations.loc_id`
- `wastrel_steel_round_bars.wsrb_ord_id` → `orders.ord_id`
- `wastrel_steel_round_bars.wsrb_odd_id` → `order_details.odd_id`
- `wastrel_ms_plates.wmsp_mm_id` → `material_masters.mm_id`
- `wastrel_ms_plates.wmsp_msp_id` → `ms_plates.msp_id`
- `wastrel_ms_plates.wmsp_loc_id` → `locations.loc_id`
- `wastrel_ms_plates.wmsp_ord_id` → `orders.ord_id`
- `wastrel_ms_plates.wmsp_odd_id` → `order_details.odd_id`
- `timeline_srbs.tlsrb_srb_id` → `steel_round_bars.srb_id`
- `timeline_srbs.tlsrb_ord_id` → `orders.ord_id`
- `timeline_srbs.tlsrb_odd_id` → `order_details.odd_id`
- `timeline_srbs.tlsrb_sr_id` → `stock_reservations.sr_id`
- `timeline_wsrbs.tlwsrb_wsrb_id` → `wastrel_steel_round_bars.wsrb_id`
- `timeline_wsrbs.tlwsrb_ord_id` → `orders.ord_id`
- `timeline_wsrbs.tlwsrb_odd_id` → `order_details.odd_id`
- `timeline_wsrbs.tlwsrb_sr_id` → `stock_reservations.sr_id`
- `timeline_msps.tlmsp_msp_id` → `ms_plates.msp_id`
- `timeline_msps.tlmsp_ord_id` → `orders.ord_id`
- `timeline_msps.tlmsp_odd_id` → `order_details.odd_id`
- `timeline_msps.tlmsp_sr_id` → `stock_reservations.sr_id`
- `timeline_wmsps.tlwmsp_wmsp_id` → `wastrel_ms_plates.wmsp_id`
- `timeline_wmsps.tlwmsp_ord_id` → `orders.ord_id`
- `timeline_wmsps.tlwmsp_odd_id` → `order_details.odd_id`
- `timeline_wmsps.tlwmsp_sr_id` → `stock_reservations.sr_id`

## หมายเหตุความสัมพันธ์พิเศษ

- `stock_reservations.sr_stock_id` เป็น polymorphic reference และไม่มี physical FK ใน PostgreSQL
- ตารางปลายทางของ `sr_stock_id` ถูกกำหนดโดย `stock_reservations.sr_stock_type`
- ค่าปลายทางที่เป็นไปได้: `steel_round_bars`, `wastrel_steel_round_bars`, `ms_plates`, `wastrel_ms_plates`
- `customers` เป็นตารางเดิมของระบบและถูกอ้างโดย `orders.ord_cus_id`
