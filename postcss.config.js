import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcssDiscardDuplicates from "postcss-discard-duplicates";
import postcssImport from "postcss-import";
import postcssPresetEnv from "postcss-preset-env";

const browsers = ["last 1 chrome version", "last 1 edge version"];

const presetEnvConfig = {
    stage: 0,
    autoprefixer: false,
    browsers,
    features: {
        "custom-media-queries": true,
        "logical-properties-and-values": true,
        "media-query-ranges": true,
        "nesting-rules": true,
        "color-functional-notation": true,
    },
    preserve: false,
};

const cssnanoConfig = {
    preset: [
        "advanced",
        {
            calc: false,
            layer: false,
            scope: false,
            discardComments: {
                removeAll: true,
            },
        },
    ],
};

export default {
    plugins: [
        postcssImport(),
        postcssPresetEnv(presetEnvConfig),
        autoprefixer({
            overrideBrowserslist: browsers,
            flexbox: "no-2009",
            grid: true,
        }),
        postcssDiscardDuplicates(),
        cssnano(cssnanoConfig),
    ],
};
