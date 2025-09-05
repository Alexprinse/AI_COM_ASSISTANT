import { useState } from "react";
import { formatDistanceToNow, isValid } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SentimentBadge } from "@/components/SentimentBadge";
import { Search, Eye } from "lucide-react";
import { Email } from "@/lib/types";
import { cn } from "@/lib/utils";

interface EmailTableProps {
  emails: Email[];
  onEmailSelect: (email: Email) => void;
  selectedEmailId?: string;
}

export function EmailTable({ emails, onEmailSelect, selectedEmailId }: EmailTableProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Safely format relative time; fallback to ISO/local date if invalid
  const safeFormatDistanceToNow = (date: Date) => {
    if (!(date instanceof Date)) return "Invalid date";
    if (!isValid(date) || isNaN(date.getTime())) {
      try {
        // Attempt reparsing if it came through as a string accidentally
        const reparsed = new Date(date as unknown as string);
        if (isValid(reparsed)) {
          return formatDistanceToNow(reparsed, { addSuffix: true });
        }
      } catch {
        /* ignore */
      }
      return "Invalid date";
    }
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Invalid date";
    }
  };

  const filteredEmails = emails.filter((email) =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.fromEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedEmails = [...filteredEmails].sort((a, b) => {
    // Sort by priority first (urgent > medium > low)
    const priorityOrder = { urgent: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by priority score
    const scoreDiff = b.priorityScore - a.priorityScore;
    if (scoreDiff !== 0) return scoreDiff;
    
    // Finally by received time (newest first)
    return b.receivedAt.getTime() - a.receivedAt.getTime();
  });

  const getStatusBadge = (status: Email["status"]) => {
    const statusConfig = {
      pending: { variant: "outline" as const, label: "Pending" },
      drafted: { variant: "secondary" as const, label: "Drafted" },
      sent: { variant: "default" as const, label: "Sent" },
      skipped: { variant: "destructive" as const, label: "Skipped" }
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="card-modern hover-lift">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gradient mb-2">Support Emails</h2>
            <p className="text-sm text-muted-foreground">
              {filteredEmails.length} filtered emails in your inbox
            </p>
          </div>
          <div className="glass px-4 py-2 rounded-full">
            <span className="text-sm font-medium">{filteredEmails.length}</span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/30 border-0 focus:bg-background transition-colors"
          />
        </div>
      </div>
      
      <div className="overflow-auto max-h-[650px]">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-[120px] font-semibold">Priority</TableHead>
              <TableHead className="w-[120px] font-semibold">Sentiment</TableHead>
              <TableHead className="font-semibold">From</TableHead>
              <TableHead className="font-semibold">Subject</TableHead>
              <TableHead className="w-[140px] font-semibold">Received</TableHead>
              <TableHead className="w-[120px] font-semibold">Status</TableHead>
              <TableHead className="w-[80px] font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEmails.map((email) => (
              <TableRow
                key={email.id}
                className={cn(
                  "cursor-pointer border-border/30 hover:bg-muted/50 transition-all duration-200 hover:shadow-sm",
                  selectedEmailId === email.id && "bg-primary/5 border-l-4 border-l-primary shadow-sm"
                )}
                onClick={() => onEmailSelect(email)}
              >
                <TableCell className="py-4">
                  <PriorityBadge priority={email.priority} />
                </TableCell>
                <TableCell className="py-4">
                  <SentimentBadge sentiment={email.sentiment} />
                </TableCell>
                <TableCell className="font-medium max-w-[200px] truncate py-4">
                  {email.fromEmail}
                </TableCell>
                <TableCell className="max-w-[300px] truncate py-4 font-medium">
                  {email.subject}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-4">
                  {safeFormatDistanceToNow(email.receivedAt)}
                </TableCell>
                <TableCell className="py-4">
                  {getStatusBadge(email.status)}
                </TableCell>
                <TableCell className="py-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover-glow rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEmailSelect(email);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}