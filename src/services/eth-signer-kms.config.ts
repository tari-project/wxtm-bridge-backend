import dotenv from 'dotenv';
import { providers } from 'ethers';
import { CreateKeyCommand, KMSClient } from '@aws-sdk/client-kms';
import { KMSSigner } from '@rumblefishdev/eth-signer-kms';

dotenv.config();

export const kms = new KMSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    sessionToken: process.env.AWS_SESSION_TOKEN,
  },
});

export const providerUrl = process.env.SEPOLIA_RPC_URL || '';
export const provider = new providers.JsonRpcProvider(providerUrl);
export const keyId = process.env.KMS_KEY_ID || '';

export const getChainId = async () => {
  const network = await provider.getNetwork();

  return BigInt(network.chainId);
};

export const getKmsSigner = async () => {
  const kmsSigner = new KMSSigner(provider, keyId, kms);

  return kmsSigner as any;
};

export const createKeyId = async (): Promise<string> => {
  const command = new CreateKeyCommand({
    KeyUsage: 'SIGN_VERIFY',
    CustomerMasterKeySpec: 'ECC_SECG_P256K1',
  });

  const createResponse = await kms.send(command);

  if (!createResponse.KeyMetadata) {
    throw new Error('KeyMetadata not found in KMS response');
  }

  const keyId = createResponse.KeyMetadata.KeyId || '';

  return keyId;
};
