import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { OfficialLogo } from './BrandAssets';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let userMessage = 'Ocurrió un problema inesperado al sincronizar los datos.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        if (parsed.error.toLowerCase().includes('permission')) {
          userMessage =
            'No tienes permisos suficientes para realizar esta acción o ver estos datos.';
        } else {
          userMessage = `Error de sincronización: ${parsed.error}`;
        }
      }
    } catch {
      if (error.message) {
        userMessage = error.message;
      }
    }
    return { hasError: true, message: userMessage };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('App ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#3B1F0E] text-[#FFF8E8] flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl bg-[#FFF8E8] text-[#2B1A0E] border-2 border-[#D9A441] p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-center">
              <OfficialLogo size="sm" />
            </div>

            <div className="w-12 h-12 rounded-2xl bg-[#B84A27]/15 text-[#B84A27] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h1 className="font-serif-display text-xl font-bold text-[#3B1F0E]">
              Algo salió mal
            </h1>
            <p className="text-xs font-semibold text-[#7A5A3A] leading-relaxed">
              {this.state.message}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[46px] rounded-2xl bg-[#3B1F0E] text-[#FFF8E8] font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-[#4A2C1A] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#D9A441]" />
              <span>Recargar aplicación</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
