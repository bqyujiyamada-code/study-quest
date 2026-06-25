"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// --- 型定義 ---
type FaceDef = { id: string; color: string; pos: [number, number, number]; pivot: [number, number, number]; axis: "X" | "Y"; sign: number; parent?: string };
type FaceConfig = { text: string; rotation: number };

// --- 定数 ---
const COLORS = { b: "#0ea5e9", f: "#f43f5e", bk: "#10b981", l: "#eab308", r: "#a855f7", t: "#f8fafc" };

const getPatterns = (): Record<string, FaceDef[]> => ({
  "1-4-1-a (十字)": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" }
  ],
  "1-4-1-b": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "bk" }
  ],
  "1-4-1-c": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, 1, 0], pivot: [-0.5, 1, 0], axis: "Y", sign: -1, parent: "bk" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "bk" }
  ],
  "1-4-1-d": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "f" },
    { id: "r", color: COLORS.r, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" }
  ],
  "1-4-1-e": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "f" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "bk" }
  ],
  "1-4-1-f": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "f" },
    { id: "r", color: COLORS.r, pos: [1, -1, 0], pivot: [0.5, -1, 0], axis: "Y", sign: 1, parent: "f" }
  ],
  "1-3-2-a (1が上)": [
    { id: "c1", color: COLORS.f, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "c2", color: COLORS.t, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "c1" }, // c1-c2の辺
    { id: "c3", color: COLORS.b, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "c1" }, // c1-c3の辺
    { id: "left", color: COLORS.l, pos: [-1, 1, 0], pivot: [-0.5, 1, 0], axis: "Y", sign: -1, parent: "c2" },
    { id: "r1", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "c2" },
    { id: "r2", color: COLORS.bk, pos: [1, 2, 0], pivot: [1, 1.5, 0], axis: "X", sign: -1, parent: "r1" } // r1-r2の辺
  ],
  "1-3-2-b (1が中)": [
    { id: "c1", color: COLORS.f, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "c2", color: COLORS.t, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "c1" },
    { id: "c3", color: COLORS.b, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "c1" },
    { id: "left", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "c1" },
    { id: "r1", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "c2" },
    { id: "r2", color: COLORS.bk, pos: [1, 2, 0], pivot: [1, 1.5, 0], axis: "X", sign: -1, parent: "r1" }
  ],
  "1-3-2-c (1が下)": [
    { id: "c1", color: COLORS.f, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "c2", color: COLORS.t, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "c1" },
    { id: "c3", color: COLORS.b, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "c1" },
    { id: "left", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "c3" },
    { id: "r1", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "c2" },
    { id: "r2", color: COLORS.bk, pos: [1, 2, 0], pivot: [1, 1.5, 0], axis: "X", sign: -1, parent: "r1" }
  ],
  "階段型 (2-2-2)": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [1, 0.5, 0], axis: "X", sign: -1, parent: "f" },
    { id: "bk", color: COLORS.bk, pos: [2, 1, 0], pivot: [1.5, 1, 0], axis: "Y", sign: 1, parent: "r" },
    { id: "l", color: COLORS.l, pos: [2, 2, 0], pivot: [2, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "t", color: COLORS.t, pos: [3, 2, 0], pivot: [2.5, 2, 0], axis: "Y", sign: 1, parent: "l" }
  ],
  "3-3型": [
{ id: "c1", color: COLORS.f, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "c2", color: COLORS.t, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "c1" },
    { id: "c3", color: COLORS.b, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "c2" },
    { id: "r1", color: COLORS.bk, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "c1" },
    { id: "r2", color: COLORS.r, pos: [1, -1, 0], pivot: [1, -0.5, 0], axis: "X", sign: 1, parent: "r1" },
    { id: "r3", color: COLORS.l, pos: [1, -2, 0], pivot: [1, -1.5, 0], axis: "X", sign: 1, parent: "r2" }
  ]
});

function FaceInstance({ def, progress, allFaces, config, isSelected }: { def: FaceDef; progress: number; allFaces: FaceDef[]; config: FaceConfig; isSelected: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (!groupRef.current) return;
    // ... (行列計算処理はそのまま)
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
        
        {/* 選択中の場合、黄色い枠線を表示するエフェクト */}
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(0.9, 0.9)]} />
            <lineBasicMaterial color="yellow" linewidth={5} />
          </lineSegments>
        )}
        
        <Html position={[0, 0, 0.05]} transform occlude distanceFactor={2} center>
          <div style={{ width: "90px", height: "90px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px", fontWeight: "bold", color: "white", transform: `rotate(${config.rotation}deg)`, userSelect: "none" }}>
            {config.text}
          </div>
        </Html>
      </mesh>
    </group>
  );
}

// ... (CubeQuestPage内の修正)

{selectedId && (
  <div style={{ marginTop: "16px", borderTop: "1px solid #64748b", paddingTop: "16px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
      <p style={{ margin: 0 }}>選択中: <strong>面 {selectedId}</strong></p>
      {/* 編集完了ボタンを復活させました */}
      <button onClick={() => setSelectedId(null)} style={{ padding: "8px 16px", background: "#22c55e", border: "none", borderRadius: "6px", color: "white" }}>編集完了</button>
    </div>
    
    <input 
      placeholder="文字を入力..." 
      value={faceConfigs[selectedId]?.text || ""} 
      onChange={(e) => setFaceConfigs(prev => ({...prev, [selectedId]: {...(prev[selectedId] || {text: "", rotation: 0}), text: e.target.value}}))} 
      style={{ width: "100%", padding: "12px", fontSize: "16px", borderRadius: "6px", border: "none", boxSizing: "border-box" }} 
    />
    
    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
      {[0, 90, 180, 270].map(deg => (
        <button key={deg} onClick={() => setFaceConfigs(prev => ({...prev, [selectedId]: {...(prev[selectedId] || {text: "", rotation: 0}), rotation: deg}}))} style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "none", background: faceConfigs[selectedId]?.rotation === deg ? "#38bdf8" : "#475569", color: "white" }}>{deg}°</button>
      ))}
    </div>
  </div>
)}
