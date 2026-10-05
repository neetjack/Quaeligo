import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AdminQuestionsTab from '../components/admin/AdminQuestionsTab';
import AdminMetricsTab from '../components/admin/AdminMetricsTab';
import AdminResponsesTab from '../components/admin/AdminResponsesTab';
import AdminAccountTab from '../components/admin/AdminAccountTab';
import AdminSurveyList from '../components/admin/AdminSurveyList';

export default function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [tab, setTab] = useState<'questions' | 'metrics' | 'responses' | 'account'>('questions');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleTabSwitch = (newTab: 'questions' | 'metrics' | 'responses' | 'account') => {
    if (hasUnsavedChanges) {
      if (!window.confirm(t('UnsavedChanges') || 'You have unsaved changes. Discard them?')) {
        return;
      }
    }
    setHasUnsavedChanges(false);
    setTab(newTab);
  };

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm(t('UnsavedChanges') || 'You have unsaved changes. Discard them?')) {
        return;
      }
    }
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (!token) return null;

  return (
    <div className="admin-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#fff', border: '4px solid #000', padding: '20px', boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
          <h1 style={{ fontSize: '2em', textShadow: '2px 2px 0px #aaa', margin: 0 }}>
            {selectedSurveyId ? t('SurveyManagement') || 'Survey Management' : t('AdminDashboard')}
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            {selectedSurveyId && (
              <button 
                className="pixel-btn" 
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (!window.confirm(t('UnsavedChanges') || 'You have unsaved changes. Discard them?')) return;
                  }
                  setHasUnsavedChanges(false);
                  setSelectedSurveyId(null);
                }}
              >
                {t('BackToSurveys') || 'Back to Surveys'}
              </button>
            )}
            <button className="pixel-btn danger" onClick={handleLogout}>{t('Logout')}</button>
          </div>
        </div>
        
        {!selectedSurveyId ? (
          <>
            <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button 
                className={`pixel-btn ${tab !== 'account' ? 'active' : 'secondary'}`} 
                onClick={() => handleTabSwitch('questions')}
              >
                {t('SurveysTab') || 'Surveys'}
              </button>
              <button 
                className={`pixel-btn ${tab === 'account' ? 'active' : 'secondary'}`} 
                onClick={() => handleTabSwitch('account')}
              >
                {t('AccountTab')}
              </button>
            </div>
            {tab === 'account' ? <AdminAccountTab /> : <AdminSurveyList onSelectSurvey={setSelectedSurveyId} />}
          </>
        ) : (
          <>
            <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button className={`pixel-btn ${tab === 'questions' ? 'active' : 'secondary'}`} onClick={() => handleTabSwitch('questions')}>{t('QuestionsTab')}</button>
              <button className={`pixel-btn ${tab === 'metrics' ? 'active' : 'secondary'}`} onClick={() => handleTabSwitch('metrics')}>{t('MetricsTab')}</button>
              <button className={`pixel-btn ${tab === 'responses' ? 'active' : 'secondary'}`} onClick={() => handleTabSwitch('responses')}>{t('ResponsesTab')}</button>
            </div>

            {tab === 'questions' && <AdminQuestionsTab surveyId={selectedSurveyId} setHasUnsavedChanges={setHasUnsavedChanges} />}
            {tab === 'metrics' && <AdminMetricsTab surveyId={selectedSurveyId} setHasUnsavedChanges={setHasUnsavedChanges} />}
            {tab === 'responses' && <AdminResponsesTab surveyId={selectedSurveyId} />}
          </>
        )}
      </div>
    </div>
  );
}
