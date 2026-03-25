export function sanitizeArtifactHtml(html) {
  if (!html) return { sanitized: "", error: "Empty HTML" };

  // 1. <!DOCTYPE html> で始まっているか確認（破損チェック）
  if (!html.trim().toLowerCase().startsWith("<!doctype html")) {
    return {
      sanitized: html,
      error: "Invalid HTML: does not start with <!DOCTYPE html>",
    };
  }

  let sanitized = html;

  // 2. 許可CDN以外の外部スクリプト読み込みを除去
  sanitized = sanitized.replace(
    /<script[^>]+src=["'](?!https:\/\/cdn\.jsdelivr\.net)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,
    "<!-- removed: disallowed external script -->"
  );

  // 3. fetch() による外部通信を無効化
  sanitized = sanitized.replace(
    /\bfetch\s*\(/g,
    "/* fetch blocked */ (async () => new Promise(() => {}))("
  );

  // 4. XMLHttpRequest を無効化
  sanitized = sanitized.replace(
    /new\s+XMLHttpRequest\s*\(/g,
    "/* XHR blocked */ new (class { open(){} send(){} setRequestHeader(){} abort(){} })("
  );

  // 5. localStorage / sessionStorage を無効化
  const mockStorage = "({getItem:()=>null,setItem:()=>{},removeItem:()=>{},clear:()=>{},key:()=>null,length:0})";
  sanitized = sanitized.replace(
    /\blocalStorage\b/g,
    `/* localStorage blocked */ ${mockStorage}`
  );
  sanitized = sanitized.replace(
    /\bsessionStorage\b/g,
    `/* sessionStorage blocked */ ${mockStorage}`
  );

  // 6. <form action> による外部送信を除去
  sanitized = sanitized.replace(
    /(<form[^>]*)\baction\s*=\s*["'][^"']*["']/gi,
    "$1"
  );

  return { sanitized, error: null };
}
