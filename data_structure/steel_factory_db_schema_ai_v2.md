# Steel Factory Database Schema Context

> AI-oriented schema reference generated from the latest PostgreSQL DDL.

```yaml
schema_version: v3_current_db_ai_v2
dialect: PostgreSQL
namespace: public
source: steel_factory_postgresql_schema_v3_current_db.sql
scope: steel_factory_module

tables:
  - name: material_masters
    columns:
      - name: mm_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: mm_code
        type: 'varchar(50)'
        nullable: false
        not_null: true
        default: null
      - name: mm_name
        type: 'varchar(100)'
        nullable: false
        not_null: true
        default: null
      - name: mm_shape_type
        type: 'public."shape_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: mm_grade
        type: 'varchar(50)'
        nullable: true
        not_null: false
        default: null
      - name: mm_status
        type: 'public."status_enum"'
        nullable: false
        not_null: true
        default: '''Active''::public."status_enum"'
      - name: mm_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: mm_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
    unique_constraints:
      - [mm_code]
  - name: locations
    columns:
      - name: loc_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: loc_code
        type: 'varchar(50)'
        nullable: false
        not_null: true
        default: null
      - name: loc_name
        type: 'varchar(100)'
        nullable: false
        not_null: true
        default: null
      - name: loc_type
        type: 'public."location_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: loc_parent_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: locations.loc_id
      - name: loc_detail
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: loc_status
        type: 'public."status_enum"'
        nullable: false
        not_null: true
        default: '''Active''::public."status_enum"'
      - name: loc_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: loc_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
    unique_constraints:
      - [loc_code]
  - name: orders
    columns:
      - name: ord_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: ord_no
        type: 'varchar(50)'
        nullable: false
        not_null: true
        default: null
      - name: ord_cus_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: customers.customer_id
      - name: ord_date
        type: 'date'
        nullable: false
        not_null: true
        default: null
      - name: ord_due_date
        type: 'date'
        nullable: true
        not_null: false
        default: null
      - name: ord_status
        type: 'public."order_status_enum"'
        nullable: false
        not_null: true
        default: '''DRAFT''::public."order_status_enum"'
      - name: ord_total_items
        type: 'int4'
        nullable: true
        not_null: false
        default: null
      - name: ord_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: ord_created_by
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
      - name: ord_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: ord_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
    unique_constraints:
      - [ord_no]
  - name: order_details
    columns:
      - name: odd_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: odd_ord_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: odd_mm_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: material_masters.mm_id
      - name: odd_shape_type
        type: 'public."shape_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: odd_required_length_mm
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: odd_required_width_mm
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: odd_required_thickness_mm
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: odd_required_diameter_mm
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: odd_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: odd_cut_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '0'
      - name: odd_remaining_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '0'
      - name: odd_allow_wastrel
        type: 'bool'
        nullable: false
        not_null: true
        default: 'true'
      - name: odd_allow_rotation
        type: 'bool'
        nullable: false
        not_null: true
        default: 'false'
      - name: odd_status
        type: 'public."order_detail_status_enum"'
        nullable: false
        not_null: true
        default: '''PENDING''::public."order_detail_status_enum"'
      - name: odd_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: odd_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: odd_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
  - name: stock_reservations
    columns:
      - name: sr_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: sr_ord_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: sr_odd_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: order_details.odd_id
      - name: sr_stock_type
        type: 'public."reservation_stock_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: sr_stock_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
      - name: sr_reserved_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: sr_reserved_length_mm
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: sr_reserved_width_mm
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: sr_status
        type: 'public."reservation_status_enum"'
        nullable: false
        not_null: true
        default: '''RESERVED''::public."reservation_status_enum"'
      - name: sr_reserved_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: sr_used_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
      - name: sr_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: sr_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
  - name: steel_round_bars
    columns:
      - name: srb_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: srb_mm_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: material_masters.mm_id
      - name: srb_code
        type: 'varchar(50)'
        nullable: false
        not_null: true
        default: null
      - name: srb_diameter
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: srb_length
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: srb_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: srb_available_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: srb_loc_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: locations.loc_id
      - name: srb_location_type
        type: 'public."location_type_enum"'
        nullable: true
        not_null: false
        default: null
      - name: srb_location
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: srb_status
        type: 'public."stock_status_enum"'
        nullable: false
        not_null: true
        default: '''AVAILABLE''::public."stock_status_enum"'
      - name: srb_received_date
        type: 'date'
        nullable: true
        not_null: false
        default: null
      - name: srb_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: srb_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: srb_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
    unique_constraints:
      - [srb_code]
  - name: ms_plates
    columns:
      - name: msp_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: msp_mm_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: material_masters.mm_id
      - name: msp_code
        type: 'varchar(50)'
        nullable: false
        not_null: true
        default: null
      - name: msp_length
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: msp_width
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: msp_thickness
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: msp_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: msp_available_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: msp_loc_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: locations.loc_id
      - name: msp_location_type
        type: 'public."location_type_enum"'
        nullable: true
        not_null: false
        default: null
      - name: msp_location
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: msp_status
        type: 'public."stock_status_enum"'
        nullable: false
        not_null: true
        default: '''AVAILABLE''::public."stock_status_enum"'
      - name: msp_received_date
        type: 'date'
        nullable: true
        not_null: false
        default: null
      - name: msp_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: msp_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: msp_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
    unique_constraints:
      - [msp_code]
  - name: wastrel_steel_round_bars
    columns:
      - name: wsrb_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: wsrb_mm_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: material_masters.mm_id
      - name: wsrb_srb_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: steel_round_bars.srb_id
      - name: wsrb_code
        type: 'varchar(50)'
        nullable: false
        not_null: true
        default: null
      - name: wsrb_diameter
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: wsrb_length
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: wsrb_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: wsrb_available_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: wsrb_loc_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: locations.loc_id
      - name: wsrb_location_type
        type: 'public."location_type_enum"'
        nullable: true
        not_null: false
        default: null
      - name: wsrb_location
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: wsrb_status
        type: 'public."stock_status_enum"'
        nullable: false
        not_null: true
        default: '''AVAILABLE''::public."stock_status_enum"'
      - name: wsrb_ord_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: wsrb_odd_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: order_details.odd_id
      - name: wsrb_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: wsrb_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: wsrb_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
    unique_constraints:
      - [wsrb_code]
  - name: wastrel_ms_plates
    columns:
      - name: wmsp_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: wmsp_mm_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: material_masters.mm_id
      - name: wmsp_msp_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: ms_plates.msp_id
      - name: wmsp_stock_code
        type: 'varchar(50)'
        nullable: false
        not_null: true
        default: null
      - name: wmsp_length
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: wmsp_width
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: wmsp_thickness
        type: 'numeric(12, 3)'
        nullable: false
        not_null: true
        default: null
      - name: wmsp_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: wmsp_available_quantity
        type: 'int4'
        nullable: false
        not_null: true
        default: '1'
      - name: wmsp_loc_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: locations.loc_id
      - name: wmsp_location_type
        type: 'public."location_type_enum"'
        nullable: true
        not_null: false
        default: null
      - name: wmsp_location
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: wmsp_status
        type: 'public."stock_status_enum"'
        nullable: false
        not_null: true
        default: '''AVAILABLE''::public."stock_status_enum"'
      - name: wmsp_ord_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: wmsp_odd_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: order_details.odd_id
      - name: wmsp_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: wmsp_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: wmsp_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
    unique_constraints:
      - [wmsp_stock_code]
  - name: timeline_srbs
    columns:
      - name: tlsrb_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: tlsrb_srb_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: steel_round_bars.srb_id
      - name: tlsrb_ord_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: tlsrb_odd_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: order_details.odd_id
      - name: tlsrb_sr_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: stock_reservations.sr_id
      - name: tlsrb_event_type
        type: 'public."timeline_event_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: tlsrb_quantity_change
        type: 'int4'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_length_before
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_length_after
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_status_before
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_status_after
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_location_before
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_location_after
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_event_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlsrb_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlsrb_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlsrb_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
  - name: timeline_wsrbs
    columns:
      - name: tlwsrb_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: tlwsrb_wsrb_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: wastrel_steel_round_bars.wsrb_id
      - name: tlwsrb_ord_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: tlwsrb_odd_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: order_details.odd_id
      - name: tlwsrb_sr_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: stock_reservations.sr_id
      - name: tlwsrb_event_type
        type: 'public."timeline_event_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: tlwsrb_quantity_change
        type: 'int4'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_length_before
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_length_after
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_status_before
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_status_after
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_location_before
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_location_after
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_event_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlwsrb_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlwsrb_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlwsrb_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
  - name: timeline_msps
    columns:
      - name: tlmsp_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: tlmsp_msp_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: ms_plates.msp_id
      - name: tlmsp_ord_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: tlmsp_odd_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: order_details.odd_id
      - name: tlmsp_sr_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: stock_reservations.sr_id
      - name: tlmsp_event_type
        type: 'public."timeline_event_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: tlmsp_quantity_change
        type: 'int4'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_length_before
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_width_before
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_length_after
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_width_after
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_status_before
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_status_after
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_location_before
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_location_after
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_event_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlmsp_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlmsp_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlmsp_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null
  - name: timeline_wmsps
    columns:
      - name: tlwmsp_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: 'generate_unique_id()'
        primary_key: true
      - name: tlwmsp_wmsp_id
        type: 'varchar(20)'
        nullable: false
        not_null: true
        default: null
        foreign_key: true
        references: wastrel_ms_plates.wmsp_id
      - name: tlwmsp_ord_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: orders.ord_id
      - name: tlwmsp_odd_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: order_details.odd_id
      - name: tlwmsp_sr_id
        type: 'varchar(20)'
        nullable: true
        not_null: false
        default: null
        foreign_key: true
        references: stock_reservations.sr_id
      - name: tlwmsp_event_type
        type: 'public."timeline_event_type_enum"'
        nullable: false
        not_null: true
        default: null
      - name: tlwmsp_quantity_change
        type: 'int4'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_length_before
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_width_before
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_length_after
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_width_after
        type: 'numeric(12, 3)'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_status_before
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_status_after
        type: 'public."stock_status_enum"'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_location_before
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_location_after
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_event_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlwmsp_remark
        type: 'text'
        nullable: true
        not_null: false
        default: null
      - name: tlwmsp_created_at
        type: 'timestamptz'
        nullable: false
        not_null: true
        default: 'CURRENT_TIMESTAMP'
      - name: tlwmsp_updated_at
        type: 'timestamptz'
        nullable: true
        not_null: false
        default: null

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
    constraint: locations_loc_parent_id_fkey
  - from: orders.ord_cus_id
    to: customers.customer_id
    constraint: orders_ord_cus_id_fkey
  - from: order_details.odd_ord_id
    to: orders.ord_id
    constraint: order_details_odd_ord_id_fkey
  - from: order_details.odd_mm_id
    to: material_masters.mm_id
    constraint: order_details_odd_mm_id_fkey
  - from: stock_reservations.sr_ord_id
    to: orders.ord_id
    constraint: stock_reservations_sr_ord_id_fkey
  - from: stock_reservations.sr_odd_id
    to: order_details.odd_id
    constraint: stock_reservations_sr_odd_id_fkey
  - from: steel_round_bars.srb_mm_id
    to: material_masters.mm_id
    constraint: steel_round_bars_srb_mm_id_fkey
  - from: steel_round_bars.srb_loc_id
    to: locations.loc_id
    constraint: steel_round_bars_srb_loc_id_fkey
  - from: ms_plates.msp_mm_id
    to: material_masters.mm_id
    constraint: ms_plates_msp_mm_id_fkey
  - from: ms_plates.msp_loc_id
    to: locations.loc_id
    constraint: ms_plates_msp_loc_id_fkey
  - from: wastrel_steel_round_bars.wsrb_mm_id
    to: material_masters.mm_id
    constraint: wastrel_steel_round_bars_wsrb_mm_id_fkey
  - from: wastrel_steel_round_bars.wsrb_srb_id
    to: steel_round_bars.srb_id
    constraint: wastrel_steel_round_bars_wsrb_srb_id_fkey
  - from: wastrel_steel_round_bars.wsrb_loc_id
    to: locations.loc_id
    constraint: wastrel_steel_round_bars_wsrb_loc_id_fkey
  - from: wastrel_steel_round_bars.wsrb_ord_id
    to: orders.ord_id
    constraint: wastrel_steel_round_bars_wsrb_ord_id_fkey
  - from: wastrel_steel_round_bars.wsrb_odd_id
    to: order_details.odd_id
    constraint: wastrel_steel_round_bars_wsrb_odd_id_fkey
  - from: wastrel_ms_plates.wmsp_mm_id
    to: material_masters.mm_id
    constraint: wastrel_ms_plates_wmsp_mm_id_fkey
  - from: wastrel_ms_plates.wmsp_msp_id
    to: ms_plates.msp_id
    constraint: wastrel_ms_plates_wmsp_msp_id_fkey
  - from: wastrel_ms_plates.wmsp_loc_id
    to: locations.loc_id
    constraint: wastrel_ms_plates_wmsp_loc_id_fkey
  - from: wastrel_ms_plates.wmsp_ord_id
    to: orders.ord_id
    constraint: wastrel_ms_plates_wmsp_ord_id_fkey
  - from: wastrel_ms_plates.wmsp_odd_id
    to: order_details.odd_id
    constraint: wastrel_ms_plates_wmsp_odd_id_fkey
  - from: timeline_srbs.tlsrb_srb_id
    to: steel_round_bars.srb_id
    constraint: timeline_srbs_tlsrb_srb_id_fkey
  - from: timeline_srbs.tlsrb_ord_id
    to: orders.ord_id
    constraint: timeline_srbs_tlsrb_ord_id_fkey
  - from: timeline_srbs.tlsrb_odd_id
    to: order_details.odd_id
    constraint: timeline_srbs_tlsrb_odd_id_fkey
  - from: timeline_srbs.tlsrb_sr_id
    to: stock_reservations.sr_id
    constraint: timeline_srbs_tlsrb_sr_id_fkey
  - from: timeline_wsrbs.tlwsrb_wsrb_id
    to: wastrel_steel_round_bars.wsrb_id
    constraint: timeline_wsrbs_tlwsrb_wsrb_id_fkey
  - from: timeline_wsrbs.tlwsrb_ord_id
    to: orders.ord_id
    constraint: timeline_wsrbs_tlwsrb_ord_id_fkey
  - from: timeline_wsrbs.tlwsrb_odd_id
    to: order_details.odd_id
    constraint: timeline_wsrbs_tlwsrb_odd_id_fkey
  - from: timeline_wsrbs.tlwsrb_sr_id
    to: stock_reservations.sr_id
    constraint: timeline_wsrbs_tlwsrb_sr_id_fkey
  - from: timeline_msps.tlmsp_msp_id
    to: ms_plates.msp_id
    constraint: timeline_msps_tlmsp_msp_id_fkey
  - from: timeline_msps.tlmsp_ord_id
    to: orders.ord_id
    constraint: timeline_msps_tlmsp_ord_id_fkey
  - from: timeline_msps.tlmsp_odd_id
    to: order_details.odd_id
    constraint: timeline_msps_tlmsp_odd_id_fkey
  - from: timeline_msps.tlmsp_sr_id
    to: stock_reservations.sr_id
    constraint: timeline_msps_tlmsp_sr_id_fkey
  - from: timeline_wmsps.tlwmsp_wmsp_id
    to: wastrel_ms_plates.wmsp_id
    constraint: timeline_wmsps_tlwmsp_wmsp_id_fkey
  - from: timeline_wmsps.tlwmsp_ord_id
    to: orders.ord_id
    constraint: timeline_wmsps_tlwmsp_ord_id_fkey
  - from: timeline_wmsps.tlwmsp_odd_id
    to: order_details.odd_id
    constraint: timeline_wmsps_tlwmsp_odd_id_fkey
  - from: timeline_wmsps.tlwmsp_sr_id
    to: stock_reservations.sr_id
    constraint: timeline_wmsps_tlwmsp_sr_id_fkey

special_references:
  - from: stock_reservations.sr_stock_id
    discriminator: stock_reservations.sr_stock_type
    relation_type: polymorphic_reference
    physical_foreign_key: false
    nullable: false
    type: 'varchar(20)'
    targets:
      - steel_round_bars.srb_id
      - wastrel_steel_round_bars.wsrb_id
      - ms_plates.msp_id
      - wastrel_ms_plates.wmsp_id

external_dependencies:
  - table: customers
    referenced_column: customer_id
    referenced_by: orders.ord_cus_id
    expected_type: 'varchar(20)'
```
