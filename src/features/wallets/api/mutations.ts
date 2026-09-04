import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { adjustWalletBalance, cancelWalletBalance, updateWalletStatus } from './service';
import { walletKeys } from './queries';
import type {
  ManualWalletAdjustRequest,
  CancelWalletRequest,
  UpdateWalletStatusRequest,
  WalletMeResponse,
  WalletsResponse
} from './types';

/**
 * Update wallet rows in place instead of invalidating the whole list.
 * The list is sorted by `updatedAt`; refetching it while a row-owned detail
 * sheet is open can reorder rows and leave that sheet showing another user.
 */
const updateWalletLists = (userId: number, patch: Partial<WalletsResponse['data'][number]>) => {
  getQueryClient().setQueriesData<WalletsResponse>(
    { queryKey: [...walletKeys.all, 'list'] },
    (current) =>
      current
        ? {
            ...current,
            data: current.data.map((wallet) =>
              wallet.userId === userId ? { ...wallet, ...patch } : wallet
            )
          }
        : current
  );
};

const refreshWalletDetail = (userId: number) => {
  const queryClient = getQueryClient();
  void queryClient.invalidateQueries({ queryKey: walletKeys.detail(userId) });
  void queryClient.invalidateQueries({ queryKey: walletKeys.transactions(userId) });
};

export const adjustWalletBalanceMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: ManualWalletAdjustRequest }) =>
    adjustWalletBalance(userId, data),
  onSuccess: (result, { userId }) => {
    updateWalletLists(userId, { balanceVnd: result.balanceAfterVnd });
    refreshWalletDetail(userId);
  }
});

export const cancelWalletBalanceMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: CancelWalletRequest }) =>
    cancelWalletBalance(userId, data),
  onSuccess: (result, { userId }) => {
    updateWalletLists(userId, { balanceVnd: result?.balanceAfterVnd ?? 0 });
    refreshWalletDetail(userId);
  }
});

export const updateWalletStatusMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: UpdateWalletStatusRequest }) =>
    updateWalletStatus(userId, data),
  onSuccess: (result: WalletMeResponse, { userId }) => {
    updateWalletLists(userId, { status: result.status });
    getQueryClient().setQueryData(walletKeys.detail(userId), result);
    refreshWalletDetail(userId);
  }
});
