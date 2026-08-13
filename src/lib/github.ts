/**
 * Chỗ chứa dữ liệu trên mạng: một file trong repo riêng tư của bạn trên GitHub.
 *
 * Vì sao GitHub chứ không phải Google Drive
 * -----------------------------------------
 * Drive cần một dự án Google Cloud, màn hình đồng ý, và một Client ID Android
 * khoá theo vân tay SHA-1 của khoá ký APK — nghĩa là phải tạo khoá ký trước rồi
 * mới xin được khoá đăng nhập. Cả dây chuyền đó mất nửa buổi. GitHub thì chỉ cần
 * một repo riêng tư trống và một token: máy tính và điện thoại dùng chung một
 * token, không dính gì tới chữ ký của bản cài đặt.
 *
 * Dùng đúng hai lệnh của GitHub Contents API:
 *
 *   GET  /repos/{repo}/contents/{file}   đọc file về, kèm mã `sha` của bản đó
 *   PUT  /repos/{repo}/contents/{file}   ghi đè, phải nộp lại đúng `sha` vừa đọc
 *
 * `sha` chính là khoá chống ghi đè lẫn nhau: nếu máy kia vừa ghi xong trước ta,
 * `sha` ta cầm đã cũ, GitHub từ chối và ta biết phải đọc lại rồi gộp lại. Không
 * có nó thì hai máy cùng ghi một lúc là một bên mất trắng.
 */

/** Chữ ký của `fetch`, tách ra để kiểm thử tiêm bản giả vào được. */
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

export interface GithubTarget {
  /** Dạng "chu-tai-khoan/ten-repo". */
  repo: string;
  /** Token của bạn. Không bao giờ nằm trong data.json. */
  token: string;
  /** Tên file trong repo. */
  file: string;
}

export interface RemoteFile {
  /** Nội dung file; `null` = repo chưa có file này (lần đồng bộ đầu tiên). */
  text: string | null;
  /** Mã bản hiện tại, phải nộp lại lúc ghi. `null` khi file chưa tồn tại. */
  sha: string | null;
}

/** Lỗi có thể nói lại cho người dùng bằng tiếng Việt. */
export class GithubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Máy kia vừa ghi trước — đọc lại rồi gộp lại là xong, không phải lỗi thật. */
    readonly conflict = false,
  ) {
    super(message);
    this.name = "GithubError";
  }
}

const API = "https://api.github.com";

/** Repo phải đúng dạng "chu/ten", không cho lọt đường dẫn lạ vào URL. */
export function validRepo(repo: string): boolean {
  return /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(repo.trim());
}

/* ------------------------------------------------------------------ */
/* Base64 cho chữ UTF-8                                                */
/* ------------------------------------------------------------------ */

/**
 * `btoa` chỉ nuốt được ký tự dưới 256, mà dữ liệu đầy tiếng Việt lẫn tiếng
 * Nhật — phải mã hoá ra byte UTF-8 trước, không thì ném lỗi ngay ký tự đầu.
 */
