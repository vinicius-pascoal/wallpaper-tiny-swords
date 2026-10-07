(function () {
  const ROOT = 'assets/Tiny Swords (Free Pack)';
  const BLACK = 'Units/Black Units';

  window.WORLD_CONFIG = {
    width: 1920,
    height: 1080,
    population: 16,
    maxPopulation: 20,
    animationSpeed: 1,
    cloudSpeed: 1,
    particleLimit: 18,
    audioSensitivity: 1,
    audioReactive: true,
    particles: true,
    clouds: true,
    islandScaleLimit: 0.008,
    asset(path) { return encodeURI(`${ROOT}/${path}`); },
    unit(path) { return encodeURI(`${ROOT}/${BLACK}/${path}`); }
  };

  window.SPRITES = {
    pawn: {
      idle: { path: 'Pawn/Pawn_Idle.png', frame: 192, frames: 8, fps: 6 },
      run: { path: 'Pawn/Pawn_Run.png', frame: 192, frames: 6, fps: 10 },
      runAxe: { path: 'Pawn/Pawn_Run Axe.png', frame: 192, frames: 6, fps: 10 },
      runPickaxe: { path: 'Pawn/Pawn_Run Pickaxe.png', frame: 192, frames: 6, fps: 10 },
      runHammer: { path: 'Pawn/Pawn_Run Hammer.png', frame: 192, frames: 6, fps: 10 },
      runKnife: { path: 'Pawn/Pawn_Run Knife.png', frame: 192, frames: 6, fps: 10 },
      axe: { path: 'Pawn/Pawn_Interact Axe.png', frame: 192, frames: 6, fps: 8 },
      pickaxe: { path: 'Pawn/Pawn_Interact Pickaxe.png', frame: 192, frames: 6, fps: 8 },
      hammer: { path: 'Pawn/Pawn_Interact Hammer.png', frame: 192, frames: 3, fps: 7 },
      knife: { path: 'Pawn/Pawn_Interact Knife.png', frame: 192, frames: 4, fps: 8 }
    },
    warrior: {
      idle: { path: 'Warrior/Warrior_Idle.png', frame: 192, frames: 8, fps: 6 },
      run: { path: 'Warrior/Warrior_Run.png', frame: 192, frames: 6, fps: 10 },
      special: { path: 'Warrior/Warrior_Attack1.png', frame: 192, frames: 4, fps: 8 }
    },
    archer: {
      idle: { path: 'Archer/Archer_Idle.png', frame: 192, frames: 6, fps: 6 },
      run: { path: 'Archer/Archer_Run.png', frame: 192, frames: 4, fps: 10 },
      special: { path: 'Archer/Archer_Shoot.png', frame: 192, frames: 8, fps: 9 }
    },
    lancer: {
      idle: { path: 'Lancer/Lancer_Idle.png', frame: 320, frames: 12, fps: 7 },
      run: { path: 'Lancer/Lancer_Run.png', frame: 320, frames: 6, fps: 10 },
      special: { path: 'Lancer/Lancer_Right_Defence.png', frame: 320, frames: 6, fps: 7 }
    },
    monk: {
      idle: { path: 'Monk/Idle.png', frame: 192, frames: 6, fps: 6 },
      run: { path: 'Monk/Run.png', frame: 192, frames: 4, fps: 9 },
      special: { path: 'Monk/Heal.png', frame: 192, frames: 11, fps: 9 }
    }
  };

  window.WAYPOINTS = {
    square: [{ x: 960, y: 570 }, { x: 850, y: 625 }, { x: 1065, y: 635 }],
    forest: [{ x: 585, y: 800 }, { x: 505, y: 850 }, { x: 680, y: 855 }, { x: 770, y: 755 }],
    mine: [{ x: 1285, y: 770 }, { x: 1360, y: 820 }, { x: 1200, y: 835 }, { x: 1130, y: 720 }],
    homes: [{ x: 520, y: 560 }, { x: 615, y: 610 }, { x: 710, y: 560 }, { x: 790, y: 655 }],
    military: [{ x: 1240, y: 555 }, { x: 1390, y: 610 }, { x: 1440, y: 500 }, { x: 1170, y: 650 }],
    monastery: [{ x: 665, y: 440 }, { x: 745, y: 480 }, { x: 810, y: 535 }],
    castle: [{ x: 930, y: 365 }, { x: 1050, y: 420 }, { x: 1130, y: 490 }]
  };
})();
