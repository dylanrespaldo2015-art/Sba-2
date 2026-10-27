import React, { useState } from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, ArrowRight, Eye, Gamepad2 } from 'lucide-react';
import { GameMode, GameState } from '../game/gameEngine.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';


interface GameHUDProps {
  state: GameState;
  onStartGame: () => void;
  onRestartGame: () => void;
  onResumeGame: () => void;
  onNextLevel: () => void;
  onToggleMute: () => void;
  onToggleInspect: () => void;
  onPause: () => void;
  onTouchMove?: (x: number, y: number) => void;
  onTouchJump?: () => void;
  onTouchSpin?: () => void;
  onTouchPound?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  state,
  onStartGame,
  onRestartGame,
  onResumeGame,
  onNextLevel,
  onToggleMute,
  onToggleInspect,
  onPause,
  onTouchMove,
  onTouchJump,
  onTouchSpin,
  onTouchPound,
}) => {
  const [touchActive, setTouchActive] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });

  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchActive(true);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!touchActive) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = rect.width / 2;

    const normX = Math.max(-1, Math.min(1, dx / maxDist));
    const normY = Math.max(-1, Math.min(1, dy / maxDist));

    setTouchPos({ x: normX * 30, y: normY * 30 });
    if (onTouchMove) onTouchMove(normX, normY);
  };

  const handleJoystickEnd = () => {
    setTouchActive(false);
    setTouchPos({ x: 0, y: 0 });
    if (onTouchMove) onTouchMove(0, 0);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 font-sans text-white overflow-hidden">
      {/* =========================================================================
          TITLE SCREEN
          ========================================================================= */}
      {state.mode === 'title' && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 sm:p-12 pointer-events-auto bg-gradient-to-b from-black/40 via-transparent to-black/60">
          {/* Header Tag */}
          <div className="flex items-center gap-3 bg-amber-500/90 text-amber-950 font-bold px-4 py-1.5 rounded-full shadow-lg text-xs sm:text-sm tracking-wide uppercase border border-amber-300/40">
            <span>🐻 Aventura de Plataformas 3D</span>
          </div>

          {/* Central Title Lockup */}
          <div className="text-center my-auto flex flex-col items-center">
            {/* Custom SVG Title Lockup */}
            <div className="relative mb-2">
              <svg className="w-72 sm:w-96 md:w-[480px] h-auto drop-shadow-2xl" viewBox="0 0 500 130">
                <defs>
                  <linearGradient id="titleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#451a03" floodOpacity="0.8" />
                  </filter>
                </defs>
                <text
                  x="50%"
                  y="60"
                  textAnchor="middle"
                  fill="url(#titleGrad)"
                  stroke="#451a03"
                  strokeWidth="6"
                  paintOrder="stroke fill"
                  fontSize="52"
                  fontWeight="900"
                  letterSpacing="3"
                  filter="url(#shadow)"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  OSO AVENTURAS
                </text>
                <text
                  x="50%"
                  y="115"
                  textAnchor="middle"
                  fill="#38bdf8"
                  stroke="#075985"
                  strokeWidth="5"
                  paintOrder="stroke fill"
                  fontSize="42"
                  fontWeight="900"
                  letterSpacing="8"
                  filter="url(#shadow)"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  3D PLATAFORMAS
                </text>
              </svg>
            </div>

            <p className="text-sm sm:text-base text-amber-100 max-w-md mx-auto font-medium drop-shadow-md mb-6">
              ¡Acompaña al oso de la mochila azul! Salta, haz dobles saltos, gira contra los enemigos y recoge todos los tarros de miel.
            </p>

            {/* Start Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={onStartGame}
                className="cursor-pointer px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-amber-950 text-lg sm:text-xl font-extrabold rounded-2xl shadow-xl border-2 border-amber-200 transition-transform duration-150 flex items-center gap-3"
              >
                <span>¡JUGAR AHORA!</span>
                <span className="text-xs bg-amber-950/20 px-2 py-0.5 rounded text-amber-900 font-bold">ESPACIO</span>
              </button>

              <button
                onClick={onToggleInspect}
                className="cursor-pointer px-5 py-3 bg-slate-900/80 hover:bg-slate-800 text-sky-300 text-sm font-semibold rounded-2xl border border-sky-400/40 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Inspeccionar Oso 3D</span>
              </button>

              <PWAInstallButton />
            </div>
          </div>

          {/* Control hints strip */}
          <div className="w-full max-w-2xl bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-center text-xs text-amber-200/90 font-medium tracking-wide">
            WASD o Flechas: Mover · Espacio: Salto / Doble Salto · Shift / J: Ataque Giratorio · C / K: Pisotón · Arrastra ratón: Girar cámara
          </div>
        </div>
      )}

      {/* =========================================================================
          IN-GAME HUD (PERIMETER CLUSTERS < 15% OCCLUSION)
          ========================================================================= */}
      {(state.mode === 'playing' || state.mode === 'paused') && (
        <>
          {/* Top-Left Cluster: Status, Honey, Acorns, Lives */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto">
            {/* Main Stats Pill */}
            <div className="flex items-center gap-3 bg-amber-950/85 border border-amber-500/40 rounded-2xl px-3.5 py-2 shadow-lg">
              {/* Honey Pot Count */}
              <div className="flex items-center gap-1.5" title="Tarros de Miel">
                <span className="text-xl">🍯</span>
                <span className="font-extrabold text-amber-300 tabular-nums text-base">
                  {state.honeyCount}/{state.maxHoney}
                </span>
              </div>

              <div className="w-px h-5 bg-amber-700/60" />

              {/* Coins / Acorns */}
              <div className="flex items-center gap-1.5" title="Monedas">
                <span className="text-xl">🌰</span>
                <span className="font-bold text-yellow-300 tabular-nums text-sm">
                  {state.coins}
                </span>
              </div>

              <div className="w-px h-5 bg-amber-700/60" />

              {/* Lives Hearts */}
              <div className="flex items-center gap-0.5" title="Vidas">
                {Array.from({ length: state.maxLives }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-base transition-opacity ${
                      i < state.lives ? 'opacity-100 text-red-500' : 'opacity-25 text-gray-500'
                    }`}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            </div>

            {/* Level & Score Badge */}
            <div className="flex items-center gap-2">
              <span className="bg-sky-950/85 border border-sky-500/30 text-sky-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
                Nivel {state.levelIndex}: {state.levelName}
              </span>
              <span className="bg-black/60 text-amber-200/90 text-xs font-mono px-2 py-1 rounded-lg">
                Puntos: {state.score}
              </span>
            </div>
          </div>

          {/* Top-Right Cluster: Level, Time, Audio & Pause Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-auto">
            <PWAInstallButton className="hidden sm:flex" />

            {/* Inspector Toggle */}
            <button
              onClick={onToggleInspect}
              title="Modo Inspección 3D"
              className="cursor-pointer bg-slate-900/80 hover:bg-slate-800 text-sky-300 p-2.5 rounded-xl border border-sky-400/40 shadow-md transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              title={state.isMuted ? 'Activar Sonido' : 'Silenciar'}
              className="cursor-pointer bg-slate-900/80 hover:bg-slate-800 text-amber-300 p-2.5 rounded-xl border border-amber-400/40 shadow-md transition-colors"
            >
              {state.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Pause Toggle */}
            <button
              onClick={onPause}
              title="Pausar Juego (Esc)"
              className="cursor-pointer bg-slate-900/80 hover:bg-slate-800 text-white p-2.5 rounded-xl border border-white/20 shadow-md transition-colors"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Controls / Hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-3 bg-black/60 border border-white/10 px-4 py-1.5 rounded-full text-xs text-amber-200/90 font-medium">
            <span>[WASD] Mover</span>
            <span>•</span>
            <span>[ESPACIO] Salto x2</span>
            <span>•</span>
            <span>[SHIFT / J] Giro</span>
            <span>•</span>
            <span>[C / K] Pisotón</span>
            <span>•</span>
            <span>[RATÓN] Cámara</span>
          </div>

          {/* Mobile Touch Controls Overlay */}
          <div className="md:hidden absolute inset-0 pointer-events-none flex justify-between items-end p-6">
            {/* Virtual Joystick Base */}
            <div
              className="w-28 h-28 rounded-full bg-black/40 border-2 border-white/30 flex items-center justify-center pointer-events-auto relative touch-none"
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
            >
              <div
                className="w-12 h-12 rounded-full bg-amber-400/80 border-2 border-amber-200 shadow-md transition-transform"
                style={{
                  transform: `translate(${touchPos.x}px, ${touchPos.y}px)`,
                }}
              />
            </div>

            {/* Action Buttons Right */}
            <div className="flex flex-col gap-3 pointer-events-auto items-end">
              <div className="flex gap-2">
                {/* Spin Attack Button */}
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (onTouchSpin) onTouchSpin();
                  }}
                  className="w-14 h-14 rounded-full bg-sky-600/90 border-2 border-sky-300 text-white font-extrabold text-sm active:scale-90 shadow-lg flex items-center justify-center"
                >
                  GIRO
                </button>
                {/* Ground Pound Button */}
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    if (onTouchPound) onTouchPound();
                  }}
                  className="w-14 h-14 rounded-full bg-orange-600/90 border-2 border-orange-300 text-white font-extrabold text-xs active:scale-90 shadow-lg flex items-center justify-center"
                >
                  SLAM
                </button>
              </div>

              {/* Jump Button (Big) */}
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  if (onTouchJump) onTouchJump();
                }}
                className="w-20 h-20 rounded-full bg-amber-500/90 border-3 border-amber-200 text-amber-950 font-black text-lg active:scale-90 shadow-xl flex items-center justify-center mr-2"
              >
                SALTO
              </button>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          PAUSE MODAL
          ========================================================================= */}
      {state.mode === 'paused' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
            <h2 className="text-2xl font-black text-amber-400 mb-2">JUEGO EN PAUSA</h2>
            <p className="text-sm text-slate-300 mb-6">Nivel {state.levelIndex}: {state.levelName}</p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onResumeGame}
                className="cursor-pointer py-3 px-6 bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-bold rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Continuar</span>
              </button>

              <button
                onClick={onRestartGame}
                className="cursor-pointer py-3 px-6 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-semibold rounded-xl border border-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Nivel</span>
              </button>

              <button
                onClick={onToggleInspect}
                className="cursor-pointer py-3 px-6 bg-sky-950/70 hover:bg-sky-900 active:scale-95 text-sky-300 font-semibold rounded-xl border border-sky-600/40 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Inspeccionar Personaje</span>
              </button>

              <PWAInstallButton className="w-full justify-center py-2.5" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VICTORY MODAL
          ========================================================================= */}
      {state.mode === 'victory' && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-slate-900 border-2 border-yellow-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-3xl font-black text-yellow-300 mb-1">¡NIVEL COMPLETADO!</h2>
            <p className="text-sm text-amber-200 mb-6 font-medium">
              ¡Has conquistado la Colmena de {state.levelName}!
            </p>

            {/* Score Tally */}
            <div className="bg-black/50 border border-yellow-400/30 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-slate-400">Tarros Miel</div>
                <div className="text-xl font-bold text-amber-400">🍯 {state.honeyCount}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Monedas</div>
                <div className="text-xl font-bold text-yellow-300">🌰 {state.coins}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Puntos Totales</div>
                <div className="text-xl font-bold text-white">{state.score}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {state.levelIndex < state.totalLevels ? (
                <button
                  onClick={onNextLevel}
                  className="cursor-pointer flex-1 py-3 px-6 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-amber-950 font-black rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>SIGUIENTE NIVEL</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={onRestartGame}
                  className="cursor-pointer flex-1 py-3 px-6 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-amber-950 font-black rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>¡JUGAR DE NUEVO!</span>
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={onToggleInspect}
                className="cursor-pointer py-3 px-4 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold rounded-xl border border-sky-400/30 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Oso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          GAME OVER MODAL
          ========================================================================= */}
      {state.mode === 'gameover' && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-2">🥀</div>
            <h2 className="text-2xl font-black text-red-400 mb-2">¡FIN DE LA AVENTURA!</h2>
            <p className="text-sm text-slate-300 mb-6">
              Te has quedado sin corazones. ¡Vuelve a intentarlo!
            </p>

            <button
              onClick={onRestartGame}
              className="cursor-pointer w-full py-3 px-6 bg-amber-500 hover:bg-amber-400 active:scale-95 text-amber-950 font-bold rounded-xl shadow-lg transition-transform flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reintentar Nivel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
