(function () {
  class NPC {
    constructor(spec, particles) {
      this.spec = spec;
      this.particles = particles;
      this.route = spec.route;
      this.routeIndex = spec.offset % this.route.length;
      this.x = this.route[this.routeIndex].x;
      this.y = this.route[this.routeIndex].y;
      this.direction = spec.direction || 1;
      this.state = 'RESTING';
      this.stateTime = 600 + Math.random() * 1600;
      this.walking = false;
      this.lastDust = 0;
      this.element = document.createElement('div');
      this.element.className = `npc npc-${spec.kind}`;
      this.sprite = document.createElement('div');
      this.sprite.className = 'sprite';
      this.element.appendChild(this.sprite);
      this.animator = new SpriteAnimator(this.sprite, SPRITES[spec.kind].idle);
      if (spec.kind === 'monk') {
        this.healEffect = document.createElement('div');
        this.healEffect.className = 'heal-effect';
        this.element.appendChild(this.healEffect);
        this.healAnimator = new SpriteAnimator(this.healEffect, { path: 'Monk/Heal_Effect.png', frame: 192, frames: 11, fps: 9 });
      }
      document.getElementById('world-objects').appendChild(this.element);
      this.setState('RESTING');
    }

    animationFor(state) {
      const sprites = SPRITES[this.spec.kind];
      if (state === 'WALKING') {
        const carry = this.spec.work ? `run${this.spec.work[0].toUpperCase()}${this.spec.work.slice(1)}` : null;
        return sprites[carry] || sprites.run;
      }
      if (state === 'WORKING' || state === 'SPECIAL') return sprites.special || sprites[this.spec.work] || sprites.idle;
      return sprites.idle;
    }

    setState(state) {
      this.state = state;
      const animation = this.animationFor(state);
      this.animator.setAnimation(animation, true);
      if (this.healEffect) this.healEffect.style.opacity = state === 'SPECIAL' ? '.9' : '0';
      if (state === 'WALKING') this.stateTime = 10000;
      else if (state === 'WORKING') this.stateTime = 1700 + Math.random() * 2700;
      else if (state === 'SPECIAL') this.stateTime = 1000 + Math.random() * 1300;
      else this.stateTime = 650 + Math.random() * 1800;
    }

    nextTarget() {
      this.routeIndex = (this.routeIndex + this.direction + this.route.length) % this.route.length;
      return this.route[this.routeIndex];
    }

    update(delta, values) {
      const speedMultiplier = WORLD_CONFIG.animationSpeed * (1 + values.overallEnergy * .12);
      this.animator.update(delta, speedMultiplier);
      if (this.healAnimator && this.state === 'SPECIAL') this.healAnimator.update(delta, speedMultiplier);
      this.stateTime -= delta * speedMultiplier;
      if (this.state === 'WALKING') {
        const target = this.route[this.routeIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.hypot(dx, dy);
        const step = (this.spec.speed || .052) * delta * speedMultiplier;
        if (distance <= step) {
          this.x = target.x;
          this.y = target.y;
          this.setState('RESTING');
        } else {
          this.x += dx / distance * step;
          this.y += dy / distance * step;
          if (this.particles && performance.now() - this.lastDust > 480) {
            this.particles.dust(this.x - 32, this.y - 38, .55 + values.overallEnergy);
            this.lastDust = performance.now();
          }
        }
      } else if (this.stateTime <= 0) {
        if (this.state === 'RESTING') {
          if (Math.random() < this.spec.specialChance) this.setState('SPECIAL');
          else if (Math.random() < .56) this.setState('WORKING');
          else {
            this.nextTarget();
            this.setState('WALKING');
          }
        } else if (this.state === 'WORKING' || this.state === 'SPECIAL') {
          this.nextTarget();
          this.setState('WALKING');
        }
      }
      this.render(values);
    }

    render(values) {
      const width = this.animator.animation.frameWidth || this.animator.animation.frame;
      const height = this.animator.animation.frameHeight || this.animator.animation.frame;
      this.element.style.width = `${width}px`;
      this.element.style.height = `${height}px`;
      this.element.style.transform = `translate3d(${Math.round(this.x - width / 2)}px, ${Math.round(this.y - height)}px, 0)`;
      this.element.style.zIndex = `${100 + Math.floor(this.y)}`;
      this.element.style.display = this.spec.index < WORLD_CONFIG.population ? '' : 'none';
      this.sprite.style.filter = values.bass > .2 ? `brightness(${1 + values.bass * .08})` : '';
    }

    reactToBeat(energy) {
      if (this.spec.index >= WORLD_CONFIG.population || Math.random() > .22 + energy * .25) return;
      this.element.classList.remove('beat-hop');
      void this.element.offsetWidth;
      this.element.classList.add('beat-hop');
      if (this.particles) this.particles.dust(this.x - 30, this.y - 35, 1 + energy);
    }
  }

  window.NPC = NPC;
})();
