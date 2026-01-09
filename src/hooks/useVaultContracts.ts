import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { XPEX_SPLIT_VAULT_ABI, XPEX_YIELD_VAULT_ABI, CONTRACT_ADDRESSES, SupportedChainId } from '@/lib/contracts';
import { useState, useEffect, useCallback } from 'react';
import { base, mainnet, polygon } from 'wagmi/chains';

const chainMap = {
  8453: base,
  1: mainnet,
  137: polygon,
} as const;

export function useVaultContracts() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const contracts = CONTRACT_ADDRESSES[chainId as SupportedChainId] || CONTRACT_ADDRESSES[8453];
  const currentChain = chainMap[chainId as keyof typeof chainMap] || base;

  // Split Vault Read Functions
  const { data: splitVaultBalance, refetch: refetchSplitBalance } = useReadContract({
    address: contracts.splitVault,
    abi: XPEX_SPLIT_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: splitPendingRewards, refetch: refetchSplitRewards } = useReadContract({
    address: contracts.splitVault,
    abi: XPEX_SPLIT_VAULT_ABI,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: splitTotalDeposits } = useReadContract({
    address: contracts.splitVault,
    abi: XPEX_SPLIT_VAULT_ABI,
    functionName: 'totalDeposits',
    query: { enabled: isConnected },
  });

  const { data: splitRatio } = useReadContract({
    address: contracts.splitVault,
    abi: XPEX_SPLIT_VAULT_ABI,
    functionName: 'splitRatio',
    query: { enabled: isConnected },
  });

  // Yield Vault Read Functions
  const { data: yieldVaultBalance, refetch: refetchYieldBalance } = useReadContract({
    address: contracts.yieldVault,
    abi: XPEX_YIELD_VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected },
  });

  const { data: yieldTotalAssets } = useReadContract({
    address: contracts.yieldVault,
    abi: XPEX_YIELD_VAULT_ABI,
    functionName: 'totalAssets',
    query: { enabled: isConnected },
  });

  const { data: yieldCurrentAPY } = useReadContract({
    address: contracts.yieldVault,
    abi: XPEX_YIELD_VAULT_ABI,
    functionName: 'currentAPY',
    query: { enabled: isConnected },
  });

  // Write Functions
  const { writeContract, isPending: isWritePending, data: writeData } = useWriteContract();

  // Watch transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (writeData) {
      setTxHash(writeData);
    }
  }, [writeData]);

  useEffect(() => {
    if (isConfirmed) {
      refetchSplitBalance();
      refetchSplitRewards();
      refetchYieldBalance();
    }
  }, [isConfirmed, refetchSplitBalance, refetchSplitRewards, refetchYieldBalance]);

  // Split Vault Actions
  const depositToSplitVault = useCallback((amount: string) => {
    if (!address) return;
    const value = parseEther(amount);
    writeContract({
      address: contracts.splitVault,
      abi: XPEX_SPLIT_VAULT_ABI,
      functionName: 'deposit',
      args: [value],
      value,
      account: address,
      chain: currentChain,
    });
  }, [address, contracts.splitVault, currentChain, writeContract]);

  const withdrawFromSplitVault = useCallback((shares: string) => {
    if (!address) return;
    writeContract({
      address: contracts.splitVault,
      abi: XPEX_SPLIT_VAULT_ABI,
      functionName: 'withdraw',
      args: [parseEther(shares)],
      account: address,
      chain: currentChain,
    });
  }, [address, contracts.splitVault, currentChain, writeContract]);

  const claimSplitRewards = useCallback(() => {
    if (!address) return;
    writeContract({
      address: contracts.splitVault,
      abi: XPEX_SPLIT_VAULT_ABI,
      functionName: 'claimRewards',
      account: address,
      chain: currentChain,
    });
  }, [address, contracts.splitVault, currentChain, writeContract]);

  // Yield Vault Actions
  const depositToYieldVault = useCallback((amount: string) => {
    if (!address) return;
    const value = parseEther(amount);
    writeContract({
      address: contracts.yieldVault,
      abi: XPEX_YIELD_VAULT_ABI,
      functionName: 'deposit',
      args: [value],
      value,
      account: address,
      chain: currentChain,
    });
  }, [address, contracts.yieldVault, currentChain, writeContract]);

  const withdrawFromYieldVault = useCallback((shares: string) => {
    if (!address) return;
    writeContract({
      address: contracts.yieldVault,
      abi: XPEX_YIELD_VAULT_ABI,
      functionName: 'withdraw',
      args: [parseEther(shares)],
      account: address,
      chain: currentChain,
    });
  }, [address, contracts.yieldVault, currentChain, writeContract]);

  const harvestYield = useCallback(() => {
    if (!address) return;
    writeContract({
      address: contracts.yieldVault,
      abi: XPEX_YIELD_VAULT_ABI,
      functionName: 'harvest',
      account: address,
      chain: currentChain,
    });
  }, [address, contracts.yieldVault, currentChain, writeContract]);

  return {
    // Connection
    isConnected,
    address,
    chainId,
    contracts,

    // Split Vault Data
    splitVault: {
      balance: splitVaultBalance ? formatEther(splitVaultBalance) : '0',
      pendingRewards: splitPendingRewards ? formatEther(splitPendingRewards) : '0',
      totalDeposits: splitTotalDeposits ? formatEther(splitTotalDeposits) : '0',
      splitRatio: splitRatio ? Number(splitRatio) / 100 : 0,
    },

    // Yield Vault Data
    yieldVault: {
      balance: yieldVaultBalance ? formatEther(yieldVaultBalance) : '0',
      totalAssets: yieldTotalAssets ? formatEther(yieldTotalAssets) : '0',
      currentAPY: yieldCurrentAPY ? Number(yieldCurrentAPY) / 100 : 0,
    },

    // Actions
    depositToSplitVault,
    withdrawFromSplitVault,
    claimSplitRewards,
    depositToYieldVault,
    withdrawFromYieldVault,
    harvestYield,

    // Transaction State
    isPending: isWritePending || isConfirming,
    isConfirmed,
    txHash,
  };
}
