import { useState } from "react";
import { useRecords, type LabRecord } from "@/contexts/RecordsContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle,
  Bot,
  Loader2,
  AlertTriangle,
  Eye,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface AIAnalysis {
  grammar: number;
  plagiarism: number;
  completeness: number;
  formatting: number;
  accuracy: number;
  missingSections: string[];
}

const chartConfig: ChartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
};

export default function ReviewsPage() {
  const { user } = useAuth();
  const { records, updateRecord } = useRecords();
  const [selectedSubmission, setSelectedSubmission] = useState<LabRecord | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);
  const [marks, setMarks] = useState("");
  const [grade, setGrade] = useState("");
  const [approving, setApproving] = useState(false);

  const handleRunAI = async () => {
    if (!selectedSubmission || !selectedSubmission.fileUrl) {
      toast.error("No file available for analysis");
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    try {
      // Fetch the PDF file
      const response = await fetch(selectedSubmission.fileUrl);
      if (!response.ok) throw new Error("Failed to fetch document");
      const blob = await response.blob();

      // Convert to Base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(blob);
      const base64Data = await base64Promise;

      // Initialize Gemini API
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key is missing");
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
        Analyze the following lab record PDF. Provide a structured JSON response exactly matching this schema:
        {
          "grammar": number (0-10, score for grammar and spelling),
          "plagiarism": number (0-100, estimated percentage of potentially unoriginal text),
          "completeness": number (0-10, score for having all expected lab sections),
          "formatting": number (0-10, score for layout and presentation),
          "accuracy": number (0-10, score for scientific correctness),
          "missingSections": string[] (list of major missing sections, e.g. "Conclusion")
        }
        Do not wrap the JSON in Markdown code blocks. Just return the raw JSON object.
      `;

      // Generate Content
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "application/pdf" } }
      ]);

      const text = result.response.text();
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsedData: AIAnalysis = JSON.parse(cleaned);

      setAiResult(parsedData);
      toast.success("AI Analysis complete!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to run AI analysis");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    if (!marks || !grade) {
      toast.error("Please enter marks and grade before approving.");
      return;
    }

    setApproving(true);
    try {
      const dbUpdate = {
        status: "approved",
        faculty_marks: parseInt(marks),
        faculty_grade: grade.toUpperCase(),
      };

      const { error } = await supabase
        .from("lab_records")
        .update(dbUpdate)
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      updateRecord(selectedSubmission.id, {
        status: "approved",
        facultyMarks: dbUpdate.faculty_marks,
        facultyGrade: dbUpdate.faculty_grade
      });

      toast.success("Record approved successfully!");
      handleBack();
    } catch (err: any) {
      toast.error(err.message || "Failed to approve record");
    } finally {
      setApproving(false);
    }
  };

  const handleBack = () => {
    setSelectedSubmission(null);
    setAiResult(null);
    setAiLoading(false);
    setMarks("");
    setGrade("");
  };

  const radarData = aiResult
    ? [
        { metric: "Grammar", score: aiResult.grammar * 10 },
        { metric: "Originality", score: 100 - aiResult.plagiarism },
        { metric: "Completeness", score: aiResult.completeness * 10 },
        { metric: "Formatting", score: aiResult.formatting * 10 },
        { metric: "Accuracy", score: aiResult.accuracy * 10 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pending Reviews</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Review student lab submissions and provide AI-assisted feedback.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedSubmission ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-3"
          >
            {records.filter((s) => s.status === "pending" && s.targetFacultyId?.toLowerCase() === user?.registrationId?.toLowerCase()).map((sub) => (
              <Card key={sub.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{sub.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.studentName} · {sub.subject} · Exp #{sub.experimentNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> {sub.uploadedAt}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4 mr-1" /> Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to Queue
            </Button>

            <div className="grid lg:grid-cols-2 gap-4">
              {/* Document Viewer (Mock) */}
              <Card className="lg:row-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{selectedSubmission.title}</CardTitle>
                  <CardDescription>
                    {selectedSubmission.studentName} · {selectedSubmission.subject} · Exp #{selectedSubmission.experimentNo}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedSubmission.fileUrl ? (
                    <iframe
                      src={selectedSubmission.fileUrl}
                      className="w-full h-[450px] rounded-lg border bg-muted/10"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="rounded-lg border bg-muted/30 h-[450px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <FileText className="h-16 w-16 opacity-30" />
                      <p className="text-sm font-medium">No PDF Available</p>
                      <p className="text-xs">This record is missing a file URL.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Grading Panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Grading Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Marks (Out of 100)</Label>
                      <Input type="number" value={marks} onChange={e => setMarks(e.target.value)} placeholder="e.g. 95" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Grade</Label>
                      <Input type="text" value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. A+" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={handleRunAI} disabled={aiLoading}>
                      <Bot className="h-4 w-4 mr-2" />
                      Run AI Analysis
                    </Button>
                    <Button className="flex-1" onClick={handleApprove} disabled={approving}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {approving ? "Approving..." : "Approve Record"}
                    </Button>
                  </div>

                  <AnimatePresence mode="wait">
                    {aiLoading && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <Card className="border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">Scanning Document...</p>
                            <Progress value={65} className="w-48 h-2" />
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}

                    {aiResult && !aiLoading && (
                      <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <Separator />
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Bot className="h-4 w-4 text-primary" /> AI Feedback
                        </p>

                        {/* Score Cards */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-lg border p-3 space-y-1">
                            <p className="text-xs text-muted-foreground">Grammar Score</p>
                            <p className="text-2xl font-bold text-primary">{aiResult.grammar}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
                          </div>
                          <div className="rounded-lg border p-3 space-y-1">
                            <p className="text-xs text-muted-foreground">Plagiarism Check</p>
                            <p className="text-2xl font-bold">
                              <span className={aiResult.plagiarism > 25 ? "text-destructive" : "text-success"}>{aiResult.plagiarism}%</span>
                            </p>
                          </div>
                        </div>

                        {/* Missing Sections */}
                        <div className="rounded-lg border p-3 space-y-2">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-warning" /> Missing Sections
                          </p>
                          <ul className="space-y-1">
                            {aiResult.missingSections.map((s) => (
                              <li key={s} className="text-sm flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-warning shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              {aiResult && !aiLoading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Score Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="aspect-square h-[260px] mx-auto">
                        <RadarChart data={radarData}>
                          <PolarGrid className="stroke-border" />
                          <PolarAngleAxis dataKey="metric" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Score"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            fill="hsl(var(--primary))"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </RadarChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
