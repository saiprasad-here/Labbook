import { useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRecords } from "@/contexts/RecordsContext";
import { Link } from "react-router-dom";
import {
  FileText,
  CheckCircle,
  Clock,
  Users,
  XCircle,
  Upload,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <Card className="shadow-soft-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const statusBadge = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20", Icon: Clock },
  approved: { label: "Approved", className: "bg-success/10 text-success border-success/20", Icon: CheckCircle },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20", Icon: XCircle },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { records } = useRecords();

  const myRecords = useMemo(
    () => (user ? records.filter((r) => r.studentId === user.id) : []),
    [records, user],
  );

  const stats = useMemo(() => {
    if (!user) return [];
    if (user.role === "student") {
      return [
        { title: "Total Submissions", value: myRecords.length, icon: FileText, color: "bg-primary/10 text-primary" },
        { title: "Approved", value: myRecords.filter((r) => r.status === "approved").length, icon: CheckCircle, color: "bg-success/10 text-success" },
        { title: "Pending Review", value: myRecords.filter((r) => r.status === "pending").length, icon: Clock, color: "bg-warning/10 text-warning" },
      ];
    }
    if (user.role === "faculty") {
      const myQueue = records.filter(r => r.targetFacultyId?.toLowerCase() === user.registrationId?.toLowerCase());
      return [
        { title: "Pending Reviews", value: myQueue.filter((r) => r.status === "pending").length, icon: Clock, color: "bg-warning/10 text-warning" },
        { title: "Approved Today", value: myQueue.filter((r) => r.status === "approved").length, icon: CheckCircle, color: "bg-success/10 text-success" },
        { title: "Total Students", value: new Set(myQueue.map((r) => r.studentId)).size, icon: Users, color: "bg-info/10 text-info" },
      ];
    }
    return [
      { title: "Total Users", value: new Set(records.map((r) => r.studentId)).size + 4, icon: Users, color: "bg-primary/10 text-primary" },
      { title: "Total Records", value: records.length, icon: FileText, color: "bg-info/10 text-info" },
      { title: "Pending Reviews", value: records.filter((r) => r.status === "pending").length, icon: Clock, color: "bg-warning/10 text-warning" },
    ];
  }, [user, records, myRecords]);

  const recentRecords = useMemo(() => {
    if (!user) return [];
    
    let list = records;
    if (user.role === "student") list = myRecords;
    if (user.role === "faculty") list = records.filter(r => r.targetFacultyId?.toLowerCase() === user.registrationId?.toLowerCase());

    return [...list].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, 5);
  }, [user, myRecords, records]);

  if (!user) return null;

  const quickActions = user.role === "student"
    ? [{ to: "/upload", label: "Upload New Record", icon: Upload }, { to: "/submissions", label: "View Submissions", icon: FileText }]
    : user.role === "faculty"
    ? [{ to: "/reviews", label: "Review Queue", icon: ClipboardCheck }]
    : [{ to: "/records", label: "Analytics", icon: TrendingUp }, { to: "/users", label: "Manage Users", icon: Users }];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-soft-sm overflow-hidden border-primary/20">
          <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Welcome back, {user.name.split(" ")[0]} 👋
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Here's an overview of your {user.role === "student" ? "submissions" : user.role === "faculty" ? "review queue" : "system"}.
              </p>
              {(user.branch || user.registrationId) && (
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {user.branch && (
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                      {user.branch}
                    </Badge>
                  )}
                  {user.registrationId && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {user.registrationId}
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">{user.role}</Badge>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {quickActions.map((a) => (
                <Button key={a.to} asChild variant="outline" size="sm">
                  <Link to={a.to}>
                    <a.icon className="h-4 w-4 mr-1.5" /> {a.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card className="shadow-soft-sm">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Latest {user.role === "student" ? "of your" : "system"} lab record submissions
            </CardDescription>
          </div>
          {user.role === "student" && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/submissions">
                View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No records yet. {user.role === "student" && "Upload your first lab record!"}
            </p>
          ) : (
            <div className="space-y-2">
              {recentRecords.map((r) => {
                const sb = statusBadge[r.status];
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.role !== "student" && `${r.studentName} · `}{r.subject} · Exp #{r.experimentNo} · {r.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`gap-1 shrink-0 ${sb.className}`}>
                      <sb.Icon className="h-3 w-3" /> {sb.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
