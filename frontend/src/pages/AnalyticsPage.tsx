import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  CartesianGrid,
} from "recharts";

import api from "../lib/api";

type DisciplineTimeData = {
  date: string;
  count: number;
};

type GradesByDepartment = {
  department_name: string;
  average_grade: number;
  student_count: number;
};

type GradesByTest = {
  test_name: string;
  date: string;
  average_grade: number;
  student_count: number;
};

type Department = {
  id: number;
  name: string;
};

export function AnalyticsPage() {
  const [disciplineDepartmentFilter, setDisciplineDepartmentFilter] = useState("");
  const [gradesDepartmentFilter, setGradesDepartmentFilter] = useState("");
  const [gradesViewMode, setGradesViewMode] = useState<"overall" | "by_department" | "by_test">("overall");

  // Fetch departments
  const { data: departmentsData } = useQuery<Department[]>({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await api.get("/departments");
      return res.data || [];
    },
  });
  const departments = departmentsData ?? [];

  // Discipline events over time
  const { data: disciplineTimeData, isLoading: disciplineLoading } = useQuery<DisciplineTimeData[]>({
    queryKey: ["analytics", "discipline-time", disciplineDepartmentFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (disciplineDepartmentFilter) {
        params.department_id = disciplineDepartmentFilter;
      }
      const res = await api.get("/analytics/discipline-timeline", { params });
      return res.data;
    },
  });

  // Grades by department
  const { data: gradesByDepartmentData, isLoading: gradesByDepartmentLoading } = useQuery<GradesByDepartment[]>({
    queryKey: ["analytics", "grades-by-department"],
    queryFn: async () => {
      const res = await api.get("/analytics/grades-by-department");
      return res.data;
    },
    enabled: gradesViewMode === "by_department",
  });

  // Average grades by test
  const { data: gradesByTestData, isLoading: gradesByTestLoading } = useQuery<GradesByTest[]>({
    queryKey: ["analytics", "grades-by-test", gradesDepartmentFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (gradesDepartmentFilter) {
        params.department_id = gradesDepartmentFilter;
      }
      const res = await api.get("/analytics/grades-by-test", { params });
      return res.data;
    },
    enabled: gradesViewMode === "by_test",
  });

  // Overall average grade
  const { data: overallGrade } = useQuery<{ average_grade: number; student_count: number }>({
    queryKey: ["analytics", "overall-grade", gradesDepartmentFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (gradesDepartmentFilter) {
        params.department_id = gradesDepartmentFilter;
      }
      const res = await api.get("/analytics/overall-grade", { params });
      return res.data;
    },
    enabled: gradesViewMode === "overall",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">סטטיסטיקות ואנליטיקה</h1>
      </div>

      {/* Discipline Events Over Time */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">אירועי משמעת לאורך זמן</h2>
          <select
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={disciplineDepartmentFilter}
            onChange={(e) => setDisciplineDepartmentFilter(e.target.value)}
          >
            <option value="">כל המגמות</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {disciplineLoading ? (
          <div className="flex h-64 items-center justify-center text-slate-500">טוען נתונים...</div>
        ) : disciplineTimeData && disciplineTimeData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={disciplineTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(label) => `תאריך: ${label}`}
                  formatter={(value: any) => [`${value}`, "אירועי משמעת"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ fill: "#f97316", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-slate-500">אין נתונים להצגה</div>
        )}
      </section>

      {/* Grades Analysis */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-slate-800">ניתוח ציונים</h2>
          <div className="flex gap-3">
            <select
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={gradesViewMode}
              onChange={(e) => setGradesViewMode(e.target.value as any)}
            >
              <option value="overall">ממוצע כללי</option>
              <option value="by_department">לפי מגמה</option>
              <option value="by_test">לפי מבחן</option>
            </select>
            {(gradesViewMode === "overall" || gradesViewMode === "by_test") && (
              <select
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={gradesDepartmentFilter}
                onChange={(e) => setGradesDepartmentFilter(e.target.value)}
              >
                <option value="">כל המגמות</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Overall Average */}
        {gradesViewMode === "overall" && overallGrade && (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-6xl font-bold text-emerald-600">{overallGrade.average_grade.toFixed(1)}</div>
            <div className="mt-2 text-lg text-slate-600">ממוצע ציונים כללי</div>
            <div className="mt-1 text-sm text-slate-500">{overallGrade.student_count} חניכים</div>
          </div>
        )}

        {/* By Department */}
        {gradesViewMode === "by_department" && (
          <>
            {gradesByDepartmentLoading ? (
              <div className="flex h-64 items-center justify-center text-slate-500">טוען נתונים...</div>
            ) : gradesByDepartmentData && gradesByDepartmentData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradesByDepartmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="department_name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        if (name === "average_grade") return [`${value.toFixed(1)}`, "ממוצע"];
                        if (name === "student_count") return [`${value}`, "מספר חניכים"];
                        return [value, name];
                      }}
                    />
                    <Legend
                      formatter={(value) => {
                        if (value === "average_grade") return "ממוצע ציונים";
                        if (value === "student_count") return "מספר חניכים";
                        return value;
                      }}
                    />
                    <Bar dataKey="average_grade" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-500">אין נתונים להצגה</div>
            )}
          </>
        )}

        {/* By Test */}
        {gradesViewMode === "by_test" && (
          <>
            {gradesByTestLoading ? (
              <div className="flex h-64 items-center justify-center text-slate-500">טוען נתונים...</div>
            ) : gradesByTestData && gradesByTestData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradesByTestData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="test_name"
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        if (name === "average_grade") return [`${value.toFixed(1)}`, "ממוצע"];
                        if (name === "student_count") return [`${value}`, "מספר חניכים"];
                        return [value, name];
                      }}
                    />
                    <Legend
                      formatter={(value) => {
                        if (value === "average_grade") return "ממוצע ציונים";
                        return value;
                      }}
                    />
                    <Bar dataKey="average_grade" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-500">אין נתונים להצגה</div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
