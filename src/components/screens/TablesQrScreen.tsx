import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  ScanLine,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { KitchenOrder, TableItem } from '../../types/app';
import {
  formatBs,
  formatBsDecimal,
  getActiveOrderForTable,
  getOrderLinesCount,
  getTableStats,
} from '../../utils/appHelpers';
import {
  buildWhatsAppShareUrl,
  formatBoliviaDisplayPhone,
} from '../../utils/ticketHelpers';
import { OfficialLogo } from '../BrandAssets';
import type { AppUserRole } from '../LiveCartPanel';
import { MobileHeader } from '../ShellComponents';
import {
  buildTableQrUrl,
  ScannableQrCode,
  TableQrModal,
} from '../TableQrModal';
import { TicketModal } from '../TicketModal';

const PRESET_ZONES = ['Salón', 'Patio', 'Terraza'];
const PRESET_CAPACITIES = [2, 4, 6, 8];

interface TableSelectScreenProps {
  tables: TableItem[];
  orders: KitchenOrder[];
  selectedTable: number;
  userRole: AppUserRole;
  canManageTables?: boolean;
  allowOccupiedSelection?: boolean;
  onSelectTable: (tableNumber: number) => void;
  onConfirmTable: (tableNumber?: number) => void;
  onCreateTable: (payload: {
    number: number;
    name: string;
    zone: string;
    capacity: number;
  }) => boolean;
  onDeleteTable: (tableNumber: number) => boolean;
  onMoveTableOrder: (fromTableNumber: number, toTableNumber: number) => boolean;
  onBack: () => void;
}

