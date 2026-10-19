from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import html
import io
import json
import csv
import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from climate_app.data import temperature, emissions, observation, country_ranking, COUNTRIES, SCENARIOS, PERIODS, scenario_at
from climate_app.charts import temperature_chart, countries_chart, future_chart, base
from climate_app.backend import Store, AccessDenied, identity_from_claims, is_teacher
from climate_app.presentation import hero, buddy, passport, leaf_mascot, feature_cards, mission_banner

ROOT=Path(__file__).parent
st.set_page_config(page_title='기후 탐험대 | 데이터로 여는 미래',page_icon='🌏',layout='wide',initial_sidebar_state='auto')
st.markdown('<style>'+ (ROOT/'assets/style.css').read_text()+'</style>',unsafe_allow_html=True)

@st.cache_data
def datasets():return temperature(),emissions()
TEMP,CO2=datasets()
CHAPTERS=['01  기후변화의 심각성','02  데이터로 분석하기','03  1.5℃, 생존의 마지노선','04  2050년, 미래 예측하기']
DEFAULTS={'notes':{},'evidence':[],'loaded_for':None,'classroom':None,'demo':False,'demo_submitted':False}
for k,v in DEFAULTS.items():
    if k not in st.session_state:st.session_state[k]=v.copy() if isinstance(v,(dict,list)) else v
S=st.session_state

def secret_section(name):
    try:return dict(st.secrets.get(name,{}))
    except (FileNotFoundError,st.errors.StreamlitSecretNotFoundError):return {}
APP=secret_section('app'); AUTH=secret_section('auth'); FIREBASE=secret_section('firebase')
READY=bool(AUTH.get('client_id') and FIREBASE.get('project_id'))

@st.cache_resource
def get_store():
    import firebase_admin
    from firebase_admin import credentials,firestore
    cred=dict(st.secrets['firebase']);cred['private_key']=cred['private_key'].replace('\\n','\n')
    try:app=firebase_admin.get_app('climate-classroom')
    except ValueError:app=firebase_admin.initialize_app(credentials.Certificate(cred),name='climate-classroom')
    return Store(firestore.client(app=app),list(st.secrets.get('app',{}).get('teacher_emails',[])))

USER=None; STORE=None
if READY and st.user.is_logged_in:
    try:
        USER=identity_from_claims(dict(st.user))
        STORE=get_store()
        if not S.demo:
            if S.classroom is None:S.classroom=STORE.current_class(USER)
            if S.classroom and S.loaded_for!=(USER.uid,S.classroom['id']):
                d=STORE.load(USER,S.classroom['id']);S.notes=d.get('answers',{});S.evidence=d.get('evidence',[]);S.feedback=d.get('feedback','');S.loaded_for=(USER.uid,S.classroom['id'])
    except Exception:
        st.error('학습 저장소에 연결하지 못했습니다. 교사에게 로그인·Firebase 설정을 확인해 달라고 요청해 주세요.')
        st.stop()

TEACHER=bool(USER and is_teacher(USER,APP.get('teacher_emails',[])))

def esc(t):return html.escape(str(t))
def callout(text,warm=False):st.markdown(f'<div class="callout {"warm" if warm else ""}">{text}</div>',unsafe_allow_html=True)
def tag(text):st.markdown(f'<div class="section-tag">{text}</div>',unsafe_allow_html=True)
def title(kicker,title,subtitle):
    st.markdown(hero(kicker,title,subtitle),unsafe_allow_html=True)
    if 'CHAPTER' in kicker:
        index=next((i for i in range(4) if f'{i+1:02}' in kicker),0)
        st.markdown(passport(S.notes,index),unsafe_allow_html=True)

def friend(text):st.markdown(buddy(text),unsafe_allow_html=True)
def mission(heading,body):st.markdown(mission_banner(heading,body),unsafe_allow_html=True)
def chart(fig,key):st.plotly_chart(fig,width='stretch',config={'displayModeBar':False,'scrollZoom':False},key=key)
def note(key,label,placeholder='',height=125):
    widget='answer_'+key
    if widget not in S:S[widget]=S.notes.get(key,'')
    def sync():S.notes[key]=S[widget]
    st.text_area(label,key=widget,on_change=sync,placeholder=placeholder,height=height,max_chars=6000)
    # Store all values independently of Streamlit widget lifecycle.
    S.notes[key]=S[widget]

def pin(text,key):
    if st.button('＋ 이 수치를 근거로 담기',key=key):
        if text not in S.evidence:S.evidence.append(text)
        st.toast('탐구 노트에 근거를 담았어요.',icon='📌')
def source(text,url,detail=''):
    st.caption(f'출처: {text} · {detail}')
    st.link_button('원자료 확인 ↗',url)

def save(submit=False):
    if S.demo:
        if submit:S.demo_submitted=True
        st.success('체험 제출이 완료됐어요. 현재 세션에서만 확인할 수 있고 서버에는 저장되지 않아요.' if submit else '체험 기록은 현재 세션에 보관 중이에요. 파일로 내려받아 주세요.')
        return
    if not USER or not S.classroom:
        st.warning('Google 로그인 후 학급 코드로 참여하면 저장할 수 있어요.');return
    try:
        STORE.save(USER,S.classroom['id'],S.notes,S.evidence,submit)
        st.success('제출 완료! 선생님 대시보드로 보냈어요.' if submit else 'Firebase에 학습 기록을 저장했어요.')
    except (ValueError,AccessDenied) as e:st.warning(str(e))
    except Exception:st.error('저장하지 못했어요. 기록 파일을 내려받고 잠시 후 다시 시도해 주세요.')

def notebook_html():
    rows=''.join(f'<h3>{esc(QUESTION_LABELS.get(k,k))}</h3><p style="white-space:pre-wrap">{esc(v)}</p>' for k,v in S.notes.items() if v.strip())
    ev=''.join(f'<li>{esc(e)}</li>' for e in S.evidence)
    return f'<!doctype html><html lang="ko"><meta charset="utf-8"><title>나의 기후 탐구 노트</title><style>body{{font:17px/1.8 sans-serif;max-width:820px;margin:50px auto;padding:20px;color:#183c3c}}h1{{color:#087f75}}h3{{margin-top:30px}}@media print{{body{{margin:0}}}}</style><h1>🌏 나의 기후 탐구 노트</h1><p>기후 탐험대 · {datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d %H:%M")} KST</p><h2>자료에서 찾은 근거</h2><ul>{ev}</ul>{rows}</html>'

