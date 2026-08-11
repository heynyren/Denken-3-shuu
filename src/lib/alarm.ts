/**
 * Chuông báo hết giờ.
 *
 * Tự tổng hợp tiếng bằng Web Audio thay vì phát file mp3: không cần nhét file
 * âm thanh vào bản cài đặt, và chạy được kể cả khi không có mạng.
 *
 * Chuông reo lặp lại cho tới khi người dùng bấm tắt — cố ý làm phiền, vì mục
 * đích của nó là kéo bạn ra khỏi bài khi đã quá giờ.
 */

/** Hai nốt xen kẽ nghe như chuông báo thức, không chói tai như còi liên tục. */
const TONES = [880, 660];
const BEEP_MS = 180;
const GAP_MS = 120;
const CYCLE_MS = 1400;

export interface Alarm {
  start(): void;
  stop(): void;
  readonly ringing: boolean;
}

export function createAlarm(): Alarm {
  let context: AudioContext | null = null;
  let loop: ReturnType<typeof setInterval> | null = null;
  let ringing = false;

  function burst(): void {
    if (!context) return;
    const now = context.currentTime;

    TONES.forEach((frequency, index) => {
      const at = now + (index * (BEEP_MS + GAP_MS)) / 1000;
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      // Vào ra mềm để không bị tiếng "tách" ở hai đầu nốt.
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.25, at + 0.012);
      gain.gain.setValueAtTime(0.25, at + BEEP_MS / 1000 - 0.03);
      gain.gain.linearRampToValueAtTime(0, at + BEEP_MS / 1000);

      oscillator.connect(gain).connect(context!.destination);
      oscillator.start(at);
      oscillator.stop(at + BEEP_MS / 1000 + 0.02);
    });
  }

  return {
    get ringing() {
      return ringing;
    },

    start() {
      if (ringing) return;
      ringing = true;
      // Tạo AudioContext ngay lúc reo, sau một thao tác của người dùng, nên
      // trình duyệt không chặn vì thiếu tương tác.
      context ??= new AudioContext();
      void context.resume();
      burst();
      loop = setInterval(burst, CYCLE_MS);
    },

    stop() {
      ringing = false;
      if (loop) {
        clearInterval(loop);
        loop = null;
      }
      void context?.close();
      context = null;
    },
  };
}