export const TableSelectScreen: React.FC<TableSelectScreenProps> = ({
  tables,
  orders,
  selectedTable,
  userRole,
  canManageTables,
  allowOccupiedSelection = false,
  onSelectTable,
  onConfirmTable,
  onCreateTable,
  onDeleteTable,
  onMoveTableOrder,
  onBack,
}) => {
  const isStaff =
    canManageTables !== undefined
      ? canManageTables
      : userRole === 'admin' || userRole === 'mozo';
  const [zoneFilter, setZoneFilter] = useState<string>('Todas');

  // Modals (centered with .modal-surface scale(0.95)->1 & opacity 0->1)
  const [qrModalTable, setQrModalTable] = useState<TableItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingTable, setDeletingTable] = useState<TableItem | null>(null);
  const [movingFromTable, setMovingFromTable] = useState<TableItem | null>(
    null
  );

  // Add Table Form State
  const [newNumber, setNewNumber] = useState<number>(1);
  const [newName, setNewName] = useState<string>('');
  const [newZone, setNewZone] = useState<string>('Salón');
  const [newCapacity, setNewCapacity] = useState<number>(4);
  const [addError, setAddError] = useState<string>('');

  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    tables.forEach((t) => {
      const z = t.zone?.trim() || 'Salón';
      zones.add(z);
    });
    return ['Todas', ...Array.from(zones)];
  }, [tables]);

  const filteredTables = useMemo(() => {
    if (zoneFilter === 'Todas') return tables;
    return tables.filter((t) => (t.zone?.trim() || 'Salón') === zoneFilter);
  }, [tables, zoneFilter]);

  const { freeCount, occupiedCount, totalCount } = useMemo(
    () => getTableStats(tables),
    [tables]
  );

  const freeDestinationTables = useMemo(() => {
    if (!movingFromTable) return [];
    return tables.filter((t) => {
      if (t.number === movingFromTable.number) return false;
      const active = getActiveOrderForTable(orders, tables, t.number);
      return t.status === 'libre' && !active;
    });
  }, [movingFromTable, orders, tables]);

  const openAddTableModal = () => {
    const maxNum = tables.reduce((max, t) => Math.max(max, t.number), 0);
    const suggestedNum = Math.min(99, maxNum + 1);
    setNewNumber(suggestedNum);
    setNewZone('Salón');
    setNewName(`Mesa ${suggestedNum} - Salón`);
    setNewCapacity(4);
    setAddError('');
    setShowAddModal(true);
  };

  const handleSubmitNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStaff) return;

    if (!Number.isInteger(newNumber) || newNumber < 1 || newNumber > 99) {
      setAddError('El número de mesa debe estar entre 1 y 99.');
      return;
    }
    if (tables.some((t) => t.number === newNumber)) {
      setAddError(`La Mesa ${newNumber} ya existe.`);
      return;
    }
    const cleanZone = newZone.trim() || 'Salón';
    const cleanName = newName.trim() || `Mesa ${newNumber} - ${cleanZone}`;

    const created = onCreateTable({
      number: newNumber,
      name: cleanName,
      zone: cleanZone,
      capacity: newCapacity,
    });

    if (created) {
      setShowAddModal(false);
    }
  };

  const movingSourceOrder = useMemo(() => {
    if (!movingFromTable) return undefined;
    return getActiveOrderForTable(orders, tables, movingFromTable.number);
  }, [movingFromTable, orders, tables]);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader
        title={isStaff ? 'Mesas y códigos QR' : 'Selecciona tu mesa'}
        onBack={onBack}
        rightSlot={
          isStaff ? (
            <button
              type="button"
              onClick={openAddTableModal}
              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center gap-1 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span className="hidden sm:inline">Agregar mesa</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-24 xl:pb-8 space-y-4 lg:space-y-5">
          {/* Editorial Section Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="min-w-0">
              <h2 className="font-serif-display text-xl lg:text-2xl font-bold text-[var(--ink-primary)] leading-tight">
                {isStaff ? 'Gestión de mesas' : 'Elige tu mesa para comenzar'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-0.5 tabular-nums">
                {totalCount} {totalCount === 1 ? 'mesa' : 'mesas'} · {freeCount}{' '}
                {freeCount === 1 ? 'libre' : 'libres'} · {occupiedCount}{' '}
                {occupiedCount === 1 ? 'ocupada' : 'ocupadas'}
              </p>
            </div>

            {isStaff && (
              <button
                type="button"
                onClick={openAddTableModal}
                className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>Agregar Nueva Mesa</span>
              </button>
            )}
          </div>

          {/* Zone Filter Chips (horizontal touch-scroll) */}
          {availableZones.length > 2 && (
            <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {availableZones.map((zone) => {
                const active = zoneFilter === zone;
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setZoneFilter(zone)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 border transition-[transform,background-color,color,border-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                      active
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-surface)] text-[var(--ink-primary)] border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          )}

          {/* Responsive Tables Grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
          {filteredTables.length === 0 ? (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 text-center space-y-2">
              <p className="text-sm font-bold text-[var(--ink-primary)]">
                No hay mesas registradas en esta zona
              </p>
              <button
                type="button"
                onClick={() => setZoneFilter('Todas')}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--bg-inset)] text-xs font-semibold text-[var(--ink-primary)] hover:bg-[var(--border-subtle)]/50 active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                Ver todas las mesas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTables.map((table) => {
                const activeOrder = getActiveOrderForTable(
                  orders,
                  tables,
                  table.number
                );
                const isOccupied =
                  table.status === 'ocupada' || Boolean(activeOrder);
                const isReadyToPay = Boolean(
                  activeOrder &&
                    !activeOrder.paid &&
                    (activeOrder.status === 'Entregado' ||
                      activeOrder.billRequested)
                );
                const tablePhone =
                  isOccupied ? (table.customerPhone || activeOrder?.customerPhone || '') : '';
                const isSelected = table.number === selectedTable;
                const displayName =
                  table.name?.trim() || `Mesa ${table.number}`;
                const displayZone = table.zone?.trim() || 'Salón';
                const canCustomerSelect = !isOccupied || allowOccupiedSelection;
                const itemsCount = activeOrder
                  ? getOrderLinesCount(activeOrder.items)
                  : 0;

                const statusLabel = isReadyToPay
                  ? 'Por pagar'
                  : isOccupied
                  ? 'Ocupada'
                  : 'Libre';

                const statusClass = isReadyToPay
                  ? 'bg-[var(--accent-gold)]/25 text-[var(--ink-primary)] border border-[var(--accent-gold)]/55'
                  : isOccupied
                  ? 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                  : 'bg-[var(--status-ok)]/12 text-[var(--status-ok)] border border-[var(--status-ok)]/30';

                return (
                  <article
                    key={table.id || `mesa-${table.number}`}
                    className={`rounded-2xl bg-[var(--bg-surface)] border p-4 flex flex-col justify-between gap-3.5 transition-[border-color,background-color] duration-150 ease-[var(--ease-out)] ${
                      isSelected
                        ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30'
                        : isOccupied
                        ? 'border-[var(--accent-gold)]/60'
                        : 'border-[var(--border-subtle)]'
                    }`}
                  >
                    {/* Header: Name, Zone, Capacity & Status Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isSelected && (
                            <span
                              title="Mesa seleccionada"
                              className="w-4 h-4 rounded-full bg-[var(--accent-primary)] text-[var(--bg-surface)] flex items-center justify-center shrink-0"
                            >
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            </span>
                          )}
                          <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)] leading-snug [overflow-wrap:break-word]">
                            {displayName}
                          </h3>
                        </div>

                        <p className="text-xs text-[var(--ink-muted)] mt-0.5 flex items-center gap-1.5 tabular-nums">
                          <span>{displayZone}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {table.capacity}{' '}
                            {table.capacity === 1 ? 'comensal' : 'comensales'}
                          </span>
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Flat Middle Summary Row (zero nested cards) */}
                    <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="block text-[var(--ink-muted)] font-medium">
                          {activeOrder
                            ? `Comanda ${activeOrder.code} · ${itemsCount} ${
                                itemsCount === 1 ? 'plato' : 'platos'
                              }`
                            : isOccupied
                            ? 'Mesa ocupada'
                            : 'Disponible para pedidos'}
                        </span>
                        {activeOrder && (
                          <span className="block text-[11px] font-semibold text-[var(--ink-muted)] mt-0.5">
                            Estado: {activeOrder.status}
                            {activeOrder.billRequested && !activeOrder.paid
                              ? ' · Cuenta solicitada'
                              : ''}
                          </span>
                        )}
                        {isStaff && tablePhone && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--status-ok)] mt-0.5 tabular-nums">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>{formatBoliviaDisplayPhone(tablePhone)}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-[11px] text-[var(--ink-muted)]">
                          Consumo
                        </span>
                        <span
                          className={`text-sm font-bold tabular-nums ${
                            activeOrder && activeOrder.total > 0
                              ? 'text-[var(--accent-primary)]'
                              : 'text-[var(--ink-muted)]'
                          }`}
                        >
                          {formatBsDecimal(activeOrder ? activeOrder.total : 0)}
                        </span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-1 flex flex-col gap-2">
                      {/* Ver / Imprimir QR (visible on every table card) */}
                      <button
                        type="button"
                        onClick={() => setQrModalTable(table)}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center justify-center gap-2 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                      >
                        <QrCode className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
                        <span>Ver / Imprimir QR</span>
                      </button>

                      {isStaff ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectTable(table.number);
                                onConfirmTable(table.number);
                              }}
                              className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                            >
                              <UtensilsCrossed className="w-3.5 h-3.5 text-[var(--accent-gold)] shrink-0" />
                              <span>
                                {isOccupied ? 'Ver / Agregar' : 'Tomar pedido'}
                              </span>
                            </button>

                            {isOccupied ? (
                              <button
                                type="button"
                                onClick={() => setMovingFromTable(table)}
                                className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
                                <span>Mover a otra mesa</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingTable(table)}
                                className="min-h-[44px] px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--status-danger)] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:border-[var(--status-danger)] hover:bg-[var(--status-danger)]/5 active:scale-[0.97] transition-[transform,border-color,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-danger)]"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Eliminar mesa</span>
                              </button>
                            )}
                          </div>

                          {activeOrder && (
                            <a
                              href={buildWhatsAppShareUrl(activeOrder, tablePhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--status-ok)] text-[var(--bg-surface)] text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-primary)]"
                            >
                              <MessageCircle className="w-4 h-4 shrink-0" />
                              <span>Enviar recibo por WhatsApp</span>
                            </a>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={!canCustomerSelect}
                          onClick={() => onSelectTable(table.number)}
                          className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-[transform,background-color,border-color,opacity] duration-150 ease-[var(--ease-out)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] ${
                            isSelected
                              ? 'bg-[var(--accent-primary)] text-[var(--bg-surface)] cursor-pointer'
                              : canCustomerSelect
                              ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)] hover:opacity-90 cursor-pointer'
                              : 'bg-[var(--bg-inset)] text-[var(--ink-muted)] opacity-65 cursor-not-allowed'
                          }`}
                        >
                          {isSelected
                            ? 'Mesa seleccionada'
                            : canCustomerSelect
                            ? 'Elegir esta mesa'
                            : 'Mesa ocupada'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Sticky Confirm Bar (Customer Selection Mode) */}
      {!isStaff && (
        <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
          <div className="max-w-md mx-auto w-full">
            <button
              type="button"
              onClick={() => onConfirmTable(selectedTable)}
              className="w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-sm flex items-center justify-center hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              Confirmar Mesa {selectedTable}
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: Agregar Nueva Mesa (Protected: Admin & Mozo) */}
      {isStaff && showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Agregar nueva mesa"
          onClick={() => setShowAddModal(false)}
        >
          <form
            onSubmit={handleSubmitNewTable}
            onClick={(e) => e.stopPropagation()}
            className="modal-surface my-auto w-full max-w-md max-h-[92dvh] overflow-y-auto phone-scroll bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-3xl border border-[var(--border-subtle)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                  Agregar nueva mesa
                </h3>
                <p className="text-xs text-[var(--ink-muted)]">
                  Se guardará en el mapa y generará su código QR automáticamente
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="new-table-number"
                  className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
                >
                  Número *
                </label>
                <input
                  id="new-table-number"
                  type="number"
                  min={1}
                  max={99}
                  required
                  value={newNumber}
                  onChange={(e) => {
                    const val = Number.parseInt(e.target.value, 10) || 1;
                    setAddError('');
                    setNewNumber(val);
                  }}
                  className="w-full h-11 px-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--ink-primary)] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="new-table-name"
                  className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
                >
                  Nombre / Etiqueta *
                </label>
                <input
                  id="new-table-name"
                  type="text"
                  maxLength={80}
                  required
                  value={newName}
                  onChange={(e) => {
                    setAddError('');
                    setNewName(e.target.value);
                  }}
                  placeholder="Ej. Mesa 9 - Salón Principal"
                  className="w-full h-11 px-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="new-table-zone"
                className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
              >
                Zona
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_ZONES.map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setNewZone(z);
                      if (
                        !newName.trim() ||
                        /^Mesa\s+\d+\s*-\s*(Salón|Patio|Terraza)/i.test(newName)
                      ) {
                        setNewName(`Mesa ${newNumber} - ${z}`);
                      }
                    }}
                    className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold border transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                      newZone === z
                        ? 'bg-[var(--ink-primary)] text-[var(--bg-surface)] border-[var(--ink-primary)]'
                        : 'bg-[var(--bg-inset)] text-[var(--ink-primary)] border-[var(--border-subtle)]'
                    }`}
                  >
                    {z}
                  </button>
                ))}
              </div>
              <input
                id="new-table-zone"
                type="text"
                maxLength={40}
                value={newZone}
                onChange={(e) => setNewZone(e.target.value)}
                placeholder="Salón, Patio, Terraza..."
                className="w-full h-10 px-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              />
            </div>

            <div>
              <label
                htmlFor="new-table-capacity"
                className="block text-xs font-bold text-[var(--ink-primary)] mb-1"
              >
                Capacidad de comensales
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {PRESET_CAPACITIES.map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setNewCapacity(cap)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border tabular-nums transition-[transform,background-color,border-color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                        newCapacity === cap
                          ? 'bg-[var(--accent-primary)] text-[var(--bg-surface)] border-[var(--accent-primary)]'
                          : 'bg-[var(--bg-inset)] text-[var(--ink-primary)] border-[var(--border-subtle)]'
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
                <input
                  id="new-table-capacity"
                  type="number"
                  min={1}
                  max={30}
                  value={newCapacity}
                  onChange={(e) =>
                    setNewCapacity(
                      Math.max(1, Math.min(30, Number(e.target.value) || 1))
                    )
                  }
                  className="flex-1 h-10 px-3 rounded-xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-xs font-bold text-center text-[var(--ink-primary)] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                />
              </div>
            </div>

            {addError && (
              <p className="text-xs font-bold text-[var(--status-danger)] bg-[var(--status-danger)]/10 border border-[var(--status-danger)]/35 rounded-xl px-3 py-2">
                {addError}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] text-xs font-bold hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                Guardar mesa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal 2: Confirm Delete Free Table */}
      {isStaff && deletingTable && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar eliminación de mesa"
          onClick={() => setDeletingTable(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-surface my-auto w-full max-w-sm bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-3xl border border-[var(--border-subtle)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--status-danger)]/12 text-[var(--status-danger)] flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)] leading-tight">
                    Eliminar {deletingTable.name || `Mesa ${deletingTable.number}`}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {deletingTable.zone || 'Salón'} · Estado: Libre
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingTable(null)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
              ¿Confirmas eliminar esta mesa libre? Se quitará del mapa y de la sincronización en Firebase.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingTable(null)}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTable(deletingTable.number);
                  setDeletingTable(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[var(--status-danger)] text-[var(--bg-surface)] text-xs font-bold hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Move Occupied Table Order to a Free Table */}
      {isStaff && movingFromTable && (
        <div
          className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Mover pedido a otra mesa"
          onClick={() => setMovingFromTable(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-surface my-auto w-full max-w-md max-h-[90dvh] overflow-y-auto phone-scroll bg-[var(--bg-surface)] text-[var(--ink-primary)] rounded-3xl border border-[var(--border-subtle)] p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-inset)] text-[var(--accent-primary)] flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)] leading-tight">
                    Mover a otra mesa
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)] tabular-nums">
                    Desde{' '}
                    {movingFromTable.name || `Mesa ${movingFromTable.number}`}
                    {movingSourceOrder
                      ? ` · ${movingSourceOrder.code} (${formatBsDecimal(
                          movingSourceOrder.total
                        )})`
                      : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMovingFromTable(null)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--ink-primary)] hover:bg-[var(--bg-inset)] active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {freeDestinationTables.length === 0 ? (
              <p className="text-xs sm:text-sm text-[var(--ink-muted)] bg-[var(--bg-inset)] border border-[var(--border-subtle)] rounded-2xl p-4 text-center">
                No hay otras mesas libres disponibles en este momento.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--ink-muted)]">
                  Selecciona la mesa libre de destino:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {freeDestinationTables.map((dest) => (
                    <button
                      key={dest.id || `dest-${dest.number}`}
                      type="button"
                      onClick={() => {
                        onMoveTableOrder(movingFromTable.number, dest.number);
                        setMovingFromTable(null);
                      }}
                      className="min-h-[54px] p-3 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-left flex items-center justify-between gap-2 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
                    >
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-[var(--ink-primary)] truncate">
                          {dest.name || `Mesa ${dest.number}`}
                        </span>
                        <span className="block text-[11px] text-[var(--ink-muted)] tabular-nums">
                          {dest.zone || 'Salón'} · {dest.capacity} comensales
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-[var(--status-ok)]/12 text-[var(--status-ok)] text-[11px] font-semibold shrink-0">
                        Libre
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMovingFromTable(null)}
              className="w-full min-h-[44px] px-4 py-2 rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-surface)] text-xs font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal 4: Ver / Imprimir / Descargar PNG QR */}
      <TableQrModal
        table={qrModalTable}
        onClose={() => setQrModalTable(null)}
      />
    </div>
  );
};

