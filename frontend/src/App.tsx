import { useState } from 'react';
import { LoginPage } from './design-system/pages/Login/LoginPage';
import { RegisterPage } from './design-system/pages/Register/RegisterPage';

function App() {
  const [view, setView] = useState<'login' | 'register'>('login');

  return view === 'login' ? (
    <LoginPage onNavigateRegister={() => setView('register')} />
  ) : (
    <RegisterPage onNavigateLogin={() => setView('login')} />
  );
}

export default App;
