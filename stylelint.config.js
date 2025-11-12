/** @type {import('stylelint').Config} */
export default {
    extends: ["stylelint-config-standard-scss"],
    plugins: [
        "stylelint-plugin-logical-css",
        "stylelint-scss"
    ],
    customSyntax: "postcss-scss",
    rules: {
        "at-rule-no-unknown": null,
        "scss/at-rule-no-unknown": [true, {
            "ignoreAtRules": [
                "function",
                "mixin",
                "include",
                "extend",
                "use",
                "forward",
                "return",
                "if",
                "else",
                "for",
                "each",
                "while",
                "warn",
                "debug",
                "error"
            ],
            "severity": "warning"
        }],
        "function-no-unknown": null,
        "scss/function-no-unknown": [true, {
            "ignoreFunctions": [
                "color-mix",
                "oklch",
                "oklab",
                "style"
            ],
            "severity": "warning"
        }],
        "selector-type-no-unknown": null,
        "block-no-empty": null,
        "no-descending-specificity": null,
        "selector-class-pattern": null,
        "color-function-notation": ["modern", {"severity": "warning"}],
        "alpha-value-notation": ["percentage", {"severity": "warning"}],
        "custom-property-empty-line-before": null,
        "declaration-empty-line-before": null,
        "unit-allowed-list": [
            "em", "rem", "s", "ms", "px", "%",
            "dvi", "dvb", "dvh", "dvw", "svh", "svw",
            "lvh", "lvw", "cqi", "cqb", "cqw", "cqh"
        ],
        "scss/at-extend-no-missing-placeholder": null,
        "scss/selector-no-redundant-nesting-selector": null,
        "scss/selector-no-union-class-name": null,
        "scss/no-global-function-names": null,
        "scss/dollar-variable-pattern": null,
        "scss/dollar-variable-empty-line-before": null,
        "plugin/use-logical-properties-and-values": [true, {"severity": "warning"}],
        "plugin/use-logical-units": [true, {"severity": "warning"}],
        "plugin/no-unsupported-browser-features": [true, {"severity": "warning"}],
        "max-nesting-depth": 3,
        "selector-max-compound-selectors": 4,
        "declaration-block-no-duplicate-properties": true
    }
}
