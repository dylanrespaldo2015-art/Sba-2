import * as THREE from 'three';

export interface Platform {
  mesh: THREE.Mesh | THREE.Group;
  box: THREE.Box3;
  type: 'static' | 'moving' | 'rotating' | 'cloud' | 'bounce';
  moveAxis?: 'x' | 'y' | 'z';
  moveRange?: number;
  moveSpeed?: number;
  basePos?: THREE.Vector3;
  rotSpeed?: number;
  bounceForce?: number;
}

export interface Collectible {
  id: string;
  mesh: THREE.Group;
  type: 'honey' | 'coin';
  pos: THREE.Vector3;
  collected: boolean;
  value: number;
}

export interface BreakableCrate {
  id: string;
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  broken: boolean;
}

export interface Enemy {
  id: string;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  basePos: THREE.Vector3;
  patrolRange: number;
  speed: number;
  type: 'chestnut' | 'bee';
  isDefeated: boolean;
  animTime: number;
}

export interface LevelData {
  id: number;
  name: string;
  subtitle: string;
  skyColor: number;
  fogColor: number;
  lightWarmth: number;
  spawnPoint: THREE.Vector3;
  goalPoint: THREE.Vector3;
  platforms: Platform[];
  collectibles: Collectible[];
  crates: BreakableCrate[];
  enemies: Enemy[];
  scenery: THREE.Group;
  goalMesh: THREE.Group;
}

export class LevelBuilder {
  private grassMat: THREE.MeshStandardMaterial;
  private rockMat: THREE.MeshStandardMaterial;
  private woodMat: THREE.MeshStandardMaterial;
  private honeyJarMat: THREE.MeshStandardMaterial;
  private honeyGlowMat: THREE.MeshBasicMaterial;
  private coinMat: THREE.MeshStandardMaterial;
  private mushroomCapMat: THREE.MeshStandardMaterial;
  private mushroomStemMat: THREE.MeshStandardMaterial;
  private crateMat: THREE.MeshStandardMaterial;
  private beeYellowMat: THREE.MeshStandardMaterial;
  private beeBlackMat: THREE.MeshStandardMaterial;
  private chestnutMat: THREE.MeshStandardMaterial;

