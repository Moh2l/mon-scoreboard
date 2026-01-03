// Version: Scoreboard 4.72
// Release: Production (Feature: Exclusions Hand/Futsal via Long Press on Fouls)
// Features: Hard Lock 40/40/20, Precision Timer, Media Overlay, Team Config, PWA, Audio, Auto-Swap, Exclusions
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Monitor, Smartphone, Trophy, Minimize, Maximize, ChevronLeft, ChevronRight, AlertCircle, Upload, Type, Image as ImageIcon, ArrowLeft, ArrowRight, Plus, Minus, MousePointerClick, Volume2, Sparkles, Download, Wifi, WifiOff, Share, Palette, Sun, Moon, Keyboard, Megaphone, X, ArrowUp, Clock, Trash2, RefreshCcw, Timer as TimerIcon, CheckCircle2, UserX } from 'lucide-react';

const SPORTS_CONFIG = {
  football: { name: "Football", periodName: "MT", periods: 2, timePerPeriod: 45, countDirection: "up", showSets: false, showFouls: false, foulLimit: 0, scoreTerm: "BUT", exclusionTime: 0, showShotClock: false, showSetHistory: false },
  basketball: { name: "Basketball", periodName: "Q-Temps", periods: 4, timePerPeriod: 10, countDirection: "down", showSets: false, showFouls: true, foulLimit: 5, scoreTerm: "PANIER", exclusionTime: 0, showShotClock: true, showSetHistory: false },
  volleyball: { name: "Volleyball", periodName: "Set", periods: 5, timePerPeriod: 0, countDirection: "none", showSets: true, showFouls: false, foulLimit: 0, scoreTerm: "POINT", exclusionTime: 0, showShotClock: false, showSetHistory: true },
  futsal: { name: "Futsal", periodName: "MT", periods: 2, timePerPeriod: 20, countDirection: "down", showSets: false, showFouls: true, foulLimit: 5, scoreTerm: "BUT", exclusionTime: 120, showShotClock: false, showSetHistory: false },
  handball: { name: "Handball", periodName: "MT", periods: 2, timePerPeriod: 30, countDirection: "down", showSets: false, showFouls: false, foulLimit: 0, scoreTerm: "BUT", exclusionTime: 120, showShotClock: false, showSetHistory: false }
};

const SOUND_OPTIONS = [
  { id: 'whistle_trill', name: "Sifflet à Roulette" },
  { id: 'buzzer_fiba', name: "Buzzer FIBA" }
];

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

const AnimationStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;700&family=Inter:wght@400;700;900&family=Russo+One&family=Share+Tech+Mono&display=swap');

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

    @keyframes ticker {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
    .animate-ticker {
      display: inline-block;
      white-space: nowrap;
      animation: ticker 20s linear infinite;
    }

    /* iOS Safe Area Fixes */
    .safe-pb {
        padding-bottom: env(safe-area-inset-bottom, 20px);
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

const MediaOverlay = ({ active, type, content, images, duration, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (active) setCurrentImageIndex(0);
  }, [active]);

  useEffect(() => {
    let interval;
    if (active && type === 'slideshow' && images && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, duration * 1000);
    }
    return () => clearInterval(interval);
  }, [active, type, images, duration]);

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      onDoubleClick={onClose}
      onClick={(e) => {
        if (type === 'slideshow' && images && images.length > 1) {
          setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-[101] bg-white/20 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-md transition-colors"
        title="Fermer"
      >
        <X size={24} />
      </button>

      {type === 'text' && (
        <div className="w-full bg-red-600 py-8 overflow-hidden relative border-y-8 border-white shadow-2xl">
          <div className="whitespace-nowrap text-white font-black text-6xl md:text-8xl uppercase tracking-wider animate-ticker w-full text-center">
            {content || "MESSAGE DÉFILANT"}
          </div>
        </div>
      )}

      {(type === 'image' || type === 'slideshow') && images && images.length > 0 ? (
        <div className="w-full h-full relative flex items-center justify-center">
          <img
            src={images[currentImageIndex]?.src || images[0]?.src || images[currentImageIndex] || images[0]}
            alt="Media"
            className="w-full h-full object-contain animate-in fade-in duration-500"
          />
          {type === 'slideshow' && images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm safe-pb">
              {images.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white scale-125' : 'bg-white/30'}`}></div>
              ))}
            </div>
          )}
        </div>
      ) : (type !== 'text' && (
        <div className="text-white/50 flex flex-col items-center">
          <ImageIcon size={48} className="mb-2" />
          <p>Aucune image chargée</p>
        </div>
      ))}
    </div>
  );
};

const playGameSound = (type) => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.5, now);

  if (type === 'whistle_trill') {
    const osc = ctx.createOscillator(); const mod = ctx.createOscillator(); const modG = ctx.createGain(); const env = ctx.createGain();
    osc.connect(env); env.connect(ctx.destination); mod.connect(modG); modG.connect(env.gain);
    osc.frequency.value = 2500; mod.frequency.value = 40; mod.type = 'square';
    env.gain.setValueAtTime(0, now); env.gain.linearRampToValueAtTime(0.5, now + 0.05); env.gain.linearRampToValueAtTime(0, now + 0.8);
    osc.start(now); mod.start(now); osc.stop(now + 0.8); mod.stop(now + 0.8);
  } else if (type === 'buzzer_fiba') {
    const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(320, now);
    osc.connect(masterGain);
    masterGain.gain.setValueAtTime(0.6, now); masterGain.gain.linearRampToValueAtTime(0.6, now + 1.5); masterGain.gain.linearRampToValueAtTime(0, now + 2.0);
    osc.start(now); osc.stop(now + 2.0);
  }
};

