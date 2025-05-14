import { kms, keyId } from './eth-signer-kms.config';
import { DescribeKeyCommand } from '@aws-sdk/client-kms';

async function describeKey(keyId: string) {
  try {
    const command = new DescribeKeyCommand({ KeyId: keyId });
    const response = await kms.send(command);
    console.log('Key description:', response.KeyMetadata);
  } catch (error) {
    console.error('Failed to describe key:', error);
  }
}

describeKey(keyId);
