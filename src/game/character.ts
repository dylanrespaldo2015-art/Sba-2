import * as THREE from 'three';

export interface BearCustomization {
  furColor: string;
  bellyColor: string;
  backpackColor: string;
  strapColor: string;
  collarColor: string;
}

export const DEFAULT_BEAR_CONFIG: BearCustomization = {
  furColor: '#6f3e1b', // Warm teddy brown
  bellyColor: '#dfa55d', // Sand / honey tan
  backpackColor: '#0284c7', // Vibrant sky blue
  strapColor: '#0ea5e9', // Lighter cyan blue
  collarColor: '#eab308', // Warm yellow gold
};

export type CharacterAnimationState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'doubleJump'
  | 'spinAttack'
  | 'groundPound'
  | 'victory'
  | 'wave'
  | 'dance';

export class BearCharacter {
  public root: THREE.Group;
  public bodyGroup: THREE.Group;
  public headGroup: THREE.Group;
  public leftArmGroup: THREE.Group;
  public rightArmGroup: THREE.Group;
  public leftFootGroup: THREE.Group;
  public rightFootGroup: THREE.Group;
  public backpackMesh: THREE.Mesh;
  public collarMesh: THREE.Mesh;
  public shadowMesh: THREE.Mesh;

  private materials: {
    fur: THREE.MeshStandardMaterial;
    belly: THREE.MeshStandardMaterial;
    innerEar: THREE.MeshStandardMaterial;
    black: THREE.MeshStandardMaterial;
    backpack: THREE.MeshStandardMaterial;
    strap: THREE.MeshStandardMaterial;
    collar: THREE.MeshStandardMaterial;
    claw: THREE.MeshStandardMaterial;
  };

  private currentAnim: CharacterAnimationState = 'idle';
  private animTime = 0;
  private spinProgress = 0;
  private flipProgress = 0;

