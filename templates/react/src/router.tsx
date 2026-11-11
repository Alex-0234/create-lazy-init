import { createBrowserRouter } from 'react-router'
import RootLayout from './routes/root'
import Home from './routes/home'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
    ],
  },
])
