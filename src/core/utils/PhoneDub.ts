/*
 * To avoid repeatedly using AI for duplicate detection, use this code.
 *
 * Find duplicate phone numbers.
 * Normalization rules (for Russia - RF):
 * - remove spaces/parentheses/dashes and other extra characters
 * - +7 → 8 (at start), 7xxxxxxxxxx → 8xxxxxxxxxx
 * - 10 digits (no trunk) → prepend defaultTrunk (defaults to '8')
 * - city/local numbers (5–7 digits) → prepend cityCode and defaultTrunk
 * - strip extensions (e.g. доб., доп., ext)
 */


import { getIndexForRow, getPhonesFromRow, normalizeOne, normalizePhones } from "./PhoneUtils";

export function findDuplicatePhones(rows: any[], userOptions: any = {}) {
    const options = {
        defaultTrunk: '8',
        countryCode: '7',
        cityCode: null,
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

    // Keep only duplicates (numbers that occur more than once)
    const duplicatesByNumber: { [key: string]: number[] } = {};
    for (const [num, set] of numberToIndices.entries()) {
        if (set.size > 1) {
            duplicatesByNumber[num] = [...set].sort((a, b) => a - b);
        }
    }

    // For each index — which of its numbers intersect
    const duplicatesByIndex: { [key: string]: string[] } = {};
    for (const [idx, set] of indexToNumbersAll.entries()) {
        const dups = [...set].filter((n) => duplicatesByNumber[n]);
        if (dups.length) duplicatesByIndex[idx] = dups.sort();
    }

    // Pairs [index, phone[]] only where there are intersections
    const pairs = Object.entries(duplicatesByIndex)
        .map(([idx, nums]) => [Number(idx), nums as string[]])
        .sort((a: any, b: any) => a[0] - b[0]);

    return {
        duplicatesByNumber,  // { '89123456789': [0, 2, 5], ... }
        pairs,               // [ [index, ['8...','8...']], ... ]
        duplicatesByIndex,   // { index: ['8...','8...'], ... }
        normalize: (s: string) => normalizeOne(s, options), // utility — can be called separately
    };
}
