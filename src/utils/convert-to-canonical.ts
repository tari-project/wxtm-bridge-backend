import { ethers } from 'ethers';

export function ethAddressToCanonical(address: string): string {
  if (!address) {
    return address;
  }

  try {
    const converted = ethers.utils.getAddress(address);
    return converted;
  } catch {
    return address;
  }
}
