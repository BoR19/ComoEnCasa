import { CustomerContactItem, KitchenOrder } from '../types/app';
import { formatBsDecimal } from './appHelpers';
import { formatBoliviaDisplayPhone, normalizeWhatsAppPhone } from './ticketHelpers';

function escapeCsvCell(value: string): string {
  const singleLine = value.replace(/[\r\n]+/g, ' ').trim();
  if (
    singleLine.includes(';') ||
    singleLine.includes('"') ||
    singleLine.includes('\n')
  ) {
    return `"${singleLine.replace(/"/g, '""')}"`;
  }
  return singleLine;
}

export function mergeCustomerDirectory(
  cloudContacts: CustomerContactItem[],
  orders: KitchenOrder[]
): CustomerContactItem[] {
  const map = new Map<string, CustomerContactItem>();

  for (const contact of cloudContacts) {
    const key = normalizeWhatsAppPhone(contact.phone);
    if (!key) continue;
    map.set(key, {
      ...contact,
      phone: key,
    });
  }

  for (const order of orders) {
    const takeawayPhone =
      order.mode === 'takeaway' && order.pickupNote
        ? order.pickupNote.match(/\b[67]\d{7}\b/)?.[0] || ''
        : '';
    const rawPhone =
      order.customerPhone || order.deliveryPhone || takeawayPhone || '';
    const key = normalizeWhatsAppPhone(rawPhone);
    if (!key || key.length < 8) continue;

    const existing = map.get(key);
    if (existing) {
      if (!existing.lastOrderCode && order.code) {
        existing.lastOrderCode = order.code;
      }
      continue;
    }

    map.set(key, {
      phone: key,
      customerUid: order.customerUid,
      lastTableNumber: order.tableNumber,
      lastMode: order.mode,
      lastOrderCode: order.code,
      lastOrderTotal: order.total,
      ordersCount: 1,
      source:
        order.mode === 'dine-in'
          ? 'qr-table'
          : order.mode === 'delivery'
          ? 'delivery'
          : 'takeaway',
      updatedAtLabel: order.createdAt || 'Hoy',
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => b.ordersCount - a.ordersCount || b.lastOrderTotal - a.lastOrderTotal
  );
}

export function downloadCustomerContactsCsv(
  cloudContacts: CustomerContactItem[],
  orders: KitchenOrder[]
): number {
  const merged = mergeCustomerDirectory(cloudContacts, orders);
  const headers = [
    'Teléfono WhatsApp',
    'Enlace Directo wa.me',
    'Última Mesa / Modalidad',
    'Cantidad de Pedidos',
    'Último Consumo (Bs.)',
    'Último Ticket',
    'Origen',
    'Última Actividad',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(';')];

  for (const c of merged) {
    const modeText =
      c.lastMode === 'dine-in'
        ? c.lastTableNumber
          ? `Mesa ${c.lastTableNumber}`
          : 'En el local'
        : c.lastMode === 'takeaway'
        ? 'Para Llevar'
        : 'Delivery';
    const sourceLabel =
      c.source === 'qr-table'
        ? 'QR en Mesa'
        : c.source === 'delivery'
        ? 'Delivery'
        : c.source === 'takeaway'
        ? 'Para Llevar'
        : 'Caja POS';

    const row = [
      formatBoliviaDisplayPhone(c.phone),
      `https://wa.me/${c.phone}`,
      modeText,
      String(c.ordersCount || 1),
      formatBsDecimal(c.lastOrderTotal || 0),
      c.lastOrderCode || 'Registro QR',
      sourceLabel,
      c.updatedAtLabel || 'Hoy',
    ];
    rows.push(row.map(escapeCsvCell).join(';'));
  }

  const csvContent = `\uFEFF${rows.join('\r\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = 'clientes-whatsapp-como-en-casa.csv';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

  return merged.length;
}
