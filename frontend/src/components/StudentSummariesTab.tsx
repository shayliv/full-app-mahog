import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../lib/api";

type Summary = {
  id: number;
  commander_name: string;
  date: string;
  text: string;
};

type Props = {
  studentId: number;
};

export function StudentSummariesTab({ studentId }: Props) {
  const qc = useQueryClient();

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
        text: fd.get("text"),
        attachment_path: null
      };
      await api.post(`/students/${studentId}/summaries`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summaries", studentId] });
    }
  });

  return (
    <div className="space-y-4">
      <form
        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          if (!fd.get("commander_name") || !fd.get("date") || !fd.get("text")) {
            alert("נא למלא מפקד, תאריך ותוכן סיכום.");
            return;
          }
          createSummary.mutate(fd);
          e.currentTarget.reset();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span>מפקד</span>
            <input
              name="commander_name"
              type="text"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>תאריך</span>
            <input
              name="date"
              type="date"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span>תוכן הסיכום</span>
          <textarea
            name="text"
            rows={4}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            disabled={createSummary.isPending}
          >
            הוסף סיכום מפקד
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {data?.map((s) => (
          <article
            key={s.id}
            className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm"
          >
            <header className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>מפקד: {s.commander_name}</span>
              <span>{s.date}</span>
            </header>
            <p className="whitespace-pre-wrap text-slate-800">
              {s.text}
            </p>
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

