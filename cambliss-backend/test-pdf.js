const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function test() {
  const doc1 = await PDFDocument.create();
  const page1 = doc1.addPage();
  page1.drawText('This is Document 1', { x: 50, y: 500, size: 30, color: rgb(1, 0, 0) });
  const bytes1 = await doc1.save();
  fs.writeFileSync('doc1.pdf', bytes1);

  const doc2 = await PDFDocument.create();
  const page2 = doc2.addPage();
  page2.drawText('This is Document 2', { x: 50, y: 500, size: 30, color: rgb(0, 0, 1) });
  const bytes2 = await doc2.save();
  fs.writeFileSync('doc2.pdf', bytes2);

  const files = [
    { path: 'doc1.pdf' },
    { path: 'doc2.pdf' }
  ];

  const mergedDocument = await PDFDocument.create();
  for (const file of files) {
    const bytes = fs.readFileSync(file.path);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageIndices = doc.getPageIndices();
    const copiedPages = await mergedDocument.copyPages(doc, pageIndices);
    for (const page of copiedPages) {
      mergedDocument.addPage(page);
    }
  }

  const mergedBytes = await mergedDocument.save({ useObjectStreams: true });
  fs.writeFileSync('merged.pdf', mergedBytes);
  console.log("Merged pages:", mergedDocument.getPageCount());
}

test().catch(console.error);
