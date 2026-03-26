import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import { labels } from "../lib/i18n-he";

type CommanderOption = {
  id: number;
  full_name: string;
  department_id: number | null;
  department_name: string | null;
};

type ParentInfo = {
  name: string;
  phone: string;
};

type PersonalDetails = {
  id_number?: string | null;
  birth_date?: string | null;
  parents?: ParentInfo[];
  address_city?: string | null;
  address_street?: string | null;
  address_is_far?: boolean;
};

export type StudentCardData = {
  id: number;
  full_name: string;
  id_number: string;
  personal_number?: string | null;
  course_name: string;
  track: string;
  class_name: string;
  commander_name: string;
  commander_id?: number | null;
  department_id?: number | null;
  department_name?: string | null;
  status: string;
  birth_date?: string | null;
  address_city?: string | null;
  address_street?: string | null;
  address_is_far?: boolean | null;
  parents?: ParentInfo[] | null;
};

const statusLabel: Record<string, string> = {
  active: labels.studentDetails.card.statusActive,
  terminated: labels.studentDetails.card.statusTerminated,
  completed: labels.studentDetails.card.statusTerminated,
  removed: labels.studentDetails.card.statusTerminated,
};

type Props = {
  studentId: number;
  student?: StudentCardData | null;
};

export function StudentPersonalTab({ studentId, student }: Props) {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);

  const { data: commanders = [] } = useQuery<CommanderOption[]>({
    queryKey: ["commanders"],
    queryFn: async () => {
      const res = await api.get("/commanders");
      return res.data;
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (payload: Partial<StudentCardData>) => {
      await api.put(`/students/${studentId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setEditMode(false);
    },
  });

  const mutation = useMutation({
    mutationFn: async (fd: FormData) => {
      if (student) {
        const birthDateRaw = (fd.get("birth_date") as string) || "";
        const commanderIdRaw = fd.get("commander_id") as string;
        const commanderId =
          commanderIdRaw && commanderIdRaw.trim() !== ""
            ? parseInt(commanderIdRaw, 10)
            : null;
        const parentsPayload: ParentInfo[] = [
          { name: (fd.get("parent1_name") as string) || "", phone: (fd.get("parent1_phone") as string) || "" },
          { name: (fd.get("parent2_name") as string) || "", phone: (fd.get("parent2_phone") as string) || "" },
        ];
        await api.put(`/students/${studentId}`, {
          full_name: (fd.get("full_name") as string) || student.full_name,
          id_number: (fd.get("id_number") as string) || student.id_number,
          personal_number: (fd.get("personal_number") as string) || null,
          commander_id: commanderId,
          track: (fd.get("track") as string) || student.track,
          status: (fd.get("status") as string) || student.status,
          birth_date: birthDateRaw || null,
          address_city: (fd.get("address_city") as string) || null,
          address_street: (fd.get("address_street") as string) || null,
          address_is_far: (fd.get("address_is_far") as string) === "on",
          parents: parentsPayload,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student", studentId] });
      setEditMode(false);
    }
  });

  const parents: ParentInfo[] = student?.parents ?? [];
  const data: PersonalDetails | undefined = student
    ? {
        id_number: student.id_number,
        birth_date: student.birth_date ?? undefined,
        parents: parents.length ? parents : undefined,
        address_city: student.address_city ?? undefined,
        address_street: student.address_street ?? undefined,
        address_is_far: student.address_is_far ?? undefined,
      }
    : undefined;
  const L = labels.studentDetails.card;
  const idNumberValue = student?.id_number ?? "";
  const birthDateValue = student?.birth_date ? String(student.birth_date).slice(0, 10) : "";

  return (
    <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">פרטים אישיים</h2>
        {!editMode && (
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {L.edit}
          </button>
        )}
      </div>

      {!editMode ? (
        student ? (
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">נתוני חניך</h3>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-slate-500">{L.fullName}</dt><dd className="font-medium text-slate-900">{student.full_name}</dd></div>
                <div><dt className="text-slate-500">{L.idNumber}</dt><dd className="text-slate-900">{idNumberValue || student.id_number || "—"}</dd></div>
                <div><dt className="text-slate-500">{L.personalNumber}</dt><dd className="text-slate-900">{student.personal_number ?? "—"}</dd></div>
                <div><dt className="text-slate-500">{L.track}</dt><dd className="text-slate-900">{student.track}</dd></div>
                <div><dt className="text-slate-500">{L.commanderName}</dt><dd className="text-slate-900">{student.commander_name}</dd></div>
                <div><dt className="text-slate-500">{L.status}</dt><dd className="text-slate-900">{statusLabel[student.status] ?? student.status}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">פרטים (נתוני בסיס)</h3>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div><dt className="text-slate-500">ת&quot;ז</dt><dd className="text-slate-900">{idNumberValue || "—"}</dd></div>
                <div><dt className="text-slate-500">תאריך לידה</dt><dd className="text-slate-900">{birthDateValue || "—"}</dd></div>
                <div><dt className="text-slate-500">עיר</dt><dd className="text-slate-900">{data?.address_city || "—"}</dd></div>
                <div><dt className="text-slate-500">רחוב</dt><dd className="text-slate-900">{data?.address_street || "—"}</dd></div>
                <div><dt className="text-slate-500">מרוחק</dt><dd className="text-slate-900">{data?.address_is_far ? "כן" : "לא"}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">אנשי קשר (משפחה)</h3>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">הורה 1</dt><dd className="text-slate-900">{parents[0]?.name ? `${parents[0].name} — ${parents[0].phone || ""}` : "—"}</dd></div>
                <div><dt className="text-slate-500">הורה 2</dt><dd className="text-slate-900">{parents[1]?.name ? `${parents[1].name} — ${parents[1].phone || ""}` : "—"}</dd></div>
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">קורס / מסלול</h3>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">מפקד</dt><dd className="text-slate-900">{student.commander_name}</dd></div>
                <div><dt className="text-slate-500">מגמה</dt><dd className="text-slate-900">{student.department_name ?? "—"}</dd></div>
              </dl>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">טוען...</p>
        )
      ) : (
        <PersonalEditForm
          student={student}
          commanders={commanders}
          data={data}
          parents={parents}
          idNumberValue={idNumberValue}
          birthDateValue={birthDateValue}
          onCancel={() => setEditMode(false)}
          onSubmit={(fd) => mutation.mutate(fd)}
          isSaving={mutation.isPending}
        />
      )}

    </section>
  );
}

type PersonalEditFormProps = {
  student: StudentCardData | null | undefined;
  commanders: CommanderOption[];
  data: PersonalDetails | undefined;
  parents: ParentInfo[];
  idNumberValue: string;
  birthDateValue: string;
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
  isSaving: boolean;
};

function PersonalEditForm({
  student,
  commanders,
  data,
  parents,
  idNumberValue,
  birthDateValue,
  onCancel,
  onSubmit,
  isSaving,
}: PersonalEditFormProps) {
  const L = labels.studentDetails.card;
  const [selectedCommanderId, setSelectedCommanderId] = useState<string>(
    student?.commander_id != null ? String(student.commander_id) : ""
  );
  const syncedCommanderRef = useRef(false);
  useEffect(() => {
    if (syncedCommanderRef.current || commanders.length === 0) return;
    if (student?.commander_id != null && commanders.some((c) => c.id === student.commander_id)) {
      setSelectedCommanderId(String(student.commander_id));
      syncedCommanderRef.current = true;
    }
  }, [commanders, student?.commander_id]);
  const selectedCommander = commanders.find((c) => String(c.id) === selectedCommanderId);
  const departmentDisplayFinal = selectedCommander?.department_name ?? student?.department_name ?? "—";
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">נתוני חניך</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-2">
          <label className="flex flex-col gap-1">
            <span className="text-slate-500">{L.fullName}</span>
            <input name="full_name" defaultValue={student?.full_name ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-500">{L.idNumber}</span>
            <input name="id_number" defaultValue={idNumberValue} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-500">{L.personalNumber}</span>
            <input name="personal_number" defaultValue={student?.personal_number ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-slate-500">{L.status}</span>
            <select name="status" defaultValue={student?.status ?? "active"} className="rounded-md border border-slate-300 bg-white px-2 py-1">
              <option value="active">{L.statusActive}</option>
              <option value="terminated">{L.statusTerminated}</option>
            </select>
          </label>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">פרטים (נתוני בסיס)</h3>
        <div className="grid gap-3 md:grid-cols-2 mt-2">
          <label className="flex flex-col gap-1">
            <span>תאריך לידה</span>
            <input type="date" name="birth_date" defaultValue={birthDateValue} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3 items-center mt-3">
          <label className="flex flex-col gap-1">
            <span>עיר</span>
            <input name="address_city" defaultValue={data?.address_city ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span>רחוב</span>
            <input name="address_street" defaultValue={data?.address_street ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 self-center">
            <input type="checkbox" name="address_is_far" defaultChecked={data?.address_is_far ?? false} className="h-4 w-4 rounded border-slate-300" />
            <span>מרוחק</span>
          </label>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">אנשי קשר (משפחה)</h3>
        <div className="grid gap-3 md:grid-cols-2 mt-2">
          <label className="flex flex-col gap-1">
            <span>הורה 1 - שם</span>
            <input name="parent1_name" defaultValue={parents[0]?.name ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span>הורה 1 - טלפון</span>
            <input name="parent1_phone" defaultValue={parents[0]?.phone ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span>הורה 2 - שם</span>
            <input name="parent2_name" defaultValue={parents[1]?.name ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1">
            <span>הורה 2 - טלפון</span>
            <input name="parent2_phone" defaultValue={parents[1]?.phone ?? ""} className="rounded-md border border-slate-300 bg-white px-2 py-1" />
          </label>
        </div>
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">קורס / מסלול</h3>
        <div className="grid gap-3 md:grid-cols-2 mt-2">
          <label className="flex flex-col gap-1">
            <span>מפקד</span>
            <select
              name="commander_id"
              value={selectedCommanderId}
              onChange={(e) => setSelectedCommanderId(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="">— בחר מפקד —</option>
              {commanders.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>מגמה</span>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
              {departmentDisplayFinal}
            </div>
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={isSaving} className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60">
          שמור פרטים אישיים
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          {L.cancel}
        </button>
      </div>
    </form>
  );
}
