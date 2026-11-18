/**
 * Phase 0 TDD Specification for Como en Casa Firestore Security Rules
 * Verifies that all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 */

export const DIRTY_DOZEN_CASES = [
  {
    name: '1. Unauthenticated order creation',
    auth: null,
    operation: 'create',
    path: 'orders/ord-test-1',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '2. Unverified email order creation',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: false } },
    operation: 'create',
    path: 'orders/ord-test-2',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Identity spoofing (customerUid !== auth.uid)',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'create',
    path: 'orders/ord-test-3',
    payload: { customerUid: 'u2' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Shadow ghost field on order creation',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'create',
    path: 'orders/ord-test-4',
    payload: { isAdminOverride: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Cross-tenant private delivery PII read',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'get',
    path: 'orders/ord-of-u2/private/delivery',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Unscoped order list query by customer',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'list',
    path: 'orders',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Path variable poisoning (>128 chars or invalid chars)',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'create',
    path: `orders/${'a'.repeat(140)}`,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Client-spoofed timestamp on order creation',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'create',
    path: 'orders/ord-test-8',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Customer marking own order paid without staff role',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'update',
    path: 'orders/ord-of-u1',
    payload: { paid: true, paymentMethod: 'Efectivo' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Customer attempting to free an occupied table',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'update',
    path: 'tables/mesa-1',
    payload: { status: 'libre' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Customer attempting to read Mozo PIN config',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'get',
    path: 'config/staff',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Privilege escalation into authorized_staff',
    auth: { uid: 'u1', token: { email: 'u1@gmail.com', email_verified: true } },
    operation: 'create',
    path: 'authorized_staff/u1@gmail.com',
    payload: { email: 'u1@gmail.com', name: 'Hacker', active: true },
    expected: 'PERMISSION_DENIED',
  },
] as const;
