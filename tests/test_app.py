from streamlit.testing.v1 import AppTest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def test_student_journey():
    at=AppTest.from_file(str(ROOT/'streamlit_app.py'),default_timeout=30).run()
    assert not at.exception
    next(b for b in at.button if '먼저 둘러보기' in b.label).click().run()
    assert not at.exception
    at.radio(key='chapter_nav').set_value('02  데이터로 분석하기').run()
    assert not at.exception
    at.slider(key='temp_year').set_value(1900).run()
    assert not at.exception
    next(b for b in at.button if b.key=='pin_temp').click().run()
    assert len(at.session_state['evidence'])==1
    at.text_area(key='answer_s1_when').set_value('1900년과 2024년을 비교하면 기온 차이가 크게 늘었다.').run()
    for step in ['STEP 2 원인','STEP 3 1인당','STEP 4 국가 전체']:
        at.segmented_control(key='step').set_value(step).run()
        assert not at.exception
    at.radio(key='chapter_nav').set_value('03  1.5℃, 생존의 마지노선').run()
    assert not at.exception
    at.radio(key='chapter_nav').set_value('04  2050년, 미래 예측하기').run()
    assert not at.exception
    at.slider(key='future_year').set_value(2050).run()
    at.text_area(key='answer_future_text').set_value('2050년의 우리 학교에서는 더운 날의 생활이 달라질 수 있다. 강력한 감축 경로에서 기온 상승은 1.6도라고 한다. 운동장에서는 아침에 활동하고 그늘을 늘릴 것이다. 하지만 이것은 내 예상이며 지역별 변화는 다를 수 있다.').run()
    at.text_area(key='answer_future_uncertainty').set_value('지역의 실제 비와 학교의 적응 정책은 이 자료만으로 알 수 없다.').run()
    submit=next(b for b in at.button if b.label=='체험 제출하기 →')
    assert not submit.disabled
    submit.click().run()
    assert at.session_state['demo_submitted']
    at.radio(key='chapter_nav').set_value('02  데이터로 분석하기').run()
    at.segmented_control(key='step').set_value('STEP 1 기온').run()
    assert at.text_area(key='answer_s1_when').value.startswith('1900년')
    at.radio(key='utility').set_value('나의 탐구 노트').run()
    assert not at.exception
    at.radio(key='utility').set_value('교사 대시보드').run()
    assert not at.exception
    at.radio(key='utility').set_value('자료와 출처').run()
    assert not at.exception
