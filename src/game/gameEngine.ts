import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { sound } from './audio.ts';
import { BearCharacter, BearCustomization, DEFAULT_BEAR_CONFIG } from './character.ts';
import { LevelBuilder, LevelData } from './levels.ts';
import { ParticleSystem } from './particles.ts';

export type GameMode = 'title' | 'playing' | 'paused' | 'victory' | 'gameover' | 'inspect';

export interface GameState {
  mode: GameMode;
  levelIndex: number;
  totalLevels: number;
  levelName: string;
  honeyCount: number;
  maxHoney: number;
  coins: number;
  score: number;
  lives: number;
  maxLives: number;
  timeElapsed: number;
  isMuted: boolean;
}

export class GameEngine {
  private container: HTMLElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  // Character
  public player!: BearCharacter;
  private playerVelocity = new THREE.Vector3();
  private isGrounded = false;
  private jumpsRemaining = 2;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private isSpinning = false;
  private spinTimer = 0;
  private isGroundPounding = false;
  private groundPoundTimer = 0;
  private activePlatformVelocity = new THREE.Vector3();
  private lastActivePlatformPos = new THREE.Vector3();

  // Levels & Builder
  private levelBuilder: LevelBuilder;
  private currentLevelData: LevelData | null = null;
  private levelIndex = 1;
  private totalLevels = 3;

  // Particles
  private particles!: ParticleSystem;

  // Camera Orbit
  private cameraOffset = new THREE.Vector3(0, 4.2, -8.5);
  private cameraPitch = 0.35;
  private cameraYaw = 0;
  private targetYaw = 0;
  private isPointerDown = false;
  private lastPointerPos = { x: 0, y: 0 };

  // Lighting
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;

  // Input states
  private keys: { [key: string]: boolean } = {};
  private justPressedKeys: { [key: string]: boolean } = {};
  public touchInput = {
    moveX: 0,
    moveY: 0,
    jump: false,
    spin: false,
    pound: false,
  };

  // Game state
  private mode: GameMode = 'title';
  private honeyCount = 0;
  private maxHoney = 5;
  private coins = 0;
  private score = 0;
  private lives = 3;
  private maxLives = 3;
  private timeElapsed = 0;
  private onStateChange?: (state: GameState) => void;

  // Lifecycle
  private isSoftwareGl = false;
  private animFrameId = 0;
  private isRunning = false;

  constructor(container: HTMLElement, onStateChange?: (state: GameState) => void) {
    this.container = container;
    this.onStateChange = onStateChange;
    this.clock = new THREE.Clock();
    this.levelBuilder = new LevelBuilder();

    this.initWebGL();
    this.initScene();
    this.initEvents();
    this.loadLevel(1);
    this.setMode('title');
    this.startLoop();
  }

  private initWebGL() {
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc);
    this.scene.fog = new THREE.Fog(0xbae6fd, 25, 75);

    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(54, aspect, 0.1, 200);

