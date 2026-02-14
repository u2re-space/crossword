import { JSOX } from './Settings.js';

//#region src/constants.ts
const LIST_ITEM_MARKER = "-";
const LIST_ITEM_PREFIX = "- ";
const COMMA = ",";
const DOT = ".";
const NULL_LITERAL = "null";
const TRUE_LITERAL = "true";
const FALSE_LITERAL = "false";
const BACKSLASH = "\\";
const DOUBLE_QUOTE = "\"";
const DELIMITERS = {
	comma: COMMA};
const DEFAULT_DELIMITER = DELIMITERS.comma;

//#endregion
//#region src/shared/string-utils.ts
/**
* Escapes special characters in a string for encoding.
*
* @remarks
* Handles backslashes, quotes, newlines, carriage returns, and tabs.
*/
function escapeString(value) {
	return value.replace(/\\/g, `${BACKSLASH}${BACKSLASH}`).replace(/"/g, `${BACKSLASH}${DOUBLE_QUOTE}`).replace(/\n/g, `${BACKSLASH}n`).replace(/\r/g, `${BACKSLASH}r`).replace(/\t/g, `${BACKSLASH}t`);
}

//#endregion
//#region src/shared/literal-utils.ts
function isBooleanOrNullLiteral(token) {
	return token === TRUE_LITERAL || token === FALSE_LITERAL || token === NULL_LITERAL;
}

//#endregion
//#region src/encode/normalize.ts
function normalizeValue(value) {
	if (value === null) return null;
	if (typeof value === "string" || typeof value === "boolean") return value;
	if (typeof value === "number") {
		if (Object.is(value, -0)) return 0;
		if (!Number.isFinite(value)) return null;
		return value;
	}
	if (typeof value === "bigint") {
		if (value >= Number.MIN_SAFE_INTEGER && value <= Number.MAX_SAFE_INTEGER) return Number(value);
		return value.toString();
	}
	if (value instanceof Date) return value.toISOString();
	if (Array.isArray(value)) return value.map(normalizeValue);
	if (value instanceof Set) return Array.from(value).map(normalizeValue);
	if (value instanceof Map) return Object.fromEntries(Array.from(value, ([k, v]) => [String(k), normalizeValue(v)]));
	if (isPlainObject(value)) {
		const normalized = {};
		for (const key in value) if (Object.prototype.hasOwnProperty.call(value, key)) normalized[key] = normalizeValue(value[key]);
		return normalized;
	}
	return null;
}
function isJsonPrimitive(value) {
	return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}
function isJsonArray(value) {
	return Array.isArray(value);
}
function isJsonObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isEmptyObject(value) {
	return Object.keys(value).length === 0;
}
function isPlainObject(value) {
	if (value === null || typeof value !== "object") return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}
function isArrayOfPrimitives(value) {
	return value.length === 0 || value.every((item) => isJsonPrimitive(item));
}
function isArrayOfArrays(value) {
	return value.length === 0 || value.every((item) => isJsonArray(item));
}
function isArrayOfObjects(value) {
	return value.length === 0 || value.every((item) => isJsonObject(item));
}

//#endregion
//#region src/shared/validation.ts
/**
* Checks if a key can be used without quotes.
*
* @remarks
* Valid unquoted keys must start with a letter or underscore,
* followed by letters, digits, underscores, or dots.
*/
function isValidUnquotedKey(key) {
	return /^[A-Z_][\w.]*$/i.test(key);
}
/**
* Checks if a key segment is a valid identifier for safe folding/expansion.
*
* @remarks
* Identifier segments are more restrictive than unquoted keys:
* - Must start with a letter or underscore
* - Followed only by letters, digits, or underscores (no dots)
* - Used for safe key folding and path expansion
*/
function isIdentifierSegment(key) {
	return /^[A-Z_]\w*$/i.test(key);
}
/**
* Determines if a string value can be safely encoded without quotes.
*
* @remarks
* A string needs quoting if it:
* - Is empty
* - Has leading or trailing whitespace
* - Could be confused with a literal (boolean, null, number)
* - Contains structural characters (colons, brackets, braces)
* - Contains quotes or backslashes (need escaping)
* - Contains control characters (newlines, tabs, etc.)
* - Contains the active delimiter
* - Starts with a list marker (hyphen)
*/
function isSafeUnquoted(value, delimiter = DEFAULT_DELIMITER) {
	if (!value) return false;
	if (value !== value.trim()) return false;
	if (isBooleanOrNullLiteral(value) || isNumericLike(value)) return false;
	if (value.includes(":")) return false;
	if (value.includes("\"") || value.includes("\\")) return false;
	if (/[[\]{}]/.test(value)) return false;
	if (/[\n\r\t]/.test(value)) return false;
	if (value.includes(delimiter)) return false;
	if (value.startsWith(LIST_ITEM_MARKER)) return false;
	return true;
}
/**
* Checks if a string looks like a number.
*
* @remarks
* Match numbers like `42`, `-3.14`, `1e-6`, `05`, etc.
*/
function isNumericLike(value) {
	return /^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value) || /^0\d+$/.test(value);
}

//#endregion
//#region src/encode/folding.ts
/**
* Attempts to fold a single-key object chain into a dotted path.
*
* @remarks
* Folding traverses nested objects with single keys, collapsing them into a dotted path.
* It stops when:
* - A non-single-key object is encountered
* - An array is encountered (arrays are not "single-key objects")
* - A primitive value is reached
* - The flatten depth limit is reached
* - Any segment fails safe mode validation
*
* Safe mode requirements:
* - `options.keyFolding` must be `'safe'`
* - Every segment must be a valid identifier (no dots, no special chars)
* - The folded key must not collide with existing sibling keys
* - No segment should require quoting
*
* @param key - The starting key to fold
* @param value - The value associated with the key
* @param siblings - Array of all sibling keys at this level (for collision detection)
* @param options - Resolved encoding options
* @returns A FoldResult if folding is possible, undefined otherwise
*/
function tryFoldKeyChain(key, value, siblings, options, rootLiteralKeys, pathPrefix, flattenDepth) {
	if (options.keyFolding !== "safe") return;
	if (!isJsonObject(value)) return;
	const { segments, tail, leafValue } = collectSingleKeyChain(key, value, flattenDepth ?? options.flattenDepth);
	if (segments.length < 2) return;
	if (!segments.every((seg) => isIdentifierSegment(seg))) return;
	const foldedKey = buildFoldedKey(segments);
	const absolutePath = pathPrefix ? `${pathPrefix}${DOT}${foldedKey}` : foldedKey;
	if (siblings.includes(foldedKey)) return;
	if (rootLiteralKeys && rootLiteralKeys.has(absolutePath)) return;
	return {
		foldedKey,
		remainder: tail,
		leafValue,
		segmentCount: segments.length
	};
}
/**
* Collects a chain of single-key objects into segments.
*
* @remarks
* Traverses nested objects, collecting keys until:
* - A non-single-key object is found
* - An array is encountered
* - A primitive is reached
* - An empty object is reached
* - The depth limit is reached
*
* @param startKey - The initial key to start the chain
* @param startValue - The value to traverse
* @param maxDepth - Maximum number of segments to collect
* @returns Object containing segments array, tail value, and leaf value
*/
function collectSingleKeyChain(startKey, startValue, maxDepth) {
	const segments = [startKey];
	let currentValue = startValue;
	while (segments.length < maxDepth) {
		if (!isJsonObject(currentValue)) break;
		const keys = Object.keys(currentValue);
		if (keys.length !== 1) break;
		const nextKey = keys[0];
		const nextValue = currentValue[nextKey];
		segments.push(nextKey);
		currentValue = nextValue;
	}
	if (!isJsonObject(currentValue) || isEmptyObject(currentValue)) return {
		segments,
		tail: void 0,
		leafValue: currentValue
	};
	return {
		segments,
		tail: currentValue,
		leafValue: currentValue
	};
}
function buildFoldedKey(segments) {
	return segments.join(DOT);
}

