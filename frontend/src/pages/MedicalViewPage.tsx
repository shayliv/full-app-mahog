import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";

import api from "../lib/api";
import { labels } from "../lib/i18n-he";

type StudentMedicalRow = {
  id: number;
  full_name: string;
  id_number: string;
  track: string;
  commander_name: string;
  medical_profile?: string | null;
  permanent_exemptions?: string | null;
  temporary_exemptions?: string | null;
  allergies?: string | null;
  diet?: string | null;
  active_events_count: number;
  latest_event_type?: string | null;
};

type MedicalViewResponse = {
  items: StudentMedicalRow[];
  total: number;
};

const translateEventType = (eventType: string | null | undefined): string => {
  if (!eventType) return "-";
  const translations: Record<string, string> = labels.medicalEventTypes;
  return translations[eventType as keyof typeof translations] || eventType;
};

export function MedicalViewPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<MedicalViewResponse>({
    queryKey: ["views", "medical", { page, pageSize, statusFilter, search }],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
      };

      if (statusFilter) {
        params.status_filter = statusFilter;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await api.get("/views/medical", { params });
      return res.data;
    },
  });

  const students = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">חניכים - תצוגת רפואה</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="text-sm font-medium text-slate-700">סינון</div>
        <div className="flex gap-3">
          <input
            type="text"
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="חיפוש לפי שם / ת״ז"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="active">אירועים רפואיים פעילים בלבד</option>
            <option value="all">כל החניכים</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>שם מלא</th>
              <th>ת״ז</th>
              <th>מגמה</th>
              <th>פרופיל רפואי</th>
              <th>פטורים קבועים</th>
              <th>פטורים זמניים</th>
              <th>אלרגיות</th>
              <th>דיאטה</th>
              <th>אירועים פעילים</th>
              <th>אירוע אחרון</th>
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
                  <td className="px-3 py-2 text-xs">
                    {s.medical_profile || "-"}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate" title={s.permanent_exemptions || ""}>
                    {s.permanent_exemptions || "-"}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[150px] truncate" title={s.temporary_exemptions || ""}>
                    {s.temporary_exemptions || "-"}
                  </td>
                  <td className="px-3 py-2 text-xs max-w-[120px] truncate" title={s.allergies || ""}>
                    {s.allergies || "-"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {s.diet || "-"}
                  </td>
                  <td className="px-3 py-2">
                    {s.active_events_count > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        {s.active_events_count}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {s.latest_event_type ? (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                        {translateEventType(s.latest_event_type)}
                      </span>
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
