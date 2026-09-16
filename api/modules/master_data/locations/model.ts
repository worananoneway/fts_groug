export const reply_options = {
    fields: {
        id: 'loc_id',
        code: 'loc_code',
        name: 'loc_name',
        type: 'loc_type',
        parent: {
            // ตำแหน่งแม่ (ถ้าไม่มีให้เป็น null ทั้งก้อน)
            $nullableBy: 'loc_parent_id',
            $fields: {
                id: 'loc_parent_id',
                code: 'loc_parent_code',
                name: 'loc_parent_name',
                type: 'loc_parent_type'
            }
        },
        detail: 'loc_detail',
        status: 'loc_status',
        created_at: 'loc_created_at',
        updated_at: 'loc_updated_at'
    }
};
