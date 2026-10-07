(function () {
  const world = new World();
  const audio = new AudioReactiveSystem(values => world.onBeat(values));
  let last = performance.now();

  function sizeWorld() {
    const scale = Math.min(innerWidth / WORLD_CONFIG.width, innerHeight / WORLD_CONFIG.height) * .985;
    document.documentElement.style.setProperty('--scene-scale', Math.max(.18, scale).toFixed(4));
  }

  function applyProperties(properties) {
    const read = (key, fallback) => properties[key] && properties[key].value !== undefined ? properties[key].value : fallback;
    WORLD_CONFIG.audioSensitivity = Math.max(.1, Number(read('audioSensitivity', WORLD_CONFIG.audioSensitivity)) || 1);
    WORLD_CONFIG.population = Math.max(1, Math.min(WORLD_CONFIG.maxPopulation, Math.round(Number(read('population', WORLD_CONFIG.population)) || WORLD_CONFIG.population)));
    WORLD_CONFIG.animationSpeed = Math.max(.1, Math.min(3, Number(read('animationSpeed', WORLD_CONFIG.animationSpeed)) || 1));
    WORLD_CONFIG.audioReactive = Boolean(read('audioReactive', WORLD_CONFIG.audioReactive));
    WORLD_CONFIG.particles = Boolean(read('particles', WORLD_CONFIG.particles));
    WORLD_CONFIG.clouds = Boolean(read('clouds', WORLD_CONFIG.clouds));
  }

  if (window.wallpaperRegisterAudioListener) window.wallpaperRegisterAudioListener(fft => audio.update(fft));
  if (window.wallpaperPropertyListener) window.wallpaperPropertyListener = { applyUserProperties: applyProperties };
  window.addEventListener('resize', sizeWorld, { passive: true });
  sizeWorld();

  function loop(now) {
    const delta = Math.min(50, now - last);
    last = now;
    const values = audio.tick(delta);
    const scale = 1 + (WORLD_CONFIG.audioReactive ? values.bass * WORLD_CONFIG.islandScaleLimit : 0);
    document.getElementById('world').style.setProperty('--audio-scale', scale);
    document.documentElement.style.setProperty('--beat', values.beat.toFixed(3));
    world.update(delta, values);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
