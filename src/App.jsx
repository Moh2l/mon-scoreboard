import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Monitor, Smartphone, Trophy, Minimize, Maximize, ChevronLeft, ChevronRight, AlertCircle, Upload, Type, Image as ImageIcon, ArrowLeft, ArrowRight, Plus, Minus } from 'lucide-react';

const SPORTS_CONFIG = {
  football: { name: "Football", periodName: "Mi-temps", periods: 2, timePerPeriod: 45, countDirection: "up", showSets: false, showFouls: false, foulLimit: 0 },
  basketball: { name: "Basketball", periodName: "Q-Temps", periods: 4, timePerPeriod: 10, countDirection: "down", showSets: false, showFouls: true, foulLimit: 5 },
  volleyball: { name: "Volleyball", periodName: "Set", periods: 5, timePerPeriod: 0, countDirection: "none", showSets: true, showFouls: false, foulLimit: 0 },
  futsal: { name: "Futsal", periodName: "Mi-temps", periods: 2, timePerPeriod: 20, countDirection: "down", showSets: false, showFouls: true, foulLimit: 5 },
  handball: { name: "Handball", periodName: "Mi-temps", periods: 2, timePerPeriod: 30, countDirection: "down", showSets: false, showFouls: false, foulLimit: 0 },
  tennis: { name: "Tennis", periodName: "Set", periods: 3, timePerPeriod: 0, countDirection: "up", showSets: true, showFouls: false, foulLimit: 0 }
};