QUESTION_LABELS={
'c1_flood':'왜 지구가 따뜻해지면 홍수가 늘어날까요?','c1_heat':'폭염과 산불은 어떤 변화와 연결되나요?','c1_connection':'기후변화는 누구의 생활에 영향을 줄까요?',
's1_when':'기온 상승이 빨라진 시기와 근거','s1_life':'생활과 생산 방식의 변화','s1_industry':'사회 변화의 이름','s2_blanket':'온실가스를 비유한다면','s2_effect':'온실가스가 없다면','s2_fuels':'화석연료와 연소','s2_activities':'온실가스를 배출하는 생활 속 활동 3가지','s2_more':'이산화탄소가 늘면 왜 더워질까요?',
's3_values':'대한민국과 영국의 1인당 배출량','s3_higher':'대한민국보다 1인당 배출량이 많은 나라','s3_thought':'두 나라의 변화에 대한 내 생각','s4_rank':'전체 배출량이 많은 나라와 대한민국 순위','s4_change':'배출량을 줄인 나라와 감축 노력',
'c3_mean':'전 지구 평균 기온 1℃ 상승의 뜻','c3_season':'기온 상승과 계절 변화','c3_feedback':'눈과 얼음이 녹으면 생기는 변화','c3_limit':'왜 1.5℃를 지키려 할까요?','c3_concern':'내가 가장 걱정하는 변화',
'future_before':'자료를 보기 전 나의 예상','future_scenario':'선택한 배출 시나리오','future_text':'2050년, 우리가 살게 될 세상','future_uncertainty':'예측에서 확실하지 않은 점','future_action':'우리가 지금 할 수 있는 일','reflection_learn':'새롭게 알게 된 점','reflection_feel':'느낀 점'}

with st.sidebar:
    st.markdown('<div class="brand"><span class="brand-icon">'+leaf_mascot()+'</span><div>기후 탐험대<small>GROW A BETTER TOMORROW</small></div></div>',unsafe_allow_html=True)
    st.caption('초등 5–6학년 · 데이터 기반 탐구')
    page=st.radio('나의 탐험 여정',CHAPTERS,key='chapter_nav',label_visibility='collapsed',on_change=lambda: S.update(utility='수업 화면'))
    done=sum(bool(S.notes.get(k,'')) for k in ['c1_connection','s3_thought','c3_limit','future_text'])
    st.progress(done/4,text=f'탐구 기록 {done} / 4장')
    st.divider()
    if USER and not S.demo:
        st.caption(f'Google 로그인 · {USER.name}')
        if S.classroom:st.success(f"{S.classroom['title']} · {S.classroom['alias']}")
        else:st.info('학급 코드로 참여해 주세요.')
        if st.button('로그아웃',width='stretch'):
            for k in list(S):del S[k]
            st.logout()
    elif S.demo:
        st.info('체험 모드 · 실제 저장 안 됨')
        if READY and st.button('Google 로그인으로 전환'):
            for k in list(S):del S[k]
            st.login()
    else:
        st.caption('로그인하면 다른 기기에서도 기록을 이어갈 수 있어요.')
        if st.button('Google로 시작하기',type='primary',width='stretch',disabled=not READY):st.login()
    st.button('☁ 학습 기록 저장',on_click=save,width='stretch')
    utility=st.radio('학습 도구',['수업 화면','나의 탐구 노트','교사 대시보드','자료와 출처'],label_visibility='collapsed',key='utility')
    st.markdown('<div class="sidebar-note"><strong>생각이 자라는 탐험 🌱</strong>슬라이더로 발견한 수치를<br>내 생각의 근거로 담아 봐요.</div>',unsafe_allow_html=True)
    if TEACHER or S.demo:
        with st.expander('선생님을 위한 안내'):
            st.link_button('처음부터 배포·수업 준비하기 ↗','https://github.com/suimmme-ops/project/blob/codex/climate-explorers/docs/TEACHER_START.md')
            st.link_button('6차시 상세 수업 지도안 ↗','https://github.com/suimmme-ops/project/blob/codex/climate-explorers/docs/LESSON_PLAN.md')
            st.download_button('교사 시작 안내 PDF',(ROOT/'docs/TEACHER_START.pdf').read_bytes(),'기후탐험대_교사시작안내.pdf','application/pdf',key='sidebar_start_pdf',width='stretch')
            st.download_button('6차시 수업 지도안 PDF',(ROOT/'docs/LESSON_PLAN.pdf').read_bytes(),'기후탐험대_6차시수업지도안.pdf','application/pdf',key='sidebar_lesson_pdf',width='stretch')

if not USER and not S.demo:
    title('WELCOME · 작은 발견, 커다란 변화','데이터를 움직이면,<br>미래가 보인다.','슬라이더로 기후의 변화를 살펴보고, 자료를 근거로 2050년의 삶을 상상해 보세요.')
    a,b=st.columns([1.2,1])
    with a:
        st.subheader('오늘, 우리는 기후 탐험가')
        st.write('숫자를 읽고, 질문을 만들고, 나의 생각을 기록해요. 정해진 정답보다 **자료로 설명하는 힘**이 중요해요.')
        if st.button('로그인 없이 먼저 둘러보기 →',type='primary'):
            S.demo=True;st.rerun()
        if not READY:callout('지금은 공개 체험을 이용할 수 있어요. 실제 로그인과 제출은 교사가 Google·Firebase 설정을 마친 뒤 사용할 수 있어요.',True)
    with b:
        with st.container(border=True):
            st.markdown('**4개의 질문으로 떠나는 탐험**')
            st.write('① 지구는 어떤 신호를 보내고 있을까?\n\n② 데이터를 보면 무엇을 알 수 있을까?\n\n③ 1.5℃는 왜 중요할까?\n\n④ 우리가 살 2050년은 어떤 모습일까?')
    friend('안녕! 나는 탐험 친구 새봄이야. 그래프에서 찾은 숫자가 너의 멋진 생각을 지지해 줄 거야.')
    st.markdown(passport(S.notes),unsafe_allow_html=True)
    st.subheader('어떤 탐험부터 시작할까요?')
    for i,col in enumerate(st.columns(4)):
        with col:
            def enter_chapter(index=i):
                S.demo=True;S.chapter_nav=CHAPTERS[index];S.utility='수업 화면'
            st.button(['01 · 지구의 신호','02 · 데이터의 단서','03 · 1.5℃의 의미','04 · 2050년의 하루'][i],key=f'welcome_chapter_{i}',width='stretch',on_click=enter_chapter)
    st.caption('로그인 없이 시작한 탐험은 체험 모드예요. 실제 제출은 Google 로그인과 학급 참여 후 사용할 수 있어요.')
    st.stop()

