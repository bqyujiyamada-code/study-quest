"use server";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const awsCredentials = {
  region: "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const docClient = DynamoDBDocumentClient.from(new DynamoDBClient(awsCredentials));
const s3Client = new S3Client(awsCredentials);

const TABLE_NAME = "study-quest-knowledge";
const GSI_NAME = "subject-createdAt-index";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "study-quest-assets";

export type KnowledgeCardContent = {
  titleKana: string;
  intro: string;
  essence: string;
  difference: string;
  forkInTheRoad: string;
  weapon: string;
  degreeOfAppearance: string;
  keyPoints: string[];
  logicalSteps: string[];
  formula: string;
  formulaDetail: string;
  typicalPatternName: string;
  typicalPatternRule: string;
  reproducibilityTip: string;
};

/**
 * 内部ロジック: S3への画像アップロード
 */
async function uploadImageToS3(file: File, cardId: string): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop() || "png";
    const s3Key = `knowledge-cards/${cardId}-${Date.now()}.${extension}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
    }));

    return `https://${BUCKET_NAME}.s3.ap-northeast-1.amazonaws.com/${s3Key}`;
  } catch (error) {
    console.error("S3 Upload Error:", error);
    throw new Error("S3への画像アップロードに失敗したよ。");
  }
}

/**
 * 1. ナレッジカードの新規登録 (S3 & DynamoDB連動)
 */
export async function saveKnowledgeCard(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const subject = formData.get("subject") as string;
    const title = formData.get("title") as string;
    const intro = formData.get("intro") as string;
    const contentRaw = formData.get("content") as string;
    const imageFile = formData.get("image") as File | null;

    if (!userId || !subject || !title || !contentRaw) {
      return { success: false, error: "必要なデータが不足しているよ。" };
    }

    const content: KnowledgeCardContent = JSON.parse(contentRaw);
    const now = new Date().toISOString();
    const timestamp = now.replace(/[:.-]/g, ""); 
    const cardId = `card_${timestamp}`;

    let imageUrl = "";
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImageToS3(imageFile, cardId);
    }

    const item = {
      userId,
      cardId,
      subject,
      title,
      titleKana: content.titleKana || "", // 検索用のひらがなをトップレベルに配置
      intro,
      imageUrl,
      content,
      createdAt: now,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    return { success: true, cardId };
  } catch (error: any) {
    console.error("Save Knowledge Card Action Error:", error);
    return { success: false, error: error.message || "ナレッジカードの保存に失敗したよ。" };
  }
}

/**
 * 2. ナレッジカードの一覧取得 ＆ 教科タグ絞り込み
 */
export async function getKnowledgeCards(userId: string, subjectTag?: string) {
  try {
    let command;
    if (subjectTag) {
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: "subject = :subject",
        FilterExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":subject": subjectTag,
          ":userId": userId,
        },
        ScanIndexForward: false,
      });
    } else {
      command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId,
        },
        ScanIndexForward: false,
      });
    }

    const response = await docClient.send(command);
    return { success: true, items: response.Items || [] };
  } catch (error) {
    console.error("DynamoDB Get Knowledge Cards Error:", error);
    return { success: false, items: [], error: "データの読み込みに失敗したよ。" };
  }
}