export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const CHUNK = 0x8000; // đẩy cả mảng vài trăm nghìn phần tử vào là tràn stack
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function fromBase64(encoded: string): string {
  // GitHub trả về base64 có xuống dòng mỗi 60 ký tự.
  const binary = atob(encoded.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/* ------------------------------------------------------------------ */
/* Gọi API                                                             */
/* ------------------------------------------------------------------ */

function headers(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

/** Đổi mã lỗi HTTP thành câu nói được cho người dùng. */
async function explain(response: Awaited<ReturnType<FetchLike>>): Promise<GithubError> {
  let detail = "";
  try {
    const body = (await response.json()) as { message?: string };
    detail = typeof body?.message === "string" ? body.message : "";
  } catch {
    // Không đọc được thân phản hồi thì thôi, mã trạng thái là đủ để đoán.
  }

  switch (response.status) {
    case 401:
      return new GithubError("Token sai hoặc đã hết hạn. Tạo token mới nhé.", 401);
    case 403:
      return new GithubError(
        /rate limit/i.test(detail)
          ? "GitHub tạm chặn vì gọi quá nhiều, chờ một lúc rồi thử lại."
          : "Token không đủ quyền. Token phải có quyền Contents: Read and write.",
        403,
      );
    case 404:
      return new GithubError(
        "Không thấy repo. Kiểm tra lại tên repo, và token phải được cấp quyền cho đúng repo đó.",
        404,
      );
    case 409:
    case 422:
      return new GithubError("Máy kia vừa ghi trước. Đang đọc lại để gộp.", response.status, true);
    default:
      return new GithubError(
        `GitHub trả lỗi ${response.status}${detail ? ` — ${detail}` : ""}`,
        response.status,
      );
  }
}

function contentUrl(target: GithubTarget): string {
  return `${API}/repos/${target.repo}/contents/${encodeURIComponent(target.file)}`;
}

/** Đọc file về. File chưa có thì trả `{ text: null, sha: null }`, không phải lỗi. */
export async function pullFile(
  target: GithubTarget,
  doFetch: FetchLike,
): Promise<RemoteFile> {
  if (!validRepo(target.repo)) {
    throw new GithubError('Tên repo phải có dạng "tai-khoan/ten-repo".', 0);
  }

  const response = await doFetch(contentUrl(target), {
    method: "GET",
    headers: headers(target.token),
  });

  // 404 ở đây có hai nghĩa: chưa có file, hoặc không thấy repo. Phân biệt được
  // bằng cách hỏi thẳng repo — nhầm hai cái này là báo sai hẳn nguyên nhân.
  if (response.status === 404) {
    const repoCheck = await doFetch(`${API}/repos/${target.repo}`, {
      method: "GET",
      headers: headers(target.token),
    });
    if (repoCheck.ok) return { text: null, sha: null };
    throw await explain(repoCheck);
  }

  if (!response.ok) throw await explain(response);

  const body = (await response.json()) as { content?: string; sha?: string };
  if (typeof body.content !== "string" || typeof body.sha !== "string") {
    throw new GithubError("GitHub trả về nội dung lạ, không đọc được.", response.status);
  }
  return { text: fromBase64(body.content), sha: body.sha };
}

/**
 * Ghi đè file.
 *
 * @param sha Mã bản vừa đọc được; `null` khi tạo file lần đầu. Nộp sai `sha` là
 *   GitHub từ chối — đó chính là cái chặn hai máy ghi đè lên nhau.
 */
export async function pushFile(
  target: GithubTarget,
  text: string,
  sha: string | null,
  message: string,
  doFetch: FetchLike,
): Promise<string> {
  const response = await doFetch(contentUrl(target), {
    method: "PUT",
    headers: headers(target.token),
    body: JSON.stringify({
      message,
      content: toBase64(text),
      ...(sha ? { sha } : {}),
    }),
  });

  if (!response.ok) throw await explain(response);

  const body = (await response.json()) as { content?: { sha?: string } };
  const next = body.content?.sha;
  if (typeof next !== "string") {
    throw new GithubError("Ghi xong mà GitHub không trả về mã bản mới.", response.status);
  }
  return next;
}

/** Kiểm tra token và repo trước khi bật đồng bộ, để báo lỗi sớm và rõ. */
export async function checkAccess(
  target: GithubTarget,
  doFetch: FetchLike,
): Promise<{ ok: true; private: boolean } | { ok: false; error: string }> {
  if (!validRepo(target.repo)) {
    return { ok: false, error: 'Tên repo phải có dạng "tai-khoan/ten-repo".' };
  }
  if (!target.token.trim()) return { ok: false, error: "Chưa điền token." };

  try {
    const response = await doFetch(`${API}/repos/${target.repo}`, {
      method: "GET",
      headers: headers(target.token),
    });
    if (!response.ok) throw await explain(response);
    const body = (await response.json()) as { private?: boolean; permissions?: { push?: boolean } };
    if (body.permissions && body.permissions.push === false) {
      return { ok: false, error: "Token chỉ đọc được. Cần quyền Contents: Read and write." };
    }
    return { ok: true, private: body.private === true };
  } catch (cause) {
    return { ok: false, error: (cause as Error).message };
  }
}
