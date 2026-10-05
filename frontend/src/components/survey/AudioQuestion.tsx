import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import type { IQuestion, IMetric } from '../../types';
import { MetricRenderer } from './MetricRenderer';

interface AudioQuestionProps {
  question: IQuestion;
  metrics: IMetric[];
  language: string;
  isMobile: boolean;
  currentChoices: Record<string, any>;
  setCurrentChoices: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  
  // Audio state & controls
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  loading: boolean;
  activeAudio: 'A' | 'B' | 'C' | 'D' | 'E';
  mushraMapping?: string[];
  togglePlay: () => void;
  switchAudio: (target: 'A' | 'B' | 'C' | 'D' | 'E') => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
}

export const AudioQuestion: React.FC<AudioQuestionProps> = ({
  question,
  metrics,
  language,
  isMobile,
  currentChoices,
  setCurrentChoices,
  isPlaying,
  currentTime,
  duration,
  loading,
  activeAudio,
  mushraMapping,
  togglePlay,
  switchAudio,
  seek
}) => {
  const { t } = useTranslation();
  const [activeButton, setActiveButton] = React.useState<string>('REF');
  const [dragTime, setDragTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    setActiveButton('REF');
  }, [question.id]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  // Filter metrics belonging to this question's group
  const questionMetrics = metrics.filter(m => (m.group || 'A') === (question.metricGroup || 'A'))
                                 .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <>
      <div style={{marginBottom: '25px', textAlign: 'left', lineHeight: '1.6', fontSize: '16px'}}>
        <ReactMarkdown>{question.content || ''}</ReactMarkdown>
      </div>

      <div className="audio-control-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <button className={`pixel-btn ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} disabled={loading}>
          {loading ? t('Loading') : (isPlaying ? t('Pause') : t('Play'))}
        </button>

        {question.type === 'AUDIO_MUSHRA' ? (
          <>
            <div className="audio-switcher" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
              <button 
                className={`pixel-btn ${activeButton === 'REF' ? 'active' : ''}`} 
                onClick={() => { setActiveButton('REF'); switchAudio('A'); }}
                disabled={loading}
                style={{ 
                  backgroundColor: activeButton === 'REF' ? '#146c43' : '#198754', 
                  borderColor: '#000',
                  color: '#fff'
                }}
              >
                {t('Reference') || 'Reference'}
              </button>
            </div>
            <div className="audio-switcher" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {(mushraMapping || []).map((key, index) => (
                <button
                  key={index}
                  className={`pixel-btn ${activeButton === `OPT_${index}` ? 'active' : ''}`}
                  onClick={() => { setActiveButton(`OPT_${index}`); switchAudio(key as any); }}
                  disabled={loading}
                >
                  {String.fromCharCode(65 + index)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="audio-switcher" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            <button 
              className={`pixel-btn ${activeAudio === 'A' ? 'active' : ''}`} 
              onClick={() => switchAudio('A')}
              disabled={loading}
            >
              {t('AudioA') || 'Audio A'}
            </button>
            <button 
              className={`pixel-btn ${activeAudio === 'B' ? 'active' : ''}`} 
              onClick={() => switchAudio('B')}
              disabled={loading || !question.audioUrlB}
            >
              {t('AudioB') || 'Audio B'}
            </button>
            {question.audioUrlC && (
              <button 
                className={`pixel-btn ${activeAudio === 'C' ? 'active' : ''}`} 
                onClick={() => switchAudio('C')}
                disabled={loading || !question.audioUrlC}
              >
                {t('AudioC') || 'Audio C'}
              </button>
            )}
            {question.audioUrlD && (
              <button 
                className={`pixel-btn ${activeAudio === 'D' ? 'active' : ''}`} 
                onClick={() => switchAudio('D')}
                disabled={loading || !question.audioUrlD}
              >
                Audio D
              </button>
            )}
            {question.audioUrlE && (
              <button 
                className={`pixel-btn ${activeAudio === 'E' ? 'active' : ''}`} 
                onClick={() => switchAudio('E')}
                disabled={loading || !question.audioUrlE}
              >
                Audio E
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{marginBottom: '40px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', marginBottom: '5px', fontFamily: '"Courier New", Courier, monospace', fontWeight: 'bold'}}>
          <span>{formatTime(dragTime !== null ? dragTime : currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          className="pixel-slider"
          min="0"
          max={duration > 0 ? duration : 1}
          step="0.01"
          value={duration > 0 ? (dragTime !== null ? dragTime : currentTime) : 0}
          onChange={(e) => setDragTime(parseFloat(e.target.value))}
          onMouseUp={(e) => {
            const val = parseFloat(e.currentTarget.value);
            seek(val);
            setDragTime(null);
          }}
          onTouchEnd={(e) => {
            const val = parseFloat(e.currentTarget.value);
            seek(val);
            setDragTime(null);
          }}
          style={{ width: '100%', marginTop: '5px' }}
        />
      </div>

      <div style={{backgroundColor: '#f9f9f9', padding: isMobile ? '20px 15px' : '30px', borderRadius: '0px', border: '2px solid #000', boxShadow: '4px 4px 0px rgba(0,0,0,1)'}}>
        {questionMetrics.map((m, i) => (
          <div key={m.id} style={{marginBottom: i === questionMetrics.length - 1 ? '0' : '40px'}}>
            <MetricRenderer 
              m={m} 
              language={language} 
              currentChoices={currentChoices} 
              setCurrentChoices={setCurrentChoices} 
              isMobile={isMobile}
            />
          </div>
        ))}
      </div>
    </>
  );
};
