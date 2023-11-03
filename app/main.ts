import { dirname, join } from "std/path/mod.ts";
import { Webview } from "webview";

const worker = new Worker(join(dirname(import.meta.url), "worker.tsx"), {
  type: "module",
});
const webview = new Webview();

webview.navigate("http://localhost:8081");
webview.title = "Pseudo OTP Checker";
webview.run();
worker.terminate();
