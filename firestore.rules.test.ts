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
    name: '2. Identity spoofing (customerUid !== auth.uid)',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'create',
    path: 'orders/ord-test-2',
    payload: { customerUid: 'anon-u2' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '3. Shadow ghost field on order creation',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'create',
    path: 'orders/ord-test-3',
    payload: { isAdminOverride: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '4. Cross-tenant private delivery PII read',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'get',
    path: 'orders/ord-of-u2/private/delivery',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '5. Unscoped order list query by customer',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'list',
    path: 'orders',
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '6. Path variable poisoning (>128 chars or invalid chars)',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'create',
    path: `orders/${'a'.repeat(140)}`,
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '7. Client-spoofed timestamp on order creation',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'create',
    path: 'orders/ord-test-7',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '8. Customer marking own order paid without staff session',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'update',
    path: 'orders/ord-of-u1',
    payload: { paid: true, paymentMethod: 'Efectivo' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '9. Customer attempting to free an occupied table',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'update',
    path: 'tables/mesa-1',
    payload: { status: 'libre' },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '10. Staff session admin PIN forgery',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'create',
    path: 'staff_sessions/anon-u1',
    payload: { uid: 'anon-u1', staffId: 'admin', role: 'Admin', pin: '1111', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '11. Inactive employee session escalation',
    auth: { uid: 'anon-u1', token: {} },
    operation: 'create',
    path: 'staff_sessions/anon-u1',
    payload: { uid: 'anon-u1', staffId: 'staff-paused', role: 'Mozo', pin: '1234', isAdmin: false },
    expected: 'PERMISSION_DENIED',
  },
  {
    name: '12. Non-admin employee attempting to write staff directory',
    auth: { uid: 'anon-mozo', token: {} },
    operation: 'create',
    path: 'staff/emp-hacker',
    payload: { id: 'emp-hacker', name: 'Hacker', role: 'Cajero', pin: '9999', active: true },
    expected: 'PERMISSION_DENIED',
  },
] as const;
