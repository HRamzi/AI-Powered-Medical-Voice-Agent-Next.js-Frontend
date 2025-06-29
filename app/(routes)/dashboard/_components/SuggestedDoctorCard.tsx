import React from 'react'
import { doctorAgent } from './DoctorAgentCard'
import Image from 'next/image'

type props = {
    doctorAgent: doctorAgent,             // doctor data to display
    setSelectedDoctor: (doctor: doctorAgent) => void, // function to set selected doctor
    selectedDoctor: doctorAgent          // currently selected doctor
}

/**
 * SuggestedDoctorCard Component
 * 
 * Displays a clickable card for a suggested doctor.
 * Highlights the card if it is the currently selected doctor.
 */
function SuggestedDoctorCard({ doctorAgent, setSelectedDoctor, selectedDoctor }: props) {
    return (
        <div
            className={`flex flex-col items-center
            border rounded-2xl shadow p-5
            hover:border-blue-500 cursor-pointer
            ${selectedDoctor?.id == doctorAgent?.id && 'border-blue-500'}`}
            onClick={() => setSelectedDoctor(doctorAgent)} // select this doctor on click
        >
            {/* 👤 Doctor image */}
            <Image
                src={doctorAgent?.image}
                alt={doctorAgent?.specialist}
                width={70}
                height={70}
                className='w-[50px] h-[50px] rounded-4xl object-cover'
            />

            {/* 🩺 Doctor name */}
            <h2 className='font-bold text-sm text-center'>
                {doctorAgent?.specialist}
            </h2>

            {/* 📝 Short description */}
            <p className='text-xs text-center line-clamp-2'>
                {doctorAgent?.description}
            </p>
        </div>
    )
}

export default SuggestedDoctorCard
