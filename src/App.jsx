import { useState, useEffect, useCallback } from "react";

// ─── Google Analytics GA4 ─────────────────────────────────────────
const GA_ID = "G-535260447";

function initGA() {
  if(typeof window === "undefined") return;
  const s1 = document.createElement("script");
  s1.async = true;
  s1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s1);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID);
}

function trackEvent(eventName, params = {}) {
  if(typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}

const SUITS = ["♠", "♥", "♦", "♣"];
const SUIT_COLORS = { "♠": "#c8d8e8", "♥": "#e74c3c", "♦": "#e74c3c", "♣": "#c8d8e8" };
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

const HAND_RANKINGS = [
  { name: "זוג", en: "One Pair", desc: "שתי קלפים עם אותו ערך", example: ["A♠","A♥","K♦","7♣","2♠"] },
  { name: "שני זוגות", en: "Two Pair", desc: "שני זוגות שונים", example: ["K♠","K♥","9♦","9♣","A♠"] },
  { name: "שלישייה", en: "Three of a Kind", desc: "שלושה קלפים עם אותו ערך", example: ["Q♠","Q♥","Q♦","8♣","3♠"] },
  { name: "סטרייט", en: "Straight", desc: "חמישה קלפים ברצף", example: ["5♠","6♥","7♦","8♣","9♠"] },
  { name: "פלאש", en: "Flush", desc: "חמישה קלפים מאותו סדר", example: ["2♠","5♠","8♠","J♠","A♠"] },
  { name: "פול האוס", en: "Full House", desc: "שלישייה + זוג", example: ["J♠","J♥","J♦","4♣","4♠"] },
  { name: "פור אוף א קיינד", en: "Four of a Kind", desc: "ארבעה קלפים עם אותו ערך", example: ["10♠","10♥","10♦","10♣","K♠"] },
  { name: "סטרייט פלאש", en: "Straight Flush", desc: "חמישה קלפים ברצף מאותו סדר", example: ["6♣","7♣","8♣","9♣","10♣"] },
  { name: "רויאל פלאש", en: "Royal Flush", desc: "10, J, Q, K, A מאותו סדר", example: ["10♠","J♠","Q♠","K♠","A♠"] },
];

// ─── Glossary terms ───────────────────────────────────────────────────────────
const GLOSSARY = [
  { term:"בלינד (Blind)", desc:"הימור חובה שמשלמים לפני שרואים קלפים. יש שני בלינדים: סמול בלינד (חצי) וביג בלינד (מלא). בטקסס הולדם הבסיסי — סמול בלינד = 10, ביג בלינד = 20. זה מה שיוצר את הסיר ומניע את המשחק קדימה." },
  { term:"סדר הימורים — מי שם ומתי?", desc:"ההימורים הולכים בתורות, בסדר קבוע עם כיוון השעון. בפרה-פלופ: מי שיושב אחרי הביג בלינד מתחיל. בשאר השלבים: מי שיושב הכי קרוב לשמאל של הדילר מתחיל. כל שחקן בתורו בוחר: צ'ק / קול / ריייז / פולד. אסור לדלג על התור." },
  { term:"פרה-פלופ (Pre-Flop)", desc:"השלב הראשון — כל שחקן מקבל 2 קלפים סודיים ומתחיל סיבוב הימורים. עדיין אין קלפים על השולחן." },
  { term:"פלופ (Flop)", desc:"3 קלפים משותפים נחשפים על השולחן בבת אחת. כל השחקנים יכולים להשתמש בהם. אחרי הפלופ יש סיבוב הימורים." },
  { term:"טרן (Turn)", desc:"קלף משותף רביעי נחשף על השולחן. אחריו סיבוב הימורים נוסף." },
  { term:"ריבר (River)", desc:"הקלף המשותף החמישי והאחרון. אחריו סיבוב הימורים אחרון, ואז שואדאון." },
  { term:"שואדאון (Showdown)", desc:"בסוף הסיבוב, השחקנים שנשארו חושפים את הקלפים. מי שיש לו את הקומבינציה הטובה ביותר מ-7 קלפים (2 בידו + 5 בלוח) מנצח את הסיר." },
  { term:"פולד (Fold)", desc:"לוותר על הסיבוב. מאבדים את מה שהמרת עד כה, אבל לא מפסידים יותר. לעתים זו ההחלטה הנכונה." },
  { term:"קול (Call)", desc:"להשוות להימור של השחקן לפניך. משלמים בדיוק כמה שהוא שם — לא יותר, לא פחות." },
  { term:"ריייז (Raise)", desc:"להעלות את ההימור מעל מה ששמו לפניך. מכריח שחקנים אחרים להחליט: לשלם יותר, לפולד, או לריייז שוב." },
  { term:"צ'ק (Check)", desc:"לעבור הלאה בלי להמר — רק אפשרי אם אף אחד לא ריייז לפניך בסיבוב הזה. כמו לומר 'אני לא מוסיף כלום, אבל נשאר במשחק'." },
  { term:"סיר (Pot)", desc:"הצבר של כל ההימורים בסיבוב. מי שמנצח — לוקח את כל הסיר." },
  { term:"בלוף (Bluff)", desc:"להמר בחוזקה גם כשיש לך יד חלשה — כדי לגרום ליריב לחשוב שיש לך יד חזקה ולפולד. פוקר הוא לא רק קלפים — הוא גם פסיכולוגיה." },
  { term:"אאוטס (Outs)", desc:"הקלפים שנשארו בחפיסה שיכולים לשפר את היד שלך. לדוגמה: אם חסר לך קלף אחד לסטרייט, יש לך 4-8 אאוטס. ככל שיש יותר אאוטס — כדאי יותר להמשיך." },
  { term:"דרא (Draw)", desc:"מצב שבו היד שלך עדיין לא שלמה, אבל קלף אחד נוסף יכול להפוך אותה לחזקה. לדוגמה: 4 קלפים מאותו סדר = דרא לפלאש." },
  { term:"פוזיציה (Position)", desc:"מקומך ביחס לדילר. מי שמהמר אחרון (לייט פוזיציה) רואה מה עשו כולם לפניו — יתרון עצום. מי שמהמר ראשון (ארלי פוזיציה) פועל בלי מידע." },
  { term:"פוט אודס (Pot Odds)", desc:"היחס בין גודל הסיר לגובה ההימור שצריך לשלם. עוזר להחליט אם 'שווה' לקרוא. אם הסיר גדול מספיק ביחס לסיכוי שלך לנצח — כדאי לקרוא." },
  { term:"הול קארדס (Hole Cards)", desc:"2 הקלפים הסודיים שקיבלת בתחילת הסיבוב. רק אתה רואה אותם (עד השואדאון)." },
];

function parseCard(str) { return { rank: str.slice(0,-1), suit: str.slice(-1) }; }

function makeDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push(r+s);
  return d.sort(() => Math.random() - 0.5);
}

function evaluateHand(cards) {
  const rankVal = r => RANKS.indexOf(r);
  const suits = cards.map(c => c.slice(-1));
  const ranks = cards.map(c => c.slice(0,-1));
  const rc = {}; ranks.forEach(r => rc[r]=(rc[r]||0)+1);
  const counts = Object.values(rc).sort((a,b)=>b-a);
  const sc = {}; suits.forEach(s => sc[s]=(sc[s]||0)+1);
  const isFlush = Object.values(sc).some(c=>c>=5);
  const sr = [...new Set(ranks.map(rankVal))].sort((a,b)=>a-b);
  let isStraight = false;
  for(let i=0;i<=sr.length-5;i++) if(sr[i+4]-sr[i]===4 && new Set(sr.slice(i,i+5)).size===5) isStraight=true;
  if(sr.includes(12) && sr.slice(0,4).join()==="0,1,2,3") isStraight=true;
  if(isFlush && isStraight){
    const fs=Object.entries(sc).find(([,c])=>c>=5)[0];
    const fr=cards.filter(c=>c.slice(-1)===fs).map(c=>rankVal(c.slice(0,-1))).sort((a,b)=>a-b);
    return fr.slice(-5).join()==="8,9,10,11,12"?{score:9,name:"רויאל פלאש"}:{score:8,name:"סטרייט פלאש"};
  }
  if(counts[0]===4) return {score:7,name:"פור אוף א קיינד"};
  if(counts[0]===3&&counts[1]>=2) return {score:6,name:"פול האוס"};
  if(isFlush) return {score:5,name:"פלאש"};
  if(isStraight) return {score:4,name:"סטרייט"};
  if(counts[0]===3) return {score:3,name:"שלישייה"};
  if(counts[0]===2&&counts[1]===2) return {score:2,name:"שני זוגות"};
  if(counts[0]===2) return {score:1,name:"זוג"};
  return {score:0,name:"קלף גבוה"};
}

function analyzeContext(playerHand, community) {
  const all = [...playerHand, ...community];
  const current = evaluateHand(all);
  const suits = all.map(c=>c.slice(-1));
  const ranks = all.map(c=>c.slice(0,-1));
  const rankVal = r=>RANKS.indexOf(r);
  const sc = {}; suits.forEach(s=>sc[s]=(sc[s]||0)+1);
  const rc = {}; ranks.forEach(r=>rc[r]=(rc[r]||0)+1);
  const maxSuit = Math.max(...Object.values(sc));
  const drawFlush = maxSuit === 4;
  const sr = [...new Set(ranks.map(rankVal))].sort((a,b)=>a-b);
  let drawStraight = false;
  for(let i=0;i<=sr.length-4;i++){
    if(sr[i+3]-sr[i]<=4 && new Set(sr.slice(i,i+4)).size===4) drawStraight=true;
  }
  const pairs = Object.entries(rc).filter(([,v])=>v>=2).map(([k])=>k);
  const highCards = ranks.filter(r=>["A","K","Q","J"].includes(r));
  const strength = Math.min(100, current.score*10 + (drawFlush?6:0)+(drawStraight?5:0)+pairs.length*4+highCards.length*2);
  let potential = "";
  if(drawFlush && current.score<5) potential = "⚡ קרוב מאוד לפלאש — עוד קלף מהסדר!";
  else if(drawStraight && current.score<4) potential = "🎯 דרא לסטרייט — חפש את הקלף שמשלים";
  else if(current.score>=5) potential = "💥 יד חזקה מאוד — הזמן לדחוף!";
  else if(current.score>=3) potential = "💪 יד טובה — שחק בביטחון";
  else if(current.score>=1) potential = "👍 יד בינונית — שמור עין על הלוח";
  else if(highCards.length>=2) potential = "🂡 שני קלפים גבוהים — פוטנציאל לפייר";
  else potential = "😐 יד חלשה — שקול מתי לפולד";
  return { current, strength, drawFlush, drawStraight, pairs, highCards, potential };
}

const STAGE_NAMES = { preflop:"פרה-פלופ", flop:"פלופ", turn:"טרן", river:"ריבר", showdown:"שואדאון" };
const STAGES = ["preflop","flop","turn","river","showdown"];

async function callClaude(prompt, onResult, onLoading) {
  if(onLoading) onLoading(true);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:900,
        system:`אתה מאסטר פוקר — מורה דידקטי מומחה לטקסס הולדם.
תמיד עונה בעברית. שפה חמה, ברורה, מעוררת מוטיבציה.
תשובות ממוקדות (2-4 משפטים). תסיים תמיד עם טיפ מעשי.`,
        messages:[{role:"user",content:prompt}]
      })
    });
    const data = await res.json();
    const text = data.content?.find(b=>b.type==="text")?.text || "בוא נמשיך לשחק! 🃏";
    onResult(text);
  } catch {
    onResult("...");
  }
  if(onLoading) onLoading(false);
}

// ─── Shared components ────────────────────────────────────────────────────────
function Card({ str, hidden=false, small=false, highlight=false }) {
  const { rank, suit } = parseCard(str);
  const color = SUIT_COLORS[suit];
  const w=small?40:60, h=small?58:86, r=small?5:8, fs=small?10:15;
  if(hidden) return(
    <div style={{width:w,height:h,borderRadius:r,background:"linear-gradient(135deg,#1a472a,#2d6a4f,#1a472a)",border:"2px solid #c9a84c",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"2px 3px 8px rgba(0,0,0,0.5)",flexShrink:0}}>
      <span style={{fontSize:fs+4,opacity:0.3,color:"#c9a84c"}}>♦</span>
    </div>
  );
  return(
    <div style={{width:w,height:h,borderRadius:r,background:highlight?"linear-gradient(135deg,#fffbe6,#fff8cc)":"#fafafa",border:highlight?"2px solid #c9a84c":"1.5px solid #ccc",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:highlight?"0 0 16px rgba(201,168,76,0.65),2px 3px 8px rgba(0,0,0,0.25)":"2px 3px 8px rgba(0,0,0,0.22)",position:"relative",flexShrink:0,transform:highlight?"translateY(-4px)":"none",transition:"all 0.3s ease"}}>
      <div style={{position:"absolute",top:3,left:5,fontSize:fs-1,fontWeight:700,color,lineHeight:1}}>{rank}</div>
      <div style={{fontSize:fs+8,color}}>{suit}</div>
      <div style={{position:"absolute",bottom:3,right:5,fontSize:fs-1,fontWeight:700,color,transform:"rotate(180deg)",lineHeight:1}}>{rank}</div>
    </div>
  );
}

