"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

// 面ごとの個別設定状態の型定義
type FaceConfig = { 
  text: string; 
  rotate: number;
  color: string; // 各面の色も個別にカスタマイズ可能に拡張
};

type FaceDefinition = {
  id: string;
  name: string;
  defaultColor: string;
  initialPos: [number, number, number];
  pivotPos: [number, number, number];
  axis: "X" | "Y";
  sign: number;
  isTopDependency?: boolean;
};

const PATTERNS: Record<string, { label: string; faces: FaceDefinition[] }> = {
  cross: {
    label: "① 十字型（基本）",
    faces: [
      { id: "bottom", name: "底面", defaultColor: "#38bdf8", initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  name: "手前", defaultColor: "#f43f5e", initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   name: "奥面", defaultColor: "#10b981", initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "left",   name: "左面", defaultColor: "#eab308", initialPos: [-1, 0, 0],  pivotPos: [-0.5, 0, 0], axis: "Y", sign: -1 },
      { id: "right",  name: "右面", defaultColor: "#a855f7", initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "top",    name: "天井", defaultColor: "#ffffff", initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1 }
    ]
  },
  zShape: {
    label: "② Z型（いなずま型）",
    faces: [
      { id: "bottom", name: "底面", defaultColor: "#38bdf8", initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  name: "手前", defaultColor: "#f43f5e", initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   name: "奥面", defaultColor: "#10b981", initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "right",  name: "右面", defaultColor: "#a855f7", initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "top",    name: "天井", defaultColor: "#ffffff", initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1 },
      { id: "left",   name: "左面", defaultColor: "#eab308", initialPos: [-1, 2, 0],  pivotPos: [-0.5, 2.0, 0], axis: "Y", sign: -1, isTopDependency: true }
    ]
  }
};

// プリセットのカラーパレット
const COLOR_PALETTE = [
  { name: "空色", code: "#38bdf8" },
  { name: "桃色", code: "#f43f5e" },
  { name: "若草", code: "#10b981" },
  { name: "山吹", code: "#eab308" },
  { name: "紫色", code: "#a855f7" },
  { name: "白色", code: "#ffffff" },
  { name: "炭色", code: "#475569" },
];

function PrintedTextMaterial({ text, rotate, color }: { text: string; rotate: number; color: string }) {
  const textureRef = useRef<THREE.CanvasTexture>(null);
  
  useEffect(() => { 
    if (textureRef.current) textureRef.current.needsUpdate = true; 
  }, [text, rotate, color]);

  return (
    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.4}>
      <canvasTexture ref={textureRef} attach="map" image={(() => {
        const canvas = document.createElement("canvas");
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 256, 256);
          ctx.fillStyle = "#0f172a"; 
          
          // 絵文字や長い文字に対応するためフォントサイズをやや調整
          ctx.font = "bold 110px sans-serif";
          ctx.textAlign = "center"; 
          ctx.textBaseline = "middle";
          ctx.save(); 
          ctx.translate(128, 128); 
          ctx.rotate(toRadian(rotate)); 
          
          // 空白文字（スペースのみなど）でも安全に描画
          ctx.fillText(text, 0, 0); 
          ctx.restore();
        }
        return canvas;
      })()} />
    </meshStandardMaterial>
  );
}

function SmartFoldableFace({ def, progress, faceConfig }: { def: FaceDefinition; progress: number; faceConfig: FaceConfig }) {
  const pivotRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!pivotRef.current) return;

    const angle = (progress / 100) * (Math.PI / 2);
    pivotRef.current.rotation.set(0, 0, 0);
    pivotRef.current.position.set(0, 0, 0);

    if (def.id !== "bottom") {
      if (def.id === "top") {
        const m1 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle);
        m1.setPosition(new THREE.Vector3(0, 0.5, 0));
        const m2 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle);
        m2.setPosition(new THREE.Vector3(0, 1.0, 0));
        const finalMatrix = new THREE.Matrix4().multiplyMatrices(m1, m2);
        
        const pos = new THREE.Vector3();
        const quad = new THREE.Quaternion();
        finalMatrix.decompose(pos, quad, new THREE.Vector3());
        
        pivotRef.current.position.copy(pos);
        pivotRef.current.quaternion.copy(quad);
        return;
      } 
      
      if (def.isTopDependency) {
        const mTop1 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle);
        mTop1.setPosition(new THREE.Vector3(0, 0.5, 0));
        const mTop2 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle);
        mTop2.setPosition(new THREE.Vector3(0, 1.0, 0));
        const mTopFinal = new THREE.Matrix4().multiplyMatrices(mTop1, mTop2);

        const mSelf = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), -angle);
        mSelf.setPosition(new THREE.Vector3(-0.5, 0.5, 0));

        const finalMatrix = new THREE.Matrix4().multiplyMatrices(mTopFinal, mSelf);
        
        const pos = new THREE.Vector3();
        const quad = new THREE.Quaternion();
        finalMatrix.decompose(pos, quad, new THREE.Vector3());
        
        pivotRef.current.position.copy(pos);
        pivotRef.current.quaternion.copy(quad);
        return;
      }

      pivotRef.current.position.set(...def.pivotPos);
      if (def.axis === "X") {
        pivotRef.current.rotation.x = angle * def.sign;
      } else {
        pivotRef.current.rotation.y = angle * def.sign;
      }
    }
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
        <PrintedTextMaterial text={faceConfig.text} rotate={faceConfig.rotate} color={faceConfig.color} />
      </mesh>
    </group>
  );
}

