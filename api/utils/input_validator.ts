export function validate_digit(value: string | number): boolean {
    if (typeof value === 'number') {
        value = value.toString();
    }
    const digit_regex = /^\d+$/;
    return digit_regex.test(value);
}
export function validate_email(email: string): boolean {
    const email_regex = /^[^\s@]+@[^\s@]+(?:\.[^\s@]+)+$/;
    return email_regex.test(email);
}