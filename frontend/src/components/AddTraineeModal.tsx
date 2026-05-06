import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";

interface AddTraineeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTraineeModal: React.FC<AddTraineeModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [parents, setParents] = useState([
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const parentsData = parents.filter((p) => p.name || p.phone);

      const payload = {
        full_name: formData.get("full_name"),
        id_number: formData.get("id_number"),
        personal_number: formData.get("personal_number") || null,
        course_name: formData.get("course_name"),
        track: formData.get("track"),
        class_name: formData.get("class_name"),
        commander_name: formData.get("commander_name"),
        birth_date: formData.get("birth_date") || null,
        address_city: formData.get("address_city") || null,
        address_street: formData.get("address_street") || null,
        address_is_far: formData.get("address_is_far") === "on",
        parents_json: parentsData.length > 0 ? JSON.stringify(parentsData) : null,
        status: "active",
      };

      await api.post("/students", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onClose();
      alert("החניך נוסף בהצלחה!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "שגיאה בהוספת החניך";
      alert(message);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Validation
    if (!fd.get("full_name") || !fd.get("id_number") || !fd.get("course_name") ||
        !fd.get("track") || !fd.get("class_name") || !fd.get("commander_name")) {
      alert("נא למלא את כל השדות החובה: שם, תעודת זהות, קורס, מגמה, כיתה ומפקד");
      return;
    }

    createMutation.mutate(fd);
  };

  const updateParent = (index: number, field: "name" | "phone", value: string) => {
    const newParents = [...parents];
    newParents[index][field] = value;
    setParents(newParents);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900">הוסף חניך חדש</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">פרטים אישיים</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm">
                  שם מלא <span className="text-red-500">*</span>
                </span>
                <input
                  name="full_name"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">
                  תעודת זהות <span className="text-red-500">*</span>
                </span>
                <input
                  name="id_number"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">מספר אישי</span>
                <input
                  name="personal_number"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">תאריך לידה</span>
                <input
                  name="birth_date"
                  type="date"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
            </div>
          </div>

          {/* Course Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">פרטי קורס</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm">
                  שם קורס <span className="text-red-500">*</span>
                </span>
                <input
                  name="course_name"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">
                  מגמה <span className="text-red-500">*</span>
                </span>
                <input
                  name="track"
                  type="text"
                  placeholder='לדוגמה: "מגמה א"'
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">
                  כיתה <span className="text-red-500">*</span>
                </span>
                <input
                  name="class_name"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">
                  מפקד <span className="text-red-500">*</span>
                </span>
                <input
                  name="commander_name"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">כתובת</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm">עיר</span>
                <input
                  name="address_city"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm">רחוב</span>
                <input
                  name="address_street"
                  type="text"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  name="address_is_far"
                  type="checkbox"
                  className="rounded border-slate-300"
                />
                <span className="text-sm">כתובת רחוקה</span>
              </label>
            </div>
          </div>

          {/* Parents Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">פרטי הורים</h3>
            {parents.map((parent, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm">שם הורה {index + 1}</span>
                  <input
                    type="text"
                    value={parent.name}
                    onChange={(e) => updateParent(index, "name", e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm">טלפון הורה {index + 1}</span>
                  <input
                    type="tel"
                    value={parent.phone}
                    onChange={(e) => updateParent(index, "phone", e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                </label>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {createMutation.isPending ? "שומר..." : "הוסף חניך"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
