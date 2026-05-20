---
name: exu-wallet-admin-integration
description: Integrate eXu wallet management, manual adjustments, and order refund APIs into the Admin dashboard
---

# eXu Wallet Admin Integration

You are Roo Code working on the Admin frontend. Use this skill to integrate the eXu wallet management, manual balance adjustments, wallet status controls, and order refund features into the Admin dashboard.

## Scope

Integrate the following admin-only eXu features into the Admin frontend:

- View all user wallets with balances and statuses
- View individual user wallet details and transaction history
- Manual credit/debit adjustments to user wallets
- Cancel (zero out) user wallet balances
- Lock/unlock user wallets
- Process order refunds (to wallet or direct bank transfer)

Do not create mock-only data if the backend is reachable. Keep fallback/mock data only for explicit local demo modes if the project already has that convention.

## Backend Contract

All admin endpoints require JWT authentication + admin role guard.

Base API path depends on the app global prefix/version. In this backend it is typically:

- `/api/v1/wallets/admin`
- `/api/v1/orders/:id/refund`

If the frontend already centralizes API prefix/version, use that existing client configuration instead of hard-coding `/api/v1`.

### Authentication

All admin endpoints require a valid JWT token with admin role (`role.id === 1`) in the `Authorization: Bearer <token>` header.

## Endpoints

### 1. List All Wallets

`GET /wallets/admin`

Returns all user wallets.

Response:

```ts
type WalletListResponse = Array<{
  id: number;
  userId: number;
  balanceVnd: number;
  status: 'active' | 'locked';
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;
```

Integration notes:
- Display in a paginated table with columns: User ID, Balance (VND), Status, Expiry, Actions.
- Add search/filter by userId.
- Sort by `updatedAt` descending by default.
- Color-code status: green for `active`, red for `locked`.
- Show expiry date with days remaining calculation.

### 2. Get Single Wallet

`GET /wallets/admin/:userId`

Returns a specific user's wallet summary.

Response:

```ts
interface WalletMeResponse {
  balanceVnd: number;
  availableBalanceVnd: number;
  status: 'active' | 'locked';
  expiresAt: string | null;
  daysLeft: number | null;
}
```

Integration notes:
- Display full wallet details in a detail panel/modal.
- Show `availableBalanceVnd` alongside `balanceVnd` to indicate active holds.
- Show expiry information with days remaining.

### 3. Manual Balance Adjustment

`POST /wallets/admin/:userId/adjust`

Add or subtract eXu from a user's wallet.

Request body:

```ts
interface ManualWalletAdjustRequest {
  amountVnd: number;  // Positive = credit, negative = debit
  reason?: string;    // Optional reason for audit trail
}
```

Response: Returns the created wallet transaction.

```ts
interface WalletTransactionResponse {
  id: number;
  walletId: number;
  userId: number;
  type: 'manual_credit' | 'manual_debit';
  amountVnd: number;
  balanceAfterVnd: number;
  reason: string | null;
  createdByAdminId: number;
  createdAt: string;
}
```

Integration notes:
- Provide a form with amount input (accepts positive and negative values).
- Require a reason before submitting (enforce client-side).
- Show confirmation dialog before submitting: "Bạn có chắc muốn {cộng/trừ} {amount}đ cho user {userId}?"
- Show success toast with new balance after adjustment.
- Validate that amount is not zero.

### 4. Cancel Wallet Balance

`POST /wallets/admin/:userId/cancel`

Zero out a user's entire wallet balance.

Request body:

```ts
interface CancelWalletRequest {
  reason?: string;
}
```

Response: Returns the created wallet transaction (type: `manual_cancel`) or `null` if balance was already zero.

Integration notes:
- Show a prominent warning before cancelling: "Hành động này sẽ đưa số dư ví về 0. Không thể hoàn tác."
- Require a reason before submitting.
- Show confirmation dialog with current balance amount.
- Disable the button if balance is already 0.

### 5. Update Wallet Status

`PATCH /wallets/admin/:userId/status`

Lock or unlock a user's wallet.

Request body:

```ts
interface UpdateWalletStatusRequest {
  status: 'active' | 'locked';
}
```

Response: Returns the updated wallet entity.

Integration notes:
- Toggle button or dropdown to switch between `active` and `locked`.
- When locking: show warning "Khóa ví sẽ ngăn user sử dụng eXu để thanh toán."
- When unlocking: show confirmation "Mở khóa ví sẽ cho phép user sử dụng eXu trở lại."
- Update the status badge immediately after successful response.

### 6. Refund Order

`POST /orders/:id/refund`

Process a refund for a paid order.

Request body:

```ts
interface RefundOrderRequest {
  mode: 'wallet' | 'direct_bank';  // Refund destination
  amountVnd: number;               // Amount to refund in VND
  reason?: string;                 // Reason for refund
  adminNote?: string;              // Internal admin note
}
```

Response: Returns the created order refund entity.

```ts
interface OrderRefundResponse {
  id: number;
  orderId: number;
  userId: number;
  mode: 'wallet' | 'direct_bank';
  amountVnd: number;
  status: 'completed' | 'cancelled';
  reason: string | null;
  adminNote: string | null;
  walletTransactionId: number | null;
  createdByAdminId: number;
  createdAt: string;
}
```

