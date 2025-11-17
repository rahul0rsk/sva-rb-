

import { GoogleGenAI } from "@google/genai";
import type { Client } from '../types';

// Do not use process.env.API_KEY. The API key is injected automatically.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

function formatClientDataForPrompt(client: Client): string {
  const interactionsSummary = client.interactions.map(i => 
    `- On ${new Date(i.date).toLocaleDateString()}, a ${i.type} was logged: "${i.notes}" ${i.disposition ? `(Disposition: ${i.disposition})` : ''}`
  ).join('\n');

  return `
- **Name:** ${client.name}
- **Contact:** ${client.email}, ${client.phone}
- **Status:** ${client.status}
- **Assigned To:** ${client.assignedTo}
- **Loan Type:** ${client.loanType}
- **Requested Amount:** ₹${client.loanDetails?.requestedAmount?.toLocaleString('en-IN') || 'N/A'}
- **Approved Amount:** ₹${client.loanDetails?.approvedAmount?.toLocaleString('en-IN') || 'N/A'}
- **Disbursed Amount:** ₹${client.loanDetails?.disbursedAmount?.toLocaleString('en-IN') || 'N/A'}
- **Financial Goals:** ${client.financialGoals.join(', ') || 'Not specified'}
- **Recent Interactions:**
${interactionsSummary || '  No interactions logged.'}
  `;
}

export async function generateClientSummary(client: Client): Promise<string> {
  const prompt = `
You are an expert assistant for a loan agent. Your task is to provide a concise, insightful summary of a client's profile. 
Focus on their current loan status, financial goals, and recent interactions. Conclude with a clear "Next Step" recommendation for the agent.
The summary should be well-structured, easy to read, and use markdown for formatting (bolding, bullet points).

Here is the client's data:
${formatClientDataForPrompt(client)}

Please generate the summary now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Error: Could not generate summary. Please check the console for details.";
  }
}

export async function generateBirthdayWish(person: { name: string; role: string }): Promise<string> {
  const prompt = `You are a friendly and professional representative of a successful company called 'SVA Loan CRM'.
Your task is to write a warm and uplifting birthday wish for a person associated with the company.

Person's Details:
- Name: ${person.name}
- Role: ${person.role}

Please generate a short (2-3 sentences) but heartfelt birthday message. Mention their name and role in a positive way.
For example, if they are an Agent, you could praise their dedication. If they are a "Valued Client", thank them for their trust and partnership.
Keep the tone professional yet celebratory. Do not use markdown.

Generate the birthday wish now.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating birthday wish:", error);
    return `Wishing you a very Happy Birthday, ${person.name}! We're so glad to have you with us. May your day be filled with joy and celebration.`;
  }
}