"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi'
import { SessionDetail } from '../medical-agent/[sessionId]/page'
import HistoryTable from './HistoryTable'
import AddNewSessionDialog from './AddNewSessionDialog'

/**
 * HistoryList Component
 * 
 * Displays the user's previous consultation sessions.
 * - If no sessions exist: shows a placeholder UI and CTA to start a new consultation.
 * - If sessions exist: displays them in a table using <HistoryTable />.
 */
function HistoryList() {
    const [historyList, setHistoryList] = useState<SessionDetail[]>([])
    const [loading, setLoading] = useState(true)
    const { api, isAuthenticated } = useAuthenticatedApi();

    useEffect(() => {
        if (isAuthenticated && api) {
            GetHistoryList()
        } else if (!isAuthenticated) {
            setLoading(false);
        }
    }, [isAuthenticated, api])

    const GetHistoryList = async () => {
        if (!api) {
            console.log('API not available - user not authenticated');
            setLoading(false);
            return;
        }

        try {
            setLoading(true)
            const result = await api.get('/session-chat?sessionId=all')
            console.log('History list from Laravel:', result.data)
            setHistoryList(result.data)
        } catch (error) {
            console.error('Error fetching history:', error)
            setHistoryList([])
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    return (
        <div className='mt-10'>
            {/* 📦 If no history, show empty state UI */}
            {historyList.length == 0 ? (
                <div className='flex items-center flex-col justify-center p-7 border border-dashed rounded-2xl border-2'>
                    <Image
                        src={'/medical-assistance.png'}
                        alt='empty'
                        width={150}
                        height={150}
                    />
                    <h2 className='font-bold text-xl mt-2'>No Recent Consultations</h2>
                    <p>It looks like you haven't consulted with any doctors yet.</p>

                    {/* ➕ Trigger to start a new consultation */}
                    <AddNewSessionDialog />
                </div>
            ) : (
                // 📊 Show consultation history table
                <div>
                    <HistoryTable historyList={historyList} />
                </div>
            )}
        </div>
    )
}

export default HistoryList
