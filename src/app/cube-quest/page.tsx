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

// 🗺️ 正しい展開図ツリー（めり込みが起きない接続定義）
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

// 🌟 隙間なく完全に密着し、上向きにパタパタ折れるコンポーネント
function FoldableNode({ node, rad, faces }: { node: NetNode; rad: number; faces: Record<string, FaceConfig> }) {
  const faceConfig = faces[node.id] || { text: "?", rotate: 0 };

  let pivotPos: [number, number, number] = [0, 0, 0];
  let pivotRot: [number, number, number] = [0, 0, 0];
  let meshPos: [number, number, number] = [0, 0, 0];

  // 親の面（サイズ1.0）の境界フチにピッタリ蝶番を置き、上（内側）に向かって折る
  switch (node.direction) {
    case "up":
      pivotPos = [0, 0.5, 0];       // 親の上のフチ
      pivotRot = [-rad, 0, 0];      // 3D床空間上で「上向き」に直角に折る
      meshPos = [0, 0.5, 0];        // 蝶番からさらに0.5進んだところがマスの中心
      break;
    case "down":
      pivotPos = [0, -0.5, 0];      // 親の下のフチ
      pivotRot = [rad, 0, 0];       // 上向きに折る
      meshPos = [0, -0.5, 0];
      break;
    case "left":
      pivotPos = [-0.5, 0, 0];      // 親の左のフチ
      pivotRot = [0, rad, 0];       // 上向きに折る
      meshPos = [-0.5, 0, 0];
      break;
    case "right":
      pivotPos = [0.5, 0, 0];       // 親の右のフチ
      pivotRot = [0, -rad, 0];      // 上向きに折る
      meshPos = [0.5, 0, 0];
      break;
  }

  return (
    // 折り目（ヒンジ）のグループ
    <group position={pivotPos} rotation={pivotRot}>
      {/* 自分の面：蝶番から0.5ずらして配置することで、端を軸に綺麗に回転する */}
      <mesh position={meshPos}>
        <planeGeometry args={[1, 1]} />
        <PrintedTextMaterial text={faceConfig.text} rotate={faceConfig.rotate} color={node.color} />
      </mesh>

      {/* 次の子要素：自分のメッシュの中心から、さらに0.5進んだ「先端のフチ」に連結する */}
      {node.children?.map((child) => {
        let nextPivotPos: [number, number, number] = [0, 0, 0];
        if (child.direction === "up") nextPivotPos = [0, 1.0, 0];      // 0.5 + 0.5 でぴったり次のマスの境界
        else if (child.direction === "down") nextPivotPos = [0, -1.0, 0];
        else if (child.direction === "left") nextPivotPos = [-1.0, 0, 0];
        else if (child.direction === "right") nextPivotPos = [1.0, 0, 0];

        return (
          <group key={child.id} position={nextPivotPos}>
            <FoldableNode node={child} rad={rad} faces={faces} />
          </group>
        );
      })}
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
        <p className="text-xs text-slate-400 mb-6 font-medium font-sans">展開図完全密着・上向き折り固定版</p>

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
        <Canvas camera={{ position: [0, 3, 5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.6} />
          
          {/* 基準の床面 */}
          <group position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            
            {/* 底面（すべての親、中心原点） */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <PrintedTextMaterial text={faces[currentPattern.root.id]?.text || "A"} rotate={faces[currentPattern.root.id]?.rotate || 0} color={currentPattern.root.color} />
            </mesh>

            {/* 子要素（パタパタ折れるツリーを完全にフチ結合で配置） */}
            {currentPattern.root.children?.map(child => {
              let firstPivotPos: [number, number, number] = [0, 0, 0];
              if (child.direction === "up") firstPivotPos = [0, 0.5, 0];
              else if (child.direction === "down") firstPivotPos = [0, -0.5, 0];
              else if (child.direction === "left") firstPivotPos = [-0.5, 0, 0];
              else if (child.direction === "right") firstPivotPos = [0.5, 0, 0];

              return (
                <group key={child.id} position={firstPivotPos}>
                  <FoldableNode node={child} rad={rad} faces={faces} />
                </group>
              );
            })}

          </group>
          <OrbitControls enableDamping minDistance={2} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  );
}
