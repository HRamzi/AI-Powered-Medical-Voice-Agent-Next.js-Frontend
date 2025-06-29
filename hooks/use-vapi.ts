'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

interface UseVapiProps {
  apiKey: string;
  assistantId?: string;
}

interface TranscriptMessage {
  role: string;
  text: string;
  timestamp: Date;
}

interface UseVapiReturn {
  // State
  isSessionActive: boolean;
  isSpeaking: boolean;
  volumeLevel: number;
  conversation: TranscriptMessage[];
  error: string | null;
  
  // Actions
  startCall: (customAssistantId?: string) => Promise<void>;
  endCall: () => Promise<void>;
  toggleCall: (customAssistantId?: string) => Promise<void>;
  clearError: () => void;
  clearConversation: () => void;
  
  // Vapi instance (for advanced usage)
  vapiInstance: Vapi | null;
}

export const useVapi = ({ apiKey, assistantId }: UseVapiProps): UseVapiReturn => {
  // State management
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [conversation, setConversation] = useState<TranscriptMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [vapiInstance, setVapiInstance] = useState<Vapi | null>(null);
  
  const vapiRef = useRef<Vapi | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize Vapi instance
  const initializeVapi = useCallback(() => {
    if (!apiKey || isInitializedRef.current) return;

    try {
      console.log('🚀 Initializing Vapi with API key:', apiKey.substring(0, 8) + '...');
      
      const vapi = new Vapi(apiKey);
      vapiRef.current = vapi;
      setVapiInstance(vapi);
      isInitializedRef.current = true;

      // Call lifecycle events
      vapi.on('call-start', () => {
        console.log('📞 Call started');
        setIsSessionActive(true);
        setError(null);
      });

      vapi.on('call-end', () => {
        console.log('📱 Call ended');
        setIsSessionActive(false);
        setIsSpeaking(false);
        setVolumeLevel(0);
      });

      // Speech detection
      vapi.on('speech-start', () => {
        console.log('🗣️ Assistant started speaking');
        setIsSpeaking(true);
      });

      vapi.on('speech-end', () => {
        console.log('🤐 Assistant stopped speaking');
        setIsSpeaking(false);
      });

      // Volume monitoring for visual feedback
      vapi.on('volume-level', (volume: number) => {
        setVolumeLevel(volume);
      });

      // Message handling - transcript collection
      vapi.on('message', (message: any) => {
        console.log('💬 Vapi message:', message);
        
        // Handle final transcripts only (avoid duplicates)
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setConversation(prev => [...prev, {
            role: message.role,
            text: message.transcript,
            timestamp: new Date()
          }]);
        }
        
        // Handle function calls (if needed for medical tools)
        if (message.type === 'function-call') {
          console.log('🔧 Function call:', message.functionCall);
        }
        
        // Handle status updates
        if (message.type === 'status-update') {
          console.log('📊 Status update:', message.status);
        }
      });

      // Error handling
      vapi.on('error', (err: any) => {
        console.error('❌ Vapi error:', err);
        setError(err?.message || 'Voice assistant error occurred');
        setIsSessionActive(false);
        setIsSpeaking(false);
      });

      console.log('✅ Vapi initialized successfully');

    } catch (err: any) {
      console.error('💥 Failed to initialize Vapi:', err);
      setError(err?.message || 'Failed to initialize voice assistant');
    }
  }, [apiKey]);

  // Start a voice call
  const startCall = useCallback(async (customAssistantId?: string) => {
    const targetAssistantId = customAssistantId || assistantId;
    
    if (!vapiRef.current) {
      setError('Voice assistant not initialized');
      return;
    }
    
    if (!targetAssistantId) {
      setError('No assistant ID provided');
      return;
    }

    try {
      console.log('🎬 Starting call with assistant:', targetAssistantId);
      await vapiRef.current.start(targetAssistantId);
      setConversation([]); // Clear previous conversation
      setError(null);
    } catch (err: any) {
      console.error('❌ Error starting call:', err);
      setError(err?.message || 'Failed to start voice call');
    }
  }, [assistantId]);

  // End the current call
  const endCall = useCallback(async () => {
    if (!vapiRef.current) return;

    try {
      console.log('⏹️ Ending call');
      await vapiRef.current.stop();
      setError(null);
    } catch (err: any) {
      console.error('❌ Error ending call:', err);
      setError(err?.message || 'Failed to end call');
    }
  }, []);

  // Toggle call state
  const toggleCall = useCallback(async (customAssistantId?: string) => {
    if (isSessionActive) {
      await endCall();
    } else {
      await startCall(customAssistantId);
    }
  }, [isSessionActive, startCall, endCall]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear conversation history
  const clearConversation = useCallback(() => {
    setConversation([]);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeVapi();

    // Cleanup on unmount
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop().catch(console.error);
        vapiRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [initializeVapi]);

  return {
    // State
    isSessionActive,
    isSpeaking,
    volumeLevel,
    conversation,
    error,
    
    // Actions
    startCall,
    endCall,
    toggleCall,
    clearError,
    clearConversation,
    
    // Advanced
    vapiInstance
  };
};

export default useVapi;