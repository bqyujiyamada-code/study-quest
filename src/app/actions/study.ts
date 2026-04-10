"use server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  ScanCommand 
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

/**
 * レベルに応じた単価を計算する（0.4円〜0.6円）
 */
const getUnitPrice = (totalMinutes: number) => {
  // 100分で1レベル上がる計算（例）
  const level = Math.floor(totalMinutes / 100) + 1;
  const currentLevel = level > 10 ? 10 : level;

  if (currentLevel <= 3) return 0.4;
  if (currentLevel <= 7) return 0.5;
  return 0.6; // Lv 8-10
};

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
      lastDate: "" 
    };
  } catch (error) {
    console.error("DynamoDB Get Error:", error);
    return { totalMinutes: 0, totalPoints: 0, totalMoney: 0, combo: 0, lastDate: "" };
  }
}

/**
 * ユーザーステータス（累計データ）を更新
 * ※フロントエンドからの呼び出し用
 */
export async function saveStudyLogAndStats(data: {
  userId: string;
  totalMinutes: number;
  totalPoints: number;
  totalMoney: number;
  combo: number;
}) {
  try {
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
 * 個別の勉強ログ保存とポイント・単価・コンボ計算
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
    const stats = await getUserStats(data.userId);
    const today = new Date();
    const todayStr = today.toLocaleDateString("ja-JP", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit" 
    }).replaceAll("/", "-");
    
    // 1. コンボ判定
    let nextCombo = 1;
    if (stats.lastDate) {
      const lastDate = new Date(stats.lastDate);
      const diffTime = today.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (stats.lastDate === todayStr) {
        nextCombo = stats.combo;
      } else if (diffDays === 1) {
        nextCombo = stats.combo + 1;
      } else {
        nextCombo = 1;
      }
    }

    // 2. ポイント計算 (1分 = 1pt) + ボーナス判定
    let points = data.duration;
    let isBonus = false;
    if (nextCombo > 0 && nextCombo % 5 === 0) {
      points = Math.floor(points * 1.25);
      isBonus = true;
    }

    // 3. 【重要】現在のレベルに基づく単価計算
    const unitPrice = getUnitPrice(stats.totalMinutes);
    const earnedMoney = Math.floor(points * unitPrice);

    const timestamp = new Date().toISOString();

    // 4. StudyQuestLogsテーブルに明細を保存 (単価と金額も記録)
    await docClient.send(new PutCommand({
      TableName: "StudyQuestLogs",
      Item: {
        userId: data.userId,
        timestamp: timestamp,
        date: todayStr,
        subject: data.subject,
        duration: data.duration,
        originalDuration: data.originalDuration,
        isEdited: data.isEdited,
        memo: data.memo,
        points: points,
        unitPrice: unitPrice, // その時の単価
        earnedMoney: earnedMoney, // その時の獲得金額
        isBonus: isBonus,
        status: "unpaid",
        createdAt: timestamp
      }
    }));
    
    return { 
      success: true, 
      points: points,
      earnedMoney: earnedMoney, // フロントエンドに返す
      isBonus: isBonus,
      newCombo: nextCombo 
    };
  } catch (error) {
    console.error("Save Study Log Error:", error);
    return { success: false };
  }
}

/**
 * 未精算の勉強ログをすべて取得する
 */
export async function getUnpaidLogs(userId: string) {
  try {
    const command = new ScanCommand({
      TableName: "StudyQuestLogs",
      FilterExpression: "userId = :uid AND #st = :status",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":uid": userId, ":status": "unpaid" }
    });
    
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error("Get Unpaid Logs Error:", error);
    return [];
  }
}

/**
 * 精算を実行（ステータスを paid にし、Stats の金額を 0 にリセット）
 */
export async function executeSettlement(userId: string, unpaidLogs: any[]) {
  try {
    for (const log of unpaidLogs) {
      await docClient.send(new PutCommand({
        TableName: "StudyQuestLogs",
        Item: {
          ...log,
          status: "paid",
          paidAt: new Date().toISOString()
        }
      }));
    }

    const currentStats = await getUserStats(userId);
    await docClient.send(new PutCommand({
      TableName: "UserStats",
      Item: {
        ...currentStats,
        totalPoints: 0, 
        totalMoney: 0,  
        lastSettledAt: new Date().toISOString()
      }
    }));

    return { success: true };
  } catch (error) {
    console.error("Settlement Error:", error);
    return { success: false };
  }
}
