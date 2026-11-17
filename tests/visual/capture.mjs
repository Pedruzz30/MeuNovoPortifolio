import { writeFile } from "node:fs/promises";

const [output, widthText, heightText] = process.argv.slice(2);
const width = Number(widthText);
const height = Number(heightText);

const pages = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
const page = pages.find((item) => item.type === "page");

if (!page) throw new Error("Nenhuma página disponível no Chrome de QA.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let commandId = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;

  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);

  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function command(method, params = {}) {
  const id = ++commandId;
  socket.send(JSON.stringify({ id, method, params }));

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

await command("Page.enable");
await command("Runtime.enable");
await command("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width <= 760,
});

await command("Runtime.evaluate", {
  expression: `
    document.documentElement.style.scrollBehavior = "auto";
    document.querySelector(".work__header")?.classList.add("is-visible");
    document.querySelectorAll(".project").forEach((node) => node.classList.add("is-visible"));
    const target = document.querySelector("#github-projects");
    target?.scrollIntoView({ block: "start" });
    window.scrollBy(0, -28);
  `,
  awaitPromise: true,
});

await new Promise((resolve) => setTimeout(resolve, 1200));

const screenshot = await command("Page.captureScreenshot", {
  format: "png",
  fromSurface: true,
  captureBeyondViewport: false,
});

await writeFile(output, Buffer.from(screenshot.data, "base64"));
socket.close();
