import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "../lib/api";
import { labels } from "../lib/i18n-he";
import { RichTextEditor } from "./RichTextEditor";

type MedicalProfileData = {
  id: number;
  medical_profile?: string | null;
  permanent_exemptions?: string | null;
  temporary_exemptions?: string | null;
  allergies?: string | null;
  diet?: string | null;
  notes?: string | null;
  exemption_documents?: string[] | null;
};

type MedicalEvent = {
  id: number;
  event_type: string;
  start_date: string;
  end_date?: string | null;
  event_time?: string | null;
  status: string;
  document_path?: string | null;
  educational_material_missed?: string | null;
  notes?: string | null;
};

const medicalProfileLabels: Record<string, string> = {
  medical_profile: "פרופיל רפואי",
  allergies: "אלרגיות",
  permanent_exemptions: "פטורים קבועים",
  temporary_exemptions: "פטורים זמניים",
  diet: "תזונה",
  notes: "הערות"
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
  const [profileNotes, setProfileNotes] = useState("");
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MedicalEvent | null>(null);
  const [eventNotes, setEventNotes] = useState("");
  const [eventEducationalMaterial, setEventEducationalMaterial] = useState("");

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
        notes: profileNotes || null,
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
      setProfileNotes("");
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
        event_time: (fd.get("event_time") as string) || null,
        status: fd.get("status") as string,
        document_path: null,
        educational_material_missed: eventEducationalMaterial || null,
        notes: eventNotes || null,
      };
      await api.post(`/students/${studentId}/medical/events`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-events", studentId] });
      setShowAddEvent(false);
      setEventNotes("");
      setEventEducationalMaterial("");
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ eventId, fd }: { eventId: number; fd: FormData }) => {
      const payload = {
        event_type: fd.get("event_type") as string,
        start_date: fd.get("start_date") as string,
        end_date: (fd.get("end_date") as string) || null,
        event_time: (fd.get("event_time") as string) || null,
        status: fd.get("status") as string,
        educational_material_missed: eventEducationalMaterial || null,
        notes: eventNotes || null,
      };
      await api.put(`/students/${studentId}/medical/events/${eventId}`, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical-events", studentId] });
      setEditingEvent(null);
      setEventNotes("");
      setEventEducationalMaterial("");
    },
  });

  const handleEditProfile = () => {
    setProfileEditMode(true);
    setProfileNotes(profile?.notes || "");
  };

  const handleEditEvent = (event: MedicalEvent) => {
    setEditingEvent(event);
    setEventNotes(event.notes || "");
    setEventEducationalMaterial(event.educational_material_missed || "");
  };

  const handleCancelEventEdit = () => {
    setShowAddEvent(false);
    setEditingEvent(null);
    setEventNotes("");
    setEventEducationalMaterial("");
  };

  const L = labels.studentDetails.card;

  return (
    <div className="space-y-6">
      {/* Medical profile – view/edit */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">פרופיל רפואי</h2>
          {!profileEditMode && (
            <button
              type="button"
              onClick={handleEditProfile}
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
                <dt className="text-slate-500">{medicalProfileLabels.diet}</dt>
                <dd className="text-slate-900">{profile?.diet ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-slate-500">{medicalProfileLabels.permanent_exemptions}</dt>
                <dd className="text-slate-900 whitespace-pre-wrap">{profile?.permanent_exemptions ?? "—"}</dd>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-slate-500">{medicalProfileLabels.temporary_exemptions}</dt>
                <dd className="text-slate-900 whitespace-pre-wrap">{profile?.temporary_exemptions ?? "—"}</dd>
              </div>
              {profile?.notes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <dt className="text-slate-500">{medicalProfileLabels.notes}</dt>
                  <dd className="text-slate-900 rich-text-display" dangerouslySetInnerHTML={{ __html: profile.notes }} />
                </div>
              )}
            </dl>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">מסמכי פטור</p>
              {profile?.exemption_documents && profile.exemption_documents.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {profile.exemption_documents.map((doc, i) => (
                    <li key={i}>
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {doc.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                <span>+ העלה מסמך</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDocument.mutate(file);
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              upsertProfile.mutate(new FormData(e.currentTarget));
            }}
          >
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span>{medicalProfileLabels.medical_profile}</span>
                <select
                  name="medical_profile"
                  defaultValue={profile?.medical_profile ?? ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                >
                  <option value="">לא צוין</option>
                  <option value="97">97</option>
                  <option value="82">82</option>
                  <option value="72">72</option>
                  <option value="ב׳">ב׳</option>
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
                  type="text"
                  defaultValue={profile?.allergies ?? ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>{medicalProfileLabels.permanent_exemptions}</span>
                <textarea
                  name="permanent_exemptions"
                  rows={2}
                  defaultValue={profile?.permanent_exemptions ?? ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>{medicalProfileLabels.temporary_exemptions}</span>
                <textarea
                  name="temporary_exemptions"
                  rows={2}
                  defaultValue={profile?.temporary_exemptions ?? ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>{medicalProfileLabels.diet}</span>
                <input
                  name="diet"
                  type="text"
                  defaultValue={profile?.diet ?? ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                />
              </label>
              <div className="flex flex-col gap-1">
                <span>{medicalProfileLabels.notes}</span>
                <RichTextEditor
                  value={profileNotes}
                  onChange={setProfileNotes}
                  placeholder="הערות רפואיות נוספות..."
                />
              </div>

              <div className="mt-4">
                <label className="flex flex-col gap-1">
                  <span>העלה מסמך פטור</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadDocument.mutate(file);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setProfileEditMode(false);
                  setProfileNotes("");
                }}
                className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {L.cancel}
              </button>
              <button
                type="submit"
                disabled={upsertProfile.isPending}
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {L.save}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Medical events */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">אירועים רפואיים</h2>
          {!showAddEvent && !editingEvent && (
            <button
              type="button"
              onClick={() => setShowAddEvent(true)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              + הוסף אירוע
            </button>
          )}
        </div>

        {(showAddEvent || editingEvent) && (
          <form
            className="grid gap-3 rounded border border-slate-200 bg-slate-50 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              if (editingEvent) {
                updateEvent.mutate({ eventId: editingEvent.id, fd });
              } else {
                createEvent.mutate(fd);
              }
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1">
                <span>סוג אירוע</span>
                <select
                  name="event_type"
                  defaultValue={editingEvent?.event_type || "sick_call"}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                  required
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
                  defaultValue={editingEvent?.start_date || ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>תאריך סיום</span>
                <input
                  name="end_date"
                  type="date"
                  defaultValue={editingEvent?.end_date || ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>שעת האירוע</span>
                <input
                  name="event_time"
                  type="time"
                  defaultValue={editingEvent?.event_time || ""}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span>סטטוס</span>
              <select
                name="status"
                defaultValue={editingEvent?.status || "active"}
                className="rounded-md border border-slate-300 bg-white px-2 py-1"
                required
              >
                <option value="active">פעיל</option>
                <option value="closed">סגור</option>
              </select>
            </label>
            <div className="flex flex-col gap-1">
              <span>חומר לימודי שפוספס</span>
              <RichTextEditor
                value={eventEducationalMaterial}
                onChange={setEventEducationalMaterial}
                placeholder="פרט איזה חומר לימודי פספס החניך..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <span>הערות</span>
              <RichTextEditor
                value={eventNotes}
                onChange={setEventNotes}
                placeholder="הערות נוספות על האירוע..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelEventEdit}
                className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={createEvent.isPending || updateEvent.isPending}
                className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {editingEvent ? "עדכן" : "הוסף"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-right">
                <th>סוג אירוע</th>
                <th>תאריך התחלה</th>
                <th>תאריך סיום</th>
                <th>שעה</th>
                <th>סטטוס</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {events.map((ev) => (
                <tr key={ev.id} className="[&>td]:px-3 [&>td]:py-2 hover:bg-slate-50">
                  <td>{eventTypeLabels[ev.event_type] || ev.event_type}</td>
                  <td>{ev.start_date}</td>
                  <td>{ev.end_date || "—"}</td>
                  <td>{ev.event_time || "—"}</td>
                  <td>
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        ev.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {ev.status === "active" ? "פעיל" : "סגור"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleEditEvent(ev)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm"
                    >
                      ערוך
                    </button>
                  </td>
                </tr>
              ))}
              {!events.length && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                    אין אירועים רפואיים לחניך זה.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
