import assert from 'node:assert/strict';
import test from 'node:test';

import { created_reply_options } from '@/api/modules/purchase_orders/model';
import { map_fields, reply_result } from '@/api/utils/controller_replys';
import { HttpStatus, HttpStatusCode } from '@/api/utils/shared_types';

const created_at = new Date('2026-07-10T16:34:44.540Z');

const rich_row = {
    po_id: 'PO-ID-001',
    po_number: 'PO-20260710003',
    po_customer_id: 'CUS-001',
    po_customer_display_id: 'C-0001',
    po_customer_name_th: 'ลูกค้าทดสอบ',
    po_customer_name_en: 'Test Customer',
    po_customer_tax_id: '1234567890123',
    po_customer_tax_type: 'company_tax_id',
    po_customer_contact_name: 'Customer Contact',
    po_customer_contact_phone: '020000000',
    po_customer_contact_fax: null,
    po_customer_contact_email: 'customer@example.com',
    po_customer_address: '99 Test Road',
    po_customer_subdistrict_id: 100101,
    po_customer_subdistrict_name_th: 'แขวงไทย',
    po_customer_subdistrict_name_en: 'English Subdistrict',
    po_customer_district_id: 1001,
    po_customer_district_name_th: 'เขตไทย',
    po_customer_district_name_en: 'English District',
    po_customer_province_id: 10,
    po_customer_province_name_th: 'จังหวัดไทย',
    po_customer_province_name_en: 'English Province',
    po_customer_postcode: '10100',
    po_customer_branch_type: 'head_office',
    po_customer_branch_number: '00000',
    po_due_date: '2026-08-09',
    po_remark: null,
    po_issue_date: '2026-07-10',
    po_ship_via: 'Truck',
    po_qt_on: 'QT-2026-001',
    po_shipping_terms: '30 days',
    po_tax_rate: 7,
    po_recipient_id: 'EMP-RECIPIENT',
    po_recipient_display_id: 'E-0001',
    po_recipient_prefix: 'Mr.',
    po_recipient_firstname_th: 'ผู้รับ',
    po_recipient_lastname_th: 'ภาษาไทย',
    po_recipient_firstname_en: 'Recipient',
    po_recipient_lastname_en: 'English',
    po_recipient_number_id: '1000000000001',
    po_recipient_department_id: 11,
    po_recipient_department_name_th: 'จัดซื้อ',
    po_recipient_department_name_en: 'Purchasing',
    po_recipient_position_id: 22,
    po_recipient_position_name_th: 'ผู้จัดการ',
    po_recipient_position_name_en: 'Manager',
    po_recipient_email: 'recipient@example.com',
    po_recipient_phone: '0810000000',
    po_comment: 'Call before delivery',
    po_status_sent_date: null,
    po_status_goods_received_date: '2026-07-15',
    po_status_paid_date: null,
    po_status_note: null,
    details: [{
        id: 'DETAIL-001',
        po_id: 'PO-ID-001',
        material_id: 'MAT-001',
        material_name: 'Steel Plate',
        material_shape_type: 'plate',
        required_length_mm: 1000,
        required_width_mm: 500,
        required_thickness_mm: 10,
        required_diameter_mm: null,
        cut_quantity: 2,
        remaining_quantity: 0,
        allow_wastrel: false,
        allow_rotation: true,
        status: 'Pending',
        remark: null,
        on: 1,
        unit: 'piece',
        description: 'Test detail',
        qty: 2,
        discount: 0,
        unit_price: 100,
        total: 200,
        created_at: '2026-07-10T00:00:00.000Z',
        updated_at: null,
        emp: {
            id: 'EMP-DETAIL',
            prefix: 'Mr.',
            name: 'Detail Employee'
        }
    }],
    po_subtotal: 200,
    po_tax_rate_calc: 7,
    po_tax_amount: 14,
    po_total_amount: 214,
    po_created_at: created_at,
    po_updated_at: null,
    po_emp_id: 'EMP-CREATOR',
    emp_prefix: 'Mr.',
    po_emp_fname_th: 'สมชาย',
    po_emp_lname_th: 'ใจดี',
    po_emp_fname_en: 'Somchai',
    po_emp_lname_en: 'Jaidee',
    po_status: 'Post Sent',
    po_project_id: 'PROJECT-001',
    po_project_display_id: 'P-0001',
    po_project_name_th: 'โครงการทดสอบ',
    po_project_name_en: 'Test Project',
    po_condition_paid: 30,
    po_delivery_subdistrict_id: 100102,
    po_delivery_subdistrict_name_th: 'แขวงจัดส่ง',
    po_delivery_subdistrict_name_en: 'Delivery Subdistrict',
    po_delivery_district_id: 1002,
    po_delivery_district_name_th: 'เขตจัดส่ง',
    po_delivery_district_name_en: 'Delivery District',
    po_delivery_province_id: 11,
    po_delivery_province_name_th: 'จังหวัดจัดส่ง',
    po_delivery_province_name_en: 'Delivery Province',
    po_approved_by_emp_id: 'EMP-APPROVER',
    po_approved_by_emp_prefix: 'Ms.',
    po_approved_by_emp_name_th: 'ผู้อนุมัติ ไทย',
    po_approved_by_emp_name_en: 'English Approver',
    po_purchasing_fname: 'Buyer',
    po_purchasing_lname: 'Name'
};

