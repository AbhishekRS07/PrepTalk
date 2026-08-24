"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// Sparse 3D network of drifting points, connected by lines when close —
// ambient "data flowing through a system" depth behind the landing hero.
export default function TerminalParticleField() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = 12;

    const COUNT = 55;
    const CONNECT_DIST = 3.2;
    const signal = new THREE.Color("#39f2a0");

    const nodes = Array.from({ length: COUNT }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 8
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.006
      ),
    }));

    const dotGeo = new THREE.BufferGeometry();
    const dotPositions = new Float32Array(COUNT * 3);
    dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPositions, 3));
    const dotMat = new THREE.PointsMaterial({
      color: signal,
      size: 0.06,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });
    const dots = new THREE.Points(dotGeo, dotMat);
    scene.add(dots);

    const maxLines = COUNT * 4;
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxLines * 2 * 3);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: signal, transparent: true, opacity: 0.12 });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    let raf;
    const animate = () => {
      for (let i = 0; i < COUNT; i++) {
        const n = nodes[i];
        n.pos.add(n.vel);
        if (Math.abs(n.pos.x) > 8) n.vel.x *= -1;
        if (Math.abs(n.pos.y) > 4.5) n.vel.y *= -1;
        if (Math.abs(n.pos.z) > 4) n.vel.z *= -1;
        dotPositions[i * 3] = n.pos.x;
        dotPositions[i * 3 + 1] = n.pos.y;
        dotPositions[i * 3 + 2] = n.pos.z;
      }
      dotGeo.attributes.position.needsUpdate = true;

      let lineIdx = 0;
      for (let i = 0; i < COUNT && lineIdx < maxLines; i++) {
        for (let j = i + 1; j < COUNT && lineIdx < maxLines; j++) {
          if (nodes[i].pos.distanceTo(nodes[j].pos) < CONNECT_DIST) {
            const a = nodes[i].pos, b = nodes[j].pos;
            linePositions[lineIdx * 6] = a.x;
            linePositions[lineIdx * 6 + 1] = a.y;
            linePositions[lineIdx * 6 + 2] = a.z;
            linePositions[lineIdx * 6 + 3] = b.x;
            linePositions[lineIdx * 6 + 4] = b.y;
            linePositions[lineIdx * 6 + 5] = b.z;
            lineIdx++;
          }
        }
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.setDrawRange(0, lineIdx * 2);

      scene.rotation.y += 0.0006;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      dotGeo.dispose();
      dotMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" />;
}
