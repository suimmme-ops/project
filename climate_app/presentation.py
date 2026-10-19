"""Botanical visual system. Decorative art never represents observed climate data."""
from html import escape

def garden_image():
    # Official Streamlit static serving lets the browser cache the illustration.
    # Do not send a multi-megabyte base64 image on every slider rerun.
    return 'app/static/climate-garden.png'

def leaf_mascot():
    return '<svg viewBox="0 0 100 110" aria-hidden="true"><ellipse cx="50" cy="101" rx="30" ry="5" fill="#163e2b" opacity=".09"/><path d="M49 4C29 22 9 41 12 65C14 91 38 99 59 93C89 86 97 53 81 32C71 21 57 14 49 4Z" fill="#91c75c"/><path d="M49 4C51 35 49 66 43 94" fill="none" stroke="#cce79d" stroke-width="3"/><path d="M13 71L3 63M86 68L97 57M34 94L29 105M64 92L69 104" stroke="#23452c" stroke-width="3.5" stroke-linecap="round"/><circle cx="34" cy="55" r="3" fill="#183a28"/><circle cx="63" cy="53" r="3" fill="#183a28"/><path d="M42 65Q49 75 58 64" fill="none" stroke="#183a28" stroke-width="3" stroke-linecap="round"/><ellipse cx="26" cy="64" rx="5" ry="3" fill="#e5b785"/><ellipse cx="71" cy="61" rx="5" ry="3" fill="#e5b785"/></svg>'

def hero(kicker,heading,subtitle):
    mode='forest' if any(x in kicker for x in ['WELCOME','04','TEACHER']) else 'garden'
    index=next((x for x in ['01','02','03','04'] if x in kicker),'')
    quotes={'01':'먼저 관찰해 볼까?','02':'숫자 속 단서를 찾아봐!','03':'작은 차이도 중요해.','04':'내일의 이야기는 우리가!'}
    bubble=quotes.get(index,'함께, 더 나은 내일을 키워요!')
    return f'''<section class="hero {mode}"><div class="hero-copy"><span class="pill">{escape(kicker)}</span><h1>{heading}</h1><p>{subtitle}</p><div class="hero-meta"><span class="tiny-seed"></span> 직접 조작하고, 근거로 생각하는 기후 수업</div></div><div class="hero-art"><span class="speech-bubble">{bubble}</span><div class="art-halo"></div><img class="garden-art" src="{garden_image()}" alt="식물과 지구 곁에서 웃고 있는 새싹 캐릭터. 학습을 안내하는 장식 일러스트."/><span class="art-tag">작은 발견을 키우는 중 🌱</span></div><span class="hero-number" aria-hidden="true">{index}</span></section>'''

def buddy(text):
    return f'<aside class="buddy-tip"><div class="buddy-avatar">{leaf_mascot()}</div><div><span class="buddy-name">탐험 친구 · 새봄이</span><p>{escape(text)}</p></div><span class="buddy-spark" aria-hidden="true">✧</span></aside>'

def passport(notes,active=None):
    checks=[bool(notes.get(k,'')) for k in ['c1_connection','s3_thought','c3_limit','future_text']]
    labels=[('관찰하기','지구의 신호'),('분석하기','데이터의 단서'),('연결하기','1.5℃의 의미'),('상상하기','2050년의 하루')]
    items=[]
    for i,((verb,label),written) in enumerate(zip(labels,checks)):
        state='current' if active==i else 'written' if written else ''
        badge='✓' if written else f'{i+1:02}'
        items.append(f'<li class="{state}" {"aria-current=step" if active==i else ""}><span class="trail-number">{badge}</span><div><strong>{verb}</strong><small>{label}</small></div><span class="trail-state">{"기록 있음" if written else "탐험 중" if active==i else ""}</span></li>')
    return '<div class="passport"><div class="passport-label"><span>MY CLIMATE JOURNEY</span><strong>나의 탐험 여권</strong></div><ol class="trail">'+''.join(items)+'</ol></div>'

