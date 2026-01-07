/**
 * Nextcloud Talk Client
 * API client for Nextcloud Talk (Spreed) messaging
 * 
 * API Base: /ocs/v2.php/apps/spreed/api/v4
 * Docs: https://nextcloud-talk.readthedocs.io/en/latest/
 */

const NEXTCLOUD_URL = process.env.NEXTCLOUD_URL || 'http://localhost:8080';
const NEXTCLOUD_USER = process.env.NEXTCLOUD_ADMIN_USER || 'admin';
const NEXTCLOUD_PASSWORD = process.env.NEXTCLOUD_ADMIN_PASSWORD || '';

const API_BASE = `${NEXTCLOUD_URL}/ocs/v2.php/apps/spreed/api/v4`;

// Conversation types
export const ConversationType = {
    ONE_TO_ONE: 1,
    GROUP: 2,
    PUBLIC: 3,
    CHANGELOG: 4,
} as const;

// Participant types
export const ParticipantType = {
    OWNER: 1,
    MODERATOR: 2,
    USER: 3,
    GUEST: 4,
    USER_SELF_JOINED: 5,
    GUEST_MODERATOR: 6,
} as const;

export interface Conversation {
    token: string;
    name: string;
    displayName: string;
    type: number;
    participantType: number;
    unreadMessages: number;
    lastMessage?: Message;
    lastReadMessage?: number;
    hasPassword: boolean;
    isFavorite: boolean;
    canLeaveConversation: boolean;
    canDeleteConversation: boolean;
    notificationLevel: number;
}

export interface Message {
    id: number;
    token: string;
    actorType: string;
    actorId: string;
    actorDisplayName: string;
    timestamp: number;
    message: string;
    messageParameters: Record<string, unknown>;
    systemMessage: string;
    messageType: string;
    isReplyable: boolean;
    reactions?: Record<string, number>;
}

export interface Participant {
    attendeeId: number;
    actorType: string;
    actorId: string;
    displayName: string;
    participantType: number;
    lastPing: number;
    inCall: number;
}

/**
 * Create authorization header
 */
