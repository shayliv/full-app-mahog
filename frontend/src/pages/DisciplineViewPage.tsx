import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";

import api from "../lib/api";

type StudentRow = {
  id: number;
  full_name: string;
  id_number: string;
  track: string;
  commander_name: string;
  metrics?: {
    discipline_count: number;
    average_grade?: number | null;
    has_active_medical_issue: boolean;
  };
};

type ListResponse = {
  items: StudentRow[];
  total: number;
};

export function DisciplineViewPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [disciplineCount, setDisciplineCount] = useState("3");
  const [comparison, setComparison] = useState<"more" | "less">("more");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["students", "discipline", { page, pageSize, disciplineCount, comparison, search }],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      };

      if (disciplineCount.trim()) {
        const count = parseInt(disciplineCount);
        if (comparison === "more") {
          params.min_discipline_count = count;
        } else {
          params.max_discipline_count = count;
        }
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.get("/students", { params });
      return res.data;
    },
  });

  const students = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">חניכים - תצוגת משמעת</h1>
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
            <span className="text-sm text-slate-600">אירועי משמעת</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={comparison}
              onChange={(e) => {
                setPage(1);
                setComparison(e.target.value as "more" | "less");
              }}
            >
              <option value="more">יותר מ-</option>
              <option value="less">פחות מ-</option>
            </select>
            <input
              type="number"
              className="w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="3"
              value={disciplineCount}
              onChange={(e) => {
                setPage(1);
                setDisciplineCount(e.target.value);
              }}
            />
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
              <th>אירועי משמעת</th>
              <th>ממוצע ציונים</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  טוען חניכים...
                </td>
              </tr>
            )}
            {!isLoading &&
              students.map((s) => (
                <tr key={s.id} className="cursor-pointer hover:bg-slate-50">
                  <td className="px-3 py-2">
                    <Link
                      to={`/students/${s.id}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {s.full_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{s.id_number}</td>
                  <td className="px-3 py-2">{s.track}</td>
                  <td className="px-3 py-2">{s.commander_name}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                      {s.metrics?.discipline_count ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {s.metrics?.average_grade != null
                      ? s.metrics.average_grade.toFixed(1)
                      : "-"}
                  </td>
                </tr>
              ))}
            {!isLoading && students.length === 0 && (
              <tr>
                <td
                  colSpan={6}
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
