"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

type FaceConfig = { 
  text: string; 
  rotate: number;
};

type FaceDefinition = {
  id: string;
  name: string;
  color: string;
  initialPos: [number, number, number]; // 展開図（0%）の中心座標 [x, y, z]
  pivotPos: [number, number, number];   // 回転の軸となるフチの座標 [x, y, z]
  axis: "X" | "Y";
  sign: number;
  // 特殊な多段連動用の依存フラグ
  dependency?: "back-top" | "back-top-left" | "front-bottom" | "left-far";
};

// 🎨 面の色と名前の完全固定定義
const FACE_DEFS = {
  bottom: { name: "底面（ライトブルー）", color: "#0ea5e9" },
  front:  { name: "手前（ローズ）",       color: "#f43f5e" },
  back:   { name: "奥面（エメラルド）",   color: "#10b981" },
  left:   { name: "左面（レモン）",       color: "#eab308" },
  right:  { name: "右面（パープル）",     color: "#a855f7" },
  top:    { name: "天井（ホワイト）",     color: "#f8fafc" },
};

// 🗺️ 立方体の展開図 全11パターンの完璧な幾何学データ定義
const PATTERNS: Record<string, { label: string; faces: FaceDefinition[] }> = {
  p01: {
    label: "① 十字型",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 0, 0],  pivotPos: [-0.5, 0, 0], axis: "Y", sign: -1 },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1, dependency: "back-top" }
    ]
  },
  p02: {
    label: "② Z型（いなずま）",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 2, 0],  pivotPos: [-0.5, 2.0, 0], axis: "Y", sign: -1, dependency: "back-top-left" }
    ]
  },
  p03: {
    label: "③ T字型",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 1, 0],  pivotPos: [-0.5, 1.0, 0], axis: "Y", sign: -1, dependency: "back-top" },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 1, 0],   pivotPos: [0.5, 1.0, 0],  axis: "Y", sign: 1, dependency: "back-top" }
    ]
  },
  p04: {
    label: "④ L字型",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1, dependency: "back-top" },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 2, 0],   pivotPos: [0.5, 2.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 0, 0],  pivotPos: [-0.5, 0, 0], axis: "Y", sign: -1 }
    ]
  },
  p05: {
    label: "⑤ 階段型A",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1, dependency: "back-top" },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 1, 0],   pivotPos: [0.5, 1.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 0, 0],  pivotPos: [-0.5, 0, 0], axis: "Y", sign: -1 }
    ]
  },
  p06: {
    label: "⑥ 階段型B",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1, dependency: "back-top" },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 1, 0],  pivotPos: [-0.5, 1.0, 0], axis: "Y", sign: -1, dependency: "back-top" }
    ]
  },
  p07: {
    label: "⑦ のっぽ型",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 0, 0],  pivotPos: [-0.5, 0, 0], axis: "Y", sign: -1 },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [0, -2, 0],  pivotPos: [0, -1.5, 0], axis: "X", sign: 1, dependency: "front-bottom" }
    ]
  },
  p08: {
    label: "⑧ 3段並びA",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [1, 1, 0],   pivotPos: [0.5, 1.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, -1, 0], pivotPos: [-0.5, -1.0, 0], axis: "Y", sign: -1, dependency: "front-bottom" }
    ]
  },
  p09: {
    label: "⑨ 3段並びB",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 1, 0],   pivotPos: [0.5, 1.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [1, 2, 0],   pivotPos: [0.5, 2.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, 0, 0],  pivotPos: [-0.5, 0, 0], axis: "Y", sign: -1 }
    ]
  },
  p10: {
    label: "⑩ 3段並びC",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 1, 0],   pivotPos: [0.5, 1.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [1, 2, 0],   pivotPos: [0.5, 2.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, -1, 0], pivotPos: [-0.5, -1.0, 0], axis: "Y", sign: -1, dependency: "front-bottom" }
    ]
  },
  p11: {
    label: "⑪ ツイン型",
    faces: [
      { id: "bottom", ...FACE_DEFS.bottom, initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  ...FACE_DEFS.front,  initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   ...FACE_DEFS.back,   initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "right",  ...FACE_DEFS.right,  initialPos: [1, 1, 0],   pivotPos: [1.0, 0.5, 0],  axis: "X", sign: -1, dependency: "back-top" },
      { id: "top",    ...FACE_DEFS.top,    initialPos: [2, 1, 0],   pivotPos: [1.5, 1.0, 0],  axis: "Y", sign: 1, dependency: "back-top" },
      { id: "left",   ...FACE_DEFS.left,   initialPos: [-1, -1, 0], pivotPos: [-0.5, -1.0, 0], axis: "Y", sign: -1, dependency: "front-bottom" }
    ]
  }
};

