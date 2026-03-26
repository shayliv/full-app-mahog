import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../lib/api";

type DisciplineEvent = {
  id: number;
  event_type: string;
  description: string;
  date: string;
  reporting_commander: string;
  attachment_path?: string | null;
  response_type?: string | null;
  response_other_text?: string | null;
  punishment_delivered: boolean;
  punishment_completed: boolean;
  remarks: string;
};

type Props = {
  studentId: number;
};

export function StudentDisciplineTab({ studentId }: Props) {
  const qc = useQueryClient();

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
        description: formData.get("description"),
        date: formData.get("date"),
        reporting_commander: formData.get("reporting_commander"),
        attachment_path: null,
        response_type: formData.get("response_type") || null,
        response_other_text: formData.get("response_other_text") || null,
        punishment_delivered: formData.get("punishment_delivered") === "on",
        punishment_completed: formData.get("punishment_completed") === "on",
        remarks: formData.get("remarks"),
        student_ids: [studentId]
      };
      await api.post(`/students/${studentId}/discipline`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discipline", studentId] });
    }
  });

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (!fd.get("description") || !fd.get("date") || !fd.get("remarks")) {
            alert("נא למלא תיאור, תאריך והערות (שדה חובה).");
            return;
          }
          createMutation.mutate(fd);
          e.currentTarget.reset();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span>סוג אירוע</span>
            <select
              name="event_type"
              defaultValue="individual"
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
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>מפקד מדווח</span>
            <input
              name="reporting_commander"
              type="text"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span>תיאור האירוע</span>
          <textarea
            name="description"
            rows={3}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span>תגובה משמעתית</span>
            <select
              name="response_type"
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
              <option value="other">אחר</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>פירוט תגובה (אחר)</span>
            <input
              name="response_other_text"
              type="text"
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
            />
          </label>
          <div className="flex flex-col gap-1">
            <span>סטטוס ענישה</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-1">
                <input name="punishment_delivered" type="checkbox" />
                <span>הענישה נמסרה</span>
              </label>
              <label className="flex items-center gap-1">
                <input name="punishment_completed" type="checkbox" />
                <span>הענישה הושלמה</span>
              </label>
            </div>
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span>הערות (חובה)</span>
          <textarea
            name="remarks"
            rows={2}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
            required
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            disabled={createMutation.isPending}
          >
            הוסף אירוע משמעת
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>תאריך</th>
              <th>סוג</th>
              <th>מפקד מדווח</th>
              <th>תגובה</th>
              <th>נמסרה</th>
              <th>הושלמה</th>
              <th>הערות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data?.map((e) => (
              <tr key={e.id} className="[&>td]:px-3 [&>td]:py-2">
                <td>{e.date}</td>
                <td>{e.event_type}</td>
                <td>{e.reporting_commander}</td>
                <td>{e.response_type || "-"}</td>
                <td>{e.punishment_delivered ? "כן" : "לא"}</td>
                <td>{e.punishment_completed ? "כן" : "לא"}</td>
                <td>{e.remarks}</td>
              </tr>
            ))}
            {!data?.length && (
              <tr>
                <td
                  colSpan={7}
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

