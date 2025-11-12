/** @type {import('prettier').Config} */
export default {
    trailingComma: "es5",
    tabWidth: 4,
    useTabs: false,
    semi: false,
    singleQuote: true,
    printWidth: 120,
    arrowParens: "always",
    endOfLine: "lf",
    bracketSpacing: true,
    bracketSameLine: true,
    singleAttributePerLine: false,
    embeddedLanguageFormatting: "auto",
    proseWrap: "preserve",
    htmlWhitespaceSensitivity: "css",
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.mjs", "**/*.cjs"],
            options: {
                parser: "typescript"
            }
        },
        {
            files: ["**/*.scss", "**/*.css"],
            options: {
                parser: "scss"
            }
        },
        {
            files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
            options: {
                parser: "json",
                printWidth: 1000,
                trailingComma: "none"
            }
        }
    ]
}
