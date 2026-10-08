import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Tạo cấu hình riêng cho máy mới và giữ nguyên cấu hình đã có.
export function configureEnv(overrides = {}) {
  const destination = process.env.HOMEFIX_ENV_FILE || path.join(root, 'backend/.env');
  if (fs.existsSync(destination)) return destination;
  const settings = {
    PORT: '3000',
    DB_SERVER: 'localhost',
    DB_NAME: 'HomeFix_Final',
    DB_AUTH: 'windows',
    DB_ODBC_DRIVER: 'ODBC Driver 18 for SQL Server',
    DB_ENCRYPT: 'false',
    DB_USER: '',
    DB_PASSWORD: '',
    JWT_SECRET: crypto.randomBytes(48).toString('base64url'),
    CLIENT_ORIGINS:
      'http://localhost:5173,http://localhost:3000,https://localhost,http://localhost',
    OTP_EMAIL_PROVIDER: 'gmail',
    GMAIL_USER: '',
    GMAIL_APP_PASSWORD: '',
    RESEND_API_KEY: '',
    OTP_EMAIL_FROM: '',
    GEMINI_API_KEY: '',
    GEMINI_ENABLED: 'false',
    GEMINI_MODEL: 'gemini-3.5-flash-lite',
    GEMINI_DAILY_LIMIT: '100',
    ...overrides,
  };
  for (const value of Object.values(settings)) {
    if (/[\r\n]/.test(String(value))) throw new Error('Giá trị cấu hình phải nằm trên một dòng.');
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(
    destination,
    '# Cấu hình riêng của máy. Không gửi tệp này trong bản nộp.\n' +
      Object.entries(settings)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n') +
      '\n',
    { flag: 'wx' },
  );
  return destination;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const overrides = {};
  for (const argument of process.argv.slice(2)) {
    const position = argument.indexOf('=');
    const key = argument.slice(0, position);
    if (position < 1 || !/^[A-Z][A-Z_0-9]*$/.test(key))
      throw new Error('Dùng tham số TÊN=giá_trị.');
    overrides[key] = argument.slice(position + 1);
  }
  console.log('Cấu hình: ' + configureEnv(overrides));
}
