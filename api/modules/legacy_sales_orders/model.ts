// Field name maps from the legacy ftsgroupstore MySQL schema (Express/warehouse
// system) to clean API field names. Column names in that database are terse
// legacy abbreviations (Thai program, ~2015), so we translate them here.

export const header_reply_options = {
    fields: {
        id: 'docloc',
        doc_number: 'docnum',
        location_code: 'loccod',
        area_id: 'areaid',
        people_code: 'people',
        doc_date: 'docdat',
        emp_id: 'emp_id',
        remark: 'remark',
        type: 'type',
        customer_ref: 'cusnam',
        customer_name: 'resolved_customer'
    }
};

export const item_reply_options = {
    fields: {
        id: 'autorun',
        doc_id: 'docloc',
        doc_number: 'docnum',
        product_code: 'stkcod',
        product_description: 'stkdes',
        quantity: 'trnqty',
        unit: 'tqucod',
        factor: 'tfactor',
        extended_quantity: 'xtrnqty',
        previous_stock_code: 'pstkcod',
        your_ref: 'youref',
        weight_unit: 'kg',
        weight: 'xkg',
        lot: 'lot',
        doc_date: 'docdat',
        doc_time: 'doctim'
    }
};
