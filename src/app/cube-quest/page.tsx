"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

type FaceConfig = { text: string; rotate: number; };

type AbsoluteFaceData = {
  id: string;
  name: string;
  color: string;
};

const PATTERNS: Record<string, { label: string; faces: AbsoluteFaceData[] }> = {
  cross: {
    label: "① 十字型（基本）",
    faces: [
      { id: "bottom", name: "底面", color: "#38bdf8" },
      { id: "front",  name: "手前", color: "#f43f5e" },
      { id: "back",   name: "奥面", color: "#10b981" },
      { id: "top",    name: "天井", color: "#ffffff" },
      { id: "left",   name: "左面", color: "#eab308" },
      { id: "right",  name: "右面", color: "#a855f7" }
    ]
  },
  zShape: {
    label: "② Z型（いなずま型）",
    faces: [
      { id: "bottom", name: "底面", color: "#38bdf8" },
      { id: "front",  name: "手前", color: "#f43f5e" },
      { id: "back",   name: "奥面", color: "#10b981" },
      { id: "top",    name: "天井", color: "#ffffff" },
      { id: "left",   name: "左面", color: "#eab308" },
      { id: "right",  name: "右面", color: "#a855f7" }
    ]
  }
};

function PrintedTextMaterial({ text, rotate, color }: { text: string; rotate: number; color: string }) {
  const textureRef = useRef<THREE.CanvasTexture>(null);
  useEffect(() => { if (textureRef.current) textureRef.current.needsUpdate = true; }, [text, rotate]);
  return (
    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.4}>
      <canvasTexture ref={textureRef} attach="map" image={(() => {
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
      })()} />
    </meshStandardMaterial>
  );
}

// 🌟 三角関数で「谷折り」の物理的な位置と回転を完全に固定計算するコンポーネント
function AbsoluteFace({ id, pattern, progress, faceConfig, color }: { id: string; pattern: string; progress: number; faceConfig: FaceConfig; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;

    const rad = (progress / 100) * (Math.PI / 2); // 0度 〜 90度

    // デフォルト（底面）
    let pos: [number, number, number] = [0, 0, 0];
    let rot: [number, number, number] = [0, 0, 0];

    if (pattern === "cross") {
      // 🔷 十字型の完璧な数学的軌道（すべて下向き・谷折り）
      switch (id) {
        case "bottom":
          pos = [0, 0, 0]; rot = [0, 0, 0];
          break;
        case "front": // 下に90度折れる（手前のフチ [0, -0.5, 0] が軸）
          pos = [0, -0.5 - 0.5 * Math.cos(rad), -0.5 * Math.sin(rad)];
          rot = [-rad, 0, 0];
          break;
        case "back": // 下に90度折れる（奥のフチ [0, 0.5, 0] が軸）
          pos = [0, 0.5 + 0.5 * Math.cos(rad), -0.5 * Math.sin(rad)];
          rot = [rad, 0, 0];
          break;
        case "top": // 奥面に連動し、さらに直角に折れる
          pos = [
            0,
            0.5 + Math.cos(rad) - 0.5 * Math.sin(rad),
            -Math.sin(rad) - 0.5 * Math.cos(rad)
          ];
          rot = [rad * 2, 0, 0];
          break;
        case "left": // 左に90度折れる（左のフチ [-0.5, 0, 0] が軸）
          pos = [-0.5 - 0.5 * Math.cos(rad), 0, -0.5 * Math.sin(rad)];
          rot = [0, -rad, 0];
          break;
        case "right": // 右に90度折れる（右のフチ [0.5, 0, 0] が軸）
          pos = [0.5 + 0.5 * Math.cos(rad), 0, -0.5 * Math.sin(rad)];
          rot = [0, rad, 0];
          break;
      }
    } else {
      // ⚡ Z型（いなずま型）の完璧な数学的軌道
      switch (id) {
        case "bottom":
          pos = [0, 0, 0]; rot = [0, 0, 0];
          break;
        case "front":
          pos = [0, -0.5 - 0.5 * Math.cos(rad), -0.5 * Math.sin(rad)];
          rot = [-rad, 0, 0];
          break;
        case "back":
          pos = [0, 0.5 + 0.5 * Math.cos(rad), -0.5 * Math.sin(rad)];
          rot = [rad, 0, 0];
          break;
        case "top": // 奥面の先に連動
          pos = [
            0,
            0.5 + Math.cos(rad) - 0.5 * Math.sin(rad),
            -Math.sin(rad) - 0.5 * Math.cos(rad)
          ];
          rot = [rad * 2, 0, 0];
          break;
        case "left": // 🔴 Z型では「天井の左側」に密着して連動する！
          // 天井の左端のフチ座標をベースに、さらにY軸（ローカル）で直角に折る
          pos = [
            -0.5 * Math.cos(rad),
            0.5 + Math.cos(rad) - 0.5 * Math.sin(rad),
            -Math.sin(rad) - 0.5 * Math.cos(rad) - 0.5 * Math.sin(rad)
          ];
          // 奥への回転(rad*2)に、左への折れ曲がり(-rad)を3D合成
          const euler = new THREE.Euler(rad * 2, -rad, 0, "YXZ");
          meshRef.current.position.set(...pos);
          meshRef.current.rotation.copy(euler);
          return; // 独自の回転を適用するためここで抜ける
        case "right":
          pos = [0.5 + 0.5 * Math.cos(rad), 0, -0.5 * Math.sin(rad)];
          rot = [0, rad, 0];
          break;
      }
    }

    meshRef.current.position.set(...pos);
    meshRef.current.rotation.set(...rot);
  }, [progress, id, pattern]);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <PrintedTextMaterial text={faceConfig?.text || "❓"} rotate={faceConfig?.rotate || 0} color={color} />
    </mesh>
  );
}

