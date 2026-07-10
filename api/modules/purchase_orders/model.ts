import type { ReplyFormat } from '@/api/utils/controller_replys';

class NamedEntity {
    constructor(
        public id: number | null,
        public name: string | null
    ) {
        this.id = id;
        this.name = name;
    }
}

export class Subdistrict extends NamedEntity {}

export class District extends NamedEntity {}

export class Province extends NamedEntity {}

export class Address {
    constructor(
        public detail: string | null,
        public subdistrict: Subdistrict | null,
        public district: District | null,
        public province: Province | null,
        public postcode: string | null
    ) {
        this.detail = detail;
        this.subdistrict = subdistrict;
        this.district = district;
        this.province = province;
        this.postcode = postcode;
    }
}

export class DeliveryAddress {
    constructor(
        public subdistrict: Subdistrict | null,
        public district: District | null,
        public province: Province | null
    ) {
        this.subdistrict = subdistrict;
        this.district = district;
        this.province = province;
    }
}

export class Contact {
    constructor(
        public name: string | null,
        public phone: string | null,
        public fax: string | null,
        public email: string | null
    ) {
        this.name = name;
        this.phone = phone;
        this.fax = fax;
        this.email = email;
    }
}

export class Emp {
    constructor(
        public id: string | null,
        public prefix: string | null,
        public name: string | null
    ) {
        this.id = id;
        this.prefix = prefix;
        this.name = name;
    }
}

export class Department extends NamedEntity {}

export class Position extends NamedEntity {}

export class Recipient {
    constructor(
        public id: string | null,
        public display_id: string | null,
        public prefix: string | null,
        public firstname_th: string | null,
        public lastname_th: string | null,
        public firstname_en: string | null,
        public lastname_en: string | null,
        public number_id: string | null,
        public department: Department | null,
        public position: Position | null,
        public email: string | null,
        public phone: string | null
    ) {
        this.id = id;
        this.display_id = display_id;
        this.prefix = prefix;
        this.firstname_th = firstname_th;
        this.lastname_th = lastname_th;
        this.firstname_en = firstname_en;
        this.lastname_en = lastname_en;
        this.number_id = number_id;
        this.department = department;
        this.position = position;
        this.email = email;
        this.phone = phone;
    }
}

export class StatusDate {
    constructor(
        public sent_date: string | null,
        public goods_received_date: string | null,
        public paid_date: string | null
    ) {
        this.sent_date = sent_date;
        this.goods_received_date = goods_received_date;
        this.paid_date = paid_date;
    }
}

export class Material {
    constructor(
        public id: string,
        public name: string | null,
        public shape_type: string | null
    ) {
        this.id = id;
        this.name = name;
        this.shape_type = shape_type;
    }
}

export class Detail {
    constructor(
        public id: string,
        public po_id: string,
        public material: Material,
        public required_length_mm: number,
        public required_width_mm: number | null,
        public required_thickness_mm: number | null,
        public required_diameter_mm: number | null,
        public cut_quantity: number,
        public remaining_quantity: number,
        public allow_wastrel: boolean,
        public allow_rotation: boolean,
        public status: string,
        public remark: string | null,
        public on: number | null,
        public unit: string | null,
        public description: string | null,
        public qty: number | null,
        public discount: number | null,
        public unit_price: number | null,
        public total: number,
        public created_at: string,
        public updated_at: string | null,
        public emp: Emp
    ) {
        this.id = id;
        this.po_id = po_id;
        this.material = material;
        this.required_length_mm = required_length_mm;
        this.required_width_mm = required_width_mm;
        this.required_thickness_mm = required_thickness_mm;
        this.required_diameter_mm = required_diameter_mm;
        this.cut_quantity = cut_quantity;
        this.remaining_quantity = remaining_quantity;
        this.allow_wastrel = allow_wastrel;
        this.allow_rotation = allow_rotation;
        this.status = status;
        this.remark = remark;
        this.on = on;
        this.unit = unit;
        this.description = description;
        this.qty = qty;
        this.discount = discount;
        this.unit_price = unit_price;
        this.total = total;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.emp = emp;
    }
}

export class PriceSummary {
    constructor(
        public subtotal: number,
        public tax_rate: number,
        public tax: number,
        public total: number
    ) {
        this.subtotal = subtotal;
        this.tax_rate = tax_rate;
        this.tax = tax;
        this.total = total;
    }
}

export class Project {
    constructor(
        public id: string | null,
        public display_id: string | null,
        public name_en: string | null,
        public name_th: string | null
    ) {
        this.id = id;
        this.display_id = display_id;
        this.name_en = name_en;
        this.name_th = name_th;
    }
}

