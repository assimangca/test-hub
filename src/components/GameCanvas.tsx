import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameAction, Player, Platform, Coin, Particle, LevelConfig, PlatformType } from '../types';
import { createLevels } from '../utils/levels';
import { sfx } from '../utils/audio';
import { Play, RotateCcw, AlertCircle, ArrowRight, Award, ChevronRight, Trophy, Volume2, VolumeX } from 'lucide-react';

interface GameCanvasProps {
  activeActions: Record<GameAction, boolean>;
  selectedLevelId: number;
  onLevelSelect: (id: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export default function GameCanvas({
  activeActions,
  selectedLevelId,
  onLevelSelect,
  soundEnabled,
  onToggleSound
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [playerDeaths, setPlayerDeaths] = useState<number>(0);
  const [levels, setLevels] = useState<LevelConfig[]>([]);

  // Refs for loop state
  const stateRef = useRef<GameState>(GameState.MENU);
  const levelRef = useRef<LevelConfig | null>(null);
  const playerRef = useRef<Player>({
    x: 100, y: 100, vx: 0, vy: 0,
    width: 24, height: 28,
    isGrounded: false,
    score: 0, deaths: 0,
    facing: 'right', animFrame: 0, animTimer: 0, animState: 'idle'
  });
  const platformsRef = useRef<Platform[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef({ x: 0, y: 0, targetX: 0 });
  const keysRef = useRef<Record<string, boolean>>({});

  // Trigger level selections
  useEffect(() => {
    setCurrentLevelId(selectedLevelId);
    if (gameState === GameState.PLAYING) {
      resetLevel(selectedLevelId);
    }
  }, [selectedLevelId]);

  // Keep stateRef up to date
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      keysRef.current[e.key] = true;
      keysRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize levels
  useEffect(() => {
    setLevels(createLevels());
  }, []);

  const resetLevel = (lvlId: number) => {
    const freshLevels = createLevels();
    const targetLvl = freshLevels.find(l => l.id === lvlId) || freshLevels[0];
    
    levelRef.current = targetLvl;
    platformsRef.current = JSON.parse(JSON.stringify(targetLvl.platforms));
    coinsRef.current = JSON.parse(JSON.stringify(targetLvl.coins));
    particlesRef.current = [];
    
    playerRef.current = {
      x: targetLvl.playerStartX,
      y: targetLvl.playerStartY,
      vx: 0,
      vy: 0,
      width: 24,
      height: 28,
      isGrounded: false,
      score: 0,
      deaths: playerRef.current.deaths, 
      facing: 'right',
      animFrame: 0,
      animTimer: 0,
      animState: 'idle'
    };

    cameraRef.current = {
      x: targetLvl.playerStartX - 400,
      y: 0,
      targetX: targetLvl.playerStartX - 400
    };

    setPlayerScore(0);
    setGameState(GameState.PLAYING);
  };

  const handleStartGame = () => {
    sfx.toggle(soundEnabled);
    sfx.playLevelUp();
    resetLevel(currentLevelId);
  };

  const handleNextLevel = () => {
    const nextId = currentLevelId + 1;
    const freshLevels = createLevels();
    if (freshLevels.some(l => l.id === nextId)) {
      onLevelSelect(nextId);
      setCurrentLevelId(nextId);
      resetLevel(nextId);
      sfx.playLevelUp();
    } else {
      setGameState(GameState.WIN);
      sfx.playWin();
    }
  };

  // Main Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = performance.now();

    const gameLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1); 
      lastTime = time;

      update(dt);
      render();

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Core update step
  const update = (dt: number) => {
    if (stateRef.current !== GameState.PLAYING) return;

    const player = playerRef.current;
    const level = levelRef.current;
    if (!level) return;

    const leftActive = keysRef.current['ArrowLeft'] || keysRef.current['KeyA'] || activeActions[GameAction.MOVE_LEFT];
    const rightActive = keysRef.current['ArrowRight'] || keysRef.current['KeyD'] || activeActions[GameAction.MOVE_RIGHT];
    const jumpActive = keysRef.current['ArrowUp'] || keysRef.current['Space'] || keysRef.current['KeyW'] || activeActions[GameAction.JUMP];
    const crouchActive = keysRef.current['ArrowDown'] || keysRef.current['KeyS'] || activeActions[GameAction.CROUCH];

    const acc = 20; 
    const dec = 0.85; 
    const maxSpeed = 5;

    if (leftActive) {
      player.vx -= acc * dt;
      if (player.vx < -maxSpeed) player.vx = -maxSpeed;
      player.facing = 'left';
      player.animState = 'walk';
    } else if (rightActive) {
      player.vx += acc * dt;
      if (player.vx > maxSpeed) player.vx = maxSpeed;
      player.facing = 'right';
      player.animState = 'walk';
    } else {
      player.vx *= dec;
      if (Math.abs(player.vx) < 0.1) {
        player.vx = 0;
        player.animState = 'idle';
      }
    }

    const gravityForce = 22;
    player.vy += gravityForce * dt;

    if (jumpActive && player.isGrounded) {
      player.vy = -10.5; 
      player.isGrounded = false;
      sfx.playJump();
      spawnDustParticles(player.x + player.width / 2, player.y + player.height, '#e2e8f0');
    }

    // Crouch: shrink hitbox while grounded
    if (crouchActive && player.isGrounded) {
      player.height = 14; // half height
      player.animState = 'idle';
    } else {
      player.height = 28; // normal height
    }

    if (!player.isGrounded) {
      player.animState = player.vy < 0 ? 'jump' : 'fall';
    }

    player.x += player.vx * 60 * dt;
    player.y += player.vy * 60 * dt;

    if (player.x < 0) {
      player.x = 0;
      player.vx = 0;
    }
    if (player.x > level.width - player.width) {
      player.x = level.width - player.width;
      player.vx = 0;
    }

    if (player.y > level.height) {
      triggerPlayerDeath();
      return;
    }

    player.isGrounded = false; 
    
    platformsRef.current.forEach(platform => {
      if (platform.type === PlatformType.DISAPPEARING) {
        if (platform.touched && platform.disappearTimer !== undefined) {
          platform.disappearTimer -= dt;
          if (platform.opacity !== undefined) {
            platform.opacity = Math.max(0, platform.disappearTimer / 0.5); 
          }
          if (platform.disappearTimer <= 0) {
            platform.y += 10000;
            platform.touched = false;
            platform.respawnTimer = 2.0; 
          }
        } else if (platform.respawnTimer !== undefined) {
          platform.respawnTimer -= dt;
          if (platform.respawnTimer <= 0) {
            platform.y -= 10000; 
            platform.opacity = 1;
            platform.disappearTimer = 0.5;
            platform.respawnTimer = undefined;
          }
        }
      }

      if (platform.type === PlatformType.MOVING_H && platform.initialX !== undefined && platform.rangeX !== undefined && platform.dirX !== undefined && platform.speedX !== undefined) {
        const prevPlatformX = platform.x;
        platform.x += platform.dirX * platform.speedX * 60 * dt;
        
        if (platform.x > platform.initialX + platform.rangeX) {
          platform.x = platform.initialX + platform.rangeX;
          platform.dirX = -1;
        } else if (platform.x < platform.initialX) {
          platform.x = platform.initialX;
          platform.dirX = 1;
        }

        const pDeltaX = platform.x - prevPlatformX;
        const playerBottom = player.y + player.height;
        if (player.x + player.width > platform.x &&
            player.x < platform.x + platform.width &&
            Math.abs(playerBottom - platform.y) < 6 &&
            player.vy >= 0) {
          player.x += pDeltaX;
        }
      }

      if (platform.opacity !== 0) {
        const playerBottom = player.y + player.height;
        const prevPlayerBottom = playerBottom - (player.vy * 60 * dt);

        if (
          player.x + player.width - 4 > platform.x &&
          player.x + 4 < platform.x + platform.width
        ) {
          if (prevPlayerBottom <= platform.y + 2 && playerBottom >= platform.y - 4 && player.vy >= 0) {
            
            if (platform.type === PlatformType.SPIKES) {
              triggerPlayerDeath();
              return;
            }

            player.y = platform.y - player.height;
            player.vy = 0;
            player.isGrounded = true;

            if (platform.type === PlatformType.BOUNCY) {
              player.vy = -15; 
              player.isGrounded = false;
              sfx.playBounce();
              spawnDustParticles(player.x + player.width / 2, platform.y, '#00ff9d', 12);
            } else if (platform.type === PlatformType.DISAPPEARING) {
              if (!platform.touched) {
                platform.touched = true;
                platform.disappearTimer = 0.5; 
                platform.opacity = 1;
              }
            }
          }
        }
      }
    });

    coinsRef.current.forEach(coin => {
      if (coin.collected) return;

      const playerCenterX = player.x + player.width / 2;
      const playerCenterY = player.y + player.height / 2;
      const dx = playerCenterX - coin.x;
      const dy = playerCenterY - coin.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < coin.radius + 15) {
        coin.collected = true;
        player.score += coin.value;
        setPlayerScore(player.score);
        sfx.playCoin();
        spawnCoinParticles(coin.x, coin.y, '#00ff9d');
      }
    });

    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const distanceToFlag = Math.sqrt(
      Math.pow(playerCenterX - level.flagX, 2) + Math.pow(playerCenterY - level.flagY, 2)
    );

    if (distanceToFlag < 30) {
      if (player.score >= level.targetScore) {
        handleNextLevel();
      }
    }

    particlesRef.current.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.y += p.gravity;
      p.alpha -= p.decay;
      if (p.alpha <= 0) {
        particlesRef.current.splice(idx, 1);
      }
    });

    player.animTimer += dt;
    if (player.animTimer > 0.12) {
      player.animFrame = (player.animFrame + 1) % 4;
      player.animTimer = 0;
    }

    if (player.isGrounded && Math.abs(player.vx) > 1.5 && Math.random() < 0.2) {
      spawnDustParticles(player.x + (player.facing === 'left' ? player.width : 0), player.y + player.height, '#00ff9d', 1);
    }

    cameraRef.current.targetX = player.x - 300; 
    cameraRef.current.x += (cameraRef.current.targetX - cameraRef.current.x) * 0.1; 
    cameraRef.current.x = Math.max(0, Math.min(cameraRef.current.x, level.width - 800)); 
  };

