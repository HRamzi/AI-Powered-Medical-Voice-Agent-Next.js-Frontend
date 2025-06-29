"use client"

import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { doctorAgent } from '../../_components/DoctorAgentCard';
import { Circle, Loader, PhoneCall, PhoneOff, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Vapi from '@vapi-ai/web';

export type SessionDetail = {
    id: number,
    notes: string,
    sessionId: string,
    report: JSON,
    selectedDoctor: doctorAgent,
    createdOn: string,
}

type Message = {
    role: string,
    text: string
}

/**
 * MedicalVoiceAgent Component
 * 
 * Enhanced AI-powered medical voice assistant interface using Vapi SDK.
 * Features real-time voice conversations, live transcripts, volume indicators,
 * and medical consultation report generation.
 */
function MedicalVoiceAgent() {
    const { sessionId } = useParams(); // Get sessionId from route parameters
    const [sessionDetail, setSessionDetail] = useState<SessionDetail>(); // Current session details
    const [loading, setLoading] = useState(false); // Loading state for UI feedback
    const router = useRouter();
    const { api, isAuthenticated } = useAuthenticatedApi(); // Add authenticated API hook

    // Vapi Integration - Following Tutorial Steps
    const [callStarted, setCallStarted] = useState(false);
    const [currentRole, setCurrentRole] = useState<string | null>(null);
    const [transcript, setTranscript] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [vapiInstance, setVapiInstance] = useState<any>(null);

    // Initialize Vapi
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY || '');

    // Load session details on component mount or when sessionId changes
    useEffect(() => {
        if (sessionId && api && isAuthenticated) {
            GetSessionDetails();
        }
    }, [sessionId, api, isAuthenticated]);

    // Vapi Event Handlers - Following Tutorial
    useEffect(() => {
        // Call started
        vapi.on('call-start', () => {
            console.log('Call started');
            setCallStarted(true);
        });

        // Call ended
        vapi.on('call-end', () => {
            console.log('Call ended');
            setCallStarted(false);
        });

        // Speech started (Assistant speaking)
        vapi.on('speech-start', () => {
            console.log('Assistant started speaking');
            setCurrentRole('assistant');
        });

        // Speech ended (User can speak)
        vapi.on('speech-end', () => {
            console.log('Assistant stopped speaking');
            setCurrentRole('user');
        });

        // Message handling for live transcript
        vapi.on('message', (message: any) => {
            console.log('Vapi message:', message);
            
            if (message.type === 'transcript') {
                const { role, transcriptType, transcript: messageTranscript } = message;
                
                if (transcriptType === 'partial') {
                    // Live transcript
                    setTranscript(messageTranscript);
                    setCurrentRole(role);
                } else if (transcriptType === 'final') {
                    // Final transcript - save to messages
                    setMessages((prevMessages: Message[]) => [
                        ...prevMessages,
                        { role, text: messageTranscript }
                    ]);
                    setTranscript('');
                    setCurrentRole(null);
                }
            }
        });

        return () => {
            // Cleanup event listeners
            vapi.removeAllListeners();
        };
    }, []);

    // Fetch session detail data from Laravel backend API
    const GetSessionDetails = async () => {
        if (!api) {
            console.error('API not available - user not authenticated');
            return;
        }

        try {
            const result = await api.get(`/session-chat?sessionId=${sessionId}`);
            console.log('Session details:', result.data);
            setSessionDetail(result.data);
        } catch (error) {
            console.error('Error fetching session details:', error);
            toast.error('Failed to load session details');
        }
    };

    // Vapi Agent Configuration - Dynamic based on selected doctor
    const vapiAgentConfig = {
        model: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: sessionDetail?.selectedDoctor?.agentPrompt || "You are a friendly AI medical assistant."
                }
            ]
        },
        voice: {
            provider: "11labs",
            voiceId: "burt"
        },
        firstMessage: "Hi there! I'm your AI medical assistant. I'm here to help you with any health questions or concerns you might have today. How are you feeling?"
    };

    // Start Call Function - Following Tutorial with Dynamic Configuration
    const startCall = async () => {
        try {
            if (!sessionDetail) {
                toast.error('Session details not loaded yet');
                return;
            }

            const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY || '');
            setVapiInstance(vapiInstance);
            
            // Add event listeners to the instance
            vapiInstance.on('call-start', () => {
                console.log('Call started');
                setCallStarted(true);
            });

            vapiInstance.on('call-end', () => {
                console.log('Call ended');
                setCallStarted(false);
            });

            vapiInstance.on('speech-start', () => {
                setCurrentRole('assistant');
            });

            vapiInstance.on('speech-end', () => {
                setCurrentRole('user');
            });

            vapiInstance.on('message', (message: any) => {
                if (message.type === 'transcript') {
                    const { role, transcriptType, transcript: messageTranscript } = message;
                    
                    if (transcriptType === 'partial') {
                        setTranscript(messageTranscript);
                        setCurrentRole(role);
                    } else if (transcriptType === 'final') {
                        setMessages((prevMessages: Message[]) => [
                            ...prevMessages,
                            { role, text: messageTranscript }
                        ]);
                        setTranscript('');
                        setCurrentRole(null);
                    }
                }
            });

            console.log('Starting Vapi with config:', vapiAgentConfig);
            
            // For now, use assistant ID approach until dynamic config is debugged
            await vapiInstance.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID || '');
            
            /* 
            // Try dynamic config first, fallback to assistant ID if it fails
            try {
                await vapiInstance.start(vapiAgentConfig);
            } catch (configError) {
                console.warn('Dynamic config failed, trying assistant ID fallback:', configError);
                // Fallback to assistant ID approach
                await vapiInstance.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID || '');
            }
            */
        } catch (error) {
            console.error('Error starting call:', error);
            toast.error('Failed to start call');
        }
    };

    // End Call Function - Following Tutorial
    const endCall = async () => {
        try {
            if (!vapiInstance) return;
            
            setLoading(true);
            await vapiInstance.stop();
            vapiInstance.removeAllListeners();
            setCallStarted(false);
            setVapiInstance(null);
            
            // Generate report after call ends
            if (messages.length > 0) {
                const result = await GenerateReport();
                toast.success('Your report is generated and available to view');
                router.replace('/dashboard');
            }
        } catch (error) {
            console.error('Error ending call:', error);
            toast.error('Failed to end call');
        } finally {
            setLoading(false);
        }
    };

    // Generate Medical Report
    const GenerateReport = async () => {
        if (!api) {
            console.error('API not available - user not authenticated');
            toast.error('Please sign in to generate reports');
            return;
        }

        if (!sessionDetail) {
            console.error('Session detail not available');
            toast.error('Session details not loaded');
            return;
        }

        try {
            const result = await api.post('/medical-report', {
                sessionId: sessionId,
                sessionDetail: sessionDetail,
                messages: messages
            });
            console.log('Report generated:', result.data);
            return result.data;
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
            throw error;
        }
    };

    return (
        <div className='p-5 border rounded-3xl bg-secondary'>
            {/* Status bar following tutorial */}
            <div className='flex justify-between items-center'>
                <h2 className='p-1 px-2 border rounded-md flex gap-2 items-center'>
                    <div 
                        className={`h-4 w-4 rounded-full ${callStarted ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    {callStarted ? 'Connected' : 'Not Connected'}
                </h2>
                <h2 className='font-bold text-xl text-gray-400'>00:00</h2>
            </div>

            {/* Main content shows doctor details */}
            {sessionDetail && (
                <div className='flex items-center flex-col mt-10'>
                    <Image
                        src={sessionDetail.selectedDoctor?.image}
                        alt={sessionDetail.selectedDoctor?.specialist ?? ''}
                        width={120}
                        height={120}
                        className='h-[100px] w-[100px] object-cover rounded-full'
                    />
                    <h2 className='mt-2 text-lg font-semibold'>{sessionDetail.selectedDoctor?.specialist}</h2>
                    <p className='text-sm text-gray-400'>AI Medical Voice Agent</p>

                    {/* Patient's initial concern */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-md text-center">
                        <p className="text-sm text-blue-800">
                            <strong>Your concern:</strong> {sessionDetail.notes}
                        </p>
                    </div>

                    {/* Messages display following tutorial - showing last 4 messages */}
                    <div className='mt-8 w-full flex flex-col items-center px-10 md:px-28 lg:px-52 xl:px-64'>
                        <div className='w-full max-h-80 overflow-y-auto space-y-2 px-4'>
                            {messages.slice(-4).map((message, index) => (
                                <h2 key={index} className='p-2'>
                                    <strong>{message.role}:</strong> {message.text}
                                </h2>
                            ))}
                        </div>

                        {/* Live transcript display */}
                        {transcript.length > 0 && (
                            <div className='mt-4 p-2 bg-yellow-100 rounded-lg w-full'>
                                <strong>{currentRole}:</strong> {transcript}
                            </div>
                        )}
                    </div>

                    {/* Call control buttons following tutorial */}
                    <div className='mt-10'>
                        {!callStarted ? (
                            <Button 
                                onClick={startCall}
                                className='flex gap-2 items-center'
                                disabled={loading}
                            >
                                {loading ? (
                                    <Loader className='animate-spin h-4 w-4' />
                                ) : (
                                    <PhoneCall className='h-4 w-4' />
                                )}
                                Start Call
                            </Button>
                        ) : (
                            <Button 
                                onClick={endCall}
                                variant="destructive"
                                className='flex gap-2 items-center'
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader className='animate-spin h-4 w-4' />
                                        Generating Report...
                                    </>
                                ) : (
                                    <>
                                        <PhoneOff className='h-4 w-4' />
                                        Disconnect
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Generate Report Button */}
                    {messages.length > 0 && (
                        <div className='mt-6'>
                            <Button 
                                onClick={GenerateReport}
                                variant="outline"
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader className='animate-spin mr-2' /> Generating...</>
                                ) : (
                                    'Generate Medical Report'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default MedicalVoiceAgent;
