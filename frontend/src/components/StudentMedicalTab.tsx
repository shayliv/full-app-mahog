import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../lib/api";
import { labels } from "../lib/i18n-he";

type MedicalProfileData = {
  id: number;
  medical_profile?: string | null;
  permanent_exemptions?: string | null;
  temporary_exemptions?: string | null;
  allergies?: string | null;
  diet?: string | null;
  exemption_documents?: string[] | null;
};

type MedicalEvent = {
  id: number;
  event_type: string;
  start_date: string;
  end_date?: string | null;
  status: string;
  document_path?: string | null;
};

const medicalProfileLabels: Record<string, string> = {
  medical_profile: "פרופיל רפואי",
  allergies: "אלרגיות",
  permanent_exemptions: "פטורים קבועים",
  temporary_exemptions: "פטורים זמניים",
  diet: "תזונה",
};

const eventTypeLabels: Record<string, string> = {
  sick_call: "תורנות חובש",
  doctor_referral: "הפניה לרופא",
  exemption: "פטור",
  medical_leave: "גימלים",
  other: "אחר",
};

type Props = {
  studentId: number;
};

export function StudentMedicalTab({ studentId }: Props) {
  const qc = useQueryClient();
  const [profileEditMode, setProfileEditMode] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<MedicalProfileData | null>({
    queryKey: ["medical-profile", studentId],
    queryFn: async () => {
      try {
        const res = await api.get(`/students/${studentId}/medical/profile`);
        return res.data;
      } catch {
        return null;
      }
    },
  });

  const { data: events = [] } = useQuery<MedicalEvent[]>({
    queryKey: ["medical-events", studentId],
    queryFn: async () => {
      const res = await api.get(`/students/${studentId}/medical/events`);
      return res.data;
    },
  });

  const upsertProfile = useMutation({
    mutationFn: async (fd: FormData) => {
      const str = (name: string) => (fd.get(name) as string)?.trim() || null;
      const payload = {
        medical_profile: str("medical_profile"),
        permanent_exemptions: str("permanent_exemptions"),
        temporary_exemptions: str("temporary_exemptions"),
        allergies: str("allergies"),
        diet: str("diet"),
      };
      if (profile?.id) {
        await api.put(`/students/${studentId}/medical/profile`, payload);
      } else {
        await api.post(`/students/${studentId}/medical/profile`, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-profile", studentId] });
      setProfileEditMode(false);
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/students/${studentId}/medical/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-profile", studentId] });
    },
  });

  const createEvent = useMutation({
    mutationFn: async (fd: FormData) => {
      const payload = {
        event_type: fd.get("event_type") as string,
        start_date: fd.get("start_date") as string,
        end_date: (fd.get("end_date") as string) || null,
        status: fd.get("status") as string,
        document_path: null,
      };
      await api.post(`/students/${studentId}/medical/events`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-events", studentId] });
    },
  });

  const L = labels.studentDetails.card;

  return (
    <div className="space-y-6">
      {/* Medical profile – view/edit like personal tab */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">פרופיל רפואי</h2>
          {!profileEditMode && (
            <button
              type="button"
              onClick={() => setProfileEditMode(true)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {L.edit}
            </button>
          )}
        </div>

        {profileLoading ? (
          <p className="text-slate-500">טוען...</p>
        ) : !profileEditMode ? (
          <div className="space-y-2">
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-slate-500">{medicalProfileLabels.medical_profile}</dt>
                <dd className="text-slate-900">{profile?.medical_profile ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{medicalProfileLabels.allergies}</dt>
                <dd className="text-slate-900">{profile?.allergies ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{medicalProfileLabels.permanent_exemptions}</dt>
                <dd className="text-slate-900">{profile?.permanent_exemptions ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{medicalProfileLabels.temporary_exemptions}</dt>
                <dd className="text-slate-900">{profile?.temporary_exemptions ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{medicalProfileLabels.diet}</dt>
                <dd className="text-slate-900">{profile?.diet ?? "—"}</dd>
              </div>
            </dl>
            {profile?.exemption_documents && profile.exemption_documents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-2">מסמכי פטור</h3>
                <ul className="space-y-1">
                  {profile.exemption_documents.map((doc, idx) => (
                    <li key={idx}>
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline text-sm"
                      >
                        {doc.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">העלה מסמך פטור</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadDocument.mutate(file);
                      e.target.value = "";
                    }
                  }}
                  className="text-sm"
                />
              </label>
            </div>
          </div>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              upsertProfile.mutate(new FormData(e.currentTarget));
            }}
          >
            <label className="flex flex-col gap-1">
              <span>{medicalProfileLabels.medical_profile}</span>
              <select
                name="medical_profile"
                defaultValue={profile?.medical_profile ?? ""}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              >
                <option value="">בחר פרופיל</option>
                <option value="97">97</option>
                <option value="82">82</option>
                <option value="72">72</option>
                <option value="64">64</option>
                <option value="45">45</option>
                <option value="35">35</option>
                <option value="30">30</option>
                <option value="24">24</option>
                <option value="21">21</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span>{medicalProfileLabels.allergies}</span>
              <input
                name="allergies"
                defaultValue={profile?.allergies ?? ""}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>{medicalProfileLabels.permanent_exemptions}</span>
              <textarea
                name="permanent_exemptions"
                defaultValue={profile?.permanent_exemptions ?? ""}
                rows={2}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>{medicalProfileLabels.temporary_exemptions}</span>
              <textarea
                name="temporary_exemptions"
                defaultValue={profile?.temporary_exemptions ?? ""}
                rows={2}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>{medicalProfileLabels.diet}</span>
              <input
                name="diet"
                defaultValue={profile?.diet ?? ""}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
              />
            </label>
            <div className="md:col-span-2 flex gap-2 pt-2">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                disabled={upsertProfile.isPending}
              >
                שמור פרופיל רפואי
              </button>
              <button
                type="button"
                onClick={() => setProfileEditMode(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {L.cancel}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Medical events */}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">אירועים רפואיים</h2>
        <form
          className="grid gap-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            if (!fd.get("event_type") || !fd.get("start_date") || !fd.get("status")) {
              alert("נא למלא סוג אירוע, תאריך התחלה וסטטוס.");
              return;
            }
            createEvent.mutate(fd);
            e.currentTarget.reset();
          }}
        >
          <label className="flex flex-col gap-1">
            <span>סוג אירוע</span>
            <select
              name="event_type"
              defaultValue="sick_call"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="sick_call">תורנות חובש</option>
              <option value="doctor_referral">הפניה לרופא</option>
              <option value="exemption">פטור</option>
              <option value="medical_leave">גימלים</option>
              <option value="other">אחר</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>תאריך התחלה</span>
            <input
              name="start_date"
              type="date"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>תאריך סיום</span>
            <input
              name="end_date"
              type="date"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>סטטוס</span>
            <select
              name="status"
              defaultValue="active"
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              <option value="active">פעיל</option>
              <option value="closed">סגור</option>
            </select>
          </label>
          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              disabled={createEvent.isPending}
            >
              הוסף אירוע רפואי
            </button>
          </div>
        </form>

        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
              <th>סוג</th>
              <th>תאריך התחלה</th>
              <th>תאריך סיום</th>
              <th>סטטוס</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {events.map((ev) => (
              <tr key={ev.id} className="[&>td]:px-3 [&>td]:py-2">
                <td>{eventTypeLabels[ev.event_type] ?? ev.event_type}</td>
                <td>{ev.start_date}</td>
                <td>{ev.end_date || "—"}</td>
                <td>{ev.status === "active" ? "פעיל" : "סגור"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
