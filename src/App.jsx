// Version: S2.0
// Release: Production Stable
// Features: Hard Lock 40/40/20, Audio Engine V5, Visual FX, PWA Support
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Monitor, Smartphone, Trophy, Minimize, Maximize, ChevronLeft, ChevronRight, AlertCircle, Upload, Type, Image as ImageIcon, ArrowLeft, ArrowRight, Plus, Minus, MousePointerClick, Volume2, Sparkles, Download, Wifi, WifiOff, Share } from 'lucide-react';

const SPORTS_CONFIG = {
  football: { name: "Football", periodName: "Mi-temps", periods: 2, timePerPeriod: 45, countDirection: "up", showSets: false, showFouls: false, foulLimit: 0, scoreTerm: "BUT" },
  basketball: { name: "Basketball", periodName: "Q-Temps", periods: 4, timePerPeriod: 10, countDirection: "down", showSets: false, showFouls: true, foulLimit: 5, scoreTerm: "PANIER" },
  volleyball: { name: "Volleyball", periodName: "Set", periods: 5, timePerPeriod: 0, countDirection: "none", showSets: true, showFouls: false, foulLimit: 0, scoreTerm: "POINT" },
  futsal: { name: "Futsal", periodName: "Mi-temps", periods: 2, timePerPeriod: 20, countDirection: "down", showSets: false, showFouls: true, foulLimit: 5, scoreTerm: "BUT" },
  handball: { name: "Handball", periodName: "Mi-temps", periods: 2, timePerPeriod: 30, countDirection: "down", showSets: false, showFouls: false, foulLimit: 0, scoreTerm: "BUT" }
};

const SOUND_OPTIONS = [
  { id: 'whistle_trill', name: "Sifflet à Roulette" },
  { id: 'buzzer_fiba', name: "Buzzer FIBA" }
];

const ANIMATION_OPTIONS = [
  { id: 'zoom', name: "Zoom & Rebond" },
  { id: 'flash', name: "Flash Stroboscopique" },
  { id: 'drop', name: "Chute Libre" },
  { id: 'shake', name: "Séisme" },
  { id: 'pulse', name: "Pulsation Néon" }
];

const AnimationStyles = () => (
  <style>{`
    @keyframes anim-zoom { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes anim-drop { 0% { transform: translateY(-100vh); opacity: 0; } 70% { transform: translateY(20px); opacity: 1; } 100% { transform: translateY(0); opacity: 1; } }
    @keyframes anim-shake { 0% { transform: translate(1px, 1px) rotate(0deg); opacity: 0; } 10% { transform: translate(-1px, -2px) rotate(-1deg); opacity: 1; } 20% { transform: translate(-3px, 0px) rotate(1deg); } 30% { transform: translate(3px, 2px) rotate(0deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 50% { transform: translate(-1px, 2px) rotate(-1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 70% { transform: translate(3px, 1px) rotate(-1deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 90% { transform: translate(1px, 2px) rotate(0deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); opacity: 1; } }
    @keyframes anim-flash { 0%, 50%, 100% { opacity: 1; filter: brightness(2); } 25%, 75% { opacity: 0; } }
    @keyframes anim-pulse-neon { 0% { text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px var(--neon-color), 0 0 40px var(--neon-color); opacity: 0.8; } 100% { text-shadow: 0 0 20px #fff, 0 0 30px var(--neon-color), 0 0 40px var(--neon-color), 0 0 50px var(--neon-color), 0 0 60px var(--neon-color); opacity: 1; scale: 1.05; } }
    .animate-custom-zoom { animation: anim-zoom 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
    .animate-custom-drop { animation: anim-drop 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
    .animate-custom-shake { animation: anim-shake 0.5s linear both; }
    .animate-custom-flash { animation: anim-flash 0.5s linear both; }
    .animate-custom-pulse { animation: anim-pulse-neon 0.8s ease-in-out infinite alternate; }
  `}</style>
);

const playGameSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.5, now);

  if (type === 'whistle_trill') {
    const osc = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modG = ctx.createGain();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(ctx.destination);
    mod.connect(modG);
    modG.connect(env.gain);
    osc.frequency.value = 2500;
    mod.frequency.value = 40;
    mod.type = 'square';
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.5, now + 0.05);
    env.gain.linearRampToValueAtTime(0, now + 0.8);
    osc.start(now);
    mod.start(now);
    osc.stop(now + 0.8);
    mod.stop(now + 0.8);
  } else if (type === 'buzzer_fiba') {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, now);
    osc.connect(masterGain);
    masterGain.gain.setValueAtTime(0.6, now);
    masterGain.gain.linearRampToValueAtTime(0.6, now + 1.5);
    masterGain.gain.linearRampToValueAtTime(0, now + 2.0);
    osc.start(now);
    osc.stop(now + 2.0);
  }
};

const GestureArea = ({ children, onTap, onSwipeLeft, onSwipeRight, className, style, disabled = false, isTimer = false }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const elementRef = useRef(null);
  const handleContextMenu = (e) => { e.preventDefault(); e.stopPropagation(); return false; };
  useEffect(() => {
    const el = elementRef.current;
    if (el) {
      const preventDefault = (e) => { if (!disabled) e.preventDefault(); };
      el.addEventListener('touchmove', preventDefault, { passive: false });
      el.addEventListener('contextmenu', handleContextMenu);
      return () => { el.removeEventListener('touchmove', preventDefault); el.removeEventListener('contextmenu', handleContextMenu); };
    }
  }, [disabled]);
  const handleTouchStart = (e) => { if (disabled) return; touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (disabled || !touchStartX.current) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0 && onSwipeLeft) onSwipeLeft(); else if (diffX > 0 && onSwipeRight) onSwipeRight();
    } else if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30 && onTap) {
      if (e.cancelable) e.preventDefault(); onTap();
    }
    touchStartX.current = null; touchStartY.current = null;
  };
  const handleMouseDown = (e) => { if (disabled) return; touchStartX.current = e.clientX; };
  const handleMouseUp = (e) => {
    if (disabled || !touchStartX.current) return;
    const diffX = e.clientX - touchStartX.current;
    if (diffX < -50 && onSwipeLeft) onSwipeLeft(); else if (diffX > 50 && onSwipeRight) onSwipeRight(); else if (Math.abs(diffX) < 10 && onTap) onTap();
    touchStartX.current = null;
  };
  const cursorStyle = isTimer ? 'cursor-pointer' : 'cursor-ew-resize';
  return (
    <div ref={elementRef} className={`${className} ${cursorStyle} touch-none select-none active:scale-[0.98] transition-transform duration-75`}
      style={{ ...style, touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
      {children}
    </div>
  );
};

const GoalAnimation = ({ show, color, term, type = 'zoom' }) => {
  if (!show) return null;
  let animClass = "";
  let containerClass = "bg-black/20 backdrop-blur-sm";
  let textStyle = { textShadow: `0 0 50px ${color}` };
  switch (type) {
    case 'flash':
      animClass = "animate-custom-flash";
      containerClass = "bg-white/80 mix-blend-overlay";
      textStyle = { color: color, textShadow: 'none', filter: 'brightness(1.5)' };
      break;
    case 'drop': animClass = "animate-custom-drop"; break;
    case 'shake': animClass = "animate-custom-shake"; break;
    case 'pulse':
      animClass = "animate-custom-pulse";
      textStyle = { '--neon-color': color, color: '#fff' };
      break;
    case 'zoom':
    default: animClass = "animate-custom-zoom"; break;
  }
  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-hidden animate-in fade-in duration-200`}>
      <div className={`absolute inset-0 ${containerClass} transition-all duration-300`}></div>
      <h1 className={`text-[15vw] font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] z-50 tracking-tighter ${animClass}`} style={textStyle}>
        {term} !
      </h1>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-full animate-pulse opacity-30 bg-gradient-radial from-white/30 to-transparent"></div>
      </div>
    </div>
  );
};

const App = () => {
  const [sport, setSport] = useState('futsal');
  const [config, setConfig] = useState(SPORTS_CONFIG['futsal']);

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeSets, setHomeSets] = useState(0);
  const [awaySets, setAwaySets] = useState(0);
  const [homeFouls, setHomeFouls] = useState(0);
  const [awayFouls, setAwayFouls] = useState(0);
  const [period, setPeriod] = useState(1);

  const [homeName, setHomeName] = useState("DOMICILE");
  const [awayName, setAwayName] = useState("VISITEUR");
  const [homeColor, setHomeColor] = useState("#ef4444");
  const [awayColor, setAwayColor] = useState("#3b82f6");

  const [homeLogo, setHomeLogo] = useState(null);
  const [awayLogo, setAwayLogo] = useState(null);
  const [useHomeLogo, setUseHomeLogo] = useState(false);
  const [useAwayLogo, setUseAwayLogo] = useState(false);

  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [serviceSide, setServiceSide] = useState('home');

  const [showSettings, setShowSettings] = useState(false);
  const [tvMode, setTvMode] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState('buzzer_fiba');
  const [animEnabled, setAnimEnabled] = useState(true);
  const [animType, setAnimType] = useState('zoom');
  const [scoringAnim, setScoringAnim] = useState(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);
    const promptHandler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', promptHandler);
    const handleStatusChange = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('beforeinstallprompt', promptHandler);
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const toggleTvMode = async (enable) => {
    if (enable) {
      setTvMode(true);
      try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch (err) { console.error(err); }
    } else {
      setTvMode(false);
      try { if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen(); } catch (err) { console.error(err); }
    }
  };

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (config.countDirection === 'down') {
            if (prev <= 1) {
              setIsRunning(false);
              if (soundEnabled) playGameSound(soundType);
              return 0;
            }
            return prev - 1;
          } else if (config.countDirection === 'up') return prev + 1;
          return prev;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, config.countDirection, soundEnabled, soundType]);

  useEffect(() => {
    const newConfig = SPORTS_CONFIG[sport];
    setConfig(newConfig);
    resetGame(newConfig);
  }, [sport]);

  const resetGame = (specificConfig = config) => {
    setIsRunning(false);
    setHomeScore(0); setAwayScore(0); setHomeSets(0); setAwaySets(0); setHomeFouls(0); setAwayFouls(0); setPeriod(1);
    setTimeLeft(specificConfig.countDirection === 'down' ? specificConfig.timePerPeriod * 60 : 0);
    setServiceSide('home');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogoUpload = (e, team) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (team === 'home') setHomeLogo(url); else setAwayLogo(url);
    }
  };

  const handleTimeChange = (minutes) => {
    const newTime = parseInt(minutes, 10);
    if (!isNaN(newTime) && newTime > 0) {
      setConfig(prev => ({ ...prev, timePerPeriod: newTime }));
      if (!isRunning && config.countDirection === 'down') setTimeLeft(newTime * 60);
    }
  };

  const handleFoulLimitChange = (limit) => {
    const newLimit = parseInt(limit, 10);
    if (!isNaN(newLimit) && newLimit > 0) setConfig(prev => ({ ...prev, foulLimit: newLimit }));
  };

  const triggerAnim = (team) => {
    if (!animEnabled) return;
    setScoringAnim(team);
    setTimeout(() => setScoringAnim(null), 2000);
  };

  const modifyScore = (team, delta) => {
    if (team === 'home') {
      const newScore = Math.max(0, homeScore + delta);
      setHomeScore(newScore);
      if (delta > 0) triggerAnim('home');
    } else {
      const newScore = Math.max(0, awayScore + delta);
      setAwayScore(newScore);
      if (delta > 0) triggerAnim('away');
    }
  };

  const modifySets = (team, delta) => { if (team === 'home') setHomeSets(Math.max(0, homeSets + delta)); else setAwaySets(Math.max(0, awaySets + delta)); };
  const modifyFouls = (team, delta) => { if (team === 'home') setHomeFouls(Math.max(0, homeFouls + delta)); else setAwayFouls(Math.max(0, awayFouls + delta)); };
  const modifyPeriod = (delta) => setPeriod(Math.max(1, period + delta));
  const toggleTimer = () => { if (config.countDirection !== 'none') setIsRunning(prev => !prev); };
  const setService = (side) => setServiceSide(side);
  const toggleService = () => setServiceSide(prev => prev === 'home' ? 'away' : 'home');

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col font-sans select-none transition-colors duration-500 ${tvMode ? 'bg-black items-center justify-center' : 'bg-slate-950'}`}>
      <AnimationStyles />

      {/* HEADER */}
      {!tvMode && (
        <div className="h-12 md:h-14 w-full bg-slate-900 border-b border-slate-800 flex justify-between items-center px-4 shrink-0 z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <select value={sport} onChange={(e) => setSport(e.target.value)} className="bg-slate-800 text-xs md:text-sm font-bold border-none rounded focus:ring-2 ring-indigo-500 py-1 text-white">
              {Object.keys(SPORTS_CONFIG).map(k => <option key={k} value={k}>{SPORTS_CONFIG[k].name}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300"><Settings size={18} /></button>
            <button onClick={() => toggleTvMode(true)} className="flex items-center gap-2 bg-indigo-600 px-3 py-1 rounded text-xs md:text-sm font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg animate-pulse">
              <Monitor size={16} /> <span className="hidden md:inline">Mode Cast</span>
            </button>
          </div>
        </div>
      )}

      {/* BOUTON RETOUR */}
      {tvMode && (
        <button onClick={() => toggleTvMode(false)} className="absolute top-2 left-1/2 -translate-x-1/2 z-50 p-3 bg-white/10 text-white/30 hover:bg-slate-800 hover:text-white rounded-full transition-all backdrop-blur-md">
          <Smartphone size={24} />
        </button>
      )}

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4 text-white">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">Configuration</h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">Fermer</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">

              {/* PWA / RESEAU */}
              <div className={`p-4 rounded-xl border flex flex-col gap-3 ${isOnline ? 'bg-slate-900/50 border-slate-700' : 'bg-orange-900/30 border-orange-500/50'}`}>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isOnline ? 'text-green-400' : 'text-orange-400'}`}>{isOnline ? "Mode Connecté" : "Mode Hors Ligne"}</span>
                    {isOnline ? <Wifi size={14} className="text-green-400" /> : <WifiOff size={14} className="text-orange-400" />}
                  </div>
                  {deferredPrompt && (
                    <button onClick={handleInstallClick} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"><Download size={14} /> Installer</button>
                  )}
                </div>
                {isIOS && !deferredPrompt && (
                  <div className="flex items-start gap-2 bg-slate-800/50 p-2 rounded border border-slate-700">
                    <Share size={16} className="text-blue-400 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-tight">Pour installer sur iPhone/iPad : Appuyez sur le bouton <strong>Partager</strong> de Safari, puis choisissez <strong>"Sur l'écran d'accueil"</strong>.</p>
                  </div>
                )}
              </div>

              {/* AUDIO & EFFETS */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <h4 className="text-sm font-bold text-indigo-400 mb-3 uppercase flex items-center gap-2"><Volume2 size={16} /> Audio & Effets</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 p-3 rounded flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300">Buzzer fin</label>
                      <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-12 h-6 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-slate-600'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    {soundEnabled && (
                      <select value={soundType} onChange={(e) => { setSoundType(e.target.value); playGameSound(e.target.value); }} className="w-full bg-slate-700 text-xs text-white p-2 rounded border border-slate-600 mt-2">
                        {SOUND_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="bg-slate-800 p-3 rounded flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-yellow-400" />
                        <label className="text-xs font-bold text-slate-300">Anim. But</label>
                      </div>
                      <button onClick={() => setAnimEnabled(!animEnabled)} className={`w-12 h-6 rounded-full p-1 transition-colors ${animEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${animEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>
                    {animEnabled && (
                      <select value={animType} onChange={(e) => setAnimType(e.target.value)} className="w-full bg-slate-700 text-xs text-white p-2 rounded border border-slate-600 mt-2">
                        {ANIMATION_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* DURÉE & FAUTES */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4">
                <div>
                  <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Durée Période (Min)</label>
                  <div className="flex items-center gap-4 justify-center bg-slate-800 p-2 rounded border border-slate-600">
                    <button onClick={() => handleTimeChange(config.timePerPeriod - 1)} className="p-2 hover:bg-slate-700 rounded text-white transition-colors"><Minus size={24} /></button>
                    <span className="text-3xl font-bold w-20 text-center tabular-nums">{config.timePerPeriod}</span>
                    <button onClick={() => handleTimeChange(config.timePerPeriod + 1)} className="p-2 hover:bg-slate-700 rounded text-white transition-colors"><Plus size={24} /></button>
                  </div>
                </div>
                {config.showFouls && (
                  <div>
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-2 flex items-center gap-2"><AlertCircle size={14} className="text-red-500" /> Alerte Fautes à :</label>
                    <div className="flex items-center gap-4 justify-center bg-slate-800 p-2 rounded border border-slate-600">
                      <button onClick={() => handleFoulLimitChange(config.foulLimit - 1)} className="p-2 hover:bg-slate-700 rounded text-white transition-colors"><Minus size={24} /></button>
                      <span className="text-3xl font-bold w-20 text-center tabular-nums text-red-400">{config.foulLimit}</span>
                      <button onClick={() => handleFoulLimitChange(config.foulLimit + 1)} className="p-2 hover:bg-slate-700 rounded text-white transition-colors"><Plus size={24} /></button>
                    </div>
                  </div>
                )}
              </div>

              {/* TEAMS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs uppercase text-slate-400 font-bold" style={{ color: homeColor }}>Domicile</label>
                    <div className="flex bg-slate-800 rounded p-1">
                      <button onClick={() => setUseHomeLogo(false)} className={`p-1 rounded ${!useHomeLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><Type size={16} /></button>
                      <button onClick={() => setUseHomeLogo(true)} className={`p-1 rounded ${useHomeLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><ImageIcon size={16} /></button>
                    </div>
                  </div>
                  {!useHomeLogo ? <input value={homeName} onChange={e => setHomeName(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-600 mb-2" placeholder="Nom Équipe" />
                    : <div className="flex gap-2 items-center"><label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-600 flex items-center justify-center gap-2 text-sm text-slate-300"><Upload size={16} /> Logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'home')} /></label>{homeLogo && <img src={homeLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded" />}</div>}
                  <input type="color" value={homeColor} onChange={e => setHomeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2" />
                </div>
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs uppercase text-slate-400 font-bold" style={{ color: awayColor }}>Visiteur</label>
                    <div className="flex bg-slate-800 rounded p-1">
                      <button onClick={() => setUseAwayLogo(false)} className={`p-1 rounded ${!useAwayLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><Type size={16} /></button>
                      <button onClick={() => setUseAwayLogo(true)} className={`p-1 rounded ${useAwayLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><ImageIcon size={16} /></button>
                    </div>
                  </div>
                  {!useAwayLogo ? <input value={awayName} onChange={e => setAwayName(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-600 mb-2" placeholder="Nom Équipe" />
                    : <div className="flex gap-2 items-center"><label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-600 flex items-center justify-center gap-2 text-sm text-slate-300"><Upload size={16} /> Logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'away')} /></label>{awayLogo && <img src={awayLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded" />}</div>}
                  <input type="color" value={awayColor} onChange={e => setAwayColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2" />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700">
              <button onClick={() => setShowSettings(false)} className="w-full bg-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-500">Valider & Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* --- WRAPPER PRINCIPAL --- */}
      <div className={`transition-all duration-500 relative flex flex-col bg-slate-950 text-white ${tvMode ? 'w-full aspect-video max-h-screen shadow-2xl border border-slate-800' : 'w-full h-full flex-1'}`}>

        {/* ANIMATIONS */}
        <GoalAnimation show={scoringAnim === 'home'} color={homeColor} term={config.scoreTerm} type={animType} />
        <GoalAnimation show={scoringAnim === 'away'} color={awayColor} term={config.scoreTerm} type={animType} />

        {/* GRILLE */}
        <div className="flex-1 w-full relative grid grid-cols-[1fr_minmax(140px,28%)_1fr]">

          {/* === HOME === */}
          <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden">

            {/* LOGO (40% - LOCKED - ABSOLUTE IMAGE) */}
            <div className="w-full flex-none h-[40%] flex flex-col overflow-hidden relative" style={{ flex: 'none' }}>
              <div className="h-1 w-full shrink-0 absolute top-0 left-0 z-10" style={{ backgroundColor: homeColor }}></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {useHomeLogo && homeLogo ? (
                  <img src={homeLogo} alt="Home Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                ) : (
                  <h2 className="text-xl md:text-5xl font-black uppercase truncate tracking-tighter text-center w-full leading-snug px-2" style={{ color: homeColor }}>{homeName}</h2>
                )}
              </div>
            </div>

            {/* SCORE (40% - LOCKED) */}
            <GestureArea className="w-full flex-none h-[40%] flex flex-col items-center justify-center relative group p-0 overflow-hidden" style={{ flex: 'none' }} onTap={() => modifyScore('home', 1)} onSwipeRight={() => modifyScore('home', -1)}>
              {!tvMode && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/5 group-hover:text-white/20 transition-colors"><ChevronRight size={40} /></div>}
              <span className="font-bold leading-none select-none tabular-nums relative z-10" style={{ fontSize: 'clamp(4rem, 18vw, 15rem)', textShadow: `0 0 50px ${homeColor}30` }}>{homeScore}</span>
            </GestureArea>

            {/* STATS (20% - LOCKED - ALIGN TOP & SIDE BY SIDE) */}
            <div className="w-full flex-none h-[20%] grid grid-cols-1 bg-slate-900/20 overflow-hidden" style={{ flex: 'none' }}>
              {config.showSets && (
                <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t border-slate-800/50 group relative pt-2 md:pt-4" onTap={() => modifySets('home', 1)} onSwipeRight={() => modifySets('home', -1)}>
                  <div className="flex flex-row items-center justify-center h-full w-full gap-2">
                    <span className="text-xs md:text-lg font-bold uppercase text-slate-500 tracking-wider">Sets</span>
                    <div className="text-2xl md:text-5xl font-bold leading-none tabular-nums">{homeSets}</div>
                  </div>
                </GestureArea>
              )}
              {config.showFouls && (
                <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t border-slate-800/50 group relative transition-colors pt-2 md:pt-4" onTap={() => modifyFouls('home', 1)} onSwipeRight={() => modifyFouls('home', -1)}>
                  <div className="flex flex-row items-center justify-center h-full w-full gap-2">
                    <span className={`text-xs md:text-base font-bold uppercase tracking-wider flex items-center gap-1 ${homeFouls >= config.foulLimit ? 'text-red-200' : 'text-slate-500'}`}>Fautes {homeFouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}</span>
                    <div className={`text-2xl md:text-5xl font-bold leading-none tabular-nums ${homeFouls >= config.foulLimit ? 'text-red-500' : 'text-white'}`}>{homeFouls}</div>
                  </div>
                </GestureArea>
              )}
            </div>
          </div>

          {/* === CENTRE === */}
          <div className="h-full flex flex-col justify-center items-center relative z-10 bg-slate-950 border-x border-slate-900">
            {/* PERIODE */}
            <GestureArea className="mb-1 md:mb-2 text-center w-full py-1 md:py-2 hover:bg-slate-900/50 rounded-xl group relative" onTap={() => modifyPeriod(1)} onSwipeRight={() => modifyPeriod(-1)}>
              <span className="block text-slate-500 text-[10px] md:text-sm uppercase font-bold tracking-[0.2em] mb-0.5">{config.periodName}</span>
              <div className="flex items-center justify-center gap-4"><span className="text-4xl md:text-7xl font-bold text-white select-none">{period}</span></div>
            </GestureArea>
            {/* TIMER */}
            {sport === 'volleyball' ? (
              <GestureArea className="w-full px-2 py-2 flex flex-col items-center justify-center cursor-ew-resize" onSwipeLeft={() => setService('home')} onSwipeRight={() => setService('away')} onTap={toggleService}>
                <div className={`w-full py-2 md:py-6 rounded-3xl border-4 shadow-2xl bg-black text-center flex flex-col items-center gap-1 md:gap-4 transition-colors duration-500 ${serviceSide === 'home' ? 'border-l-8' : 'border-r-8'}`} style={{ borderColor: serviceSide === 'home' ? homeColor : awayColor }}>
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] md:text-sm">Service</span>
                  <div className="transform transition-transform duration-300 scale-110">
                    {serviceSide === 'home' ? <ArrowLeft size={tvMode ? 50 : 40} strokeWidth={3} style={{ color: homeColor }} className="animate-pulse-slow" /> : <ArrowRight size={tvMode ? 50 : 40} strokeWidth={3} style={{ color: awayColor }} className="animate-pulse-slow" />}
                  </div>
                </div>
              </GestureArea>
            ) : (
              <GestureArea className="w-full px-1 md:px-2 py-1 md:py-2" isTimer={true} onTap={toggleTimer}>
                <div className={`bg-black rounded-3xl border-2 md:border-4 shadow-2xl py-2 md:py-8 text-center relative overflow-hidden transition-all duration-75 ${isRunning ? 'border-green-600 shadow-green-900/40' : 'border-red-900/50 shadow-red-900/20'} ${config.countDirection === 'none' ? 'opacity-20 grayscale border-slate-800' : ''}`}>
                  <span className={`font-mono font-bold tabular-nums leading-none transition-colors ${isRunning ? 'text-green-400' : 'text-red-500'}`} style={{ fontSize: 'clamp(3rem, 8vw, 8rem)' }}>{formatTime(timeLeft)}</span>
                  {!isRunning && config.countDirection !== 'none' && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><div className="bg-red-600/20 p-3 rounded-full backdrop-blur-sm animate-pulse"><Play size={40} className="text-white fill-white" /></div></div>}
                </div>
              </GestureArea>
            )}
            {/* BOUTONS CONTROLE */}
            {!tvMode && sport !== 'volleyball' && config.countDirection !== 'none' && (
              <div className="mt-1 md:mt-2 flex flex-col gap-2 w-full px-4">
                <div className="grid grid-cols-4 gap-1 w-full">
                  <button onClick={() => setTimeLeft(t => Math.max(0, t - 60))} className="px-1 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-bold border border-slate-700">-1m</button>
                  <button onClick={() => setTimeLeft(t => Math.max(0, t - 1))} className="px-1 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-bold border border-slate-700">-1s</button>
                  <button onClick={() => setTimeLeft(t => t + 1)} className="px-1 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-bold border border-slate-700">+1s</button>
                  <button onClick={() => setTimeLeft(t => t + 60)} className="px-1 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-bold border border-slate-700">+1m</button>
                </div>
              </div>
            )}
            {!tvMode && (
              <div className="mt-1 md:mt-2 w-full px-6"><button onClick={resetGame} className="flex items-center justify-center gap-2 py-2 md:py-3 w-full rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-red-900/20 transition-colors"><RotateCcw size={16} /> <span className="text-xs font-bold uppercase">Reset</span></button></div>
            )}
          </div>

          {/* === VISITEUR (DROITE) === */}
          <div className="h-full flex flex-col bg-gradient-to-bl from-slate-900 to-slate-950 relative overflow-hidden">
            {/* LOGO (40% - LOCKED - ABSOLUTE IMAGE) */}
            <div className="w-full flex-none h-[40%] flex flex-col overflow-hidden relative" style={{ flex: 'none' }}>
              <div className="h-1 w-full shrink-0 absolute top-0 left-0 z-10" style={{ backgroundColor: awayColor }}></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {useAwayLogo && awayLogo ? (
                  <img src={awayLogo} alt="Away Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                ) : (
                  <h2 className="text-xl md:text-5xl font-black uppercase truncate tracking-tighter text-center w-full leading-snug px-2" style={{ color: awayColor }}>{awayName}</h2>
                )}
              </div>
            </div>
            {/* SCORE (40% - LOCKED) */}
            <GestureArea className="w-full flex-none h-[40%] flex flex-col items-center justify-center relative group p-0 overflow-hidden" style={{ flex: 'none' }} onTap={() => modifyScore('away', 1)} onSwipeRight={() => modifyScore('away', -1)}>
              {!tvMode && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/5 group-hover:text-white/20 transition-colors"><ChevronRight size={40} /></div>}
              <span className="font-bold leading-none select-none tabular-nums relative z-10" style={{ fontSize: 'clamp(4rem, 18vw, 15rem)', textShadow: `0 0 50px ${awayColor}30` }}>{awayScore}</span>
            </GestureArea>
            {/* STATS (20% - LOCKED - ALIGN TOP & SIDE BY SIDE) */}
            <div className="w-full flex-none h-[20%] grid grid-cols-1 bg-slate-900/20 overflow-hidden" style={{ flex: 'none' }}>
              {config.showSets && (
                <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t border-slate-800/50 group relative pt-2 md:pt-4" onTap={() => modifySets('away', 1)} onSwipeRight={() => modifySets('away', -1)}>
                  <div className="flex flex-row items-center justify-center h-full w-full gap-2"><span className="text-xs md:text-lg font-bold uppercase text-slate-500 tracking-wider">Sets</span><div className="text-2xl md:text-5xl font-bold leading-none tabular-nums">{awaySets}</div></div>
                </GestureArea>
              )}
              {config.showFouls && (
                <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t border-slate-800/50 group relative transition-colors pt-2 md:pt-4" onTap={() => modifyFouls('away', 1)} onSwipeRight={() => modifyFouls('away', -1)}>
                  <div className="flex flex-row items-center justify-center h-full w-full gap-2">
                    <span className={`text-xs md:text-base font-bold uppercase tracking-wider flex items-center gap-1 ${awayFouls >= config.foulLimit ? 'text-red-200' : 'text-slate-500'}`}>Fautes {awayFouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}</span>
                    <div className={`text-2xl md:text-5xl font-bold leading-none tabular-nums ${awayFouls >= config.foulLimit ? 'text-red-500' : 'text-white'}`}>{awayFouls}</div>
                  </div>
                </GestureArea>
              )}
            </div>
          </div>
        </div>

      </div>

      {!tvMode && (
        <div className="bg-slate-900 py-2 px-4 border-t border-slate-800 flex justify-center items-center gap-6 text-[10px] md:text-sm text-slate-400 w-full shrink-0">
          <div className="flex items-center gap-2"><span className="font-bold text-slate-300">SCORES/FAUTES/SETS :</span><span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">Tap/Clic <MousePointerClick size={14} /> +1</span><span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">Slide <ChevronRight size={14} /> -1</span></div>
          <div className="w-px h-4 bg-slate-700"></div>
          <div className="flex items-center gap-2"><span className="font-bold text-slate-300">ACTION :</span><span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">Tap Court (Volley)</span></div>
        </div>
      )}
    </div>
  );
};

export default App;