if USER and not S.demo and not TEACHER and not S.classroom:
    st.header('우리 반 탐험에 참여하기')
    st.write('선생님이 알려주신 8자리 학급 코드와 학습 이름을 입력해 주세요. 이름 대신 번호나 별명을 써도 돼요.')
    with st.form('join_class'):
        code=st.text_input('학급 코드',max_chars=8)
        alias=st.text_input('학습 이름',placeholder='예: 6학년 2반 05번',max_chars=30)
        if st.form_submit_button('학급 참여하기',type='primary'):
            try:S.classroom=STORE.join(USER,code,alias);st.rerun()
            except (ValueError,AccessDenied) as e:st.warning(str(e))
            except Exception:st.error('학급에 참여하지 못했어요. 코드를 확인한 뒤 다시 시도해 주세요.')
    st.stop()

if utility=='나의 탐구 노트':
    title('MY INQUIRY NOTE','작은 발견을 모아,<br>나의 생각으로.','자료에서 찾은 수치와 내가 쓴 글을 한곳에서 확인해요. 저장 버튼을 눌러 기록을 보관하세요.')
    st.subheader('📌 내가 담은 자료 근거')
    if not S.evidence:st.info('그래프 아래의 ‘이 수치를 근거로 담기’를 눌러 보세요.')
    for i,e in enumerate(S.evidence):
        a,b=st.columns([12,1]);a.markdown(f'<div class="evidence">{esc(e)}</div>',unsafe_allow_html=True)
        if b.button('삭제',key=f'delete_evidence_{i}'):S.evidence.pop(i);st.rerun()
    for k,v in S.notes.items():
        if v.strip():
            with st.expander(QUESTION_LABELS.get(k,k),expanded=k=='future_text'):st.write(v)
    a,b,c=st.columns(3)
    a.button('☁ Firebase에 저장',on_click=save,width='stretch')
    b.download_button('탐구 노트 내려받기',notebook_html().encode(),'나의_기후_탐구노트.html','text/html',width='stretch')
    c.download_button('기록 JSON 내려받기',json.dumps({'answers':S.notes,'evidence':S.evidence},ensure_ascii=False,indent=2),'climate_notes.json','application/json',width='stretch')
    st.caption('HTML 파일은 브라우저에서 열어 인쇄 → PDF로 저장할 수 있어요. 체험 기록은 새 접속 때 사라질 수 있어요.')
    if USER and S.classroom and not S.demo and st.button('선생님 피드백 새로고침'):
        try:S.feedback=STORE.load(USER,S.classroom['id']).get('feedback','')
        except Exception:st.warning('피드백을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.')
    if S.get('feedback'):st.info('선생님의 피드백: '+S.feedback)
    st.stop()

if utility=='교사 대시보드':
    title('TEACHER STUDIO','생각이 모이는<br>우리 반 탐구실.','학생들의 제출 상태와 미래 예측 글을 확인하고, 근거를 발전시키는 피드백을 남겨 주세요.')
    with st.expander('처음 사용하시나요? 교사용 준비 안내'):
        st.write('① Streamlit에서 체험 배포 → ② Google·Firebase 설정 → ③ 교사 로그인 → ④ 학급 생성 → ⑤ 학생 계정으로 제출 시험 → ⑥ 실제 수업 순서로 준비하세요.')
        st.link_button('클릭 순서까지 상세한 시작 안내 ↗','https://github.com/suimmme-ops/project/blob/codex/climate-explorers/docs/TEACHER_START.md')
        st.link_button('차시별 발문·활동·평가 지도안 ↗','https://github.com/suimmme-ops/project/blob/codex/climate-explorers/docs/LESSON_PLAN.md')
    if not TEACHER:
        st.info('실제 학급은 사전에 등록된 교사 Google 계정으로만 확인할 수 있습니다.')
        if S.demo:
            st.caption('아래는 화면 기능 확인을 위한 가상 예시입니다. 실제 학생 데이터가 아닙니다.')
            demo=[{'학습 이름':'예시 01','제출 상태':'제출 완료','미래 예측':'강력한 감축 경로의 2050년 무렵 기온 상승은 1.6℃이다. 무더운 날 학교에서 활동하는 시간이 달라질 수 있다.'},{'학습 이름':'예시 02','제출 상태':'작성 중','미래 예측':''}]
            if S.demo_submitted:demo.append({'학습 이름':'나의 체험 기록','제출 상태':'체험 제출','미래 예측':S.notes.get('future_text','')})
            st.dataframe(pd.DataFrame(demo),hide_index=True,width='stretch')
        st.stop()
    try:classes=STORE.classes(USER)
    except Exception:st.error('학급 목록을 불러오지 못했습니다. Firebase 연결을 확인해 주세요.');st.stop()
    with st.expander('＋ 새 학급 만들기',expanded=not classes):
        with st.form('create_class'):
            t=st.text_input('학급 이름',placeholder='예: 6학년 2반 기후 탐험대',max_chars=60)
            if st.form_submit_button('학급 생성',type='primary'):
                try:
                    cid,code=STORE.create_class(USER,t);S.new_code=(t,code);st.rerun()
                except (ValueError,AccessDenied) as e:st.warning(str(e))
                except Exception:st.error('학급을 만들지 못했습니다. Firebase 연결을 확인해 주세요.')
    if S.get('new_code'):st.success(f"{S.new_code[0]}의 참여 코드: {S.new_code[1]} · 지금 따로 기록해 주세요. 코드는 서버에 해시로만 보관됩니다.")
    if not classes:st.stop()
    selected=st.selectbox('담당 학급',classes,format_func=lambda c:c['title']);cid=selected['id']
    if st.button('제출 현황 새로고침'):st.rerun()
    try:rows=STORE.submissions(USER,cid)
    except Exception:st.error('제출 현황을 불러오지 못했습니다.');st.stop()
    a,b,c=st.columns(3);a.metric('참여 학생',len(rows));b.metric('제출 완료',sum(r.get('status')=='submitted' for r in rows));c.metric('작성 중·미작성',sum(r.get('status')!='submitted' for r in rows))
    only=st.checkbox('제출 완료만 보기')
    filtered=[r for r in rows if not only or r.get('status')=='submitted']
    table=[{'학습 이름':r['alias'],'상태':'제출 완료' if r.get('status')=='submitted' else '작성 중' if r.get('answers') else '미작성','근거 수':len(r.get('evidence',[])),'제출 시간':r['submitted_at'].astimezone(ZoneInfo('Asia/Seoul')).strftime('%m/%d %H:%M') if r.get('submitted_at') else '—'} for r in filtered]
    if table:st.dataframe(pd.DataFrame(table),hide_index=True,width='stretch')
    else:st.info('아직 표시할 기록이 없습니다.')
    def safe_csv(v):
        v=str(v or '')
        return "'"+v if v.lstrip().startswith(('=','+','-','@','\t','\r')) else v
    export=[]
    for r in filtered:
        snapshot=r.get('submission',{});answers=snapshot.get('answers',r.get('answers',{}))
        export.append({'학습 이름':safe_csv(r['alias']),'제출 여부':r.get('status','draft'),'미래 예상':safe_csv(answers.get('future_text','')),'불확실한 점':safe_csv(answers.get('future_uncertainty','')),'근거':safe_csv('\n'.join(snapshot.get('evidence',r.get('evidence',[])))),'피드백':safe_csv(r.get('feedback','')),**{QUESTION_LABELS.get(k,k):safe_csv(v) for k,v in answers.items()}})
    if export:st.download_button('전체 학습 기록 CSV 내려받기',pd.DataFrame(export).to_csv(index=False).encode('utf-8-sig'),'우리반_기후탐구.csv','text/csv')
    if filtered:
        r=st.selectbox('학생 기록 펼쳐보기',filtered,format_func=lambda r:r['alias'])
        submitted=r.get('submission',{})
        st.caption('마지막 제출본을 표시합니다. 아직 제출하지 않은 학생은 저장된 초안을 표시합니다.')
        for e in submitted.get('evidence',r.get('evidence',[])):st.info(e)
        for k,v in submitted.get('answers',r.get('answers',{})).items():
            if v:st.markdown('**'+QUESTION_LABELS.get(k,k)+'**');st.write(v)
        with st.form('feedback_'+r['uid']):
            feedback=st.text_area('학생에게 전할 피드백',value=r.get('feedback',''),max_chars=6000)
            if st.form_submit_button('피드백 저장'):
                try:STORE.feedback(USER,cid,r['uid'],feedback);st.success('피드백을 저장했습니다.')
                except Exception:st.error('피드백을 저장하지 못했습니다.')
    st.stop()

