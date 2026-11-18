# Security Specification — Como en Casa (Firestore)

## 1. Data Invariants
1. **Menu Catalog (`menuItems/{dishId}`)**: Non-PII catalog entries. Only verified Admins can create, update, or delete dishes. Sizes array is strictly bounded (`1 <= size <= 3`).
2. **Table State (`tables/{tableId}`)**: Non-PII table status (`libre` | `ocupada`). Only Admin/Mozo can free (`ocupada -> libre`) or manage tables; verified customers can only transition a `libre` table to `ocupada` atomically when creating an order.
3. **Orders (`orders/{orderId}`)**: An order MUST set `customerUid == request.auth.uid`, valid `mode` (`dine-in` | `delivery`), bounded `items` array (`1 <= size <= 50`), positive `total`, valid initial `status: 'Preparando'`, and `createdAt == request.time`, `updatedAt == request.time`.
4. **PII Isolation (`orders/{orderId}/private/delivery`)**: Delivery `address`, `reference`, and `phone` NEVER live on `/orders/{orderId}`. Only the owning customer (`customerUid == request.auth.uid`) or verified Staff (`Admin` / `Authorized Mozo`) can read `/private/delivery`.
5. **Immutable & Terminal Guards**: `customerUid` and `createdAt` are immutable on update. Once an order reaches `status == 'Entregado'` AND `paid == true`, non-admin users cannot mutate its items, total, or payment status.
6. **Inventory & Staff Config (`inventory/{itemId}`, `config/staff`, `authorized_staff/{staffEmail}`)**: Restricted strictly to verified Admin (and `config/staff` read for verified Staff). Customers can never read or alter Mozo PINs, inventory counts, or staff allowlists.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Order Create**: `orders/ord-1` created with `request.auth == null`.
2. **Unverified Email Order Create**: `orders/ord-1` created with `email_verified: false`.
3. **Identity Spoofing on Create**: Customer `uid-A` attempts to create `orders/ord-1` with `customerUid: "uid-B"`.
4. **Ghost / Shadow Field Injection**: Creating `orders/ord-1` with extra key `isAdminOverride: true`.
5. **Cross-Tenant Order Read**: Customer `uid-A` attempts `get(/orders/ord-of-B)` or `get(/orders/ord-of-B/private/delivery)`.
6. **Blanket List Query**: Customer `uid-A` attempts `list(/orders)` without filtering `customerUid == uid-A`.
7. **ID Poisoning**: Creating `/orders/` with a 200-char or invalid-char document ID (`"../admin"`).
8. **Fake Server Timestamp**: Creating `orders/ord-1` with backdated client `createdAt` instead of `request.time`.
9. **Customer Self-Marking Paid**: Customer `uid-A` updates `orders/ord-1` changing `paid: true` without Staff role.
10. **Customer Freeing Occupied Table**: Customer `uid-A` updates `tables/mesa-1` from `ocupada` to `libre`.
11. **Customer Reading Mozo PIN**: Customer `uid-A` attempts `get(/config/staff)`.
12. **Privilege Escalation**: Customer `uid-A` attempts `set(/authorized_staff/attacker@gmail.com, { active: true })`.
