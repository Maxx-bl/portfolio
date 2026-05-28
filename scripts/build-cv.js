#!/usr/bin/env node
/**
 * build-cv.js
 * Reads content.json (FR), generates a LaTeX .tex file, compiles it with
 * XeLaTeX, and outputs assets/files/cv-maxandre.pdf.
 *
 * Usage:  node scripts/build-cv.js
 *
 * Requirements:
 *   - XeLaTeX installed (TeX Live, MiKTeX, etc.)
 *   - fonts/PublicSans-*.ttf present next to this file (already bundled)
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ── Paths ─────────────────────────────────────────────────────────────────
const ROOT       = path.resolve(__dirname, '..');
const CONTENT    = path.join(ROOT, 'assets', 'i18n', 'content.json');
const OUT_TEX    = path.join(__dirname, 'cv-output.tex');
const OUT_DIR    = path.join(ROOT, 'assets', 'files');
const FINAL_PDF  = path.join(OUT_DIR, 'cv-maxandre.pdf');

// ── Load data ─────────────────────────────────────────────────────────────
const json = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
const d    = json.fr;

// ── LaTeX helpers ─────────────────────────────────────────────────────────
function esc(str) {
  return (str || '')
    .replace(/\\/g,  '\\textbackslash{}')
    .replace(/&/g,   '\\&')
    .replace(/#/g,   '\\#')
    .replace(/%/g,   '\\%')
    .replace(/_/g,   '\\_')
    .replace(/\$/g,  '\\$')
    .replace(/\^/g,  '\\^{}')
    .replace(/~/g,   '\\textasciitilde{}');
}

function stripHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '');
}

function itemize(lines) {
  if (!lines || lines.length === 0) return '';
  return `\\begin{itemize}\n${lines.map(l => `  \\item ${l}`).join('\n')}\n\\end{itemize}`;
}

// ── Build sections ────────────────────────────────────────────────────────
const techItems = d.skills.technicalGroups.map(g =>
  `\\textbf{${esc(g.label)} :}\\\\\n    ${esc(g.items)}`
);

const qualityItems = d.skills.qualities.map(q =>
  `\\textbf{${esc(q.label)} :} ${esc(q.description)}`
);

const spokenItems = d.skills.spoken.map(s =>
  `\\textbf{${esc(s.label)}} (${esc(s.description)})`
);

const hobbyItems = d.skills.hobbies.map(h =>
  `\\textbf{${esc(h.label)} :} ${esc(h.description)}`
);

const cvProjectsEntries = Object.values(d.work.cvProjects).map(p =>
  `\\entry{${esc(p.title)}}{${esc(p.year)}}{${esc(p.description)}}`
).join('\n\n');

const experienceEntries = d.experience.entries.map(e =>
  `\\entry{${esc(e.role)} chez ${esc(e.company)}}{${esc(e.period)}}{${esc(stripHtml(e.descriptionHtml))}}`
).join('\n\n');

const educationEntries = d.education.entries.map(e => {
  const title    = `${esc(e.institution)}, ${esc(e.degree)}`;
  const desc     = esc(e.description || '');
  if (desc) {
    return `\\entry{${title}}{${esc(e.period)}}{${desc}}`;
  }
  return `\\entryshort{${title}}{${esc(e.period)}}`;
}).join('\n\n');

// ── LaTeX document ────────────────────────────────────────────────────────
const tex = `\\documentclass[10pt,a4paper]{article}

\\usepackage{fontspec}
\\setmainfont{PublicSans-Regular}[
  Path           = ./fonts/,
  Extension      = .ttf,
  BoldFont       = PublicSans-Bold,
  ItalicFont     = PublicSans-Italic,
  BoldItalicFont = PublicSans-BoldItalic
]

\\usepackage{geometry}
\\usepackage{xcolor}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{graphicx}
\\usepackage{tikz}
\\usepackage{parskip}

\\geometry{top=1.2cm,bottom=1.2cm,left=1.1cm,right=1.1cm,columnsep=0.8cm}

\\hypersetup{colorlinks=true, urlcolor=black, linkcolor=black}

\\definecolor{lightgray}{RGB}{180,180,180}
\\definecolor{sectioncolor}{RGB}{30,30,30}

\\titleformat{\\section}
  {\\normalfont\\bfseries\\large\\color{sectioncolor}}
  {}{0em}{}[\\vspace{-4pt}\\color{lightgray}\\rule{\\linewidth}{0.4pt}\\vspace{2pt}]

\\titlespacing{\\section}{0pt}{10pt}{4pt}

\\linespread{1.04}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{2pt}

\\setlist[itemize]{leftmargin=1em,itemsep=1pt,topsep=2pt,parsep=0pt,label=\\textbullet}

\\newcommand{\\entry}[3]{%
  \\textbf{#1} \\hfill \\textit{\\small #2}\\\\
  \\small #3\\par\\vspace{8pt}
}

\\newcommand{\\entryshort}[2]{%
  \\textbf{#1} \\hfill \\textit{\\small #2}\\par
}

\\pagestyle{empty}

\\begin{document}

%% ─── HEADER ──────────────────────────────────────────────────────────────────
\\begin{minipage}[t]{0.18\\linewidth}
  \\vspace{0pt}
  \\begin{tikzpicture}
    \\clip (0,0) circle (1.5cm);
    \\node at (0,0) {\\includegraphics[width=3cm]{./photo.jpg}};
  \\end{tikzpicture}
\\end{minipage}%
\\hfill
\\begin{minipage}[t]{0.79\\linewidth}
  \\vspace{0pt}
  {\\fontsize{28}{32}\\selectfont\\textbf{Maxandre Berson-Lefuel}}\\\\[6pt]
  ${esc(d.header.tagline)}
\\end{minipage}

\\vspace{8pt}

%% ─── TWO-COLUMN BODY ─────────────────────────────────────────────────────────
\\begin{minipage}[t]{0.30\\linewidth}
\\vspace{0pt}

${esc(d.contact.phone)}\\\\
\\href{mailto:${d.contact.email}}{${esc(d.contact.email)}}\\\\
${esc(d.contact.address)}\\\\
${esc(d.contact.permisB)}\\\\
\\href{https://www.linkedin.com/in/maxandre-bl/}{linkedin.com/in/maxandre-bl/}\\\\[4pt]
\\textbf{Portfolio} : \\href{https://maxx-bl.github.io/}{maxx-bl.github.io/}

\\vspace{2pt}
\\color{lightgray}\\rule{\\linewidth}{0.4pt}
\\color{black}

\\section*{COMPÉTENCES}

${itemize(techItems)}

\\section*{QUALITÉS}

${itemize(qualityItems)}

\\section*{LANGUES}

${itemize(spokenItems)}

\\section*{LOISIRS}

${itemize(hobbyItems)}

\\end{minipage}%
\\hfill
\\begin{minipage}[t]{0.67\\linewidth}
\\vspace{0pt}

\\section*{PROJETS INFORMATIQUES}

${cvProjectsEntries}

\\vspace{14pt}
\\section*{EXPÉRIENCES PROFESSIONNELLES}

${experienceEntries}

\\vspace{14pt}
\\section*{FORMATIONS}

${educationEntries}

\\end{minipage}

\\end{document}
`;

// ── Write & compile ───────────────────────────────────────────────────────
fs.writeFileSync(OUT_TEX, tex, 'utf8');
console.log('✓ cv-output.tex written');

fs.mkdirSync(OUT_DIR, { recursive: true });

try {
  execSync(
    `xelatex -interaction=nonstopmode -output-directory="${__dirname}" "${OUT_TEX}"`,
    { stdio: 'inherit', cwd: __dirname }
  );

  // XeLaTeX outputs to scripts/, move PDF to assets/files/
  const generatedPdf = path.join(__dirname, 'cv-output.pdf');
  if (fs.existsSync(generatedPdf)) {
    fs.copyFileSync(generatedPdf, FINAL_PDF);
    console.log(`✓ PDF generated: ${FINAL_PDF}`);
  } else {
    console.error('✗ PDF not found after compilation');
    process.exit(1);
  }
} catch (err) {
  console.error('✗ XeLaTeX failed:', err.message);
  process.exit(1);
}
