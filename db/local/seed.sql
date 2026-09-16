-- ============================================================================
--  ข้อมูลตัวอย่างสำหรับรันในเครื่อง — รันซ้ำได้ (ON CONFLICT DO NOTHING)
-- ============================================================================

INSERT INTO public.provinces (province_id, province_name_th, province_name_en, province_geography_id) VALUES
    (10, 'กรุงเทพมหานคร', 'Bangkok', 2),
    (20, 'ชลบุรี', 'Chon Buri', 5),
    (74, 'สมุทรสาคร', 'Samut Sakhon', 2)
ON CONFLICT (province_id) DO NOTHING;

INSERT INTO public.districts (district_id, district_name_th, district_name_en, district_province_id) VALUES
    (1003, 'บางรัก', 'Bang Rak', 10),
    (2004, 'ศรีราชา', 'Si Racha', 20),
    (7401, 'เมืองสมุทรสาคร', 'Mueang Samut Sakhon', 74)
ON CONFLICT (district_id) DO NOTHING;

INSERT INTO public.subdistricts (subdistrict_id, subdistrict_name_th, subdistrict_name_en, subdistrict_district_id, subdistrict_zip_code) VALUES
    (100301, 'สีลม', 'Si Lom', 1003, '10500'),
    (200401, 'สุรศักดิ์', 'Surasak', 2004, '20110'),
    (740101, 'มหาชัย', 'Maha Chai', 7401, '74000')
ON CONFLICT (subdistrict_id) DO NOTHING;

INSERT INTO public.employees (emp_id, emp_display_id, emp_prefix, emp_firstname_th, emp_lastname_th, emp_firstname_en, emp_lastname_en, emp_email, emp_phone, emp_status) VALUES
    ('EMP0000000000000001', 'EMP000001', 'Mr.', 'วรนันท์', 'ใจดี', 'Woranan', 'Jaidee', 'woranan@example.com', '021234567', 'Active'),
    ('EMP0000000000000002', 'EMP000002', 'Ms.', 'ปิยะดา', 'สุขใจ', 'Piyada', 'Sukjai', 'piyada@example.com', '021234568', 'Active')
ON CONFLICT (emp_id) DO NOTHING;

INSERT INTO public.customers (
    customer_id, customer_display_id, customer_name_th, customer_name_en, customer_tax_id, customer_tax_type,
    customer_contact_name, customer_contact_phone, customer_contact_email, customer_address,
    customer_subdistrict_id, customer_district_id, customer_province_id, customer_postcode,
    customer_branch_type, customer_branch_number, customer_emp_id, customer_status
) VALUES
    ('CUS0000000000000001', 'CUS000001', 'บริษัท เหล็กไทยรุ่งเรือง จำกัด', 'Thai Steel Rungruang Co., Ltd.', '0105551234567', 'company_tax_id',
     'คุณสมศักดิ์', '0812345678', 'somsak@thaisteel.co.th', '99/1 ถนนสีลม', 100301, 1003, 10, '10500', 'head_office', '00000', 'EMP0000000000000001', 'Active'),
    ('CUS0000000000000002', 'CUS000002', 'บริษัท ศรีราชาแมชชีนเนอรี่ จำกัด', 'Si Racha Machinery Co., Ltd.', '0205552345678', 'company_tax_id',
     'คุณวิชัย', '0823456789', 'wichai@srmachine.co.th', '55 หมู่ 3 ถนนสุขุมวิท', 200401, 2004, 20, '20110', 'branch', '00001', 'EMP0000000000000001', 'Active'),
    ('CUS0000000000000003', 'CUS000003', 'โรงกลึงมหาชัย', 'Maha Chai Machine Shop', '3740012345678', 'personal_id',
     'คุณอนันต์', '0834567890', 'anan@mahachai.com', '12 ซอยโรงงาน', 740101, 7401, 74, '74000', 'head_office', '00000', 'EMP0000000000000002', 'Active')
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO public.material_masters (mm_id, mm_code, mm_name, mm_shape_type, mm_grade, mm_status) VALUES
    ('MM00000000000000RB01', 'RB-SS400', 'เพลาเหล็กกลม SS400', 'Round_bar', 'SS400', 'Active'),
    ('MM00000000000000RB02', 'RB-S45C', 'เพลาเหล็กกลม S45C', 'Round_bar', 'S45C', 'Active'),
    ('MM00000000000000PL01', 'PL-SS400', 'เหล็กแผ่น SS400', 'Ms_plate', 'SS400', 'Active'),
    ('MM00000000000000PL02', 'PL-A36', 'เหล็กแผ่น ASTM A36', 'Ms_plate', 'A36', 'Active')
