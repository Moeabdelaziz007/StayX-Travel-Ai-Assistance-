import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

export async function generateAISummary(destination: string) {
  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, where("destination", "==", destination), limit(50));
  const snapshot = await getDocs(q);
  
  const reviews = snapshot.docs.map(doc => doc.data());
  const reviewCount = reviews.length;

  if (reviewCount < 10 || reviewCount % 10 !== 0) return null;

  const reviewTexts = reviews.map(r => `Rating: ${r.rating}/5, Title: ${r.title}, Body: ${r.body}`).join("\n---\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Summarize these ${reviewCount} travel reviews for ${destination}. Create a balanced summary covering: overall sentiment, what travelers love most, common complaints, best time to visit based on reviews, who this destination is best for. Keep it under 150 words and sound like a knowledgeable local guide.\n\n${reviewTexts}`,
  });

  const summary = response.text || "No summary available.";
  
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount;

  await setDoc(doc(db, "destinations", destination, "aiSummary", "latest"), {
    text: summary,
    generatedAt: serverTimestamp(),
    reviewCount,
    avgRating
  });

  return summary;
}
