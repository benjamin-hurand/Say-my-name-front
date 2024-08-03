import {RouterProvider} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { router } from "./components/routes/routes";
import './services/notification/toastifyCustom.css';

function App() {
  return (
    <>
      <ToastContainer />
      <div style={{ padding: '20px' }}>
        <RouterProvider router={router} />
      </div>
    </>
  )
}

export default App