ON CONFLICT (mm_id) DO NOTHING;

INSERT INTO public.locations (loc_id, loc_code, loc_name, loc_type, loc_parent_id, loc_detail, loc_status) VALUES
    ('LOC00000000000000001', 'WH-1', 'คลังหลัก', 'WAREHOUSE', NULL, 'คลังเหล็กหลักหน้าโรงงาน', 'Active'),
    ('LOC00000000000000002', 'ZONE-A', 'โซน A', 'ZONE', 'LOC00000000000000001', 'โซนเหล็กแผ่น', 'Active'),
    ('LOC00000000000000003', 'ZONE-B', 'โซน B', 'ZONE', 'LOC00000000000000001', 'โซนเพลาเหล็กกลม', 'Active')
ON CONFLICT (loc_id) DO NOTHING;

INSERT INTO public.ms_plates (msp_id, msp_mm_id, msp_code, msp_length, msp_width, msp_thickness, msp_quantity, msp_available_quantity, msp_loc_id, msp_location_type, msp_location, msp_status, msp_received_date, msp_remark) VALUES
    ('MSP0000000000000001', 'MM00000000000000PL01', 'MSP-2440x1220-6',  2440, 1220,  6, 20, 18, 'LOC00000000000000002', 'ZONE', 'โซน A', 'Active', CURRENT_DATE - 30, NULL),
    ('MSP0000000000000002', 'MM00000000000000PL01', 'MSP-2440x1220-9',  2440, 1220,  9, 15, 15, 'LOC00000000000000002', 'ZONE', 'โซน A', 'Active', CURRENT_DATE - 25, NULL),
    ('MSP0000000000000003', 'MM00000000000000PL01', 'MSP-3000x1500-12', 3000, 1500, 12, 10,  8, 'LOC00000000000000002', 'ZONE', 'โซน A', 'Active', CURRENT_DATE - 20, NULL),
    ('MSP0000000000000004', 'MM00000000000000PL02', 'MSP-2440x1220-15', 2440, 1220, 15,  8,  8, 'LOC00000000000000002', 'RACK', 'ชั้นวาง 1', 'Active', CURRENT_DATE - 15, NULL),
    ('MSP0000000000000005', 'MM00000000000000PL02', 'MSP-6000x1500-20', 6000, 1500, 20,  5,  4, 'LOC00000000000000002', 'ZONE', 'โซน B', 'Active', CURRENT_DATE - 10, 'แผ่นหนาพิเศษ'),
    ('MSP0000000000000006', 'MM00000000000000PL02', 'MSP-2440x1220-25', 2440, 1220, 25,  4,  4, 'LOC00000000000000002', 'SHELF', 'ชั้นวาง 2', 'Active', CURRENT_DATE - 5, NULL)
ON CONFLICT (msp_id) DO NOTHING;

INSERT INTO public.steel_round_bars (srb_id, srb_mm_id, srb_code, srb_diameter, srb_length, srb_quantity, srb_available_quantity, srb_loc_id, srb_location_type, srb_location, srb_status, srb_received_date, srb_remark) VALUES
    ('SRB0000000000000001', 'MM00000000000000RB01', 'SRB-D25-6000', 25, 6000, 30, 28, 'LOC00000000000000003', 'ZONE', 'โซน B', 'Active', CURRENT_DATE - 28, NULL),
    ('SRB0000000000000002', 'MM00000000000000RB01', 'SRB-D32-6000', 32, 6000, 25, 25, 'LOC00000000000000003', 'ZONE', 'โซน B', 'Active', CURRENT_DATE - 24, NULL),
    ('SRB0000000000000003', 'MM00000000000000RB01', 'SRB-D40-6000', 40, 6000, 20, 16, 'LOC00000000000000003', 'ZONE', 'โซน B', 'Active', CURRENT_DATE - 18, NULL),
    ('SRB0000000000000004', 'MM00000000000000RB02', 'SRB-D50-6000', 50, 6000, 12, 12, 'LOC00000000000000003', 'RACK', 'ชั้นวาง 3', 'Active', CURRENT_DATE - 12, NULL),
    ('SRB0000000000000005', 'MM00000000000000RB02', 'SRB-D65-6000', 65, 6000,  8,  6, 'LOC00000000000000003', 'RACK', 'ชั้นวาง 3', 'Active', CURRENT_DATE - 6, 'สั่งพิเศษ'),
    ('SRB0000000000000006', 'MM00000000000000RB02', 'SRB-D80-6000', 80, 6000,  5,  5, 'LOC00000000000000003', 'ZONE', 'พื้นที่นอกอาคาร', 'Active', CURRENT_DATE - 2, NULL)
