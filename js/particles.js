(function () {
  class ParticleSystem {
    constructor(container) {
      this.container = container;
      this.pool = [];
      this.active = [];
      for (let i = 0; i < WORLD_CONFIG.particleLimit; i++) this.pool.push(this.create());
    }

    create() {
      const element = document.createElement('div');
      element.className = 'particle';
      element.style.backgroundImage = `url("${WORLD_CONFIG.asset('Particle FX/Dust_01.png')}")`;
      element.style.backgroundSize = '512px 64px';
      this.container.appendChild(element);
      return { element, age: 0, duration: 0, x: 0, y: 0, vx: 0, vy: 0, frame: 0 };
    }

    dust(x, y, intensity = 1) {
      if (!WORLD_CONFIG.particles || !this.pool.length) return;
      const particle = this.pool.pop();
      Object.assign(particle, { age: 0, duration: 420 + Math.random() * 250, x, y, vx: (Math.random() - .5) * .05 * intensity, vy: -.025 - Math.random() * .04, frame: 0 });
      this.active.push(particle);
    }

    update(delta) {
      for (let i = this.active.length - 1; i >= 0; i--) {
        const particle = this.active[i];
        particle.age += delta;
        if (particle.age >= particle.duration) {
          particle.element.style.opacity = '0';
          this.active.splice(i, 1);
          this.pool.push(particle);
          continue;
        }
        const life = particle.age / particle.duration;
        particle.frame = Math.min(7, Math.floor(life * 8));
        particle.element.style.backgroundPosition = `${-particle.frame * 64}px 0`;
        particle.element.style.opacity = `${(1 - life) * .56}`;
        particle.element.style.transform = `translate3d(${particle.x + particle.vx * particle.age}px, ${particle.y + particle.vy * particle.age}px, 0)`;
      }
    }
  }

  window.ParticleSystem = ParticleSystem;
})();
