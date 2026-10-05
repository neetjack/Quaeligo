/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-empty */
import React from 'react';
import { parseCSVLine } from '../utils/csvParser';
import type { IMetric } from '../types';

interface MetricCardProps {
  m: IMetric;
  index: number;
  filteredIndex: number;
  draftMetric: Partial<IMetric> | undefined;
  expandedMetricId: number | null;
  setExpandedMetricId: (id: number | null) => void;
  draggableMetricId: number | null;
  setDraggableMetricId: (id: number | null) => void;
  draggedMetricIndex: number | null;
  handleMetricDragStart: (index: number) => void;
  handleMetricDragEnter: (index: number) => void;
  handleMetricDragEnd: () => void;
  handleMetricChange: (id: number, field: keyof IMetric, value: any) => void;
  handleDeleteMetric: (id: number) => void;
  t: (key: string) => string;
}

const MetricCardInner: React.FC<MetricCardProps> = ({
  m,
  index,
  filteredIndex,
  draftMetric,
  expandedMetricId,
  setExpandedMetricId,
  draggableMetricId,
  setDraggableMetricId,
  draggedMetricIndex,
  handleMetricDragStart,
  handleMetricDragEnter,
  handleMetricDragEnd,
  handleMetricChange,
  handleDeleteMetric,
  t
}) => {
  const isDragged = draggedMetricIndex === index;
  const getMetricColor = (m: any) => {
    if (m.type === 'basic' && m.points === 5) return '#2196F3'; // Blue
    if (m.type === 'basic' && m.points === 7) return '#009688'; // Teal
    if (m.type === 'semantic_diff') return '#FF9800'; // Orange
    if (m.type === 'semantic_pair') return '#E91E63'; // Pink
    if (m.type === 'mushra_group') return '#4CAF50'; // Green
    if (m.type === 'text') return '#9C27B0'; // Purple
    return '#607D8B'; // Default Gray
  };
  const mColor = getMetricColor(draftMetric ?? m);

  return (
    <div 
      draggable={draggableMetricId === m.id}
      onDragStart={() => handleMetricDragStart(index)}
      onDragEnter={() => handleMetricDragEnter(index)}
      onDragEnd={handleMetricDragEnd}
      onDragOver={e => e.preventDefault()}
      onClick={() => setExpandedMetricId(expandedMetricId === m.id ? null : m.id)}
      style={{
        border: `2px solid ${mColor}`,
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: isDragged ? '#f0f0f0' : '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        cursor: expandedMetricId === m.id ? 'default' : 'pointer'
      }}
    >
      <div className="card-header-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: expandedMetricId === m.id ? '15px' : '0' }}>
        <div 
          style={{ cursor: 'grab', fontSize: '20px', paddingRight: '10px', color: '#888' }}
          onMouseEnter={() => setDraggableMetricId(m.id)}
          onMouseLeave={() => setDraggableMetricId(null)}
        >☰</div>
        <span style={{ fontWeight: 'bold', fontSize: '18px' }}>#{filteredIndex + 1}</span>
        <span style={{ 
          backgroundColor: mColor, 
          color: '#fff', 
          padding: '4px 8px', 
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          {m.type === 'basic' && m.points === 5 ? t('Scale5').replace(/^\d+\.\s*/, '') :
           m.type === 'basic' && m.points === 7 ? t('Scale7Uni').replace(/^\d+\.\s*/, '') :
           m.type === 'semantic_diff' ? t('Scale7Bi').replace(/^\d+\.\s*/, '') :
           m.type === 'semantic_pair' ? t('SemanticPairs').replace(/^\d+\.\s*/, '') :
           m.type === 'mushra_group' ? t('MushraSliders').replace(/^\d+\.\s*/, '') :
           m.type === 'text' ? t('TextContent').replace(/^\d+\.\s*/, '') : m.type}
        </span>
        
        {/* Right side buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="pixel-btn secondary small" style={{ padding: '5px 10px', fontSize: '14px' }} onClick={(e) => { e.stopPropagation(); setExpandedMetricId(expandedMetricId === m.id ? null : m.id); }}>
            {expandedMetricId === m.id ? '▲' : '▼'}
          </button>
          <button className="pixel-btn danger small" onClick={(e) => { e.stopPropagation(); handleDeleteMetric(m.id); }}>{t('Delete')}</button>
        </div>
      </div>
      
      {expandedMetricId === m.id && (
        <div style={{ display: 'flex', gap: '30px', paddingLeft: '40px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
        <div style={{ flex: 2 }}>
          {m.type === 'mushra_group' ? (
            <>
              <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>MUSHRA Title</div>
              <input 
                className="pixel-input" 
                value={draftMetric?.title ?? m.title ?? ''} 
                onChange={e => handleMetricChange(m.id, 'title', e.target.value)} 
                placeholder="e.g. MUSHRA Test"
                style={{width: '100%', marginBottom: '15px'}}
              />
              <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Sliders</div>
              {(() => {
                 let sliders = [];
                 let rawStr: any;
                 let fallbackObj: any;
                 try { 
                   rawStr = draftMetric?.leftLabel ?? m.leftLabel;
                   fallbackObj = draftMetric?.payload ?? m.payload;
                   if (rawStr && typeof rawStr === 'string' && rawStr !== '""' && rawStr !== '[]') {
                     sliders = JSON.parse(rawStr);
                   } else if (fallbackObj) {
                     sliders = typeof fallbackObj === 'string' ? JSON.parse(fallbackObj) : fallbackObj;
                   }
                 } catch(e) {}
                 
                 // If still no sliders but we have string data
                 if (!Array.isArray(sliders)) sliders = [];

                 return (
                   <>
                     <div style={{color:'gray', fontSize:'10px', marginBottom:'5px', wordBreak:'break-all'}}>
                       DEBUG rawStr: {String(rawStr)} <br/>
                       DEBUG typeof sliders: {typeof sliders} <br/>
                       DEBUG isArray: {String(Array.isArray(sliders))} <br/>
                       DEBUG sliders length: {sliders.length}
                     </div>
                     {sliders.map((slider: any, idx: number) => (
                       <div key={slider.id} className="card-form-row" style={{display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center'}}>
                         <input className="pixel-input" style={{width: '100px', marginBottom: 0}} value={slider.name} onChange={e => {
                           const newSliders = [...sliders];
                           newSliders[idx].name = e.target.value;
                           handleMetricChange(m.id, 'leftLabel', JSON.stringify(newSliders));
                         }} placeholder="Name" />
                         <input className="pixel-input" style={{flex: 1, marginBottom: 0}} value={slider.left} onChange={e => {
                           const newSliders = [...sliders];
                           newSliders[idx].left = e.target.value;
                           handleMetricChange(m.id, 'leftLabel', JSON.stringify(newSliders));
                         }} placeholder="Left Label" />
                         <span>-</span>
                         <input className="pixel-input" style={{flex: 1, marginBottom: 0}} value={slider.right} onChange={e => {
                           const newSliders = [...sliders];
                           newSliders[idx].right = e.target.value;
                           handleMetricChange(m.id, 'leftLabel', JSON.stringify(newSliders));
                         }} placeholder="Right Label" />
                         <button className="pixel-btn danger small" onClick={() => {
                           const newSliders = sliders.filter((_:any, i:number) => i !== idx);
                           handleMetricChange(m.id, 'leftLabel', JSON.stringify(newSliders));
                         }}>×</button>
                       </div>
                     ))}
                     <button className="pixel-btn secondary small" style={{marginTop: '5px'}} onClick={() => {
                       const newSliders = [...sliders, { id: Date.now().toString(), name: `Option ${sliders.length + 1}`, left: '', right: '' }];
                       handleMetricChange(m.id, 'leftLabel', JSON.stringify(newSliders));
                     }}>+ Add Slider</button>
                   </>
                 );
              })()}
            </>
          ) : m.type === 'semantic_pair' ? (
            <>
              {(() => {
                 const actualTitle = draftMetric?.title ?? m.title ?? '';
                 let rawStr: any;
                 let fallbackObj: any;
                 let pairs = [];
                 try {
                   rawStr = draftMetric?.leftLabel ?? m.leftLabel;
                   fallbackObj = draftMetric?.payload ?? m.payload;
                   if (rawStr && typeof rawStr === 'string' && rawStr !== '""' && rawStr !== '[]') {
                     pairs = JSON.parse(rawStr);
                   } else if (fallbackObj) {
                     pairs = typeof fallbackObj === 'string' ? JSON.parse(fallbackObj) : fallbackObj;
                   }
                 } catch(e) {}
                 if (!Array.isArray(pairs)) pairs = [];

                 return (
                   <>
                     <div style={{color:'gray', fontSize:'10px', marginBottom:'5px', wordBreak:'break-all'}}>
                       DEBUG rawStr: {String(rawStr)} <br/>
                       DEBUG typeof pairs: {typeof pairs} <br/>
                       DEBUG isArray: {String(Array.isArray(pairs))} <br/>
                       DEBUG pairs length: {pairs.length}
                     </div>
                     <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Title (Optional)</div>
                     <input 
                       className="pixel-input" 
                       style={{width: '100%', marginBottom: '15px'}} 
                       value={actualTitle} 
                       onChange={e => handleMetricChange(m.id, 'title', e.target.value)} 
                       placeholder="e.g. Rate these attributes" 
                     />
                     
                     <div className="card-form-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', gap: '10px' }}>
                       <div style={{ fontWeight: 'bold' }}>Semantic Pairs</div>
                       <div>
                          <button className="pixel-btn secondary small" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => document.getElementById(`import-pairs-${m.id}`)?.click()}>Import CSV</button>
                          <input 
                            type="file" 
                            id={`import-pairs-${m.id}`}
                            accept=".csv"
                            style={{ display: 'none' }}
                            onChange={e => {
                               const file = e.target.files?.[0];
                               if (!file) return;
                               const reader = new FileReader();
                               reader.onload = (event) => {
                                 const text = event.target?.result as string;
                                 const lines = text.split('\n').filter(l => l.trim() !== '');
                                 const newPairs: { id: number, left: string, right: string }[] = [];
                                 let idx = 0;
                                 for (const line of lines) {
                                    const parts = parseCSVLine(line);
                                    if (parts.length < 2 && !parts[0]) continue;
                                    newPairs.push({ id: idx++, left: parts[0] || '', right: parts[1] || '' });
                                 }
                                 handleMetricChange(m.id, 'payload', JSON.stringify(newPairs));
                                 if (e.target) (e.target as HTMLInputElement).value = '';
                               };
                               reader.readAsText(file);
                            }}
                          />
                       </div>
                     </div>
                     <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Center Label (Optional)</div>
                     <input 
                       className="pixel-input" 
                       style={{width: '100%', marginBottom: '15px'}} 
                       value={draftMetric?.centerLabel ?? m.centerLabel ?? ''} 
                       onChange={e => handleMetricChange(m.id, 'centerLabel', e.target.value)} 
                       placeholder="Center Label" 
                     />
                     
                     {pairs.map((pair: any, idx: number) => (
                       <div key={pair.id} className="card-form-row" style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                         <div style={{ flex: 1 }}>
                           <input className="pixel-input" style={{width: '100%', marginBottom: 0}} value={pair.left} onChange={e => {
                             const newPairs = [...pairs];
                             newPairs[idx].left = e.target.value;
                             handleMetricChange(m.id, 'payload', JSON.stringify(newPairs));
                           }} placeholder="Left Label" />
                         </div>
                         <span style={{alignSelf: 'center'}}>-</span>
                         <div style={{ flex: 1 }}>
                           <input className="pixel-input" style={{width: '100%', marginBottom: 0}} value={pair.right} onChange={e => {
                             const newPairs = [...pairs];
                             newPairs[idx].right = e.target.value;
                             handleMetricChange(m.id, 'payload', JSON.stringify(newPairs));
                           }} placeholder="Right Label" />
                         </div>
                       </div>
                     ))}
                   </>
                 );
              })()}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{m.type === 'text' ? 'Text Content' : t('MetricTitle')}</div>
              {m.type === 'text' ? (
                <textarea
                  className="pixel-input"
                  style={{ width: '100%', height: '80px', fontFamily: 'monospace', resize: 'vertical' }}
                  value={draftMetric?.title ?? m.title ?? ''}
                  onChange={e => handleMetricChange(m.id, 'title', e.target.value)}
                  placeholder="Enter text here... (Use | for i18n)"
                />
              ) : m.type === 'basic' ? (
                <input 
                  className="pixel-input" 
                  value={draftMetric?.title ?? m.title ?? ''} 
                  onChange={e => handleMetricChange(m.id, 'title', e.target.value)} 
                  placeholder={t('MetricTitle')}
                  style={{width: '100%'}}
                />
              ) : (
                <div className="card-form-row" style={{display: 'flex', gap: '10px'}}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>{t('LeftLabel')}</div>
                    <input className="pixel-input" style={{width: '100%'}} value={draftMetric?.leftLabel ?? m.leftLabel ?? ''} onChange={e => handleMetricChange(m.id, 'leftLabel', e.target.value)} placeholder={t('LeftLabel')} />
                  </div>
                  {m.type === 'semantic_diff' && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>Center Label</div>
                      <input className="pixel-input" style={{width: '100%'}} value={draftMetric?.centerLabel ?? m.centerLabel ?? ''} onChange={e => handleMetricChange(m.id, 'centerLabel', e.target.value)} placeholder="Center Label" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>{t('RightLabel')}</div>
                    <input className="pixel-input" style={{width: '100%'}} value={draftMetric?.rightLabel ?? m.rightLabel ?? ''} onChange={e => handleMetricChange(m.id, 'rightLabel', e.target.value)} placeholder={t('RightLabel')} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export const MetricCard = MetricCardInner;
