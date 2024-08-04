import {RouterProvider} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { router } from "./components/routes/routes";
import './services/notification/toastifyCustom.css';
import ParticlesBackground from "./components/layout/ParticleBackground";

function App() {
  return (
    <>
      <ToastContainer />
      <div style={{
        maxWidth: '100%', // Ensure width does not exceed the viewport
        height: '100%',
        width: '100%',
        maxHeight: '100vh', // Ensure height does not exceed the viewport
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center', // Center content vertically
        alignItems: 'center' // Center content horizontally
      }}>
        <ParticlesBackground />
        <RouterProvider router={router} />
      </div>
    </>
  )
}

export default App