if utility=='자료와 출처':
    st.title('자료와 출처')
    st.write('앱에 포함된 파일은 수업용 고정 스냅샷입니다. 그래프마다 단위·기준·관측과 전망의 차이를 표시합니다.')
    st.markdown((ROOT/'docs/SOURCES.md').read_text())
    for filename in ['temperature.csv','emissions.csv']:
        st.download_button(filename+' 내려받기',(ROOT/'data'/filename).read_bytes(),filename,'text/csv',key=filename)
    st.stop()

if page==CHAPTERS[0]:
    title('CHAPTER 01 · OBSERVE','지구가 보내는 신호,<br>우리는 듣고 있을까?','홍수, 폭염, 산불. 달라지는 자연의 모습에서 사람들의 생활로 이어지는 연결 고리를 찾아보세요.')
    tag('01 / 현실에서 발견하기')
    st.subheader('멀리 있는 이야기일까요?')
    st.markdown(feature_cards([
        ('rain','OBSERVE 01 · 홍수','물에 잠긴 일상','따뜻한 공기는 더 많은 수증기를 머금을 수 있어요. 강한 비는 지형과 배수 시설에 따라 큰 피해로 이어질 수 있어요.'),
        ('sun','OBSERVE 02 · 폭염','뜨거워진 운동장','극심한 더위가 더 자주, 강하게 나타나면 야외에서 일하거나 뛰어노는 사람들의 생활은 어떻게 달라질까요?'),
        ('forest','OBSERVE 03 · 산불','메마른 숲의 경고','덥고 건조한 조건은 산불 위험을 키울 수 있어요. 불씨, 바람, 숲 관리 등 여러 요인도 함께 살펴야 해요.')
    ]),unsafe_allow_html=True)
    friend('사진과 이야기를 읽으며 관찰한 사실과 내 해석을 나눠 보자. 한 번의 사건보다 오랜 기록이 더 많은 단서를 알려 줘.')
    callout('탐험가의 약속 · 한 번의 재난만으로 기후변화를 판단하지 않아요. 오랜 기록과 여러 자료를 함께 확인해요.')
    with st.expander('현실 사례를 원문 자료와 연결하기'):
        st.markdown('- [NASA: 2022년 파키스탄 홍수 위성사진](https://earthobservatory.nasa.gov/images/150279/devastating-floods-in-pakistan)\n- [WMO: 유럽 기후 현황 2023](https://wmo.int/publication-series/european-state-of-climate-2023)\n- [기존 수업 웹사이트](https://climate-action-project.netlify.app/)')
        st.caption('사건의 피해는 기후뿐 아니라 시설, 지형, 인구, 대비 수준에도 영향을 받아요.')
    mission('한 가지 현상을, 누군가의 생활과 연결하기','홍수·폭염·산불 중 하나를 골라 어떤 변화가 누구에게 영향을 주는지 설명해 보세요.')
    tag('02 / 나의 첫 번째 생각')
    note('c1_flood','지구가 따뜻해지면 왜 강한 비와 홍수가 늘어날 수 있을까요?','기온 → 수증기 → 강한 비의 흐름으로 설명해 보세요.')
    note('c1_heat','폭염과 산불은 어떤 변화와 연결되어 있을까요?')
    note('c1_connection','기후변화는 누구의 생활에 영향을 줄까요?','학생, 농부, 야외 노동자, 섬 주민 중 한 사람을 떠올려 구체적으로 적어 보세요.')
    st.caption('다음 탐험에서는 실제 기온 기록을 움직이며 내 생각을 확인해요. 왼쪽에서 02장을 선택하세요.')

