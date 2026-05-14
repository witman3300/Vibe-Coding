import { useState, useRef, useEffect, useCallback } from "react";

const C = {
  ink:"#0C0A08", gold:"#B8860B", gold2:"#D4A017", goldLt:"#F5E6B8",
  goldDim:"rgba(184,134,11,0.10)", paper:"#F8F4ED", paper2:"#F2EDE3", paper3:"#E8E0CE",
  red:"#8B1A1A", blue:"#1A3A5C", green:"#1A4A2A",
  text:"#2A2218", muted:"#7A6A50", border:"#D4C9B0",
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ══════════════════════════════════════
   왼쪽 사이드바 메뉴 정의
   클릭 → 사용자 정보(이름·사주)를 활용해 AI가 결과 생성
══════════════════════════════════════ */
const SIDEBAR_MENUS = [
  { id:"name",    icon:"📛", label:"작명 · 회사명 추천",  sub:"사주 기반 최적 이름 분석",
    prompt: u=>`사주명리 전문가. 아래 정보로 창업자에게 최적의 회사명 3가지를 추천해줘. 반드시 한국어로, 친근하고 구체적으로 답변해.
이름:${u.name} 생년월일:${u.birth} 시간:${u.hour} 성별:${u.gender} 희망업종:${u.biz} 아이디어:${u.idea}
각 회사명마다: 이름, 한자(있으면), 의미, 사주와의 궁합 점수(100점 만점), 추천 이유를 설명해줘.` },

  { id:"logo",    icon:"🎨", label:"로고 & 브랜드 색상", sub:"사주 오행 기반 컬러 추천",
    prompt: u=>`사주명리·브랜딩 전문가. 아래 창업자의 사주 오행을 분석해서 브랜드 컬러와 로고 방향을 추천해줘. 반드시 한국어로.
이름:${u.name} 생년월일:${u.birth} 시간:${u.hour} 업종:${u.biz}
① 사주 오행 분석 (목화토금수 비율) ② 길한 메인 컬러 3가지 (HEX 코드 포함) ③ 피해야 할 색상 ④ 로고 형태·서체 방향 ⑤ 브랜드 무드를 설명해줘.` },

  { id:"taegil",  icon:"📅", label:"개업일 · 이사일 택일", sub:"길일 달력 분석",
    prompt: u=>`사주명리·택일 전문가. 아래 창업자의 사주를 분석해서 향후 3개월 내 개업·이사에 좋은 날짜와 피해야 할 날짜를 알려줘. 반드시 한국어로.
이름:${u.name} 생년월일:${u.birth} 시간:${u.hour} 업종:${u.biz} 오늘:${new Date().toLocaleDateString("ko-KR")}
① 최길일(最吉日) TOP 5 (날짜·요일·이유) ② 피해야 할 날짜 3개 ③ 택일 시 주의사항` },

  { id:"mbti",    icon:"🧠", label:"MBTI 창업가 유형",    sub:"사주로 보는 나의 사업 스타일",
    prompt: u=>`사주명리·심리학 전문가. 아래 창업자의 사주를 분석해서 MBTI 창업가 유형과 사업 스타일을 분석해줘. 반드시 한국어로.
이름:${u.name} 생년월일:${u.birth} 시간:${u.hour} 업종:${u.biz} 창업동기:${u.reason}
① 사주로 본 MBTI 추정 유형 ② 창업가로서의 강점 3가지 ③ 보완해야 할 약점 2가지 ④ 이상적인 파트너 유형 ⑤ 사업 운영 스타일 조언` },

  { id:"enneagram",icon:"🔢",label:"에니어그램 분석",     sub:"9가지 성격의 창업 전략",
    prompt: u=>`에니어그램·창업 전문가. 아래 창업자의 정보로 에니어그램 유형을 분석하고 맞춤 창업 전략을 제시해줘. 반드시 한국어로.
이름:${u.name} 생년월일:${u.birth} 업종:${u.biz} 창업동기:${u.reason} 예산:${u.budget}
① 추정 에니어그램 유형 (번호·이름) ② 핵심 동기와 두려움 ③ 창업에 유리한 점 ④ 주의할 점 ⑤ 이 유형에게 맞는 업종·사업 모델` },

  { id:"tarot",   icon:"🃏", label:"타로 창업 운세",      sub:"과거·현재·미래 3카드",
    prompt: u=>`타로·창업 전문가. 아래 창업자를 위한 타로 3카드 리딩을 해줘. 반드시 한국어로, 구체적이고 희망적으로.
이름:${u.name} 생년월일:${u.birth} 업종:${u.biz} 창업동기:${u.reason}
① 과거 카드 (제목·의미·창업 적용) ② 현재 카드 (제목·의미·지금 해야 할 일) ③ 미래 카드 (제목·의미·기대할 수 있는 것) ④ 종합 메시지` },

  { id:"jobjob",  icon:"💼", label:"직업운 · 적합 업종",  sub:"사주로 보는 나의 성공 업종",
    prompt: u=>`사주명리·직업운 전문가. 아래 창업자의 사주를 분석해서 직업운과 최적 업종을 추천해줘. 반드시 한국어로.
이름:${u.name} 생년월일:${u.birth} 시간:${u.hour} 희망업종:${u.biz}
① 직업운 총점(100점) ② 가장 잘 맞는 업종 TOP 3 (이유 포함) ③ 피해야 할 업종 ④ 성공 전성기 시기 ⑤ 지금 당장 해야 할 행동` },

  { id:"daewoon", icon:"🌙", label:"명리 대운 흐름",       sub:"10년 운세·최적 창업 타이밍",
    prompt: u=>`사주명리 전문가. 아래 창업자의 대운 흐름을 분석하고 창업 타이밍을 조언해줘. 반드시 한국어로.
이름:${u.name} 생년월일:${u.birth} 시간:${u.hour} 성별:${u.gender} 업종:${u.biz}
① 현재 대운 이름·기간·특징 ② 향후 10년 운세 흐름 ③ 창업 최적 타이밍 ④ 조심해야 할 시기 ⑤ 대운을 활용한 사업 전략` },

  { id:"today",   icon:"☀️", label:"오늘의 창업 운세",    sub:"오늘 하루 길흉 분석",
    prompt: u=>`사주명리 전문가. 아래 창업자의 오늘(${new Date().toLocaleDateString("ko-KR")}) 운세를 분석해줘. 반드시 한국어로, 실용적으로.
이름:${u.name} 생년월일:${u.birth} 시간:${u.hour} 업종:${u.biz}
① 오늘의 종합운(★ 5점 만점) ② 금전운 ③ 사업운 ④ 대인관계운 ⑤ 오늘의 행운 색·숫자·방향 ⑥ 오늘 꼭 해야 할 일 & 피해야 할 일` },

  { id:"biz_plan",icon:"📋", label:"사업계획서 초안",      sub:"AI가 작성해주는 창업 플랜",
    prompt: u=>`창업 컨설턴트. 아래 창업자의 정보로 간단한 사업계획서 초안을 작성해줘. 반드시 한국어로, 구체적으로.
이름:${u.name} 업종:${u.biz} 아이디어:${u.idea} 창업동기:${u.reason} 예산:${u.budget}
① 사업 개요 ② 핵심 제품/서비스 ③ 목표 고객 ④ 차별화 전략 ⑤ 수익 모델 ⑥ 초기 마케팅 계획 ⑦ 6개월 실행 로드맵` },

  { id:"homepage",icon:"🌐", label:"홈페이지 자동 생성",   sub:"사업 소개 페이지 즉시 완성",
    prompt: u=>`웹 디자이너 겸 카피라이터. 아래 창업자 정보로 사업 홈페이지용 콘텐츠를 작성해줘. 반드시 한국어로.
이름:${u.name} 업종:${u.biz} 아이디어:${u.idea} 창업동기:${u.reason}
① 메인 헤드라인 (강렬하게) ② 서브 카피 ③ 핵심 서비스 3가지 (제목+설명) ④ 대표 강점 3가지 ⑤ 고객 후기 샘플 2개 ⑥ CTA 문구 ⑦ About 소개 글 (3줄)`, isWeb:true },
];

/* ══ 홈페이지 완성을 위한 13고개 질문 ══ */
const INTRO_Q = [
  { key:"name",
    hint:"성함(대표자명)을 입력해 주세요…",
    q:()=>`반갑습니다! 😊 저는 여러분의 <strong>홈페이지를 만들어 드리는 AI</strong>입니다.<br/><br/>
홈페이지 완성을 위해 <strong>13가지 질문</strong>을 드릴게요.<br/>
편하게 답해주시면 멋진 사업 홈페이지가 완성됩니다! 🌐<br/><br/>
<span style="color:var(--gold);font-weight:700">고개 1/13</span> — 먼저 <strong>대표자 성함</strong>을 알려주세요.<br/>
<span style="font-size:11px;color:#7A6A50">예) 홍길동</span>` },

  { key:"biz_name",
    hint:"상호명(회사·브랜드 이름)을 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 2/13</span> — <strong>상호명 또는 브랜드명</strong>은 무엇인가요?<br/>
<span style="font-size:11px;color:#7A6A50">예) 세명장교 비즈니스센터 / 홍길동 컨설팅 / 미래상회</span><br/>
아직 정해지지 않았다면 임시 이름도 괜찮아요!` },

  { key:"biz",
    hint:"업종·서비스 분야를 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 3/13</span> — <strong>업종 또는 서비스 분야</strong>가 무엇인가요?<br/>
<span style="font-size:11px;color:#7A6A50">예) 비즈니스센터 운영 / IT 컨설팅 / 온라인 쇼핑몰 / 요식업</span>` },

  { key:"service",
    hint:"핵심 서비스나 상품을 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 4/13</span> — <strong>대표 서비스나 상품</strong> 3가지를 알려주세요.<br/>
<span style="font-size:11px;color:#7A6A50">예) 비상주사무실 임대 / AI 창업컨설팅 / 판촉물 제작</span>` },

  { key:"target",
    hint:"주요 고객층을 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 5/13</span> — <strong>주요 고객층</strong>은 누구인가요?<br/>
<span style="font-size:11px;color:#7A6A50">예) 1인 창업자 / 30~50대 직장인 / 소상공인 / 스타트업</span>` },

  { key:"strength",
    hint:"우리 사업만의 강점이나 차별점을 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 6/13</span> — 경쟁사와 비교해 <strong>우리만의 강점·차별점</strong>은 무엇인가요?<br/>
<span style="font-size:11px;color:#7A6A50">예) 25년 보험금융 경력 / 고용노동부 한 건물 / AI 자동화 서비스</span>` },

  { key:"address",
    hint:"사업장 주소나 지역을 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 7/13</span> — <strong>사업장 주소 또는 서비스 지역</strong>을 알려주세요.<br/>
<span style="font-size:11px;color:#7A6A50">예) 서울 중구 삼일대로 363 장교빌딩 810호 / 전국 온라인 서비스</span>` },

  { key:"contact",
    hint:"연락처(전화·이메일·카카오 등)를 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 8/13</span> — 고객이 연락할 수 있는 <strong>연락처</strong>를 알려주세요.<br/>
<span style="font-size:11px;color:#7A6A50">예) 02-762-3009 / kakao: semyung / 이메일: abc@abc.com</span>` },

  { key:"price",
    hint:"대표 요금이나 가격 정보를 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 9/13</span> — <strong>대표 요금이나 가격</strong>이 있다면 알려주세요.<br/>
<span style="font-size:11px;color:#7A6A50">예) 비상주사무실 월 10만원부터 / 무료 상담 후 견적 / 49,000원</span>` },

  { key:"reason",
    hint:"창업하게 된 계기나 스토리를 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 10/13</span> — 창업하게 된 <strong>계기나 대표 스토리</strong>를 들려주세요.<br/>
고객의 마음을 여는 진심 있는 이야기가 홈페이지를 빛나게 합니다.<br/>
<span style="font-size:11px;color:#7A6A50">예) 25년 삼성생명 경력 후 창업자들을 돕고 싶어서...</span>` },

  { key:"review",
    hint:"고객 후기나 성공 사례를 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 11/13</span> — 실제 <strong>고객 후기나 성공 사례</strong>가 있다면 알려주세요.<br/>
없으면 "없음"이라고 입력해도 AI가 샘플을 만들어 드립니다.<br/>
<span style="font-size:11px;color:#7A6A50">예) "덕분에 사업자 등록 쉽게 했어요" — 김○○ 대표</span>` },

  { key:"cta",
    hint:"방문자에게 원하는 행동(CTA)을 입력해 주세요…",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 12/13</span> — 홈페이지 방문자가 <strong>가장 먼저 해주길 바라는 행동</strong>은 무엇인가요?<br/>
<span style="font-size:11px;color:#7A6A50">예) 전화 상담 / 카카오톡 문의 / 무료 견적 신청 / 방문 예약</span>` },

  { key:"birth",
    hint:"대표자 생년월일을 입력해 주세요… (예: 1963-11-15)",
    q:d=>`<span style="color:var(--gold);font-weight:700">고개 13/13</span> — 마지막입니다! 🎉<br/><br/>