function PrintedTextMaterial({ text, rotate, color }: { text: string; rotate: number; color: string }) {
  const textureRef = useRef<THREE.CanvasTexture>(null);
  useEffect(() => { if (textureRef.current) textureRef.current.needsUpdate = true; }, [text, rotate]);

  return (
    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.3} metalness={0.1}>
      <canvasTexture ref={textureRef} attach="map" image={(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 256);
          ctx.strokeStyle = "rgba(0,0,0,0.08)"; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 250, 250);
          ctx.fillStyle = "#0f172a"; ctx.font = "bold 120px sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.save(); ctx.translate(128, 128); ctx.rotate(toRadian(rotate));
          ctx.fillText(text, 0, 0); ctx.restore();
        }
        return canvas;
      })()} />
    </meshStandardMaterial>
  );
}

function SmartFoldableFace({ def, progress, faceConfig, isSelected }: { def: FaceDefinition; progress: number; faceConfig: FaceConfig; isSelected: boolean }) {
  const pivotRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!pivotRef.current) return;
    const angle = (progress / 100) * (Math.PI / 2);
    pivotRef.current.rotation.set(0, 0, 0);
    pivotRef.current.position.set(0, 0, 0);

    if (def.id === "bottom") return;

    // 🚀 全11パターンの複雑な多段親子連動を吸収するマトリクス合成ロジック
    const mBack = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle).setPosition(0, 0.5, 0);
    const mFront = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), angle).setPosition(0, -0.5, 0);

    let finalMatrix = new THREE.Matrix4();

    if (!def.dependency) {
      // 単純に底面に隣接している面
      pivotRef.current.position.set(...def.pivotPos);
      if (def.axis === "X") pivotRef.current.rotation.x = angle * def.sign;
      else pivotRef.current.rotation.y = angle * def.sign;
      return;
    }

    // 連動関係に応じたマトリクス合成
    if (def.dependency === "back-top") {
      const mSelf = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(def.axis === "X" ? 1 : 0, def.axis === "Y" ? 1 : 0, 0), angle * def.sign)
        .setPosition(def.pivotPos[0], def.pivotPos[1] - 0.5, def.pivotPos[2]);
      finalMatrix.multiplyMatrices(mBack, mSelf);
    } else if (def.dependency === "back-top-left") {
      const mTop = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle).setPosition(0, 1.0, 0);
      const mTopFinal = new THREE.Matrix4().multiplyMatrices(mBack, mTop);
      const mSelf = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), -angle).setPosition(-0.5, 0.5, 0);
      finalMatrix.multiplyMatrices(mTopFinal, mSelf);
    } else if (def.dependency === "front-bottom") {
      const mSelf = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(def.axis === "X" ? 1 : 0, def.axis === "Y" ? 1 : 0, 0), angle * def.sign)
        .setPosition(def.pivotPos[0], def.pivotPos[1] + 0.5, def.pivotPos[2]);
      finalMatrix.multiplyMatrices(mFront, mSelf);
    }

    const pos = new THREE.Vector3(); const quad = new THREE.Quaternion();
    finalMatrix.decompose(pos, quad, new THREE.Vector3());
    pivotRef.current.position.copy(pos); pivotRef.current.quaternion.copy(quad);

  }, [progress, def]);

  const localMeshPos: [number, number, number] = [
    def.initialPos[0] - def.pivotPos[0],
    def.initialPos[1] - def.pivotPos[1],
    def.initialPos[2] - def.pivotPos[2]
  ];

  return (
    <group ref={pivotRef}>
      <mesh position={localMeshPos}>
        <planeGeometry args={[1, 1]} />
        <PrintedTextMaterial text={faceConfig.text} rotate={faceConfig.rotate} color={def.color} />
        
        {isSelected && (
          <Line
            points={[[-0.5, -0.5, 0.01], [0.5, -0.5, 0.01], [0.5, 0.5, 0.01], [-0.5, 0.5, 0.01], [-0.5, -0.5, 0.01]]}
            color="#22d3ee"
            lineWidth={4}
          />
        )}
      </mesh>
    </group>
  );
}

