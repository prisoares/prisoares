'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, getSession, setSession, AuthSession } from '@/lib/api';

type Court = {
  id: string;
  name: string;
  priceCents: number;
  sport?: { name: string };
  availabilities?: { weekday: number; startMinute: number; endMinute: number }[];
  blocks?: { id: string; startsAt: string; endsAt: string; reason?: string }[];
};

type Venue = {
  id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  courts: Court[];
  monthlyInvoices?: {
    id: string;
    yearMonth: string;
    gmvCents: number;
    feeCents: number;
    status: string;
    pixCopyPaste?: string;
  }[];
};

type Dashboard = {
  venuesCount: number;
  courtsCount: number;
  gmvCents: number;
  monthlyFeeEstimateCents: number;
  venues: Venue[];
};

type Sport = { id: string; name: string; slug: string };

type InboxItem = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  priceCents: number;
  venue?: { name: string };
  court?: { name: string };
  user?: { name: string };
};

function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export default function PartnerHome() {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [cpf, setCpf] = useState('52998224725');
  const [password, setPassword] = useState('ludi123');
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<string>('');

  const venue = useMemo(
    () => dash?.venues.find((v) => v.id === selectedVenue) ?? dash?.venues[0],
    [dash, selectedVenue],
  );

  async function refresh(token?: string) {
    const t = token ?? getSession()?.token;
    if (!t) return;
    const [d, box, sp] = await Promise.all([
      api<Dashboard>('/partner/dashboard', { token: t }),
      api<InboxItem[]>('/bookings/partner/inbox', { token: t }),
      api<Sport[]>('/sports', { token: t }),
    ]);
    setDash(d);
    setInbox(box);
    setSports(sp);
    if (!selectedVenue && d.venues[0]) setSelectedVenue(d.venues[0].id);
  }

  useEffect(() => {
    const s = getSession();
    if (s) {
      setSessionState(s);
      refresh(s.token).catch((e) => setError(String(e.message ?? e)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api<{
        accessToken: string;
        user: AuthSession['user'];
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ cpf, password }),
      });
      // Ensure partner role active
      let user = res.user;
      if (user.activeRole !== 'PARTNER') {
        try {
          const switched = await api<{
            accessToken: string;
            user: AuthSession['user'];
          }>('/auth/switch-role', {
            method: 'POST',
            token: res.accessToken,
            body: JSON.stringify({ role: 'PARTNER' }),
          });
          user = switched.user;
          const next = { token: switched.accessToken, user };
          setSession(next);
          setSessionState(next);
          await refresh(switched.accessToken);
          return;
        } catch {
          /* keep original */
        }
      }
      const next = { token: res.accessToken, user };
      setSession(next);
      setSessionState(next);
      await refresh(res.accessToken);
    } catch (err) {
      setError(String((err as Error).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setSession(null);
    setSessionState(null);
    setDash(null);
    setInbox([]);
  }

  async function createVenue(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api('/partner/venues', {
        method: 'POST',
        body: JSON.stringify({
          name: fd.get('name'),
          address: fd.get('address'),
          neighborhood: fd.get('neighborhood'),
          city: fd.get('city') || 'Porto Alegre',
          lat: Number(fd.get('lat') || -30.0346),
          lng: Number(fd.get('lng') || -51.2177),
          description: fd.get('description') || undefined,
        }),
      });
      e.currentTarget.reset();
      await refresh();
    } catch (err) {
      setError(String((err as Error).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  async function createCourt(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!venue) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api(`/partner/venues/${venue.id}/courts`, {
        method: 'POST',
        body: JSON.stringify({
          sportId: fd.get('sportId'),
          name: fd.get('name'),
          priceCents: Math.round(Number(fd.get('price')) * 100),
        }),
      });
      e.currentTarget.reset();
      await refresh();
    } catch (err) {
      setError(String((err as Error).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  async function setWeekdayHours(courtId: string) {
    setBusy(true);
    setError('');
    try {
      const slots = [1, 2, 3, 4, 5, 6].map((weekday) => ({
        weekday,
        startMinute: 8 * 60,
        endMinute: 22 * 60,
      }));
      await api(`/partner/courts/${courtId}/availability`, {
        method: 'POST',
        body: JSON.stringify({ slots }),
      });
      await refresh();
    } catch (err) {
      setError(String((err as Error).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  async function blockTonight(courtId: string) {
    const start = new Date();
    start.setHours(20, 0, 0, 0);
    const end = new Date();
    end.setHours(22, 0, 0, 0);
    setBusy(true);
    try {
      await api(`/partner/courts/${courtId}/blocks`, {
        method: 'POST',
        body: JSON.stringify({
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          reason: 'Manutenção',
        }),
      });
      await refresh();
    } catch (err) {
      setError(String((err as Error).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  async function actBooking(id: string, action: 'accept' | 'reject') {
    setBusy(true);
    try {
      await api(`/bookings/${id}/${action}`, { method: 'POST' });
      await refresh();
    } catch (err) {
      setError(String((err as Error).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  async function issueFee() {
    if (!venue) return;
    const now = new Date();
    const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    setBusy(true);
    try {
      await api(`/partner/billing/venues/${venue.id}/invoices`, {
        method: 'POST',
        body: JSON.stringify({ yearMonth }),
      });
      await refresh();
    } catch (err) {
      setError(String((err as Error).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <main>
        <h1>LUDI Parceiro</h1>
        <p className="muted">Entre para gerenciar locais, quadras e reservas.</p>
        <form className="panel" onSubmit={login} style={{ maxWidth: 420 }}>
          <label>CPF</label>
          <input value={cpf} onChange={(e) => setCpf(e.target.value)} />
          <label style={{ marginTop: 12 }}>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button style={{ marginTop: 16 }} disabled={busy}>
            Entrar
          </button>
          {error ? <p className="error">{error}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <>
      <header className="app">
        <strong>LUDI Parceiro</strong>
        <div className="row">
          <span className="muted">{session.user.name}</span>
          <button className="secondary" type="button" onClick={logout}>
            Sair
          </button>
        </div>
      </header>
      <main>
        {error ? <p className="error">{error}</p> : null}
        <div className="grid">
          <div className="panel">
            <div className="muted">Locais</div>
            <div className="stat">{dash?.venuesCount ?? '—'}</div>
          </div>
          <div className="panel">
            <div className="muted">Quadras</div>
            <div className="stat">{dash?.courtsCount ?? '—'}</div>
          </div>
          <div className="panel">
            <div className="muted">GMV confirmado</div>
            <div className="stat">{brl(dash?.gmvCents ?? 0)}</div>
          </div>
          <div className="panel">
            <div className="muted">Taxa mapa 1% (estim.)</div>
            <div className="stat">{brl(dash?.monthlyFeeEstimateCents ?? 0)}</div>
          </div>
        </div>

        <section className="panel">
          <h2>Inbox de solicitações</h2>
          {!inbox.length ? (
            <p className="muted">Nenhuma solicitação pendente.</p>
          ) : (
            inbox.map((b) => (
              <div key={b.id} className="row" style={{ marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <strong>{b.venue?.name}</strong> · {b.court?.name}
                  <div className="muted">
                    {b.user?.name} · {new Date(b.startsAt).toLocaleString('pt-BR')} ·{' '}
                    {brl(b.priceCents)} · {b.status}
                  </div>
                </div>
                <button type="button" disabled={busy} onClick={() => actBooking(b.id, 'accept')}>
                  Aceitar
                </button>
                <button
                  type="button"
                  className="danger"
                  disabled={busy}
                  onClick={() => actBooking(b.id, 'reject')}
                >
                  Recusar
                </button>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>Novo local</h2>
          <form onSubmit={createVenue} className="grid">
            <div>
              <label>Nome</label>
              <input name="name" required />
            </div>
            <div>
              <label>Bairro</label>
              <input name="neighborhood" required />
            </div>
            <div>
              <label>Endereço</label>
              <input name="address" required />
            </div>
            <div>
              <label>Cidade</label>
              <input name="city" defaultValue="Porto Alegre" />
            </div>
            <div>
              <label>Lat</label>
              <input name="lat" defaultValue="-30.0346" />
            </div>
            <div>
              <label>Lng</label>
              <input name="lng" defaultValue="-51.2177" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" disabled={busy}>
                Criar local
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <h2>Locais e quadras</h2>
          <label>Local selecionado</label>
          <select
            value={venue?.id ?? ''}
            onChange={(e) => setSelectedVenue(e.target.value)}
          >
            {(dash?.venues ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.neighborhood}
              </option>
            ))}
          </select>

          {venue ? (
            <>
              <p className="muted" style={{ marginTop: 12 }}>
                {venue.address}, {venue.neighborhood} — {venue.city}
              </p>
              <div className="row" style={{ marginBottom: 12 }}>
                <button type="button" onClick={issueFee} disabled={busy}>
                  Gerar cobrança taxa 1% GMV (mês atual)
                </button>
              </div>
              {(venue.monthlyInvoices ?? []).map((inv) => (
                <div key={inv.id} className="muted">
                  {inv.yearMonth}: GMV {brl(inv.gmvCents)} · taxa {brl(inv.feeCents)} ·{' '}
                  {inv.status}
                  {inv.pixCopyPaste ? ` · Pix: ${inv.pixCopyPaste.slice(0, 32)}…` : ''}
                </div>
              ))}

              <h3 style={{ marginTop: 20 }}>Nova quadra</h3>
              <form onSubmit={createCourt} className="row">
                <select name="sportId" required style={{ maxWidth: 220 }}>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input name="name" placeholder="Nome da quadra" required style={{ maxWidth: 220 }} />
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Preço R$"
                  required
                  style={{ maxWidth: 140 }}
                />
                <button type="submit" disabled={busy}>
                  Adicionar
                </button>
              </form>

              {(venue.courts ?? []).map((c) => (
                <div key={c.id} className="panel" style={{ marginTop: 12 }}>
                  <strong>
                    {c.name} · {c.sport?.name ?? 'esporte'} · {brl(c.priceCents)}
                  </strong>
                  <div className="muted">
                    Grade: {c.availabilities?.length ?? 0} faixas · Bloqueios:{' '}
                    {c.blocks?.length ?? 0}
                  </div>
                  <div className="row" style={{ marginTop: 8 }}>
                    <button type="button" className="secondary" onClick={() => setWeekdayHours(c.id)}>
                      Grade seg–sáb 08–22
                    </button>
                    <button type="button" className="secondary" onClick={() => blockTonight(c.id)}>
                      Bloquear 20–22 hoje
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <p className="muted">Crie um local para começar.</p>
          )}
        </section>
      </main>
    </>
  );
}
