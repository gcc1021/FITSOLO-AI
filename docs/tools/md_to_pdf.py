# -*- coding: utf-8 -*-
"""Convert docs/AI-OPC-平台方案书.md to a polished PDF via reportlab."""
import os, re
import reportlab
print('reportlab version:', reportlab.Version)

MD_PATH  = r'C:\Users\gcc83\Desktop\FITSOLO-AI\docs\AI-OPC-平台方案书.md'
OUT_PATH = r'C:\Users\gcc83\Desktop\FITSOLO-AI\output\pdf\AI-OPC-平台方案书.pdf'

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
    Spacer, Table, TableStyle, Preformatted, HRFlowable, PageBreak)
from reportlab.platypus.tableofcontents import TableOfContents

FONT_DIR = r'C:\Windows\Fonts'
BODY, BODY_B, MONO = 'MSYH', 'MSYH-BD', 'NSIMSUN'

def register_font(name, files_subs):
    for f, sub in files_subs:
        p = os.path.join(FONT_DIR, f)
        if os.path.exists(p):
            try:
                pdfmetrics.registerFont(TTFont(name, p, subfontIndex=sub))
                return True
            except Exception as e:
                print('font fail:', name, f, sub, e)
    return False

ok_body  = register_font(BODY,  [('msyh.ttc',0), ('msyh.ttf',0), ('simsun.ttc',0), ('Deng.ttf',0), ('simhei.ttf',0)])
ok_bold  = register_font(BODY_B,[('msyhbd.ttc',0), ('msyhbd.ttf',0), ('simhei.ttf',0)])
ok_mono  = register_font(MONO,  [('simsun.ttc',1), ('simsun.ttc',0), ('consola.ttf',0)])
print('fonts ok: body=%s bold=%s mono=%s' % (ok_body, ok_bold, ok_mono))
if not ok_body:
    raise SystemExit('no CJK body font')
if not ok_mono:
    MONO = BODY
if ok_body and ok_bold:
    pdfmetrics.registerFontFamily(BODY, normal=BODY, bold=BODY_B, italic=BODY, boldItalic=BODY_B)
elif ok_body:
    pdfmetrics.registerFontFamily(BODY, normal=BODY, bold=BODY, italic=BODY, boldItalic=BODY)

# ---------- colors & styles ----------
C_DARK   = colors.HexColor('#1F3864')
C_BLUE   = colors.HexColor('#2E5A9E')
C_GRAY   = colors.HexColor('#666666')
C_LINE   = colors.HexColor('#CCCCCC')
C_HDR    = colors.HexColor('#EAF0F8')
C_CODEBG = colors.HexColor('#F6F8FA')
C_BORDER = colors.HexColor('#D0D7DE')

ST = {}
def st(name, **kw):
    base = dict(fontName=BODY, fontSize=10, leading=15, textColor=colors.black,
                alignment=0, spaceAfter=6)
    base.update(kw)
    ST[name] = ParagraphStyle(name=name, **base)

st('H1',    fontName=BODY, fontSize=20, leading=26, textColor=C_DARK, spaceAfter=4)
st('H2',    fontName=BODY, fontSize=14.5, leading=19, textColor=C_DARK, spaceBefore=14, spaceAfter=6, keepWithNext=True)
st('H3',    fontName=BODY, fontSize=12, leading=16, textColor=C_BLUE, spaceBefore=10, spaceAfter=4, keepWithNext=True)
st('H4',    fontName=BODY_B, fontSize=11, leading=15, spaceBefore=8, spaceAfter=3, keepWithNext=True)
st('P',     fontSize=10, leading=15)
st('QUOTE', fontSize=9.5, leading=14, textColor=C_GRAY, leftIndent=10, spaceAfter=6)
st('BULLET',fontSize=10, leading=15, leftIndent=12, bulletIndent=2, spaceAfter=3, bulletFontName=BODY, bulletFontSize=10)
st('TBL',   fontSize=8.5, leading=11.5)
st('TBL_H', fontName=BODY_B, fontSize=8.5, leading=11.5, textColor=C_DARK)
st('CODE',  fontName=MONO, fontSize=8, leading=10.5, textColor=colors.HexColor('#24292F'))
st('TOC',   fontSize=10, leading=17, leftIndent=4)

