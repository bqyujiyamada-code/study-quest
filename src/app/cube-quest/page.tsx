"use client";

import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Html } from "@react-three/drei";

export default function CubeQuestPage() {
  return (
    <div className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
      {/* ヘッダーエリア */}
      <div className="absolute top-6 text-center z-10 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-wider text-cyan-400 mb-2">
          📦 立体空間認識トレーニング
        </h1>
        <p className="text-sm text-slate-400">
          画面をドラッグ・スワイプして360°回してみよう！
        </p>
      </div>

      {/* 3D空間（Canvas）エリア */}
      <div className="w-full h-full">
        <Canvas
          camera={{ position: [3, 3, 3], fov: 50 }}
        >
          {/* 3D空間の明かり（ライト） */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />

          {/* 3Dサイコロ（Box） */}
          <Box args={[1.5, 1.5, 1.5]}>
            {/* サイコロの素材と色 */}
            <meshStandardMaterial color="#38bdf8" roughness={0.3} />
            
            {/* 面の上に文字を乗せる */}
            <Html position={[0, 0, 0.76]} center distanceFactor={4}>
              <div className="text-3xl font-black text-slate-900 select-none">A</div>
            </Html>
            <Html position={[0, 0, -0.76]} center distanceFactor={4}>
              <div className="text-3xl font-black text-slate-900 select-none transform rotate-180">B</div>
            </Html>
          </Box>

          {/* マウス・スワイプでカメラをぐるぐる回すためのコントローラー */}
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={10}
          />
        </Canvas>
      </div>
    </div>
  );
}
