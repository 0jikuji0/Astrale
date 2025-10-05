import { createBrowserRouter, RouterProvider } from 'react-router';

import Home from './pages/Home';
import Simulation from './pages/Simulation';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/simulation",
    element: <Simulation />,
  },
]);

const Routes = () => {
  return (
    <RouterProvider router={router} />
  )
}

export default Routes