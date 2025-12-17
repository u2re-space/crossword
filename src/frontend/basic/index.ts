import type { BasicAppOptions } from "./Main";
import { mountBasicApp } from "./Main";

export default function frontend(mountElement: HTMLElement, options: BasicAppOptions = {}) {
  mountBasicApp(mountElement, options);
}