elif page==CHAPTERS[1]:
    title('CHAPTER 02 · INVESTIGATE','숫자 속에 숨은<br>기후의 단서를 찾아라.','시간을 움직이고, 나라를 비교하고, 수치가 담긴 문장으로 설명해 보세요. 데이터가 나의 생각을 뒷받침하는 근거가 됩니다.')
    friend('수치를 읽을 땐 세 가지를 확인해! 언제의 자료인지, 단위가 무엇인지, 무엇과 비교하는지.')
    step=st.segmented_control('학습지 탐구 단계',['STEP 1 기온','STEP 2 원인','STEP 3 1인당','STEP 4 국가 전체'],default='STEP 1 기온',key='step') or 'STEP 1 기온'
    if step=='STEP 1 기온':
        tag('STEP 01 / 점점 더 뜨거워지는 지구')
        st.subheader('176년의 기록을 내 손으로')
        with st.container(border=True):
            year=st.slider('시간 탐험 슬라이더 · 관찰할 연도',1850,2025,2024,key='temp_year')
            mode=st.radio('그래프 표현',['연도별 기온 차이','10년 이동평균'],horizontal=True,key='temp_mode')
            row=TEMP[TEMP.year==year].iloc[0];val=row.rolling10 if mode=='10년 이동평균' else row.anomaly
            a,b,c=st.columns(3);a.metric('선택한 연도',f'{year}년');b.metric('기온 차이' if mode!='10년 이동평균' else '직전 10년 평균','자료 부족' if pd.isna(val) else f'{val:+.2f}℃');c.metric('비교 기준','1850–1900')
            chart(temperature_chart(TEMP,year,mode),'temperature')
            st.caption('회색은 전체 기록, 초록색은 선택 연도까지의 기록이에요. 세로축은 지구의 절대온도가 아닌 기준 기간과의 차이예요. 이동평균은 선택 연도까지의 10개 연도 평균이며 1859년부터 표시해요.')
            if not pd.isna(val):pin(f'HadCRUT5 · {year}년 {mode}: 1850–1900 대비 {val:+.2f}℃','pin_temp')
        source('Met Office / UEA CRU · HadCRUT5 5.1.0.0','https://www.metoffice.gov.uk/hadobs/hadcrut5/','첨부 HTML의 1850–2025 고정 데이터 · 기준 환산값 포함')
        callout('한 해의 기온은 오르내려요. 장기 변화는 여러 해의 평균을 함께 살펴야 해요. 2024년의 한 해 수치만으로 파리협정의 장기 목표 초과를 판단할 수 없어요.')
        with st.expander('추가 탐구 · 인간의 온실가스가 만든 온난화'):
            w=CO2[(CO2.country=='World') & CO2.temperature_change_from_ghg.notna()]
            y=st.slider('온실가스 기여도를 살펴볼 연도',int(w.year.min()),int(w.year.max()),2024,key='attribution_year')
            f=go.Figure(go.Scatter(x=w[w.year<=y].year,y=w[w.year<=y].temperature_change_from_ghg,line=dict(color='#D65338',width=3),name='온실가스의 기온 상승 기여도'))
            chart(base(f,'산업화 이전 대비 추정 기여도 (℃)',[int(w.year.min()),2026],[0,2]),'attribution')
            st.caption('이 그래프는 관측 기온 자체가 아니라 인간이 배출한 온실가스의 온난화 기여도 추정이에요. 에어로졸의 냉각 효과 등은 포함하지 않으므로 위 관측값과 같지 않아요.')
            pin(f"OWID · {y}년 인간 배출 온실가스의 온난화 기여도 추정: {w[w.year==y].temperature_change_from_ghg.iloc[0]:.2f}℃",'pin_attribution')
            source('OWID CO₂ and Greenhouse Gas Emissions','https://ourworldindata.org/co2-and-greenhouse-gas-emissions?insight=human-greenhouse-gas-emissions-have-increased-global-average-temperatures#key-insights')
        note('s1_when','① 기온이 빠르게 상승하기 시작한 시기는 언제쯤인가요? 근거도 적어 보세요.','예: ____년과 ____년을 비교하면 ____℃에서 ____℃로 변했어요.')
        note('s1_life','② 그 시기 사람들의 생활과 물건 생산 방식은 어떻게 바뀌었을까요?','자료를 더 찾아 공장, 교통, 에너지의 변화와 연결해 보세요.')
        note('s1_industry','③ 석탄·석유 사용과 기계 생산이 늘어난 사회 변화를 무엇이라고 부르나요?',height=80)
    elif step=='STEP 2 원인':
        tag('STEP 02 / 지구는 왜 뜨거워지고 있을까?')
        st.subheader('필요한 온실효과, 강해지면 어떨까요?')
        stage=st.select_slider('대기의 상태를 움직여 비교해 보세요',options=['온실가스가 없다면','자연적인 온실효과','온실효과가 강해지면'],value='자연적인 온실효과')
        states={'온실가스가 없다면':(1,'열이 우주로 더 쉽게 빠져나가요.','지구는 현재보다 훨씬 추워져 지금과 같은 생명체가 살아가기 어려워요.'),'자연적인 온실효과':(7,'일부 열은 우주로 나가고, 일부는 대기와 지표 사이를 오가요.','자연적인 온실효과는 지구를 생명체가 살 수 있는 온도로 유지하는 데 도움을 줘요.'),'온실효과가 강해지면':(16,'같은 지표 온도에서 우주로 빠져나가는 열이 줄어요.','온실가스가 늘면 에너지 균형이 바뀌고 지표와 하층 대기가 더 따뜻해져요.')}
        thick,text,explain=states[stage]
        st.markdown(f'<div class="greenhouse"><div>☀️ 태양 에너지 ↓</div><div class="blanket" style="border-width:{thick}px">🌏 지표와 대기<br>지구가 내보내는 열 ↑ ↘</div><strong>{text}</strong></div>',unsafe_allow_html=True)
        st.caption('개념 모형: 테두리 두께는 온실효과를 이해하기 위한 비유이며, 실제 농도나 기온을 계산한 그래프가 아니에요. 온실가스는 열의 이동을 완전히 막지 않아요.')
        callout(explain)
        st.markdown('**화석연료 → 연소 → 이산화탄소 증가 → 온실효과 강화**')
        st.write('석탄·석유·천연가스를 태우면 에너지를 얻지만 이산화탄소도 배출해요. 전기를 쓸 때에도 전기를 만드는 방식에 따라 배출량이 달라져요.')
        st.link_button('학습지의 원인 탐구 웹앱 ↗','https://6-2climate.netlify.app/')
        note('s2_blanket','① 온실가스를 지구를 덮어 주는 무엇에 비유할 수 있을까요?',height=80)
        note('s2_effect','② 온실가스가 전혀 없다면 지구는 어떻게 될까요?')
        note('s2_fuels','③ 화석연료 두 가지와, 연료를 태울 때 나오는 기체를 적어 보세요.')
        note('s2_activities','④ 온실가스를 배출하는 생활 속 활동을 3가지 이상 적어 보세요.')
        note('s2_more','⑤ 이산화탄소가 많아지면 왜 지구가 더워질까요?','‘모든 열이 갇힌다’가 아니라 열의 이동과 에너지 균형으로 설명해 보세요.')
    elif step=='STEP 3 1인당':
        tag('STEP 03 / 우리는 얼마나 많은 CO₂를 배출하고 있을까?')
        st.subheader('같은 한 사람, 다른 배출량')
        with st.container(border=True):
            year=st.slider('비교할 연도',1750,2024,2024,key='percap_year')
            codes=st.multiselect('비교할 나라 · 최대 6개',list(COUNTRIES),default=['KOR','GBR'],format_func=lambda x:COUNTRIES[x],max_selections=6)
            if codes:
                for c,col in zip(codes,st.columns(len(codes))):
                    v=observation(CO2,c,year,'co2_per_capita');col.metric(COUNTRIES[c],'자료 없음' if v is None else f'{v:.2f}톤')
                chart(countries_chart(CO2,codes,year),'percap')
                values=[f'{COUNTRIES[c]} '+(f'{v:.2f}톤/명/년' if (v:=observation(CO2,c,year,'co2_per_capita')) is not None else '자료 없음') for c in codes]
                pin('OWID · '+str(year)+'년 1인당 화석연료·산업 CO₂: '+', '.join(values),'pin_percap')
            else:st.info('비교할 나라를 하나 이상 선택해 주세요.')
        st.caption('생산 기준의 화석연료·산업 CO₂ 배출량 ÷ 인구. 토지 이용 변화는 제외해요. 자료가 없는 연도는 0이 아니에요. 국가 전체 온실가스와는 다른 지표예요. 그래프의 세로축은 연도를 움직여도 고정돼요.')
        source('OWID CO₂ data · Global Carbon Budget','https://ourworldindata.org/grapher/co-emissions-per-capita?time=1750..2024&facet=none&country=KOR~GBR','1750–2024, 2026-10-19 다운로드')
        v=observation(CO2,'KOR',year,'co2_per_capita')
        if v is not None:
            higher=country_ranking(CO2,year,'co2_per_capita');higher=higher[higher.co2_per_capita>v]
            with st.expander('더 탐구하기 · 대한민국보다 1인당 배출량이 높은 나라는?'):
                display=higher[['country','co2_per_capita']].rename(columns={'country':'국가','co2_per_capita':'톤/명/년'})
                st.dataframe(display,hide_index=True,width='stretch')
        note('s3_values','① 2024년 대한민국과 영국의 1인당 CO₂ 배출량을 적어 보세요.','비교 연도를 2024년으로 움직여 확인하세요.')
        note('s3_higher','② 대한민국보다 1인당 배출량이 많은 나라 3개를 찾아 적어 보세요.','어느 연도의 자료인지도 적어 주세요.')
        note('s3_thought','③ 두 나라의 배출량 변화를 보고 어떤 생각이 드나요?','수치를 근거로 쓰고, 자료만으로 알 수 없는 점도 구별해 보세요.')
    else:
        tag('STEP 04 / 누가 누가 더 많이 내뿜을까?')
        st.subheader('이번에는 나라 전체를 비교해요')
        st.caption('1인당 CO₂와 국가 전체 온실가스는 비교 기준이 달라요. 국가 전체는 인구와 산업 규모 등도 함께 생각해야 해요.')
        energy_path=ROOT/'data/energy_ghg.csv'
        if energy_path.exists():
            from climate_app.energy import render_energy
            render_energy(st,pin,note,chart,source)
        else:
            callout('한국에너지공단 원문 표를 아직 내려받지 못해, 아래에는 OWID의 별도 자료를 제공합니다. 자료원과 포함 범위가 달라 학습지의 2020년 순위와 일치하지 않을 수 있어요.',True)
            year=st.slider('국가 전체 온실가스 배출량 비교 연도',1990,2024,2020,key='ghg_year')
            d=country_ranking(CO2,year,'total_ghg');top=d.head(10).copy();top['label']=top.iso_code.map(COUNTRIES).fillna(top.country)
            fig=go.Figure(go.Bar(x=top.total_ghg/1000,y=top.label,orientation='h',marker_color=['#087F75' if c=='KOR' else '#88B9A2' for c in top.iso_code],text=[f'{v/1000:.2f}' for v in top.total_ghg],textposition='outside',hovertemplate='%{y}: %{x:.2f} 십억 톤<extra></extra>'))
            fig=base(fig,'국가',None,None);fig.update_xaxes(title='온실가스 (십억 톤 CO₂eq/년)',tickformat='.1f');fig.update_yaxes(autorange='reversed');chart(fig,'total_ghg')
            korea=d[d.iso_code=='KOR'];rank=int(korea.index[0])+1 if not korea.empty else None
            st.metric(f'{year}년 대한민국 순위',f'{rank}위' if rank else '자료 없음')
            st.caption('OWID total_ghg: 토지 이용 변화를 포함한 전체 온실가스, CO₂ 환산. 출처의 방법론에 따라 음의 배출도 있을 수 있어요. 국가 집계 중 자료가 있는 국가를 대상으로 계산한 순위예요.')
            pin(f'OWID · {year}년 전체 온실가스 상위 3개국: '+', '.join(top.label.head(3))+f'; 대한민국 {rank}위 (토지 이용 포함)','pin_ghg')
            source('OWID CO₂ data · 국가 전체 온실가스','https://github.com/owid/co2-data','한국에너지공단 표의 대체 자료임을 명시')
            st.link_button('학습지 원자료 · 한국에너지공단 ↗','https://tips.energy.or.kr/statistics/statistics_view0909.do')
            with st.expander('전체 국가 순위와 변화 살펴보기'):
                ranking=d[['country','iso_code','total_ghg']].copy();ranking.insert(0,'순위',range(1,len(ranking)+1));ranking['국가']=ranking.iso_code.map(COUNTRIES).fillna(ranking.country)
                st.dataframe(ranking[['순위','국가','total_ghg']].rename(columns={'total_ghg':'백만 톤 CO₂eq'}),hide_index=True,width='stretch')
            st.subheader('2010년에서 2023년, 어떻게 달라졌을까요?')
            selected=st.multiselect('전체 배출량 추이를 비교할 나라',list(COUNTRIES),default=['KOR','USA','GBR'],format_func=lambda x:COUNTRIES[x],max_selections=6,key='total_countries')
            if selected:
                chart(countries_chart(CO2,selected,year,'total_ghg'),'ghg_trend')
                comparison=[]
                for code in selected:
                    start=observation(CO2,code,2010,'total_ghg');end=observation(CO2,code,2023,'total_ghg')
                    comparison.append({'국가':COUNTRIES[code],'2010년':start,'2023년':end,'변화(백만 톤)':None if start is None or end is None else end-start})
                st.caption('아래 표는 2010·2023년 고정 비교예요. 위 그래프는 같은 연도 슬라이더로 움직여요. 표의 음수는 배출 감소를 뜻해요.')
                st.dataframe(pd.DataFrame(comparison).round(2),hide_index=True,width='stretch')
                pin('OWID 전체 온실가스 2010→2023 (백만 톤 CO₂eq): '+ '; '.join(f"{r['국가']} {r['2010년']:.2f}→{r['2023년']:.2f}" for r in comparison if r['2010년'] is not None and r['2023년'] is not None),'pin_total_compare')
            note('s4_rank','① 선택 연도 전체 배출량 상위 3개국과 대한민국 순위를 적어 보세요.','사용한 자료원·연도·포함 범위를 함께 적어요.')
            note('s4_change','② 2010년과 2023년을 비교해 배출량을 줄인 나라를 찾고, 그 나라의 감축 노력을 조사해 보세요.','연도 슬라이더를 움직여 수치를 비교하세요. 정책의 효과는 그래프만으로 단정하지 않아요.')
    st.button('☁ 여기까지 저장하기',on_click=save,key='save_ch2')

