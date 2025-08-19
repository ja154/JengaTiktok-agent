import { GenerationType } from '../App';

const API_BASE_URL = '/api/agent';

async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

export async function planInstruction(instruction: string): Promise<{ mediaType: GenerationType, subject: string }> {
    const response = await fetch(`${API_BASE_URL}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction }),
    });
    return handleResponse(response);
}

export async function engineerPrompt(subject: string): Promise<{ detailedPrompt: string }> {
    const response = await fetch(`${API_BASE_URL}/engineer-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject }),
    });
    return handleResponse(response);
}

export async function generateMedia(detailedPrompt: string, generationType: GenerationType): Promise<{ mediaUrl: string }> {
    const response = await fetch(`${API_BASE_URL}/generate-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailedPrompt, generationType }),
    });
    return handleResponse(response);
}

export async function generateCaption(detailedPrompt: string): Promise<{ caption: string }> {
    const response = await fetch(`${API_BASE_URL}/generate-caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ detailedPrompt }),
    });
    return handleResponse(response);
}

export async function postToTikTok(mediaUrl: string, caption: string, mediaType: GenerationType): Promise<{ message: string }> {
     const response = await fetch(`${API_BASE_URL}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl, caption, mediaType }),
    });
    return handleResponse(response);
}