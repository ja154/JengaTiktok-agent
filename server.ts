import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenAI, Type } from "@google/genai";
import 'dotenv/config';

type LocalGenerationType = 'image' | 'video';

const app = express();
const port = 3001; 

app.use(cors());
app.use(express.json({ limit: '50mb' }));

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- AI AGENT SYSTEM INSTRUCTIONS ---
const PLANNER_SYSTEM_INSTRUCTION = `You are an AI agent's planning module. Your task is to analyze a user's instruction for creating a social media post and extract key information. The user instruction is: "{instruction}" Respond ONLY with a valid JSON object.`;
const PROMPT_ENGINEERING_SYSTEM_INSTRUCTION = `You are an expert image prompt engineer. Your role is to take a simple subject and expand it into a fully detailed prompt for a text-to-media generation model. Your detailed prompt must clearly describe the main subject, background, style, and mood. The output must be a single paragraph of text only.`;
const CAPTION_GENERATION_SYSTEM_INSTRUCTION = `You are a social media expert specializing in viral captions for TikTok. Take a description of media and generate a short, engaging caption. The caption must be concise, catchy, under 150 characters, and include 3-5 relevant, trending hashtags and one or two emojis. The output must be the caption and hashtags only, as a single block of text.`;

// --- AGENT LOGIC (INTERNAL FUNCTIONS) ---

async function planInstruction(instruction: string): Promise<{ mediaType: LocalGenerationType, subject: string }> {
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
    return plan;
}

async function engineerPrompt(subject: string): Promise<{ detailedPrompt: string }> {
    console.log(`[Agent] Engineering prompt for: "${subject}"`);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: subject,
        config: { systemInstruction: PROMPT_ENGINEERING_SYSTEM_INSTRUCTION, temperature: 0.8 }
    });
    return { detailedPrompt: response.text.trim() };
}

async function generateMedia(detailedPrompt: string, generationType: LocalGenerationType): Promise<{ mediaUrl: string }> {
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
    return { mediaUrl };
}

async function generateCaption(detailedPrompt: string): Promise<{ caption: string }> {
    console.log('[Agent] Generating caption...');
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Description of the media: "${detailedPrompt}"`,
        config: { systemInstruction: CAPTION_GENERATION_SYSTEM_INSTRUCTION, temperature: 0.9 }
    });
    return { caption: response.text.trim() };
}

async function postToTikTok(mediaUrl: string, caption: string, mediaType: LocalGenerationType, apiKey: string): Promise<{ message: string }> {
    console.log('[Agent] Simulating post to TikTok using API key...');
    console.log(`-> Caption: ${caption}`);
    console.log(`-> API Key used: ${apiKey.substring(0, 4)}...`);
    // In a real app, you would use the apiKey to authenticate with the TikTok API
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ message: 'Successfully posted to TikTok! (Simulated)' });
        }, 1500);
    });
}


// --- MAIN AUTONOMOUS AGENT ENDPOINT ---

const agentRouter = express.Router();

agentRouter.post('/execute', async (req: Request, res: Response) => {
    const { instruction, tikTokApiKey } = req.body;
    if (!instruction || !tikTokApiKey) {
        return res.status(400).json({ message: 'instruction and tikTokApiKey are required.' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const streamEvent = (type: 'log' | 'result' | 'error', data: any) => {
        const payload = type === 'log' || type === 'error' ? { type, message: data } : { type, payload: data };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
        streamEvent('log', '▶ Agent task started...');

        streamEvent('log', 'Step 1/5: Analyzing instruction...');
        const plan = await planInstruction(instruction);
        streamEvent('log', `-> Plan: Create a ${plan.mediaType} of "${plan.subject}"`);

        streamEvent('log', 'Step 2/5: Engineering detailed prompt...');
        const { detailedPrompt } = await engineerPrompt(plan.subject);
        streamEvent('log', '-> Prompt engineered successfully.');

        streamEvent('log', 'Step 3/5: Generating media... (this may take a minute)');
        const { mediaUrl } = await generateMedia(detailedPrompt, plan.mediaType);
        streamEvent('log', '-> Media generated!');

        streamEvent('log', 'Step 4/5: Writing a viral caption...');
        const { caption } = await generateCaption(detailedPrompt);
        streamEvent('log', '-> Caption ready.');

        streamEvent('log', 'Step 5/5: Posting to TikTok...');
        await postToTikTok(mediaUrl, caption, plan.mediaType, tikTokApiKey);
        streamEvent('log', '-> Successfully posted to TikTok! (Simulated)');

        const result = { mediaUrl, caption, mediaType: plan.mediaType, detailedPrompt };
        streamEvent('result', result);

    } catch (error) {
        const errorMessage = (error instanceof Error) ? error.message : 'An unknown server error occurred.';
        console.error('Error in /agent/execute:', error);
        streamEvent('error', errorMessage);
    } finally {
        res.end();
    }
});

app.use('/api/agent', agentRouter);

app.listen(port, () => {
    console.log(`JengaTiktok Agent server listening at http://localhost:${port}`);
});
