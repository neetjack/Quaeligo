/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import type { IQuestion } from '../types';

interface QuestionCardProps {
  q: IQuestion;
  index: number;
  draftQuestion: Partial<IQuestion> | undefined;
  draftUploads: Record<string, File>;
  expandedQuestionId: number | null;
  setExpandedQuestionId: (id: number | null) => void;
  draggableQuestionId: number | null;
  setDraggableQuestionId: (id: number | null) => void;
  draggedItemIndex: number | null;
  handleDragStart: (index: number) => void;
  handleDragEnter: (index: number) => void;
  handleDragEnd: () => void;
  openGroupDropdownId: number | null;
  setOpenGroupDropdownId: (id: number | null) => void;
  openTypeDropdownId: number | null;
  setOpenTypeDropdownId: (id: number | null) => void;
  handleQuestionChange: (id: number, field: keyof IQuestion | string, value: any) => void;
  handleDeleteQuestion: (id: number) => void;
  handleUpdateAudio: (id: number, type: 'A'|'B'|'C'|'D'|'E', e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadFile: (filename: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  q,
  index,
  draftQuestion,
  draftUploads,
  expandedQuestionId,
  setExpandedQuestionId,
  draggableQuestionId,
  setDraggableQuestionId,
  draggedItemIndex,
  handleDragStart,
  handleDragEnter,
  handleDragEnd,
  openGroupDropdownId,
  setOpenGroupDropdownId,
  openTypeDropdownId,
  setOpenTypeDropdownId,
  handleQuestionChange,
  handleDeleteQuestion,
  handleUpdateAudio,
  handleUploadFile,
  t
}) => {
  const currentType = draftQuestion?.type ?? q.type;

  return (
    <div 
      draggable={draggableQuestionId === q.id}
      onDragStart={() => handleDragStart(index)}
      onDragEnter={() => handleDragEnter(index)}
      onDragEnd={handleDragEnd}
      onDragOver={e => e.preventDefault()}
      onClick={() => setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id)}
      style={{
        border: `2px solid ${currentType === 'AUDIO' ? '#2196F3' : currentType === 'FORM' ? '#4CAF50' : '#9C27B0'}`,
        borderRadius: '8px',
        padding: '15px',
        backgroundColor: draggedItemIndex === index ? '#f0f0f0' : '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        position: 'relative',
        cursor: expandedQuestionId === q.id ? 'default' : 'pointer'
      }}
    >
      {/* Header Row */}
      <div className="card-header-row" style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: expandedQuestionId === q.id ? '15px' : '0' }} onClick={() => {
        if (openGroupDropdownId === q.id) setOpenGroupDropdownId(null);
        if (openTypeDropdownId === q.id) setOpenTypeDropdownId(null);
      }}>
        <div 
          style={{ cursor: 'grab', fontSize: '20px', paddingRight: '10px', color: '#888' }}
          onMouseEnter={() => setDraggableQuestionId(q.id)}
          onMouseLeave={() => setDraggableQuestionId(null)}
        >☰</div>
        <span style={{ fontWeight: 'bold', fontSize: '18px', width: '45px', display: 'inline-block' }}>#{index + 1}</span>
        
        <div style={{ position: 'relative' }}>
          <button 
            className="pixel-btn small" 
            style={{ padding: '5px 10px', fontSize: '14px', marginBottom: 0, width: '150px', textAlign: 'left', backgroundColor: 'white', color: 'black' }}
            onClick={(e) => {
              e.stopPropagation();
              setOpenTypeDropdownId(openTypeDropdownId === q.id ? null : q.id);
            }}
          >
            {currentType} ▾
          </button>
          {openTypeDropdownId === q.id && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', background: 'white', border: '2px solid #000', borderRadius: '5px', zIndex: 100, display: 'flex', flexDirection: 'column', minWidth: '150px', boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}>
              {['AUDIO_AB', 'AUDIO_AB(Fixed)', 'AUDIO_SD', 'AUDIO_MUSHRA', 'AGREEMENT', 'FORM', 'TEXT', 'COMMENT'].map(type => (
                <button
                  key={type}
                  className="pixel-btn dropdown-item"
                  style={{ border: 'none', background: 'none', textAlign: 'left', padding: '5px 10px', width: '100%', color: 'black' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuestionChange(q.id, 'type', type);
                    setOpenTypeDropdownId(null);
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
        <input 
          className="pixel-input"
          style={{ flex: 1, maxWidth: '400px', marginBottom: 0, padding: '5px 10px', height: '38px' }}
          placeholder={t('Title')}
          value={draftQuestion?.title ?? q.title} 
          onChange={e => handleQuestionChange(q.id, 'title', e.target.value)} 
          onClick={e => e.stopPropagation()}
        />

        {['AUDIO_AB', 'AUDIO_AB(Fixed)', 'AUDIO_SD', 'AUDIO_MUSHRA'].includes(currentType) && (
          <div style={{ position: 'relative' }}>
            <button 
              className="pixel-btn secondary small" 
              style={{ padding: '5px 10px', fontSize: '14px', marginBottom: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenGroupDropdownId(openGroupDropdownId === q.id ? null : q.id);
              }}
            >
              {t(`MetricGroup${draftQuestion?.metricGroup ?? q.metricGroup ?? 'A'}`) || `Group ${draftQuestion?.metricGroup ?? q.metricGroup ?? 'A'}`} ▾
            </button>
            {openGroupDropdownId === q.id && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '5px', background: 'white', border: '2px solid #000', borderRadius: '5px', zIndex: 100, display: 'flex', flexDirection: 'column', minWidth: '120px', boxShadow: '4px 4px 0px rgba(0,0,0,1)' }}>
                {(['A', 'B', 'C', 'D'] as const).map(g => (
                  <button
                    key={g}
                    className="pixel-btn dropdown-item"
                    style={{ border: 'none', background: 'none', textAlign: 'left', padding: '5px 10px', width: '100%' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuestionChange(q.id, 'metricGroup', g);
                      setOpenGroupDropdownId(null);
                    }}
                  >
                    {t(`MetricGroup${g}`) || `Group ${g}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Right side buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="pixel-btn secondary small" style={{ padding: '5px 10px', fontSize: '14px' }} onClick={(e) => { e.stopPropagation(); setExpandedQuestionId(expandedQuestionId === q.id ? null : q.id); }}>
            {expandedQuestionId === q.id ? '▲' : '▼'}
          </button>
          <button className="pixel-btn danger small" onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q.id); }}>{t('Delete')}</button>
        </div>
      </div>

      {/* Content Row based on Type */}
      {expandedQuestionId === q.id && (() => {
        const fnA = draftUploads[`${q.id}_A`]?.name || (draftQuestion?.audioUrlA ?? q.audioUrlA)?.split('/').pop() || '';
        const fnB = draftUploads[`${q.id}_B`]?.name || (draftQuestion?.audioUrlB ?? q.audioUrlB)?.split('/').pop() || '';
        const fnC = draftUploads[`${q.id}_C`]?.name || (draftQuestion?.audioUrlC ?? q.audioUrlC)?.split('/').pop() || '';
        const fnD = draftUploads[`${q.id}_D`]?.name || (draftQuestion?.audioUrlD ?? q.audioUrlD)?.split('/').pop() || '';
        const fnE = draftUploads[`${q.id}_E`]?.name || (draftQuestion?.audioUrlE ?? q.audioUrlE)?.split('/').pop() || '';

        return (
        <div style={{ paddingLeft: '40px' }} onClick={e => e.stopPropagation()}>
        

        {['AUDIO_AB', 'AUDIO_AB(Fixed)', 'AUDIO_SD', 'AUDIO_MUSHRA'].includes(currentType) && (
          <div style={{ display: 'flex', flexDirection: currentType === 'AUDIO_MUSHRA' ? 'column' : 'row', gap: currentType === 'AUDIO_MUSHRA' ? '15px' : '30px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px', border: '1px dashed #ccc', padding: '10px', borderRadius: '5px' }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                {currentType === 'AUDIO_SD' || currentType === 'AUDIO_MUSHRA' ? t('Reference') : t('Audio A')}
              </div>
              <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                {draftUploads[`${q.id}_A`] ? <span style={{color: '#d48806'}}>⏳ {t('ReadyToSave')} ({fnA})</span> : 
                 (draftQuestion?.uploadedFiles ?? q.uploadedFiles)?.find((f:string) => f.startsWith('Audio A')) ? <span style={{color: 'green'}}>✅ {t('Uploaded')} ({fnA})</span> : <span style={{color: 'red'}}>❌ {t('Missing')}</span>}
              </div>
              <input type="file" accept="audio/wav" onChange={e => handleUpdateAudio(q.id, 'A', e)} />
            </div>
            
            <div style={{ flex: 1, minWidth: '200px', border: '1px dashed #ccc', padding: '10px', borderRadius: '5px' }}>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                {currentType === 'AUDIO_SD' ? t('TestAudio') : currentType === 'AUDIO_MUSHRA' ? t('VariantA') : t('Audio B')}
              </div>
              <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                {draftUploads[`${q.id}_B`] ? <span style={{color: '#d48806'}}>⏳ {t('ReadyToSave')} ({fnB})</span> : 
                 (draftQuestion?.uploadedFiles ?? q.uploadedFiles)?.find((f:string) => f.startsWith('Audio B')) ? <span style={{color: 'green'}}>✅ {t('Uploaded')} ({fnB})</span> : <span style={{color: 'red'}}>❌ {t('Missing')}</span>}
              </div>
              <input type="file" accept="audio/wav" onChange={e => handleUpdateAudio(q.id, 'B', e)} />
            </div>

            {currentType === 'AUDIO_MUSHRA' && (
              <>
              <div style={{ flex: 1, minWidth: '200px', border: '1px dashed #ccc', padding: '10px', borderRadius: '5px' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{t('VariantB')}</div>
                <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                  {draftUploads[`${q.id}_C`] ? <span style={{color: '#d48806'}}>⏳ {t('ReadyToSave')} ({fnC})</span> : 
                   (draftQuestion?.uploadedFiles ?? q.uploadedFiles)?.find((f:string) => f.startsWith('Audio C')) ? <span style={{color: 'green'}}>✅ {t('Uploaded')} ({fnC})</span> : <span style={{color: 'red'}}>❌ {t('Missing')}</span>}
                </div>
                <input type="file" accept="audio/wav" onChange={e => handleUpdateAudio(q.id, 'C', e)} />
              </div>

              <div style={{ flex: 1, minWidth: '200px', border: '1px dashed #ccc', padding: '10px', borderRadius: '5px' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Audio D (Optional)</div>
                <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                  {draftUploads[`${q.id}_D`] ? <span style={{color: '#d48806'}}>⏳ {t('ReadyToSave')} ({fnD})</span> : 
                   (draftQuestion?.uploadedFiles ?? q.uploadedFiles)?.find((f:string) => f.startsWith('Audio D')) ? <span style={{color: 'green'}}>✅ {t('Uploaded')} ({fnD})</span> : <span style={{color: '#aaa', fontSize: '12px'}}>{t('Missing') || 'Not Selected'}</span>}
                </div>
                <input type="file" accept="audio/wav" onChange={e => handleUpdateAudio(q.id, 'D', e)} />
              </div>

              <div style={{ flex: 1, minWidth: '200px', border: '1px dashed #ccc', padding: '10px', borderRadius: '5px' }}>
                <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Audio E (Optional)</div>
                <div style={{ marginBottom: '10px', wordBreak: 'break-all' }}>
                  {draftUploads[`${q.id}_E`] ? <span style={{color: '#d48806'}}>⏳ {t('ReadyToSave')} ({fnE})</span> : 
                   (draftQuestion?.uploadedFiles ?? q.uploadedFiles)?.find((f:string) => f.startsWith('Audio E')) ? <span style={{color: 'green'}}>✅ {t('Uploaded')} ({fnE})</span> : <span style={{color: '#aaa', fontSize: '12px'}}>{t('Missing') || 'Not Selected'}</span>}
                </div>
                <input type="file" accept="audio/wav" onChange={e => handleUpdateAudio(q.id, 'E', e)} />
              </div>
              </>
            )}
          </div>
        )}

        {currentType === 'FORM' && (
          <div>
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{t('FormContentPrompt')}</div>
            <textarea
              className="pixel-input"
              style={{ width: '100%', height: '100px', fontFamily: 'monospace', resize: 'vertical' }}
              value={draftQuestion?.content ?? q.content}
              onChange={e => handleQuestionChange(q.id, 'content', e.target.value)}
            />
          </div>
        )}

        {['TEXT', 'COMMENT'].includes(currentType) && (
          <div>
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{t('TextContentPrompt') || 'Text Content (Use | to separate languages e.g. 中文|English|日本語)'}</div>
            <textarea
              className="pixel-input"
              style={{ width: '100%', height: '100px', fontFamily: 'monospace', resize: 'vertical' }}
              value={draftQuestion?.content ?? q.content ?? ''}
              onChange={e => handleQuestionChange(q.id, 'content', e.target.value)}
              placeholder={t('TextContentPlaceholder') || "e.g. 欢迎|Welcome|ようこそ"}
            />
            <div style={{ marginTop: '15px', marginBottom: '5px', fontWeight: 'bold' }}>{t('TimerSeconds') || 'Next Button Delay (Seconds)'}</div>
            <input
              type="number"
              min="0"
              className="pixel-input"
              style={{ width: '150px' }}
              value={draftQuestion?.options ?? q.options ?? '1'}
              onChange={e => handleQuestionChange(q.id, 'options', e.target.value)}
            />
          </div>
        )}

        {currentType === 'AGREEMENT' && (
          <div>
            <div className="card-form-row" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>{t('CheckboxOptionPrompt')}</div>
                <textarea 
                  className="pixel-input"
                  style={{ width: '100%', height: '80px', fontFamily: 'monospace', resize: 'vertical' }}
                  value={draftQuestion?.options ?? q.options}
                  onChange={e => handleQuestionChange(q.id, 'options', e.target.value)}
                />
              </div>
            </div>
            
            <div className="card-form-row" style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}>
              {['ZH', 'EN', 'JA'].map((lang, idx) => {
                const currentFiles = (draftQuestion?.content ?? q.content ?? '').split('|');
                const md = currentFiles[idx] || '';
                const isAbsolute = md.startsWith('/');
                const isUploaded = md && (isAbsolute || (draftQuestion?.uploadedFiles ?? q.uploadedFiles)?.includes(md));
                
                return (
                  <div key={lang} style={{ flex: 1, minWidth: '200px', border: '1px dashed #ccc', padding: '10px', borderRadius: '5px' }}>
                    <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{lang} Markdown</div>
                    <div style={{ marginBottom: '10px' }}>
                      {md ? (
                        draftUploads[`GLOBAL_${md}`] ? <span style={{color: '#d48806'}}>⏳ {t('ReadyToSave')}</span> : isUploaded ? <span style={{color: 'green'}}>✅ {isAbsolute ? t('StaticAsset') : t('Uploaded')}</span> : <span style={{color: 'red'}}>❌ {t('Missing')}</span>
                      ) : (
                        <span style={{color: '#aaa', fontSize: '12px'}}>{t('Missing') || 'Not Selected'}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px', wordBreak: 'break-all' }}>{md || ''}</div>
                    <input 
                      type="file" 
                      accept=".md" 
                      onChange={e => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const file = files[0];
                          const newFiles = [...currentFiles];
                          while(newFiles.length < 3) newFiles.push('');
                          newFiles[idx] = file.name;
                          handleQuestionChange(q.id, 'content', newFiles.join('|'));
                          handleUploadFile(file.name, e);
                        }
                      }} 
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}
        </div>
        );
      })()}
    </div>
  );
};
