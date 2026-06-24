"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

type FaceConfig = { text: string; rotate: number; };

type NetNode = {
  id: string;
  name: string;
  color: string;
  direction?: "up" | "down" | "left" | "right";
  children?: NetNode[];
};

// 🗺️ 正しい展開図ツリー（親のどの辺から次の面が生えるか）
const PATTERNS: Record<string, { label: string; root: NetNode }> = {
  cross: {
    label: "① 十字型（基本）",
    root: {
      id: "bottom", name: "底面", color: "#38bdf8",
      children: [
        { id: "front", name: "手前", direction: "down", color: "#f43f5e" },
        { 
          id: "back", name: "奥面", direction: "up", color: "#10b981",
          children: [
            { id: "top", name: "天井", direction: "up", color: "#ffffff" }
          ]
        },
        { id: "left", name: "左面", direction: "left", color: "#eab308" },
        { id: "right", name: "右面", direction: "right", color: "#a855f7" }
      ]
    }
  },
  zShape: {
    label: "② Z型（いなずま型）",
    root: {
      id: "bottom", name: "底面", color: "#38bdf8",
      children: [
        { id: "front", name: "手前", direction: "down", color: "#f43f5e" },
        { 
          id: "back", name: "奥面", direction: "up", color: "#10b981",
          children: [
            { 
              id: "top", name: "天井", direction: "up", color: "#ffffff",
              children: [
                { id: "left", name: "左面", direction: "left", color: "#eab308" } // 天井の左側に繋がる
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

// 🌟 展開図の時点で1ミリのズレもなく完璧に吸い付くヒンジコンポーネント
function FoldableNode({ node, rad, faces }: { node: NetNode; rad: number; faces: Record<string, FaceConfig> }) {
  const faceConfig = faces[node.id] || { text: "?", rotate: 0 };

  // 親の面（中心が原点）から見た、この面の「折り目（ヒンジ）」の位置
  let pivotPos: [number, number, number] = [0, 0, 0];
  // 谷折りの回転軸
  let pivotRot: [number, number, number] = [0, 0, 0];
  // 折り目（ヒンジ）から見た、この「面自体の中心」の位置（常に0.5ずれる）
  let meshPos: [number, number, number] = [0, 0, 0];
  // 次の子供のヒンジを、この面の「先端の辺」に配置するためのオフセット位置
  let nextChildPos: [number, number, number] = [0, 0, 0];

  switch (node.direction) {
    case "up":
      pivotPos = [0, 0.5, 0];      // 親の上の辺
      pivotRot = [rad, 0, 0];      // 奥へ90度折れる
      meshPos = [0, 0.5, 0];       // ヒンジからさらに上へ0.5ずらす
      nextChildPos = [0, 1.0, 0];  // この面のさらに上の辺（0.5 + 0.5）
      break;
    case "down":
      pivotPos = [0, -0.5, 0];     // 親の下の辺
      pivotRot = [-rad, 0, 0];     // 手前へ90度折れる
      meshPos = [0, -0.5, 0];      // ヒンジからさらに下へ0.5ずらす
      nextChildPos = [0, -1.0, 0]; // この面のさらに下の辺
      break;
    case "left":
      pivotPos = [-0.5, 0, 0];     // 親の左の辺
      pivotRot = [0, -rad, 0];     // 左へ90度折れる
      meshPos = [-0.5, 0, 0];      // ヒンジからさらに左へ0.5ずらす
      nextChildPos = [-1.0, 0, 0]; // この面のさらに左の辺
      break;
    case "right":
      pivotPos = [0.5, 0, 0];      // 親の右の辺
      pivotRot = [0, rad, 0];      // 右へ90度折れる
      meshPos = [0.5, 0, 0];       // ヒンジからさらに右へ0.5ずらす
      nextChildPos = [1.0, 0, 0];  // この面のさらに右の辺
      break;
  }

  return (
    // 💡 親の端（折り目）にこのグループを配置し、スライダーに応じて回転させる
    <group position={pivotPos} rotation={pivotRot}>
      
      {/* 自分の面 */}
      <mesh position={meshPos}>
        <planeGeometry args={[1, 1]} />
        <PrintedTextMaterial text={faceConfig.text} rotate={faceConfig.rotate} color={node.color} />
      </mesh>

      {/* 💡 子要素（次の面）のヒンジを、自分の面の「先端のフチ」に正確に連結する */}
      {node.children?.map((child) => (
        <group key={child.id} position={nextChildPos}>
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
    bottom: { text: "A", rotate: 0 }, front: { text: "B", rotate: 0 },
    back: { text: "C", rotate: 0 }, left: { text: "D", rotate: 0 },
    right: { text: "E", rotate: 0 }, top: { text: "F", rotate: 0 },
  });

  const rad = toRadian((progress / 100) * 90);
  const currentPattern = PATTERNS[currentPatternKey];

  const getFaceList = (node: NetNode): { id: string; name: string }[] => {
    let list = [{ id: node.id, name: node.name }];
    if (node.children) node.children.forEach(c => { list = list.concat(getFaceList(c)); });
    return list;
  };
  const activeFaces = getFaceList(currentPattern.root);

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row text-white overflow-hidden">
      <div className="w-full md:w-96 bg-slate-800 p-6 flex flex-col border-r border-slate-700 z-10 shadow-2xl">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">📦 立体パタパタ実験室</h1>
        <p className="text-xs text-slate-400 mb-6 font-medium">展開図完全密着・サイコロ完全版</p>

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
              {activeFaces.map(f => (
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
          
          {/* 基準の平らな床面 */}
          <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            
            {/* 底面（すべての中心親） */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <PrintedTextMaterial text={faces[currentPattern.root.id]?.text || "A"} rotate={faces[currentPattern.root.id]?.rotate || 0} color={currentPattern.root.color} />
            </mesh>

            {/* 子要素（パタパタ折れるツリー） */}
            {currentPattern.root.children?.map(child => (
              <FoldableNode key={child.id} node={child} rad={rad} faces={faces} />
            ))}

          </group>
          <OrbitControls enableDamping minDistance={3} maxDistance={12} />
        </Canvas>
      </div>
    </div>
  );
}
