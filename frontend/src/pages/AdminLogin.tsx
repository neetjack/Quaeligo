 
/* eslint-disable @typescript-eslint/no-unused-vars */
 
 
 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function AdminLogin() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (e) {
      setError('Network error');
    }
  };

  return (
    <div className="pixel-container" style={{maxWidth: '400px'}}>
      <h2 className="pixel-title">{t('AdminLogin')}</h2>
      <form onSubmit={handleLogin}>
        <input 
          className="pixel-input" 
          placeholder={t('Username')} 
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input 
          className="pixel-input" 
          type="password"
          placeholder={t('Password')} 
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <p style={{color: 'red'}}>{error}</p>}
        <button className="pixel-btn" type="submit" style={{width: '100%'}}>{t('Login')}</button>
      </form>
    </div>
  );
}
