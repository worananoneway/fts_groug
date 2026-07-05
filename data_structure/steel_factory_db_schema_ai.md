# Steel Factory Database Schema Context

```yaml
schema_version: v3_current_db
dialect: PostgreSQL
namespace: public
source: steel_factory_postgresql_schema_v3_current_db.sql
scope: steel_factory_module
tables:
  - name: material_masters
    columns:
      - mm_id
      - mm_code
      - mm_name
      - mm_shape_type
      - mm_grade
      - mm_status
      - mm_created_at
      - mm_updated_at
  - name: locations
    columns:
      - loc_id
      - loc_code
      - loc_name
      - loc_type
      - loc_parent_id
      - loc_detail
      - loc_status
      - loc_created_at
      - loc_updated_at
  - name: orders
    columns:
      - ord_id
      - ord_no
      - ord_cus_id
      - ord_date
      - ord_due_date
      - ord_status
      - ord_total_items
      - ord_remark
      - ord_created_by
      - ord_created_at
      - ord_updated_at
  - name: order_details
    columns:
      - odd_id
      - odd_ord_id
      - odd_mm_id
      - odd_shape_type
      - odd_required_length_mm
      - odd_required_width_mm
      - odd_required_thickness_mm
      - odd_required_diameter_mm
      - odd_quantity
      - odd_cut_quantity
      - odd_remaining_quantity
      - odd_allow_wastrel
      - odd_allow_rotation
      - odd_status
      - odd_remark
      - odd_created_at
      - odd_updated_at
  - name: stock_reservations
    columns:
      - sr_id
      - sr_ord_id
      - sr_odd_id
      - sr_stock_type
      - sr_stock_id
      - sr_reserved_quantity
      - sr_reserved_length_mm
      - sr_reserved_width_mm
      - sr_status
      - sr_reserved_at
      - sr_used_at
      - sr_created_at
      - sr_updated_at
  - name: steel_round_bars
    columns:
      - srb_id
      - srb_mm_id
      - srb_code
      - srb_diameter
      - srb_length
      - srb_quantity
      - srb_available_quantity
      - srb_loc_id
      - srb_location_type
      - srb_location
      - srb_status
      - srb_received_date
      - srb_remark
      - srb_created_at
      - srb_updated_at
  - name: ms_plates
    columns:
      - msp_id
      - msp_mm_id
      - msp_code
      - msp_length
      - msp_width
      - msp_thickness
      - msp_quantity
      - msp_available_quantity
      - msp_loc_id
      - msp_location_type
      - msp_location
      - msp_status
      - msp_received_date
      - msp_remark
      - msp_created_at
      - msp_updated_at
  - name: wastrel_steel_round_bars
    columns:
      - wsrb_id
      - wsrb_mm_id
      - wsrb_srb_id
      - wsrb_code
      - wsrb_diameter
      - wsrb_length
      - wsrb_quantity
      - wsrb_available_quantity
      - wsrb_loc_id
      - wsrb_location_type
      - wsrb_location
      - wsrb_status
      - wsrb_ord_id
      - wsrb_odd_id
      - wsrb_remark
      - wsrb_created_at
      - wsrb_updated_at
  - name: wastrel_ms_plates
    columns:
      - wmsp_id
      - wmsp_mm_id
      - wmsp_msp_id
      - wmsp_stock_code
      - wmsp_length
      - wmsp_width
      - wmsp_thickness
      - wmsp_quantity
      - wmsp_available_quantity
      - wmsp_loc_id
      - wmsp_location_type
      - wmsp_location
      - wmsp_status
      - wmsp_ord_id
      - wmsp_odd_id
      - wmsp_remark
      - wmsp_created_at
      - wmsp_updated_at
  - name: timeline_srbs
    columns:
      - tlsrb_id
      - tlsrb_srb_id
      - tlsrb_ord_id
      - tlsrb_odd_id
      - tlsrb_sr_id
      - tlsrb_event_type
      - tlsrb_quantity_change
      - tlsrb_length_before
      - tlsrb_length_after
      - tlsrb_status_before
      - tlsrb_status_after
      - tlsrb_location_before
      - tlsrb_location_after
      - tlsrb_event_at
      - tlsrb_remark
      - tlsrb_created_at
      - tlsrb_updated_at
  - name: timeline_wsrbs
    columns:
      - tlwsrb_id
      - tlwsrb_wsrb_id
      - tlwsrb_ord_id
      - tlwsrb_odd_id
      - tlwsrb_sr_id
      - tlwsrb_event_type
      - tlwsrb_quantity_change
      - tlwsrb_length_before
      - tlwsrb_length_after
      - tlwsrb_status_before
      - tlwsrb_status_after
      - tlwsrb_location_before
      - tlwsrb_location_after
      - tlwsrb_event_at
      - tlwsrb_remark
      - tlwsrb_created_at
      - tlwsrb_updated_at
  - name: timeline_msps
    columns:
      - tlmsp_id
      - tlmsp_msp_id
      - tlmsp_ord_id
      - tlmsp_odd_id
      - tlmsp_sr_id
      - tlmsp_event_type
      - tlmsp_quantity_change
      - tlmsp_length_before
      - tlmsp_width_before
      - tlmsp_length_after
      - tlmsp_width_after
      - tlmsp_status_before
      - tlmsp_status_after
      - tlmsp_location_before
      - tlmsp_location_after
      - tlmsp_event_at
      - tlmsp_remark
      - tlmsp_created_at
      - tlmsp_updated_at
  - name: timeline_wmsps
    columns:
      - tlwmsp_id
      - tlwmsp_wmsp_id
      - tlwmsp_ord_id
      - tlwmsp_odd_id
      - tlwmsp_sr_id
      - tlwmsp_event_type
      - tlwmsp_quantity_change
      - tlwmsp_length_before
      - tlwmsp_width_before
      - tlwmsp_length_after
      - tlwmsp_width_after
      - tlwmsp_status_before
      - tlwmsp_status_after
      - tlwmsp_location_before
      - tlwmsp_location_after
      - tlwmsp_event_at
      - tlwmsp_remark
      - tlwmsp_created_at
      - tlwmsp_updated_at

primary_keys:
  material_masters: [mm_id]
  locations: [loc_id]
  orders: [ord_id]
  order_details: [odd_id]
  stock_reservations: [sr_id]
  steel_round_bars: [srb_id]
  ms_plates: [msp_id]
  wastrel_steel_round_bars: [wsrb_id]
  wastrel_ms_plates: [wmsp_id]
  timeline_srbs: [tlsrb_id]
  timeline_wsrbs: [tlwsrb_id]
  timeline_msps: [tlmsp_id]
  timeline_wmsps: [tlwmsp_id]

foreign_keys:
  - from: locations.loc_parent_id
    to: locations.loc_id
  - from: orders.ord_cus_id
    to: customers.customer_id
  - from: order_details.odd_ord_id
    to: orders.ord_id
  - from: order_details.odd_mm_id
    to: material_masters.mm_id
  - from: stock_reservations.sr_ord_id
    to: orders.ord_id
  - from: stock_reservations.sr_odd_id
    to: order_details.odd_id
  - from: steel_round_bars.srb_mm_id
    to: material_masters.mm_id
  - from: steel_round_bars.srb_loc_id
    to: locations.loc_id
  - from: ms_plates.msp_mm_id
    to: material_masters.mm_id
  - from: ms_plates.msp_loc_id
    to: locations.loc_id
  - from: wastrel_steel_round_bars.wsrb_mm_id
    to: material_masters.mm_id
  - from: wastrel_steel_round_bars.wsrb_srb_id
    to: steel_round_bars.srb_id
  - from: wastrel_steel_round_bars.wsrb_loc_id
    to: locations.loc_id
  - from: wastrel_steel_round_bars.wsrb_ord_id
    to: orders.ord_id
  - from: wastrel_steel_round_bars.wsrb_odd_id
    to: order_details.odd_id
  - from: wastrel_ms_plates.wmsp_mm_id
    to: material_masters.mm_id
  - from: wastrel_ms_plates.wmsp_msp_id
    to: ms_plates.msp_id
  - from: wastrel_ms_plates.wmsp_loc_id
    to: locations.loc_id
  - from: wastrel_ms_plates.wmsp_ord_id
    to: orders.ord_id
  - from: wastrel_ms_plates.wmsp_odd_id
    to: order_details.odd_id
  - from: timeline_srbs.tlsrb_srb_id
    to: steel_round_bars.srb_id
  - from: timeline_srbs.tlsrb_ord_id
    to: orders.ord_id
  - from: timeline_srbs.tlsrb_odd_id
    to: order_details.odd_id
  - from: timeline_srbs.tlsrb_sr_id
    to: stock_reservations.sr_id
  - from: timeline_wsrbs.tlwsrb_wsrb_id
    to: wastrel_steel_round_bars.wsrb_id
  - from: timeline_wsrbs.tlwsrb_ord_id
    to: orders.ord_id
  - from: timeline_wsrbs.tlwsrb_odd_id
    to: order_details.odd_id
  - from: timeline_wsrbs.tlwsrb_sr_id
    to: stock_reservations.sr_id
  - from: timeline_msps.tlmsp_msp_id
    to: ms_plates.msp_id
  - from: timeline_msps.tlmsp_ord_id
    to: orders.ord_id
  - from: timeline_msps.tlmsp_odd_id
    to: order_details.odd_id
  - from: timeline_msps.tlmsp_sr_id
    to: stock_reservations.sr_id
  - from: timeline_wmsps.tlwmsp_wmsp_id
    to: wastrel_ms_plates.wmsp_id
  - from: timeline_wmsps.tlwmsp_ord_id
    to: orders.ord_id
  - from: timeline_wmsps.tlwmsp_odd_id
    to: order_details.odd_id
  - from: timeline_wmsps.tlwmsp_sr_id
    to: stock_reservations.sr_id

special_references:
  - from: stock_reservations.sr_stock_id
    discriminator: stock_reservations.sr_stock_type
    relation_type: polymorphic_reference
    physical_foreign_key: false
    targets:
      - steel_round_bars.srb_id
      - wastrel_steel_round_bars.wsrb_id
      - ms_plates.msp_id
      - wastrel_ms_plates.wmsp_id

external_dependencies:
  - table: customers
    referenced_column: customer_id
    referenced_by: orders.ord_cus_id
```
