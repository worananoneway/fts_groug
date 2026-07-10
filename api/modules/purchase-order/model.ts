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
