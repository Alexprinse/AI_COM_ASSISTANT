import Papa from 'papaparse';
import { Email, Priority, Sentiment, EmailStatus } from './types';

interface CSVRow {
  sender: string;
  subject: string;
  body: string;
  sent_date: string;
}

// Helper function to determine priority based on subject and body content
const determinePriority = (subject: string, body: string): Priority => {
  const urgentKeywords = ['urgent', 'critical', 'emergency', 'immediate', 'asap', 'downtime', 'blocked', 'system down'];
  const mediumKeywords = ['help', 'support', 'issue', 'problem', 'error', 'billing'];
  
  const text = (subject + ' ' + body).toLowerCase();
  
  if (urgentKeywords.some(keyword => text.includes(keyword))) {
    return 'urgent';
  } else if (mediumKeywords.some(keyword => text.includes(keyword))) {
    return 'medium';
  } else {
    return 'low';
  }
};

// Helper function to determine sentiment
const determineSentiment = (subject: string, body: string): Sentiment => {
  const positiveKeywords = ['thank', 'great', 'excellent', 'good', 'happy', 'satisfied'];
  const negativeKeywords = ['angry', 'frustrated', 'terrible', 'awful', 'disappointed', 'upset', 'critical', 'urgent'];
  
  const text = (subject + ' ' + body).toLowerCase();
  
  if (positiveKeywords.some(keyword => text.includes(keyword))) {
    return 'positive';
  } else if (negativeKeywords.some(keyword => text.includes(keyword))) {
    return 'negative';
  } else {
    return 'neutral';
  }
};

// Helper function to calculate priority score
const calculatePriorityScore = (priority: Priority, subject: string, body: string): number => {
  const baseScores = { urgent: 4.0, medium: 2.0, low: 1.0 };
  const urgentBoosts = ['critical', 'emergency', 'immediate', 'downtime'];
  
  let score = baseScores[priority];
  const text = (subject + ' ' + body).toLowerCase();
  
  urgentBoosts.forEach(keyword => {
    if (text.includes(keyword)) {
      score += 0.5;
    }
  });
  
  return Math.min(score, 5.0);
};

// Helper function to check if email should be filtered (contains support terms)
const shouldFilterEmail = (subject: string, body: string): boolean => {
  const supportKeywords = ['support', 'query', 'request', 'help', 'issue', 'problem', 'error', 'assistance'];
  const text = (subject + ' ' + body).toLowerCase();
  
  return supportKeywords.some(keyword => text.includes(keyword));
};

// Helper function to extract entities from email content
const extractEntities = (emailId: string, subject: string, body: string) => {
  const entities = [];
  let entityId = 1;
  
  // Extract phone numbers
  const phoneRegex = /[\+]?[1-9]?[\-\s]?\(?[0-9]{3}\)?[\-\s]?[0-9]{3}[\-\s]?[0-9]{4}/g;
  const phones = body.match(phoneRegex);
  if (phones) {
    phones.forEach(phone => {
      entities.push({
        id: `e${entityId++}`,
        emailId,
        entityType: 'phone' as const,
        value: phone.trim()
      });
    });
  }
  
  // Extract email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = body.match(emailRegex);
  if (emails) {
    emails.forEach(email => {
      entities.push({
        id: `e${entityId++}`,
        emailId,
        entityType: 'email' as const,
        value: email
      });
    });
  }
  
  // Extract order IDs
  const orderRegex = /(?:order|ord)[#\s]?([a-zA-Z0-9-]+)/gi;
  const orders = body.match(orderRegex);
  if (orders) {
    orders.forEach(order => {
      entities.push({
        id: `e${entityId++}`,
        emailId,
        entityType: 'order_id' as const,
        value: order
      });
    });
  }
  
  // Extract common issues
  const issueKeywords = ['login', 'password', 'billing', 'access', 'verification', 'downtime', 'api', 'integration'];
  const text = (subject + ' ' + body).toLowerCase();
  issueKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      entities.push({
        id: `e${entityId++}`,
        emailId,
        entityType: 'issue' as const,
        value: keyword
      });
    }
  });
  
  return entities;
};

