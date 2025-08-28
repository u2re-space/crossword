/*
 * Чтобы лишний раз не использовать ИИ для отбора дублей, используем этот код.
 */

/**
 * Поиск дублей телефонов.
 * Правила нормализации (для РФ):
 * - убираем пробелы/скобки/дефисы, лишние символы
 * - +7 → 8 (в начале), 7xxxxxxxxxx → 8xxxxxxxxxx
 * - 10 цифр (без префикса) → добавляем defaultTrunk ('8' по умолчанию)
 * - городские (5–7 цифр) → добавляем cityCode и defaultTrunk
 * - отсекаем добавочные (доб./доп./ext)
 */
export function findDuplicatePhones(rows: any[], userOptions: any = {}) {
    const options = {
        defaultTrunk: '8',
        countryCode: '7',
        cityCode: null,      // напр. '343'
        stripExtensions: true,
        minLocal: 5,
        maxLocal: 7,
        ...userOptions,
    };

    const PHONE_CANDIDATE_RE = /\+?\d[\d\s().\-]{4,}\d/g;
    const EXT_CUT_RE = /(доб\.?|доп\.?|ext\.?|extension)\s*[:#\-x]*\s*\d+.*/i;

    const normalizeOne = (input: string) => {
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

    const splitCandidates = (value: string) => {
        if (value == null) return [];
        const s = String(value);
        const matches = s.match(PHONE_CANDIDATE_RE);
        if (matches && matches.length) return matches;
        // fallback: разрезаем по типовым разделителям
        return s.split(/[;,/|]+/).map((x) => x.trim()).filter(Boolean);
    };

    const normalizePhones = (value: string) => {
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

    const getIndexForRow = (row: any, pos: number) => {
        // приоритет: если второй элемент — число, считаем его индексом
        if (Array.isArray(row) && typeof row[1] === 'number') return row[1];
        // если объект с index
        if (row && typeof row === 'object' && typeof row.index === 'number') return row.index;
        // иначе — позиция в массиве
        return pos;
    };

    const getPhonesFromRow = (row: any) => {
        if (Array.isArray(row)) return row[0];
        if (row && typeof row === 'object') {
            // поддержка {phone}, {phones}
            if ('phones' in row) return row.phones;
            if ('phone' in row) return row.phone;
        }
        return row; // на крайний случай
    };

    const numberToIndices = new Map();    // normalized -> Set(indices)
    const indexToNumbersAll = new Map();  // index -> Set(all normalized for that row)

    rows.forEach((row: any, pos: number) => {
        const idx = getIndexForRow(row, pos);
        const phonesRaw = getPhonesFromRow(row);
        const phones = normalizePhones(phonesRaw);

        if (!indexToNumbersAll.has(idx)) indexToNumbersAll.set(idx, new Set());
        const setForIndex = indexToNumbersAll.get(idx);

        for (const p of phones) {
            setForIndex.add(p);
            if (!numberToIndices.has(p)) numberToIndices.set(p, new Set());
            numberToIndices.get(p).add(idx);
        }
    });

    // Оставляем только дубли (те номера, что встречаются более чем у одного индекса)
    const duplicatesByNumber: { [key: string]: number[] } = {};
    for (const [num, set] of numberToIndices.entries()) {
        if (set.size > 1) {
            duplicatesByNumber[num] = [...set].sort((a, b) => a - b);
        }
    }

    // Для каждого индекса — какие его номера пересекаются
    const duplicatesByIndex: { [key: string]: string[] } = {};
    for (const [idx, set] of indexToNumbersAll.entries()) {
        const dups = [...set].filter((n) => duplicatesByNumber[n]);
        if (dups.length) duplicatesByIndex[idx] = dups.sort();
    }

    // Пары [index, phone[]] только где есть пересечения
    const pairs = Object.entries(duplicatesByIndex)
        .map(([idx, nums]) => [Number(idx), nums as string[]])
        .sort((a: any, b: any) => a[0] - b[0]);

    return {
        duplicatesByNumber,  // { '89123456789': [0, 2, 5], ... }
        pairs,               // [ [index, ['8...','8...']], ... ]
        duplicatesByIndex,   // { index: ['8...','8...'], ... }
        normalize: (s: string) => normalizeOne(s), // утилита — можно вызывать отдельно
    };
}
