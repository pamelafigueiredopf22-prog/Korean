"""Inline SVG diagrams for the video lessons (drawn for a dark background)."""

S = 'stroke="#c4ccdb" stroke-width="4" fill="none"'
Y = '#ffd166'
G = '#3cc79f'
B = '#7d98ff'
R = '#ff7b7b'


def svg(body, vb="0 0 600 520"):
    return (f'<svg viewBox="{vb}" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif" '
            f'font-size="30" fill="#eef1f7">{body}</svg>')


DIAGRAMS = {}

DIAGRAMS["rate_graph"] = svg(f'''
<line x1="80" y1="440" x2="570" y2="440" {S}/><line x1="80" y1="440" x2="80" y2="40" {S}/>
<text x="330" y="490" text-anchor="middle">Time</text>
<text x="30" y="250" text-anchor="middle" transform="rotate(-90 30 250)">Volume of gas</text>
<path d="M80 440 C 130 180, 190 120, 300 110 L 560 110" stroke="{Y}" stroke-width="6" fill="none"/>
<path d="M80 440 C 200 280, 320 150, 450 115 L 560 110" stroke="{B}" stroke-width="6" fill="none"/>
<text x="150" y="160" fill="{Y}">fast</text><text x="330" y="260" fill="{B}">slow</text>
<text x="420" y="90" font-size="22">flat = finished</text>''')

DIAGRAMS["column"] = svg(f'''
<rect x="200" y="20" width="160" height="440" rx="12" {S}/>
<text x="280" y="500" text-anchor="middle">Crude oil vapour in (hot)</text>
<text x="105" y="60" text-anchor="middle" fill="{B}">cool</text><text x="105" y="440" text-anchor="middle" fill="{R}">hot</text>
<line x1="105" y1="80" x2="105" y2="410" stroke="#9aa4b8" stroke-width="4" stroke-dasharray="8 8"/>
''' + "".join(f'<line x1="360" y1="{y}" x2="400" y2="{y}" {S}/><text x="410" y="{y+9}">{n}</text>'
              for y, n in [(50, "Refinery gas"), (120, "Petrol"), (190, "Kerosene"), (260, "Diesel"), (330, "Fuel oil"), (400, "Bitumen")]))

DIAGRAMS["greenhouse"] = svg(f'''
<circle cx="80" cy="80" r="50" fill="{Y}"/>
<path d="M0 470 Q300 400 600 470 L600 520 L0 520Z" fill="#2c6e49"/>
<rect x="0" y="200" width="600" height="60" fill="#3a5bd9" opacity=".25"/>
<text x="590" y="240" text-anchor="end" font-size="22">greenhouse gases</text>
<line x1="120" y1="120" x2="260" y2="430" stroke="{Y}" stroke-width="5"/>
<text x="20" y="330" fill="{Y}" font-size="24">short wave in</text>
<path d="M300 430 L360 230" stroke="{R}" stroke-width="5" fill="none"/>
<path d="M360 230 L420 430" stroke="{R}" stroke-width="5" stroke-dasharray="10 8" fill="none"/>
<path d="M360 230 L380 120" stroke="{R}" stroke-width="3" fill="none" opacity=".6"/>
<text x="430" y="360" fill="{R}" font-size="22">infrared</text><text x="430" y="388" fill="{R}" font-size="22">sent back</text>''')

DIAGRAMS["chromatography"] = svg(f'''
<rect x="180" y="20" width="220" height="460" {S}/>
<rect x="160" y="420" width="260" height="70" fill="#3a5bd9" opacity=".35"/>
<line x1="180" y1="400" x2="400" y2="400" stroke="#9aa4b8" stroke-width="3"/>
<text x="410" y="408" font-size="22">pencil start line</text>
<line x1="180" y1="80" x2="400" y2="80" stroke="{B}" stroke-width="3" stroke-dasharray="8 6"/>
<text x="410" y="88" font-size="22" fill="{B}">solvent front</text>
<circle cx="290" cy="240" r="16" fill="{Y}"/>
<line x1="140" y1="400" x2="140" y2="240" stroke="{Y}" stroke-width="4"/><text x="132" y="330" text-anchor="end" fill="{Y}">3 cm</text>
<line x1="80" y1="400" x2="80" y2="80" stroke="{B}" stroke-width="4"/><text x="72" y="200" text-anchor="end" fill="{B}">6 cm</text>
<text x="290" y="470" text-anchor="middle" font-size="22">solvent</text>''')

