class _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        this.id = id;
        this.name = name;
    }
}
export class Address {
    constructor(
        public detail: string,
        public subdistrict: Subdistrict,
        public district: District,
        public province: Province,
        public postcode: number
    ) {
        this.detail = detail;
        this.subdistrict = subdistrict;
        this.district = district;
        this.province = province;
        this.postcode = postcode;
    }
}
export class Contact {
    constructor(
        public name: string,
        public phone: string,
        public fax: string,
        public email: string
    ) {
        this.name = name;
        this.phone = phone;
        this.fax = fax;
        this.email = email;
    }
}
export class District extends _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        super(id, name);
    }
}
export class Emp {
    constructor(
        public id: string,
        public prefix: string,
        public name: string
    ) {
        this.id = id;
        this.prefix = prefix;
        this.name = name;
    }
}
export class Province extends _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        super(id, name);
    }
}
export class Subdistrict extends _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        super(id, name);
    }
}
export class Recipient{
    constructor(
        public id: string,
        public display_id: string,
        public prefix: string,
        public firstname_th: string,
        public lastname_th: string,
        public firstname_en: string,
        public lastname_en: string,
        public number_id: string,
        public department: Department,
        public position: Position,
        public email: string,
        public phone: string
    ){
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
export class Department extends _Base {
    constructor(
        public id: number,
        public name: string
    ){
        super(id, name);
    }
}
export class Position extends _Base {
    constructor(
        public id: number,
        public name: string
    ){
        super(id, name);
    }
}
export class StatusDate{
    constructor(
        public sent_date: string,
        public goods_received_date: string,
        public paid_date: string
    ){
        this.sent_date = sent_date;
        this.goods_received_date = goods_received_date;
        this.paid_date = paid_date;
    }
}
export class Detail {
    constructor(
        public id: string,
        public on: string,
        public department: string,
        public type: string,
        public description: string,
        public qty: number,
        public discount: number,
        public unit_price: number,
        public total: number,
        public created_at: string,
        public updated_at: string,
        public emp: Emp
    ){
        this.id = id;
        this.on = on;
        this.department = department;
        this.type = type;
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
        public id: string,
        public display_id: string,
        public name_en: string,
        public name_th: string,
    ) {
        this.id = id;
        this.display_id = display_id;
        this.name_en = name_en;
        this.name_th = name_th;
    }
}
export class PurchaseOrder{
    constructor(
        public id: string,
        public number: string,
        public issue_date: Date,
        public supplier: Supplier,
        public ship_via: string,
        public qt_on: string,
        public shipping_terms: string,
        public tax_rate: number,
        public recipient: Recipient,
        public comment: string,
        public status_date: StatusDate,
        public status_note: string,
        public details: Detail[] | null,
        public price_summary: PriceSummary,
        public created_at: string,
        public updated_at: string,
        public emp: Emp,
        public status: string,
        public project: Project
    ){
        this.id = id;
        this.number = number;
        this.issue_date = issue_date;
        this.supplier = supplier;
        this.ship_via = ship_via;
        this.qt_on = qt_on;
        this.shipping_terms = shipping_terms;
        this.tax_rate = tax_rate;
        this.recipient = recipient;
        this.comment = comment;
        this.status_date = status_date;
        this.status_note = status_note;
        this.details = details;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.emp = emp;
        this.status = status;
        this.project = project;
    }
}
export class Supplier {
    constructor(
        public id: string,
        public display_id: string,
        public name_th: string,
        public name_en: string,
        public tax_id: string,
        public tax_type: string,
        public contact: Contact | null,
        public address: Address | null,
        public branch_type: string,
        public branch_number: string | null,
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