export default function CubeQuestPage() {
  const [currentPatternKey, setCurrentPatternKey] = useState<string>("cross");
  const [progress, setProgress] = useState<number>(0);
  const [selectedFaceId, setSelectedFaceId] = useState<string>("bottom");
  const [faces, setFaces] = useState<Record<string, FaceConfig>>({
    bottom: { text: "A", rotate: 0 }, front: { text: "B", rotate: 0 },
    back: { text: "C", rotate: 0 }, left: { text: "D", rotate: 0 },
    right: { text: "E", rotate: 0 }, top: { text: "F", rotate: 0 },
  });

  const currentPattern = PATTERNS[currentPatternKey];

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row text-white overflow-hidden">
      <div className="w-full md:w-96 bg-slate-800 p-6 flex flex-col border-r border-slate-700 z-10 shadow-2xl">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">📦 立体パタパタ実験室</h1>
        <p className="text-xs text-slate-400 mb-6 font-medium">完全数理制御・谷折り絶対解</p>

        <div className="mb-6 space-y-2">
          <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">パターン選択</label>
          {Object.entries(PATTERNS).map(([k, p]) => (
            <button key={k} onClick={() => { setCurrentPatternKey(k); setProgress(0); setSelectedFaceId("bottom"); }}
              className={`w-full py-2 px-3 text-left text-xs font-bold rounded-lg border transition-all ${currentPatternKey === k ? "bg-cyan-500 border-cyan-400 text-slate-900" : "bg-slate-700 border-slate-600 hover:bg-slate-600"}`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
          <div className="flex justify-between mb-2"><span className="text-xs text-slate-400">組み立て進捗</span><span className="text-sm font-bold text-cyan-400">{progress}%</span></div>
          <input type="range" min="0" max="100" value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-2">面を選択</label>
            <div className="grid grid-cols-3 gap-2">
              {currentPattern.faces.map(f => (
                <button key={f.id} onClick={() => setSelectedFaceId(f.id)} className={`py-2 text-[10px] font-bold rounded border transition-all ${selectedFaceId === f.id ? "bg-cyan-500 border-cyan-400 text-slate-900" : "bg-slate-700 border-slate-600"}`}>{f.name}</button>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <label className="text-xs text-slate-400 block mb-3 font-medium">② 文字と向きを変える</label>
            <div className="flex gap-2 mb-4">
              {["A", "B", "C", "❓", "➔", "⬆️"].map(txt => (
                <button key={txt} onClick={() => setFaces({...faces, [selectedFaceId]: {...faces[selectedFaceId], text: txt}})} className={`w-10 h-10 rounded bg-slate-700 border border-slate-600 font-bold ${faces[selectedFaceId]?.text === txt ? "ring-2 ring-cyan-400" : ""}`}>{txt}</button>
              ))}
            </div>
            <button onClick={() => setFaces({...faces, [selectedFaceId]: {...faces[selectedFaceId], rotate: (faces[selectedFaceId].rotate + 90) % 360}})} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-xs">🔄 文字を90度回転する ({faces[selectedFaceId]?.rotate || 0}°)</button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-950">
        <Canvas camera={{ position: [0, 4, 6], fov: 40 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.6} />
          
          {/* 3D空間の基準グループ (XY平面を床に倒す) */}
          <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {currentPattern.faces.map(face => (
              <AbsoluteFace 
                key={face.id} 
                id={face.id} 
                pattern={currentPatternKey} 
                progress={progress} 
                faceConfig={faces[face.id]} 
                color={face.color}
              />
            ))}
          </group>
          <OrbitControls enableDamping minDistance={3} maxDistance={12} />
        </Canvas>
      </div>
    </div>
  );
}
