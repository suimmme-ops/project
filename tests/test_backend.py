import pytest
from climate_app.backend import Store,AccessDenied,Identity,identity_from_claims,code_hash,validate_answers
from climate_app.data import temperature,emissions,observation,scenario_at,country_ranking

class Snapshot:
    def __init__(self,d):self.data=d;self.exists=d is not None
    def to_dict(self):return self.data
class Ref:
    def __init__(self,db,path):self.db=db;self.path=path
    def collection(self,name):return Collection(self.db,self.path+'/'+name)
    def get(self):return Snapshot(self.db.data.get(self.path))
    def set(self,d,merge=False):
        self.db.data[self.path]={**self.db.data.get(self.path,{}),**d} if merge else d
class Collection:
    def __init__(self,db,path):self.db=db;self.path=path
    def document(self,name=None):return Ref(self.db,self.path+'/'+(name or 'generated'))
class FakeDB:
    def __init__(self):self.data={}
    def collection(self,name):return Collection(self,name)

TEACHER=Identity('teacher','teacher@school.kr','teacher',True)
OTHER=Identity('other','other@school.kr','other',True)
STUDENT=Identity('student','student@school.kr','student',True)

def test_identity_requires_verified_google_claims():
    for claims in [{},{'sub':'x','email':'x@y','email_verified':False},{'sub':'x','email':'x@y','email_verified':'true'}]:
        with pytest.raises(AccessDenied):identity_from_claims(claims)
    user=identity_from_claims({'sub':'google123','email':'TEST@SCHOOL.KR','email_verified':True})
    assert user.email=='test@school.kr' and len(user.uid)==64
    assert code_hash(' aabbccdd ')==code_hash('AABBCCDD')

def test_student_and_other_teacher_cannot_access_class():
    db=FakeDB();store=Store(db,['teacher@school.kr','other@school.kr'])
    db.data['classes/class1']={'owner_uid':'teacher','title':'class1'}
    for user in [OTHER,STUDENT]:
        with pytest.raises(AccessDenied):store.submissions(user,'class1')
    with pytest.raises(AccessDenied):store.save(STUDENT,'class1',{},[])
    with pytest.raises(AccessDenied):store.create_class(STUDENT,'bad')

def test_save_submission_and_draft_keep_last_submission():
    db=FakeDB();store=Store(db,[])
    db.data['classes/c/members/student']={'alias':'05번'}
    answers={'future_text':'미래의 학교에서 변화하는 삶과 우리가 적응하는 방법을 상상합니다. '*5,'future_uncertainty':'지역 정책은 알 수 없습니다.'}
    with pytest.raises(ValueError):store.save(STUDENT,'c',{'future_text':'짧음'},[],True)
    store.save(STUDENT,'c',answers,['IPCC 2050 1.6℃'],True)
    first=db.data['classes/c/work/student']['submission']
    store.save(STUDENT,'c',{'future_text':'수정 중'},[],False)
    result=db.data['classes/c/work/student']
    assert result['submission']==first and result['status']=='submitted'
    assert result['answers']['future_text']=='수정 중'
    assert 'email' not in result

def test_payload_limits():
    with pytest.raises(ValueError):validate_answers({'x':'a'*6001})

def test_real_data_and_interpolation():
    temp=temperature();assert len(temp)==176
    assert abs(temp[temp.year.between(1850,1900)].anomaly.mean())<.001
    assert temp.iloc[:9].rolling10.isna().all()
    assert temp[temp.year==2024].anomaly.iloc[0]==1.5264
    df=emissions()
    assert observation(df,'KOR',1750,'co2_per_capita') is None
    assert abs(observation(df,'KOR',2024,'co2_per_capita')-11.286)<.001
    ranking=country_ranking(df,2024,'co2_per_capita')
    assert ranking.iso_code.str.fullmatch('[A-Z]{3}').all()
    assert scenario_at('강력한 감축',2050)==(1.6,1.2,2.0)
    assert scenario_at('매우 높은 배출',2090)==(4.4,3.3,5.7)
    assert abs(scenario_at('중간 배출',2040)[0]-1.75)<.0001
