import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login, Health, Register, AdminUsers, Recover, Reset, Chat } from './pages'; 
  
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
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

