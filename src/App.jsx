// Version: Scoreboard 5.0 (Golden Master)
// Release: Production Stable
// Docs: Architecture "Hard Lock 40/40/20" préservée.
// Features: Multi-sport, Advanced Rules (Extra Time, Shootout), Split Layouts, Touch Gestures.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Monitor, Smartphone, Trophy, Minimize, Maximize, ChevronLeft, ChevronRight, AlertCircle, Upload, Type, Image as ImageIcon, ArrowLeft, ArrowRight, Plus, Minus, MousePointerClick, Volume2, Sparkles, Download, Wifi, WifiOff, Share, Palette, Sun, Moon, Keyboard, Megaphone, X, ArrowUp, Clock, Trash2, RefreshCcw, Timer as TimerIcon, CheckCircle2, UserX, PauseCircle, Flag, Target, Gavel, Shield, ShieldAlert, ArrowLeftRight } from 'lucide-react';

// --- CONFIGURATION SPORTS (Defaults) ---
const SPORTS_CONFIG = {
  football: { name: "Football", periodName: "MT", periods: 2, timePerPeriod: 45, extraTime: 0, hasShootout: false, shootoutCount: 5, countDirection: "up", showSets: false, showFouls: false, foulLimit: 0, showTimeouts: false, maxTimeouts: 3, scoreTerm: "BUT", exclusionTime: 0, showShotClock: false, showSetHistory: false },
  basketball: { name: "Basketball", periodName: "Q-Temps", periods: 4, timePerPeriod: 10, extraTime: 0, hasShootout: false, shootoutCount: 5, countDirection: "down", showSets: false, showFouls: false, foulLimit: 5, foulLabel: "Fautes d'équipe", showTimeouts: false, maxTimeouts: 3, scoreTerm: "PANIER", exclusionTime: 0, showShotClock: false, shotClockDuration: 24, showSetHistory: false },
  volleyball: { name: "Volleyball", periodName: "Set", periods: 5, timePerPeriod: 0, extraTime: 0, hasShootout: false, shootoutCount: 0, countDirection: "none", showSets: true, showFouls: false, foulLimit: 0, showTimeouts: false, maxTimeouts: 2, showService: true, scoreTerm: "POINT", exclusionTime: 0, showShotClock: false, showSetHistory: true },
  futsal: { name: "Futsal", periodName: "MT", periods: 2, timePerPeriod: 20, extraTime: 0, hasShootout: false, shootoutCount: 5, countDirection: "down", showSets: false, showFouls: false, foulLimit: 5, showTimeouts: false, maxTimeouts: 1, scoreTerm: "BUT", exclusionTime: 120, showShotClock: false, showSetHistory: false, foulLabel: "Fautes C." },
  handball: { name: "Handball", periodName: "MT", periods: 2, timePerPeriod: 30, extraTime: 0, hasShootout: false, shootoutCount: 5, countDirection: "down", showSets: false, showFouls: false, foulLimit: 0, showTimeouts: false, maxTimeouts: 3, scoreTerm: "BUT", exclusionTime: 120, showShotClock: false, showSetHistory: false, foulLabel: "Exclusions" }
};

const FONTS = [
  { id: 'standard', name: 'Standard', family: "'Inter', sans-serif" },
  { id: 'digital', name: 'Digital', family: "'Share Tech Mono', monospace" },
  { id: 'tv', name: 'TV (Condensed)', family: "'Barlow Condensed', sans-serif" },
  { id: 'bold', name: 'Bold', family: "'Russo One', sans-serif" }
];

const PRESET_COLORS = [
  { name: 'Noir', bg: '#000000', text: '#ffffff' },
  { name: 'Bleu', bg: '#0f172a', text: '#ffffff' },
  { name: 'Blanc', bg: '#ffffff', text: '#000000' },
];

/* --- UTILS --- */
const resizeImage = (file, maxWidth, maxHeight, quality = 0.95) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
    };
  });
};

const playGameSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.5, now);

  if (type === 'buzzer_fiba') {
    const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(320, now);
    osc.connect(masterGain); masterGain.gain.setValueAtTime(0.6, now);
    masterGain.gain.linearRampToValueAtTime(0.6, now + 1.5); masterGain.gain.linearRampToValueAtTime(0, now + 2.0);
    osc.start(now); osc.stop(now + 2.0);
  }
};