export class Customer {
    constructor(
        public id: string,
        public display_id: string | null,
        public name_th: string | null,
        public name_en: string | null,
        public tax_id: string | null,
        public tax_type: string | null,
        public contact: Contact | null,
        public address: Address | null,
        public branch_type: string | null,
        public branch_number: string | null
    ) {
        this.id = id;
        this.display_id = display_id;
        this.name_th = name_th;
        this.name_en = name_en;
        this.tax_id = tax_id;
        this.tax_type = tax_type;
        this.contact = contact;
        this.address = address;
        this.branch_type = branch_type;
        this.branch_number = branch_number;
    }
}

export class PurchaseOrder {
    constructor(
        public id: string,
        public number: string,
        public customer: Customer,
        public due_date: string | null,
        public remark: string | null,
        public issue_date: string | null,
        public ship_via: string | null,
        public qt_on: string | null,
        public shipping_terms: string | null,
        public tax_rate: number,
        public recipient: Recipient | null,
        public comment: string | null,
        public status_date: StatusDate,
        public status_note: string | null,
        public details: Detail[],
        public price_summary: PriceSummary,
        public created_at: string,
        public updated_at: string | null,
        public emp: Emp | null,
        public status: string,
        public project: Project | null,
        public condition_paid: number | null,
        public delivery_address: DeliveryAddress,
        public approved_by: Emp | null,
        public purchasing_fname: string | null,
        public purchasing_lname: string | null
    ) {
        this.id = id;
        this.number = number;
        this.customer = customer;
        this.due_date = due_date;
        this.remark = remark;
        this.issue_date = issue_date;
        this.ship_via = ship_via;
        this.qt_on = qt_on;
        this.shipping_terms = shipping_terms;
        this.tax_rate = tax_rate;
        this.recipient = recipient;
        this.comment = comment;
        this.status_date = status_date;
        this.status_note = status_note;
        this.details = details;
        this.price_summary = price_summary;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.emp = emp;
        this.status = status;
        this.project = project;
        this.condition_paid = condition_paid;
        this.delivery_address = delivery_address;
        this.approved_by = approved_by;
        this.purchasing_fname = purchasing_fname;
        this.purchasing_lname = purchasing_lname;
    }
}