DIAGRAMS["ethane"] = svg(f'''
<g font-size="44" text-anchor="middle">
<text x="150" y="275">H</text><text x="250" y="275">C</text><text x="350" y="275">C</text><text x="450" y="275">H</text>
<text x="250" y="145">H</text><text x="350" y="145">H</text><text x="250" y="405">H</text><text x="350" y="405">H</text></g>
<line x1="175" y1="260" x2="225" y2="260" {S}/><line x1="275" y1="260" x2="325" y2="260" {S}/><line x1="375" y1="260" x2="425" y2="260" {S}/>
<line x1="250" y1="160" x2="250" y2="230" {S}/><line x1="350" y1="160" x2="350" y2="230" {S}/>
<line x1="250" y1="285" x2="250" y2="365" {S}/><line x1="350" y1="285" x2="350" y2="365" {S}/>
<text x="300" y="480" text-anchor="middle" fill="{Y}">ethane C₂H₆: single bonds only</text>''')

DIAGRAMS["ethene"] = svg(f'''
<g font-size="44" text-anchor="middle">
<text x="250" y="275">C</text><text x="350" y="275">C</text>
<text x="160" y="175">H</text><text x="160" y="385">H</text><text x="440" y="175">H</text><text x="440" y="385">H</text></g>
<line x1="275" y1="250" x2="325" y2="250" stroke="{Y}" stroke-width="5"/><line x1="275" y1="268" x2="325" y2="268" stroke="{Y}" stroke-width="5"/>
<line x1="180" y1="180" x2="230" y2="235" {S}/><line x1="180" y1="370" x2="230" y2="285" {S}/>
<line x1="420" y1="180" x2="370" y2="235" {S}/><line x1="420" y1="370" x2="370" y2="285" {S}/>
<text x="300" y="480" text-anchor="middle" fill="{Y}">ethene C₂H₄: C=C double bond</text>''')

DIAGRAMS["venn_hcf"] = svg(f'''
<circle cx="220" cy="260" r="170" stroke="{B}" stroke-width="5" fill="{B}" fill-opacity=".12"/>
<circle cx="380" cy="260" r="170" stroke="{G}" stroke-width="5" fill="{G}" fill-opacity=".12"/>
<text x="140" y="70" fill="{B}" text-anchor="middle">60</text><text x="460" y="70" fill="{G}" text-anchor="middle">72</text>
<text x="130" y="270" font-size="40" text-anchor="middle">5</text>
<text x="300" y="230" font-size="40" text-anchor="middle" fill="{Y}">2  2</text><text x="300" y="295" font-size="40" text-anchor="middle" fill="{Y}">3</text>
<text x="470" y="240" font-size="40" text-anchor="middle">2</text><text x="470" y="300" font-size="40" text-anchor="middle">3</text>
<text x="300" y="490" text-anchor="middle">HCF = middle · LCM = everything</text>''')

DIAGRAMS["line_graph"] = svg(f'''
<line x1="40" y1="380" x2="580" y2="380" {S}/><line x1="300" y1="500" x2="300" y2="20" {S}/>
<text x="570" y="410">x</text><text x="312" y="40">y</text>
<line x1="180" y1="500" x2="480" y2="20" stroke="{Y}" stroke-width="6"/>
<circle cx="300" cy="308" r="10" fill="{G}"/><text x="320" y="320" fill="{G}">c = y-intercept</text>
<line x1="350" y1="228" x2="400" y2="228" stroke="{B}" stroke-width="4"/><line x1="400" y1="228" x2="400" y2="148" stroke="{B}" stroke-width="4"/>
<text x="360" y="262" fill="{B}" font-size="22">across</text><text x="410" y="195" fill="{B}" font-size="22">up</text>
<text x="40" y="60" fill="{Y}">y = mx + c</text><text x="40" y="100" font-size="22">m = up ÷ across</text>''')

