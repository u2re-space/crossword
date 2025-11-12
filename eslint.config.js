/** @type {import('eslint').Linter.Config} */
export default {
    extends: ["@antfu/eslint-config"],
    languageOptions: {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    linterOptions: {
        "reportUnusedDisableDirectives": true
    },
    rules: {
        semi: ["warn", "never"],
        quotes: ["warn", "single", {"allowTemplateLiterals": true}],
        indent: ["warn", 4, {"SwitchCase": 1, "flatTernaryExpressions": true}],
        braceStyle: ["warn", "stroustrup", {"allowSingleLine": true}],
        nonblockStatementBodyPosition: ["warn", "any"],
        curly: ["warn", "all"],
        commaDangle: ["warn", "always-multiline"],
        objectCurlySpacing: ["warn", "always"],
        arrayBracketSpacing: ["warn", "never"],
        spaceBeforeBlocks: ["warn", "always"],
        keywordSpacing: ["warn", {"before": true, "after": true}],
        noMixedSpacesAndTabs: ["warn"],
    },
    settings: {
        "import/parsers": {
            "@typescript-eslint/parser": {
                "parser": "@typescript-eslint/parser",
                "files": ["**/*.ts", "**/*.tsx"]
            }
        },
        "import/resolver": {
            "typescript": {
                "alwaysTryTypes": true,
                "project": "./tsconfig.json"
            }
        }
    }
}