//#endregion
//#region src/encode/primitives.ts
function encodePrimitive(value, delimiter) {
	if (value === null) return NULL_LITERAL;
	if (typeof value === "boolean") return String(value);
	if (typeof value === "number") return String(value);
	return encodeStringLiteral(value, delimiter);
}
function encodeStringLiteral(value, delimiter = DEFAULT_DELIMITER) {
	if (isSafeUnquoted(value, delimiter)) return value;
	return `${DOUBLE_QUOTE}${escapeString(value)}${DOUBLE_QUOTE}`;
}
function encodeKey(key) {
	if (isValidUnquotedKey(key)) return key;
	return `${DOUBLE_QUOTE}${escapeString(key)}${DOUBLE_QUOTE}`;
}
function encodeAndJoinPrimitives(values, delimiter = DEFAULT_DELIMITER) {
	return values.map((v) => encodePrimitive(v, delimiter)).join(delimiter);
}
function formatHeader(length, options) {
	const key = options?.key;
	const fields = options?.fields;
	const delimiter = options?.delimiter ?? COMMA;
	let header = "";
	if (key) header += encodeKey(key);
	header += `[${length}${delimiter !== DEFAULT_DELIMITER ? delimiter : ""}]`;
	if (fields) {
		const quotedFields = fields.map((f) => encodeKey(f));
		header += `{${quotedFields.join(delimiter)}}`;
	}
	header += ":";
	return header;
}

//#endregion
//#region src/encode/encoders.ts
function* encodeJsonValue(value, options, depth) {
	if (isJsonPrimitive(value)) {
		const encodedPrimitive = encodePrimitive(value, options.delimiter);
		if (encodedPrimitive !== "") yield encodedPrimitive;
		return;
	}
	if (isJsonArray(value)) yield* encodeArrayLines(void 0, value, depth, options);
	else if (isJsonObject(value)) yield* encodeObjectLines(value, depth, options);
}
function* encodeObjectLines(value, depth, options, rootLiteralKeys, pathPrefix, remainingDepth) {
	const keys = Object.keys(value);
	if (depth === 0 && !rootLiteralKeys) rootLiteralKeys = new Set(keys.filter((k) => k.includes(".")));
	const effectiveFlattenDepth = remainingDepth ?? options.flattenDepth;
	for (const [key, val] of Object.entries(value)) yield* encodeKeyValuePairLines(key, val, depth, options, keys, rootLiteralKeys, pathPrefix, effectiveFlattenDepth);
}
function* encodeKeyValuePairLines(key, value, depth, options, siblings, rootLiteralKeys, pathPrefix, flattenDepth) {
	const currentPath = pathPrefix ? `${pathPrefix}${DOT}${key}` : key;
	const effectiveFlattenDepth = flattenDepth ?? options.flattenDepth;
	if (options.keyFolding === "safe" && siblings) {
		const foldResult = tryFoldKeyChain(key, value, siblings, options, rootLiteralKeys, pathPrefix, effectiveFlattenDepth);
		if (foldResult) {
			const { foldedKey, remainder, leafValue, segmentCount } = foldResult;
			const encodedFoldedKey = encodeKey(foldedKey);
			if (remainder === void 0) {
				if (isJsonPrimitive(leafValue)) {
					yield indentedLine(depth, `${encodedFoldedKey}: ${encodePrimitive(leafValue, options.delimiter)}`, options.indent);
					return;
				} else if (isJsonArray(leafValue)) {
					yield* encodeArrayLines(foldedKey, leafValue, depth, options);
					return;
				} else if (isJsonObject(leafValue) && isEmptyObject(leafValue)) {
					yield indentedLine(depth, `${encodedFoldedKey}:`, options.indent);
					return;
				}
			}
			if (isJsonObject(remainder)) {
				yield indentedLine(depth, `${encodedFoldedKey}:`, options.indent);
				const remainingDepth = effectiveFlattenDepth - segmentCount;
				const foldedPath = pathPrefix ? `${pathPrefix}${DOT}${foldedKey}` : foldedKey;
				yield* encodeObjectLines(remainder, depth + 1, options, rootLiteralKeys, foldedPath, remainingDepth);
				return;
			}
		}
	}
	const encodedKey = encodeKey(key);
	if (isJsonPrimitive(value)) yield indentedLine(depth, `${encodedKey}: ${encodePrimitive(value, options.delimiter)}`, options.indent);
	else if (isJsonArray(value)) yield* encodeArrayLines(key, value, depth, options);
	else if (isJsonObject(value)) {
		yield indentedLine(depth, `${encodedKey}:`, options.indent);
		if (!isEmptyObject(value)) yield* encodeObjectLines(value, depth + 1, options, rootLiteralKeys, currentPath, effectiveFlattenDepth);
	}
}
function* encodeArrayLines(key, value, depth, options) {
	if (value.length === 0) {
		yield indentedLine(depth, formatHeader(0, {
			key,
			delimiter: options.delimiter
		}), options.indent);
		return;
	}
	if (isArrayOfPrimitives(value)) {
		yield indentedLine(depth, encodeInlineArrayLine(value, options.delimiter, key), options.indent);
		return;
	}
	if (isArrayOfArrays(value)) {
		if (value.every((arr) => isArrayOfPrimitives(arr))) {
			yield* encodeArrayOfArraysAsListItemsLines(key, value, depth, options);
			return;
		}
	}
	if (isArrayOfObjects(value)) {
		const header = extractTabularHeader(value);
		if (header) yield* encodeArrayOfObjectsAsTabularLines(key, value, header, depth, options);
		else yield* encodeMixedArrayAsListItemsLines(key, value, depth, options);
		return;
	}
	yield* encodeMixedArrayAsListItemsLines(key, value, depth, options);
}
function* encodeArrayOfArraysAsListItemsLines(prefix, values, depth, options) {
	yield indentedLine(depth, formatHeader(values.length, {
		key: prefix,
		delimiter: options.delimiter
	}), options.indent);
	for (const arr of values) if (isArrayOfPrimitives(arr)) {
		const arrayLine = encodeInlineArrayLine(arr, options.delimiter);
		yield indentedListItem(depth + 1, arrayLine, options.indent);
	}
}
function encodeInlineArrayLine(values, delimiter, prefix) {
	const header = formatHeader(values.length, {
		key: prefix,
		delimiter
	});
	const joinedValue = encodeAndJoinPrimitives(values, delimiter);
	if (values.length === 0) return header;
	return `${header} ${joinedValue}`;
}
function* encodeArrayOfObjectsAsTabularLines(prefix, rows, header, depth, options) {
	yield indentedLine(depth, formatHeader(rows.length, {
		key: prefix,
		fields: header,
		delimiter: options.delimiter
	}), options.indent);
	yield* writeTabularRowsLines(rows, header, depth + 1, options);
}
function extractTabularHeader(rows) {
	if (rows.length === 0) return;
	const firstRow = rows[0];
	const firstKeys = Object.keys(firstRow);
	if (firstKeys.length === 0) return;
	if (isTabularArray(rows, firstKeys)) return firstKeys;
}
function isTabularArray(rows, header) {
	for (const row of rows) {
		if (Object.keys(row).length !== header.length) return false;
		for (const key of header) {
			if (!(key in row)) return false;
			if (!isJsonPrimitive(row[key])) return false;
		}
	}
	return true;
}
function* writeTabularRowsLines(rows, header, depth, options) {
	for (const row of rows) yield indentedLine(depth, encodeAndJoinPrimitives(header.map((key) => row[key]), options.delimiter), options.indent);
}
function* encodeMixedArrayAsListItemsLines(prefix, items, depth, options) {
	yield indentedLine(depth, formatHeader(items.length, {
		key: prefix,
		delimiter: options.delimiter
	}), options.indent);
	for (const item of items) yield* encodeListItemValueLines(item, depth + 1, options);
}
function* encodeObjectAsListItemLines(obj, depth, options) {
	if (isEmptyObject(obj)) {
		yield indentedLine(depth, LIST_ITEM_MARKER, options.indent);
		return;
	}
	const entries = Object.entries(obj);
	const [firstKey, firstValue] = entries[0];
	const encodedKey = encodeKey(firstKey);
	if (isJsonPrimitive(firstValue)) yield indentedListItem(depth, `${encodedKey}: ${encodePrimitive(firstValue, options.delimiter)}`, options.indent);
	else if (isJsonArray(firstValue)) if (isArrayOfPrimitives(firstValue)) yield indentedListItem(depth, encodeInlineArrayLine(firstValue, options.delimiter, firstKey), options.indent);
	else if (isArrayOfObjects(firstValue)) {
		const header = extractTabularHeader(firstValue);
		if (header) {
			yield indentedListItem(depth, formatHeader(firstValue.length, {
				key: firstKey,
				fields: header,
				delimiter: options.delimiter
			}), options.indent);
			yield* writeTabularRowsLines(firstValue, header, depth + 1, options);
		} else {
			yield indentedListItem(depth, `${encodedKey}[${firstValue.length}]:`, options.indent);
			for (const item of firstValue) yield* encodeObjectAsListItemLines(item, depth + 1, options);
		}
	} else {
		yield indentedListItem(depth, `${encodedKey}[${firstValue.length}]:`, options.indent);
		for (const item of firstValue) yield* encodeListItemValueLines(item, depth + 1, options);
	}
	else if (isJsonObject(firstValue)) {
		yield indentedListItem(depth, `${encodedKey}:`, options.indent);
		if (!isEmptyObject(firstValue)) yield* encodeObjectLines(firstValue, depth + 2, options);
	}
	for (let i = 1; i < entries.length; i++) {
		const [key, value] = entries[i];
		yield* encodeKeyValuePairLines(key, value, depth + 1, options);
	}
}
function* encodeListItemValueLines(value, depth, options) {
	if (isJsonPrimitive(value)) yield indentedListItem(depth, encodePrimitive(value, options.delimiter), options.indent);
	else if (isJsonArray(value)) if (isArrayOfPrimitives(value)) yield indentedListItem(depth, encodeInlineArrayLine(value, options.delimiter), options.indent);
	else {
		yield indentedListItem(depth, formatHeader(value.length, { delimiter: options.delimiter }), options.indent);
		for (const item of value) yield* encodeListItemValueLines(item, depth + 1, options);
	}
	else if (isJsonObject(value)) yield* encodeObjectAsListItemLines(value, depth, options);
}
function indentedLine(depth, content, indentSize) {
	return " ".repeat(indentSize * depth) + content;
}
function indentedListItem(depth, content, indentSize) {
	return indentedLine(depth, LIST_ITEM_PREFIX + content, indentSize);
}

