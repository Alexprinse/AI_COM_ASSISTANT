import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailTable } from "@/components/EmailTable";
import { EmailDetail } from "@/components/EmailDetail";
import { EmailFilter } from "@/components/EmailFilter";
import { Analytics } from "@/components/Analytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThemeIndicator } from "@/components/ThemeIndicator";
import { Mail, BarChart3, Settings, RefreshCw, Inbox } from "lucide-react";
import { Email } from "@/lib/types";
import { generateSupportReply, rewriteDraftShort } from "@/lib/llmClient";
import { loadEmailsFromCSV } from "@/lib/csvService";
import { mockAnalytics } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load emails from CSV on component mount
  useEffect(() => {
    loadEmailsFromCSV()
      .then((loadedEmails) => {
        setEmails(loadedEmails);
        setFilteredEmails(loadedEmails); // Initially show all emails
        setIsLoading(false);
        toast({
          title: "Emails loaded",
          description: `${loadedEmails.length} emails loaded from CSV file.`,
        });
      })
      .catch((error) => {
        console.error('Error loading emails:', error);
        setIsLoading(false);
        toast({
          title: "Error loading emails",
          description: "Failed to load emails from CSV file.",
          variant: "destructive",
        });
      });
  }, [toast]);

  // Generate analytics from loaded emails
  const generateAnalytics = (emails: Email[]) => {
    const filteredEmails = emails.filter(email => email.isFiltered);
    const urgentEmails = emails.filter(email => email.priority === 'urgent');
    const sentEmails = emails.filter(email => email.status === 'sent');
    const pendingEmails = emails.filter(email => email.status === 'pending');
    
    const sentimentBreakdown = emails.reduce((acc, email) => {
      acc[email.sentiment] = (acc[email.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const priorityBreakdown = emails.reduce((acc, email) => {
      acc[email.priority] = (acc[email.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Generate volume data (last 7 days)
    const volumeData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const count = emails.filter(email => 
        email.receivedAt >= dayStart && email.receivedAt <= dayEnd
      ).length;
      
      volumeData.push({
        time: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }
    
    return {
      totalEmails: emails.length,
      filteredEmails: filteredEmails.length,
      urgentEmails: urgentEmails.length,
      sentEmails: sentEmails.length,
      pendingEmails: pendingEmails.length,
      sentimentBreakdown: {
        positive: sentimentBreakdown.positive || 0,
        neutral: sentimentBreakdown.neutral || 0,
        negative: sentimentBreakdown.negative || 0
      },
      priorityBreakdown: {
        urgent: priorityBreakdown.urgent || 0,
        medium: priorityBreakdown.medium || 0,
        low: priorityBreakdown.low || 0
      },
      volumeData
    };
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleFilteredEmailsChange = (newFilteredEmails: Email[]) => {
    setFilteredEmails(newFilteredEmails);
    // If the currently selected email is not in the filtered list, clear selection
    if (selectedEmail && !newFilteredEmails.find(e => e.id === selectedEmail.id)) {
      setSelectedEmail(null);
    }
  };

  const handleRefreshEmails = async () => {
    setIsRefreshing(true);
    try {
      const loadedEmails = await loadEmailsFromCSV();
      setEmails(loadedEmails);
      setFilteredEmails(loadedEmails); // Reset filtered emails
      toast({
        title: "Emails refreshed",
        description: `${loadedEmails.length} emails reloaded from CSV file.`,
      });
    } catch (error) {
      console.error('Error refreshing emails:', error);
      toast({
        title: "Error refreshing emails",
        description: "Failed to refresh emails from CSV file.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRegenerateResponse = async (email: Email, customInstructions?: string) => {
    // If shorten requested, rewrite current draft
    if (customInstructions === "shorten" && email.response?.draftText) {
      const { draftText, model, errorMessage } = await rewriteDraftShort(email, email.response.draftText);
      const updatedEmail: Email = {
        ...email,
        response: {
          id: email.response.id,
          emailId: email.id,
          draftText,
          ragSources: email.response.ragSources || ["Knowledge Base"],
          generatedAt: new Date(),
          sentBy: "system",
          modelUsed: model,
          errorMessage,
        },
      };
      setEmails((prev) => prev.map((e) => (e.id === email.id ? updatedEmail : e)));
      setSelectedEmail(updatedEmail);
      return;
    }

    // Generate via OpenRouter (falls back to heuristic if no API key)
    const existing = email.response?.draftText;
    const randomVariant = Math.floor(Math.random() * 5) + 1; // 1..5
  const { draftText, model, errorMessage } = await generateSupportReply(email, {
      verbosity: customInstructions === "more_detail" ? "more_detail" : "default",
      regenerate: true,
      previousDraft: existing,
      variant: randomVariant,
    });
    const updatedEmail: Email = {
      ...email,
      response: {
        id: email.response?.id || `r${email.id}`,
        emailId: email.id,
        draftText,
        ragSources: email.response?.ragSources || ["Knowledge Base"],
        generatedAt: new Date(),
        sentBy: "system",
  modelUsed: model,
  errorMessage,
      },
    };

    setEmails((prev) => prev.map((e) => (e.id === email.id ? updatedEmail : e)));
    setSelectedEmail(updatedEmail);
  };

  const handleSendResponse = async (email: Email, responseText: string) => {
    // Simulate API call to send response
    const updatedEmail = {
      ...email,
      status: "sent" as const,
      response: {
        ...email.response!,
        finalText: responseText,
        sentAt: new Date(),
        sentBy: "human"
      }
    };
    
    setEmails(prev => prev.map(e => e.id === email.id ? updatedEmail : e));
    setSelectedEmail(updatedEmail);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">AI Email Support</h1>
                <p className="text-sm text-muted-foreground">Intelligent customer support assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button 
                onClick={handleRefreshEmails}
                disabled={isRefreshing}
                variant="outline"
                className="gap-2 hover-glow h-11 px-6"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh Emails'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="inbox" className="space-y-8">
          <TabsList className="grid w-full max-w-lg grid-cols-3 h-12 p-1 glass">
            <TabsTrigger value="inbox" className="gap-2 h-10 text-base font-semibold">
              <Inbox className="h-4 w-4" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 h-10 text-base font-semibold">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 h-10 text-base font-semibold">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-8">
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">Loading Emails</h3>
                  <p className="text-muted-foreground">Reading emails from CSV file...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Email Filter */}
                <EmailFilter
                  emails={emails}
                  onFilteredEmailsChange={handleFilteredEmailsChange}
                />
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Email List */}
                  <div className="lg:col-span-1">
                    <EmailTable
                      emails={filteredEmails}
                      onEmailSelect={handleEmailSelect}
                      selectedEmailId={selectedEmail?.id}
                    />
                  </div>

                  {/* Email Detail */}
                  <div className="lg:col-span-2">
                    {selectedEmail ? (
                      <EmailDetail
                        email={selectedEmail}
                        onRegenerateResponse={handleRegenerateResponse}
                        onSendResponse={handleSendResponse}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center card-modern min-h-[600px]">
                        <div className="text-center text-muted-foreground">
                          <Mail className="h-20 w-20 mx-auto mb-6 opacity-30" />
                          <h3 className="text-2xl font-bold mb-3">Select an Email</h3>
                          <p className="text-lg">Choose an email from the filtered list to view details and manage AI responses</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics data={generateAnalytics(filteredEmails)} />
          </TabsContent>

          <TabsContent value="settings">
            <div className="card-modern hover-lift">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gradient">Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass p-6 rounded-xl hover-lift">
                      <h4 className="font-bold text-lg mb-3">Theme Settings</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose your preferred theme or let the system decide
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ThemeToggle />
                          <span className="text-sm text-muted-foreground">Theme toggle</span>
                        </div>
                        <ThemeIndicator />
                      </div>
                    </div>
                    <div className="glass p-6 rounded-xl hover-lift">
                      <h4 className="font-bold text-lg mb-3">Email Integration</h4>
                      <p className="text-sm text-muted-foreground">Configure IMAP/Gmail settings for email ingestion</p>
                    </div>
                    <div className="glass p-6 rounded-xl hover-lift">
                      <h4 className="font-bold text-lg mb-3">AI Configuration</h4>
                      <p className="text-sm text-muted-foreground">Adjust AI response parameters and model settings</p>
                    </div>
                    <div className="glass p-6 rounded-xl hover-lift">
                      <h4 className="font-bold text-lg mb-3">CSV Data Source</h4>
                      <p className="text-sm text-muted-foreground">Currently loading emails from Demo.csv file</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