const top_level_fields = [
    'id',
    'number',
    'customer',
    'due_date',
    'remark',
    'issue_date',
    'ship_via',
    'qt_on',
    'shipping_terms',
    'tax_rate',
    'recipient',
    'comment',
    'status_date',
    'status_note',
    'details',
    'price_summary',
    'created_at',
    'updated_at',
    'emp',
    'status',
    'project',
    'condition_paid',
    'delivery_address',
    'approved_by',
    'purchasing_fname',
    'purchasing_lname'
].sort();

test('map_fields maps a rich GET row to the complete PurchaseOrder shape', () => {
    const original_row = structuredClone(rich_row);
    const mapped = map_fields(rich_row, {
        ...created_reply_options,
        language: 'en-US'
    });

    assert.deepEqual(Object.keys(mapped).sort(), top_level_fields);
    assert.equal(mapped.id, 'PO-ID-001');
    assert.deepEqual(mapped.customer, {
        id: 'CUS-001',
        display_id: 'C-0001',
        name_th: 'ลูกค้าทดสอบ',
        name_en: 'Test Customer',
        tax_id: '1234567890123',
        tax_type: 'company_tax_id',
        contact: {
            name: 'Customer Contact',
            phone: '020000000',
            fax: null,
            email: 'customer@example.com'
        },
        address: {
            detail: '99 Test Road',
            subdistrict: { id: 100101, name: 'English Subdistrict' },
            district: { id: 1001, name: 'English District' },
            province: { id: 10, name: 'English Province' },
            postcode: '10100'
        },
        branch_type: 'head_office',
        branch_number: '00000'
    });
    assert.deepEqual(mapped.status_date, {
        sent_date: null,
        goods_received_date: '2026-07-15',
        paid_date: null
    });
    assert.deepEqual(mapped.price_summary, {
        subtotal: 200,
        tax_rate: 7,
        tax: 14,
        total: 214
    });
    assert.deepEqual(mapped.emp, {
        id: 'EMP-CREATOR',
        prefix: 'Mr.',
        name: 'Somchai Jaidee'
    });
    assert.deepEqual(mapped.approved_by, {
        id: 'EMP-APPROVER',
        prefix: 'Ms.',
        name: 'English Approver'
    });
    assert.strictEqual(mapped.created_at, created_at);

    const details = mapped.details as Array<Record<string, unknown>>;
    assert.equal(details.length, 1);
    assert.equal(details[0].po_id, 'PO-ID-001');
    assert.equal(details[0].allow_wastrel, false);
    assert.equal(details[0].remaining_quantity, 0);
    assert.deepEqual(details[0].material, {
        id: 'MAT-001',
        name: 'Steel Plate',
        shape_type: 'plate'
    });
    assert.deepEqual(details[0].emp, {
        id: 'EMP-DETAIL',
        prefix: 'Mr.',
        name: 'Detail Employee'
    });
    assert.deepEqual(
        JSON.stringify(mapped).match(/"po_[^"]+"\s*:/g),
        ['"po_id":']
    );
    assert.deepEqual(rich_row, original_row);
});

test('map_fields selects Thai localized names when language starts with th', () => {
    const mapped = map_fields(rich_row, {
        ...created_reply_options,
        language: 'th-TH'
    });
    const customer = mapped.customer as Record<string, unknown>;
    const customer_address = customer.address as Record<string, unknown>;
    const customer_province = customer_address.province as Record<string, unknown>;
    const recipient = mapped.recipient as Record<string, unknown>;
    const department = recipient.department as Record<string, unknown>;
    const delivery = mapped.delivery_address as Record<string, unknown>;
    const delivery_province = delivery.province as Record<string, unknown>;

    assert.equal(customer_province.name, 'จังหวัดไทย');
    assert.equal(department.name, 'จัดซื้อ');
    assert.deepEqual(mapped.emp, {
        id: 'EMP-CREATOR',
        prefix: 'Mr.',
        name: 'สมชาย ใจดี'
    });
    assert.equal(delivery_province.name, 'จังหวัดจัดส่ง');
    assert.deepEqual(mapped.approved_by, {
        id: 'EMP-APPROVER',
        prefix: 'Ms.',
        name: 'ผู้อนุมัติ ไทย'
    });
});

