import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { parseI18nText } from '../utils/i18nUtils';

interface Survey {
  id: number;
  slug: string;
  title: string;
  description: string;
}

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/surveys')
      .then(res => res.json())
      .then(data => {
        setSurveys(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="pixel-container"><h1 className="pixel-title">{t('Loading') || 'Loading...'}</h1></div>;
  }

  return (
    <div className="pixel-container">
      <h1 className="pixel-title">{t('AvailableSurveys') || 'Available Surveys'}</h1>
      
      {surveys.length === 0 ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <p>{t('NoSurveys') || 'No public surveys available at the moment.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
          {surveys.map(survey => (
            <div 
              key={survey.id} 
              style={{
                backgroundColor: '#f9f9f9',
                padding: '20px',
                border: '4px solid #000',
                boxShadow: '4px 4px 0px rgba(0,0,0,1)',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}
            >
              <div style={{ flexGrow: 1, minWidth: '200px' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{parseI18nText(survey.title, i18n.language)}</h2>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, margin: 0 }}>{parseI18nText(survey.description, i18n.language)}</p>
              </div>
              <button 
                className="pixel-btn" 
                style={{ width: '120px', flexShrink: 0 }}
                onClick={() => navigate(`/survey/${survey.slug}`)}
              >
                {t('Start') || 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '50px', textAlign: 'center' }}>
        <button className="pixel-btn secondary" onClick={() => navigate('/admin')}>
          {t('AdminDashboard') || 'Admin Login'}
        </button>
      </div>
    </div>
  );
}
