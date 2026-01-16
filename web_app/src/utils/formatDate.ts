/**
 * Format a date using Indian locale with various format options.
 */

export type DateFormatStyle = 'short' | 'medium' | 'long' | 'full' | 'time' | 'datetime';

const formatOptions: Record<DateFormatStyle, Intl.DateTimeFormatOptions> = {
    short: {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    },
    medium: {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    },
    long: {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    },
    full: {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    },
    time: {
        hour: '2-digit',
        minute: '2-digit',
    },
    datetime: {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    },
};

/**
 * Format a date to a localized string.
 * 
 * @param date - Date to format (Date object, string, or timestamp)
 * @param style - Format style (short, medium, long, full, time, datetime)
 * @param locale - Locale string (default: 'en-IN')
 * @returns Formatted date string
 */
export function formatDate(
    date: Date | string | number,
    style: DateFormatStyle = 'short',
    locale: string = 'en-IN'
): string {
    const dateObj = date instanceof Date ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
    }

    return new Intl.DateTimeFormat(locale, formatOptions[style]).format(dateObj);
}

/**
 * Get a relative time string (e.g., "2 hours ago", "in 3 days").
 * 
 * @param date - Date to compare
 * @param locale - Locale string (default: 'en-IN')
 * @returns Relative time string
 */
export function getRelativeTime(
    date: Date | string | number,
    locale: string = 'en-IN'
): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
        { unit: 'year', seconds: 31536000 },
        { unit: 'month', seconds: 2592000 },
        { unit: 'week', seconds: 604800 },
        { unit: 'day', seconds: 86400 },
        { unit: 'hour', seconds: 3600 },
        { unit: 'minute', seconds: 60 },
        { unit: 'second', seconds: 1 },
    ];

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    for (const { unit, seconds } of units) {
        const diff = Math.floor(Math.abs(diffInSeconds) / seconds);
        if (diff >= 1) {
            return rtf.format(diffInSeconds < 0 ? diff : -diff, unit);
        }
    }

    return rtf.format(0, 'second');
}

export default formatDate;