사주 분석으로 홈페이지에 <strong>행운의 색상·문구·개업일</strong>까지 넣어드릴게요.<br/>
<strong>대표자 생년월일</strong>을 알려주세요.<br/>
<span style="font-size:11px;color:#7A6A50">예) 1963-11-15 (양력)</span>` },
];

/* ══ 사주 입력은 13고개에 통합 — 빈 배열 유지 ══ */
const SAJU_Q = [];

/* ══════════════════════════════════════
   컴포넌트
══════════════════════════════════════ */

/* 메시지 버블 */
function Bubble({ role, html }) {
  const isAI = role === "ai";
  return (
    <div style={{display:"flex",gap:11,flexDirection:isAI?"row":"row-reverse",alignItems:"flex-start",animation:"fadeUp .35s ease"}}>
      <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",
        background:isAI?`linear-gradient(135deg,${C.gold},#7A5C00)`:C.paper3,
        border:isAI?"none":`1px solid ${C.border}`,
        color:isAI?"#fff":C.text,fontSize:isAI?10:15,fontWeight:900,fontFamily:"'Noto Serif KR',serif"}}>
        {isAI?"運":"👤"}
      </div>
      <div style={{maxWidth:"76%",padding:"13px 18px",borderRadius:14,fontSize:13,lineHeight:1.95,
        background:isAI?"#fff":C.goldDim,
        border:`1px solid ${isAI?C.border:"rgba(184,134,11,.22)"}`,
        boxShadow:isAI?"0 1px 6px rgba(0,0,0,.05)":"none"}}
        dangerouslySetInnerHTML={{__html:html}}/>
    </div>
  );
}

