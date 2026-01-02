
import { GoogleGenAI } from "@google/genai";
import { MonthlySummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMonthlyInsight = async (summaries: MonthlySummary[], monthLabel: string) => {
  const prompt = `
    Based on the following monthly sales data for ${monthLabel}, provide a professional 3-sentence summary for the boss.
    Mention the top performer, the ratio between online and cash payments, and a brief suggestion for improvement.
    
    Data: ${JSON.stringify(summaries)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "无法生成AI总结，请手动查看数据报表。";
  }
};
