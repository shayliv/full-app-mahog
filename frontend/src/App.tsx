import { Route, Routes, Navigate } from "react-router-dom";

import { labels } from "./lib/i18n-he";
import { AppLayout } from "./layouts/AppLayout";
import { StudentsListPage } from "./pages/StudentsListPage";
import { StudentDetailsPage } from "./pages/StudentDetailsPage";
import { CommandersListPage } from "./pages/CommandersListPage";
import { DisciplineViewPage } from "./pages/DisciplineViewPage";
import { MedicalViewPage } from "./pages/MedicalViewPage";
import { EvaluationViewPage } from "./pages/EvaluationViewPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/students" replace />} />
        <Route path="/students" element={<StudentsListPage />} />
        <Route path="/students/:id" element={<StudentDetailsPage />} />
        <Route path="/commanders" element={<CommandersListPage />} />
        <Route path="/views/discipline" element={<DisciplineViewPage />} />
        <Route path="/views/medical" element={<MedicalViewPage />} />
        <Route path="/views/evaluation" element={<EvaluationViewPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
