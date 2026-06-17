export enum GameState {
  MENU = 'MENU',
  LEVEL_SELECT = 'LEVEL_SELECT',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN'
}

export enum GameAction {
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  JUMP = 'JUMP',
  CROUCH = 'CROUCH',
  NEUTRAL = 'NEUTRAL'
}

export enum PlatformType {
  NORMAL = 'NORMAL',
  BOUNCY = 'BOUNCY',
  DISAPPEARING = 'DISAPPEARING',
  MOVING_H = 'MOVING_H',
  SPIKES = 'SPIKES'
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  score: number;
  deaths: number;
  facing: 'left' | 'right';
  animFrame: number;
  animTimer: number;
  animState: 'idle' | 'walk' | 'jump' | 'fall';
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  color: string;
  label?: string;
  
  // For moving platforms
  initialX?: number;
  rangeX?: number;
  dirX?: number;
  speedX?: number;

  // Disappearing state
  opacity?: number;
  touched?: boolean;
  disappearTimer?: number;
  respawnTimer?: number;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  value: number;
  pulseTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity?: number;
}

export interface TMConfig {
  modelUrl: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
  errorMsg: string | null;
  classes: string[];
  mappings: Record<string, GameAction>;
  threshold: number;
  smoothingHistory: number;
  isCameraActive: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  bgColor: string;
  targetScore: number;
  playerStartX: number;
  playerStartY: number;
  width: number;
  height: number;
  platforms: Platform[];
  coins: Coin[];
  flagX: number;
  flagY: number;
}