/* --- COMPONENTS --- */
const AnimationStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Inter:wght@400;700;900&family=Russo+One&family=Share+Tech+Mono&display=swap');
    @keyframes anim-zoom { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes anim-flash { 0%, 50%, 100% { opacity: 1; filter: brightness(2); } 25%, 75% { opacity: 0; } }
    .animate-custom-zoom { animation: anim-zoom 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
    .animate-custom-flash { animation: anim-flash 0.5s linear both; }
    @keyframes ticker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
    .animate-ticker { display: inline-block; white-space: nowrap; animation: ticker 30s linear infinite; }
    .safe-pb { padding-bottom: env(safe-area-inset-bottom, 20px); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

const MediaOverlay = ({ active, type, content, images, duration, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  useEffect(() => { if (active) setCurrentImageIndex(0); }, [active]);
  useEffect(() => {
    let interval;
    if (active && type === 'slideshow' && images && images.length > 1) {
      interval = setInterval(() => { setCurrentImageIndex((prev) => (prev + 1) % images.length); }, (duration || 5) * 1000);
    }
    return () => clearInterval(interval);
  }, [active, type, images, duration]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      onDoubleClick={onClose} onClick={(e) => { if (type === 'slideshow' && images && images.length > 1) setCurrentImageIndex((prev) => (prev + 1) % images.length); }}>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 z-[101] bg-black/50 hover:bg-white text-white hover:text-black p-2 rounded-full backdrop-blur-md transition-colors border border-white/10" title="Fermer"><X size={24} /></button>
      {type === 'text' && (<div className="w-full bg-zinc-900/95 backdrop-blur-xl py-12 overflow-hidden relative border-y border-white/20 shadow-2xl flex items-center"><div className="whitespace-nowrap text-white font-bold text-6xl md:text-8xl uppercase tracking-wider animate-ticker w-full text-center" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{content || "MESSAGE DÉFILANT"}</div></div>)}
      {(type === 'image' || type === 'slideshow') && images && images.length > 0 ? (
        <div className="w-full h-full relative flex items-center justify-center bg-black">
          <img key={currentImageIndex} src={images[currentImageIndex]?.src || images[currentImageIndex]} alt="Media" className="w-full h-full object-contain animate-in fade-in duration-700" />
          {type === 'slideshow' && images.length > 1 && (<div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-zinc-900/80 px-4 py-2 rounded-full backdrop-blur-md safe-pb border border-white/10">{images.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/20'}`}></div>))}</div>)}
        </div>
      ) : (type !== 'text' && (<div className="text-zinc-500 flex flex-col items-center gap-4"><ImageIcon size={64} className="opacity-50" /><p className="text-sm font-medium">Aucun média chargé</p></div>))}
    </div>
  );
};

// --- GESTURE AREA ---
const GestureArea = ({ children, onTap, onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp, onLongPress, className, style, disabled = false, isTimer = false }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    if (onLongPress) {
      e.currentTarget._longPressTimer = setTimeout(() => {
        if (touchStartX.current) {
          if (navigator.vibrate) try { navigator.vibrate(50); } catch (e) { }
          onLongPress();
          touchStartX.current = null;
        }
      }, 600);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.currentTarget._longPressTimer) clearTimeout(e.currentTarget._longPressTimer);
    if (disabled || !touchStartX.current) return;

    if (e.cancelable) e.preventDefault();

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    const minSwipeDist = 30;
    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    if (absX > minSwipeDist) {
      if (diffX < 0 && onSwipeLeft) onSwipeLeft();
      else if (diffX > 0 && onSwipeRight) onSwipeRight();
    }
    else if (absY > minSwipeDist) {
      if (diffY < 0 && onSwipeUp) onSwipeUp();
      else if (diffY > 0 && onSwipeDown) onSwipeDown();
    }
    else {
      if (onTap) onTap();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    if (onLongPress) {
      e.currentTarget._longPressTimer = setTimeout(() => {
        if (touchStartX.current) {
          onLongPress();
          touchStartX.current = null;
        }
      }, 600);
    }
  };

  const handleMouseUp = (e) => {
    if (e.currentTarget._longPressTimer) clearTimeout(e.currentTarget._longPressTimer);
    if (disabled || !touchStartX.current) return;
    const diffX = e.clientX - touchStartX.current;
    if (Math.abs(diffX) > 30) {
      if (diffX < 0 && onSwipeLeft) onSwipeLeft();
      else if (diffX > 0 && onSwipeRight) onSwipeRight();
    } else if (onTap) onTap();
    touchStartX.current = null;
  };

  const cursorStyle = isTimer ? 'cursor-pointer' : 'cursor-ew-resize';
  return (
    <div
      className={`${className} ${cursorStyle} touch-none select-none active:scale-[0.98] transition-transform duration-75`}
      style={{ ...style, touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {children}
    </div>
  );
};

const GoalAnimation = ({ show, color, term, type = 'zoom' }) => {
  if (!show) return null;
  let animClass = "animate-custom-zoom";
  let containerClass = "bg-black/20 backdrop-blur-sm";
  let textStyle = { textShadow: `0 0 50px ${color}` };
  if (type === 'flash') { animClass = "animate-custom-flash"; containerClass = "bg-white/80 mix-blend-overlay"; textStyle = { color: color, textShadow: 'none', filter: 'brightness(1.5)' }; }
  return (<div className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-hidden animate-in fade-in duration-200`}> <div className={`absolute inset-0 ${containerClass} transition-all duration-300`}></div> <h1 className={`text-[15vw] font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] z-50 tracking-tighter ${animClass}`} style={textStyle}>{term} !</h1> </div>);
};

/* --- MAIN APP --- */
const App = () => {
  // CORE STATE
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

  // EXTRA TIME & SHOOTOUT STATE
  const [gamePhase, setGamePhase] = useState('regulation');
  const [penalties, setPenalties] = useState({ home: [], away: [] });

  // TIME & GAME STATE
  const [timeLeft, setTimeLeft] = useState(20 * 60 * 10);
  const [isRunning, setIsRunning] = useState(false);
  const [serviceSide, setServiceSide] = useState('home');
  const [shotClock, setShotClock] = useState(240);
  const [possession, setPossession] = useState('home');
  const [setHistory, setSetHistory] = useState([]);
  const [homeExclusions, setHomeExclusions] = useState([]);
  const [awayExclusions, setAwayExclusions] = useState([]);
  const [homeTimeouts, setHomeTimeouts] = useState(0);
  const [awayTimeouts, setAwayTimeouts] = useState(0);
  const [isSwapped, setIsSwapped] = useState(false);

  // UI STATE
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [timerSecurity, setTimerSecurity] = useState(true);
  const [tvMode, setTvMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [animEnabled, setAnimEnabled] = useState(false);
  const [scoringAnim, setScoringAnim] = useState(null);
  const [mediaActive, setMediaActive] = useState(false);
  const [mediaType, setMediaType] = useState('text');
  const [mediaText, setMediaText] = useState("MESSAGE DÉFILANT");
  const [mediaImages, setMediaImages] = useState([]);
  const [slideDuration, setSlideDuration] = useState(5);
  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontStyle, setFontStyle] = useState('standard');

  // Effects
  useEffect(() => { document.documentElement.style.backgroundColor = bgColor; document.body.style.backgroundColor = bgColor; }, [bgColor]);

  const toggleTvMode = async (enable) => {
    setTvMode(enable);
    if (enable) { try { if (document.documentElement.requestFullscreen && !document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch (err) { } }
    else { try { if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen(); } catch (err) { } }
  };

  // PERSISTENCE
  useEffect(() => {
    const savedData = localStorage.getItem('scoreboard_v4_save');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.sport && SPORTS_CONFIG[parsed.sport]) { setSport(parsed.sport); setConfig(parsed.config || SPORTS_CONFIG[parsed.sport]); }
        setHomeScore(parsed.homeScore || 0); setAwayScore(parsed.awayScore || 0); setHomeSets(parsed.homeSets || 0); setAwaySets(parsed.awaySets || 0);
        setHomeFouls(parsed.homeFouls || 0); setAwayFouls(parsed.awayFouls || 0); setPeriod(parsed.period || 1);
        setHomeName(parsed.homeName || "DOMICILE"); setAwayName(parsed.awayName || "VISITEUR");
        setHomeColor(parsed.homeColor || "#ef4444"); setAwayColor(parsed.awayColor || "#3b82f6");
        setHomeLogo(parsed.homeLogo || null); setAwayLogo(parsed.awayLogo || null);
        setUseHomeLogo(parsed.useHomeLogo || false); setUseAwayLogo(parsed.useAwayLogo || false);
        let t = parsed.timeLeft; if (t !== undefined && t < 10000 && parsed.config?.timePerPeriod > 5) t = t * 10;
        setTimeLeft(t !== undefined ? t : 20 * 60 * 10);
        setServiceSide(parsed.serviceSide || 'home'); setBgColor(parsed.bgColor || '#000000'); setTextColor(parsed.textColor || '#ffffff');
        setFontStyle(parsed.fontStyle || 'standard'); setSoundEnabled(parsed.soundEnabled ?? false); setAnimEnabled(parsed.animEnabled ?? false);
        setMediaText(parsed.mediaText || "MESSAGE PAR DÉFAUT");
        let loadedImages = parsed.mediaImages || []; if (loadedImages.length > 0 && typeof loadedImages[0] === 'string') { loadedImages = loadedImages.map((src, i) => ({ id: i, src, duration: 5 })); }
        setMediaImages(loadedImages); setSlideDuration(parsed.slideDuration || 5);
        setSetHistory(parsed.setHistory || []); setIsSwapped(parsed.isSwapped || false);
        setHomeExclusions(parsed.homeExclusions || []); setAwayExclusions(parsed.awayExclusions || []);
        setHomeTimeouts(parsed.homeTimeouts || 0); setAwayTimeouts(parsed.awayTimeouts || 0);
        setGamePhase(parsed.gamePhase || 'regulation');
        // Init penalties based on config if empty or load from save
        const savedPenalties = parsed.penalties || { home: [], away: [] };
        // Ensure size matches config
        const targetSize = parsed.config?.shootoutCount || 5;
        if (savedPenalties.home.length !== targetSize) {
          savedPenalties.home = Array(targetSize).fill(0).map((_, i) => savedPenalties.home[i] || 0);
          savedPenalties.away = Array(targetSize).fill(0).map((_, i) => savedPenalties.away[i] || 0);
        }
        setPenalties(savedPenalties);
        setTimerSecurity(parsed.timerSecurity !== undefined ? parsed.timerSecurity : true);
      } catch (e) { console.warn("Save corrupted", e); }
    } else {
      // Init default penalties
      setPenalties({
        home: Array(SPORTS_CONFIG['futsal'].shootoutCount).fill(0),
        away: Array(SPORTS_CONFIG['futsal'].shootoutCount).fill(0)
      });
    }
  }, []);

  useEffect(() => {
    const dataToSave = { sport, config, homeScore, awayScore, homeSets, awaySets, homeFouls, awayFouls, period, homeName, awayName, homeColor, awayColor, homeLogo, awayLogo, useHomeLogo, useAwayLogo, timeLeft, serviceSide, bgColor, textColor, fontStyle, soundEnabled, animEnabled, mediaText, mediaImages, slideDuration, setHistory, isSwapped, homeExclusions, awayExclusions, homeTimeouts, awayTimeouts, gamePhase, penalties, timerSecurity };
    try { localStorage.setItem('scoreboard_v4_save', JSON.stringify(dataToSave)); }
    catch (e) { const { mediaImages, ...safeData } = dataToSave; localStorage.setItem('scoreboard_v4_save', JSON.stringify(safeData)); }
  }, [sport, config, homeScore, awayScore, homeSets, awaySets, homeFouls, awayFouls, period, homeName, awayName, homeColor, awayColor, homeLogo, awayLogo, useHomeLogo, useAwayLogo, timeLeft, serviceSide, bgColor, textColor, fontStyle, soundEnabled, animEnabled, mediaText, mediaImages, slideDuration, setHistory, isSwapped, homeExclusions, awayExclusions, homeTimeouts, awayTimeouts, gamePhase, penalties, timerSecurity]);

  // Derived Data (Correctly using penalties state)
  const homeData = { name: homeName, score: homeScore, sets: homeSets, fouls: homeFouls, color: homeColor, logo: homeLogo, useLogo: useHomeLogo, exclusions: homeExclusions, timeouts: homeTimeouts, key: 'home', penalties: penalties.home };
  const awayData = { name: awayName, score: awayScore, sets: awaySets, fouls: awayFouls, color: awayColor, logo: awayLogo, useLogo: useAwayLogo, exclusions: awayExclusions, timeouts: awayTimeouts, key: 'away', penalties: penalties.away };
  const left = isSwapped ? awayData : homeData;
  const right = isSwapped ? homeData : awayData;

  // TIMER LOGIC
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (config.countDirection === 'down') { if (prev <= 0) { setIsRunning(false); if (soundEnabled) playGameSound('buzzer_fiba'); return 0; } return prev - 1; }
          else if (config.countDirection === 'up') return prev + 1; return prev;
        });
        if (config.showShotClock) { setShotClock((prev) => { if (prev <= 0) return 0; return prev - 1; }); }
        setHomeExclusions(prev => prev.map(ex => ({ ...ex, time: ex.time - 1 })).filter(ex => ex.time > 0));
        setAwayExclusions(prev => prev.map(ex => ({ ...ex, time: ex.time - 1 })).filter(ex => ex.time > 0));
      }, 100);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, config.countDirection, soundEnabled, config.showShotClock]);

  useEffect(() => {
    const newConfig = SPORTS_CONFIG[sport];
    setConfig(newConfig);
    // Reset penalties when sport changes
    setPenalties({
      home: Array(newConfig.shootoutCount || 5).fill(0),
      away: Array(newConfig.shootoutCount || 5).fill(0)
    });
  }, [sport]);

  // SETTINGS HANDLERS
  const updateRegulationTime = (delta) => {
    const newTime = Math.max(1, config.timePerPeriod + delta);
    setConfig(prev => ({ ...prev, timePerPeriod: newTime }));
    if (!isRunning && gamePhase === 'regulation' && config.countDirection === 'down') {
      setTimeLeft(newTime * 60 * 10);
    }
  };

  const updatePeriodCount = (delta) => {
    const newCount = Math.max(1, config.periods + delta);
    setConfig(prev => ({ ...prev, periods: newCount }));
  };

  const updateExtraTimeDuration = (delta) => {
    const newTime = Math.max(1, config.extraTime + delta);
    setConfig(prev => ({ ...prev, extraTime: newTime }));
  };

  const updateShootoutCount = (delta) => {
    const newCount = Math.max(1, (config.shootoutCount || 5) + delta);
    setConfig(prev => ({ ...prev, shootoutCount: newCount }));
    // Adjust penalties array
    setPenalties(prev => {
      const adjustArray = (arr) => {
        if (arr.length < newCount) {
          return [...arr, ...Array(newCount - arr.length).fill(0)];
        } else {
          return arr.slice(0, newCount);
        }
      };
      return {
        home: adjustArray(prev.home),
        away: adjustArray(prev.away)
      };
    });
  };

  const updateMaxTimeouts = (delta) => {
    const newCount = Math.max(0, config.maxTimeouts + delta);
    setConfig(prev => ({ ...prev, maxTimeouts: newCount }));
  };

  const updateFoulLimit = (delta) => {
    const newCount = Math.max(0, config.foulLimit + delta);
    setConfig(prev => ({ ...prev, foulLimit: newCount }));
  };

  // TOGGLES
  const toggleExtraTimeEnabled = () => { const newVal = config.extraTime > 0 ? 0 : 5; setConfig(prev => ({ ...prev, extraTime: newVal })); };
  const toggleShootoutEnabled = () => { setConfig(prev => ({ ...prev, hasShootout: !prev.hasShootout })); };
  const toggleTimeoutsEnabled = () => { const newVal = !config.showTimeouts; setConfig(prev => ({ ...prev, showTimeouts: newVal })); };
  const toggleFoulsEnabled = () => { const newVal = !config.showFouls; setConfig(prev => ({ ...prev, showFouls: newVal })); };
  const toggleServiceEnabled = () => { setConfig(prev => ({ ...prev, showService: !prev.showService })); };
  const toggleShotClockEnabled = () => { setConfig(prev => ({ ...prev, showShotClock: !prev.showShotClock })); };

  // GAME ACTIONS
  const manualReset = () => {
    const defaultConfig = SPORTS_CONFIG[sport];
    const currentConfig = { ...config, countDirection: defaultConfig.countDirection };
    setConfig(currentConfig);
    setHomeScore(0); setAwayScore(0); setHomeSets(0); setAwaySets(0); setHomeFouls(0); setAwayFouls(0); setPeriod(1);
    setSetHistory([]); setTimeLeft(currentConfig.countDirection === 'down' ? currentConfig.timePerPeriod * 60 * 10 : 0);
    setServiceSide('home'); setShotClock(currentConfig.shotClockDuration || 240); setHomeExclusions([]); setAwayExclusions([]); setHomeTimeouts(0); setAwayTimeouts(0);
    setGamePhase('regulation');
    setPenalties({ home: Array(currentConfig.shootoutCount || 5).fill(0), away: Array(currentConfig.shootoutCount || 5).fill(0) });
  };

  const handleTimerResetRequest = () => {
    if (timerSecurity) { setIsRunning(false); setShowResetModal(true); } else { resetTimerInstant(); }
  };

  const resetTimerInstant = () => {
    setIsRunning(false);
    const duration = (gamePhase === 'extra_time' && config.extraTime > 0) ? config.extraTime : config.timePerPeriod;
    setTimeLeft(config.countDirection === 'down' ? duration * 60 * 10 : 0);
    setShowResetModal(false);
  };

  const confirmResetTimer = () => { resetTimerInstant(); };

  const startExtraTime = () => {
    if (confirm('Lancer la prolongation ?')) {
      setIsRunning(false); setGamePhase('extra_time');
      const etTime = (config.extraTime || 5) * 60 * 10;
      setTimeLeft(config.countDirection === 'down' ? etTime : 0);
      setPeriod(1); setShowSettings(false);
    }
  };

  const startShootout = () => {
    if (confirm('Passer aux Tirs au But ?')) {
      setIsRunning(false); setGamePhase('shootout'); setShowSettings(false);
    }
  };

  const togglePenalty = (teamKey, index) => {
    if (gamePhase !== 'shootout') return;
    const newPenalties = { ...penalties };
    const current = newPenalties[teamKey][index];
    newPenalties[teamKey][index] = (current + 1) % 3;
    setPenalties(newPenalties);
  };

  const modifyPeriod = (delta) => {
    if (delta > 0) {
      if (gamePhase === 'regulation') {
        if (period < config.periods) {
          setPeriod(p => p + 1); setIsSwapped(prev => !prev); setIsRunning(false);
          const duration = config.timePerPeriod * 60 * 10; setTimeLeft(config.countDirection === 'down' ? duration : 0);
        } else if (config.extraTime > 0) {
          setGamePhase('extra_time'); setPeriod(1); setIsSwapped(prev => !prev); setIsRunning(false);
          const duration = config.extraTime * 60 * 10; setTimeLeft(config.countDirection === 'down' ? duration : 0);
        }
      } else if (gamePhase === 'extra_time') {
        if (period < 2) {
          setPeriod(p => p + 1); setIsSwapped(prev => !prev); setIsRunning(false);
          const duration = config.extraTime * 60 * 10; setTimeLeft(config.countDirection === 'down' ? duration : 0);
        } else if (config.hasShootout) { setGamePhase('shootout'); setIsRunning(false); }
      }
    } else {
      if (period > 1) {
        setPeriod(p => p - 1); setIsSwapped(prev => !prev);
      } else {
        if (gamePhase === 'extra_time') {
          setGamePhase('regulation'); setPeriod(config.periods); setIsSwapped(prev => !prev);
          const duration = config.timePerPeriod * 60 * 10; setTimeLeft(config.countDirection === 'down' ? 0 : duration); setIsRunning(false);
        } else if (gamePhase === 'shootout') {
          if (config.extraTime > 0) {
            setGamePhase('extra_time'); setPeriod(2); const duration = config.extraTime * 60 * 10;
            setTimeLeft(config.countDirection === 'down' ? 0 : duration); setIsRunning(false);
          } else {
            setGamePhase('regulation'); setPeriod(config.periods);
          }
        }
      }
    }
  };

  const modifySets = (team, delta) => {
    if (sport === 'volleyball') {
      if (delta > 0) {
        setSetHistory(prev => [...prev, { home: homeScore, away: awayScore }]);
        setHomeScore(0); setAwayScore(0); setPeriod(p => p + 1); setIsSwapped(prev => !prev);
        if (team === 'home') setHomeSets(s => s + 1); else setAwaySets(s => s + 1);
        setHomeTimeouts(0); setAwayTimeouts(0);
      } else { if (team === 'home') setHomeSets(s => Math.max(0, s - 1)); else setAwaySets(s => Math.max(0, s - 1)); }
    } else { if (team === 'home') setHomeSets(Math.max(0, homeSets + delta)); else setAwaySets(Math.max(0, awaySets + delta)); }
  };

  const formatShotClock = (tenths) => { const s = Math.floor(tenths / 10); const t = tenths % 10; return `${s}.${t}`; };
  const formatTime = (tenths) => { const totalSeconds = Math.floor(tenths / 10); const m = Math.floor(totalSeconds / 60); const s = totalSeconds % 60; const t = tenths % 10; if (totalSeconds < 60) return `${s.toString().padStart(2, '0')}.${t}`; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };
  const formatExclusion = (tenths) => { const totalSeconds = Math.floor(tenths / 10); const m = Math.floor(totalSeconds / 60); const s = totalSeconds % 60; const t = tenths % 10; if (totalSeconds < 60) return `${s.toString().padStart(2, '0')}.${t}`; return `${m.toString().padStart(2, '0')}`; };

  const addExclusion = (teamKey) => { if (config.exclusionTime > 0) { const newEx = { id: Date.now(), time: config.exclusionTime * 10 }; if (teamKey === 'home') setHomeExclusions(prev => [...prev, newEx]); else setAwayExclusions(prev => [...prev, newEx]); } };
  const removeExclusion = (teamKey, id) => { if (teamKey === 'home') setHomeExclusions(prev => prev.filter(ex => ex.id !== id)); else setAwayExclusions(prev => prev.filter(ex => ex.id !== id)); };

  const useTimeout = (teamKey) => {
    if (!config.showTimeouts || config.maxTimeouts <= 0) return;
    if (teamKey === 'home') { setHomeTimeouts(prev => (prev < config.maxTimeouts ? prev + 1 : 0)); if (homeTimeouts < config.maxTimeouts && soundEnabled) playGameSound('buzzer_fiba'); }
    else { setAwayTimeouts(prev => (prev < config.maxTimeouts ? prev + 1 : 0)); if (awayTimeouts < config.maxTimeouts && soundEnabled) playGameSound('buzzer_fiba'); }
  };

  const handleLogoUpload = (e, team) => { const file = e.target.files[0]; if (file) { resizeImage(file, 1024, 1024).then(resized => { if (team === 'home') setHomeLogo(resized); else setAwayLogo(resized); }); } };
  const handleMediaUpload = (e) => { const files = Array.from(e.target.files); if (files.length === 0) return; const promises = files.map(file => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ id: Date.now() + Math.random(), src: reader.result, duration: 5 }); reader.readAsDataURL(file); })); Promise.all(promises).then(imgs => setMediaImages(prev => [...prev, ...imgs])); };
  const removeImage = (id) => { setMediaImages(prev => prev.filter(img => img.id !== id)); };

  const triggerAnim = (team) => { if (!animEnabled) return; setScoringAnim(team); setTimeout(() => setScoringAnim(null), 2000); };
  const modifyScore = (team, delta) => { if (team === 'home') { setHomeScore(Math.max(0, homeScore + delta)); if (delta > 0) triggerAnim('home'); } else { setAwayScore(Math.max(0, awayScore + delta)); if (delta > 0) triggerAnim('away'); } };
  const modifyFouls = (team, delta) => { if (team === 'home') setHomeFouls(Math.max(0, homeFouls + delta)); else setAwayFouls(Math.max(0, awayFouls + delta)); };
  const toggleTimer = () => { if (config.countDirection !== 'none') setIsRunning(prev => !prev); };
  const setService = (side) => setServiceSide(side);
  const toggleService = () => setServiceSide(prev => prev === 'home' ? 'away' : 'home');

  // UPDATED SHOT CLOCK HANDLER
  const handleShotClockTap = (isDoubleTap) => {
    // Tap (Reset to Config Duration), Double Tap (Reset to 14)
    const duration = isDoubleTap ? 14 : (config.shotClockDuration || 24);
    setShotClock(duration * 10);
  };

  const handleKeyboard = useCallback((event) => {
    if (showSettings) return;
    const key = event.key.toLowerCase();
    if (key === 'z') modifyScore('home', 1); if (key === 's') modifyScore('home', -1);
    if (key === 'd') modifyFouls('home', 1); if (key === 'q') modifyFouls('home', -1);
    if (key === 'arrowup') modifyScore('away', 1); if (key === 'arrowdown') modifyScore('away', -1);
    if (key === 'arrowright') modifyFouls('away', 1); if (key === 'arrowleft') modifyFouls('away', -1);
    if (key === ' ') { event.preventDefault(); toggleTimer(); }
    if (key === 'enter') modifyPeriod(1);
    if (key === 'b') { if (soundEnabled) playGameSound('buzzer_fiba'); }
    if (key === 'm') setMediaActive(prev => !prev);
  }, [homeScore, awayScore, homeFouls, awayFouls, isRunning, showSettings, soundEnabled, mediaActive]);
  useEffect(() => { window.addEventListener('keydown', handleKeyboard); return () => window.removeEventListener('keydown', handleKeyboard); }, [handleKeyboard]);
  const getFontFamily = () => { switch (fontStyle) { case 'digital': return "'Share Tech Mono', monospace"; case 'tv': return "'Barlow Condensed', sans-serif"; case 'bold': return "'Russo One', sans-serif"; default: return "'Inter', sans-serif"; } };

  return (
    <div className={`h-[100dvh] w-full overflow-hidden flex flex-col font-sans select-none transition-colors duration-500 ${tvMode ? 'items-center justify-center' : ''}`} style={{ backgroundColor: bgColor, color: textColor, fontFamily: getFontFamily() }}>
      <AnimationStyles />
      <MediaOverlay active={mediaActive} type={mediaType} content={mediaText} images={mediaImages} duration={slideDuration} onClose={() => setMediaActive(false)} />

      {/* HEADER */}
      {!tvMode && (
        <div className="h-12 md:h-14 w-full flex justify-between items-center px-4 shrink-0 z-20 shadow-lg border-b safe-pb" style={{ backgroundColor: bgColor, borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2"><Trophy className="text-yellow-500" size={20} /><select value={sport} onChange={(e) => { setSport(e.target.value); const newConf = SPORTS_CONFIG[e.target.value]; setConfig(newConf); setTimeLeft(newConf.countDirection === 'down' ? newConf.timePerPeriod * 60 * 10 : 0); }} className="text-xs md:text-sm font-bold border-none rounded focus:ring-2 ring-indigo-500 py-1 outline-none cursor-pointer" style={{ backgroundColor: 'transparent', color: textColor, fontFamily: 'Inter' }}>{Object.keys(SPORTS_CONFIG).map(k => <option key={k} value={k} style={{ backgroundColor: '#000' }}>{SPORTS_CONFIG[k].name}</option>)}</select></div>
          <div className="flex gap-2 md:gap-3"><button onClick={() => setMediaActive(!mediaActive)} className={`p-2 rounded opacity-70 hover:opacity-100 ${mediaActive ? 'bg-red-600 text-white' : ''}`} style={{ backgroundColor: mediaActive ? '' : 'rgba(128,128,128,0.2)' }} title="Mode Média"><Megaphone size={18} /></button><button onClick={() => setShowShortcuts(true)} className="p-2 rounded opacity-70 hover:opacity-100 hidden md:block" style={{ backgroundColor: 'rgba(128,128,128,0.2)' }} title="Raccourcis Clavier"><Keyboard size={18} /></button><button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded opacity-70 hover:opacity-100" style={{ backgroundColor: 'rgba(128,128,128,0.2)' }}><Settings size={18} /></button><button onClick={() => toggleTvMode(true)} className="flex items-center gap-2 bg-indigo-600 px-3 py-1 rounded text-xs md:text-sm font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg animate-pulse" style={{ fontFamily: 'Inter' }}><Monitor size={16} /> <span className="hidden md:inline">Mode Cast</span></button></div>
        </div>
      )}
      {tvMode && <button onClick={() => toggleTvMode(false)} className="absolute top-2 left-1/2 -translate-x-1/2 z-50 p-3 rounded-full transition-all backdrop-blur-md" style={{ backgroundColor: 'rgba(128,128,128,0.2)', color: textColor }}><Smartphone size={24} /></button>}

      {/* RESET MODAL */}
      {showResetModal && (
        <div className="absolute inset-0 bg-black/80 z-[9999] flex items-center justify-center backdrop-blur-sm p-6 animate-in fade-in zoom-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4"><RefreshCcw size={32} className="text-red-500" /></div>
            <h3 className="text-2xl font-bold text-white">Réinitialiser ?</h3>
            <p className="text-zinc-400">Le chronomètre sera remis à <strong className="text-white">{gamePhase === 'extra_time' ? config.extraTime : config.timePerPeriod}:00</strong>.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowResetModal(false)} className="py-3 rounded-xl font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Annuler</button>
              <button onClick={confirmResetTimer} className="py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500">Valider</button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ fontFamily: 'Inter', color: '#fff' }}><div className="bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-700 flex flex-col max-h-[90vh]"><div className="p-4 border-b border-zinc-700 flex justify-between items-center"><h3 className="text-xl font-bold">Configuration</h3><button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white">Fermer</button></div><div className="p-6 overflow-y-auto space-y-6">

        {/* PHASE DE JEU */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Flag size={16} /> Phase de Jeu</h4>
          <div className="flex gap-2">
            <button onClick={() => { setGamePhase('regulation'); manualReset(); setShowSettings(false); }} className={`flex-1 py-3 text-xs font-bold rounded border ${gamePhase === 'regulation' ? 'bg-green-600 border-green-500 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-400'}`}>Réglementaire</button>
            {config.extraTime > 0 && <button onClick={startExtraTime} className={`flex-1 py-3 text-xs font-bold rounded border ${gamePhase === 'extra_time' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-400'}`}>Prolongations</button>}
            {config.hasShootout && <button onClick={startShootout} className={`flex-1 py-3 text-xs font-bold rounded border ${gamePhase === 'shootout' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-800 border-zinc-600 text-zinc-400'}`}>Tirs au But</button>}
          </div>
        </div>

        {/* REGLES DU MATCH */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Gavel size={16} /> Règles du Match</h4>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">Temps Réglementaire</span>
            <div className="flex items-center gap-2 bg-zinc-800 rounded p-1"><button onClick={() => updateRegulationTime(-1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Minus size={16} /></button><span className="w-8 text-center font-mono font-bold">{config.timePerPeriod}</span><button onClick={() => updateRegulationTime(1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Plus size={16} /></button></div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">Nombre de Périodes</span>
            <div className="flex items-center gap-2 bg-zinc-800 rounded p-1"><button onClick={() => updatePeriodCount(-1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Minus size={16} /></button><span className="w-8 text-center font-mono font-bold">{config.periods}</span><button onClick={() => updatePeriodCount(1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Plus size={16} /></button></div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center"><span className="text-sm font-medium text-white">Activer Prolongations</span><button onClick={toggleExtraTimeEnabled} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.extraTime > 0 ? 'bg-orange-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.extraTime > 0 ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>
            {config.extraTime > 0 && (
              <div className="flex justify-between items-center pl-4 border-l-2 border-orange-500/20"><span className="text-xs text-zinc-400">Durée Prolong. (Min)</span><div className="flex items-center gap-2 bg-zinc-800 rounded p-1"><button onClick={() => updateExtraTimeDuration(-1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Minus size={14} /></button><span className="w-8 text-center font-mono font-bold text-sm">{config.extraTime}</span><button onClick={() => updateExtraTimeDuration(1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Plus size={14} /></button></div></div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Activer Tirs au But</span>
              <button onClick={toggleShootoutEnabled} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.hasShootout ? 'bg-purple-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.hasShootout ? 'translate-x-5' : 'translate-x-0'}`}></div></button>
            </div>
            {config.hasShootout && (
              <div className="flex justify-between items-center pl-4 border-l-2 border-purple-500/20">
                <span className="text-xs text-zinc-400">Nombre de Tirs</span>
                <div className="flex items-center gap-2 bg-zinc-800 rounded p-1">
                  <button onClick={() => updateShootoutCount(-1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Minus size={14} /></button>
                  <span className="w-8 text-center font-mono font-bold text-sm">{config.shootoutCount || 5}</span>
                  <button onClick={() => updateShootoutCount(1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Plus size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* FAUTES CUMULES TOGGLE */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Activer {config.foulLabel || "Fautes Cumulées"}</span>
              <button onClick={toggleFoulsEnabled} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.showFouls ? 'bg-red-500' : 'bg-slate-600'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.showFouls ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
            {config.showFouls && (
              <div className="flex justify-between items-center pl-4 border-l-2 border-red-500/20">
                <span className="text-xs text-zinc-400">Limite (Alerte Rouge)</span>
                <div className="flex items-center gap-2 bg-zinc-800 rounded p-1">
                  <button onClick={() => updateFoulLimit(-1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Minus size={14} /></button>
                  <span className="w-8 text-center font-mono font-bold text-sm">{config.foulLimit}</span>
                  <button onClick={() => updateFoulLimit(1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Plus size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* TIMEOUTS TOGGLE */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Activer Temps-Morts</span>
              <button onClick={toggleTimeoutsEnabled} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.showTimeouts ? 'bg-yellow-500' : 'bg-slate-600'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.showTimeouts ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
            {config.showTimeouts && (
              <div className="flex justify-between items-center pl-4 border-l-2 border-yellow-500/20">
                <span className="text-xs text-zinc-400">Nombre (Par équipe)</span>
                <div className="flex items-center gap-2 bg-zinc-800 rounded p-1">
                  <button onClick={() => updateMaxTimeouts(-1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Minus size={14} /></button>
                  <span className="w-8 text-center font-mono font-bold text-sm">{config.maxTimeouts}</span>
                  <button onClick={() => updateMaxTimeouts(1)} className="p-1 hover:bg-zinc-700 rounded text-white"><Plus size={14} /></button>
                </div>
              </div>
            )}
          </div>

          {/* VOLLEY SERVICE */}
          {sport === 'volleyball' && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white">Afficher Service</span>
              <button onClick={toggleServiceEnabled} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.showService ? 'bg-blue-500' : 'bg-slate-600'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.showService ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>
          )}

          {/* BASKETBALL SHOT CLOCK TOGGLE */}
          {sport === 'basketball' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-white">Activer Chrono Possession</span>
                <button onClick={toggleShotClockEnabled} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.showShotClock ? 'bg-blue-500' : 'bg-slate-600'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.showShotClock ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-white/10"><div className="flex flex-col"><span className="text-sm font-medium text-white flex items-center gap-2">{timerSecurity ? <Shield size={14} className="text-green-500" /> : <ShieldAlert size={14} className="text-red-500" />} Sécurité Chrono</span><span className="text-[10px] text-zinc-500">{timerSecurity ? "Confirmation requise au reset" : "Reset instantané au swipe"}</span></div><button onClick={() => setTimerSecurity(!timerSecurity)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${timerSecurity ? 'bg-green-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${timerSecurity ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>
        </div>

        {/* Sponsor & Media Settings */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-4">
          <h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Megaphone size={16} /> Sponsor & Média</h4>
          <div className="flex gap-2">
            <button onClick={() => setMediaType('text')} className={`flex-1 py-2 text-xs font-bold rounded ${mediaType === 'text' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>Texte</button>
            <button onClick={() => setMediaType('image')} className={`flex-1 py-2 text-xs font-bold rounded ${mediaType === 'image' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>Image</button>
            <button onClick={() => setMediaType('slideshow')} className={`flex-1 py-2 text-xs font-bold rounded ${mediaType === 'slideshow' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>Diaporama</button>
          </div>
          {mediaType === 'text' ? (
            <input value={mediaText} onChange={(e) => setMediaText(e.target.value)} className="w-full bg-zinc-800 p-2 rounded border border-zinc-600 text-sm" placeholder="Message..." />
          ) : (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-zinc-800 p-2 rounded border border-zinc-600 text-sm text-zinc-300 hover:text-white justify-center"><Upload size={16} /> Ajouter images...<input type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} /></label>
              {mediaImages.length > 0 && (<div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto scrollbar-thin">{mediaImages.map((img, index) => (<div key={img.id || index} className="flex items-center gap-2 bg-zinc-800 p-2 rounded border border-zinc-700"><img src={img.src || img} className="w-10 h-10 object-cover rounded" alt="thumb" /><div className="flex-1 flex items-center gap-2"><Clock size={14} className="text-zinc-400" /><input type="number" value={img.duration || 5} onChange={(e) => { const val = e.target.value; setMediaImages(prev => prev.map(p => p.id === img.id ? { ...p, duration: val } : p)) }} className="w-12 bg-zinc-900 border border-zinc-600 rounded text-center text-xs p-1" /><span className="text-xs text-zinc-500">sec</span></div><button onClick={() => removeImage(img.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button></div>))}</div>)}
            </div>
          )}
        </div>

        {/* Team Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700"><div className="flex justify-between items-center mb-2"><label className="text-xs uppercase text-slate-400 font-bold" style={{ color: homeColor }}>Domicile</label><div className="flex bg-zinc-800 rounded p-1"><button onClick={() => setUseHomeLogo(false)} className={`p-1 rounded ${!useHomeLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><Type size={16} /></button><button onClick={() => setUseHomeLogo(true)} className={`p-1 rounded ${useHomeLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><ImageIcon size={16} /></button></div></div>{!useHomeLogo ? <input value={homeName} onChange={e => setHomeName(e.target.value)} className="w-full bg-zinc-800 p-2 rounded border border-zinc-600 mb-2 text-white" placeholder="Nom Équipe" /> : <div className="flex gap-2 items-center"><label className="flex-1 cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-2 rounded border border-zinc-600 flex items-center justify-center gap-2 text-sm text-zinc-300"><Upload size={16} /> Logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'home')} /></label>{homeLogo && <img src={homeLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded" />}</div>}<input type="color" value={homeColor} onChange={e => setHomeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2 bg-transparent" /></div>
          <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700"><div className="flex justify-between items-center mb-2"><label className="text-xs uppercase text-slate-400 font-bold" style={{ color: awayColor }}>Visiteur</label><div className="flex bg-zinc-800 rounded p-1"><button onClick={() => setUseAwayLogo(false)} className={`p-1 rounded ${!useAwayLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><Type size={16} /></button><button onClick={() => setUseAwayLogo(true)} className={`p-1 rounded ${useAwayLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><ImageIcon size={16} /></button></div></div>{!useAwayLogo ? <input value={awayName} onChange={e => setAwayName(e.target.value)} className="w-full bg-zinc-800 p-2 rounded border border-zinc-600 mb-2 text-white" placeholder="Nom Équipe" /> : <div className="flex gap-2 items-center"><label className="flex-1 cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-2 rounded border border-zinc-600 flex items-center justify-center gap-2 text-sm text-zinc-300"><Upload size={16} /> Logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'away')} /></label>{awayLogo && <img src={awayLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded" />}</div>}<input type="color" value={awayColor} onChange={e => setAwayColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2 bg-transparent" /></div>
        </div>

        {/* Visual Settings & Toggles */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-3"><h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Type size={16} /> Typographie</h4><div className="grid grid-cols-2 gap-2">{FONTS.map(f => (<button key={f.id} onClick={() => setFontStyle(f.id)} className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 text-xs font-medium border transition-all ${fontStyle === f.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`} style={{ fontFamily: f.family }}>Aa <span style={{ fontFamily: 'Inter' }}>{f.name}</span></button>))}</div></div>
        <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-4"><h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Palette size={16} /> Couleurs</h4><div className="flex gap-2">{PRESET_COLORS.map(p => (<button key={p.name} onClick={() => { setBgColor(p.bg); setTextColor(p.text); }} className="flex-1 py-2 rounded-lg text-xs font-bold border border-white/10" style={{ backgroundColor: p.bg, color: p.text }}>{p.name}</button>))}</div><div className="flex items-center gap-4"><div className="flex-1 flex items-center gap-2 bg-zinc-800 p-2 rounded-lg border border-zinc-700"><span className="text-xs text-zinc-400">Fond</span><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 h-6 rounded cursor-pointer bg-transparent" /></div><button onClick={() => setTextColor(prev => prev === '#ffffff' ? '#000000' : '#ffffff')} className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg border border-zinc-700 text-xs font-bold text-white hover:bg-zinc-700">{textColor === '#ffffff' ? <Sun size={16} /> : <Moon size={16} />} Texte</button></div></div>
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700"><div className="flex flex-col gap-2"><div className="flex justify-between items-center bg-zinc-800 p-2 rounded border border-zinc-600"><label className="text-xs font-bold text-slate-300">Buzzer</label><button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div><div className="flex justify-between items-center bg-zinc-800 p-2 rounded border border-zinc-600"><label className="text-xs font-bold text-slate-300">Animations Score</label><button onClick={() => setAnimEnabled(!animEnabled)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${animEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${animEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div></div></div>

      </div><div className="p-4 border-t border-zinc-700"><button onClick={() => setShowSettings(false)} className="w-full bg-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-500 text-white">Valider &amp; Retour</button></div></div></div>}

      {/* --- GRID --- */}
      <div className={`transition-all duration-500 relative flex flex-col z-10 ${tvMode ? 'w-full aspect-video max-h-screen shadow-2xl border' : 'w-full h-full flex-1'}`} style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>

        <GoalAnimation show={scoringAnim === 'home'} color={homeColor} term={config.scoreTerm} />
        <GoalAnimation show={scoringAnim === 'away'} color={awayColor} term={config.scoreTerm} />

        <div className="flex-1 w-full relative grid grid-cols-[1fr_minmax(140px,28%)_1fr] md:grid-cols-[1fr_minmax(220px,30%)_1fr]">

          {/* === LEFT === */}
          <div className="h-full flex flex-col relative overflow-hidden">
            <div className="w-full flex-none h-[40%] flex flex-col overflow-hidden relative" style={{ flex: 'none' }}>
              <div className="h-1 w-full shrink-0 absolute top-0 left-0 z-10" style={{ backgroundColor: left.color }}></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {left.useLogo && left.logo ? <img src={left.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                  : <h2 className="text-xl md:text-5xl font-black uppercase truncate tracking-tighter text-center w-full leading-snug px-2" style={{ color: left.color }}>{left.name}</h2>}
              </div>
            </div>

            {/* 40% MID: SCORE */}
            <div className="w-full flex-none h-[40%] flex flex-col relative" style={{ flex: 'none' }}>
              <GestureArea className="w-full h-full flex flex-col items-center justify-center relative group p-0 overflow-hidden" onTap={() => modifyScore(left.key, 1)} onSwipeRight={() => modifyScore(left.key, -1)}>
                {!tvMode && <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-50 transition-opacity"><ChevronRight size={40} /></div>}
                <span className={`font-bold leading-none select-none tabular-nums relative z-10 transition-all duration-300 ${gamePhase === 'shootout' ? 'translate-y-[-15%]' : ''}`} style={{ fontSize: 'clamp(4.5rem, 20vw, 16rem)', color: left.color }}>{left.score}</span>
              </GestureArea>
              {/* PENALTIES SIBLING (OUTSIDE GESTURE) */}
              {gamePhase === 'shootout' && (
                <div className="absolute bottom-4 left-0 w-full z-20 flex justify-center gap-2 pointer-events-auto">
                  {left.penalties.map((status, idx) => (
                    <div key={idx}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); togglePenalty(left.key, idx); }}
                      className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-white/40 cursor-pointer shadow-lg transition-all transform hover:scale-110 ${status === 1 ? 'bg-green-500 border-green-400' : status === 2 ? 'bg-red-500 border-red-400' : 'bg-transparent'}`}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            {/* 20% BOT: Stats & Timeouts */}
            <div className="w-full flex-none h-[20%] relative border-t" style={{ flex: 'none', backgroundColor: 'rgba(128,128,128,0.05)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              {/* Container logic: Split if both active, else full width */}
              <div className="w-full h-full flex">
                {/* TIMEOUTS BLOCK */}
                {config.showTimeouts && (
                  <div className={`${config.showFouls ? 'w-1/2 border-r border-white/10' : 'w-full'} h-full flex flex-col items-center justify-center`}>
                    {!tvMode && <span className="text-[10px] uppercase font-bold opacity-50 mb-1">Temps M.</span>}
                    <div className="flex gap-2">
                      {[...Array(config.maxTimeouts)].map((_, i) => (
                        <div key={i}
                          className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white/40 cursor-pointer shadow-lg transition-all active:scale-90 ${i < left.timeouts ? 'bg-white/10' : 'bg-white'}`}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); useTimeout(left.key); }}>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FOULS BLOCK */}
                {config.showFouls && (
                  <GestureArea
                    className={`${config.showTimeouts ? 'w-1/2' : 'w-full'} h-full flex flex-col items-center justify-center`}
                    onTap={() => modifyFouls(left.key, 1)}
                    onSwipeRight={() => modifyFouls(left.key, -1)}
                    onLongPress={() => addExclusion(left.key)}
                  >
                    {sport !== 'handball' ? (
                      <div className="flex flex-col items-center">
                        <span className={`text-xs md:text-base font-bold uppercase tracking-wider flex items-center gap-1 ${left.fouls >= config.foulLimit ? 'text-red-500' : 'opacity-50'}`}>{config.foulLabel || "Fautes"} {left.fouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}</span>
                        <div className={`text-2xl md:text-5xl font-bold leading-none tabular-nums ${left.fouls >= config.foulLimit ? 'text-red-500' : ''}`}>{left.fouls}</div>
                      </div>
                    ) : (
                      !tvMode && <span className="text-xs md:text-base font-bold uppercase tracking-wider opacity-50">{config.foulLabel}</span>
                    )}
                  </GestureArea>
                )}

                {/* SETS (VOLLEY) */}
                {!config.showFouls && !config.showTimeouts && config.showSets && (
                  <GestureArea className="w-full h-full flex flex-row items-center justify-center gap-2" onTap={() => modifySets(left.key, 1)} onSwipeRight={() => modifySets(left.key, -1)}>
                    <span className="text-xs md:text-lg font-bold uppercase opacity-50 tracking-wider">Sets</span>
                    <div className="text-3xl md:text-5xl font-bold leading-none tabular-nums" style={{ color: left.color }}>{left.sets}</div>
                  </GestureArea>
                )}
              </div>
            </div>
          </div>

          {/* === CENTER === */}
          <div className="h-full flex flex-col justify-center items-center relative z-10 border-x" style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <div className="w-full relative">
              <div className="absolute inset-0 z-50 cursor-pointer" style={{ pointerEvents: tvMode ? 'auto' : 'none' }}><GestureArea className="w-full h-full" onLongPress={() => setMediaActive(!mediaActive)} onTap={tvMode ? () => modifyPeriod(1) : undefined} onSwipeRight={tvMode ? () => modifyPeriod(-1) : undefined} /></div>
              <GestureArea className="mb-1 md:mb-2 mt-6 md:mt-10 text-center w-full py-1 md:py-2 rounded-xl group relative hover:opacity-80" onTap={() => modifyPeriod(1)} onSwipeRight={() => modifyPeriod(-1)}>
                <span className="block opacity-50 text-[10px] md:text-sm uppercase font-bold tracking-[0.2em] mb-0.5">{gamePhase === 'extra_time' ? 'PROL.' : gamePhase === 'shootout' ? 'TAB' : config.periodName}</span>
                <div className="flex items-center justify-center gap-4"><span className="text-4xl md:text-7xl font-bold select-none">{period}</span></div>
              </GestureArea>
            </div>

            <div className="w-full relative flex flex-col items-center flex-1">
              {sport === 'volleyball' ? (<GestureArea className="w-full px-1 py-1 flex flex-col items-center justify-start cursor-ew-resize h-full" onSwipeLeft={() => setService('home')} onSwipeRight={() => setService('away')} onTap={toggleService}>
                {config.showService && (
                  <div className={`w-full py-2 rounded-xl border-2 shadow-lg text-center flex flex-col items-center justify-center gap-1 transition-colors duration-500 mb-2 ${serviceSide === 'home' ? 'border-l-4' : 'border-r-4'}`} style={{ backgroundColor: 'transparent', borderColor: serviceSide === 'home' ? homeColor : awayColor, minHeight: '75px' }}><span className="opacity-50 font-bold uppercase tracking-widest text-[10px]">Service</span><div className="transform transition-transform duration-300">{serviceSide === 'home' ? <ArrowLeft size={24} strokeWidth={3} style={{ color: homeColor }} className="animate-pulse-slow" /> : <ArrowRight size={24} strokeWidth={3} style={{ color: awayColor }} className="animate-pulse-slow" />}</div></div>
                )}
                {config.showSetHistory && setHistory.length > 0 && (<div className="w-full flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar items-center justify-start py-1">{setHistory.map((s, i) => { const valLeft = isSwapped ? s.away : s.home; const valRight = isSwapped ? s.home : s.away; const colorLeft = valLeft > valRight ? (isSwapped ? awayColor : homeColor) : 'white'; const colorRight = valRight > valLeft ? (isSwapped ? homeColor : awayColor) : 'white'; return (<div key={i} className="text-lg md:text-xl font-bold bg-white/5 px-4 py-1 rounded w-full text-center border border-white/5 tracking-wider flex justify-center gap-2 shadow-sm"><span style={{ color: colorLeft }}>{valLeft}</span> - <span style={{ color: colorRight }}>{valRight}</span></div>); })}</div>)}</GestureArea>) : (<GestureArea className="w-full px-1 md:px-2 py-1 md:py-2" isTimer={true} onTap={toggleTimer} onSwipeRight={handleTimerResetRequest}><div className={`py-2 md:py-8 text-center relative overflow-hidden transition-all duration-75 ${config.countDirection === 'none' ? 'opacity-20 grayscale' : ''}`}>{gamePhase === 'shootout' ? (<div className="flex justify-center items-center h-[clamp(3rem,8vw,8rem)] animate-pulse"></div>) : (<span className={`font-bold tabular-nums leading-none transition-colors text-white`} style={{ fontSize: 'clamp(3rem, 8vw, 8rem)' }}>{formatTime(timeLeft)}</span>)}{!isRunning && config.countDirection !== 'none' && gamePhase !== 'shootout' && <div className="absolute inset-0 flex items-center justify-center"><div className="bg-red-600/20 p-3 rounded-full backdrop-blur-sm animate-pulse"><Play size={40} className="fill-white" style={{ color: '#fff' }} /></div></div>}</div></GestureArea>)}
              {config.showShotClock && (<div className="w-full mt-2 mb-2 px-2"><GestureArea className="w-full py-2 rounded-xl border-2 shadow-lg text-center relative flex flex-col items-center justify-center bg-black/40 overflow-hidden" style={{ borderColor: possession === 'home' ? homeColor : awayColor }} onTap={(isDouble) => handleShotClockTap(isDouble)} onDoubleTap={() => handleShotClockTap(true)} onSwipeLeft={() => { setPossession('home'); setShotClock(240); }} onSwipeRight={() => { setPossession('away'); setShotClock(240); }}><span className="text-2xl font-bold tabular-nums font-digital" style={{ color: possession === 'home' ? homeColor : (possession === 'away' ? awayColor : 'white') }}>{formatShotClock(shotClock)}</span><div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 opacity-50">{possession === 'home' ? <ArrowLeft size={16} color={homeColor} /> : <div></div>}{possession === 'away' ? <ArrowRight size={16} color={awayColor} /> : <div></div>}</div></GestureArea></div>)}
              {(sport === 'handball' || sport === 'futsal') && (homeExclusions.length > 0 || awayExclusions.length > 0) && (<div className="w-full flex gap-2 justify-between px-1 mt-2"><div className="flex flex-col gap-1 items-end w-1/2">{left.exclusions.map(ex => (<div key={ex.id} className="text-lg font-bold text-white bg-red-600/80 px-2 py-1 rounded w-full text-center animate-pulse cursor-pointer border border-white/20" onClick={() => removeExclusion(left.key, ex.id)}>{formatExclusion(ex.time)}</div>))}</div><div className="flex flex-col gap-1 items-start w-1/2">{right.exclusions.map(ex => (<div key={ex.id} className="text-lg font-bold text-white bg-red-600/80 px-2 py-1 rounded w-full text-center animate-pulse cursor-pointer border border-white/20" onClick={() => removeExclusion(right.key, ex.id)}>{formatExclusion(ex.time)}</div>))}</div></div>)}
            </div>

            {!tvMode && sport !== 'volleyball' && config.countDirection !== 'none' && (<div className="mt-1 md:mt-2 flex flex-col gap-2 w-full px-4"><div className="grid grid-cols-4 gap-1 w-full"><button onClick={() => setTimeLeft(t => Math.max(0, t - 600))} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>-1m</button><button onClick={() => setTimeLeft(t => Math.max(0, t - 10))} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>-1s</button><button onClick={() => setTimeLeft(t => t + 10)} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>+1s</button><button onClick={() => setTimeLeft(t => t + 600)} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>+1m</button></div></div>)}
            {!tvMode && (<div className="mt-1 md:mt-2 w-full px-6"><button onClick={manualReset} className="flex items-center justify-center gap-2 py-2 md:py-3 w-full rounded-lg hover:bg-red-900/20 transition-colors opacity-70 hover:opacity-100" style={{ backgroundColor: 'rgba(128,128,128,0.1)' }}><RotateCcw size={16} /> <span className="text-xs font-bold uppercase">Reset</span></button></div>)}
          </div>

          {/* === RIGHT === */}
          <div className="h-full flex flex-col relative overflow-hidden">
            <div className="w-full flex-none h-[40%] flex flex-col overflow-hidden relative" style={{ flex: 'none' }}>
              <div className="h-1 w-full shrink-0 absolute top-0 left-0 z-10" style={{ backgroundColor: right.color }}></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {right.useLogo && right.logo ? <img src={right.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                  : <h2 className="text-xl md:text-5xl font-black uppercase truncate tracking-tighter text-center w-full leading-snug px-2" style={{ color: right.color }}>{right.name}</h2>}
              </div>
            </div>

            <div className="w-full flex-none h-[40%] flex flex-col relative" style={{ flex: 'none' }}>
              <GestureArea className="w-full h-full flex flex-col items-center justify-center relative group p-0 overflow-hidden" onTap={() => modifyScore(right.key, 1)} onSwipeRight={() => modifyScore(right.key, -1)}>
                {!tvMode && <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-50 transition-opacity"><ChevronRight size={40} /></div>}
                <span className={`font-bold leading-none select-none tabular-nums relative z-10 transition-all duration-300 ${gamePhase === 'shootout' ? 'translate-y-[-15%]' : ''}`} style={{ fontSize: 'clamp(4.5rem, 20vw, 16rem)', color: right.color }}>{right.score}</span>
              </GestureArea>
              {gamePhase === 'shootout' && (
                <div className="absolute bottom-4 left-0 w-full z-20 flex justify-center gap-2 pointer-events-auto">
                  {right.penalties.map((status, idx) => (
                    <div key={idx}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); togglePenalty(right.key, idx); }}
                      className={`w-4 h-4 md:w-6 md:h-6 rounded-full border-2 border-white/40 cursor-pointer shadow-lg transition-all transform hover:scale-110 ${status === 1 ? 'bg-green-500 border-green-400' : status === 2 ? 'bg-red-500 border-red-400' : 'bg-transparent'}`}
                    ></div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full flex-none h-[20%] relative border-t" style={{ flex: 'none', backgroundColor: 'rgba(128,128,128,0.05)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              {/* Container logic: Split if both active, else full width */}
              <div className="w-full h-full flex">
                {/* TIMEOUTS BLOCK (Fixed: Using 'right' key) */}
                {config.showTimeouts && (
                  <div className={`${config.showFouls ? 'w-1/2 border-r border-white/10' : 'w-full'} h-full flex flex-col items-center justify-center`}>
                    {!tvMode && <span className="text-[10px] uppercase font-bold opacity-50 mb-1">Temps M.</span>}
                    <div className="flex gap-2">
                      {[...Array(config.maxTimeouts)].map((_, i) => (
                        <div key={i}
                          className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white/40 cursor-pointer shadow-lg transition-all active:scale-90 ${i < right.timeouts ? 'bg-white/10' : 'bg-white'}`}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); useTimeout(right.key); }}>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* FOULS BLOCK */}
                {config.showFouls && (
                  <GestureArea
                    className={`${config.showTimeouts ? 'w-1/2' : 'w-full'} h-full flex flex-col items-center justify-center`}
                    onTap={() => modifyFouls(right.key, 1)}
                    onSwipeRight={() => modifyFouls(right.key, -1)}
                    onLongPress={() => addExclusion(right.key)}
                  >
                    {sport !== 'handball' ? (
                      <div className="flex flex-col items-center">
                        <span className={`text-xs md:text-base font-bold uppercase tracking-wider flex items-center gap-1 ${right.fouls >= config.foulLimit ? 'text-red-500' : 'opacity-50'}`}>{config.foulLabel || "Fautes"} {right.fouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}</span>
                        <div className={`text-2xl md:text-5xl font-bold leading-none tabular-nums ${right.fouls >= config.foulLimit ? 'text-red-500' : ''}`}>{right.fouls}</div>
                      </div>
                    ) : (
                      !tvMode && <span className="text-xs md:text-base font-bold uppercase tracking-wider opacity-50">{config.foulLabel}</span>
                    )}
                  </GestureArea>
                )}

                {/* SETS (VOLLEY) */}
                {!config.showFouls && !config.showTimeouts && config.showSets && (
                  <GestureArea className="w-full h-full flex flex-row items-center justify-center gap-2" onTap={() => modifySets(right.key, 1)} onSwipeRight={() => modifySets(right.key, -1)}>
                    <span className="text-xs md:text-lg font-bold uppercase opacity-50 tracking-wider">Sets</span>
                    <div className="text-3xl md:text-5xl font-bold leading-none tabular-nums" style={{ color: right.color }}>{right.sets}</div>
                  </GestureArea>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;