"use client"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import React, { useState } from 'react'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Type definition for each doctor agent card
 */
export type doctorAgent = {
    id: number,
    specialist: string,
    description: string,
    image: string,
    agentPrompt: string,
    voiceId: string,
    subscriptionRequired: boolean
}

/**
 * DoctorAgentCard Component
 * Renders a doctor card with image, name, description,
 * and a button to start a new consultation session.
 */
function DoctorAgentCard({ doctorAgent }: { doctorAgent: doctorAgent }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { api, isAuthenticated } = useAuthenticatedApi()

    const OnStartConsultation = async () => {
        if (!api || !isAuthenticated) {
            console.error('User not authenticated')
            return
        }

        setLoading(true)
        try {
            const result = await api.post('/session-chat', {
                notes: `Quick consultation with ${doctorAgent.specialist}`,
            selectedDoctor: doctorAgent
            })

            console.log('Session created:', result.data)
        if (result.data?.sessionId) {
                router.push('/dashboard/medical-agent/' + result.data.sessionId)
        }
        } catch (error) {
            console.error('Error starting consultation:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='border p-5 rounded-3xl bg-secondary'>
            <Image
                src={doctorAgent?.image} 
                alt={doctorAgent?.specialist}
                width={80} 
                height={80}
                className='h-[80px] w-[80px] object-cover rounded-full'
            />
            <h2 className='font-bold text-lg mt-2'>{doctorAgent?.specialist}</h2>
            <p className='text-gray-400 text-sm'>{doctorAgent?.description}</p>
            {doctorAgent?.subscriptionRequired && (
                <p className='text-xs text-blue-500 mt-1'>Premium Required</p>
            )}
            <Button
                className='mt-3 w-full' 
                onClick={OnStartConsultation}
                disabled={loading || !isAuthenticated}
            >
                {loading ? (
                    <>
                        <Loader2 className='animate-spin h-4 w-4 mr-2' />
                        Starting...
                    </>
                ) : !isAuthenticated ? (
                    'Sign in Required'
                ) : (
                    'Start Consultation'
                )}
            </Button>
        </div>
    )
}

export default DoctorAgentCard
