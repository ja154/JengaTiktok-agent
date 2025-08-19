import { AgentResult } from '../App';

const API_BASE_URL = '/api/agent';

interface StreamEventLog {
    type: 'log';
    message: string;
}
interface StreamEventResult {
    type: 'result';
    payload: AgentResult;
}
interface StreamEventError {
    type: 'error';
    message: string;
}

type StreamEvent = StreamEventLog | StreamEventResult | StreamEventError;


export async function* executeAutonomousAgent(instruction: string, tikTokApiKey: string): AsyncGenerator<StreamEvent> {
    const response = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ instruction, tikTokApiKey }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message);
    }
    
    if (!response.body) {
        throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep the last, possibly incomplete, line

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonString = line.substring(6);
                try {
                    const event = JSON.parse(jsonString) as StreamEvent;
                    yield event;
                } catch (e) {
                    console.error("Failed to parse stream event:", jsonString);
                }
            }
        }
    }
}