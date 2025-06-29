"use client"
import React, { useEffect, useState } from 'react'
import { createAuthenticatedApi } from '@/lib/api'
import { useAuth, useUser } from '@clerk/nextjs';
import { UserDetailContext } from '@/context/UserDetailContext';

export type UsersDetail = {
    name: string,
    email: string,
    credits: number
}

function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();
    const [userDetail, setUserDetail] = useState<any>();
    const [mounted, setMounted] = useState(false);
    
    // Prevent hydration mismatch by only running on client
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Only create user after component is mounted and user is loaded
        if (mounted && isLoaded && user && getToken) {
            CreateNewUser();
        }
    }, [user, isLoaded, mounted, getToken]);

    const CreateNewUser = async () => {
        try {
            // Create authenticated API instance
            const authenticatedApi = createAuthenticatedApi(getToken);
            const result = await authenticatedApi.post('/users');
            console.log('User created/updated:', result.data);
            setUserDetail(result.data);
        } catch (error) {
            console.error('Error creating user:', error);
            // Don't set userDetail on error to prevent further issues
        }
    }

    // Prevent rendering until mounted to avoid hydration mismatch
    if (!mounted) {
        return null;
    }

    return (
        <div>
            <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
                {children}
            </UserDetailContext.Provider>
        </div>
    )
}

export default Provider