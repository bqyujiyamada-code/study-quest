"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

type FaceConfig = {
  text: string;
  rotate: number; // 0, 90, 180, 270
};

// 🌟 文字を3Dの表面に直接「印刷」するコンポーネント
function PrintedTextMaterial({ text, rotate, color }: { text: string; rotate: number; color: string }) {
  const textureRef = useRef<THREE.CanvasTexture>(null);

  // 文字や回転が変わったら、裏でCanvasを描き直してテクスチャを更新する
  useEffect(() => {
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }, [text, rotate]);

  return (
    <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.4}>
      <canvasTexture
        ref={textureRef}
        attach="map"
        image={(() => {
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            // 背景を白に近い色で塗りつぶす（文字を見やすく）
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 256, 256);

            // 文字の描画設定
            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 120px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            // 📐 文字の向きを回転させる処理
            ctx.save();
            ctx.translate(128, 128);
            ctx.rotate(toRadian(rotate));
            ctx.fillText(text, 0, 0);
            ctx.restore();
          }
          return canvas;
        })()}
      />
    </meshStandardMaterial>
  );
}

export default function CubeQuestPage() {
  const [progress, setProgress] = useState<number>(0);
  const [selectedFace, setSelectedFace] = useState<string>("底");
  
  const [faces, setFaces] = useState<Record<string, FaceConfig>>({
    底: { text: "A", rotate: 0 },
    手前: { text: "B", rotate: 0 },
    奥: { text: "C", rotate: 0 },
    左: { text: "D", rotate: 0 },
    右: { text: "E", rotate: 0 },
    天井: { text: "F", rotate: 0 },
  });

  const angle = (progress / 100) * 90;
  const rad = toRadian(angle);

  const handleTextChange = (text: string) => {
    setFaces({ ...faces, [selectedFace]: { ...faces[selectedFace], text } });
  };

  const handleRotate = () => {
    setFaces({ 
      ...faces, 
      [selectedFace]: { ...faces[selectedFace], rotate: (faces[selectedFace].rotate + 90) % 360 } 
    });
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row text-white select-none overflow-hidden">
      
      {/* 左側：操作エリア */}
      <div className="w-full md:w-96 bg-slate-800 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 z-10 shadow-2xl overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-cyan-400 mb-1">📦 立体パタパタ実験室</h1>
          <p className="text-xs text-slate-400 mb-6">カメラを回しても文字の向きがズレない修正版</p>

          {/* 1. スライダー */}
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

          {/* 2. 面の選択 */}
          <div className="mb-6">
            <label className="text-xs text-slate-400 block mb-2 font-medium">① 設定する面を選ぶ</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(faces).map((name) => (
                <button
                  key={name} onClick={() => setSelectedFace(name)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                    selectedFace === name 
                      ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg" 
                      : "bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 文字と向きのエディタ */}
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <label className="text-xs text-slate-400 block mb-3 font-medium">② 【{selectedFace}】の文字と向きを変える</label>
            <div className="flex gap-2 mb-4">
              {["A", "B", "C", "❓", "➔", "⬆️"].map((txt) => (
                <button
                  key={txt} onClick={() => handleTextChange(txt)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm bg-slate-700 border border-slate-600 hover:bg-slate-600 flex items-center justify-center ${
                    faces[selectedFace].text === txt ? "ring-2 ring-cyan-400 bg-slate-600" : ""
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
              🔄 文字を90度回転する ({faces[selectedFace].rotate}° )
            </button>
          </div>
        </div>
      </div>

      {/* 右側：3D表示エリア */}
      <div className="flex-1 w-full h-full relative bg-slate-950">
        <Canvas camera={{ position: [2, 3, 3.5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={0.6} />

          {/* 展開図グループ */}
          <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            
            {/* ① 底面 */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <PrintedTextMaterial text={faces["底"].text} rotate={faces["底"].rotate} color="#38bdf8" />
            </mesh>

            {/* ② 手前の面 */}
            <group position={[0, -0.5, 0]} rotation={[-rad, 0, 0]}>
              <mesh position={[0, -0.5, 0]}>
                <planeGeometry args={[1, 1]} />
                <PrintedTextMaterial text={faces["手前"].text} rotate={faces["手前"].rotate} color="#f43f5e" />
              </mesh>
            </group>

            {/* ③ 奥の面 */}
            <group position={[0, 0.5, 0]} rotation={[rad, 0, 0]}>
              <mesh position={[0, 0.5, 0]}>
                <planeGeometry args={[1, 1]} />
                <PrintedTextMaterial text={faces["奥"].text} rotate={faces["奥"].rotate} color="#10b981" />
              </mesh>

              {/* ⑥ 天井の面 */}
              <group position={[0, 1, 0]} rotation={[rad, 0, 0]}>
                <mesh position={[0, 0.5, 0]}>
                  <planeGeometry args={[1, 1]} />
                  <PrintedTextMaterial text={faces["天井"].text} rotate={faces["天井"].rotate} color="#ffffff" />
                </mesh>
              </group>
            </group>

            {/* ④ 左の面 */}
            <group position={[-0.5, 0, 0]} rotation={[0, rad, 0]}>
              <mesh position={[-0.5, 0, 0]}>
                <planeGeometry args={[1, 1]} />
                <PrintedTextMaterial text={faces["左"].text} rotate={faces["左"].rotate} color="#eab308" />
              </mesh>
            </group>

            {/* ⑤ 右の面 */}
            <group position={[0.5, 0, 0]} rotation={[0, -rad, 0]}>
              <mesh position={[0.5, 0, 0]}>
                <planeGeometry args={[1, 1]} />
                <PrintedTextMaterial text={faces["右"].text} rotate={faces["右"].rotate} color="#a855f7" />
              </mesh>
            </group>

          </group>

          <OrbitControls enableDamping minDistance={2} maxDistance={8} />
        </Canvas>
      </div>

    </div>
  );
}
