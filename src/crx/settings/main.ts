import frontend from "../../frontend/main/frontend-entry";

const mount = document.getElementById("app") as HTMLElement | null;
frontend(mount ?? document.body, { initialView: "settings" });