DIAGRAMS["parabola"] = svg(f'''
<line x1="20" y1="160" x2="580" y2="160" {S}/><line x1="208" y1="20" x2="208" y2="510" {S}/>
<path d="M90 20 Q250 700 410 20" stroke="{Y}" stroke-width="6" fill="none"/>
<circle cx="125" cy="160" r="10" fill="{G}"/><circle cx="375" cy="160" r="10" fill="{G}"/>
<text x="110" y="140" fill="{G}" text-anchor="end">−2</text><text x="390" y="140" fill="{G}">4</text>
<circle cx="250" cy="360" r="10" fill="{B}"/><text x="270" y="372" fill="{B}">turning point (1, −9)</text>
<circle cx="208" cy="337" r="8" fill="#fff"/><text x="198" y="330" text-anchor="end" font-size="22">−8</text>
<text x="420" y="60" fill="{Y}">roots = where</text><text x="420" y="92" fill="{Y}">it crosses</text><text x="420" y="124" fill="{Y}">the x-axis</text>''')

DIAGRAMS["right_triangle"] = svg(f'''
<path d="M80 440 L520 440 L520 120 Z" {S}/>
<path d="M490 440 L490 410 L520 410" {S}/>
<path d="M150 440 A70 70 0 0 0 140 400" stroke="{Y}" stroke-width="4" fill="none"/><text x="165" y="425" fill="{Y}">θ</text>
<text x="270" y="250" fill="{R}" transform="rotate(-36 270 250)">Hypotenuse</text>
<text x="530" y="290" fill="{G}">Opp</text><text x="300" y="485" fill="{B}" text-anchor="middle">Adjacent</text>''')

DIAGRAMS["pythag"] = svg(f'''
<path d="M100 420 L500 420 L500 120 Z" {S}/>
<path d="M470 420 L470 390 L500 390" {S}/>
<text x="300" y="465" text-anchor="middle" fill="{B}">8</text><text x="520" y="280" fill="{G}">6</text>
<text x="270" y="240" fill="{Y}" font-size="34">c = ?</text>
<text x="300" y="80" text-anchor="middle">a² + b² = c²</text>''')

DIAGRAMS["circle_centre"] = svg(f'''
<circle cx="300" cy="270" r="200" {S}/>
<circle cx="300" cy="270" r="7" fill="#fff"/>
<line x1="127" y1="370" x2="300" y2="270" stroke="{B}" stroke-width="4"/><line x1="473" y1="370" x2="300" y2="270" stroke="{B}" stroke-width="4"/>
<line x1="127" y1="370" x2="300" y2="70" stroke="{Y}" stroke-width="4"/><line x1="473" y1="370" x2="300" y2="70" stroke="{Y}" stroke-width="4"/>
<text x="300" y="330" text-anchor="middle" fill="{B}">2x</text><text x="300" y="140" text-anchor="middle" fill="{Y}">x</text>''')

DIAGRAMS["tree"] = svg(f'''
<g stroke="#c4ccdb" stroke-width="3">
<line x1="30" y1="260" x2="220" y2="130"/><line x1="30" y1="260" x2="220" y2="390"/>
<line x1="260" y1="130" x2="420" y2="60"/><line x1="260" y1="130" x2="420" y2="190"/>
<line x1="260" y1="390" x2="420" y2="330"/><line x1="260" y1="390" x2="420" y2="460"/></g>
<text x="240" y="140" fill="{R}" text-anchor="middle">R</text><text x="240" y="400" fill="{B}" text-anchor="middle">B</text>
<text x="440" y="70" fill="{R}">R</text><text x="440" y="200" fill="{B}">B</text><text x="440" y="340" fill="{R}">R</text><text x="440" y="470" fill="{B}">B</text>
<g font-size="24" fill="{Y}"><text x="90" y="175">4/7</text><text x="90" y="365">3/7</text>
<text x="320" y="80">3/6</text><text x="320" y="190">3/6</text><text x="320" y="340">4/6</text><text x="320" y="455">2/6</text></g>''')

