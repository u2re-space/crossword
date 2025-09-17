/*
 * Чтобы лишний раз не использовать ИИ для отбора дублей, используем этот код.
 */

import { getIndexForRow, getPhonesFromRow, normalizeOne, normalizePhones } from "./PhoneUtils";

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
        normalize: (s: string) => normalizeOne(s, options), // утилита — можно вызывать отдельно
    };
}
