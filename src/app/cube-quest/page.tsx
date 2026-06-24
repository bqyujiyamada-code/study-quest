"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

type FaceConfig = { text: string; rotate: number; };

const FACE_IDS = ["bottom", "front", "back", "top", "left", "right"];

const PATTERNS: Record<string, { label: string }> = {
  cross: { label: "① 十字型（基本）" },
  zShape: { label: "② Z型（いなずま型）" }
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

function AbsoluteFoldableFace({ id, pattern, progress, faceConfig }: { id: string; pattern: string; progress: number; faceConfig: FaceConfig }) {
  const meshRef = useRef<THREE.Mesh>(null);

  const colors: Record<string, string> = {
    bottom: "#38bdf8", front: "#f43f5e", back: "#10b981",
    top: "#ffffff", left: "#eab308", right: "#a855f7"
  };

  useEffect(() => {
    if (!meshRef.current) return;

    // θ = 0° (0ラジアン) 〜 90° (π/2ラジアン)
    const theta = (progress / 100) * (Math.PI / 2);
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);

    let px = 0, py = 0, pz = 0;
    let rx = 0, ry = 0, rz = 0;
    let customQuaternion: THREE.Quaternion | null = null;

    if (pattern === "cross") {
      // 🔷 十字型：隙間なし・めり込みなしの完全絶対座標
      switch (id) {
        case "bottom": // 原点固定
          px = 0; py = 0; pz = 0;
          break;
        case "front": // 下のフチ [0, -0.5] を軸に手前が立ち上がる
          px = 0;
          py = -0.5 - 0.5 * cos;
          pz = 0.5 * sin;
          rx = theta;
          break;
        case "back": // 上のフチ [0, 0.5] を軸に奥面が立ち上がる
          px = 0;
          py = 0.5 + 0.5 * cos;
          pz = 0.5 * sin;
          rx = -theta;
          break;
        case "top": // 奥面の先端 [0, 1.5] のフチを軸に、さらに直角に折れて天井になる
          px = 0;
          py = 0.5 + cos + 0.5 * sin;
          pz = sin - 0.5 * cos;
          rx = -theta * 2;
          break;
        case "left": // 左のフチ [-0.5, 0] を軸に左面が立ち上がる
          px = -0.5 - 0.5 * cos;
          py = 0;
          pz = 0.5 * sin;
          ry = -theta; // 外側を向くように回転方向を修正
          break;
        case "right": // 右のフチ [0.5, 0] を軸に右面が立ち上がる
          px = 0.5 + 0.5 * cos;
          py = 0;
          pz = 0.5 * sin;
          ry = theta; // 外側を向くように回転方向を修正
          break;
      }
    } else {
      // ⚡ Z型（いなずま型）：めり込み完全修正版
      switch (id) {
        case "bottom":
          px = 0; py = 0; pz = 0;
          break;
        case "front":
          px = 0;
          py = -0.5 - 0.5 * cos;
          pz = 0.5 * sin;
          rx = theta;
          break;
        case "back":
          px = 0;
          py = 0.5 + 0.5 * cos;
          pz = 0.5 * sin;
          rx = -theta;
          break;
        case "top":
          px = 0;
          py = 0.5 + cos + 0.5 * sin;
          pz = sin - 0.5 * cos;
          rx = -theta * 2;
          break;
        case "left": // 🔴 天井(top)の左側 [-0.5, 2.0] に初期配置され、連動して折れる
          // 0%のとき、正確に px = -1.0, py = 2.0, pz = 0 になるよう位相を完全一致させる
          px = -0.5 - 0.5 * cos;
          py = 0.5 + cos + 0.5 * sin;
          pz = sin - 0.5 * cos + 0.5 * sin;

          // 天井の回転（X軸に -theta*2）に、左面自体の折りたたみの回転（Y軸に -theta）を合成
          const qTop = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -theta * 2);
          const qSelf = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -theta);
          customQuaternion = new THREE.Quaternion().multiplyQuaternions(qTop, qSelf);
          break;
        case "right": // 底面の右側に結合
          px = 0.5 + 0.5 * cos;
          py = 0;
          pz = 0.5 * sin;
          ry = theta;
          break;
      }
    }

    meshRef.current.position.set(px, py, pz);
    if (customQuaternion) {
      meshRef.current.quaternion.copy(customQuaternion);
    } else {
      meshRef.current.rotation.set(rx, ry, rz);
    }
  }, [progress, id, pattern]);

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1, 1]} />
      <PrintedTextMaterial text={faceConfig?.text || "❓"} rotate={faceConfig?.rotate || 0} color={colors[id]} />
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
        <p className="text-xs text-slate-400 mb-6 font-medium">完全グリッド配置・絶対座標数理制御版</p>

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
              {FACE_IDS.map(id => (
                <button key={id} onClick={() => setSelectedFaceId(id)} className={`py-2 text-[10px] font-bold rounded border transition-all ${selectedFaceId === id ? "bg-cyan-500 border-cyan-400 text-slate-900" : "bg-slate-700 border-slate-600"}`}>{id === "bottom" ? "底面" : id === "front" ? "手前" : id === "back" ? "奥面" : id === "top" ? "天井" : id === "left" ? "左面" : "右面"}</button>
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
          
          {/* XY平面を床面として配置 */}
          <group position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {FACE_IDS.map(id => (
              <AbsoluteFoldableFace 
                key={id} 
                id={id} 
                pattern={currentPatternKey} 
                progress={progress} 
                faceConfig={faces[id]} 
              />
            ))}
          </group>
          <OrbitControls enableDamping minDistance={2} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  );
}
