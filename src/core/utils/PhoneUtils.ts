export const PHONE_CANDIDATE_RE = /\+?\d[\d\s().\-]{4,}\d/g;
export const EXT_CUT_RE = /(доб\.?|доп\.?|ext\.?|extension)\s*[:#\-x]*\s*\d+.*/i;

//
export const normalizeOne = (input: string, options: any = {}) => {
    if (input == null) return null;
    let s = String(input).trim();
    if (!s) return null;

    // Strip off extensions
    if (options.stripExtensions) {
        s = s.replace(EXT_CUT_RE, '');
    }

    // Flag indicating whether there was a leading plus (important for +7 → 8)
    const hasPlusInStart = /^\+/.test(s);

    // Remove all non-digit characters
    let digits = s.replace(/\D/g, '');
    if (!digits) return null;

    // Normalization for Russia (RF)
    // +7xxxxxxxxxx → 8xxxxxxxxxx
    if (hasPlusInStart && digits.startsWith(options.countryCode)) {
        digits = options.defaultTrunk + digits.slice(options.countryCode.length);
    }
        // 7xxxxxxxxxx (11 digits) → 8xxxxxxxxxx
    else if (digits.length === 11 && digits.startsWith(options.countryCode)) {
        digits = options.defaultTrunk + digits.slice(1);
    }
        // 10 digits (mobile/local with area code) → prepend defaultTrunk + 10 digits
    else if (digits.length === 10) {
        digits = options.defaultTrunk + digits;
    }
        // 5–7 digits (local city numbers) → prepend defaultTrunk + cityCode + local
    else if (
        options.cityCode &&
        digits.length >= options.minLocal &&
        digits.length <= options.maxLocal
    ) {
        digits = options.defaultTrunk + options.cityCode + digits;
    }
        // Already 11 digits and starts with defaultTrunk (8) — leave as is
    else if (digits.length === 11 && digits.startsWith(options.defaultTrunk)) {
        // ok
    }
        // Attempt: if length == cityCode+local (no leading 8) — prepend defaultTrunk
    else if (
        options.cityCode &&
        digits.length === (options.cityCode as string).length + 7
    ) {
        digits = options.defaultTrunk + digits;
    }
    else {
        // Could not confidently convert to 11-digit RF format — ignore
        return null;
    }

    // At this point we expect 11 digits starting with defaultTrunk (8)
    return /^\d{11}$/.test(digits) ? digits : null;
};




export const splitCandidates = (value: string) => {
    if (value == null) return [];
    const s = String(value);
    const matches = s.match(PHONE_CANDIDATE_RE);
    if (matches && matches.length) return matches;
    // fallback: split by common delimiters
    return s.split(/[;,/|]+/).map((x) => x.trim()).filter(Boolean);
};

export const normalizePhones = (value: string) => {
    const out = new Set();
    if (Array.isArray(value)) {
        for (const v of value) {
            if (typeof v === 'string') {
                for (const cand of splitCandidates(v)) {
                    const n = normalizeOne(cand);
                    if (n) out.add(n);
                }
            } else {
                const n = normalizeOne(v);
                if (n) out.add(n);
            }
        }
    } else if (typeof value === 'string') {
        const cands = splitCandidates(value);
        for (const c of cands) {
            const n = normalizeOne(c);
            if (n) out.add(n);
        }
    } else {
        const n = normalizeOne(value);
        if (n) out.add(n);
    }
    return [...out];
};

export const getIndexForRow = (row: any, pos: number) => {
    // priority: if the second array element is a number, treat it as the index
    if (Array.isArray(row) && typeof row[1] === 'number') return row[1];
    // if the object has an index
    if (row && typeof row === 'object' && typeof row.index === 'number') return row.index;
    // otherwise use the position in the array
    return pos;
};

export const getPhonesFromRow = (row: any) => {
    if (Array.isArray(row)) return row[0];
    if (row && typeof row === 'object') {
        // support {phone} and {phones} keys
        if ('phones' in row) return row.phones;
        if ('phone' in row) return row.phone;
    }
    return row; // as a last resort
};
