import { ethers } from 'ethers';
import Safe, { EthSafeSignature } from '@safe-global/protocol-kit';
import SafeApiKit from '@safe-global/api-kit';
import { providerUrl, getChainId, getKmsSigner } from './eth-signer-kms.config';
import { MetaTransactionData, OperationType } from '@safe-global/types-kit';

const proposeMintViaSafe = async () => {
  console.log('Processing gnosis tx...');

  const kmsSigner = await getKmsSigner();
  const kmsAddress = await kmsSigner.getAddress();
  const chainId = await getChainId();

  const iface = new ethers.utils.Interface([
    'function mint(address to, uint256 amount)',
  ]);

  const amountToMint = ethers.utils.parseEther('0.06');
  const data = iface.encodeFunctionData('mint', [kmsAddress, amountToMint]);

  const safeTransactionData: MetaTransactionData = {
    to: process.env.WXTM_PROXY_ADDRESS || '',
    value: '0',
    data,
    operation: OperationType.Call,
  };

  console.log('KMS Address: ', kmsAddress);

  const safe = await Safe.init({
    provider: providerUrl,
    signer: kmsAddress,
    safeAddress: process.env.SAFE_ADDRESS || '',
  });

  const safeTx = await safe.createTransaction({
    transactions: [safeTransactionData],
  });

  const safeTxHash = await safe.getTransactionHash(safeTx);

  /** @dev Sign Propose */
  const sig = await kmsSigner.signMessage(safeTxHash);
  const signature = adjustVInSignature(sig);
  const safeSig = new EthSafeSignature(kmsAddress, signature, false);

  safeTx.addSignature(safeSig);

  console.log({ sig, signature });

  /** @dev Add Second Signature And More If Needed Like Below */
  // const secondSig = await kmsSigner2.signMessage(safeTxHash);
  // const adjustedSig = adjustVInSignature(secondSig);
  // const safeSig2 = new EthSafeSignature(kmsAddress2, adjustedSig, false);

  // safeTx.addSignature(safeSig2);

  /** @dev Propose Transaction To Gnosis Safe */
  const safeApiKit = new SafeApiKit({ chainId });

  try {
    console.log('Proposing transaction to Safe...');
    await safeApiKit.proposeTransaction({
      safeAddress: process.env.SAFE_ADDRESS || '',
      safeTransactionData: safeTx.data,
      safeTxHash,
      senderAddress: kmsAddress,
      senderSignature: safeSig.data,
    });

    console.log(`Transaction proposed successfully! Hash: ${safeTxHash}`);

    /** @dev Execute Transaction */
    const txResponse = await safe.executeTransaction(safeTx);
    const res = (await txResponse.transactionResponse) as any;
    await res.wait();
    console.log('Transaction executed!');
  } catch (error: any) {
    console.error('Error proposing transaction:', error);
    if (error.response && error.response.data) {
      console.error('API Response error:', error.response.data);
    }
  }
};

var adjustVInSignature = (signature: string) => {
  const ETHEREUM_V_VALUES = [0, 1, 27, 28];
  const MIN_VALID_V_VALUE_FOR_SAFE_ECDSA = 27;
  let signatureV = parseInt(signature.slice(-2), 16);
  if (!ETHEREUM_V_VALUES.includes(signatureV)) {
    throw new Error('Invalid signature');
  }

  if (signatureV < MIN_VALID_V_VALUE_FOR_SAFE_ECDSA) {
    signatureV += MIN_VALID_V_VALUE_FOR_SAFE_ECDSA;
  }

  const signatureHasPrefix = true;

  if (signatureHasPrefix) {
    signatureV += 4;
  }

  signature = signature.slice(0, -2) + signatureV.toString(16);
  return signature;
};

proposeMintViaSafe();
