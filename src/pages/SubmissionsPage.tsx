import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRecords } from "@/contexts/RecordsContext";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-warning/10 text-warning border-warning/20" },
  approved: { label: "Approved", icon: CheckCircle, className: "bg-success/10 text-success border-success/20" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SubmissionsPage() {
  const { records } = useRecords();
  const { user } = useAuth();

  const myRecords = records.filter((r) => r.studentId === user?.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Submissions</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Track your uploaded lab records and their review status.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", count: myRecords.length, icon: FileText, color: "text-primary bg-primary/10" },
          { label: "Approved", count: myRecords.filter((r) => r.status === "approved").length, icon: CheckCircle, color: "text-success bg-success/10" },
          { label: "Pending", count: myRecords.filter((r) => r.status === "pending").length, icon: Clock, color: "text-warning bg-warning/10" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Record History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Exp #</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Grade / Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No submissions yet. Upload your first record!
                  </TableCell>
                </TableRow>
              ) : (
                myRecords.map((r) => {
                  const sc = statusConfig[r.status];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.subject}</TableCell>
                      <TableCell>#{r.experimentNo}</TableCell>
                      <TableCell>
                        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium">
                          {r.fileName} ({formatSize(r.fileSize)})
                        </a>
                      </TableCell>
                      <TableCell>{r.uploadedAt}</TableCell>
                      <TableCell>
                        {r.facultyMarks != null ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`font-mono ${
                              r.facultyMarks >= 80 ? "border-success/30 text-success" :
                              r.facultyMarks >= 60 ? "border-warning/30 text-warning" :
                              "border-destructive/30 text-destructive"
                            }`}>
                              {r.facultyMarks}/100
                            </Badge>
                            {r.facultyGrade && (
                              <Badge className="font-bold text-xs" variant="secondary">
                                {r.facultyGrade}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${sc.className}`}>
                          <sc.icon className="h-3 w-3" /> {sc.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
