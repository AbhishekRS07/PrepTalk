"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroCanvas() {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Renderer ───────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // ── Scene & Camera ─────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      72,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.z = 7;

    // ── Lights ─────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light1 = new THREE.PointLight(0x7c3aed, 4, 30);
    light1.position.set(6, 6, 4);
    scene.add(light1);
    const light2 = new THREE.PointLight(0x4f46e5, 2, 30);
    light2.position.set(-6, -4, 4);
    scene.add(light2);

    // ── Particle Field ─────────────────────────────────────────
    const count = 2500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x8b5cf6,
      size: 0.05,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Floating Orbs ──────────────────────────────────────────
    const orbConfigs = [
      { pos: [-3.8, 1.8, -2],  scale: 1.3, color: 0x7c3aed, speed: 0.5 },
      { pos: [ 3.8, -1.2, -3], scale: 1.6, color: 0x4f46e5, speed: 0.35 },
      { pos: [ 0.5,  3.5, -5], scale: 2.2, color: 0x6d28d9, speed: 0.28 },
      { pos: [-4.5, -2.8, -4], scale: 1.1, color: 0x3730a3, speed: 0.6 },
      { pos: [ 5,    2.8, -6], scale: 1.9, color: 0x4338ca, speed: 0.4 },
      { pos: [-1.5, -3.5, -3], scale: 1.0, color: 0x8b5cf6, speed: 0.7 },
    ];

    const orbs = orbConfigs.map(({ pos: p, scale, color, speed }) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 48, 48),
        new THREE.MeshPhongMaterial({
          color,
          transparent: true,
          opacity: 0.13,
          shininess: 120,
          specular: new THREE.Color(color),
        })
      );
      mesh.position.set(...p);
      mesh.scale.setScalar(scale);
      scene.add(mesh);
      const baseY = p[1];
      return { mesh, baseY, speed, phase: Math.random() * Math.PI * 2 };
    });

    // ── Mouse ──────────────────────────────────────────────────
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Resize ─────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Animation Loop ─────────────────────────────────────────
    const clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Drift particles
      particles.rotation.y = t * 0.018;
      particles.rotation.x = Math.sin(t * 0.012) * 0.08;

      // Float orbs
      orbs.forEach(({ mesh, baseY, speed, phase }) => {
        mesh.position.y = baseY + Math.sin(t * speed + phase) * 0.6;
        mesh.rotation.z += 0.002;
        mesh.rotation.x += 0.001;
      });

      // Smooth mouse parallax on camera
      camera.position.x += (mouseRef.current.x * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (mouseRef.current.y * 0.8 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // ── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}
