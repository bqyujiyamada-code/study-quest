"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type FaceDef = { 
  id: string; 
  color: string; 
  pos: [number, number, number]; 
  pivot: [number, number, number]; 
  axis: "X" | "Y"; 
  sign: number; 
  parent?: string 
};

// 色とIDを完全に固定
const COLORS = { b: "#0ea5e9", f: "#f43f5e", bk: "#10b981", l: "#eab308", r: "#a855f7", t: "#f8fafc" };

const getValidPatterns = (): Record<string, FaceDef[]> => ({
  "十字型": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" }
  ],
  "階段型": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [1, 0.5, 0], axis: "X", sign: -1, parent: "f" },
    { id: "bk", color: COLORS.bk, pos: [2, 1, 0], pivot: [1.5, 1, 0], axis: "Y", sign: 1, parent: "r" },
    { id: "l", color: COLORS.l, pos: [2, 2, 0], pivot: [2, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "t", color: COLORS.t, pos: [3, 2, 0], pivot: [2.5, 2, 0], axis: "Y", sign: 1, parent: "l" }
  ]
});

function FaceInstance({ def, progress, allFaces }: { def: FaceDef; progress: number; allFaces: FaceDef[] }) {
  const groupRef = useRef<THREE.Group>(null);
  useEffect(() => {
    if (!groupRef.current) return;
    const getMatrix = (target: FaceDef): THREE.Matrix4 => {
      const m = new THREE.Matrix4();
      if (target.parent) m.multiply(getMatrix(allFaces.find(f => f.id === target.parent)!));
      const angle = (progress / 100) * (Math.PI / 2);
      const axis = target.axis === "X" ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const rot = new THREE.Matrix4().makeRotationAxis(axis, angle * target.sign);
      const p = new THREE.Vector3(...target.pivot);
      m.multiply(new THREE.Matrix4().makeTranslation(p.x, p.y, p.z));
      m.multiply(rot);
      m.multiply(new THREE.Matrix4().makeTranslation(-p.x, -p.y, -p.z));
      return m;
    };
    groupRef.current.matrix.copy(getMatrix(def));
    groupRef.current.matrixAutoUpdate = false;
  }, [progress, def, allFaces]);

  return (
    <group ref={groupRef}>
      <mesh position={def.pos}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color={def.color} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function CubeQuest() {
  const [key, setKey] = useState("十字型");
  const [progress, setProgress] = useState(0);
  const patterns = useMemo(getValidPatterns, []);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ padding: "16px", background: "#0f172a" }}>
        <h2>展開図実験室（カラー固定版）</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {Object.keys(patterns).map(k => (
            <button key={k} onClick={() => {setKey(k); setProgress(0);}} style={{ padding: "8px", background: key === k ? "#22d3ee" : "#1e293b", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}>{k}</button>
          ))}
        </div>
        <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", marginTop: "16px" }} />
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <group rotation={[-Math.PI / 2, 0, 0]} position={[-1.5, -1, 0]}>
            {patterns[key].map(f => <FaceInstance key={f.id} def={f} progress={progress} allFaces={patterns[key]} />)}
          </group>
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
