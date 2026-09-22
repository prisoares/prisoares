import { isValidCpf } from './cpf';

describe('isValidCpf', () => {
  it('accepts known valid CPFs', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('39053344705')).toBe(true);
  });

  it('rejects invalid CPFs', () => {
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
    expect(isValidCpf('52998224724')).toBe(false);
  });
});