  constructor(config: BearCustomization = DEFAULT_BEAR_CONFIG) {
    this.root = new THREE.Group();
    this.root.name = 'BearCharacter';

    // Materials setup with PBR properties matching the soft toy / voxel look
    this.materials = {
      fur: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.furColor),
        roughness: 0.75,
        metalness: 0.05,
      }),
      belly: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.bellyColor),
        roughness: 0.8,
        metalness: 0.02,
      }),
      innerEar: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.bellyColor),
        roughness: 0.8,
        metalness: 0.02,
      }),
      black: new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.5,
        metalness: 0.1,
      }),
      backpack: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.backpackColor),
        roughness: 0.6,
        metalness: 0.15,
      }),
      strap: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.strapColor),
        roughness: 0.7,
        metalness: 0.1,
      }),
      collar: new THREE.MeshStandardMaterial({
        color: new THREE.Color(config.collarColor),
        roughness: 0.35,
        metalness: 0.45,
      }),
      claw: new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.4,
        metalness: 0.2,
      }),
    };

    // --- Build Subgroups ---
    this.bodyGroup = new THREE.Group();
    this.headGroup = new THREE.Group();
    this.leftArmGroup = new THREE.Group();
    this.rightArmGroup = new THREE.Group();
    this.leftFootGroup = new THREE.Group();
    this.rightFootGroup = new THREE.Group();

    // 1. TORSO (Rounded cuboid)
    // Box dimensions: w: 0.84, h: 1.15, d: 0.72
    const bodyGeo = new THREE.BoxGeometry(0.84, 1.15, 0.72, 2, 2, 2);
    // Smooth the vertices slightly for a rounded toy look
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materials.fur);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Front Belly Patch
    const bellyGeo = new THREE.BoxGeometry(0.68, 0.95, 0.1);
    const bellyMesh = new THREE.Mesh(bellyGeo, this.materials.belly);
    bellyMesh.position.set(0, -0.05, 0.33);
    bellyMesh.castShadow = true;
    this.bodyGroup.add(bellyMesh);

    // Yellow Collar Ring at the neck
    const collarGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.12, 16);
    this.collarMesh = new THREE.Mesh(collarGeo, this.materials.collar);
    this.collarMesh.position.set(0, 0.6, 0);
    this.collarMesh.castShadow = true;
    this.bodyGroup.add(this.collarMesh);

    // Backpack on back
    const backpackGeo = new THREE.BoxGeometry(0.65, 0.85, 0.38);
    this.backpackMesh = new THREE.Mesh(backpackGeo, this.materials.backpack);
    this.backpackMesh.position.set(0, 0.05, -0.5);
    this.backpackMesh.castShadow = true;
    this.backpackMesh.receiveShadow = true;
    this.bodyGroup.add(this.backpackMesh);

    // Backpack flap & top handle
    const flapGeo = new THREE.BoxGeometry(0.67, 0.2, 0.4);
    const flapMesh = new THREE.Mesh(flapGeo, this.materials.backpack);
    flapMesh.position.set(0, 0.4, -0.5);
    this.bodyGroup.add(flapMesh);

    const handleGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 12, Math.PI);
    const handleMesh = new THREE.Mesh(handleGeo, this.materials.collar);
    handleMesh.rotation.x = Math.PI;
    handleMesh.position.set(0, 0.52, -0.5);
    this.bodyGroup.add(handleMesh);

    // Backpack Straps (Wrapping around shoulders to front)
    const strapLeftGeo = new THREE.BoxGeometry(0.08, 1.05, 0.78);
    const strapLeft = new THREE.Mesh(strapLeftGeo, this.materials.strap);
    strapLeft.position.set(0.32, 0.02, 0.02);
    this.bodyGroup.add(strapLeft);

    const strapRight = new THREE.Mesh(strapLeftGeo, this.materials.strap);
    strapRight.position.set(-0.32, 0.02, 0.02);
    this.bodyGroup.add(strapRight);

    // Cute tiny round bear tail on back lower body
    const tailGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const tailMesh = new THREE.Mesh(tailGeo, this.materials.fur);
    tailMesh.position.set(0, -0.42, -0.42);
    this.bodyGroup.add(tailMesh);

    // 2. HEAD (Rounded block)
    const headGeo = new THREE.BoxGeometry(1.08, 1.02, 0.98, 2, 2, 2);
    const headMesh = new THREE.Mesh(headGeo, this.materials.fur);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);

    // Ears (outer and inner)
    const earGeo = new THREE.BoxGeometry(0.32, 0.32, 0.22);
    const innerEarGeo = new THREE.BoxGeometry(0.2, 0.2, 0.04);

    // Left Ear
    const leftEar = new THREE.Mesh(earGeo, this.materials.fur);
    leftEar.position.set(0.48, 0.52, 0);
    leftEar.castShadow = true;
    const leftInnerEar = new THREE.Mesh(innerEarGeo, this.materials.innerEar);
    leftInnerEar.position.set(0.48, 0.52, 0.1);
    this.headGroup.add(leftEar);
    this.headGroup.add(leftInnerEar);

    // Right Ear
    const rightEar = new THREE.Mesh(earGeo, this.materials.fur);
    rightEar.position.set(-0.48, 0.52, 0);
    rightEar.castShadow = true;
    const rightInnerEar = new THREE.Mesh(innerEarGeo, this.materials.innerEar);
    rightInnerEar.position.set(-0.48, 0.52, 0.1);
    this.headGroup.add(rightEar);
    this.headGroup.add(rightInnerEar);

    // Eyes (vertical rectangular dark slits)
    const eyeGeo = new THREE.BoxGeometry(0.1, 0.2, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, this.materials.black);
    leftEye.position.set(0.24, 0.12, 0.5);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, this.materials.black);
    rightEye.position.set(-0.24, 0.12, 0.5);
    this.headGroup.add(rightEye);

    // Snout / Muzzle (protruding beige box)
    const snoutGeo = new THREE.BoxGeometry(0.52, 0.38, 0.25);
    const snoutMesh = new THREE.Mesh(snoutGeo, this.materials.belly);
    snoutMesh.position.set(0, -0.16, 0.56);
    snoutMesh.castShadow = true;
    this.headGroup.add(snoutMesh);

    // Nose (black button cube on snout)
    const noseGeo = new THREE.BoxGeometry(0.13, 0.1, 0.08);
    const noseMesh = new THREE.Mesh(noseGeo, this.materials.black);
    noseMesh.position.set(0, -0.12, 0.68);
    this.headGroup.add(noseMesh);

    // Position head above torso
    this.headGroup.position.set(0, 1.25, 0);

    // 3. ARMS (Floating rounded paws)
    const armGeo = new THREE.BoxGeometry(0.26, 0.52, 0.32);
    const leftArmMesh = new THREE.Mesh(armGeo, this.materials.fur);
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeo, this.materials.fur);
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);

    // 3 Claws on each arm paw tip
    const armClawGeo = new THREE.BoxGeometry(0.04, 0.08, 0.08);
    for (let i = -1; i <= 1; i++) {
      const c1 = new THREE.Mesh(armClawGeo, this.materials.claw);
      c1.position.set(i * 0.07, -0.27, 0.08);
      this.leftArmGroup.add(c1);

      const c2 = new THREE.Mesh(armClawGeo, this.materials.claw);
      c2.position.set(i * 0.07, -0.27, 0.08);
      this.rightArmGroup.add(c2);
    }

    // Default arm positions
    this.leftArmGroup.position.set(0.68, 0.0, 0);
    this.rightArmGroup.position.set(-0.68, 0.0, 0);

    // 4. FEET (Floating flat paws with claws)
    const footGeo = new THREE.BoxGeometry(0.34, 0.2, 0.58);
    const leftFootMesh = new THREE.Mesh(footGeo, this.materials.fur);
    leftFootMesh.castShadow = true;
    this.leftFootGroup.add(leftFootMesh);

    const rightFootMesh = new THREE.Mesh(footGeo, this.materials.fur);
    rightFootMesh.castShadow = true;
    this.rightFootGroup.add(rightFootMesh);

    // 3 Claws on front of each foot
    const footClawGeo = new THREE.BoxGeometry(0.05, 0.1, 0.12);
    for (let i = -1; i <= 1; i++) {
      const fc1 = new THREE.Mesh(footClawGeo, this.materials.claw);
      fc1.position.set(i * 0.09, -0.04, 0.32);
      this.leftFootGroup.add(fc1);

      const fc2 = new THREE.Mesh(footClawGeo, this.materials.claw);
      fc2.position.set(i * 0.09, -0.04, 0.32);
      this.rightFootGroup.add(fc2);
    }

    // Default foot positions (floating below body)
    this.leftFootGroup.position.set(0.3, -0.9, 0.05);
    this.rightFootGroup.position.set(-0.3, -0.9, 0.05);

    // 5. Soft Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.5, 1.5);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.2)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.y = -1.18;

    // Attach all components to root
    this.root.add(this.bodyGroup);
    this.root.add(this.headGroup);
    this.root.add(this.leftArmGroup);
    this.root.add(this.rightArmGroup);
    this.root.add(this.leftFootGroup);
    this.root.add(this.rightFootGroup);
    this.root.add(this.shadowMesh);

    // Elevate so feet sit naturally near ground
    this.root.position.y = 1.1;
  }

  public setCustomization(config: Partial<BearCustomization>) {
    if (config.furColor) {
      this.materials.fur.color.set(config.furColor);
    }
    if (config.bellyColor) {
      this.materials.belly.color.set(config.bellyColor);
      this.materials.innerEar.color.set(config.bellyColor);
    }
    if (config.backpackColor) {
      this.materials.backpack.color.set(config.backpackColor);
    }
    if (config.strapColor) {
      this.materials.strap.color.set(config.strapColor);
    }
    if (config.collarColor) {
      this.materials.collar.color.set(config.collarColor);
    }
  }

  public setAnimation(state: CharacterAnimationState) {
    if (this.currentAnim !== state) {
      this.currentAnim = state;
      if (state === 'spinAttack') {
        this.spinProgress = 0;
      }
      if (state === 'doubleJump') {
        this.flipProgress = 0;
      }
    }
  }

  public getAnimation(): CharacterAnimationState {
    return this.currentAnim;
  }

  /**
   * Update character animations frame-by-frame
   */
  public update(dt: number, moveSpeed = 0) {
    this.animTime += dt;
    const t = this.animTime;

    // Base body bob
    const baseArmX = 0.68;
    const baseFootX = 0.3;

    // Reset base rotations
    this.bodyGroup.rotation.set(0, 0, 0);
    this.bodyGroup.scale.set(1, 1, 1);
    this.headGroup.rotation.set(0, 0, 0);

    switch (this.currentAnim) {
      case 'idle': {
        // Soft breathing and cute floating bob
        const breath = Math.sin(t * 3) * 0.04;
        this.bodyGroup.position.y = breath;
        this.headGroup.position.y = 1.25 + breath * 1.3;
        this.headGroup.rotation.z = Math.sin(t * 1.5) * 0.03;

        this.leftArmGroup.position.set(baseArmX, breath * 0.8, Math.cos(t * 3) * 0.03);
        this.rightArmGroup.position.set(-baseArmX, -breath * 0.8, -Math.cos(t * 3) * 0.03);

        this.leftArmGroup.rotation.set(0, 0, -0.05 + breath * 0.5);
        this.rightArmGroup.rotation.set(0, 0, 0.05 - breath * 0.5);

        this.leftFootGroup.position.set(baseFootX, -0.9 + breath * 0.3, 0.05);
        this.rightFootGroup.position.set(-baseFootX, -0.9 + breath * 0.3, 0.05);
        this.leftFootGroup.rotation.set(0, 0, 0);
        this.rightFootGroup.rotation.set(0, 0, 0);
        break;
      }

      case 'run': {
        // High energy platformer sprint!
        const runFreq = Math.min(14, 8 + moveSpeed * 0.8);
        const stride = Math.sin(t * runFreq);
        const cosStride = Math.cos(t * runFreq);

        // Torso tilts slightly forward into sprint and rolls
        this.bodyGroup.position.y = Math.abs(stride) * 0.12;
        this.bodyGroup.rotation.x = 0.14;
        this.bodyGroup.rotation.y = stride * 0.08;
        this.bodyGroup.rotation.z = cosStride * 0.06;

        this.headGroup.position.y = 1.25 + Math.abs(stride) * 0.14;
        this.headGroup.rotation.x = -0.08;
        this.headGroup.rotation.z = -cosStride * 0.05;

        // Arms pump opposite to feet
        this.leftArmGroup.position.set(baseArmX, 0.05 + stride * 0.15, -stride * 0.38);
        this.leftArmGroup.rotation.set(stride * 0.7, 0, -0.15);

        this.rightArmGroup.position.set(-baseArmX, 0.05 - stride * 0.15, stride * 0.38);
        this.rightArmGroup.rotation.set(-stride * 0.7, 0, 0.15);

        // Feet alternate stepping forward and backward
        this.leftFootGroup.position.set(
          baseFootX,
          -0.9 + Math.max(0, stride) * 0.28,
          stride * 0.4
        );
        this.leftFootGroup.rotation.set(-stride * 0.4, 0, 0);

        this.rightFootGroup.position.set(
          -baseFootX,
          -0.9 + Math.max(0, -stride) * 0.28,
          -stride * 0.4
        );
        this.rightFootGroup.rotation.set(stride * 0.4, 0, 0);
        break;
      }

      case 'jump': {
        // Joyful leap: arms up, feet tucked, torso stretched
        this.bodyGroup.scale.set(0.92, 1.15, 0.92);
        this.bodyGroup.position.y = 0.1;
        this.headGroup.position.y = 1.35;
        this.headGroup.rotation.x = -0.15;

        this.leftArmGroup.position.set(baseArmX + 0.1, 0.45, 0);
        this.leftArmGroup.rotation.set(0, 0, 0.45);

        this.rightArmGroup.position.set(-baseArmX - 0.1, 0.45, 0);
        this.rightArmGroup.rotation.set(0, 0, -0.45);

        this.leftFootGroup.position.set(baseFootX, -0.65, -0.1);
        this.leftFootGroup.rotation.set(0.3, 0, 0);

        this.rightFootGroup.position.set(-baseFootX, -0.65, -0.1);
        this.rightFootGroup.rotation.set(0.3, 0, 0);
        break;
      }

      case 'fall': {
        // Falling: flutter arms, stretch downward
        this.bodyGroup.scale.set(1.05, 0.95, 1.05);
        this.headGroup.position.y = 1.2;
        this.headGroup.rotation.x = 0.15;

        const flutter = Math.sin(t * 20) * 0.2;
        this.leftArmGroup.position.set(baseArmX + 0.15, 0.25, 0);
        this.leftArmGroup.rotation.set(0, 0, 0.7 + flutter);

        this.rightArmGroup.position.set(-baseArmX - 0.15, 0.25, 0);
        this.rightArmGroup.rotation.set(0, 0, -0.7 - flutter);

        this.leftFootGroup.position.set(baseFootX, -1.05, 0.1);
        this.rightFootGroup.position.set(-baseFootX, -1.05, 0.1);
        break;
      }

      case 'doubleJump': {
        // Acrobat front-flip spin
        this.flipProgress += dt * 6.5;
        const flipAngle = Math.min(Math.PI * 2, this.flipProgress);
        this.bodyGroup.rotation.x = flipAngle;
        this.headGroup.rotation.x = flipAngle * 0.9;

        // Tuck in during spin
        this.leftArmGroup.position.set(baseArmX * 0.7, 0, 0);
        this.rightArmGroup.position.set(-baseArmX * 0.7, 0, 0);
        this.leftFootGroup.position.set(baseFootX * 0.8, -0.6, 0);
        this.rightFootGroup.position.set(-baseFootX * 0.8, -0.6, 0);

        if (this.flipProgress >= Math.PI * 2) {
          this.setAnimation('fall');
        }
        break;
      }

      case 'spinAttack': {
        // Rapid 360 degree paw spin attack!
        this.spinProgress += dt * 14;
        const spinAngle = this.spinProgress;
        this.bodyGroup.rotation.y = spinAngle;
        this.headGroup.rotation.y = spinAngle * 0.85;

        // Paws extended outward like a whirlwind
        this.leftArmGroup.position.set(baseArmX + 0.35, 0.1, 0);
        this.leftArmGroup.rotation.set(0, 0, 1.4);

        this.rightArmGroup.position.set(-baseArmX - 0.35, 0.1, 0);
        this.rightArmGroup.rotation.set(0, 0, -1.4);

        this.leftFootGroup.position.set(baseFootX, -0.85, 0);
        this.rightFootGroup.position.set(-baseFootX, -0.85, 0);

        if (this.spinProgress >= Math.PI * 4) {
          // 2 full spins complete
          this.setAnimation('idle');
        }
        break;
      }

      case 'groundPound': {
        // Heavy downward slam squash
        this.bodyGroup.scale.set(1.3, 0.65, 1.3);
        this.headGroup.position.y = 0.9;
        this.leftArmGroup.position.set(baseArmX + 0.25, -0.3, 0);
        this.rightArmGroup.position.set(-baseArmX - 0.25, -0.3, 0);
        this.leftFootGroup.position.set(baseFootX + 0.15, -1.0, 0);
        this.rightFootGroup.position.set(-baseFootX - 0.15, -1.0, 0);
        break;
      }

      case 'victory': {
        // Triumphant hops and waving arms
        const hop = Math.abs(Math.sin(t * 6)) * 0.4;
        this.bodyGroup.position.y = hop;
        this.headGroup.position.y = 1.25 + hop;
        this.headGroup.rotation.y = Math.sin(t * 3) * 0.25;

        this.leftArmGroup.position.set(baseArmX + 0.1, 0.5 + hop, 0);
        this.leftArmGroup.rotation.set(0, 0, 0.5 + Math.sin(t * 8) * 0.2);

        this.rightArmGroup.position.set(-baseArmX - 0.1, 0.5 + hop, 0);
        this.rightArmGroup.rotation.set(0, 0, -0.5 - Math.sin(t * 8) * 0.2);

        this.leftFootGroup.position.set(baseFootX, -0.9 + hop * 0.7, 0.05);
        this.rightFootGroup.position.set(-baseFootX, -0.9 + hop * 0.7, 0.05);
        break;
      }

      case 'wave': {
        // Friendly paw wave
        this.bodyGroup.rotation.y = 0.2;
        this.headGroup.rotation.y = 0.2;
        this.headGroup.rotation.z = -0.1;

        this.leftArmGroup.position.set(baseArmX, 0, 0);
        this.leftArmGroup.rotation.set(0, 0, -0.1);

        // Right arm raised and waving back and forth
        const wave = Math.sin(t * 8) * 0.35;
        this.rightArmGroup.position.set(-baseArmX - 0.15, 0.6, 0.1);
        this.rightArmGroup.rotation.set(0, 0, -1.1 + wave);

        this.leftFootGroup.position.set(baseFootX, -0.9, 0.05);
        this.rightFootGroup.position.set(-baseFootX, -0.9, 0.05);
        break;
      }

      case 'dance': {
        // Cute salsa / waddle dance
        const sway = Math.sin(t * 5);
        const bounce = Math.abs(Math.cos(t * 5)) * 0.15;

        this.bodyGroup.position.y = bounce;
        this.bodyGroup.rotation.z = sway * 0.2;
        this.headGroup.position.y = 1.25 + bounce;
        this.headGroup.rotation.z = -sway * 0.25;

        this.leftArmGroup.position.set(baseArmX + sway * 0.1, 0.1 + bounce, sway * 0.2);
        this.rightArmGroup.position.set(-baseArmX + sway * 0.1, 0.1 + bounce, -sway * 0.2);

        this.leftFootGroup.position.set(baseFootX, -0.9 + Math.max(0, sway) * 0.2, 0.05);
        this.rightFootGroup.position.set(-baseFootX, -0.9 + Math.max(0, -sway) * 0.2, 0.05);
        break;
      }
    }
  }

  public dispose() {
    Object.values(this.materials).forEach((m) => m.dispose());
  }
}
