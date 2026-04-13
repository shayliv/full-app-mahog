export const labels = {
  appTitle: "מערכת ניהול חניכים",
  nav: {
    dashboard: "לוח בקרה",
    students: "תיקי חניכים",
    commanders: "מפקדים",
    discipline: "משמעת",
    medical: "רפואה",
    evaluation: "מקצועי"
  },
  medicalEventTypes: {
    sick_call: "קריאה חולה",
    doctor_referral: "הפניה לרופא",
    exemption: "פטור",
    medical_leave: "חופשה רפואית",
    other: "אחר"
  },
  dashboard: {
    title: "לוח בקרה",
    studentsBelowThreshold: "חניכים מתחת לסף לימודי",
    studentsWithDiscipline: "חניכים עם עודף משמעת",
    studentsWithMedical: "חניכים עם בעיות רפואיות פעילות"
  },
  studentsList: {
    title: "תיקי חניכים",
    filtersTitle: "סינון חניכים",
    searchPlaceholder: "חיפוש לפי שם / ת\"ז / מספר אישי",
    commanderPlaceholder: "סינון לפי מפקד",
    track: "מגמה",
    className: "כיתה / מחלקה",
    commanderName: "מפקד",
    disciplineCount: "מספר אירועי משמעת",
    medicalStatus: "מצב רפואי",
    gradeAverage: "ממוצע ציונים",
    importFile: "ייבוא קובץ",
    exportCsv: "ייצוא ל-CSV",
    table: {
      name: "שם מלא",
      idNumber: "ת\"ז",
      personalNumber: "מספר אישי",
      courseName: "שם הקורס",
      track: "מגמה",
      className: "כיתה",
      commanderName: "מפקד",
      status: "סטטוס",
      disciplineCount: "אירועי משמעת",
      gradeAverage: "ממוצע ציונים",
      medicalFlag: "מצב רפואי"
    }
  },
  studentDetails: {
    tabs: {
      discipline: "משמעת",
      evaluation: "הערכות מקצועיות",
      medical: "רפואה",
      summaries: "סיכומי מפקד",
      personal: "פרטים אישיים"
    },
    card: {
      edit: "ערוך",
      cancel: "ביטול",
      save: "שמור",
      fullName: "שם מלא",
      idNumber: "ת\"ז",
      personalNumber: "מספר אישי",
      courseName: "קורס",
      track: "מגמה",
      className: "כיתה / מחלקה",
      commanderName: "מפקד",
      status: "סטטוס",
      statusActive: "פעיל",
      statusTerminated: "הודח"
    }
  },
  commandersList: {
    title: "מפקדים",
    importFile: "ייבוא קובץ",
    table: {
      fullName: "שם מלא",
      departmentName: "מרפאה/מגמה"
    }
  },
  import: {
    title: "ייבוא חניכים",
    description: "בחר קובץ Excel (.xlsx, .xls) או CSV לייבוא חניכים. הקובץ צריך לכלול: שם פרטי+שם משפחה (או full_name), תז (או id_number). שדות נוספים: מספר אישי, קורס, מגמה, כיתה, מפקד, עיר מגורים",
    commandersTitle: "ייבוא מפקדים",
    commandersDescription: "בחר קובץ Excel (.xlsx, .xls) או CSV לייבוא מפקדים. הקובץ צריך לכלול: שם פרטי+שם משפחה (או full_name). שדות נוספים: תפקיד (מפקד/רמ״ג/מנהל), מרפאה, מפקד עליון",
    selectFile: "בחר קובץ...",
    upload: "העלה",
    uploading: "מעלה...",
    cancel: "ביטול"
  }
};
