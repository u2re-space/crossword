import frontend from "../../index";

//
const mount = document.getElementById("app");
frontend?.(mount ?? document.body);
