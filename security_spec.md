# Security Specification — Como en Casa (Firestore)

## 1. Data Invariants
1. **Silent Anonymous Auth (`signInAnonymously`)**: Customers and staff terminals authenticate silently via Firebase Anonymous Auth (`request.auth != null`) without Google popups.
2. **Menu Catalog (`menuItems/{dishId}`)**: Non-PII catalog entries. Publicly readable; writable only by Admin or active staff with `menu_pricing` permission.
3. **Table State (`tables/{tableId}`)**: Non-PII table status (`libre` | `ocupada`). Staff (`orders_tables` / `cashier_billing` / Admin) manage tables and free occupied tables; signed-in customers can only transition a `libre` table to `ocupada` when ordering.
4. **Orders (`orders/{orderId}`)**: An order MUST set `customerUid == request.auth.uid` (for customers), valid `mode`, bounded `items` array (`1 <= size <= 50`), positive `total`, initial `status: 'Preparando'`, immutable `confirmationCode` on `takeaway`/`delivery`, and server timestamps (`createdAt`, `updatedAt == request.time`).
5. **PII Isolation (`orders/{orderId}/private/*`, `table_sessions`, `customer_contacts`)**: Phone numbers and delivery addresses NEVER live on `/orders/{orderId}` or `/tables/{tableId}`. Only the owning `customerUid` or verified Staff (`staff_sessions/{uid}`) can read PII documents.
6. **Staff & Permissions (`staff/{staffId}`, `staff_sessions/{uid}`, `config/staff`)**: Only verified Admin (`staff_sessions/{uid}.isAdmin == true` matching `config/staff.adminPin`) can create, update, or delete staff members, toggle permissions, or change `adminPin`. Creating a `staff_sessions/{uid}` document strictly validates the submitted 4-digit PIN against `config/staff.adminPin` or an active `staff/{staffId}` record server-side.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Order Create**: `orders/ord-1` created with `request.auth == null`.
2. **Identity Spoofing on Create**: Customer `uid-A` attempts to create `orders/ord-1` with `customerUid: "uid-B"`.
3. **Ghost / Shadow Field Injection**: Creating `orders/ord-1` or `staff/emp-1` with extra key `isAdminOverride: true`.
4. **Cross-Tenant Order Read**: Customer `uid-A` attempts `get(/orders/ord-of-B)` or `get(/orders/ord-of-B/private/delivery)`.
5. **Blanket List Query**: Customer `uid-A` attempts `list(/orders)` without filtering `customerUid == uid-A`.
6. **ID Poisoning**: Creating `/orders/` or `/staff/` with a 200-char or invalid-char document ID (`"../admin"`).
7. **Fake Server Timestamp**: Creating `orders/ord-1` with backdated client `createdAt` instead of `request.time`.
8. **Customer Self-Marking Paid**: Customer `uid-A` updates `orders/ord-1` changing `paid: true` without active Staff session.
9. **Customer Freeing Occupied Table**: Customer `uid-A` updates `tables/mesa-1` from `ocupada` to `libre`.
10. **Staff Session PIN Forgery**: Creating `staff_sessions/uid-A` with `isAdmin: true` and wrong `pin`.
11. **Inactive Employee Session Escalation**: Creating `staff_sessions/uid-A` referencing an `active: false` employee doc.
12. **Employee Mutating Staff Directory**: Non-admin Mozo attempts `set(/staff/emp-1, ...)` or `set(/config/staff, ...)`.
