export function sanitize_array(input: any[]): any[] {
    if (!Array.isArray(input)) {
        throw new Error('Input must be an array for sanitization.');
    }
    return input.map(item => sanitize_input(item));
}
export function sanitize_input(input: any): any {
    if (typeof input === 'string') {
        return sanitize_string(input);
    } else if (typeof input === 'number' || typeof input === 'boolean' || input === null || input === undefined) {
        return input;
    } else if (Array.isArray(input)) {
        return sanitize_array(input);
    } else {
        throw new Error('Unsupported data type for sanitization.');
    }
}
export function sanitize_payload(payload: Record<string, any>): any {
    const sanitized_payload: Record<string, any> = {};
    for (const key in payload) {
        sanitized_payload[key] = sanitize_input(payload[key]);
    }
    return sanitized_payload;
}
export function sanitize_string(input: string): string {
    if (typeof input !== 'string') {
        throw new Error('Input must be a string for sanitization.');
    }

    return input.normalize('NFKC').replaceAll(/<.*?>/g, '').trim();
}