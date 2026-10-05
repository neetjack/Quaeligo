/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { parseI18nText } from '../../utils/i18nUtils';
import type { IQuestion, IMetric, IResponse } from '../../types';

interface Props {
  surveyId: number;
}

export default function AdminResponsesTab({ surveyId }: Props) {
  const { t, i18n } = useTranslation();
  const token = localStorage.getItem('adminToken');
  
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [responses, setResponses] = useState<IResponse[]>([]);
  const [metrics, setMetrics] = useState<IMetric[]>([]);
  const [sortDesc, setSortDesc] = useState(true);

  const fetchMetrics = async () => {
    const res = await fetch(`/api/surveys/${surveyId}`);
    if (res.ok) {
      const data = await res.json();
      setMetrics(data.metrics || []);
    }
  };

  const fetchQuestions = async () => {
    const res = await fetch(`/api/admin/surveys/${surveyId}/questions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setQuestions(await res.json());
  };

  const fetchResponses = async () => {
    const res = await fetch(`/api/admin/surveys/${surveyId}/responses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setResponses(await res.json());
  };

  useEffect(() => {
    if (token) {
      fetchQuestions();
      fetchResponses();
      fetchMetrics();
    }
  }, [token, surveyId]);

  const handleDeleteAllResponses = async () => {
    if (!window.confirm(t('DeleteAllResponsesConfirm') || 'Are you sure you want to delete ALL responses? This cannot be undone!')) return;
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}/responses`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setResponses([]);
        alert('All responses deleted successfully.');
      } else {
        alert('Failed to delete responses.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const getMetricsForGroup = (group: string) => {
    const gMetrics: { id: string, label: string }[] = [];
    metrics.filter(m => (m.group || 'A') === group && m.type !== 'text').forEach(m => {
      if (m.type === 'semantic_pair') {
         try {
           let jsonStr = m.leftLabel;
           if (!jsonStr || !jsonStr.trim().startsWith('[')) jsonStr = m.title;
           const pairs = JSON.parse(jsonStr || '[]');
           pairs.forEach((p:any) => {
             gMetrics.push({ id: `${m.id}_${p.id}`, label: `${p.left} - ${p.right}` });
           });
         } catch(e){}
      } else if (m.type === 'mushra_group') {
         try {
           const sliders = JSON.parse(m.leftLabel || '[]');
           sliders.forEach((s:any) => {
             gMetrics.push({ id: `${m.id}_${s.id}`, label: s.name });
           });
         } catch(e){}
      } else {
         let label = '';
         if (m.type === 'basic' || m.type === 'mushra_slider') label = m.title || m.leftLabel || 'Score';
         else if (m.type === 'semantic_diff') label = `${m.leftLabel} - ${m.rightLabel}`;
         gMetrics.push({ id: m.id.toString(), label });
      }
    });
    return gMetrics;
  };

  const formatResponseChoice = (choiceStr: string, q: IQuestion) => {
    if (!choiceStr) return { short: '-', full: '-' };

    if (q.type === 'COMMENT') {
      const short = choiceStr.length > 20 ? choiceStr.substring(0, 20) + '...' : choiceStr;
      return { short, full: choiceStr };
    }

    if (q.type === 'AGREEMENT') return { short: choiceStr, full: choiceStr };
    
    let parsed: any;
    try {
      parsed = JSON.parse(choiceStr);
    } catch (e) {
      return { short: choiceStr, full: choiceStr };
    }

    const lines: string[] = [];
    if (q.type === 'FORM') {
      const fields = (q.content || '').split(';;').filter((s:string) => s.trim());
      fields.forEach((f: string) => {
        const parts = f.split(':');
        const fieldId = parts[1];
        if (parsed[fieldId] !== undefined && parsed[fieldId] !== '') {
          lines.push(`${parts[2] || fieldId}: ${parsed[fieldId]}`);
        }
      });
    } else if (['AUDIO', 'AUDIO_AB', 'AUDIO_AB(Fixed)', 'AUDIO_SD', 'AUDIO_MUSHRA'].includes(q.type)) {
      const groupMetrics = getMetricsForGroup(q.metricGroup || 'A');
      let mappingFiles: string[] = [];
      if (q.type === 'AUDIO_MUSHRA' && parsed['_mushraMapping']) {
        mappingFiles = parsed['_mushraMapping'].split(',').map((s:string) => s.trim());
      }
      groupMetrics.forEach(fm => {
        if (parsed[fm.id] !== undefined && parsed[fm.id] !== '') {
          let label = fm.label;
          if (q.type === 'AUDIO_MUSHRA' && mappingFiles.length > 0) {
            if (label.endsWith(' A') && mappingFiles[0]) label = label.replace(/ A$/, ` ${mappingFiles[0]}`);
            else if (label.endsWith(' B') && mappingFiles[1]) label = label.replace(/ B$/, ` ${mappingFiles[1]}`);
            else if (label.endsWith(' C') && mappingFiles[2]) label = label.replace(/ C$/, ` ${mappingFiles[2]}`);
          }
          lines.push(`${label}: ${parsed[fm.id]}`);
        }
      });
      if (q.type === 'AUDIO_SD') {
        const fnA = q.audioUrlA ? q.audioUrlA.split('/').pop() : 'Unknown';
        const fnB = q.audioUrlB ? q.audioUrlB.split('/').pop() : 'Unknown';
        lines.push(`(Ref: ${fnA}, Test: ${fnB})`);
      }
      if (q.type === 'AUDIO_MUSHRA') {
        const refName = q.audioUrlA ? q.audioUrlA.split('/').pop() : 'Unknown';
        lines.push(`(Ref: ${refName})`);
        if (parsed['_mushraMapping']) {
          lines.push(`(Order: ${parsed['_mushraMapping']})`);
        }
      }
    } else {
      return { short: choiceStr, full: choiceStr };
    }

    if (lines.length === 0) return { short: '-', full: '-' };
    const full = lines.join('\n');
    const short = lines[0] + (lines.length > 1 ? ' ...' : '');
    return { short, full };
  };

  const exportWideCSV = () => {
    const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
    
    const qCols: Record<number, string[]> = {};
    let aCount = 1, fCount = 1, qCount = 1, cCount = 1;
    sortedQuestions.forEach((q) => {
      if (q.type === 'TEXT') return;

      let qNum = '';
      if (q.type === 'AGREEMENT') {
        qNum = `A${aCount++}`;
      } else if (q.type === 'FORM') {
        qNum = `F${fCount++}`;
      } else if (q.type === 'COMMENT') {
        qNum = `C${cCount++}`;
      } else {
        qNum = `Q${qCount++}`;
      }
      
      const headerPrefix = qNum;

      if (['AUDIO', 'AUDIO_AB', 'AUDIO_AB(Fixed)', 'AUDIO_SD', 'AUDIO_MUSHRA'].includes(q.type)) {
        const groupMetrics = getMetricsForGroup(q.metricGroup || 'A');
        if (q.type === 'AUDIO_MUSHRA') {
          const fnA = q.audioUrlA ? q.audioUrlA.split('/').pop() : 'A';
          const fnB = q.audioUrlB ? q.audioUrlB.split('/').pop() : 'B';
          const fnC = q.audioUrlC ? q.audioUrlC.split('/').pop() : 'C';
          qCols[q.id] = [];
          groupMetrics.forEach(fm => {
            const label = fm.label;
            if (label.endsWith(' A')) qCols[q.id].push(`${headerPrefix}-${label.replace(/ A$/, ` ${fnA}`)}`);
            else if (label.endsWith(' B')) qCols[q.id].push(`${headerPrefix}-${label.replace(/ B$/, ` ${fnB}`)}`);
            else if (label.endsWith(' C')) qCols[q.id].push(`${headerPrefix}-${label.replace(/ C$/, ` ${fnC}`)}`);
            else qCols[q.id].push(`${headerPrefix}-${label}`);
          });
          qCols[q.id].push(`${headerPrefix}-Mapping(Opt A,B,C)`);
        } else {
          qCols[q.id] = groupMetrics.map((fm) => `${headerPrefix}-${fm.label}`);
        }
      } else if (q.type === 'FORM') {
        const fields = (q.content || '').split(';;').filter((s:string) => s.trim());
        qCols[q.id] = fields.map((f: string) => {
          const parts = f.split(':');
          return `${headerPrefix}-${parts[1] || 'Unknown'}`;
        });
      } else if (q.type === 'AGREEMENT') {
        qCols[q.id] = [`${qNum}-Agreed`];
      } else if (q.type === 'COMMENT') {
        qCols[q.id] = [`${qNum}-Comment`];
      }
    });

    const headers = ['#', 'Session ID', 'Date'];
    sortedQuestions.forEach(q => {
      if (qCols[q.id]) {
        headers.push(...qCols[q.id].map(h => `"${h}"`));
      }
    });

    const csvRows = [headers.join(',')];

    const groupedResponses: Record<string, { date: string, answers: Record<number, any> }> = {};
    responses.forEach(r => {
      if (!groupedResponses[r.sessionId]) {
        groupedResponses[r.sessionId] = { date: r.createdAt, answers: {} };
      }
      try {
        groupedResponses[r.sessionId].answers[r.questionId] = JSON.parse(r.choice || '{}');
      } catch(e) {
        groupedResponses[r.sessionId].answers[r.questionId] = r.choice;
      }
    });

    let userIndex = 1;
    const sortedGroupedResponses = Object.entries(groupedResponses)
      .map(([sid, data]) => ({ sid, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const {sid, date, answers} of sortedGroupedResponses) {
      const row = [userIndex++, sid, new Date(date).toISOString()];
      sortedQuestions.forEach(q => {
        const ans = answers[q.id] || {};
        if (['AUDIO', 'AUDIO_AB', 'AUDIO_AB(Fixed)', 'AUDIO_SD', 'AUDIO_MUSHRA'].includes(q.type)) {
          const groupMetrics = getMetricsForGroup(q.metricGroup || 'A');
          if (q.type === 'AUDIO_MUSHRA') {
            const fnA = q.audioUrlA ? q.audioUrlA.split('/').pop() : 'A';
            const fnB = q.audioUrlB ? q.audioUrlB.split('/').pop() : 'B';
            const fnC = q.audioUrlC ? q.audioUrlC.split('/').pop() : 'C';
            let mappingFiles = ['A', 'B', 'C'];
            if (ans['_mushraMapping']) {
              mappingFiles = ans['_mushraMapping'].split(',').map((s:string) => s.trim());
            }
            const optKeys = ['A', 'B', 'C'];
            const fileToOpt: Record<string, string> = {};
            mappingFiles.forEach((file, idx) => {
              if (file) fileToOpt[file] = optKeys[idx];
            });

            groupMetrics.forEach((fm, _, array) => {
              let baseLabel = fm.label;
              let targetFile = '';
              if (fm.label.endsWith(' A')) { baseLabel = fm.label.slice(0, -2); targetFile = fnA as string; }
              else if (fm.label.endsWith(' B')) { baseLabel = fm.label.slice(0, -2); targetFile = fnB as string; }
              else if (fm.label.endsWith(' C')) { baseLabel = fm.label.slice(0, -2); targetFile = fnC as string; }
              else {
                row.push(`"${ans[fm.id] !== undefined ? ans[fm.id] : ''}"`);
                return;
              }

              const playedByOpt = fileToOpt[targetFile];
              const actualFm = array.find(m => m.label === `${baseLabel} ${playedByOpt}` && m.id.split('_')[0] === fm.id.split('_')[0]);
              
              if (actualFm && ans[actualFm.id] !== undefined) {
                row.push(`"${ans[actualFm.id]}"`);
              } else {
                row.push(`""`);
              }
            });
            row.push(`"${ans['_mushraMapping'] || ''}"`);
          } else {
            groupMetrics.forEach(fm => {
              row.push(`"${ans[fm.id] !== undefined ? ans[fm.id] : ''}"`);
            });
          }
        } else if (q.type === 'FORM') {
          const fields = (q.content || '').split(';;').filter((s:string) => s.trim());
          fields.forEach((f: string) => {
            const parts = f.split(':');
            const fieldId = parts[1];
            row.push(`"${ans[fieldId] !== undefined ? ans[fieldId] : ''}"`);
          });
        } else if (q.type === 'AGREEMENT') {
          row.push(`"${ans['Agreed'] !== undefined ? ans['Agreed'] : ''}"`);
        } else if (q.type === 'COMMENT') {
          const commentStr = typeof answers[q.id] === 'string' ? answers[q.id] : '';
          row.push(`"${commentStr.replace(/"/g, '""')}"`);
        }
      });
      csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvString], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    a.setAttribute('download', `responses_wide_${timestamp}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div>
      <div className="admin-header" style={{ marginBottom: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="pixel-btn" onClick={fetchResponses}>{t('Refresh')}</button>
        <button className="pixel-btn" onClick={exportWideCSV}>{t('ExportCSV')}</button>
        <button className="pixel-btn danger" style={{ marginLeft: 'auto' }} onClick={handleDeleteAllResponses}>{t('DeleteAllResponses') || '删除所有记录'}</button>
      </div>
      <div className="pixel-table-container">
        <table className="pixel-table">
        <thead>
          <tr>
            <th style={{cursor: 'pointer', userSelect: 'none'}} onClick={() => setSortDesc(!sortDesc)}>
              # {sortDesc ? '▼' : '▲'}
            </th>
            <th>{t('Date')}</th>
            {(() => {
              let aCount = 1, fCount = 1, qCount = 1, cCount = 1;
              return [...questions].sort((a,b) => a.order - b.order).flatMap(q => {
                if (q.type === 'TEXT') return [];
                let qNum = '';
                if (q.type === 'AGREEMENT') qNum = `A${aCount++}`;
                else if (q.type === 'FORM') qNum = `F${fCount++}`;
                else if (q.type === 'COMMENT') qNum = `C${cCount++}`;
                else qNum = `Q${qCount++}`;
                
                if (q.type === 'FORM') {
                  const fields = (q.content || '').split(';;').filter((s:string) => s.trim());
                  return fields.map((f: string, idx: number) => {
                    const parts = f.split(':');
                    const label = parseI18nText(parts[2] || parts[1] || `Field${idx+1}`, i18n.language).replace(/^(您的|你的|Your |あなたの)/i, '');
                    return <th key={`${q.id}-${idx}`}>{qNum}-{label}</th>;
                  });
                }
                return <th key={q.id}>{qNum}</th>;
              });
            })()}
          </tr>
        </thead>
        <tbody>
          {Object.entries(
            responses.reduce((acc, r) => {
              if (!acc[r.sessionId]) acc[r.sessionId] = { date: r.createdAt, answers: {} };
              acc[r.sessionId].answers[r.questionId] = r.choice;
              return acc;
            }, {} as Record<string, { date: string, answers: Record<number, string> }>)
          )
          .map(([sessionId, data]: [string, any]) => ({ sessionId, ...data }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map((data, index) => ({ ...data, originalIndex: index + 1 }))
          .sort((a, b) => sortDesc ? b.originalIndex - a.originalIndex : a.originalIndex - b.originalIndex)
          .map((data) => (
            <tr key={data.sessionId}>
              <td>{data.originalIndex}</td>
              <td>{new Date(data.date).toLocaleString()}</td>
              {[...questions].sort((a,b) => a.order - b.order).flatMap(q => {
                if (q.type === 'TEXT') return [];
                const choiceStr = data.answers[q.id];
                if (q.type === 'AGREEMENT') {
                  let isAgreed = false;
                  try { isAgreed = JSON.parse(choiceStr).Agreed; } catch(e){}
                  return (
                    <td key={q.id} style={{ textAlign: 'center' }}>
                      {isAgreed ? <span style={{color: 'green', fontSize: '1.2em'}}>✔</span> : <span style={{color: 'red', fontSize: '1.2em'}}>❌</span>}
                    </td>
                  );
                } else if (q.type === 'FORM') {
                  let parsed: any = {};
                  try { parsed = JSON.parse(choiceStr || '{}'); } catch(e){}
                  const fields = (q.content || '').split(';;').filter((s:string) => s.trim());
                  return fields.map((f: string, idx: number) => {
                    const parts = f.split(':');
                    const fieldId = parts[1];
                    const val = parsed[fieldId] ?? '-';
                    return (
                      <td key={`${q.id}-${idx}`}>
                        <pre style={{margin: 0, fontSize: '0.8em', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer'}} title={val}>
                          {val}
                        </pre>
                      </td>
                    );
                  });
                } else {
                  const parsed = formatResponseChoice(choiceStr, q);
                  return (
                    <td key={q.id}>
                      <pre 
                        title={parsed.full}
                        style={{margin: 0, fontSize: '0.8em', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer'}}
                      >
                        {parsed.short}
                      </pre>
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
