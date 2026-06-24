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

type NetNode = {
  id: string;
  name: string;
  color: string;
  direction?: "up" | "down" | "left" | "right";
  children?: NetNode[];
};

const PATTERNS: Record<string, { label: string; root: NetNode }> = {
  cross: {
    label: "① 十字型（基本）",
    root: {
      id: "bottom", name: "底面", color: "#38bdf8",
      children: [
        { id: "front", name: "手前", direction: "down", color: "#f43f5e" },
        { 
          id: "back", name: "奥", direction: "up", color: "#10b981",
          children: [
            { id: "top", name: "天井", direction: "up", color: "#ffffff" }
          ]
        },
        { id: "left", name: "左面", direction: "left", color: "#eab308" },
        { id: "right", name: "right", direction: "right", color: "#a855f7" }
      ]
    }
  },
  zShape: {
    label: "② Z型（いなずま型・やや難）",
    root: {
      id: "bottom", name: "底面", color: "#38bdf8",
      children: [
        { id: "front", name: "手前", direction: "down", color: "#f43f5e" },
        { 
          id: "back", name: "奥", direction: "up", color: "#10b981",
          children: [
            { 
              id: "top", name: "天井", direction: "up", color: "#ffffff",
              children: [
                { id: "left", name: "左面", direction: "left", color: "#eab308" }
              ]
            }
          ]
        },
        { id: "right", name: "右面", direction: "right", color: "#a855f7" }
      ]
    }
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

// 🌟 符号の正負を完全に修正した再帰コンポーネント
function FoldableNode({ node, rad, faces }: { node: NetNode; rad: number; faces: Record<string, FaceConfig> }) {
  const faceConfig = faces[node.id] || { text: "?", rotate: 0 };

  let pivotPosition: [number, number, number] = [0, 0, 0];
  let pivotRotation: [number, number, number] = [0, 0, 0];
  let meshPosition: [number, number, number] = [0, 0, 0];

  // 📐 3D空間の回転方向（すべて「下向き＝谷折り」に綺麗に閉じるための絶対解）
  switch (node.direction) {
    case "up":
      pivotPosition = [0, 0.5, 0];
      pivotRotation = [rad, 0, 0];     // ★上向きに折れていたのを下向きに修正！
      meshPosition = [0, 0.5, 0];
      break;
    case "down":
      pivotPosition = [0, -0.5, 0];
      pivotRotation = [-rad, 0, 0];    // ★上向きに折れていたのを下向きに修正！
      meshPosition = [0, -0.5, 0];
      break;
    case "left":
      pivotPosition = [-0.5, 0, 0];
      pivotRotation = [0, -rad, 0];    // 元々下向きで合っていたのでキープ
      meshPosition = [-0.5, 0, 0];
      break;
    case "right":
      pivotPosition = [0.5, 0, 0];
      pivotRotation = [0, rad, 0];     // 元々下向きで合っていたのでキープ
      meshPosition = [0.5, 0, 0];
      break;
  }

  return (
    <group position={pivotPosition} rotation={pivotRotation}>
      <mesh position={meshPosition}>
        <planeGeometry args={[1, 1]} />
        <PrintedTextMaterial text={faceConfig.text} rotate={faceConfig.rotate} color={node.color} />
      </mesh>
      {node.children?.map((child) => (
        <group key={child.id} position={meshPosition}>
          <FoldableNode node={child} rad={rad} faces={faces} />
        </group>
      ))}
    </group>
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

  const angle = (progress / 100) * 90;
  const rad = toRadian(angle);
  const currentPattern = PATTERNS[currentPatternKey];

  const getFaceList = (node: NetNode): { id: string; name: string }[] => {
    let list = [{ id: node.id, name: node.name }];
    if (node.children) {
      node.children.forEach(child => { list = list.concat(getFaceList(child)); });
    }
    return list;
  };
  const activeFaces = getFaceList(currentPattern.root);

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
          <p className="text-xs text-slate-400 mb-6">全自動マッピング＆谷折り完全対応版</p>

          {/* 展開図の切り替え */}
          <div className="mb-6 bg-slate-900/40 p-3 rounded-xl border border-slate-700/60">
            <label className="text-xs text-slate-400 block mb-2 font-medium">🔷 展開図の形を切り替える</label>
            <div className="flex flex-col gap-2">
              {Object.entries(PATTERNS).map(([key, pat]) => (
                <button
                  key={key} onClick={() => { setCurrentPatternKey(key); setProgress(0); setSelectedFaceId(pat.root.id); }}
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
              {activeFaces.map((f) => (
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

          <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <PrintedTextMaterial text={faces[currentPattern.root.id]?.text || "A"} rotate={faces[currentPattern.root.id]?.rotate || 0} color={currentPattern.root.color} />
            </mesh>

            {currentPattern.root.children?.map((child) => (
              <FoldableNode key={child.id} node={child} rad={rad} faces={faces} />
            ))}
          </group>

          <OrbitControls enableDamping minDistance={2} maxDistance={10} />
        </Canvas>
      </div>

    </div>
  );
}
