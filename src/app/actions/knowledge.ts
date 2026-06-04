"use server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// AWS クライアントの初期化（環境変数またはIAMロールから認証情報を自動取得）
const ddbClient = new DynamoDBClient({ region: "ap-northeast-1" });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const s3Client = new S3Client({ region: "ap-northeast-1" });

const TABLE_NAME = "study_quest-knowledge";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "study-quest-assets";

/**
 * ナレッジカードを新規保存する（画像はS3、データはDynamoDB）
 */
export async function saveKnowledgeCard(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const subject = formData.get("subject") as string;
    const title = formData.get("title") as string;
    const intro = formData.get("intro") as string;
    const contentData = formData.get("content") as string; // pakoで圧縮されたBase64文字列
    const imageFile = formData.get("image") as File | null;

    if (!userId || !subject || !title || !contentData) {
      return { success: false, error: "必要な項目が入力されていないよ。" };
    }

    // ユニークなカードIDを生成
    const cardId = `card_${new Date().toISOString().replace(/[-:.]/g, "")}_${Math.random().toString(36).substring(2, 9)}`;
    let imageUrl = "";

    // 1. 添付画像がある場合はS3にアップロード
    if (imageFile && imageFile.size > 0) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileExt = imageFile.name.split(".").pop() || "jpg";
      const s3Key = `knowledge-cards/${cardId}-${Date.now()}.${fileExt}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: imageFile.type,
        })
      );
      imageUrl = `https://${BUCKET_NAME}.s3.ap-northeast-1.amazonaws.com/${s3Key}`;
    }

    // 2. 圧縮データ対策
    // フロントエンド側（pako）で圧縮されたBase64文字列（先頭が 'eJy...' など）は、
    // パースを試みるとSyntaxErrorになるため、そのまま文字列としてDynamoDBに保存。
    // 万が一、従来の生JSONテキストが送られてきた場合のみパースしてオブジェクト型にする。
    let finalContent: any = contentData;
    if (contentData.trim().startsWith("{")) {
      try {
        finalContent = JSON.parse(contentData);
      } catch (e) {
        console.warn("JSONのパースに失敗したため、文字列のまま保存します。");
      }
    }

    // 3. DynamoDBに保存するデータ構造を作成
    const item = {
      userId,
      cardId,
      subject,
      title,
      intro,
      content: finalContent, // 圧縮文字列、またはオブジェクトが綺麗に格納されます
      imageUrl: imageUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    );

    return { success: true };
  } catch (error: any) {
    console.error("SAVE_KNOWLEDGE_CARD_FAILURE:", error);
    return { success: false, error: error.message || "データベースへの保存に失敗しちゃった。" };
  }
}

/**
 * ユーザーのナレッジカード一覧を取得（教科絞り込み対応）
 */
export async function getKnowledgeCards(userId: string, subjectTag?: string) {
  try {
    if (!userId) {
      return { success: false, error: "ユーザーIDが指定されていないよ。" };
    }

    let queryParams: any = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": userId,
      },
    };

    // 教科タグ（math, japanese等）が指定されている場合は、FilterExpressionで絞り込む
    if (subjectTag && subjectTag !== "all") {
      queryParams.FilterExpression = "subject = :sub";
      queryParams.ExpressionAttributeValues[":sub"] = subjectTag;
    }

    const data = await docClient.send(new QueryCommand(queryParams));

    // 作成日時の新しい順（降順）にソートして返却
    const sortedItems = (data.Items || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { success: true, items: sortedItems };
  } catch (error: any) {
    console.error("GET_KNOWLEDGE_CARDS_FAILURE:", error);
    return { success: false, error: error.message || "データの取得に失敗しちゃった。" };
  }
}
