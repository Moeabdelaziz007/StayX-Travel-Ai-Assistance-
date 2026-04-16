import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { generateWithGroq } from '@/lib/groq';

const ai = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function generateAISummary(destination: string) {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, where("destination", "==", destination), limit(50));
  const snapshot = await getDocs(q);
  
  const reviews = snapshot.docs.map(doc => doc.data());
  const reviewCount = reviews.length;

  if (reviewCount < 10 || reviewCount % 10 !== 0) return null;

  const reviewTexts = reviews.map(r => `Rating: ${r.rating}/5, Title: ${r.title}, Body: ${r.body}`).join("\n---\n");

  let summary = "No summary available.";
  const prompt = `Summarize these ${reviewCount} travel reviews for ${destination}. Create a balanced summary covering: overall sentiment, what travelers love most, common complaints, best time to visit based on reviews, who this destination is best for. Keep it under 150 words and sound like a knowledgeable local guide.\n\n${reviewTexts}`;

  try {
    if (process.env.GROQ_API_KEY) {
      // Use Groq (llama3-8b) for cost-effective summarization
      summary = await generateWithGroq(prompt, "You are an expert travel analyst.", "llama3-8b-8192");
    } else {
      // Fallback to Gemini if Groq is not configured
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      summary = response.text || summary;
    }
  } catch (error) {
    console.warn("Primary AI failed, falling back to Gemini", error);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });
      summary = response.text || summary;
    } catch (geminiError) {
      console.error("All AI models failed:", geminiError);
    }
  }
  
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount;

  await setDoc(doc(db, "destinations", destination, "aiSummary", "latest"), {
    text: summary,
    generatedAt: serverTimestamp(),
    reviewCount,
    avgRating
  });

  return summary;
}
