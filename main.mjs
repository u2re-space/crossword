import { AppLayout } from "./src/layout/Mobile.ts";

//
import { H, Q } from "fest/lure";
import { colorScheme } from "fest/fl-ui";
import { loadInlineStyle, default as loadCSS } from "fest/dom";
import { makeReactive } from "fest/object";

//
async function main() {
    await loadCSS();

    //
    const container = document.querySelector("#app") || document.body;

    //
    /*fetch("./imgs/test.jpg")?.then?.(async (res)=>{
        const blob = await res.blob();
        colorScheme(blob);
    });*/

    //
    const app = AppLayout(H`<div>Hello, world!</div>`);
    container.append(app);

    //
    Q("#app", document.documentElement)?.addEventListener?.("dragover", (event)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
        }
    });

    //
    Q("#app", document.documentElement)?.addEventListener?.("drop", (event)=>{
        if (event?.target?.matches?.("#app") || event?.target?.querySelector?.("#app")) {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            console.log(file);
            if (file) { dropFile(file, "/user/images/"); }
        }
    });
}

//
main();
