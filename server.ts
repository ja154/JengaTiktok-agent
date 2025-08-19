import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import 'dotenv/config';

const app = express();
const port = 3001; 

app.use(cors());
app.use(express.json({ limit: '50mb' }));

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- AI AGENT SYSTEM INSTRUCTIONS ---

const PLANNER_SYSTEM_INSTRUCTION = `
You are an AI agent's planning module. Your task is to analyze a user's instruction for creating a social media post and extract key information.
The user instruction is: "{instruction}"
Respond ONLY with a valid JSON object.
`;

const PROMPT_ENGINEERING_SYSTEM_INSTRUCTION = `
You are an expert image prompt engineer. Your role is to take a simple subject and expand it into a fully detailed prompt for a text-to-media generation model. Your detailed prompt must clearly describe the main subject, background, style, and mood. The output must be a single paragraph of text only.
`;

const CAPTION_GENERATION_SYSTEM_INSTRUCTION = `
You are a social media expert specializing in viral captions for TikTok. Take a description of media and generate a short, engaging caption. The caption must be concise, catchy, under 150 characters, and include 3-5 relevant, trending hashtags and one or two emojis. The output must be the caption and hashtags only, as a single block of text.
`;


// --- AGENT API ENDPOINTS ---

const agentRouter = express.Router();

agentRouter.post('/plan', async (req: ExpressRequest, res: ExpressResponse) => {
    const { instruction } = req.body;
    if (!instruction) return res.status(400).json({ message: 'instruction is required.' });
    
    try {
        console.log(`[Agent] Planning for: "${instruction}"`);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `The user instruction is: "${instruction}"`,
            config: {
                systemInstruction: PLANNER_SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mediaType: { type: Type.STRING, description: 'Either "image" or "video"' },
                        subject: { type: Type.STRING, description: 'A concise description of the main subject.' }
                    }
                }
            }
        });

        const plan = JSON.parse(response.text);
        if (!['image', 'video'].includes(plan.mediaType)) {
             throw new Error(`Invalid mediaType received from planner: ${plan.mediaType}`);
        }
        res.json(plan);
    } catch (error) {
        console.error('Error in /agent/plan:', error);
        res.status(500).json({ message: (error as Error).message || 'Failed to create a plan.' });
    }
});

agentRouter.post('/engineer-prompt', async (req: ExpressRequest, res: ExpressResponse) => {
    const { subject } = req.body;
    if (!subject) return res.status(400).json({ message: 'subject is required.' });

    try {
        console.log(`[Agent] Engineering prompt for: "${subject}"`);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: subject,
            config: { systemInstruction: PROMPT_ENGINEERING_SYSTEM_INSTRUCTION, temperature: 0.8 }
        });
        res.json({ detailedPrompt: response.text.trim() });
    } catch (error) {
        console.error('Error in /agent/engineer-prompt:', error);
        res.status(500).json({ message: (error as Error).message || 'Failed to engineer prompt.' });
    }
});


agentRouter.post('/generate-media', async (req: ExpressRequest, res: ExpressResponse) => {
    const { detailedPrompt, generationType } = req.body;
    if (!detailedPrompt || !generationType) {
        return res.status(400).json({ message: 'detailedPrompt and generationType are required.' });
    }

    try {
        let mediaUrl = '';
        if (generationType === 'image') {
            console.log('[Agent] Generating image...');
            const response = await ai.models.generateImages({
                model: 'imagen-3.0-generate-002',
                prompt: detailedPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
            });
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            mediaUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
        } else if (generationType === 'video') {
            console.log('[Agent] Generating video...');
            let operation = await ai.models.generateVideos({
                model: 'veo-2.0-generate-001',
                prompt: detailedPrompt,
                config: { numberOfVideos: 1 }
            });
            while (!operation.done) {
                console.log('[Agent] Polling for video completion...');
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
            }
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) throw new Error('Video generation failed to return a download link.');
            
            const signedUrl = `${downloadLink}&key=${process.env.API_KEY}`;
            const videoResponse = await fetch(signedUrl);
            if (!videoResponse.ok) throw new Error(`Failed to fetch video from storage: ${videoResponse.statusText}`);
            const blob = await videoResponse.blob();
            const buffer = Buffer.from(await blob.arrayBuffer());
            mediaUrl = `data:video/mp4;base64,${buffer.toString('base64')}`;
        }
        res.json({ mediaUrl });
    } catch (error) {
        console.error('Error in /agent/generate-media:', error);
        res.status(500).json({ message: (error as Error).message || 'Failed to generate media.' });
    }
});


agentRouter.post('/generate-caption', async (req: ExpressRequest, res: ExpressResponse) => {
    const { detailedPrompt } = req.body;
    if (!detailedPrompt) return res.status(400).json({ message: 'detailedPrompt is required.' });
    
    try {
        console.log('[Agent] Generating caption...');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Description of the media: "${detailedPrompt}"`,
            config: { systemInstruction: CAPTION_GENERATION_SYSTEM_INSTRUCTION, temperature: 0.9 }
        });
        res.json({ caption: response.text.trim() });
    } catch (error) {
        console.error('Error in /agent/generate-caption:', error);
        res.status(500).json({ message: 'Could not generate a caption.' });
    }
});

agentRouter.post('/post', (req: ExpressRequest, res: ExpressResponse) => {
    const { mediaUrl, caption, mediaType } = req.body;
    if (!mediaUrl || !caption || !mediaType) {
        return res.status(400).json({ message: 'mediaUrl, caption, and mediaType are required.' });
    }
    console.log('[Agent] Simulating post to TikTok...');
    console.log(`-> Caption: ${caption}`);
    setTimeout(() => {
        res.status(200).json({ message: 'Successfully posted to TikTok! (Simulated)' });
    }, 1500);
});

app.use('/api/agent', agentRouter);

app.listen(port, () => {
    console.log(`JengaTiktok Agent server listening at http://localhost:${port}`);
});
