import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import api from "../lib/api";

type Test = {
  id: number;
  name: string;
  date: string;
  grade: number;
};

type Exercise = {
  id: number;
  description: string;
  attachment_path?: string | null;
};

type GradeStats = {
  average: number | null;
  trend_points: Test[];
};

type Props = {
  studentId: number;
};

export function StudentEvaluationTab({ studentId }: Props) {
  const qc = useQueryClient();

  const { data: tests } = useQuery<Test[]>({
    queryKey: ["tests", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/evaluation/tests`);
      return res.data;
    }
  });

  const { data: stats } = useQuery<GradeStats>({
    queryKey: ["tests-stats", studentId],
    queryFn: async () => {
      const res = await api.get(
        `/students/${studentId}/evaluation/tests/stats`
      );
      return res.data;
    }
  });

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["exercises", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/evaluation/exercises`);
      return res.data;
    }
  });

  const createTest = useMutation({
    mutationFn: async (fd: FormData) => {
      const payload = {
        name: fd.get("name"),
        date: fd.get("date"),
        grade: Number(fd.get("grade"))
      };
      await api.post(`/students/${studentId}/evaluation/tests`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tests", studentId] });
      qc.invalidateQueries({ queryKey: ["tests-stats", studentId] });
    }
  });

  const createExercise = useMutation({
    mutationFn: async (fd: FormData) => {
      const payload = {
        description: fd.get("description"),
        attachment_path: null
      };
      await api.post(
        `/students/${studentId}/evaluation/exercises`,
        payload
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exercises", studentId] });
    }
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            מבחנים
          </h2>
          <form
            className="grid gap-3 text-sm sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              if (!fd.get("name") || !fd.get("date") || !fd.get("grade")) {
                alert("נא למלא שם מבחן, תאריך וציון.");
                return;
              }
              createTest.mutate(fd);
              e.currentTarget.reset();
            }}
          >
            <label className="flex flex-col gap-1">
              <span>שם מבחן</span>
              <input
                name="name"
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
            <label className="flex flex-col gap-1">
              <span>ציון</span>
              <input
                name="grade"
                type="number"
                min={0}
                max={100}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                disabled={createTest.isPending}
              >
                הוסף מבחן
              </button>
            </div>
          </form>

          <table className="mt-3 min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
                <th>שם</th>
                <th>תאריך</th>
                <th>ציון</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tests?.map((t) => (
                <tr key={t.id} className="[&>td]:px-3 [&>td]:py-2">
                  <td>{t.name}</td>
                  <td>{t.date}</td>
                  <td>
                    <span
                      className={
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold " +
                        gradeColorClass(t.grade)
                      }
                    >
                      {t.grade}
                    </span>
                  </td>
                </tr>
              ))}
              {!tests?.length && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-4 text-center text-slate-500"
                  >
                    אין מבחנים לחניך זה.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800">
            ממוצע ותרשים מגמה
          </h2>
          <div>
            ממוצע ציונים:{" "}
            {stats?.average != null ? stats.average.toFixed(1) : "-"}
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trend_points ?? []}>
                <XAxis dataKey="date" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="grade"
                  stroke="#22c55e"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">
          תרגילים
        </h2>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (!fd.get("description")) {
              alert("נא למלא תיאור לתרגיל.");
              return;
            }
            createExercise.mutate(fd);
            e.currentTarget.reset();
          }}
        >
          <label className="flex flex-col gap-1">
            <span>תיאור תרגיל</span>
            <textarea
              name="description"
              rows={3}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              disabled={createExercise.isPending}
            >
              הוסף תרגיל
            </button>
          </div>
        </form>
        <ul className="space-y-2">
          {exercises?.map((ex) => (
            <li
              key={ex.id}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              {ex.description}
            </li>
          ))}
          {!exercises?.length && (
            <li className="text-slate-500">
              אין תרגילים לחניך זה.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function gradeColorClass(grade: number): string {
  if (grade < 55) {
    return "bg-red-900/60 text-red-200";
  }
  if (grade <= 77) {
    return "bg-orange-900/60 text-orange-200";
  }
  return "bg-emerald-900/60 text-emerald-200";
}