  const triggerPlayerDeath = () => {
    sfx.playDeath();
    const player = playerRef.current;
    player.deaths += 1;
    setPlayerDeaths(player.deaths);

    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 3,
        size: Math.random() * 5 + 3,
        color: ['#ff2e63', '#facc15', '#00ff9d'][Math.floor(Math.random() * 3)],
        alpha: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.15
      });
    }

    setTimeout(() => {
      if (levelRef.current) {
        resetLevel(currentLevelId);
      }
    }, 400);
  };

  const spawnDustParticles = (x: number, y: number, color: string, count: number = 6) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 1.5 - 0.5,
        size: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.05 + 0.04
      });
    }
  };

  const spawnCoinParticles = (x: number, y: number, color: string) => {
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5 - 2,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1.0,
        decay: Math.random() * 0.04 + 0.02,
        gravity: 0.1
      });
    }
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = levelRef.current ? levelRef.current.bgColor : '#0d0d15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const camX = cameraRef.current.x;
    const level = levelRef.current;

    if (!level) return;

    // --- PARALLAX BACKGROUND LAYER ---
    ctx.save();
    ctx.fillStyle = 'rgba(0, 255, 157, 0.05)';
    for (let i = 0; i < 10; i++) {
      const scaleX = (i * 300 - camX * 0.15) % (level.width + 300);
      const drawX = scaleX < -150 ? scaleX + level.width + 300 : scaleX;
      drawPixelCloud(ctx, drawX - 100, 80 + (i % 3) * 20);
    }
    
    ctx.fillStyle = '#161625';
    for (let i = 0; i < 8; i++) {
      const scaleX = (i * 400 - camX * 0.4) % (level.width + 400);
      const drawX = scaleX < -200 ? scaleX + level.width + 400 : scaleX;
      drawPixelMountain(ctx, drawX - 100, canvas.height - 120, 120 + (i % 2) * 50);
    }
    ctx.restore();

    // --- SCROLLING GAMEPLAY LAYER ---
    ctx.save();
    ctx.translate(-camX, 0);

    platformsRef.current.forEach(platform => {
      if (platform.opacity === 0) return;

      ctx.save();
      if (platform.opacity !== undefined) {
        ctx.globalAlpha = platform.opacity;
      }

      if (platform.type === PlatformType.SPIKES) {
        drawSpikes(ctx, platform);
      } else {
        draw8BitBlock(ctx, platform);
      }
      ctx.restore();
    });

    coinsRef.current.forEach(coin => {
      if (coin.collected) return;
      coin.pulseTimer += 0.15;
      drawPixelCoin(ctx, coin);
    });

    drawPixelGoalFlag(ctx, level.flagX, level.flagY, playerScore >= level.targetScore);

    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      ctx.restore();
    });

    const player = playerRef.current;
    if (gameState === GameState.PLAYING) {
      draw8BitHero(ctx, player);
    }

    ctx.restore();
  };

  const drawPixelCloud = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillRect(x, y + 8, 80, 16);
    ctx.fillRect(x + 16, y, 48, 24);
    ctx.fillRect(x + 8, y + 4, 64, 18);
  };

  const drawPixelMountain = (ctx: CanvasRenderingContext2D, x: number, y: number, height: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + 120);
    ctx.lineTo(x + height, y);
    ctx.lineTo(x + height * 2, y + 120);
    ctx.closePath();
    ctx.fill();
  };

  const draw8BitBlock = (ctx: CanvasRenderingContext2D, platform: Platform) => {
    const x = Math.floor(platform.x);
    const y = Math.floor(platform.y);
    const w = Math.floor(platform.width);
    const h = Math.floor(platform.height);

    // Apply glowing retro palette borders
    ctx.fillStyle = platform.color;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; 
    ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; 
    ctx.fillRect(x, y + h - 4, w, 4);

    if (platform.type === PlatformType.BOUNCY) {
      ctx.fillStyle = '#00ff9d';
      ctx.fillRect(x + 10, y + 4, w - 20, 2);
      ctx.fillStyle = '#ff2e63';
      ctx.fillRect(x + 4, y + 6, w - 8, 4);
    } else if (platform.type === PlatformType.DISAPPEARING) {
      ctx.fillStyle = '#161625';
      for (let i = 4; i < w; i += 12) {
        ctx.fillRect(x + i, y + 8, 4, 4);
      }
    } else if (platform.type === PlatformType.MOVING_H) {
      ctx.fillStyle = '#00ff9d';
      ctx.fillRect(x + 6, y + h / 2 - 2, 4, 4);
      ctx.fillRect(x + w - 10, y + h / 2 - 2, 4, 4);
    }

    if (platform.label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '7.5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(platform.label, x + w / 2, y + 11);
    }
  };

  const drawSpikes = (ctx: CanvasRenderingContext2D, platform: Platform) => {
    const x = Math.floor(platform.x);
    const y = Math.floor(platform.y);
    const w = Math.floor(platform.width);
    const h = Math.floor(platform.height);

    const spikeWidth = 16;
    const spikeCount = Math.floor(w / spikeWidth);

    ctx.fillStyle = '#ff2e63'; 
    ctx.fillRect(x, y + h - 6, w, 6);

    for (let i = 0; i < spikeCount; i++) {
      const sx = x + i * spikeWidth;
      ctx.beginPath();
      ctx.moveTo(sx, y + h);
      ctx.lineTo(sx + spikeWidth / 2, y);
      ctx.lineTo(sx + spikeWidth, y + h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(sx + 3, y + h);
      ctx.lineTo(sx + spikeWidth / 2, y + 6);
      ctx.lineTo(sx + spikeWidth - 3, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ff2e63';
    }
  };

  const drawPixelCoin = (ctx: CanvasRenderingContext2D, coin: Coin) => {
    const scale = Math.abs(Math.sin(coin.pulseTimer)) * 0.4 + 0.6; 
    const cx = Math.floor(coin.x);
    const cy = Math.floor(coin.y);
    const r = Math.floor(coin.radius);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, 1);

    ctx.fillStyle = '#161625';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff9d';
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-1, -1.5, 2, 2);

    ctx.restore();
  };

  const drawPixelGoalFlag = (ctx: CanvasRenderingContext2D, fx: number, fy: number, isUnlocked: boolean) => {
    ctx.save();
    ctx.fillStyle = '#2d2d44';
    ctx.fillRect(fx - 2, fy - 35, 4, 50);

    ctx.fillStyle = '#4a4a6a';
    ctx.fillRect(fx - 10, fy + 12, 20, 4);

    if (isUnlocked) {
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const time = performance.now() / 150;
      ctx.ellipse(fx, fy - 10, 16, 22 * Math.abs(Math.sin(time * 0.1)), 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 255, 157, 0.25)';
      ctx.fill();

      ctx.fillStyle = '#00ff9d';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      if (Math.floor(time) % 2 === 0) {
        ctx.fillText("READY!", fx, fy - 38);
      }
    } else {
      ctx.fillStyle = '#ff2e63';
      ctx.beginPath();
      ctx.moveTo(fx + 2, fy - 32);
      ctx.lineTo(fx + 20, fy - 24);
      ctx.lineTo(fx + 2, fy - 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  const draw8BitHero = (ctx: CanvasRenderingContext2D, p: Player) => {
    const px = Math.floor(p.x);
    const py = Math.floor(p.y);
    const w = p.width;
    const h = p.height;
    const isLeft = p.facing === 'left';
    const isCrouching = h <= 14;

    ctx.save();
    ctx.translate(px + w / 2, py + h / 2);
    if (isLeft) {
      ctx.scale(-1, 1);
    }

    // Colors: Green/Teal dinosaur skin, yellow belly, red/orange spine spikes
    const skinColor = '#00ff9d'; // Vibrant green
    const darkSkinColor = '#00ad6b'; // Shaded green
    const bellyColor = '#facc15'; // Yellow
    const spikeColor = '#ff2e63'; // Pinkish-red
    const eyeColor = '#ffffff';
    const eyePupil = '#0d0d15';

    if (isCrouching) {
      // --- CROUCHED DINOSAUR ---
      // Squished horizontal body
      ctx.fillStyle = darkSkinColor;
      ctx.fillRect(-10, -2, 18, 8); // main back
      ctx.fillStyle = skinColor;
      ctx.fillRect(-9, -4, 16, 8);  // body

      // Low head snout
      ctx.fillStyle = skinColor;
      ctx.fillRect(3, -5, 8, 5);
      // Yellow jaw
      ctx.fillStyle = bellyColor;
      ctx.fillRect(4, 0, 6, 2);

      // Spikes laid flat
      ctx.fillStyle = spikeColor;
      ctx.fillRect(-8, -6, 2, 2);
      ctx.fillRect(-4, -6, 2, 2);
      ctx.fillRect(0, -6, 2, 2);

      // Tail stretching back
      ctx.fillStyle = skinColor;
      ctx.fillRect(-14, 0, 5, 4);
      ctx.fillStyle = darkSkinColor;
      ctx.fillRect(-15, 2, 2, 2);

      // Little stubby arm
      ctx.fillStyle = skinColor;
      ctx.fillRect(1, 1, 3, 2);

      // Crouched/bent legs
      ctx.fillStyle = darkSkinColor;
      ctx.fillRect(-5, 5, 4, 3);
      ctx.fillRect(1, 5, 4, 3);

      // Eye
      ctx.fillStyle = eyeColor;
      ctx.fillRect(5, -4, 2, 2);
      ctx.fillStyle = eyePupil;
      ctx.fillRect(6, -4, 1, 1);

    } else {
      // --- NORMAL STANDING/WALKING T-REX ---
      // Main Body
      ctx.fillStyle = darkSkinColor;
      ctx.fillRect(-7, -8, 14, 15);
      ctx.fillStyle = skinColor;
      ctx.fillRect(-6, -7, 12, 13);

      // Yellow belly chest
      ctx.fillStyle = bellyColor;
      ctx.fillRect(2, -4, 4, 8);

      // Large head & snout extending forward
      ctx.fillStyle = skinColor;
      ctx.fillRect(-2, -15, 12, 8); // Head block
      ctx.fillRect(4, -12, 7, 5);   // Snout nose
      // Lower jaw
      ctx.fillStyle = darkSkinColor;
      ctx.fillRect(2, -7, 8, 2);

      // Spine Spikes
      ctx.fillStyle = spikeColor;
      ctx.fillRect(-5, -17, 2, 2); // Head spike
      ctx.fillRect(-8, -11, 2, 2); // Neck spike
      ctx.fillRect(-9, -5, 2, 2);  // Upper back spike
      ctx.fillRect(-9, 1, 2, 2);   // Lower back spike

      // Dinosaur Tail
      ctx.fillStyle = skinColor;
      ctx.fillRect(-11, -1, 5, 6);
      ctx.fillRect(-13, 2, 3, 3);
      ctx.fillStyle = darkSkinColor;
      ctx.fillRect(-14, 3, 2, 2); // Tail tip

      // Stubby T-Rex Arm
      ctx.fillStyle = skinColor;
      ctx.fillRect(4, -2, 3, 2);
      ctx.fillStyle = darkSkinColor;
      ctx.fillRect(6, 0, 1, 2); // claws

      // Animated walking/jumping legs
      ctx.fillStyle = darkSkinColor;
      if (p.animState === 'walk') {
        const step = p.animFrame % 2;
        if (step === 0) {
          // Left leg forward, right leg back
          ctx.fillRect(-4, 7, 3, 6);
          ctx.fillRect(2, 7, 3, 6);
          // Feet
          ctx.fillStyle = skinColor;
          ctx.fillRect(-4, 12, 4, 2);
          ctx.fillRect(2, 12, 4, 2);
        } else {
          // Right leg forward, left leg back
          ctx.fillRect(-2, 5, 3, 8);
          ctx.fillRect(1, 6, 3, 7);
          // Feet
          ctx.fillStyle = skinColor;
          ctx.fillRect(-2, 12, 4, 2);
          ctx.fillRect(1, 12, 4, 2);
        }
      } else if (p.animState === 'jump' || p.animState === 'fall') {
        // Legs tucked/bent in mid-air
        ctx.fillRect(-3, 7, 3, 3);
        ctx.fillRect(1, 7, 3, 3);
        ctx.fillStyle = skinColor;
        ctx.fillRect(-3, 10, 4, 2);
        ctx.fillRect(1, 10, 4, 2);
      } else {
        // Idle legs standing straight
        ctx.fillRect(-4, 7, 3, 6);
        ctx.fillRect(1, 7, 3, 6);
        // Feet
        ctx.fillStyle = skinColor;
        ctx.fillRect(-4, 12, 4, 2);
        ctx.fillRect(1, 12, 4, 2);
      }

      // Eye
      ctx.fillStyle = eyeColor;
      ctx.fillRect(3, -13, 3, 3);
      ctx.fillStyle = eyePupil;
      ctx.fillRect(4, -13, 1, 2);
    }

    ctx.restore();
  };

  const isLeftLit = activeActions[GameAction.MOVE_LEFT] || keysRef.current['ArrowLeft'] || keysRef.current['KeyA'];
  const isRightLit = activeActions[GameAction.MOVE_RIGHT] || keysRef.current['ArrowRight'] || keysRef.current['KeyD'];
  const isJumpLit = activeActions[GameAction.JUMP] || keysRef.current['ArrowUp'] || keysRef.current['Space'] || keysRef.current['KeyW'];
  const isCrouchLit = activeActions[GameAction.CROUCH] || keysRef.current['ArrowDown'] || keysRef.current['KeyS'];

  const handleLevelSelectBtn = (lvlId: number) => {
    onLevelSelect(lvlId);
    setCurrentLevelId(lvlId);
    if (gameState === GameState.PLAYING) {
      resetLevel(lvlId);
    }
  };

  return (
    <div id="pixel-game-console" className="bg-[#161625] border-4 border-[#2d2d44] overflow-hidden text-white font-mono shadow-2xl flex flex-col justify-between">
      
      {/* HEADER / HUD */}
      <div className="bg-black px-4 py-3 flex flex-wrap items-center justify-between border-b-2 border-[#2d2d44] text-xs gap-3">
        <div className="flex items-center space-x-2">
          <Award className="text-[#00ff9d] w-4 h-4 animate-bounce" />
          <span className="font-extrabold uppercase tracking-widest text-[#00ff9d] text-xs">
            COSMIC_SECTOR_RUNNER
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {gameState === GameState.PLAYING && levelRef.current && (
            <div className="flex items-center space-x-1.5 bg-[#161625] px-2.5 py-1 rounded border border-[#2d2d44]">
              <span className="text-[9px] text-[#6b7280] uppercase">COIN_COLLECT</span>
              <span className="font-bold text-[#facc15]">{playerScore}</span>
              <span className="text-slate-600">/</span>
              <span className="text-slate-400">{levelRef.current.targetScore}</span>
            </div>
          )}

          <div className="flex items-center space-x-1 bg-[#161625] px-2.5 py-1 rounded border border-[#2d2d44]">
            <span className="text-[9px] text-[#6b7280] uppercase">REBOOTS</span>
            <span className="font-bold text-[#ff2e63]">{playerDeaths}</span>
          </div>

          <button
            id="sound-config-button"
            onClick={onToggleSound}
            className="p-1 rounded bg-[#161625] hover:bg-black text-[#00ff9d] border border-[#2d2d44] hover:border-[#00ff9d] cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* CANVAS ELEMENT OR MENUS */}
      <div className="relative bg-[#0d0d15] flex justify-center items-center">
        
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-auto max-w-full block select-none bg-black"
        />

        {/* FRONTEND MENUS overlaying canvas */}
        {gameState === GameState.MENU && (
          <div className="absolute inset-0 bg-[#0d0d15]/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 space-y-5 animate-fade-in z-20">
            <div className="space-y-1.5">
              <Trophy className="text-[#00ff9d] w-12 h-12 mx-auto animate-bounce" />
              <h1 className="text-xl sm:text-2xl font-black text-[#00ff9d] uppercase tracking-widest leading-none">
                Sleek Terminal Run
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 max-w-sm font-sans">
                Experience gesture-driven movement powered by WebML! Connect Teachable Machine or use standard keyboard controls. Get scattered coins to reach the portal.
              </p>
            </div>

            <div className="space-y-1.5 w-full max-w-xs">
              <label className="text-[10px] text-slate-500 uppercase block font-bold">Select Active Sector</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleLevelSelectBtn(num)}
                    className={`p-2 text-xs font-bold rounded border-2 uppercase cursor-pointer transition-all ${
                      currentLevelId === num
                        ? 'bg-[#00ff9d]/20 text-[#00ff9d] border-[#00ff9d]'
                        : 'bg-[#161625] text-slate-400 border-[#2d2d44] hover:border-[#4a4a6a]'
                    }`}
                  >
                    SEC_0{num}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="start-running-game-btn"
              onClick={handleStartGame}
              className="bg-[#00ff9d]/20 hover:bg-[#00ff9d]/30 text-[#00ff9d] border-2 border-[#00ff9d] px-8 py-3 rounded-md font-extrabold uppercase text-xs tracking-widest transition-all cursor-pointer hover:shadow-[0_0_15px_rgba(0,255,157,0.25)]"
            >
              INITIALIZE_ADVENTURE
            </button>
          </div>
        )}

        {/* WIN CELEBRATION */}
        {gameState === GameState.WIN && (
          <div className="absolute inset-0 bg-[#0d0d15]/95 flex flex-col items-center justify-center text-center p-6 space-y-4 z-20">
            <div className="space-y-1">
              <span className="text-4xl text-[#00ff9d] animate-pulse">🏆</span>
              <h1 className="text-2xl font-black text-[#00ff9d] uppercase tracking-widest">
                SECTOR_DOMINATION_COMPLETE
              </h1>
              <p className="text-xs text-slate-300 max-w-sm font-sans">
                All coordinates calibrated and secure metrics attained.
              </p>
            </div>

            <div className="bg-black border-2 border-[#2d2d44] py-3 px-6 rounded text-xs inline-flex space-x-6 text-[#00ff9d]">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500">Sectors Cleaned</p>
                <p className="font-bold text-sm">3 / 3 SUCCESS</p>
              </div>
              <div className="border-l border-[#2d2d44]" />
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 font-mono">Total Reboots</p>
                <p className="text-[#ff2e63] font-bold text-sm">{playerDeaths}</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-2">
              <button
                id="win-replay-btn"
                onClick={() => {
                  setPlayerDeaths(0);
                  setCurrentLevelId(1);
                  resetLevel(1);
                }}
                className="bg-black hover:bg-black/80 border-2 border-[#00ff9d] text-[#00ff9d] font-bold uppercase text-[11px] px-4 py-2 rounded cursor-pointer"
              >
                Replay Run
              </button>
              <button
                onClick={() => setGameState(GameState.MENU)}
                className="bg-black hover:bg-black/80 border-2 border-[#ff2e63] text-[#ff2e63] font-bold uppercase text-[11px] px-4 py-2 rounded cursor-pointer"
              >
                Exit Portal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS INDICATOR PANEL */}
      <div className="bg-black px-4 py-3 border-t-2 border-[#2d2d44] flex flex-wrap items-center justify-between text-xs gap-4">
        <div className="flex items-center space-x-1.5 flex-wrap">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest mr-1">SECTORS:</span>
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => handleLevelSelectBtn(num)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase transition-all flex items-center space-x-1 cursor-pointer ${
                currentLevelId === num
                  ? 'bg-[#00ff9d]/20 text-[#00ff9d] border-[#00ff9d]'
                  : 'bg-[#161625] text-slate-400 border-[#2d2d44] hover:border-[#4a4a6a]'
              }`}
            >
              <span>SEC_0{num}</span>
            </button>
          ))}
        </div>

        {/* Lit movement triggers */}
        <div className="flex items-center space-x-1.5 bg-[#161625] px-3 py-1.5 rounded border border-[#2d2d44] text-[10px]">
          <span className="text-[9px] text-[#6b7280] uppercase tracking-widest mr-2 font-bold">MONITOR:</span>
          
          <span
            id="kb-left-light"
            className={`px-2 py-0.5 rounded transition-all font-bold ${
              isLeftLit ? 'bg-[#00ff9d]/20 border border-[#00ff9d] text-[#00ff9d]' : 'bg-black/50 border border-transparent text-[#4a4a6a]'
            }`}
          >
            ← LEFT
          </span>
          <span
            id="kb-jump-light"
            className={`px-2 py-0.5 rounded transition-all font-bold ${
              isJumpLit ? 'bg-[#00ff9d]/20 border border-[#00ff9d] text-[#00ff9d]' : 'bg-black/50 border border-transparent text-[#4a4a6a]'
            }`}
          >
            ▲ JUMP
          </span>
          <span
            id="kb-right-light"
            className={`px-2 py-0.5 rounded transition-all font-bold ${
              isRightLit ? 'bg-[#00ff9d]/20 border border-[#00ff9d] text-[#00ff9d]' : 'bg-black/50 border border-transparent text-[#4a4a6a]'
            }`}
          >
            → RIGHT
          </span>
          <span
            id="kb-crouch-light"
            className={`px-2 py-0.5 rounded transition-all font-bold ${
              isCrouchLit ? 'bg-[#00ff9d]/20 border border-[#00ff9d] text-[#00ff9d]' : 'bg-black/50 border border-transparent text-[#4a4a6a]'
            }`}
          >
            ▼ CROUCH
          </span>
        </div>
      </div>
    </div>
  );
}
