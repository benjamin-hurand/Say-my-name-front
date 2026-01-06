import { RouterProvider } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ParticlesBackground from "./components/layout/ParticleBackground"; // garde ton chemin/fichier
import { router } from "./components/routes/routes";

import { AuthProvider } from "./contexts/AuthContext";
import { ParticlesProvider } from "./contexts/ParticlesContext"; // <-- NEW

import './services/notification/toastifyCustom.css';

function App() {
  return (
    <>
      <AuthProvider>
        <ParticlesProvider> {/* <-- wrappe tout ce qbui utilise les particules */}
          <ToastContainer />
          <div
            style={{
              maxWidth: '100%',
              height: '100%',
              width: '100%',
              maxHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <ParticlesBackground />
            <RouterProvider router={router} />
          </div>
        </ParticlesProvider>
      </AuthProvider>
    </>
  );
}

export default App;
