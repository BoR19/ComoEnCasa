import React, { useEffect, useState } from 'react';
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { DEFAULT_PERMISSIONS_BY_ROLE } from '../../services/firestoreService';
import {
  EmployeeRoleTitle,
  StaffMember,
  StaffPermissionKey,
  StaffPermissions,
} from '../../types/app';

interface TeamPermissionsTabProps {
  adminPin: string;
  staffMembers: StaffMember[];
  onUpdateAdminPin: (newPin: string) => Promise<boolean>;
  onSaveStaffMember: (payload: {
    id?: string;
    name: string;
    role: EmployeeRoleTitle;
    pin: string;
    active: boolean;
    permissions: StaffPermissions;
  }) => Promise<{ ok: boolean; error?: string }>;
  onToggleStaffActive: (staffId: string, active: boolean) => void;
  onDeleteStaffMember: (staffId: string) => void;
}

const EMPLOYEE_ROLES: EmployeeRoleTitle[] = ['Mozo', 'Cajero', 'Cocina'];

const PERMISSION_OPTIONS: {
  key: StaffPermissionKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'orders_tables',
    label: 'Tomar pedidos y ver Mesas',
    description: 'Acceso a Carta y Mapa de Mesas para abrir o mover comandas.',
  },
  {
    key: 'kitchen_board',
    label: 'Tablero de Comandas / Cocina',
    description: 'Ver pedidos en tiempo real y cambiar estados de preparación.',
  },
  {
    key: 'cashier_billing',
    label: 'Caja, Cobros y Cierre de cuentas',
    description: 'Cobrar pedidos en caja y liberar mesas tras el pago.',
  },
  {
    key: 'menu_pricing',
    label: 'Editar Carta y Precios',
    description: 'Crear platos, modificar precios y marcar agotados.',
  },
  {
    key: 'reports_history',
    label: 'Ver Historial y Exportar Reportes',
    description: 'Consultar ventas cobradas, historial y descargar reportes.',
  },
];