elif page==CHAPTERS[2]:
    title('CHAPTER 03 · CONNECT','작은 숫자 1.5℃,<br>커다란 삶의 차이.','매일의 날씨와 전 지구 평균 기온은 다릅니다. 지구의 에너지와 생활의 변화를 연결해 보세요.')
    callout('1.5℃는 절벽처럼 안전과 위험을 나누는 선이 아니에요. 이미 피해는 나타나고 있으며, 온난화를 조금이라도 줄일 때마다 위험을 줄일 수 있어요.')
    friend('오늘의 날씨와 오랜 기간의 기후는 달라. 작은 평균 변화가 생활에 어떤 차이를 만드는지 함께 살펴보자.')
    tag('01 / 1℃의 진짜 의미')
    a,b=st.columns(2)
    with a:
        with st.container(border=True):st.subheader('🌡️ 오늘의 날씨');st.write('우리 동네 낮 기온이 어제보다 1℃ 높아졌어요. 특정 장소와 짧은 시간의 변화예요.')
    with b:
        with st.container(border=True):st.subheader('🌏 전 지구 평균');st.write('바다·육지·대기 여러 곳의 기온을 넓게 평균한 값이 높아졌어요. 기후 체계가 더 많은 에너지를 가진다는 뜻이에요.')
    tag('02 / 숫자를 움직여 위험 비교하기')
    with st.container(border=True):
        warming=st.select_slider('전 지구 온난화 수준 · 1850–1900 대비',options=[1.0,1.5,2.0,4.0],value=1.5,format_func=lambda x:f'+{x:.1f}℃')
        freq={1.0:2.8,1.5:4.1,2.0:5.6,4.0:9.4}[warming]
        a,b=st.columns([1,2])
        with a:st.metric('10년에 한 번이던 극한 고온',f'{freq:.1f}번 / 10년');st.caption('산업화 이전에 육지에서 10년에 한 번이던 고온 현상의 빈도 · 중심 추정값')
        with b:
            f=go.Figure(go.Bar(x=['산업화 이전',f'+{warming:.1f}℃'],y=[1,freq],marker_color=['#CFDDD3','#D65338'],text=['1.0번',f'{freq}번'],textposition='outside',hovertemplate='%{y:.1f}번 / 10년<extra></extra>'))
            chart(base(f,'10년 동안 발생 횟수',None,[0,11]),'heat_frequency')
        pin(f'IPCC AR6 SPM.6 · +{warming:.1f}℃에서 산업화 이전 10년 빈도 극한 고온은 약 {freq:.1f}번/10년 (중심 추정)','pin_heat')
        st.caption('특정 도시의 폭염 일수를 예측한 값이 아니에요. 전 세계 육지의 극한 고온 통계이며, 전망 불확실성 범위는 여기서 생략했어요. 슬라이더의 네 지점은 IPCC 표에 제시된 수준만 사용해요.')
    source('IPCC AR6 WGI · 그림 SPM.6','https://www.ipcc.ch/report/ar6/wg1/figures/summary-for-policymakers/figure-spm-6/')
    with st.expander('눈과 얼음이 줄어들면, 왜 온난화가 더 강해질까요?',expanded=True):
        st.write('밝은 눈과 얼음은 햇빛을 많이 반사해요. 눈과 얼음이 줄어 어두운 바다나 땅이 드러나면 더 많은 햇빛을 흡수해요. 이 변화가 다시 온난화를 키울 수 있어요. 이를 ‘양의 되먹임’이라고 해요.')
    note('c3_mean','① ‘전 지구 평균 기온이 1℃ 올랐다’는 말은 무슨 뜻일까요?')
    note('c3_season','② 봄·여름·가을·겨울의 모습은 어떻게 달라질 수 있을까요?','우리 지역의 실제 변화는 다른 지역과 다를 수 있다는 점도 생각해 보세요.')
    note('c3_feedback','③ 얼음이 녹으면 지구가 더 따뜻해질 수 있는 이유를 설명해 보세요.')
    note('c3_limit','④ 과학자들은 왜 온난화를 1.5℃ 수준으로 제한하려고 할까요?','그래프에서 비교한 수치를 한 가지 이상 활용해 보세요.')
    note('c3_concern','⑤ 가장 걱정되는 변화와 그 이유를 적어 보세요.','폭염·홍수·가뭄·해수면·생태계 중 하나를 골라도 좋아요.')
    st.button('☁ 여기까지 저장하기',on_click=save,key='save_ch3')