/* 타이핑 인디케이터 */
function Typing() {
  return (
    <div style={{display:"flex",gap:11,alignItems:"flex-start"}}>
      <div style={{width:34,height:34,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${C.gold},#7A5C00)`,color:"#fff",fontSize:10,fontWeight:900,fontFamily:"'Noto Serif KR',serif"}}>運</div>
      <div style={{padding:"13px 18px",background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,display:"flex",gap:5}}>
        {[0,180,360].map(d=><div key={d} style={{width:7,height:7,borderRadius:"50%",background:C.gold,animation:`bounce 1.2s ${d}ms infinite`}}/>)}
      </div>
    </div>
  );
}

/* 사이드바 결과 카드 */
function ResultCard({ result, menuItem, onClose }) {
  if(!result) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:16,maxWidth:640,width:"100%",maxHeight:"85vh",overflowY:"auto",position:"relative",boxShadow:"0 24px 80px rgba(0,0,0,.25)"}} onClick={e=>e.stopPropagation()}>
        {/* 헤더 */}
        <div style={{background:`linear-gradient(135deg,${C.ink},#1A1208)`,color:"#E8DEC8",padding:"22px 28px",borderRadius:"16px 16px 0 0",display:"flex",alignItems:"center",gap:12,position:"sticky",top:0}}>
          <span style={{fontSize:24}}>{menuItem.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:16,fontWeight:700}}>{menuItem.label}</div>
            <div style={{fontSize:11,color:"#9A8A6A",marginTop:2}}>{menuItem.sub}</div>
          </div>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.1)",border:"none",cursor:"pointer",color:"#E8DEC8",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {/* 본문 */}
        <div style={{padding:"24px 28px",fontSize:14,lineHeight:2,color:C.text,whiteSpace:"pre-wrap"}}>
          {result}
        </div>
        {/* 홈페이지 생성 결과면 미리보기 버튼 */}
        {menuItem.isWeb && (
          <div style={{padding:"0 28px 24px"}}>
            <button onClick={()=>{
              const w=window.open("","_blank");
              w.document.write(buildHomepage(result));
            }} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${C.gold},#7A5C00)`,border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Noto Serif KR',serif",cursor:"pointer"}}>
              🌐 홈페이지 미리보기 열기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* 홈페이지 HTML 빌더 */
function buildHomepage(content) {
  const lines = content.split("\n").filter(l=>l.trim());
  const headline = lines.find(l=>l.includes("헤드라인")||l.includes("①"))||"당신의 꿈을 현실로";
  const sub = lines.find(l=>l.includes("카피")||l.includes("②"))||"AI와 함께하는 스마트 창업";
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>사업 홈페이지</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Noto Sans KR',sans-serif;color:#2A2218;background:#F8F4ED;}
.hero{background:linear-gradient(135deg,#0C0A08,#1A1208);color:#E8DEC8;padding:80px 40px;text-align:center;}
.hero h1{font-family:'Noto Serif KR',serif;font-size:clamp(28px,5vw,52px);font-weight:900;color:#D4A017;margin-bottom:16px;line-height:1.3;}
.hero p{font-size:18px;color:#C0B090;max-width:600px;margin:0 auto 32px;}
.cta{display:inline-block;background:linear-gradient(135deg,#B8860B,#7A5C00);color:#fff;padding:16px 40px;border-radius:30px;font-size:16px;font-weight:700;text-decoration:none;}
.section{padding:60px 40px;max-width:900px;margin:0 auto;}
.section-title{font-family:'Noto Serif KR',serif;font-size:28px;font-weight:700;color:#0C0A08;margin-bottom:32px;text-align:center;}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-bottom:40px;}
.card{background:#fff;border:1px solid #D4C9B0;border-radius:12px;padding:24px;border-top:3px solid #B8860B;}
.card h3{font-size:16px;font-weight:700;margin-bottom:10px;color:#0C0A08;}
.card p{font-size:14px;color:#7A6A50;line-height:1.8;}
footer{background:#0C0A08;color:#9A8A6A;padding:32px 40px;text-align:center;font-size:13px;}
footer a{color:#D4A017;text-decoration:none;}
pre{white-space:pre-wrap;font-family:'Noto Sans KR',sans-serif;font-size:13px;line-height:2;background:#F2EDE3;padding:20px;border-radius:8px;border:1px solid #D4C9B0;}
</style></head><body>
<div class="hero"><h1>🌟 사업의 꿈을 현실로</h1><p>AI와 사주가 분석한 나만의 맞춤 창업 전략</p><a href="tel:02-762-3009" class="cta">📞 02-762-3009 상담하기</a></div>
<div class="section"><h2 class="section-title">AI 생성 홈페이지 콘텐츠</h2><pre>${content}</pre></div>
<footer>세명장교 비즈니스센터 · 서울 중구 삼일대로 363, 장교빌딩 810호<br/><a href="tel:02-762-3009">📞 02-762-3009</a></footer>
</body></html>`;
}

/* ══════════════════════════════════════
   메인 앱
══════════════════════════════════════ */
export default function App() {
  /* ── 상태 ── */
  const [phase, setPhase]         = useState("welcome"); // welcome|chat|saju_q|ready
  const [msgs, setMsgs]           = useState([]);
  const [introStep, setIntroStep] = useState(0);
  const [sajuStep, setSajuStep]   = useState(0);
  const [introData, setIntroData] = useState({});   // 자기소개
  const [sajuData, setSajuData]   = useState({});   // 사주 정보
  const [userData, setUserData]   = useState(null); // 최종 합산
  const [inputVal, setInputVal]   = useState("");
  const [isTyping, setIsTyping]   = useState(false);
  const [isBusy, setIsBusy]       = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);   // 사이드바 선택
  const [menuResult, setMenuResult] = useState(null);   // AI 결과
  const [loadingMenu, setLoadingMenu] = useState(null); // 로딩 중 메뉴 id
  const [openTopMenu, setOpenTopMenu] = useState(-1);
  const [ckChecked, setCkChecked] = useState(Array(12).fill(false));
  const [showModal, setShowModal] = useState(null);

  const chatEndRef = useRef(null);
  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs, isTyping, menuResult]);

  const addMsg = useCallback((role, html) => {
    setMsgs(prev=>[...prev,{role,html,id:Date.now()+Math.random()}]);
  }, []);

  /* ── 사이드바 잠금 여부 ── */
  const sidebarUnlocked = phase === "ready";

  /* ══ 시작하기 ══ */
  const startChat = async () => {
    setPhase("chat");
    setIsTyping(true); await sleep(600); setIsTyping(false);
    addMsg("ai",`안녕하세요! 👋 <strong>운명창업 AI 플랫폼</strong>에 오신 것을 환영합니다!<br/><br/>
사주명리·작명·타로·MBTI 분석은 물론,<br/>
<strong style="color:${C.gold}">맞춤형 사업 홈페이지</strong>까지 만들어 드리는 AI 창업 코치입니다.<br/><br/>
아래 입력창에 <strong style="color:${C.gold}">「사업하자」</strong> 라고 입력해 주세요! ✨`);
  };

  /* ══ 메인 전송 ══ */
  const handleSend = async () => {
    if (!inputVal.trim() || isBusy) return;
    const txt = inputVal.trim(); setInputVal("");

    /* 1단계: '사업하자' 트리거 */
    if (phase === "chat") {
      addMsg("user", txt);
      if (txt.replace(/\s/g,"").match(/사업하자|사업|창업/)) {
        setIsBusy(true);
        setIsTyping(true); await sleep(500); setIsTyping(false);
        addMsg("ai",`🎊 <strong>축하합니다! 성공의 문을 두드리셨습니다!</strong><br/><br/>
<div style="background:linear-gradient(135deg,#1A1400,#0C0900);border:1px solid ${C.gold};border-radius:12px;padding:18px 20px;margin:6px 0;">
  <div style="font-family:'Noto Serif KR',serif;font-size:18px;font-weight:900;color:${C.gold2};margin-bottom:8px;">✦ 적소성대(積小成大) ✦</div>
  <div style="font-size:13px;line-height:1.9;color:#C8B880;">작은 용기 하나가 큰 사업을 만들어 갑니다.<br/>지금 이 순간 당신은 이미 앞서 있습니다.</div>
</div><br/>
저는 <strong>세명장교 비즈니스센터 AI 창업 코치</strong>입니다.<br/>
지금부터 <strong style="color:${C.gold}">홈페이지 완성을 위한 13고개</strong>를 시작할게요! 🌐`);
        await sleep(800);
        setIsTyping(true); await sleep(600); setIsTyping(false);
        addMsg("ai", INTRO_Q[0].q({}));
        setPhase("intro");
        setIsBusy(false);
      } else {
        setIsTyping(true); await sleep(500); setIsTyping(false);
        addMsg("ai",`😊 시작을 위해 <strong style="color:${C.gold}">「사업하자」</strong> 라고 입력해 주세요!`);
      }
      return;
    }

    /* 2단계: 13고개 질문 (INTRO_Q) */
    if (phase === "intro") {
      addMsg("user", txt);
      setIsBusy(true);
      const key = INTRO_Q[introStep].key;
      const newData = {...introData, [key]:txt};
      setIntroData(newData);
      const nextStep = introStep + 1;

      if (nextStep < INTRO_Q.length) {
        setIntroStep(nextStep);
        setIsTyping(true); await sleep(700); setIsTyping(false);
        addMsg("ai", INTRO_Q[nextStep].q(newData));
        // 힌트 업데이트
        const el = document.getElementById ? document.getElementById("iz-hint") : null;
        if (el) el.textContent = `고개 ${nextStep+1}/${INTRO_Q.length} — ${INTRO_Q[nextStep].hint}`;
      } else {
        // 13고개 완료!
        const final = {...newData};
        setUserData(final);
        setIsTyping(true); await sleep(900); setIsTyping(false);
        addMsg("ai",`🎉 <strong>13고개 완료! ${final.name}님, 정말 수고하셨습니다!</strong><br/><br/>
<div style="background:linear-gradient(135deg,#0A1400,#0C0A00);border:1px solid ${C.gold};border-radius:12px;padding:16px 20px;font-size:13px;line-height:2.1;color:#E8DEC8;">
  👤 <strong style="color:${C.gold}">대표자:</strong> ${final.name}<br/>
  🏢 <strong style="color:${C.gold}">상호명:</strong> ${final.biz_name||'-'}<br/>
  💼 <strong style="color:${C.gold}">업종:</strong> ${final.biz||'-'}<br/>
  🎯 <strong style="color:${C.gold}">핵심 서비스:</strong> ${final.service||'-'}<br/>
  👥 <strong style="color:${C.gold}">주요 고객:</strong> ${final.target||'-'}<br/>
  📍 <strong style="color:${C.gold}">주소:</strong> ${final.address||'-'}
</div><br/>
이제 <strong style="color:${C.gold}">왼쪽 사이드바 🌐 홈페이지 자동 생성</strong>을 클릭하면<br/>
입력하신 정보로 <strong>맞춤 홈페이지 콘텐츠</strong>가 완성됩니다! ✨<br/><br/>
<span style="color:${C.muted};font-size:12px;">✦ 작명·로고·택일·MBTI·타로 등 다른 분석도 바로 이용하세요</span>`);
        setPhase("ready");
      }
      setIsBusy(false);
      return;
    }

    /* 3단계: saju_q — 13고개에 통합되어 사용 안 함 */
    if (phase === "saju_q") {
      setPhase("ready");
      return;
    }

    /* ready 상태: 자유 질문 */
    if (phase === "ready") {
      addMsg("user", txt);
      setIsTyping(true); await sleep(800); setIsTyping(false);
      addMsg("ai",`왼쪽 사이드바 메뉴를 클릭하시면 <strong>${userData?.name}님</strong>의 정보로 맞춤 AI 분석을 바로 받으실 수 있어요! 🔮<br/><br/>추가 문의는 <strong style="color:${C.gold}">📞 02-762-3009</strong>으로 연락해 주세요.`);
    }
  };

  /* ══ 사이드바 클릭 → 미니폼 or 바로 분석 ══ */
  const [miniForm, setMiniForm]   = useState(null);   // 입력 중인 메뉴
  const [miniData, setMiniData]   = useState({name:"", birth:"", hour:"모름", gender:"남"});

  const handleSidebarClick = (menu) => {
    if (loadingMenu) return;
    setActiveMenu(menu);
    setMenuResult(null);
    // 이미 이름+생년월일 있으면 바로 분석
    if (userData?.name && userData?.birth) {
      runAnalysis(menu, userData);
    } else {
      // 미니폼 표시
      setMiniForm(menu);
      setMiniData(prev=>({
        ...prev,
        name: userData?.name || introData?.name || "",
        birth: userData?.birth || "",
        hour: userData?.hour || "모름",
        gender: userData?.gender || "남",
      }));
    }
  };

  const runAnalysis = async (menu, u) => {
    setLoadingMenu(menu.id);
    setMiniForm(null);
    addMsg("ai",`<strong>${menu.icon} ${menu.label}</strong> 분석을 시작합니다…<br/><span style="color:${C.muted};font-size:12px;">${u.name}님(${u.birth})의 정보로 AI가 분석 중입니다.</span>`);
    const fullU = {...(userData||{}), ...u};
    const prompt = menu.prompt(fullU);
    let result = "";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000,
          messages:[{role:"user",content:prompt}] })
      });
      const data = await res.json();
      result = data.content?.[0]?.text || "";
    } catch(e) {
      result = `분석 중 오류가 발생했습니다.\n📞 02-762-3009`;
    }
    // 입력한 정보를 userData에 병합 저장
    setUserData(prev=>({...(prev||{}), ...fullU}));
    setMenuResult(result);
    setLoadingMenu(null);
  };

  /* ══ 입력창 설정 ══ */
  const phaseHints = {
    welcome: "시작하기 버튼을 눌러주세요",
    chat: "「사업하자」라고 입력해 주세요…",
    intro: INTRO_Q[introStep]?.hint || "답변을 입력해 주세요…",
    saju_q: SAJU_Q[sajuStep]?.hint || "입력해 주세요…",
    ready: "추가 궁금한 점을 입력하세요…",
  };
  const phaseLabels = {
    welcome: "시작하기 버튼을 눌러 주세요",
    chat: "「사업하자」라고 입력해 주세요",
    intro: `자기소개 ${introStep+1} / ${INTRO_Q.length} — 편하게 답해주세요`,
    saju_q: `사주 정보 ${sajuStep+1} / ${SAJU_Q.length} — 입력해 주세요`,
    ready: "왼쪽 메뉴 클릭 또는 자유 질문 입력",
  };
  const isInputDisabled = phase==="welcome" || isBusy;

  /* ══ 상단 메뉴 데이터 ══ */
  const TOP_MENUS = [
    { label:"창업 전 준비", num:"①", color:C.gold, items:[
      {t:"마음가짐 점검",d:"창업 동기·가족 동의·생활비 준비"},
      {t:"시장 조사",d:"경쟁사 분석·타겟 고객 파악"},
      {t:"법적·행정 준비",d:"사업자 등록·주소·인허가"},
      {t:"초기 자금 계획",d:"정부지원금·자본금·대출"},
      {t:"브랜드 기초 작업",d:"상호명·로고·SNS 개설"},
      {t:"사무 공간 확보",d:"비상주·공유·임차 비교"},
    ]},
    { label:"자신감 부스터", num:"②", color:"#D97706", items:[
      {t:"오늘의 창업 명언",d:"성공한 창업자들의 한 마디"},
      {t:"창업 확언 10가지",d:"매일 아침 읽는 자기 선언문"},
      {t:"용기 에너지 충전",d:"두려움을 이기는 심리 훈련법"},
      {t:"비전 보드 만들기",d:"1년·3년·5년 후 목표 시각화"},
    ]},
    { label:"두려움 극복", num:"③", color:C.red, items:[
      {t:"돈이 없으면 못 한다",d:"정부지원·비상주사무실 활용법"},
      {t:"실패하면 어떡하지?",d:"실패를 경험 자산으로 바꾸는 법"},
      {t:"전문지식이 없다",d:"AI·파트너십으로 공백 메우기"},
      {t:"주변의 시선이 무섭다",d:"초지일관·결과로 증명하는 법"},
    ]},
    { label:"창업 체크리스트", num:"④", color:"#059669", type:"checklist"},
    { label:"창업 로드맵", num:"⑤", color:C.blue, type:"roadmap"},
    { label:"성공 노하우", num:"⑥", color:"#7C3AED", items:[
      {t:"고객은 지인에서 나온다",d:"첫 10명 확보 전략"},
      {t:"현금흐름이 생명줄",d:"매출보다 이익을 먼저"},
      {t:"AI 도구를 모르면 뒤처진다",d:"실전 AI 마케팅 활용"},
      {t:"작은 실행이 큰 결과",d:"적소성대(積小成大) 실천법"},
      {t:"멘토 1명이 3년을 줄인다",d:"네트워크 구축 전략"},
    ]},
    { label:"사업 네트워크", num:"⑦", color:"#0891B2", items:[
      {t:"세명장교 비즈니스센터",d:"📞 02-762-3009 · 비상주·컨설팅·AI교육"},
      {t:"고용노동부 (한 건물)",d:"노무·고용지원 상담"},
      {t:"정부 창업 지원기관",d:"창업진흥원·소진공·중기부"},
      {t:"AI 마케터 Zone",d:"AI 마케팅 커뮤니티·교육"},
    ]},
  ];

  const CK = [
    ["📋 마음 준비",["창업 동기 명확히 하기","가족과 상의 완료","6개월 생활비 확보"]],
    ["💡 아이디어",["아이디어 3가지 도출","타겟 고객 10명 의견 수렴","경쟁사 3곳 분석"]],
    ["📝 법적 준비",["사업 형태 결정","사업자 주소 확보","사업자 등록 신청"]],
    ["🚀 마케팅",["SNS 채널 개설","첫 고객 확보 계획","AI 마케팅 도구 활용"]],
  ];
  const RM = ["창업 동기 확인","아이디어 발굴","시장 규모 파악","경쟁사 분석","고객 인터뷰",
    "MVP 설계","수익 모델","초기 비용 산출","자금 조달","사업자 주소",
    "사업자 등록","브랜드 네이밍","로고·명함","SNS·홈페이지","첫 콘텐츠",
    "첫 고객 확보","서비스 개선","첫 매출 달성","반복·자동화","성장·확장"];

  /* ══ 홈으로 초기화 ══ */
  const resetToHome = () => {
    setPhase("welcome");
    setMsgs([]);
    setIntroStep(0);
    setSajuStep(0);
    setIntroData({});
    setSajuData({});
    setUserData(null);
    setInputVal("");
    setIsTyping(false);
    setIsBusy(false);
    setActiveMenu(null);
    setMenuResult(null);
    setLoadingMenu(null);
    setOpenTopMenu(-1);
    setCkChecked(Array(12).fill(false));
    setMiniForm(null);
    setMiniData({name:"",birth:"",hour:"모름",gender:"남"});
  };

  /* ══ 렌더 ══ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@400;500;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Noto Sans KR',sans-serif;background:${C.paper};}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
        @keyframes bounce{0%,80%,100%{transform:scale(.8);opacity:.5;}40%{transform:scale(1.2);opacity:1;}}
        @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.3;}}
        @keyframes spin{to{transform:rotate(360deg);}}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}
      `}</style>

      <div style={{display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>

        {/* ════ 상단 메뉴바 ════ */}
        <div style={{display:"flex",alignItems:"stretch",background:C.ink,borderBottom:`2px solid ${C.gold}`,flexShrink:0,zIndex:60,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 16px",borderRight:`1px solid #2A2218`,flexShrink:0,minHeight:46,cursor:"pointer",transition:"background .18s"}}
            onClick={resetToHome}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(184,134,11,.12)"}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}
            title="처음 화면으로">
            <span style={{fontSize:17}}>🔮</span>
            <span style={{fontFamily:"'Noto Serif KR',serif",fontSize:14,fontWeight:900,background:`linear-gradient(135deg,${C.goldLt},${C.gold})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",whiteSpace:"nowrap"}}>사업하자</span>
          </div>
          <div style={{display:"flex",flex:1,overflowX:"auto",scrollbarWidth:"none"}}>
            {TOP_MENUS.map((m,i)=>(
              <div key={i} onClick={()=>setOpenTopMenu(openTopMenu===i?-1:i)}
                style={{display:"flex",alignItems:"center",gap:4,padding:"0 12px",fontSize:11,fontWeight:700,cursor:"pointer",
                  borderBottom:`3px solid ${openTopMenu===i?m.color:"transparent"}`,
                  color:openTopMenu===i?m.color:"#C0B090",
                  background:openTopMenu===i?"rgba(255,255,255,.04)":"transparent",
                  whiteSpace:"nowrap",minHeight:46,transition:"all .18s",borderRight:"1px solid #1A1612"}}>
                <span style={{color:m.color}}>{m.num}</span>{m.label}
                <span style={{fontSize:9,opacity:.5,transition:"transform .2s",transform:openTopMenu===i?"rotate(180deg)":"none",marginLeft:2}}>▾</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 14px",flexShrink:0,borderLeft:"1px solid #1A1612"}}>
            <button onClick={resetToHome} style={{padding:"6px 12px",borderRadius:16,fontSize:11,fontWeight:700,cursor:"pointer",border:"1.5px solid #3A3020",background:"transparent",color:"#C0B090"}}>🔄 처음으로</button>
          </div>

          {/* 드롭다운 오버레이 */}
          {openTopMenu>=0&&<div style={{position:"fixed",inset:0,zIndex:58}} onClick={()=>setOpenTopMenu(-1)}/>}

          {/* 드롭다운 패널 */}
          {openTopMenu>=0&&(()=>{
            const m = TOP_MENUS[openTopMenu];
            return (
              <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:59,background:"#fff",borderBottom:`2px solid ${m.color}`,boxShadow:"0 8px 32px rgba(0,0,0,.15)",maxHeight:"60vh",overflowY:"auto"}}>
                <div style={{padding:"12px 22px 10px",borderBottom:`1px solid ${C.border}`,fontFamily:"'Noto Serif KR',serif",fontSize:14,fontWeight:700,color:C.ink,display:"flex",alignItems:"center",gap:9,background:C.paper2}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:m.color,color:"#fff",fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{m.num}</div>
                  {m.label}
                </div>
                {m.type==="checklist"&&(
                  <div style={{padding:"14px 20px 18px",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
                    {CK.map(([g,list],gi)=>(
                      <div key={gi}>
                        <div style={{fontSize:9,letterSpacing:2,color:C.gold,textTransform:"uppercase",fontWeight:700,marginBottom:7}}>{g}</div>
                        {list.map((it,ii)=>{
                          const idx=gi*3+ii;
                          return(
                            <div key={ii} onClick={()=>setCkChecked(p=>{const n=[...p];n[idx]=!n[idx];return n;})}
                              style={{display:"flex",alignItems:"center",gap:8,padding:"7px 9px",marginBottom:5,background:ckChecked[idx]?"#F5FFF8":C.paper,border:`1px solid ${ckChecked[idx]?"rgba(26,74,42,.3)":C.border}`,borderRadius:8,cursor:"pointer"}}>
                              <div style={{width:15,height:15,borderRadius:4,border:`1.5px solid ${ckChecked[idx]?"#4CAF7D":C.border}`,background:ckChecked[idx]?"#4CAF7D":"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:9,fontWeight:700,flexShrink:0}}>{ckChecked[idx]?"✓":""}</div>
                              <span style={{fontSize:11,textDecoration:ckChecked[idx]?"line-through":"none",color:ckChecked[idx]?C.muted:C.text}}>{it}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div style={{gridColumn:"1/-1",paddingTop:8,borderTop:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginBottom:5}}><span>진행률</span><span>{ckChecked.filter(Boolean).length} / 12</span></div>
                      <div style={{height:4,background:C.paper3,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(90deg,${C.gold},${C.red})`,borderRadius:2,width:`${Math.round(ckChecked.filter(Boolean).length/12*100)}%`,transition:"width .4s"}}/></div>
                    </div>
                  </div>
                )}
                {m.type==="roadmap"&&(
                  <div style={{padding:"14px 20px 18px",display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
                    {RM.map((s,i)=>(
                      <div key={i} style={{padding:"10px 8px",textAlign:"center"}}>
                        <div style={{width:26,height:26,borderRadius:"50%",background:m.color,color:"#fff",fontWeight:900,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 6px"}}>{i+1}</div>
                        <div style={{fontSize:10,color:C.ink,fontWeight:700,lineHeight:1.4}}>{s}</div>
                      </div>
                    ))}
                  </div>
                )}
                {m.items&&(
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(m.items.length,4)},1fr)`}}>
                    {m.items.map((it,ii)=>(
                      <div key={ii} style={{padding:"16px 14px",borderRight:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,cursor:"pointer",borderTop:`2px solid ${m.color}`,transition:"background .15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=C.goldDim}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{fontSize:12,fontWeight:700,color:C.ink,marginBottom:4}}>{it.t}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{it.d}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ════ 앱 바디 ════ */}
        <div style={{display:"flex",flex:1,overflow:"hidden"}}>

          {/* ════ 왼쪽 사이드바 ════ */}
          <div style={{width:236,flexShrink:0,background:C.ink,display:"flex",flexDirection:"column",borderRight:`2px solid ${C.gold}`,overflowY:"auto"}}>
            <div style={{padding:"18px 16px 12px",borderBottom:"1px solid #1E1A14"}}>
              <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:18,fontWeight:900,background:`linear-gradient(135deg,${C.goldLt},${C.gold} 60%,#7A5C00)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.3,marginBottom:4}}>
                AI 창업 분석<br/><span style={{fontSize:11,color:"#5A4A2A",WebkitTextFillColor:"#5A4A2A"}}>사주 기반 맞춤 도구</span>
              </div>
              <div style={{fontSize:9,letterSpacing:2,color:"#5A4A2A",textTransform:"uppercase"}}>Saju Business Platform</div>
            </div>

            {/* 창업 도우미 박스 */}
            <div style={{margin:"12px 12px 4px",padding:"13px 14px",background:"linear-gradient(135deg,rgba(184,134,11,.12),rgba(184,134,11,.04))",border:`1px solid rgba(184,134,11,.35)`,borderRadius:10}}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                <span style={{fontSize:18}}>🤝</span>
                <span style={{fontFamily:"'Noto Serif KR',serif",fontSize:13,fontWeight:900,color:C.gold2}}>창업 도우미</span>
              </div>
              <div style={{fontSize:10,color:"#C0A870",lineHeight:1.75}}>
                아래 메뉴를 클릭하면<br/>이름과 생년월일을 입력 후<br/>맞춤 AI 분석을 받을 수 있어요!
              </div>
              {userData&&(
                <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(184,134,11,.2)",fontSize:10,color:C.gold2,fontWeight:700}}>
                  ✓ {userData.name}님 정보 저장됨
                </div>
              )}
            </div>

            {/* 메뉴 목록 */}
            <div style={{fontSize:9,letterSpacing:2,color:"#C0B090",textTransform:"uppercase",padding:"10px 16px 4px"}}>분석 메뉴 ({SIDEBAR_MENUS.length}가지)</div>
            <div style={{flex:1}}>
              {SIDEBAR_MENUS.map((menu)=>{
                const isLoading = loadingMenu===menu.id;
                const isActive = activeMenu?.id===menu.id;
                return (
                  <div key={menu.id} onClick={()=>!loadingMenu&&handleSidebarClick(menu)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"11px 16px",
                      cursor:loadingMenu?"wait":"pointer",
                      borderLeft:`2px solid ${isActive?C.gold:"transparent"}`,
                      background:isActive?"rgba(184,134,11,.12)":"transparent",
                      transition:"all .18s"}}
                    onMouseEnter={e=>{if(!loadingMenu)e.currentTarget.style.background=isActive?"rgba(184,134,11,.15)":"rgba(255,255,255,.06)";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=isActive?"rgba(184,134,11,.12)":"transparent";}}>
                    <span style={{fontSize:16,flexShrink:0,width:22,textAlign:"center"}}>
                      {isLoading?<span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⏳</span>:menu.icon}
                    </span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:700,color:isActive?C.gold2:"#FFFFFF",lineHeight:1.3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{menu.label}</div>
                      <div style={{fontSize:9,color:isActive?"#C0A060":"#B0A890",lineHeight:1.3,marginTop:1}}>{isLoading?"AI 분석 중…":menu.sub}</div>
                    </div>
                    {isActive&&!isLoading&&<span style={{fontSize:10,color:C.gold,flexShrink:0}}>✓</span>}
                    {!isLoading&&<span style={{fontSize:9,color:"#6A5A48",flexShrink:0}}>›</span>}
                  </div>
                );
              })}
            </div>

            {/* 가격 + 연락처 */}
            <div style={{margin:"10px 12px",padding:"12px 14px",background:"linear-gradient(135deg,#1A1400,#0C0900)",border:`1px solid ${C.gold}`,borderRadius:10,textAlign:"center"}}>
              <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:18,fontWeight:900,color:C.gold2}}>₩ 49,000</div>
              <div style={{fontSize:9,color:"#5A4A2A",marginTop:2}}>49페이지 프리미엄 보고서</div>
            </div>
            <div style={{padding:"10px 14px",borderTop:"1px solid #1E1A14",fontSize:10,color:"#B0A090",lineHeight:1.9}}>
              세명장교 비즈니스센터<br/>
              <a href="tel:02-762-3009" style={{color:C.gold,textDecoration:"none"}}>📞 02-762-3009</a><br/>
              서울 중구 삼일대로 363
            </div>
          </div>

          {/* ════ 메인 (오른쪽) ════ */}
          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:C.paper}}>

            {/* 웰컴 화면 */}
            {phase==="welcome"&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 24px",textAlign:"center",overflowY:"auto",background:"linear-gradient(160deg,#0C0A08 0%,#1A1208 50%,#0A0800 100%)"}}>
                <style>{`
                  @keyframes hookGlow{0%,100%{text-shadow:0 0 20px rgba(255,200,50,.6),0 0 40px rgba(255,160,20,.3)}50%{text-shadow:0 0 40px rgba(255,220,80,1),0 0 80px rgba(255,180,30,.6)}}
                  @keyframes hookPulse{0%,100%{box-shadow:0 0 0 0 rgba(212,160,23,.6),0 8px 32px rgba(184,134,11,.4)}60%{box-shadow:0 0 0 16px rgba(212,160,23,0),0 8px 32px rgba(184,134,11,.4)}}
                  @keyframes borderFlash{0%,100%{border-color:#D4A017}50%{border-color:#FFE566}}
                `}</style>

                {/* 배지 */}
                <div style={{display:"inline-flex",alignItems:"center",gap:7,border:`1px solid ${C.gold}`,color:C.gold,fontSize:9,letterSpacing:3,padding:"6px 18px",borderRadius:20,marginBottom:16,textTransform:"uppercase"}}>✦ AI 사주 분석 · 창업운세 플랫폼 ✦</div>

                {/* 타이틀 */}
                <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:"clamp(24px,4vw,38px)",fontWeight:900,color:"#E8DEC8",lineHeight:1.2,marginBottom:24}}>사주로 보는 <span style={{color:C.gold2}}>창업의 운명</span></div>

                {/* 흐름 단계 박스 */}
                <div style={{width:"100%",maxWidth:520,marginBottom:24}}>

                  {/* 1단계 */}
                  {[
                    {n:"1", text:<>「사업하자」 한 마디로 <span style={{color:C.gold2,fontWeight:900}}>시작</span></>, normal:true},
                    {n:"2", text:<><span style={{color:C.gold2,fontWeight:900}}>자기소개</span> → <span style={{color:C.gold2,fontWeight:900}}>사주 입력</span></>, normal:true},
                    {n:"3", text:<><span style={{color:C.gold2,fontWeight:900}}>11가지 맞춤 분석 도구</span> 활성화</>, normal:true},
                  ].map((step,i)=>(
                    <div key={i}>
                      <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",borderLeft:`4px solid rgba(184,134,11,0.5)`,background:"rgba(255,255,255,0.04)",borderRadius:"0 10px 10px 0",marginBottom:3}}>
                        <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(184,134,11,0.25)",border:`1.5px solid ${C.gold}`,color:C.gold2,fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Noto Sans KR',sans-serif"}}>{step.n}</div>
                        <div style={{fontFamily:"'Noto Sans KR',sans-serif",fontSize:"clamp(14px,2vw,18px)",fontWeight:700,color:"#C8B880",textAlign:"left",flex:1,lineHeight:1.4}}>{step.text}</div>
                      </div>
                      <div style={{textAlign:"left",paddingLeft:52,fontSize:18,color:"rgba(184,134,11,0.4)",lineHeight:1,margin:"2px 0"}}>↓</div>
                    </div>
                  ))}

                  {/* ★ 후킹 — 홈페이지 자동 생성 ★ */}
                  <div style={{
                    display:"flex",alignItems:"center",gap:14,
                    padding:"22px 24px",
                    borderLeft:`5px solid ${C.gold2}`,
                    background:"rgba(212,160,23,0.13)",
                    borderRadius:"0 14px 14px 0",
                    animation:"hookPulse 2.5s infinite, borderFlash 2.5s ease-in-out infinite",
                  }}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:C.gold2,color:"#0C0A08",fontSize:22,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,animation:"hookPulse 2s infinite"}}>🌐</div>
                    <div style={{textAlign:"left",flex:1}}>
                      {/* ★ 메인 후킹 텍스트 — 고딕 볼드 2배 ★ */}
                      <div style={{
                        fontFamily:"'Noto Sans KR',sans-serif",
                        fontSize:"clamp(26px,4.2vw,42px)",
                        fontWeight:900,
                        lineHeight:1.2,
                        background:"linear-gradient(135deg,#FFE566,#FFB800,#FF8C00)",
                        WebkitBackgroundClip:"text",
                        WebkitTextFillColor:"transparent",
                        animation:"hookGlow 2.5s ease-in-out infinite",
                      }}>홈페이지 자동 생성까지!</div>
                      <div style={{
                        fontFamily:"'Noto Sans KR',sans-serif",
                        fontSize:"clamp(12px,1.8vw,15px)",
                        fontWeight:700,
                        color:"rgba(255,220,100,0.75)",
                        marginTop:5,
                      }}>사주 입력 한 번으로 내 사업 홈페이지 완성</div>
                    </div>
                  </div>
                </div>

                {/* 시작 버튼 */}
                <button onClick={startChat} style={{display:"inline-flex",alignItems:"center",gap:9,background:`linear-gradient(135deg,${C.gold},#7A5C00)`,color:"#fff",padding:"15px 38px",borderRadius:30,fontSize:16,fontWeight:900,fontFamily:"'Noto Sans KR',sans-serif",cursor:"pointer",border:"none",boxShadow:"0 6px 24px rgba(184,134,11,.5)",marginBottom:16}}>
                  🔮 지금 시작하기 →
                </button>

                {/* 태그 */}
                <div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"center"}}>
                  {SIDEBAR_MENUS.map(m=><span key={m.id} style={{padding:"3px 9px",borderRadius:11,fontSize:9,background:"rgba(184,134,11,.1)",border:"1px solid rgba(184,134,11,.25)",color:"#C0A870"}}>{m.icon} {m.label}</span>)}
                </div>
              </div>
            )}

            {/* 채팅 영역 */}
            {phase!=="welcome"&&(
              <>
                <div style={{flex:1,overflowY:"auto",padding:"22px 28px 12px",display:"flex",flexDirection:"column",gap:12}}>
                  {msgs.map(m=><Bubble key={m.id} role={m.role} html={m.html}/>)}
                  {isTyping&&<Typing/>}
                  <div ref={chatEndRef}/>
                </div>

                {/* 입력창 */}
                <div style={{padding:"12px 22px 16px",borderTop:`1px solid ${C.border}`,background:C.paper2,flexShrink:0}}>
                  <div style={{fontSize:9,letterSpacing:2,color:C.gold,textTransform:"uppercase",marginBottom:7,display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:14,height:1,background:C.gold}}/>
                    {phaseLabels[phase]}
                  </div>
                  <div style={{display:"flex",gap:8,background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:40,padding:"4px 6px 4px 18px",transition:"border-color .2s"}}
                    onFocus={e=>e.currentTarget.style.borderColor=C.gold}
                    onBlur={e=>e.currentTarget.style.borderColor=C.border}>
                    <textarea value={inputVal} onChange={e=>setInputVal(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
                      placeholder={phaseHints[phase]}
                      disabled={isInputDisabled} rows={1}
                      style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.text,fontSize:14,fontFamily:"'Noto Sans KR',sans-serif",resize:"none",height:22,maxHeight:100,lineHeight:1.6,paddingTop:1,overflow:"hidden",opacity:isInputDisabled?.5:1}}/>
                    <button onClick={handleSend} disabled={isInputDisabled}
                      style={{background:isInputDisabled?"#ccc":`linear-gradient(135deg,${C.gold},#7A5C00)`,border:"none",borderRadius:28,width:36,height:36,flexShrink:0,cursor:isInputDisabled?"default":"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>➤</button>
                  </div>
                  <div style={{fontSize:10,color:C.muted,marginTop:6,textAlign:"center"}}>Enter 전송 · Shift+Enter 줄바꿈</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ════ 이름·생년월일 미니폼 모달 ════ */}
      {miniForm&&(
        <div style={{position:"fixed",inset:0,zIndex:250,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={()=>setMiniForm(null)}>
          <div style={{background:"#fff",borderRadius:16,padding:0,maxWidth:400,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,.3)",overflow:"hidden",animation:"fadeUp .25s ease"}} onClick={e=>e.stopPropagation()}>
            {/* 헤더 */}
            <div style={{background:`linear-gradient(135deg,${C.ink},#1A1208)`,padding:"18px 22px",display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:22}}>{miniForm.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Noto Serif KR',serif",fontSize:15,fontWeight:700,color:"#E8DEC8"}}>{miniForm.label}</div>
                <div style={{fontSize:10,color:"#8A7A5A",marginTop:2}}>정보를 입력하면 AI가 맞춤 분석을 해드립니다</div>
              </div>
              <button onClick={()=>setMiniForm(null)} style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.1)",border:"none",cursor:"pointer",color:"#C0B090",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            {/* 폼 */}
            <div style={{padding:"22px 22px 20px"}}>
              {[
                {label:"성명 *", key:"name", type:"text", placeholder:"예) 홍길동"},
                {label:"생년월일 * (양력)", key:"birth", type:"text", placeholder:"예) 1963-11-15"},
                {label:"태어난 시간", key:"hour", type:"text", placeholder:"예) 오전 10시, 모름"},
                {label:"성별", key:"gender", type:"select", options:["남","여"]},
              ].map(f=>(
                <div key={f.key} style={{marginBottom:13}}>
                  <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:1,color:C.muted,textTransform:"uppercase",marginBottom:5}}>{f.label}</label>
                  {f.type==="select"
                    ? <select value={miniData[f.key]} onChange={e=>setMiniData(p=>({...p,[f.key]:e.target.value}))}
                        style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",background:C.paper,color:C.text,outline:"none"}}>
                        {f.options.map(o=><option key={o} value={o}>{o==="남"?"남성":"여성"}</option>)}
                      </select>
                    : <input type="text" value={miniData[f.key]} onChange={e=>setMiniData(p=>({...p,[f.key]:e.target.value}))}
                        placeholder={f.placeholder}
                        style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${C.border}`,borderRadius:9,fontSize:13,fontFamily:"'Noto Sans KR',sans-serif",background:C.paper,color:C.text,outline:"none"}}
                        onFocus={e=>e.target.style.borderColor=C.gold}
                        onBlur={e=>e.target.style.borderColor=C.border}/>
                  }
                </div>
              ))}
              <button
                onClick={()=>{
                  if (!miniData.name.trim()||!miniData.birth.trim()) {
                    alert("성명과 생년월일은 필수입니다.");
                    return;
                  }
                  const enriched = {
                    ...(userData||{}), ...introData,
                    name: miniData.name.trim(),
                    birth: miniData.birth.trim(),
                    hour: miniData.hour||"모름",
                    gender: miniData.gender||"남",
                    biz: userData?.biz || introData?.biz || "창업",
                    idea: userData?.idea || introData?.idea || "",
                    reason: userData?.reason || introData?.reason || "",
                    budget: userData?.budget || introData?.budget || "",
                  };
                  runAnalysis(miniForm, enriched);
                }}
                style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${C.gold},#7A5C00)`,border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,fontFamily:"'Noto Serif KR',serif",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                {miniForm.icon} 분석 시작하기
              </button>
              <div style={{textAlign:"center",fontSize:10,color:C.muted,marginTop:10,lineHeight:1.6}}>입력하신 정보는 다음 메뉴 클릭 시 자동으로 사용됩니다</div>
            </div>
          </div>
        </div>
      )}
      {activeMenu&&menuResult!==null&&(
        <ResultCard result={menuResult} menuItem={activeMenu} onClose={()=>{setActiveMenu(null);setMenuResult(null);}}/>
      )}
      {/* 로딩 중 오버레이 */}
      {loadingMenu&&(
        <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(12,10,8,.7)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{width:60,height:60,borderRadius:"50%",border:`2px solid ${C.gold}`,borderTopColor:"transparent",animation:"spin 1s linear infinite",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🔮</div>
          <div style={{color:"#E8DEC8",fontFamily:"'Noto Serif KR',serif",fontSize:16,fontWeight:700}}>AI가 분석 중입니다…</div>
          <div style={{color:"#8A7A5A",fontSize:12}}>{userData?.name}님의 사주와 정보를 기반으로 결과를 생성하고 있습니다</div>
        </div>
      )}
    </>
  );
}
