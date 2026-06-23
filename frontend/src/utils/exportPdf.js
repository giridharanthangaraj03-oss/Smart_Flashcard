import jsPDF from 'jspdf';

export function exportFlashcardSetToPdf(set) {
  const doc = new jsPDF();
  const marginX = 14;
  let y = 20;

  doc.setFontSize(18);
  doc.text(set.setName, marginX, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Generated on ${new Date(set.createdAt).toLocaleString()}`, marginX, y);
  y += 12;

  set.flashcards.forEach((card, index) => {
    const questionLines = doc.splitTextToSize(`${index + 1}. Q: ${card.question}`, 180);
    const answerLines = doc.splitTextToSize(`A: ${card.answer}`, 180);

    if (y + questionLines.length * 7 + answerLines.length * 7 > 275) {
      doc.addPage();
      y = 20;
    }

    doc.setFont(undefined, 'bold');
    doc.text(questionLines, marginX, y);
    y += questionLines.length * 7;

    doc.setFont(undefined, 'normal');
    doc.text(answerLines, marginX, y);
    y += answerLines.length * 7 + 8;
  });

  doc.save(`${set.setName.replace(/\s+/g, '-').toLowerCase()}-flashcards.pdf`);
}
