/**
 * WhatsApp (360dialog) + e-mail — stubs until credentials exist.
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
}

export abstract class NotificationsProvider {
  abstract sendWhatsApp(message: WhatsAppMessage): Promise<{ ok: boolean; id: string }>;
  abstract sendEmail(message: EmailMessage): Promise<{ ok: boolean; id: string }>;
}

export class WhatsApp360DialogStub extends NotificationsProvider {
  async sendWhatsApp(message: WhatsAppMessage) {
    const apiKey = process.env.WHATSAPP_360DIALOG_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.log('[whatsapp:stub]', message);
      return { ok: true, id: `stub_wa_${Date.now()}` };
    }
    throw new Error('360dialog live integration not enabled yet');
  }

  async sendEmail(message: EmailMessage) {
    // eslint-disable-next-line no-console
    console.log('[email:stub]', message);
    return { ok: true, id: `stub_email_${Date.now()}` };
  }
}
