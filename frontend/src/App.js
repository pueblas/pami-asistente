import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Health from './pages/health';
import Register from './pages/register';
import AdminUsers from './pages/adminUsers';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/health" element={<Health />} />
        <Route path='/register' element={<Register/>} />
        <Route path='/admin-center' element={<AdminUsers/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