def mini_scene(kind):
    common='<defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#78bd70"/><stop offset="1" stop-color="#235b3b"/></linearGradient><linearGradient id="s" x2="0" y2="1"><stop stop-color="#fff1a1"/><stop offset="1" stop-color="#edb45c"/></linearGradient></defs>'
    floor='<ellipse cx="150" cy="171" rx="108" ry="10" fill="#244e32" opacity=".13"/>'
    shapes={
    'rain':'<path d="M36 120Q39 69 82 84Q91 41 131 63Q171 35 194 76Q232 61 246 99Q263 130 226 135H64Q34 135 36 120" fill="#e3eee6"/><path d="M60 135H227" stroke="#a5beb7" stroke-width="4" stroke-linecap="round"/><g fill="#4b9bab"><path d="M86 137Q63 163 84 165Q102 166 86 137"/><path d="M146 136Q123 162 144 164Q162 165 146 136"/><path d="M207 138Q184 164 205 166Q223 167 207 138"/></g><path d="M29 174Q72 155 113 174T195 172T275 173" fill="none" stroke="#6aa8a8" stroke-width="7" stroke-linecap="round"/>',
    'sun':'<circle cx="166" cy="76" r="45" fill="url(#s)"/><g stroke="#edb45c" stroke-width="6" stroke-linecap="round"><path d="M166 14V5M166 143V151M103 76H92M229 76H240M122 32L113 23M210 120L219 129M210 32L219 23M122 120L113 129"/></g><path d="M70 171V107" stroke="#315d3b" stroke-width="8"/><path d="M72 129Q23 110 43 79Q75 76 77 123Q95 70 120 89Q128 119 72 139" fill="url(#g)"/><path d="M229 172V111" stroke="#e5e6da" stroke-width="12"/><circle cx="229" cy="162" r="17" fill="#d97651"/><path d="M229 148V116" stroke="#d97651" stroke-width="5"/>',
    'forest':'<path d="M72 169V100M145 170V81M223 169V109" stroke="#34523a" stroke-width="9"/><path d="M72 37L27 123H117Z" fill="#39724c"/><path d="M144 12L88 128H203Z" fill="url(#g)"/><path d="M223 61L183 134H264Z" fill="#4f8b55"/><path d="M145 82Q151 119 142 153" stroke="#b5d282" stroke-width="3" fill="none"/><path d="M194 167Q174 142 193 119Q209 135 205 148Q229 114 235 149Q238 170 216 177Z" fill="#e4ac52"/><path d="M213 176Q202 155 214 145Q228 163 219 177" fill="#fff1aa"/>',
    'apple':'<path d="M84 169V101M214 168V101" stroke="#7a724b" stroke-width="10"/><circle cx="81" cy="85" r="47" fill="url(#g)"/><circle cx="212" cy="80" r="49" fill="#56934f"/><g fill="#df875d"><circle cx="60" cy="83" r="10"/><circle cx="96" cy="62" r="10"/><circle cx="92" cy="104" r="10"/><circle cx="195" cy="68" r="10"/><circle cx="227" cy="96" r="10"/></g><path d="M116 154H185L178 178H123Z" fill="#d1ae70"/><path d="M123 148Q150 128 178 148" stroke="#ab8b52" stroke-width="5" fill="none"/><circle cx="145" cy="153" r="12" fill="#db7e58"/><circle cx="163" cy="153" r="12" fill="#d8985b"/>',
    'school':'<path d="M48 169V91H249V169" fill="#e6dbad"/><path d="M34 95L146 39L264 95Z" fill="#38734e"/><path d="M133 135H161V170H133Z" fill="#39734e"/><g fill="#81b7b5"><path d="M67 114H89V137H67Z"/><path d="M105 114H122V137H105Z"/><path d="M177 114H195V137H177Z"/><path d="M212 114H234V137H212Z"/></g><path d="M146 42V13" stroke="#426448" stroke-width="4"/><path d="M147 13H180L169 23L180 32H147Z" fill="#e6b857"/><circle cx="146" cy="92" r="15" fill="#fffae4"/><path d="M146 81V93L155 97" stroke="#4f7152" stroke-width="3" fill="none"/>',
    'ocean':'<circle cx="228" cy="47" r="27" fill="url(#s)"/><path d="M27 118Q81 94 127 117T220 113T282 117V169H27Z" fill="#6aa8a8"/><path d="M29 142Q68 122 109 142T189 141T272 139" stroke="#b5d4c1" stroke-width="8" fill="none"/><path d="M67 130V64H126V130Z" fill="#efe3b8"/><path d="M57 69L97 34L138 69Z" fill="#377350"/><path d="M91 102H108V132H91Z" fill="#497e69"/><path d="M182 157Q202 134 219 156Q202 173 182 157L171 168V145Z" fill="#e0e6ae"/>'
    }
    return '<svg class="mini-scene" viewBox="0 0 300 200" aria-hidden="true">'+common+floor+shapes.get(kind,shapes['forest'])+'</svg>'

def feature_cards(cards):
    items=[]
    for i,(kind,label,heading,text) in enumerate(cards):
        items.append(f'<article class="eco-card eco-card-{i%3}"><div class="eco-scene"><span class="card-label">{escape(label)}</span>{mini_scene(kind)}<span class="eco-leaf leaf-one"></span><span class="eco-leaf leaf-two"></span></div><div class="eco-card-copy"><h3>{escape(heading)}</h3><p>{escape(text)}</p></div></article>')
    return '<div class="feature-grid">'+''.join(items)+'</div>'

def mission_banner(title,body):
    return f'<div class="mission-banner"><span class="mission-icon">✦</span><div><span>오늘의 탐험 미션</span><strong>{escape(title)}</strong><p>{escape(body)}</p></div><div class="mission-sprout" aria-hidden="true">{leaf_mascot()}</div></div>'
