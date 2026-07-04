class _Base {
    constructor(
        public id: number,
        public name: string
    ) {
        this.id = id;
        this.name = name;
    }
}
export class District extends _Base {
    constructor(
        public id: number,
        public name: string,
        public province_id: number
    ) {
        super(id, name);
        this.province_id = province_id;
    }
}
export class Province extends _Base {
    constructor(
        public id: number,
        public name: string,
        public geography: string
    ) {
        super(id, name);
        this.geography = geography;
    }
}
export class Subdistrict extends _Base {
    constructor(
        public id: number,
        public name: string,
        public district_id: number,
        public zip_code: string
    ) {
        super(id, name);
        this.district_id = district_id;
        this.zip_code = zip_code;
    }
}