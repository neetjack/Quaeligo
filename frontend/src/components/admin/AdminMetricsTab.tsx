/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MetricCard } from '../MetricCard';
import type { IMetric } from '../../types';

interface Props {
  surveyId: number;
  setHasUnsavedChanges: (val: boolean) => void;
}

export default function AdminMetricsTab({ surveyId, setHasUnsavedChanges }: Props) {
  const { t } = useTranslation();
  const token = localStorage.getItem('adminToken');

  const [metrics, setMetrics] = useState<IMetric[]>([]);
  const [draftMetrics, setDraftMetrics] = useState<Record<number, Partial<IMetric>>>({});
  
  const [expandedMetricId, setExpandedMetricId] = useState<number | null>(null);
  const [draggableMetricId, setDraggableMetricId] = useState<number | null>(null);
  const [draggedMetricIndex, setDraggedMetricIndex] = useState<number | null>(null);
  const [activeMetricGroup, setActiveMetricGroup] = useState<string>('A');
  const [isMetricDropdownOpen, setIsMetricDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasUnsavedChanges(Object.keys(draftMetrics).length > 0);
  }, [draftMetrics, setHasUnsavedChanges]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMetricDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMetrics = async () => {
    const res = await fetch(`/api/admin/surveys/${surveyId}/metrics`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setMetrics(data || []);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [surveyId]);

  const saveChanges = async () => {
    if (Object.keys(draftMetrics).length === 0) return;

    // Apply drafts to local array
    const updatedMetrics = [...metrics];
    for (const [idStr, draft] of Object.entries(draftMetrics)) {
      const id = parseInt(idStr, 10);
      const index = updatedMetrics.findIndex(m => m.id === id);
      if (index !== -1) {
        updatedMetrics[index] = { ...updatedMetrics[index], ...draft };
      }
    }

    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}/metrics/batch`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ metrics: updatedMetrics })
      });
      if (res.ok) {
        setMetrics(updatedMetrics);
        setDraftMetrics({});
        alert(t('SaveSuccess') || 'Changes saved successfully.');
      } else {
        alert('Failed to save metrics.');
      }
    } catch(err) {
      alert('Network error.');
    }
  };

  const handleCreateScale5Uni = async () => {
    const newM = { group: activeMetricGroup, type: 'basic', title: '5点单极量表|5-point Unipolar Scale|5点単極スケール', leftLabel: '非常不满意|Very Dissatisfied|非常に不満', rightLabel: '非常满意|Very Satisfied|非常に満足', levelCount: 5, order: metrics.length };
    await fetch(`/api/admin/surveys/${surveyId}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newM) });
    fetchMetrics();
    setIsMetricDropdownOpen(false);
  };
  const handleCreateScale7Uni = async () => {
    const newM = { group: activeMetricGroup, type: 'basic', title: '7点单极量表|7-point Unipolar Scale|7点単極スケール', leftLabel: '非常不满意|Very Dissatisfied|非常に不満', rightLabel: '非常满意|Very Satisfied|非常に満足', levelCount: 7, order: metrics.length };
    await fetch(`/api/admin/surveys/${surveyId}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newM) });
    fetchMetrics();
    setIsMetricDropdownOpen(false);
  };
  const handleCreateScale7Bi = async () => {
    const newM = { group: activeMetricGroup, type: 'basic', title: '7点双极量表|7-point Bipolar Scale|7点双極スケール', leftLabel: '非常不自然|Very Unnatural|非常に不自然', rightLabel: '非常自然|Very Natural|非常に自然', centerLabel: '中立|Neutral|中立', levelCount: 7, isBipolar: true, order: metrics.length };
    await fetch(`/api/admin/surveys/${surveyId}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newM) });
    fetchMetrics();
    setIsMetricDropdownOpen(false);
  };
  const handleCreateSemanticPairs = async () => {
    const defaultPairs = [
      { id: '1', left: '沉闷|Dull|退屈', right: '活跃|Lively|活発' },
      { id: '2', left: '粗糙|Rough|粗い', right: '平滑|Smooth|滑らか' }
    ];
    const newM = { group: activeMetricGroup, type: 'semantic_pair', title: '语义差异词对|Semantic Pairs|意味的差異ペア', leftLabel: JSON.stringify(defaultPairs), levelCount: 7, order: metrics.length };
    await fetch(`/api/admin/surveys/${surveyId}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newM) });
    fetchMetrics();
    setIsMetricDropdownOpen(false);
  };
  const handleCreateMushraGroup = async () => {
    const defaultSliders = [
      { id: '1', name: '总体质量|Overall Quality|総合品質' },
      { id: '2', name: '自然度|Naturalness|自然さ' }
    ];
    const newM = { group: activeMetricGroup, type: 'mushra_group', title: 'MUSHRA 评分组|MUSHRA Rating Group|MUSHRA 評価グループ', leftLabel: JSON.stringify(defaultSliders), order: metrics.length };
    await fetch(`/api/admin/surveys/${surveyId}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newM) });
    fetchMetrics();
    setIsMetricDropdownOpen(false);
  };
  const handleCreateTextMetric = async () => {
    const newM = { group: activeMetricGroup, type: 'text', title: '文本框|Text Box|テキストボックス', leftLabel: '', rightLabel: '', centerLabel: '', levelCount: 0, isBipolar: false, order: metrics.length };
    await fetch(`/api/admin/surveys/${surveyId}/metrics`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newM) });
    fetchMetrics();
    setIsMetricDropdownOpen(false);
  };

  const handleMetricChange = (id: number, field: keyof IMetric, value: any) => {
    setDraftMetrics(prev => {
      const metricBase = prev[id] || metrics.find(m => m.id === id);
      return {
        ...prev,
        [id]: { ...metricBase, [field]: value }
      };
    });
  };

  const handleDeleteMetric = async (id: number) => {
    if (window.confirm(t('DeleteConfirm'))) {
      const res = await fetch(`/api/admin/surveys/${surveyId}/metrics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMetrics(metrics.filter(m => m.id !== id));
        setDraftMetrics(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    }
  };

  const handleMetricDragStart = (index: number) => {
    setDraggedMetricIndex(index);
  };

  const handleMetricDragEnter = (index: number) => {
    if (draggedMetricIndex === null || draggedMetricIndex === index) return;
    const currentMetrics = [...metrics];
    for (const [idStr, draft] of Object.entries(draftMetrics)) {
      const id = parseInt(idStr, 10);
      const i = currentMetrics.findIndex(m => m.id === id);
      if (i !== -1) currentMetrics[i] = { ...currentMetrics[i], ...draft };
    }
    const filteredMetrics = currentMetrics.filter(m => (m.group || 'A') === activeMetricGroup);
    const draggedMetric = filteredMetrics[draggedMetricIndex];
    const updatedFiltered = [...filteredMetrics];
    updatedFiltered.splice(draggedMetricIndex, 1);
    updatedFiltered.splice(index, 0, draggedMetric);
    const newDrafts = { ...draftMetrics };
    updatedFiltered.forEach((m, idx) => {
      if (m.order !== idx) {
        newDrafts[m.id] = { ...m, order: idx };
      }
    });
    setDraftMetrics(newDrafts);
    setDraggedMetricIndex(index);
  };

  const handleMetricDragEnd = () => {
    setDraggedMetricIndex(null);
    setDraggableMetricId(null);
  };

  const hasUnsavedChanges = Object.keys(draftMetrics).length > 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        {(['A', 'B', 'C', 'D'] as const).map(g => (
          <button 
            key={g} 
            className={`pixel-btn ${activeMetricGroup === g ? 'active' : 'secondary'}`} 
            onClick={() => setActiveMetricGroup(g)}
          >
            {t(`MetricGroup${g}`) || `Group ${g}`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button className="pixel-btn" onClick={() => setIsMetricDropdownOpen(!isMetricDropdownOpen)}>
            {t('AddMetric') || 'Add Metric ▾'}
          </button>
          {isMetricDropdownOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', background: 'white', border: '2px solid #000', borderRadius: '5px', zIndex: 100, display: 'flex', flexDirection: 'column', minWidth: '220px', boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}>
              <button className="pixel-btn dropdown-item" onClick={handleCreateScale5Uni}>{t('Scale5')}</button>
              <button className="pixel-btn dropdown-item" onClick={handleCreateScale7Uni}>{t('Scale7Uni')}</button>
              <button className="pixel-btn dropdown-item" onClick={handleCreateScale7Bi}>{t('Scale7Bi')}</button>
              <button className="pixel-btn dropdown-item" onClick={handleCreateSemanticPairs}>{t('SemanticPairs')}</button>
              <button className="pixel-btn dropdown-item" onClick={handleCreateMushraGroup}>{t('MushraSliders')}</button>
              <button className="pixel-btn dropdown-item" onClick={handleCreateTextMetric}>{t('TextContent')}</button>
            </div>
          )}
        </div>
        <button className="pixel-btn success" disabled={!hasUnsavedChanges} onClick={saveChanges}>
          {t('SaveChanges')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {metrics.filter(m => (m.group || 'A') === activeMetricGroup).map((m, filteredIndex) => {
          const index = metrics.indexOf(m);
          return (
            <MetricCard
              key={m.id}
              m={m}
              index={index}
              filteredIndex={filteredIndex}
              draftMetric={draftMetrics[m.id]}
              expandedMetricId={expandedMetricId}
              setExpandedMetricId={setExpandedMetricId}
              draggableMetricId={draggableMetricId}
              setDraggableMetricId={setDraggableMetricId}
              draggedMetricIndex={draggedMetricIndex}
              handleMetricDragStart={handleMetricDragStart}
              handleMetricDragEnter={handleMetricDragEnter}
              handleMetricDragEnd={handleMetricDragEnd}
              handleMetricChange={handleMetricChange}
              handleDeleteMetric={handleDeleteMetric}
              t={t}
            />
          );
        })}
      </div>
    </div>
  );
}
