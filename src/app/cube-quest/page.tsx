"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

type FaceConfig = { text: string; rotate: number; };

// 各面の定義：展開図の時の「初期位置の中心」と、組み立てる時の「回転軸（ヒンジ）」、および「回転方向」
type FaceDefinition = {
  id: string;
  name: string;
  color: string;
  initialPos: [number, number, number]; // 展開図（0%）の時の中心座標 [x, y, z]
  pivotPos: [number, number, number];   // 回転の軸となるフチの座標 [x, y, z]
  axis: "X" | "Y";                      // 回転させる軸
  sign: number;                         // 回転の方向（1 または -1）
  isTopDependency?: boolean;            // Z型で天井に連動するかどうか
};

const PATTERNS: Record<string, { label: string; faces: FaceDefinition[] }> = {
  cross: {
    label: "① 十字型（基本）",
    faces: [
      { id: "bottom", name: "底面", color: "#38bdf8", initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  name: "手前", color: "#f43f5e", initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   name: "奥面", color: "#10b981", initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "left",   name: "左面", color: "#eab308", initialPos: [-1, 0, 0],  pivotPos: [-0.5, 0, 0], axis: "Y", sign: -1 },
      { id: "right",  name: "右面", color: "#a855f7", initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      // 天井は「奥面」の回転軸 [0, 0.5] を中心に一緒に回りつつ、さらに自分のフチ [0, 1.5] で折れる
      { id: "top",    name: "天井", color: "#ffffff", initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1 }
    ]
  },
  zShape: {
    label: "② Z型（いなずま型）",
    faces: [
      { id: "bottom", name: "底面", color: "#38bdf8", initialPos: [0, 0, 0],   pivotPos: [0, 0, 0],    axis: "X", sign: 0 },
      { id: "front",  name: "手前", color: "#f43f5e", initialPos: [0, -1, 0],  pivotPos: [0, -0.5, 0], axis: "X", sign: 1 },
      { id: "back",   name: "奥面", color: "#10b981", initialPos: [0, 1, 0],   pivotPos: [0, 0.5, 0],  axis: "X", sign: -1 },
      { id: "right",  name: "右面", color: "#a855f7", initialPos: [1, 0, 0],   pivotPos: [0.5, 0, 0],  axis: "Y", sign: 1 },
      { id: "top",    name: "天井", color: "#ffffff", initialPos: [0, 2, 0],   pivotPos: [0, 1.5, 0],  axis: "X", sign: -1 },
      // Z型の左面は、展開図の時点で [ -1, 2 ]（天井の左）に完璧に密着配置。
      // 天井の動きに連動（isTopDependency）しながら、さらに自分のフチ [-0.5, 2.0] で折れる
      { id: "left",   name: "左面", color: "#eab308", initialPos: [-1, 2, 0],  pivotPos: [-0.5, 2.0, 0], axis: "Y", sign: -1, isTopDependency: true }
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

// 🌟 ヒンジ（蝶番）グループをローカルに挟むことで、100%ちぎれない回転を生むコンポーネント
function SmartFoldableFace({ def, progress, faceConfig }: { def: FaceDefinition; progress: number; faceConfig: FaceConfig }) {
  const pivotRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!pivotRef.current) return;

    const angle = (progress / 100) * (Math.PI / 2); // 0 〜 90度
    
    // 一度すべての回転をリセット
    pivotRef.current.rotation.set(0, 0, 0);
    pivotRef.current.position.set(0, 0, 0);

    // 1️⃣ 基本的な面の回転処理
    if (def.id !== "bottom") {
      if (def.id === "top") {
        // 天井は「奥面のフチ [0, 0.5]」を中心に全体のシステムが回り、さらに「自分のフチ [0, 1.5]」で回る
        // これをThree.jsのマトリクス合成で美しく、絶対に千切れないように処理
        const m1 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle); // 奥面の折れ
        m1.setPosition(new THREE.Vector3(0, 0.5, 0));

        const m2 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle); // 天井自身の折れ
        m2.setPosition(new THREE.Vector3(0, 1.0, 0)); // 奥面のフチから見た相対位置

        const finalMatrix = new THREE.Matrix4().multiplyMatrices(m1, m2);
        
        // 最終的な位置と回転を抽出して適用
        const pos = new THREE.Vector3();
        const quad = new THREE.Quaternion();
        finalMatrix.decompose(pos, quad, new THREE.Vector3());
        
        pivotRef.current.position.copy(pos);
        pivotRef.current.quaternion.copy(quad);
        return;
      } 
      
      if (def.isTopDependency) {
        // ⚡ Z型の左面：天井の回転マトリクスを完全にトレースし、さらに「自分のフチ [-0.5, 2.0]」でY軸回転する
        const mTop1 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle);
        mTop1.setPosition(new THREE.Vector3(0, 0.5, 0));
        const mTop2 = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), -angle);
        mTop2.setPosition(new THREE.Vector3(0, 1.0, 0));
        const mTopFinal = new THREE.Matrix4().multiplyMatrices(mTop1, mTop2); // これで天井の位置

        const mSelf = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), -angle); // 左面自身の折れ
        mSelf.setPosition(new THREE.Vector3(-0.5, 0.5, 0)); // 天井の中心から見た左面ヒンジの相対位置

        const finalMatrix = new THREE.Matrix4().multiplyMatrices(mTopFinal, mSelf);
        
        const pos = new THREE.Vector3();
        const quad = new THREE.Quaternion();
        finalMatrix.decompose(pos, quad, new THREE.Vector3());
        
        pivotRef.current.position.copy(pos);
        pivotRef.current.quaternion.copy(quad);
        return;
      }

      // 通常の1段階折れる面（手前、奥、左、右）
      // 回転軸（フチ）の位置へ移動させてから、指定された軸で回転させる
      pivotRef.current.position.set(...def.pivotPos);
      if (def.axis === "X") {
        pivotRef.current.rotation.x = angle * def.sign;
      } else {
        pivotRef.current.rotation.y = angle * def.sign;
      }
    }
  }, [progress, def]);

  // メッシュ自体は、回転軸グループから見た「本来の中心位置」への相対座標に配置する
  // 例：手前の初期中心 [0, -1, 0]、フチ [0, -0.5, 0] なら、相対位置は [0, -0.5, 0]
  const localMeshPos: [number, number, number] = [
    def.initialPos[0] - def.pivotPos[0],
    def.initialPos[1] - def.pivotPos[1],
    def.initialPos[2] - def.pivotPos[2]
  ];

  return (
    <group ref={pivotRef}>
      <mesh position={localMeshPos}>
        <planeGeometry args={[1, 1]} />
        <PrintedTextMaterial text={faceConfig?.text || "❓"} rotate={faceConfig?.rotate || 0} color={def.color} />
      </mesh>
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

  const currentPattern = PATTERNS[currentPatternKey];

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row text-white overflow-hidden">
      <div className="w-full md:w-96 bg-slate-800 p-6 flex flex-col border-r border-slate-700 z-10 shadow-2xl">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">📦 立体パタパタ実験室</h1>
        <p className="text-xs text-slate-400 mb-6 font-medium">ピボットマトリクス制御・完全解決版</p>

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
        <Canvas camera={{ position: [0, 3, 5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.6} />
          
          {/* XY平面を床面として配置 */}
          <group position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {currentPattern.faces.map(face => (
              <SmartFoldableFace 
                key={face.id} 
                def={face} 
                progress={progress} 
                faceConfig={faces[face.id]} 
              />
            ))}
          </group>
          <OrbitControls enableDamping minDistance={2} maxDistance={10} />
        </Canvas>
      </div>
    </div>
  );
}
