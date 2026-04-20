import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface LabRecord {
  id: string;
  title: string;
  subject: string;
  experimentNo: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
  status: "pending" | "approved" | "rejected";
  aiScore: number | null;
  studentId: string;
  studentName: string;
  facultyMarks?: number;
  facultyGrade?: string;
  targetFacultyId?: string;
}

interface RecordsContextType {
  records: LabRecord[];
  addRecord: (record: LabRecord) => void;
  updateRecord: (id: string, updates: Partial<LabRecord>) => void;
}



const RecordsContext = createContext<RecordsContextType | null>(null);

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error("useRecords must be used within RecordsProvider");
  return ctx;
}

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<LabRecord[]>([]);

  useEffect(() => {
    async function loadRecords() {
      const { data } = await supabase.from("lab_records").select("*").order("uploaded_at", { ascending: false });
      if (data) {
        setRecords(data.map(d => ({
          id: d.id,
          title: d.title,
          subject: d.subject,
          experimentNo: d.experiment_no,
          fileName: d.file_name,
          fileSize: Number(d.file_size),
          fileType: d.file_type,
          fileUrl: d.file_url,
          uploadedAt: d.uploaded_at ? d.uploaded_at.split("T")[0] : "",
          status: d.status as any,
          aiScore: d.ai_score,
          studentId: d.student_id,
          studentName: d.student_name,
          facultyMarks: d.faculty_marks,
          facultyGrade: d.faculty_grade,
          targetFacultyId: d.target_faculty_id
        })));
      }
    }
    loadRecords();
  }, []);

  const addRecord = (record: LabRecord) => {
    setRecords((prev) => [record, ...prev]);
  };

  const updateRecord = (id: string, updates: Partial<LabRecord>) => {
    setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <RecordsContext.Provider value={{ records, addRecord, updateRecord }}>
      {children}
    </RecordsContext.Provider>
  );
}