def inline(s):
    s = s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    s = s.replace('❌', '×').replace('✅', '√')
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1（\2）', s)
    s = re.sub(r'`([^`]+)`', lambda m: '<font name="%s" size="8.5">%s</font>' % (MONO, m.group(1)), s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', s)
    return s

# ---------- markdown block parsing ----------
def parse_blocks(lines):
    blocks, buf, i, n = [], [], 0, len(lines)
    def flush():
        if buf:
            blocks.append(('p', ' '.join(buf).strip()))
            buf.clear()
    while i < n:
        s = lines[i].strip()
        if not s:
            flush(); i += 1; continue
        if s.startswith('#'):
            flush()
            m = re.match(r'^(#{1,6})\s+(.*)$', s)
            blocks.append(('h%d' % len(m.group(1)), m.group(2).strip())); i += 1; continue
        if s == '---':
            flush(); blocks.append(('hr', '')); i += 1; continue
        if s.startswith('```'):
            flush(); i += 1; code = []
            while i < n and not lines[i].strip().startswith('```'):
                code.append(lines[i]); i += 1
            i += 1
            blocks.append(('code', '\n'.join(code))); continue
        if s.startswith('>'):
            flush(); q = []
            while i < n and lines[i].strip().startswith('>'):
                q.append(lines[i].strip()[1:].strip()); i += 1
            blocks.append(('quote', ' '.join(q))); continue
        if s.startswith('|'):
            flush(); raw = []
            while i < n and lines[i].strip().startswith('|'):
                raw.append(lines[i].strip()); i += 1
            rows = []
            for r in raw:
                cells = [c.strip() for c in r.strip().strip('|').split('|')]
                if cells and re.match(r'^[\s:|-]+$', ''.join(cells)):
                    continue
                rows.append(cells)
            blocks.append(('table', rows)); continue
        m = re.match(r'^([-*]|\d+\.)\s+(.*)$', s)
        if m:
            flush(); items = []
            while i < n:
                mm = re.match(r'^([-*]|\d+\.)\s+(.*)$', lines[i].strip())
                if not mm:
                    break
                items.append((mm.group(1), mm.group(2).strip())); i += 1
            blocks.append(('list', items)); continue
        buf.append(s); i += 1
    flush()
    return blocks

# ---------- layout ----------
MARGIN = 16 * mm
PAGE_W, PAGE_H = A4
AVAIL = PAGE_W - 2 * MARGIN
BODY_TOP = PAGE_H - 18 * mm
BODY_BOT = 20 * mm

def make_table(rows):
    ncols = max(len(r) for r in rows)
    rows = [r + [''] * (ncols - len(r)) for r in rows]
    weights = [1] * ncols
    for r in rows:
        for i, c in enumerate(r):
            w = sum(2 if ord(ch) > 0x2E80 else 1 for ch in c)
            weights[i] = max(weights[i], w + 1)
    tot = sum(weights)
    colw = [AVAIL * w / tot for w in weights]
    if sum(colw) > AVAIL:
        colw = [w * AVAIL / sum(colw) for w in colw]
    data = [[Paragraph(inline(c), ST['TBL_H'] if ri == 0 else ST['TBL']) for c in r]
            for ri, r in enumerate(rows)]
    t = Table(data, colWidths=colw, repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_HDR),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#C9D4E4')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4), ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    return t

def build_story(blocks):
    story, toc_added = [], False
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle(name='TOC1', fontName=BODY, fontSize=10, leading=17, leftIndent=4)]
    for kind, content in blocks:
        if kind == 'quote' and not toc_added:
            story.append(Paragraph(inline(content), ST['QUOTE']))
            story.append(Spacer(1, 6))
            story.append(toc)
            story.append(PageBreak())
            toc_added = True
            continue
        if kind == 'h1':
            story.append(Paragraph(inline(content), ST['H1']))
        elif kind == 'h2':
            story.append(Paragraph(inline(content), ST['H2']))
        elif kind == 'h3':
            story.append(Paragraph(inline(content), ST['H3']))
        elif kind == 'h4':
            story.append(Paragraph(inline(content), ST['H4']))
        elif kind == 'p':
            story.append(Paragraph(inline(content), ST['P']))
        elif kind == 'quote':
            story.append(Paragraph(inline(content), ST['QUOTE']))
        elif kind == 'hr':
            story.append(HRFlowable(width='100%', thickness=0.6, color=C_LINE, spaceBefore=8, spaceAfter=8))
        elif kind == 'code':
            pre = Preformatted(content, ST['CODE'])
            t = Table([[pre]], colWidths=[AVAIL])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), C_CODEBG),
                ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
                ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            story.append(t)
            story.append(Spacer(1, 6))
        elif kind == 'table':
            story.append(make_table(content))
            story.append(Spacer(1, 6))
        elif kind == 'list':
            for marker, text in content:
                bullet = '•' if marker in ('-', '*') else marker
                story.append(Paragraph(inline(text), ST['BULLET'], bulletText=bullet))
    return story

class Doc(BaseDocTemplate):
    def afterFlowable(self, fl):
        if isinstance(fl, Paragraph) and fl.style.name == 'H2':
            self.notify('TOCEntry', (0, fl.getPlainText(), self.page))

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFont(BODY, 8)
    canvas.setFillColor(C_GRAY)
    canvas.drawString(MARGIN, 12 * mm, 'FITSOLO AI — AI + OPC 平台方案书')
    canvas.drawRightString(PAGE_W - MARGIN, 12 * mm, 'v0.1')
    canvas.drawCentredString(PAGE_W / 2, 12 * mm, '第 %d 页' % canvas.getPageNumber())
    canvas.setStrokeColor(C_LINE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, 15 * mm, PAGE_W - MARGIN, 15 * mm)
    canvas.restoreState()

with open(MD_PATH, 'r', encoding='utf-8') as f:
    blocks = parse_blocks(f.read().splitlines())

doc = Doc(OUT_PATH, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
          topMargin=18 * mm, bottomMargin=20 * mm,
          title='AI + OPC 平台方案书', author='FITSOLO AI')
frame = Frame(MARGIN, BODY_BOT, AVAIL, BODY_TOP - BODY_BOT, id='main')
doc.addPageTemplates([PageTemplate(id='main', frames=[frame], onPage=on_page)])
story = build_story(blocks)
doc.multiBuild(story)
print('PDF written:', OUT_PATH, os.path.getsize(OUT_PATH), 'bytes')

