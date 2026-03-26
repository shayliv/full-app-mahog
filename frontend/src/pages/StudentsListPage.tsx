import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";

import api from "../lib/api";
import { labels } from "../lib/i18n-he";

type StudentRow = {
  id: number;
  full_name: string;
  id_number: string;
  personal_number?: string | null;
  track: string;
  commander_name: string;
};

type ListResponse = {
  items: StudentRow[];
  total: number;
};

export function StudentsListPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [commanderFilter, setCommanderFilter] = useState("");

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["students", { page, pageSize, search, commanderFilter }],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        skip: (page - 1) * pageSize,
        limit: pageSize
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (commanderFilter.trim()) {
        params.commander_name = commanderFilter.trim();
      }

      const res = await api.get("/students", { params });
      return res.data;
    }
  });

  const students = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setSearch(e.target.value);
  };

  const handleCommanderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setCommanderFilter(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {labels.studentsList.title}
        </h1>
        <button
          className="rounded-md border border-emerald-500 px-3 py-1 text-sm text-emerald-700 bg-white hover:bg-emerald-50"
          onClick={async () => {
            const res = await api.get("/export/students.csv", {
              responseType: "blob"
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "students.csv");
            document.body.appendChild(link);
            link.click();
            link.remove();
          }}
        >
          {labels.studentsList.exportCsv}
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="text-sm font-medium text-slate-700">
          {labels.studentsList.filtersTitle}
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder={labels.studentsList.searchPlaceholder}
            value={search}
            onChange={handleSearchChange}
          />
          <input
            type="text"
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder={labels.studentsList.commanderPlaceholder}
            value={commanderFilter}
            onChange={handleCommanderChange}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>{labels.studentsList.table.name}</th>
              <th>{labels.studentsList.table.idNumber}</th>
              <th>{labels.studentsList.table.personalNumber}</th>
              <th>{labels.studentsList.table.track}</th>
              <th>{labels.studentsList.table.commanderName}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  טוען חניכים...
                </td>
              </tr>
            )}
            {!isLoading &&
              students.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-3 py-2">
                    <Link
                      to={`/students/${s.id}`}
                      className="text-emerald-700 hover:underline"
                    >
                      {s.full_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{s.id_number}</td>
                  <td className="px-3 py-2">
                    {s.personal_number ?? "-"}
                  </td>
                  <td className="px-3 py-2">{s.track}</td>
                  <td className="px-3 py-2">{s.commander_name}</td>
                </tr>
              ))}
            {!isLoading && students.length === 0 && (
              <tr>
                <td
                  colSpan={5}
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
        <div>
          סה״כ חניכים: {total}
        </div>
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
