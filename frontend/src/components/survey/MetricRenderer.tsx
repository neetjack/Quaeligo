import React from 'react';
import type { IMetric } from '../../types';
import { parseI18nText } from '../../utils/i18nUtils';

interface MetricRendererProps {
  m: IMetric;
  language: string;
  currentChoices: Record<string, any>;
  setCurrentChoices: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  isMobile?: boolean;
}

export const MetricRenderer: React.FC<MetricRendererProps> = ({ 
  m, 
  language, 
  currentChoices, 
  setCurrentChoices, 
  isMobile 
}) => {
  if (m.type === 'text') {
    return (
      <p style={{marginBottom: 0, fontWeight: 'bold', color: '#000', fontStyle: 'normal'}}>
        {parseI18nText(m.title, language)}
      </p>
    );
  }

  if (m.type === 'semantic_pair') {
    let pairs: any[] = [];
    let jsonStr = m.leftLabel;
    if (!jsonStr || !jsonStr.trim().startsWith('[')) jsonStr = m.title;
    try { pairs = JSON.parse(jsonStr || '[]'); } catch(e){}
    return (
      <>
        {pairs.map((pair: any, idx: number) => {
          const choiceKey = m.id.toString() + '_' + pair.id;
          return (
            <div key={pair.id} style={{marginBottom: idx === pairs.length - 1 ? '0' : '30px'}}>
              <div style={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: isMobile ? 'center' : 'flex-start', width: '100%'}}>
                <div style={{flex: isMobile ? 'none' : '0 0 130px', textAlign: isMobile ? 'center' : 'right', marginTop: '10px', width: isMobile ? '100%' : 'auto'}}>
                  <span style={{color: '#aaa', fontWeight: 'bold'}}>{parseI18nText(pair.left, language)}</span>
                </div>
                <div style={{display: 'flex', gap: '10px', justifyContent: 'space-between', width: '100%', flex: isMobile ? 'none' : 1, position: 'relative'}}>
                  {Array.from({length: 7}).map((_, i) => {
                    const val = i - 3;
                    return (
                      <button 
                        key={val}
                        className={`pixel-btn ${currentChoices[choiceKey] === val ? 'active' : 'secondary'}`} 
                        style={{padding: '8px 5px', width: '100%', fontSize: '16px', minWidth: '40px', zIndex: 1}}
                        onClick={() => setCurrentChoices(prev => ({...prev, [choiceKey]: val}))}
                      >
                        {val > 0 ? `+${val}` : val}
                      </button>
                    )
                  })}
                  {m.centerLabel && idx === 0 && (
                    <div style={{position: 'absolute', bottom: '100%', left: '0', width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none', marginBottom: '5px'}}>
                      <span style={{fontSize: '12px', color: '#888', whiteSpace: 'nowrap'}}>{parseI18nText(m.centerLabel, language)}</span>
                    </div>
                  )}
                </div>
                <div style={{flex: isMobile ? 'none' : '0 0 130px', textAlign: isMobile ? 'center' : 'left', marginTop: isMobile ? '0px' : '10px', width: isMobile ? '100%' : 'auto'}}>
                  <span style={{color: '#aaa', fontWeight: 'bold'}}>{parseI18nText(pair.right, language)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (m.type === 'mushra_group') {
    let sliders: any[] = [];
    try { 
      const rawStr = m.leftLabel;
      const fallbackObj = m.payload;
      if (rawStr && typeof rawStr === 'string' && rawStr !== '""' && rawStr !== '[]') {
        sliders = JSON.parse(rawStr);
      } else if (fallbackObj) {
        sliders = typeof fallbackObj === 'string' ? JSON.parse(fallbackObj) : fallbackObj;
      }
    } catch(e){}
    
    if (!Array.isArray(sliders)) sliders = [];

    const formatSliderName = (name: string, lang: string) => {
      const parsed = parseI18nText(name, lang);
      return parsed.replace(/Option\s*(\d+)/gi, (_, p1) => String.fromCharCode(64 + parseInt(p1)));
    };

    return (
      <>
        {sliders.map((slider: any, idx: number) => {
          const choiceKey = m.id.toString() + '_' + slider.id;
          return (
            <div key={slider.id} style={{marginBottom: idx === sliders.length - 1 ? '0' : '30px'}}>
              <div style={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: 'center', width: '100%'}}>
                {isMobile ? (
                  <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '-5px'}}>
                    <span style={{color: '#000', fontWeight: 'bold'}}>{formatSliderName(slider.name, language)}</span>
                    <span style={{color: '#aaa'}}>{parseI18nText(slider.left, language)}</span>
                  </div>
                ) : (
                  <>
                    <span style={{color: '#000', minWidth: '80px', textAlign: 'right', fontWeight: 'bold'}}>{formatSliderName(slider.name, language)}</span>
                    <span style={{color: '#aaa', minWidth: '50px', textAlign: 'right'}}>{parseI18nText(slider.left, language)}</span>
                  </>
                )}
                
                <input 
                  type="range" 
                  className="pixel-slider"
                  min="0" 
                  max="100" 
                  style={{width: '100%', flex: isMobile ? 'none' : 1, minHeight: isMobile ? '44px' : 'auto'}}
                  value={currentChoices[choiceKey] !== undefined ? currentChoices[choiceKey] : 50}
                  onChange={e => setCurrentChoices(prev => ({...prev, [choiceKey]: parseInt(e.target.value)}))}
                  onMouseDown={() => { if(currentChoices[choiceKey] === undefined) setCurrentChoices(prev => ({...prev, [choiceKey]: 50})) }}
                  onTouchStart={() => { if(currentChoices[choiceKey] === undefined) setCurrentChoices(prev => ({...prev, [choiceKey]: 50})) }}
                  onClick={() => { if(currentChoices[choiceKey] === undefined) setCurrentChoices(prev => ({...prev, [choiceKey]: 50})) }}
                />

                {isMobile ? (
                  <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '-5px'}}>
                    <span style={{fontWeight: 'bold', color: currentChoices[choiceKey] === undefined ? '#aaa' : '#004aad', fontSize: '18px'}}>
                      {currentChoices[choiceKey] !== undefined ? currentChoices[choiceKey] : '--'}
                    </span>
                    <span style={{color: '#aaa'}}>{parseI18nText(slider.right, language)}</span>
                  </div>
                ) : (
                  <>
                    <span style={{minWidth: '40px', fontWeight: 'bold', textAlign: 'center', color: currentChoices[choiceKey] === undefined ? '#aaa' : '#004aad', fontSize: '18px'}}>
                      {currentChoices[choiceKey] !== undefined ? currentChoices[choiceKey] : '--'}
                    </span>
                    <span style={{color: '#aaa', minWidth: '50px', textAlign: 'left'}}>{parseI18nText(slider.right, language)}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (m.type === 'basic' || m.type === 'scale_5' || m.type === 'scale_7_uni') {
    return (
      <>
        <p style={{marginBottom: '15px', fontWeight: 'bold'}}>{parseI18nText(m.title, language)}</p>
        <div style={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: 'center', width: '100%'}}>
          <div style={{flex: isMobile ? 'none' : '0 0 130px', textAlign: isMobile ? 'center' : 'right', width: isMobile ? '100%' : 'auto'}}>
            <span style={{color: '#aaa', fontWeight: 'bold'}}>{parseI18nText(m.leftLabel, language)}</span>
          </div>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'space-between', width: '100%', flex: isMobile ? 'none' : 1}}>
            {Array.from({length: m.points || (m.type === 'scale_5' ? 5 : 7)}).map((_, i) => (
              <button 
                key={i} 
                className={`pixel-btn ${currentChoices[m.id.toString()] === i + 1 ? 'active' : 'secondary'}`} 
                style={{padding: '8px 5px', flex: 1, fontSize: '16px', minWidth: '40px'}}
                onClick={() => setCurrentChoices(prev => ({...prev, [m.id.toString()]: i + 1}))}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{flex: isMobile ? 'none' : '0 0 130px', textAlign: isMobile ? 'center' : 'left', width: isMobile ? '100%' : 'auto'}}>
            <span style={{color: '#aaa', fontWeight: 'bold'}}>{parseI18nText(m.rightLabel, language)}</span>
          </div>
        </div>
      </>
    );
  }

  if (m.type === 'semantic_diff') {
    return (
      <div style={{display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '15px', alignItems: isMobile ? 'center' : 'flex-start', width: '100%'}}>
        <div style={{flex: isMobile ? 'none' : '0 0 130px', textAlign: isMobile ? 'center' : 'right', marginTop: '10px', width: isMobile ? '100%' : 'auto'}}>
          <span style={{color: '#aaa', fontWeight: 'bold'}}>{parseI18nText(m.leftLabel, language)}</span>
        </div>
        <div style={{display: 'flex', gap: '10px', justifyContent: 'space-between', width: '100%', flex: isMobile ? 'none' : 1, position: 'relative'}}>
          {Array.from({length: 7}).map((_, i) => {
            const val = i - 3;
            return (
              <button 
                key={val}
                className={`pixel-btn ${currentChoices[m.id.toString()] === val ? 'active' : 'secondary'}`} 
                style={{padding: '8px 5px', width: '100%', fontSize: '16px', minWidth: '40px', zIndex: 1}}
                onClick={() => setCurrentChoices(prev => ({...prev, [m.id.toString()]: val}))}
              >
                {val > 0 ? `+${val}` : val}
              </button>
            )
          })}
          {m.centerLabel && (
            <div style={{position: 'absolute', bottom: '100%', left: '0', width: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none', marginBottom: '5px'}}>
              <span style={{fontSize: '12px', color: '#888', whiteSpace: 'nowrap'}}>{parseI18nText(m.centerLabel, language)}</span>
            </div>
          )}
        </div>
        <div style={{flex: isMobile ? 'none' : '0 0 130px', textAlign: isMobile ? 'center' : 'left', marginTop: isMobile ? '0px' : '10px', width: isMobile ? '100%' : 'auto'}}>
          <span style={{color: '#aaa', fontWeight: 'bold'}}>{parseI18nText(m.rightLabel, language)}</span>
        </div>
      </div>
    );
  }

  return null;
};
