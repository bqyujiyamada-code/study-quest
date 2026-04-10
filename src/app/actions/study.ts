"use server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * ユーザーの現在のステータスを取得
 */
export async function getUserStats(userId: string) {
  try {
    const command = new GetCommand({
      TableName: "UserStats",
      Key: { userId },
    });
    const response = await docClient.send(command);
    
    return response.Item || { 
      totalMinutes: 0, 
      totalPoints: 0, 
      totalMoney: 0, 
      combo: 0,
      lastDate: "" // コンボ判定用の最終保存日
    };
  } catch (error) {
    console.error("DynamoDB Get Error:", error);
    return { totalMinutes: 0, totalPoints: 0, totalMoney: 0, combo: 0, lastDate: "" };
  }
}

/**
 * ユーザーステータス（累計データ）を更新
 */
export async function saveStudyLogAndStats(data: {
  userId: string;
  totalMinutes: number;
  totalPoints: number;
  totalMoney: number;
  combo: number;
}) {
  try {
    // 今日を「YYYY-MM-DD」形式で取得
    const today = new Date().toLocaleDateString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit"
    }).replaceAll("/", "-");

    const command = new PutCommand({
      TableName: "UserStats",
      Item: {
        ...data,
        lastDate: today,
        lastUpdated: new Date().toISOString(),
      },
    });
    await docClient.send(command);
    return { success: true };
  } catch (error) {
    console.error("DynamoDB Put Error:", error);
    return { success: false };
  }
}

/**
 * 個別の勉強ログ保存とポイント・コンボ計算
 */
export async function saveStudyLog(data: {
  userId: string;
  subject: string;
  duration: number;
  originalDuration: number;
  isEdited: boolean;
  memo: string;
}) {
  try {
    // 1. 現在のステータスを取得してコンボ判定
    const stats = await getUserStats(data.userId);
    const today = new Date();
    const todayStr = today.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replaceAll("/", "-");
    
    let nextCombo = 1;
    
    if (stats.lastDate) {
      const lastDate = new Date(stats.lastDate);
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (stats.lastDate === todayStr) {
        // 今日すでに一度保存しているならコンボは維持
        nextCombo = stats.combo;
      } else if (diffDays === 1) {
        // 昨日から連続しているならコンボ+1
        nextCombo = stats.combo + 1;
      } else {
        // 1日以上空いたらリセットして1から
        nextCombo = 1;
      }
    }

    // 2. ポイント計算 (1分 = 1pt)
    let points = data.duration;
    let isBonus = false;

    // 3. 5の倍数の日なら1.25倍ボーナス
    if (nextCombo > 0 && nextCombo % 5 === 0) {
      points = Math.floor(points * 1.25);
      isBonus = true;
    }

    // ※本来はここで「StudyLogs」という別テーブルにも明細を保存するのがエンジニア的ですが、
    // まずはフロントへ計算結果を返します
    
    return { 
      success: true, 
      points: points, 
      isBonus: isBonus,
      newCombo: nextCombo 
    };
  } catch (error) {
    console.error("Save Study Log Error:", error);
    return { success: false };
  }
}
