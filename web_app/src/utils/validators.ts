/**
 * Validation helper functions.
 */

/**
 * Validate email format.
 * 
 * @param email - The email string to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength.
 * Returns an object with validation details.
 * 
 * @param password - The password to validate
 * @returns Validation result with details
 */
export function validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Check if a string is not empty or whitespace only.
 * 
 * @param value - The string to check
 * @returns True if the string has content
 */
export function isNotEmpty(value: string | null | undefined): boolean {
    return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validate a phone number (basic validation).
 * 
 * @param phone - The phone number string
 * @returns True if phone number format is valid
 */
export function isValidPhone(phone: string): boolean {
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Check for 10-15 digits, optionally with + prefix
    return /^\+?[0-9]{10,15}$/.test(cleaned);
}

/**
 * Validate URL format.
 * 
 * @param url - The URL string to validate
 * @returns True if URL is valid
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate that a value is within a numeric range.
 * 
 * @param value - The value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns True if value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

/**
 * Sanitize a string for safe display (basic XSS prevention).
 * 
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
    };
    return input.replace(/[&<>"']/g, (char) => map[char]);
}

export default {
    isValidEmail,
    validatePassword,
    isNotEmpty,
    isValidPhone,
    isValidUrl,
    isInRange,
    sanitizeString,
};
