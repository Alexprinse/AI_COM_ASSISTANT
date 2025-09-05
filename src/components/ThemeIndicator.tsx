import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Monitor, Moon, Sun } from "lucide-react";

export function ThemeIndicator() {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  const currentTheme = theme === "system" ? systemTheme : theme;
  
  const getThemeInfo = () => {
    switch (currentTheme) {
      case "dark":
        return { icon: Moon, label: "Dark", variant: "secondary" as const };
      case "light":
        return { icon: Sun, label: "Light", variant: "outline" as const };
      default:
        return { icon: Monitor, label: "System", variant: "default" as const };
    }
  };

  const { icon: Icon, label, variant } = getThemeInfo();

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