ON CONFLICT (srb_id) DO NOTHING;

INSERT INTO public.wastrel_ms_plates (wmsp_id, wmsp_mm_id, wmsp_msp_id, wmsp_stock_code, wmsp_length, wmsp_width, wmsp_thickness, wmsp_quantity, wmsp_available_quantity, wmsp_loc_id, wmsp_location_type, wmsp_location, wmsp_status, wmsp_remark) VALUES
    ('WMSP000000000000001', 'MM00000000000000PL01', 'MSP0000000000000001', 'WMSP-1200x600-6', 1200, 600,  6, 3, 3, 'LOC00000000000000002', 'ZONE', 'โซน A', 'Active', 'เศษจากงานตัดเดือนก่อน'),
    ('WMSP000000000000002', 'MM00000000000000PL01', 'MSP0000000000000003', 'WMSP-900x500-12',  900, 500, 12, 2, 2, 'LOC00000000000000002', 'ZONE', 'โซน A', 'Active', NULL),
    ('WMSP000000000000003', 'MM00000000000000PL02', 'MSP0000000000000005', 'WMSP-1500x400-20', 1500, 400, 20, 1, 1, 'LOC00000000000000002', 'SHELF', 'ชั้นวาง 2', 'Active', NULL)
ON CONFLICT (wmsp_id) DO NOTHING;

INSERT INTO public.wastrel_steel_round_bars (wsrb_id, wsrb_mm_id, wsrb_srb_id, wsrb_code, wsrb_diameter, wsrb_length, wsrb_quantity, wsrb_available_quantity, wsrb_loc_id, wsrb_location_type, wsrb_location, wsrb_status, wsrb_remark) VALUES
    ('WSRB000000000000001', 'MM00000000000000RB01', 'SRB0000000000000001', 'WSRB-D25-1800', 25, 1800, 4, 4, 'LOC00000000000000003', 'ZONE', 'โซน B', 'Active', 'เศษจากงานตัดเดือนก่อน'),
    ('WSRB000000000000002', 'MM00000000000000RB01', 'SRB0000000000000003', 'WSRB-D40-2200', 40, 2200, 2, 2, 'LOC00000000000000003', 'ZONE', 'โซน B', 'Active', NULL),
    ('WSRB000000000000003', 'MM00000000000000RB02', 'SRB0000000000000005', 'WSRB-D65-950',  65,  950, 1, 1, 'LOC00000000000000003', 'RACK', 'ชั้นวาง 3', 'Active', NULL)
ON CONFLICT (wsrb_id) DO NOTHING;

INSERT INTO public.projects (project_id, project_display_id, project_name_th, project_name_en, project_contact_name, project_contact_phone, project_contact_email, project_customer_id, project_budget, project_closing_date, project_note, project_manager_id, project_status, project_emp_id) VALUES
    ('PJ00000000000000001', 'PJ25000001', 'งานตัดเหล็กโครงหลังคาโรงงาน A', 'Factory A Roof Structure', 'คุณสมศักดิ์', '0812345678', 'somsak@thaisteel.co.th', 'CUS0000000000000001', 1500000.00, CURRENT_DATE + 60, 'งานเร่ง ส่งเป็นงวด', 'EMP0000000000000001', 'Opened', 'EMP0000000000000001'),
    ('PJ00000000000000002', 'PJ25000002', 'งานเพลาเหล็กเครื่องจักรศรีราชา', 'Si Racha Machine Shafts', 'คุณวิชัย', '0823456789', 'wichai@srmachine.co.th', 'CUS0000000000000002', 850000.00, CURRENT_DATE + 30, NULL, 'EMP0000000000000002', 'Waiting - PO', 'EMP0000000000000001')
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO public.purchase_orders (po_id, po_number, po_cus_id, po_issue_date, po_due_date, po_tax_rate, po_status, po_project_id, po_recipient_id, po_emp_id, po_ship_via, po_qt_on, po_shipping_terms, po_comment, po_remark, po_delivery_province_id, po_delivery_district_id, po_delivery_subdistrict_id) VALUES
    ('PO00000000000000001', 'PO260900001', 'CUS0000000000000001', CURRENT_DATE - 7, CURRENT_DATE + 14, 7, 'Post Sent', 'PJ00000000000000001', 'EMP0000000000000001', 'EMP0000000000000001', 'รถบรรทุก 6 ล้อ', 'QT-2609-001', 'ส่งหน้าโรงงาน', 'ตัดตามแบบที่แนบ', 'งานโครงหลังคา', 10, 1003, 100301),
    ('PO00000000000000002', 'PO260900002', 'CUS0000000000000002', CURRENT_DATE - 4, CURRENT_DATE + 21, 7, 'Post Sent', 'PJ00000000000000002', 'EMP0000000000000002', 'EMP0000000000000001', 'รถกระบะ', 'QT-2609-002', 'ลูกค้ามารับเอง', NULL, 'งานเพลาเครื่องจักร', 20, 2004, 200401),
    ('PO00000000000000003', 'PO260900003', 'CUS0000000000000003', CURRENT_DATE - 1, CURRENT_DATE + 7, 7, 'Post Sent', NULL, 'EMP0000000000000001', 'EMP0000000000000002', 'รถบรรทุก 6 ล้อ', 'QT-2609-003', 'ส่งหน้าโรงงาน', NULL, 'งานด่วน', 74, 7401, 740101)
