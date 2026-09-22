/**
 * Asaas Pix payment provider stub.
 * Wire real API when ASAAS_API_KEY is set.
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

export class AsaasPaymentsStub extends PaymentsProvider {
  async createPixCharge(input: PixChargeRequest): Promise<PixChargeResult> {
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      return {
        provider: 'stub',
        chargeId: `stub_${input.bookingId}`,
        status: 'stub',
        pixCopyPaste: `00020126580014BR.GOV.BCB.PIX0136${input.bookingId}520400005303986540${(input.amountCents / 100).toFixed(2)}5802BR5925LUDI MARKETPLACE LTDA6009SAOPAULO62070503***6304ABCD`,
      };
    }

    // Phase 1+: call Asaas sandbox/production
    throw new Error('Asaas live integration not enabled in Phase 0');
  }
}
