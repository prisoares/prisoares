const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      typeof body === 'object' &&
      body &&
      'message' in body &&
      (body as { message: string | string[] }).message
        ? Array.isArray((body as { message: string[] }).message)
          ? (body as { message: string[] }).message.join(', ')
          : String((body as { message: string }).message)
        : res.statusText;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  cpf: string;
  phone: string | null;
  roles: string[];
  activeRole: 'USER' | 'PARTNER';
};

export type AuthResponse = { accessToken: string; user: AuthUser };

export type Sport = {
  id: string;
  slug: string;
  name: string;
  iconKey: string;
};

export type Venue = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  photoUrls: string[];
  minPriceCents: number;
  sports: string[];
  courts: {
    id: string;
    name: string;
    sportSlug: string;
    sportName: string;
    priceCents: number;
  }[];
};

export type Booking = {
  id: string;
  status: string;
  venueName: string;
  venueSlug?: string;
  courtName: string;
  startsAt: string;
  endsAt: string;
  holdExpiresAt?: string | null;
  paymentDueAt?: string | null;
  priceCents: number;
  commissionCents: number;
  payment?: {
    status: string;
    pixCopyPaste?: string | null;
    amountCents: number;
  } | null;
  user?: { id: string; name: string };
};

export const api = {
  register: (body: {
    name: string;
    email: string;
    cpf: string;
    password: string;
    phone?: string;
    role: 'USER' | 'PARTNER';
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (cpf: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ cpf, password }),
    }),

  me: (token: string) =>
    request<AuthUser>('/auth/me', { token }),

  switchRole: (token: string, role: 'USER' | 'PARTNER') =>
    request<AuthResponse>('/auth/switch-role', {
      method: 'POST',
      token,
      body: JSON.stringify({ role }),
    }),

  sports: () => request<Sport[]>('/sports'),

  venues: (sport?: string) =>
    request<Venue[]>(`/venues${sport ? `?sport=${encodeURIComponent(sport)}` : ''}`),

  venue: (slug: string) => request<Venue>(`/venues/${slug}`),

  createBooking: (
    token: string,
    body: { courtId: string; startsAt: string; endsAt: string },
  ) =>
    request<Booking>('/bookings', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  myBookings: (token: string) =>
    request<Booking[]>('/bookings/mine', { token }),

  partnerInbox: (token: string) =>
    request<Booking[]>('/bookings/partner/inbox', { token }),

  acceptBooking: (token: string, id: string) =>
    request<Booking>(`/bookings/${id}/accept`, { method: 'POST', token }),

  rejectBooking: (token: string, id: string) =>
    request<Booking>(`/bookings/${id}/reject`, { method: 'POST', token }),

  createPix: (token: string, id: string) =>
    request<{
      bookingId: string;
      amountCents: number;
      pixCopyPaste: string | null;
      status: string;
    }>(`/bookings/${id}/pix`, { method: 'POST', token }),

  payStub: (token: string, id: string) =>
    request<Booking>(`/bookings/${id}/pay-stub`, { method: 'POST', token }),
};

export { API_URL };
