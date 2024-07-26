import React, { useEffect, useRef, FC } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

interface ClickableGoogleLoginProps {
  onSuccess: (response: CredentialResponse) => void;
  onError: () => void;
  simulateClick: boolean;
}

const ClickableGoogleLogin: FC<ClickableGoogleLoginProps> = ({ onSuccess, onError, simulateClick }) => {
  const loginButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (simulateClick && loginButtonRef.current) {
      const button = loginButtonRef.current.querySelector('button');
      if (button) {
        button.click();
      }
    }
  }, [simulateClick]);

  return (
    <div ref={loginButtonRef}>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  );
}

export default ClickableGoogleLogin;
