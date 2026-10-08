export function normalizeApiUrl(value) {
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Địa chỉ phải bắt đầu bằng http:// hoặc https://');
  if (url.username || url.password || url.search || url.hash)
    throw new Error('Địa chỉ API không được chứa mật khẩu hoặc tham số.');
  return url.href.replace(/\/$/, '').replace(/\/api$/, '') + '/api';
}

export function resolveApiUrl({ platform = 'web', stored = '', configured = '' } = {}) {
  for (const value of [stored, configured]) {
    if (!value) continue;
    if (platform === 'web' && value.startsWith('/') && !value.startsWith('//'))
      return value.replace(/\/$/, '') || '/api';
    try {
      return normalizeApiUrl(value);
    } catch {}
  }
  return platform === 'android' ? 'http://10.0.2.2:3000/api' : '/api';
}