// --- GESTION TACTILE ---
const GestureArea = ({ children, onTap, onSwipeLeft, onSwipeRight, className, style, disabled = false, isTimer = false }) => {
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const elementRef = useRef(null);

  const handleContextMenu = (e) => { e.preventDefault(); e.stopPropagation(); return false; };

  useEffect(() => {
    const el = elementRef.current;
    if (el) {
      const preventDefault = (e) => e.preventDefault();
      el.addEventListener('touchmove', preventDefault, { passive: false });
      el.addEventListener('contextmenu', handleContextMenu);
      return () => { el.removeEventListener('touchmove', preventDefault); el.removeEventListener('contextmenu', handleContextMenu); };
    }
  }, []);

  const handleTouchStart = (e) => { if (disabled) return; touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };

  const handleTouchEnd = (e) => {
    if (disabled || !touchStartX.current) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0 && onSwipeLeft) onSwipeLeft(); else if (diffX > 0 && onSwipeRight) onSwipeRight();
    } else if (Math.abs(diffX) < 30 && Math.abs(diffY) < 30 && onTap) {
      if(e.cancelable) e.preventDefault(); onTap();
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

const ScoreboardV39 = () => {
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
            if (prev <= 0) { setIsRunning(false); return 0; }
            return prev - 1;
          } else if (config.countDirection === 'up') return prev + 1;
          return prev;
        });
      }, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning, config.countDirection]);

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
    if (!isNaN(newLimit) && newLimit > 0) {
        setConfig(prev => ({ ...prev, foulLimit: newLimit }));
    }
  };

  const modifyScore = (team, delta) => { if (team === 'home') setHomeScore(Math.max(0, homeScore + delta)); else setAwayScore(Math.max(0, awayScore + delta)); };
  const modifySets = (team, delta) => { if (team === 'home') setHomeSets(Math.max(0, homeSets + delta)); else setAwaySets(Math.max(0, awaySets + delta)); };
  const modifyFouls = (team, delta) => { if (team === 'home') setHomeFouls(Math.max(0, homeFouls + delta)); else setAwayFouls(Math.max(0, awayFouls + delta)); };
  const modifyPeriod = (delta) => setPeriod(Math.max(1, period + delta));
  const toggleTimer = () => { if (config.countDirection !== 'none') setIsRunning(prev => !prev); };
  const setService = (side) => setServiceSide(side);
  const toggleService = () => setServiceSide(prev => prev === 'home' ? 'away' : 'home');

  return (
    // CONTENEUR PRINCIPAL
    <div className={`h-screen w-screen overflow-hidden flex flex-col font-sans select-none transition-colors duration-500 ${tvMode ? 'bg-black items-center justify-center' : 'bg-slate-950'}`}>
      
      {/* HEADER */}
      {!tvMode && (
        <div className="h-14 w-full bg-slate-900 border-b border-slate-800 flex justify-between items-center px-4 shrink-0 z-20 shadow-lg">
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            <select value={sport} onChange={(e) => setSport(e.target.value)} className="bg-slate-800 text-sm font-bold border-none rounded focus:ring-2 ring-indigo-500 py-1 text-white">
              {Object.keys(SPORTS_CONFIG).map(k => <option key={k} value={k}>{SPORTS_CONFIG[k].name}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
             <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300"><Settings size={18} /></button>
             <button onClick={() => toggleTvMode(true)} className="flex items-center gap-2 bg-indigo-600 px-3 py-1 rounded text-sm font-bold text-white hover:bg-indigo-500 transition-colors shadow-lg animate-pulse">
               <Monitor size={16} /> Mode Cast
             </button>
          </div>
        </div>
      )}

      {/* BOUTON RETOUR */}
      {tvMode && (
        <button 
          onClick={() => toggleTvMode(false)} 
          className="absolute top-2 left-1/2 -translate-x-1/2 z-50 p-3 bg-white/10 text-white/30 hover:bg-slate-800 hover:text-white rounded-full transition-all backdrop-blur-md"
          title="Quitter le mode TV"
        >
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
              
              {/* DURÉE */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <label className="block text-xs uppercase text-slate-400 font-bold mb-2">Durée Période (Minutes)</label>
                <div className="flex items-center gap-4 justify-center bg-slate-800 p-2 rounded border border-slate-600">
                    <button 
                        onClick={() => handleTimeChange(config.timePerPeriod - 1)} 
                        className="p-2 hover:bg-slate-700 rounded text-white transition-colors"
                    >
                        <Minus size={24}/>
                    </button>
                    <span className="text-3xl font-bold w-20 text-center tabular-nums">{config.timePerPeriod}</span>
                    <button 
                        onClick={() => handleTimeChange(config.timePerPeriod + 1)} 
                        className="p-2 hover:bg-slate-700 rounded text-white transition-colors"
                    >
                        <Plus size={24}/>
                    </button>
                </div>
              </div>

              {/* SEUIL FAUTES */}
              {config.showFouls && (
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <label className="block text-xs uppercase text-slate-400 font-bold mb-2 flex items-center gap-2">
                        <AlertCircle size={14} className="text-red-500"/> Alerte Fautes à :
                    </label>
                    <div className="flex items-center gap-4 justify-center bg-slate-800 p-2 rounded border border-slate-600">
                        <button onClick={() => handleFoulLimitChange(config.foulLimit - 1)} className="p-2 hover:bg-slate-700 rounded text-white transition-colors"><Minus size={24}/></button>
                        <span className="text-3xl font-bold w-20 text-center tabular-nums text-red-400">{config.foulLimit}</span>
                        <button onClick={() => handleFoulLimitChange(config.foulLimit + 1)} className="p-2 hover:bg-slate-700 rounded text-white transition-colors"><Plus size={24}/></button>
                    </div>
                </div>
              )}

              {/* HOME TEAM */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs uppercase text-slate-400 font-bold" style={{color: homeColor}}>Équipe Domicile</label>
                    <div className="flex bg-slate-800 rounded p-1">
                        <button onClick={() => setUseHomeLogo(false)} className={`p-1 rounded ${!useHomeLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><Type size={16}/></button>
                        <button onClick={() => setUseHomeLogo(true)} className={`p-1 rounded ${useHomeLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><ImageIcon size={16}/></button>
                    </div>
                </div>
                {!useHomeLogo ? (
                    <input value={homeName} onChange={e => setHomeName(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-600 mb-2" placeholder="Nom Équipe"/>
                ) : (
                    <div className="flex gap-2 items-center">
                        <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-600 flex items-center justify-center gap-2 text-sm text-slate-300"><Upload size={16}/> Choisir logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'home')}/></label>
                        {homeLogo && <img src={homeLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded"/>}
                    </div>
                )}
                <input type="color" value={homeColor} onChange={e => setHomeColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2"/>
              </div>

              {/* AWAY TEAM */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs uppercase text-slate-400 font-bold" style={{color: awayColor}}>Équipe Visiteur</label>
                    <div className="flex bg-slate-800 rounded p-1">
                        <button onClick={() => setUseAwayLogo(false)} className={`p-1 rounded ${!useAwayLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><Type size={16}/></button>
                        <button onClick={() => setUseAwayLogo(true)} className={`p-1 rounded ${useAwayLogo ? 'bg-indigo-600' : 'text-slate-400'}`}><ImageIcon size={16}/></button>
                    </div>
                </div>
                {!useAwayLogo ? (
                    <input value={awayName} onChange={e => setAwayName(e.target.value)} className="w-full bg-slate-800 p-2 rounded border border-slate-600 mb-2" placeholder="Nom Équipe"/>
                ) : (
                    <div className="flex gap-2 items-center">
                        <label className="flex-1 cursor-pointer bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-600 flex items-center justify-center gap-2 text-sm text-slate-300"><Upload size={16}/> Choisir logo...<input type="file" accept="image/*" className="hidden" onChange={(e) => handleLogoUpload(e, 'away')}/></label>
                        {awayLogo && <img src={awayLogo} alt="Preview" className="h-10 w-10 object-contain bg-black/20 rounded"/>}
                    </div>
                )}
                <input type="color" value={awayColor} onChange={e => setAwayColor(e.target.value)} className="w-full h-8 rounded cursor-pointer mt-2"/>
              </div>
            </div>
            <div className="p-4 border-t border-slate-700">
                <button onClick={() => setShowSettings(false)} className="w-full bg-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-500">Valider & Retour</button>
            </div>
          </div>
        </div>
      )}

      {/* --- WRAPPER PRINCIPAL --- */}
      <div className={`transition-all duration-500 relative flex flex-col bg-slate-950 text-white
          ${tvMode 
              ? 'w-full aspect-video max-h-screen shadow-2xl border border-slate-800' 
              : 'w-full h-full flex-1'
          }`}
      >
        
        {/* GRILLE PRINCIPALE */}
        <div className="flex-1 w-full relative grid grid-cols-[1fr_minmax(220px,30%)_1fr]">
          
          {/* === HOME (GAUCHE) === */}
          {/* CORRECTION : Suppression de border-r pour harmonisation */}
          <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden">
            
            {/* [40% HAUT : LOGO/NOM] */}
            <div className="w-full shrink-0 flex flex-col" style={{ height: '40%' }}>
               {/* Barre de couleur */}
               <div className="h-1 w-full shrink-0" style={{backgroundColor: homeColor}}></div>
               
               {/* Conteneur Logo/Nom - Padding harmonisé à p-0 */}
               <div className="flex-1 w-full flex items-center justify-center p-0 overflow-hidden">
                  {useHomeLogo && homeLogo ? (
                      <div className="w-full h-full flex justify-center items-center">
                          <img src={homeLogo} alt="Home Logo" className="max-h-full max-w-full object-contain drop-shadow-2xl" />
                      </div>
                   ) : (
                      <h2 className="text-xl md:text-4xl font-black uppercase truncate tracking-tighter text-center w-full px-2 leading-snug" style={{color: homeColor}}>{homeName}</h2>
                   )}
               </div>
            </div>

            {/* [45% MILIEU : SCORE] */}
            <GestureArea 
                className="w-full flex flex-col items-center justify-center relative group p-0" 
                style={{ height: '45%' }}
                onSwipeLeft={() => modifyScore('home', 1)} 
                onSwipeRight={() => modifyScore('home', -1)}
            >
               {!tvMode && (
                 <>
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/5 group-hover:text-white/20 transition-colors"><ChevronLeft size={40}/></div>
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/5 group-hover:text-white/20 transition-colors"><ChevronRight size={40}/></div>
                 </>
               )}
               <span 
                 className="font-bold leading-none select-none tabular-nums relative z-10" 
                 style={{ 
                    // Harmonisation: utilise les mêmes paramètres que celui de droite
                    fontSize: 'clamp(3.5rem, 24vh, 15rem)', 
                    textShadow: `0 0 50px ${homeColor}30` 
                 }}
               >
                 {homeScore}
               </span>
            </GestureArea>

            {/* [15% BAS : SETS/FAUTES] */}
            <div className="w-full shrink-0 grid grid-cols-1 pb-2" style={{ height: '15%', minHeight: '40px' }}>
              {config.showSets && (
                <GestureArea className="h-full w-full flex flex-col items-center justify-center bg-slate-900/30 border-t border-slate-800/50 group relative" onTap={() => modifySets('home', 1)} onSwipeLeft={() => modifySets('home', 1)} onSwipeRight={() => modifySets('home', -1)}>
                   {/* HARMONISATION : Structure "Côte à Côte" identique à Fautes */}
                  <div className="flex items-center justify-center gap-2 leading-tight h-full">
                    <span className="text-[10px] md:text-xs font-bold uppercase text-slate-500">Sets</span>
                    <div className="text-2xl md:text-3xl font-bold px-2 rounded border-2 leading-none bg-slate-800 border-transparent">{homeSets}</div>
                  </div>
                </GestureArea>
              )}
              {config.showFouls && (
                <GestureArea 
                    className="h-full w-full flex flex-col items-center justify-center border-t border-slate-800/50 group relative transition-colors" 
                    onSwipeLeft={() => modifyFouls('home', 1)} onSwipeRight={() => modifyFouls('home', -1)}
                >
                  <div className="flex items-center justify-center gap-2 leading-tight">
                    <span className={`text-[10px] md:text-xs font-bold uppercase ${homeFouls >= config.foulLimit ? 'text-red-200' : 'text-slate-500'}`}>Fautes</span>
                    <div className={`text-2xl font-bold px-2 rounded border-2 leading-none ${homeFouls >= config.foulLimit ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-transparent'}`}>{homeFouls}</div>
                    {homeFouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}
                  </div>
                </GestureArea>
              )}
            </div>
          </div>

          {/* === CENTRE (Inchangé) === */}
          <div className="h-full flex flex-col justify-center items-center relative z-10 bg-slate-950 border-x border-slate-900">
            <GestureArea className="mb-1 md:mb-2 text-center w-full py-1 md:py-2 hover:bg-slate-900/50 rounded-xl group relative" onSwipeLeft={() => modifyPeriod(1)} onSwipeRight={() => modifyPeriod(-1)}>
              <span className="block text-slate-500 text-[10px] md:text-sm uppercase font-bold tracking-[0.2em] mb-0.5">{config.periodName}</span>
              <div className="flex items-center justify-center gap-4">
                 {!tvMode && <Minimize size={16} className="text-slate-700"/>}
                 <span className="text-4xl md:text-7xl font-bold text-white select-none">{period}</span>
                 {!tvMode && <Maximize size={16} className="text-slate-700"/>}
              </div>
            </GestureArea>

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
              <GestureArea className="w-full px-2 py-1 md:py-2" isTimer={true} onTap={toggleTimer}>
                  <div className={`bg-black rounded-3xl border-4 shadow-2xl py-2 md:py-8 text-center relative overflow-hidden transition-all duration-75 ${isRunning ? 'border-green-600 shadow-green-900/40' : 'border-red-900/50 shadow-red-900/20'} ${config.countDirection === 'none' ? 'opacity-20 grayscale border-slate-800' : ''}`}>
                  <span className={`font-mono font-bold tabular-nums leading-none transition-colors ${isRunning ? 'text-green-400' : 'text-red-500'}`} style={{ fontSize: 'clamp(2rem, 6vw, 6rem)' }}>{formatTime(timeLeft)}</span>
                  {!isRunning && config.countDirection !== 'none' && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><div className="bg-red-600/20 p-3 rounded-full backdrop-blur-sm animate-pulse"><Play size={40} className="text-white fill-white" /></div></div>}
                  </div>
              </GestureArea>
            )}

            {!tvMode && sport !== 'volleyball' && config.countDirection !== 'none' && (
               <div className="mt-1 md:mt-2 flex flex-col gap-2 w-full px-4">
                  <div className="grid grid-cols-2 gap-2 w-full">
                      <button onClick={() => setTimeLeft(t => Math.max(0, t - 1))} className="px-1 py-1 md:px-2 md:py-2 bg-slate-900 rounded hover:bg-slate-800 text-[10px] text-slate-400 font-bold border border-slate-800">-1s</button>
                      <button onClick={() => setTimeLeft(t => t + 1)} className="px-1 py-1 md:px-2 md:py-2 bg-slate-900 rounded hover:bg-slate-800 text-[10px] text-slate-400 font-bold border border-slate-800">+1s</button>
                      <button onClick={() => setTimeLeft(t => Math.max(0, t - 5))} className="px-1 py-1 md:px-2 md:py-2 bg-slate-900 rounded hover:bg-slate-800 text-[10px] text-slate-400 font-bold border border-slate-800">-5s</button>
                      <button onClick={() => setTimeLeft(t => t + 5)} className="px-1 py-1 md:px-2 md:py-2 bg-slate-900 rounded hover:bg-slate-800 text-[10px] text-slate-400 font-bold border border-slate-800">+5s</button>
                  </div>
               </div>
            )}
            {!tvMode && (
               <div className="mt-1 md:mt-2 w-full px-6"><button onClick={resetGame} className="flex items-center justify-center gap-2 py-2 md:py-3 w-full rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-red-900/20 transition-colors"><RotateCcw size={16}/> <span className="text-xs font-bold uppercase">Reset</span></button></div>
            )}
          </div>

          {/* === VISITEUR (DROITE) === */}
          {/* CORRECTION : Suppression de border-l pour harmonisation */}
          <div className="h-full flex flex-col bg-gradient-to-bl from-slate-900 to-slate-950 relative overflow-hidden">
            {/* BARRE DE COULEUR */}
            <div className="h-1 w-full shrink-0" style={{backgroundColor: awayColor}}></div>
            
            {/* ZONE HAUTE : FIXE 40% */}
            <div className="w-full shrink-0 flex items-center justify-center p-0 overflow-hidden" style={{ height: '40%' }}>
               {useAwayLogo && awayLogo ? (
                  <div className="w-full h-full flex justify-center items-center">
                      <img src={awayLogo} alt="Away Logo" className="max-h-full max-w-full object-contain drop-shadow-2xl" />
                  </div>
               ) : (
                  <h2 className="text-xl md:text-4xl font-black uppercase truncate tracking-tighter text-center w-full px-2" style={{color: awayColor}}>{awayName}</h2>
               )}
            </div>

            {/* ZONE SCORE : FIXE 45% */}
            <GestureArea 
                className="w-full flex flex-col items-center justify-center relative group p-0" 
                style={{ height: '45%' }}
                onSwipeLeft={() => modifyScore('away', 1)} 
                onSwipeRight={() => modifyScore('away', -1)}
            >
               {!tvMode && (
                 <>
                   <div className="absolute left-2 top-1/2 -translate-y-1/2 text-white/5 group-hover:text-white/20 transition-colors"><ChevronLeft size={40}/></div>
                   <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/5 group-hover:text-white/20 transition-colors"><ChevronRight size={40}/></div>
                 </>
               )}
               <span 
                  className="font-bold leading-none select-none tabular-nums relative z-10" 
                  style={{ 
                     fontSize: 'clamp(3.5rem, 24vh, 15rem)', 
                     textShadow: `0 0 50px ${awayColor}30` 
                  }}
               >
                   {awayScore}
               </span>
            </GestureArea>

            {/* ZONE BASSE : FIXE 15% */}
            <div className="w-full shrink-0 grid grid-cols-1 pb-2" style={{ height: '15%', minHeight: '40px' }}>
              {config.showSets && (
                <GestureArea className="h-full w-full flex flex-col items-center justify-center bg-slate-900/30 border-t border-slate-800/50 group relative" onTap={() => modifySets('away', 1)} onSwipeLeft={() => modifySets('away', 1)} onSwipeRight={() => modifySets('away', -1)}>
                  <div className="flex items-center justify-center gap-2 leading-tight h-full">
                    <span className="text-[10px] md:text-xs font-bold uppercase text-slate-500">Sets</span>
                    <div className="text-2xl md:text-3xl font-bold px-2 rounded border-2 leading-none bg-slate-800 border-transparent">{awaySets}</div>
                  </div>
                </GestureArea>
              )}
              {config.showFouls && (
                <GestureArea 
                    className="h-full w-full flex flex-col items-center justify-center border-t border-slate-800/50 group relative transition-colors" 
                    onSwipeLeft={() => modifyFouls('away', 1)} onSwipeRight={() => modifyFouls('away', -1)}
                >
                  <div className="flex items-center justify-center gap-2 leading-tight">
                    <span className={`text-[10px] md:text-xs font-bold uppercase ${awayFouls >= config.foulLimit ? 'text-red-200' : 'text-slate-500'}`}>Fautes</span>
                    <div className={`text-2xl font-bold px-2 rounded border-2 leading-none ${awayFouls >= config.foulLimit ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-transparent'}`}>{awayFouls}</div>
                    {awayFouls >= config.foulLimit && <AlertCircle size={14} className="text-red-500" />}
                  </div>
                </GestureArea>
              )}
            </div>
          </div>
        </div>

      </div>

      {!tvMode && (
        <div className="bg-slate-900 py-2 px-4 border-t border-slate-800 flex justify-center items-center gap-6 text-[10px] md:text-sm text-slate-400 w-full shrink-0">
           <div className="flex items-center gap-2"><span className="font-bold text-slate-300">SCORES :</span><span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">Slide <ChevronLeft size={14}/> +1</span><span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">Slide <ChevronRight size={14}/> -1</span></div>
           <div className="w-px h-4 bg-slate-700"></div>
           <div className="flex items-center gap-2"><span className="font-bold text-slate-300">ACTION :</span><span className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">Tap Court</span></div>
        </div>
      )}
    </div>
  );
};

export default ScoreboardV39;