export function get_enum_keys<T extends Record<string, string | number>>(enum_obj: T): ReadonlySet<keyof T> {
    return new Set(Object.keys(enum_obj) as (keyof T)[]);
}
export function get_enum_values<T extends Record<string, string | number>>(enum_obj: T): ReadonlySet<T[keyof T]> {
    return new Set(Object.values(enum_obj) as T[keyof T][]);
}
export function is_enum_key<T extends Record<string, string | number>>(enum_key: ReadonlySet<keyof T>, key: unknown): key is keyof T {
    key = (key as string).trim().replace(/\s+/g, '_');
    return enum_key.has((key as string).toUpperCase() as keyof T);
}
export function is_enum_value<T extends Record<string, string | number>>(enum_value: ReadonlySet<T[keyof T]>, value: unknown): value is T[keyof T] {
    value = (value as string).trim().replace(/\s+/g, '_');
    return enum_value.has(value as T[keyof T]);
}