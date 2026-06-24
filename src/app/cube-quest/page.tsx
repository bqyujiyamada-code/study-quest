"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

type FaceConfig = {
  text: string;
  rotate: number;
};

// 各面の配置・回転の定義データ
type FacePositionData = {
  id: string;
  name: string;
  color: string;
  // 展開図（0%）のときの位置
  flatPos: [number, number, number];
  // 組み立て軸（ヒンジ）の位置
  pivot: [number, number, number];
  // 回転させる軸（X軸=1,0,0 / Y軸=0,1,0）
  axis: "X" | "Y";
  // 回転の方向（1 または -1）
  dir: number;
};

// 🗺️ 展開図パターン（完全に絶対座標で計算してズレをなくす）
const PATTERNS: Record<string, { label: string; faces: FacePositionData[] }> = {
  cross: {
    label: "① 十字型（基本）",
    faces: [
      { id: "bottom", name: "底面", color: "#38bdf8", flatPos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", dir: 0 },
      { id: "front",  name: "手前", color: "#f43f5e", flatPos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", dir: -1 },
      { id: "back",   name: "奥",   color: "#10b981", flatPos: [0, 1, 0],  pivot: [0, 0.5, 0],  axis: "X", dir: 1 },
      { id: "top",    name: "天井", color: "#ffffff", flatPos: [0, 2, 0],  pivot: [0, 1.5, 0],  axis: "X", dir: 2 }, // 奥と一緒に連動
      { id: "left",   name: "左面", color: "#eab308", flatPos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", dir: -1 },
      { id: "right",  name: "右面", color: "#a855f7", flatPos: [1, 0, 0],  pivot: [0.5, 0, 0],  axis: "Y", dir: 1 },
    ]
  },
  zShape: {
    label: "② Z型（いなずま型）",
    faces: [
      { id: "bottom", name: "底面", color: "#38bdf8", flatPos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", dir: 0 },
      { id: "front",  name: "手前", color: "#f43f5e", flatPos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", dir: -1 },
      { id: "back",   name: "奥",   color: "#10b981", flatPos: [0, 1, 0],  pivot: [0, 0.5, 0],  axis: "X", dir: 1 },
      { id: "top",    name: "天井", color: "#ffffff", flatPos: [0, 2, 0],  pivot: [0, 1.5, 0],  axis: "X", dir: 2 },
      { id: "left",   name: "左面", color: "#eab308", flatPos: [-1, 2, 0], pivot: [-0.5, 2, 0], axis: "Y", dir: -1 }, // 天井から左に折れる
      { id: "right",  name: "右面", color: "#a855f7", flatPos: [1, 0, 0],  pivot: [0.5, 0, 0],  axis: "Y", dir: 1 },
    ]
  }
};

function PrintedTextMaterial({ text, rotate, color }: { text: string; rotate: number; color: string }) {
  const textureRef = useRef<THREE.CanvasTexture>(null);
  useEffect(() => { if (textureRef.current) textureRef.current.needsUpdate = true; }, [text, rotate]);

  return (
    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.4}>
      <canvasTexture
        ref={textureRef} attach="map"
        image={(() => {
          const canvas = document.createElement("canvas");
          canvas.width = 256; canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = "#0f172a"; ctx.font = "bold 120px sans-serif";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.save(); ctx.translate(128, 128); ctx.rotate(toRadian(rotate)); ctx.fillText(text, 0, 0); ctx.restore();
          }
          return canvas;
        })()}
      />
    </meshStandardMaterial>
  );
}

// 🌟 各面を独立したヒンジで確実に折るコンポーネント
function IndependentFace({ data, progress, faceConfig }: { data: FacePositionData; progress: number; faceConfig: FaceConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 面のIDごとに、進捗（0〜100%）に応じた正確な谷折り角度を直接適用する
  useEffect(() => {
    if (!meshRef.current) return;

    // 一旦位置と回転を初期化（展開図の状態）
    meshRef.current.position.set(data.flatPos[0], data.flatPos[1], data.flatPos[2]);
    meshRef.current.rotation.set(0, 0, 0);

    const maxRad = Math.PI / 2; // 90度
    const currentRad = (progress / 100) * maxRad;

    // 各面の「組み立て時の回転アニメーション」を完全に数式で制御
    if (data.id === "bottom") {
      // 底面は動かない
    } else if (data.id === "front") {
      // 手前：下の辺を軸に下へ（-X方向に回転）
      meshRef.current.position.set(0, -0.5 - 0.5 * Math.cos(currentRad), -0.5 * Math.sin(currentRad));
      meshRef.current.rotation.x = -currentRad;
    } else if (data.id === "back") {
      // 奥：上の辺を軸に下へ（+X方向に回転）
      meshRef.current.position.set(0, 0.5 + 0.5 * Math.cos(currentRad), -0.5 * Math.sin(currentRad));
      meshRef.current.rotation.x = currentRad;
    } else if (data.id === "top") {
      // 天井：奥の面に連動してさらにL字に折れる
      const angleBack = currentRad;
      const angleTop = currentRad * 2;
      meshRef.current.position.set(
        0,
        0.5 + Math.cos(angleBack) + 0.5 * Math.cos(angleTop),
        -Math.sin(angleBack) - 0.5 * Math.sin(angleTop)
      );
      meshRef.current.rotation.x = angleTop;
    } else if (data.id === "left") {
      if (data.flatPos[1] === 2) {
        // Z型の左面（天井にくっついている複雑な連動）
        const angleBack = currentRad;
        const angleTop = currentRad * 2;
        // 天井の位置を基準に、さらにY軸で直角に折れ曲がるマトリクスを簡易シミュレート
        meshRef.current.position.set(
          -0.5 - 0.5 * Math.cos(currentRad),
          0.5 + Math.cos(angleBack) + 0.5 * Math.cos(angleTop),
          -Math.sin(angleBack) - 0.5 * Math.sin(angleTop) - 0.5 * Math.sin(currentRad)
        );
        meshRef.current.rotation.set(angleTop, -currentRad, 0);
      } else {
        // 通常の左面：左の辺を軸に下へ（-Y方向に回転）
        meshRef.current.position.set(-0.5 - 0.5 * Math.cos(currentRad), 0, -0.5 * Math.sin(currentRad));
        meshRef.current.rotation.y = -currentRad;
      }
    } else if (data.id === "right") {
      // 右面：右の辺を軸に下へ（+Y方向に回転）
      meshRef.current.position.set(0.5 + 0.5 * Math.cos(currentRad), 0, -0.5 * Math.sin(currentRad));
      meshRef.current.rotation.y = currentRad;
    }
  }, [progress, data]);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <PrintedTextMaterial text={faceConfig?.text || "❓"} rotate={faceConfig?.rotate || 0} color={data.color} />
    </mesh>
  );
}

export default function CubeQuestPage() {
  const [currentPatternKey, setCurrentPatternKey] = useState<string>("cross");
  const [progress, setProgress] = useState<number>(0);
  const [selectedFaceId, setSelectedFaceId] = useState<string>("bottom");

  const [faces, setFaces] = useState<Record<string, FaceConfig>>({
    bottom: { text: "A", rotate: 0 },
    front: { text: "B", rotate: 0 },
    back: { text: "C", rotate: 0 },
    left: { text: "D", rotate: 0 },
    right: { text: "E", rotate: 0 },
    top: { text: "F", rotate: 0 },
  });

  const currentPattern = PATTERNS[currentPatternKey];

  const handleTextChange = (text: string) => {
    setFaces({ ...faces, [selectedFaceId]: { ...faces[selectedFaceId], text } });
  };

  const handleRotate = () => {
    if (!faces[selectedFaceId]) return;
    setFaces({ 
      ...faces, 
      [selectedFaceId]: { ...faces[selectedFaceId], rotate: (faces[selectedFaceId].rotate + 90) % 360 } 
    });
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row text-white select-none overflow-hidden">
      
      {/* 左側：操作エリア */}
      <div className="w-full md:w-96 bg-slate-800 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 z-10 shadow-2xl overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-cyan-400 mb-1">📦 立体パタパタ実験室</h1>
          <p className="text-xs text-slate-400 mb-6">絶対座標制御・谷折り完全固定版</p>

          {/* 展開図の切り替え */}
          <div className="mb-6 bg-slate-900/40 p-3 rounded-xl border border-slate-700/60">
            <label className="text-xs text-slate-400 block mb-2 font-medium">🔷 展開図の形を切り替える</label>
            <div className="flex flex-col gap-2">
              {Object.entries(PATTERNS).map(([key, pat]) => (
                <button
                  key={key} onClick={() => { setCurrentPatternKey(key); setProgress(0); setSelectedFaceId("bottom"); }}
                  className={`w-full py-2 px-3 text-left text-xs font-bold rounded-lg border transition-all ${
                    currentPatternKey === key ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-md" : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {pat.label}
                </button>
              ))}
            </div>
          </div>

          {/* スライダー */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-400">組み立て進捗</span>
              <span className="text-sm font-bold text-cyan-400">{progress}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* 面の選択 */}
          <div className="mb-6">
            <label className="text-xs text-slate-400 block mb-2 font-medium">① 設定する面を選ぶ</label>
            <div className="grid grid-cols-3 gap-2">
              {currentPattern.faces.map((f) => (
                <button
                  key={f.id} onClick={() => setSelectedFaceId(f.id)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                    selectedFaceId === f.id ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg" : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* 文字と向きのエディタ */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <label className="text-xs text-slate-400 block mb-3 font-medium">② 文字と向きを変える</label>
            <div className="flex gap-2 mb-4">
              {["A", "B", "C", "❓", "➔", "⬆️"].map((txt) => (
                <button
                  key={txt} onClick={() => handleTextChange(txt)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm bg-slate-700 border border-slate-600 hover:bg-slate-600 flex items-center justify-center ${
                    faces[selectedFaceId]?.text === txt ? "ring-2 ring-cyan-400 bg-slate-600" : ""
                  }`}
                >
                  {txt}
                </button>
              ))}
            </div>

            <button
              onClick={handleRotate}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              🔄 文字を90度回転する ({faces[selectedFaceId]?.rotate || 0}° )
            </button>
          </div>
        </div>
      </div>

      {/* 右側：3D表示エリア */}
      <div className="flex-1 w-full h-full relative bg-slate-950">
        <Canvas camera={{ position: [0, 4, 5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.6} />

          {/* ベースの床面 */}
          <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {currentPattern.faces.map((faceData) => (
              <IndependentFace
                key={faceData.id}
                data={faceData}
                progress={progress}
                faceConfig={faces[faceData.id]}
              />
            ))}
          </group>

          <OrbitControls enableDamping minDistance={2} maxDistance={10} />
        </Canvas>
      </div>

    </div>
  );
}
