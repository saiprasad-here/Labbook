import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle,
  X,
  CloudUpload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecords, type LabRecord } from "@/contexts/RecordsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const subjects = [
  "C",
  "Java",
  "Python",
  "DBMS",
  "Algorithms",
  "Data Structure",
  "Operating System"
];

export default function UploadPage() {
  const { addRecord } = useRecords();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [experimentNo, setExperimentNo] = useState("");
  const [targetFacultyId, setTargetFacultyId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB.");
      return;
    }
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(10);

    try {
      // Clean the filename of special characters to prevent "Invalid Key" Supabase errors
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const filePath = `${user.id}/${Date.now()}_${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage.from("lab_records").upload(filePath, file);
      
      if (uploadError) throw uploadError;
      setProgress(50);

      const { data: { publicUrl } } = supabase.storage.from("lab_records").getPublicUrl(filePath);
      setProgress(70);

      const dbRecord = {
        title,
        subject,
        experiment_no: parseInt(experimentNo),
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: publicUrl,
        student_id: user.id,
        student_name: user.name,
        target_faculty_id: targetFacultyId,
        status: "pending"
      };

      const { data: insertedData, error: dbError } = await supabase.from("lab_records").insert(dbRecord).select().single();
      if (dbError) throw dbError;
      setProgress(100);

      const record: LabRecord = {
        id: insertedData.id,
        title,
        subject,
        experimentNo: dbRecord.experiment_no,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: publicUrl,
        uploadedAt: new Date().toISOString().split("T")[0],
        status: "pending",
        aiScore: null,
        studentId: user.id,
        studentName: user.name,
        targetFacultyId,
      };

      addRecord(record);
      toast.success("Record uploaded successfully!");
      setStep(1);
      setTitle("");
      setSubject("");
      setExperimentNo("");
      setTargetFacultyId("");
      setFile(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload record");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const canProceedStep1 = title.trim() && subject && experimentNo && targetFacultyId.trim();
  const canProceedStep2 = !!file;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Lab Record</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Submit your experiment record for review.</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <CheckCircle className="h-4 w-4" /> : s}
            </div>
            {s < 3 && <div className={`h-0.5 w-8 transition-colors ${step > s ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
        <span className="text-sm text-muted-foreground ml-2">
          {step === 1 ? "Details" : step === 2 ? "File Upload" : "Confirm"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Details */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle>Experiment Details</CardTitle>
                <CardDescription>Provide information about your lab experiment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Experiment Title</Label>
                  <Input id="title" placeholder="Enter Experiment Details" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facultyId">Faculty Registration ID</Label>
                  <Input id="facultyId" placeholder="e.g. FAC-CSE-001" value={targetFacultyId} onChange={(e) => setTargetFacultyId(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={subject} onValueChange={setSubject}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expNo">Experiment #</Label>
                    <Input id="expNo" type="number" min={1} placeholder="e.g. 3" value={experimentNo} onChange={(e) => setExperimentNo(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button disabled={!canProceedStep1} onClick={() => setStep(2)}>
                    Next: Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Dropzone */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle>Upload PDF</CardTitle>
                <CardDescription>Drag & drop your lab record PDF or click to browse.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                      dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <CloudUpload className={`h-12 w-12 mx-auto mb-3 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="font-medium text-foreground">Drop your PDF here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse · PDF only · Max 10MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatSize(file.size)} · {file.type}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium">{Math.min(Math.round(progress), 100)}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button disabled={!canProceedStep2} onClick={() => setStep(3)}>Next: Confirm</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card>
              <CardHeader>
                <CardTitle>Confirm Submission</CardTitle>
                <CardDescription>Review your details before submitting.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Title</p>
                    <p className="font-medium mt-0.5">{title}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Subject</p>
                    <p className="font-medium mt-0.5">{subject}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">Experiment #</p>
                    <p className="font-medium mt-0.5">{experimentNo}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs">File</p>
                    <p className="font-medium mt-0.5 truncate">{file?.name}</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={handleSubmit} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Submit Record"}
                  </Button>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Uploading...</span>
                      <span className="font-medium">{Math.min(Math.round(progress), 100)}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
