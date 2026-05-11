import { GoogleGenerativeAI } from "@google/generative-ai";
import { YoutubeTranscript } from "youtube-transcript";

function getModel() {
  if (!process.env.GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
}

function extractYouTubeVideoId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { youtubeUrl, questionCount = 10 } = req.body;

  if (!youtubeUrl) {
    return res.status(400).json({ error: 'youtubeUrl is required' });
  }

  try {
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    let transcript = '';
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      transcript = transcriptItems.map(item => item.text).join(" ");
    } catch (err) {
      return res.status(400).json({ error: 'Could not fetch transcript for this video. The video might not have captions enabled or YouTube is blocking the request.' });
    }

    const model = getModel();
    if (!model) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });
    }

    const prompt = `Analyze this transcript and return ONLY a JSON object:
    {
      "summary": "2 sentence summary",
      "keyTopics": ["topic1", "topic2"],
      "questions": [{"questionText": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctOption": "A", "topic": "...", "explanation": "..."}]
    }
    Generate exactly ${questionCount} questions. STRICTLY base your summary, key topics, and questions ONLY on the provided transcript. Do not include external knowledge or hallucinate facts that are not in the video. If the transcript is empty or generic, return generic questions, but otherwise stick to the facts in the text.
    Transcript: ${transcript.substring(0, 50000)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Invalid AI response from Gemini' });
    }
    
    const analysis = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      success: true,
      data: {
        youtubeUrl,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        questions: analysis.questions
      }
    });

  } catch (error) {
    console.error("Analysis Error:", error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
