import React from 'react';

export type ThemeMode = 'indigo' | 'emerald' | 'violet' | 'ruby';
export type FontSize = 'compact' | 'normal' | 'large';

interface Props {
  currentTheme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  fontSize: FontSize;
  onChangeFontSize: (size: FontSize) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

const THEMES: { id: ThemeMode; name: string; gradient: string; accentBg: string }[] = [
  { id: 'indigo', name: 'Cyber Indigo', gradient: 'from-indigo-600 to-purple-600', accentBg: 'bg-indigo-500' },
  { id: 'emerald', name: 'Midnight Emerald', gradient: 'from-emerald-600 to-teal-600', accentBg: 'bg-emerald-500' },
  { id: 'violet', name: 'Neon Violet', gradient: 'from-purple-600 to-pink-600', accentBg: 'bg-purple-500' },
  { id: 'ruby', name: 'Sunset Ruby', gradient: 'from-rose-600 to-orange-600', accentBg: 'bg-rose-500' },
];

export const SettingsModal: React.FC<Props> = ({
  currentTheme,
  onChangeTheme,
  fontSize,
  onChangeFontSize,
  soundEnabled,
  onToggleSound,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="w-full max-w-md glass rounded-3xl border border-white/12 p-6 shadow-2xl space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-bold text-white">App Settings & Customization</h2>
              <p className="text-xs text-slate-400">Personalize your AI Order Assistant interface</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 1. Theme Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Theme Palette Mood
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => onChangeTheme(t.id)}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all duration-200 text-left ${
                  currentTheme === t.id
                    ? 'bg-white/10 border-indigo-400 ring-2 ring-indigo-500/40 shadow-lg'
                    : 'bg-white/4 border-white/8 hover:bg-white/8 hover:border-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.gradient} flex-shrink-0 shadow-md`} />
                <span className="text-xs font-semibold text-white">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Text Density / Font Size */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Interface Density & Text Size
          </label>
          <div className="flex bg-black/30 p-1 rounded-2xl border border-white/8">
            {(['compact', 'normal', 'large'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => onChangeFontSize(size)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  fontSize === size
                    ? 'bg-theme-gradient text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Audio & Notifications Toggle */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-bold text-white">Audio Feedback Cues</p>
              <p className="text-[11px] text-slate-400">Play subtle sound pulses on message & approval completion</p>
            </div>
            <button
              onClick={onToggleSound}
              className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                soundEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform" />
            </button>
          </div>
        </div>

        {/* Close Done Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-theme-gradient text-white font-bold text-xs shadow-lg hover:opacity-95 transition-opacity"
        >
          Save & Apply Settings
        </button>
      </div>
    </div>
  );
};
