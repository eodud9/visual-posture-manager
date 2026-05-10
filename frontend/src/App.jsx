import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Report from './components/Report';
import Guide from './components/Guide';
import { Workspace } from "./components/Workspace";
import Home from "./components/Home"; 

import "./index.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<Layout />}>
          <Route path="/guide" element={<Guide />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/report" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;