ON CONFLICT (po_id) DO NOTHING;

INSERT INTO public.purchase_orders_details (
    podetail_id, podetail_po_id, podetail_mm_id,
    podetail_required_length_mm, podetail_required_width_mm, podetail_required_thickness_mm, podetail_required_diameter_mm,
    podetail_cut_quantity, podetail_remaining_quantity, podetail_allow_wastrel, podetail_allow_rotation,
    podetail_status, podetail_remark, podetail_on, podetail_unit, podetail_description, podetail_qty,
    podetail_unit_price, podetail_discount, podetail_emp_id
) VALUES
    ('POD0000000000000001', 'PO00000000000000001', 'MM00000000000000PL01',  800, 400,  6, NULL, 10, 10, true, true,  'Pending', NULL, 1, 'PC', 'แผ่นเหล็ก SS400 800x400x6', 10, 1250.00, 0, 'EMP0000000000000001'),
    ('POD0000000000000002', 'PO00000000000000001', 'MM00000000000000PL01', 1200, 600,  9, NULL,  6,  6, true, false, 'Pending', 'ห้ามหมุนชิ้นงาน', 2, 'PC', 'แผ่นเหล็ก SS400 1200x600x9', 6, 2400.00, 0, 'EMP0000000000000001'),
    ('POD0000000000000003', 'PO00000000000000001', 'MM00000000000000PL02', 1500, 500, 15, NULL,  4,  4, true, true,  'Pending', NULL, 3, 'PC', 'แผ่นเหล็ก A36 1500x500x15', 4, 5600.00, 0, 'EMP0000000000000001'),
    ('POD0000000000000004', 'PO00000000000000002', 'MM00000000000000RB01', 1500, NULL, NULL, 25, 12, 12, true, false, 'Pending', NULL, 1, 'PC', 'เพลากลม SS400 D25 ยาว 1500', 12,  980.00, 0, 'EMP0000000000000001'),
    ('POD0000000000000005', 'PO00000000000000002', 'MM00000000000000RB01', 2000, NULL, NULL, 40,  6,  6, true, false, 'Pending', NULL, 2, 'PC', 'เพลากลม SS400 D40 ยาว 2000', 6, 2450.00, 0, 'EMP0000000000000001'),
    ('POD0000000000000006', 'PO00000000000000002', 'MM00000000000000RB02',  950, NULL, NULL, 65,  3,  3, true, false, 'Pending', 'ใช้เศษได้', 3, 'PC', 'เพลากลม S45C D65 ยาว 950', 3, 4200.00, 0, 'EMP0000000000000002'),
    ('POD0000000000000007', 'PO00000000000000003', 'MM00000000000000PL01',  600, 300,  6, NULL, 20, 20, true, true,  'Pending', 'งานด่วน', 1, 'PC', 'แผ่นเหล็ก SS400 600x300x6', 20, 750.00, 0, 'EMP0000000000000002'),
    ('POD0000000000000008', 'PO00000000000000003', 'MM00000000000000RB02', 1200, NULL, NULL, 50,  8,  8, true, false, 'Pending', NULL, 2, 'PC', 'เพลากลม S45C D50 ยาว 1200', 8, 1850.00, 0, 'EMP0000000000000002')
ON CONFLICT (podetail_id) DO NOTHING;
