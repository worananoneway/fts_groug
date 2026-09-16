export const reply_options = {
    fields: {
        id: 'sl_id',
        stock_type: 'sl_stock_type',
        stock_code: 'sl_stock_code',
        location: {
            // ตำแหน่งจัดเก็บ (ถ้ายังไม่ได้ระบุให้เป็น null ทั้งก้อน)
            $nullableBy: 'sl_loc_id',
            $fields: {
                id: 'sl_loc_id',
                code: 'sl_loc_code',
                name: 'sl_loc_name',
                type: 'sl_loc_type'
            }
        },
        scheduled_at: 'sl_scheduled_at',
        remark: 'sl_remark',
        status: 'sl_status',
        created_at: 'sl_created_at',
        updated_at: 'sl_updated_at',
        emp: {
            $nullableBy: 'sl_emp_id',
            $fields: {
                id: 'sl_emp_id'
            }
        }
    }
};
