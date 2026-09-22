/**
 * WhatsApp notifications via Meta Cloud API (360dialog) — stub interface.
 */
export interface WhatsAppMessage {
  to: string;
  template: string;
  variables?: Record<string, string>;
}

export abstract class NotificationsProvider {
  abstract sendWhatsApp(message: WhatsAppMessage): Promise<{ ok: boolean; id: string }>;
}

export class WhatsApp360DialogStub extends NotificationsProvider {
  async sendWhatsApp(message: WhatsAppMessage) {
    const apiKey = process.env.WHATSAPP_360DIALOG_API_KEY;
    if (!apiKey) {
      // eslint-disable-next-line no-console
      console.log('[whatsapp:stub]', message);
      return { ok: true, id: `stub_wa_${Date.now()}` };
    }
    throw new Error('360dialog live integration not enabled in Phase 0');
  }
}
