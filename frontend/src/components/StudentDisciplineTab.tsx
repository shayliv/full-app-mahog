import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../lib/api";
import { RichTextEditor } from "./RichTextEditor";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";

type DisciplineEvent = {
  id: number;
  event_type: string;
  description: string;
  date: string;
  reporting_commander: string;
  attachment_path?: string | null;
  response_type?: string | null;
  response_other_text?: string | null;
  status: string;
  punishment_delivered: boolean;
  punishment_completed: boolean;
  remarks: string;
};

type Props = {
  studentId: number;
};

const statusLabels: Record<string, string> = {
  told: "נאמר",
  submitted: "הגיש/ה",
  decided: "הוחלט",
  delivered: "נמסר",
  completed: "בוצע"
};

const statusColors: Record<string, string> = {
  told: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  decided: "bg-yellow-100 text-yellow-800",
  delivered: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800"
};

export function StudentDisciplineTab({ studentId }: Props) {
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<DisciplineEvent | null>(null);
  const [description, setDescription] = React.useState("");
  const [remarks, setRemarks] = React.useState("");

  const { data } = useQuery<DisciplineEvent[]>({
    queryKey: ["discipline", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/discipline`);
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const payload = {
        event_type: formData.get("event_type"),
        description: description,
        date: formData.get("date"),
        reporting_commander: formData.get("reporting_commander"),
        attachment_path: null,
        response_type: formData.get("response_type") || null,
        response_other_text: formData.get("response_other_text") || null,
        status: formData.get("status") || "told",
        punishment_delivered: formData.get("punishment_delivered") === "on",
        punishment_completed: formData.get("punishment_completed") === "on",
        remarks: remarks,
        student_ids: [studentId]
      };
      await api.post(`/students/${studentId}/discipline`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discipline", studentId] });
      setShowAddForm(false);
      setDescription("");
      setRemarks("");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : "שגיאה בשמירת אירוע המשמעת";
      alert(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ eventId, formData }: { eventId: number; formData: FormData }) => {
      const payload = {
        event_type: formData.get("event_type"),
        description: description,
        date: formData.get("date"),
        reporting_commander: formData.get("reporting_commander"),
        response_type: formData.get("response_type") || null,
        response_other_text: formData.get("response_other_text") || null,
        status: formData.get("status") || "told",
        punishment_delivered: formData.get("punishment_delivered") === "on",
        punishment_completed: formData.get("punishment_completed") === "on",
        remarks: remarks,
      };
      await api.put(`/students/${studentId}/discipline/${eventId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discipline", studentId] });
      setEditingEvent(null);
      setDescription("");
      setRemarks("");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : "שגיאה בעדכון אירוע המשמעת";
      alert(msg);
    }
  });

  const handleEdit = (event: DisciplineEvent) => {
    setEditingEvent(event);
    setDescription(event.description);
    setRemarks(event.remarks);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingEvent(null);
    setDescription("");
    setRemarks("");
  };

  return (
    <div className="space-y-4">
      {!showAddForm && !editingEvent && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + הוסף אירוע משמעת
          </button>
        </div>
      )}

      {(showAddForm || editingEvent) && (
        <form
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (!description || !fd.get("date") || !remarks) {
              alert("נא למלא תיאור, תאריך והערות (שדה חובה).");
              return;
            }
            if (editingEvent) {
              updateMutation.mutate({ eventId: editingEvent.id, formData: fd });
            } else {
              createMutation.mutate(fd);
            }
            e.currentTarget.reset();
          }}
        >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-medium">{editingEvent ? "ערוך אירוע משמעת" : "הוסף אירוע משמעת"}</h3>
          <button
            type="button"
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span>סוג אירוע</span>
            <select
              name="event_type"
              defaultValue={editingEvent?.event_type || "individual"}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="individual">אירוע יחידני</option>
              <option value="multi_student">אירוע ריבוי חניכים</option>
              <option value="class_track">אירוע כיתה / מגמה</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>תאריך</span>
            <input
              name="date"
              type="date"
              defaultValue={editingEvent?.date || ""}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>מפקד מדווח</span>
            <input
              name="reporting_commander"
              type="text"
              defaultValue={editingEvent?.reporting_commander || ""}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span>תיאור האירוע</span>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="תאר את אירוע המשמעת..."
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span>תגובה משמעתית</span>
            <select
              name="response_type"
              defaultValue={editingEvent?.response_type || ""}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="">ללא</option>
              <option value="shabbat">שבת</option>
              <option value="hearing">שימוע</option>
              <option value="trial">משפט</option>
              <option value="uniform_inspection">מסדר דיגום</option>
              <option value="cleanliness_inspection">מסדר ניקיון</option>
              <option value="reprimand_talk">שיחת נזיפה</option>
              <option value="four_corners">עונש ארבע פינות</option>
              <option value="exit_hours">שעות ביציאה</option>
              <option value="other">אחר</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>פירוט תגובה (אחר)</span>
            <input
              name="response_other_text"
              type="text"
              defaultValue={editingEvent?.response_other_text || ""}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>סטטוס</span>
            <select
              name="status"
              defaultValue={editingEvent?.status || "told"}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="told">נאמר</option>
              <option value="submitted">הגיש/ה</option>
              <option value="decided">הוחלט</option>
              <option value="delivered">נמסר</option>
              <option value="completed">בוצע</option>
            </select>
          </label>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-1">
            <input name="punishment_delivered" type="checkbox" defaultChecked={editingEvent?.punishment_delivered} />
            <span>הענישה נמסרה</span>
          </label>
          <label className="flex items-center gap-1">
            <input name="punishment_completed" type="checkbox" defaultChecked={editingEvent?.punishment_completed} />
            <span>הענישה הושלמה</span>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span>הערות (חובה)</span>
          <RichTextEditor
            value={remarks}
            onChange={setRemarks}
            placeholder="הערות נוספות..."
          />
        </label>

        {editingEvent && (
          <div>
            <h4 className="text-sm font-medium mb-2">קבצים מצורפים</h4>
            <FileList entityType="discipline_event" entityId={editingEvent.id} />
            <div className="mt-2">
              <FileUpload entityType="discipline_event" entityId={editingEvent.id} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ביטול
          </button>
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingEvent ? "עדכן" : "הוסף"}
          </button>
        </div>
      </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>תאריך</th>
              <th>סוג</th>
              <th>תיאור</th>
              <th>מפקד מדווח</th>
              <th>תגובה</th>
              <th>סטטוס</th>
              <th>הערות</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data?.map((e) => (
              <tr key={e.id} className="[&>td]:px-3 [&>td]:py-2 hover:bg-slate-50">
                <td>{e.date}</td>
                <td>{e.event_type === "individual" ? "יחידני" : e.event_type === "multi_student" ? "ריבוי חניכים" : "כיתה/מגמה"}</td>
                <td>
                  <div className="max-w-[200px] truncate rich-text-display" dangerouslySetInnerHTML={{ __html: e.description }} />
                </td>
                <td>{e.reporting_commander}</td>
                <td>{e.response_type || "-"}</td>
                <td>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColors[e.status] || "bg-gray-100 text-gray-800"}`}>
                    {statusLabels[e.status] || e.status}
                  </span>
                </td>
                <td>
                  <div className="max-w-[200px] truncate rich-text-display" dangerouslySetInnerHTML={{ __html: e.remarks }} />
                </td>
                <td>
                  <button
                    onClick={() => handleEdit(e)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    ערוך
                  </button>
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  אין אירועי משמעת לחניך זה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
