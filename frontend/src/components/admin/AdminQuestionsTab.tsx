/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { QuestionCard } from '../QuestionCard';
import type { IQuestion } from '../../types';

interface Props {
  surveyId: number;
  setHasUnsavedChanges: (val: boolean) => void;
}

export default function AdminQuestionsTab({ surveyId, setHasUnsavedChanges }: Props) {
  const { t } = useTranslation();
  const token = localStorage.getItem('adminToken');

  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [draftQuestions, setDraftQuestions] = useState<Record<number, Partial<IQuestion>>>({});
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<number[]>([]);
  const [draftUploads, setDraftUploads] = useState<Record<string, File>>({});

  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);
  const [draggableQuestionId, setDraggableQuestionId] = useState<number | null>(null);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [openGroupDropdownId, setOpenGroupDropdownId] = useState<number | null>(null);
  const [openTypeDropdownId, setOpenTypeDropdownId] = useState<number | null>(null);

  useEffect(() => {
    const hasUnsaved = Object.keys(draftQuestions).length > 0 || deletedQuestionIds.length > 0 || Object.keys(draftUploads).length > 0;
    setHasUnsavedChanges(hasUnsaved);
  }, [draftQuestions, deletedQuestionIds, draftUploads, setHasUnsavedChanges]);

  const fetchQuestions = async () => {
    const res = await fetch(`/api/admin/surveys/${surveyId}/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setQuestions(await res.json());
  };

  useEffect(() => {
    if (token) {
      fetchQuestions();
    }
  }, [token, surveyId]);

  const saveChanges = async () => {
    try {
      // 1. Process Deletions
      for (const id of deletedQuestionIds) {
        await fetch(`/api/admin/surveys/${surveyId}/questions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      }

      const idMapping: Record<number, number> = {};

      // 2. Process Questions (Create / Update)
      for (const [idStr, draftData] of Object.entries(draftQuestions)) {
        const id = parseInt(idStr);
        const fullData = { ...questions.find(q => q.id === id), ...draftData };
        if (id < 0) {
          const res = await fetch(`/api/admin/surveys/${surveyId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(fullData)
          });
          const newQ = await res.json();
          idMapping[id] = newQ.id;
        } else {
          await fetch(`/api/admin/surveys/${surveyId}/questions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(fullData)
          });
          idMapping[id] = id;
        }
      }

      // 4. Process File Uploads
      for (const [key, file] of Object.entries(draftUploads)) {
        const formData = new FormData();
        formData.append('file', file);
        if (key.startsWith('GLOBAL_')) {
          const filename = key.replace('GLOBAL_', '');
          await fetch(`/api/admin/upload-file/${encodeURIComponent(filename)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        } else {
          const [idStr, type] = key.split('_');
          const id = parseInt(idStr);
          const realId = idMapping[id] || id;
          const qFormData = new FormData();
          qFormData.append(type === 'A' ? 'audioA' : type === 'B' ? 'audioB' : type === 'C' ? 'audioC' : type === 'D' ? 'audioD' : 'audioE', file);
          await fetch(`/api/admin/surveys/${surveyId}/questions/${realId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: qFormData
          });
        }
      }

      setDraftQuestions({});
      setDeletedQuestionIds([]);
      setDraftUploads({});
      fetchQuestions();
      alert(t('SaveSuccess') || 'Changes saved successfully.');
    } catch (error) {
      console.error("Save Changes failed:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    
    // Optimistically reorder
    const newQuestions = [...questions];
    const draggedItem = newQuestions[draggedItemIndex];
    newQuestions.splice(draggedItemIndex, 1);
    newQuestions.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setQuestions(newQuestions);
    
    // Update drafts with new orders
    const newDrafts = { ...draftQuestions };
    newQuestions.forEach((q, i) => {
      newDrafts[q.id] = { ...newDrafts[q.id], ...(draftQuestions[q.id] || {}), order: i + 1 };
    });
    setDraftQuestions(newDrafts);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleQuestionChange = (id: number, field: keyof IQuestion | string, value: any) => {
    setDraftQuestions(prev => {
      const updates: Partial<IQuestion> = { [field]: value };
      if (field === 'type') {
        updates.uploadedFiles = [];
        updates.audioUrlA = '';
        updates.audioUrlB = '';
        updates.audioUrlC = '';
      }
      return { ...prev, [id]: { ...prev[id], ...updates } };
    });
  };

  const handleCreateQuestion = async () => {
    const fakeId = -Date.now();
    const newQ: IQuestion = { id: fakeId, title: 'New Question', type: 'AUDIO_AB', audioUrlA: '', audioUrlB: '', order: questions.length + 1 };
    setQuestions([...questions, newQ]);
    setDraftQuestions(prev => ({ ...prev, [fakeId]: newQ }));
    setExpandedQuestionId(fakeId);
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    if (id > 0) {
      setDeletedQuestionIds(prev => [...prev, id]);
    }
    setQuestions(questions.filter(q => q.id !== id));
    if (id < 0) {
      const newDrafts = { ...draftQuestions };
      delete newDrafts[id];
      setDraftQuestions(newDrafts);
      
      const newUploads = { ...draftUploads };
      delete newUploads[`${id}_A`];
      delete newUploads[`${id}_B`];
      delete newUploads[`${id}_C`];
      delete newUploads[`${id}_D`];
      delete newUploads[`${id}_E`];
      setDraftUploads(newUploads);
    }
  };

  const handleUpdateAudio = async (id: number, type: 'A'|'B'|'C'|'D'|'E', e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setDraftUploads(prev => ({ ...prev, [`${id}_${type}`]: file }));
  };

  const handleUploadFile = async (filename: string, e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setDraftUploads(prev => ({ ...prev, [`GLOBAL_${filename}`]: file }));
  };

  const hasUnsavedChanges = Object.keys(draftQuestions).length > 0 || deletedQuestionIds.length > 0 || Object.keys(draftUploads).length > 0;

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button className="pixel-btn primary" onClick={handleCreateQuestion}>{t('AddNewQuestion')}</button>
        <button className="pixel-btn success" disabled={!hasUnsavedChanges} onClick={saveChanges}>
          {t('SaveChanges')}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions.map((q, index) => (
          <QuestionCard
            key={q.id}
            q={q}
            index={index}
            draftQuestion={draftQuestions[q.id]}
            draftUploads={draftUploads}
            expandedQuestionId={expandedQuestionId}
            setExpandedQuestionId={setExpandedQuestionId}
            draggableQuestionId={draggableQuestionId}
            setDraggableQuestionId={setDraggableQuestionId}
            draggedItemIndex={draggedItemIndex}
            handleDragStart={handleDragStart}
            handleDragEnter={handleDragEnter}
            handleDragEnd={handleDragEnd}
            openGroupDropdownId={openGroupDropdownId}
            setOpenGroupDropdownId={setOpenGroupDropdownId}
            openTypeDropdownId={openTypeDropdownId}
            setOpenTypeDropdownId={setOpenTypeDropdownId}
            handleQuestionChange={handleQuestionChange}
            handleDeleteQuestion={handleDeleteQuestion}
            handleUpdateAudio={handleUpdateAudio}
            handleUploadFile={handleUploadFile}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}
