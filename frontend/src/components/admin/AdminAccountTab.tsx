/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function AdminAccountTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ newUsername, newPassword })
    });
    alert(t('UpdateAccount') + ' OK!');
    setNewUsername('');
    setNewPassword('');
  };

  const handleResetSurvey = async () => {
    if (window.confirm(t('ResetConfirm'))) {
      try {
        const res = await fetch('/api/admin/reset', {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          alert(t('ResetSuccess'));
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        } else {
          alert(t('ResetFail'));
        }
      } catch (e) {
        alert(t('NetworkError'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <form onSubmit={handleUpdate}>
        <h3>{t('UpdateAccount')}</h3>
        <input className="pixel-input" placeholder={t('NewUsername')} value={newUsername} onChange={e => setNewUsername(e.target.value)} />
        <input className="pixel-input" type="password" placeholder={t('NewPassword')} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button className="pixel-btn" type="submit">{t('Update')}</button>
      </form>

      <div style={{ borderTop: '2px solid #ccc', paddingTop: '20px' }}>
        <h3 style={{ color: '#cc0000' }}>{t('DangerZone')}</h3>
        <p style={{ marginBottom: '10px' }}>This will clear all questions, metrics, responses, and local audio files!</p>
        <button className="pixel-btn danger" onClick={handleResetSurvey}>
          {t('ClearEverything') || 'Clear Everything'}
        </button>
      </div>
    </div>
  );
}
