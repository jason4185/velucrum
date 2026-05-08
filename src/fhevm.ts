import { ethers } from 'ethers';
let fhevmInstance: any = null;

export const getFhevmInstance = async () => {
  if (fhevmInstance) return fhevmInstance;
  const { createInstance, SepoliaConfig, initSDK } = await import('@zama-fhe/relayer-sdk/web');
  await initSDK();
  fhevmInstance = await createInstance({ ...SepoliaConfig, network: (window as any).ethereum } as any);
  return fhevmInstance;
};

const toHex = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) {
    return '0x' + Array.from(value).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  }
  return value;
};

export const encryptUint64 = async (
  value: number,
  contractAddress: string,
  userAddress: string
) => {
  const instance = await getFhevmInstance();
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add64(value);
  const encrypted = await input.encrypt();
  const handles = encrypted.handles;
  const proof = encrypted.inputProof;
  if (!handles || handles.length === 0) {
    throw new Error('Encryption failed — no handles returned');
  }
  return {
    handle: toHex(handles[0]),
    proof: toHex(proof),
  };
};

export const encryptUint8 = async (
  value: number,
  contractAddress: string,
  userAddress: string
) => {
  const instance = await getFhevmInstance();
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  input.add8(value);
  const encrypted = await input.encrypt();
  const handles = encrypted.handles;
  const proof = encrypted.inputProof;
  if (!handles || handles.length === 0) {
    throw new Error('Encryption failed — no handles returned');
  }
  return {
    handle: toHex(handles[0]),
    proof: toHex(proof),
  };
};
