import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import {
  Mail,
  Filter,
  AlertTriangle,
  Send,
  Clock,
  TrendingUp
} from "lucide-react";
import { AnalyticsData } from "@/lib/types";

interface AnalyticsProps {
  data: AnalyticsData;
}

export function Analytics({ data }: AnalyticsProps) {
  const sentimentData = [
    { name: "Positive", value: data.sentimentBreakdown.positive, color: "hsl(var(--positive))" },
    { name: "Neutral", value: data.sentimentBreakdown.neutral, color: "hsl(var(--neutral))" },
    { name: "Negative", value: data.sentimentBreakdown.negative, color: "hsl(var(--negative))" }
  ];

  const priorityData = [
    { name: "Urgent", value: data.priorityBreakdown.urgent, color: "hsl(var(--urgent))" },
    { name: "Medium", value: data.priorityBreakdown.medium, color: "hsl(var(--medium))" },
    { name: "Low", value: data.priorityBreakdown.low, color: "hsl(var(--low))" }
  ];

  const kpiCards = [
    {
      title: "Total Emails",
      value: data.totalEmails,
      icon: Mail,
      description: "Received in 24h"
    },
    {
      title: "Filtered",
      value: data.filteredEmails,
      icon: Filter,
      description: "Support emails"
    },
    {
      title: "Urgent",
      value: data.urgentEmails,
      icon: AlertTriangle,
      description: "High priority",
      accent: "urgent"
    },
    {
      title: "Sent",
      value: data.sentEmails,
      icon: Send,
      description: "Responses sent"
    },
    {
      title: "Pending",
      value: data.pendingEmails,
      icon: Clock,
      description: "Awaiting response",
      accent: "medium"
    },
    {
      title: "Response Rate",
      value: data.totalEmails > 0 ? `${Math.round((data.sentEmails / data.filteredEmails) * 100)}%` : "0%",
      icon: TrendingUp,
      description: "Completion rate"
    }
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="card-modern hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.title}
                    </p>
                    <p className="text-3xl font-bold tracking-tight">
                      {kpi.value}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpi.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl glass ${
                    kpi.accent === "urgent" ? "bg-urgent/10 text-urgent" :
                    kpi.accent === "medium" ? "bg-medium/10 text-medium" :
                    "bg-primary/10 text-primary"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sentiment Breakdown */}
        <div className="card-modern hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </div>

        {/* Priority Breakdown */}
        <div className="card-modern hover-lift">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="none"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Volume Chart */}
      <div className="card-modern hover-lift">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold">Email Volume (24 Hours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.volumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </div>
    </div>
  );
}