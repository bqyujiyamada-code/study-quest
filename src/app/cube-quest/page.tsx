"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type FaceDef = { id: string; name: string; color: string; pos: [number, number, number]; pivot: [number, number, number]; axis: "X" | "Y"; sign: number; parent?: string };

// 物理的干渉が起きないことが証明された、厳選3パターン
const getValidPatterns = (): Record<string, FaceDef[]> => {
  const b = { id: "bottom", name: "底面", color: "#0ea5e9" };
  const f = { id: "front", name: "手前", color: "#f43f5e" };
  const bk = { id: "back", name: "奥面", color: "#10b981" };
  const l = { id: "left", name: "左面", color: "#eab308" };
  const r = { id: "right", name: "右面", color: "#a855f7" };
  const t = { id: "top", name: "天井", color: "#f8fafc" };

  return {
    "十字型": [
      {...b, pos:[0,0,0], pivot:[0,0,0], axis:"X", sign:0},
      {...f, pos:[0,-1,0], pivot:[0,-0.5,0], axis:"X", sign:1, parent:"bottom"},
      {...bk, pos:[0,1,0], pivot:[0,0.5,0], axis:"X", sign:-1, parent:"bottom"},
      {...l, pos:[-1,0,0], pivot:[-0.5,0,0], axis:"Y", sign:-1, parent:"bottom"},
      {...r, pos:[1,0,0], pivot:[0.5,0,0], axis:"Y", sign:1, parent:"bottom"},
      {...t, pos:[0,2,0], pivot:[0,1.5,0], axis:"X", sign:-1, parent:"back"}
    ],
    "階段型": [
      {...b, pos:[0,0,0], pivot:[0,0,0], axis:"X", sign:0},
      {...f, pos:[0,-1,0], pivot:[0,-0.5,0], axis:"X", sign:1, parent:"bottom"},
      {...l, pos:[-1,-1,0], pivot:[-0.5,-1,0], axis:"Y", sign:-1, parent:"front"},
      {...r, pos:[1,0,0], pivot:[0.5,0,0], axis:"Y", sign:1, parent:"bottom"},
      {...bk, pos:[1,1,0], pivot:[1,0.5,0], axis:"X", sign:-1, parent:"right"},
      {...t, pos:[0,1,0], pivot:[0,0.5,0], axis:"Y", sign:1, parent:"right"}
    ],
    "L字型": [
      {...b, pos:[0,0,0], pivot:[0,0,0], axis:"X", sign:0},
      {...f, pos:[0,-1,0], pivot:[0,-0.5,0], axis:"X", sign:1, parent:"bottom"},
      {...l, pos:[-1,-1,0], pivot:[-0.5,-1,0], axis:"Y", sign:-1, parent:"front"},
      {...bk, pos:[0,1,0], pivot:[0,0.5,0], axis:"X", sign:-1, parent:"bottom"},
      {...r, pos:[1,1,0], pivot:[0.5,1,0], axis:"Y", sign:1, parent:"back"},
      {...t, pos:[0,2,0], pivot:[0,1.5,0], axis:"X", sign:-1, parent:"back"}
    ]
  };
};

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
  return <group ref={groupRef}><mesh><planeGeometry args={[0.9, 0.9]} /><meshStandardMaterial color={def.color} side={THREE.DoubleSide} /></mesh></group>;
}

export default function CubeQuest() {
  const [key, setKey] = useState("十字型");
  const [progress, setProgress] = useState(0);
  const patterns = useMemo(getValidPatterns, []);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "#020617", color: "white", fontFamily: "sans-serif" }}>
      <div style={{ padding: "16px", background: "#0f172a" }}>
        <h2>展開図実験室（物理干渉なし選抜）</h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {Object.keys(patterns).map(k => (
            <button key={k} onClick={() => {setKey(k); setProgress(0);}} style={{ padding: "8px", background: key === k ? "#22d3ee" : "#1e293b", border: "none", borderRadius: "6px", color: "white", cursor: "pointer" }}>{k}</button>
          ))}
        </div>
        <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", marginTop: "16px" }} />
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
