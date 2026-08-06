import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { RowDataPacket } from 'mysql2';
import { dbReady, getPool } from '@/lib/db';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

const COOKIE = 'csp_session';

function sessionSecret() {
  return process.env.AUTH_SECRET || 'caspian-hackathon-dev-secret';
}

export function hashPassword(email: string, password: string) {
  return createHash('sha256')
    .update(`${email.trim().toLowerCase()}:${password}`)
    .digest('hex');
}

export function signSession(user: AuthUser) {
  const payload = Buffer.from(JSON.stringify(user), 'utf8').toString('base64url');
  const sig = createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): AuthUser | null {
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const user = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as AuthUser;
    if (!user?.id || !user?.email || !user?.name) return null;
    return user;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: AuthUser) {
  const jar = await cookies();
  jar.set(COOKIE, signSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

export async function findUserByEmail(email: string) {
  await dbReady();
  const [rows] = await getPool().query<UserRow[]>(
    'SELECT id, email, name, password_hash FROM users WHERE email = :email LIMIT 1',
    { email: email.trim().toLowerCase() },
  );
  return rows[0] ?? null;
}

export async function createUser(input: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}) {
  await dbReady();
  await getPool().query(
    `INSERT INTO users (id, email, name, password_hash)
     VALUES (:id, :email, :name, :passwordHash)`,
    {
      id: input.id,
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      passwordHash: input.passwordHash,
    },
  );
}
