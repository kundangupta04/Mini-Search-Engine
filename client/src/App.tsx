import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import DocumentPage from "./pages/DocumentPage";
import DsaDashboardPage from "./pages/DsaDashboardPage";
import StatisticsPage from "./pages/StatisticsPage";
import VisualizerPage from "./pages/VisualizerPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      {/* Every page is rendered inside Layout (navbar + footer) */}
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<ResultsPage />} />
        <Route path="document/:id" element={<DocumentPage />} />
        <Route path="visualizer" element={<VisualizerPage />} />
        <Route path="dsa" element={<DsaDashboardPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}