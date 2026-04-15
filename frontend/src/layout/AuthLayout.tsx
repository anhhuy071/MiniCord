import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
  return (
    <div className="auth-page">
      <div className="auth-box">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
