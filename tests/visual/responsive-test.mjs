import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:5501/");
const cdp = process.env.CHROME_DEBUG_URL ?? "http://127.0.0.1:9222";
const pages = await fetch(`${cdp}/json/list`).then((r) => r.json());
const page = pages.find((entry) => entry.type === "page");
assert(page, "Chrome CDP must have an open page");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
const subscriptions = new Map();
let seq = 0;

socket.addEventListener("message", (event) => {
  const payload = JSON.parse(event.data);
  if (payload.id && pending.has(payload.id)) {
    const { resolve, reject } = pending.get(payload.id);
    pending.delete(payload.id);
    if (payload.error) reject(new Error(payload.error.message));
    else resolve(payload.result);
  } else {
    for (const callback of subscriptions.get(payload.method) ?? []) callback(payload.params);
  }
});
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

function command(method, params = {}) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
function once(method) {
  return new Promise((resolve) => {
    const callbacks = subscriptions.get(method) ?? new Set();
    const cb = (value) => { callbacks.delete(cb); resolve(value); };
    callbacks.add(cb);
    subscriptions.set(method, callbacks);
  });
}
async function evaluate(code) {
  const value = await command("Runtime.evaluate", {
    expression: `JSON.stringify((() => { ${code} })())`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.text);
  return JSON.parse(value.result.value);
}
async function navigate(width, height = 900, reduce = false) {
  await command("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: width <= 760,
  });
  await command("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reduce ? "reduce" : "no-preference" }],
  });
  const loaded = once("Page.loadEventFired");
  await command("Page.navigate", { url: target.href });
  await loaded;
  // Wait for measured iframe previews and browser layout to settle.
  await evaluate("return document.fonts.ready.then(() => true);");
}
await Promise.all([command("Page.enable"), command("Runtime.enable")]);
await mkdir("/tmp/portfolio-shots", { recursive: true });

try {
  for (const width of [320, 360, 390, 768, 1440]) {
    await navigate(width);
    const stats = await evaluate(`
      const root = document.documentElement;
      const button = document.querySelector(".menu-btn");
      const title = document.querySelector(".hero__title");
      const role = document.querySelector(".hero__role");
      const tagline = document.querySelector(".hero__tagline");
      const titleBox = title.getBoundingClientRect();
      return {
        viewport: window.innerWidth,
        scrollWidth: root.scrollWidth,
        heroTitleBounds: [titleBox.left, titleBox.right],
        roleFontSize: parseFloat(getComputedStyle(role).fontSize),
        taglineFontSize: parseFloat(getComputedStyle(tagline).fontSize),
        menuVisible: getComputedStyle(button).display !== "none",
        imagesBroken: [...document.images]
          .filter((img) => img.complete && img.naturalWidth === 0)
          .map((img) => img.src),
        studies: document.querySelectorAll(".project-story").length,
      };
    `);
    assert(stats.scrollWidth <= stats.viewport + 2,
      `Horizontal overflow at ${width}px: ${JSON.stringify(stats)}`);
    assert(stats.heroTitleBounds[0] >= -3 && stats.heroTitleBounds[1] <= stats.viewport + 3,
      `Hero title leaves screen at ${width}px: ${JSON.stringify(stats)}`);
    assert.equal(stats.imagesBroken.length, 0, `Broken image at ${width}px`);
    assert.equal(stats.studies, 2, "Missing case studies");
    if (width <= 390) {
      assert(stats.roleFontSize >= 10, "Mobile role text too small");
      assert(stats.taglineFontSize >= 10, "Mobile tagline too small");
    }
    if (width <= 760) {
      assert(stats.menuVisible, "Missing mobile menu");
      const menu = await evaluate(`
        const button = document.querySelector(".menu-btn");
        const first = document.querySelector(".pill-nav a");
        button.click();
        const opened = document.body.classList.contains("is-menu-open")
          && button.getAttribute("aria-expanded") === "true"
          && document.activeElement === first;
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        return { opened, closed: !document.body.classList.contains("is-menu-open"),
          restored: document.activeElement === button };
      `);
      assert(menu.opened && menu.closed && menu.restored,
        `Mobile keyboard navigation failed: ${JSON.stringify(menu)}`);
    }
    if (width === 360 || width === 1440) {
      const { data } = await command("Page.captureScreenshot", {
        format: "png", captureBeyondViewport: false,
      });
      await writeFile(`/tmp/portfolio-shots/portfolio-${width}.png`, Buffer.from(data, "base64"));
    }
    console.log(`PASS viewport=${width}, role=${stats.roleFontSize}px, tagline=${stats.taglineFontSize}px`);
  }

  await navigate(390, 900, true);
  const reduced = await evaluate(`
    const preview = document.querySelector(".project__iframe");
    const frame = document.querySelector(".project__iframe-frame");
    const style = getComputedStyle(preview);
    const story = document.querySelector(".project-story");
    story.querySelector("summary").click();
    return { transform: style.transform, scale: frame.style.getPropertyValue("--iframe-scale"),
      storyOpen: story.open };
  `);
  assert(reduced.transform !== "none", "Reduced motion cropped the iframe preview");
  assert(reduced.storyOpen, "Native details does not expand");
  console.log(`PASS reduced-motion iframe layout and case-study disclosure: ${JSON.stringify(reduced)}`);
} finally {
  socket.close();
}
