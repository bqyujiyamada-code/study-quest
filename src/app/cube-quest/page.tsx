"use client";

import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";

const toRadian = (degree: number) => (degree * Math.PI) / 180;

export default function CubeQuestPage() {
  const [progress, setProgress] = useState<number>(0);
  const angle = (progress / 100) * 90;
  const rad = toRadian(angle);

  // 📐 正しい回転軸（ヒンジ）を固定するための位置計算
  // 0度のとき：height=0, offset=0.5 (隣の面の真横)
  // 90度のとき：height=0.5, offset=0 (底面の真上の位置)
  const height = 0.5 * Math.sin(rad);
  const offset = 0.5 * Math.cos(rad);

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

          <group position={[0, -0.2, 0]}>
            
            {/* ① 底面（基準：完全に固定） */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#38bdf8" side={2} roughness={0.4} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">底</div>
              </Html>
            </mesh>

            {/* ② 手前の面（ピンク）：z=0.5 の辺を軸に起き上がる */}
            <mesh 
              position={[0, height, 0.5 + offset]} 
              rotation={[-Math.PI / 2 + rad, 0, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#f43f5e" side={2} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">手前</div>
              </Html>
            </mesh>

            {/* ③ 奥の面（緑）：z=-0.5 の辺を軸に起き上がる */}
            <mesh 
              position={[0, height, -0.5 - offset]} 
              rotation={[-Math.PI / 2 - rad, 0, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#10b981" side={2} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">奥</div>
              </Html>
            </mesh>

            {/* ④ 左の面（黄色）：x=-0.5 の辺を軸に起き上がる */}
            <mesh 
              position={[-0.5 - offset, height, 0]} 
              rotation={[-Math.PI / 2, -rad, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial color="#eab308" side={2} />
              <Html position={[0, 0, 0.02]} center distanceFactor={4}>
                <div className="text-sm font-black text-slate-900">左</div>
              </Html>
            </mesh>

            {/* ⑤ 右の面（紫）：x=0.5 の辺を軸に起き上がる */}
            <mesh 
              position={[0.5 + offset, height, 0]} 
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

      {/* コントロールUI */}
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
