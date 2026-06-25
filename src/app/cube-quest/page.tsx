"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// --- 型定義 ---
type FaceDef = { id: string; color: string; pos: [number, number, number]; pivot: [number, number, number]; axis: "X" | "Y"; sign: number; parent?: string };
type FaceConfig = { text: string; rotation: number };

// --- 変更不可 ---
const COLORS = { b: "#0ea5e9", f: "#f43f5e", bk: "#10b981", l: "#eab308", r: "#a855f7", t: "#f8fafc" };

// --- 色コードから名前を逆引きする関数 ---
const getColorName = (colorCode: string) => {
  const map: Record<string, string> = {
    [COLORS.b]: "青面",
    [COLORS.f]: "赤面",
    [COLORS.bk]: "緑面",
    [COLORS.l]: "黄面",
    [COLORS.r]: "紫面",
    [COLORS.t]: "白面"
  };
  return map[colorCode] || "不明";
};

// --- パターン定義 (ここを省略) ---
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

// --- コンポーネント定義 ---
function FaceInstance({ def, progress, allFaces, config, isSelected }: { def: FaceDef; progress: number; allFaces: FaceDef[]; config: FaceConfig; isSelected: boolean }) {
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
        {isSelected && (
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(0.9, 0.9)]} />
            <lineBasicMaterial color="yellow" />
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

export default function CubeQuestPage() {
  const [key, setKey] = useState("1-4-1-a (十字)");
  const [progress, setProgress] = useState(0);
  const [isEditMode, setIsEditMode] = useState(true);
  const [faceConfigs, setFaceConfigs] = useState<Record<string, FaceConfig>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const patterns = useMemo(getPatterns, []);
  const currentFaces = patterns[key];

  return (
    <div style={{ width: "100%", height: "100dvh", display: "flex", flexDirection: "column", background: "#020617", color: "white", overflow: "hidden" }}>
      <div style={{ padding: "16px", background: "#0f172a", flexShrink: 0 }}>
        <select value={key} onChange={(e) => {setKey(e.target.value); setSelectedId(null);}} style={{ width: "100%", padding: "16px", fontSize: "18px", background: "#1e293b", color: "white", borderRadius: "8px", marginBottom: "16px" }}>
          {Object.keys(patterns).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        
        {isEditMode && (
          <div style={{ background: "#334155", padding: "16px", borderRadius: "12px" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>編集する面を選択</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
              {currentFaces.map((f) => (
                <button key={f.id} onClick={() => setSelectedId(f.id)} style={{ padding: "10px", background: selectedId === f.id ? "#38bdf8" : "#475569", border: "none", borderRadius: "6px", color: "white", fontWeight: "bold" }}>
                  {/* IDではなく色の名前を参照 */}
                  {getColorName(f.color)}
                </button>
              ))}
            </div>
            
            {selectedId && (
              <div style={{ borderTop: "1px solid #64748b", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <p style={{ margin: 0 }}>選択中: <strong>{getColorName(currentFaces.find(f => f.id === selectedId)?.color || "")}</strong></p>
                  <button onClick={() => setSelectedId(null)} style={{ padding: "8px 16px", background: "#22c55e", border: "none", borderRadius: "6px", color: "white" }}>編集完了</button>
                </div>
                <input placeholder="文字を入力..." value={faceConfigs[selectedId]?.text || ""} onChange={(e) => setFaceConfigs(prev => ({...prev, [selectedId]: {...(prev[selectedId] || {text: "", rotation: 0}), text: e.target.value}}))} style={{ width: "100%", padding: "12px", fontSize: "16px", borderRadius: "6px", border: "none", boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  {[0, 90, 180, 270].map(deg => (
                    <button key={deg} onClick={() => setFaceConfigs(prev => ({...prev, [selectedId]: {...(prev[selectedId] || {text: "", rotation: 0}), rotation: deg}}))} style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "none", background: faceConfigs[selectedId]?.rotation === deg ? "#38bdf8" : "#475569", color: "white" }}>{deg}°</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <group rotation={[-Math.PI / 2, 0, 0]} position={[-1, -1, 0]}>
            {currentFaces.map(f => (
              <FaceInstance key={f.id} def={f} progress={isEditMode ? 0 : progress} allFaces={currentFaces} config={faceConfigs[f.id] || { text: "", rotation: 0 }} isSelected={selectedId === f.id} />
            ))}
          </group>
          <OrbitControls makeDefault />
        </Canvas>
        <div style={{ position: "absolute", bottom: "30px", width: "90%", left: "5%", zIndex: 20 }}>
          <button onClick={() => setIsEditMode(!isEditMode)} style={{ width: "100%", padding: "12px", marginBottom: "10px", borderRadius: "8px", border: "none", background: isEditMode ? "#22c55e" : "#38bdf8", fontSize: "18px", fontWeight: "bold" }}>
            {isEditMode ? "組み立てモードへ" : "編集モードへ戻る"}
          </button>
          {!isEditMode && <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", height: "40px" }} />}
        </div>
      </div>
    </div>
  );
}
