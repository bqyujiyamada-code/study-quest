"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

type FaceDef = { id: string; color: string; pos: [number, number, number]; pivot: [number, number, number]; axis: "X" | "Y"; sign: number; parent?: string };

const COLORS = { b: "#0ea5e9", f: "#f43f5e", bk: "#10b981", l: "#eab308", r: "#a855f7", t: "#f8fafc" };

const getValidPatterns = (): Record<string, FaceDef[]> => ({
  // 1-4-1型 (6種)
  "1-4-1-a (十字)": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" }
  ],
  "1-4-1-b": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "bk" }
  ],
  "1-4-1-c": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, 1, 0], pivot: [-0.5, 1, 0], axis: "Y", sign: -1, parent: "bk" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "bk" }
  ],
  "1-4-1-d": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "f" },
    { id: "r", color: COLORS.r, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" }
  ],
  "1-4-1-e": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "f" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "bk" }
  ],
  "1-4-1-f": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [0, 2, 0], pivot: [0, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "l", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "f" },
    { id: "r", color: COLORS.r, pos: [1, -1, 0], pivot: [0.5, -1, 0], axis: "Y", sign: 1, parent: "f" }
  ],
  // 1-3-2型 (3種) - 干渉しない枝構造で定義
  "1-3-2-a": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [-1, 1, 0], pivot: [-1, 0.5, 0], axis: "X", sign: -1, parent: "l" },
    { id: "t", color: COLORS.t, pos: [-2, 1, 0], pivot: [-1.5, 1, 0], axis: "Y", sign: -1, parent: "r" }
  ],
  "1-3-2-b": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [1, 1, 0], pivot: [1, 0.5, 0], axis: "X", sign: -1, parent: "r" }
  ],
  "1-3-2-c": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "l", color: COLORS.l, pos: [-1, 0, 0], pivot: [-0.5, 0, 0], axis: "Y", sign: -1, parent: "b" },
    { id: "t", color: COLORS.t, pos: [-1, 1, 0], pivot: [-1, 0.5, 0], axis: "X", sign: -1, parent: "l" },
    { id: "r", color: COLORS.r, pos: [-2, 1, 0], pivot: [-1.5, 1, 0], axis: "Y", sign: -1, parent: "t" }
  ],
  // その他 (2種)
  "階段型 (2-2-2)": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [1, 0, 0], pivot: [0.5, 0, 0], axis: "Y", sign: 1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [1, 0.5, 0], axis: "X", sign: -1, parent: "f" },
    { id: "bk", color: COLORS.bk, pos: [2, 1, 0], pivot: [1.5, 1, 0], axis: "Y", sign: 1, parent: "r" },
    { id: "l", color: COLORS.l, pos: [2, 2, 0], pivot: [2, 1.5, 0], axis: "X", sign: -1, parent: "bk" },
    { id: "t", color: COLORS.t, pos: [3, 2, 0], pivot: [2.5, 2, 0], axis: "Y", sign: 1, parent: "l" }
  ],
  "3-3型": [
    { id: "b", color: COLORS.b, pos: [0, 0, 0], pivot: [0, 0, 0], axis: "X", sign: 0 },
    { id: "f", color: COLORS.f, pos: [0, -1, 0], pivot: [0, -0.5, 0], axis: "X", sign: 1, parent: "b" },
    { id: "l", color: COLORS.l, pos: [-1, -1, 0], pivot: [-0.5, -1, 0], axis: "Y", sign: -1, parent: "f" },
    { id: "bk", color: COLORS.bk, pos: [0, 1, 0], pivot: [0, 0.5, 0], axis: "X", sign: -1, parent: "b" },
    { id: "r", color: COLORS.r, pos: [1, 1, 0], pivot: [0.5, 1, 0], axis: "Y", sign: 1, parent: "bk" },
    { id: "t", color: COLORS.t, pos: [1, 2, 0], pivot: [1, 1.5, 0], axis: "X", sign: -1, parent: "r" }
  ]
});

// FaceInstanceおよびCubeQuestの構造は変更なしのため省略
// 上記を統合して一つのファイルとして完成です。
