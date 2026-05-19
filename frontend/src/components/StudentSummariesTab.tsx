import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../lib/api";
import { RichTextEditor } from "./RichTextEditor";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";

type Summary = {
  id: number;
  commander_name: string;
  date: string;
  title?: string | null;
  text: string;
};

type Props = {
  studentId: number;
};

export function StudentSummariesTab({ studentId }: Props) {
  const qc = useQueryClient();
  const [summaryText, setSummaryText] = useState("");
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null);

  const { data } = useQuery<Summary[]>({
    queryKey: ["summaries", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/summaries`);
      return res.data;
    }
  });

  const createSummary = useMutation({
    mutationFn: async (fd: FormData) => {
      const payload = {
        commander_name: fd.get("commander_name"),
        date: fd.get("date"),
        title: fd.get("title") || null,
        text: summaryText,
        attachment_path: null
      };
      await api.post(`/students/${studentId}/summaries`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summaries", studentId] });
      setSummaryText("");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : "שגיאה בשמירת סיכום המפקד";
      alert(msg);
    }
  });

  const updateSummary = useMutation({
    mutationFn: async ({ summaryId, fd }: { summaryId: number; fd: FormData }) => {
      const payload = {
        commander_name: fd.get("commander_name"),
        date: fd.get("date"),
        title: fd.get("title") || null,
        text: summaryText,
      };
      await api.put(`/students/${studentId}/summaries/${summaryId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summaries", studentId] });
      setEditingSummary(null);
      setSummaryText("");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : "שגיאה בעדכון סיכום המפקד";
      alert(msg);
    }
  });

  const deleteSummary = useMutation({
    mutationFn: async (summaryId: number) => {
      await api.delete(`/students/${studentId}/summaries/${summaryId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summaries", studentId] });
    },
  });

  const handleEdit = (summary: Summary) => {
    setEditingSummary(summary);
    setSummaryText(summary.text);
  };

  const handleCancelEdit = () => {
    setEditingSummary(null);
    setSummaryText("");
  };

  const handleDelete = (summaryId: number) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק סיכום זה?")) {
      deleteSummary.mutate(summaryId);
    }
  };

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (!fd.get("commander_name") || !fd.get("date") || !summaryText) {
            alert("נא למלא מפקד, תאריך ותוכן סיכום.");
            return;
          }
          if (editingSummary) {
            updateSummary.mutate({ summaryId: editingSummary.id, fd });
          } else {
            createSummary.mutate(fd);
          }
          e.currentTarget.reset();
        }}
      >
        {editingSummary && (
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-medium">ערוך סיכום מפקד</h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span>מפקד</span>
            <input
              name="commander_name"
              type="text"
              defaultValue={editingSummary?.commander_name || ""}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>תאריך</span>
            <input
              name="date"
              type="date"
              defaultValue={editingSummary?.date || ""}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>כותרת (אופציונלי)</span>
            <input
              name="title"
              type="text"
              defaultValue={editingSummary?.title || ""}
              placeholder="הזן כותרת לסיכום"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span>תוכן הסיכום</span>
          <RichTextEditor
            value={summaryText}
            onChange={setSummaryText}
            placeholder="כתוב את סיכום המפקד כאן..."
          />
        </label>

        {editingSummary && (
          <div>
            <h4 className="text-sm font-medium mb-2">קבצים מצורפים</h4>
            <FileList entityType="command_summary" entityId={editingSummary.id} />
            <div className="mt-2">
              <FileUpload entityType="command_summary" entityId={editingSummary.id} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {editingSummary && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ביטול
            </button>
          )}
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            disabled={createSummary.isPending || updateSummary.isPending}
          >
            {editingSummary ? "עדכן סיכום" : "הוסף סיכום מפקד"}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {data?.map((s) => (
          <article
            key={s.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
          >
            <header className="mb-2 flex items-center justify-between">
              <div className="flex-1">
                {s.title && (
                  <h3 className="text-base font-medium text-slate-900 mb-1">{s.title}</h3>
                )}
                <div className="text-xs text-slate-500">
                  <span>מפקד: {s.commander_name}</span>
                  <span className="mx-2">•</span>
                  <span>{s.date}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(s)}
                  className="text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  ערוך
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                  disabled={deleteSummary.isPending}
                >
                  מחק
                </button>
              </div>
            </header>
            <div
              className="text-slate-800 rich-text-display"
              dangerouslySetInnerHTML={{ __html: s.text }}
            />
            <div className="mt-2">
              <FileList entityType="command_summary" entityId={s.id} className="text-xs" />
            </div>
          </article>
        ))}
        {!data?.length && (
          <div className="text-sm text-slate-500">
            אין סיכומי מפקד לחניך זה.
          </div>
        )}
      </div>
    </div>
  );
}
