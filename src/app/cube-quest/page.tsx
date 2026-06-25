"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ... (FaceDef型定義とgetPatternsデータは前回のものと同じ)

export default function CubeQuest() {
  const [key, setKey] = useState("p01");
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const patterns = useMemo(getPatterns, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // スマホで文字やボタンがあふれないよう、より厳密なCSS定義
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      width: "100%", // vwではなく%にする
      height: "100vh",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      background: "#020617",
      color: "white",
      fontFamily: "sans-serif",
      overflow: "hidden" // 余計なスクロールを防ぐ
    },
    sidebar: {
      width: isMobile ? "100%" : "300px",
      flex: isMobile ? "none" : "0 0 300px",
      padding: "16px",
      background: "#0f172a",
      boxSizing: "border-box", // パディングを幅に含める
      borderBottom: isMobile ? "1px solid #334" : "none",
      borderRight: isMobile ? "none" : "1px solid #334",
      overflowY: "auto"
    },
    button: (active: boolean) => ({
      padding: "8px 12px",
      background: active ? "#22d3ee" : "#1e293b",
      border: "none",
      borderRadius: "6px",
      color: "white",
      cursor: "pointer",
      fontSize: "14px",
      flex: "1 1 calc(50% - 8px)" // 2列で綺麗に並ぶように調整
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h2 style={{ fontSize: "18px", margin: "0 0 16px 0", whiteSpace: "nowrap" }}>展開図実験室</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.keys(patterns).map(k => (
            <button key={k} onClick={() => setKey(k)} style={styles.button(key === k)}>
              {k === "p01" ? "十字型" : "階段型"}
            </button>
          ))}
        </div>
        <input type="range" min="0" max="100" value={progress} 
          onChange={(e) => setProgress(Number(e.target.value))} 
          style={{ width: "100%", marginTop: "24px" }} />
      </div>
      <div style={{ flex: 1, position: "relative" }}>
        <Canvas camera={{ position: [0, 4, 5] }}>
          <ambientLight intensity={0.8} />
          <group rotation={[-Math.PI / 2, 0, 0]}>
            {patterns[key].map(f => (
              <FaceInstance key={f.id} def={f} progress={progress} allFaces={patterns[key]} />
            ))}
          </group>
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}

// ... (FaceInstance関数は前回のものを使用)
