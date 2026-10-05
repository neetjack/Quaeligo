import React from 'react';
import type { IQuestion } from '../../types';
import { parseI18nText } from '../../utils/i18nUtils';

interface FormQuestionProps {
  question: IQuestion;
  currentChoices: Record<string, any>;
  setCurrentChoices: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  language: string;
}

export const FormQuestion: React.FC<FormQuestionProps> = ({ 
  question, 
  currentChoices, 
  setCurrentChoices, 
  language 
}) => {
  const options = question.options?.split('\n') || [];

  return (
    <div style={{textAlign: 'left'}}>
      <p style={{marginBottom: '20px', fontSize: '18px'}}>{parseI18nText(question.content, language)}</p>
      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        {options.map((opt, i) => (
          <button 
            key={i} 
            className={`pixel-btn ${currentChoices[question.id] === opt ? 'active' : 'secondary'}`}
            style={{textAlign: 'left', justifyContent: 'flex-start', padding: '12px 20px'}}
            onClick={() => setCurrentChoices(prev => ({...prev, [question.id]: opt}))}
          >
            <div style={{width: '20px', height: '20px', borderRadius: '50%', border: '2px solid', borderColor: currentChoices[question.id] === opt ? 'white' : '#000', marginRight: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {currentChoices[question.id] === opt && <div style={{width: '10px', height: '10px', backgroundColor: 'white', borderRadius: '50%'}}></div>}
            </div>
            {parseI18nText(opt, language)}
          </button>
        ))}
      </div>
    </div>
  );
};
