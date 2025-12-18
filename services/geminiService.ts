import { ReflectionResponse, ChatMessage } from "../types";
import { GoogleGenAI } from "@google/genai";

export const evaluateReflection = async (
  videoTitle: string,
  videoDescription: string,
  reflection: string
): Promise<ReflectionResponse> => {
  // 擬似的なネットワーク遅延
  await new Promise(resolve => setTimeout(resolve, 800));

  const trimmed = reflection.trim();
  const minLength = 30;

  if (trimmed.length < minLength) {
    return {
      passed: false,
      feedback: `感想が短すぎます。あと${minLength - trimmed.length}文字以上記述してください。具体的な学びを書きましょう。`
    };
  }

  const ngWords = ["あああ", "テスト", "test"];
  if (ngWords.some(word => trimmed.includes(word))) {
    return {
      passed: false,
      feedback: "不適切な内容が含まれているか、意味のない文字列の可能性があります。真面目に感想を書いてください。"
    };
  }

  return {
    passed: true,
    feedback: "確認しました！素晴らしい振り返りです。次のチャプターへ進んでください。"
  };
};

export const getAIChatResponse = async (
  message: string,
  videoTitle: string,
  videoDescription: string,
  history: ChatMessage[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // 過去の会話履歴をGeminiの形式に変換
    // 最後のメッセージはここに含まれず、sendMessageの引数になる
    const chatHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const systemInstruction = `
あなたは調剤報酬および医療事務の専門家AIアシスタントです。
現在ユーザーは動画教材「${videoTitle}」を視聴しています。
動画の概要: ${videoDescription}

ユーザーからの質問に対して、この動画の文脈を踏まえつつ、初心者にもわかりやすく丁寧に回答してください。
動画の内容と関係のない質問には、軽く応じつつ、医療事務や調剤報酬の学習に戻るよう促してください。
回答は日本語で、簡潔かつ具体的にお願いします。
    `;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: chatHistory,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    const result = await chat.sendMessage({ message: message });
    return result.text || "申し訳ありません。回答を生成できませんでした。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AIアシスタントとの接続に失敗しました。時間をおいて再度お試しください。";
  }
};