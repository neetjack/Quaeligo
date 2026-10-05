import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLocalImportModal from './AdminLocalImportModal';
import Papa from 'papaparse';
import { exportQuestionsToCsv } from '../../utils/csvUtils';

interface Survey {
  id: number;
  slug: string;
  title: string;
  description: string;
  welcomeText?: string;
  status: string;
}

interface Props {
  onSelectSurvey: (id: number) => void;
}

export default function AdminSurveyList({ onSelectSurvey }: Props) {
  const { t } = useTranslation();
  const token = localStorage.getItem('adminToken');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);

  // New Survey State
  const [showNewModal, setShowNewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newWelcomeText, setNewWelcomeText] = useState('');
  
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editWelcomeText, setEditWelcomeText] = useState('');

  const [showActionsDropdown, setShowActionsDropdown] = useState<number | null>(null);
  const [importCsvSurveyId, setImportCsvSurveyId] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [replaceMode, setReplaceMode] = useState<boolean>(false);

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/admin/surveys', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSurveys(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [token]);

  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newSurveys = [...surveys];
    const draggedItem = newSurveys[draggedIndex];
    newSurveys.splice(draggedIndex, 1);
    newSurveys.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setSurveys(newSurveys);
  };

  
  const handleEdit = async () => {
    if (!editingSurvey || !editTitle || !editSlug) return alert('Title and Slug are required');
    try {
      const res = await fetch(`/api/admin/surveys/${editingSurvey.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editTitle, slug: editSlug, description: editDesc, welcomeText: editWelcomeText })
      });
      if (res.ok) {
        setEditingSurvey(null);
        fetchSurveys();
      } else {
        alert('Failed to update survey');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating survey');
    }
  };

  const openEditModal = (survey: Survey) => {
    setEditingSurvey(survey);
    setEditTitle(survey.title);
    setEditSlug(survey.slug);
    setEditDesc(survey.description);
    setEditWelcomeText(survey.welcomeText || '');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('DeleteConfirm') || 'Are you sure you want to delete this?')) return;
    try {
      const res = await fetch(`/api/admin/surveys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchSurveys();
      } else {
        alert('Failed to delete survey');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting survey');
    }
  };

  const handleExportCsv = async (survey: Survey) => {
    try {
      const res = await fetch(`/api/admin/surveys/${survey.id}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      exportQuestionsToCsv(data, `${survey.slug}_questions.csv`);
    } catch (e) {
      console.error(e);
      alert('Error exporting CSV');
    }
  };

  const handleImportCsv = async () => {
    if (!importCsvSurveyId || !csvFile) return;
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const res = await fetch(`/api/admin/surveys/${importCsvSurveyId}/questions/batch`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions: results.data, replace: replaceMode })
          });
          if (res.ok) {
            alert('Import successful');
            setImportCsvSurveyId(null);
            setCsvFile(null);
          } else {
            alert('Import failed');
          }
        } catch(e) {
          console.error(e);
          alert('Import error');
        }
      }
    });
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/surveys/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchSurveys();
    } catch(e) { console.error(e); }
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    const orderedIds = surveys.map(s => s.id);
    const token = localStorage.getItem('adminToken');
    try {
      await fetch('/api/admin/surveys/order', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
          },
        body: JSON.stringify({ orderedIds })
      });
    } catch (e) {
      console.error('Failed to save order', e);
    }
  };

  const handleCreate = async () => {
    if (!newTitle || !newSlug) return alert('Title and Slug are required');
    try {
      const res = await fetch('/api/admin/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle, slug: newSlug, description: newDesc, welcomeText: newWelcomeText })
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewTitle('');
        setNewSlug('');
        setNewDesc('');
        fetchSurveys();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create survey');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>{t('Loading') || 'Loading...'}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{t('ManageSurveys') || 'Manage Surveys'}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="pixel-btn secondary" onClick={() => setShowImportModal(true)}>
            {t('ScanLocalFolders') || 'Scan Local Folders'}
          </button>
          <button className="pixel-btn primary" onClick={() => setShowNewModal(true)}>
            {t('NewSurvey') || 'New Survey'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {surveys.map((survey, index) => (
            <div key={survey.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDragEnd={handleDragEnd} style={{ border: '4px solid #000', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9f9f9', boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ cursor: 'grab', marginRight: '15px', fontSize: '1.5rem', color: '#999' }}>☰</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <h3 style={{ margin: 0 }}>{survey.title}</h3>
                    <select 
                      className="pixel-input"
                      style={{ padding: '2px 5px', fontSize: '0.8rem', minHeight: 'auto', backgroundColor: survey.status === 'PUBLIC' ? '#d4edda' : '#ddd' }}
                      value={survey.status}
                      onChange={async (e) => {
                        try {
                          await fetch(`/api/admin/surveys/${survey.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: e.target.value })
                          });
                          fetchSurveys();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLIC">PUBLIC</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>Slug: /{survey.slug}</p>
                  {survey.description && <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', color: '#666' }}>{survey.description}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative' }}>
                  <button className="pixel-btn secondary" onClick={() => setShowActionsDropdown(showActionsDropdown === survey.id ? null : survey.id)}>{t('Actions') || 'Actions'} ▼</button>
                  {showActionsDropdown === survey.id && (
                    <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '5px', background: '#fff', border: '4px solid #000', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10, boxShadow: '4px 4px 0px rgba(0,0,0,1)', minWidth: '150px' }}>
                      <button className="pixel-btn secondary" style={{ width: '100%' }} onClick={() => { handleDuplicate(survey.id); setShowActionsDropdown(null); }}>{t('Duplicate') || 'Duplicate'}</button>
                      <button className="pixel-btn secondary" style={{ width: '100%' }} onClick={() => { handleExportCsv(survey); setShowActionsDropdown(null); }}>{t('ExportCSV') || 'Export CSV'}</button>
                      <button className="pixel-btn secondary" style={{ width: '100%' }} onClick={() => { setImportCsvSurveyId(survey.id); setShowActionsDropdown(null); }}>{t('ImportCSV') || 'Import CSV'}</button>
                      <button className="pixel-btn secondary" style={{ width: '100%', color: '#d9534f', borderColor: '#d9534f' }} onClick={() => { handleDelete(survey.id); setShowActionsDropdown(null); }}>{t('Delete') || 'Delete'}</button>
                    </div>
                  )}
                </div>
                <button className="pixel-btn secondary" onClick={() => openEditModal(survey)}>{t('Edit') || 'Edit'}</button>
                <button className="pixel-btn" onClick={() => onSelectSurvey(survey.id)}>{t('Manage') || 'Manage'}</button>
              </div>
            </div>
          ))}
      </div>

      {showNewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', border: '4px solid #000', padding: '20px', width: '90%', maxWidth: '400px', boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
            <h3 style={{ marginTop: 0 }}>{t('NewSurvey') || 'New Survey'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('Title') || 'Title'} {t('MultilingualPrompt') || '(Multi-language supported, e.g., 中文|English|日本語)'}</label>
              <input className="pixel-input" type="text" placeholder={t('MultilingualTitlePlaceholder') || "e.g., 调查问卷|Survey|アンケート"} value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('SlugPath') || 'Slug (URL path)'}</label>
              <input className="pixel-input" type="text" value={newSlug} onChange={e => setNewSlug(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('SurveyDescription') || 'Description'} {t('MultilingualDescPrompt') || '(Multi-language, split with |)'}</label>
              <textarea className="pixel-input" placeholder={t('MultilingualDescPlaceholder') || "e.g., 这是说明|This is desc|説明です"} value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('WelcomeText') || 'Welcome Text (Markdown)'} {t('MultilingualDescPrompt') || '(Multi-language, split with |)'}</label>
              <textarea className="pixel-input" placeholder={t('WelcomePlaceholder') || "e.g., Welcome to the survey!|欢迎！|ようこそ！"} value={newWelcomeText} onChange={e => setNewWelcomeText(e.target.value)} style={{ width: '100%', resize: 'vertical', minHeight: '80px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="pixel-btn secondary" onClick={() => setShowNewModal(false)}>{t('Cancel') || 'Cancel'}</button>
              <button className="pixel-btn primary" onClick={handleCreate}>{t('Create') || 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      
      {editingSurvey && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', border: '4px solid #000', padding: '20px', width: '90%', maxWidth: '400px', boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
            <h3 style={{ marginTop: 0 }}>{t('EditSurvey') || 'Edit Survey'}</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('Title') || 'Title'} {t('MultilingualPrompt') || '(Multi-language supported, e.g., 中文|English|日本語)'}</label>
              <input className="pixel-input" type="text" placeholder={t('MultilingualTitlePlaceholder') || "e.g., 调查问卷|Survey|アンケート"} value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('SlugPath') || 'Slug (URL path)'}</label>
              <input className="pixel-input" type="text" value={editSlug} onChange={e => setEditSlug(e.target.value)} style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('SurveyDescription') || 'Description'} {t('MultilingualDescPrompt') || '(Multi-language, split with |)'}</label>
              <textarea className="pixel-input" placeholder={t('MultilingualDescPlaceholder') || "e.g., 这是说明|This is desc|説明です"} value={editDesc} onChange={e => setEditDesc(e.target.value)} style={{ width: '100%', resize: 'vertical' }} />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{t('WelcomeText') || 'Welcome Text (Markdown)'} {t('MultilingualDescPrompt') || '(Multi-language, split with |)'}</label>
              <textarea className="pixel-input" placeholder={t('WelcomePlaceholder') || "e.g., Welcome to the survey!|欢迎！|ようこそ！"} value={editWelcomeText} onChange={e => setEditWelcomeText(e.target.value)} style={{ width: '100%', resize: 'vertical', minHeight: '80px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="pixel-btn secondary" onClick={() => setEditingSurvey(null)}>{t('Cancel') || 'Cancel'}</button>
              <button className="pixel-btn primary" onClick={handleEdit}>{t('Save') || 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {importCsvSurveyId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', border: '4px solid #000', padding: '20px', width: '90%', maxWidth: '400px', boxShadow: '8px 8px 0px rgba(0,0,0,1)' }}>
            <h3 style={{ marginTop: 0 }}>{t('ImportCSV') || 'Import CSV'}</h3>
            <input type="file" accept=".csv" className="pixel-input" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} style={{ marginBottom: '15px', width: '100%' }} />
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input type="radio" name="replaceMode" checked={!replaceMode} onChange={() => setReplaceMode(false)} />
                {t('AppendToExisting') || 'Append to existing questions'}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '5px' }}>
                <input type="radio" name="replaceMode" checked={replaceMode} onChange={() => setReplaceMode(true)} />
                {t('OverwriteExisting') || 'Overwrite existing questions'}
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="pixel-btn secondary" onClick={() => { setImportCsvSurveyId(null); setCsvFile(null); }}>{t('Cancel') || 'Cancel'}</button>
              <button className="pixel-btn primary" onClick={handleImportCsv} disabled={!csvFile}>{t('Import') || 'Import'}</button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <AdminLocalImportModal 
          onClose={() => setShowImportModal(false)} 
          onImportSuccess={fetchSurveys} 
        />
      )}
    </div>
  );
}
