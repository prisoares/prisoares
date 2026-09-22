/**
 * Notifications: e-mail + WhatsApp (Meta Cloud via 360dialog).
 * Stub logs when keys are empty.
 */
export interface WhatsAppMessage {
  to: string;
  template: string;
  variables?: Record<string, string>;
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  template?: string;
  variables?: Record<string, string>;
}

export type NotifyEvent =
  | 'partner_accepted'
  | 'payment_pending'
  | 'confirmed'
  | 'cancelled';

export abstract class NotificationsProvider {
  abstract sendWhatsApp(
    message: WhatsAppMessage,
  ): Promise<{ ok: boolean; id: string }>;
  abstract sendEmail(
    message: EmailMessage,
  ): Promise<{ ok: boolean; id: string }>;
  abstract notifyBooking(input: {
    event: NotifyEvent;
    email?: string | null;
    phone?: string | null;
    variables?: Record<string, string>;
  }): Promise<void>;
}

const EMAIL_SUBJECTS: Record<NotifyEvent, string> = {
  partner_accepted: 'LUDI — Parceiro aceitou sua reserva',
  payment_pending: 'LUDI — Pagamento Pix pendente',
  confirmed: 'LUDI — Reserva confirmada',
  cancelled: 'LUDI — Reserva cancelada',
};

const WA_TEMPLATES: Record<NotifyEvent, string> = {
  partner_accepted: 'partner_accepted',
  payment_pending: 'payment_pending',
  confirmed: 'booking_confirmed',
  cancelled: 'booking_cancelled',
};

export class LudiNotificationsStub extends NotificationsProvider {
  async sendWhatsApp(message: WhatsAppMessage) {
    const apiKey = process.env.WHATSAPP_360DIALOG_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.log('[whatsapp:stub]', message);
      return { ok: true, id: `stub_wa_${Date.now()}` };
    }
    const base =
      process.env.WHATSAPP_360DIALOG_BASE_URL ??
      'https://waba.360dialog.io/v1';
    // Live path reserved for ops keys; still stub body shape for MVP.
    // eslint-disable-next-line no-console
    console.log('[whatsapp:360dialog]', { base, message });
    return { ok: true, id: `wa_${Date.now()}` };
  }

  async sendEmail(message: EmailMessage) {
    const apiKey = process.env.EMAIL_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.log('[email:stub]', message);
      return { ok: true, id: `stub_email_${Date.now()}` };
    }
    // eslint-disable-next-line no-console
    console.log('[email:live-stub]', message);
    return { ok: true, id: `email_${Date.now()}` };
  }

  async notifyBooking(input: {
    event: NotifyEvent;
    email?: string | null;
    phone?: string | null;
    variables?: Record<string, string>;
  }) {
    const vars = input.variables ?? {};
    const body = Object.entries(vars)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    if (input.email) {
      await this.sendEmail({
        to: input.email,
        subject: EMAIL_SUBJECTS[input.event],
        body: body || EMAIL_SUBJECTS[input.event],
        template: input.event,
        variables: vars,
      });
    }
    if (input.phone) {
      await this.sendWhatsApp({
        to: input.phone,
        template: WA_TEMPLATES[input.event],
        variables: vars,
      });
    }
  }
}
