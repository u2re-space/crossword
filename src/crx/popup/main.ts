import frontend from "../../frontend/basic";

const mount = document.getElementById("app") as HTMLElement | null;
frontend(mount ?? document.body, { initialView: "markdown" });


