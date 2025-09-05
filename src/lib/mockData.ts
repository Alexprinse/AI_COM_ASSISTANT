import { Email, EmailEntity, EmailResponse, AnalyticsData } from "./types";

// Mock emails data
export const mockEmails: Email[] = [
  {
    id: "1",
    messageId: "msg-001",
    fromEmail: "sarah.johnson@techcorp.com",
    toEmail: "support@company.com",
    subject: "URGENT: Cannot access critical project files - system down",
    bodyText: `Hi Support Team,

I'm experiencing a critical issue with accessing project files in our shared drive. The system appears to be completely down and I cannot login to retrieve important documents needed for today's client presentation.

Error message: "Server connection failed - Error 500"
Product: Cloud Storage Pro
Account: TechCorp Enterprise (Order #ORD-2024-1234)

This is extremely urgent as the presentation is in 2 hours. Please help immediately!

Best regards,
Sarah Johnson
Senior Project Manager
Phone: +1-555-0123
sarah.johnson@techcorp.com`,
    receivedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isFiltered: true,
    sentiment: "negative",
    priority: "urgent",
    priorityScore: 4.5,
    status: "pending",
    entities: [
      {
        id: "e1",
        emailId: "1",
        entityType: "phone",
        value: "+1-555-0123"
      },
      {
        id: "e2",
        emailId: "1",
        entityType: "product",
        value: "Cloud Storage Pro"
      },
      {
        id: "e3",
        emailId: "1",
        entityType: "order_id",
        value: "ORD-2024-1234"
      },
      {
        id: "e4",
        emailId: "1",
        entityType: "issue",
        value: "Server connection failed - Error 500"
      }
    ],
    response: {
      id: "r1",
      emailId: "1",
      draftText: `Dear Sarah,

I understand how urgent this situation is, especially with your client presentation approaching. I'm immediately escalating this issue to our Cloud Storage Pro technical team.

Here's what I'm doing right away:

1. Checking the server status for Error 500 issues
2. Verifying your TechCorp Enterprise account (Order #ORD-2024-1234) 
3. Preparing alternative access methods for your critical files

While we resolve this, you can try:
- Accessing files through our mobile app as a backup
- Using the web interface at storage.company.com/enterprise

I'll update you within 15 minutes with a resolution or alternative solution.

If this doesn't resolve it, reply to this email and we'll escalate within 4 business hours.

Best regards,
AI Support Assistant`,
      ragSources: ["Cloud Storage Troubleshooting", "Error 500 Resolution Guide", "Enterprise Account Procedures"],
      generatedAt: new Date(),
      sentBy: "system"
    }
  },
  {
    id: "2",
    messageId: "msg-002",
    fromEmail: "mike.chen@startup.io",
    toEmail: "support@company.com",
    subject: "Query about billing for additional users",
    bodyText: `Hello,

We're growing our team and need to add 5 more users to our Basic plan. Could you please let me know:

1. How much would it cost to upgrade?
2. Can we add users mid-cycle?
3. Will there be any pro-rated charges?

Our current plan is Basic Monthly (Order #ORD-2024-5678).

Thanks for your help!

Mike Chen
CTO, Startup.io
mike.chen@startup.io`,
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isFiltered: true,
    sentiment: "neutral",
    priority: "medium",
    priorityScore: 1.2,
    status: "drafted",
    entities: [
      {
        id: "e5",
        emailId: "2",
        entityType: "product",
        value: "Basic Monthly"
      },
      {
        id: "e6",
        emailId: "2",
        entityType: "order_id",
        value: "ORD-2024-5678"
      }
    ],
    response: {
      id: "r2",
      emailId: "2",
      draftText: `Hi Mike,

Thank you for reaching out about expanding your team! I'd be happy to help with your upgrade questions.

For your Basic Monthly plan (Order #ORD-2024-5678), here are the answers:

1. **Cost for 5 additional users**: $25/user/month = $125/month additional
2. **Mid-cycle additions**: Yes, you can add users anytime
3. **Pro-rated charges**: You'll only pay for the remaining days in your current billing cycle

To add users:
- Log into your account dashboard
- Go to "Team Management" 
- Click "Add Users" and enter the number needed

The changes will take effect immediately and billing will adjust automatically.

If this doesn't resolve it, reply to this email and we'll escalate within 4 business hours.

Best regards,
AI Support Assistant`,
      ragSources: ["Billing FAQ", "User Management Guide", "Plan Upgrade Procedures"],
      generatedAt: new Date(),
      sentBy: "system"
    }
  },
  {
    id: "3",
    messageId: "msg-003",
    fromEmail: "jenny.williams@design.co",
    toEmail: "support@company.com",
    subject: "Thank you for the quick help with file recovery!",
    bodyText: `Hi Support Team,

I just wanted to reach out and say thank you for the amazing help yesterday with recovering my deleted design files. Your team was so responsive and professional.

The files were recovered perfectly and I was able to meet my deadline. Excellent service!

Jenny Williams
Creative Director
jenny.williams@design.co`,
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
    isFiltered: true,
    sentiment: "positive",
    priority: "low",
    priorityScore: 0.3,
    status: "sent",
    entities: [
      {
        id: "e7",
        emailId: "3",
        entityType: "issue",
        value: "file recovery"
      }
    ],
    response: {
      id: "r3",
      emailId: "3",
      draftText: `Dear Jenny,

Thank you so much for taking the time to share this wonderful feedback! It truly brightens our day to hear when we've helped our customers succeed.

I'm delighted that we could recover your design files in time for your deadline. Our team takes great pride in providing responsive and professional service.

We're always here if you need any assistance in the future. Thank you for being a valued customer!

If this doesn't resolve it, reply to this email and we'll escalate within 4 business hours.

Best regards,
AI Support Assistant`,
      ragSources: ["Customer Thank You Templates", "File Recovery Success Cases"],
      generatedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      sentAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      sentBy: "system"
    }
  },
  {
    id: "4",
    messageId: "msg-004", 
    fromEmail: "alex.rodriguez@retailcorp.com",
    toEmail: "support@company.com",
    subject: "Help with integrating payment gateway",
    bodyText: `Hi there,

We're trying to integrate your payment gateway API with our e-commerce platform but running into some issues with the webhook configuration.

The documentation mentions setting up webhooks but doesn't provide clear examples for our platform (Shopify Plus).

Could someone help with the integration steps?

Alex Rodriguez
Lead Developer
alex.rodriguez@retailcorp.com
Phone: +1-555-0199`,
    receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isFiltered: true,
    sentiment: "neutral",
    priority: "medium",
    priorityScore: 1.1,
    status: "pending",
    entities: [
      {
        id: "e8",
        emailId: "4",
        entityType: "phone",
        value: "+1-555-0199"
      },
      {
        id: "e9",
        emailId: "4",
        entityType: "product",
        value: "payment gateway API"
      },
      {
        id: "e10",
        emailId: "4",
        entityType: "issue",
        value: "webhook configuration"
      }
    ]
  },
  {
    id: "5",
    messageId: "msg-005",
    fromEmail: "lisa.park@nonprofit.org", 
    toEmail: "support@company.com",
    subject: "Request for nonprofit discount verification",
    bodyText: `Dear Support,

Our organization is a registered 501(c)(3) nonprofit and we'd like to apply for your nonprofit discount program.

We're currently on the Professional plan and would like to know:
1. What discount percentage do nonprofits receive?
2. What documentation do you need?
3. How long does verification take?

Attached are our IRS determination letter and registration documents.

Best regards,
Lisa Park
Operations Manager
Helping Hands Nonprofit
lisa.park@nonprofit.org`,
    receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    isFiltered: true,
    sentiment: "neutral",
    priority: "low",
    priorityScore: 0.8,
    status: "pending",
    entities: [
      {
        id: "e11",
        emailId: "5",
        entityType: "product",
        value: "Professional plan"
      },
      {
        id: "e12",
        emailId: "5",
        entityType: "keyword",
        value: "nonprofit discount"
      }
    ]
  }
];

// Mock analytics data
export const mockAnalytics: AnalyticsData = {
  totalEmails: 47,
  filteredEmails: 23,
  urgentEmails: 4,
  sentEmails: 15,
  pendingEmails: 8,
  sentimentBreakdown: {
    positive: 8,
    neutral: 12,
    negative: 3
  },
  priorityBreakdown: {
    urgent: 4,
    medium: 9,
    low: 10
  },
  volumeData: [
    { time: "00:00", count: 2 },
    { time: "02:00", count: 1 },
    { time: "04:00", count: 0 },
    { time: "06:00", count: 3 },
    { time: "08:00", count: 8 },
    { time: "10:00", count: 12 },
    { time: "12:00", count: 9 },
    { time: "14:00", count: 7 },
    { time: "16:00", count: 4 },
    { time: "18:00", count: 1 },
    { time: "20:00", count: 0 },
    { time: "22:00", count: 0 }
  ]
};