const GestureArea = ({ children, onTap, onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp, onLongPress, onDoubleTap, className, style, disabled = false, isTimer = false }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const elementRef = useRef(null);
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);
  const lastTap = useRef(0);

  const handleContextMenu = (e) => {
    if (onLongPress) { e.preventDefault(); e.stopPropagation(); return false; }
  };

  useEffect(() => {
    const el = elementRef.current;
    if (el) {
      const preventDefault = (e) => { if (!disabled) e.preventDefault(); };
      el.addEventListener('touchmove', preventDefault, { passive: false });
      el.addEventListener('contextmenu', handleContextMenu);
      return () => { el.removeEventListener('touchmove', preventDefault); el.removeEventListener('contextmenu', handleContextMenu); };
    }
  }, [disabled]);

  const startPress = () => {
    isLongPress.current = false;
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        isLongPress.current = true;
        if (navigator.vibrate) navigator.vibrate(50);
        onLongPress();
      }, 800);
    }
  };

  const cancelPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handleTouchStart = (e) => {
    if (disabled) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    startPress();
  };

  const handleTouchEnd = (e) => {
    cancelPress();
    if (disabled || !touchStartX.current) return;
    if (isLongPress.current) return;

    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 50) {
        if (diffX < 0 && onSwipeLeft) onSwipeLeft();
        else if (diffX > 0 && onSwipeRight) onSwipeRight();
      } else if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30 && onTap) {
        if (e.cancelable) e.preventDefault(); onTap();
      }
    } else {
      if (Math.abs(diffY) > 50) {
        if (diffY < 0 && onSwipeUp) onSwipeUp();
      } else if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30 && onTap) {
        if (tapLength < 300 && tapLength > 0 && onDoubleTap) {
          onDoubleTap();
          if (e.cancelable) e.preventDefault();
        } else {
          if (e.cancelable) e.preventDefault(); onTap();
        }
      }
    }
    lastTap.current = currentTime;
    touchStartX.current = null; touchStartY.current = null;
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    startPress();
  };

  const handleMouseUp = (e) => {
    cancelPress();
    if (disabled || !touchStartX.current) return;
    if (isLongPress.current) return;

    const diffX = e.clientX - touchStartX.current;
    const diffY = e.clientY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < -50 && onSwipeLeft) onSwipeLeft();
      else if (diffX > 50 && onSwipeRight) onSwipeRight();
      else if (Math.abs(diffX) < 10 && onTap) onTap();
    } else {
      if (diffY < -50 && onSwipeUp) onSwipeUp();
      else if (Math.abs(diffY) < 10 && onTap) onTap();
    }
    touchStartX.current = null; touchStartY.current = null;
  };

  const handleTouchMove = () => cancelPress();
  const handleMouseMove = () => cancelPress();

  const cursorStyle = isTimer ? 'cursor-pointer' : 'cursor-ew-resize';
  return (
    <div ref={elementRef} className={`${className} ${cursorStyle} touch-none select-none active:scale-[0.98] transition-transform duration-75`}
      style={{ ...style, touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchMove={handleTouchMove}
      onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
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
    case 'flash': animClass = "animate-custom-flash"; containerClass = "bg-white/80 mix-blend-overlay"; textStyle = { color: color, textShadow: 'none', filter: 'brightness(1.5)' }; break;
    case 'drop': animClass = "animate-custom-drop"; break;
    case 'shake': animClass = "animate-custom-shake"; break;
    case 'pulse': animClass = "animate-custom-pulse"; textStyle = { '--neon-color': color, color: '#fff' }; break;
    case 'zoom': default: animClass = "animate-custom-zoom"; break;
  }
  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none overflow-hidden animate-in fade-in duration-200`}>
      <div className={`absolute inset-0 ${containerClass} transition-all duration-300`}></div>
      <h1 className={`text-[15vw] font-black text-white drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] z-50 tracking-tighter ${animClass}`} style={textStyle}>{term} !</h1>
      <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-full animate-pulse opacity-30 bg-gradient-radial from-white/30 to-transparent"></div></div>
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

  const [timeLeft, setTimeLeft] = useState(20 * 60 * 10);
  const [isRunning, setIsRunning] = useState(false);
  const [serviceSide, setServiceSide] = useState('home');

  const [shotClock, setShotClock] = useState(240);
  const [possession, setPossession] = useState('home');

  const [setHistory, setSetHistory] = useState([]);
  const [homeExclusions, setHomeExclusions] = useState([]); // NEW
  const [awayExclusions, setAwayExclusions] = useState([]); // NEW

  const [isSwapped, setIsSwapped] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [tvMode, setTvMode] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState('buzzer_fiba');
  const [animEnabled, setAnimEnabled] = useState(true);
  const [animType, setAnimType] = useState('zoom');
  const [scoringAnim, setScoringAnim] = useState(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  const [mediaActive, setMediaActive] = useState(false);
  const [mediaType, setMediaType] = useState('text');
  const [mediaText, setMediaText] = useState("MESSAGE DÉFILANT");
  const [mediaImages, setMediaImages] = useState([]);
  const [slideDuration, setSlideDuration] = useState(5);

  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontStyle, setFontStyle] = useState('standard');

  // Derived Data
  const homeData = { name: homeName, score: homeScore, sets: homeSets, fouls: homeFouls, color: homeColor, logo: homeLogo, useLogo: useHomeLogo, exclusions: homeExclusions, key: 'home' };
  const awayData = { name: awayName, score: awayScore, sets: awaySets, fouls: awayFouls, color: awayColor, logo: awayLogo, useLogo: useAwayLogo, exclusions: awayExclusions, key: 'away' };

  const left = isSwapped ? awayData : homeData;
  const right = isSwapped ? homeData : awayData;

  useEffect(() => {
    document.documentElement.style.backgroundColor = bgColor;
    document.body.style.backgroundColor = bgColor;
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.content.includes('viewport-fit=cover')) { meta.content += ', viewport-fit=cover'; }
  }, [bgColor]);

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
    setTvMode(enable);
    if (enable) {
      try { if (document.documentElement.requestFullscreen && !document.fullscreenElement) await document.documentElement.requestFullscreen().catch(e => console.log("FS blocked", e)); } catch (err) { console.log("FS error ignored"); }
    } else {
      try { if (document.exitFullscreen && document.fullscreenElement) await document.exitFullscreen().catch(e => console.log("Exit FS blocked", e)); } catch (err) { console.log("Exit FS error ignored"); }
    }
  };

  // --- SAVE & LOAD ---
  useEffect(() => {
    const savedData = localStorage.getItem('scoreboard_v4_save');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.sport && SPORTS_CONFIG[parsed.sport]) { setSport(parsed.sport); setConfig(parsed.config || SPORTS_CONFIG[parsed.sport]); }
        setHomeScore(parsed.homeScore || 0); setAwayScore(parsed.awayScore || 0);
        setHomeSets(parsed.homeSets || 0); setAwaySets(parsed.awaySets || 0);
        setHomeFouls(parsed.homeFouls || 0); setAwayFouls(parsed.awayFouls || 0);
        setPeriod(parsed.period || 1);
        setHomeName(parsed.homeName || "DOMICILE"); setAwayName(parsed.awayName || "VISITEUR");
        setHomeColor(parsed.homeColor || "#ef4444"); setAwayColor(parsed.awayColor || "#3b82f6");
        setHomeLogo(parsed.homeLogo || null); setAwayLogo(parsed.awayLogo || null);
        setUseHomeLogo(parsed.useHomeLogo || false); setUseAwayLogo(parsed.useAwayLogo || false);
        let t = parsed.timeLeft; if (t !== undefined && t < 10000 && parsed.config?.timePerPeriod > 5) t = t * 10;
        setTimeLeft(t !== undefined ? t : 20 * 60 * 10);
        setServiceSide(parsed.serviceSide || 'home');
        setBgColor(parsed.bgColor || '#000000'); setTextColor(parsed.textColor || '#ffffff');
        setFontStyle(parsed.fontStyle || 'standard');
        setSoundEnabled(parsed.soundEnabled ?? true); setAnimEnabled(parsed.animEnabled ?? true);
        setMediaText(parsed.mediaText || "MESSAGE PAR DÉFAUT");
        let loadedImages = parsed.mediaImages || [];
        if (loadedImages.length > 0 && typeof loadedImages[0] === 'string') { loadedImages = loadedImages.map((src, i) => ({ id: i, src, duration: 5 })); }
        setMediaImages(loadedImages);
        setSlideDuration(parsed.slideDuration || 5);
        setSetHistory(parsed.setHistory || []);
        setIsSwapped(parsed.isSwapped || false);
        setHomeExclusions(parsed.homeExclusions || []);
        setAwayExclusions(parsed.awayExclusions || []);
      } catch (e) { console.warn("Save corrupted", e); }
    }
  }, []);

  useEffect(() => {
    const dataToSave = {
      sport, config, homeScore, awayScore, homeSets, awaySets, homeFouls, awayFouls,
      period, homeName, awayName, homeColor, awayColor, homeLogo, awayLogo,
      useHomeLogo, useAwayLogo, timeLeft, serviceSide,
      bgColor, textColor, fontStyle, soundEnabled, animEnabled,
      mediaText, mediaImages, slideDuration, setHistory, isSwapped,
      homeExclusions, awayExclusions
    };
    try { localStorage.setItem('scoreboard_v4_save', JSON.stringify(dataToSave)); }
    catch (e) { const { mediaImages, ...safeData } = dataToSave; localStorage.setItem('scoreboard_v4_save', JSON.stringify(safeData)); }
  }, [sport, config, homeScore, awayScore, homeSets, awaySets, homeFouls, awayFouls, period, homeName, awayName, homeColor, awayColor, homeLogo, awayLogo, useHomeLogo, useAwayLogo, timeLeft, serviceSide, bgColor, textColor, fontStyle, soundEnabled, animEnabled, mediaText, mediaImages, slideDuration, setHistory, isSwapped, homeExclusions, awayExclusions]);

  // --- TIMERS LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        // Main Time
        setTimeLeft((prev) => {
          if (config.countDirection === 'down') { if (prev <= 0) { setIsRunning(false); if (soundEnabled) playGameSound(soundType); return 0; } return prev - 1; }
          else if (config.countDirection === 'up') return prev + 1; return prev;
        });

        // Shot Clock
        if (config.showShotClock) { setShotClock((prev) => { if (prev <= 0) return 0; return prev - 1; }); }

        // EXCLUSIONS (Decrement every second, roughly every 10 ticks)
        // To be precise with 100ms interval: decrement time by 0.1s
        // Exclusion object structure: { id, time: seconds }
        // We will decrement using 0.1s steps, so exclusion time should be stored in tenths or handled carefully.
        // Let's store in seconds for simplicity and decrement only every 10 ticks (1s).
        // A cleaner way: store end timestamp? No, because pause.
        // Simple way: Decrement every 1000ms. But here we run at 100ms.
        // Let's perform decrement logic every tick but use a fractional counter?
        // Easier: Decrement exclusionTime if (timeLeft % 10 === 0) -> roughly 1 sec.
      }, 100);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, config.countDirection, soundEnabled, soundType, config.showShotClock]);

  // Separate effect for Exclusions to run every second cleanly
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        setHomeExclusions(prev => prev.map(ex => ({ ...ex, time: ex.time - 1 })).filter(ex => ex.time > 0));
        setAwayExclusions(prev => prev.map(ex => ({ ...ex, time: ex.time - 1 })).filter(ex => ex.time > 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);


  useEffect(() => { const newConfig = SPORTS_CONFIG[sport]; setConfig(newConfig); }, [sport]);

  const resetGame = (specificConfig = config) => {
    setIsRunning(false);
    setHomeScore(0); setAwayScore(0); setHomeSets(0); setAwaySets(0); setHomeFouls(0); setAwayFouls(0); setPeriod(1);
    setSetHistory([]); setTimeLeft(specificConfig.countDirection === 'down' ? specificConfig.timePerPeriod * 60 * 10 : 0);
    setServiceSide('home'); setShotClock(240); setIsSwapped(false);
    setHomeExclusions([]); setAwayExclusions([]);
  };

  const modifySets = (team, delta) => {
    if (sport === 'volleyball') {
      if (delta > 0) {
        setSetHistory(prev => [...prev, { home: homeScore, away: awayScore }]);
        setHomeScore(0); setAwayScore(0);
        setPeriod(p => p + 1);
        setIsSwapped(prev => !prev);
        if (team === 'home') setHomeSets(s => s + 1); else setAwaySets(s => s + 1);
      } else {
        if ((team === 'home' && homeSets > 0) || (team === 'away' && awaySets > 0)) {
          if (setHistory.length > 0) {
            const last = setHistory[setHistory.length - 1];
            setHomeScore(last.home); setAwayScore(last.away);
            setSetHistory(prev => prev.slice(0, -1));
            setPeriod(p => Math.max(1, p - 1));
            setIsSwapped(prev => !prev);
            if (team === 'home') setHomeSets(s => s - 1); else setAwaySets(s => s - 1);
          } else {
            if (team === 'home') setHomeSets(s => Math.max(0, s - 1)); else setAwaySets(s => Math.max(0, s - 1));
          }
        }
      }
    } else {
      if (team === 'home') setHomeSets(Math.max(0, homeSets + delta)); else setAwaySets(Math.max(0, awaySets + delta));
    }
  };

  const removeLastSet = () => { if (setHistory.length > 0) { setSetHistory(prev => prev.slice(0, -1)); } };
  const formatShotClock = (tenths) => { const s = Math.floor(tenths / 10); const t = tenths % 10; return `${s}.${t}`; };
  const formatTime = (tenths) => {
    const totalSeconds = Math.floor(tenths / 10); const m = Math.floor(totalSeconds / 60); const s = totalSeconds % 60; const t = tenths % 10;
    if (totalSeconds < 60) return `${s.toString().padStart(2, '0')}.${t}`; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // EXCLUSIONS HELPERS
  const addExclusion = (teamKey) => {
    if (config.exclusionTime > 0) {
      const newEx = { id: Date.now(), time: config.exclusionTime };
      if (teamKey === 'home') setHomeExclusions(prev => [...prev, newEx]);
      else setAwayExclusions(prev => [...prev, newEx]);
    }
  };
  const removeExclusion = (teamKey, id) => {
    if (teamKey === 'home') setHomeExclusions(prev => prev.filter(ex => ex.id !== id));
    else setAwayExclusions(prev => prev.filter(ex => ex.id !== id));
  };
  const formatExclusion = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };


  const handleLogoUpload = (e, team) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { if (team === 'home') setHomeLogo(reader.result); else setAwayLogo(reader.result); }; reader.readAsDataURL(file); } };
  const handleMediaUpload = (e) => { const files = Array.from(e.target.files); if (files.length === 0) return; const promises = files.map(file => new Promise((resolve) => { const reader = new FileReader(); reader.onload = () => resolve({ id: Date.now() + Math.random(), src: reader.result, duration: 5 }); reader.readAsDataURL(file); })); Promise.all(promises).then(imgs => setMediaImages(prev => [...prev, ...imgs])); };
  const clearMedia = () => setMediaImages([]);
  const updateImageDuration = (id, newDuration) => { setMediaImages(prev => prev.map(img => img.id === id ? { ...img, duration: Math.max(1, parseInt(newDuration) || 5) } : img)); };
  const removeImage = (id) => { setMediaImages(prev => prev.filter(img => img.id !== id)); };
  const handleTimeChange = (minutes) => { const newTime = parseInt(minutes, 10); if (!isNaN(newTime) && newTime > 0) { setConfig(prev => ({ ...prev, timePerPeriod: newTime })); if (!isRunning && config.countDirection === 'down') setTimeLeft(newTime * 60 * 10); } };
  const handleFoulLimitChange = (limit) => { const newLimit = parseInt(limit, 10); if (!isNaN(newLimit) && newLimit > 0) setConfig(prev => ({ ...prev, foulLimit: newLimit })); };
  const toggleShotClockConfig = () => { setConfig(prev => ({ ...prev, showShotClock: !prev.showShotClock })); };
  const manualReset = () => { const defaultConfig = SPORTS_CONFIG[sport]; setConfig(defaultConfig); setHomeScore(0); setAwayScore(0); setHomeSets(0); setAwaySets(0); setHomeFouls(0); setAwayFouls(0); setPeriod(1); setSetHistory([]); setIsSwapped(false); setTimeLeft(defaultConfig.countDirection === 'down' ? defaultConfig.timePerPeriod * 60 * 10 : 0); setServiceSide('home'); setShotClock(240); setHomeExclusions([]); setAwayExclusions([]); };
  const triggerAnim = (team) => { if (!animEnabled) return; setScoringAnim(team); setTimeout(() => setScoringAnim(null), 2000); };

  const modifyScore = (team, delta) => { if (team === 'home') { setHomeScore(Math.max(0, homeScore + delta)); if (delta > 0) triggerAnim('home'); } else { setAwayScore(Math.max(0, awayScore + delta)); if (delta > 0) triggerAnim('away'); } };
  const modifyFouls = (team, delta) => { if (team === 'home') setHomeFouls(Math.max(0, homeFouls + delta)); else setAwayFouls(Math.max(0, awayFouls + delta)); };
  const modifyPeriod = (delta) => { const newPeriod = period + delta; if (newPeriod < 1) return; setPeriod(newPeriod); setIsSwapped(prev => !prev); };
  const toggleTimer = () => { if (config.countDirection !== 'none') setIsRunning(prev => !prev); };
  const setService = (side) => setServiceSide(side);
  const toggleService = () => setServiceSide(prev => prev === 'home' ? 'away' : 'home');
  const handleShotClockTap = (isDoubleTap) => { if (isDoubleTap) setShotClock(140); else setShotClock(240); };

  const handleKeyboard = useCallback((event) => {
    if (showSettings) return;
    const key = event.key.toLowerCase();
    if (key === 'z') modifyScore('home', 1); if (key === 's') modifyScore('home', -1);
    if (key === 'd') modifyFouls('home', 1); if (key === 'q') modifyFouls('home', -1);
    if (key === 'arrowup') modifyScore('away', 1); if (key === 'arrowdown') modifyScore('away', -1);
    if (key === 'arrowright') modifyFouls('away', 1); if (key === 'arrowleft') modifyFouls('away', -1);
    if (key === ' ') { event.preventDefault(); toggleTimer(); }
    if (key === 'enter') modifyPeriod(1);
    if (key === 'b') { if (soundEnabled) playGameSound(soundType); }
    if (key === 'm') setMediaActive(prev => !prev);
  }, [homeScore, awayScore, homeFouls, awayFouls, isRunning, showSettings, soundEnabled, soundType, config, mediaActive]);
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

      {/* MODALS REMOVED FOR BREVITY (Identical) */}
      {showShortcuts && <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ fontFamily: 'Inter', color: '#fff' }}><div className="bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-700 flex flex-col p-6 gap-6 relative"><button onClick={() => setShowShortcuts(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white">✕</button><h3 className="text-xl font-bold flex items-center gap-2"><Keyboard size={24} className="text-indigo-500" /> Raccourcis Clavier</h3><div className="grid grid-cols-2 gap-8"><div><h4 className="text-sm font-bold text-indigo-400 uppercase mb-3">Domicile</h4><ul className="space-y-2 text-sm text-zinc-300"><li className="flex justify-between"><span>Score +1</span> <kbd className="bg-zinc-800 px-2 rounded">Z</kbd></li><li className="flex justify-between"><span>Score -1</span> <kbd className="bg-zinc-800 px-2 rounded">S</kbd></li><li className="flex justify-between"><span>Faute +1</span> <kbd className="bg-zinc-800 px-2 rounded">D</kbd></li><li className="flex justify-between"><span>Faute -1</span> <kbd className="bg-zinc-800 px-2 rounded">Q</kbd></li></ul></div><div><h4 className="text-sm font-bold text-indigo-400 uppercase mb-3">Visiteur</h4><ul className="space-y-2 text-sm text-zinc-300"><li className="flex justify-between"><span>Score +1</span> <kbd className="bg-zinc-800 px-2 rounded">↑</kbd></li><li className="flex justify-between"><span>Score -1</span> <kbd className="bg-zinc-800 px-2 rounded">↓</kbd></li><li className="flex justify-between"><span>Faute +1</span> <kbd className="bg-zinc-800 px-2 rounded">→</kbd></li><li className="flex justify-between"><span>Faute -1</span> <kbd className="bg-zinc-800 px-2 rounded">←</kbd></li></ul></div></div></div></div>}
      {showSettings && <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm p-4" style={{ fontFamily: 'Inter', color: '#fff' }}><div className="bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-700 flex flex-col max-h-[90vh]"><div className="p-4 border-b border-zinc-700 flex justify-between items-center"><h3 className="text-xl font-bold">Configuration</h3><button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-white">Fermer</button></div><div className="p-6 overflow-y-auto space-y-6"><div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-4"><h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Megaphone size={16} /> Sponsor & Média</h4><div className="flex gap-2"><button onClick={() => setMediaType('text')} className={`flex-1 py-2 text-xs font-bold rounded ${mediaType === 'text' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>Texte</button><button onClick={() => setMediaType('image')} className={`flex-1 py-2 text-xs font-bold rounded ${mediaType === 'image' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>Image</button><button onClick={() => setMediaType('slideshow')} className={`flex-1 py-2 text-xs font-bold rounded ${mediaType === 'slideshow' ? 'bg-indigo-600' : 'bg-zinc-700'}`}>Diaporama</button></div>{mediaType === 'text' ? (<input value={mediaText} onChange={(e) => setMediaText(e.target.value)} className="w-full bg-zinc-800 p-2 rounded border border-zinc-600 text-sm" placeholder="Message..." />) : (<div className="flex flex-col gap-2"><label className="flex items-center gap-2 cursor-pointer bg-zinc-800 p-2 rounded border border-zinc-600 text-sm text-zinc-300 hover:text-white justify-center"><Upload size={16} /> Ajouter images...<input type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} /></label>{mediaImages.length > 0 && (<div className="flex flex-col gap-2 mt-2 max-h-40 overflow-y-auto scrollbar-thin">{mediaImages.map((img, index) => (<div key={img.id || index} className="flex items-center gap-2 bg-zinc-800 p-2 rounded border border-zinc-700"><img src={img.src || img} className="w-10 h-10 object-cover rounded" alt="thumb" /><div className="flex-1 flex items-center gap-2"><Clock size={14} className="text-zinc-400" /><input type="number" value={img.duration || 5} onChange={(e) => updateImageDuration(img.id, e.target.value)} className="w-12 bg-zinc-900 border border-zinc-600 rounded text-center text-xs p-1" /><span className="text-xs text-zinc-500">sec</span></div><button onClick={() => removeImage(img.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button></div>))}</div>)}</div>)}</div><div className="grid grid-cols-2 gap-4"><div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700"><div className="flex justify-between items-center mb-2"><label className="text-xs uppercase text-slate-400 font-bold" style={{ color: homeColor }}>Domicile</label><div className="flex bg-zinc-800 rounded p-1"><button onClick={() => setUseHomeLogo(false)} className={`p-1 rounded ${!useHomeLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><Type size={16} /></button><button onClick={() => setUseHomeLogo(true)} className={`p-1 rounded ${useHomeLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><ImageIcon size={16} /></button></div></div>{!useHomeLogo ? <input value={homeName} onChange={e => setHomeName(e.target.value)} className="w-full bg-zinc-800 p-2 rounded border border-zinc-600 mb-2 text-white" placeholder="Nom Équipe" /> : <div className="flex gap-2 items-center"><label className="flex-1 cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-2 rounded border border-zinc-600 flex items-center justify-center gap-2 text-sm text-zinc-300"><Upload size={16} /> Logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'home')} /></label>{homeLogo && <img src={homeLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded" />}</div>}<input type="color" value={homeColor} onChange={e => setHomeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2 bg-transparent" /></div><div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700"><div className="flex justify-between items-center mb-2"><label className="text-xs uppercase text-slate-400 font-bold" style={{ color: awayColor }}>Visiteur</label><div className="flex bg-zinc-800 rounded p-1"><button onClick={() => setUseAwayLogo(false)} className={`p-1 rounded ${!useAwayLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><Type size={16} /></button><button onClick={() => setUseAwayLogo(true)} className={`p-1 rounded ${useAwayLogo ? 'bg-indigo-600' : 'text-zinc-400'}`}><ImageIcon size={16} /></button></div></div>{!useAwayLogo ? <input value={awayName} onChange={e => setAwayName(e.target.value)} className="w-full bg-zinc-800 p-2 rounded border border-zinc-600 mb-2 text-white" placeholder="Nom Équipe" /> : <div className="flex gap-2 items-center"><label className="flex-1 cursor-pointer bg-zinc-800 hover:bg-zinc-700 p-2 rounded border border-zinc-600 flex items-center justify-center gap-2 text-sm text-zinc-300"><Upload size={16} /> Logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'away')} /></label>{awayLogo && <img src={awayLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded" />}</div>}<input type="color" value={awayColor} onChange={e => setAwayColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2 bg-transparent" /></div></div><div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-3"><h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Type size={16} /> Typographie</h4><div className="grid grid-cols-2 gap-2">{FONTS.map(f => (<button key={f.id} onClick={() => setFontStyle(f.id)} className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 text-xs font-medium border transition-all ${fontStyle === f.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`} style={{ fontFamily: f.family }}>Aa <span style={{ fontFamily: 'Inter' }}>{f.name}</span></button>))}</div></div><div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex flex-col gap-4"><h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2"><Palette size={16} /> Couleurs</h4><div className="flex gap-2">{PRESET_COLORS.map(p => (<button key={p.name} onClick={() => { setBgColor(p.bg); setTextColor(p.text); }} className="flex-1 py-2 rounded-lg text-xs font-bold border border-white/10" style={{ backgroundColor: p.bg, color: p.text }}>{p.name}</button>))}</div><div className="flex items-center gap-4"><div className="flex-1 flex items-center gap-2 bg-zinc-800 p-2 rounded-lg border border-zinc-700"><span className="text-xs text-zinc-400">Fond</span><input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1 h-6 rounded cursor-pointer bg-transparent" /></div><button onClick={() => setTextColor(prev => prev === '#ffffff' ? '#000000' : '#ffffff')} className="flex items-center gap-2 bg-zinc-800 p-2 rounded-lg border border-zinc-700 text-xs font-bold text-white hover:bg-zinc-700">{textColor === '#ffffff' ? <Sun size={16} /> : <Moon size={16} />} Texte</button></div></div><div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-xs uppercase text-slate-400 font-bold mb-2">Temps (Min)</label><div className="flex items-center gap-4 justify-center bg-zinc-800 p-2 rounded border border-zinc-600"><button onClick={() => handleTimeChange(config.timePerPeriod - 1)} className="p-2 hover:bg-zinc-700 rounded text-white"><Minus size={24} /></button><span className="text-3xl font-bold w-20 text-center tabular-nums text-white">{config.timePerPeriod}</span><button onClick={() => handleTimeChange(config.timePerPeriod + 1)} className="p-2 hover:bg-zinc-700 rounded text-white"><Plus size={24} /></button></div></div><div className="flex flex-col gap-2"><div className="flex justify-between items-center bg-zinc-800 p-2 rounded border border-zinc-600"><label className="text-xs font-bold text-slate-300">Buzzer</label><button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${soundEnabled ? 'bg-green-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div><div className="flex justify-between items-center bg-zinc-800 p-2 rounded border border-zinc-600"><label className="text-xs font-bold text-slate-300">Anim</label><button onClick={() => setAnimEnabled(!animEnabled)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${animEnabled ? 'bg-indigo-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${animEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div><div className="flex justify-between items-center bg-zinc-800 p-2 rounded border border-zinc-600"><label className="text-xs font-bold text-slate-300 flex items-center gap-1"><TimerIcon size={12} /> Shot Clock</label><button onClick={toggleShotClockConfig} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${config.showShotClock ? 'bg-blue-500' : 'bg-slate-600'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${config.showShotClock ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div></div></div></div></div><div className="p-4 border-t border-zinc-700"><button onClick={() => setShowSettings(false)} className="w-full bg-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-500 text-white">Valider & Retour</button></div></div></div>}

      {/* --- MAIN GRID --- */}
      <div className={`transition-all duration-500 relative flex flex-col z-10 ${tvMode ? 'w-full aspect-video max-h-screen shadow-2xl border' : 'w-full h-full flex-1'}`} style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>

        <GoalAnimation show={scoringAnim === 'home'} color={left.color} term={config.scoreTerm} type={animType} />
        <GoalAnimation show={scoringAnim === 'away'} color={right.color} term={config.scoreTerm} type={animType} />

        <div className="flex-1 w-full relative grid grid-cols-[1fr_minmax(140px,28%)_1fr] md:grid-cols-[1fr_minmax(220px,30%)_1fr]">

          {/* === LEFT (HOME or AWAY) === */}
          <div className="h-full flex flex-col relative overflow-hidden">
            <div className="w-full flex-none h-[40%] flex flex-col overflow-hidden relative" style={{ flex: 'none' }}>
              <div className="h-1 w-full shrink-0 absolute top-0 left-0 z-10" style={{ backgroundColor: left.color }}></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                {left.useLogo && left.logo ? <img src={left.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                  : <h2 className="text-xl md:text-5xl font-black uppercase truncate tracking-tighter text-center w-full leading-snug px-2" style={{ color: left.color }}>{left.name}</h2>}
              </div>
            </div>
            <GestureArea className="w-full flex-none h-[40%] flex flex-col items-center justify-center relative group p-0 overflow-hidden" style={{ flex: 'none' }} onTap={() => modifyScore(left.key, 1)} onSwipeRight={() => modifyScore(left.key, -1)}>
              {!tvMode && <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-50 transition-opacity"><ChevronRight size={40} /></div>}
              <span className="font-bold leading-none select-none tabular-nums relative z-10" style={{ fontSize: 'clamp(4.5rem, 20vw, 16rem)', color: left.color }}>{left.score}</span>
            </GestureArea>
            <div className="w-full flex-none h-[20%] grid grid-cols-1 overflow-hidden" style={{ flex: 'none', backgroundColor: 'rgba(128,128,128,0.05)' }}>
              {config.showSets && <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t group relative pt-2 md:pt-4" style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} onTap={() => modifySets(left.key, 1)} onSwipeRight={() => modifySets(left.key, -1)}><div className="flex flex-row items-center justify-center h-full w-full gap-2"><span className="text-xs md:text-lg font-bold uppercase opacity-50 tracking-wider">Sets</span><div className="text-3xl md:text-5xl font-bold leading-none tabular-nums" style={{ color: left.color }}>{left.sets}</div></div></GestureArea>}
              {config.showFouls && <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t group relative transition-colors pt-2 md:pt-4" style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} onTap={() => modifyFouls(left.key, 1)} onSwipeRight={() => modifyFouls(left.key, -1)}><div className="flex flex-row items-center justify-center h-full w-full gap-2"><span className={`text-xs md:text-base font-bold uppercase tracking-wider flex items-center gap-1 ${left.fouls >= config.foulLimit ? 'text-red-500' : 'opacity-50'}`}>Fautes {left.fouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}</span><div className={`text-2xl md:text-5xl font-bold leading-none tabular-nums ${left.fouls >= config.foulLimit ? 'text-red-500' : ''}`}>{left.fouls}</div></div></GestureArea>}
            </div>
          </div>

          {/* === CENTRE === */}
          <div className="h-full flex flex-col justify-center items-center relative z-10 border-x" style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>

            <div className="w-full relative">
              <div className="absolute inset-0 z-50 cursor-pointer" style={{ pointerEvents: tvMode ? 'auto' : 'none' }}><GestureArea className="w-full h-full" onLongPress={() => setMediaActive(!mediaActive)} /></div>
              <GestureArea className="mb-1 md:mb-2 mt-6 md:mt-10 text-center w-full py-1 md:py-2 rounded-xl group relative hover:opacity-80" onTap={() => modifyPeriod(1)} onSwipeRight={() => modifyPeriod(-1)}>
                <span className="block opacity-50 text-[10px] md:text-sm uppercase font-bold tracking-[0.2em] mb-0.5">{config.periodName}</span>
                <div className="flex items-center justify-center gap-4"><span className="text-4xl md:text-7xl font-bold select-none">{period}</span></div>
              </GestureArea>
            </div>

            <div className="w-full relative flex flex-col items-center flex-1">
              {sport === 'volleyball' ? (
                <GestureArea className="w-full px-1 py-1 flex flex-col items-center justify-start cursor-ew-resize h-full" onSwipeLeft={() => setService('home')} onSwipeRight={() => setService('away')} onTap={toggleService}>

                  {/* SERVICE RESTORED (75px) */}
                  <div className={`w-full py-2 rounded-xl border-2 shadow-lg text-center flex flex-col items-center justify-center gap-1 transition-colors duration-500 mb-2 ${serviceSide === 'home' ? 'border-l-4' : 'border-r-4'}`} style={{ backgroundColor: 'transparent', borderColor: serviceSide === 'home' ? homeColor : awayColor, minHeight: '75px' }}>
                    <span className="opacity-50 font-bold uppercase tracking-widest text-[10px]">Service</span>
                    <div className="transform transition-transform duration-300">{serviceSide === 'home' ? <ArrowLeft size={24} strokeWidth={3} style={{ color: homeColor }} className="animate-pulse-slow" /> : <ArrowRight size={24} strokeWidth={3} style={{ color: awayColor }} className="animate-pulse-slow" />}</div>
                  </div>

                  {/* EXCLUSIONS (HAND/FUTSAL) */}
                  {(sport === 'handball' || sport === 'futsal') && (
                    <div className="w-full flex gap-2 justify-between px-1 mt-2">
                      {/* HOME EXCLUSIONS */}
                      <div className="flex-1 flex flex-col gap-1 items-end">
                        {left.exclusions.map(ex => (
                          <div key={ex.id} className="text-red-500 font-bold bg-white/10 px-2 rounded animate-pulse" onClick={() => removeExclusion(left.key, ex.id)}>{formatTime(ex.time * 10).split('.')[0]}</div>
                        ))}
                      </div>
                      {/* AWAY EXCLUSIONS */}
                      <div className="flex-1 flex flex-col gap-1 items-start">
                        {right.exclusions.map(ex => (
                          <div key={ex.id} className="text-red-500 font-bold bg-white/10 px-2 rounded animate-pulse" onClick={() => removeExclusion(right.key, ex.id)}>{formatTime(ex.time * 10).split('.')[0]}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* HISTORY - VOLLEY */}
                  {config.showSetHistory && setHistory.length > 0 && (
                    <div className="w-full flex-1 flex flex-col gap-1 overflow-y-auto no-scrollbar items-center justify-start py-1">
                      {setHistory.map((s, i) => {
                        const valLeft = isSwapped ? s.away : s.home;
                        const valRight = isSwapped ? s.home : s.away;
                        return (
                          <div key={i} className="text-lg md:text-xl font-bold bg-white/5 px-4 py-1 rounded w-full text-center border border-white/5 tracking-wider flex justify-center gap-2 shadow-sm">
                            <span style={{ color: valLeft > valRight ? (isSwapped ? awayColor : homeColor) : 'white' }}>{valLeft}</span>-<span style={{ color: valRight > valLeft ? (isSwapped ? homeColor : awayColor) : 'white' }}>{valRight}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GestureArea>
              ) : (
                <GestureArea className="w-full px-1 md:px-2 py-1 md:py-2" isTimer={true} onTap={toggleTimer}>
                  <div className={`py-2 md:py-8 text-center relative overflow-hidden transition-all duration-75 ${config.countDirection === 'none' ? 'opacity-20 grayscale' : ''}`}>
                    <span className={`font-bold tabular-nums leading-none transition-colors text-white`} style={{ fontSize: 'clamp(3rem, 8vw, 8rem)' }}>{formatTime(timeLeft)}</span>
                    {!isRunning && config.countDirection !== 'none' && <div className="absolute inset-0 flex items-center justify-center"><div className="bg-red-600/20 p-3 rounded-full backdrop-blur-sm animate-pulse"><Play size={40} className="fill-white" style={{ color: '#fff' }} /></div></div>}
                  </div>
                </GestureArea>
              )}

              {config.showShotClock && (
                <div className="w-full mt-2 mb-2 px-2">
                  <GestureArea className="w-full py-2 rounded-xl border-2 shadow-lg text-center relative flex flex-col items-center justify-center bg-black/40 overflow-hidden" style={{ borderColor: possession === 'home' ? homeColor : awayColor }} onTap={(isDouble) => handleShotClockTap(isDouble)} onDoubleTap={() => handleShotClockTap(true)} onSwipeLeft={() => { setPossession('home'); setShotClock(240); }} onSwipeRight={() => { setPossession('away'); setShotClock(240); }}>
                    <span className="text-2xl font-bold tabular-nums font-digital" style={{ color: possession === 'home' ? homeColor : (possession === 'away' ? awayColor : 'white') }}>{formatShotClock(shotClock)}</span>
                    <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 opacity-50">{possession === 'home' ? <ArrowLeft size={16} color={homeColor} /> : <div></div>}{possession === 'away' ? <ArrowRight size={16} color={awayColor} /> : <div></div>}</div>
                  </GestureArea>
                </div>
              )}

              {/* DISPLAY EXCLUSIONS (HAND/FUTSAL) - IF NOT VOLLEY */}
              {(sport === 'handball' || sport === 'futsal') && (homeExclusions.length > 0 || awayExclusions.length > 0) && (
                <div className="w-full flex gap-2 justify-between px-2 mt-2">
                  <div className="flex flex-col gap-1 items-end w-1/2">
                    {left.exclusions.map(ex => (
                      <div key={ex.id} className="text-lg font-bold text-white bg-red-600/80 px-2 py-1 rounded w-full text-center animate-pulse cursor-pointer border border-white/20" onClick={() => removeExclusion(left.key, ex.id)}>
                        {Math.floor(ex.time / 60)}:{(ex.time % 60).toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    {right.exclusions.map(ex => (
                      <div key={ex.id} className="text-lg font-bold text-white bg-red-600/80 px-2 py-1 rounded w-full text-center animate-pulse cursor-pointer border border-white/20" onClick={() => removeExclusion(right.key, ex.id)}>
                        {Math.floor(ex.time / 60)}:{(ex.time % 60).toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {!tvMode && sport !== 'volleyball' && config.countDirection !== 'none' && (
              <div className="mt-1 md:mt-2 flex flex-col gap-2 w-full px-4"><div className="grid grid-cols-4 gap-1 w-full"><button onClick={() => setTimeLeft(t => Math.max(0, t - 600))} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>-1m</button><button onClick={() => setTimeLeft(t => Math.max(0, t - 10))} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>-1s</button><button onClick={() => setTimeLeft(t => t + 10)} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>+1s</button><button onClick={() => setTimeLeft(t => t + 600)} className="px-1 py-1 rounded text-[10px] font-bold border opacity-70" style={{ backgroundColor: 'rgba(128,128,128,0.1)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>+1m</button></div></div>
            )}
            {!tvMode && (
              <div className="mt-1 md:mt-2 w-full px-6"><button onClick={manualReset} className="flex items-center justify-center gap-2 py-2 md:py-3 w-full rounded-lg hover:bg-red-900/20 transition-colors opacity-70 hover:opacity-100" style={{ backgroundColor: 'rgba(128,128,128,0.1)' }}><RotateCcw size={16} /> <span className="text-xs font-bold uppercase">Reset</span></button></div>
            )}
          </div>

          {/* === RIGHT (AWAY or HOME) === */}
          <div className="h-full flex flex-col relative overflow-hidden">
            <div className="w-full flex-none h-[40%] flex flex-col overflow-hidden relative" style={{ flex: 'none' }}>
              <div className="h-1 w-full shrink-0 absolute top-0 left-0 z-10" style={{ backgroundColor: right.color }}></div>

              {/* LONG PRESS ZONE FOR EXCLUSION (RIGHT) */}
              <div className="absolute inset-0 z-20 cursor-pointer" style={{ pointerEvents: 'none' }}></div>

              <div className="absolute inset-0 flex items-center justify-center p-4">
                {right.useLogo && right.logo ? <img src={right.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-2xl" />
                  : <h2 className="text-xl md:text-5xl font-black uppercase truncate tracking-tighter text-center w-full leading-snug px-2" style={{ color: right.color }}>{right.name}</h2>}
              </div>
            </div>
            <GestureArea className="w-full flex-none h-[40%] flex flex-col items-center justify-center relative group p-0 overflow-hidden" style={{ flex: 'none' }} onTap={() => modifyScore(right.key, 1)} onSwipeRight={() => modifyScore(right.key, -1)}>
              {!tvMode && <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-50 transition-opacity"><ChevronRight size={40} /></div>}
              <span className="font-bold leading-none select-none tabular-nums relative z-10" style={{ fontSize: 'clamp(4.5rem, 20vw, 16rem)', color: right.color }}>{right.score}</span>
            </GestureArea>
            <div className="w-full flex-none h-[20%] grid grid-cols-1 overflow-hidden" style={{ flex: 'none', backgroundColor: 'rgba(128,128,128,0.05)' }}>
              {config.showSets && <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t group relative pt-2 md:pt-4" style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} onTap={() => modifySets(right.key, 1)} onSwipeRight={() => modifySets(right.key, -1)}><div className="flex flex-row items-center justify-center h-full w-full gap-2"><span className="text-xs md:text-lg font-bold uppercase opacity-50 tracking-wider">Sets</span><div className="text-3xl md:text-5xl font-bold leading-none tabular-nums" style={{ color: right.color }}>{right.sets}</div></div></GestureArea>}
              {config.showFouls && <GestureArea className="h-full w-full flex flex-col items-center justify-start border-t group relative transition-colors pt-2 md:pt-4" style={{ borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} onTap={() => modifyFouls(right.key, 1)} onSwipeRight={() => modifyFouls(right.key, -1)} onLongPress={() => addExclusion(right.key)}><div className="flex flex-row items-center justify-center h-full w-full gap-2"><span className={`text-xs md:text-base font-bold uppercase tracking-wider flex items-center gap-1 ${right.fouls >= config.foulLimit ? 'text-red-500' : 'opacity-50'}`}>Fautes {right.fouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}</span><div className={`text-2xl md:text-5xl font-bold leading-none tabular-nums ${right.fouls >= config.foulLimit ? 'text-red-500' : ''}`}>{right.fouls}</div></div></GestureArea>}
            </div>
          </div>
        </div>

      </div>

      {!tvMode && (
        <div className="py-2 px-4 border-t flex justify-center items-center gap-6 text-[10px] md:text-sm w-full shrink-0"
          style={{ backgroundColor: 'rgba(128,128,128,0.05)', borderColor: textColor === '#ffffff' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
          <div className="flex items-center gap-2"><span className="font-bold opacity-70">SCORES/FAUTES/SETS :</span><span className="flex items-center gap-1 px-2 py-1 rounded border opacity-70" style={{ borderColor: 'inherit' }}>Tap <MousePointerClick size={14} /> +1</span><span className="flex items-center gap-1 px-2 py-1 rounded border opacity-70" style={{ borderColor: 'inherit' }}>Slide <ChevronRight size={14} /> -1</span></div>
          <div className="w-px h-4 bg-zinc-700"></div>
          <div className="flex items-center gap-2"><span className="font-bold opacity-70">MÉDIA (TV) :</span><span className="flex items-center gap-1 px-2 py-1 rounded border opacity-70" style={{ borderColor: 'inherit' }}>Long Press Période</span></div>
        </div>
      )}
    </div>
  );
};

export default App;