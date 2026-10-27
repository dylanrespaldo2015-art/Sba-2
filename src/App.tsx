import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameState } from './game/gameEngine.ts';
import { GameHUD } from './components/GameHUD.tsx';
import { CharacterCustomizer } from './components/CharacterCustomizer.tsx';
import { sound } from './game/audio.ts';
import {
  BearCustomization,
  CharacterAnimationState,
  DEFAULT_BEAR_CONFIG,
} from './game/character.ts';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';


export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    mode: 'title',
    levelIndex: 1,
    totalLevels: 3,
    levelName: 'Isla Prado Soleado',
    honeyCount: 0,
    maxHoney: 5,
    coins: 0,
    score: 0,
    lives: 3,
    maxLives: 3,
    timeElapsed: 0,
    isMuted: false,
  });

  const [customization, setCustomization] = useState<BearCustomization>(DEFAULT_BEAR_CONFIG);
  const [currentAnim, setCurrentAnim] = useState<CharacterAnimationState>('idle');

  // Initialize Game Engine once
  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new GameEngine(mountRef.current, (newState) => {
      setGameState(newState);
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.startGame();
  };

  const handleRestartGame = () => {
    if (!engineRef.current) return;
    engineRef.current.restartGame();
  };

  const handleResumeGame = () => {
    if (!engineRef.current) return;
    engineRef.current.setMode('playing');
  };

  const handleNextLevel = () => {
    if (!engineRef.current) return;
    engineRef.current.nextLevel();
  };

  const handleToggleMute = () => {
    const isMuted = sound.toggleMute();
    setGameState((prev) => ({ ...prev, isMuted }));
  };

  const handleToggleInspect = () => {
    if (!engineRef.current) return;
    if (gameState.mode === 'inspect') {
      engineRef.current.setMode('playing');
    } else {
      engineRef.current.setMode('inspect');
      engineRef.current.player.setAnimation('idle');
      setCurrentAnim('idle');
    }
  };

  const handlePause = () => {
    if (!engineRef.current) return;
    if (gameState.mode === 'playing') {
      engineRef.current.setMode('paused');
    } else if (gameState.mode === 'paused') {
      engineRef.current.setMode('playing');
    }
  };

  const handleSelectAnim = (anim: CharacterAnimationState) => {
    setCurrentAnim(anim);
    if (engineRef.current) {
      engineRef.current.player.setAnimation(anim);
      if (anim === 'jump') sound.playJump();
      if (anim === 'doubleJump') sound.playDoubleJump();
      if (anim === 'spinAttack') sound.playSpinAttack();
      if (anim === 'victory') sound.playLevelVictory();
    }
  };

  const handleUpdateCustomization = (config: Partial<BearCustomization>) => {
    const updated = { ...customization, ...config };
    setCustomization(updated);
    if (engineRef.current) {
      engineRef.current.setCustomization(updated);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Primary Game Shell HUD */}
      {gameState.mode !== 'inspect' && (
        <GameHUD
          state={gameState}
          onStartGame={handleStartGame}
          onRestartGame={handleRestartGame}
          onResumeGame={handleResumeGame}
          onNextLevel={handleNextLevel}
          onToggleMute={handleToggleMute}
          onToggleInspect={handleToggleInspect}
          onPause={handlePause}
          onTouchMove={(x, y) => {
            if (engineRef.current) {
              engineRef.current.touchInput.moveX = x;
              engineRef.current.touchInput.moveY = y;
            }
          }}
          onTouchJump={() => {
            if (engineRef.current) {
              engineRef.current.touchInput.jump = true;
            }
          }}
          onTouchSpin={() => {
            if (engineRef.current) {
              engineRef.current.touchInput.spin = true;
            }
          }}
          onTouchPound={() => {
            if (engineRef.current) {
              engineRef.current.touchInput.pound = true;
            }
          }}
        />
      )}

      {/* Inspector / Showcase Mode Dock */}
      {gameState.mode === 'inspect' && (
        <>
          {/* Top header badge */}
          <div className="absolute top-4 left-4 z-20 pointer-events-auto flex items-center gap-3">
            <button
              onClick={handleToggleInspect}
              className="cursor-pointer bg-slate-900/90 hover:bg-slate-800 text-sky-300 px-4 py-2 rounded-xl border border-sky-400/40 text-xs font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              <span>← Volver al Juego</span>
            </button>
            <div className="bg-black/60 text-amber-200/90 text-xs font-semibold px-3 py-2 rounded-xl border border-white/10 hidden sm:block">
              Arrastra para girar 360° · Rueda para acercar/alejar
            </div>
          </div>

          <CharacterCustomizer
            currentAnim={currentAnim}
            onSelectAnim={handleSelectAnim}
            customization={customization}
            onUpdateCustomization={handleUpdateCustomization}
            onBackToGame={handleStartGame}
          />
        </>
      )}

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}

