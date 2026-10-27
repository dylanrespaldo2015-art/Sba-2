import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';
import { Download, Share, X, Smartphone, Check } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running as an installed PWA / standalone app, don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    }
  };

  return (
    <>
      {/* Chromium / Android / Desktop Install Button */}
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          className={`cursor-pointer group relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all transform active:scale-95 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border border-emerald-300/40 ${className}`}
          title="Instalar aplicación en tu dispositivo"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-100"></span>
          </span>
          <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
          <span>Instalar App</span>
        </button>
      )}

      {/* iOS Safari Flow (when beforeinstallprompt is not provided by WebKit) */}
      {!isInstallable && isIOS && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs shadow-md transition-all active:scale-95 bg-slate-900/90 hover:bg-slate-800 text-sky-300 border border-sky-400/30 ${className}`}
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>
      )}

      {/* Success Banner */}
      {installSuccess && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-bounce">
          <Check className="w-5 h-5 text-emerald-100" />
          <span className="text-xs font-bold">¡App instalada con éxito! Revisa tu pantalla de inicio.</span>
        </div>
      )}

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 text-slate-100 p-6 shadow-2xl border border-sky-500/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <img src="/pwa-192x192.png" alt="Oso Aventuras" className="w-8 h-8 rounded-lg shadow" />
                <h3 className="text-base font-bold text-amber-300">Instalar en iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-sky-300">Paso 1:</strong> Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-amber-300">Paso 2:</strong> Desliza hacia abajo y selecciona <strong>«Añadir a pantalla de inicio»</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-emerald-300">Paso 3:</strong> Presiona <strong>«Añadir»</strong> en la esquina superior derecha y ¡listo! Podrás jugar a pantalla completa y sin conexión.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full cursor-pointer rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-xs font-bold text-white shadow-lg hover:from-sky-400 hover:to-blue-500 transition-all active:scale-95"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
