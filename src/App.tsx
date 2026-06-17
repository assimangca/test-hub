import React, { useState, useCallback } from 'react';
import { GameAction, TMConfig } from './types';
import GameCanvas from './components/GameCanvas';
import TeachableController from './components/TeachableController';
import { 
  Gamepad2, 
  HelpCircle, 
  BookOpen, 
  ExternalLink,
  Milestone,
  Settings,
  Sparkles,
  Layers,
  ArrowRight,
  Tv,
  ListOrdered
} from 'lucide-react';

export default function App() {
  // Game Actions triggered via Teachable Machine predictions
  const [activeActions, setActiveActions] = useState<Record<GameAction, boolean>>({
    [GameAction.MOVE_LEFT]: false,
    [GameAction.MOVE_RIGHT]: false,
    [GameAction.JUMP]: false,
    [GameAction.CROUCH]: false,
    [GameAction.NEUTRAL]: false,
  });

  // Track the configuration state globally
  const [tmConfig, setTmConfig] = useState<TMConfig>({
    modelUrl: '/model/',
    status: 'idle',
    errorMsg: null,
    classes: ['happy', 'sad', 'angry', 'disgust'],
    mappings: {
      happy: GameAction.JUMP,
      sad: GameAction.CROUCH,
      angry: GameAction.MOVE_LEFT,
      disgust: GameAction.MOVE_RIGHT,
    },
    threshold: 82,
    smoothingHistory: 3,
    isCameraActive: false
  });

  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showSetupGuide, setShowSetupGuide] = useState<boolean>(true);

  const handleActiveActionsChange = useCallback((actions: Record<GameAction, boolean>) => {
    setActiveActions(actions);
  }, []);

  const updateTmConfig = useCallback((updater: (prev: TMConfig) => TMConfig) => {
    setTmConfig(prev => updater(prev));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d15] text-white flex flex-col font-mono selection:bg-[#00ff9d] selection:text-[#0d0d15] select-none">
      
      {/* GLOBAL LOGO HEADER (Matching Sleek OS layout) */}
      <header className="border-b-4 border-[#2d2d44] bg-[#0d0d15] sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[#6b7280] text-[10px] uppercase tracking-[0.3em] font-bold">
              Experimental Build v1.0.4
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-[#00ff9d] mt-1 flex items-center space-x-2">
              <span>GESTURE_RUNNER.OS</span>
              <span className="w-2 h-5 bg-emerald-400 animate-pulse inline-block" />
            </h1>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowSetupGuide(!showSetupGuide)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-2 transition-all cursor-pointer ${
                showSetupGuide 
                  ? 'bg-[#00ff9d]/10 border-[#00ff9d] text-[#00ff9d] shadow-[0_0_10px_rgba(0,255,157,0.15)]' 
                  : 'bg-[#161625] border-[#2d2d44] hover:border-[#4a4a6a] text-slate-400'
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showSetupGuide ? 'MUTE GUIDE' : 'INFO GUIDE'}</span>
              </span>
            </button>
            
            <a 
              href="https://teachablemachine.withgoogle.com/train/image" 
              target="_blank" 
              rel="noreferrer"
              className="bg-[#161625] hover:bg-black border-2 border-[#2d2d44] hover:border-[#00ff9d] text-[#00ff9d] px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all"
            >
              <span>Build Model</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* INTERACTIVE GUIDE (Sleek design overlay with neon accents) */}
        {showSetupGuide && (
          <div className="relative bg-[#161625] border-4 border-[#2d2d44] p-5 shadow-2xl space-y-4 animate-fade-in overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#00ff9d 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            
            <div className="flex items-start space-x-3 relative z-10">
              <Sparkles className="text-[#00ff9d] w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#00ff9d]">
                  SYSTEM PROTOCOL: WEBCAM CONTROLS
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Configure local gesture translation to pilot the 8-bit runner terminal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 relative z-10">
              <div className="bg-black/50 border-2 border-[#2d2d44] hover:border-[#00ff9d]/30 p-3 shadow-md space-y-1 transition-all">
                <div className="text-[9px] uppercase font-bold text-[#ff2e63]">PHASE 01</div>
                <h4 className="text-xs font-bold text-[#00ff9d]">Prepare Postures</h4>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Plan clear spatial poses for Left, Right, & Jump. Make them visually distinct!
                </p>
              </div>

              <div className="bg-black/50 border-2 border-[#2d2d44] hover:border-[#00ff9d]/30 p-3 shadow-md space-y-1 transition-all">
                <div className="text-[9px] uppercase font-bold text-[#ff2e63]">PHASE 02</div>
                <h4 className="text-xs font-bold text-[#00ff9d]">Collect Samples</h4>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Record image collections in Teachable Machine and click "Train Model" of image.
                </p>
              </div>

              <div className="bg-black/50 border-2 border-[#2d2d44] hover:border-[#00ff9d]/30 p-3 shadow-md space-y-1 transition-all">
                <div className="text-[9px] uppercase font-bold text-[#ff2e63]">PHASE 03</div>
                <h4 className="text-xs font-bold text-[#00ff9d]">Deploy Export link</h4>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Click 'Shareable URL' once trained to copy cloud URL. Set bindings in the calibration panel.
                </p>
              </div>

              <div className="bg-black/50 border-2 border-[#2d2d44] hover:border-[#00ff9d]/30 p-3 shadow-md space-y-1 transition-all">
                <div className="text-[9px] uppercase font-bold text-[#ff2e63]">PHASE 04</div>
                <h4 className="text-xs font-bold text-[#00ff9d]">Bind Webcam</h4>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  Enable camera monitoring, tune threshold confidence filter, and collect coins!
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center text-[10px] text-[#00ff9d] bg-black/80 px-3 py-2 border border-[#2d2d44] self-start font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] mr-2 animate-ping" />
              <span>KEYBOARD BACKUP: Use arrow keys or WASD anytime for physical validation override.</span>
            </div>
          </div>
        )}

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: WORLD DISPLAY TERMINAL */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <GameCanvas
              activeActions={activeActions}
              selectedLevelId={selectedLevelId}
              onLevelSelect={setSelectedLevelId}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
            />

            {/* STATUS DIODES COMPASS */}
            <div className="bg-[#161625] border-4 border-[#2d2d44] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-4 text-slate-400">
              <div className="flex items-center space-x-3">
                <div className="bg-black p-2 border border-[#2d2d44] text-[#00ff9d]">
                  <Tv className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-[#00ff9d] text-[11px] uppercase tracking-wide">SYSTEM COORDINATES</h4>
                  <p className="text-[10px] text-slate-400 font-sans">Accumulate gold vectors to unlock the portal key safely.</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 ml-auto sm:ml-0 font-mono">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-slate-500">STAGE SELECT</p>
                  <p className="text-white font-bold text-[11px]">WORLD_0{selectedLevelId}</p>
                </div>
                <div className="w-1 h-6 bg-[#2d2d44]" />
                <div className="text-left font-mono">
                  <p className="text-[9px] uppercase font-bold text-slate-500">SECTOR COIN REQ</p>
                  <p className="text-[#facc15] font-bold text-[11px]">
                    {selectedLevelId === 1 ? '5' : selectedLevelId === 2 ? '6' : '8'}_UNITS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: CONTROLLER & SIGNAL STATISTICS */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <TeachableController
              config={tmConfig}
              onConfigChange={updateTmConfig}
              onActiveActionsChange={handleActiveActionsChange}
            />

            {/* EXTRA INFOBOX */}
            <div className="bg-[#161625] border-4 border-[#2d2d44] p-4 text-xs text-slate-400 space-y-3">
              <div className="flex items-center space-x-2 text-white font-bold border-b border-[#2d2d44] pb-2">
                <Milestone className="w-3.5 h-3.5 text-[#00ff9d]" />
                <span className="uppercase text-[10px] tracking-widest text-[#00ff9d] font-bold">ML_DEVIATION_LOG</span>
              </div>
              <ul className="space-y-2 text-[10px] list-none p-0 font-sans">
                <li className="flex items-start space-x-2">
                  <span className="text-[#00ff9d] mt-0.5">◼</span>
                  <span><b>CORS-Ready Assets:</b> Streamlined endpoints handle client-side weights fetch seamlessly.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#00ff9d] mt-0.5">◼</span>
                  <span><b>Dynamic Inference:</b> Mappings align on-the-fly and output signals directly to keycodes.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#00ff9d] mt-0.5">◼</span>
                  <span><b>Zero Latency:</b> Runs completely within the local viewport. No server hop delays.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="border-t-4 border-[#2d2d44] mt-auto py-5 bg-[#0d0d15] text-xs text-center text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] uppercase font-bold tracking-wider">
            &copy; 2026 GESTURE_RUNNER.OS | POWERED BY TENSORFLOW.JS 
          </p>
          <div className="flex items-center space-x-4 text-[10px] text-slate-600">
            <span>MODEL: GEMINI_3.5_FLASH</span>
            <span className="text-[#2d2d44]">|</span>
            <span className="text-[#00ff9d] font-bold">STATUS: ENCRYPTED_LOCAL</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