export default function CubeQuestPage() {
  const [currentPatternKey, setCurrentPatternKey] = useState<string>("cross");
  const [progress, setProgress] = useState<number>(0);
  const [selectedFaceId, setSelectedFaceId] = useState<string>("bottom");

  // 初期ステートの生成関数（各パターンのデフォルトカラーを反映）
  const createInitialFaces = (patternKey: string) => {
    const defs = PATTERNS[patternKey].faces;
    const initialTexts: Record<string, string> = {
      bottom: "A", front: "B", back: "C", left: "D", right: "E", top: "F"
    };
    const config: Record<string, FaceConfig> = {};
    defs.forEach(f => {
      config[f.id] = {
        text: initialTexts[f.id] || "",
        rotate: 0,
        color: f.defaultColor
      };
    });
    return config;
  };

  const [faces, setFaces] = useState<Record<string, FaceConfig>>(() => createInitialFaces("cross"));

  // パターン切り替え時に面の状態をリセット
  const handlePatternChange = (key: string) => {
    setCurrentPatternKey(key);
    setProgress(0);
    setSelectedFaceId("bottom");
    setFaces(createInitialFaces(key));
  };

  const currentPattern = PATTERNS[currentPatternKey];
  const currentFaceConfig = faces[selectedFaceId] || { text: "", rotate: 0, color: "#ffffff" };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row text-white overflow-hidden">
      <div className="w-full md:w-96 bg-slate-800 p-6 flex flex-col border-r border-slate-700 z-10 shadow-2xl overflow-y-auto">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">📦 立体パタパタ実験室</h1>
        <p className="text-xs text-slate-400 mb-6 font-medium">文字自由入力・カラーカスタム版</p>

        {/* パターン選択 */}
        <div className="mb-6 space-y-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">パターン選択</label>
          {Object.entries(PATTERNS).map(([k, p]) => (
            <button key={k} onClick={() => handlePatternChange(k)}
              className={`w-full py-2 px-3 text-left text-xs font-bold rounded-lg border transition-all ${currentPatternKey === k ? "bg-cyan-500 border-cyan-400 text-slate-900" : "bg-slate-700 border-slate-600 hover:bg-slate-600"}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* 組み立てスライダー */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
          <div className="flex justify-between mb-2"><span className="text-xs text-slate-400">組み立て進捗</span><span className="text-sm font-bold text-cyan-400">{progress}%</span></div>
          <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
        </div>

        {/* 面の選択グリッド */}
        <div className="mb-6">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">面を選択</label>
          <div className="grid grid-cols-3 gap-2">
            {currentPattern.faces.map(f => (
              <button key={f.id} onClick={() => setSelectedFaceId(f.id)} 
                className={`py-2 text-[10px] font-bold rounded border transition-all ${selectedFaceId === f.id ? "bg-cyan-500 border-cyan-400 text-slate-900" : "bg-slate-700 border-slate-600"}`}>
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* ✍️ 面のカスタマイズパネル */}
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4">
          <h2 className="text-xs font-bold text-slate-300">💡 選択中の面をカスタム</h2>

          {/* 文字入力（空白許容） */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 block">表示する文字（空白もOK）</label>
            <input 
              type="text" 
              maxLength={2} // 1〜2文字がきれいに収まります
              value={currentFaceConfig.text}
              onChange={(e) => setFaces({
                ...faces,
                [selectedFaceId]: { ...currentFaceConfig, text: e.target.value }
              })}
              placeholder="空っぽ"
              className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-bold"
            />
          </div>

          {/* カラーパレット */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400 block">面の背景色</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c.code}
                  title={c.name}
                  onClick={() => setFaces({
                    ...faces,
                    [selectedFaceId]: { ...currentFaceConfig, color: c.code }
                  })}
                  style={{ backgroundColor: c.code }}
                  className={`w-6 h-6 rounded-full border transition-transform ${currentFaceConfig.color === c.code ? "ring-2 ring-cyan-400 scale-110 border-transparent" : "border-slate-600 hover:scale-105"}`}
                />
              ))}
            </div>
          </div>

          {/* 回転ボタン */}
          <div className="pt-2">
            <button 
              onClick={() => setFaces({
                ...faces,
                [selectedFaceId]: { ...currentFaceConfig, rotate: (currentFaceConfig.rotate + 90) % 360 }
              })} 
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1"
            >
              🔄 文字を90度回転 ({currentFaceConfig.rotate}°)
            </button>
          </div>
        </div>
      </div>

      {/* 3D キャンバス領域 */}
      <div className="flex-1 relative bg-slate-950">
        <Canvas camera={{ position: [0, 3, 5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.6} />
          
          <group position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {currentPattern.faces.map(face => (
              <SmartFoldableFace 
                key={face.id} 
                def={face} 
                progress={progress} 
                faceConfig={faces[face.id] || { text: "", rotate: 0, color: face.defaultColor }} 
              />
            ))}
          </group>
          <OrbitControls enableDamping minDistance={2} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  );
}
