import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Health from './pages/health';
import Register from './pages/register';
//import Register from './pages/register';
//import Dashboard from './pages/dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/health" element={<Health />} />
        <Route path='/register' element={<Register/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;