DIAGRAMS["venn_sets"] = svg(f'''
<rect x="20" y="20" width="560" height="440" rx="10" {S}/><text x="40" y="60">ξ</text>
<circle cx="230" cy="250" r="150" stroke="{B}" stroke-width="5" fill="{B}" fill-opacity=".12"/>
<circle cx="370" cy="250" r="150" stroke="{G}" stroke-width="5" fill="{G}" fill-opacity=".12"/>
<text x="150" y="120" fill="{B}">A</text><text x="440" y="120" fill="{G}">B</text>
<text x="300" y="260" text-anchor="middle" fill="{Y}">A ∩ B</text>
<text x="300" y="500" text-anchor="middle">∩ = and · ∪ = or · A′ = not A</text>''')

DIAGRAMS["collision"] = svg(f'''
<circle cx="160" cy="250" r="55" fill="{B}"/><circle cx="440" cy="250" r="55" fill="{G}"/>
<line x1="230" y1="250" x2="320" y2="250" stroke="{Y}" stroke-width="6"/><path d="M320 235 L345 250 L320 265Z" fill="{Y}"/>
<text x="300" y="380" text-anchor="middle">1. They must collide</text>
<text x="300" y="430" text-anchor="middle">2. with enough energy</text>
<text x="300" y="470" text-anchor="middle" fill="{Y}" font-size="22">(the activation energy)</text>''')

DIAGRAMS["atom"] = svg(f'''
<circle cx="300" cy="250" r="45" fill="{R}" fill-opacity=".85"/><text x="300" y="260" text-anchor="middle" font-size="24">11p 12n</text>
<circle cx="300" cy="250" r="100" stroke="#9aa4b8" stroke-width="3" fill="none"/>
<circle cx="300" cy="250" r="160" stroke="#9aa4b8" stroke-width="3" fill="none"/>
<circle cx="300" cy="250" r="220" stroke="#9aa4b8" stroke-width="3" fill="none"/>
''' + "".join(f'<circle cx="{x}" cy="{y}" r="11" fill="{B}"/>' for x, y in
              [(300,150),(300,350),(140,250),(460,250),(187,137),(413,137),(187,363),(413,363),(300,90),(300,410),(520,250)]) + f'''
<text x="300" y="505" text-anchor="middle" fill="{Y}">sodium 2.8.1</text>''')

DIAGRAMS["profile"] = svg(f'''
<line x1="70" y1="450" x2="570" y2="450" {S}/><line x1="70" y1="450" x2="70" y2="30" {S}/>
<text x="320" y="495" text-anchor="middle" font-size="24">Progress of reaction</text>
<text x="35" y="250" text-anchor="middle" font-size="24" transform="rotate(-90 35 250)">Energy</text>
<path d="M90 250 L180 250 C 240 250, 250 90, 300 90 C 350 90, 360 370, 420 370 L 550 370" stroke="{Y}" stroke-width="6" fill="none"/>
<text x="95" y="235" font-size="24">reactants</text><text x="440" y="405" font-size="24">products</text>
<line x1="210" y1="250" x2="210" y2="95" stroke="{B}" stroke-width="4"/><text x="200" y="170" text-anchor="end" fill="{B}" font-size="22">activation</text><text x="200" y="196" text-anchor="end" fill="{B}" font-size="22">energy</text>
<line x1="565" y1="250" x2="565" y2="370" stroke="{G}" stroke-width="4" stroke-dasharray="8 6"/><text x="560" y="440" text-anchor="end" fill="{G}" font-size="22">energy given out</text>
<text x="320" y="40" text-anchor="middle" fill="{Y}">Exothermic</text>''')
