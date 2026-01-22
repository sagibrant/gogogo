
import { NavLink, useNavigate } from 'react-router';

export default function NavBar() {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <header className="nav modern-nav">
      <button
        className="brand-btn"
        aria-label="Mimic Home"
        onClick={() => navigate('/')}
      >
        <img src={`${baseUrl}icons/icon_32x32.png`} alt="Mimic" className="brand-icon" />
        <span className="brand-name">Mimic</span>
      </button>
      <nav className="menu">
        <NavLink
          to="/docs"
          className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
        >
          Docs
        </NavLink>
        <NavLink
          to="/apis"
          className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
        >
          APIs
        </NavLink>
        <NavLink
          to="/demo"
          className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
        >
          Demo
        </NavLink>
      </nav>
    </header>
  );
};
