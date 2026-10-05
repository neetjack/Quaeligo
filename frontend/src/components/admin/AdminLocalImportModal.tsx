import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface LocalSurvey {
  folderName: string;
  title: string;
  slug: string;
  questionsCount: number;
  metricsCount: number;
}

interface Props {
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function AdminLocalImportModal({ onClose, onImportSuccess }: Props) {
  const { t } = useTranslation();
  const token = localStorage.getItem('adminToken');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [surveys, setSurveys] = useState<LocalSurvey[]>([]);
  const [deleteAfterImport, setDeleteAfterImport] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  useEffect(() => {
    fetchLocalSurveys();
  }, []);

  const fetchLocalSurveys = async () => {
    setLoading(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/surveys/scan-local', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (folderName: string) => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/surveys/import-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ folderName, deleteAfterImport })
      });
      
      if (res.ok) {
        setImportResult(`Successfully imported ${folderName}`);
        await fetchLocalSurveys(); // Refresh list
        onImportSuccess();
      } else {
        const error = await res.json();
        setImportResult(`Failed to import ${folderName}: ${error.error || 'Unknown error'}`);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      setImportResult(`Failed to import ${folderName}: ${errorMessage}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#fff', border: '4px solid #000', padding: '20px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>{t('ScanLocalFolders') || 'Scan Local Folders'}</h3>
          <button className="pixel-btn secondary" onClick={onClose} disabled={importing}>X</button>
        </div>

        <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f0f0f0', border: '2px solid #000' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={deleteAfterImport} 
              onChange={e => setDeleteAfterImport(e.target.checked)} 
              style={{ marginRight: '10px', width: '20px', height: '20px' }}
              disabled={importing}
            />
            <span>{t('DeleteFolderAfterImport') || 'Delete source folder after successful import (Otherwise it will be renamed)'}</span>
          </label>
        </div>

        {importResult && (
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: importResult.includes('Success') ? '#d4edda' : '#f8d7da', border: '2px solid #000' }}>
            {importResult}
          </div>
        )}

        {loading ? (
          <div>{t('Scanning') || 'Scanning...'}</div>
        ) : surveys.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', border: '2px dashed #000' }}>
            {t('NoValidFoldersFound') || 'No valid folders with config.json found in backend/surveys_to_import/'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {surveys.map(s => (
              <div key={s.folderName} style={{ border: '2px solid #000', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{s.title}</h4>
                  <div style={{ fontSize: '0.85em', opacity: 0.8 }}>
                    Folder: {s.folderName} | Slug: {s.slug}<br/>
                    {s.questionsCount} Questions, {s.metricsCount} Metrics
                  </div>
                </div>
                <button 
                  className="pixel-btn primary" 
                  onClick={() => handleImport(s.folderName)}
                  disabled={importing}
                >
                  {importing ? '...' : (t('Import') || 'Import')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
