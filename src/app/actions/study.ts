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
    const stats = await getUserStats(data.userId);
    const today = new Date();
    const todayStr = today.toLocaleDateString("ja-JP", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit" 
    }).replaceAll("/", "-");
    
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

    let points = data.duration;
    let isBonus = false;

    if (nextCombo > 0 && nextCombo % 5 === 0) {
      points = Math.floor(points * 1.25);
      isBonus = true;
    }

    const timestamp = new Date().toISOString();

    // 1. StudyQuestLogsテーブルに明細を保存 (status: unpaid を追加)
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
        isBonus: isBonus,
        status: "unpaid", // 未精算フラグ
        createdAt: timestamp
      }
    }));
    
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

/**
 * 未精算の勉強ログをすべて取得する（パパ管理画面用）
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
    // 1. 対象の全ログを "paid" に更新
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

    // 2. UserStats の残高を 0 にリセット
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
