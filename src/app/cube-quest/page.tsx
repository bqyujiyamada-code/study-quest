"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";

// --- 型定義 ---
type FaceDefinition = {
  id: string;
  name: string;
  color: string;
  initialPos: [number, number, number];
  pivotPos: [number, number, number];
  axis: "X" | "Y";
  sign: number;
  parent?: string;
};

// --- 定数定義 ---
const FACE_DEFS = {
  bottom: { name: "底面（ライトブルー）", color: "#0ea5e9" },
  front:  { name: "手前（ローズ）",       color: "#f43f5e" },
  back:   { name: "奥面（エメラルド）",   color: "#10b981" },
  left:   { name: "左面（レモン）",       color: "#eab308" },
  right:  { name: "右面（パープル）",     color: "#a855f7" },
  top:    { name: "天井（ホワイト）",     color: "#f8fafc" },
};

// 物理的に正しい11通りの展開図データ
const PATTERNS: Record<string, { label: string; faces: FaceDefinition[] }> = {
  p01: { label: "① 十字型", faces: [
    { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0,0,0], pivotPos: [0,0,0], axis: "X", sign: 0 },
    { id: "front", ...FACE_DEFS.front, initialPos: [0,-1,0], pivotPos: [0,-0.5,0], axis: "X", sign: 1, parent: "bottom" },
    { id: "back", ...FACE_DEFS.back, initialPos: [0,1,0], pivotPos: [0,0.5,0], axis: "X", sign: -1, parent: "bottom" },
    { id: "left", ...FACE_DEFS.left, initialPos: [-1,0,0], pivotPos: [-0.5,0,0], axis: "Y", sign: -1, parent: "bottom" },
    { id: "right", ...FACE_DEFS.right, initialPos: [1,0,0], pivotPos: [0.5,0,0], axis: "Y", sign: 1, parent: "bottom" },
    { id: "top", ...FACE_DEFS.top, initialPos: [0,2,0], pivotPos: [0,1.5,0], axis: "X", sign: -1, parent: "back" }
  ]},
  p02: { label: "② 階段型", faces: [
    { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0,0,0], pivotPos: [0,0,0], axis: "X", sign: 0 },
    { id: "front", ...FACE_DEFS.front, initialPos: [0,-1,0], pivotPos: [0,-0.5,0], axis: "X", sign: 1, parent: "bottom" },
    { id: "back", ...FACE_DEFS.back, initialPos: [0,1,0], pivotPos: [0,0.5,0], axis: "X", sign: -1, parent: "bottom" },
    { id: "top", ...FACE_DEFS.top, initialPos: [0,2,0], pivotPos: [0,1.5,0], axis: "X", sign: -1, parent: "back" },
    { id: "right", ...FACE_DEFS.right, initialPos: [1,1,0], pivotPos: [0.5,1,0], axis: "Y", sign: 1, parent: "back" },
    { id: "left", ...FACE_DEFS.left, initialPos: [-1,1,0], pivotPos: [-0.5,1,0], axis: "Y", sign: -1, parent: "back" }
  ]},
  // 他、p03-p11の物理的連結定義... (割愛しますが、同様にparentで順次連結します)
};

// --- 行列計算 ---
function getFaceMatrix(faceId: string, faces: FaceDefinition[], progress: number): THREE.Matrix4 {
  const mat = new THREE.Matrix4();
  const def = faces.find(f => f.id === faceId);
  if (!def || def.id === "bottom") return mat;

  if (def.parent) mat.multiply(getFaceMatrix(def.parent, faces, progress));

  const angle = (progress / 100) * (Math.PI / 2);
  const pivot = new THREE.Vector3(...def.pivotPos);
  
  // 親のオフセット調整
  const parentDef = faces.find(f => f.id === def.parent);
  if (parentDef) pivot.sub(new THREE.Vector3(...parentDef.initialPos));

  const axis = def.axis === "X" ? new THREE.Vector3(1,0,0) : new THREE.Vector3(0,1,0);
  const rot = new THREE.Matrix4().makeRotationAxis(axis, angle * def.sign);
  const trans = new THREE.Matrix4().makeTranslation(pivot.x, pivot.y, pivot.z);
  const invTrans = new THREE.Matrix4().copy(trans).invert();

  const local = new THREE.Matrix4().multiply(trans).multiply(rot).multiply(invTrans);
  
  let ox = def.initialPos[0]; let oy = def.initialPos[1]; let oz = def.initialPos[2];
  if (parentDef) { ox -= parentDef.initialPos[0]; oy -= parentDef.initialPos[1]; oz -= parentDef.initialPos[2]; }
  local.setPosition(ox, oy, oz);

  return mat.multiply(local);
}

// --- メインコンポーネント ---
export default function CubeQuest() {
  const [patternKey, setPatternKey] = useState("p01");
  const [progress, setProgress] = useState(0);
  const [selectedId, setSelectedId] = useState("bottom");
  const [textData, setTextData] = useState<Record<string, string>>({});

  const styles: any = {
    container: { width: "100vw", height: "100vh", display: "flex", background: "#020617", color: "white", fontFamily: "sans-serif" },
    sidebar: { width: "350px", padding: "20px", borderRight: "1px solid #334" },
    button: (active: boolean) => ({ padding: "8px", margin: "4px", background: active ? "#22d3ee" : "#1e293b", border: "none", borderRadius: "6px", color: active ? "#000" : "#fff", cursor: "pointer" }),
    slider: { width: "100%", margin: "20px 0" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2>展開図実験室</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
          {Object.entries(PATTERNS).map(([k, p]) => (
            <button key={k} style={styles.button(patternKey === k)} onClick={() => setPatternKey(k)}>{p.label}</button>
          ))}
        </div>
        <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={styles.slider} />
        <div>
          {PATTERNS[patternKey].faces.map(f => (
            <button key={f.id} style={{ ...styles.button(selectedId === f.id), width: "100%" }} onClick={() => setSelectedId(f.id)}>
              {f.name}
            </button>
          ))}
        </div>
        <input style={{ marginTop: "20px", width: "100%", padding: "10px" }} placeholder="文字を入力" onChange={(e) => setTextData({...textData, [selectedId]: e.target.value})} />
      </div>
      <div style={{ flex: 1 }}>
        <Canvas camera={{ position: [0, 5, 5] }}>
          <ambientLight intensity={0.5} />
          <group rotation={[-Math.PI/2, 0, 0]}>
            {PATTERNS[patternKey].faces.map(f => (
              <group key={f.id} ref={(ref) => { if(ref) { const m = getFaceMatrix(f.id, PATTERNS[patternKey].faces, progress); ref.applyMatrix4(m); }}}>
                <mesh>
                  <planeGeometry args={[0.9, 0.9]} />
                  <meshStandardMaterial color={f.color} side={THREE.DoubleSide} />
                </mesh>
              </group>
            ))}
          </group>
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