else:
    title('CHAPTER 04 · IMAGINE','2050년의 하루,<br>어떤 미래를 쓸까요?','미래는 한 가지로 정해져 있지 않아요. 배출 경로를 비교하고, 근거가 담긴 미래 이야기를 완성해 보세요.')
    friend('미래 기자가 되어 볼까? 자료가 알려 주는 사실과 네가 상상한 생활 모습을 구분하면 더 설득력 있는 이야기가 돼.')
    note('future_before','자료를 보기 전, 내가 상상한 2050년은 어떤 모습인가요?',height=100)
    tag('01 / 같은 지구, 세 가지 갈림길')
    with st.container(border=True):
        scenario=st.segmented_control('살펴볼 배출 경로',list(SCENARIOS),default='강력한 감축',key='scenario') or '강력한 감축'
        year=st.slider('미래를 탐험할 연도 · 기간 사이 값은 교육용 보간',2030,2090,2050,key='future_year')
        v,lo,hi=scenario_at(scenario,year)
        a,b,c=st.columns(3);a.metric('선택한 미래',f'{year}년 무렵');b.metric('기온 상승 중심 추정',f'+{v:.2f}℃');c.metric('매우 가능성 높은 범위',f'{lo:.2f}–{hi:.2f}℃')
        st.caption(SCENARIOS[scenario]['id']+' · '+SCENARIOS[scenario]['story'])
        chart(future_chart(scenario,year),'future')
        if year in PERIODS:st.caption(f'{year}년 지점은 {PERIODS[year]}의 20년 기간 평균을 대표해요. 특정 한 해의 예보가 아니에요.')
        else:st.caption('현재 값은 공식 기간 평균 사이를 직선으로 이어 계산한 교육용 보간이에요. 공식 연도별 전망이 아니에요.')
        st.caption('점: 2021–2040 / 2041–2060 / 2081–2100 기간 평균. 선과 음영의 중간 값: 교육용 선형 보간. 음영: 선택 경로의 매우 가능성 높은 범위(90% 이상). 시나리오는 발생 확률 순위가 아니에요.')
        pin(f'IPCC AR6 표 SPM.1 · {SCENARIOS[scenario]["id"]} {year}년 무렵: +{v:.2f}℃ (범위 {lo:.2f}–{hi:.2f}℃); '+(PERIODS[year]+' 기간 평균' if year in PERIODS else '교육용 보간'),'pin_future')
    source('IPCC AR6 WGI (2021) · 표 SPM.1','https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/')
    st.subheader('🍎 2050년, 우리가 살게 될 세상')
    st.markdown(feature_cards([
        ('apple','FUTURE 01 · 먹거리','미래의 식탁','기온과 강수 변화는 작물 재배와 수확에 영향을 줄 수 있어요. 사과를 기르는 지역과 먹거리 가격은 어떻게 달라질까요?'),
        ('school','FUTURE 02 · 일상','학교에서 보내는 하루','등하교, 운동장 활동, 냉방과 전력 사용을 떠올려 보세요. 사람들은 더운 날의 생활에 어떻게 적응할까요?'),
        ('ocean','FUTURE 03 · 이웃','바다와 함께 살아가기','해안 마을과 생물의 서식지를 생각해 보세요. 변화하는 환경 속에서 누구에게 어떤 도움이 더 필요할까요?')
    ]),unsafe_allow_html=True)
    callout('이야기의 주인공은 여러분이에요. ‘자료로 확인한 사실’과 ‘내가 예상한 생활 모습’을 구분해서 써 보세요. 특정 시나리오만으로 2050년 우리 동네의 정확한 날씨나 사과 생산량을 알 수는 없어요.')
    mission('2050년의 하루를, 근거가 있는 이야기로','선택한 시나리오의 수치 한 가지와 생활의 변화를 연결하고, 확실하지 않은 점도 함께 써 보세요.')
    tag('02 / 미래 기자가 되어 글쓰기')
    st.write('**미션:** 한 가지 배출 경로를 골라 2050년의 하루를 써 보세요. 자료의 수치, 생활의 변화, 그 이유, 우리가 할 수 있는 일을 담아 주세요.')
    future_choice=st.selectbox('내 글의 배출 시나리오',list(SCENARIOS),index=list(SCENARIOS).index(S.notes.get('future_scenario','강력한 감축')) if S.notes.get('future_scenario') in SCENARIOS else 0)
    S.notes['future_scenario']=future_choice
    st.caption('제출용 자료를 담으려면 위 슬라이더를 2050년으로 맞춘 뒤 해당 경로의 ‘근거 담기’를 눌러 보세요.')
    if S.evidence:
        with st.expander(f'내가 모은 자료 근거 {len(S.evidence)}개',expanded=True):
            for e in S.evidence:st.markdown(f'<div class="evidence">{esc(e)}</div>',unsafe_allow_html=True)
    else:st.info('그래프에서 자료 근거를 1개 이상 담아 주세요.')
    note('future_text','2050년, 우리가 살게 될 세상 · 80자 이상','예: 나는 2050년의 초등학교 선생님이다. 내가 선택한 ____ 경로에서 2050년 무렵 기온 상승은 ____℃로 전망된다. 그래서 우리 학교에서는…',height=250)
    st.caption(f"현재 {len(S.notes.get('future_text','').strip())}자 · 자료의 수치와 예상한 생활 모습을 연결해 보세요.")
    note('future_uncertainty','내 예상에서 확실하지 않은 점은 무엇인가요?','지역의 정책, 새로운 기술, 실제 강수량처럼 이 자료만으로 알 수 없는 점을 적어 보세요.',height=100)
    note('future_action','이 미래를 위해 우리가 지금 할 수 있는 일은 무엇일까요?',height=100)
    note('reflection_learn','탐험을 마치며 · 새롭게 알게 된 점',height=100)
    note('reflection_feel','탐험을 마치며 · 느낀 점',height=100)
    ok=len(S.notes.get('future_text','').strip())>=80 and bool(S.evidence) and bool(S.notes.get('future_uncertainty','').strip())
    a,b=st.columns(2)
    a.button('☁ 초안 저장하기',on_click=save,width='stretch')
    if b.button('선생님께 제출하기 →' if not S.demo else '체험 제출하기 →',type='primary',disabled=not ok,width='stretch'):save(True)
    if not ok:st.caption('제출하려면 예상 글 80자 이상, 근거 1개 이상, 확실하지 않은 점을 작성해 주세요.')
    st.download_button('내 기록 먼저 내려받기',notebook_html().encode(),'나의_기후_탐구노트.html','text/html')

st.markdown('<div class="footer">기후 탐험대 🌱 · 작은 발견을 키워, 더 나은 내일로. &nbsp; 데이터와 출처는 왼쪽 메뉴에서 확인하세요.</div>',unsafe_allow_html=True)
