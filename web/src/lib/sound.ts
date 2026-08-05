"use client";

/**
 * Âm thanh nhẹ bằng WebAudio — không cần file, phát chuông khi có phần thưởng.
 * Tất cả phép gọi đều bọc try/catch: trình duyệt chặn thì im lặng.
 */
let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, gain = 0.06) {
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ac.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

/** Chuông đột phá — 3 nốt thăng dần. */
export function playLevelChime() {
  try {
    tone(523.25, 0, 0.18);
    tone(659.25, 0.12, 0.18);
    tone(783.99, 0.24, 0.3, 0.08);
  } catch {
    /* bỏ qua */
  }
}

/** "Ting" phần thưởng — nốt cao nhẹ. */
export function playRewardTing() {
  try {
    tone(880, 0, 0.14, 0.045);
  } catch {
    /* bỏ qua */
  }
}

/** Tiếng vang khi nhận bảo vật hiếm. */
export function playRareDrop() {
  try {
    tone(987.77, 0, 0.2, 0.06);
    tone(1318.51, 0.14, 0.35, 0.07);
  } catch {
    /* bỏ qua */
  }
}

/** Rung nhẹ trên điện thoại (haptic) — iOS/desktop bỏ qua im lặng. */
export function haptic(ms = 25) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    /* bỏ qua */
  }
}
