import { RouterProvider } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ParticlesBackground from "./components/layout/ParticleBackground";
import { router } from "./components/routes/routes";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import './services/notification/toastifyCustom.css';

function App() {
  return (
    <>
    <AuthProvider>
      <ProfileProvider>
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
        </ProfileProvider>
    </AuthProvider>
    </>
  )
}

export default App
