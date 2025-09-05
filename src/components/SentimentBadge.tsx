import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Smile, Meh, Frown } from "lucide-react";

type Sentiment = "positive" | "neutral" | "negative";

interface SentimentBadgeProps {
  sentiment: Sentiment;
  className?: string;
}

const sentimentConfig = {
  positive: {
    variant: "positive" as const,
    icon: Smile,
    label: "Positive"
  },
  neutral: {
    variant: "neutral" as const,
    icon: Meh,
    label: "Neutral"
  },
  negative: {
    variant: "negative" as const,
    icon: Frown,
    label: "Negative"
  }
};

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}