/**
 * AI Service — Communicates with OpenRouter API
 * Model: google/gemini-2.0-flash-exp:free
 */

import axios from 'axios';
import { getEscalationStage } from './escalationService.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || '~google/gemini-flash-latest';

function buildPrompt(invoice, escalation) {
  return `You are a professional finance follow-up email writer for a corporate accounts receivable team.

Generate a professional follow-up email for an overdue invoice.

Invoice Details:
- Invoice Number: ${invoice.invoice_no}
- Client Name: ${invoice.client_name}
- Amount Due: ₹${parseFloat(invoice.amount).toLocaleString('en-IN')}
- Due Date: ${invoice.due_date}
- Days Overdue: ${invoice.days_overdue} days
- Escalation Stage: ${escalation.label}

Tone Instructions: ${escalation.toneInstruction}

Requirements:
1. Write a subject line on the first line prefixed with "Subject: "
2. Address the client by name
3. Reference the specific invoice number and amount
4. Mention the due date and how many days overdue it is
5. Include a clear call-to-action
6. Include finance department contact reminder
7. Sign off as "FinFlow AI - Accounts Receivable Team"
8. Keep it professional and business-appropriate
9. Do NOT use markdown formatting — write in plain text email format
10. The email should be realistic and ready to send

Generate only the email content. No additional commentary.`;
}

export async function generateEmail(invoice) {
  const escalation = getEscalationStage(invoice.days_overdue);

  if (!escalation.canGenerateEmail) {
    return {
      success: false,
      invoice,
      escalation,
      error: 'Invoice exceeds 30 days overdue — escalated to legal review. No AI email generated.',
      legalEscalation: true
    };
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return {
      success: false,
      invoice,
      escalation,
      error: 'OpenRouter API key not configured. Please set OPENROUTER_API_KEY in .env file.'
    };
  }

  try {
    const prompt = buildPrompt(invoice, escalation);

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a professional corporate finance email writer. Generate realistic, business-grade follow-up emails for overdue invoices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://finflow-ai.app',
          'X-Title': 'FinFlow AI'
        },
        timeout: 30000
      }
    );

    const emailContent = response.data?.choices?.[0]?.message?.content;

    if (!emailContent) {
      throw new Error('Empty response from AI model');
    }

    // Parse subject line from email
    const lines = emailContent.split('\n');
    let subject = '';
    let body = emailContent;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().startsWith('subject:')) {
        subject = lines[i].replace(/^subject:\s*/i, '').trim();
        body = lines.slice(i + 1).join('\n').trim();
        break;
      }
    }

    return {
      success: true,
      invoice,
      escalation,
      email: {
        subject: subject || `Payment Reminder: Invoice ${invoice.invoice_no}`,
        body,
        fullContent: emailContent,
        generatedAt: new Date().toISOString(),
        model: OPENROUTER_MODEL,
        tone: escalation.label
      }
    };
  } catch (error) {
    console.error('[AI Service Error]', error.response?.data || error.message);
    return {
      success: false,
      invoice,
      escalation,
      error: error.response?.data?.error?.message || error.message || 'Failed to generate email'
    };
  }
}

export async function generateInsights(invoices) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    // Generate rule-based insights if no API key
    return generateRuleBasedInsights(invoices);
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const highRisk = invoices.filter(inv => parseInt(inv.days_overdue) > 30);
  const urgent = invoices.filter(inv => {
    const days = parseInt(inv.days_overdue);
    return days >= 22 && days <= 30;
  });
  const avgOverdue = invoices.reduce((sum, inv) => sum + (parseInt(inv.days_overdue) || 0), 0) / invoices.length;

  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a finance analytics AI. Generate exactly 5 short, actionable insights about overdue invoices. Each insight should be on a new line and start with an emoji. Be specific with numbers. No markdown formatting.'
          },
          {
            role: 'user',
            content: `Analyze these overdue invoice metrics and generate 5 concise actionable insights:
- Total invoices: ${invoices.length}
- Total pending amount: ₹${totalAmount.toLocaleString('en-IN')}
- High risk (30+ days): ${highRisk.length} invoices worth ₹${highRisk.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0).toLocaleString('en-IN')}
- Urgent (22-30 days): ${urgent.length} invoices
- Average overdue: ${Math.round(avgOverdue)} days
- Clients: ${[...new Set(invoices.map(i => i.client_name))].join(', ')}`
          }
        ],
        max_tokens: 512,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://finflow-ai.app',
          'X-Title': 'FinFlow AI'
        },
        timeout: 15000
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (content) {
      return content.split('\n').filter(line => line.trim()).slice(0, 6);
    }
  } catch (err) {
    console.error('[AI Insights Error]', err.message);
  }

  return generateRuleBasedInsights(invoices);
}

function generateRuleBasedInsights(invoices) {
  const insights = [];
  const totalAmount = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
  const highRisk = invoices.filter(inv => parseInt(inv.days_overdue) > 30);
  const urgent = invoices.filter(inv => {
    const days = parseInt(inv.days_overdue);
    return days >= 22 && days <= 30;
  });
  const avgOverdue = Math.round(invoices.reduce((sum, inv) => sum + (parseInt(inv.days_overdue) || 0), 0) / invoices.length);

  if (highRisk.length > 0) {
    const hrAmount = highRisk.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
    insights.push(`🚨 ${highRisk.length} invoice(s) require immediate legal review — ₹${hrAmount.toLocaleString('en-IN')} at critical risk.`);
  }

  if (urgent.length > 0) {
    insights.push(`⚠️ ${urgent.length} invoice(s) approaching legal escalation threshold (22-30 days overdue).`);
  }

  insights.push(`📊 Total pending receivables: ₹${totalAmount.toLocaleString('en-IN')} across ${invoices.length} invoices.`);
  insights.push(`⏱️ Average overdue duration: ${avgOverdue} days — ${avgOverdue > 15 ? 'above acceptable threshold' : 'within monitoring range'}.`);

  const topClient = invoices.reduce((acc, inv) => {
    const amt = parseFloat(inv.amount) || 0;
    acc[inv.client_name] = (acc[inv.client_name] || 0) + amt;
    return acc;
  }, {});
  const sorted = Object.entries(topClient).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    insights.push(`💰 Highest exposure: ${sorted[0][0]} with ₹${sorted[0][1].toLocaleString('en-IN')} pending.`);
  }

  return insights;
}