export default function CubeQuestPage() {
  const [currentPatternKey, setCurrentPatternKey] = useState<string>("p01");
  const [progress, setProgress] = useState<number>(0);
  const [selectedFaceId, setSelectedFaceId] = useState<string>("bottom");

  const createBlankFaces = () => {
    return { bottom: { text: "", rotate: 0 }, front: { text: "", rotate: 0 }, back: { text: "", rotate: 0 }, left: { text: "", rotate: 0 }, right: { text: "", rotate: 0 }, top: { text: "", rotate: 0 } };
  };

  const [faces, setFaces] = useState<Record<string, FaceConfig>>(createBlankFaces);

  const handlePatternChange = (key: string) => {
    setCurrentPatternKey(key);
    setProgress(0);
    setSelectedFaceId("bottom");
    setFaces(createBlankFaces());
  };

  const currentPattern = PATTERNS[currentPatternKey];
  const currentFaceConfig = faces[selectedFaceId] || { text: "", rotate: 0 };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col md:flex-row text-white overflow-hidden font-sans">
      
      {/* コントロールパネル */}
      <div className="w-full md:w-[400px] bg-slate-900/80 backdrop-blur-xl p-6 flex flex-col border-r border-slate-800/60 z-10 shadow-2xl overflow-y-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧪</span>
            <h1 className="text-lg font-black bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">立体パタパタ実験室</h1>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">全11種類の展開図マスターエディション</p>
        </div>

        {/* パターン選択（グリッドでコンパクトに全11種類を並べる） */}
        <div className="mb-6 space-y-1.5">
          <label className="text-[10px] text-cyan-500/80 uppercase tracking-widest font-black block">1. 展開図パターン（全11種）</label>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 border border-slate-800/60 p-2 rounded-xl bg-slate-950/20">
            {Object.entries(PATTERNS).map(([k, p]) => (
              <button key={k} onClick={() => handlePatternChange(k)}
                className={`py-2 px-2.5 text-left text-[11px] font-bold rounded-lg border transition-all duration-150 truncate ${currentPatternKey === k ? "bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-slate-950 font-black shadow-md shadow-cyan-500/10" : "bg-slate-800/30 border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* スライダー */}
        <div className="bg-slate-950/40 border border-slate-800/80 p-4 rounded-2xl mb-6 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] text-indigo-400 uppercase tracking-widest font-black">2. くみたてスライダー</label>
            <span className="text-xs font-black font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">{progress}%</span>
          </div>
          <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
        </div>

        {/* 面の選択 */}
        <div className="mb-6 space-y-2">
          <label className="text-[10px] text-emerald-400 uppercase tracking-widest font-black block">3. カスタムする面をえらぶ</label>
          <div className="grid grid-cols-2 gap-2">
            {currentPattern.faces.map(f => {
              const isSelected = selectedFaceId === f.id;
              return (
                <button key={f.id} onClick={() => setSelectedFaceId(f.id)} 
                  className={`relative p-2.5 text-left rounded-xl border transition-all duration-150 flex items-center gap-2 ${isSelected ? "bg-slate-800 border-cyan-400 shadow-sm" : "bg-slate-800/20 border-slate-800/60 hover:border-slate-700"}`}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: f.color }} />
                  <span className={`text-[11px] font-bold ${isSelected ? "text-cyan-400" : "text-slate-400"}`}>{f.name.split("（")[0]}</span>
                  {isSelected && <span className="absolute right-2 w-1 h-1 rounded-full bg-cyan-400 animate-ping" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* エディタパネル */}
        <div className="bg-gradient-to-b from-slate-950/60 to-slate-900/60 border border-slate-800/60 p-4 rounded-2xl space-y-3 mt-auto">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentPattern.faces.find(f => f.id === selectedFaceId)?.color }} />
            <h2 className="text-xs font-black text-slate-200">文字のデザインをきめる</h2>
          </div>

          <div className="space-y-1">
            <input 
              type="text" 
              maxLength={2}
              value={currentFaceConfig.text}
              onChange={(e) => setFaces({ ...faces, [selectedFaceId]: { ...currentFaceConfig, text: e.target.value } })}
              placeholder="文字なし"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-bold placeholder-slate-600 transition-colors"
            />
          </div>

          <button 
            onClick={() => setFaces({ ...faces, [selectedFaceId]: { ...currentFaceConfig, rotate: (currentFaceConfig.rotate + 90) % 360 } })} 
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            🔄 むきを90度まわす ({currentFaceConfig.rotate}°)
          </button>
        </div>
      </div>

      {/* 🔮 3D キャンバス領域 */}
      <div className="flex-1 relative bg-slate-950">
        <Canvas camera={{ position: [0, 4.0, 5.0], fov: 45 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 10, 5]} intensity={0.4} />
          
          <group position={[0, -0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {currentPattern.faces.map(face => (
              <SmartFoldableFace 
                key={face.id} 
                def={face} 
                progress={progress} 
                faceConfig={faces[face.id] || { text: "", rotate: 0 }} 
                isSelected={selectedFaceId === face.id}
              />
            ))}
          </group>
          <OrbitControls enableDamping minDistance={2} maxDistance={8} />
        </Canvas>
      </div>
    </div>
  );
}
