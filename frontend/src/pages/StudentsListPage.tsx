import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

import api, { getProfileImageUrl } from "../lib/api";
import { labels } from "../lib/i18n-he";
import { ImportStudentsModal } from "../components/ImportStudentsModal";

type StudentRow = {
  id: number;
  full_name: string;
  id_number: string;
  personal_number?: string | null;
  track: string;
  commander_name: string;
  department_name?: string | null;
  profile_image?: string | null;
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

type Commander = {
  id: number;
  full_name: string;
};

type Department = {
  id: number;
  name: string;
};

export function StudentsListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [commanderFilter, setCommanderFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [hasDisciplineEvents, setHasDisciplineEvents] = useState<boolean | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Fetch commanders for dropdown
  const { data: commandersData } = useQuery<Commander[]>({
    queryKey: ["commanders"],
    queryFn: async () => {
      const res = await api.get("/commanders");
      return res.data;
    },
  });

  // Fetch departments for dropdown
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data || [];
    },
  });

  const commanders = commandersData ?? [];
  const departments = departmentsData ?? [];

  // Autocomplete suggestions
  const { data: autocompleteSuggestions } = useQuery<StudentRow[]>({
    queryKey: ["students-autocomplete", search],
    queryFn: async () => {
      if (!search.trim() || search.trim().length < 2) return [];
      const res = await api.get("/students", {
        params: { search: search.trim(), limit: 10 },
      });
      return res.data.items || [];
    },
    enabled: search.trim().length >= 2 && showAutocomplete,
  });

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ["students", { page, pageSize, search, commanderFilter, departmentFilter, hasDisciplineEvents }],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = {
        skip: (page - 1) * pageSize,
        limit: pageSize
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (commanderFilter.trim()) {
        params.commander_name = commanderFilter.trim();
      }

      if (departmentFilter.trim()) {
        params.department_id = departmentFilter.trim();
      }

      if (hasDisciplineEvents !== null) {
        if (hasDisciplineEvents) {
          params.min_discipline_count = 1;
        } else {
          params.max_discipline_count = 0;
        }
      }

      const res = await api.get("/students", { params });
      return res.data;
    }
  });

  const students = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

  // Debug: log first student to see data structure
  if (students.length > 0) {
    console.log("First student data:", students[0]);
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(1);
    setSearch(e.target.value);
    setShowAutocomplete(true);
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
        <div className="flex gap-2">
          <button
            className="rounded-md border border-blue-500 px-3 py-1 text-sm text-blue-700 bg-white hover:bg-blue-50"
            onClick={() => setShowImportModal(true)}
          >
            {labels.studentsList.importFile}
          </button>
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
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="text-sm font-medium text-slate-700">
          {labels.studentsList.filtersTitle}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative" ref={autocompleteRef}>
            <input
              type="text"
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder={labels.studentsList.searchPlaceholder}
              value={search}
              onChange={handleSearchChange}
              onFocus={() => setShowAutocomplete(true)}
            />
            {showAutocomplete && autocompleteSuggestions && autocompleteSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
                {autocompleteSuggestions.map((student) => (
                  <div
                    key={student.id}
                    className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                    onClick={() => {
                      setSearch(student.full_name);
                      setShowAutocomplete(false);
                    }}
                  >
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-xs text-slate-500">{student.id_number} • {student.track}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <select
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={commanderFilter}
            onChange={handleCommanderChange}
          >
            <option value="">כל המפקדים</option>
            {commanders.map((c) => (
              <option key={c.id} value={c.full_name}>
                {c.full_name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={departmentFilter}
            onChange={(e) => { setPage(1); setDepartmentFilter(e.target.value); }}
          >
            <option value="">כל המרפאות/מגמות</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={hasDisciplineEvents === null ? "" : hasDisciplineEvents ? "yes" : "no"}
            onChange={(e) => {
              setPage(1);
              const value = e.target.value;
              setHasDisciplineEvents(value === "" ? null : value === "yes");
            }}
          >
            <option value="">כל החניכים (אירועי משמעת)</option>
            <option value="yes">עם אירועי משמעת</option>
            <option value="no">ללא אירועי משמעת</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>תמונה</th>
              <th>{labels.studentsList.table.name}</th>
              <th>{labels.studentsList.table.idNumber}</th>
              <th>{labels.studentsList.table.personalNumber}</th>
              <th>{labels.studentsList.table.track}</th>
              <th>{labels.studentsList.table.commanderName}</th>
              <th>{labels.studentsList.table.disciplineCount}</th>
              <th>{labels.studentsList.table.gradeAverage}</th>
              <th>{labels.studentsList.table.medicalFlag}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td
                  colSpan={9}
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
                  onClick={() => navigate(`/students/${s.id}`)}
                >
                  <td className="px-3 py-2">
                    {getProfileImageUrl(s.profile_image) ? (
                      <img
                        src={getProfileImageUrl(s.profile_image)!}
                        alt={s.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback = document.createElement("div");
                          fallback.className = "w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm";
                          fallback.textContent = s.full_name.charAt(0).toUpperCase();
                          target.parentElement?.appendChild(fallback);
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-sm">
                        {s.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-emerald-700 font-medium">
                      {s.full_name}
                    </span>
                  </td>
                  <td className="px-3 py-2">{s.id_number}</td>
                  <td className="px-3 py-2">{s.personal_number || "-"}</td>
                  <td className="px-3 py-2">{s.track}</td>
                  <td className="px-3 py-2">{s.commander_name}</td>
                  <td className="px-3 py-2">
                    {s.metrics?.discipline_count ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    {s.metrics?.average_grade != null
                      ? s.metrics.average_grade.toFixed(1)
                      : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {s.metrics?.has_active_medical_issue ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">
                        פעיל
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            {!isLoading && students.length === 0 && (
              <tr>
                <td
                  colSpan={9}
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

      {showImportModal && (
        <ImportStudentsModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
          }}
        />
      )}
    </div>
  );
}
