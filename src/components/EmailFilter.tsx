import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Email } from "@/lib/types";

export interface FilterOptions {
  support: boolean;
  query: boolean;
  request: boolean;
  help: boolean;
  issue: boolean;
  problem: boolean;
  error: boolean;
  assistance: boolean;
}

interface EmailFilterProps {
  emails: Email[];
  onFilteredEmailsChange: (filteredEmails: Email[]) => void;
  className?: string;
}

const defaultFilters: FilterOptions = {
  support: true,
  query: true,
  request: true,
  help: true,
  issue: true,
  problem: true,
  error: true,
  assistance: true,
};

export function EmailFilter({ emails, onFilteredEmailsChange, className }: EmailFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const filterKeywords = {
    support: 'Support',
    query: 'Query',
    request: 'Request',
    help: 'Help',
    issue: 'Issue',
    problem: 'Problem',
    error: 'Error',
    assistance: 'Assistance',
  };

  const applyFilters = (newFilters: FilterOptions) => {
    const activeKeywords = Object.keys(newFilters)
      .filter(key => newFilters[key as keyof FilterOptions])
      .map(key => key.toLowerCase());

    if (activeKeywords.length === 0) {
      onFilteredEmailsChange(emails);
      return;
    }

    const filteredEmails = emails.filter(email => {
      const text = (email.subject + ' ' + email.bodyText).toLowerCase();
      return activeKeywords.some(keyword => text.includes(keyword));
    });

    onFilteredEmailsChange(filteredEmails);
  };

  const handleFilterChange = (filterKey: keyof FilterOptions, checked: boolean) => {
    const newFilters = { ...filters, [filterKey]: checked };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key as keyof FilterOptions] = false;
      return acc;
    }, {} as FilterOptions);
    
    setFilters(clearedFilters);
    applyFilters(clearedFilters);
  };

  const selectAllFilters = () => {
    setFilters(defaultFilters);
    applyFilters(defaultFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(Boolean).length;
  };

  const getFilteredEmailCount = () => {
    const activeKeywords = Object.keys(filters)
      .filter(key => filters[key as keyof FilterOptions])
      .map(key => key.toLowerCase());

    if (activeKeywords.length === 0) return emails.length;

    return emails.filter(email => {
      const text = (email.subject + ' ' + email.bodyText).toLowerCase();
      return activeKeywords.some(keyword => text.includes(keyword));
    }).length;
  };

  return (
    <Card className={`card-modern ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            Email Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getActiveFilterCount()} active
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {getFilteredEmailCount()} emails
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 w-8 p-0"
            >
              <Filter className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {showFilters && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllFilters}
                className="h-8 text-xs"
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(filterKeywords).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={filters[key as keyof FilterOptions]}
                    onCheckedChange={(checked) => 
                      handleFilterChange(key as keyof FilterOptions, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
            
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Emails are filtered by subject line and body content containing the selected terms.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