function TeacherBubble({ message, loading, compact=false, gameCtx=null }) {
  return(
    <div style={{background:"linear-gradient(135deg,rgba(22,62,36,0.93),rgba(12,35,20,0.96))",border:"1px solid #c9a84c",borderRadius:12,padding:compact?"8px 10px":"15px 18px",display:"flex",gap:10,alignItems:"flex-start",marginBottom:compact?6:12,boxShadow:"0 4px 18px rgba(0,0,0,0.4)"}}>
      <div style={{width:compact?34:40,height:compact?34:40,borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#8b6914)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:compact?18:21,flexShrink:0,boxShadow:"0 2px 8px rgba(201,168,76,0.35)"}}>🎩</div>
      <div style={{flex:1}}>
        <div style={{color:"#c9a84c",fontSize:10,fontWeight:700,marginBottom:5,letterSpacing:1.2}}>מאסטר פוקר</div>
        {loading?(
          <div style={{display:"flex",gap:5,alignItems:"center"}}>
            {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#c9a84c",animation:"bounce 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}
            <span style={{fontSize:12,color:"#6a9a6a",marginRight:6}}>מנתח...</span>
          </div>
        ):(
          <div style={{color:"#d4e8d4",fontSize:compact?12:13,lineHeight:1.8,direction:"rtl",textAlign:"right"}}>
            {gameCtx
              ? <RichText text={message} gameCtx={gameCtx}/>
              : message
            }
            {gameCtx && <div style={{fontSize:10,color:"#6a9a6a",marginTop:4}}>💡 מילים <span style={{color:"#f0c040",borderBottom:"1px dashed #f0c040"}}>מודגשות</span> — לחצי להסבר</div>}
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({ label, variant="gold", onClick, full=false, disabled=false }) {
  const bg = {gold:"linear-gradient(135deg,#c9a84c,#8b6914)",green:"linear-gradient(135deg,#27ae60,#1e8449)",red:"linear-gradient(135deg,#c0392b,#922b21)",blue:"linear-gradient(135deg,#2980b9,#1a6090)",ghost:"rgba(255,255,255,0.07)"};
  return(
    <button disabled={disabled} onClick={onClick} style={{padding:"11px 16px",borderRadius:8,border:variant==="ghost"?"1px solid rgba(255,255,255,0.12)":"none",cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,background:disabled?"rgba(255,255,255,0.04)":bg[variant]||bg.gold,color:variant==="ghost"?"#8a9a8a":"#fff",width:full?"100%":"auto",opacity:disabled?0.5:1,boxShadow:disabled?"none":variant==="gold"?"0 3px 12px rgba(201,168,76,0.3)":"0 2px 6px rgba(0,0,0,0.3)",transition:"all 0.2s",flexShrink:0}}>
      {label}
    </button>
  );
}

const ACTION_META = {
  call:  { label:"✅ קול",   variant:"green", kw:"קול"  },
  raise: { label:"📈 ריייז", variant:"blue",  kw:"ריייז" },
  fold:  { label:"❌ פולד",  variant:"red",   kw:"פולד" },
};

function ActionBtnWithHelp({ action, onClick, gameCtx }) {
  const [showHelp, setShowHelp] = useState(false);
  const { label, variant, kw } = ACTION_META[action];
  const def = TERM_DEFS[kw];
  const bg = {green:"linear-gradient(135deg,#27ae60,#1e8449)",blue:"linear-gradient(135deg,#2980b9,#1a6090)",red:"linear-gradient(135deg,#c0392b,#922b21)"};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:0}}>
      <div style={{display:"flex",gap:3}}>
        <button onClick={onClick} style={{flex:1,padding:"11px 6px",borderRadius:"8px 0 0 8px",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:bg[variant],color:"#fff",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}>
          {label}
        </button>
        <button onClick={()=>setShowHelp(h=>!h)} style={{width:28,borderRadius:"0 8px 8px 0",border:"none",cursor:"pointer",background:showHelp?"rgba(240,192,64,0.3)":"rgba(255,255,255,0.12)",color:showHelp?"#f0c040":"#8a9a8a",fontWeight:700,fontSize:13,fontFamily:"inherit"}}>
          ?
        </button>
      </div>
      {showHelp && def && (
        <div style={{background:"rgba(10,30,15,0.97)",border:"1px solid rgba(240,192,64,0.45)",borderRadius:8,padding:"10px 12px",marginTop:4,fontSize:12,lineHeight:1.75,direction:"rtl",animation:"slideIn 0.2s ease"}}>
          <div style={{color:"#d4e8d4",marginBottom:6}}>{def.generic}</div>
          <div style={{color:"#f0c040",borderTop:"1px solid rgba(240,192,64,0.2)",paddingTop:6}}>✦ {def.specific(gameCtx||{})}</div>
          <div onClick={()=>setShowHelp(false)} style={{textAlign:"center",color:"#6a9a6a",fontSize:11,marginTop:7,cursor:"pointer"}}>סגור ×</div>
        </div>
      )}
    </div>
  );
}

function StrengthBar({ value, label }) {
  const col = value<30?"#e74c3c":value<55?"#f39c12":value<78?"#27ae60":"#c9a84c";
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:10,color:"#6a9a6a"}}>חוזק היד</span>
        <span style={{fontSize:11,fontWeight:700,color:col}}>{label}</span>
      </div>
      <div style={{height:7,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:`linear-gradient(90deg,${col}aa,${col})`,borderRadius:4,transition:"width 0.7s ease"}}/>
      </div>
    </div>
  );
}

function Tag({ emoji, text, color="#c9a84c" }) {
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:4,background:`${color}18`,border:`1px solid ${color}40`,borderRadius:20,padding:"3px 9px",fontSize:11,color,flexShrink:0}}>
      {emoji} {text}
    </span>
  );
}

// ─── Clickable term definitions ───────────────────────────────────────────────
const TERM_DEFS = {
  "פלופ":    { generic:"3 קלפים משותפים שנחשפים על השולחן בבת אחת, אחרי סיבוב ההימורים הראשון.", specific:(c)=>c.community?.length>=3?`בסיבוב הזה הפלופ הוא: ${c.community.slice(0,3).join(" ")}`:"הפלופ עוד לא נחשף בסיבוב הזה." },
  "טרן":     { generic:"הקלף המשותף הרביעי שנחשף על השולחן, אחרי הפלופ.", specific:(c)=>c.community?.length>=4?`הטרן בסיבוב הזה הוא: ${c.community[3]}`:"הטרן עוד לא נחשף." },
  "ריבר":    { generic:"הקלף המשותף החמישי והאחרון — אחריו ההימור האחרון ואז גילוי קלפים.", specific:(c)=>c.community?.length>=5?`הריבר בסיבוב הזה הוא: ${c.community[4]}`:"הריבר עוד לא נחשף." },
  "פרה-פלופ":{ generic:"השלב הראשון של המשחק — לפני שנחשפים קלפים משותפים. כל שחקן רואה רק את 2 הקלפים שלו.", specific:(c)=>c.stage==="preflop"?"אנחנו עכשיו בדיוק בפרה-פלופ!":"הפרה-פלופ כבר עבר בסיבוב הזה." },
  "שואדאון": { generic:"סוף הסיבוב — כל מי שנשאר חושף קלפים. הקומבינציה הטובה ביותר מ-7 קלפים מנצחת.", specific:(c)=>c.stage==="showdown"?"הגענו לשואדאון — הקלפים נחשפים עכשיו!":"השואדאון יגיע בסוף הסיבוב הזה." },
  "ריייז":   { generic:"להעלות את ההימור מעל מה שהניחו לפניך. מכריח שחקנים אחרים לשלם יותר — או לפולד.", specific:(c)=>`אם תריייז עכשיו, תוסיף 60 לסיר. הסיר יגיע ל-${(c.pot||0)+60}. הבוט יצטרך להחליט — לשלם או לסגת.` },
  "קול":     { generic:"להשוות להימור הקיים — לא יותר, לא פחות. נשארים במשחק בלי להסלים.", specific:(c)=>`קול עכשיו = להוסיף 20 לסיר. הסיר יגיע ל-${(c.pot||0)+20} ותמשיך לשלב הבא.` },
  "פולד":    { generic:"לוותר על הסיבוב. מפסידים מה שהמרת עד כה, אבל לא מסכנים צ'יפים נוספים.", specific:(c)=>`אם תפולד עכשיו, הבוט מנצח את הסיר (${c.pot||0} צ'יפים). הקלפים שלך — ${c.playerHand?.join(" ")||"?"} — נשארים חבויים.` },
  "צ'ק":     { generic:"לעבור הלאה בלי להמר — אפשרי רק אם אף אחד לא ריייז לפניך בסיבוב הזה.", specific:(c)=>c.stage==="preflop"?"בפרה-פלופ לא ניתן לצ'ק — יש ביג בלינד פתוח שצריך להשוות.":"אם אף אחד לא ריייז — תוכל לצ'ק וללכת לשלב הבא בחינם." },
  "קיקר":    { generic:"קלף שובר שוויון — כשלשני שחקנים יש אותה קומבינציה, הקיקר מכריע מי מנצח.", specific:(c)=>c.playerHand?`למשל: אם גם לך וגם ליריב יש זוג אסים, הקלף השני שלך (${c.playerHand.find(card=>!card.startsWith("A"))||"?"}) יחליט מי מנצח.`:"הקיקר חשוב במיוחד כשיש זוגות גבוהים." },
  "בלוף":    { generic:"להמר בחוזקה כשיש לך יד חלשה — כדי לגרום ליריב לחשוב שיש לך יד חזקה ולפולד.", specific:(c)=>`עם ${c.playerHand?.join(" ")||"?"} — ${(c.currentScore||0)<2?"יד חלשה, בלוף יכול להיות רעיון אם הלוח מאיים":"יש לך יד סבירה, לא חייב לבלוף"}.` },
  "אאוטס":  { generic:"הקלפים שנשארו בחפיסה שיכולים לשפר את היד שלך. יותר אאוטס = כדאי יותר להמשיך.", specific:(c)=>c.drawFlush?"יש לך דרא לפלאש — בערך 9 אאוטס, סיכוי טוב!":c.drawStraight?"יש לך דרא לסטרייט — בערך 4-8 אאוטס.":"קשה לאמוד אאוטס ספציפיים כרגע בלי לדעת את כל הקלפים." },
  "דרא":     { generic:"מצב שהיד שלך לא שלמה, אבל קלף אחד נוסף יכול להפוך אותה לחזקה.", specific:(c)=>c.drawFlush?"יש לך דרא לפלאש — 4 קלפים מאותו סדר, חסר עוד אחד!":c.drawStraight?"יש לך דרא לסטרייט — קלפים ברצף, חסר הקישור!":"כרגע לא נראה שיש דרא ברור." },
  "פוזיציה": { generic:"המקום שלך ביחס לדילר. מאוחר יותר = רואים מה כולם עושים לפניך = יתרון גדול.", specific:(c)=>"בסיבוב הזה: מיקום מאוחר (CO/BTN) מאפשר לך לראות אם כולם פולדים לפניך — ויתרון עצום." },
  "פוט אודס":{ generic:"יחס בין גודל הסיר לגובה ההמר שצריך לשלם. עוזר להחליט אם 'שווה' לקרוא.", specific:(c)=>`הסיר עכשיו ${c.pot||0}. קול עולה 20. זה יחס 1:${Math.round((c.pot||40)/20)} — ככל שהיחס גבוה יותר, כדאי יותר לקרוא.` },
  "בלינד":   { generic:"הימור חובה לפני שרואים קלפים. סמול בלינד = 10, ביג בלינד = 20. יוצר סיר ומניע משחק.", specific:(c)=>`הסיר התחיל מ-40 (20+20 בלינדים). כרגע הסיר הוא ${c.pot||40} אחרי ההימורים עד כה.` },
  "סיר":     { generic:"סכום כל ההימורים בסיבוב. מי שמנצח — לוקח הכל.", specific:(c)=>`הסיר הנוכחי הוא ${c.pot||0} צ'יפים.` },
  "הולקארדס":{ generic:"2 הקלפים הסודיים שקיבלת — רק אתה רואה אותם (עד שואדאון).", specific:(c)=>c.playerHand?`הקלפים שלך: ${c.playerHand.join(" ")}`:"הקלפים שלך חבויים." },
};

// מילות מפתח לפי אורך (כדי לזהות קודם ביטויים ארוכים יותר)
const KEYWORDS = Object.keys(TERM_DEFS).sort((a,b)=>b.length-a.length);

function splitTextByKeywords(text) {
  const parts = [];
  let remaining = text;
  while(remaining.length > 0) {
    let found = false;
    for(const kw of KEYWORDS) {
      const idx = remaining.indexOf(kw);
      if(idx !== -1) {
        if(idx > 0) parts.push({ text: remaining.slice(0, idx), isKw: false });
        parts.push({ text: kw, isKw: true });
        remaining = remaining.slice(idx + kw.length);
        found = true; break;
      }
    }
    if(!found) { parts.push({ text: remaining, isKw: false }); break; }
  }
  return parts;
}

