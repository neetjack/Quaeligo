import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSurveyAudio } from '../hooks/useSurveyAudio';
import type { IQuestion, IMetric } from '../types';
import { parseI18nText } from '../utils/i18nUtils';

import { AudioQuestion } from '../components/survey/AudioQuestion';
import PixelToast from '../components/PixelToast';

function shuffle(array: any[]) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

interface SubjectProps {
  globalVolume?: number;
}

export default function Subject({ globalVolume = 1 }: SubjectProps) {
  const isMobile = useIsMobile();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { slug } = useParams();

  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyWelcomeText, setSurveyWelcomeText] = useState('');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [metrics, setMetrics] = useState<IMetric[]>([]);
  const [currentChoices, setCurrentChoices] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (slug) {
      const saved = sessionStorage.getItem(`quaeligo_${slug}_currentIndex`);
      if (saved) return parseInt(saved, 10);
    }
    return 0;
  });
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [sessionId] = useState(() => {
    if (slug) {
      const saved = sessionStorage.getItem(`quaeligo_${slug}_sessionId`);
      if (saved) return saved;
    }
    const newId = 'sess_' + Math.random().toString(36).substr(2, 9);
    if (slug) sessionStorage.setItem(`quaeligo_${slug}_sessionId`, newId);
    return newId;
  });
  
  const [sessionResponses, setSessionResponses] = useState<any[]>(() => {
    if (slug) {
      const saved = sessionStorage.getItem(`quaeligo_${slug}_responses`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    if (slug && started) {
      sessionStorage.setItem(`quaeligo_${slug}_currentIndex`, currentIndex.toString());
      sessionStorage.setItem(`quaeligo_${slug}_responses`, JSON.stringify(sessionResponses));
    }
  }, [slug, currentIndex, sessionResponses, started]);

  // States for specific question types
  const [agreed, setAgreed] = useState(false);
  const [mdContent, setMdContent] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [commentText, setCommentText] = useState('');
  const [textCountdown, setTextCountdown] = useState(0);
  const [textReady, setTextReady] = useState(false);
  const [mushraMapping, setMushraMapping] = useState<string[]>(['A', 'B', 'C']);

  const audio = useSurveyAudio(globalVolume);

  // Initial fetch
  useEffect(() => {
    if (!slug) return;
    
    fetch(`/api/surveys/${slug}?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setToastMessage(t('SurveyNotFound') || 'Survey not found or not available.');
          setTimeout(() => navigate('/'), 1500);
          // delayed navigation handled by timeout
          return;
        }
        
        setSurveyTitle(data.title || '');
          setSurveyWelcomeText(data.welcomeText || '');
        const qData = data.questions || [];
        const mData = data.metrics || [];

        const sortedQData = qData.sort((a: any, b: any) => a.order - b.order);
        const isAudio = (type: string) => !type || type.startsWith('AUDIO');

        const allAudios = sortedQData.filter((q: any) => isAudio(q.type));
        const audios: IQuestion[] = [];
        
        ['A', 'B', 'C', 'D'].forEach(g => {
          const groupQuestions = allAudios.filter((q: any) => (q.metricGroup || 'A') === g);
          const fixed = groupQuestions.filter((q: any) => !q.isRandomized || q.type === 'AUDIO_AB(Fixed)');
          const randomized = groupQuestions.filter((q: any) => q.isRandomized && q.type !== 'AUDIO_AB(Fixed)');
          audios.push(...fixed, ...shuffle(randomized));
        });
        
        const otherAudios = allAudios.filter((q: any) => !['A', 'B', 'C', 'D'].includes(q.metricGroup || 'A'));
        if (otherAudios.length > 0) {
          audios.push(...shuffle(otherAudios));
        }
        
        let audioIdx = 0;
        const finalQuestions = sortedQData.map((q: any) => {
          if (isAudio(q.type)) {
            return audios[audioIdx++];
          }
          return q;
        });

        setQuestions(finalQuestions);
        setMetrics(mData);
        setLoading(false);
      })
      .catch(() => {
        setToastMessage(t('FailedToLoadSurvey') || 'Failed to load survey.');
        setTimeout(() => navigate('/'), 1500);
        // delayed navigation handled by timeout
      });
  }, [slug, navigate]);

  // Set up question state whenever currentIndex changes
  useEffect(() => {
    if (currentIndex >= questions.length) return;
    const q = questions[currentIndex];
    
    if (q?.type === 'AGREEMENT') {
      const targetMd = parseI18nText(q.content, i18n.language).trim();
      const url = targetMd.startsWith('/') ? targetMd : ('/uploads/' + targetMd);
      fetch(url)
        .then(r => r.text())
        .then(txt => setMdContent(txt))
        .catch(() => setMdContent(t('FailedToLoadAgreement')));
      setAgreed(false);
    } else if (q?.type === 'FORM') {
      setFormData({});
    } else if (q?.type === 'TEXT' || q?.type === 'COMMENT') {
      const waitSeconds = parseInt(q.options || '1') >= 0 ? parseInt(q.options || '1') : 1;
      if (waitSeconds === 0) {
        setTextReady(true);
        setTextCountdown(0);
        return;
      }
      setTextReady(false);
      setTextCountdown(waitSeconds);
      
      const interval = setInterval(() => {
        setTextCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setTextReady(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else if (q?.type === 'AUDIO_MUSHRA') {
      const available = ['A', 'B'];
      if (q.audioUrlC) available.push('C');
      if (q.audioUrlD) available.push('D');
      if (q.audioUrlE) available.push('E');
      setMushraMapping(shuffle(available));
    }
  }, [currentIndex, questions, i18n.language, t]);

  const handleStart = () => {
    setStarted(true);
    if (questions.length > 0) {
      audio.setupQuestionAudio(currentIndex, questions);
    }
  };

  const submitChoice = async () => {
    const q = questions[currentIndex];
    let payloadChoice = '';

    if (q.type === 'AGREEMENT') {
      if (!agreed) {
        setToastMessage(t('PleaseAgree') || "Please agree to the terms.");
        return;
      }
      payloadChoice = JSON.stringify({ Agreed: true });
    } else if (q.type === 'FORM') {
      const fields = (q.content || '').split(';;').filter(s => s.trim());
      for (const field of fields) {
        const parts = field.split(':');
        const id = parts[1]?.trim();
        if (id && !formData[id]) {
          setToastMessage(t('PleaseFillAll') || "Please fill out all fields.");
          return;
        }
      }
      payloadChoice = JSON.stringify(formData);
    } else if (q.type === 'COMMENT') {
      if (!commentText.trim()) {
        setToastMessage(t('PleaseEnterComment') || "Please enter a comment.");
        return;
      }
      payloadChoice = commentText;
    } else if (q.type === 'TEXT') {
      payloadChoice = JSON.stringify({ Read: true });
    } else {
      const qMetrics = metrics.filter(m => (m.group || 'A') === (q.metricGroup || 'A') && m.type !== 'text');
      let requiredCount = 0;
      for (const m of qMetrics) {
        if (m.type === 'semantic_pair') {
          try { requiredCount += JSON.parse(m.leftLabel || m.title || '[]').length; } catch(e){}
        } else if (m.type === 'mushra_group') {
          try { requiredCount += JSON.parse(m.leftLabel || '[]').length; } catch(e){}
        } else {
          requiredCount += 1;
        }
      }
      if (Object.keys(currentChoices).length < requiredCount) {
        setToastMessage(t('PleaseCompleteAll') || "Please complete all scales before proceeding.");
        return;
      }
      
      const finalChoices = { ...currentChoices };
      if (q.type === 'AUDIO_MUSHRA') {
        const getFilename = (key: string) => {
          if (key === 'A') return q.audioUrlA ? q.audioUrlA.split('/').pop() : 'A';
          if (key === 'B') return q.audioUrlB ? q.audioUrlB.split('/').pop() : 'B';
          if (key === 'C') return q.audioUrlC ? q.audioUrlC.split('/').pop() : 'C';
          if (key === 'D') return q.audioUrlD ? q.audioUrlD.split('/').pop() : 'D';
          if (key === 'E') return q.audioUrlE ? q.audioUrlE.split('/').pop() : 'E';
          return key;
        };
        finalChoices['_mushraMapping'] = mushraMapping.map(getFilename).join(', ');
      }
      payloadChoice = JSON.stringify(finalChoices);
    }

    const newResponse = {
      sessionId,
      questionId: q.id,
      choice: payloadChoice,
      createdAt: new Date().toISOString()
    };
    
    const newResponses = [...sessionResponses, newResponse];
    setSessionResponses(newResponses);

    setCurrentChoices({});
    setCommentText('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(curr => curr + 1);
      audio.setupQuestionAudio(currentIndex + 1, questions);
    } else {
      await fetch(`/api/surveys/${slug}/responses/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: newResponses })
      });
      if (slug) {
        sessionStorage.removeItem(`quaeligo_${slug}_sessionId`);
        sessionStorage.removeItem(`quaeligo_${slug}_currentIndex`);
        sessionStorage.removeItem(`quaeligo_${slug}_responses`);
      }
      setCurrentIndex(curr => curr + 1); 
    }
  };

  if (loading && !started) {
    return (
      <>
        <PixelToast message={toastMessage} onClose={() => setToastMessage(null)} />
        <div className="pixel-container"><h1 className="pixel-title">{t('Loading')}</h1></div>
      </>
    );
  }

  if (!started) {
    return (
      <>
        <PixelToast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="pixel-container" style={{textAlign: 'center'}}>
        
          <h1 className="pixel-title">{surveyTitle || t('Welcome')}</h1>
          {surveyWelcomeText && (
            <div style={{ textAlign: 'left', margin: '20px auto', maxWidth: '600px', padding: '0 15px' }}>
              <ReactMarkdown>{parseI18nText(surveyWelcomeText, i18n.language)}</ReactMarkdown>
            </div>
          )}
          <div style={{display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap'}}>

          <button className="pixel-btn" onClick={handleStart}>{t('Start')}</button>
          <button className="pixel-btn secondary" onClick={() => navigate('/')}>{t('ReturnHome') || 'Home'}</button>
        </div>
      </div>
      </>
    );
  }

  if (currentIndex >= questions.length) {
    return (
      <>
        <PixelToast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="pixel-container" style={{textAlign: 'center'}}>
        <h1 className="pixel-title">{t('ThankYou')}</h1>
        <button 
          className="pixel-btn" 
          style={{marginTop: '20px'}} 
          onClick={() => navigate('/')}
        >
          {t('ReturnHome') || 'Return Home'}
        </button>
      </div>
      </>
    );
  }

  const q = questions[currentIndex];

  return (
    <>
      <PixelToast message={toastMessage} onClose={() => setToastMessage(null)} />
    <div className="pixel-container">
      <h2 className="pixel-title" style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>
        {currentIndex + 1} / {questions.length}
      </h2>
      
      {audio.loading ? (
        <div style={{textAlign: 'center', padding: '40px'}}>{t('Loading')}</div>
      ) : q.type === 'AGREEMENT' ? (
        <div style={{textAlign: 'center'}}>
          <div style={{textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px'}}>
            <ReactMarkdown>{mdContent}</ReactMarkdown>
          </div>
          <div style={{marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
             <input type="checkbox" id="agreeCb" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{transform: 'scale(1.5)'}} />
             <label htmlFor="agreeCb" style={{cursor: 'pointer'}}>{parseI18nText(q.options, i18n.language)}</label>
          </div>
          <button 
            className="pixel-btn" 
            style={{marginTop: '30px', width: '200px', opacity: agreed ? 1 : 0.5}}
            disabled={!agreed}
            onClick={submitChoice}
          >
            {t('Next')}
          </button>
        </div>
      ) : q.type === 'FORM' ? (
        <div style={{display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', margin: '40px 0'}}>
           {(q.content || '').split(';;').filter(s => s.trim()).map((field:string, idx:number) => {
             const parts = field.split(':').map((s:string) => s.trim());
             const type = parts[0];
             const id = parts[1];
             const label = parseI18nText(parts[2], i18n.language);
             
             let rawOptions: string[] = [];
             if (parts.length > 3) {
               rawOptions = parts.slice(3);
             }
             const optionsDisplay = rawOptions.map((o:string) => parseI18nText(o.trim(), i18n.language));
             const optionsValue = rawOptions.map((o:string) => parseI18nText(o.trim(), 'en'));
             
             return (
               <div key={idx} style={{width: '100%', maxWidth: '400px', textAlign: 'left'}}>
                 <label style={{display: 'block', marginBottom: '10px'}}>{label}</label>
                 {type === 'dropdown' ? (
                   <select className="pixel-input" value={formData[id] || ''} onChange={e => setFormData({...formData, [id]: e.target.value})}>
                     <option value="" disabled>---</option>
                     {optionsDisplay.map((opt:string, i:number) => <option key={i} value={optionsValue[i]}>{opt}</option>)}
                   </select>
                 ) : (
                   <input className="pixel-input" type="text" value={formData[id] || ''} onChange={e => setFormData({...formData, [id]: e.target.value})} />
                 )}
               </div>
             )
           })}
           <button className="pixel-btn" style={{marginTop: '30px', width: '200px'}} onClick={submitChoice}>{t('Next')}</button>
        </div>
      ) : q.type === 'COMMENT' ? (
        <div style={{textAlign: 'center', width: '100%', maxWidth: '600px', margin: '0 auto'}}>
          {q.title && <h2 style={{marginBottom: '20px'}}>{parseI18nText(q.title, i18n.language)}</h2>}
          <div style={{textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px', marginBottom: '20px'}}>
            <ReactMarkdown>{parseI18nText(q.content, i18n.language)}</ReactMarkdown>
          </div>
          <textarea
            className="pixel-input"
            style={{ width: '100%', height: '120px', resize: 'vertical', fontFamily: 'inherit' }}
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder={t('EnterComment') || 'Type your comment here...'}
          />
          <button 
            className="pixel-btn" 
            style={{marginTop: '30px', width: '200px', opacity: (commentText.trim() && textReady) ? 1 : 0.5}}
            disabled={!commentText.trim() || !textReady}
            onClick={submitChoice}
          >
            {textCountdown > 0 ? `${t('Next')} (${textCountdown}s)` : t('Next')}
          </button>
        </div>
      ) : q.type === 'TEXT' ? (
        <div style={{textAlign: 'center'}}>
          <div style={{textAlign: 'left', backgroundColor: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '10px', maxHeight: '400px', overflowY: 'auto', marginBottom: '20px'}}>
            <ReactMarkdown>{parseI18nText(q.content, i18n.language)}</ReactMarkdown>
          </div>
          <button 
            className="pixel-btn" 
            style={{marginTop: '30px', width: '200px', opacity: textReady ? 1 : 0.5}}
            disabled={!textReady}
            onClick={submitChoice}
          >
            {textCountdown > 0 ? `${t('Next')} (${textCountdown}s)` : t('Next')}
          </button>
        </div>
      ) : (
        <>
          <AudioQuestion 
            question={q}
            metrics={metrics}
            language={i18n.language}
            isMobile={isMobile}
            currentChoices={currentChoices}
            setCurrentChoices={setCurrentChoices}
            isPlaying={audio.isPlaying}
            currentTime={audio.currentTime}
            duration={audio.duration}
            loading={audio.loading}
            activeAudio={audio.activeAudio}
            mushraMapping={mushraMapping}
            togglePlay={audio.togglePlay}
            switchAudio={audio.switchAudio}
            seek={audio.seek}
            setCurrentTime={audio.setCurrentTime}
          />

          <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '20px'}}>
             <button className="pixel-btn" onClick={submitChoice}>
               {t('Next')}
             </button>
          </div>
        </>
      )}

      {/* Admin Skip Button */}
      {(import.meta.env.DEV || new URLSearchParams(window.location.search).get('debug') === '1') && localStorage.getItem('adminToken') && (
        <button 
          onClick={() => {
            setCurrentChoices({});
            if (currentIndex + 1 < questions.length) {
              setCurrentIndex(curr => curr + 1);
              audio.setupQuestionAudio(currentIndex + 1, questions);
            } else {
              setCurrentIndex(curr => curr + 1);
            }
          }}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'red',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
            zIndex: 999
          }}
        >
          Admin Skip (Dev)
        </button>
      )}
    </div>
    </>
  );
}
