import { HERE_CDN_BASE } from "../constants/constants";

// ─────────────────────────────────────────────────────────────────────────────
// HERE Maps CDN loader
// ─────────────────────────────────────────────────────────────────────────────

function injectStylesheet(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel  = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => {
        existing.setAttribute("data-loaded", "true");
        finish();
      }, { once: true });
      existing.addEventListener("error", () => {
        if (done) return;
        done = true;
        reject(new Error(`فشل تحميل الملف: ${src}`));
      }, { once: true });
      // Script may already be loaded (e.g. from another component); load won't fire again
      setTimeout(() => finish(), 600);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = () => reject(new Error(`فشل تحميل الملف: ${src}`));
    document.head.appendChild(script);
  });
}

function waitForService(maxMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const H = typeof window !== "undefined" ? (window as Window & { H?: { service?: { Platform?: unknown } } }).H : undefined;
      if (H?.service?.Platform) {
        resolve();
        return;
      }
      if (Date.now() - start > maxMs) {
        reject(new Error("HERE Maps service not ready: H.service.Platform is undefined"));
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}

/**
 * Loads the four HERE Maps JS modules in their required dependency order.
 * Each module is injected once and cached by the browser on subsequent mounts.
 */
export async function loadHereMapsSdk(): Promise<void> {
  injectStylesheet(`${HERE_CDN_BASE}/mapsjs-ui.css`);
  await injectScript(`${HERE_CDN_BASE}/mapsjs-core.js`);
  await injectScript(`${HERE_CDN_BASE}/mapsjs-service.js`);
  await injectScript(`${HERE_CDN_BASE}/mapsjs-mapevents.js`);
  await injectScript(`${HERE_CDN_BASE}/mapsjs-ui.js`);
  await waitForService();
}
