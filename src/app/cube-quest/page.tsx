"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// --- 型定義 ---
type FaceDef = {
  id: string;
  name: string;
  color: string;
  pos: [number, number, number];
  pivot: [number, number, number];
  axis: "X" | "Y";
  sign: number;
  parent?: string;
};

// --- パターンデータ ---
const getPatterns = (): Record<string, FaceDef[]> => ({
  p01: [
    { id: "bottom", name: "底面", color: "#0ea5e9", pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "front", name: "手前", color: "#f43f5e", pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "bottom" },
    { id: "back", name: "奥面", color: "#10b981", pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "bottom" },
    { id: "left", name: "左面", color: "#eab308", pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "bottom" },
    { id: "right", name: "右面", color: "#a855f7", pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "bottom" },
    { id: "top", name: "天井", color: "#f8fafc", pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "back" }
  ],
  p02: [
    { id: "bottom", name: "底面", color: "#0ea5e9", pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "front", name: "手前", color: "#f43f5e", pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "bottom" },
    { id: "back", name: "奥面", color: "#10b981", pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "bottom" },
    { id: "top", name: "天井", color: "#f8fafc", pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "back" },
    { id: "right", name: "右面", color: "#a855f7", pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "back" },
    { id: "left", name: "左面", color: "#eab308", pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "bottom" }
  ]
});

// --- 面コンポーネント ---
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
      const pivot = new THREE.Vector3(...target.pivot);
      const pos = new THREE.Vector3(...target.pos);
      if (target.parent) {
        const p = allFaces.find(f => f.id === target.parent)!;
        pos.sub(new THREE.Vector3(...p.pos));
        pivot.sub(new THREE.Vector3(...p.pos));
      }
      m.multiply(new THREE.Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z));
      m.multiply(rot);
      m.multiply(new THREE.Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));
      m.multiply(new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z));
      return m;
    };
    groupRef.current.matrix.copy(getMatrix(def));
    groupRef.current.matrixAutoUpdate = false;
  }, [progress, def, allFaces]);

  return (
    <group ref={groupRef}>
      <mesh><planeGeometry args={[0.9, 0.9]} /><meshStandardMaterial color={def.color} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

// --- メイン ---
export default function CubeQuest() {
  const [key, setKey] = useState("p01");
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const patterns = useMemo(getPatterns, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // スタイル補助関数
  const getButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 12px", background: active ? "#22d3ee" : "#1e293b",
    border: "none", borderRadius: "6px", color: "white", cursor: "pointer",
    fontSize: "14px", flex: "1 1 calc(50% - 8px)"
  });

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: isMobile ? "column" : "row", background: "#020617", color: "white", fontFamily: "sans-serif", overflow: "hidden" }}>
      <div style={{ width: isMobile ? "100%" : "300px", flex: isMobile ? "none" : "0 0 300px", padding: "16px", background: "#0f172a", borderBottom: isMobile ? "1px solid #334" : "none", borderRight: isMobile ? "none" : "1px solid #334", overflowY: "auto", boxSizing: "border-box" }}>
        <h2 style={{ fontSize: "18px", margin: "0 0 16px 0" }}>展開図実験室</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.keys(patterns).map(k => (
            <button key={k} onClick={() => {setKey(k); setProgress(0);}} style={getButtonStyle(key === k)}>
              {k === "p01" ? "十字型" : "階段型"}
            </button>
          ))}
        </div>
        <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", marginTop: "24px" }} />
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas camera={{ position: [0, 4, 5] }}>
          <ambientLight intensity={0.8} />
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {patterns[key].map(f => <FaceInstance key={f.id} def={f} progress={progress} allFaces={patterns[key]} />)}
          </group>
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
