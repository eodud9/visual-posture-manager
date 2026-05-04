import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { Workspace } from "./components/Workspace";
import "./index.css";

function App() {
  return (
    <div className="bg-[#F9FAFC] min-h-screen">
      <Header />
      <main className="flex">
        <Sidebar />
        <Workspace />
      </main>
    </div>
  );
}

export default App;