export const created_reply_options = {
    fields: {
        id: 'po_id',
        number: 'po_number',
        customer: {
            $fields: {
                id: { $from: ['po_customer_id', 'po_cus_id'] },
                display_id: 'po_customer_display_id',
                name_th: 'po_customer_name_th',
                name_en: 'po_customer_name_en',
                tax_id: 'po_customer_tax_id',
                tax_type: 'po_customer_tax_type',
                contact: {
                    $nullableBy: ['po_customer_id', 'po_cus_id'],
                    $fields: {
                        name: 'po_customer_contact_name',
                        phone: 'po_customer_contact_phone',
                        fax: 'po_customer_contact_fax',
                        email: 'po_customer_contact_email'
                    }
                },
                address: {
                    $nullableBy: ['po_customer_id', 'po_cus_id'],
                    $fields: {
                        detail: 'po_customer_address',
                        subdistrict: {
                            $nullableBy: 'po_customer_subdistrict_id',
                            $fields: {
                                id: 'po_customer_subdistrict_id',
                                name: {
                                    $locale: {
                                        th: 'po_customer_subdistrict_name_th',
                                        en: 'po_customer_subdistrict_name_en'
                                    }
                                }
                            }
                        },
                        district: {
                            $nullableBy: 'po_customer_district_id',
                            $fields: {
                                id: 'po_customer_district_id',
                                name: {
                                    $locale: {
                                        th: 'po_customer_district_name_th',
                                        en: 'po_customer_district_name_en'
                                    }
                                }
                            }
                        },
                        province: {
                            $nullableBy: 'po_customer_province_id',
                            $fields: {
                                id: 'po_customer_province_id',
                                name: {
                                    $locale: {
                                        th: 'po_customer_province_name_th',
                                        en: 'po_customer_province_name_en'
                                    }
                                }
                            }
                        },
                        postcode: 'po_customer_postcode'
                    }
                },
                branch_type: 'po_customer_branch_type',
                branch_number: 'po_customer_branch_number'
            }
        },
        due_date: 'po_due_date',
        remark: 'po_remark',
        issue_date: 'po_issue_date',
        ship_via: 'po_ship_via',
        qt_on: 'po_qt_on',
        shipping_terms: 'po_shipping_terms',
        tax_rate: 'po_tax_rate',
        recipient: {
            $nullableBy: 'po_recipient_id',
            $fields: {
                id: 'po_recipient_id',
                display_id: 'po_recipient_display_id',
                prefix: 'po_recipient_prefix',
                firstname_th: 'po_recipient_firstname_th',
                lastname_th: 'po_recipient_lastname_th',
                firstname_en: 'po_recipient_firstname_en',
                lastname_en: 'po_recipient_lastname_en',
                number_id: 'po_recipient_number_id',
                department: {
                    $nullableBy: 'po_recipient_department_id',
                    $fields: {
                        id: 'po_recipient_department_id',
                        name: {
                            $locale: {
                                th: 'po_recipient_department_name_th',
                                en: 'po_recipient_department_name_en'
                            }
                        }
                    }
                },
                position: {
                    $nullableBy: 'po_recipient_position_id',
                    $fields: {
                        id: 'po_recipient_position_id',
                        name: {
                            $locale: {
                                th: 'po_recipient_position_name_th',
                                en: 'po_recipient_position_name_en'
                            }
                        }
                    }
                },
                email: 'po_recipient_email',
                phone: 'po_recipient_phone'
            }
        },
        comment: 'po_comment',
        status_date: {
            $fields: {
                sent_date: 'po_status_sent_date',
                goods_received_date: {
                    $from: ['po_status_goods_received_date', 'po_status_goods_received_']
                },
                paid_date: 'po_status_paid_date'
            }
        },
        status_note: 'po_status_note',
        details: {
            $from: 'details',
            $default: [],
            $each: {
                id: 'id',
                po_id: 'po_id',
                material: {
                    $fields: {
                        id: 'material_id',
                        name: 'material_name',
                        shape_type: 'material_shape_type'
                    }
                },
                required_length_mm: 'required_length_mm',
                required_width_mm: 'required_width_mm',
                required_thickness_mm: 'required_thickness_mm',
                required_diameter_mm: 'required_diameter_mm',
                cut_quantity: 'cut_quantity',
                remaining_quantity: 'remaining_quantity',
                allow_wastrel: 'allow_wastrel',
                allow_rotation: 'allow_rotation',
                status: 'status',
                remark: 'remark',
                on: 'on',
                unit: 'unit',
                description: 'description',
                qty: 'qty',
                discount: 'discount',
                unit_price: 'unit_price',
                total: 'total',
                created_at: 'created_at',
                updated_at: 'updated_at',
                emp: {
                    $from: 'emp',
                    $fields: {
                        id: 'id',
                        prefix: 'prefix',
                        name: 'name'
                    }
                }
            }
        },
        price_summary: {
            $fields: {
                subtotal: { $from: 'po_subtotal', $default: 0 },
                tax_rate: {
                    $from: ['po_tax_rate_calc', 'po_tax_rate'],
                    $default: 0
                },
                tax: { $from: 'po_tax_amount', $default: 0 },
                total: { $from: 'po_total_amount', $default: 0 }
            }
        },
        created_at: 'po_created_at',
        updated_at: 'po_updated_at',
        emp: {
            $nullableBy: 'po_emp_id',
            $fields: {
                id: 'po_emp_id',
                prefix: 'emp_prefix',
                name: {
                    $locale: {
                        th: { $join: ['po_emp_fname_th', 'po_emp_lname_th'] },
                        en: { $join: ['po_emp_fname_en', 'po_emp_lname_en'] }
                    }
                }
            }
        },
        status: 'po_status',
        project: {
            $nullableBy: 'po_project_id',
            $fields: {
                id: 'po_project_id',
                display_id: 'po_project_display_id',
                name_en: 'po_project_name_en',
                name_th: 'po_project_name_th'
            }
        },
        condition_paid: 'po_condition_paid',
        delivery_address: {
            $fields: {
                subdistrict: {
                    $nullableBy: 'po_delivery_subdistrict_id',
                    $fields: {
                        id: 'po_delivery_subdistrict_id',
                        name: {
                            $locale: {
                                th: 'po_delivery_subdistrict_name_th',
                                en: 'po_delivery_subdistrict_name_en'
                            }
                        }
                    }
                },
                district: {
                    $nullableBy: 'po_delivery_district_id',
                    $fields: {
                        id: 'po_delivery_district_id',
                        name: {
                            $locale: {
                                th: 'po_delivery_district_name_th',
                                en: 'po_delivery_district_name_en'
                            }
                        }
                    }
                },
                province: {
                    $nullableBy: 'po_delivery_province_id',
                    $fields: {
                        id: 'po_delivery_province_id',
                        name: {
                            $locale: {
                                th: 'po_delivery_province_name_th',
                                en: 'po_delivery_province_name_en'
                            }
                        }
                    }
                }
            }
        },
        approved_by: {
            $nullableBy: 'po_approved_by_emp_id',
            $fields: {
                id: 'po_approved_by_emp_id',
                prefix: 'po_approved_by_emp_prefix',
                name: {
                    $locale: {
                        th: 'po_approved_by_emp_name_th',
                        en: 'po_approved_by_emp_name_en'
                    }
                }
            }
        },
        purchasing_fname: 'po_purchasing_fname',
        purchasing_lname: 'po_purchasing_lname'
    }
} satisfies ReplyFormat<PurchaseOrder>;
