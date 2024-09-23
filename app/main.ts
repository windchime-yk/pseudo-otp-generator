import { dirname, join } from "@std/path";
import { Webview } from "@webview/webview";

const worker = new Worker(join(dirname(import.meta.url), "worker.tsx"), {
  type: "module",
});
const webview = new Webview();

webview.navigate("http://localhost:8081");
webview.title = "Pseudo OTP Checker";
webview.run();
worker.terminate();
