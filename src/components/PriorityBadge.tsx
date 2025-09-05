import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Minus } from "lucide-react";

type Priority = "urgent" | "medium" | "low";

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig = {
  urgent: {
    variant: "urgent" as const,
    icon: AlertTriangle,
    label: "Urgent"
  },
  medium: {
    variant: "medium" as const,
    icon: Clock,
    label: "Medium"
  },
  low: {
    variant: "low" as const,
    icon: Minus,
    label: "Low"
  }
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className={cn("gap-1", className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}