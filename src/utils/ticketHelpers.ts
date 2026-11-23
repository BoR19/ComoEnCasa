import { KitchenOrder } from '../types/app';
import { formatBs, getTakeawayCustomerName } from './appHelpers';

export type TicketPaperSize = '80mm' | '58mm' | 'carta';

export function getTodayDateLabel(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function normalizeWhatsAppPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('591') && digits.length >= 11) {
    return digits;
  }
  if (digits.length === 8 && /^[67]/.test(digits)) {
    return `591${digits}`;
  }
  return digits;
}

export function validateBoliviaPhone(rawPhone: string): {
  valid: boolean;
  localDigits: string;
  whatsappDigits: string;
  display: string;
  error?: string;
} {
  const rawDigits = rawPhone.replace(/\D/g, '');
  let localDigits = rawDigits;
  if (rawDigits.startsWith('591') && rawDigits.length === 11) {
    localDigits = rawDigits.slice(3);
  } else if (rawDigits.startsWith('0') && rawDigits.length === 9) {
    localDigits = rawDigits.slice(1);
  }

  if (!localDigits) {
    return {
      valid: false,
      localDigits: '',
      whatsappDigits: '',
      display: '',
      error: 'Ingresa tu número celular de Bolivia (8 dígitos, empezando en 6 o 7).',
    };
  }

  if (!/^[67]\d{7}$/.test(localDigits)) {
    return {
      valid: false,
      localDigits,
      whatsappDigits: '',
      display: '',
      error: 'Debe tener 8 dígitos y empezar con 6 o 7 (ej. 71234567).',
    };
  }

  return {
    valid: true,
    localDigits,
    whatsappDigits: `591${localDigits}`,
    display: `+591 ${localDigits}`,
  };
}

export function formatBoliviaDisplayPhone(rawPhone?: string): string {
  if (!rawPhone) return '';
  const parsed = validateBoliviaPhone(rawPhone);
  if (parsed.valid) return parsed.display;
  return rawPhone;
}

export function buildWhatsAppTicketText(
  order: KitchenOrder,
  options?: { restaurantPhone?: string; dateLabel?: string }
): string {
  const dateLabel = options?.dateLabel || getTodayDateLabel();
  const modeLabel =
    order.mode === 'dine-in'
      ? `Comer en el local (${order.tableNumber ? `Mesa ${order.tableNumber}` : order.customerLabel})`
      : order.mode === 'takeaway'
      ? `Para Llevar • ${getTakeawayCustomerName(order)}`
      : 'Delivery a domicilio';

  const statusPayment = order.paid
    ? `PAGADO (${order.paymentMethod || 'Confirmado'})`
    : 'PENDIENTE DE COBRO';

  const lines: string[] = [
    '*COMO EN CASA - Comida Tradicional*',
    'Tupiza • Potosí • Bolivia',
    '--------------------------------',
    `*Ticket:* ${order.code}`,
    `*Fecha:* ${dateLabel} · ${order.createdAt}`,
    `*Modalidad:* ${modeLabel}`,
  ];

  if (order.pickupNote) {
    lines.push(`*Retiro / Tel:* ${order.pickupNote}`);
  }
  if (order.deliveryAddress) {
    lines.push(`*Dirección:* ${order.deliveryAddress}`);
  }
  if (order.deliveryPhone) {
    lines.push(`*Teléfono:* ${order.deliveryPhone}`);
  } else if (order.customerPhone) {
    lines.push(`*WhatsApp:* ${formatBoliviaDisplayPhone(order.customerPhone)}`);
  }
  if (
    order.confirmationCode &&
    (order.mode === 'takeaway' || order.mode === 'delivery')
  ) {
    lines.push(`*Código de entrega:* ${order.confirmationCode}`);
  }

  lines.push(`*Estado pedido:* ${order.status}`);
  lines.push(`*Estado pago:* ${statusPayment}`);
  lines.push('--------------------------------');
  lines.push('*DETALLE DEL PEDIDO:*');

  for (const item of order.items) {
    const subtotal = formatBs(item.price * item.quantity);
    lines.push(
      `• ${item.quantity}x ${item.name} (${item.sizeLabel}) — *${subtotal}*`
    );
    if (item.extrasSummary) {
      lines.push(`   _${item.extrasSummary}_`);
    }
  }

  if (order.notes) {
    lines.push(`*Notas:* ${order.notes}`);
  }

  lines.push('--------------------------------');
  lines.push(`*TOTAL: ${formatBs(order.total)}*`);
  lines.push('');
  lines.push('¡Gracias por tu preferencia! Hecho como en casa.');

  if (options?.restaurantPhone) {
    lines.push(`Consultas: ${options.restaurantPhone}`);
  }

  return lines.join('\n');
}

export function buildPlainTextTicket(order: KitchenOrder): string {
  const dateLabel = getTodayDateLabel();
  const modeLabel =
    order.mode === 'dine-in'
      ? `Mesa ${order.tableNumber ?? ''}`.trim()
      : order.mode === 'takeaway'
      ? 'Para Llevar'
      : 'Delivery';
  const payLabel = order.paid
    ? `PAGADO (${order.paymentMethod || 'Confirmado'})`
    : 'PENDIENTE DE COBRO';

  const lines: string[] = [
    '================================',
    '           COMO EN CASA         ',
    '       Comida Tradicional!      ',
    '     Tupiza • Potosi • Bolivia  ',
    '================================',
    `Ticket : ${order.code}`,
    `Fecha  : ${dateLabel} ${order.createdAt}`,
    `Tipo   : ${modeLabel}`,
    `Cliente: ${order.mode === 'takeaway' ? getTakeawayCustomerName(order) : order.customerLabel}`,
  ];

  if (order.pickupNote) {
    lines.push(`Retiro : ${order.pickupNote}`);
  }
  if (order.deliveryAddress) {
    lines.push(`Dir.   : ${order.deliveryAddress}`);
  }
  if (order.deliveryPhone) {
    lines.push(`Tel.   : ${order.deliveryPhone}`);
  } else if (order.customerPhone) {
    lines.push(`WhatsAp: ${formatBoliviaDisplayPhone(order.customerPhone)}`);
  }
  if (
    order.confirmationCode &&
    (order.mode === 'takeaway' || order.mode === 'delivery')
  ) {
    lines.push(`PIN Ent: ${order.confirmationCode}`);
  }

  lines.push(`Pago   : ${payLabel}`);
  lines.push('--------------------------------');
  lines.push('CANT  DESCRIPCION        SUBTOT.');
  lines.push('--------------------------------');

  for (const item of order.items) {
    const label = `${item.quantity}x ${item.name} (${item.sizeLabel})`;
    const sub = formatBs(item.price * item.quantity);
    lines.push(`${label}  ${sub}`);
    if (item.extrasSummary) {
      lines.push(`   ${item.extrasSummary}`);
    }
  }

  if (order.notes) {
    lines.push('--------------------------------');
    lines.push(`Notas: ${order.notes}`);
  }

  lines.push('================================');
  lines.push(`TOTAL: ${formatBs(order.total)}`);
  lines.push('================================');
  lines.push('   Gracias por su preferencia!   ');
  lines.push('');

  return lines.join('\n');
}

export function buildWhatsAppShareUrl(
  order: KitchenOrder,
  recipientPhone: string
): string {
  const text = buildWhatsAppTicketText(order);
  const cleanPhone = normalizeWhatsAppPhone(recipientPhone);
  const encoded = encodeURIComponent(text);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
