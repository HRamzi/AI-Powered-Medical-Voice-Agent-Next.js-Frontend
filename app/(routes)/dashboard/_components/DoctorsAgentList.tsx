import { AIDoctorAgents } from '@/shared/list'
import React from 'react'
import DoctorAgentCard from './DoctorAgentCard'

/**
 * DoctorsAgentList Component
 * Displays a grid of AI-powered doctor agent cards using data from AIDoctorAgents.
 */
function DoctorsAgentList() {
    return (
        <div className='mt-10'>
            {/* 🧠 Section Title */}
            <h2 className='font-bold text-xl'>AI Specialist Doctors Agent</h2>

            {/* 🩺 Responsive grid layout for doctor cards */}
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 mt-5'>
                {AIDoctorAgents.map((doctor, index) => (
                    <div key={index}>
                        {/* 🧑‍⚕️ Render each doctor agent card */}
                        <DoctorAgentCard doctorAgent={doctor} />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DoctorsAgentList
