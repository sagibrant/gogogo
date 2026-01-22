import '../App.css';
import NavBar from '../shared/components/NavBar';
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
