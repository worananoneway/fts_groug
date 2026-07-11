export const reply_options = {
    province: {
        fields: {
            id: 'province_id',
            name: {
                $locale: {
                    th: 'province_name_th',
                    en: 'province_name_en'
                }
            },
            geography: 'province_geography_id'
        }
    },
    district: {
        fields: {
            id: 'district_id',
            name: {
                $locale: {
                    th: 'district_name_th',
                    en: 'district_name_en'
                }
            },
            province_id: 'district_province_id'
        }
    },
    subdistrict: {
        fields: {
            id: 'subdistrict_id',
            name: {
                $locale: {
                    th: 'subdistrict_name_th',
                    en: 'subdistrict_name_en'
                }
            },
            district_id: 'subdistrict_district_id',
            zip_code: 'subdistrict_zip_code'
        }
    }
};