  constructor() {
    this.grassMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.8,
      metalness: 0.05,
    });
    this.rockMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      roughness: 0.75,
      metalness: 0.05,
    });
    this.honeyJarMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.1,
    });
    this.honeyGlowMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
    });
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.3,
      metalness: 0.8,
    });
    this.mushroomCapMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.4,
      metalness: 0.1,
    });
    this.mushroomStemMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.7,
      metalness: 0.05,
    });
    this.crateMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.beeYellowMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.4,
      metalness: 0.1,
    });
    this.beeBlackMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.5,
      metalness: 0.2,
    });
    this.chestnutMat = new THREE.MeshStandardMaterial({
      color: 0x713f12,
      roughness: 0.8,
      metalness: 0.1,
    });
  }

  // --- Island Platform Generator ---
  public createIsland(x: number, y: number, z: number, w: number, h: number, d: number, grassColor = 0x4ade80): Platform {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Stone base
    const baseGeo = new THREE.BoxGeometry(w, h, d);
    const baseMesh = new THREE.Mesh(baseGeo, this.rockMat);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    group.add(baseMesh);

    // Green grass cap
    const capGeo = new THREE.BoxGeometry(w + 0.2, 0.4, d + 0.2);
    const capMat = this.grassMat.clone();
    capMat.color.set(grassColor);
    const capMesh = new THREE.Mesh(capGeo, capMat);
    capMesh.position.y = h / 2 + 0.1;
    capMesh.castShadow = true;
    capMesh.receiveShadow = true;
    group.add(capMesh);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      new THREE.Vector3(x, y + h / 2 + 0.15, z),
      new THREE.Vector3(w + 0.2, h + 0.4, d + 0.2)
    );

    return {
      mesh: group,
      box,
      type: 'static',
      basePos: new THREE.Vector3(x, y, z),
    };
  }

  // --- Moving Platform ---
  public createMovingPlatform(
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    axis: 'x' | 'y' | 'z',
    range: number,
    speed: number
  ): Platform {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const geo = new THREE.BoxGeometry(w, 0.6, d);
    const mesh = new THREE.Mesh(geo, this.woodMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);

    // Glowing energy trim
    const trimGeo = new THREE.BoxGeometry(w + 0.1, 0.1, d + 0.1);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = -0.25;
    group.add(trim);

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, 0.6, d));

    return {
      mesh: group,
      box,
      type: 'moving',
      moveAxis: axis,
      moveRange: range,
      moveSpeed: speed,
      basePos: new THREE.Vector3(x, y, z),
    };
  }

  // --- Bouncy Super Mushroom ---
  public createBounceMushroom(x: number, y: number, z: number): Platform {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // White Stem
    const stemGeo = new THREE.CylinderGeometry(0.5, 0.7, 1.2, 12);
    const stem = new THREE.Mesh(stemGeo, this.mushroomStemMat);
    stem.position.y = 0.6;
    stem.castShadow = true;
    group.add(stem);

    // Red Cap
    const capGeo = new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, this.mushroomCapMat);
    cap.position.y = 1.1;
    cap.scale.set(1, 0.65, 1);
    cap.castShadow = true;
    group.add(cap);

    // White polka dots on cap
    const dotGeo = new THREE.SphereGeometry(0.2, 8, 8);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const dot = new THREE.Mesh(dotGeo, this.mushroomStemMat);
      dot.position.set(Math.cos(angle) * 0.75, 1.35, Math.sin(angle) * 0.75);
      group.add(dot);
    }

    const box = new THREE.Box3();
    box.setFromCenterAndSize(new THREE.Vector3(x, y + 1.0, z), new THREE.Vector3(2.2, 1.4, 2.2));

    return {
      mesh: group,
      box,
      type: 'bounce',
      bounceForce: 24,
      basePos: new THREE.Vector3(x, y, z),
    };
  }

  // --- Collectible Honey Pot (Tarro de Miel) ---
  public createHoneyPot(id: string, x: number, y: number, z: number): Collectible {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Pot Body
    const potGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.65, 16);
    const pot = new THREE.Mesh(potGeo, this.honeyJarMat);
    pot.castShadow = true;
    group.add(pot);

    // Honey Rim / Lid
    const lidGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 16);
    const lid = new THREE.Mesh(lidGeo, this.woodMat);
    lid.position.y = 0.35;
    group.add(lid);

    // Honey Drop emblem on front
    const emblemGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const emblem = new THREE.Mesh(emblemGeo, this.honeyGlowMat);
    emblem.position.set(0, 0, 0.36);
    group.add(emblem);

    return {
      id,
      mesh: group,
      type: 'honey',
      pos: new THREE.Vector3(x, y, z),
      collected: false,
      value: 100,
    };
  }

  // --- Collectible Gold Coin (Moneda de Oro) ---
  public createCoin(id: string, x: number, y: number, z: number): Collectible {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
    const coin = new THREE.Mesh(coinGeo, this.coinMat);
    coin.rotation.x = Math.PI / 2;
    coin.castShadow = true;
    group.add(coin);

    return {
      id,
      mesh: group,
      type: 'coin',
      pos: new THREE.Vector3(x, y, z),
      collected: false,
      value: 20,
    };
  }

  // --- Breakable Wooden Crate ---
  public createCrate(id: string, x: number, y: number, z: number): BreakableCrate {
    const geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const mesh = new THREE.Mesh(geo, this.crateMat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return {
      id,
      mesh,
      pos: new THREE.Vector3(x, y, z),
      broken: false,
    };
  }

  // --- Enemy: Spiky Chestnut (Castaña Pinchuda) ---
  public createChestnutEnemy(id: string, x: number, y: number, z: number, range = 4, speed = 2.0): Enemy {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Body sphere
    const bodyGeo = new THREE.SphereGeometry(0.48, 12, 12);
    const body = new THREE.Mesh(bodyGeo, this.chestnutMat);
    body.castShadow = true;
    group.add(body);

    // Spikes
    const spikeGeo = new THREE.ConeGeometry(0.12, 0.3, 6);
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x451a03 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(spikeGeo, spikeMat);
      spike.position.set(Math.cos(angle) * 0.45, Math.sin(angle) * 0.45, 0);
      spike.rotation.z = angle - Math.PI / 2;
      group.add(spike);
    }

    // Angry eyes
    const eyeGeo = new THREE.SphereGeometry(0.08, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(0.16, 0.12, 0.42);
    const leftPupil = new THREE.Mesh(eyeGeo, pupilMat);
    leftPupil.scale.set(0.5, 0.5, 0.5);
    leftPupil.position.set(0.16, 0.12, 0.48);
    group.add(leftEye);
    group.add(leftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(-0.16, 0.12, 0.42);
    const rightPupil = new THREE.Mesh(eyeGeo, pupilMat);
    rightPupil.scale.set(0.5, 0.5, 0.5);
    rightPupil.position.set(-0.16, 0.12, 0.48);
    group.add(rightEye);
    group.add(rightPupil);

    return {
      id,
      mesh: group,
      pos: new THREE.Vector3(x, y, z),
      basePos: new THREE.Vector3(x, y, z),
      patrolRange: range,
      speed,
      type: 'chestnut',
      isDefeated: false,
      animTime: Math.random() * 10,
    };
  }

  // --- Enemy: Patrol Bee (Abeja Guardiana) ---
  public createBeeEnemy(id: string, x: number, y: number, z: number, range = 5, speed = 2.5): Enemy {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Striped Body
    const bodyGeo = new THREE.SphereGeometry(0.42, 12, 10);
    const body = new THREE.Mesh(bodyGeo, this.beeYellowMat);
    body.scale.set(0.9, 0.9, 1.3);
    body.castShadow = true;
    group.add(body);

    // Black stripes
    const stripeGeo = new THREE.TorusGeometry(0.38, 0.05, 8, 16);
    for (let zOffset of [-0.15, 0.1]) {
      const stripe = new THREE.Mesh(stripeGeo, this.beeBlackMat);
      stripe.position.z = zOffset;
      group.add(stripe);
    }

    // Wings
    const wingGeo = new THREE.PlaneGeometry(0.35, 0.6);
    const wingMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.name = 'leftWing';
    leftWing.rotation.x = -Math.PI / 2;
    leftWing.position.set(0.3, 0.35, 0);
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.name = 'rightWing';
    rightWing.rotation.x = -Math.PI / 2;
    rightWing.position.set(-0.3, 0.35, 0);
    group.add(rightWing);

    // Stinger
    const stingerGeo = new THREE.ConeGeometry(0.08, 0.25, 8);
    const stinger = new THREE.Mesh(stingerGeo, this.beeBlackMat);
    stinger.rotation.x = -Math.PI / 2;
    stinger.position.set(0, 0, -0.6);
    group.add(stinger);

    return {
      id,
      mesh: group,
      pos: new THREE.Vector3(x, y, z),
      basePos: new THREE.Vector3(x, y, z),
      patrolRange: range,
      speed,
      type: 'bee',
      isDefeated: false,
      animTime: Math.random() * 10,
    };
  }

  // --- Goal Trophy: Golden Giant Honeycomb Trophy ---
  public createGoalTrophy(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Marble/stone pedestal
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.8, 8);
    const pedestal = new THREE.Mesh(pedestalGeo, this.rockMat);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    group.add(pedestal);

    // Rotating Golden Honeycomb Trophy
    const trophyGroup = new THREE.Group();
    trophyGroup.name = 'TrophyRotating';
    trophyGroup.position.y = 1.6;

    // Hexagonal Honeycomb Core
    const hexGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.8, 6);
    const trophyMesh = new THREE.Mesh(hexGeo, this.coinMat);
    trophyMesh.castShadow = true;
    trophyGroup.add(trophyMesh);

    // Surrounding star ring
    const ringGeo = new THREE.TorusGeometry(1.4, 0.08, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 4;
    trophyGroup.add(ring);

    // Glowing honey beam
    const beamGeo = new THREE.CylinderGeometry(0.3, 0.3, 6, 12);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.35,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 2.5;
    group.add(beam);

    group.add(trophyGroup);
    return group;
  }

  // --- Atmospheric Scenery (Trees, clouds, flowers, floating rocks) ---
  public createScenery(theme: 'meadow' | 'canyon' | 'sky'): THREE.Group {
    const scenery = new THREE.Group();

    // Low poly trees
    const treeTrunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.4, 6);
    const trunkMat = this.woodMat;
    const foliageGeo = new THREE.ConeGeometry(1.2, 2.2, 6);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: theme === 'canyon' ? 0xd97706 : 0x22c55e,
      roughness: 0.8,
    });

    const treePositions = [
      [-6, 0.7, -4],
      [7, 0.7, -5],
      [-5, 0.7, 8],
      [12, 0.7, 4],
      [-10, 0.7, 14],
    ];

    treePositions.forEach(([tx, ty, tz]) => {
      const tree = new THREE.Group();
      tree.position.set(tx, ty, tz);
      const trunk = new THREE.Mesh(treeTrunkGeo, trunkMat);
      trunk.position.y = 0.7;
      trunk.castShadow = true;
      tree.add(trunk);

      const leaves = new THREE.Mesh(foliageGeo, foliageMat);
      leaves.position.y = 2.2;
      leaves.castShadow = true;
      tree.add(leaves);
      scenery.add(tree);
    });

    // Puffy floating clouds in background
    const cloudGeo = new THREE.DodecahedronGeometry(2.5, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.88,
    });

    const cloudCoords = [
      [-22, 14, -20],
      [25, 18, -15],
      [-18, 16, 25],
      [20, 20, 20],
      [0, 24, -30],
    ];

    cloudCoords.forEach(([cx, cy, cz]) => {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(cx, cy, cz);
      for (let i = 0; i < 4; i++) {
        const lump = new THREE.Mesh(cloudGeo, cloudMat);
        lump.position.set(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 3
        );
        lump.scale.set(
          1 + Math.random() * 0.5,
          0.7 + Math.random() * 0.4,
          1 + Math.random() * 0.5
        );
        cloudGroup.add(lump);
      }
      scenery.add(cloudGroup);
    });

    return scenery;
  }

  // ==========================================
  // LEVEL 1: ISLA PRADO SOLEADO
  // ==========================================
  public buildLevel1(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const crates: BreakableCrate[] = [];
    const enemies: Enemy[] = [];

    // Starting main island
    platforms.push(this.createIsland(0, 0, 0, 10, 2, 10));

    // Wooden connector bridge / stepping platforms
    platforms.push(this.createIsland(0, 0.4, 8, 4, 1.6, 3));
    platforms.push(this.createIsland(0, 0.8, 14, 5, 1.8, 5));

    // Moving horizontal platform
    platforms.push(this.createMovingPlatform(0, 1.6, 20, 4, 4, 'z', 4, 2));

    // Second Island with Bouncy Super Mushroom
    platforms.push(this.createIsland(0, 2.0, 28, 9, 2.4, 9));
    platforms.push(this.createBounceMushroom(0, 3.3, 28));

    // High floating island reachable from the bounce mushroom!
    platforms.push(this.createIsland(0, 9.5, 28, 6, 1.5, 6));

    // Stepping stones to the Goal
    platforms.push(this.createIsland(7, 9.0, 28, 3.5, 1.2, 3.5));
    platforms.push(this.createMovingPlatform(14, 8.5, 28, 3.5, 3.5, 'y', 2.5, 1.8));

    // Final Victory Island
    platforms.push(this.createIsland(22, 9.0, 28, 10, 2.6, 10));

    // Goal Trophy at final island
    const goalMesh = this.createGoalTrophy(22, 10.4, 28);
    const goalPoint = new THREE.Vector3(22, 10.5, 28);

    // Collectibles (Tarros de Miel & Monedas)
    collectibles.push(this.createHoneyPot('h1', 0, 1.8, 4));
    collectibles.push(this.createHoneyPot('h2', 0, 2.2, 14));
    collectibles.push(this.createHoneyPot('h3', 0, 11.2, 28)); // High reward
    collectibles.push(this.createHoneyPot('h4', 7, 10.8, 28));
    collectibles.push(this.createHoneyPot('h5', 22, 11.2, 25));

    // Coins forming paths
    [2, 4, 6].forEach((z, idx) => {
      collectibles.push(this.createCoin(`c1_${idx}`, 0, 1.4, z));
    });
    [-2, 0, 2].forEach((x, idx) => {
      collectibles.push(this.createCoin(`c2_${idx}`, x, 2.2, 14));
    });
    // High coin ring above bounce mushroom
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      collectibles.push(
        this.createCoin(
          `c_ring_${i}`,
          Math.cos(angle) * 2.2,
          7.2 + Math.sin(angle) * 0.5,
          28 + Math.sin(angle) * 2.2
        )
      );
    }

    // Crates
    crates.push(this.createCrate('cr1', 3, 1.6, 0));
    crates.push(this.createCrate('cr2', -3, 1.6, 0));
    crates.push(this.createCrate('cr3', 2, 3.9, 31));

    // Enemies
    enemies.push(this.createChestnutEnemy('e1', 0, 1.5, 14, 3, 1.8));
    enemies.push(this.createBeeEnemy('e2', 0, 4.5, 22, 4, 2.2));
    enemies.push(this.createChestnutEnemy('e3', 20, 10.6, 28, 3, 2.0));

    return {
      id: 1,
      name: 'Isla Prado Soleado',
      subtitle: 'Aprende los saltos, usa el champiñón elástico y alcanza la colmena.',
      skyColor: 0x7dd3fc,
      fogColor: 0xbae6fd,
      lightWarmth: 0xfffbeb,
      spawnPoint: new THREE.Vector3(0, 1.5, -2),
      goalPoint,
      platforms,
      collectibles,
      crates,
      enemies,
      scenery: this.createScenery('meadow'),
      goalMesh,
    };
  }

  // ==========================================
  // LEVEL 2: CAÑÓN DEL PANAL
  // ==========================================
  public buildLevel2(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const crates: BreakableCrate[] = [];
    const enemies: Enemy[] = [];

    // Warm canyon colors
    const canyonGrass = 0xeab308; // Golden grass

    platforms.push(this.createIsland(0, 0, 0, 9, 2.2, 9, canyonGrass));

    // Moving canyon bridges
    platforms.push(this.createMovingPlatform(0, 1.2, 8, 4, 3, 'x', 4, 2.5));
    platforms.push(this.createIsland(0, 2.0, 17, 7, 2, 7, canyonGrass));

    // Vertical elevator platform
    platforms.push(this.createMovingPlatform(0, 3.0, 24, 4, 4, 'y', 4.5, 2.0));

    // High plateau with double bounce mushrooms!
    platforms.push(this.createIsland(0, 8.0, 32, 10, 2.5, 10, canyonGrass));
    platforms.push(this.createBounceMushroom(-2.5, 9.3, 32));
    platforms.push(this.createBounceMushroom(2.5, 9.3, 32));

    // Series of small floating stepping stones
    platforms.push(this.createIsland(0, 16.0, 32, 4, 1.2, 4, canyonGrass));
    platforms.push(this.createIsland(6, 16.5, 32, 3.5, 1.2, 3.5, canyonGrass));
    platforms.push(this.createMovingPlatform(13, 17.0, 32, 3.5, 3.5, 'z', 3.5, 2.8));

    // Final canyon sanctuary
    platforms.push(this.createIsland(22, 17.5, 32, 11, 2.8, 11, canyonGrass));

    const goalMesh = this.createGoalTrophy(22, 19.0, 32);
    const goalPoint = new THREE.Vector3(22, 19.0, 32);

    // Honey pots
    collectibles.push(this.createHoneyPot('h2_1', 0, 1.8, 0));
    collectibles.push(this.createHoneyPot('h2_2', 0, 3.6, 17));
    collectibles.push(this.createHoneyPot('h2_3', 0, 17.6, 32));
    collectibles.push(this.createHoneyPot('h2_4', 6, 18.2, 32));
    collectibles.push(this.createHoneyPot('h2_5', 22, 19.8, 30));

    // Golden coins
    for (let i = 0; i < 8; i++) {
      collectibles.push(this.createCoin(`c2_${i}`, (i - 4) * 0.8, 9.6, 30));
    }

    // Crates
    crates.push(this.createCrate('cr2_1', 2, 1.7, -2));
    crates.push(this.createCrate('cr2_2', -2, 1.7, -2));
    crates.push(this.createCrate('cr2_3', 2, 3.6, 17));
    crates.push(this.createCrate('cr2_4', 20, 19.2, 34));

    // Enemies (Rollers and flying bees)
    enemies.push(this.createChestnutEnemy('e2_1', 0, 3.4, 17, 3, 2.5));
    enemies.push(this.createBeeEnemy('e2_2', 0, 10.5, 26, 4, 3.0));
    enemies.push(this.createBeeEnemy('e2_3', 10, 18.5, 32, 3, 2.8));
    enemies.push(this.createChestnutEnemy('e2_4', 22, 19.2, 32, 4, 2.5));

    return {
      id: 2,
      name: 'Cañón del Panal',
      subtitle: 'Ascenso vertiginoso por las gargantas de miel y plataformas móviles.',
      skyColor: 0xfde047,
      fogColor: 0xfef08a,
      lightWarmth: 0xffedd5,
      spawnPoint: new THREE.Vector3(0, 1.5, -2),
      goalPoint,
      platforms,
      collectibles,
      crates,
      enemies,
      scenery: this.createScenery('canyon'),
      goalMesh,
    };
  }

  // ==========================================
  // LEVEL 3: SANTUARIO DE LAS NUBES
  // ==========================================
  public buildLevel3(): LevelData {
    const platforms: Platform[] = [];
    const collectibles: Collectible[] = [];
    const crates: BreakableCrate[] = [];
    const enemies: Enemy[] = [];

    const skyGrass = 0x67e8f9; // Cyan crystal grass

    // Starting clouds
    platforms.push(this.createIsland(0, 0, 0, 9, 2.0, 9, skyGrass));

    // Rotating and moving platforms in sequence
    platforms.push(this.createMovingPlatform(0, 1.5, 8, 3.5, 3.5, 'x', 5, 3.0));
    platforms.push(this.createMovingPlatform(0, 3.0, 16, 3.5, 3.5, 'z', 4, 3.2));
    platforms.push(this.createIsland(0, 4.0, 24, 7, 1.8, 7, skyGrass));

    // Bounce mushroom launch to cloud heights!
    platforms.push(this.createBounceMushroom(0, 5.0, 24));

    // Floating sky island
    platforms.push(this.createIsland(0, 13.0, 24, 6, 1.4, 6, skyGrass));

    // High altitude moving elevators
    platforms.push(this.createMovingPlatform(7, 14.0, 24, 3.5, 3.5, 'y', 4, 2.6));
    platforms.push(this.createMovingPlatform(15, 18.0, 24, 3.5, 3.5, 'x', 4, 3.0));

    // Grand Cloud Citadel
    platforms.push(this.createIsland(24, 19.0, 24, 12, 3.0, 12, skyGrass));

    const goalMesh = this.createGoalTrophy(24, 20.8, 24);
    const goalPoint = new THREE.Vector3(24, 20.8, 24);

    // Collectibles
    collectibles.push(this.createHoneyPot('h3_1', 0, 1.6, 2));
    collectibles.push(this.createHoneyPot('h3_2', 0, 5.5, 24));
    collectibles.push(this.createHoneyPot('h3_3', 0, 14.5, 24));
    collectibles.push(this.createHoneyPot('h3_4', 15, 19.5, 24));
    collectibles.push(this.createHoneyPot('h3_5', 24, 21.6, 21));

    for (let i = 0; i < 10; i++) {
      collectibles.push(this.createCoin(`c3_${i}`, (i - 5) * 0.9, 14.5, 24));
    }

    // Crates
    crates.push(this.createCrate('cr3_1', -2, 1.6, -1));
    crates.push(this.createCrate('cr3_2', 2, 1.6, -1));
    crates.push(this.createCrate('cr3_3', 22, 21.0, 27));

    // Fast Bees and Rolling Enemies
    enemies.push(this.createBeeEnemy('e3_1', 0, 4.5, 12, 4, 3.2));
    enemies.push(this.createBeeEnemy('e3_2', 0, 14.5, 20, 5, 3.5));
    enemies.push(this.createBeeEnemy('e3_3', 18, 20.0, 24, 4, 3.6));
    enemies.push(this.createChestnutEnemy('e3_4', 24, 21.0, 24, 4, 3.0));

    return {
      id: 3,
      name: 'Santuario de las Nubes',
      subtitle: 'La prueba definitiva en las alturas celestes. ¡Consigue la Colmena Real!',
      skyColor: 0x60a5fa,
      fogColor: 0x93c5fd,
      lightWarmth: 0xf8fafc,
      spawnPoint: new THREE.Vector3(0, 1.5, -2),
      goalPoint,
      platforms,
      collectibles,
      crates,
      enemies,
      scenery: this.createScenery('sky'),
      goalMesh,
    };
  }
}
