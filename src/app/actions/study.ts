"use server";

import { GetCommand, PutCommand, ScanCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db as docClient } from "@/lib/db";
import { getUnitPrice } from "@/lib/levels";
import type { StudyLog, UserStats } from "@/lib/types";

/**
 * ユーザーの現在のステータスを取得
 */
export async function getUserStats(userId: string): Promise<UserStats> {
  try {
    const command = new GetCommand({
      TableName: "UserStats",
      Key: { userId },
    });
    const response = await docClient.send(command);

    return (response.Item as UserStats | undefined) || {
      userId,
      totalMinutes: 0,
      totalPoints: 0,
      totalMoney: 0,
      combo: 0,
      lastDate: ""
    };
  } catch (error) {
    console.error("DynamoDB Get Error:", error);
    return { userId, totalMinutes: 0, totalPoints: 0, totalMoney: 0, combo: 0, lastDate: "" };
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
 * 個別の勉強ログ保存
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
      // 文字列の比較ではなく、日付オブジェクトとして「日」の差分を計算
      const lastDateObj = new Date(stats.lastDate);
      const todayObj = new Date(todayStr);
      
      // ミリ秒差分を日数に変換（誤差回避のためroundを使用）
      const diffTime = todayObj.getTime() - lastDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (stats.lastDate === todayStr) {
        // 同じ日の2回目以降の学習ならコンボ維持
        nextCombo = stats.combo;
      } else if (diffDays === 1) {
        // 前回の勉強が「昨日」ならコンボ加算
        nextCombo = stats.combo + 1;
      } else {
        // 2日以上空いたらリセット
        nextCombo = 1;
      }
    }

    // ポイント計算（5回おきのコンボボーナス 1.25倍）
    let points = data.duration;
    let isBonus = false;
    if (nextCombo > 0 && nextCombo % 5 === 0) {
      points = Math.floor(points * 1.25);
      isBonus = true;
    }

    const unitPrice = getUnitPrice(stats.totalMinutes);
    const earnedMoney = Math.floor(points * unitPrice);
    const timestamp = new Date().toISOString();

    // ログの保存
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
        unitPrice: unitPrice,
        earnedMoney: earnedMoney,
        isBonus: isBonus,
        status: "unpaid",
        createdAt: timestamp
      }
    }));
    
    return { 
      success: true, 
      points: points,
      earnedMoney: earnedMoney,
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
export async function getUnpaidLogs(userId: string): Promise<StudyLog[]> {
  try {
    const items: StudyLog[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const response = await docClient.send(new ScanCommand({
        TableName: "StudyQuestLogs",
        FilterExpression: "userId = :uid AND #st = :status",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":uid": userId, ":status": "unpaid" },
        ExclusiveStartKey,
      }));
      items.push(...((response.Items as StudyLog[] | undefined) ?? []));
      ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items;
  } catch (error) {
    console.error("Get Unpaid Logs Error:", error);
    return [];
  }
}

/**
 * すべての勉強ログ（履歴用）を取得する
 */
export async function getAllStudyLogs(userId: string): Promise<StudyLog[]> {
  try {
    const items: StudyLog[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;

    do {
      const response = await docClient.send(new QueryCommand({
        TableName: "StudyQuestLogs",
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId },
        ScanIndexForward: false, // 降順（新しい順）で取得
        ExclusiveStartKey,
      }));
      items.push(...((response.Items as StudyLog[] | undefined) ?? []));
      ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items;
  } catch (error) {
    console.error("Get All Logs Error:", error);
    return [];
  }
}

/**
 * 精算を実行
 */
export async function executeSettlement(userId: string, unpaidLogs: StudyLog[]) {
  try {
    // 1. 各ログのステータスをpaidに更新（対象フィールドのみ。丸ごとPutし直すと
    //    Scan取得後に他で更新された値を巻き戻すリスクがあるため）
    const paidAt = new Date().toISOString();
    for (const log of unpaidLogs) {
      await docClient.send(new UpdateCommand({
        TableName: "StudyQuestLogs",
        Key: { userId: log.userId, timestamp: log.timestamp },
        UpdateExpression: "set #st = :paid, paidAt = :paidAt",
        ExpressionAttributeNames: { "#st": "status" },
        ExpressionAttributeValues: { ":paid": "paid", ":paidAt": paidAt },
      }));
    }

    // 2. 累計ステータスのお小遣い(totalMoney)を0にリセット
    await docClient.send(new UpdateCommand({
      TableName: "UserStats",
      Key: { userId },
      UpdateExpression: "set totalMoney = :zero, lastSettledAt = :now",
      ExpressionAttributeValues: { ":zero": 0, ":now": paidAt },
    }));

    return { success: true };
  } catch (error) {
    console.error("Settlement Error:", error);
    return { success: false };
  }
}
