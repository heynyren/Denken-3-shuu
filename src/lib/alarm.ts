/**
 * Chuông báo hết giờ.
 *
 * Tự tổng hợp tiếng bằng Web Audio thay vì phát file mp3: không cần nhét file
 * âm thanh vào bản cài đặt, và chạy được kể cả khi không có mạng.
 *
 * Chuông reo lặp lại cho tới khi người dùng bấm tắt — cố ý làm phiền, vì mục
 * đích của nó là kéo bạn ra khỏi bài khi đã quá giờ.
 *
 * ---
 *
 * Vì sao chỉ có MỘT AudioContext dùng chung cho cả app, mở khoá từ sớm:
 *
 * Trình duyệt (và WebView của Android) chặn phát tiếng nếu AudioContext được
 * tạo ra mà chưa có thao tác nào của người dùng. Bản trước tạo context ngay lúc
 * chuông reo — nhưng lúc đó cái gọi `start()` là đồng hồ đếm ngược, không phải
 * ngón tay ai cả. Trên Windows thì Electron cho qua, còn trên Android thì
 * context sinh ra ở trạng thái "suspended" và chuông câm hoàn toàn.
 *
 * Cách đúng: tạo và mở khoá context ngay lần chạm màn hình đầu tiên
 * (`primeAudio()` gắn ở main.tsx), rồi giữ nguyên context đó suốt phiên. `stop()`
 * chỉ ngắt vòng lặp chứ không `close()` — đóng là mất luôn quyền phát tiếng.
 */

/** Hai nốt xen kẽ nghe như chuông báo thức, không chói tai như còi liên tục. */
const TONES = [880, 660];
const BEEP_MS = 180;
const GAP_MS = 120;
const CYCLE_MS = 1400;
/** Rung theo nhịp chuông, cho lúc điện thoại để chế độ im lặng. */
const VIBRATE_MS = [220, 140, 220];

type AudioContextCtor = typeof AudioContext;

let context: AudioContext | null = null;

function ctor(): AudioContextCtor | null {
  const win = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

/**
 * Mở khoá tiếng. Gọi ngay lần chạm / gõ phím đầu tiên, và gọi lại mỗi lần app
 * quay lại từ chế độ chạy nền — Android hay treo context lúc app xuống nền.
 *
 * Gọi bao nhiêu lần cũng được: đã có context rồi thì chỉ đánh thức lại.
 */
export function primeAudio(): void {
  const Ctor = ctor();
  if (!Ctor) return;
  context ??= new Ctor();
  if (context.state !== "running") void context.resume();
}

/** Đã sẵn sàng phát tiếng chưa — dùng để cảnh báo người dùng, không để chặn. */
export function audioReady(): boolean {
  return context !== null && context.state === "running";
}

export interface Alarm {
  start(): void;
  stop(): void;
  readonly ringing: boolean;
}

export function createAlarm(): Alarm {
  let loop: ReturnType<typeof setInterval> | null = null;
  let ringing = false;

  function burst(): void {
    // Rung trước: kể cả khi tiếng bị chặn thì vẫn còn cái này báo.
    navigator.vibrate?.(VIBRATE_MS);

    // Chuông reo lúc app vừa từ nền quay lại thì context còn đang ngủ.
    primeAudio();
    if (!context || context.state !== "running") return;
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
      burst();
      loop = setInterval(burst, CYCLE_MS);
    },

    stop() {
      const dangReo = ringing;
      ringing = false;
      if (loop) {
        clearInterval(loop);
        loop = null;
      }
      // Chỉ tắt rung khi đang thật sự rung. Gọi bừa thì trình duyệt kêu
      // "chưa ai chạm màn hình mà đã đòi rung" mỗi lần bấm chạy đồng hồ.
      if (dangReo) navigator.vibrate?.(0);
      // Cố ý KHÔNG đóng context: đóng rồi thì lần sau phải xin quyền phát lại,
      // mà lúc đó chỉ có đồng hồ gọi chứ không có thao tác nào của người dùng.
    },
  };
}
