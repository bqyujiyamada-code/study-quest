"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

// 型定義をファイルのトップレベルで定義
type FaceDef = { id: string; color: string; pos: [number, number, number]; pivot: [number, number, number]; axis: "X" | "Y"; sign: number; parent?: string };
type FaceConfig = { text: string; rotation: number };

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

function FaceInstance({ 
  def, progress, allFaces, config, onClick, isSelected 
}: { 
  def: FaceDef; progress: number; allFaces: FaceDef[]; config: FaceConfig; onClick: () => void; isSelected: boolean 
}) {
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
      <mesh position={def.pos} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color={isSelected ? "#ffffff" : def.color} side={THREE.DoubleSide} />
        
        {/* Htmlの配置を調整 */}
        <Html 
          position={[0, 0, 0.05]} 
          transform 
          occlude 
          distanceFactor={2}
          center // ★ここが重要：Html要素自体をメッシュの中心に配置する
        >
          <div style={{ 
            width: "90px", 
            height: "90px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "60px", 
            fontWeight: "bold", 
            color: isSelected ? "black" : "white", 
            transform: `rotate(${config.rotation}deg)`, // ここで回転
            userSelect: "none"
          }}>
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
  const [faceConfigs, setFaceConfigs] = useState<Record<string, FaceConfig>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const patterns = useMemo(getPatterns, []);
  const currentFaces = patterns[key];

  return (
    <div style={{ width: "100%", height: "100dvh", display: "flex", flexDirection: "column", background: "#020617", color: "white", overflow: "hidden" }}>
      <div style={{ padding: "16px", background: "#0f172a", boxSizing: "border-box" }}>
        <select value={key} onChange={(e) => {setKey(e.target.value); setProgress(0); setSelectedId(null);}} 
          style={{ width: "100%", padding: "16px", fontSize: "18px", background: "#1e293b", color: "white", borderRadius: "8px" }}>
          {Object.keys(patterns).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        
        {selectedId && (
          <div style={{ background: "#334155", padding: "16px", borderRadius: "12px", marginTop: "16px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0 }}>面: {selectedId} を編集</h3>
              <button onClick={() => setSelectedId(null)} style={{ padding: "8px 16px", background: "#ef4444", borderRadius: "6px", color: "white", border: "none", fontSize: "16px" }}>閉じる</button>
            </div>
            
            <input 
              placeholder="文字を入力..." 
              value={faceConfigs[selectedId]?.text || ""} 
              onChange={(e) => setFaceConfigs(prev => ({...prev, [selectedId]: {...(prev[selectedId] || {text: "", rotation: 0}), text: e.target.value}}))} 
              style={{ width: "100%", padding: "12px", fontSize: "16px", boxSizing: "border-box", borderRadius: "6px", border: "none" }} 
            />

            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              {[0, 90, 180, 270].map(deg => (
                <button 
                  key={deg} 
                  onClick={() => setFaceConfigs(prev => ({...prev, [selectedId]: {...(prev[selectedId] || {text: "", rotation: 0}), rotation: deg}}))} 
                  style={{ 
                    flex: 1, padding: "12px", borderRadius: "6px", border: "none", 
                    background: faceConfigs[selectedId]?.rotation === deg ? "#38bdf8" : "#475569",
                    color: "white", fontSize: "16px"
                  }}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <group rotation={[-Math.PI / 2, 0, 0]} position={[-1, -1, 0]}>
            {currentFaces.map(f => (
              <FaceInstance key={f.id} def={f} progress={progress} allFaces={currentFaces} 
                config={faceConfigs[f.id] || { text: "", rotation: 0 }} 
                isSelected={selectedId === f.id}
                onClick={() => setSelectedId(f.id)} 
              />
            ))}
          </group>
          <OrbitControls makeDefault />
        </Canvas>
        
        <div style={{ position: "absolute", bottom: "30px", width: "90%", left: "5%", zIndex: 20 }}>
          <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} style={{ width: "100%", height: "40px" }} />
        </div>
      </div>
    </div>
  );
}
