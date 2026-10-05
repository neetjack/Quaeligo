import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import type { IQuestion } from '../../types';

interface AgreementQuestionProps {
  question: IQuestion;
}

export const AgreementQuestion: React.FC<AgreementQuestionProps> = ({ question }) => {
  const { t } = useTranslation();
  return (
    <div style={{textAlign: 'left', lineHeight: '1.6', fontSize: '16px'}}>
      <ReactMarkdown>{question.content || ''}</ReactMarkdown>
      <div style={{marginTop: '30px', padding: '15px', backgroundColor: '#eef', borderLeft: '4px solid #004aad'}}>
        <strong>{t('AgreementTitle') || 'Consent Required'}</strong>
        <p style={{margin: '10px 0 0 0'}}>{t('AgreementText') || 'By clicking "Next", you agree to participate.'}</p>
      </div>
    </div>
  );
};
