import { Route, Routes, Navigate } from "react-router-dom";

import { labels } from "./lib/i18n-he";
import { AppLayout } from "./layouts/AppLayout";
import { StudentsListPage } from "./pages/StudentsListPage";
import { StudentDetailsPage } from "./pages/StudentDetailsPage";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/students" replace />} />
        <Route path="/students" element={<StudentsListPage />} />
        <Route path="/students/:id" element={<StudentDetailsPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