function RichText({ text, gameCtx, style }) {
  const [openKw, setOpenKw] = useState(null);
  const parts = splitTextByKeywords(text);
  return (
    <span style={style}>
      {parts.map((p, i) => {
        if(!p.isKw) return <span key={i}>{p.text}</span>;
        const def = TERM_DEFS[p.text];
        const isOpen = openKw === i;
        return (
          <span key={i} style={{display:"inline"}}>
            <span
              onClick={()=>setOpenKw(isOpen?null:i)}
              style={{color:"#f0c040",borderBottom:"1px dashed #f0c040",cursor:"pointer",fontWeight:700,userSelect:"none"}}
            >{p.text}</span>
            {isOpen && def && (
              <span style={{display:"block",background:"rgba(10,30,15,0.97)",border:"1px solid rgba(240,192,64,0.5)",borderRadius:8,padding:"10px 12px",margin:"6px 0 4px",fontSize:12,lineHeight:1.75,animation:"slideIn 0.2s ease",direction:"rtl"}}>
                <span style={{display:"block",color:"#d4e8d4",marginBottom:6}}>{def.generic}</span>
                <span style={{display:"block",color:"#f0c040",borderTop:"1px solid rgba(240,192,64,0.2)",paddingTop:6}}>
                  ✦ {def.specific(gameCtx||{})}
                </span>
                <span onClick={()=>setOpenKw(null)} style={{display:"block",textAlign:"center",color:"#6a9a6a",fontSize:11,marginTop:8,cursor:"pointer"}}>סגור ×</span>
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}


function GlossaryScreen({ onExit }) {
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState("");

  const filtered = GLOSSARY.filter(g =>
    g.term.toLowerCase().includes(search) ||
    g.desc.includes(search)
  );

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 20%,#0d3320,#061a0e 40%,#030d07 100%)",fontFamily:"Georgia,serif",color:"#d4e8d4",padding:"16px 14px 30px",direction:"rtl"}}>
      <style>{`@keyframes slideDown{from{opacity:0;max-height:0}to{opacity:1;max-height:400px}}`}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={onExit} style={{padding:"7px 13px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#8a9a8a",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>← חזרה</button>
        <div style={{fontSize:20,fontWeight:700,color:"#c9a84c",letterSpacing:1}}>📖 מילון מינוחים</div>
      </div>

      <div style={{fontSize:12,color:"#6a9a6a",marginBottom:12}}>לחץ על מונח לפתיחה / סגירה</div>

      {/* Search */}
      <input
        value={search}
        onChange={e=>setSearch(e.target.value)}
        placeholder="🔍 חפש מונח..."
        style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:9,border:"1px solid rgba(201,168,76,0.3)",background:"rgba(255,255,255,0.05)",color:"#d4e8d4",fontFamily:"Georgia,serif",fontSize:13,marginBottom:12,direction:"rtl",outline:"none"}}
      />

      {/* Terms */}
      <div style={{display:"grid",gap:6}}>
        {filtered.map((g,i) => {
          const isOpen = open === i;
          return (
            <div key={i}
              style={{background:isOpen?"rgba(201,168,76,0.09)":"rgba(255,255,255,0.04)",border:isOpen?"1px solid rgba(201,168,76,0.45)":"1px solid rgba(201,168,76,0.15)",borderRadius:10,overflow:"hidden",transition:"border 0.2s"}}
            >
              {/* Row — always visible, tap to toggle */}
              <div
                onClick={()=>setOpen(isOpen?null:i)}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer",userSelect:"none"}}
              >
                <span style={{fontWeight:700,color:isOpen?"#c9a84c":"#d4e8d4",fontSize:13}}>{g.term}</span>
                <span style={{fontSize:16,color:"#c9a84c",transition:"transform 0.25s",transform:isOpen?"rotate(90deg)":"none",flexShrink:0,marginRight:4}}>▶</span>
              </div>

              {/* Description — shown only when open */}
              {isOpen && (
                <div style={{padding:"0 14px 14px",color:"#a8c8b8",fontSize:13,lineHeight:1.8,borderTop:"1px solid rgba(201,168,76,0.15)",paddingTop:10,animation:"slideDown 0.25s ease"}}>
                  {g.desc}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length===0 && (
          <div style={{textAlign:"center",color:"#6a9a6a",padding:30,fontSize:13}}>לא נמצאו מונחים</div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COACHED MODE
// ═══════════════════════════════════════════════════════════════════
function CoachMode({ onExit }) {
  const [gs, setGs] = useState(null);
  const [stage, setStage] = useState("preflop");
  const [revealed, setRevealed] = useState(0);
  const [pot, setPot] = useState(40);
  const [playerChips, setPlayerChips] = useState(1000);
  const [botChips, setBotChips] = useState(1000);

  const [coachMsg, setCoachMsg] = useState("");
  const [coachLoading, setCoachLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [phase, setPhase] = useState("coach");
  const [quizChoice, setQuizChoice] = useState(null);
  const [concept, setConcept] = useState("");
  const [actionLog, setActionLog] = useState([]);
  const [isResult, setIsResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [score, setScore] = useState({ good:0, total:0 });
  const [roundNum, setRoundNum] = useState(1);
  const [showGlossary, setShowGlossary] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(null);

  const CONCEPTS = [
    { key:"pot-odds", label:"Pot Odds", emoji:"🎲", prompt: (ph, bh, comm) =>
        `הסבר מה זה Pot Odds בפוקר בצורה פשוטה. השחקן מחזיק ${ph.join(",")} ועל הלוח ${comm.join(",")||"עוד אין קלפים"}.` },
    { key:"position", label:"פוזיציה", emoji:"📍", prompt: (ph) =>
        `הסבר בקצרה למה פוזיציה (position) חשובה בפוקר. השחקן מחזיק ${ph.join(",")}.` },
    { key:"bluff", label:"בלוף", emoji:"🎭", prompt: (ph, bh, comm) =>
        `האם זה מצב טוב לבלוף? השחקן מחזיק ${ph.join(",")}${comm.length?" ולוח "+comm.join(","):""}.` },
    { key:"outs", label:"Outs", emoji:"🎯", prompt: (ph, bh, comm) =>
        `כמה outs יש לשחקן עם ${ph.join(",")} ולוח ${comm.join(",")||"ריק"}? הסבר מה זה outs.` },
    { key:"aggression", label:"אגרסיביות", emoji:"⚔️", prompt: (ph) =>
        `מתי כדאי לשחק אגרסיבי ומתי לא? דוגמה עם הקלפים ${ph.join(",")}.` },
    { key:"reads", label:"קריאת יריב", emoji:"🔍", prompt: (ph) =>
        `כיצד ניתן לקרוא את היריב בפוקר? מה כדאי לשים לב אליו כשהיריב מהמר?` },
  ];

  const deal = useCallback(() => {
    const deck = makeDeck();
    const ph = [deck.pop(), deck.pop()];
    const bh = [deck.pop(), deck.pop()];
    const comm = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
    const newGs = { playerHand:ph, botHand:bh, community:comm };
    setGs(newGs);
    setStage("preflop"); setRevealed(0); setPot(40);
    setFeedback(""); setIsResult(false); setResultData(null);
    setActionLog([]); setQuizChoice(null); setPhase("coach");

    const picked = CONCEPTS[Math.floor(Math.random()*CONCEPTS.length)];
    setConcept(picked.key);

    const ctx = analyzeContext(ph, []);
    callClaude(
      `שחקן מקבל ${ph.join(",")} בפרה-פלופ בטקסס הולדם.
חוזק הקלפים: ${ctx.current.name}. ${ctx.potential}.
כמורה דידקטי, תסביר בקצרה מה לחשוב כשרואים קלפים אלה לראשונה ואיך להחליט מה לעשות בפרה-פלופ.`,
      setCoachMsg, setCoachLoading
    );
  }, []);

  useEffect(() => { deal(); }, [deal]);

  const advanceToStage = (newStage) => {
    const r = newStage==="flop"?3:newStage==="turn"?4:5;
    setStage(newStage); setRevealed(r);
  };

  const doAction = (action) => {
    if(!gs) return;
    const isGood = quizChoice===action;
    setScore(s=>({good:isGood?s.good+1:s.good, total:s.total+1}));
    setActionLog(l=>[{action,round:stage,id:Date.now()},...l].slice(0,8));
    trackEvent("player_action", { action, mode: "coached", stage, quiz_correct: isGood });

    let newPot = pot;
    if(action==="call") newPot += 20;
    if(action==="raise") newPot += 60;
    setPot(newPot);

    if(action==="fold"){
      setBotChips(c=>c+newPot);
      setIsResult(true);
      setResultData({ type:"fold" });
      const picked = CONCEPTS.find(c=>c.key===concept);
      callClaude(
        `השחקן פולד עם ${gs.playerHand.join(",")}.
${quizChoice?"הוא ניחש שיעשה "+quizChoice+" אך בחר "+action+".":""}
${picked?picked.prompt(gs.playerHand,gs.botHand,gs.community.slice(0,revealed)):""}
תן פידבק על ההחלטה ולמד את מושג ה-${concept} מהמקרה הזה.`,
        setFeedback, setFeedbackLoading
      );
      setPhase("result"); return;
    }

    const si = STAGES.indexOf(stage);
    const nextStage = STAGES[Math.min(si+1,4)];

    if(nextStage==="showdown" || si>=3){
      const all5 = gs.community;
      const pe = evaluateHand([...gs.playerHand,...all5]);
      const be = evaluateHand([...gs.botHand,...all5]);
      const won = pe.score>be.score, tied=pe.score===be.score;
      if(won) setPlayerChips(c=>c+newPot);
      else if(!tied) setBotChips(c=>c+newPot);
      else { setPlayerChips(c=>c+newPot/2); setBotChips(c=>c+newPot/2); }
      setStage("showdown"); setRevealed(5);
      setIsResult(true);
      setResultData({ type:"showdown", pe, be, won, tied });
      const picked = CONCEPTS.find(c=>c.key===concept);
      callClaude(
        `סיבוב הסתיים. שחקן: ${gs.playerHand.join(",")} → ${pe.name}. בוט: ${be.name}. ${won?"שחקן ניצח!":tied?"תיקו!":"בוט ניצח."}
${picked?picked.prompt(gs.playerHand,gs.botHand,gs.community):""}
תן ניתוח מלא של הסיבוב ולמד את מושג ה-${concept}.`,
        setFeedback, setFeedbackLoading
      );
      setPhase("result");
    } else {
      advanceToStage(nextStage);
      setQuizChoice(null); setPhase("coach");
      const comm = gs.community.slice(0, nextStage==="flop"?3:nextStage==="turn"?4:5);
      const ctx = analyzeContext(gs.playerHand, comm);
      const picked = CONCEPTS.find(c=>c.key===concept);
      callClaude(
        `שלב ${STAGE_NAMES[nextStage]} נפתח. לוח: ${comm.join(",")}. קלפי השחקן: ${gs.playerHand.join(",")}.
חוזק נוכחי: ${ctx.current.name}. ${ctx.potential}.
${picked?picked.prompt(gs.playerHand,gs.botHand,comm):""}
כמורה, הסבר מה חשוב לחשוב עכשיו ואיך המושג ${concept} רלוונטי לשלב זה.`,
        setCoachMsg, setCoachLoading
      );
    }
  };

  if(!gs) return <div style={{color:"#6a9a6a",textAlign:"center",padding:40}}>מכין שולחן...</div>;

  const communityShow = gs.community.slice(0, revealed);
  const ctx = analyzeContext(gs.playerHand, communityShow);
  const stageIdx = STAGES.indexOf(stage);
  const pickedConcept = CONCEPTS.find(c=>c.key===concept);

  const cs = {
    app:{height:"100vh",overflow:"hidden",background:"radial-gradient(ellipse at 15% 10%,#081e10,#040c07 70%)",fontFamily:"Georgia,serif",color:"#d4e8d4",padding:"8px 12px",direction:"rtl",display:"flex",flexDirection:"column",gap:0},
    panel:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:8,padding:"7px 10px",marginBottom:6},
    quizBtn:(active)=>({flex:1,padding:"7px 4px",borderRadius:7,border:active?"2px solid #c9a84c":"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,fontWeight:700,background:active?"rgba(201,168,76,0.18)":"rgba(255,255,255,0.05)",color:active?"#c9a84c":"#a0b0a0",transition:"all 0.2s"}),
  };

  return(
    <div style={cs.app}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}} @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={onExit} style={{padding:"6px 12px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#8a9a8a",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>← יציאה</button>
        <div style={{fontSize:14,fontWeight:700,color:"#c9a84c",letterSpacing:0.5}}>🎓 לומד תוך כדי משחק</div>
        <div style={{fontSize:11,color:"#6a9a6a"}}>סיבוב {roundNum}</div>
      </div>

      {/* Stats row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:11,color:"#c9a84c",fontWeight:700}}>💰 {playerChips}</div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {score.total>0 && <div style={{fontSize:10,color:score.good/score.total>=0.6?"#27ae60":"#f39c12"}}>✓ {score.good}/{score.total}</div>}
          <div style={{background:"rgba(201,168,76,0.14)",border:"1px solid rgba(201,168,76,0.28)",borderRadius:18,padding:"2px 12px",fontSize:11,color:"#c9a84c",fontWeight:700}}>סיר {pot}</div>
        </div>
        <div style={{fontSize:11,color:"#6a9a6a",fontWeight:700}}>🤖 {botChips}</div>
      </div>

      {/* Stage track */}
      <div style={{display:"flex",gap:2,marginBottom:4}}>
        {["פרה-פלופ","פלופ","טרן","ריבר"].map((n,i)=>(
          <div key={n} style={{flex:1}}>
            <div style={{height:4,borderRadius:2,background:i<stageIdx?"#c9a84c":i===stageIdx?"rgba(201,168,76,0.55)":"rgba(255,255,255,0.07)",transition:"background 0.4s"}}/>
            <div style={{fontSize:8,color:i<=stageIdx?"#c9a84c":"#333",textAlign:"center",marginTop:2}}>{n}</div>
          </div>
        ))}
      </div>

      {/* Concept of round */}
      {pickedConcept && (
        <div style={{marginBottom:10,display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,color:"#6a9a6a"}}>מושג הסיבוב:</span>
          <Tag emoji={pickedConcept.emoji} text={pickedConcept.label}/>
        </div>
      )}

      {/* Coach bubble */}
      <TeacherBubble message={coachMsg} loading={coachLoading} compact
        gameCtx={{playerHand:gs.playerHand, community:communityShow, pot, stage, currentScore:ctx.current.score, drawFlush:ctx.drawFlush, drawStraight:ctx.drawStraight}}
      />

      {/* Bot row */}
      <div style={{...cs.panel,marginBottom:5}}>
        <div style={{fontSize:9,color:"#6a9a6a",marginBottom:4}}>🤖 יריב</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {(isResult&&stage==="showdown")
            ? gs.botHand.map((c,i)=><Card key={i} str={c} small/>)
            : gs.botHand.map((_,i)=><Card key={i} str="X♠" hidden small/>)
          }
          {isResult&&resultData?.be && <span style={{fontSize:11,color:"#6a9a6a",marginRight:8}}>{resultData.be.name}</span>}
        </div>
      </div>

      {/* Community */}
      <div style={cs.panel}>
        <div style={{fontSize:10,color:"#6a9a6a",marginBottom:7}}>🂠 לוח — {STAGE_NAMES[stage]}</div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {communityShow.map((c,i)=><Card key={i} str={c}/>)}
          {Array(5-communityShow.length).fill(null).map((_,i)=>(
            <div key={i} style={{width:60,height:86,borderRadius:8,border:"2px dashed rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{color:"rgba(201,168,76,0.12)",fontSize:16}}>?</span>
            </div>
          ))}
        </div>
      </div>

      {/* Player hand + analysis */}
      <div style={{...cs.panel,border:"1px solid rgba(201,168,76,0.35)"}}>
        <div style={{fontSize:10,color:"#c9a84c",marginBottom:8}}>✋ הקלפים שלך</div>
        <div style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:10}}>
          <div style={{display:"flex",gap:5}}>
            {gs.playerHand.map((c,i)=><Card key={i} str={c} highlight/>)}
          </div>
          <div style={{flex:1,minWidth:0,paddingTop:2}}>
            <StrengthBar value={ctx.strength} label={ctx.current.name}/>
            <div style={{fontSize:11,color:"#a0c0a0",marginTop:5,lineHeight:1.5}}>{ctx.potential}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {ctx.drawFlush && <Tag emoji="🃏" text="דרא לפלאש" color="#9b59b6"/>}
          {ctx.drawStraight && <Tag emoji="↔️" text="דרא לסטרייט" color="#3498db"/>}
          {ctx.pairs.length>0 && <Tag emoji="👫" text={`${ctx.pairs.length} זוג`} color="#27ae60"/>}
          {ctx.highCards.length>0 && <Tag emoji="👑" text={ctx.highCards.slice(0,2).join(",")} color="#c9a84c"/>}
        </div>
      </div>

      {/* Quiz - what would you do? */}
      {!isResult && (
        <div style={{...cs.panel,border:"1px solid rgba(52,152,219,0.35)",animation:"slideIn 0.4s ease"}}>
          <div style={{fontSize:11,color:"#3498db",fontWeight:700,marginBottom:7}}>🤔 מה הייית עושה?</div>
          <div style={{display:"flex",gap:6}}>
            {[{v:"call",l:"✅ קול"},{v:"raise",l:"📈 ריייז"},{v:"fold",l:"❌ פולד"}].map(({v,l})=>(
              <button key={v} style={cs.quizBtn(quizChoice===v)} onClick={()=>setQuizChoice(v)}>{l}</button>
            ))}
          </div>
          {quizChoice && <div style={{fontSize:10,color:"#6a9a6a",marginTop:6}}>בחרת {quizChoice==="call"?"קול":quizChoice==="raise"?"ריייז":"פולד"} — עכשיו בצע את הפעולה בכפתורים למטה</div>}
        </div>
      )}

      {/* Feedback panel */}
      {(feedback||feedbackLoading) && (
        <div style={{...cs.panel,border:"1px solid rgba(201,168,76,0.32)",animation:"slideIn 0.5s ease"}}>
          <div style={{fontSize:10,color:"#c9a84c",fontWeight:700,marginBottom:6}}>📝 ניתוח + מושג: {pickedConcept?.label}</div>
          {feedbackLoading
            ? <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#c9a84c",animation:"bounce 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}</div>
            : <div style={{color:"#d4e8d4",fontSize:12,lineHeight:1.8}}>{feedback}</div>
          }
        </div>
      )}

      {/* Action log */}
      {actionLog.length>0 && (
        <div style={{marginBottom:10}}>
          {actionLog.slice(0,3).map((l,i)=>(
            <div key={l.id} style={{fontSize:10,color:l.action==="fold"?"#e74c3c":l.action==="raise"?"#f39c12":"#27ae60",opacity:1-i*0.3,marginBottom:2}}>
              {l.round} → {l.action==="fold"?"❌ פולד":l.action==="raise"?"📈 ריייז":"✅ קול"}
            </div>
          ))}
        </div>
      )}

      {/* Result banner */}
      {isResult && resultData && (
        <div style={{
          background:resultData.type==="fold"?"rgba(192,57,43,0.2)":resultData.won?"rgba(39,174,96,0.2)":resultData.tied?"rgba(201,168,76,0.14)":"rgba(192,57,43,0.2)",
          border:`1px solid ${resultData.type==="fold"?"#e74c3c":resultData.won?"#27ae60":resultData.tied?"#c9a84c":"#e74c3c"}`,
          borderRadius:10,padding:12,textAlign:"center",marginBottom:10,animation:"slideIn 0.5s ease"
        }}>
          <div style={{fontSize:22,marginBottom:4}}>
            {resultData.type==="fold"?"🏳️":resultData.won?"🏆":resultData.tied?"🤝":"💸"}
          </div>
          <div style={{fontWeight:700,fontSize:14,color:"#fff",marginBottom:3}}>
            {resultData.type==="fold"?"פולדת — הבוט מנצח":resultData.won?"ניצחת!":resultData.tied?"תיקו!":"הפסדת"}
          </div>
          {resultData.pe&&<div style={{fontSize:11,color:"#a0c0a0"}}>שלך: {resultData.pe.name} · בוט: {resultData.be.name}</div>}
          {score.total>0&&<div style={{marginTop:6,fontSize:11,color:"#c9a84c"}}>ניחושים נכונים: {score.good}/{score.total} ({Math.round(score.good/score.total*100)}%)</div>}
        </div>
      )}

      {/* Action buttons */}
      {!isResult ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {["call","raise","fold"].map(a=>(
            <ActionBtnWithHelp key={a} action={a} onClick={()=>doAction(a)}
              gameCtx={{playerHand:gs.playerHand, community:communityShow, pot, stage, currentScore:ctx.current.score, drawFlush:ctx.drawFlush, drawStraight:ctx.drawStraight}}
            />
          ))}
        </div>
      ):(
        <Btn label="🔄 סיבוב חדש — בוא נלמד עוד!" variant="gold" full onClick={()=>{setRoundNum(n=>n+1);deal();}}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WHAT BEATS WHAT — reference screen
// ═══════════════════════════════════════════════════════════════════
const RANKED_HANDS = [
  { rank:9, name:"רויאל פלאש",        color:"#c9a84c", cards:["10♠","J♠","Q♠","K♠","A♠"],  why:"A K Q J 10 מאותו סדר — הקומבינציה הנדירה ביותר. לא ניתן להכות אותה." },
  { rank:8, name:"סטרייט פלאש",       color:"#9b59b6", cards:["5♣","6♣","7♣","8♣","9♣"],   why:"5 קלפים ברצף מאותו סדר. ניתן להכות רק ברויאל פלאש." },
  { rank:7, name:"פור אוף א קיינד",   color:"#e74c3c", cards:["K♠","K♥","K♦","K♣","3♠"],   why:"4 קלפים זהים. יד עצומה — כמעט בלתי מנוצחת." },
  { rank:6, name:"פול האוס",          color:"#e67e22", cards:["Q♠","Q♥","Q♦","7♣","7♠"],   why:"שלישייה + זוג. כשיש שני פול האוס — השלישייה הגבוהה מנצחת." },
  { rank:5, name:"פלאש",             color:"#27ae60", cards:["2♥","6♥","9♥","J♥","A♥"],   why:"5 קלפים מאותו סדר (לא ברצף). הקלף הגבוה ביותר מכריע בשוויון." },
  { rank:4, name:"סטרייט",           color:"#2980b9", cards:["7♠","8♥","9♦","10♣","J♠"],  why:"5 קלפים ברצף (לא אותו סדר). האס יכול להיות גם 1 (A-2-3-4-5)." },
  { rank:3, name:"שלישייה",          color:"#8e44ad", cards:["J♠","J♥","J♦","4♣","9♠"],   why:"3 קלפים זהים. שני הקלפים הנותרים = קיקר (שוברי שוויון)." },
  { rank:2, name:"שני זוגות",        color:"#16a085", cards:["A♠","A♥","8♦","8♣","K♠"],   why:"שני זוגות שונים. הזוג הגבוה מכריע. אם שווים — הזוג השני. אם שווים — הקיקר." },
  { rank:1, name:"זוג",              color:"#2980b9", cards:["K♠","K♦","A♥","9♣","4♠"],   why:"2 קלפים זהים. 3 קלפים בודדים = קיקרים. הקיקר הגבוה מכריע בשוויון." },
  { rank:0, name:"קלף גבוה",         color:"#7f8c8d", cards:["2♠","5♥","8♦","J♣","A♥"],   why:"אין שום קומבינציה. הקלף הגבוה ביותר מנצח בשוויון. היד החלשה ביותר." },
];

function WhatBeatsWhat({ onExit }) {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 20%,#0d3320,#061a0e 40%,#030d07 100%)",fontFamily:"Georgia,serif",color:"#d4e8d4",padding:"16px 14px 32px",direction:"rtl"}}>
      <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <button onClick={onExit} style={{padding:"7px 13px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#8a9a8a",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>← חזרה</button>
        <div style={{fontSize:18,fontWeight:700,color:"#c9a84c"}}>⚔️ מה לוקח מה</div>
      </div>
      <div style={{fontSize:11,color:"#6a9a6a",marginBottom:14,paddingRight:4}}>מהחזקה לחלשה — לחצי על יד לפרטים ודוגמה</div>

      <div style={{display:"grid",gap:8}}>
        {RANKED_HANDS.map((h,i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} onClick={()=>setOpenIdx(isOpen?null:i)}
              style={{background:isOpen?`${h.color}14`:"rgba(255,255,255,0.04)",border:`1px solid ${isOpen?h.color+"80":"rgba(255,255,255,0.08)"}`,borderRadius:11,overflow:"hidden",cursor:"pointer",transition:"all 0.25s"}}>

              {/* Header row — always visible */}
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px"}}>
                {/* Rank badge */}
                <div style={{width:28,height:28,borderRadius:"50%",background:h.rank===9?"linear-gradient(135deg,#c9a84c,#8b6914)":h.rank===0?"rgba(255,255,255,0.08)":`${h.color}30`,border:`1px solid ${h.color}60`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:700,color:h.rank===9?"#1a1a1a":h.color}}>#{10-i}</span>
                </div>
                {/* Name */}
                <span style={{fontWeight:700,fontSize:14,color:isOpen?h.color:"#d4e8d4",flex:1}}>{h.name}</span>
                {/* Mini card preview */}
                <div style={{display:"flex",gap:2,opacity:isOpen?0:1,transition:"opacity 0.2s"}}>
                  {h.cards.slice(0,3).map((c,ci)=>{
                    const {rank,suit}=parseCard(c);
                    return <span key={ci} style={{fontSize:11,color:SUIT_COLORS[suit],background:"rgba(255,255,255,0.08)",borderRadius:3,padding:"1px 4px",fontWeight:700}}>{rank}{suit}</span>;
                  })}
                </div>
                <span style={{fontSize:14,color:h.color,transition:"transform 0.25s",transform:isOpen?"rotate(90deg)":"none",flexShrink:0,marginRight:2}}>▶</span>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div style={{padding:"0 14px 14px",animation:"slideIn 0.25s ease"}}>
                  {/* Visual cards */}
                  <div style={{display:"flex",gap:5,marginBottom:12,flexWrap:"wrap"}}>
                    {h.cards.map((c,ci)=><Card key={ci} str={c} highlight/>)}
                  </div>
                  {/* Explanation */}
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#c8dcc8",lineHeight:1.75}}>
                    {h.why}
                  </div>
                  {/* What beats it / what it beats */}
                  <div style={{display:"flex",gap:8,marginTop:10}}>
                    {i>0&&<div style={{flex:1,background:"rgba(231,76,60,0.1)",border:"1px solid rgba(231,76,60,0.25)",borderRadius:7,padding:"7px 10px",fontSize:11,color:"#e74c3c",textAlign:"center"}}>
                      <div style={{fontWeight:700,marginBottom:2}}>מנוצחת על ידי</div>
                      <div>{RANKED_HANDS[i-1].name}</div>
                    </div>}
                    {i<RANKED_HANDS.length-1&&<div style={{flex:1,background:"rgba(39,174,96,0.1)",border:"1px solid rgba(39,174,96,0.25)",borderRadius:7,padding:"7px 10px",fontSize:11,color:"#27ae60",textAlign:"center"}}>
                      <div style={{fontWeight:700,marginBottom:2}}>מנצחת את</div>
                      <div>{RANKED_HANDS[i+1].name}</div>
                    </div>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HAND COMPARISON LEARN — visual "which wins?" mode
// ═══════════════════════════════════════════════════════════════════

// Pairs ordered easy → hard
const COMPARISON_LEVELS = [
  // Level 1 — very obvious
  { a:{name:"רויאל פלאש",  cards:["10♥","J♥","Q♥","K♥","A♥"], score:9},
    b:{name:"קלף גבוה",    cards:["2♠","5♥","8♦","J♣","K♣"],  score:0},
    why:"רויאל פלאש היא הקומבינציה הכי חזקה בפוקר — לא ניתן להכות אותה. קלף גבוה הוא הקומבינציה החלשה ביותר." },
  { a:{name:"פור אוף א קיינד", cards:["A♠","A♥","A♦","A♣","7♠"], score:7},
    b:{name:"זוג",             cards:["K♠","K♥","3♦","8♣","J♠"], score:1},
    why:"פור אוף א קיינד — 4 קלפים זהים — חזק בהרבה מזוג פשוט. ההפרש בדירוג הוא 6 רמות!" },
  { a:{name:"שלישייה",  cards:["Q♠","Q♥","Q♦","4♣","9♠"], score:3},
    b:{name:"זוג",      cards:["A♠","A♥","K♦","8♣","3♠"], score:1},
    why:"שלישייה תמיד מנצחת זוג — גם אם הזוג הוא אסים (הדירוג הכי גבוה לזוג). הקומבינציה חשובה יותר מגובה הקלפים." },
  // Level 2 — medium
  { a:{name:"פול האוס",  cards:["9♠","9♥","9♦","K♣","K♠"], score:6},
    b:{name:"פלאש",      cards:["2♥","5♥","9♥","J♥","A♥"], score:5},
    why:"פול האוס (שלישייה + זוג) חזק יותר מפלאש. חשוב לזכור: פול האוס = #4 מלמעלה, פלאש = #5." },
  { a:{name:"סטרייט",    cards:["7♠","8♥","9♦","10♣","J♠"], score:4},
    b:{name:"שני זוגות", cards:["A♠","A♥","K♦","K♣","Q♠"],  score:2},
    why:"סטרייט מנצח שני זוגות. גם אם שני הזוגות הם אסים-קינגים (חזקים מאוד), הסטרייט עדיין מנצח." },
  { a:{name:"פלאש",      cards:["3♦","6♦","9♦","J♦","A♦"], score:5},
    b:{name:"סטרייט",    cards:["5♠","6♥","7♦","8♣","9♠"],  score:4},
    why:"פלאש (אותו סדר) מנצח סטרייט (רצף). לזכור: F-S-T = פלאש-סטרייט-שלישייה בסדר יורד." },
  // Level 3 — same type, who wins?
  { a:{name:"זוג אסים",  cards:["A♠","A♥","K♦","8♣","3♠"], score:1, kicker:"K"},
    b:{name:"זוג אסים",  cards:["A♦","A♣","Q♠","8♥","3♦"], score:1, kicker:"Q"},
    why:"כשיש זוג זהה — הקיקר מכריע! K גבוה מ-Q, לכן הקלפים בשורת A עם K מנצחים. הקיקר = קלף שובר שוויון." },
  { a:{name:"פול האוס — 10s full", cards:["10♠","10♥","10♦","A♣","A♠"], score:6},
    b:{name:"פול האוס — 9s full",  cards:["9♠","9♥","9♦","A♦","A♥"],  score:6},
    why:"כשיש שני פול האוס — השלישייה מכריעה! 10-10-10 חזק מ-9-9-9, גם אם הזוג זהה." },
  { a:{name:"שני זוגות גבוהים", cards:["A♠","A♥","K♦","K♣","Q♠"], score:2},
    b:{name:"שני זוגות נמוכים", cards:["3♠","3♥","2♦","2♣","A♠"],  score:2},
    why:"שני זוגות נמדדים לפי הזוג הגבוה. A-A-K-K גבוה בהרבה מ-3-3-2-2, גם שיש A בצד השני." },
];

function HandComparisonLearn({ onExit }) {
  const [step, setStep]         = useState(0);
  const [chosen, setChosen]     = useState(null); // "a" | "b" | null
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore]       = useState(0);
  const [showRef, setShowRef]   = useState(false);

  const total = COMPARISON_LEVELS.length;
  const current = COMPARISON_LEVELS[step];
  const correctSide = current.a.score >= current.b.score ? "a" : "b";
  const isDone = step >= total;

  const handleChoose = (side) => {
    if(showAnswer) return;
    setChosen(side);
    if(side === correctSide) setScore(s=>s+1);
    setShowAnswer(true);
  };

  const handleNext = () => {
    setChosen(null); setShowAnswer(false);
    setStep(s=>s+1);
  };

  const diffLabel = (score) => {
    if(score>=9) return {label:"מקצוען! 🏆",color:"#c9a84c"};
    if(score>=6) return {label:"טוב מאוד! 💪",color:"#27ae60"};
    if(score>=4) return {label:"מתחיל להבין! 👍",color:"#f39c12"};
    return {label:"בוא נתרגל שוב 🔄",color:"#e74c3c"};
  };

  const levelLabel = step < 3 ? "🟢 קל" : step < 6 ? "🟡 בינוני" : "🔴 קשה";

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 20%,#0d3320,#061a0e 40%,#030d07 100%)",fontFamily:"Georgia,serif",color:"#d4e8d4",padding:"16px 14px 32px",direction:"rtl"}}>
      <style>{`
        @keyframes correct{0%{transform:scale(1)}50%{transform:scale(1.04)}100%{transform:scale(1)}}
        @keyframes wrong{0%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={onExit} style={{padding:"7px 13px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#8a9a8a",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>← חזרה</button>
        <div style={{fontSize:15,fontWeight:700,color:"#c9a84c"}}>🥊 מי מנצח?</div>
        <button onClick={()=>setShowRef(r=>!r)} style={{padding:"6px 10px",borderRadius:7,border:"1px solid rgba(201,168,76,0.35)",background:showRef?"rgba(201,168,76,0.15)":"rgba(255,255,255,0.05)",color:"#c9a84c",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:11,fontWeight:700}}>
          ⚔️ טבלה
        </button>
      </div>

      {/* Quick ref overlay */}
      {showRef && (
        <div style={{background:"rgba(5,15,8,0.97)",border:"1px solid rgba(201,168,76,0.4)",borderRadius:12,padding:"12px 14px",marginBottom:12,animation:"slideIn 0.2s ease",maxHeight:280,overflowY:"auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:12,fontWeight:700,color:"#c9a84c"}}>⚔️ סדר ידיים — חזק לחלש</span>
            <button onClick={()=>setShowRef(false)} style={{background:"none",border:"none",color:"#6a9a6a",cursor:"pointer",fontSize:18}}>×</button>
          </div>
          {RANKED_HANDS.map((h,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <span style={{width:20,fontSize:10,color:"#6a9a6a",textAlign:"center"}}>#{10-i}</span>
              <span style={{fontSize:12,fontWeight:700,color:h.color,minWidth:120}}>{h.name}</span>
              <div style={{display:"flex",gap:2}}>
                {h.cards.slice(0,3).map((c,ci)=>{
                  const{rank:r,suit:s}=parseCard(c);
                  return <span key={ci} style={{fontSize:10,color:SUIT_COLORS[s],background:"rgba(255,255,255,0.07)",borderRadius:2,padding:"1px 3px"}}>{r}{s}</span>;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Done screen */}
      {isDone ? (
        <div style={{textAlign:"center",padding:"30px 20px",animation:"fadeIn 0.5s ease"}}>
          <div style={{fontSize:48,marginBottom:12}}>🎓</div>
          <div style={{fontSize:20,fontWeight:700,color:"#c9a84c",marginBottom:8}}>סיימת את כל השלבים!</div>
          <div style={{fontSize:28,fontWeight:700,color:diffLabel(score).color,marginBottom:6}}>{score}/{total}</div>
          <div style={{fontSize:15,color:diffLabel(score).color,marginBottom:24}}>{diffLabel(score).label}</div>
          <div style={{display:"grid",gap:10}}>
            <button onClick={()=>{setStep(0);setScore(0);setChosen(null);setShowAnswer(false);}} style={{padding:"13px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#c9a84c,#8b6914)",color:"#1a1a1a"}}>🔄 שוב מההתחלה</button>
            <button onClick={onExit} style={{padding:"11px",borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:13,background:"rgba(255,255,255,0.05)",color:"#8a9a8a"}}>← חזרה לתפריט</button>
          </div>
        </div>
      ) : (
        <>
          {/* Progress */}
          <div style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:11,color:"#6a9a6a"}}>שאלה {step+1} מתוך {total}</span>
              <span style={{fontSize:11,color:"#c9a84c",fontWeight:700}}>{levelLabel}</span>
              <span style={{fontSize:11,color:"#27ae60",fontWeight:700}}>✓ {score}</span>
            </div>
            <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(step/total)*100}%`,background:"linear-gradient(90deg,#c9a84c88,#c9a84c)",borderRadius:3,transition:"width 0.4s"}}/>
            </div>
          </div>

          {/* Question */}
          <div style={{textAlign:"center",fontSize:14,color:"#a0c0a0",marginBottom:14,fontWeight:600}}>
            {showAnswer ? (chosen===correctSide ? "✅ נכון!" : "❌ לא נכון") : "לחצי על היד שמנצחת 👇"}
          </div>

          {/* Two hands */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {["a","b"].map(side=>{
              const hand = current[side];
              const isCorrect = side === correctSide;
              const isChosen  = chosen === side;
              const borderCol = !showAnswer ? "rgba(201,168,76,0.25)"
                : isCorrect ? "#27ae60"
                : isChosen  ? "#e74c3c"
                : "rgba(255,255,255,0.06)";
              const bg = !showAnswer ? "rgba(255,255,255,0.04)"
                : isCorrect ? "rgba(39,174,96,0.15)"
                : isChosen  ? "rgba(231,76,60,0.12)"
                : "rgba(255,255,255,0.02)";
              const anim = showAnswer && isCorrect ? "correct 0.4s ease"
                : showAnswer && isChosen && !isCorrect ? "wrong 0.4s ease"
                : undefined;

              return (
                <div key={side} onClick={()=>handleChoose(side)}
                  style={{background:bg,border:`2px solid ${borderCol}`,borderRadius:12,padding:"12px 10px",cursor:showAnswer?"default":"pointer",transition:"all 0.25s",animation:anim,textAlign:"center"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#c9a84c",marginBottom:8,minHeight:28}}>{hand.name}</div>
                  {/* Cards */}
                  <div style={{display:"flex",gap:3,justifyContent:"center",flexWrap:"wrap",marginBottom:8}}>
                    {hand.cards.map((c,ci)=><Card key={ci} str={c} small highlight={showAnswer && isCorrect}/>)}
                  </div>
                  {/* Result icon */}
                  {showAnswer && (
                    <div style={{fontSize:20,marginTop:4}}>
                      {isCorrect ? "🏆" : isChosen ? "❌" : ""}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* VS divider */}
          {!showAnswer && (
            <div style={{textAlign:"center",color:"rgba(201,168,76,0.4)",fontSize:12,marginTop:-4,marginBottom:8,letterSpacing:2}}>VS</div>
          )}

          {/* Explanation */}
          {showAnswer && (
            <div style={{background:"rgba(10,25,15,0.9)",border:"1px solid rgba(201,168,76,0.35)",borderRadius:10,padding:"12px 14px",marginBottom:12,animation:"slideIn 0.35s ease"}}>
              <div style={{fontSize:11,color:"#c9a84c",fontWeight:700,marginBottom:6}}>📖 הסבר</div>
              <div style={{fontSize:13,color:"#c8dcc8",lineHeight:1.8}}>{current.why}</div>
            </div>
          )}

          {/* Next button */}
          {showAnswer && (
            <button onClick={handleNext} style={{width:"100%",padding:"13px",borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#c9a84c,#8b6914)",color:"#1a1a1a",boxShadow:"0 3px 12px rgba(201,168,76,0.3)",animation:"slideIn 0.4s ease"}}>
              {step+1 < total ? `שאלה הבאה ← (${step+2}/${total})` : "סיום 🎓"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MATH MODE — probability & outs
// ═══════════════════════════════════════════════════════════════════
const MATH_SCENARIOS = [
  {
    id:1,
    title:"זוג נגד הלוח",
    hole:["7♠","7♣"],
    flop:["K♠","3♥","9♦"],
    myHand:"זוג שביעיות",
    scenario:"יש לך זוג שביעיות. על הלוח יש K, 9, ו-3. כמה סיכוי ליריב שיש לו יד טובה ממך?",
    questions:[
      {
        q:"כמה קלפים נשארו בחפיסה?",
        answer:"52 − 2 (שלך) − 3 (פלופ) = 47 קלפים",
        formula:"52 − 2 − 3 = 47",
        color:"#3498db"
      },
      {
        q:"מה הסיכוי שליריב יש K, 9 או 3 (פייר גבוה ממך)?",
        answer:"יש 3 קינגים + 3 תשיעיות + 3 שלישיות = 9 קלפים מסוכנים מתוך 47",
        formula:"9 ÷ 47 ≈ 19% לקלף אחד · P(לפחות אחד מ-2) = 1 − (38/47)×(37/46) ≈ 33%",
        color:"#e74c3c"
      },
      {
        q:"כמה אאוטס יש לך (לשלישייה)?",
        answer:"נשארו 2 שביעיות בחפיסה = 2 אאוטס",
        formula:"4 שביעיות במשחק − 2 שלך = 2 נשארו",
        color:"#27ae60"
      },
      {
        q:"מה הסיכוי לפגוע שלישייה?",
        answer:"בטרן: 2÷47 ≈ 4.3% · עד הריבר (שתי הזדמנויות): כפל פי 4",
        formula:"כלל ה-4: 2 × 4 = 8% · מדויק: 1−(45/47)×(44/46) ≈ 8.4%",
        color:"#c9a84c"
      },
    ],
    tip:"💡 עם זוג נמוך ולוח גבוה — אתה בסיכון. 33% שליריב כבר מנצח אותך, ורק 8% לשיפור. פולד הגנתי יכול להיות נכון כאן.",
    missing:["7♥","7♦"],
    missingLabel:"2 השביעיות הנותרות — הן האאוטס שלך"
  },
  {
    id:2,
    title:"דרא לפלאש",
    hole:["A♥","K♥"],
    flop:["2♥","7♥","J♠"],
    myHand:"4 לבבות (דרא לפלאש) + אס גבוה",
    scenario:"יש לך A♥ K♥ ועל הלוח 2♥ 7♥ J♠. יש לך 4 לבבות — חסר עוד אחד לפלאש!",
    questions:[
      {
        q:"כמה לבבות נשארו בחפיסה (אאוטס לפלאש)?",
        answer:"13 לבבות בחפיסה − 4 שכבר נראו (A♥ K♥ 2♥ 7♥) = 9 לבבות נשארו",
        formula:"13 − 4 = 9 אאוטס",
        color:"#e74c3c"
      },
      {
        q:"מה הסיכוי לפלאש בטרן?",
        answer:"9 קלפים טובים מתוך 47 שנשארו",
        formula:"9 ÷ 47 = 19.1%",
        color:"#9b59b6"
      },
      {
        q:"מה הסיכוי לפלאש עד הריבר (2 הזדמנויות)?",
        answer:"כלל ה-4: כפל אאוטס פי 4. חישוב מדויק: סיכוי שלא להכות פעמיים",
        formula:"כלל ה-4: 9 × 4 = 36% · מדויק: 1−(38/47)×(37/46) = 35%",
        color:"#c9a84c"
      },
      {
        q:"יש לך גם אאוטס לפייר? כמה סה\"כ?",
        answer:"3 אסים + 3 קינגים = 6 אאוטס נוספים (אבל חלשים יותר)",
        formula:"9 (פלאש) + 6 (פייר) = 15 אאוטס · 15 × 4 = 60% (הערכה גסה)",
        color:"#27ae60"
      },
    ],
    tip:"💡 דרא לפלאש עם 9 אאוטס = ~35% סיכוי לנצח. אם הסיר גדול מספיק — כדאי להמשיך. זה ה-pot odds בפעולה!",
    missing:["3♥","5♥","6♥","8♥","9♥","10♥","J♥","Q♥","4♥"],
    missingLabel:"9 לבבות נשארו — כל אחד מהם הוא אאוט"
  },
  {
    id:3,
    title:"סטרייט דרא פתוח",
    hole:["8♠","9♦"],
    flop:["6♥","7♣","K♠"],
    myHand:"דרא לסטרייט פתוח (OESD)",
    scenario:"יש לך 8♠ 9♦ ועל הלוח 6♥ 7♣ K♠. יש לך 6-7-8-9 — חסר 5 מלמטה או 10 מלמעלה!",
    questions:[
      {
        q:"כמה אאוטס יש לך לסטרייט?",
        answer:"4 חמישיות (משלימות 5-6-7-8-9) + 4 עשיריות (משלימות 6-7-8-9-10) = 8 אאוטס",
        formula:"4 + 4 = 8 אאוטס",
        color:"#2980b9"
      },
      {
        q:"מה הסיכוי לסטרייט בטרן?",
        answer:"8 קלפים מוצלחים מתוך 47 שנשארו",
        formula:"8 ÷ 47 ≈ 17%",
        color:"#3498db"
      },
      {
        q:"מה הסיכוי לסטרייט עד הריבר?",
        answer:"כלל ה-4 נותן הערכה מהירה",
        formula:"כלל ה-4: 8 × 4 = 32% · מדויק: 1−(39/47)×(38/46) ≈ 31.5%",
        color:"#c9a84c"
      },
      {
        q:"מי יכול לנצח את הסטרייט שלך גם אם תפגע?",
        answer:"אם תיפגע בסטרייט ויצא פלאש על הלוח — מי שיש לו 2 קלפים מאותו סדר יוכל לנצח",
        formula:"סיכון: אם 3 קלפים מאותו סדר יופיעו בטרן+ריבר — attention!",
        color:"#e74c3c"
      },
    ],
    tip:"💡 OESD (סטרייט דרא פתוח) עם 8 אאוטס = ~32% לניצחון. מהשאלות הנפוצות בפוקר — שווה לקרוא אם הסיר גדול.",
    missing:["5♠","5♥","5♦","5♣","10♠","10♥","10♦","10♣"],
    missingLabel:"4 חמישיות + 4 עשיריות = 8 אאוטס לסטרייט"
  },
  {
    id:4,
    title:"גאטשוט — דרא סגור",
    hole:["5♠","9♦"],
    flop:["6♥","7♣","A♠"],
    myHand:"גאטשוט (דרא סגור לסטרייט)",
    scenario:"יש לך 5♠ 9♦ ועל הלוח 6♥ 7♣ A♠. יש לך 5-6-7 ו-9 — חסר רק 8 לרצף 5-6-7-8-9!",
    questions:[
      {
        q:"כמה אאוטס יש לך? למה זה 'דרא סגור'?",
        answer:"רק 4 שמיניות יכולות להשלים. 'סגור' = רק קלף אחד משלים, לעומת OESD שיש 2 אפשרויות",
        formula:"4 שמיניות בלבד = 4 אאוטס (לעומת 8 ב-OESD)",
        color:"#e67e22"
      },
      {
        q:"מה הסיכוי לפגוע בטרן?",
        answer:"רק 4 קלפים מוצלחים מתוך 47",
        formula:"4 ÷ 47 ≈ 8.5%",
        color:"#e74c3c"
      },
      {
        q:"מה הסיכוי עד הריבר?",
        answer:"כלל ה-4 מחצית: עם 4 אאוטס, כלל ה-2 יותר מדויק לטרן בלבד",
        formula:"כלל ה-4: 4 × 4 = 16% · מדויק: 1−(43/47)×(42/46) ≈ 16.5%",
        color:"#c9a84c"
      },
      {
        q:"בהשוואה ל-OESD — למה גאטשוט מסוכן יותר?",
        answer:"OESD = 32% סיכוי. גאטשוט = 16% בלבד. כמעט פי 2 פחות סיכוי! ועדיין יש A גבוה שמסוכן",
        formula:"OESD: 8 אאוטס × 4 = 32% · גאטשוט: 4 אאוטס × 4 = 16%",
        color:"#e74c3c"
      },
    ],
    tip:"💡 גאטשוט = 16% בלבד. ברוב המקרים — לא שווה לשלם המר גדול עבור זה. אלא אם הסיר עצום.",
    missing:["8♠","8♥","8♦","8♣"],
    missingLabel:"רק 4 שמיניות — גאטשוט קשה להשלמה"
  },
  {
    id:5,
    title:"שני זוגות — סיכון לפול האוס",
    hole:["K♣","Q♦"],
    flop:["K♠","Q♥","7♦"],
    myHand:"שני זוגות (K+Q) — יד חזקה!",
    scenario:"יש לך K♣ Q♦ ועל הלוח K♠ Q♥ 7♦. שני זוגות מעולים! אבל — מה יכול לנצח אותך?",
    questions:[
      {
        q:"מה יכול לנצח את שני הזוגות שלך עכשיו?",
        answer:"שלישייה: מי שיש לו K-K, Q-Q, או 7-7 כהול קארדס יש לו סט (שלישייה) שמנצח שני זוגות",
        formula:"K-K: 1 קומבינציה · Q-Q: 1 קומבינציה · 7-7: 3 קומבינציות = סה\"כ 5 קומבינציות מסוכנות",
        color:"#e74c3c"
      },
      {
        q:"כמה קומבינציות הול קארדס אפשריות ליריב?",
        answer:"47 קלפים נשארו. ליריב יש 2 קלפים מתוכם: C(47,2) = 47×46÷2",
        formula:"C(47,2) = 1,081 קומבינציות אפשריות",
        color:"#3498db"
      },
      {
        q:"מה הסיכוי שליריב יש סט?",
        answer:"5 קומבינציות מסוכנות מתוך 1,081 אפשריות",
        formula:"5 ÷ 1,081 ≈ 0.46% — פחות מחצי אחוז! יד חזקה מאוד.",
        color:"#27ae60"
      },
      {
        q:"מה האאוטס שלך לפול האוס (שיפור)?",
        answer:"K נשאר = 1 קלף + Q נשאר = 1 קלף + 7 = 3 קלפים = 5 אאוטס לפול האוס",
        formula:"5 אאוטס × 4 = 20% לפול האוס עד הריבר",
        color:"#c9a84c"
      },
    ],
    tip:"💡 שני זוגות גבוהים = יד חזקה מאוד. סיכוי של 0.46% שליריב יש סט. ריייז אגרסיבי מומלץ כאן!",
    missing:["K♥","Q♣","7♠","7♣","7♥"],
    missingLabel:"5 אאוטס לפול האוס — K נוסף, Q נוסף, או 7"
  },
];

function MathMode({ onExit }) {
  const [step, setStep]       = useState(0);
  const [revealed, setRevealed] = useState([]); // which question indices revealed
  const [showMissing, setShowMissing] = useState(false);
  const [done, setDone]       = useState(false);

  const sc = MATH_SCENARIOS[step];
  const allRevealed = revealed.length === sc.questions.length;

  const revealNext = () => {
    if(revealed.length < sc.questions.length) {
      setRevealed(r=>[...r, r.length]);
    }
  };

  const nextScenario = () => {
    if(step + 1 >= MATH_SCENARIOS.length) { setDone(true); return; }
    setStep(s=>s+1);
    setRevealed([]);
    setShowMissing(false);
  };

  const reset = () => { setStep(0); setRevealed([]); setShowMissing(false); setDone(false); };

  if(done) return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 20%,#0d3320,#061a0e 40%,#030d07 100%)",fontFamily:"Georgia,serif",color:"#d4e8d4",padding:"40px 20px",direction:"rtl",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:14}}>🧮</div>
      <div style={{fontSize:22,fontWeight:700,color:"#c9a84c",marginBottom:8}}>סיימת את כל השאלות!</div>
      <div style={{fontSize:14,color:"#a0c0a0",lineHeight:1.8,marginBottom:28}}>
        כיסית: אאוטס, כלל ה-4, כלל ה-2, הסתברות ידיים וסיכויי יריב
      </div>
      <div style={{display:"grid",gap:10,maxWidth:320,margin:"0 auto"}}>
        <button onClick={reset} style={{padding:14,borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#c9a84c,#8b6914)",color:"#1a1a1a"}}>🔄 שוב מההתחלה</button>
        <button onClick={onExit} style={{padding:12,borderRadius:9,border:"1px solid rgba(255,255,255,0.1)",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:13,background:"rgba(255,255,255,0.05)",color:"#8a9a8a"}}>← חזרה לתפריט</button>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 20%,#0d3320,#061a0e 40%,#030d07 100%)",fontFamily:"Georgia,serif",color:"#d4e8d4",padding:"16px 14px 36px",direction:"rtl"}}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.95)}60%{transform:scale(1.03)}100%{transform:scale(1)}}
      `}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={onExit} style={{padding:"7px 13px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(255,255,255,0.05)",color:"#8a9a8a",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12}}>← חזרה</button>
        <div style={{fontSize:15,fontWeight:700,color:"#c9a84c"}}>🧮 הסתברות פוקר</div>
        <div style={{fontSize:11,color:"#6a9a6a"}}>{step+1}/{MATH_SCENARIOS.length}</div>
      </div>

      {/* Progress */}
      <div style={{height:4,background:"rgba(255,255,255,0.07)",borderRadius:3,marginBottom:14,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${((step)/MATH_SCENARIOS.length)*100}%`,background:"linear-gradient(90deg,#c9a84c88,#c9a84c)",borderRadius:3,transition:"width 0.4s"}}/>
      </div>

      {/* Scenario title */}
      <div style={{fontSize:16,fontWeight:700,color:"#c9a84c",marginBottom:4}}>{sc.title}</div>
      <div style={{fontSize:12,color:"#6a9a6a",marginBottom:12}}>{sc.myHand}</div>

      {/* Cards display */}
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:11,color:"#6a9a6a",marginBottom:8}}>✋ הקלפים שלך</div>
        <div style={{display:"flex",gap:5,marginBottom:12}}>
          {sc.hole.map((c,i)=><Card key={i} str={c} highlight/>)}
        </div>
        <div style={{fontSize:11,color:"#6a9a6a",marginBottom:8}}>🂠 פלופ</div>
        <div style={{display:"flex",gap:5}}>
          {sc.flop.map((c,i)=><Card key={i} str={c}/>)}
        </div>
      </div>

      {/* Scenario question */}
      <div style={{background:"rgba(52,152,219,0.1)",border:"1px solid rgba(52,152,219,0.3)",borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#a8d4f0",lineHeight:1.75}}>
        {sc.scenario}
      </div>

      {/* Questions — revealed one at a time */}
      <div style={{display:"grid",gap:8,marginBottom:12}}>
        {sc.questions.map((q,i)=>{
          const isRevealed = revealed.includes(i);
          const isNext = i === revealed.length;
          return (
            <div key={i} style={{background:isRevealed?`${q.color}10`:"rgba(255,255,255,0.03)",border:`1px solid ${isRevealed?q.color+"50":"rgba(255,255,255,0.07)"}`,borderRadius:10,overflow:"hidden",transition:"all 0.3s",animation:isRevealed?"pop 0.4s ease":undefined}}>
              {/* Question header */}
              <div style={{padding:"11px 14px",display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:isRevealed?q.color:"rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:isRevealed?"#1a1a1a":"#6a9a6a",flexShrink:0,marginTop:1}}>
                  {isRevealed?"✓":i+1}
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:isRevealed?q.color:"#a0c0a0",marginBottom:isRevealed?6:0}}>{q.q}</div>
                  {isRevealed && (
                    <div style={{animation:"slideIn 0.3s ease"}}>
                      <div style={{fontSize:12,color:"#d4e8d4",lineHeight:1.75,marginBottom:8}}>{q.answer}</div>
                      {/* Formula box */}
                      <div style={{background:"rgba(0,0,0,0.35)",border:`1px solid ${q.color}40`,borderRadius:7,padding:"8px 12px",fontFamily:"monospace",fontSize:12,color:q.color,direction:"ltr",textAlign:"left"}}>
                        📐 {q.formula}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Missing cards (outs visual) */}
      {allRevealed && (
        <div style={{marginBottom:12,animation:"slideIn 0.4s ease"}}>
          <button onClick={()=>setShowMissing(m=>!m)} style={{width:"100%",padding:"10px 14px",borderRadius:9,border:"1px solid rgba(39,174,96,0.4)",background:showMissing?"rgba(39,174,96,0.12)":"rgba(255,255,255,0.04)",color:"#27ae60",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:12,fontWeight:700,textAlign:"right",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{transform:showMissing?"rotate(90deg)":"none",transition:"transform 0.25s",fontSize:14}}>▶</span>
            <span>🎯 הצג אאוטס ויזואלית</span>
          </button>
          {showMissing && (
            <div style={{background:"rgba(39,174,96,0.07)",border:"1px solid rgba(39,174,96,0.25)",borderRadius:10,padding:"12px 14px",marginTop:6,animation:"slideIn 0.25s ease"}}>
              <div style={{fontSize:11,color:"#27ae60",fontWeight:700,marginBottom:8}}>{sc.missingLabel}</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {sc.missing.map((c,i)=><Card key={i} str={c} small highlight/>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      {allRevealed && (
        <div style={{background:"rgba(201,168,76,0.08)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:13,color:"#d4c87a",lineHeight:1.75,animation:"slideIn 0.5s ease"}}>
          {sc.tip}
        </div>
      )}

      {/* Action buttons */}
      {!allRevealed ? (
        <button onClick={revealNext} style={{width:"100%",padding:13,borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#2980b9,#1a6090)",color:"#fff",boxShadow:"0 3px 10px rgba(41,128,185,0.3)"}}>
          גלה שאלה {revealed.length+1} מתוך {sc.questions.length} →
        </button>
      ) : (
        <button onClick={nextScenario} style={{width:"100%",padding:13,borderRadius:9,border:"none",cursor:"pointer",fontFamily:"Georgia,serif",fontSize:14,fontWeight:700,background:"linear-gradient(135deg,#c9a84c,#8b6914)",color:"#1a1a1a",boxShadow:"0 3px 12px rgba(201,168,76,0.3)",animation:"pop 0.4s ease"}}>
          {step+1 < MATH_SCENARIOS.length ? `תרחיש הבא (${step+2}/${MATH_SCENARIOS.length}) →` : "סיום 🎓"}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function PokerTutor() {
  const [screen, setScreen] = useState("menu");
  const [aiMsg, setAiMsg] = useState("שלום! אני מאסטר פוקר, המורה שלך. בוא נלמד יחד את המשחק המרתק ביותר בעולם — פוקר! 🃏");
  const [aiLoading, setAiLoading] = useState(false);
  const [lesson, setLesson] = useState(0);
  const [selectedHand, setSelectedHand] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [gameMsg, setGameMsg] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [pot, setPot] = useState(0);
  const [playerChips, setPlayerChips] = useState(1000);
  const [botChips, setBotChips] = useState(1000);

  const ask = (prompt) => callClaude(prompt, setAiMsg, setAiLoading);

  // GA init + screen tracking
  useEffect(() => { initGA(); }, []);
  useEffect(() => { trackEvent("screen_view", { screen_name: screen }); }, [screen]);

  const LESSONS = [
    { title:"מה זה פוקר?", prompt:"הסבר בקצרה מה המיוחד בפוקר כמשחק ולמה כל כך הרבה אנשים אוהבים אותו",
      content:<div style={{direction:"rtl",color:"#d4e8d4",lineHeight:1.9}}><p>פוקר הוא משחק קלפים שמשחקים <strong style={{color:"#c9a84c"}}>נגד שחקנים אחרים</strong> — לא נגד הבית.</p><p>המטרה: לזכות בצ'יפים עם <strong style={{color:"#c9a84c"}}>הקומבינציה הטובה ביותר</strong>, או לגרום לכולם <strong style={{color:"#c9a84c"}}>לוותר (בלוף)</strong>!</p><p>הגרסה הפופולרית: <strong style={{color:"#c9a84c"}}>טקסס הולדם</strong>.</p></div>},
    { title:"קלפי המשחק", prompt:"מה ההבדל בין הסדרים בפוקר — האם לסדר יש חשיבות?",
      content:<div style={{direction:"rtl"}}><p style={{color:"#d4e8d4",marginBottom:10}}>חפיסה = <strong style={{color:"#c9a84c"}}>52 קלפים</strong> ב-4 סדרים:</p><div style={{display:"flex",gap:10,justifyContent:"center",marginBottom:12}}>{SUITS.map(s=><div key={s} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(201,168,76,0.3)",borderRadius:8,padding:"8px 12px",textAlign:"center"}}><div style={{fontSize:24,color:SUIT_COLORS[s]}}>{s}</div><div style={{color:"#a0b0a0",fontSize:11}}>{s==="♠"?"עלה":s==="♥"?"לב":s==="♦"?"יהלום":"תלתן"}</div></div>)}</div><p style={{color:"#d4e8d4"}}>ערכים: <span style={{color:"#c9a84c"}}>2 (חלש) → ... → K → A (חזק)</span></p><div style={{display:"flex",gap:4,flexWrap:"wrap",justifyContent:"center",marginTop:8}}>{["2♠","5♥","9♦","J♣","A♥"].map(c=><Card key={c} str={c} small/>)}</div></div>},
    { title:"איך משחקים?", prompt:"מה ההבדל בין הקלפים הסודיים לקלפים המשותפים בטקסס הולדם?",
      content:<div style={{direction:"rtl",color:"#d4e8d4",lineHeight:1.9}}>{[{n:"1",t:"כל שחקן מקבל 2 קלפים סודיים"},{n:"2",t:'סיבוב הימורים ראשון — פרה-פלופ'},{n:"3",t:"3 קלפים משותפים נפרשים — פלופ"},{n:"4",t:"קלף 4 (טרן) וקלף 5 (ריבר)"},{n:"5",t:"שואדאון — הטוב ביותר מנצח!"}].map(s=><div key={s.n} style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}><div style={{width:24,height:24,borderRadius:"50%",background:"#c9a84c",color:"#1a1a1a",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{s.n}</div><span>{s.t}</span></div>)}</div>},
    { title:"פעולות השחקן", prompt:"מתי כדאי לפולד ומתי לריייז? תן טיפ מעשי",
      content:<div style={{direction:"rtl",color:"#d4e8d4"}}>{[{a:"✅ צ'ק",d:"המשך בלי להמר",c:"#27ae60"},{a:"🃏 קול",d:"השווה להימור הקיים",c:"#2980b9"},{a:"📈 ריייז",d:"העלה את ההימור",c:"#f39c12"},{a:"❌ פולד",d:"וותר — חסוך הפסד גדול יותר",c:"#e74c3c"}].map(item=><div key={item.a} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${item.c}40`,borderRadius:8,padding:"8px 12px",display:"flex",gap:10,alignItems:"center",marginBottom:8}}><span style={{fontWeight:700,color:item.c,minWidth:80,fontSize:12}}>{item.a}</span><span style={{color:"#a0b0a0",fontSize:12}}>{item.d}</span></div>)}</div>},
  ];

  const startLesson = (i) => { setLesson(i); setScreen("lessons"); ask(LESSONS[i].prompt); trackEvent("lesson_start", { lesson_index: i, lesson_title: LESSONS[i].title }); };

  const startPractice = () => {
    const deck = makeDeck();
    const ph=[deck.pop(),deck.pop()], bh=[deck.pop(),deck.pop()], comm=[deck.pop(),deck.pop(),deck.pop(),deck.pop(),deck.pop()];
    setGameState({playerHand:ph,botHand:bh,community:comm,stage:"preflop",revealed:0});
    setPot(40); setShowResult(false); setGameMsg("");
    ask(`שחקן מקבל ${ph.join(",")} בפרה-פלופ. תן טיפ קצר על הקלפים האלה`);
    trackEvent("practice_start");
    setScreen("practice");
  };

  const doAction = (action) => {
    trackEvent("player_action", { action, mode: "practice" });
    if(!gameState) return;
    let newPot = pot;
    const si = STAGES.indexOf(gameState.stage);
    const nextStage = STAGES[Math.min(si+1,4)];
    const newRev = nextStage==="flop"?3:nextStage==="turn"?4:5;
    if(action==="fold"){setGameMsg("פולדת — הבוט מנצח.");setBotChips(c=>c+pot);setShowResult(true);ask("השחקן פולד. מתי זו החלטה נכונה?");return;}
    if(action==="call") newPot+=20; if(action==="raise") newPot+=60;
    setPot(newPot);
    if(si>=3){
      const pe=evaluateHand([...gameState.playerHand,...gameState.community]);
      const be=evaluateHand([...gameState.botHand,...gameState.community]);
      const w=pe.score>be.score,t=pe.score===be.score;
      if(w) setPlayerChips(c=>c+newPot); else if(!t) setBotChips(c=>c+newPot); else{setPlayerChips(c=>c+newPot/2);setBotChips(c=>c+newPot/2);}
      setGameMsg(w?`🎉 ניצחת! ${pe.name} נגד ${be.name}`:t?`🤝 תיקו! שניכם עם ${pe.name}`:`😔 הבוט ניצח: ${be.name}`);
      setGameState(g=>({...g,stage:"showdown",revealed:5})); setShowResult(true);
      ask(`סיבוב הסתיים. שחקן: ${pe.name}. בוט: ${be.name}. ${w?"שחקן ניצח":"בוט ניצח"}. תן ניתוח וטיפ`);
    } else {
      setGameState(g=>({...g,stage:nextStage,revealed:newRev}));
      ask(`${STAGE_NAMES[nextStage]} נפתח. לוח: ${gameState.community.slice(0,newRev).join(",")}. קלפי השחקן: ${gameState.playerHand.join(",")}. מה לחשוב עכשיו?`);
    }
  };

  const S = {
    app:{minHeight:"100vh",background:"radial-gradient(ellipse at 30% 20%,#0d3320,#061a0e 40%,#030d07 100%)",fontFamily:"Georgia,serif",color:"#d4e8d4",padding:"20px 16px",direction:"rtl"},
    title:{fontSize:24,fontWeight:700,color:"#c9a84c",textShadow:"0 0 25px rgba(201,168,76,0.4)",letterSpacing:2},
    panel:{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:12,padding:14,marginBottom:10},
  };

  if(screen==="coached") return <CoachMode onExit={()=>setScreen("menu")}/>;
  if(screen==="whatbeats") return <WhatBeatsWhat onExit={()=>setScreen("menu")}/>;
  if(screen==="comparison") return <HandComparisonLearn onExit={()=>setScreen("menu")}/>;
  if(screen==="math") return <MathMode onExit={()=>setScreen("menu")}/>;

  if(screen==="menu") return(
    <div style={S.app}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}} @keyframes slideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:8}}>🃏</div>
        <div style={S.title}>מאסטר פוקר</div>
        <div style={{fontSize:11,color:"#6a9a6a",letterSpacing:1,marginTop:4}}>ללמוד טקסס הולדם מאפס</div>
      </div>
      <TeacherBubble message={aiMsg} loading={aiLoading}/>
      <div style={{display:"grid",gap:10}}>

        {/* COACHED - featured */}
        <div style={{...S.panel,cursor:"pointer",borderColor:"rgba(201,168,76,0.5)",background:"rgba(201,168,76,0.07)",position:"relative"}}
          onClick={()=>{ setScreen("coached"); }}>
          <div style={{position:"absolute",top:-1,right:12,background:"linear-gradient(135deg,#c9a84c,#8b6914)",color:"#1a1a1a",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:"0 0 6px 6px"}}>חדש!</div>
          <div style={{fontSize:22,marginBottom:5}}>🎓</div>
          <div style={{fontWeight:700,fontSize:15,color:"#c9a84c",marginBottom:4}}>לומד תוך כדי משחק</div>
          <div style={{color:"#8ab0a0",fontSize:12,lineHeight:1.6}}>
            ניתוח חכם של כל קלף · מה לחשוב בכל שלב · מושג פוקר חדש בכל סיבוב · חידון החלטות + פידבק מיידי
          </div>
        </div>

        <div style={{...S.panel,cursor:"pointer"}} onClick={()=>{setScreen("lessonList");ask("ברכת פתיחה קצרה לשחקן שרוצה ללמוד פוקר");}}>
          <div style={{fontSize:20,marginBottom:5}}>📚</div>
          <div style={{fontWeight:700,fontSize:14,color:"#c9a84c",marginBottom:3}}>שיעורים</div>
          <div style={{color:"#6a9a6a",fontSize:12}}>4 שיעורים שמכסים את הבסיס מאפס</div>
        </div>

        <div style={{...S.panel,cursor:"pointer"}} onClick={()=>{setScreen("handRankings");ask("מה הכי חשוב לדעת על דירוג ידיים בפוקר?");}}>
          <div style={{fontSize:20,marginBottom:5}}>🏆</div>
          <div style={{fontWeight:700,fontSize:14,color:"#c9a84c",marginBottom:3}}>דירוג הידיים</div>
          <div style={{color:"#6a9a6a",fontSize:12}}>כל 9 הקומבינציות עם דוגמאות</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{...S.panel,cursor:"pointer",marginBottom:0}} onClick={()=>setScreen("whatbeats")}>
            <div style={{fontSize:20,marginBottom:5}}>⚔️</div>
            <div style={{fontWeight:700,fontSize:13,color:"#c9a84c",marginBottom:3}}>מה לוקח מה</div>
            <div style={{color:"#6a9a6a",fontSize:11}}>טבלה ויזואלית עם קלפים</div>
          </div>
          <div style={{...S.panel,cursor:"pointer",marginBottom:0,borderColor:"rgba(39,174,96,0.35)"}} onClick={()=>setScreen("comparison")}>
            <div style={{fontSize:20,marginBottom:5}}>🥊</div>
            <div style={{fontWeight:700,fontSize:13,color:"#27ae60",marginBottom:3}}>מי מנצח?</div>
            <div style={{color:"#6a9a6a",fontSize:11}}>תרגול ויזואלי — קל לקשה</div>
          </div>
        </div>

        <div style={{...S.panel,cursor:"pointer",borderColor:"rgba(52,152,219,0.4)",background:"rgba(52,152,219,0.06)"}} onClick={()=>setScreen("math")}>
          <div style={{fontSize:20,marginBottom:5}}>🧮</div>
          <div style={{fontWeight:700,fontSize:14,color:"#3498db",marginBottom:3}}>הסתברות פוקר</div>
          <div style={{color:"#6a9a6a",fontSize:12}}>אאוטס · כלל ה-4 · סיכויי יריב · פתרון מתמטי מלא</div>
        </div>

        <div style={{...S.panel,cursor:"pointer"}} onClick={startPractice}>
          <div style={{fontSize:20,marginBottom:5}}>🎮</div>
          <div style={{fontWeight:700,fontSize:14,color:"#c9a84c",marginBottom:3}}>תרגול חופשי</div>
          <div style={{color:"#6a9a6a",fontSize:12}}>משחק נגד בוט עם הסברים — בלי לחץ</div>
        </div>
      </div>
    </div>
  );

  if(screen==="lessonList") return(
    <div style={S.app}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <Btn label="← חזרה" variant="ghost" onClick={()=>setScreen("menu")}/>
        <div style={{...S.title,fontSize:18}}>📚 שיעורים</div>
      </div>
      <TeacherBubble message={aiMsg} loading={aiLoading}/>
      <div style={{display:"grid",gap:9}}>
        {LESSONS.map((l,i)=>(
          <div key={i} style={{...S.panel,cursor:"pointer",display:"flex",alignItems:"center",gap:12,marginBottom:0}} onClick={()=>startLesson(i)}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#c9a84c,#8b6914)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:"#1a1a1a",flexShrink:0,fontSize:13}}>{i+1}</div>
            <div style={{fontWeight:700,color:"#c9a84c",fontSize:14}}>{l.title}</div>
            <span style={{marginRight:"auto",color:"#6a9a6a"}}>←</span>
          </div>
        ))}
      </div>
    </div>
  );

  if(screen==="lessons"){
    const l=LESSONS[lesson];
    return(
      <div style={S.app}>
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <Btn label="← חזרה" variant="ghost" onClick={()=>setScreen("lessonList")}/>
          <div style={{...S.title,fontSize:16}}>שיעור {lesson+1}: {l.title}</div>
        </div>
        <TeacherBubble message={aiMsg} loading={aiLoading}/>
        <div style={S.panel}>{l.content}</div>
        <div style={{display:"flex",gap:8,marginTop:10}}>
          {lesson>0&&<Btn label="← קודם" variant="ghost" onClick={()=>startLesson(lesson-1)}/>}
          {lesson<LESSONS.length-1
            ?<Btn label="שיעור הבא ←" variant="gold" full onClick={()=>startLesson(lesson+1)}/>
            :<Btn label="סיימתי! 🎉" variant="green" full onClick={()=>setScreen("menu")}/>}
        </div>
      </div>
    );
  }

  if(screen==="handRankings") return(
    <div style={S.app}>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <Btn label="← חזרה" variant="ghost" onClick={()=>setScreen("menu")}/>
        <div style={{...S.title,fontSize:18}}>🏆 דירוג ידיים</div>
      </div>
      <TeacherBubble message={aiMsg} loading={aiLoading}/>
      <div style={{fontSize:11,color:"#6a9a6a",marginBottom:9,textAlign:"center"}}>לחץ על יד כדי ללמוד עליה</div>
      <div style={{display:"grid",gap:7}}>
        {[...HAND_RANKINGS].reverse().map((h,ri)=>{
          const i=HAND_RANKINGS.length-1-ri, sel=selectedHand===i;
          return(
            <div key={i} style={{...S.panel,cursor:"pointer",border:sel?"1px solid #c9a84c":"1px solid rgba(201,168,76,0.15)",background:sel?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.04)",marginBottom:0}}
              onClick={()=>{setSelectedHand(sel?null:i);if(!sel)ask(`הסבר בצורה פשוטה מה זה ${h.name} בפוקר ומתי להמר עליו אגרסיבית`);}}>
              <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:sel?9:0}}>
                <div style={{background:`hsl(${i*25},65%,45%)`,color:"#fff",borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:700,flexShrink:0}}>#{i+1}</div>
                <div style={{fontWeight:700,color:"#c9a84c",fontSize:13}}>{h.name}</div>
                <div style={{color:"#6a9a6a",fontSize:10}}>{h.en}</div>
              </div>
              {sel&&(<><p style={{color:"#d4e8d4",fontSize:12,marginBottom:9}}>{h.desc}</p><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{h.example.map((c,ci)=><Card key={ci} str={c} small highlight/>)}</div></>)}
            </div>
          );
        })}
      </div>
    </div>
  );

  if(screen==="practice"&&gameState){
    const cs=gameState.community.slice(0,gameState.revealed);
    const si=STAGES.indexOf(gameState.stage);
    return(
      <div style={S.app}>
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}`}</style>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <Btn label="← יציאה" variant="ghost" onClick={()=>setScreen("menu")}/>
          <div style={{...S.title,fontSize:16}}>🎮 תרגול חופשי</div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
          <span style={{fontSize:11,color:"#c9a84c",fontWeight:700}}>💰 {playerChips}</span>
          <span style={{background:"rgba(201,168,76,0.14)",border:"1px solid rgba(201,168,76,0.28)",borderRadius:18,padding:"2px 11px",fontSize:11,color:"#c9a84c",fontWeight:700}}>סיר: {pot}</span>
          <span style={{fontSize:11,color:"#6a9a6a",fontWeight:700}}>🤖 {botChips}</span>
        </div>
        <div style={{display:"flex",gap:3,marginBottom:11}}>
          {["פ-פ","פלופ","טרן","ריבר"].map((n,i)=><div key={n} style={{flex:1,height:4,borderRadius:2,background:i<si?"#c9a84c":i===si?"rgba(201,168,76,0.5)":"rgba(255,255,255,0.07)",transition:"background 0.4s"}}/>)}
        </div>
        <TeacherBubble message={aiMsg} loading={aiLoading}/>
        <div style={S.panel}><div style={{fontSize:10,color:"#6a9a6a",marginBottom:5}}>🤖 בוט</div><div style={{display:"flex",gap:4}}>{showResult?gameState.botHand.map((c,i)=><Card key={i} str={c} small/>):gameState.botHand.map((_,i)=><Card key={i} str="X♠" hidden small/>)}</div></div>
        <div style={S.panel}><div style={{fontSize:10,color:"#6a9a6a",marginBottom:7}}>🂠 לוח — {STAGE_NAMES[gameState.stage]}</div><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{cs.map((c,i)=><Card key={i} str={c}/>)}{Array(5-cs.length).fill(null).map((_,i)=><div key={i} style={{width:60,height:86,borderRadius:8,border:"2px dashed rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"rgba(201,168,76,0.1)",fontSize:14}}>?</span></div>)}</div></div>
        <div style={{...S.panel,border:"1px solid rgba(201,168,76,0.36)",marginBottom:12}}><div style={{fontSize:10,color:"#c9a84c",marginBottom:7}}>✋ הקלפים שלך</div><div style={{display:"flex",gap:5}}>{gameState.playerHand.map((c,i)=><Card key={i} str={c} highlight/>)}</div></div>
        {gameMsg&&<div style={{background:gameMsg.includes("ניצחת")?"rgba(39,174,96,0.22)":gameMsg.includes("תיקו")?"rgba(201,168,76,0.14)":"rgba(192,57,43,0.22)",border:`1px solid ${gameMsg.includes("ניצחת")?"#27ae60":gameMsg.includes("תיקו")?"#c9a84c":"#e74c3c"}`,borderRadius:9,padding:11,textAlign:"center",marginBottom:10,fontWeight:700,fontSize:13,color:"#fff"}}>{gameMsg}</div>}
        {!showResult?(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            <Btn label="✅ קול" variant="green" onClick={()=>doAction("call")}/>
            <Btn label="📈 ריייז" variant="blue" onClick={()=>doAction("raise")}/>
            <Btn label="❌ פולד" variant="red" onClick={()=>doAction("fold")}/>
          </div>
        ):<Btn label="🔄 סיבוב חדש" variant="gold" full onClick={startPractice}/>}
      </div>
    );
  }

  return <div style={S.app}><div style={{textAlign:"center",color:"#6a9a6a",padding:40}}>טוען...</div></div>;
}