//#endregion
//#region src/index.ts
/**
* Encodes a JavaScript value into TOON format string.
*
* @param input - Any JavaScript value (objects, arrays, primitives)
* @param options - Optional encoding configuration
* @returns TOON formatted string
*
* @example
* ```ts
* encode({ name: 'Alice', age: 30 })
* // name: Alice
* // age: 30
*
* encode({ users: [{ id: 1 }, { id: 2 }] })
* // users[]:
* //   - id: 1
* //   - id: 2
*
* encode(data, { indent: 4, keyFolding: 'safe' })
* ```
*/
function encode(input, options) {
	return Array.from(encodeLines(input)).join("\n");
}
/**
* Encodes a JavaScript value into TOON format as a sequence of lines.
*
* This function yields TOON lines one at a time without building the full string,
* making it suitable for streaming large outputs to files, HTTP responses, or process stdout.
*
* @param input - Any JavaScript value (objects, arrays, primitives)
* @param options - Optional encoding configuration
* @returns Iterable of TOON lines (without trailing newlines)
*
* @example
* ```ts
* // Stream to stdout
* for (const line of encodeLines({ name: 'Alice', age: 30 })) {
*   console.log(line)
* }
*
* // Collect to array
* const lines = Array.from(encodeLines(data))
*
* // Equivalent to encode()
* const toonString = Array.from(encodeLines(data, options)).join('\n')
* ```
*/
function encodeLines(input, options) {
	return encodeJsonValue(normalizeValue(input), resolveOptions(), 0);
}
function resolveOptions(options) {
	return {
		indent: 2,
		delimiter: DEFAULT_DELIMITER,
		keyFolding: "off",
		flattenDepth: Number.POSITIVE_INFINITY
	};
}

