import Papa from 'papaparse';

export const exportQuestionsToCsv = (questions: any[], filename: string) => {
  const csvData = questions.map(q => ({
    type: q.type,
    metricGroup: q.metricGroup,
    title: q.title,
    audioUrlA: q.audioUrlA,
    audioUrlB: q.audioUrlB,
    audioUrlC: q.audioUrlC,
    audioUrlD: q.audioUrlD,
    audioUrlE: q.audioUrlE,
    content: q.content,
    options: q.options,
    order: q.order,
    isRandomized: q.isRandomized,
    exportName: q.exportName
  }));

  const csvStr = Papa.unparse(csvData);
  const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
