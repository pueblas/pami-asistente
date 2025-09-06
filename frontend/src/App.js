import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Health from './pages/health';
import Register from './pages/register';
import AdminUsers from './pages/adminUsers';
import Recover from './pages/recover';
import Reset from './pages/reset';
import Chat from "./pages/chat";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/health" element={<Health />} />
        <Route path='/register' element={<Register/>} />
        <Route path='/admin-center' element={<AdminUsers/>} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/reset" element={<Reset />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

