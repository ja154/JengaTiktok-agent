export type PostStatus = 'Scheduled' | 'Posting' | 'Posted' | 'Failed';

// Public-facing Post object for UI components
export interface Post {
  id: string;
  mediaUrl: string; 
  mediaType: string;
  scheduleDate: string;
  status: PostStatus;
  caption: string | null;
  errorMessage?: string;
}

// Internal representation including the API key, stored in localStorage
export interface PostWithApiKey extends Post {
  tikTokApiKey: string;
}
