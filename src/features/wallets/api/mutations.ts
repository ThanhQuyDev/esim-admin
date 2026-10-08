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

// The cache work runs in onSettled, not onSuccess: the wallet sheet passes its
// own onSuccess (toast, close modal), and a component's onSuccess REPLACES the
// one spread in from here — so after "Cộng tiền" the list and the open wallet
// never refreshed and showed the old balance until reopened (v3 #023).

export const adjustWalletBalanceMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: ManualWalletAdjustRequest }) =>
    adjustWalletBalance(userId, data),
  onSettled: (result, _error, { userId }) => {
    if (result) updateWalletLists(userId, { balanceVnd: result.balanceAfterVnd });
    refreshWalletDetail(userId);
  }
});

export const cancelWalletBalanceMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: CancelWalletRequest }) =>
    cancelWalletBalance(userId, data),
  onSettled: (result, error, { userId }) => {
    if (!error) updateWalletLists(userId, { balanceVnd: result?.balanceAfterVnd ?? 0 });
    refreshWalletDetail(userId);
  }
});

export const updateWalletStatusMutation = mutationOptions({
  mutationFn: ({ userId, data }: { userId: number; data: UpdateWalletStatusRequest }) =>
    updateWalletStatus(userId, data),
  onSettled: (result: WalletMeResponse | undefined, _error, { userId }) => {
    if (result) {
      updateWalletLists(userId, { status: result.status });
      getQueryClient().setQueryData(walletKeys.detail(userId), result);
    }
    refreshWalletDetail(userId);
  }
});
