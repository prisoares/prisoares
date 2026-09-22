const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export type AuthSession = {
  token: string;
  user: { id: string; name: string; email: string; activeRole: string };
};

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ludi_partner_session');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession | null) {
  if (typeof window === 'undefined') return;
  if (!session) localStorage.removeItem('ludi_partner_session');
  else localStorage.setItem('ludi_partner_session', JSON.stringify(session));
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string } = {},
): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set('Content-Type', 'application/json');
  const token = opts.token ?? getSession()?.token;
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}