export const TeamPermissionsTab: React.FC<TeamPermissionsTabProps> = ({
  adminPin,
  staffMembers,
  onUpdateAdminPin,
  onSaveStaffMember,
  onToggleStaffActive,
  onDeleteStaffMember,
}) => {
  const [adminPinDraft, setAdminPinDraft] = useState(adminPin);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [savingAdminPin, setSavingAdminPin] = useState(false);

  // Employee Form State (Create or Edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [roleDraft, setRoleDraft] = useState<EmployeeRoleTitle>('Mozo');
  const [pinDraft, setPinDraft] = useState('');
  const [activeDraft, setActiveDraft] = useState(true);
  const [permsDraft, setPermsDraft] = useState<StaffPermissions>({
    ...DEFAULT_PERMISSIONS_BY_ROLE.Mozo,
  });
  const [formError, setFormError] = useState('');
  const [savingStaff, setSavingStaff] = useState(false);

  // Directory helpers
  const [revealedPinIds, setRevealedPinIds] = useState<Record<string, boolean>>(
    {}
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setAdminPinDraft(adminPin);
  }, [adminPin]);

  const resetForm = () => {
    setEditingId(null);
    setNameDraft('');
    setRoleDraft('Mozo');
    setPinDraft('');
    setActiveDraft(true);
    setPermsDraft({ ...DEFAULT_PERMISSIONS_BY_ROLE.Mozo });
    setFormError('');
  };

  const handleSelectRole = (nextRole: EmployeeRoleTitle) => {
    setRoleDraft(nextRole);
    if (!editingId) {
      setPermsDraft({ ...DEFAULT_PERMISSIONS_BY_ROLE[nextRole] });
    }
  };

  const handleStartEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setNameDraft(member.name);
    setRoleDraft(member.role);
    setPinDraft(member.pin);
    setActiveDraft(member.active);
    setPermsDraft({ ...member.permissions });
    setFormError('');
    setConfirmDeleteId(null);
  };

  const togglePermission = (key: StaffPermissionKey) => {
    setPermsDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveMasterPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinDraft.length !== 4 || savingAdminPin) return;
    setSavingAdminPin(true);
    try {
      await onUpdateAdminPin(adminPinDraft);
    } finally {
      setSavingAdminPin(false);
    }
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingStaff) return;
    setFormError('');
    setSavingStaff(true);
    try {
      const res = await onSaveStaffMember({
        id: editingId ?? undefined,
        name: nameDraft,
        role: roleDraft,
        pin: pinDraft,
        active: activeDraft,
        permissions: permsDraft,
      });
      if (!res.ok) {
        setFormError(res.error || 'No se pudo guardar el trabajador.');
        return;
      }
      resetForm();
    } finally {
      setSavingStaff(false);
    }
  };

  const togglePinReveal = (staffId: string) => {
    setRevealedPinIds((prev) => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  return (
    <div className="rounded-3xl bg-[var(--ops-canvas)] text-[var(--bg-canvas)] border border-[var(--ops-border)] p-4 sm:p-6 space-y-5 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--ops-border)]">
        <div>
          <h2 className="font-serif-display text-xl sm:text-2xl font-bold text-[var(--bg-surface)] inline-flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--accent-gold)] shrink-0" />
            <span>Equipo y Permisos</span>
          </h2>
          <p className="text-xs text-white/70 mt-0.5">
            Administra los accesos por PIN de 4 dígitos y define qué módulos puede usar cada colaborador.
          </p>
        </div>

        <span className="px-3 py-1 rounded-xl bg-[var(--ops-surface)] border border-[var(--ops-border)] text-xs font-bold text-[var(--accent-gold)] tabular-nums shrink-0">
          {staffMembers.filter((m) => m.active).length} activos de{' '}
          {staffMembers.length}
        </span>
      </div>

      {/* Section 1: Master Admin PIN */}
      <form
        onSubmit={handleSaveMasterPin}
        className="rounded-2xl bg-[var(--ops-surface)] border border-[var(--ops-border)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--bg-surface)] inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
            <span>PIN maestro de Administrador</span>
          </p>
          <p className="text-xs text-white/65 mt-0.5">
            Otorga acceso total a ventas, menú, reportes y gestión de equipo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <input
              type={showAdminPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={4}
              value={adminPinDraft}
              onChange={(e) =>
                setAdminPinDraft(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              aria-label="PIN maestro de Administrador"
              className="w-28 h-11 pl-3 pr-9 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-sm font-bold tracking-[0.25em] text-center text-[var(--accent-gold)] tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]"
            />
            <button
              type="button"
              onClick={() => setShowAdminPin((v) => !v)}
              aria-label={
                showAdminPin ? 'Ocultar PIN maestro' : 'Mostrar PIN maestro'
              }
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/65 hover:text-white absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              {showAdminPin ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={
              savingAdminPin ||
              adminPinDraft.length !== 4 ||
              adminPinDraft === adminPin
            }
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[var(--accent-gold)] text-[var(--ink-primary)] text-xs font-bold disabled:opacity-45 hover:brightness-105 active:scale-[0.97] transition-[transform,opacity,filter] duration-150 ease-[var(--ease-out)] cursor-pointer whitespace-nowrap"
          >
            {savingAdminPin ? 'Guardando...' : 'Actualizar PIN'}
          </button>
        </div>
      </form>

      {/* Main 2-column Workspace: Form + Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Section 2: Create / Edit Staff Form */}
        <form
          onSubmit={handleSubmitStaff}
          className="lg:col-span-5 rounded-2xl bg-[var(--ops-surface)] border border-[var(--ops-border)] p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif-display text-lg font-bold text-[var(--bg-surface)] inline-flex items-center gap-1.5">
              {editingId ? (
                <Pencil className="w-4 h-4 text-[var(--accent-gold)] shrink-0" />
              ) : (
                <Plus className="w-4 h-4 text-[var(--ops-accent)] shrink-0" />
              )}
              <span>{editingId ? 'Editar colaborador' : 'Nuevo colaborador'}</span>
            </h3>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-[var(--ops-elevated)] text-xs font-semibold text-white/80 hover:text-white inline-flex items-center gap-1 active:scale-[0.97] transition-[transform,color] duration-150 ease-[var(--ease-out)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="staff-name-input"
                className="block text-xs font-semibold text-white/80 mb-1"
              >
                Nombre completo
              </label>
              <input
                id="staff-name-input"
                type="text"
                required
                maxLength={80}
                value={nameDraft}
                onChange={(e) => {
                  setFormError('');
                  setNameDraft(e.target.value);
                }}
                placeholder="Ej. María (Caja)"
                className="w-full h-11 px-3 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-sm font-semibold text-[var(--bg-surface)] placeholder:text-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-xs font-semibold text-white/80 mb-1">
                  Cargo
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)]">
                  {EMPLOYEE_ROLES.map((r) => {
                    const active = roleDraft === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleSelectRole(r)}
                        className={`min-h-[36px] rounded-lg text-xs font-bold transition-[transform,background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.97] cursor-pointer ${
                          active
                            ? 'bg-[var(--ops-accent)] text-white'
                            : 'text-white/70 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="staff-pin-input"
                  className="block text-xs font-semibold text-white/80 mb-1"
                >
                  PIN de 4 dígitos
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[var(--accent-gold)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="staff-pin-input"
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={4}
                    value={pinDraft}
                    onChange={(e) => {
                      setFormError('');
                      setPinDraft(
                        e.target.value.replace(/\D/g, '').slice(0, 4)
                      );
                    }}
                    placeholder="4 dígitos"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-sm font-bold tracking-[0.2em] text-[var(--accent-gold)] tabular-nums placeholder:tracking-normal placeholder:font-normal placeholder:text-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ops-accent)]"
                  />
                </div>
              </div>
            </div>

            {/* Active / Inactive Switch */}
            <button
              type="button"
              onClick={() => setActiveDraft((v) => !v)}
              className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] flex items-center justify-between gap-2 text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform duration-150 ease-[var(--ease-out)]"
            >
              <span className="text-white/85">Estado de acceso</span>
              <span
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                  activeDraft
                    ? 'bg-[var(--status-ok)]/25 text-[var(--status-ok-text)]'
                    : 'bg-white/10 text-white/60'
                }`}
              >
                {activeDraft ? 'Activo' : 'Inactivo'}
              </span>
            </button>

            {/* 5 Granular Permission Toggles */}
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-bold text-[var(--accent-gold)]">
                Permisos habilitados
              </p>
              <div className="divide-y divide-[var(--ops-border)] rounded-xl border border-[var(--ops-border)] bg-[var(--ops-canvas)] overflow-hidden">
                {PERMISSION_OPTIONS.map((opt) => {
                  const enabled = permsDraft[opt.key];
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => togglePermission(opt.key)}
                      className="w-full min-h-[48px] px-3 py-2.5 flex items-start justify-between gap-3 text-left hover:bg-[var(--ops-elevated)]/60 active:scale-[0.99] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-[var(--bg-surface)]">
                          {opt.label}
                        </span>
                        <span className="block text-[11px] text-white/60 leading-snug mt-0.5">
                          {opt.description}
                        </span>
                      </div>
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                          enabled
                            ? 'bg-[var(--status-ok)] border-[var(--status-ok)] text-white'
                            : 'bg-[var(--ops-surface)] border-white/25 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {formError && (
            <p
              role="alert"
              className="text-xs font-semibold text-white bg-[var(--ops-accent)]/20 border border-[var(--ops-accent)]/55 rounded-xl px-3 py-2"
            >
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={savingStaff}
            className="w-full min-h-[46px] px-4 py-2.5 rounded-2xl bg-[var(--ops-accent)] text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.97] transition-[transform,filter] duration-150 ease-[var(--ease-out)] cursor-pointer disabled:opacity-50"
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>
              {savingStaff
                ? 'Guardando...'
                : editingId
                ? 'Guardar cambios del colaborador'
                : 'Registrar colaborador'}
            </span>
          </button>
        </form>

        {/* Section 3: Flat Staff Directory List */}
        <div className="lg:col-span-7 rounded-2xl bg-[var(--ops-surface)] border border-[var(--ops-border)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--ops-border)] flex items-center justify-between gap-2">
            <h3 className="font-serif-display text-lg font-bold text-[var(--bg-surface)]">
              Personal registrado
            </h3>
            <span className="text-xs text-white/65 tabular-nums">
              {staffMembers.length}{' '}
              {staffMembers.length === 1 ? 'miembro' : 'miembros'}
            </span>
          </div>

          {staffMembers.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <p className="text-sm font-bold text-[var(--bg-surface)]">
                Aún no hay colaboradores registrados
              </p>
              <p className="text-xs text-white/65">
                Usa el formulario de la izquierda para asignar PINs y permisos a Mozos, Cajeros o Cocina.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--ops-border)]">
              {staffMembers.map((member) => {
                const isRevealed = Boolean(revealedPinIds[member.id]);
                const activePerms = PERMISSION_OPTIONS.filter(
                  (p) => member.permissions[p.key]
                );
                const isDeleting = confirmDeleteId === member.id;

                return (
                  <div key={member.id} className="p-4 space-y-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-[var(--bg-surface)]">
                            {member.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-[11px] font-bold text-[var(--accent-gold)]">
                            {member.role}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onToggleStaffActive(member.id, !member.active)
                            }
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold active:scale-[0.97] transition-[transform,background-color] duration-150 ease-[var(--ease-out)] cursor-pointer ${
                              member.active
                                ? 'bg-[var(--status-ok)]/25 text-[var(--status-ok-text)]'
                                : 'bg-white/10 text-white/55'
                            }`}
                          >
                            {member.active ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-white/70">
                          <span className="font-mono font-bold tracking-widest text-[var(--accent-gold)] tabular-nums">
                            PIN: {isRevealed ? member.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinReveal(member.id)}
                            aria-label={
                              isRevealed
                                ? `Ocultar PIN de ${member.name}`
                                : `Mostrar PIN de ${member.name}`
                            }
                            className="p-1 rounded-md text-white/60 hover:text-white hover:bg-[var(--ops-elevated)] cursor-pointer"
                          >
                            {isRevealed ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(member)}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[var(--ops-elevated)] border border-[var(--ops-border)] text-xs font-bold text-[var(--bg-surface)] inline-flex items-center gap-1.5 hover:border-[var(--accent-gold)] active:scale-[0.97] transition-[transform,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
                          <span>Editar</span>
                        </button>

                        {isDeleting ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteStaffMember(member.id);
                                setConfirmDeleteId(null);
                                if (editingId === member.id) {
                                  resetForm();
                                }
                              }}
                              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[var(--ops-accent)] text-white text-xs font-bold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-[var(--ops-elevated)] text-white/80 text-xs font-semibold active:scale-[0.97] transition-transform duration-150 ease-[var(--ease-out)] cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(member.id)}
                            aria-label={`Eliminar a ${member.name}`}
                            className="min-h-[38px] min-w-[38px] rounded-xl bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-white/65 hover:text-[var(--ops-accent)] hover:border-[var(--ops-accent)]/60 flex items-center justify-center active:scale-[0.97] transition-[transform,color,border-color] duration-150 ease-[var(--ease-out)] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active Permissions Summary */}
                    <div className="flex flex-wrap gap-1.5">
                      {activePerms.length === 0 ? (
                        <span className="text-[11px] text-white/50">
                          Sin módulos habilitados
                        </span>
                      ) : (
                        activePerms.map((perm) => (
                          <span
                            key={perm.key}
                            className="px-2 py-0.5 rounded-md bg-[var(--ops-canvas)] border border-[var(--ops-border)] text-[11px] font-medium text-white/80"
                          >
                            {perm.label}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
