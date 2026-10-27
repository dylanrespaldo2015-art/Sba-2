import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Palette, Sparkles, Play, ArrowLeft } from 'lucide-react';
import { CharacterAnimationState, BearCustomization, DEFAULT_BEAR_CONFIG } from '../game/character.ts';

interface CharacterCustomizerProps {
  currentAnim: CharacterAnimationState;
  onSelectAnim: (anim: CharacterAnimationState) => void;
  customization: BearCustomization;
  onUpdateCustomization: (config: Partial<BearCustomization>) => void;
  onBackToGame: () => void;
}

const BACKPACK_COLORS = [
  { name: 'Azul Original', hex: '#0284c7' },
  { name: 'Rojo Rubí', hex: '#dc2626' },
  { name: 'Verde Selva', hex: '#16a34a' },
  { name: 'Morado Real', hex: '#9333ea' },
  { name: 'Oro Miel', hex: '#eab308' },
];

const FUR_COLORS = [
  { name: 'Pardo Clásico', hex: '#6f3e1b', belly: '#dfa55d' },
  { name: 'Canela Suave', hex: '#8c5024', belly: '#e5be78' },
  { name: 'Chocolate Oscuro', hex: '#42220d', belly: '#c69553' },
  { name: 'Oso Meloso', hex: '#b45309', belly: '#fef08a' },
  { name: 'Oso Polar', hex: '#f1f5f9', belly: '#cbd5e1' },
];

const COLLAR_COLORS = [
  { name: 'Amarillo', hex: '#eab308' },
  { name: 'Rojo Rubí', hex: '#e11d48' },
  { name: 'Esmeralda', hex: '#10b981' },
  { name: 'Azul Zafiro', hex: '#2563eb' },
];

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  currentAnim,
  onSelectAnim,
  customization,
  onUpdateCustomization,
  onBackToGame,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'anim' | 'colors'>('anim');

  const animations: { id: CharacterAnimationState; label: string; icon: string }[] = [
    { id: 'idle', label: 'Reposo', icon: '🐾' },
    { id: 'run', label: 'Correr', icon: '💨' },
    { id: 'jump', label: 'Salto', icon: '⬆️' },
    { id: 'doubleJump', label: 'Giro Aéreo', icon: '🔄' },
    { id: 'spinAttack', label: 'Ataque Giro', icon: '🌪️' },
    { id: 'groundPound', label: 'Pisotón', icon: '💥' },
    { id: 'wave', label: 'Saludar', icon: '👋' },
    { id: 'dance', label: 'Bailecito', icon: '🎵' },
    { id: 'victory', label: 'Victoria', icon: '🏆' },
  ];

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-3xl pointer-events-auto font-sans select-none">
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="cursor-pointer bg-slate-900/95 hover:bg-slate-800 text-slate-300 text-xs font-semibold px-4 py-1 rounded-t-xl border-t border-x border-slate-700/80 shadow-md flex items-center gap-1.5 transition-colors"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Mostrar Inspector de Oso 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Ocultar Dock</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Dock */}
      {!isCollapsed && (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-2xl text-white">
          {/* Dock Header & Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🐻</span>
              <span className="font-bold text-sm text-amber-300">Inspector del Personaje 3D</span>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('anim')}
                className={`cursor-pointer px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'anim'
                    ? 'bg-amber-500 text-amber-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Animaciones</span>
              </button>

              <button
                onClick={() => setActiveTab('colors')}
                className={`cursor-pointer px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === 'colors'
                    ? 'bg-amber-500 text-amber-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Colores</span>
              </button>
            </div>

            {/* Back to Play CTA */}
            <button
              onClick={onBackToGame}
              className="cursor-pointer bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Jugar</span>
            </button>
          </div>

          {/* TAB 1: ANIMATIONS */}
          {activeTab === 'anim' && (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
              {animations.map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => onSelectAnim(anim.id)}
                  className={`cursor-pointer flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                    currentAnim === anim.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                  }`}
                >
                  <span className="text-base mb-0.5">{anim.icon}</span>
                  <span className="truncate w-full text-center text-[11px]">{anim.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 2: CUSTOM COLORS */}
          {activeTab === 'colors' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Mochila */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
                  <span>🎒 Mochila</span>
                </div>
                <div className="flex gap-2">
                  {BACKPACK_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateCustomization({ backpackColor: c.hex, strapColor: c.hex })}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`cursor-pointer w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${
                        customization.backpackColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Pelaje */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
                  <span>🐻 Pelaje</span>
                </div>
                <div className="flex gap-2">
                  {FUR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateCustomization({ furColor: c.hex, bellyColor: c.belly })}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`cursor-pointer w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${
                        customization.furColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Collar */}
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                <div className="text-slate-300 font-semibold mb-2 flex items-center gap-1.5">
                  <span>🎗️ Collar</span>
                </div>
                <div className="flex gap-2">
                  {COLLAR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => onUpdateCustomization({ collarColor: c.hex })}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`cursor-pointer w-7 h-7 rounded-full border-2 transition-transform active:scale-90 ${
                        customization.collarColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Tip Footer */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Arrastra con el ratón o dedo para girar 360° · Rueda para zoom</span>
            <button
              onClick={() => onUpdateCustomization(DEFAULT_BEAR_CONFIG)}
              className="cursor-pointer text-amber-400 hover:underline"
            >
              Restablecer estilo original
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
