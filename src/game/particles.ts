import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleStart: number;
  rotSpeed: THREE.Vector3;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private sphereGeo: THREE.SphereGeometry;
  private boxGeo: THREE.BoxGeometry;
  private ringGeo: THREE.RingGeometry;

  private honeyMat: THREE.MeshBasicMaterial;
  private goldMat: THREE.MeshBasicMaterial;
  private dustMat: THREE.MeshBasicMaterial;
  private woodMat: THREE.MeshBasicMaterial;
  private shockwaveMat: THREE.MeshBasicMaterial;
  private confettiMats: THREE.MeshBasicMaterial[];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ParticleSystem';

    this.sphereGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.boxGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
    this.ringGeo = new THREE.RingGeometry(0.2, 0.45, 24);

    this.honeyMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.9 });
    this.goldMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.95 });
    this.dustMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65 });
    this.woodMat = new THREE.MeshBasicMaterial({ color: 0x854d0e, transparent: true, opacity: 0.9 });
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0xa855f7];
    this.confettiMats = colors.map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  }

  public emitHoneySparkles(pos: THREE.Vector3, count = 12) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sphereGeo, this.honeyMat.clone());
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 4 + 1.5,
        (Math.random() - 0.5) * 4
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.6 + Math.random() * 0.3,
        maxLife: 0.6 + Math.random() * 0.3,
        scaleStart: 0.8 + Math.random() * 0.5,
        rotSpeed: new THREE.Vector3(Math.random() * 5, Math.random() * 5, Math.random() * 5),
      });
    }
  }

  public emitCoinSparkles(pos: THREE.Vector3, count = 8) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sphereGeo, this.goldMat.clone());
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3.5 + 2,
        (Math.random() - 0.5) * 3
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.5,
        maxLife: 0.5,
        scaleStart: 0.7,
        rotSpeed: new THREE.Vector3(Math.random() * 4, Math.random() * 4, 0),
      });
    }
  }

  public emitDust(pos: THREE.Vector3, count = 5) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sphereGeo, this.dustMat.clone());
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.4,
        pos.y + 0.05,
        pos.z + (Math.random() - 0.5) * 0.4
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 1.2 + 0.3,
        (Math.random() - 0.5) * 1.5
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.35 + Math.random() * 0.2,
        scaleStart: 0.6,
        rotSpeed: new THREE.Vector3(),
      });
    }
  }

  public emitWoodSplinters(pos: THREE.Vector3, count = 10) {
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.boxGeo, this.woodMat.clone());
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 5
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.6,
        maxLife: 0.6,
        scaleStart: 1.0,
        rotSpeed: new THREE.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8),
      });
    }
  }

  public emitShockwave(pos: THREE.Vector3) {
    const mesh = new THREE.Mesh(this.ringGeo, this.shockwaveMat.clone());
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(pos.x, pos.y + 0.05, pos.z);
    this.group.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(0, 0, 0),
      life: 0.4,
      maxLife: 0.4,
      scaleStart: 0.5,
      rotSpeed: new THREE.Vector3(),
    });
  }

  public emitVictoryConfetti(pos: THREE.Vector3, count = 40) {
    for (let i = 0; i < count; i++) {
      const mat = this.confettiMats[Math.floor(Math.random() * this.confettiMats.length)];
      const mesh = new THREE.Mesh(this.boxGeo, mat);
      mesh.scale.set(0.6, 0.1, 0.6);
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 3,
        pos.y + 1,
        pos.z + (Math.random() - 0.5) * 3
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 7 + 4,
        (Math.random() - 0.5) * 6
      );
      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 1.5 + Math.random() * 0.8,
        maxLife: 1.5 + Math.random() * 0.8,
        scaleStart: 1.0,
        rotSpeed: new THREE.Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      });
    }
  }

  public update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife; // 1 -> 0
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Gravity for standard particles
      if (p.velocity.lengthSq() > 0.01) {
        p.velocity.y -= 9.8 * dt;
      }

      // Shockwave ring expansion
      if (p.mesh.geometry === this.ringGeo) {
        const ringScale = (1 - progress) * 6 + 0.5;
        p.mesh.scale.set(ringScale, ringScale, ringScale);
      } else {
        const scale = p.scaleStart * progress;
        p.mesh.scale.set(scale, scale, scale);
      }

      // Rotate
      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      // Fade out opacity
      const mat = p.mesh.material as THREE.Material & { opacity?: number };
      if (mat && 'opacity' in mat) {
        mat.opacity = progress;
      }
    }
  }

  public clear() {
    for (const p of this.particles) {
      this.group.remove(p.mesh);
    }
    this.particles = [];
  }
}
