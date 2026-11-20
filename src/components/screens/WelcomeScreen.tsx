import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Bike,
  CheckCircle2,
  Delete,
  KeyRound,
  LogIn,
  LogOut,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { OfficialLogo, VintageCorners } from '../BrandAssets';

interface WelcomeScreenProps {
  mozoPin: string;
  isMozoLoggedIn: boolean;
  firebaseUser: User | null;
  isStaff: boolean;
  onGoogleSignIn: () => void;
  onMozoLoginSuccess: () => void;
  onMozoLogout: () => void;
  onGoMozoPanel: () => void;
  onSelectDineIn: () => void;
  onSelectDelivery: () => void;
  onGoAdminLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  mozoPin,
  isMozoLoggedIn,
  firebaseUser,
  isStaff,
  onGoogleSignIn,
  onMozoLoginSuccess,
  onMozoLogout,
  onGoMozoPanel,
  onSelectDineIn,
  onSelectDelivery,
  onGoAdminLogin,
}) => {
  const [showLegalModal, setShowLegalModal] = useState(false);

  // 5-tap secret trigger on OfficialLogo for Mozo PIN popup
  const [logoTapCount, setLogoTapCount] = useState(0);
  const tapTimerRef = useRef<number | null>(null);
  const [showMozoModal, setShowMozoModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) window.clearTimeout(tapTimerRef.current);
    };
  }, []);

  const handleLogoTap = () => {
    if (tapTimerRef.current) {
      window.clearTimeout(tapTimerRef.current);
    }

    const nextCount = logoTapCount + 1;
    if (nextCount >= 5) {
      setLogoTapCount(0);
      setPinInput('');
      setPinError('');
      setShowMozoModal(true);
      return;
    }

    setLogoTapCount(nextCount);
    tapTimerRef.current = window.setTimeout(() => {
      setLogoTapCount(0);
    }, 2200);
  };

  const validateAndSubmitPin = (candidate: string) => {
    if (candidate.length < 4) return;
    if (candidate !== mozoPin) {
      setPinError('PIN incorrecto. Verifica los 4 números de Mozo.');
      setPinInput('');
      return;
    }

    setPinError('');
    setPinInput('');
    setShowMozoModal(false);

    if (isMozoLoggedIn) {
      onMozoLogout();
    } else {
      onMozoLoginSuccess();
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pinInput.length >= 4) return;
    setPinError('');
    const next = pinInput + digit;
    setPinInput(next);
    if (next.length === 4) {
      validateAndSubmitPin(next);
    }
  };

  const handleBackspace = () => {
    setPinError('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!showMozoModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowMozoModal(false);
      } else if (e.key === 'Enter' && pinInput.length === 4) {
        e.preventDefault();
        validateAndSubmitPin(pinInput);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div className="relative flex-1 flex flex-col justify-between bg-[#3B1F0E] text-[#FFF8E8] px-5 sm:px-6 py-6 sm:py-8 lg:py-10 overflow-y-auto phone-scroll min-h-0">
      <VintageCorners color="#D9A441" opacity={0.55} />

      {/* Top Logo & Welcome Copy (stacked on mobile, balanced 2-column stage on PC) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center pt-2 lg:max-w-4xl lg:w-full lg:mx-auto lg:grid lg:grid-cols-2 lg:gap-12 lg:text-left">
        <div className="flex flex-col items-center lg:items-center">
          <button
            type="button"
            onClick={handleLogoTap}
            aria-label="Como en Casa"
            className="rounded-3xl focus:outline-none active:scale-[0.97] transition-transform cursor-pointer select-none"
          >
            <OfficialLogo size="lg" />
          </button>

          {logoTapCount >= 2 && (
            <span className="mt-2 px-2.5 py-0.5 rounded-full bg-[#4A2C1A] border border-[#D9A441]/50 text-[10px] font-extrabold text-[#E8C87A] tabular-nums">
              Acceso personal: {logoTapCount}/5
            </span>
          )}

          {isMozoLoggedIn && (
            <button
              type="button"
              onClick={onGoMozoPanel}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#D9A441]/20 border border-[#D9A441] text-[#E8C87A] text-xs font-extrabold hover:bg-[#D9A441]/30 cursor-pointer"
            >
              Sesión Mozo activa • Ir a Comandas
            </button>
          )}
        </div>

        <div className="w-full flex flex-col items-center lg:items-start">
          <h1 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FFF8E8] mt-4 sm:mt-6 lg:mt-0 tracking-tight">
            ¡Bienvenido!
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-[15px] lg:text-base leading-relaxed text-[#FFF8E8]/90 max-w-[270px] lg:max-w-md font-medium">
            Disfruta de la auténtica comida tradicional, hecha como en casa.
          </p>

          {/* Primary Action Buttons */}
          <div className="w-full max-w-sm mt-6 sm:mt-8 space-y-3">
            <button
              type="button"
              onClick={onSelectDineIn}
              className="w-full min-h-[54px] px-5 py-3.5 rounded-2xl bg-[#FFF8E8] text-[#2B1A0E] font-extrabold text-base flex items-center justify-center gap-3 shadow-md hover:bg-[#FFF6E0] active:scale-[0.98] transition-all cursor-pointer"
            >
              <UtensilsCrossed className="w-5 h-5 text-[#3B1F0E]" strokeWidth={2.2} />
              <span>Comer en el local</span>
            </button>

            <button
              type="button"
              onClick={onSelectDelivery}
              className="w-full min-h-[54px] px-5 py-3.5 rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-base flex items-center justify-center gap-3 shadow-md hover:bg-[#E8C87A] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Bike className="w-5 h-5 text-[#2B1A0E]" strokeWidth={2.3} />
              <span>Delivery</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pt-6 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2 text-xs text-[#FFF8E8]/75">
          <span>Versión 1.0</span>
          <span aria-hidden="true">•</span>
          <button
            type="button"
            onClick={() => setShowLegalModal(true)}
            className="underline decoration-[#D9A441]/60 hover:text-[#E8C87A] cursor-pointer"
          >
            Términos y Privacidad
          </button>
        </div>
        <button
          type="button"
          onClick={onGoAdminLogin}
          className="text-[11px] text-[#E8C87A]/80 hover:text-[#E8C87A] underline underline-offset-2 cursor-pointer"
        >
          Acceso Administrador
        </button>
      </footer>

      {/* Modal: Términos y Privacidad */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="my-auto w-full max-w-md bg-[#FFF8E8] text-[#2B1A0E] rounded-2xl border border-[#D9A441] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif-display text-lg font-bold text-[#3B1F0E]">
                Términos y Privacidad
              </h2>
              <button
                type="button"
                onClick={() => setShowLegalModal(false)}
                aria-label="Cerrar"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#FFF6E0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#7A5A3A] leading-relaxed">
              Como en Casa - Comida Tradicional utiliza tus datos de mesa o entrega únicamente para
              gestionar tu pedido del día. Todos los precios están expresados en Bolivianos (Bs).
            </p>
            <button
              type="button"
              onClick={() => setShowLegalModal(false)}
              className="mt-4 w-full min-h-[44px] rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-bold text-sm cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal: Acceso Mozo (4-digit PIN Login / Logout) */}
      {showMozoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Acceso Mozo"
        >
          <div className="my-auto w-full max-w-sm max-h-[92dvh] overflow-y-auto phone-scroll bg-[#FFF8E8] text-[#2B1A0E] rounded-3xl border-2 border-[#D9A441] p-4 sm:p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#3B1F0E] text-[#D9A441] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-serif-display text-lg font-bold text-[#3B1F0E] leading-tight">
                    {isMozoLoggedIn ? 'Sesión Mozo Activa' : 'Acceso Mozo'}
                  </h2>
                  <p className="text-[11px] font-bold text-[#7A5A3A]">
                    {isMozoLoggedIn
                      ? 'Ingresa 4 números para cerrar sesión'
                      : 'Introduce tu PIN de 4 números'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowMozoModal(false)}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#3B1F0E] hover:bg-[#FDF2D6] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isMozoLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  setShowMozoModal(false);
                  onGoMozoPanel();
                }}
                className="w-full min-h-[42px] rounded-2xl bg-[#D9A441] text-[#2B1A0E] font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-[#E8C87A] cursor-pointer"
              >
                <UtensilsCrossed className="w-4 h-4" />
                <span>Entrar al Panel de Mozo</span>
              </button>
            )}

            {/* Google Staff Sync Status inside PIN Modal */}
            {firebaseUser && isStaff ? (
              <div className="rounded-xl bg-[#2E6F32]/12 border border-[#2E6F32]/30 px-3 py-2 flex items-center gap-2 text-[11px] font-extrabold text-[#2E6F32]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Sincronizado en vivo: {firebaseUser.email}
                </span>
              </div>
            ) : (
              <div className="rounded-xl bg-[#FDF2D6] border border-[#D9A441]/70 px-3 py-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#7A5A3A] leading-tight">
                  {firebaseUser
                    ? `Cuenta (${firebaseUser.email}) sin rol de personal`
                    : 'Conecta Google autorizado para sincronizar en vivo'}
                </span>
                <button
                  type="button"
                  onClick={onGoogleSignIn}
                  className="px-2.5 py-1.5 rounded-lg bg-[#3B1F0E] text-[#FFF8E8] text-[10px] font-extrabold inline-flex items-center gap-1 hover:bg-[#4A2C1A] cursor-pointer shrink-0"
                >
                  <LogIn className="w-3 h-3 text-[#D9A441]" />
                  <span>{firebaseUser ? 'Cambiar' : 'Conectar'}</span>
                </button>
              </div>
            )}

            {/* 4-digit visual slots */}
            <div className="grid grid-cols-4 gap-2.5 py-1">
              {[0, 1, 2, 3].map((idx) => {
                const filled = idx < pinInput.length;
                return (
                  <div
                    key={idx}
                    className={`h-13 rounded-2xl border-2 flex items-center justify-center text-xl font-extrabold tabular-nums transition-colors ${
                      filled
                        ? 'bg-[#3B1F0E] border-[#3B1F0E] text-[#D9A441]'
                        : 'bg-[#FDF2D6] border-[#D9A441]/70 text-[#7A5A3A]'
                    }`}
                  >
                    {filled ? '●' : ''}
                  </div>
                );
              })}
            </div>

            {pinError && (
              <p className="text-xs font-extrabold text-[#B83227] bg-[#B83227]/10 border border-[#B83227]/35 rounded-xl px-3 py-2 text-center">
                {pinError}
              </p>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleDigitPress(digit)}
                  className="h-12 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/60 text-base font-extrabold text-[#2B1A0E] hover:bg-[#E8C87A]/40 active:scale-95 transition-all cursor-pointer tabular-nums"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                }}
                className="h-12 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/60 text-xs font-extrabold text-[#7A5A3A] hover:bg-[#E8C87A]/30 cursor-pointer"
              >
                Limpiar
              </button>

              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-12 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/60 text-base font-extrabold text-[#2B1A0E] hover:bg-[#E8C87A]/40 active:scale-95 transition-all cursor-pointer tabular-nums"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                aria-label="Borrar último dígito"
                className="h-12 rounded-2xl bg-[#FDF2D6] border border-[#D9A441]/60 text-[#3B1F0E] flex items-center justify-center hover:bg-[#E8C87A]/30 active:scale-95 cursor-pointer"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold text-[#7A5A3A] pt-1">
              <span>PIN por defecto: {mozoPin === '1234' ? '1234' : '4 dígitos'}</span>
              {isMozoLoggedIn && (
                <span className="inline-flex items-center gap-1 text-[#B84A27] font-extrabold">
                  <LogOut className="w-3 h-3" />
                  Modo Logout
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
