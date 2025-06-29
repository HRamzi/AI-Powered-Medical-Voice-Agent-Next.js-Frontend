import OpenAI from 'openai';
import { NextRequest } from 'next/server';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'mock-key'
});

const reportGenerationPrompt = `You are an AI Medical Voice Agent that just finished a voice conversation with a user. Based on doctor AI agent info and Conversation between AI medical agent and user, generate a structured report with the following fields:
1. agent: the medical specialist name (e.g., "General Physician AI")
2. user: name of the patient or "Anonymous" if not provided
3. timestamp: current date and time in ISO format
4. chiefComplaint: one-sentence summary of the main health concern
5. summary: a 2-3 sentence summary of the conversation, symptoms, and recommendations
6. symptoms: list of symptoms mentioned by the user
7. duration: how long the user has experienced the symptoms
8. severity: mild, moderate, or severe
9. medicationsMentioned: list of any medicines mentioned
10. recommendations: list of AI suggestions (e.g., rest, see a doctor)

Return the result in this JSON format:
{
 "agent": "string",
 "user": "string", 
 "timestamp": "ISO Date string",
 "chiefComplaint": "string",
 "summary": "string",
 "symptoms": ["symptom1", "symptom2"],
 "duration": "string",
 "severity": "string",
 "medicationsMentioned": ["med1", "med2"],
 "recommendations": ["rec1", "rec2"]
}

Only include valid fields. Respond with nothing else.`;

export async function POST(request: NextRequest) {
    try {
        const { sessionId, sessionDetail, messages } = await request.json();

        // Create user input for the AI
        const userInput = `AI Doctor Agent Info: ${JSON.stringify(sessionDetail)}, Conversation: ${JSON.stringify(messages)}`;

        // For now, return a mock response since we don't have OpenAI API key configured
        const mockReport = {
            agent: sessionDetail?.selectedDoctor?.specialist + " AI" || "General Physician AI",
            user: "Anonymous",
            timestamp: new Date().toISOString(),
            chiefComplaint: messages.length > 0 ? 
                `Patient discussed: ${messages.find(m => m.role === 'user')?.text?.substring(0, 100) || 'health concerns'}` : 
                "User did not clarify the main complaint",
            summary: messages.length > 2 ? 
                `Patient consulted with ${sessionDetail?.selectedDoctor?.specialist || 'AI doctor'} regarding health concerns. Conversation included ${messages.length} exchanges. AI provided appropriate medical guidance.` :
                "Brief consultation with limited information provided by user",
            symptoms: messages.filter(m => m.role === 'user').map(m => 
                m.text.toLowerCase().includes('pain') ? 'pain' :
                m.text.toLowerCase().includes('headache') ? 'headache' :
                m.text.toLowerCase().includes('fever') ? 'fever' :
                'general discomfort'
            ).slice(0, 3),
            duration: "Duration not specified by user",
            severity: "Severity not specified",
            medicationsMentioned: [],
            recommendations: [
                "Monitor symptoms closely",
                "Stay hydrated and get adequate rest", 
                "Consider consulting with a healthcare provider if symptoms persist"
            ]
        };

        /* 
        // Uncomment this when OpenAI API key is configured
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: reportGenerationPrompt
                },
                {
                    role: "user",
                    content: userInput
                }
            ]
        });

        const rawResponse = completion.choices[0].message.content;
        const cleanResponse = rawResponse?.replace(/```json|```/g, '').trim();
        const reportData = JSON.parse(cleanResponse || '{}');
        */

        // TODO: Update database with report and conversation
        // This would require setting up database connection in Next.js
        // For now, we'll let the Laravel backend handle database updates

        return Response.json(mockReport);

    } catch (error) {
        console.error('Error generating report:', error);
        return Response.json({ error: 'Failed to generate report' }, { status: 500 });
    }
} 