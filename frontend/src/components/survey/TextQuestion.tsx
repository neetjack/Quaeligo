import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { IQuestion } from '../../types';

interface TextQuestionProps {
  question: IQuestion;
}

export const TextQuestion: React.FC<TextQuestionProps> = ({ question }) => {
  return (
    <div style={{textAlign: 'left', lineHeight: '1.6', fontSize: '16px'}}>
      <ReactMarkdown>{question.content || ''}</ReactMarkdown>
    </div>
  );
};
