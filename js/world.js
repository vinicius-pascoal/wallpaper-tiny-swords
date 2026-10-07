(function () {
  const A = path => WORLD_CONFIG.asset(path);

  class World {
    constructor() {
      this.objects = document.getElementById('world-objects');
      this.cloudLayer = document.getElementById('clouds');
      this.particles = new ParticleSystem(document.getElementById('particles'));
      this.npcs = [];
      this.animators = [];
      this.clouds = [];
      this.createPaths();
      this.createFoam();
      this.createScenery();
      this.createBuildings();
      this.createClouds();
      this.createPopulation();
    }

    addImage(path, x, groundY, width, height, className = 'placed', zOffset = 0) {
      const image = document.createElement('img');
      image.className = className;
      image.src = A(path);
      image.width = width;
      image.height = height;
      image.style.width = `${width}px`;
      image.style.height = `${height}px`;
      image.style.transform = `translate3d(${x - width / 2}px, ${groundY - height}px, 0)`;
      image.style.zIndex = `${100 + Math.floor(groundY) + zOffset}`;
      this.objects.appendChild(image);
      return image;
    }

    addAnimated(path, x, groundY, frameWidth, frameHeight, frames, fps, zOffset = 0, className = 'scenery') {
      const element = document.createElement('div');
      element.className = className;
      element.style.transform = `translate3d(${x - frameWidth / 2}px, ${groundY - frameHeight}px, 0)`;
      element.style.zIndex = `${100 + Math.floor(groundY) + zOffset}`;
      this.objects.appendChild(element);
      const animation = { url: A(path), frameWidth, frameHeight, frames, fps };
      const animator = new SpriteAnimator(element, animation);
      this.animators.push(animator);
      return element;
    }

    createPaths() {
      const paths = [
        [760, 630, 430, 26], [920, 500, 450, 62], [1070, 670, 455, -28],
        [835, 735, 320, -55], [1135, 760, 350, 54], [740, 490, 315, -72]
      ];
      const layer = document.getElementById('paths');
      paths.forEach(([x, y, width, rotate]) => {
        const path = document.createElement('div');
        path.className = 'path';
        path.style.width = `${width}px`;
        path.style.left = `${x}px`;
        path.style.top = `${y}px`;
        path.style.transform = `rotate(${rotate}deg)`;
        layer.appendChild(path);
      });
    }

    createFoam() {
      const foam = [[355, 310], [620, 170], [1080, 150], [1480, 300], [1590, 630], [1280, 900], [800, 915], [390, 700]];
      foam.forEach(([x, y]) => this.addAnimated('Terrain/Tileset/Water Foam.png', x, y, 192, 192, 16, 6, -70, 'scenery foam'));
    }

    createScenery() {
      const trees = [[430, 820, 'Tree1.png'], [530, 870, 'Tree2.png'], [680, 860, 'Tree3.png'], [350, 730, 'Tree4.png'], [1480, 795, 'Tree1.png'], [1375, 850, 'Tree2.png'], [1540, 690, 'Tree3.png']];
      trees.forEach(([x, y, file]) => this.addAnimated(`Terrain/Resources/Wood/Trees/${file}`, x, y, 256, /Tree[12]/.test(file) ? 256 : 192, 6, 4, 18));
      const bushes = [[455, 650], [590, 740], [720, 900], [1450, 720], [1280, 880], [1510, 550], [325, 585]];
      bushes.forEach(([x, y], index) => this.addAnimated(`Terrain/Decorations/Bushes/Bushe${index % 4 + 1}.png`, x, y, 128, 128, 8, 3, 15));
      [[1260, 840, 'Gold Stone 1.png'], [1335, 815, 'Gold Stone 3.png'], [1200, 865, 'Gold Stone 5.png']].forEach(([x, y, file]) => this.addImage(`Terrain/Resources/Gold/Gold Stones/${file}`, x, y, 128, 128, 'scenery', 20));
      [[790, 790], [1510, 430], [370, 510], [1435, 350]].forEach(([x, y], index) => this.addImage(`Terrain/Decorations/Rocks/Rock${index + 1}.png`, x, y, 64, 64, 'scenery', 10));
      [[210, 380], [1700, 720], [1540, 220]].forEach(([x, y], index) => this.addAnimated(`Terrain/Decorations/Rocks in the Water/Water Rocks_0${index + 1}.png`, x, y, 64, 64, 16, 5, -60));
      this.addImage('Terrain/Resources/Wood/Wood Resource/Wood Resource.png', 560, 780, 64, 64, 'scenery', 31);
      this.addImage('Terrain/Resources/Meat/Meat Resource/Meat Resource.png', 500, 610, 64, 64, 'scenery', 31);
      this.addFire(1195, 575);
      this.addFire(760, 555);
    }

    addFire(x, y) {
      const element = document.createElement('div');
      element.className = 'ambient-fx fire';
      element.style.transform = `translate3d(${x - 32}px, ${y - 64}px, 0)`;
      element.style.zIndex = `${100 + y + 5}`;
      this.objects.appendChild(element);
      const animator = new SpriteAnimator(element, { url: A('Particle FX/Fire_01.png'), frame: 64, frames: 8, fps: 8 });
      this.animators.push(animator);
    }

    createBuildings() {
      const B = 'Buildings/Black Buildings';
      [
        ['Castle.png', 985, 385, 320, 256],
        ['Tower.png', 1325, 475, 128, 256],
        ['Barracks.png', 1200, 650, 192, 256],
        ['Archery.png', 1420, 690, 192, 256],
        ['Monastery.png', 620, 510, 192, 320],
        ['House1.png', 460, 630, 128, 192],
        ['House2.png', 630, 690, 128, 192],
        ['House3.png', 760, 620, 128, 192],
        ['House1.png', 545, 725, 128, 192]
      ].forEach(([file, x, y, width, height]) => this.addImage(`${B}/${file}`, x, y, width, height));
    }

    createClouds() {
      const starts = [[-500, 90, 0.004], [620, 155, 0.0029], [1350, 50, 0.0036], [-900, 420, 0.0023]];
      starts.forEach(([x, y, speed], index) => {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.backgroundImage = `url("${A(`Terrain/Decorations/Clouds/Clouds_0${index + 1}.png`)}")`;
        this.cloudLayer.appendChild(cloud);
        this.clouds.push({ element: cloud, x, y, speed });
      });
    }

    createPopulation() {
      const jobs = [
        ['pawn', 'axe', 'forest'], ['pawn', 'axe', 'forest'], ['pawn', 'pickaxe', 'mine'], ['pawn', 'hammer', 'homes'],
        ['pawn', 'knife', 'homes'], ['pawn', 'hammer', 'military'], ['pawn', 'axe', 'forest'], ['pawn', 'pickaxe', 'mine'],
        ['pawn', 'knife', 'homes'], ['warrior', null, 'military'], ['warrior', null, 'castle'], ['archer', null, 'military'],
        ['archer', null, 'military'], ['lancer', null, 'castle'], ['lancer', null, 'military'], ['monk', null, 'monastery'],
        ['pawn', 'hammer', 'square'], ['pawn', 'axe', 'forest'], ['warrior', null, 'castle'], ['pawn', 'knife', 'homes']
      ];
      jobs.forEach(([kind, work, routeName], index) => {
        const route = WAYPOINTS[routeName];
        this.npcs.push(new NPC({ index, kind, work, route, offset: index % route.length, direction: index % 3 === 0 ? -1 : 1, speed: kind === 'lancer' ? .045 : .052, specialChance: kind === 'monk' ? .38 : kind === 'pawn' ? .11 : .23 }, this.particles));
      });
    }

    update(delta, values) {
      this.animators.forEach(animator => animator.update(delta, WORLD_CONFIG.animationSpeed * (1 + values.mid * .18)));
      this.npcs.forEach(npc => npc.update(delta, values));
      this.particles.update(delta);
      this.clouds.forEach(cloud => {
        cloud.x += delta * cloud.speed * WORLD_CONFIG.cloudSpeed;
        if (cloud.x > innerWidth + 650) cloud.x = -650;
        cloud.element.style.display = WORLD_CONFIG.clouds ? '' : 'none';
        cloud.element.style.transform = `translate3d(${cloud.x}px, ${cloud.y + values.mid * 7}px, 0)`;
      });
    }

    onBeat(values) {
      this.npcs.forEach(npc => npc.reactToBeat(values.overallEnergy));
      if (WORLD_CONFIG.particles) this.particles.dust(960 + (Math.random() - .5) * 360, 670 + (Math.random() - .5) * 100, 1 + values.overallEnergy);
    }
  }

  window.World = World;
})();
