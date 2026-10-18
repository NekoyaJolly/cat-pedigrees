// ブラウザーの印刷設定による寸法の丸めを避け、固定サイズのPDFを作る。
export const millimetersToPoints = 2.83465;
export const certificateSize = { width: 339, height: 239 };

// 画面とPDFの両方で、指定した和欧文の書体が揃ってから印刷する。
export async function loadCertificateFonts(): Promise<void> {
  const fonts = await Promise.all([
    document.fonts.load('400 10.5pt "Libre Baskerville"', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
    document.fonts.load('600 12pt "Libre Baskerville"', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
    document.fonts.load('400 10.5pt "Noto Serif JP"', '血統書の氏名'),
  ]);
  if (fonts.some(loaded => loaded.length === 0)) throw new Error('印刷書体を読み込めませんでした。');
  await document.fonts.ready;
}

function encode(text: string): Uint8Array { return new TextEncoder().encode(text); }

export function buildImagePdf(jpeg: Uint8Array, pixelWidth: number, pixelHeight: number): Uint8Array {
  const width = (certificateSize.width * millimetersToPoints).toFixed(5);
  const height = (certificateSize.height * millimetersToPoints).toFixed(5);
  const chunks: Uint8Array[] = [];
  const offsets = [0];
  let length = 0;
  const append = (chunk: Uint8Array) => { chunks.push(chunk); length += chunk.length; };
  const object = (id: number, text: string) => { offsets[id] = length; append(encode(id + ' 0 obj\n' + text + '\nendobj\n')); };
  append(encode('%PDF-1.4\n%血統書\n'));
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  append(encode(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`));
  append(jpeg); append(encode('\nendstream\nendobj\n'));
  const commands = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  object(5, `<< /Length ${encode(commands).length} >>\nstream\n${commands}endstream`);
  const xref = length;
  append(encode('xref\n0 6\n0000000000 65535 f \n' + offsets.slice(1).map(offset => String(offset).padStart(10,'0') + ' 00000 n \n').join('') + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));
  const result = new Uint8Array(length);
  let position = 0;
  for (const chunk of chunks) { result.set(chunk, position); position += chunk.length; }
  return result;
}

// 実際に表示している改行・文字位置を読み取り、300dpiの印刷画像へ描く。
export async function renderCertificatePdf(root: HTMLElement, includePaper: boolean): Promise<Uint8Array> {
  await loadCertificateFonts();
  const bounds = root.getBoundingClientRect();
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(certificateSize.width / 25.4 * 300);
  canvas.height = Math.round(certificateSize.height / 25.4 * 300);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('PDFを作成できませんでした。印刷ボタンからも保存できます。');
  context.fillStyle = '#fff'; context.fillRect(0,0,canvas.width,canvas.height);
  context.scale(canvas.width / bounds.width, canvas.height / bounds.height);
  if (includePaper) {
    const image = root.querySelector<HTMLImageElement>('.certificate-paper');
    if (image) { await image.decode(); context.drawImage(image,0,0,bounds.width,bounds.height); }
  }
  const segmenter = new Intl.Segmenter('ja', { granularity: 'grapheme' });
  for (const element of root.querySelectorAll<HTMLElement>('.certificate-value, .certificate-ancestor > div')) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const parent = element.closest<HTMLElement>('.certificate-ancestor')?.getBoundingClientRect() ?? bounds;
    const left = Math.max(rect.left,parent.left,bounds.left);
    const top = Math.max(rect.top,parent.top,bounds.top);
    const right = Math.min(rect.right,parent.right,bounds.right);
    const bottom = Math.min(rect.bottom,parent.bottom,bounds.bottom);
    if (right <= left || bottom <= top) continue;
    context.save(); context.beginPath();
    context.rect(left-bounds.left,top-bounds.top,right-left,bottom-top); context.clip();
    context.font = [style.fontStyle, style.fontWeight, style.fontSize, style.fontFamily].join(' ');
    context.fillStyle = style.color; context.textBaseline = 'alphabetic';
    for (const child of element.childNodes) {
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent) continue;
      let line = { text: '', x: 0, y: 0 };
      const draw = () => { if (line.text) context.fillText(line.text,line.x-bounds.left,line.y-bounds.top+context.measureText(line.text).fontBoundingBoxAscent); };
      for (const segment of segmenter.segment(child.textContent)) {
        const range = document.createRange(); range.setStart(child,segment.index); range.setEnd(child,segment.index+segment.segment.length);
        const character = range.getBoundingClientRect();
        if (line.text && Math.abs(line.y-character.top)>1) { draw(); line = { text: '', x: 0, y: 0 }; }
        if (!line.text) { line.x = character.left; line.y = character.top; }
        line.text += segment.segment;
      }
      draw();
    }
    context.restore();
  }
  const url = canvas.toDataURL('image/jpeg', .97);
  const binary = atob(url.slice(url.indexOf(',')+1));
  return buildImagePdf(Uint8Array.from(binary, character => character.charCodeAt(0)),canvas.width,canvas.height);
}
