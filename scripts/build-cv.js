#!/usr/bin/env node
/**
 * build-cv.js
 * Reads content.json, generates FR and EN LaTeX files, compiles both with
 * pdfLaTeX, and outputs cv-maxandre-fr.pdf / cv-maxandre-en.pdf.
 *
 * Usage:  node scripts/build-cv.js
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT    = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'assets', 'i18n', 'content.json');
const OUT_DIR = path.join(ROOT, 'assets', 'files');

const json = JSON.parse(fs.readFileSync(CONTENT, 'utf8'));

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

function latexEntry(title, year, desc, bullets) {
  const header = `\\textbf{${title}} \\hfill \\textit{\\small ${year}}\\\\`;
  const body   = `  \\small ${desc}`;
  if (bullets && bullets.length > 0) {
    const items = bullets.map(b => `    \\item ${esc(b)}`).join('\n');
    return `${header}\n${body}\n  \\begin{itemize}[topsep=1pt,itemsep=0pt,parsep=0pt]\n${items}\n  \\end{itemize}\\vspace{4pt}`;
  }
  return `${header}\n${body}\\par\\vspace{8pt}`;
}

// ── Build + compile one language ──────────────────────────────────────────
function buildForLang(langCode) {
  const d = json[langCode];
  const s = d.cv.sections;

  const techItems = d.skills.technicalGroups.map(g =>
    `\\textbf{${esc(g.label)} :}\\\\\n    ${esc(g.items)}`
  );

  const qualityItems = d.skills.qualities.map(q =>
    `\\textbf{${esc(q.label)} :} ${esc(q.description)}`
  );

  const spokenItems = d.skills.spoken.map(sp =>
    `\\textbf{${esc(sp.label)}} (${esc(sp.description)})`
  );

  const hobbyItems = d.skills.hobbies.map(h =>
    `\\textbf{${esc(h.label)} :} ${esc(h.description)}`
  );

  const cvProjectsEntries = Object.values(d.work.cvProjects).map(p =>
    latexEntry(esc(p.title), esc(p.year), esc(p.description), p.bullets)
  ).join('\n\n');

  const experienceEntries = d.experience.entries.map(e =>
    latexEntry(`${esc(e.role)} - ${esc(e.company)}`, esc(e.period), esc(stripHtml(e.descriptionHtml)), e.bullets)
  ).join('\n\n');

  const educationEntries = d.education.entries.map(e => {
    const title = `${esc(e.institution)}, ${esc(e.degree)}`;
    const desc  = esc(e.description || '');
    if (desc) return `\\entry{${title}}{${esc(e.period)}}{${desc}}`;
    return `\\entryshort{${title}}{${esc(e.period)}}`;
  }).join('\n\n');

  const tex = `\\documentclass[10pt,a4paper]{article}

\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}

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
  ${esc(d.about.bioHtml)}
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
\\textbf{Portfolio} : \\href{https://portfolio.synae.dev/}{portfolio.synae.dev/}

\\color{lightgray}\\rule{\\linewidth}{0.4pt}
\\color{black}

\\vspace{-6pt}
\\section*{${s.skills}}

${itemize(techItems)}

\\section*{${s.softSkills}}

${itemize(qualityItems)}

\\section*{${s.languages}}

${itemize(spokenItems)}

\\section*{${s.hobbies}}

${itemize(hobbyItems)}

\\end{minipage}%
\\hfill
\\begin{minipage}[t]{0.67\\linewidth}
\\vspace{0pt}

\\section*{${s.experience}}

${experienceEntries}

\\vspace{14pt}
\\section*{${s.projects}}

${cvProjectsEntries}

\\vspace{14pt}
\\section*{${s.education}}

${educationEntries}

\\end{minipage}

\\end{document}
`;

  const outTex   = path.join(__dirname, `cv-output-${langCode}.tex`);
  const outPdf   = path.join(__dirname, `cv-output-${langCode}.pdf`);
  const finalPdf = path.join(OUT_DIR, `cv-maxandre-${langCode}.pdf`);

  fs.writeFileSync(outTex, tex, 'utf8');
  console.log(`✓ cv-output-${langCode}.tex written`);

  try {
    execSync(
      `pdflatex -interaction=nonstopmode -output-directory="${__dirname}" "${outTex}"`,
      { stdio: 'inherit', cwd: __dirname }
    );

    if (fs.existsSync(outPdf)) {
      fs.copyFileSync(outPdf, finalPdf);
      console.log(`✓ PDF generated: ${finalPdf}`);
    } else {
      console.error(`✗ PDF not found after compilation for ${langCode}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`✗ pdflatex failed for ${langCode}:`, err.message);
    process.exit(1);
  }
}

// ── Run both languages ────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
buildForLang('fr');
buildForLang('en');