const getAuthHeaders = (userOverride?: string, passOverride?: string): HeadersInit => {
    const user = userOverride || NEXTCLOUD_USER;
    const pass = passOverride || NEXTCLOUD_PASSWORD;
    const basicAuth = Buffer.from(`${user}:${pass}`).toString('base64');

    return {
        'Authorization': `Basic ${basicAuth}`,
        'OCS-APIRequest': 'true',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
};

/**
 * Make API request to Nextcloud Talk
 */
const talkRequest = async <T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object,
    userOverride?: string,
    passOverride?: string
): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: getAuthHeaders(userOverride, passOverride),
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`Talk API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.ocs?.data as T;
};

// ============================================================================
// Conversation APIs
// ============================================================================

/**
 * Get all conversations for the user
 */
export const getConversations = async (
    userOverride?: string,
    passOverride?: string
): Promise<Conversation[]> => {
    return talkRequest<Conversation[]>('/room', 'GET', undefined, userOverride, passOverride);
};

/**
 * Get a single conversation by token
 */
export const getConversation = async (
    token: string,
    userOverride?: string,
    passOverride?: string
): Promise<Conversation> => {
    return talkRequest<Conversation>(`/room/${token}`, 'GET', undefined, userOverride, passOverride);
};

/**
 * Create a new conversation
 */
export const createConversation = async (
    roomType: number,
    roomName: string,
    invite?: string, // User ID for 1-on-1
    userOverride?: string,
    passOverride?: string
): Promise<Conversation> => {
    const body: Record<string, unknown> = {
        roomType,
        roomName,
    };

    if (invite) {
        body.invite = invite;
    }

    return talkRequest<Conversation>('/room', 'POST', body, userOverride, passOverride);
};

/**
 * Create or get 1-on-1 conversation with a user
 */
export const getOrCreateOneToOne = async (
    userId: string,
    userOverride?: string,
    passOverride?: string
): Promise<Conversation> => {
    return createConversation(ConversationType.ONE_TO_ONE, '', userId, userOverride, passOverride);
};

/**
 * Delete/leave a conversation
 */
export const leaveConversation = async (
    token: string,
    userOverride?: string,
    passOverride?: string
): Promise<void> => {
    await talkRequest(`/room/${token}/participants/self`, 'DELETE', undefined, userOverride, passOverride);
};

/**
 * Set conversation name
 */
export const renameConversation = async (
    token: string,
    roomName: string,
    userOverride?: string,
    passOverride?: string
): Promise<void> => {
    await talkRequest(`/room/${token}`, 'PUT', { roomName }, userOverride, passOverride);
};

// ============================================================================
// Message APIs
// ============================================================================

/**
 * Get messages from a conversation
 */
export const getMessages = async (
    token: string,
    options?: {
        limit?: number;
        lookIntoFuture?: 0 | 1;
        lastKnownMessageId?: number;
        timeout?: number;
    },
    userOverride?: string,
    passOverride?: string
): Promise<Message[]> => {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.lookIntoFuture !== undefined) params.set('lookIntoFuture', options.lookIntoFuture.toString());
    if (options?.lastKnownMessageId) params.set('lastKnownMessageId', options.lastKnownMessageId.toString());
    if (options?.timeout) params.set('timeout', options.timeout.toString());

    const query = params.toString() ? `?${params}` : '';
    return talkRequest<Message[]>(`/chat/${token}${query}`, 'GET', undefined, userOverride, passOverride);
};

/**
 * Send a message to a conversation
 */
export const sendMessage = async (
    token: string,
    message: string,
    replyTo?: number,
    userOverride?: string,
    passOverride?: string
): Promise<Message> => {
    const body: Record<string, unknown> = { message };
    if (replyTo) {
        body.replyTo = replyTo;
    }

    return talkRequest<Message>(`/chat/${token}`, 'POST', body, userOverride, passOverride);
};

/**
 * Delete a message
 */
export const deleteMessage = async (
    token: string,
    messageId: number,
    userOverride?: string,
    passOverride?: string
): Promise<void> => {
    await talkRequest(`/chat/${token}/${messageId}`, 'DELETE', undefined, userOverride, passOverride);
};

/**
 * Mark conversation as read
 */
export const markConversationRead = async (
    token: string,
    userOverride?: string,
    passOverride?: string
): Promise<void> => {
    await talkRequest(`/chat/${token}/read`, 'POST', undefined, userOverride, passOverride);
};

// ============================================================================
// Participant APIs
// ============================================================================

/**
 * Get participants of a conversation
 */
export const getParticipants = async (
    token: string,
    userOverride?: string,
    passOverride?: string
): Promise<Participant[]> => {
    return talkRequest<Participant[]>(`/room/${token}/participants`, 'GET', undefined, userOverride, passOverride);
};

/**
 * Add a user to a conversation
 */
export const addParticipant = async (
    token: string,
    userId: string,
    userOverride?: string,
    passOverride?: string
): Promise<void> => {
    await talkRequest(`/room/${token}/participants`, 'POST', {
        newParticipant: userId,
        source: 'users',
    }, userOverride, passOverride);
};

/**
 * Remove a participant from a conversation
 */
export const removeParticipant = async (
    token: string,
    attendeeId: number,
    userOverride?: string,
    passOverride?: string
): Promise<void> => {
    await talkRequest(`/room/${token}/attendees`, 'DELETE', { attendeeId }, userOverride, passOverride);
};

export default {
    getConversations,
    getConversation,
    createConversation,
    getOrCreateOneToOne,
    leaveConversation,
    renameConversation,
    getMessages,
    sendMessage,
    deleteMessage,
    markConversationRead,
    getParticipants,
    addParticipant,
    removeParticipant,
    ConversationType,
    ParticipantType,
};
