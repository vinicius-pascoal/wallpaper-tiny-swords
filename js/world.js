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
          name: 'low', color: 3, floorAtlas: lowFloorAtlas, left: 65, top: 35,
          ranges: [[9, 17], [6, 21], [3, 24], [1, 26], [0, 26], [0, 25], [0, 26], [0, 26], [0, 25], [0, 26], [1, 26], [2, 24], [4, 22], [7, 20], [10, 17]]
        },
        {
          name: 'middle', color: 2, floorAtlas: upperFloorAtlas, left: 408, top: 272,
          ranges: [[4, 10], [2, 12], [1, 13], [0, 14], [0, 14], [0, 14], [1, 13], [2, 12], [4, 10]]
        },
        {
          name: 'high', color: 1, floorAtlas: upperFloorAtlas, left: 725, top: 208,
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
      addWallRun(1, 917, 592, 6);
      addWallRun(2, 664, 848, 7);

      // Two authored stair sections provide readable crossings between levels.
      addAtlasRegion({ color: 1, x: 662, y: 432, ...stairs });
      addAtlasRegion({ color: 2, x: 408, y: 630, ...stairs });
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

    addAnimated(path, x, groundY, frameWidth, frameHeight, frames, fps, zOffset = 0, className = 'scenery', startFrame = 0) {
      const element = document.createElement('div');
      element.className = className;
      element.style.transform = `translate3d(${x - frameWidth / 2}px, ${groundY - frameHeight}px, 0)`;
      element.style.zIndex = `${100 + Math.floor(groundY) + zOffset}`;
      this.objects.appendChild(element);
      const animation = { url: A(path), frameWidth, frameHeight, frames, fps };
      const animator = new SpriteAnimator(element, animation);
      animator.frame = startFrame % frames;
      animator.render();
      this.animators.push(animator);
      return element;
    }

    createFoam() {
      const foam = [[210, 330], [610, 90], [1140, 65], [1640, 250], [1775, 610], [1510, 890], [980, 975], [340, 845]];
      foam.forEach(([x, y]) => this.addAnimated('Terrain/Tileset/Water Foam.png', x, y, 192, 192, 16, 6, -70, 'scenery foam'));
    }

    createScenery() {
      // Forests frame the south-west work area and the far eastern coast,
      // leaving the homes, mine and military yard readable.
      const trees = [
        // Dense forest belt on the exposed, lowest terrain only.
        [320, 490, 'Tree1.png', 1], [270, 570, 'Tree4.png', 3], [270, 690, 'Tree4.png', 1],
        [380, 780, 'Tree1.png', 0], [505, 845, 'Tree2.png', 2], [640, 895, 'Tree3.png', 4],
        [760, 865, 'Tree4.png', 3], [850, 920, 'Tree1.png', 5], [975, 940, 'Tree2.png', 1],
        [1100, 920, 'Tree3.png', 0], [1390, 890, 'Tree4.png', 4], [1500, 820, 'Tree2.png', 3],
        [1660, 720, 'Tree1.png', 2], [1720, 640, 'Tree3.png', 5], [1670, 560, 'Tree4.png', 0],
        [1570, 680, 'Tree1.png', 3], [1530, 770, 'Tree3.png', 2], [1435, 845, 'Tree2.png', 5]
      ];
      trees.forEach(([x, y, file, phase]) => this.addAnimated(
        `Terrain/Resources/Wood/Trees/${file}`,
        x,
        y,
        192,
        /Tree[12]/.test(file) ? 256 : 192,
        8,
        4,
        18,
        'scenery tree',
        phase
      ));
      const bushes = [[455, 650], [590, 740], [720, 900], [1450, 720], [1280, 880], [1510, 550], [325, 585]];
      bushes.forEach(([x, y], index) => this.addAnimated(`Terrain/Decorations/Bushes/Bushe${index % 4 + 1}.png`, x, y, 128, 128, 8, 3, 15));
      [[1260, 795, 'Gold Stone 1.png'], [1360, 770, 'Gold Stone 3.png'], [1320, 855, 'Gold Stone 5.png']].forEach(([x, y, file]) => this.addImage(`Terrain/Resources/Gold/Gold Stones/${file}`, x, y, 128, 128, 'scenery', 20));
      [[790, 790], [1510, 430], [370, 510], [1435, 350]].forEach(([x, y], index) => this.addImage(`Terrain/Decorations/Rocks/Rock${index + 1}.png`, x, y, 64, 64, 'scenery', 10));
      [[85, 400], [1815, 660], [1695, 190]].forEach(([x, y], index) => this.addAnimated(`Terrain/Decorations/Rocks in the Water/Water Rocks_0${index + 1}.png`, x, y, 64, 64, 16, 5, -60));
      this.addImage('Terrain/Resources/Wood/Wood Resource/Wood Resource.png', 350, 750, 64, 64, 'scenery', 31);
      this.addImage('Terrain/Resources/Meat/Meat Resource/Meat Resource.png', 350, 625, 64, 64, 'scenery', 31);
      this.addFire(1080, 560);
      this.addFire(690, 600);
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
        ['Castle.png', 1000, 365, 320, 256],
        ['Tower.png', 1305, 445, 128, 256],
        ['Barracks.png', 1110, 650, 192, 256],
        ['Archery.png', 1400, 700, 192, 256],
        ['Monastery.png', 555, 500, 192, 320],
        ['House1.png', 330, 625, 128, 192],
        ['House2.png', 485, 705, 128, 192],
        ['House3.png', 700, 745, 128, 192],
        ['House1.png', 480, 795, 128, 192]
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
