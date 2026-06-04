"use server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// AWS クライアントの初期化
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
      imageUrl = `https://d3nkmrk6hg66h7.cloudfront.net/${s3Key}`;
    }

    // 2. 圧縮データ対策
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
      content: finalContent,
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

    if (subjectTag && subjectTag !== "all") {
      queryParams.FilterExpression = "subject = :sub";
      queryParams.ExpressionAttributeValues[":sub"] = subjectTag;
    }

    const data = await docClient.send(new QueryCommand(queryParams));

    // 作成日時の新しい順（降順）にソート
    const sortedItems = (data.Items || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return { success: true, items: sortedItems };
  } catch (error: any) {
    console.error("GET_KNOWLEDGE_CARDS_FAILURE:", error);
    return { success: false, error: error.message || "データの取得に失敗しちゃった。" };
  }
}

/**
 * ナレッジカードを削除する（S3の画像も連動して完全自動クリーンアップ）
 */
export async function deleteKnowledgeCard(userId: string, cardId: string) {
  try {
    if (!userId || !cardId) {
      return { success: false, error: "ユーザーIDまたはカードIDが足りません。" };
    }

    // 1. まず現在のレコードから画像のURLがあるか調べる
    const getResult = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId, cardId },
      })
    );

    const targetItem = getResult.Item;
    if (!targetItem) {
      return { success: false, error: "削除対象のカードが見つかりませんでした。" };
    }

    // 2. S3の画像URLがある場合、S3からアセットを完全削除
    if (targetItem.imageUrl) {
      try {
        const urlParts = targetItem.imageUrl.split(".amazonaws.com/");
        if (urlParts.length === 2) {
          const s3Key = urlParts[1];

          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: s3Key,
            })
          );
          console.log(`S3の画像を削除しました: ${s3Key}`);
        }
      } catch (s3Error) {
        console.error("S3_IMAGE_DELETE_FAILURE (Non-blocking):", s3Error);
      }
    }

    // 3. DynamoDBからレコードを削除
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, cardId },
      })
    );

    console.log(`DynamoDBからカードを削除しました: ${cardId}`);
    return { success: true };
  } catch (error: any) {
    console.error("DELETE_KNOWLEDGE_CARD_FAILURE:", error);
    return { success: false, error: error.message || "カードの削除に失敗しちゃいました。" };
  }
}
