import { Navigate, createBrowserRouter } from 'react-router';
import App from './App';
import APIs from '../pages/APIs';
import Demo from '../pages/Demo';
import Docs from '../pages/Docs';
import Home from '../pages/Home';

const routerBasename = import.meta.env.BASE_URL?.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      children: [
        { index: true, element: <Home /> },
        { path: 'docs/*', element: <Docs /> },
        { path: 'apis/*', element: <APIs /> },
        { path: 'demo', element: <Demo /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: routerBasename },
);