const typesForKind = {
  "math": "input_text",
  "url": "input_image",
  "text": "input_text",
  "input_text": "input_text",
  "output_text": "input_text",
  "image_url": "input_image",
  "image": "input_image",
  "input_image": "input_image",
  "input_url": "input_image",
  "json": "input_text",
  "markdown": "input_text",
  "code": "input_text",
  "entity": "input_text",
  "structured": "input_text",
  "unknown": "input_text",
  "svg": "input_text",
  "xml": "input_text"
};
const getDataKindByMIMEType = (mime) => {
  if (!mime) return "input_text";
  const lower = mime.toLowerCase();
  if (lower.includes("image")) return "input_image";
  if (lower.includes("json")) return "json";
  if (lower.includes("javascript") || lower.includes("typescript")) return "code";
  if (lower.includes("markdown") || lower.includes("md")) return "markdown";
  if (lower.includes("url")) return "input_url";
  if (lower.includes("text/html")) return "markdown";
  if (lower.includes("text/plain")) return "input_text";
  return "input_text";
};
const detectDataKindFromContent = (content) => {
  if (!content || typeof content !== "string") return "input_text";
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}") || trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      JSON.parse(trimmed);
      return "json";
    } catch {
    }
  }
  if (URL.canParse(trimmed?.trim?.() || "", typeof (typeof window != "undefined" ? window : globalThis)?.location == "undefined" ? void 0 : (typeof window != "undefined" ? window : globalThis)?.location?.origin || "")) return "url";
  if (trimmed.includes("<svg") && trimmed.includes("</svg>")) return "xml";
  if (trimmed.startsWith("data:image/") && trimmed.includes(";base64,") && !trimmed.includes("\n") && trimmed.length < 1e5) {
    try {
      const url = new URL(trimmed);
      if (url.protocol === "data:" && url.pathname.startsWith("image/")) {
        return "input_image";
      }
    } catch {
    }
  }
  if (/\$\$[\s\S]+\$\$|\$[^$]+\$|\\begin\{equation\}/.test(trimmed)) return "math";
  if (/```[\s\S]+```|^(function|const|let|var|class|import|export)\s/m.test(trimmed)) return "code";
  if (/^#{1,6}\s|^\*\*|^-\s|\[.+\]\(.+\)|^>\s/m.test(trimmed)) return "markdown";
  return "input_text";
};
const actionWithDataType = (data) => {
  const context = data?.context;
  const kindType = typesForKind?.[data?.dataKind || "input_text"];
  const contextPrompt = buildContextPrompt(context);
  switch (kindType) {
    case "input_image":
      return `${contextPrompt}

Recognize data from image, also preferred to orient by fonts in image.

After recognition, do not include or remember image itself.

---

In (\`recognized_data\` key), can be written phone numbers, emails, URLs, dates, times, codes, etc. Additional formatting rules:

In recognized from image data (what you seen in image), do:
- If textual content, format as Markdown string (multiline).
- If phone number, format as as correct phone number (in normalized format).
  - Also, if phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Remove brackets, parentheses, spaces or other symbols from phone number.
  - Trim spaces from phone number.
- If email, format as as correct email (in normalized format), and trim spaces from email.
- If URL, format as as correct URL (in normalized format), and unicode codes to human readable, and trim spaces from URL.
- If date, format as as correct date (in normalized format).
- If time, format as as correct time (in normalized format).
- If math (expression, equation, formula), format as $KaTeX$
- If table (or looks alike table), format as | table |
- If image, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as correct JSON string, and trim spaces from JSON string.
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

---

Some additional actions:
- Collect some special data tags and keywords (if has any).
- Also, can you provide in markdown pre-formatted free-form analyzed or recognized verbose data (in \`verbose_data\` key).

---

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { or [ and end with } or ].

Expected output structure:
{
    "keywords_and_tags": ["string array"],
    "recognized_data": ["any array"],
    "verbose_data": "markdown string",
    "using_ready": true,
    "confidence": 0.95,
    "suggested_type": "document_type"
}
`;
    case "input_text":
      return `${contextPrompt}

Analyze text and extract specific or special data from it, also normalize data by those rules...

---

In (\`recognized_data\` key), can be written phone numbers, emails, URLs, dates, times, codes, etc. Additional formatting rules:

Normalize phone numbers, emails, URLs, dates, times, codes, etc for best efforts and by those rules.
- If phone number, format as as correct phone number (in normalized format).
  - If phone numbers (for example starts with +7, format as 8), replace to correct regional code.
  - Trim spaces from phone numbers, emails, URLs, dates, times, codes, etc.
  - Remove brackets, parentheses, spaces or other symbols from phone numbers.
- If email, format as as correct email (in normalized format), and trim spaces from email.
- If URL, format as as correct URL (in normalized format), and unicode codes to human readable, and trim spaces from URL.
- If date, format as as correct date (in normalized format).
- If time, format as as correct time (in normalized format).
- If math, format as $KaTeX$
- If table, format as | table |
- If image, format as [$image$]($image$)
- If code, format as \`\`\`$code$\`\`\` (multiline) or \`$code$\` (single-line)
- If JSON, format as correct JSON string, and trim spaces from JSON string.
- If other, format as $text$.
- If seen alike list, format as list (in markdown format).

---

Some additional actions:
- Collect some special data tags and keywords (if has any).
- Also, can you provide in markdown pre-formatted free-form analyzed or recognized verbose data (in \`verbose_data\` key).
- Detect entity type if applicable (task, event, person, place, service, item, etc.)

---

CRITICAL OUTPUT FORMAT: Return ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { or [ and end with } or ].

Expected output structure:
{
    "keywords_and_tags": ["string array"],
    "recognized_data": ["any array"],
    "verbose_data": "markdown string",
    "using_ready": true,
    "confidence": 0.95,
    "suggested_type": "entity_type",
    "suggested_modifications": []
}
`;
  }
  return contextPrompt || "";
};
const buildContextPrompt = (context) => {
  if (!context) return "";
  const parts = [];
  if (context.operation) {
    const opDescriptions = {
      create: "Create new data entries based on provided information.",
      modify: "Modify existing data with provided changes while preserving structure.",
      merge: "Intelligently merge new data with existing data, avoiding duplicates.",
      analyze: "Analyze and extract structured information from the data.",
      extract: "Extract specific data points matching the criteria."
    };
    parts.push(`Operation: ${opDescriptions[context.operation] || context.operation}`);
  }
  if (context.entityType) {
    parts.push(`Target entity type: ${context.entityType}`);
  }
  if (context.existingData) {
    parts.push(`Existing data context provided - consider for merge/update operations.`);
  }
  if (context.filters?.length) {
    const filterDesc = context.filters.map(
      (f) => `${f.field} ${f.operator} ${JSON.stringify(f.value)}`
    ).join(", ");
    parts.push(`Apply filters: ${filterDesc}`);
  }
  if (context.searchTerms?.length) {
    parts.push(`Search terms: ${context.searchTerms.join(", ")}`);
  }
  if (context.priority) {
    parts.push(`Priority level: ${context.priority}`);
  }
  return parts.length ? `Context:
${parts.join("\n")}

---
` : "";
};
const buildModificationPrompt = (instructions) => {
  if (!instructions?.length) return "";
  const parts = instructions.map((inst, i) => {
    const condStr = inst.conditions?.length ? ` when ${inst.conditions.map((c) => `${c.field} ${c.operator} ${JSON.stringify(c.value)}`).join(" AND ")}` : "";
    switch (inst.action) {
      case "update":
        return `${i + 1}. UPDATE field "${inst.target}" to ${JSON.stringify(inst.value)}${condStr}`;
      case "delete":
        return `${i + 1}. DELETE field "${inst.target}"${condStr}`;
      case "merge":
        return `${i + 1}. MERGE into "${inst.target}" with ${JSON.stringify(inst.value)}${condStr}`;
      case "append":
        return `${i + 1}. APPEND ${JSON.stringify(inst.value)} to "${inst.target}"${condStr}`;
      case "replace":
        return `${i + 1}. REPLACE "${inst.target}" with ${JSON.stringify(inst.value)}${condStr}`;
      case "transform":
        return `${i + 1}. TRANSFORM "${inst.target}" using: ${inst.transformFn}${condStr}`;
      default:
        return "";
    }
  }).filter(Boolean);
  return parts.length ? `
Modification instructions:
${parts.join("\n")}
` : "";
};
const DATA_MODIFICATION_PROMPT = `
You are a data modification assistant. Your task is to modify existing data based on the provided instructions.

Rules for modification:
1. Preserve the original data structure unless explicitly asked to change it.
2. Apply modifications in order, one by one.
3. Validate data types match the schema.
4. Return the complete modified entity, not just the changes.
5. If a modification cannot be applied, include it in the "errors" array with explanation.

CRITICAL: Output ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { and end with }.

Expected output structure:
{
    "modified_entity": { /* complete modified entity */ },
    "changes_made": [ /* list of applied changes */ ],
    "errors": [ /* list of failed modifications with reasons */ ],
    "warnings": [ /* non-critical issues */ ]
}
`;
const DATA_SELECTION_PROMPT = `
You are a data selection and filtering assistant. Your task is to find and select data matching the criteria.

Selection rules:
1. Apply all filters in order (AND logic by default).
2. Rank results by relevance to search terms.
3. Include confidence scores for fuzzy matches.
4. Group similar results to avoid duplicates.

CRITICAL: Output ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { and end with }.

Expected output structure:
{
    "selected_items": [ /* items matching criteria */ ],
    "total_matches": number,
    "filter_stats": { /* breakdown by filter */ },
    "suggestions": [ /* related items that might be relevant */ ]
}
`;
const ENTITY_MERGE_PROMPT = `
You are an entity merging assistant. Your task is to intelligently merge multiple entities or data sources.

Merge rules:
1. Prefer newer/more complete data when conflicts arise.
2. Combine arrays without duplicates.
3. Merge nested objects recursively.
4. Preserve IDs and relationships.
5. Track the source of each merged field.

CRITICAL: Output ONLY valid JSON. No markdown code blocks, no explanations, no prose.
Your response must start with { and end with }.

Expected output structure:
{
    "merged_entity": { /* result of merge */ },
    "conflicts_resolved": [ /* list of conflicts and how they were resolved */ ],
    "sources_used": [ /* which source contributed what */ ],
    "merge_confidence": number
}
`;