interface TableQrScreenProps {
  selectedTable: number;
  onScanQrToMenu: () => void;
  onViewTableOrder: () => void;
  onBack: () => void;
}

export const TableQrScreen: React.FC<TableQrScreenProps> = ({
  selectedTable,
  onScanQrToMenu,
  onViewTableOrder,
  onBack,
}) => {
  const qrValue = buildTableQrUrl(selectedTable);

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Escanea el QR" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll flex flex-col">
        <div className="my-auto max-w-3xl mx-auto w-full px-5 lg:px-8 py-6 flex flex-col lg:grid lg:grid-cols-2 lg:gap-10 items-center justify-center text-center space-y-4 lg:space-y-0">
          <div className="flex flex-col items-center space-y-3">
            <OfficialLogo size="md" />
            <div className="space-y-1">
              <h2 className="font-serif-display text-2xl lg:text-3xl font-bold text-[var(--ink-primary)]">
                Mesa {selectedTable}
              </h2>
              <p className="text-xs lg:text-sm text-[var(--ink-muted)] max-w-[260px] leading-relaxed">
                Escanea para ver la carta y pedir desde tu mesa
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-full max-w-[220px] p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
              <ScannableQrCode
                value={qrValue}
                size={184}
                alt={`Código QR de Mesa ${selectedTable}`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shrink-0">
        <div className="max-w-md mx-auto w-full space-y-2">
          <button
            type="button"
            onClick={onScanQrToMenu}
            className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Ir a la Carta — Mesa {selectedTable}</span>
          </button>

          <button
            type="button"
            onClick={onViewTableOrder}
            className="w-full min-h-[42px] px-4 py-2 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Ver pedido en Mesa {selectedTable}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface TableOrderScreenProps {
  selectedTable: number;
  order?: KitchenOrder;
  onBack: () => void;
  onGoMenu: () => void;
  onCallWaiter: (orderId: string) => void;
  onRequestBill?: (orderId: string) => void;
  onPayAtTable: () => void;
}

export const TableOrderScreen: React.FC<TableOrderScreenProps> = ({
  selectedTable,
  order,
  onBack,
  onGoMenu,
  onCallWaiter,
  onRequestBill,
  onPayAtTable,
}) => {
  const [showTicket, setShowTicket] = useState(false);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
        <MobileHeader title="Pedido en Mesa" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent-primary)]">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="font-serif-display text-xl font-bold text-[var(--ink-primary)]">
            Mesa {selectedTable} sin pedido activo
          </h2>
          <p className="text-xs text-[var(--ink-muted)] max-w-[260px]">
            Elige tus platillos en el menú y envíalos desde el carrito para ver tu pedido en vivo aquí.
          </p>
          <button
            type="button"
            onClick={onGoMenu}
            className="min-h-[46px] px-6 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-xs active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
          >
            Ir al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-canvas)] min-h-0">
      <MobileHeader title="Pedido en Mesa" onBack={onBack} />

      <div className="flex-1 overflow-y-auto phone-scroll">
        <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 pt-4 lg:pt-6 pb-20 xl:pb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3.5 py-1 rounded-lg bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-xs">
                Mesa {selectedTable}
              </span>
              {order.customerPhone && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--status-ok)]/12 text-[var(--status-ok)] font-bold text-[11px] tabular-nums">
                  <MessageCircle className="w-3 h-3 shrink-0" />
                  <span>{formatBoliviaDisplayPhone(order.customerPhone)}</span>
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-[var(--ink-muted)] tabular-nums">
              {order.code} · {order.createdAt}
            </span>
          </div>

          <div className="space-y-4 lg:grid lg:grid-cols-12 lg:gap-6 lg:space-y-0 lg:items-start">
            {/* Tu pedido */}
            <section className="space-y-2.5 lg:col-span-7">
              <h2 className="font-serif-display text-xl font-bold text-[var(--ink-primary)]">
                Tu pedido
              </h2>
              <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                {order.items.map((item, idx) => (
                  <div
                    key={`${item.name}-${idx}`}
                    className="px-3.5 py-3 flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-[var(--ink-primary)] block">
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}
                        {item.name} {item.sizeLabel}
                      </span>
                      {item.extrasSummary && (
                        <span className="text-[11px] text-[var(--ink-muted)] block">
                          {item.extrasSummary}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-[var(--accent-primary)] tabular-nums shrink-0">
                      {formatBs(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Estado, Resumen & Desktop Actions */}
            <div className="space-y-4 lg:col-span-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--ink-primary)]">
                    Estado:
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--accent-gold)] text-[var(--ink-primary)] font-bold text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {order.status}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                    order.paid
                      ? 'bg-[var(--status-ok)]/12 text-[var(--status-ok)]'
                      : order.billRequested || order.status === 'Entregado'
                      ? 'bg-[var(--accent-gold)]/25 text-[var(--ink-primary)] border border-[var(--accent-gold)]/50'
                      : 'bg-[var(--accent-primary)]/12 text-[var(--accent-primary)]'
                  }`}
                >
                  {order.paid
                    ? `Pagado (${order.paymentMethod})`
                    : order.billRequested || order.status === 'Entregado'
                    ? 'Por pagar'
                    : 'Pendiente de pago'}
                </span>
              </div>

              <section className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif-display text-lg font-bold text-[var(--ink-primary)]">
                    Resumen
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {!order.paid && (
                      <button
                        type="button"
                        onClick={() => onCallWaiter(order.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[11px] font-bold inline-flex items-center gap-1 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                        <span>
                          {order.waiterRequested ? 'En camino' : 'Llamar mesero'}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowTicket(true)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[11px] font-bold inline-flex items-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                      <span>Ticket / WA</span>
                    </button>
                  </div>
                </div>
                <div className="rounded-2xl bg-[var(--ink-primary)] text-[var(--bg-canvas)] px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--accent-gold)]">
                    Total
                  </span>
                  <span className="text-lg font-bold text-[var(--accent-gold)] tabular-nums">
                    {formatBs(order.total)}
                  </span>
                </div>
              </section>

              {order.billRequested && !order.paid && (
                <div className="rounded-2xl bg-[var(--accent-gold)]/15 border border-[var(--accent-gold)]/60 px-3.5 py-2.5 text-xs font-bold text-[var(--ink-primary)]">
                  Cuenta solicitada. El mozo se acercará a la Mesa {selectedTable} o puedes pagar ahora mismo.
                </div>
              )}

              {order.waiterRequested && !order.billRequested && (
                <div className="rounded-2xl bg-[var(--status-ok)]/12 border border-[var(--status-ok)] px-3.5 py-2.5 text-xs font-bold text-[var(--status-ok)]">
                  Mesero notificado en Caja/Cocina. Enseguida se acercará a la
                  Mesa {selectedTable}.
                </div>
              )}

              {/* Desktop inline actions */}
              <div className="hidden lg:grid grid-cols-2 gap-2.5 pt-1">
                {order.paid ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowTicket(true)}
                      className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>Ver recibo</span>
                    </button>
                    <button
                      type="button"
                      onClick={onGoMenu}
                      className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--status-ok)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Pedir más</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        onRequestBill
                          ? onRequestBill(order.id)
                          : onCallWaiter(order.id)
                      }
                      className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <ReceiptText className="w-4 h-4 text-[var(--accent-primary)]" />
                      <span>
                        {order.billRequested
                          ? 'Cuenta solicitada'
                          : 'Solicitar cuenta'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={onPayAtTable}
                      className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Pagar ahora</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Two Buttons (Mobile) */}
      <div className="lg:hidden p-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] grid grid-cols-2 gap-2.5 shrink-0">
        {order.paid ? (
          <>
            <button
              type="button"
              onClick={() => setShowTicket(true)}
              className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>Ver recibo</span>
            </button>

            <button
              type="button"
              onClick={onGoMenu}
              className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--status-ok)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Pedir más</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                onRequestBill
                  ? onRequestBill(order.id)
                  : onCallWaiter(order.id)
              }
              className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--bg-inset)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-bold text-xs flex items-center justify-center gap-1.5 hover:border-[var(--accent-primary)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <ReceiptText className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>
                {order.billRequested
                  ? 'Cuenta solicitada'
                  : 'Solicitar cuenta'}
              </span>
            </button>

            <button
              type="button"
              onClick={onPayAtTable}
              className="min-h-[48px] px-3 py-2.5 rounded-2xl bg-[var(--accent-primary)] text-[var(--bg-surface)] font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.97] transition-[transform,opacity] duration-150 ease-[var(--ease-out)] cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Pagar ahora</span>
            </button>
          </>
        )}
      </div>

      <TicketModal
        order={showTicket ? order : null}
        onClose={() => setShowTicket(false)}
      />
    </div>
  );
};
