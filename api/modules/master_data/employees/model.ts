export const reply_options = {
    fields: {
        id: 'emp_id',
        display_id: 'emp_display_id',
        prefix: 'emp_prefix',
        name: {
            $locale: {
                th: { $join: ['emp_firstname_th', 'emp_lastname_th'] },
                en: { $join: ['emp_firstname_en', 'emp_lastname_en'] }
            }
        },
        email: 'emp_email',
        phone: 'emp_phone',
        department_id: 'emp_department_id',
        position_id: 'emp_position_id',
        status: 'emp_status'
    }
};
