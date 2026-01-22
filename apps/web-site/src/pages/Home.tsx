import { useNavigate } from 'react-router';

export default function Home() {
  const navigate = useNavigate();
  return (
    <main className="home-hero">
      <h1><span className="em">Mimic</span> enables reliable browser automation for modern web apps.</h1>
      <p>Elegant, powerful automation with Locators and Objects. Click-run demos, accessible APIs, and fast developer experience.</p>
      <div className="cta">
        <button onClick={() => navigate('/docs')}>Explore Docs</button>
        <button onClick={() => navigate('/apis')}>View APIs</button>
        <button onClick={() => navigate('/demo')}>Run Demo</button>
      </div>
    </main>
  );
}

