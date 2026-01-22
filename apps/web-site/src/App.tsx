import './App.css';
import NavBar from './components/NavBar';
import { Outlet } from 'react-router';

function App() {
  return (
    <div className="app-root">
      <NavBar />
      <Outlet />
    </div>
  );
}

export default App;
