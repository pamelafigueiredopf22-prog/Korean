import markdown, re
src=open('__import__('os').path.join(__import__('os').path.dirname(__file__),'..','01-revision-guide.md')',encoding='utf-8').read()
src=src.replace('<details>','<details markdown="1">')
src=re.sub(r'^- \[ \] ', '- ☐ ', src, flags=re.M)
out=[];prev=''
LI=re.compile(r'^\s*(\d+\.|[-*]) ')
for line in src.split('\n'):
    m=re.match(r'^( +)([-*]|\d+\.) ',line)
    if m: line='    '*max(1,len(m.group(1))//2)+line.lstrip()
    if LI.match(line) and prev.strip() and not LI.match(prev) and not prev.startswith('    ') and not prev.lstrip().startswith('>'):
        out.append('')
    out.append(line);prev=line
src='\n'.join(out)
html=markdown.markdown(src,extensions=['tables','fenced_code','toc','md_in_html','sane_lists'])
html=re.sub(r'<table>',r'<div class="tw"><table>',html); html=html.replace('</table>','</table></div>')
ids=set(re.findall(r'id="([^"]+)"',html)); bad=[h for h in re.findall(r'href="#([^"]+)"',html) if h not in ids]
print('broken links:',bad)
page='''<title>GCSE Mock Revision Guide</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=JetBrains+Mono:wght@400&display=swap">
<style>
/* Layout: single reading column (~70ch); a sticky jump bar switches between the chemistry and maths halves. Green = chemistry, blue = maths, amber = "try it". */
:root{
  --bg:#f5f6f9;--paper:#ffffff;--ink:#1b2230;--muted:#5a6476;--line:#dde2eb;
  --chem:#0d7a5f;--maths:#3550c8;--try:#a35b00;--trybg:#fff6e6;--code:#eef1f6;
  --display:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;
  --body:"Lexend",ui-sans-serif,system-ui,sans-serif;
  --mono:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#12161f;--paper:#1a202c;--ink:#eef1f7;--muted:#9aa4b8;--line:#2f3848;
  --chem:#3cc79f;--maths:#8fa2ff;--try:#ffc266;--trybg:#2a2316;--code:#232a38;color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#12161f;--paper:#1a202c;--ink:#eef1f7;--muted:#9aa4b8;--line:#2f3848;
  --chem:#3cc79f;--maths:#8fa2ff;--try:#ffc266;--trybg:#2a2316;--code:#232a38;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font:18px/1.6 var(--body);padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 48px}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--paper)}
.jump{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:var(--paper);border-bottom:1px solid var(--line);margin-inline:calc(-1 * max(16px,env(safe-area-inset-left,0px)));padding:10px max(16px,env(safe-area-inset-left,0px));display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.jump a{font:700 .9rem var(--body);text-decoration:none;padding:6px 14px;border-radius:99px;border:1.5px solid currentColor}
.jump .c{color:var(--chem)}.jump .m{color:var(--maths)}.jump .t{color:var(--muted)}
article{max-width:72ch;margin:0 auto;padding-top:20px}
h1,h2,h3,h4{font-family:var(--display);line-height:1.2;text-wrap:balance;scroll-margin-top:70px}
h1{font-weight:800;font-size:2rem;margin:1.6em 0 .4em}
article>h1:first-child{margin-top:.4em}
h2{font-weight:800;font-size:1.5rem;margin:1.8em 0 .5em;padding-bottom:.25em;border-bottom:2px solid var(--line)}
h3{font-weight:600;font-size:1.2rem;margin:1.6em 0 .4em}
p,li{max-width:70ch}
a{color:var(--maths)}
strong{font-weight:700}
blockquote{margin:1em 0;padding:.6em 1em;background:var(--paper);border:1px solid var(--line);border-radius:10px}
blockquote p{margin:.3em 0}
pre{background:var(--code);padding:12px 14px;border-radius:8px;overflow-x:auto;font:15px/1.45 var(--mono)}
code{font-family:var(--mono);font-size:.9em}
.tw{overflow-x:auto;margin:1em 0}
table{border-collapse:collapse;font-size:.95rem;font-variant-numeric:tabular-nums;background:var(--paper)}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}
th{background:var(--code)}
hr{border:0;border-top:1px solid var(--line);margin:2em 0}
details{background:var(--trybg);border:1px solid var(--try);border-radius:10px;padding:8px 14px;margin:.6em 0 1.2em}
summary{cursor:pointer;color:var(--try);font-weight:700;min-height:32px;display:flex;align-items:center}
summary:focus-visible,a:focus-visible{outline:3px solid var(--try);outline-offset:2px}
ul,ol{padding-left:1.3em}
li{margin:.2em 0}
</style>
<nav class="jump"><a class="t" href="#contents">Contents</a><a class="c" href="#part-a-chemistry-paper-2-foundation-edexcel">Chemistry</a><a class="m" href="#part-b-maths-paper-1-higher-non-calculator-edexcel">Maths</a></nav>
<article>
'''+html+'''
</article>'''
open('gcse-guide.html','w',encoding='utf-8').write(page)
print(len(page))
