import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import removeDuplicateValues  from "postcss-remove-duplicate-values";
import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";

const browsers = ["last 1 chrome version", "last 1 edge version"];

const presetEnvConfig = {
    stage: false,
    autoprefixer: false,
    browsers,
    features: {
        "custom-media-queries": true
    },
    preserve: true,
};

const cssnanoConfig = {
    preset: [
        "advanced",
        {
            calc: false,
            layer: false,
            scope: false,
            discardOverridden: false,
            discardEmpty: true,
            discardUnused: true,
            discardDuplicates: true,
            reduceIdents: {
                gridTemplate: false,
            },
            mergeRules: true,
            discardComments: {
                removeAll: true,
            },
        },
    ],
};

export default {
    plugins: [
        //postcssImport(),
        postcssPresetEnv(presetEnvConfig),
        autoprefixer({
            overrideBrowserslist: browsers
        }),
        removeDuplicateValues({
            preserveEmpty: false,
        }),
        cssnano(cssnanoConfig),
    ],
};
