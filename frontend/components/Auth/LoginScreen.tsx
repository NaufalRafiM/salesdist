import React from 'react';
import { AuthDashboard } from './AuthDashboard';
import { User as UserType } from '../../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  return <AuthDashboard onLoginSuccess={onLoginSuccess} />;
};
