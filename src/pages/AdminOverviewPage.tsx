import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, PieChart as PieIcon, Trophy, FileText, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useRecords } from "@/contexts/RecordsContext";

const barChartConfig: ChartConfig = {
  submissions: {
    label: "Submissions",
    color: "hsl(var(--primary))",
  },
};

const pieChartConfig: ChartConfig = {
  approved: {
    label: "Approved",
    color: "hsl(var(--success))",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(var(--destructive))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--warning))",
  },
};

const PIE_COLORS = [
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
];

export default function AdminOverviewPage() {
  const { records } = useRecords();

  const subjectData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      counts[r.subject] = (counts[r.subject] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([subject, submissions]) => ({ subject, submissions }))
      .sort((a, b) => b.submissions - a.submissions);
  }, [records]);

  const statusData = useMemo(() => {
    const counts = { approved: 0, rejected: 0, pending: 0 };
    records.forEach((r) => {
      counts[r.status]++;
    });
    return [
      { name: "Approved", value: counts.approved },
      { name: "Rejected", value: counts.rejected },
      { name: "Pending", value: counts.pending },
    ];
  }, [records]);

  const topStudents = useMemo(() => {
    const scores: Record<string, { name: string; total: number; count: number }> = {};
    records.forEach((r) => {
      if (r.facultyMarks != null) {
        if (!scores[r.studentId]) {
          scores[r.studentId] = { name: r.studentName, total: 0, count: 0 };
        }
        scores[r.studentId].total += r.facultyMarks;
        scores[r.studentId].count++;
      }
    });
    return Object.entries(scores)
      .map(([id, s]) => ({ id, name: s.name, avgScore: Math.round(s.total / s.count), recordCount: s.count }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 5);
  }, [records]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">System-wide analytics and performance metrics.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Records", value: records.length, icon: FileText, color: "text-primary bg-primary/10" },
          { label: "Unique Students", value: new Set(records.map((r) => r.studentId)).size, icon: Users, color: "text-info bg-info/10" },
          { label: "Avg Class Score", value: `${Math.round(records.filter((r) => r.facultyMarks != null).reduce((a, r) => a + (r.facultyMarks || 0), 0) / (records.filter((r) => r.facultyMarks != null).length || 1))}%`, icon: BarChart3, color: "text-success bg-success/10" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Submissions per Subject
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={barChartConfig} className="h-[280px]">
                <BarChart data={subjectData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="submissions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" /> Record Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pieChartConfig} className="h-[280px]">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    nameKey="name"
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Students */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-4 w-4 text-warning" /> Top Performing Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? "bg-warning/10 text-warning" : i === 1 ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.recordCount} records submitted</p>
                  </div>
                  <Badge variant="outline" className={`font-mono ${
                    s.avgScore >= 80 ? "border-success/30 text-success" :
                    s.avgScore >= 60 ? "border-warning/30 text-warning" :
                    "border-destructive/30 text-destructive"
                  }`}>
                    Avg: {s.avgScore}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
