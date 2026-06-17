import React, { useState, useEffect, useRef } from 'react';
import { TMConfig, GameAction } from '../types';
import { Camera, Volume2, HelpCircle, RefreshCw, Layers, Sliders, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface TeachableControllerProps {
  config: TMConfig;
  onConfigChange: (updater: (prev: TMConfig) => TMConfig) => void;
  onActiveActionsChange: (actions: Record<GameAction, boolean>) => void;
}

export default function TeachableController({
  config,
  onConfigChange,
  onActiveActionsChange
}: TeachableControllerProps) {
  const [modelClasses, setModelClasses] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Array<{ className: string; probability: number }>>([]);
  const [customClassInput, setCustomClassInput] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<any>(null);

  // Sound effects
  const playConfigChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {}
  };

  // Setup scripts & camera
  const loadTMScripts = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).tmImage && (window as any).tf) {
        resolve((window as any).tmImage);
        return;
      }
      
      const tfScript = document.createElement('script');
      tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js";
      tfScript.async = true;
      tfScript.onload = () => {
        const tmScript = document.createElement('script');
        tmScript.src = "https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.5/dist/teachablemachine-image.min.js";
        tmScript.async = true;
        tmScript.onload = () => {
          resolve((window as any).tmImage);
        };
        tmScript.onerror = () => reject(new Error("Failed to load Teachable Machine library"));
        document.head.appendChild(tmScript);
      };
      tfScript.onerror = () => reject(new Error("Failed to load TensorFlow.js library"));
      document.head.appendChild(tfScript);
    });
  };

  // Camera toggle helper
  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      onConfigChange(prev => ({ ...prev, isCameraActive: true }));
    } catch (err: any) {
      console.error("Camera access failed:", err);
      onConfigChange(prev => ({ 
        ...prev, 
        isCameraActive: false,
        errorMsg: `Webcam access denied: ${err.message}` 
      }));
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    onConfigChange(prev => ({ ...prev, isCameraActive: false }));
  };

  // Enable / disable camera on toggle
  useEffect(() => {
    if (config.isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [config.isCameraActive]);

  // Load Teachable Machine Model
  const handleLoadModel = async () => {
    if (!config.modelUrl.trim()) return;
    
    let finalUrl = config.modelUrl.trim();
    if (!finalUrl.endsWith('/')) {
      finalUrl += '/';
    }

    onConfigChange(prev => ({ ...prev, status: 'loading', errorMsg: null }));

    try {
      const tmImage = await loadTMScripts();
      const modelURL = finalUrl + "model.json";
      const metadataURL = finalUrl + "metadata.json";
      
      const loadedModel = await tmImage.load(modelURL, metadataURL);
      modelRef.current = loadedModel;
      
      const labels = loadedModel.getClassLabels();
      setModelClasses(labels);
      
      const initialMappings: Record<string, GameAction> = {};
      const actionsOrder = [GameAction.NEUTRAL, GameAction.JUMP, GameAction.MOVE_LEFT, GameAction.MOVE_RIGHT];
      
      labels.forEach((label: string, idx: number) => {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('jump') || lowerLabel.includes('up')) {
          initialMappings[label] = GameAction.JUMP;
        } else if (lowerLabel.includes('left')) {
          initialMappings[label] = GameAction.MOVE_LEFT;
        } else if (lowerLabel.includes('right')) {
          initialMappings[label] = GameAction.MOVE_RIGHT;
        } else if (lowerLabel.includes('idle') || lowerLabel.includes('neutral') || lowerLabel.includes('down') || lowerLabel.includes('stay')) {
          initialMappings[label] = GameAction.NEUTRAL;
        } else {
          initialMappings[label] = actionsOrder[idx % actionsOrder.length];
        }
      });

      onConfigChange(prev => ({
        ...prev,
        modelUrl: finalUrl,
        status: 'ready',
        classes: labels,
        mappings: initialMappings,
        errorMsg: null
      }));

      playConfigChime();
    } catch (err: any) {
      console.error(err);
      onConfigChange(prev => ({
        ...prev,
        status: 'error',
        errorMsg: `TM model load failure. Check server availability. Msg: ${err.message}`
      }));
    }
  };

  // Prediction Loop
  useEffect(() => {
    let active = true;
    let predictionInterval: any = null;

    const runPrediction = async () => {
      if (!active || !modelRef.current || !videoRef.current || !config.isCameraActive) return;

      try {
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const rawPredictions = await modelRef.current.predict(videoRef.current);
          
          if (active) {
            setPredictions(rawPredictions);
            
            const actionsState: Record<GameAction, boolean> = {
              [GameAction.MOVE_LEFT]: false,
              [GameAction.MOVE_RIGHT]: false,
              [GameAction.JUMP]: false,
              [GameAction.NEUTRAL]: false,
            };

            let bestClass = '';
            let highestProb = 0;

            rawPredictions.forEach((pred: { className: string; probability: number }) => {
              if (pred.probability > highestProb) {
                highestProb = pred.probability;
                bestClass = pred.className;
              }
            });

            if (highestProb >= config.threshold / 100) {
              const mappedAction = config.mappings[bestClass];
              if (mappedAction && mappedAction !== GameAction.NEUTRAL) {
                actionsState[mappedAction] = true;
              }
            }

            onActiveActionsChange(actionsState);
          }
        }
      } catch (err) {
        console.error("Prediction loop failed:", err);
      }
    };

    if (config.status === 'ready' && config.isCameraActive) {
      predictionInterval = setInterval(runPrediction, 70);
    }

    return () => {
      active = false;
      if (predictionInterval) {
        clearInterval(predictionInterval);
      }
    };
  }, [config.status, config.isCameraActive, config.mappings, config.threshold]);

  const handleAddManualClass = () => {
    if (!customClassInput.trim()) return;
    const newClass = customClassInput.trim();
    if (config.classes.includes(newClass)) return;

    onConfigChange(prev => {
      const updatedClasses = [...prev.classes, newClass];
      const updatedMappings = { ...prev.mappings, [newClass]: GameAction.NEUTRAL };
      return {
        ...prev,
        classes: updatedClasses,
        mappings: updatedMappings
      };
    });
    setCustomClassInput('');
    playConfigChime();
  };

  const handleMappingChange = (className: string, action: GameAction) => {
    onConfigChange(prev => ({
      ...prev,
      mappings: {
        ...prev.mappings,
        [className]: action
      }
    }));
    playConfigChime();
  };

  const tmPresets = [
    { name: "Default Hand Signs", url: "https://teachablemachine.withgoogle.com/models/v6H8mE2-n/" },
    { name: "Demo Model Poses", url: "https://teachablemachine.withgoogle.com/models/bPg3vT2-2/" }
  ];

  return (
    <div id="teachable-controller-panel" className="bg-[#161625] border-4 border-[#2d2d44] p-4 text-white font-mono shadow-2xl space-y-4">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b-2 border-[#2d2d44] pb-2">
        <div className="flex items-center space-x-2">
          <Camera className="text-[#00ff9d] w-5 h-5 animate-pulse" />
          <h2 className="text-xs font-black uppercase text-slate-100 tracking-widest">TM_INPUT_CONTROLLER</h2>
        </div>
        <div className="flex items-center space-x-1.5 bg-black px-2 py-0.5 rounded border border-[#2d2d44] text-[10px]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00ff9d]" />
          <span className="text-[#00ff9d] font-bold">CLIENT_ML_STABLE</span>
        </div>
      </div>

      {/* Model URL Input */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">
          Teachable Machine Model URL
        </label>
        <div className="flex space-x-2">
          <input
            id="tm-model-url-field"
            type="text"
            className="flex-1 bg-black border-2 border-[#2d2d44] rounded px-2.5 py-1.5 text-xs text-[#00ff9d] placeholder-slate-700 focus:outline-none focus:border-[#00ff9d] placeholder:font-mono"
            placeholder="Pasted shareable URL..."
            value={config.modelUrl}
            onChange={(e) => onConfigChange(prev => ({ ...prev, modelUrl: e.target.value }))}
          />
          <button
            id="tm-load-model-btn"
            onClick={handleLoadModel}
            disabled={config.status === 'loading'}
            className={`px-4 py-1.5 text-xs font-black rounded uppercase border-2 transition-all cursor-pointer ${
              config.status === 'loading'
                ? 'bg-[#2d2d44] border-black text-slate-500 cursor-not-allowed'
                : 'bg-black hover:bg-black/80 border-[#00ff9d] text-[#00ff9d] hover:shadow-[0_0_10px_rgba(0,255,157,0.2)]'
            }`}
          >
            {config.status === 'loading' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>Load_Mod</span>
            )}
          </button>
        </div>

        {/* Info alerts */}
        {config.errorMsg && (
          <div className="bg-[#ff2e63]/10 border-2 border-[#ff2e63]/40 text-[#ff2e63] p-2.5 rounded text-[10px] flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#ff2e63] flex-shrink-0 mt-0.5" />
            <span>{config.errorMsg}</span>
          </div>
        )}

        {config.status === 'ready' && (
          <div className="bg-[#00ff9d]/10 border-2 border-[#00ff9d]/40 text-[#00ff9d] p-2 rounded text-[10px] flex items-center space-x-1.5 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff9d] flex-shrink-0" />
            <span>METADATA_LOAD_SUCCESS ({config.classes.length} CLASS DETECTED)</span>
          </div>
        )}

        {/* Preset URLs */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[9px] text-[#6b7280] self-center mr-1 uppercase">Sample Pools:</span>
          {tmPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                onConfigChange(prev => ({ ...prev, modelUrl: preset.url }));
                setTimeout(() => handleLoadModel(), 100);
              }}
              className="text-[9px] bg-black hover:bg-[#161625] text-slate-300 px-2 py-0.5 rounded border border-[#2d2d44] hover:border-[#00ff9d] transition-all cursor-pointer font-bold"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Webcam panel & Gesture Mapping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* WEBCAM MONITOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">Webcam Monitor</span>
            <button
              id="webcam-power-btn"
              onClick={() => onConfigChange(prev => ({ ...prev, isCameraActive: !prev.isCameraActive }))}
              className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest border-2 transition-all cursor-pointer ${
                config.isCameraActive 
                  ? 'bg-[#ff2e63]/20 border-[#ff2e63] text-[#ff2e63] hover:bg-[#ff2e63]/30' 
                  : 'bg-[#00ff9d]/20 border-[#00ff9d] text-[#00ff9d] hover:bg-[#00ff9d]/30'
              }`}
            >
              {config.isCameraActive ? 'Power_Off' : 'Power_On'}
            </button>
          </div>

          <div className="relative border-4 border-[#2d2d44] bg-black rounded aspect-video flex items-center justify-center overflow-hidden group">
            {/* Real Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-all duration-300 ${
                config.isCameraActive ? 'opacity-85' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Scanline overlay effect */}
            {config.isCameraActive && (
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-15 z-10" />
            )}

            {/* Target circular radar helper specified in design HTML */}
            {config.isCameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-28 h-28 border-2 border-dashed border-[#00ff9d]/40 rounded-full animate-spin [animation-duration:15s]" />
                <div className="absolute w-8 h-8 border-t-2 border-l-2 border-[#00ff9d]/60 top-4 left-4" />
                <div className="absolute w-8 h-8 border-b-2 border-r-2 border-[#00ff9d]/60 bottom-4 right-4" />
              </div>
            )}

            {/* Camera off placeholder */}
            {!config.isCameraActive && (
              <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 z-10">
                <div className="bg-slate-900 border-2 border-[#2d2d44] p-2 rounded-full text-slate-500">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="text-[10px] text-slate-400">
                  <p className="font-bold text-slate-300">TM_FEED_INACTIVE</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">Await camera signal bind</p>
                </div>
              </div>
            )}

            {/* Detecting indicator */}
            {config.isCameraActive && config.status === 'ready' && (
              <div className="absolute top-2 left-2 bg-[#00ff9d] text-black text-[8px] px-1.5 py-0.5 rounded font-black tracking-wider flex items-center space-x-1 animate-pulse z-20">
                <span className="w-1 h-1 rounded-full bg-black block animate-ping" />
                <span>SIGNAL_INBOUND</span>
              </div>
            )}
          </div>
        </div>

        {/* CLASS MAPPINGS EDITOR */}
        <div className="space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest mb-2 font-mono">Gesture Bindings</span>
            
            {config.classes.length === 0 ? (
              <div className="bg-black/50 border border-[#2d2d44] rounded p-3 text-center text-[10px] text-slate-500 space-y-1.5">
                <Layers className="w-4 h-4 mx-auto text-slate-600" />
                <p className="font-bold text-slate-400 uppercase tracking-wider">Empty Class Vectors</p>
                <p className="text-[9px] text-slate-500">Pasting model URL auto-populates mappings.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
                {config.classes.map((className) => (
                  <div key={className} className="flex items-center justify-between bg-black border border-[#2d2d44] p-1.5 rounded">
                    <span className="text-[11px] font-bold text-slate-300 max-w-[90px] truncate">{className}</span>
                    <select
                      className="bg-[#161625] text-[10px] text-slate-200 border border-[#2d2d44] rounded px-1.5 py-0.5 focus:outline-none focus:border-[#00ff9d] cursor-pointer font-sans"
                      value={config.mappings[className] || GameAction.NEUTRAL}
                      onChange={(e) => handleMappingChange(className, e.target.value as GameAction)}
                    >
                      <option value={GameAction.NEUTRAL}>Neutral</option>
                      <option value={GameAction.MOVE_LEFT}>← Left</option>
                      <option value={GameAction.MOVE_RIGHT}>→ Right</option>
                      <option value={GameAction.JUMP}>▲ Jump</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-[#2d2d44] pt-2 mt-2 space-y-2">
            <div className="flex space-x-1.5">
              <input
                type="text"
                placeholder="Add manual custom class label..."
                value={customClassInput}
                onChange={(e) => setCustomClassInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManualClass()}
                className="flex-1 bg-black border border-[#2d2d44] rounded px-2 py-0.5 text-[10px] text-[#00ff9d] placeholder-slate-700 font-mono focus:outline-none focus:border-[#00ff9d]"
              />
              <button
                onClick={handleAddManualClass}
                className="bg-black hover:bg-black/80 border border-[#2d2d44] text-[#00ff9d] font-bold text-[10px] px-2 rounded cursor-pointer"
              >
                + ADD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIDENCE DIODES AND METERS */}
      {config.isCameraActive && config.status === 'ready' && predictions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#2d2d44]">
          {predictions.map((pred, i) => {
            const isWinner = pred.probability >= config.threshold / 100;
            const mappedAct = config.mappings[pred.className] || 'Neutral';
            return (
              <div 
                key={i} 
                className={`p-2 border transition-all flex flex-col justify-between ${
                  isWinner 
                    ? 'bg-[#161625] border-[#00ff9d]/60 shadow-[inset_0_0_10px_rgba(0,255,157,0.1)]' 
                    : 'bg-black/45 border-[#2d2d44] opacity-50'
                }`}
              >
                <div className="text-[9px] text-[#6b7280] font-black tracking-wider uppercase mb-1">
                  {pred.className} → {mappedAct}
                </div>
                <div className={`text-xl font-extrabold mb-1 ${isWinner ? 'text-[#00ff9d]' : 'text-white'}`}>
                  {pred.probability.toFixed(2)}
                </div>
                <div className="h-1 bg-black/80 w-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-75 ${isWinner ? 'bg-[#00ff9d]' : 'bg-slate-500'}`}
                    style={{ width: `${pred.probability * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER: CALIBRATION SLIDER */}
      <div className="border-t border-[#2d2d44] pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-[10px] text-slate-400 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <Sliders className="w-3.5 h-3.5 text-[#00ff9d]" />
            <span className="uppercase text-[9px] tracking-widest font-black text-[#00ff9d]">CALIBRATION</span>
          </div>
          <div className="flex items-center space-x-2 flex-1 max-w-[200px]">
            <input
              type="range"
              min="50"
              max="98"
              step="2"
              value={config.threshold}
              onChange={(e) => onConfigChange(prev => ({ ...prev, threshold: parseInt(e.target.value, 10) }))}
              className="accent-[#00ff9d] h-1 bg-black rounded-lg appearance-none cursor-pointer w-full"
            />
            <span className="font-extrabold text-[#00ff9d] text-xs">{config.threshold}%</span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 bg-black px-2 py-1 rounded border border-[#2d2d44]">
          <HelpCircle className="w-3 h-3 text-[#ff2e63]" />
          <span>Calibrate higher threshold to filter ambient frame noise.</span>
        </div>
      </div>
    </div>
  );
}