const JSON_EXTRACTION_PATTERNS = [
  // ```json ... ``` or ```JSON ... ``` (case insensitive)
  /```json\s*\n?([\s\S]*?)\n?```/i,
  // ```toon ... ``` (custom format used in project)
  /```toon\s*\n?([\s\S]*?)\n?```/i,
  // Generic code block ``` ... ```
  /```\s*\n?([\s\S]*?)\n?```/,
  // JSON in curly braces (object)
  /(\{[\s\S]*\})/,
  // JSON array
  /(\[[\s\S]*\])/
];
const cleanRawText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
};
const attemptJSONRecovery = (text) => {
  let cleaned = text;
  cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");
  cleaned = cleaned.replace(/:\s*"([^"]*)\n([^"]*)"/g, (match, p1, p2) => {
    return `: "${p1}\\n${p2}"`;
  });
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  return cleaned;
};
const tryParseJSON = (text) => {
  if (!text) return { ok: false, error: "Empty input" };
  try {
    const data = JSOX.parse(text);
    return { ok: true, data };
  } catch {
  }
  try {
    const data = JSON.parse(text);
    return { ok: true, data };
  } catch {
  }
  try {
    const recovered = attemptJSONRecovery(text);
    const data = JSOX.parse(recovered);
    return { ok: true, data };
  } catch {
  }
  try {
    const match = text.match(/^[^{[]*([{\[][\s\S]*[}\]])[^}\]]*$/);
    if (match?.[1]) {
      const data = JSOX.parse(match[1]);
      return { ok: true, data };
    }
  } catch {
  }
  return { ok: false, error: "Failed to parse JSON with all strategies" };
};
const extractJSONFromAIResponse = (response) => {
  if (response == null) {
    return { ok: false, error: "Response is null or undefined" };
  }
  if (typeof response !== "string") {
    if (typeof response === "object") {
      return { ok: true, data: response, source: "direct" };
    }
    return { ok: false, error: `Expected string, got ${typeof response}` };
  }
  const cleaned = cleanRawText(response);
  if (!cleaned) {
    return { ok: false, error: "Response is empty after cleaning", raw: response };
  }
  const directResult = tryParseJSON(cleaned);
  if (directResult.ok) {
    return { ok: true, data: directResult.data, raw: response, source: "direct" };
  }
  for (const pattern of JSON_EXTRACTION_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match?.[1]) {
      const extracted = cleanRawText(match[1]);
      const result = tryParseJSON(extracted);
      if (result.ok) {
        return {
          ok: true,
          data: result.data,
          raw: response,
          source: "markdown_block"
        };
      }
    }
  }
  const jsonLikeMatch = cleaned.match(/(\{[\s\S]+\}|\[[\s\S]+\])/);
  if (jsonLikeMatch?.[1]) {
    const recovered = attemptJSONRecovery(jsonLikeMatch[1]);
    const result = tryParseJSON(recovered);
    if (result.ok) {
      return {
        ok: true,
        data: result.data,
        raw: response,
        source: "recovered"
      };
    }
  }
  return {
    ok: false,
    error: "Could not extract valid JSON from response",
    raw: response
  };
};
const parseAIResponseSafe = (response, fallbackKey = "data") => {
  const result = extractJSONFromAIResponse(response);
  if (result.ok && result.data !== void 0) {
    return {
      raw: result.raw || response,
      ok: true,
      data: result.data,
      source: result.source,
      wasRecovered: result.source === "recovered",
      error: result.error || void 0
    };
  }
  return {
    raw: result.raw || response,
    ok: false,
    data: { [fallbackKey]: result.raw || String(response) },
    source: "fallback",
    wasRecovered: false,
    error: result.error || void 0
  };
};
const STRICT_JSON_INSTRUCTIONS = `
CRITICAL OUTPUT FORMAT REQUIREMENTS:

1. Your response MUST be ONLY valid JSON - no markdown, no explanations, no prose.
2. Do NOT wrap the JSON in code blocks (\`\`\`json or \`\`\`).
3. Do NOT include any text before or after the JSON object.
4. The response must start with { or [ and end with } or ].
5. All strings must be properly escaped (newlines as \\n, quotes as \\").
6. Use null for missing/unknown values, not undefined or empty strings.
7. Numbers should be unquoted. Booleans should be true/false (lowercase).
8. Arrays should not have trailing commas.
9. The JSON must be parseable by JSON.parse() without modification.

If you cannot provide the requested data, return: {"error": "description of the issue", "ok": false}
`;

