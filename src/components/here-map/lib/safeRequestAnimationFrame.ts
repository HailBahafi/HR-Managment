/** يتجنب استدعاء requestAnimationFrame في بيئات بدون window (SSR / Edge). */
export function safeRequestAnimationFrame(callback: FrameRequestCallback): number {
  if (typeof window === "undefined") {
    return 0;
  }
  const raf = window.requestAnimationFrame;
  if (typeof raf === "function") {
    return raf.call(window, callback);
  }
  return window.setTimeout(() => {
    callback(typeof performance !== "undefined" ? performance.now() : Date.now());
  }, 0) as unknown as number;
}
