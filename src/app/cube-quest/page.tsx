"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// 11パターンのデータ定義（今回は省略しますが、p03-p11もp01,p02と同様の親子構造で記述可能です）
// ... (前回のp01, p02データをそのまま利用)

export default function CubeQuestMobile() {
  const [key, setKey] = useState("p01");
  const [progress, setProgress] = useState(0);

  // レスポンシブなスタイル定義
  const styles = {
    container: {
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: typeof window !== 'undefined' && window.innerWidth < 768 ? "column" : "row",
      background: "#020617",
      color: "white",
      fontFamily: "sans-serif"
    },
    sidebar: {
      width: typeof window !== 'undefined' && window.innerWidth < 768 ? "100%" : "300px",
      padding: "16px",
      background: "#0f172a",
      overflowY: "auto" as const,
      borderBottom: typeof window !== 'undefined' && window.innerWidth < 768 ? "1px solid #334" : "none",
      borderRight: typeof window !== 'undefined' && window.innerWidth >= 768 ? "1px solid #334" : "none"
    },
    button: (active: boolean) => ({
      display: "inline-block",
      margin: "4px",
      padding: "8px 12px",
      background: active ? "#22d3ee" : "#1e293b",
      color: active ? "#000" : "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "12px",
      cursor: "pointer"
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={{ fontSize: "16px", margin: "0 0 10px 0" }}>展開図実験室</h2>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {["p01", "p02"].map(k => (
            <button key={k} onClick={() => setKey(k)} style={styles.button(key === k)}>
              {k === "p01" ? "① 十字" : "② 階段"}
            </button>
          ))}
        </div>
        <input 
          type="range" min="0" max="100" value={progress} 
          onChange={(e) => setProgress(Number(e.target.value))} 
          style={{ width: "100%", marginTop: "20px" }} 
        />
        <p style={{ fontSize: "12px", color: "#94a3b8" }}>スライダーで組み立てよう！</p>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <Canvas camera={{ position: [0, 4, 5] }}>
          <ambientLight intensity={0.8} />
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {/* 描画ロジックは前回同様 */}
          </group>
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