const hasFile = () => typeof globalThis.File !== "undefined";
const hasBlob = () => typeof globalThis.Blob !== "undefined";
const DEFAULT_REQUEST_TIMEOUTS = {
  low: 60 * 1e3,
  // 1 minute
  medium: 5 * 60 * 1e3,
  // 5 minutes
  high: 15 * 60 * 1e3
  // 15 minutes
};
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY = 2e3;
function getTimeoutConfig(effort) {
  try {
    const settings = globalThis.runtimeSettings?.ai || require("../../config/RuntimeSettings").getRuntimeSettings?.()?.ai || require("../../config/Settings").loadSettings?.()?.ai;
    const timeoutSettings = settings?.requestTimeout;
    const maxRetries = settings?.maxRetries ?? DEFAULT_MAX_RETRIES;
    const timeout = timeoutSettings?.[effort] ?? DEFAULT_REQUEST_TIMEOUTS[effort];
    return { timeout, maxRetries };
  } catch {
    return {
      timeout: DEFAULT_REQUEST_TIMEOUTS[effort],
      maxRetries: DEFAULT_MAX_RETRIES
    };
  }
}
const toBase64 = (bytes) => {
  if (typeof globalThis.Buffer !== "undefined") {
    return globalThis.Buffer.from(bytes).toString("base64");
  }
  const CHUNK_SIZE = 1024 * 1024;
  if (bytes.length > CHUNK_SIZE) {
    let result = "";
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.slice(i, i + CHUNK_SIZE);
      let binary2 = "";
      for (let j = 0; j < chunk.length; j++) {
        binary2 += String.fromCharCode(chunk[j]);
      }
      result += typeof btoa === "function" ? btoa(binary2) : "";
    }
    return result;
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof btoa === "function" ? btoa(binary) : "";
};
const getUsableData = async (data) => {
  const FileCtor = hasFile() ? globalThis.File : void 0;
  const BlobCtor = hasBlob() ? globalThis.Blob : void 0;
  const isFileOrBlob = BlobCtor && data?.dataSource instanceof BlobCtor || FileCtor && data?.dataSource instanceof FileCtor;
  if (isFileOrBlob) {
    const fileSize = data?.dataSource?.size || 0;
    const MAX_FILE_SIZE2 = 10 * 1024 * 1024;
    if (fileSize > MAX_FILE_SIZE2) {
      console.warn(`[GPT-Responses] File too large: ${fileSize} bytes > ${MAX_FILE_SIZE2} bytes`);
      return {
        "type": "input_text",
        "text": `[File too large: ${(fileSize / 1024 / 1024).toFixed(1)}MB. Maximum allowed: ${(MAX_FILE_SIZE2 / 1024 / 1024).toFixed(1)}MB]`
      };
    }
    if (typesForKind?.[data?.dataKind || "input_text"] === "input_image" || data?.dataSource?.type?.startsWith?.("image/")) {
      try {
        const BASE64URL = `data:${data?.dataSource?.type};base64,`;
        const arrayBuffer = await data?.dataSource?.arrayBuffer();
        if (!arrayBuffer) {
          throw new Error("Failed to read file as ArrayBuffer");
        }
        const bytes = new Uint8Array(arrayBuffer);
        const URL2 = BASE64URL + toBase64(bytes);
        return {
          "type": "input_image",
          "detail": "auto",
          "image_url": URL2
        };
      } catch (error) {
        console.error("[GPT-Responses] Failed to process image file:", error);
        return {
          "type": "input_text",
          "text": `[Failed to process image file: ${error}]`
        };
      }
    }
    try {
      const text = await data?.dataSource?.text?.();
      if (text) {
        return {
          "type": "input_text",
          "text": text
        };
      }
    } catch (error) {
      console.error("[GPT-Responses] Failed to read text file:", error);
      return {
        "type": "input_text",
        "text": `[Failed to read text file: ${error}]`
      };
    }
  } else if (typeof data?.dataSource == "string") {
    const effectiveKind = data?.dataKind || detectDataKindFromContent(data.dataSource);
    if (typesForKind?.[effectiveKind] == "input_image") {
      const content = data?.dataSource?.trim?.() || "";
      if (content.startsWith("data:image/") && content.includes(";base64,")) {
        try {
          const url = new URL(content);
          if (url.protocol === "data:" && url.pathname.startsWith("image/")) {
            return {
              "type": "input_image",
              "image_url": content,
              "detail": "auto"
            };
          }
        } catch {
        }
      } else if (URL.canParse(content, typeof (typeof window != "undefined" ? window : globalThis)?.location == "undefined" ? void 0 : (typeof window != "undefined" ? window : globalThis)?.location?.origin || "")) {
        return {
          "type": "input_image",
          "image_url": content,
          "detail": "auto"
        };
      }
    }
    return {
      "type": "input_text",
      "text": data?.dataSource
    };
  }
  let result = data?.dataSource;
  try {
    result = typeof data?.dataSource != "object" ? data?.dataSource : encode(data?.dataSource);
  } catch (e) {
    console.warn(e);
  }
  return {
    "type": typesForKind?.[data?.dataKind || "input_text"] || "text",
    "text": result
  };
};
class GPTResponses {
  apiKey;
  apiSecret;
  apiUrl = "https://api.proxyapi.ru/openai/v1";
  model = "gpt-5.2";
  responseId = null;
  pending = [];
  messages = [];
  tools = /* @__PURE__ */ new Map();
  context = null;
  responseMap = /* @__PURE__ */ new Map();
  //
  constructor(apiKey, apiUrl, apiSecret, model) {
    this.apiKey = apiKey || "";
    this.apiUrl = apiUrl || this.apiUrl;
    this.apiSecret = apiSecret || "";
    this.model = model || this.model;
  }
  //
  setContext(context) {
    this.context = context;
    return this;
  }
  //
  async useMCP(serverLabel, origin, clientKey, secretKey) {
    this.tools.set(origin?.trim?.(), {
      "type": "mcp",
      "server_label": serverLabel,
      "server_url": origin,
      "headers": {
        "authorization": `Bearer ${clientKey}:${secretKey}`
      },
      "require_approval": "never"
    });
    return this.tools.get(origin?.trim?.());
  }
  //
  async convertPlainToInput(dataSource, dataKind = null, additionalAction = null) {
    dataKind ??= getDataKindByMIMEType(dataSource?.type) || "input_text";
    const dataInput = { dataSource, dataKind, context: this.context };
    const usableData = await getUsableData(dataInput);
    return {
      type: "message",
      role: "user",
      content: [
        { type: "input_text", text: "What to do: " + actionWithDataType(dataInput) },
        additionalAction ? { type: "text", text: "Additional request data: " + additionalAction } : null,
        { type: "input_text", text: "\n === BEGIN:ATTACHED_DATA === \n" },
        { ...usableData },
        { type: "input_text", text: "\n === END:ATTACHED_DATA === \n" }
      ]?.filter?.((item) => item !== null)
    };
  }
  //
  async attachToRequest(dataSource, dataKind = null, firstAction = null) {
    this.pending.push(await this.convertPlainToInput(
      dataSource,
      dataKind ??= getDataKindByMIMEType(dataSource?.type) || "input_text"
    ));
    if (firstAction) {
      this.pending.push(await this.askToDoAction(firstAction));
    }
    return this.pending[this.pending.length - 1];
  }
  //
  async attachExistingData(existingData, entityType) {
    this.context = {
      ...this.context,
      existingData,
      entityType: entityType || this.context?.entityType
    };
    await this.giveForRequest(`existing_data: \`${encode(existingData)}\`
`);
    return this;
  }
  //
  async giveForRequest(whatIsIt) {
    if (typeof whatIsIt !== "string") {
      try {
        const dataKind = getDataKindByMIMEType(whatIsIt?.type) || "input_text";
        const usable = await getUsableData({ dataSource: whatIsIt, dataKind, context: this.context });
        this?.pending?.push?.({
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: "Additional data for request:" },
            { type: "input_text", text: "\n === BEGIN:ATTACHED_DATA === \n" },
            { ...usable },
            { type: "input_text", text: "\n === END:ATTACHED_DATA === \n" }
          ]
        });
        return this?.pending?.[this?.pending?.length - 1];
      } catch (e) {
        whatIsIt = String(whatIsIt);
      }
    }
    this?.pending?.push?.({
      type: "message",
      role: "user",
      content: [
        { type: "input_text", text: "Additional data for request:" },
        { type: "input_text", text: String(whatIsIt) }
      ]
    });
    return this?.pending?.[this?.pending?.length - 1];
  }
  //
  async askToDoAction(action) {
    this?.pending?.push?.({
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: action }]
    });
    return this?.pending?.[this?.pending?.length - 1];
  }
  //
  beginFromResponseId(responseId = null) {
    this.responseId = this.responseId = responseId || this.responseId;
    return this;
  }
  //
  async sendRequest(effort = "low", verbosity = "low", prevResponseId = null, options = {}) {
    effort ??= "low";
    verbosity ??= "low";
    const uniquePending = /* @__PURE__ */ new Map();
    for (const item of this.pending) {
      if (!item) continue;
      try {
        const key = typeof item === "object" ? JSOX.stringify(item) : String(item);
        if (!uniquePending.has(key)) {
          uniquePending.set(key, item);
        }
      } catch (e) {
        uniquePending.set(Math.random().toString(), item);
      }
    }
    const filteredInput = Array.from(uniquePending.values());
    const jsonInstructions = options?.responseFormat === "json" ? STRICT_JSON_INSTRUCTIONS : void 0;
    const requestBody = {
      model: this.model,
      tools: Array.from(this?.tools?.values?.() || [])?.filter?.((tool) => !!tool),
      input: filteredInput,
      reasoning: { "effort": effort },
      text: { verbosity },
      max_output_tokens: options?.maxTokens || 4e5,
      previous_response_id: this.responseId = prevResponseId || this?.responseId,
      instructions: jsonInstructions
    };
    const { timeout: timeoutMs, maxRetries } = getTimeoutConfig(effort);
    console.log("[GPT] Making request to:", `${this?.apiUrl}/responses`);
    console.log("[GPT] API key present:", !!this?.apiKey);
    console.log("[GPT] Request timeout:", `${timeoutMs}ms (${timeoutMs / 1e3}s) (${effort} effort)`);
    console.log("[GPT] Max retries:", maxRetries);
    console.log("[GPT] Request body size:", JSON.stringify(requestBody).length, "characters");
    console.log("[GPT] Request input count:", filteredInput.length, "items");
    let lastError = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        console.log(`[GPT] Retry attempt ${attempt}/${maxRetries} after ${RETRY_DELAY}ms delay`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`[GPT] Request timeout after ${timeoutMs}ms (attempt ${attempt + 1}) - aborting request`);
          controller.abort("timeout");
        }, timeoutMs);
        console.log(`[GPT] Sending request (attempt ${attempt + 1})...`);
        const response = await fetch(`${this?.apiUrl}/responses`, {
          method: "POST",
          priority: "auto",
          // Remove keepalive for better timeout control
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...this?.apiKey ? { "Authorization": `Bearer ${this?.apiKey}` } : {}
          },
          body: JSON.stringify(requestBody)
        });
        console.log(`[GPT] Request sent successfully (attempt ${attempt + 1})`);
        clearTimeout(timeoutId);
        console.log("[GPT] Response status:", response.status, `(attempt ${attempt + 1})`);
        if (response.status !== 200) {
          const error = await response?.json?.()?.catch?.((e) => {
            console.error("[GPT] Failed to parse error response:", e);
            return null;
          });
          const errorMessage2 = error?.error?.message || error?.message || `HTTP ${response.status}`;
          lastError = new Error(`API error (${response.status}): ${errorMessage2}`);
          console.error("[GPT] API error:", errorMessage2);
          if (response.status >= 400 && response.status < 500) {
            throw lastError;
          }
          continue;
        }
        return await this.processSuccessfulResponse(response);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.error(`[GPT] Request failed (attempt ${attempt + 1}):`, lastError.message);
        if (lastError.name === "AbortError" || lastError.message.includes("HTTP 4")) {
          break;
        }
      }
    }
    const errorMessage = lastError ? lastError.message : "Unknown error after all retries";
    console.error("[GPT] All retry attempts failed:", errorMessage);
    throw new Error(`Request failed after ${maxRetries + 1} attempts: ${errorMessage}`);
  }
  /**
   * Process a successful response from the API
   */
  async processSuccessfulResponse(response) {
    const resp = await response?.json?.()?.catch?.((e) => {
      console.warn("[GPT] Failed to parse successful response:", e);
      return null;
    });
    if (!resp) return null;
    console.log("[GPT] Raw API response structure:", {
      type: typeof resp,
      isArray: Array.isArray(resp),
      keys: Object.keys(resp).slice(0, 10),
      keysLength: Object.keys(resp).length,
      sample: JSON.stringify(resp).substring(0, 300)
    });
    this.responseMap.set(this.responseId = resp?.id || resp?.response_id || this.responseId, resp);
    this?.messages?.push?.(...this?.pending || []);
    this?.pending?.splice?.(0, this?.pending?.length);
    this.messages.push(...resp?.output || []);
    const extractText = (r) => {
      try {
        if (!r) return null;
        if (typeof r === "string") {
          if (r.startsWith('"') && r.endsWith('"') && r.includes("\\n")) {
            try {
              const parsed = JSON.parse(r);
              console.log("[GPT] Parsed JSON string response:", typeof parsed, parsed?.substring?.(0, 100) || "object");
              if (typeof parsed === "string") {
                return parsed;
              } else if (typeof parsed === "object") {
                return extractText(parsed);
              }
            } catch (e) {
              console.log("[GPT] Failed to parse JSON string, treating as plain text");
            }
          }
          return r;
        }
        if (Array.isArray(r)) {
          console.log("[GPT] Response is array with", r.length, "items");
          console.log("[GPT] First few array items:", r.slice(0, 3).map((item) => ({
            type: typeof item,
            keys: typeof item === "object" ? Object.keys(item || {}) : "N/A",
            sample: typeof item === "string" ? item.substring(0, 50) : JSON.stringify(item).substring(0, 100)
          })));
          const texts2 = [];
          for (const item of r) {
            if (typeof item === "string") texts2.push(item);
            else if (item?.text) texts2.push(item.text);
            else if (item?.content) texts2.push(item.content);
            else if (item?.message?.content) texts2.push(item.message.content);
          }
          if (texts2.length) return texts2.join("\n\n");
        }
        if (typeof r === "object" && Object.keys(r).every((key) => !isNaN(Number(key)))) {
          console.log("[GPT] Response looks like array with", Object.keys(r).length, "numeric keys");
          const texts2 = [];
          for (const key of Object.keys(r).sort((a, b) => Number(a) - Number(b))) {
            const item = r[key];
            if (typeof item === "string") texts2.push(item);
            else if (item?.text) texts2.push(item.text);
            else if (item?.content) texts2.push(item.content);
            else if (item?.message?.content) texts2.push(item.message.content);
          }
          if (texts2.length) return texts2.join("\n\n");
        }
        if (r.output_text && Array.isArray(r.output_text) && r.output_text.length) {
          return r.output_text.join("\n\n");
        }
        const outputs = r.output || r.choices || [];
        const texts = [];
        for (const msg of outputs) {
          const content = msg?.content || msg?.message?.content || [];
          if (!content) continue;
          if (typeof content === "string") {
            texts.push(content);
          } else if (Array.isArray(content)) {
            for (const part of content) {
              if (typeof part?.text === "string") texts.push(part.text);
              else if (part?.text?.value) texts.push(part.text.value);
            }
          }
        }
        if (texts.length) return texts.join("\n\n");
      } catch (e) {
        console.warn("[GPT] Error extracting text:", e);
      }
      return null;
    };
    const text = extractText(resp);
    console.log("[GPT] Extracted text result:", text ? `"${text.substring(0, 100)}..."` : "null");
    if (text != null) {
      return JSON.stringify({
        choices: [{
          message: {
            content: text
          }
        }],
        usage: resp?.usage || {},
        id: this.responseId,
        object: "chat.completion"
      });
    }
    try {
      const fallbackText = JSOX.parse(resp?.output ?? resp);
      if (fallbackText) {
        return JSON.stringify({
          choices: [{
            message: {
              content: typeof fallbackText === "string" ? fallbackText : JSON.stringify(fallbackText)
            }
          }],
          usage: resp?.usage || {},
          id: this.responseId,
          object: "chat.completion"
        });
      }
    } catch {
    }
    return JSON.stringify({
      choices: [{
        message: {
          content: "No text content available"
        }
      }],
      usage: {},
      id: this.responseId,
      object: "chat.completion"
    });
  }
  // === NEW METHODS FOR DATA MODIFICATION ===
  //
  async modifyExistingData(existingData, modificationPrompt, instructions = []) {
    try {
      this.setContext({
        operation: "modify",
        existingData
      });
      await this.giveForRequest(DATA_MODIFICATION_PROMPT);
      await this.giveForRequest(`existing_entity: \`${encode(existingData)}\`
`);
      if (instructions.length) {
        await this.giveForRequest(buildModificationPrompt(instructions));
      }
      await this.askToDoAction(modificationPrompt);
      const raw = await this.sendRequest("high", "medium", null, {
        responseFormat: "json",
        temperature: 0.2
      });
      const parseResult = extractJSONFromAIResponse(raw);
      if (!parseResult.ok) {
        console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
        return { ok: false, error: parseResult.error || "Failed to parse AI response" };
      }
      return {
        ok: true,
        data: parseResult.data?.modified_entity || parseResult.data,
        responseId: this.responseId
      };
    } catch (e) {
      console.error("Error in modifyExistingData:", e);
      return { ok: false, error: String(e) };
    }
  }
  //
  async selectAndFilterData(dataSet, filters, searchTerms = []) {
    try {
      this.setContext({
        operation: "extract",
        filters,
        searchTerms
      });
      await this.giveForRequest(DATA_SELECTION_PROMPT);
      await this.giveForRequest(`data_set: \`${encode(dataSet)}\`
`);
      const filterDesc = filters.map(
        (f) => `Filter: ${f.field} ${f.operator} ${JSON.stringify(f.value)}`
      ).join("\n");
      await this.askToDoAction(`
Select items from the provided data set matching these criteria:
${filterDesc}
${searchTerms.length ? `
Search terms: ${searchTerms.join(", ")}` : ""}

Return matching items with relevance scores.
            `);
      const raw = await this.sendRequest("medium", "low", null, {
        responseFormat: "json",
        temperature: 0.1
      });
      const parseResult = extractJSONFromAIResponse(raw);
      if (!parseResult.ok) {
        console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
        return { ok: false, error: parseResult.error || "Failed to parse AI response" };
      }
      return {
        ok: true,
        data: parseResult.data?.selected_items || parseResult.data,
        responseId: this.responseId
      };
    } catch (e) {
      console.error("Error in selectAndFilterData:", e);
      return { ok: false, error: String(e) };
    }
  }
  //
  async mergeEntities(primary, secondary, mergeStrategy = "prefer_primary") {
    try {
      this.setContext({
        operation: "merge",
        existingData: primary
      });
      await this.giveForRequest(ENTITY_MERGE_PROMPT);
      await this.giveForRequest(`primary_entity: \`${encode(primary)}\`
`);
      await this.giveForRequest(`secondary_data: \`${encode(secondary)}\`
`);
      await this.askToDoAction(`
Merge the secondary data into the primary entity using "${mergeStrategy}" strategy:
- prefer_primary: Keep primary values when conflicts occur
- prefer_secondary: Use secondary values when conflicts occur
- prefer_newer: Compare timestamps and use newer values
- merge_all: Combine all unique values (arrays concatenated, objects deeply merged)

Return the merged entity with conflict resolution details.
            `);
      const raw = await this.sendRequest("high", "medium", null, {
        responseFormat: "json",
        temperature: 0.2
      });
      const parseResult = extractJSONFromAIResponse(raw);
      if (!parseResult.ok) {
        console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
        return { ok: false, error: parseResult.error || "Failed to parse AI response" };
      }
      return {
        ok: true,
        data: parseResult.data?.merged_entity || parseResult.data,
        responseId: this.responseId
      };
    } catch (e) {
      console.error("Error in mergeEntities:", e);
      return { ok: false, error: String(e) };
    }
  }
  //
  async searchSimilar(referenceEntity, candidateSet, similarityThreshold = 0.7) {
    try {
      this.setContext({
        operation: "analyze"
      });
      await this.giveForRequest(`reference_entity: \`${encode(referenceEntity)}\`
`);
      await this.giveForRequest(`candidate_set: \`${encode(candidateSet)}\`
`);
      await this.askToDoAction(`
Find items in the candidate set that are similar to the reference entity.
Consider semantic similarity, not just exact matches.
Compare:
- Names/titles (fuzzy match)
- Types/kinds
- Properties overlap
- Relationships

Return items with similarity score >= ${similarityThreshold}

Expected output structure:
{
    "similar_items": [
        { "item": {...}, "similarity": 0.85, "match_reasons": [...] }
    ],
    "potential_duplicates": [...],
    "related_but_different": [...]
}
            `);
      const raw = await this.sendRequest("medium", "medium", null, {
        responseFormat: "json",
        temperature: 0.3
      });
      const parseResult = extractJSONFromAIResponse(raw);
      if (!parseResult.ok) {
        console.warn("JSON extraction failed:", parseResult.error, "Raw:", parseResult.raw);
        return { ok: false, error: parseResult.error || "Failed to parse AI response" };
      }
      return {
        ok: true,
        data: parseResult.data?.similar_items || [],
        responseId: this.responseId
      };
    } catch (e) {
      console.error("Error in searchSimilar:", e);
      return { ok: false, error: String(e) };
    }
  }
  //
  async batchProcess(items, operation, batchSize = 10) {
    const results = [];
    const errors = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await this.giveForRequest(`batch_items: \`${encode(batch)}\`
`);
      await this.askToDoAction(`
Process this batch of ${batch.length} items:
${operation}

Return processed items in same order.
Expected output: { "processed": [...], "failed": [...] }
            `);
      const raw = await this.sendRequest("medium", "low", null, {
        responseFormat: "json"
      });
      if (raw) {
        const parseResult = extractJSONFromAIResponse(raw);
        if (parseResult.ok && parseResult.data) {
          results.push(...parseResult.data?.processed || []);
          if (parseResult.data?.failed?.length) {
            errors.push(...parseResult.data.failed.map((f) => f?.error || "Unknown error"));
          }
        } else {
          console.warn("Batch parsing failed:", parseResult.error);
        }
      }
    }
    return {
      ok: errors.length === 0,
      data: results,
      error: errors.length ? errors.join("; ") : void 0,
      responseId: this.responseId
    };
  }
  //
  clearPending() {
    this.pending.splice(0, this.pending.length);
    return this;
  }
  //
  getResponseId() {
    return this?.responseId;
  }
  getMessages() {
    return this?.messages;
  }
  getPending() {
    return this?.pending;
  }
  getContext() {
    return this?.context;
  }
  //
  getResponse(responseId) {
    return this?.responseMap?.get?.(responseId);
  }
}
const createGPTInstance = (apiKey, apiUrl, model) => {
  return new GPTResponses(
    apiKey,
    apiUrl || "https://api.proxyapi.ru/openai/v1",
    "",
    model || "gpt-5.2"
  );
};

export { GPTResponses, createGPTInstance, encode, parseAIResponseSafe, toBase64 };
//# sourceMappingURL=GPT-Responses.js.map
