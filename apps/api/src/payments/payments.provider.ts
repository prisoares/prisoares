/**
 * Asaas Pix payment provider.
 * Stub when ASAAS_API_KEY empty; real HTTP when key present.
 */
export interface PixChargeRequest {
  bookingId: string;
  amountCents: number;
  customerCpf: string;
  customerName: string;
  description: string;
}

export interface PixChargeResult {
  provider: 'asaas' | 'stub';
  chargeId: string;
  status: 'pending' | 'stub';
  pixCopyPaste: string;
  pixQrCodeBase64?: string;
}

export abstract class PaymentsProvider {
  abstract createPixCharge(input: PixChargeRequest): Promise<PixChargeResult>;
}

export class AsaasPaymentsProvider extends PaymentsProvider {
  async createPixCharge(input: PixChargeRequest): Promise<PixChargeResult> {
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      const amount = (input.amountCents / 100).toFixed(2);
      return {
        provider: 'stub',
        chargeId: `stub_${input.bookingId}_${Date.now()}`,
        status: 'stub',
        pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136${input.bookingId}520400005303986540${amount}5802BR5925LUDI MARKETPLACE LTDA6009SAOPAULO62070503***6304ABCD`,
        pixQrCodeBase64: undefined,
      };
    }

    const base =
      process.env.ASAAS_BASE_URL ?? 'https://sandbox.asaas.com/api/v3';

    // Ensure customer exists (simplified: create per charge)
    const customerRes = await fetch(`${base}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
      body: JSON.stringify({
        name: input.customerName,
        cpfCnpj: input.customerCpf,
      }),
    });
    if (!customerRes.ok) {
      const text = await customerRes.text();
      throw new Error(`Asaas customer error: ${text}`);
    }
    const customer = (await customerRes.json()) as { id: string };

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const paymentRes = await fetch(`${base}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: apiKey,
      },
      body: JSON.stringify({
        customer: customer.id,
        billingType: 'PIX',
        value: input.amountCents / 100,
        dueDate: dueDate.toISOString().slice(0, 10),
        description: input.description,
        externalReference: input.bookingId,
      }),
    });
    if (!paymentRes.ok) {
      const text = await paymentRes.text();
      throw new Error(`Asaas payment error: ${text}`);
    }
    const payment = (await paymentRes.json()) as { id: string };

    const qrRes = await fetch(`${base}/payments/${payment.id}/pixQrCode`, {
      headers: { access_token: apiKey },
    });
    const qr = qrRes.ok
      ? ((await qrRes.json()) as {
          encodedImage?: string;
          payload?: string;
        })
      : {};

    return {
      provider: 'asaas',
      chargeId: payment.id,
      status: 'pending',
      pixCopyPaste: qr.payload ?? `ASAAS:${payment.id}`,
      pixQrCodeBase64: qr.encodedImage,
    };
  }
}
