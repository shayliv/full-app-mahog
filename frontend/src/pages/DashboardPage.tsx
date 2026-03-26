import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import api from "../lib/api";
import { labels } from "../lib/i18n-he";

type SummaryCounts = {
  students_below_threshold: number;
  students_with_excessive_discipline: number;
  students_with_active_medical: number;
};

type GradeTrendPoint = {
  track: string;
  date: string;
  average_grade: number;
};

export function DashboardPage() {
  const { data: summary } = useQuery<SummaryCounts>({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const res = await api.get("/dashboard/summary-counts");
      return res.data;
    }
  });

  const { data: gradeTrend } = useQuery<GradeTrendPoint[]>({
    queryKey: ["grade-trend"],
    queryFn: async () => {
      const res = await api.get("/dashboard/grade-trend");
      return res.data;
    }
  });

  const trendByTrack = (gradeTrend ?? []).reduce<Record<string, number>>(
    (acc, point) => {
      acc[point.track] = point.average_grade;
      return acc;
    },
    {}
  );

  const trendChartData = Object.entries(trendByTrack).map(
    ([track, avg]) => ({
      track,
      average_grade: avg
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        {labels.dashboard.title}
      </h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          title={labels.dashboard.studentsBelowThreshold}
          value={summary?.students_below_threshold ?? 0}
        />
        <StatCard
          title={labels.dashboard.studentsWithDiscipline}
          value={summary?.students_with_excessive_discipline ?? 0}
        />
        <StatCard
          title={labels.dashboard.studentsWithMedical}
          value={summary?.students_with_active_medical ?? 0}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          ממוצע ציונים לפי מגמה
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="track" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="average_grade" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: number;
};

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
