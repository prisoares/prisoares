/**
 * CPF bureau validation stub.
 * When CPF_VALIDATION_API_KEY is set, call a real bureau (BigDataCorp/Celcoin).
 * Without key: algorithm check already done; bureau always passes (dev/MVP).
 */
import { Injectable, Logger } from '@nestjs/common';

export type CpfBureauResult = { ok: boolean; reason?: string; provider: 'stub' | 'bureau' };

@Injectable()
export class CpfBureauService {
  private readonly logger = new Logger(CpfBureauService.name);

  async validate(cpf: string, name: string): Promise<CpfBureauResult> {
    const apiKey = process.env.CPF_VALIDATION_API_KEY;
    if (!apiKey) {
      this.logger.debug(`CPF bureau stub OK for ${cpf.slice(0, 3)}*** (${name})`);
      return { ok: true, provider: 'stub' };
    }
    // Live bureau wiring left for ops credentials
    throw new Error('CPF bureau live integration not enabled — unset CPF_VALIDATION_API_KEY to use stub');
  }
}
