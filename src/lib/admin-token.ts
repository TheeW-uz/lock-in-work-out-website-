import crypto from 'crypto';

const SECRET = process.env.ADMIN_SESSION_SECRET || 'lockin-default-secret-key-12345-vibe-coding-2026';

export interface AdminSession {
  admin: boolean;
  username: string;
  exp: number;
}

export function signAdminToken(username: string): string {
  const payload: AdminSession = {
    admin: true,
    username,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

export function verifyAdminToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('hex');
  
  if (signature !== expectedSig) return null;
  
  try {
    const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadStr) as AdminSession;
    if (payload.exp < Date.now()) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}
