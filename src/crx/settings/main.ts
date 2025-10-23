import frontend from "../../index.mjs";

const mount = document.getElementById("app");
frontend?.(mount ?? document.body);
