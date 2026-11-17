const targetUrl = new URL(process.argv[2] ?? "http://127.0.0.1:5501/");
const debuggingUrl = process.env.CHROME_DEBUG_URL ?? "http://127.0.0.1:9222";

const pages = await fetch(`${debuggingUrl}/json/list`).then((response) =>
  response.json()
);
const page = pages.find((item) => item.type === "page");

if (!page) {
  throw new Error("Nenhuma página disponível no Chrome de QA.");
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const eventListeners = new Map();
const requests = new Map();
const failures = [];
let commandId = 0;

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);

    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);

    return;
  }

  eventListeners.get(message.method)?.forEach((listener) =>
    listener(message.params)
  );
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

function once(method) {
  return new Promise((resolve) => {
    const listeners = eventListeners.get(method) ?? new Set();

    const listener = (params) => {
      listeners.delete(listener);
      resolve(params);
    };

    listeners.add(listener);
    eventListeners.set(method, listeners);
  });
}

function on(method, listener) {
  const listeners = eventListeners.get(method) ?? new Set();
  listeners.add(listener);
  eventListeners.set(method, listeners);
}

await Promise.all([
  command("Page.enable"),
  command("Runtime.enable"),
  command("Network.enable"),
]);

on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
  if (!exceptionDetails.url || exceptionDetails.url.startsWith(targetUrl.origin)) {
    failures.push(`JavaScript: ${exceptionDetails.text}`);
  }
});

on("Network.responseReceived", ({ response }) => {
  if (response.url.startsWith(targetUrl.origin) && response.status >= 400) {
    failures.push(`HTTP ${response.status}: ${response.url}`);
  }
});

on("Network.requestWillBeSent", ({ requestId, request }) => {
  requests.set(requestId, request.url);
});

on("Network.loadingFailed", ({ errorText, requestId, type }) => {
  const resourceUrl = requests.get(requestId);

  if (resourceUrl?.startsWith(targetUrl.origin) && type !== "Document") {
    failures.push(`Recurso (${type}): ${resourceUrl} — ${errorText}`);
  }
});

const loaded = once("Page.loadEventFired");
await command("Page.navigate", { url: targetUrl.href });
await loaded;

const { result } = await command("Runtime.evaluate", {
  expression: `JSON.stringify({
    title: document.title,
    sections: [...document.querySelectorAll("main[id], section[id]")].map(({ id }) => id),
    stylesheets: [...document.styleSheets].map(({ href }) => href).filter(Boolean),
    scripts: [...document.scripts].map(({ src }) => src).filter(Boolean),
    brokenImages: [...document.images]
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map(({ src }) => src)
  })`,
  returnByValue: true,
});

const summary = JSON.parse(result.value);

if (summary.brokenImages.length) {
  failures.push(...summary.brokenImages.map((src) => `Imagem inválida: ${src}`));
}

console.log(JSON.stringify({ ...summary, failures }, null, 2));
socket.close();

if (failures.length) process.exitCode = 1;
