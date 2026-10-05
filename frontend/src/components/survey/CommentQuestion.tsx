import React from 'react';
import { useTranslation } from 'react-i18next';
import type { IQuestion } from '../../types';
import { parseI18nText } from '../../utils/i18nUtils';

interface CommentQuestionProps {
  question: IQuestion;
  currentChoices: Record<string, any>;
  setCurrentChoices: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  language: string;
}

export const CommentQuestion: React.FC<CommentQuestionProps> = ({ 
  question, 
  currentChoices, 
  setCurrentChoices, 
  language 
}) => {
  const { t } = useTranslation();
  return (
    <div style={{textAlign: 'left'}}>
      <p style={{marginBottom: '20px', fontSize: '18px'}}>{parseI18nText(question.content, language)}</p>
      <textarea
        className="pixel-input"
        style={{width: '100%', minHeight: '150px', resize: 'vertical', fontFamily: 'inherit'}}
        placeholder={t('PlaceholderComment') || 'Please enter your comments...'}
        value={currentChoices[question.id] || ''}
        onChange={e => setCurrentChoices(prev => ({...prev, [question.id]: e.target.value}))}
      />
    </div>
  );
};
