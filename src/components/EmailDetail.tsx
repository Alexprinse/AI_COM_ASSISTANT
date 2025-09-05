import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SentimentBadge } from "@/components/SentimentBadge";
import { 
  RefreshCw, 
  Send, 
  User, 
  Clock, 
  Mail, 
  Tag, 
  FileText,
  Phone,
  Package,
  AlertCircle
} from "lucide-react";
import { Email, EmailEntity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface EmailDetailProps {
  email: Email;
  onRegenerateResponse: (email: Email, customInstructions?: string) => void;
  onSendResponse: (email: Email, responseText: string) => void;
}

export function EmailDetail({ email, onRegenerateResponse, onSendResponse }: EmailDetailProps) {
  const [draftText, setDraftText] = useState(email.response?.draftText || "");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [moreDetail, setMoreDetail] = useState(false);
  const { toast } = useToast();

  // Keep local draft in sync when a new email is selected or regenerated upstream
  useEffect(() => {
    setDraftText(email.response?.draftText || "");
  }, [email.id, email.response?.draftText]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await onRegenerateResponse(email, moreDetail ? "more_detail" : undefined);
      toast({
        title: "Response regenerated",
        description: "A new AI response has been generated for this email.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSend = async () => {
    if (!draftText.trim()) {
      toast({
        title: "Error",
        description: "Please provide a response before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      await onSendResponse(email, draftText);
      toast({
        title: "Email sent",
        description: `Response sent to ${email.fromEmail}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getEntityIcon = (type: EmailEntity["entityType"]) => {
    const icons = {
      phone: Phone,
      email: Mail,
      product: Package,
      order_id: Tag,
      issue: AlertCircle,
      keyword: Tag
    };
    return icons[type] || Tag;
  };

  return (
    <div className="space-y-8">
      {/* Email Header */}
      <div className="card-modern hover-lift">
        <CardHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <CardTitle className="text-2xl font-bold leading-tight">{email.subject}</CardTitle>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{email.fromEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatDistanceToNow(email.receivedAt, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PriorityBadge priority={email.priority} />
              <SentimentBadge sentiment={email.sentiment} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="glass p-6 rounded-xl">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {email.bodyText}
              </pre>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Extracted Entities */}
      {email.entities && email.entities.length > 0 && (
        <div className="card-modern hover-lift">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <Tag className="h-5 w-5 text-primary" />
              Extracted Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {email.entities.map((entity, index) => {
                const Icon = getEntityIcon(entity.entityType);
                return (
                  <div key={index} className="flex items-center gap-3 p-4 glass rounded-xl">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold capitalize text-muted-foreground">
                        {entity.entityType.replace('_', ' ')}
                      </div>
                      <div className="text-sm font-medium">
                        {entity.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </div>
      )}

      {/* AI Response */}
      <div className="card-modern hover-lift">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              AI Generated Response
            </CardTitle>
            <div className="flex items-center gap-4">
              {email.response?.modelUsed && (
                <div className="text-xs text-muted-foreground font-medium">Model: {email.response.modelUsed}</div>
              )}
              {email.response?.errorMessage && (
                <div className="text-xs text-destructive/80 font-medium" title={email.response.errorMessage}>
                  {email.response.errorMessage.substring(0, 48)}{email.response.errorMessage.length > 48 ? '…' : ''}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch id="more-detail" checked={moreDetail} onCheckedChange={setMoreDetail} />
                <label htmlFor="more-detail" className="text-xs text-muted-foreground font-medium">More detail</label>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="hover-glow"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRegenerating && "animate-spin")} />
              Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {email.response?.ragSources && email.response.ragSources.length > 0 && (
            <div className="glass p-4 rounded-xl">
              <div className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Knowledge Sources</div>
              <div className="flex flex-wrap gap-2">
                {email.response.ragSources.map((source, index) => (
                  <Badge key={index} variant="outline" className="font-medium">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            <Textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              placeholder="AI response will appear here..."
              className="min-h-[240px] resize-none bg-muted/30 border-0 focus:bg-background transition-colors rounded-xl"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground font-medium">
                {email.status === "sent" ? "✓ Email sent successfully" : "Ready to send"}
              </div>
              <Button
                onClick={handleSend}
                disabled={isSending || email.status === "sent" || !draftText.trim()}
                className="hover-glow h-12 px-6 text-base font-semibold"
                size="lg"
              >
                <Send className={cn("h-4 w-4 mr-2", isSending && "animate-pulse")} />
                {isSending ? "Sending..." : "Send Response"}
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </div>
  );
}