Integration notes:
- Only show refund option for orders with status `paid` or `refunded`.
- Pre-fill the refund amount with the order's `payableVndPrice`.
- Allow admin to adjust the refund amount (cannot exceed `payableVndPrice`).
- Two refund modes with clear descriptions:
  - **Hoàn vào ví eXu**: Money goes to user's eXu wallet, valid for 365 days.
  - **Hoàn trực tiếp**: Admin handles bank transfer manually, system only records the refund.
- Show what will happen on refund:
  - Cashback will be reversed (if not already).
  - Referral reward will be reversed (if applicable).
  - For `wallet` mode: amount will be credited to user's eXu wallet.
- Show confirmation dialog with full breakdown before processing.
- After successful refund, update the order status display.

## Refund Business Logic (for UI context)

When a refund is processed, the backend automatically:

1. **Reverses cashback**: If the buyer received 2% cashback, it will be debited from their wallet.
2. **Reverses referral reward**: If the order used a referral code, the 10,000đ reward is debited from the referrer's wallet.
3. **Credits refund amount** (wallet mode only): The refund amount is credited to the buyer's wallet with a new 365-day expiry.
4. **Updates order status**: Order status changes to `refunded`.

Display these consequences in the refund confirmation dialog so the admin understands the full impact.

## UI Pages to Create/Update

### 1. Wallet Management Page (`/admin/wallets`)
- Table of all user wallets with pagination
- Search by userId
- Filter by status (active/locked)
- Click row to open wallet detail panel
- Quick action buttons: Adjust, Lock/Unlock, Cancel

### 2. Wallet Detail Panel/Modal
- Wallet summary (balance, available, status, expiry)
- Transaction history for that user
- Action buttons: Adjust Balance, Lock/Unlock, Cancel Balance
- Link to user detail page

### 3. Adjust Balance Modal
- User ID display (read-only)
- Current balance display
- Amount input (positive or negative integer)
- Reason textarea (required)
- Preview of new balance
- Submit button with confirmation

### 4. Cancel Balance Modal
- Warning message about irreversible action
- Current balance display
- Reason textarea (required)
- Confirmation checkbox: "Tôi xác nhận muốn hủy toàn bộ số dư"
- Submit button (disabled until checkbox is checked)

### 5. Lock/Unlock Confirmation
- Current status display
- Action description
- Confirm button

### 6. Refund Order Modal (add to Order Detail page)
- Order summary (order number, user, amount paid)
- Refund mode selector (wallet / direct_bank)
- Refund amount input (pre-filled, editable)
- Reason textarea
- Admin note textarea (internal only)
- Impact preview:
  - Cashback reversal: -Xđ
  - Referral reward reversal: -10,000đ (if applicable)
  - Wallet credit: +Xđ (wallet mode only)
- Submit button with confirmation

## State Management

Recommended state shape:

```ts
interface AdminWalletState {
  walletList: {
    data: WalletListResponse[];
    isLoading: boolean;
    error: string | null;
    total: number;
    page: number;
    pageSize: number;
  };
  selectedWallet: {
    data: WalletMeResponse | null;
    transactions: WalletTransactionResponse[];
    isLoading: boolean;
    error: string | null;
  };
  adjustment: {
    isSubmitting: boolean;
    error: string | null;
    success: string | null;
  };
  refund: {
    isSubmitting: boolean;
    error: string | null;
    success: string | null;
  };
}
```

## Formatting Guidance

- VND currency: use `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })` unless the project already has a money formatter.
- Dates: display in local Vietnam timezone, format `dd/MM/yyyy HH:mm`.
- Status badges:
  - `active` → green badge "Đang hoạt động"
  - `locked` → red badge "Đã khóa"
  - `completed` → green badge "Đã hoàn thành"
  - `cancelled` → gray badge "Đã hủy"
- Transaction types: use the same Vietnamese labels as defined in the web integration skill.
- Expiry: show "Còn X ngày" or "Đã hết hạn" or "Chưa có" (when null).

## Error Handling

- Auth errors (401): redirect to login page.
- Forbidden (403): show "Bạn không có quyền truy cập tính năng này."
- Not found (404): show "Không tìm thấy user/order."
- Validation errors (400): show inline field errors or toast message.
- Network errors: show retry button or toast with error message.
- Server errors (500): show generic error toast with option to retry.

## Manual QA Checklist

- [ ] Wallet list loads with valid admin token.
- [ ] Wallet list pagination works.
- [ ] Search by userId filters results.
- [ ] Filter by status works.
- [ ] Clicking a wallet row opens detail panel.
- [ ] Wallet detail shows correct balance and status.
- [ ] Transaction history loads for selected user.
- [ ] Adjust balance modal opens with correct current balance.
- [ ] Positive amount credits successfully.
- [ ] Negative amount debits successfully.
- [ ] Zero amount is rejected.
- [ ] Reason is required before submitting adjustment.
- [ ] Cancel balance shows warning and requires confirmation.
- [ ] Cancel balance zeroes out the wallet.
- [ ] Lock wallet changes status to locked.
- [ ] Unlock wallet changes status to active.
- [ ] Refund modal opens from order detail page.
- [ ] Refund amount is pre-filled with payable amount.
- [ ] Refund amount cannot exceed payable amount.
- [ ] Wallet mode refund credits user's wallet.
- [ ] Direct bank mode refund records without wallet credit.
- [ ] Refund reverses cashback and referral rewards.
- [ ] Order status updates to refunded after refund.
- [ ] Non-admin user cannot access admin endpoints.
