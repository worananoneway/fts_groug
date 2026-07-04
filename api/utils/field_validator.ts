export default function field_validator(object: { [key: string]: any }, fields: string[]): string[] {
    const missing_fields: string[] = [];
    fields.forEach(field => {
        const keys = field.split('.') as string[];
        let current = object;
        for (const key of keys) {
            if (!current || typeof current !== 'object' || !(key in current)) {
                missing_fields.push(field);
                break;
            }
            current = current[key];
        }
    });
    return missing_fields;
}