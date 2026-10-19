"""Server-side Google OIDC + Firestore. Never trust a role/class supplied by UI."""
import hashlib
import re
import secrets
from datetime import datetime, timezone
from dataclasses import dataclass

class AccessDenied(Exception):
    pass

@dataclass(frozen=True)
class Identity:
    uid: str
    email: str
    name: str
    verified: bool

def identity_from_claims(claims):
    sub = str(claims.get('sub',''))
    email = str(claims.get('email','')).strip().lower()
    verified = claims.get('email_verified') is True
    if not sub or not email or not verified:
        raise AccessDenied('이메일이 확인된 Google 계정으로 로그인해 주세요.')
    return Identity(hashlib.sha256(('google:'+sub).encode()).hexdigest(),email,str(claims.get('name','학생')),verified)

def code_hash(code):
    return hashlib.sha256(code.strip().upper().encode()).hexdigest()

def is_teacher(user, allowed):
    return user.verified and user.email in {str(e).strip().lower() for e in allowed}

def validate_answers(answers):
    if not isinstance(answers,dict) or len(answers)>60:
        raise ValueError('학습 기록 형식을 확인해 주세요.')
    if any(not isinstance(k,str) or not isinstance(v,str) or len(v)>6000 for k,v in answers.items()):
        raise ValueError('답변은 문항별 6,000자 이내로 작성해 주세요.')
    return dict(answers)

class Store:
    def __init__(self, db, allowed_teachers):
        self.db=db
        self.allowed_teachers=allowed_teachers

    def require_teacher(self,user):
        if not is_teacher(user,self.allowed_teachers):
            raise AccessDenied('등록된 교사 계정만 사용할 수 있습니다.')

    def require_owner(self,user,class_id):
        self.require_teacher(user)
        d=self.db.collection('classes').document(class_id).get().to_dict()
        if not d or d.get('owner_uid')!=user.uid:
            raise AccessDenied('담당 학급만 확인할 수 있습니다.')
        return d

    def create_class(self,user,title):
        self.require_teacher(user)
        title=title.strip()
        if not 1<=len(title)<=60: raise ValueError('학급 이름은 1~60자로 입력해 주세요.')
        ref=self.db.collection('classes').document()
        code=secrets.token_hex(4).upper()
        batch=self.db.batch()
        batch.set(ref,{'title':title,'owner_uid':user.uid,'created_at':datetime.now(timezone.utc)})
        batch.set(self.db.collection('join_codes').document(code_hash(code)),{'class_id':ref.id})
        batch.commit()
        return ref.id,code

    def classes(self,user):
        self.require_teacher(user)
        return [{'id':d.id,**d.to_dict()} for d in self.db.collection('classes').where('owner_uid','==',user.uid).stream()]

    def join(self,user,code,alias):
        if not re.fullmatch(r'[A-Fa-f0-9]{8}',code.strip()):raise ValueError('8자리 학급 코드를 확인해 주세요.')
        alias=alias.strip()
        if not 1<=len(alias)<=30:raise ValueError('학습 이름은 1~30자로 입력해 주세요.')
        d=self.db.collection('join_codes').document(code_hash(code)).get().to_dict()
        if not d:raise ValueError('학급 코드를 찾지 못했습니다. 선생님께 확인해 주세요.')
        class_id=d['class_id']; ref=self.db.collection('classes').document(class_id)
        c=ref.get().to_dict()
        if not c:raise ValueError('현재 사용할 수 없는 학급입니다.')
        ref.collection('members').document(user.uid).set({'alias':alias,'joined_at':datetime.now(timezone.utc)},merge=True)
        self.db.collection('users').document(user.uid).set({'class_id':class_id},merge=True)
        return {'id':class_id,'title':c['title'],'alias':alias}

    def current_class(self,user):
        d=self.db.collection('users').document(user.uid).get().to_dict()
        if not d:return None
        c=self.db.collection('classes').document(d['class_id']);m=c.collection('members').document(user.uid).get().to_dict();cd=c.get().to_dict()
        return {'id':c.id,'title':cd['title'],'alias':m['alias']} if m and cd else None

    def require_member(self,user,class_id):
        m=self.db.collection('classes').document(class_id).collection('members').document(user.uid).get().to_dict()
        if not m:raise AccessDenied('먼저 학급에 참여해 주세요.')
        return m

    def load(self,user,class_id):
        self.require_member(user,class_id)
        return self.db.collection('classes').document(class_id).collection('work').document(user.uid).get().to_dict() or {}

    def save(self,user,class_id,answers,evidence,submit=False):
        m=self.require_member(user,class_id)
        answers=validate_answers(answers)
        evidence=[str(e)[:1000] for e in evidence[:50]]
        if submit and (len(answers.get('future_text','').strip())<80 or not evidence or not answers.get('future_uncertainty','').strip()):
            raise ValueError('미래 예상 글 80자 이상, 자료 근거 1개 이상, 불확실한 점을 모두 작성해 주세요.')
        ref=self.db.collection('classes').document(class_id).collection('work').document(user.uid)
        data={'alias':m['alias'],'answers':answers,'evidence':evidence,'updated_at':datetime.now(timezone.utc)}
        if submit:data.update({'submitted_at':datetime.now(timezone.utc),'status':'submitted'})
        # Draft saves preserve previous submission status and feedback; a submitted snapshot stays immutable until re-submission.
        if submit:data['submission']={'answers':answers,'evidence':evidence}
        ref.set(data,merge=True)

    def submissions(self,user,class_id):
        self.require_owner(user,class_id)
        c=self.db.collection('classes').document(class_id)
        members={d.id:d.to_dict() for d in c.collection('members').stream()}
        works={d.id:d.to_dict() for d in c.collection('work').stream()}
        return [{'uid':uid,**m,**works.get(uid,{})} for uid,m in members.items()]

    def feedback(self,user,class_id,uid,text):
        self.require_owner(user,class_id)
        if len(text)>6000:raise ValueError('피드백은 6,000자 이내로 입력해 주세요.')
        ref=self.db.collection('classes').document(class_id).collection('work').document(uid)
        if not ref.get().exists:raise ValueError('학습 기록이 아직 없습니다.')
        ref.set({'feedback':text,'feedback_at':datetime.now(timezone.utc)},merge=True)
