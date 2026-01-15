import SideBar from "../components/server/ServerSidebar";
import Home from "../pages/Home";

export default function AppLayout() {
  return (
    <div className="d-flex vh-100">
      {/* <ServerSidebar /> */}
      <div style={{ width: "250px" }}>
        <SideBar />
      </div>

      {/* MainContent */}
      <main className="flex-grow-1 p-3">
        <Home />
      </main>
    </div>
  );
}
