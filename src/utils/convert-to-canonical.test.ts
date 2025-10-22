import { ethAddressToCanonical } from './convert-to-canonical';

describe('ethAddressToCanonical', () => {
  it('converts ethereum address to a canonical version', () => {
    const result = ethAddressToCanonical(
      '0x65de5390c7ef3992c7f49c9e7ba70145a8703566',
    );

    expect(result).toBe('0x65DE5390C7Ef3992C7F49c9E7bA70145A8703566');
  });

  describe('leaves the address as is', () => {
    it('when it is already in canonical format', () => {
      const result = ethAddressToCanonical(
        '0x65DE5390C7Ef3992C7F49c9E7bA70145A8703566',
      );

      expect(result).toBe('0x65DE5390C7Ef3992C7F49c9E7bA70145A8703566');
    });

    it('when it is invalid', () => {
      const result = ethAddressToCanonical('not_provided');

      expect(result).toBe('not_provided');
    });

    it('when it is empty', () => {
      const result = ethAddressToCanonical('');

      expect(result).toBe('');
    });
  });
});
