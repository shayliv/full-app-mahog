import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";

import api from "../lib/api";

type StudentEvaluationRow = {
  id: number;
  full_name: string;
  id_number: string;
  track: string;
  commander_name: string;
  average_grade?: number | null;
  test_count: number;
  lowest_grade?: number | null;
  highest_grade?: number | null;
  latest_test_name?: string | null;
  latest_test_grade?: number | null;
};

type EvaluationViewResponse = {
  items: StudentEvaluationRow[];
  total: number;
};

export function EvaluationViewPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [minGrade, setMinGrade] = useState("");
  const [maxGrade, setMaxGrade] = useState("70");
  const [gradeComparison, setGradeComparison] = useState<"less" | "more">("less");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<EvaluationViewResponse>({
    queryKey: ["views", "evaluation", { page, pageSize, minGrade, maxGrade, gradeComparison, search }],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      };

      if (gradeComparison === "less" && maxGrade.trim()) {
        params.max_grade = parseFloat(maxGrade);
      } else if (gradeComparison === "more" && minGrade.trim()) {
        params.min_grade = parseFloat(minGrade);
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.get("/views/evaluation", { params });
      return res.data;
    },
  });

  const students = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">חניכים - תצוגת הערכה מקצועית</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="text-sm font-medium text-slate-700">סינון</div>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="text"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="חיפוש לפי שם / ת״ז"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">ממוצע ציונים</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={gradeComparison}
              onChange={(e) => {
                setPage(1);
                setGradeComparison(e.target.value as "less" | "more");
              }}
            >
              <option value="less">פחות מ-</option>
              <option value="more">יותר מ-</option>
            </select>
            {gradeComparison === "less" ? (
              <input
                type="number"
                step="0.1"
                className="w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="70"
                value={maxGrade}
                onChange={(e) => {
                  setPage(1);
                  setMaxGrade(e.target.value);
                }}
              />
            ) : (
              <input
                type="number"
                step="0.1"
                className="w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="80"
                value={minGrade}
                onChange={(e) => {
                  setPage(1);
                  setMinGrade(e.target.value);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>שם מלא</th>
              <th>ת״ז</th>
              <th>מגמה</th>
              <th>מפקד</th>
              <th>ממוצע ציונים</th>
              <th>מספר מבחנים</th>
              <th>ציון נמוך</th>
              <th>ציון גבוה</th>
              <th>מבחן אחרון</th>
              <th>ציון אחרון</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  טוען חניכים...
                </td>
              </tr>
            )}
            {!isLoading &&
              students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link
                      to={`/students/${s.id}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {s.full_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{s.id_number}</td>
                  <td className="px-3 py-2 text-xs">{s.track}</td>
                  <td className="px-3 py-2 text-xs">{s.commander_name}</td>
                  <td className="px-3 py-2">
                    {s.average_grade != null ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          s.average_grade < 60
                            ? "bg-red-100 text-red-800"
                            : s.average_grade < 70
                            ? "bg-yellow-100 text-yellow-800"
                            : s.average_grade >= 90
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {s.average_grade.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      {s.test_count}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {s.lowest_grade != null ? (
                      <span className="text-xs">{s.lowest_grade.toFixed(1)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {s.highest_grade != null ? (
                      <span className="text-xs">{s.highest_grade.toFixed(1)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate" title={s.latest_test_name || ""}>
                    {s.latest_test_name || "-"}
                  </td>
                  <td className="px-3 py-2">
                    {s.latest_test_grade != null ? (
                      <span className="text-xs font-medium">{s.latest_test_grade.toFixed(1)}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            {!isLoading && students.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  אין חניכים להצגה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <div>סה״כ חניכים: {total}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            הקודם
          </button>
          <span>
            עמוד {page} מתוך {totalPages}
          </span>
          <button
            type="button"
            className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            הבא
          </button>
        </div>
      </div>
    </div>
  );
}
