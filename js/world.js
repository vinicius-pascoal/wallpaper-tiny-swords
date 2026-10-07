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
      this.createTerrain();
      this.createFoam();
      this.createScenery();
      this.createBuildings();
      this.createClouds();
      this.createPopulation();
    }

    createTerrain() {
      const atlasSize = 64;
      const lowFloorAtlas = {
        center: [1, 1], north: [1, 0], south: [1, 2], west: [0, 1], east: [2, 1],
        northWest: [0, 0], northEast: [2, 0], southWest: [0, 2], southEast: [2, 2]
      };
      // The red-marked group on the right is the authored upper-ground floor.
      const upperFloorAtlas = {
        center: [6, 1], north: [6, 0], south: [6, 2], west: [5, 1], east: [7, 1],
        northWest: [5, 0], northEast: [7, 0], southWest: [5, 2], southEast: [7, 2]
      };
      const tiers = [
        {
          name: 'low', color: 3, floorAtlas: lowFloorAtlas, left: 82, top: 38,
          ranges: [[6, 15], [3, 18], [2, 19], [1, 20], [0, 21], [0, 21], [0, 21], [0, 21], [1, 20], [2, 19], [3, 18], [5, 16]]
        },
        {
          name: 'middle', color: 2, floorAtlas: upperFloorAtlas, left: 258, top: 172,
          ranges: [[4, 10], [2, 12], [1, 13], [0, 14], [0, 14], [0, 14], [1, 13], [2, 12], [4, 10]]
        },
        {
          name: 'high', color: 1, floorAtlas: upperFloorAtlas, left: 575, top: 108,
          ranges: [[3, 8], [1, 10], [0, 11], [0, 11], [1, 10], [3, 8]]
        }
      ];

      tiers.forEach((tier, tierIndex) => {
        const occupied = new Set();
        tier.ranges.forEach(([from, to], row) => {
          for (let column = from; column <= to; column++) occupied.add(`${column},${row}`);
        });
        const has = (column, row) => occupied.has(`${column},${row}`);
        const pickTile = (column, row) => {
          const north = has(column, row - 1);
          const south = has(column, row + 1);
          const west = has(column - 1, row);
          const east = has(column + 1, row);
          if (!north && !west) return tier.floorAtlas.northWest;
          if (!north && !east) return tier.floorAtlas.northEast;
          if (!south && !west) return tier.floorAtlas.southWest;
          if (!south && !east) return tier.floorAtlas.southEast;
          if (!north) return tier.floorAtlas.north;
          if (!south) return tier.floorAtlas.south;
          if (!west) return tier.floorAtlas.west;
          if (!east) return tier.floorAtlas.east;
          return tier.floorAtlas.center;
        };
        const layer = document.createElement('div');
        layer.className = `terrain-tier terrain-tier--${tier.name}`;
        layer.style.zIndex = `${tierIndex}`;
        const fragment = document.createDocumentFragment();
        occupied.forEach(key => {
          const [column, row] = key.split(',').map(Number);
          const [atlasColumn, atlasRow] = pickTile(column, row);
          const tile = document.createElement('div');
          tile.className = 'terrain-tile';
          tile.style.left = `${tier.left + column * atlasSize}px`;
          tile.style.top = `${tier.top + row * atlasSize}px`;
          tile.style.backgroundImage = `url("${A(`Terrain/Tileset/Tilemap_color${tier.color}.png`)}")`;
          tile.style.backgroundPosition = `${-atlasColumn * atlasSize}px ${-atlasRow * atlasSize}px`;
          fragment.appendChild(tile);
        });
        layer.appendChild(fragment);
        document.getElementById('island').appendChild(layer);
      });

      // The blue-marked stone row is used only as the front edge of each rise.
      // The authored stair/ramp block from the left connects the elevations.
      const rimLayer = document.createElement('div');
      rimLayer.className = 'terrain-tier terrain-tier--rims';
      rimLayer.style.zIndex = '3';
      const addAtlasRegion = ({ color, x, y, sourceColumn, sourceRow, columns, rows }) => {
        const fragment = document.createDocumentFragment();
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            const tile = document.createElement('div');
            tile.className = 'terrain-tile';
            tile.style.left = `${x + column * atlasSize}px`;
            tile.style.top = `${y + row * atlasSize}px`;
            tile.style.backgroundImage = `url("${A(`Terrain/Tileset/Tilemap_color${color}.png`)}")`;
            tile.style.backgroundPosition = `${-(sourceColumn + column) * atlasSize}px ${-(sourceRow + row) * atlasSize}px`;
            fragment.appendChild(tile);
          }
        }
        rimLayer.appendChild(fragment);
      };
      const stairs = { sourceColumn: 0, sourceRow: 3, columns: 3, rows: 3 };

      const addWallRun = (color, x, y, length) => {
        const fragment = document.createDocumentFragment();
        for (let column = 0; column < length; column++) {
          const sourceColumn = column === 0 ? 5 : column === length - 1 ? 7 : 6;
          const tile = document.createElement('div');
          tile.className = 'terrain-tile';
          tile.style.left = `${x + column * atlasSize}px`;
          tile.style.top = `${y}px`;
          tile.style.backgroundImage = `url("${A(`Terrain/Tileset/Tilemap_color${color}.png`)}")`;
          tile.style.backgroundPosition = `${-sourceColumn * atlasSize}px ${-5 * atlasSize}px`;
          fragment.appendChild(tile);
        }
        rimLayer.appendChild(fragment);
      };

      // Front edges align with the southern outline of each upper matrix.
      addWallRun(1, 767, 492, 6);
      addWallRun(2, 514, 748, 7);

      // Two authored stair sections provide readable crossings between levels.
      addAtlasRegion({ color: 1, x: 512, y: 332, ...stairs });
      addAtlasRegion({ color: 2, x: 258, y: 530, ...stairs });
      document.getElementById('island').appendChild(rimLayer);
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

    createFoam() {
      const foam = [[355, 310], [620, 170], [1080, 150], [1480, 300], [1590, 630], [1280, 900], [800, 915], [390, 700]];
      foam.forEach(([x, y]) => this.addAnimated('Terrain/Tileset/Water Foam.png', x, y, 192, 192, 16, 6, -70, 'scenery foam'));
    }

    createScenery() {
      // Forests frame the south-west work area and the far eastern coast,
      // leaving the homes, mine and military yard readable.
      const trees = [
        [500, 780, 'Tree4.png', 1], [560, 835, 'Tree1.png', 0], [640, 875, 'Tree2.png', 2],
        [740, 890, 'Tree3.png', 4], [820, 850, 'Tree4.png', 3],
        [1260, 800, 'Tree1.png', 3], [1370, 740, 'Tree3.png', 2], [1200, 850, 'Tree2.png', 5],
        [1360, 700, 'Tree4.png', 0]
      ];
      trees.forEach(([x, y, file, frame]) => this.addStaticTree(x, y, file, frame));
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

    addStaticTree(x, groundY, file, frame) {
      const frameWidth = 256;
      const frameHeight = /Tree[12]/.test(file) ? 256 : 192;
      const tree = document.createElement('div');
      tree.className = 'scenery';
      tree.style.width = `${frameWidth}px`;
      tree.style.height = `${frameHeight}px`;
      tree.style.transform = `translate3d(${x - frameWidth / 2}px, ${groundY - frameHeight}px, 0)`;
      tree.style.zIndex = `${100 + Math.floor(groundY) + 18}`;
      tree.style.backgroundImage = `url("${A(`Terrain/Resources/Wood/Trees/${file}`)}")`;
      tree.style.backgroundSize = `${frameWidth * 6}px ${frameHeight}px`;
      tree.style.backgroundPosition = `${-frame * frameWidth}px 0`;
      this.objects.appendChild(tree);
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