// Helper function to generate AI response
const generateAIResponse = (email: Email) => {
  const priority = email.priority;
  const issue = email.entities?.find(e => e.entityType === 'issue')?.value || 'general inquiry';
  
  let response = '';
  
  if (priority === 'urgent') {
    response = `Dear ${email.fromEmail.split('@')[0]},

I understand this is an urgent matter regarding ${issue}. I'm immediately escalating this to our technical team for priority handling.

Here's what I'm doing right away:
1. Reviewing the specific issue details
2. Checking system status and logs
3. Preparing immediate resolution steps

I'll update you within 15 minutes with a resolution or escalation to our senior technical team.

If this doesn't resolve it, reply to this email and we'll escalate within 4 business hours.

Best regards,
AI Support Assistant`;
  } else if (priority === 'medium') {
    response = `Hi ${email.fromEmail.split('@')[0]},

Thank you for reaching out about ${issue}. I'd be happy to help resolve this for you.

Based on your inquiry, here are the recommended next steps:
1. I'm reviewing your account details
2. Checking our knowledge base for solutions
3. Preparing a detailed response

I'll have a complete solution for you within 2 business hours.

If this doesn't resolve it, reply to this email and we'll escalate within 4 business hours.

Best regards,
AI Support Assistant`;
  } else {
    response = `Hello ${email.fromEmail.split('@')[0]},

Thank you for contacting us regarding ${issue}. I appreciate you taking the time to reach out.

I'll review your request and provide you with the information you need within 1 business day.

If this doesn't resolve it, reply to this email and we'll escalate within 4 business hours.

Best regards,
AI Support Assistant`;
  }
  
  return {
    id: `r${email.id}`,
    emailId: email.id,
    draftText: response,
    ragSources: ['Support Knowledge Base', 'FAQ Database', 'Resolution Procedures'],
    generatedAt: new Date(),
    sentBy: 'system'
  };
};

export const loadEmailsFromCSV = async (): Promise<Email[]> => {
  try {
    const response = await fetch('/Demo.csv');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse<CSVRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            // Clean malformed rows (e.g., accidental extra header variants)
            const cleanedRows = results.data.filter(r => r.sender && r.subject && r.sent_date);

            const seen = new Set<string>();
            const emails: Email[] = cleanedRows.map((row, index) => {
              const priority = determinePriority(row.subject, row.body);
              const sentiment = determineSentiment(row.subject, row.body);
              const priorityScore = calculatePriorityScore(priority, row.subject, row.body);
              const isFiltered = shouldFilterEmail(row.subject, row.body);
              const emailId = (index + 1).toString();
              
              // Normalize date: replace space with 'T' to better align with ISO; add 'Z' if missing timezone
              let rawDateStr = row.sent_date?.trim();
              let parsedDate: Date;
              if (rawDateStr) {
                // If already contains 'T', leave, else replace first space with 'T'
                if (!rawDateStr.includes('T') && /\d{4}-\d{2}-\d{2} /.test(rawDateStr)) {
                  rawDateStr = rawDateStr.replace(' ', 'T');
                }
                // If no timezone info, append 'Z' to treat as UTC
                if (!/[zZ]|[+\-]\d{2}:?\d{2}$/.test(rawDateStr)) {
                  rawDateStr += 'Z';
                }
                parsedDate = new Date(rawDateStr);
              } else {
                parsedDate = new Date();
              }
              if (isNaN(parsedDate.getTime())) {
                // Fallback: try direct new Date(row.sent_date), else now
                const retry = new Date(row.sent_date);
                parsedDate = isNaN(retry.getTime()) ? new Date() : retry;
              }

              const email: Email = {
                id: emailId,
                messageId: `msg-${emailId.padStart(3, '0')}`,
                fromEmail: row.sender,
                toEmail: 'support@company.com',
                subject: row.subject,
                bodyText: row.body,
                receivedAt: parsedDate,
                isFiltered,
                sentiment,
                priority,
                priorityScore,
                status: 'pending' as EmailStatus,
                entities: extractEntities(emailId, row.subject, row.body)
              };
              
              // Add AI response for filtered emails
              if (isFiltered) {
                email.response = generateAIResponse(email);
              }
              
              const dedupKey = `${email.fromEmail}||${email.subject}||${email.bodyText}`.toLowerCase();
              if (seen.has(dedupKey)) {
                return null; // mark duplicate
              }
              seen.add(dedupKey);
              return email;
            });
            
            // Sort by priority and received date
            const finalEmails = emails.filter(Boolean) as Email[];

            finalEmails.sort((a, b) => {
              const priorityOrder = { urgent: 3, medium: 2, low: 1 };
              const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
              
              if (priorityDiff !== 0) return priorityDiff;
              return b.receivedAt.getTime() - a.receivedAt.getTime();
            });
            
            resolve(finalEmails);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error loading CSV file:', error);
    throw error;
  }
};
