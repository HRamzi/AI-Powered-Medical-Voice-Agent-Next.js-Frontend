'use client';

import React, { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

interface VapiWidgetProps {
  apiKey: string;
  assistantId: string;
  config?: Record<string, unknown>;
}

const VapiWidget: React.FC<VapiWidgetProps> = ({ 
  apiKey, 
  assistantId, 
  config = {} 
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{role: string, text: string}>>([]);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const vapiRef = useRef<Vapi | null>(null);

  useEffect(() => {
    try {
      const vapiInstance = new Vapi(apiKey);
      setVapi(vapiInstance);
      vapiRef.current = vapiInstance;

      // Call lifecycle events
      vapiInstance.on('call-start', () => {
        console.log('Call started');
        setIsConnected(true);
        setError(null);
      });

      vapiInstance.on('call-end', () => {
        console.log('Call ended');
        setIsConnected(false);
        setIsSpeaking(false);
        setVolumeLevel(0);
      });

      // Speech events
      vapiInstance.on('speech-start', () => {
        console.log('Assistant started speaking');
        setIsSpeaking(true);
      });

      vapiInstance.on('speech-end', () => {
        console.log('Assistant stopped speaking');
        setIsSpeaking(false);
      });

      // Volume monitoring
      vapiInstance.on('volume-level', (volume: number) => {
        setVolumeLevel(volume);
      });

      // Message handling
      vapiInstance.on('message', (message: any) => {
        console.log('Vapi message:', message);
        
        if (message.type === 'transcript' && message.transcriptType === 'final') {
          setTranscript(prev => [...prev, {
            role: message.role,
            text: message.transcript
          }]);
        }
      });

      // Error handling
      vapiInstance.on('error', (error: any) => {
        console.error('Vapi error:', error);
        setError(error?.message || 'An error occurred');
        setIsConnected(false);
      });

      return () => {
        if (vapiRef.current) {
          vapiRef.current.stop();
          vapiRef.current = null;
        }
      };
    } catch (err: any) {
      console.error('Failed to initialize Vapi:', err);
      setError(err?.message || 'Failed to initialize voice assistant');
    }
  }, [apiKey]);

  const startCall = async () => {
    try {
      if (vapi && assistantId) {
        await vapi.start(assistantId);
        setTranscript([]); // Clear previous conversation
      }
    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err?.message || 'Failed to start call');
    }
  };

  const endCall = async () => {
    try {
      if (vapi) {
        await vapi.stop();
      }
    } catch (err: any) {
      console.error('Error ending call:', err);
      setError(err?.message || 'Failed to end call');
    }
  };

  // Volume indicator component
  const VolumeIndicator = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      height: '16px'
    }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '3px',
            height: `${Math.max(2, (volumeLevel * 100) / 5)}px`,
            background: volumeLevel > (i * 0.2) ? '#12A594' : '#e1e5e9',
            borderRadius: '1px',
            transition: 'all 0.1s ease'
          }}
        />
      ))}
    </div>
  );

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        background: '#ff4444',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        maxWidth: '300px'
      }}>
        Error: {error}
        <button
          onClick={() => setError(null)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 1000,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {!isConnected ? (
        <button
          onClick={startCall}
          disabled={!apiKey || !assistantId}
          style={{
            background: (!apiKey || !assistantId) ? '#ccc' : '#12A594',
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '16px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: (!apiKey || !assistantId) ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(18, 165, 148, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            if (apiKey && assistantId) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(18, 165, 148, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(18, 165, 148, 0.3)';
          }}
        >
          🎤 Talk to Medical Assistant
        </button>
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          padding: '20px',
          width: '350px',
          maxHeight: '500px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e1e5e9'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isConnected ? '#12A594' : '#ccc',
                animation: isSpeaking ? 'pulse 1.5s infinite' : 'none'
              }}></div>
              <span style={{ 
                fontWeight: '600', 
                color: '#333',
                fontSize: '14px'
              }}>
                {isSpeaking ? 'Assistant Speaking...' : 'Listening...'}
              </span>
              <VolumeIndicator />
            </div>
            <button
              onClick={endCall}
              style={{
                background: '#ff4444',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ff3333';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#ff4444';
              }}
            >
              End Call
            </button>
          </div>
          
          {/* Transcript */}
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '12px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '12px',
            scrollBehavior: 'smooth'
          }}>
            {transcript.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '14px',
                padding: '20px'
              }}>
                <div style={{ marginBottom: '8px', fontSize: '24px' }}>🩺</div>
                <p style={{ margin: 0 }}>
                  Start speaking to begin your medical consultation...
                </p>
              </div>
            ) : (
              transcript.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    background: msg.role === 'user' ? '#12A594' : '#333',
                    color: '#fff',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '14px',
                    maxWidth: '85%',
                    lineHeight: '1.4',
                    wordWrap: 'break-word'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Status info */}
          <div style={{
            fontSize: '12px',
            color: '#888',
            textAlign: 'center',
            padding: '8px 0'
          }}>
            {isConnected && (
              <span>🟢 Connected • Speak clearly for best results</span>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default VapiWidget;