import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import api from "../lib/api";
import { labels } from "../lib/i18n-he";
import { ImportModal } from "../components/ImportModal";

type CommanderRow = {
  id: number;
  full_name: string;
  department_name?: string | null;
  department_id?: number | null;
};

export function CommandersListPage() {
  const queryClient = useQueryClient();
  const [showImportModal, setShowImportModal] = useState(false);

  const { data: commanders, isLoading } = useQuery<CommanderRow[]>({
    queryKey: ["commanders"],
    queryFn: async () => {
      const res = await api.get("/commanders");
      return res.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {labels.commandersList.title}
        </h1>
        <button
          className="rounded-md border border-blue-500 px-3 py-1 text-sm text-blue-700 bg-white hover:bg-blue-50"
          onClick={() => setShowImportModal(true)}
        >
          {labels.commandersList.importFile}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>{labels.commandersList.table.fullName}</th>
              <th>{labels.commandersList.table.departmentName}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading && (
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  טוען מפקדים...
                </td>
              </tr>
            )}
            {!isLoading &&
              commanders?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">{c.full_name}</td>
                  <td className="px-3 py-2">
                    {c.department_name || "-"}
                  </td>
                </tr>
              ))}
            {!isLoading && (!commanders || commanders.length === 0) && (
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  אין מפקדים להצגה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showImportModal && (
        <ImportModal
          endpoint="/commanders/import"
          title={labels.import.commandersTitle}
          description={labels.import.commandersDescription}
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["commanders"] });
          }}
        />
      )}
    </div>
  );
}
