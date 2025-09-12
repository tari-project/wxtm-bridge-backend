import { utils } from 'ethers';

import { convertTokenFrom18ToWxtmDecimals } from './convert-token-from-18-to-wxtm-decimals';

describe('convertTokenFrom18ToWxtmDecimals', () => {
  it('should convert 18 decimals token to WXTM 6 decimals', () => {
    const tokenAmount = utils.parseUnits('1', 18).toString();

    const result = convertTokenFrom18ToWxtmDecimals({ tokenAmount });
    expect(result).toBe('1000000');
  });

  it('should handle fractional amounts correctly', () => {
    const tokenAmount = utils.parseUnits('0.5', 18).toString();

    const result = convertTokenFrom18ToWxtmDecimals({ tokenAmount });
    expect(result).toBe('500000');
  });

  it('should handle other amounts', () => {
    const tokenAmount = utils.parseUnits('1.123456789012345678', 18).toString();

    const result = convertTokenFrom18ToWxtmDecimals({ tokenAmount });
    expect(result).toBe('1123456');
  });
});
