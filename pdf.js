/**
 * Minimal hand-rolled PDF writer. No external dependencies.
 * Supports: multi-page text, filled rectangles, stroked lines, two standard
 * fonts (Helvetica / Helvetica-Bold). Produces a valid uncompressed PDF 1.4
 * file as a byte array, suitable for Blob download in any browser.
 */

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;

function escapePdfText(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

// PDF standard fonts use WinAnsiEncoding (superset of Latin-1). Anything
// outside that range is replaced so byte length always matches char length.
function toLatin1(str) {
  let out = '';
  for (const ch of str) {
    out += ch.codePointAt(0) <= 255 ? ch : '?';
  }
  return out;
}

function latin1ByteLength(str) {
  return str.length; // safe: toLatin1() guarantees one byte per char
}

class PDFDoc {
  constructor() {
    this.pages = [];
    this.margin = MARGIN;
    this.pageWidth = PAGE_W;
    this.pageHeight = PAGE_H;
    this.addPage();
  }

  addPage() {
    this.page = { commands: [] };
    this.pages.push(this.page);
    this.y = this.pageHeight - this.margin;
  }

  ensureSpace(height) {
    if (this.y - height < this.margin) {
      this.addPage();
    }
  }

  text(x, y, str, { font = 'F1', size = 11, color = [0, 0, 0] } = {}) {
    const [r, g, b] = color;
    const safe = toLatin1(String(str));
    this.page.commands.push(
      `${r} ${g} ${b} rg BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(safe)}) Tj ET`
    );
  }

  line(x1, y1, x2, y2, width = 1, color = [0, 0, 0]) {
    const [r, g, b] = color;
    this.page.commands.push(`${width} w ${r} ${g} ${b} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  }

  rect(x, y, w, h, color = [0, 0, 0]) {
    const [r, g, b] = color;
    this.page.commands.push(`${r} ${g} ${b} rg ${x} ${y} ${w} ${h} re f`);
  }

  build() {
    const objects = {};
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';

    const fontF1Id = 3;
    const fontF2Id = 4;
    objects[fontF1Id] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[fontF2Id] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

    const pageIds = [];
    let nextId = 5;
    for (const pg of this.pages) {
      const pageId = nextId;
      const contentId = nextId + 1;
      nextId += 2;
      pageIds.push(pageId);

      const contentStr = pg.commands.join('\n');
      const contentLen = latin1ByteLength(contentStr);
      objects[contentId] = `<< /Length ${contentLen} >>\nstream\n${contentStr}\nendstream`;
      objects[pageId] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] ` +
        `/Resources << /Font << /F1 ${fontF1Id} 0 R /F2 ${fontF2Id} 0 R >> >> ` +
        `/Contents ${contentId} 0 R >>`;
    }

    const kids = pageIds.map((id) => `${id} 0 R`).join(' ');
    objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${pageIds.length} >>`;

    const maxId = nextId - 1;
    let out = '%PDF-1.4\n';
    const offsets = {};
    for (let id = 1; id <= maxId; id++) {
      offsets[id] = latin1ByteLength(out);
      out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }

    const xrefOffset = latin1ByteLength(out);
    out += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= maxId; id++) {
      out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    }
    out += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }

  download(filename) {
    const bytes = this.build();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
