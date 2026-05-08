import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { adjustWalletBalance, cancelWalletBalance, updateWalletStatus } from './service';
import { walletKeys } from './queries';
import type {
  ManualWalletAdjustRequest,
  CancelWalletRequest,
  UpdateWalletStatusRequest
} from './types';

const invalidateWallets = () => {
  getQueryClient().invalidateQueries({ queryKey: walletKeys.all });
};

export const adjustWalletBalanceMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: ManualWalletAdjustRequest }) =>
    adjustWalletBalance(userId, data),
  onSettled: invalidateWallets
});

export const cancelWalletBalanceMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: CancelWalletRequest }) =>
    cancelWalletBalance(userId, data),
  onSettled: invalidateWallets
});

export const updateWalletStatusMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: UpdateWalletStatusRequest }) =>
    updateWalletStatus(userId, data),
  onSettled: invalidateWallets
});