test('OK maps every row and returns the mapped array directly in details', () => {
    const second_row = {
        ...rich_row,
        po_id: 'PO-ID-002',
        po_number: 'PO-20260710004'
    };
    const reply = reply_result(
        'Purchase Orders',
        HttpStatusCode.OK,
        null,
        [rich_row, second_row],
        { ...created_reply_options, language: 'en-US' }
    );
    const details = reply.details as Array<Record<string, unknown>>;

    assert.equal(reply.status, HttpStatus.OK);
    assert.equal(reply.statuscode, HttpStatusCode.OK);
    assert.equal(details.length, 2);
    assert.equal(details[0].id, 'PO-ID-001');
    assert.equal(details[1].id, 'PO-ID-002');
    assert.equal(Object.keys(details[0]).some(field => field.startsWith('po_')), false);
});

test('CREATED maps RETURNING data with aliases and sparse model defaults', () => {
    const row = {
        po_id: 'PO-ID-CREATED',
        po_number: 'PO-20260710005',
        po_cus_id: 'CUS-001',
        po_due_date: '2026-08-09',
        po_remark: null,
        po_issue_date: '2026-07-10',
        po_ship_via: 'Truck',
        po_qt_on: 'QT-2026-001',
        po_shipping_terms: '30 days',
        po_tax_rate: 7,
        po_recipient_id: 'EMP-RECIPIENT',
        po_comment: null,
        po_status_sent_date: null,
        po_status_goods_received_: null,
        po_status_paid_date: null,
        po_status_note: null,
        po_emp_id: null,
        po_created_at: created_at,
        po_updated_at: null,
        po_status: 'Post Sent',
        po_project_id: 'PROJECT-001',
        po_condition_paid: 30,
        po_delivery_province_id: 10,
        po_delivery_district_id: 1001,
        po_delivery_subdistrict_id: 100101,
        po_approved_by_emp_id: 'EMP-APPROVER',
        po_purchasing_fname: 'Buyer',
        po_purchasing_lname: 'Name'
    };
    const original_row = { ...row };
    const reply = reply_result(
        'Purchase Orders',
        HttpStatusCode.CREATED,
        null,
        [row],
        { ...created_reply_options, language: 'en-US' }
    );
    const details = reply.details as Record<string, unknown>;
    const customer = details.customer as Record<string, unknown>;
    const recipient = details.recipient as Record<string, unknown>;
    const project = details.project as Record<string, unknown>;
    const delivery = details.delivery_address as Record<string, unknown>;
    const delivery_province = delivery.province as Record<string, unknown>;

    assert.equal(reply.status, HttpStatus.CREATED);
    assert.equal(reply.statuscode, HttpStatusCode.CREATED);
    assert.equal(details.message, 'Purchase Orders created successfully.');
    assert.equal(details.id, 'PO-ID-CREATED');
    assert.equal(customer.id, 'CUS-001');
    assert.equal(customer.display_id, null);
    assert.equal(recipient.id, 'EMP-RECIPIENT');
    assert.deepEqual(details.status_date, {
        sent_date: null,
        goods_received_date: null,
        paid_date: null
    });
    assert.deepEqual(details.details, []);
    assert.deepEqual(details.price_summary, {
        subtotal: 0,
        tax_rate: 7,
        tax: 0,
        total: 0
    });
    assert.equal(details.emp, null);
    assert.deepEqual(project, {
        id: 'PROJECT-001',
        display_id: null,
        name_en: null,
        name_th: null
    });
    assert.deepEqual(delivery_province, { id: 10, name: null });
    assert.strictEqual(details.created_at, created_at);
    assert.equal(Object.keys(details).some(field => field.startsWith('po_')), false);
    assert.deepEqual(row, original_row);
});

test('CREATED without a row returns only the success message', () => {
    const reply = reply_result(
        'Purchase Orders',
        HttpStatusCode.CREATED,
        null,
        [],
        { ...created_reply_options, language: 'en-US' }
    );

    assert.deepEqual(reply.details, {
        message: 'Purchase Orders created successfully.'
    });
});

test('OK and CREATED preserve raw rows when no format is supplied', () => {
    const rows = [{ po_id: 'RAW-ID' }];
    const ok_reply = reply_result(
        'Purchase Orders',
        HttpStatusCode.OK,
        null,
        rows
    );
    const created_reply = reply_result(
        'Purchase Orders',
        HttpStatusCode.CREATED,
        null,
        rows
    );

    assert.strictEqual(ok_reply.details, rows);
    assert.deepEqual(created_reply.details, {
        po_id: 'RAW-ID',
        message: 'Purchase Orders created successfully.'
    });
});
