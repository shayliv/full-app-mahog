import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../lib/api";
import { RichTextEditor } from "./RichTextEditor";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";

type Bakatz = {
  id: number;
  request_date: string;
  leave_start_date: string;
  leave_end_date: string;
  destination?: string | null;
  transportation_method?: string | null;
  notes?: string | null;
  status: string;
};

type Props = {
  studentId: number;
};

const statusLabels: Record<string, string> = {
  pending: "ממתין",
  approved: "אושר",
  denied: "נדחה",
  cancelled: "בוטל",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export function StudentBakatzimTab({ studentId }: Props) {
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBakatz, setEditingBakatz] = useState<Bakatz | null>(null);
  const [notes, setNotes] = useState("");

  const { data: bakatzim } = useQuery<Bakatz[]>({
    queryKey: ["bakatzim", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/bakatzim`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (fd: FormData) => {
      const payload = {
        request_date: fd.get("request_date"),
        leave_start_date: fd.get("leave_start_date"),
        leave_end_date: fd.get("leave_end_date"),
        destination: fd.get("destination") || null,
        transportation_method: fd.get("transportation_method") || null,
        notes: notes || null,
        status: fd.get("status") || "pending",
      };
      await api.post(`/students/${studentId}/bakatzim`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bakatzim", studentId] });
      setShowAddForm(false);
      setNotes("");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : "שגיאה בשמירת בקשת היציאה";
      alert(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ bakatzId, fd }: { bakatzId: number; fd: FormData }) => {
      const payload = {
        request_date: fd.get("request_date"),
        leave_start_date: fd.get("leave_start_date"),
        leave_end_date: fd.get("leave_end_date"),
        destination: fd.get("destination") || null,
        transportation_method: fd.get("transportation_method") || null,
        notes: notes || null,
        status: fd.get("status") || "pending",
      };
      await api.put(`/students/${studentId}/bakatzim/${bakatzId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bakatzim", studentId] });
      setEditingBakatz(null);
      setNotes("");
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : "שגיאה בעדכון בקשת היציאה";
      alert(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (bakatzId: number) => {
      await api.delete(`/students/${studentId}/bakatzim/${bakatzId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bakatzim", studentId] });
    },
  });

  const handleEdit = (bakatz: Bakatz) => {
    setEditingBakatz(bakatz);
    setNotes(bakatz.notes || "");
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingBakatz(null);
    setNotes("");
  };

  const handleDelete = (bakatzId: number) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק בקשת יציאה זו?")) {
      deleteMutation.mutate(bakatzId);
    }
  };

  return (
    <div className="space-y-4">
      {!showAddForm && !editingBakatz && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            + הוסף בקשת יציאה (בקשצ)
          </button>
        </div>
      )}

      {(showAddForm || editingBakatz) && (
        <form
          className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (!fd.get("request_date") || !fd.get("leave_start_date") || !fd.get("leave_end_date")) {
              alert("נא למלא תאריך הגשה, תאריך התחלה ותאריך סיום");
              return;
            }
            if (editingBakatz) {
              updateMutation.mutate({ bakatzId: editingBakatz.id, fd });
            } else {
              createMutation.mutate(fd);
            }
            e.currentTarget.reset();
          }}
        >
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-medium">
              {editingBakatz ? "ערוך בקשת יציאה" : "הוסף בקשת יציאה"}
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span>תאריך הגשת הבקשצ</span>
              <input
                name="request_date"
                type="date"
                defaultValue={editingBakatz?.request_date || ""}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>תאריך יציאה</span>
              <input
                name="leave_start_date"
                type="date"
                defaultValue={editingBakatz?.leave_start_date || ""}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>תאריך חזרה</span>
              <input
                name="leave_end_date"
                type="date"
                defaultValue={editingBakatz?.leave_end_date || ""}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
                required
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>סטטוס</span>
              <select
                name="status"
                defaultValue={editingBakatz?.status || "pending"}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              >
                <option value="pending">ממתין</option>
                <option value="approved">אושר</option>
                <option value="denied">נדחה</option>
                <option value="cancelled">בוטל</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span>מיקום הבקשצ</span>
              <input
                name="destination"
                type="text"
                defaultValue={editingBakatz?.destination || ""}
                placeholder="לדוגמה: תל אביב, בית הורים"
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>דרך הגעה</span>
              <input
                name="transportation_method"
                type="text"
                defaultValue={editingBakatz?.transportation_method || ""}
                placeholder="לדוגמה: רכב פרטי, תחבורה ציבורית"
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span>הערות</span>
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="הערות נוספות על בקשת היציאה..."
            />
          </label>

          {editingBakatz && (
            <div>
              <h4 className="text-sm font-medium mb-2">מסמכים מצורפים</h4>
              <FileList entityType="bakatz" entityId={editingBakatz.id} />
              <div className="mt-2">
                <FileUpload entityType="bakatz" entityId={editingBakatz.id} />
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
              {editingBakatz ? "עדכן" : "הוסף"}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>תאריך הגשה</th>
              <th>תאריך יציאה</th>
              <th>תאריך חזרה</th>
              <th>מיקום</th>
              <th>דרך הגעה</th>
              <th>סטטוס</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {bakatzim?.map((b) => (
              <tr key={b.id} className="[&>td]:px-3 [&>td]:py-2 hover:bg-slate-50">
                <td>{b.request_date}</td>
                <td>{b.leave_start_date}</td>
                <td>{b.leave_end_date}</td>
                <td>{b.destination || "—"}</td>
                <td>{b.transportation_method || "—"}</td>
                <td>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      statusColors[b.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusLabels[b.status] || b.status}
                  </span>
                </td>
                <td className="flex gap-2">
                  <button
                    onClick={() => handleEdit(b)}
                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    ערוך
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                    disabled={deleteMutation.isPending}
                  >
                    מחק
                  </button>
                </td>
              </tr>
            ))}
            {!bakatzim?.length && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                  אין בקשות יציאה לחניך זה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