    // Studio Environment map
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback
    }

    // Warm Key Light
    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    this.dirLight.position.set(20, 35, 15);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 100;
    const d = 25;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Cool Hemisphere Fill Light
    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x166534, 0.9);
    this.scene.add(this.hemiLight);

    // Particle System
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    // Player Bear
    this.player = new BearCharacter(DEFAULT_BEAR_CONFIG);
    this.scene.add(this.player.root);
  }

  private initEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.handleBlur);

    // Mouse & Touch Orbit
    this.container.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.container.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.keys[e.code]) {
      this.justPressedKeys[e.code] = true;
    }
    this.keys[e.code] = true;

    // Esc to pause / unpause
    if (e.code === 'Escape') {
      if (this.mode === 'playing') {
        this.setMode('paused');
      } else if (this.mode === 'paused') {
        this.setMode('playing');
      }
    }

    // Space or Enter to start from title
    if ((e.code === 'Space' || e.code === 'Enter') && this.mode === 'title') {
      this.startGame();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleBlur = () => {
    this.keys = {};
    this.justPressedKeys = {};
  };

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private handlePointerDown = (e: PointerEvent) => {
    // Only drag with left mouse button or touch
    if (e.button !== 0) return;
    this.isPointerDown = true;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown) return;
    const dx = e.clientX - this.lastPointerPos.x;
    const dy = e.clientY - this.lastPointerPos.y;
    this.lastPointerPos = { x: e.clientX, y: e.clientY };

    this.targetYaw -= dx * 0.007;
    this.cameraPitch = Math.max(0.1, Math.min(1.2, this.cameraPitch + dy * 0.005));
  };

  private handlePointerUp = () => {
    this.isPointerDown = false;
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.005;
    const currentDist = this.cameraOffset.length();
    const newDist = Math.max(3.5, Math.min(18, currentDist + zoomDelta));
    this.cameraOffset.setLength(newDist);
  };

  public setMode(mode: GameMode) {
    this.mode = mode;
    this.notifyState();
  }

  public setCustomization(config: Partial<BearCustomization>) {
    this.player.setCustomization(config);
  }

  public loadLevel(levelNum: number) {
    this.levelIndex = levelNum;

    // Clean previous level
    if (this.currentLevelData) {
      this.scene.remove(this.currentLevelData.scenery);
      this.scene.remove(this.currentLevelData.goalMesh);
      this.currentLevelData.platforms.forEach((p) => this.scene.remove(p.mesh));
      this.currentLevelData.collectibles.forEach((c) => this.scene.remove(c.mesh));
      this.currentLevelData.crates.forEach((cr) => this.scene.remove(cr.mesh));
      this.currentLevelData.enemies.forEach((e) => this.scene.remove(e.mesh));
    }
    this.particles.clear();

    if (levelNum === 1) {
      this.currentLevelData = this.levelBuilder.buildLevel1();
    } else if (levelNum === 2) {
      this.currentLevelData = this.levelBuilder.buildLevel2();
    } else {
      this.currentLevelData = this.levelBuilder.buildLevel3();
    }

    // Apply level theme colors
    this.scene.background = new THREE.Color(this.currentLevelData.skyColor);
    this.scene.fog = new THREE.Fog(this.currentLevelData.fogColor, 25, 75);
    this.dirLight.color.set(this.currentLevelData.lightWarmth);

    // Add level objects
    this.scene.add(this.currentLevelData.scenery);
    this.scene.add(this.currentLevelData.goalMesh);
    this.currentLevelData.platforms.forEach((p) => this.scene.add(p.mesh));
    this.currentLevelData.collectibles.forEach((c) => this.scene.add(c.mesh));
    this.currentLevelData.crates.forEach((cr) => this.scene.add(cr.mesh));
    this.currentLevelData.enemies.forEach((e) => this.scene.add(e.mesh));

    // Reset player position
    this.respawnPlayer();

    // Stats
    this.honeyCount = 0;
    this.maxHoney = this.currentLevelData.collectibles.filter((c) => c.type === 'honey').length;

    this.notifyState();
  }

  public respawnPlayer() {
    if (!this.currentLevelData) return;
    const sp = this.currentLevelData.spawnPoint;
    this.player.root.position.copy(sp);
    this.playerVelocity.set(0, 0, 0);
    this.isGrounded = true;
    this.jumpsRemaining = 2;
    this.isSpinning = false;
    this.isGroundPounding = false;
    this.player.setAnimation('idle');
  }

  public startGame() {
    this.lives = 3;
    this.score = 0;
    this.coins = 0;
    this.timeElapsed = 0;
    this.loadLevel(this.levelIndex);
    this.setMode('playing');
    sound.startBgm();
  }

  public restartGame() {
    this.levelIndex = 1;
    this.startGame();
  }

  public nextLevel() {
    if (this.levelIndex < this.totalLevels) {
      this.loadLevel(this.levelIndex + 1);
      this.setMode('playing');
    } else {
      // Completed all levels! Loop back or show victory
      this.setMode('victory');
    }
  }

  private notifyState() {
    if (!this.onStateChange) return;
    this.onStateChange({
      mode: this.mode,
      levelIndex: this.levelIndex,
      totalLevels: this.totalLevels,
      levelName: this.currentLevelData ? this.currentLevelData.name : '',
      honeyCount: this.honeyCount,
      maxHoney: this.maxHoney,
      coins: this.coins,
      score: this.score,
      lives: this.lives,
      maxLives: this.maxLives,
      timeElapsed: Math.floor(this.timeElapsed),
      isMuted: sound.isMuted,
    });
  }

  // --- Main Simulation Loop ---
  private startLoop() {
    this.isRunning = true;
    const loop = () => {
      if (!this.isRunning) return;
      const rawDt = this.clock.getDelta();
      const dt = Math.min(rawDt, 0.05); // Cap delta time for stability

      this.update(dt);
      this.render();

      this.justPressedKeys = {};
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number) {
    this.particles.update(dt);

    if (this.mode === 'title') {
      // Cinematic slow 360 camera pan around the hero bear
      this.timeElapsed += dt;
      this.cameraYaw += dt * 0.35;
      const camDist = 7.5;
      const camY = 3.0 + Math.sin(this.timeElapsed * 0.6) * 0.5;
      this.camera.position.set(
        Math.sin(this.cameraYaw) * camDist,
        camY,
        Math.cos(this.cameraYaw) * camDist
      );
      this.camera.lookAt(0, 1.4, 0);

      this.player.update(dt, 0);
      return;
    }

    if (this.mode === 'inspect') {
      // Smooth orbit around character in inspection mode
      this.cameraYaw = THREE.MathUtils.damp(this.cameraYaw, this.targetYaw, 10, dt);
      const camDist = this.cameraOffset.length();
      const cx = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * camDist;
      const cy = Math.sin(this.cameraPitch) * camDist;
      const cz = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * camDist;

      this.camera.position.set(
        this.player.root.position.x + cx,
        this.player.root.position.y + cy,
        this.player.root.position.z + cz
      );
      this.camera.lookAt(
        this.player.root.position.x,
        this.player.root.position.y + 1.2,
        this.player.root.position.z
      );

      this.player.update(dt, 0);
      return;
    }

    if (this.mode === 'paused') {
      return;
    }

    // PLAYING or VICTORY
    this.timeElapsed += dt;
    this.notifyState();

    if (this.mode === 'victory') {
      this.player.setAnimation('victory');
      this.player.update(dt, 0);
      this.updateLevelElements(dt);
      this.updateCamera(dt);
      return;
    }

    // 1. Process Input & Player Movement
    this.processPlayerMovement(dt);

    // 2. Update Moving Platforms, Crates, Enemies, Collectibles
    this.updateLevelElements(dt);

    // 3. Update Camera
    this.updateCamera(dt);
  }

  private processPlayerMovement(dt: number) {
    // Movement input vector
    let inputX = 0;
    let inputZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

    // Blend touch joystick input
    inputX += this.touchInput.moveX;
    inputZ += this.touchInput.moveY;

    const inputLen = Math.sqrt(inputX * inputX + inputZ * inputZ);
    if (inputLen > 0.1) {
      inputX /= Math.max(1, inputLen);
      inputZ /= Math.max(1, inputLen);
    }

    // Transform input relative to camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraYaw);

    const moveDir = new THREE.Vector3()
      .addScaledVector(right, inputX)
      .addScaledVector(forward, -inputZ)
      .normalize();

    // Speed constants
    const maxSpeed = 8.5;
    const accel = this.isGrounded ? 50 : 25;
    const friction = this.isGrounded ? 14 : 2;

    if (inputLen > 0.1) {
      this.playerVelocity.x += moveDir.x * accel * dt;
      this.playerVelocity.z += moveDir.z * accel * dt;

      // Rotate player towards movement direction smoothly
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.player.root.rotation.y = THREE.MathUtils.damp(
        this.player.root.rotation.y,
        targetAngle,
        14,
        dt
      );
    } else {
      // Apply friction
      this.playerVelocity.x = THREE.MathUtils.damp(this.playerVelocity.x, 0, friction, dt);
      this.playerVelocity.z = THREE.MathUtils.damp(this.playerVelocity.z, 0, friction, dt);
    }

    // Clamp horizontal speed
    const horizSpeed = Math.sqrt(
      this.playerVelocity.x * this.playerVelocity.x + this.playerVelocity.z * this.playerVelocity.z
    );
    if (horizSpeed > maxSpeed) {
      const scale = maxSpeed / horizSpeed;
      this.playerVelocity.x *= scale;
      this.playerVelocity.z *= scale;
    }

    // Coyote time & Jump buffer
    if (this.isGrounded) {
      this.coyoteTimer = 0.12;
      this.jumpsRemaining = 2;
    } else {
      this.coyoteTimer -= dt;
    }

    const jumpTriggered =
      this.justPressedKeys['Space'] ||
      this.justPressedKeys['KeyW'] ||
      this.touchInput.jump;
    this.touchInput.jump = false;

    if (jumpTriggered) {
      this.jumpBufferTimer = 0.12;
    } else {
      this.jumpBufferTimer -= dt;
    }

    // Execute Jump
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0 || this.isGrounded) {
        // Ground Jump
        this.playerVelocity.y = 12.5;
        this.isGrounded = false;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.jumpsRemaining = 1;
        this.player.setAnimation('jump');
        this.particles.emitDust(this.player.root.position, 6);
        sound.playJump();
      } else if (this.jumpsRemaining > 0) {
        // Double Jump!
        this.playerVelocity.y = 13.0;
        this.jumpsRemaining = 0;
        this.jumpBufferTimer = 0;
        this.player.setAnimation('doubleJump');
        this.particles.emitCoinSparkles(this.player.root.position, 10);
        sound.playDoubleJump();
      }
    }

    // Spin Attack (Shift / J / Touch)
    const spinTriggered =
      this.justPressedKeys['ShiftLeft'] ||
      this.justPressedKeys['ShiftRight'] ||
      this.justPressedKeys['KeyJ'] ||
      this.touchInput.spin;
    this.touchInput.spin = false;

    if (spinTriggered && !this.isSpinning) {
      this.isSpinning = true;
      this.spinTimer = 0.45;
      this.player.setAnimation('spinAttack');
      this.particles.emitShockwave(this.player.root.position);
      sound.playSpinAttack();
    }

    if (this.isSpinning) {
      this.spinTimer -= dt;
      if (this.spinTimer <= 0) {
        this.isSpinning = false;
      }
    }

    // Ground Pound (K / C / Down while in air)
    const poundTriggered =
      (this.justPressedKeys['KeyK'] || this.justPressedKeys['KeyC'] || this.touchInput.pound) &&
      !this.isGrounded;
    this.touchInput.pound = false;

    if (poundTriggered && !this.isGroundPounding) {
      this.isGroundPounding = true;
      this.groundPoundTimer = 0.15;
      this.playerVelocity.set(0, 0, 0); // Brief freeze in air
      this.player.setAnimation('groundPound');
    }

    if (this.isGroundPounding) {
      if (this.groundPoundTimer > 0) {
        this.groundPoundTimer -= dt;
        this.playerVelocity.y = 0;
      } else {
        // Slam down!
        this.playerVelocity.y = -28;
      }
    } else {
      // Normal gravity
      const gravity = 32;
      this.playerVelocity.y -= gravity * dt;
    }

    // Apply movement
    const pos = this.player.root.position;
    pos.x += this.playerVelocity.x * dt;
    pos.z += this.playerVelocity.z * dt;
    pos.y += this.playerVelocity.y * dt;

    // Platform collisions
    this.checkCollisions(dt);

    // Void death & respawn
    if (pos.y < -12) {
      this.handlePlayerDeath();
    }

    // Animation state update
    if (this.isGrounded) {
      if (this.isSpinning) {
        this.player.setAnimation('spinAttack');
      } else if (horizSpeed > 0.5) {
        this.player.setAnimation('run');
      } else {
        this.player.setAnimation('idle');
      }
    } else {
      if (this.isSpinning) {
        this.player.setAnimation('spinAttack');
      } else if (this.isGroundPounding) {
        this.player.setAnimation('groundPound');
      } else if (this.player.getAnimation() !== 'doubleJump') {
        if (this.playerVelocity.y > 1) {
          this.player.setAnimation('jump');
        } else {
          this.player.setAnimation('fall');
        }
      }
    }

    this.player.update(dt, horizSpeed);
  }

  private checkCollisions(dt: number) {
    if (!this.currentLevelData) return;

    const pos = this.player.root.position;
    const playerRadius = 0.45;
    const playerHeight = 1.8;
    const playerFeet = pos.y - 1.1;

    let onGround = false;

    for (const plat of this.currentLevelData.platforms) {
      // Update platform bounding box if moving
      if (plat.type === 'moving' && plat.basePos && plat.moveAxis) {
        const time = this.timeElapsed * (plat.moveSpeed || 2);
        const offset = Math.sin(time) * (plat.moveRange || 3);
        const prevPos = plat.mesh.position.clone();

        plat.mesh.position.copy(plat.basePos);
        if (plat.moveAxis === 'x') plat.mesh.position.x += offset;
        if (plat.moveAxis === 'y') plat.mesh.position.y += offset;
        if (plat.moveAxis === 'z') plat.mesh.position.z += offset;

        plat.box.setFromObject(plat.mesh);

        // Track platform velocity
        this.activePlatformVelocity.copy(plat.mesh.position).sub(prevPos).divideScalar(dt);
      }

      // Check AABB collision
      const box = plat.box;
      const margin = 0.2;
      const isOverPlatform =
        pos.x + playerRadius > box.min.x &&
        pos.x - playerRadius < box.max.x &&
        pos.z + playerRadius > box.min.z &&
        pos.z - playerRadius < box.max.z;

      if (isOverPlatform) {
        const topY = box.max.y;
        // Landing condition
        if (
          this.playerVelocity.y <= 0 &&
          playerFeet <= topY + margin &&
          playerFeet >= topY - 0.7
        ) {
          pos.y = topY + 1.1;
          this.playerVelocity.y = 0;
          onGround = true;

          // If platform is a Bouncy Mushroom!
          if (plat.type === 'bounce') {
            const force = plat.bounceForce || 22;
            this.playerVelocity.y = force;
            onGround = false;
            this.player.setAnimation('jump');
            this.particles.emitHoneySparkles(pos, 14);
            sound.playBouncePad();
          }

          // If ground pound landed on surface
          if (this.isGroundPounding) {
            this.isGroundPounding = false;
            this.particles.emitShockwave(pos);
            sound.playCrateBreak();
          }

          // Carry with moving platform
          if (plat.type === 'moving') {
            pos.addScaledVector(this.activePlatformVelocity, dt);
          }
        }
      }
    }

    this.isGrounded = onGround;
  }

  private updateLevelElements(dt: number) {
    if (!this.currentLevelData) return;

    const playerPos = this.player.root.position;

    // 1. Goal Trophy
    const goalMesh = this.currentLevelData.goalMesh;
    const rotatingTrophy = goalMesh.getObjectByName('TrophyRotating');
    if (rotatingTrophy) {
      rotatingTrophy.rotation.y += dt * 1.5;
    }

    const distToGoal = playerPos.distanceTo(this.currentLevelData.goalPoint);
    if (distToGoal < 2.5 && this.mode === 'playing') {
      this.handleVictory();
    }

    // 2. Collectibles (Honey Pots & Coins)
    for (const item of this.currentLevelData.collectibles) {
      if (item.collected) continue;

      item.mesh.rotation.y += dt * 2.2;
      item.mesh.position.y = item.pos.y + Math.sin(this.timeElapsed * 3 + item.pos.x) * 0.12;

      const dist = playerPos.distanceTo(item.mesh.position);
      if (dist < 1.3) {
        item.collected = true;
        this.scene.remove(item.mesh);

        if (item.type === 'honey') {
          this.honeyCount++;
          this.score += item.value;
          this.particles.emitHoneySparkles(item.mesh.position, 16);
          sound.playHoneyCollect();
        } else {
          this.coins++;
          this.score += item.value;
          this.particles.emitCoinSparkles(item.mesh.position, 10);
          sound.playCoin();
        }
        this.notifyState();
      }
    }

    // 3. Breakable Crates
    for (const crate of this.currentLevelData.crates) {
      if (crate.broken) continue;

      const dist = playerPos.distanceTo(crate.pos);
      // Break with spin attack or ground pound
      if (dist < 1.6 && (this.isSpinning || this.isGroundPounding)) {
        crate.broken = true;
        this.scene.remove(crate.mesh);
        this.particles.emitWoodSplinters(crate.pos, 15);
        sound.playCrateBreak();
        this.score += 50;

        // Spawn a honey jar or coin upon breaking!
        this.particles.emitHoneySparkles(crate.pos, 12);
        this.honeyCount++;
        this.notifyState();
      }
    }

    // 4. Enemies (Chestnuts & Bees)
    for (const enemy of this.currentLevelData.enemies) {
      if (enemy.isDefeated) continue;

      enemy.animTime += dt;

      if (enemy.type === 'chestnut') {
        // Rolls back and forth along X
        const offset = Math.sin(enemy.animTime * enemy.speed) * enemy.patrolRange;
        enemy.mesh.position.x = enemy.basePos.x + offset;
        enemy.mesh.rotation.z -= (enemy.speed * dt * Math.sign(Math.cos(enemy.animTime * enemy.speed))) * 2;
      } else if (enemy.type === 'bee') {
        // Flies in hover bobbing circle
        const angle = enemy.animTime * (enemy.speed * 0.5);
        enemy.mesh.position.x = enemy.basePos.x + Math.cos(angle) * enemy.patrolRange;
        enemy.mesh.position.z = enemy.basePos.z + Math.sin(angle) * enemy.patrolRange;
        enemy.mesh.position.y = enemy.basePos.y + Math.sin(enemy.animTime * 4) * 0.4;
        enemy.mesh.rotation.y = -angle + Math.PI / 2;

        // Wing flutter
        const leftWing = enemy.mesh.getObjectByName('leftWing');
        const rightWing = enemy.mesh.getObjectByName('rightWing');
        if (leftWing && rightWing) {
          const flutter = Math.sin(enemy.animTime * 35) * 0.6;
          leftWing.rotation.z = flutter;
          rightWing.rotation.z = -flutter;
        }
      }

      // Check player collision
      const dist = playerPos.distanceTo(enemy.mesh.position);
      if (dist < 1.4) {
        // Can be defeated if:
        // A) Spin attack is active
        // B) Player is landing on enemy from above (Stomp jump!)
        if (this.isSpinning || (this.playerVelocity.y < -1 && playerPos.y > enemy.mesh.position.y + 0.3)) {
          enemy.isDefeated = true;
          this.scene.remove(enemy.mesh);
          this.particles.emitWoodSplinters(enemy.mesh.position, 12);
          this.particles.emitCoinSparkles(enemy.mesh.position, 8);
          this.score += 150;
          sound.playCrateBreak();

          // Stomp bounce
          this.playerVelocity.y = 12;
          this.jumpsRemaining = 1;
          this.notifyState();
        } else {
          // Player hit!
          this.handlePlayerHurt();
        }
      }
    }
  }

  private handlePlayerHurt() {
    sound.playHurt();
    this.particles.emitDust(this.player.root.position, 8);
    this.lives--;
    this.notifyState();

    if (this.lives <= 0) {
      this.setMode('gameover');
    } else {
      // Knockback & brief invincibility hop
      this.playerVelocity.y = 9;
      this.playerVelocity.z = -5;
    }
  }

  private handlePlayerDeath() {
    sound.playHurt();
    this.lives--;
    this.notifyState();

    if (this.lives <= 0) {
      this.setMode('gameover');
    } else {
      this.respawnPlayer();
    }
  }

  private handleVictory() {
    this.setMode('victory');
    this.particles.emitVictoryConfetti(this.player.root.position, 60);
    sound.playLevelVictory();
  }

  private updateCamera(dt: number) {
    // Smooth camera damping
    this.cameraYaw = THREE.MathUtils.damp(this.cameraYaw, this.targetYaw, 10, dt);

    const pos = this.player.root.position;
    const camDist = this.cameraOffset.length();
    const cx = Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * camDist;
    const cy = Math.sin(this.cameraPitch) * camDist;
    const cz = Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * camDist;

    const targetPos = new THREE.Vector3(pos.x + cx, pos.y + cy, pos.z + cz);

    this.camera.position.lerp(targetPos, Math.min(1, dt * 8));
    this.camera.lookAt(pos.x, pos.y + 1.2, pos.z);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.handleBlur);
    this.container.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);

    this.player.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
