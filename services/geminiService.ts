import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import { Post, PostWithApiKey } from '../types';

// --- CONFIGURATION ---
const POSTS_STORAGE_KEY = 'jengaTiktokScheduledPosts';

// --- DATABASE (localStorage) ---

function getStoredPosts(): PostWithApiKey[] {
    try {
        const stored = localStorage.getItem(POSTS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error("Failed to parse posts from localStorage", error);
        return [];
    }
}

function saveStoredPosts(posts: PostWithApiKey[]): void {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(posts));
}

// --- CLIENT-SIDE API ---

export async function getPosts(): Promise<Post[]> {
    const allPosts = getStoredPosts();
    // Omit sensitive data like API keys before returning to UI components
    return allPosts.map(({ tikTokApiKey, ...rest }) => rest);
}

export async function schedulePost(file: File, scheduleDate: string, tikTokApiKey: string): Promise<{ success: boolean }> {
    const mediaData = await fileToBase64(file);
    const allPosts = getStoredPosts();

    const newPost: PostWithApiKey = {
        id: uuidv4(),
        mediaUrl: mediaData,
        mediaType: file.type,
        scheduleDate,
        tikTokApiKey,
        status: 'Scheduled',
        caption: null,
    };

    allPosts.push(newPost);
    saveStoredPosts(allPosts);
    return { success: true };
}


// --- SCHEDULER & AI LOGIC ---

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. Post processing will fail.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const CAPTION_GENERATION_SYSTEM_INSTRUCTION = `You are a social media expert specializing in viral captions for TikTok. You will be given an image or video. Analyze the media and generate a short, engaging caption. The caption must be concise, catchy, under 150 characters, and include 3-5 relevant, trending hashtags and one or two emojis. The output must be the caption and hashtags only, as a single block of text.`;

async function generateCaptionForMedia(mediaDataUrl: string): Promise<string> {
    const [header, base64Data] = mediaDataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];

    if (!base64Data || !mimeType) {
        throw new Error("Invalid media data format for AI captioning.");
    }
    
    console.log(`[Agent] Generating caption for media type: ${mimeType}`);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Analyze this media and generate a viral TikTok caption." },
                { inlineData: { mimeType, data: base64Data } }
            ]
        },
        config: { systemInstruction: CAPTION_GENERATION_SYSTEM_INSTRUCTION, temperature: 0.9 }
    });
    return response.text.trim();
}

async function postToTikTok(apiKey: string, caption: string): Promise<{ success: boolean }> {
    console.log(`[Agent] Posting to TikTok with caption: "${caption}"`);
    console.log(`-> API Key used: ${apiKey.substring(0, 4)}...`);
    // Simulate network delay and potential failure
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ success: true });
        }, 2000);
    });
}

export async function processDuePosts(): Promise<boolean> {
    if (!process.env.API_KEY) {
        console.log("Cannot process posts, Gemini API key is missing.");
        return false; // No changes made
    }

    const now = new Date();
    let postsChanged = false;
    const allPosts = getStoredPosts();
    
    for (const post of allPosts) {
        if (post.status === 'Scheduled' && new Date(post.scheduleDate) <= now) {
            postsChanged = true;
            try {
                post.status = 'Posting';
                saveStoredPosts(allPosts); // Save intermediate 'Posting' state

                console.log(`[Scheduler] Processing post ${post.id}`);
                const caption = await generateCaptionForMedia(post.mediaUrl);
                post.caption = caption;

                await postToTikTok(post.tikTokApiKey, post.caption);

                post.status = 'Posted';
                console.log(`[Scheduler] Successfully posted ${post.id}`);

            } catch (error) {
                const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred during posting.';
                console.error(`[Scheduler] Failed to process post ${post.id}:`, error);
                post.status = 'Failed';
                post.errorMessage = errorMessage;
            }
        }
    }

    if (postsChanged) {
        saveStoredPosts(allPosts);
    }
    
    return postsChanged;
}


// --- HELPERS ---
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}