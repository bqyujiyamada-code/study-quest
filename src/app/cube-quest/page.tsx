"use client";

import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

// 角度をラジアンに変換するヘルパー関数
const toRadian = (degree: number) => (degree * Math.PI) / 180;

export default function CubeQuestPage() {
  // スライダーの値（0: 展開図 〜 100: 立体完成）
  const [progress, setProgress] = useState<number>(0);

  // progress (0-100) を回転角度 (0度〜90度) に変換
  const angle = (progress / 100) * 90;

  // 展開図のパタパタを計算するための変数
  const rad = toRadian(angle);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white select-none">
      
      {/* ヘッダー */}
      <div className="absolute top-6 text-center z-10 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400 mb-1">
          📦 展開図パタパタ実験室
        </h1>
        <p className="text-sm text-slate-400">
          下のスライダーを動かして、組み立ててみよう！
        </p>
      </div>

      {/* 3D空間 */}
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 3, 4], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />

          {/* 🌟 立方体の展開図グループ */}
          <group position={[0, -0.2, 0]}>
            
            {/* ① 底面（中央：常に水平） */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#38bdf8" side={2} roughness={0.4} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">底</div>
              </Html>
            </mesh>

            {/* ② 手前の面（ピンク） */}
            <mesh 
              position={[0, 0.5 * sin, 0.5 + 0.5 * cos]} 
              rotation={[-Math.PI / 2 + rad, 0, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#f43f5e" side={2} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">手前</div>
              </Html>
            </mesh>

            {/* ③ 奥の面（緑） */}
            <mesh 
              position={[0, 0.5 * sin, -0.5 - 0.5 * cos]} 
              rotation={[-Math.PI / 2 - rad, 0, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#10b981" side={2} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">奥</div>
              </Html>
            </mesh>

            {/* ④ 左の面（黄色） */}
            <mesh 
              position={[-0.5 - 0.5 * cos, 0.5 * sin, 0]} 
              rotation={[-Math.PI / 2, -rad, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#eab308" side={2} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">左</div>
              </Html>
            </mesh>

            {/* ⑤ 右の面（紫） */}
            <mesh 
              position={[0.5 + 0.5 * cos, 0.5 * sin, 0]} 
              rotation={[-Math.PI / 2, rad, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#a855f7" side={2} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">右</div>
              </Html>
            </mesh>

          </group>

          <OrbitControls enableDamping />
        </Canvas>
      </div>

      {/* 🛠️ コントロールUI（スライダー） */}
      <div className="absolute bottom-12 w-11/12 max-w-md bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-2xl z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-slate-400">組み立て進捗</span>
          <span className="text-lg font-bold text-cyan-400">{progress}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          <span>展開図 (0%)</span>
          <span>立体 (100%)</span>
        </div>
      </div>

    </div>
  );
}
