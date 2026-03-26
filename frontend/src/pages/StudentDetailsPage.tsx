import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState, useRef } from "react";

import api, { getProfileImageUrl } from "../lib/api";
import { labels } from "../lib/i18n-he";
import { StudentDisciplineTab } from "../components/StudentDisciplineTab";
import { StudentEvaluationTab } from "../components/StudentEvaluationTab";
import { StudentMedicalTab } from "../components/StudentMedicalTab";
import { StudentSummariesTab } from "../components/StudentSummariesTab";
import { StudentPersonalTab } from "../components/StudentPersonalTab";

export type StudentDetails = {
  id: number;
  full_name: string;
  id_number: string;
  personal_number?: string | null;
  course_name: string;
  track: string;
  class_name: string;
  commander_name: string;
  commander_id?: number | null;
  department_id?: number | null;
  department_name?: string | null;
  status: string;
  profile_image?: string | null;
  birth_date?: string | null;
  address_city?: string | null;
  address_street?: string | null;
  address_is_far?: boolean | null;
  parents?: { name: string; phone: string }[] | null;
  metrics?: {
    discipline_count: number;
    average_grade?: number | null;
    has_active_medical_issue: boolean;
  };
};

export function StudentDetailsPage() {
  const params = useParams<{ id: string }>();
  const studentId = Number(params.id);
  const queryClient = useQueryClient();

  const { data } = useQuery<StudentDetails>({
    queryKey: ["student", studentId],
    enabled: Number.isFinite(studentId),
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}`);
      return res.data;
    }
  });

  if (!data) {
    return (
      <div className="text-slate-500">
        טוען נתוני חניך...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StudentHeader student={data} onPhotoUploaded={() => queryClient.invalidateQueries({ queryKey: ["student", data.id] })} />
      <Tabs studentId={data.id} student={data} />
    </div>
  );
}

type StudentHeaderProps = {
  student: StudentDetails;
  onPhotoUploaded: () => void;
};

function StudentHeader({ student, onPhotoUploaded }: StudentHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const imageUrl = getProfileImageUrl(student.profile_image);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/students/${student.id}/profile-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      onPhotoUploaded();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <header className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative flex-shrink-0">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="block rounded-full overflow-hidden border-2 border-slate-200 hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-20 h-20 bg-slate-100"
          title="העלאת תמונה"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-2xl text-slate-400">
              {student.full_name.charAt(0)}
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white text-xs">
            ...
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-slate-900 truncate">{student.full_name}</h1>
        {(student.personal_number || student.department_name) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-slate-600">
            {student.personal_number && <span>מס׳ אישי: {student.personal_number}</span>}
            {student.department_name && <span>מגמה: {student.department_name}</span>}
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-1 text-sm text-emerald-600 hover:underline disabled:opacity-50"
        >
          {uploading ? "מעלה..." : "העלאת תמונה"}
        </button>
      </div>
    </header>
  );
}

type TabsProps = {
  studentId: number;
  student: StudentDetails;
};

type TabKey = "discipline" | "evaluation" | "medical" | "summaries" | "personal";

function Tabs({ studentId, student }: TabsProps) {
  const [active, setActive] = useState<TabKey>("personal");

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
      <div className="mb-2 flex gap-3 border-b border-slate-200 pb-2 text-sm">
        <TabButton
          active={active === "personal"}
          onClick={() => setActive("personal")}
        >
          {labels.studentDetails.tabs.personal}
        </TabButton>
        <TabButton
          active={active === "discipline"}
          onClick={() => setActive("discipline")}
        >
          {labels.studentDetails.tabs.discipline}
        </TabButton>
        <TabButton
          active={active === "evaluation"}
          onClick={() => setActive("evaluation")}
        >
          {labels.studentDetails.tabs.evaluation}
        </TabButton>
        <TabButton
          active={active === "medical"}
          onClick={() => setActive("medical")}
        >
          {labels.studentDetails.tabs.medical}
        </TabButton>
        <TabButton
          active={active === "summaries"}
          onClick={() => setActive("summaries")}
        >
          {labels.studentDetails.tabs.summaries}
        </TabButton>
      </div>
      {active === "personal" && <StudentPersonalTab studentId={studentId} student={student} />}
      {active === "discipline" && <StudentDisciplineTab studentId={studentId} />}
      {active === "evaluation" && <StudentEvaluationTab studentId={studentId} />}
      {active === "medical" && <StudentMedicalTab studentId={studentId} />}
      {active === "summaries" && <StudentSummariesTab studentId={studentId} />}
    </section>
  );
}

type TabButtonProps = {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-md px-3 py-1 " +
        (active
          ? "bg-emerald-600 text-white"
          : "bg-transparent text-slate-600 hover:bg-slate-100")
      }
    >
      {children}
    </button>
  );
}

