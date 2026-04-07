"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COLORS = [
  new THREE.Color("#10b981"), // emerald
  new THREE.Color("#8b5cf6"), // violet
  new THREE.Color("#f59e0b"), // gold
  new THREE.Color("#06b6d4"), // cyan
  new THREE.Color("#ffffff"), // white
  new THREE.Color("#ec4899"), // pink
];

export default function MilestoneCompletionEffect({ onDone }) {
  const mountRef = useRef(null);
  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 100);
    camera.position.z = 5;

    // ── Lights ────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pLight = new THREE.PointLight(0x8b5cf6, 6, 20);
    pLight.position.set(0, 0, 3);
    scene.add(pLight);
    const pLight2 = new THREE.PointLight(0x10b981, 4, 20);
    pLight2.position.set(2, -1, 2);
    scene.add(pLight2);

    // ── Particles ─────────────────────────────────────────────────
    const PARTICLE_COUNT = 90;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const color = COLORS[i % COLORS.length];
      const isStar = i % 4 === 0;
      const size = isStar
        ? 0.06 + Math.random() * 0.1
        : 0.03 + Math.random() * 0.07;

      const geo = isStar
        ? new THREE.OctahedronGeometry(size)
        : new THREE.SphereGeometry(size, 8, 8);

      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: isStar ? 3 : 2,
        transparent: true,
        opacity: 1,
        roughness: 0.2,
        metalness: 0.8,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0, 0);
      scene.add(mesh);

      // Burst in hemisphere — bias slightly upward
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() * Math.PI) / 1.4;
      const speed = 0.06 + Math.random() * 0.2;

      particles.push({
        mesh,
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.cos(phi) * speed * 0.6 + 0.04,
        vz: Math.sin(phi) * Math.sin(theta) * speed * 0.35,
        life: 1.0,
        decay: 0.010 + Math.random() * 0.014,
        rx: (Math.random() - 0.5) * 0.18,
        ry: (Math.random() - 0.5) * 0.18,
        rz: (Math.random() - 0.5) * 0.12,
      });
    }

    // ── Shockwave rings ───────────────────────────────────────────
    const makeRing = (color, thickness) => {
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.05, thickness, 16, 80),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.9 })
      );
      scene.add(mesh);
      return mesh;
    };

    const ring1 = makeRing("#10b981", 0.025);
    const ring2 = makeRing("#8b5cf6", 0.015);
    const ring3 = makeRing("#f59e0b", 0.010);

    // ── Star flash ────────────────────────────────────────────────
    // A brief bright sphere at origin that fades fast
    const flashMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 16, 16),
      new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffffff"), transparent: true, opacity: 0.7 })
    );
    scene.add(flashMesh);

    // ── Animation ─────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId;
    let finished = false;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Flash
      flashMesh.material.opacity = Math.max(0, 0.7 - t * 3.5);
      flashMesh.scale.setScalar(1 + t * 4);

      // Rings expand + fade
      const r1Scale = 1 + t * 9;
      ring1.scale.setScalar(r1Scale);
      ring1.material.opacity = Math.max(0, 0.9 - t * 1.6);

      const r2Scale = 1 + t * 6;
      ring2.scale.setScalar(r2Scale);
      ring2.material.opacity = Math.max(0, 0.7 - t * 1.0);

      const r3Scale = 1 + t * 12;
      ring3.scale.setScalar(r3Scale);
      ring3.material.opacity = Math.max(0, 0.5 - t * 1.8);

      // Particles
      let allDead = true;
      for (const p of particles) {
        if (p.life <= 0) {
          p.mesh.visible = false;
          continue;
        }
        allDead = false;
        p.vy -= 0.0025; // gravity
        p.vx *= 0.985;
        p.vz *= 0.985;
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.mesh.rotation.x += p.rx;
        p.mesh.rotation.y += p.ry;
        p.mesh.rotation.z += p.rz;
        p.life -= p.decay;
        const lifeEased = Math.max(0, p.life);
        p.mesh.material.opacity = lifeEased;
        p.mesh.material.emissiveIntensity = lifeEased * 2.5;
      }

      renderer.render(scene, camera);

      if (allDead && !finished) {
        finished = true;
        cancelAnimationFrame(animId);
        onDoneRef.current?.();
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    />
  );
}
