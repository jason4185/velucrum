
import { ethers } from 'ethers';

const VAULT_ADDRESS = process.env.REACT_APP_VAULT_ADDRESS!;
const CUSDT_ADDRESS = process.env.REACT_APP_CUSDT_ADDRESS!;

export const getVault = (signer: any) => new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
export const getCUSDT = (signer: any) => new ethers.Contract(CUSDT_ADDRESS, CUSDT_ABI, signer);
export const getReadVault = (provider: any) => new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, provider);
export const connectWallet = async () => {
  const provider = new ethers.BrowserProvider((window as any).ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
};

export const VAULT_ABI = [
  "function deposit(bytes32 encryptedAmount, bytes memory inputProof, uint8 pool, uint256 plainAmount) external",
  "function withdraw(uint256 plainAmount) external",
  "function harvestYield() external",
  "function autoCompound(address holder) external",
  "function openLoan(bytes32 encryptedLoanAmt, bytes memory inputProof, uint256 plainLoanAmt) external",
  "function repayLoan(bytes32 encryptedAmt, bytes memory inputProof, uint256 plainAmt) external",
  "function liquidate(address borrower) external",
  "function getUserDeposited(address a) external view returns (uint256)",
  "function faucet() external",
  "function hasActiveLoan() external view returns (bool)",
  "function isHolder(address a) external view returns (bool)",
  "function getPool(address a) external view returns (uint8)",
  "function holderCount() external view returns (uint256)",
  "function totalVaultDeposited() external view returns (uint256)",
  "function getMyBalance() external view returns (bytes32)",
  "function getMyYield() external view returns (bytes32)",
  "function getMyLoan() external view returns (bytes32)",
  "function getMyYieldPosition() external view returns (uint256, uint256)",
  "function getTotalYieldPosition() external view returns (uint256, uint256)",
  "function getNextCompoundBlock(address holder) external view returns (uint256)",
  "function collateralRatio() external view returns (uint256)",
];

export const CUSDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function faucet() external",
];
