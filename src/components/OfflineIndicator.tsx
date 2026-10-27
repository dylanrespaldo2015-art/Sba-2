import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall.ts';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 text-white px-3.5 py-2 text-xs font-semibold shadow-xl border border-amber-300/40 backdrop-blur-sm animate-pulse">
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>Modo sin conexión — Jugando con datos en caché</span>
    </div>
  );
};
