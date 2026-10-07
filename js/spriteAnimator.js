(function () {
  class SpriteAnimator {
    constructor(element, animation) {
      this.element = element;
      this.elapsed = 0;
      this.frame = 0;
      this.setAnimation(animation, true);
    }

    setAnimation(animation, reset = false) {
      if (!animation || (!reset && this.animation === animation)) return;
      this.animation = animation;
      this.elapsed = 0;
      this.frame = 0;
      const frameWidth = animation.frameWidth || animation.frame;
      const frameHeight = animation.frameHeight || animation.frame;
      this.element.style.width = `${frameWidth}px`;
      this.element.style.height = `${frameHeight}px`;
      this.element.style.backgroundImage = `url("${animation.url || WORLD_CONFIG.unit(animation.path)}")`;
      this.element.style.backgroundSize = `${frameWidth * animation.frames}px ${frameHeight}px`;
      this.render();
    }

    update(delta, speed = 1) {
      const duration = 1000 / (this.animation.fps * speed);
      this.elapsed += delta;
      if (this.elapsed < duration) return;
      this.elapsed %= duration;
      this.frame = (this.frame + 1) % this.animation.frames;
      this.render();
    }

    render() {
      const frameWidth = this.animation.frameWidth || this.animation.frame;
      this.element.style.backgroundPosition = `${-this.frame * frameWidth}px 0`;
    }
  }

  window.SpriteAnimator = SpriteAnimator;
})();
