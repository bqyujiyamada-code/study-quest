"use client";

import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

// 各面の文字と向きを管理する型
type FaceConfig = {
  text: string;
  rotate: number; // 0, 90, 180, 270
};

export default function CubeQuestPage() {
  const [progress, setProgress] = useState<number>(0);
  const [selectedFace, setSelectedFace] = useState<string>("底");
  
  // 各面の文字と回転の初期状態
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

  // 文字を変更する関数
  const handleTextChange = (text: string) => {
    setFaces({ ...faces, [selectedFace]: { ...faces[selectedFace], text } });
  };

  // 文字を90度回転する関数
  const handleRotate = () => {
    setFaces({ 
      ...faces, 
      [selectedFace]: { ...faces[selectedFace], rotate: (faces[selectedFace].rotate + 90) % 360 } 
    });
  };

  // 3D上のHTML文字をレンダリングするヘルパー（テストの展開図基準で外側に見えるように配置）
  const renderFaceText = (key: string) => {
    const face = faces[key];
    return (
      <Html position={[0, 0, -0.02]} center distanceFactor={4}>
        <div 
          className="text-xl font-black text-slate-950 bg-white/90 px-2 py-1 rounded shadow-sm select-none transition-transform"
          style={{ transform: `rotate(${90 + face.rotate}deg) scale-x(-1)` }}
        >
          {face.text}
        </div>
      </Html>
    );
  };

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col md:flex-row text-white select-none overflow-hidden">
      
      {/* 📁 左側：コントロールパネル（操作エリア） */}
      <div className="w-full md:w-96 bg-slate-800 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700 z-10 shadow-2xl overflow-y-auto">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-cyan-400 mb-1">📦 立体パタパタ実験室</h1>
          <p className="text-xs text-slate-400 mb-6">文字の向きを考慮した空間認識特訓</p>

          {/* 1. 組み立てスライダー */}
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
                  key={name}
                  onClick={() => setSelectedFace(name)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                    selectedFace === name 
                      ? "bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20" 
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
            
            {/* 文字選択スタンプ */}
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

            {/* 回転ボタン */}
            <button
              onClick={handleRotate}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              🔄 文字を90度回転する ({faces[selectedFace].rotate}° )
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 text-center mt-6">
          画面の右側をドラッグすると360°自由に見回せます
        </div>
      </div>

      {/* 🎬 右側：3Dシアター（サイコロ表示エリア） */}
      <div className="flex-1 w-full h-full relative bg-slate-950">
        <Canvas camera={{ position: [2, 3, 3.5], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          <group position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {/* ① 底面 */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#38bdf8" side={2} roughness={0.4} />
              {renderFaceText("底")}
            </mesh>

            {/* ② 手前の面 */}
            <group position={[0, -0.5, 0]} rotation={[-rad, 0, 0]}>
              <mesh position={[0, -0.5, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial color="#f43f5e" side={2} />
                {renderFaceText("手前")}
              </mesh>
            </group>

            {/* ③ 奥の面 */}
            <group position={[0, 0.5, 0]} rotation={[rad, 0, 0]}>
              <mesh position={[0, 0.5, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial color="#10b981" side={2} />
                {renderFaceText("奥")}
              </mesh>

              {/* ⑥ 天井の面 */}
              <group position={[0, 1, 0]} rotation={[rad, 0, 0]}>
                <mesh position={[0, 0.5, 0]}>
                  <planeGeometry args={[1, 1]} />
                  <meshStandardMaterial color="#ffffff" side={2} />
                  {renderFaceText("天井")}
                </mesh>
              </group>
            </group>

            {/* ④ 左の面 */}
            <group position={[-0.5, 0, 0]} rotation={[0, rad, 0]}>
              <mesh position={[-0.5, 0, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial color="#eab308" side={2} />
                {renderFaceText("左")}
              </mesh>
            </group>

            {/* ⑤ 右の面 */}
            <group position={[0.5, 0, 0]} rotation={[0, -rad, 0]}>
              <mesh position={[0.5, 0, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial color="#a855f7" side={2} />
                {renderFaceText("右")}
              </mesh>
            </group>
          </group>

          <OrbitControls enableDamping minDistance={2} maxDistance={8} />
        </Canvas>
      </div>

    </div>
  );
}
