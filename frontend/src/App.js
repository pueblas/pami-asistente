import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Login,
  Health,
  Register,
  AdminUsers,
  Recover,
  Reset,
  Chat,
  AdminProcedures,
  AdminHome,
  AdminGraphics,
} from "./pages";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/health" element={<Health />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin-home" element={<AdminHome />} />
        <Route path="/admin-center" element={<AdminUsers />} />
        <Route path="/admin-graphics" element={<AdminGraphics />} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/reset" element={<Reset />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin-procedures" element={<AdminProcedures />} />
      </Routes>
      <div id="modal-root"></div>
    </BrowserRouter>
  );
}

export default App;
