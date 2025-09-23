export const PHONE_CANDIDATE_RE = /\+?\d[\d\s().\-]{4,}\d/g;
export const EXT_CUT_RE = /(доб\.?|доп\.?|ext\.?|extension)\s*[:#\-x]*\s*\d+.*/i;

//
export const normalizeOne = (input: string, options: any = {}) => {
    if (input == null) return null;
    let s = String(input).trim();
    if (!s) return null;

    // Срезаем добавочные
    if (options.stripExtensions) {
        s = s.replace(EXT_CUT_RE, '');
    }

    // Флаг, был ли плюс в начале (важно для +7 → 8)
    const hasPlusInStart = /^\+/.test(s);

    // Убираем всё не-цифровое
    let digits = s.replace(/\D/g, '');
    if (!digits) return null;

    // Нормализация под РФ
    // +7xxxxxxxxxx → 8xxxxxxxxxx
    if (hasPlusInStart && digits.startsWith(options.countryCode)) {
        digits = options.defaultTrunk + digits.slice(options.countryCode.length);
    }
    // 7xxxxxxxxxx (11 знаков) → 8xxxxxxxxxx
    else if (digits.length === 11 && digits.startsWith(options.countryCode)) {
        digits = options.defaultTrunk + digits.slice(1);
    }
    // 10 знаков (мобильный/городской с кодом) → 8 + 10зн
    else if (digits.length === 10) {
        digits = options.defaultTrunk + digits;
    }
    // 5–7 знаков (локальный городской) → 8 + cityCode + локальный
    else if (
        options.cityCode &&
        digits.length >= options.minLocal &&
        digits.length <= options.maxLocal
    ) {
        digits = options.defaultTrunk + options.cityCode + digits;
    }
    // Уже 11 знаков и начинается с 8 — оставляем
    else if (digits.length === 11 && digits.startsWith(options.defaultTrunk)) {
        // ok
    }
    // Попытка: если длина = cityCode+local (нет 8 в начале) — добавим 8
    else if (
        options.cityCode &&
        digits.length === (options.cityCode as string).length + 7
    ) {
        digits = options.defaultTrunk + digits;
    }
    else {
        // Не удалось уверенно привести к формату 11 цифр РФ — игнорируем
        return null;
    }

    // В этот момент ожидаем 11 цифр, начинающихся с 8
    return /^\d{11}$/.test(digits) ? digits : null;
};




export const splitCandidates = (value: string) => {
    if (value == null) return [];
    const s = String(value);
    const matches = s.match(PHONE_CANDIDATE_RE);
    if (matches && matches.length) return matches;
    // fallback: разрезаем по типовым разделителям
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
    // приоритет: если второй элемент — число, считаем его индексом
    if (Array.isArray(row) && typeof row[1] === 'number') return row[1];
    // если объект с index
    if (row && typeof row === 'object' && typeof row.index === 'number') return row.index;
    // иначе — позиция в массиве
    return pos;
};

export const getPhonesFromRow = (row: any) => {
    if (Array.isArray(row)) return row[0];
    if (row && typeof row === 'object') {
        // поддержка {phone}, {phones}
        if ('phones' in row) return row.phones;
        if ('phone' in row) return row.phone;
    }
    return row; // на крайний случай
};
