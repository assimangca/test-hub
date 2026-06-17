import { LevelConfig, PlatformType, Platform } from '../types';

export const createLevels = (): LevelConfig[] => {
  return [
    {
      id: 1,
      name: "1. Google Grasslands",
      bgColor: "#eef2f3",
      targetScore: 5,
      playerStartX: 100,
      playerStartY: 450,
      width: 1800,
      height: 600,
      flagX: 1680,
      flagY: 380,
      platforms: [
        // Ground plates
        { id: 'g1', x: 0, y: 550, width: 400, height: 50, type: PlatformType.NORMAL, color: '#38A169' },
        { id: 'g2', x: 450, y: 550, width: 350, height: 50, type: PlatformType.NORMAL, color: '#38A169' },
        { id: 'g3', x: 900, y: 550, width: 500, height: 50, type: PlatformType.NORMAL, color: '#38A169' },
        { id: 'g4', x: 1480, y: 550, width: 320, height: 50, type: PlatformType.NORMAL, color: '#38A169' },

        // Raised platforms (tutorials)
        { id: 'p1', x: 220, y: 440, width: 120, height: 20, type: PlatformType.NORMAL, color: '#4A5568' },
        { id: 'p2', x: 500, y: 400, width: 150, height: 20, type: PlatformType.NORMAL, color: '#4A5568' },
        { id: 'p3', x: 740, y: 320, width: 120, height: 20, type: PlatformType.NORMAL, color: '#3182CE' }, // Blue jump helper

        // Moving platform horizontally
        { 
          id: 'pm1', x: 930, y: 410, width: 120, height: 20, type: PlatformType.MOVING_H, color: '#805AD5',
          initialX: 930, rangeX: 180, dirX: 1, speedX: 1.5
        },

        // Sky heights
        { id: 'p4', x: 1180, y: 300, width: 100, height: 20, type: PlatformType.NORMAL, color: '#4A5568' },
        { id: 'p5', x: 1350, y: 240, width: 100, height: 20, type: PlatformType.NORMAL, color: '#4A5568' },
        { id: 'p6', x: 1550, y: 440, width: 150, height: 20, type: PlatformType.NORMAL, color: '#E2E8F0' }, // Final platform with flag
      ],
      coins: [
        { id: 'c1', x: 160, y: 510, radius: 8, collected: false, value: 1, pulseTimer: 0 },
        { id: 'c2', x: 280, y: 390, radius: 8, collected: false, value: 1, pulseTimer: 10 },
        { id: 'c3', x: 575, y: 340, radius: 8, collected: false, value: 1, pulseTimer: 20 },
        { id: 'c4', x: 800, y: 260, radius: 8, collected: false, value: 1, pulseTimer: 30 },
        { id: 'c5', x: 1020, y: 350, radius: 8, collected: false, value: 1, pulseTimer: 40 },
        { id: 'c6', x: 1230, y: 240, radius: 8, collected: false, value: 1, pulseTimer: 50 },
        { id: 'c7', x: 1400, y: 180, radius: 8, collected: false, value: 1, pulseTimer: 60 },
        { id: 'c8', x: 1625, y: 380, radius: 8, collected: false, value: 1, pulseTimer: 70 },
      ]
    },
    {
      id: 2,
      name: "2. Cloud Kingdom",
      bgColor: "#e3f2fd",
      targetScore: 6,
      playerStartX: 100,
      playerStartY: 450,
      width: 2000,
      height: 600,
      flagX: 1880,
      flagY: 280,
      platforms: [
        // Scattered ground steps
        { id: 'l2_g1', x: 0, y: 560, width: 300, height: 40, type: PlatformType.NORMAL, color: '#718096' },
        { id: 'l2_g2', x: 400, y: 520, width: 220, height: 40, type: PlatformType.NORMAL, color: '#718096' },
        
        // Bounce pads (clouds)
        { id: 'l2_b1', x: 260, y: 460, width: 60, height: 16, type: PlatformType.BOUNCY, color: '#3182CE', label: 'SPRING' },
        { id: 'l2_b2', x: 680, y: 440, width: 70, height: 16, type: PlatformType.BOUNCY, color: '#3182CE', label: 'SPRING' },

        // Disappearing steps (tests timing)
        { id: 'l2_d1', x: 820, y: 320, width: 90, height: 18, type: PlatformType.DISAPPEARING, color: '#DD6B20' },
        { id: 'l2_d2', x: 970, y: 250, width: 90, height: 18, type: PlatformType.DISAPPEARING, color: '#DD6B20' },
        
        // Moving cloud platforms
        { 
          id: 'l2_m1', x: 1120, y: 210, width: 110, height: 18, type: PlatformType.MOVING_H, color: '#319795',
          initialX: 1120, rangeX: 250, dirX: -1, speedX: 2
        },
        
        // Final clouds
        { id: 'l2_p1', x: 1450, y: 340, width: 120, height: 20, type: PlatformType.NORMAL, color: '#718096' },
        { id: 'l2_b3', x: 1620, y: 440, width: 60, height: 16, type: PlatformType.BOUNCY, color: '#3182CE', label: 'SPRING' },
        { id: 'l2_p2', x: 1780, y: 350, width: 220, height: 250, type: PlatformType.NORMAL, color: '#4A5568' }
      ],
      coins: [
        { id: 'l2_c1', x: 120, y: 500, radius: 8, collected: false, value: 1, pulseTimer: 0 },
        { id: 'l2_c2', x: 290, y: 340, radius: 8, collected: false, value: 1, pulseTimer: 15 },
        { id: 'l2_c3', x: 500, y: 440, radius: 8, collected: false, value: 1, pulseTimer: 30 },
        { id: 'l2_c4', x: 715, y: 300, radius: 8, collected: false, value: 1, pulseTimer: 45 },
        { id: 'l2_c5', x: 865, y: 220, radius: 8, collected: false, value: 1, pulseTimer: 60 },
        { id: 'l2_c6', x: 1015, y: 150, radius: 8, collected: false, value: 1, pulseTimer: 75 },
        { id: 'l2_c7', x: 1250, y: 150, radius: 8, collected: false, value: 1, pulseTimer: 10 },
        { id: 'l2_c8', x: 1510, y: 260, radius: 8, collected: false, value: 1, pulseTimer: 25 },
        { id: 'l2_c9', x: 1650, y: 280, radius: 8, collected: false, value: 1, pulseTimer: 40 },
        { id: 'l2_c10', x: 1880, y: 290, radius: 8, collected: false, value: 1, pulseTimer: 55 }
      ]
    },
    {
      id: 3,
      name: "3. Retro Inferno",
      bgColor: "#ffebee",
      targetScore: 8,
      playerStartX: 80,
      playerStartY: 450,
      width: 2200,
      height: 600,
      flagX: 2050,
      flagY: 280,
      platforms: [
        // Ground starts
        { id: 'l3_p1', x: 0, y: 540, width: 250, height: 60, type: PlatformType.NORMAL, color: '#E53E3E' },
        
        // Hazard spikes on floor (lava representation)
        { id: 'l3_spike1', x: 250, y: 575, width: 1450, height: 25, type: PlatformType.SPIKES, color: '#E53E3E', label: 'DANGER' },
        
        // Safe land ends
        { id: 'l3_pEnd', x: 1700, y: 540, width: 500, height: 60, type: PlatformType.NORMAL, color: '#E53E3E' },

        // Midair elements: Tiny stepping stones & Dissappearing hazards
        { id: 'l3_p2', x: 320, y: 440, width: 70, height: 20, type: PlatformType.NORMAL, color: '#4A5568' },
        { id: 'l3_dis1', x: 460, y: 380, width: 70, height: 18, type: PlatformType.DISAPPEARING, color: '#DD6B20' },
        
        // Horizontal Moving Platform over fire
        { 
          id: 'l3_m1', x: 600, y: 300, width: 100, height: 18, type: PlatformType.MOVING_H, color: '#319795',
          initialX: 600, rangeX: 250, dirX: 1, speedX: 2.2
        },

        { id: 'l3_dis2', x: 920, y: 270, width: 70, height: 18, type: PlatformType.DISAPPEARING, color: '#DD6B20' },
        { id: 'l3_b1', x: 1060, y: 360, width: 50, height: 16, type: PlatformType.BOUNCY, color: '#3182CE', label: 'SPRING' },
        { id: 'l3_p3', x: 1180, y: 250, width: 120, height: 20, type: PlatformType.NORMAL, color: '#4A5568' },

        // Fast moving lift-platform
        { 
          id: 'l3_m2', x: 1370, y: 330, width: 90, height: 18, type: PlatformType.MOVING_H, color: '#805AD5',
          initialX: 1370, rangeX: 220, dirX: -1, speedX: 2.8
        },
        
        // Dissappearing stack
        { id: 'l3_dis3', x: 1650, y: 400, width: 80, height: 18, type: PlatformType.DISAPPEARING, color: '#DD6B20' },
        { id: 'l3_dis4', x: 1780, y: 320, width: 80, height: 18, type: PlatformType.DISAPPEARING, color: '#DD6B20' },

        // Final goal island
        { id: 'l3_p4', x: 1950, y: 350, width: 250, height: 250, type: PlatformType.NORMAL, color: '#2B6CB0' },
      ],
      coins: [
        { id: 'l3_c1', x: 120, y: 480, radius: 8, collected: false, value: 1, pulseTimer: 0 },
        { id: 'l3_c2', x: 350, y: 380, radius: 8, collected: false, value: 1, pulseTimer: 15 },
        { id: 'l3_c3', x: 495, y: 300, radius: 8, collected: false, value: 1, pulseTimer: 30 },
        { id: 'l3_c4', x: 720, y: 220, radius: 8, collected: false, value: 1, pulseTimer: 45 },
        { id: 'l3_c5', x: 955, y: 190, radius: 8, collected: false, value: 1, pulseTimer: 60 },
        { id: 'l3_c6', x: 1085, y: 220, radius: 8, collected: false, value: 1, pulseTimer: 75 },
        { id: 'l3_c7', x: 1240, y: 170, radius: 8, collected: false, value: 1, pulseTimer: 10 },
        { id: 'l3_c8', x: 1480, y: 250, radius: 8, collected: false, value: 1, pulseTimer: 25 },
        { id: 'l3_c9', x: 1690, y: 320, radius: 8, collected: false, value: 1, pulseTimer: 40 },
        { id: 'l3_c10', x: 1820, y: 240, radius: 8, collected: false, value: 1, pulseTimer: 55 },
        { id: 'l3_c11', x: 2050, y: 260, radius: 8, collected: false, value: 1, pulseTimer: 70 }
      ]
    }
  ];
};
