// AnalystReport.jsx
// קומפוננטה: דו"ח אנליסט אחרי יד פוקר.
// READ-ONLY — סטייט פנימי בלבד (activeStreet, activeMetric, termModalKey).
// משתמש בנתונים מ-props (במצב demo: יד T♦7♠ מההסקרינים).
import React, { useState } from 'react';

// ===== Color tokens (מותאמים לפלטה הקיימת של המשחק) =====
const C = {
  bgFelt:'#0d2818', bgPanel:'#143a26', bgPanelDeep:'#0a1f12',
  gold:'#c9a84c', goldSoft:'rgba(201,168,76,0.25)', goldGlow:'rgba(201,168,76,0.12)',
  cream:'#f5f0e1', creamDim:'#c9c0a8', creamMute:'#8a8470',
  divider:'rgba(245,240,225,0.08)',
  positive:'#7fb069', negative:'#d97757', warning:'#e8b04a',
};
const FONT = 'Georgia, "Times New Roman", serif';
const FONT_MONO = 'Menlo, Consolas, monospace';

// ===== TERM DEFINITIONS — מילון מושגים מורחב =====
const TERM_DEFS_AR = {
  'offsuit': { title:'Offsuit', text:'שני קלפים מסוגים (suits) שונים — אחד עלה, אחד לב, וכו׳. ההפך מ-suited (אותו suit). בדרך כלל ידיים offsuit חלשות יותר כי לא יכולות להפוך ל-flush.', example:'10♦ 7♠ → offsuit (יהלום מול עלה). לעומת 10♠ 7♠ → suited (שניהם עלה).' },
  'suit': { title:'Suit (סוג)', text:'אחד מארבעת הסוגים של קלפים: ♠ עלה (Spades), ♥ לב (Hearts), ♦ יהלום (Diamonds), ♣ תלתן (Clubs). 5 קלפים מאותו suit = פלאש.' },
  'kicker': { title:'Kicker (קיקר)', text:'הקלף הגבוה השני בידך, אחרי הצירוף הראשי. כששני שחקנים עם זוג זהה — ה-kicker מכריע מי גובר.', example:'את עם 7♠ T♦ והיריב עם 7♣ A♥. שניכם זכיתם בזוג 7. הוא מנצח כי A > T.' },
  'pocket-pair': { title:'זוג כיס (Pocket Pair)', text:'שני קלפים זהים בערך שמחולקים אליך פרה-פלופ. זוגות גבוהים = ידיים מהחזקות במשחק.', example:'88, JJ, AA — אלה זוגות כיס. AA = הכי חזק שיש פרה-פלופ.' },
  'pot-odds': { title:'Pot Odds (פוט אודס)', text:'היחס בין הסכום שצריך לשלם לבין גודל הסיר. מגדיר כמה אקוויטי צריך כדי ש-call יהיה רווחי.', example:'הסיר $80 ועלייך לשלם $20. צריך לזכות ב-25% מהפעמים כדי לא להפסיד כסף בטווח הארוך.' },
  'reverse-implied-odds': { title:'Reverse Implied Odds', text:'הסיכון להפסיד כסף נוסף בעתיד גם אם תפגעי בקלף שאת מקווה לו. קורה עם ידיים חלשות שגם כש"מצליחות" — לעיתים קרובות עדיין מפסידות.', example:'יש לך T7 ואת מקווה ל-10. הפלופ K-T-2 — נהדר! אבל אם ליריב KQ, הוא ימשיך להמר ואת תפסידי הרבה יותר כסף.' },
  'implied-odds': { title:'Implied Odds', text:'הכסף הנוסף שאת צפויה לזכות בו אם תפגעי בדרא. גם אם ה-pot odds לא מצדיקים call ישיר — implied odds יכולים להפוך אותו לרווחי.', example:'יש לך flush draw, היריב הימר $20 לסיר של $40. ה-pot odds לא מספיקים, אבל אם תשלימי flush והיריב ימשיך להמר, את תקבלי עוד $100 ביחד.' },
  'underdog': { title:'Underdog', text:'מי שיש לו פחות מ-50% סיכוי לזכות בסיר. אם את "underdog של 60%" → תפסידי 60% מהפעמים.' },
  'favorite': { title:'Favorite', text:'מי שיש לו יותר מ-50% סיכוי לזכות. ההפך מ-underdog.' },
  'dominated': { title:'דומיננטיות (Dominated)', text:'כשליריב יש את אותו קלף כמוך + kicker יותר טוב. גם אם תשפרי ליד, היד שלו תהיה טובה יותר.', example:'יש לך T7 והיריב עם AT. אם תפגעי ב-10 בלוח — שניכם עם זוג 10, אבל ה-A שלו kicker יותר טוב.' },
  'coin-flip': { title:'Coin Flip', text:'סיטואציה שבה לשני שחקנים אקוויטי קרובה ל-50/50. בדרך כלל מתייחסים לזה כשזוג נמוך נגד שני קלפים גבוהים.', example:'88 מול AK = coin flip קלאסי. כל אחד מנצח בערך 50%.' },
  'top-pair': { title:'Top Pair (זוג עליון)', text:'זוג שנוצר עם הקלף הגבוה ביותר בלוח. בדרך כלל יד חזקה.', example:'הלוח K-7-5 ויש לך KQ → זוג עליון מלכים עם kicker Q.' },
  'overpair': { title:'Overpair', text:'זוג כיס גבוה יותר מהקלף הגבוה ביותר בלוח. יד חזקה מאוד.', example:'יש לך JJ והלוח 8-7-3 — JJ זה overpair, גובר על כל זוג שיכול להיווצר מהלוח.' },
  'set': { title:'Set', text:'שלישייה (Three of a Kind) שנוצרת מ-זוג כיס + קלף שלישי בלוח. נסתר מאוד מהיריב.', example:'יש לך 55 ביד והפלופ 5-K-2 → set של חמישיות.' },
  'trips': { title:'Trips', text:'שלישייה שנוצרת מקלף אחד ביד + זוג בלוח. דומה ל-set, אבל גלוי יותר ליריב.', example:'יש לך K♥ ביד והלוח KK-7 → trips של מלכים.' },
  'draw': { title:'דרא (Draw)', text:'יד שעדיין לא חזקה אבל יש לה פוטנציאל להשתפר עם קלף נוסף.', example:'4 קלפים מאותו suit = flush draw. צריכים אחד נוסף לפלאש מלא.' },
  'flush-draw': { title:'Flush Draw (דרא לפלאש)', text:'4 קלפים מאותו suit. צריך עוד אחד לפלאש מלא. ~36% להשלים אותו עד הריבר.', example:'יש לך 7♠ K♠ והלוח Q♠ 5♠ 2♥ → flush draw בעלים.' },
  'flush': { title:'Flush (פלאש)', text:'5 קלפים מאותו suit. יד חזקה מאוד — גוברת על straight, two pair, ו-trips.', example:'בידך 7♠ A♠ והלוח K♠ 5♠ 2♠ → 5 ספיידים = flush.' },
  'full-house': { title:'Full House', text:'שלישייה + זוג. יד חזקה מאוד — גוברת על flush ו-straight.', example:'KKK + 77 = "מלכים מלאים בשביעיות".' },
  'two-pair': { title:'Two Pair (שני זוגות)', text:'שני זוגות נפרדים. יד חזקה — גוברת על זוג בודד.', example:'KK + 77 = "מלכים ושביעיות".' },
  'one-pair': { title:'זוג (One Pair)', text:'שני קלפים זהים בערך. למשל 7♠ + 7♥ = זוג שביעיות.' },
  'high-card': { title:'קלף גבוה (High Card)', text:'הצורה החלשה ביותר ביד פוקר — אין שום צירוף, היד מסתמכת רק על הקלף הגבוה ביותר.', example:'יש לך A 9 והלוח לא עזר → A הוא היד שלך. כל זוג, אפילו 22, גובר.' },
  'showdown': { title:'Showdown (שואדאון)', text:'הרגע בסוף היד שבו השחקנים שנשארו חושפים את הקלפים שלהם להחליט מי לוקח את הסיר.' },
  'value-bet': { title:'Value Bet', text:'הימור שמטרתו לקבל call מיריב חלש יותר. ההפך מבלוף — את מהמרת כי את חושבת שהיד שלך הכי חזקה.', example:'יש לך AA והיריב מסתכל על top pair. את מהמרת כדי שהוא יקרא — value bet.' },
  'variance': { title:'Variance', text:'התנודות הסטטיסטיות בטווח הקצר. גם החלטות נכונות יכולות להפסיד פעם אחת — variance זה הרעש סביב התוצאה הצפויה.', example:'אקוויטי של 80% = את צפויה לזכות 8 מתוך 10 פעמים, אבל את עלולה להפסיד 3 פעמים ברציפות.' },
  'outs': { title:'Outs (אאוטס)', text:'הקלפים שעדיין בחפיסה ויכולים לשפר את היד שלך.', example:'יש לך 4 קלפי flush. בחפיסה נשארו 9 קלפים מאותו suit → 9 outs.' },
  'ev': { title:'$EV (Expected Value)', text:'התוצאה הממוצעת של החלטה לאורך זמן. EV חיובי = רווחי. EV שלילי = מפסיד.', example:'EV של -$1.20 ל-call → 100 פעמים זהות → צפויה הפסד מצטבר של $120.' },
  'equity': { title:'אקוויטי (Equity)', text:'האחוז של הסיר שמגיע לך סטטיסטית עכשיו. אם יש לך 70% אקוויטי בסיר של $100 — סטטיסטית מגיע לך $70.' },
  'long-pot': { title:'סיר ארוך', text:'סיטואציה שבה הסיר נבנה לאורך כמה סיבובי הימור. ככל שהסיר גדל, ההחלטות נהיות יקרות ומסוכנות יותר.', example:'נכנסת לסיר עם T7. עד הריבר הסיר הגיע ל-$300. עכשיו כל החלטה עולה הרבה יותר.' },
  'marginal-hand': { title:'יד שולית', text:'יד עם פוטנציאל חלש שלא ברור אם משתלם להמשיך לשחק בה. בדרך כלל ידיים ש"מצליחות" אבל עדיין מפסידות הרבה.', example:'T7 offsuit היא יד שולית קלאסית — אפשר להפוך לזוג, אבל לרוב יהיה זוג חלש שיפסיד.' },
  'pot': { title:'סיר (Pot)', text:'סך כל הכסף שהומר עד עכשיו ביד הזו. השחקן שזוכה בסוף לוקח את כל הסיר.' },
  'board': { title:'לוח (Board)', text:'5 הקלפים הקהילתיים שמחולקים על השולחן (3 בפלופ, 1 בטרן, 1 בריבר). כל השחקנים יכולים להשתמש בהם.' },
  'fold': { title:'Fold (פולד)', text:'לזרוק את היד ולפרוש מהסיבוב. מאבדים מה שהושקע עד עכשיו, אבל לא מסכנים יותר כסף.' },
  'call': { title:'Call (קול)', text:'להשוות להימור של היריב — לשלם את אותו סכום בלי להעלות.' },
  'check': { title:'Check (צ׳ק)', text:'לוותר על הזכות להמר בלי לפרוש. אפשרי רק אם אף אחד עדיין לא הימר בסיבוב הנוכחי.' },
  'raise': { title:'Raise (רייז)', text:'להעלות את ההימור — לשים יותר כסף ממה שהיריב שם, וכך לכפות עליו להחליט שוב.' },
};

// ===== Card helpers =====
const SUIT_SYM = { s:'♠', h:'♥', d:'♦', c:'♣' };
const SUIT_COLOR = { s:'#1a1a1a', c:'#1a1a1a', h:'#c0392b', d:'#c0392b' };
function parseCard(c) {
  if(!c || typeof c!=='string' || c.length<2) return null;
  const suit = c.slice(-1).toLowerCase();
  return { rank: c.slice(0,-1).toUpperCase(), suit, sym: SUIT_SYM[suit]||'?', color: SUIT_COLOR[suit]||'#000' };
}

// ===== DEMO DATA — היד מהסקרינים: T♦7♠ vs 6♠5♥, board KsK7h5sKcJs, ended in tie =====
const DEMO_HAND = {
  handId:'#001',
  playerCards:['Td','7s'],
  boardCards:['Ks','7h','5s','Kc','Js'],
  potSize: 120,
  finalResult: { type:'split', text:'🤝 תיקו' },
};

const STREET_ORDER = ['preflop','flop','turn','river'];
const STREET_LABELS = { preflop:'פרה-פלופ', flop:'פלופ', turn:'טרן', river:'ריבר' };
const STREET_BOARD_COUNT = { preflop:0, flop:3, turn:4, river:5 };

// ===== Sub-components =====
function MiniCard({ card }) {
  const p = parseCard(card);
  if(!p) return <div className="ar-thumb-empty"/>;
  return <div className={`ar-thumb ${p.color==='#c0392b'?'red':'black'}`}>{p.rank}{p.sym}</div>;
}

function PlayerCard({ card }) {
  const p = parseCard(card);
  if(!p) return null;
  return (
    <div className={`ar-card ${p.color==='#c0392b'?'red':'black'}`}>
      <div className="ar-card-rank">{p.rank}</div>
      <div className="ar-card-suit">{p.sym}</div>
    </div>
  );
}

function InlineCard({ card }) {
  const p = parseCard(card);
  if(!p) return null;
  return <span className={`ar-inline-card ${p.color==='#c0392b'?'red':'black'}`}>{p.rank}{p.sym}</span>;
}

function Term({ k, children }) {
  return <span className="ar-term" data-term={k}>{children}</span>;
}

function TermModal({ termKey, onClose }) {
  if(!termKey) return null;
  const def = TERM_DEFS_AR[termKey];
  if(!def) return null;
  return (
    <div className="ar-modal-backdrop" onClick={onClose}>
      <div className="ar-modal" onClick={e=>e.stopPropagation()}>
        <button className="ar-modal-close" onClick={onClose}>×</button>
        <div className="ar-modal-icon">💡</div>
        <h3>{def.title}</h3>
        <p>{def.text}</p>
        {def.example && (
          <div className="ar-modal-example">
            <span className="ar-example-label">דוגמה</span>
            {def.example}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Streets data builder (לדמו — נתונים סטטיים על היד מהסקרינים) =====
const STREETS_DATA = {
  preflop: {
    playerDecision:'Call', analystDecision:'Fold ✓', isCorrect:false,
    reasonNode: (
      <>T♦7♠ <Term k="offsuit">offsuit</Term> היא יד חלשה — שני קלפים שלא מתחברים, ללא צמד וללא <Term k="suit">suit</Term> משותף. ה-<Term k="kicker">kicker</Term> נמוך מדי כדי לתת לקלף הגבוה ערך, וה-<Term k="call">call</Term> כאן מזמין אותך ל<Term k="long-pot">סיר ארוך</Term> עם <Term k="marginal-hand">יד שולית</Term>.</>
    ),
    metrics: {
      equity:{ result:'38%', winPct:'38%', losePct:'62%', warn:true },
      ev:{ result:'-1.20$' },
      rank:{ result:'High' },
    },
  },
  flop: {
    playerDecision:'Check', analystDecision:'Check', isCorrect:true,
    reasonNode: (
      <>הפלופ נתן לך <Term k="one-pair">זוג</Term> שביעיות (זוג בינוני) על ה<Term k="board">לוח</Term> עם K גבוה. <Term k="check">Check</Term> נכון — אין ערך ב<Term k="raise">רייז</Term> עם זוג נמוך מהקלף הגבוה בלוח, אבל היד עדיין שווה לראות עוד קלף.</>
    ),
    metrics: {
      equity:{ result:'48%', winPct:'48%', losePct:'52%', warn:true },
      ev:{ result:'+0.40$' },
      rank:{ result:'Pair (7s)' },
    },
  },
  turn: {
    playerDecision:'Call', analystDecision:'Call', isCorrect:true,
    reasonNode: (
      <>הטרן הביא K נוסף — עכשיו יש לך <Term k="two-pair">שני זוגות</Term> (KK + 77). שיפור משמעותי. אבל זהירות: KK על הלוח אומר שגם ליריב יש את הזוג הזה. אם יש לו K ביד — יש לו <Term k="trips">trips</Term>. <Term k="call">Call</Term> ולא <Term k="raise">raise</Term>.</>
    ),
    metrics: {
      equity:{ result:'72%', winPct:'72%', losePct:'28%', warn:false },
      ev:{ result:'+8.60$' },
      rank:{ result:'Two Pair' },
    },
  },
  river: {
    playerDecision:'Check', analystDecision:'Check', isCorrect:true,
    reasonNode: (
      <><InlineCard card="Js"/> הביא 3 ספייד ללוח — אם ליריב 2 ספייד, יש לו <Term k="flush">פלאש</Term> שגובר על <Term k="two-pair">שני זוגות</Term>. KK77 שלך עדיין יד טובה אבל לא מספיק חזקה ל-<Term k="value-bet">value bet</Term>. <Term k="check">Check</Term> והגענו ל-<Term k="showdown">showdown</Term>.</>
    ),
    metrics: {
      equity:{ result:'50%', winPct:'50%', losePct:'~55%', warn:false, isShowdown:true },
      ev:{ result:'+60$' },
      rank:{ result:'Two Pair' },
    },
  },
};

// ===== Main Component =====
export default function AnalystReport({ onExit, hand=DEMO_HAND }) {
  const [activeStreet, setActiveStreet] = useState('preflop');
  const [activeMetric, setActiveMetric] = useState({preflop:'equity'});
  const [termKey, setTermKey] = useState(null);

  const toggleStreet = (k) => {
    setActiveStreet(prev => prev===k ? null : k);
  };
  const toggleMetric = (street, metric) => {
    setActiveMetric(prev => ({ ...prev, [street]: prev[street]===metric ? null : metric }));
  };

  // Term click delegation
  const onContentClick = (e) => {
    const t = e.target.closest('.ar-term');
    if(t) {
      e.stopPropagation();
      setTermKey(t.dataset.term);
    }
  };

  return (
    <div className="ar-root" onClick={onContentClick}>
      <style>{CSS}</style>

      {/* HEADER */}
      <div className="ar-header">
        <div className="ar-header-top">
          <div className="ar-header-title">
            דו״ח אנליסט
            <span className="ar-hand-id">יד {hand.handId}</span>
          </div>
          <button className="ar-close-btn" onClick={onExit}>סגור</button>
        </div>
        <div className="ar-header-bottom">
          <div className="ar-player-section">
            <div className="ar-label-tiny">הקלפים שלך</div>
            <div className="ar-player-cards">
              {hand.playerCards.map((c,i)=> <PlayerCard key={i} card={c}/>)}
            </div>
          </div>
          <div className="ar-result-badge">{hand.finalResult.text}</div>
        </div>
      </div>

      <div className="ar-body">
        <div className="ar-meta">
          <span><Term k="pot">סיר</Term> סופי: <span className="ar-meta-value">${hand.potSize}</span></span>
          <span>4 שלבים</span>
        </div>

        {STREET_ORDER.map(streetKey => {
          const data = STREETS_DATA[streetKey];
          const isActive = activeStreet === streetKey;
          const visibleBoard = hand.boardCards.slice(0, STREET_BOARD_COUNT[streetKey]);
          const currentMetric = activeMetric[streetKey] || null;

          return (
            <div key={streetKey} className={`ar-acc ${isActive?'active':''}`}>
              <button className="ar-acc-head" onClick={()=>toggleStreet(streetKey)}>
                <div className="ar-acc-head-label">
                  <span className="ar-chevron">›</span>
                  <span className="ar-street-name">{STREET_LABELS[streetKey]}</span>
                </div>
                <div className="ar-thumbs">
                  {[0,1,2,3,4].map(i => (
                    i < STREET_BOARD_COUNT[streetKey]
                      ? <MiniCard key={i} card={visibleBoard[i]}/>
                      : <div key={i} className="ar-thumb-empty"/>
                  ))}
                </div>
              </button>

              {isActive && (
                <div className="ar-acc-body">
                  <DecisionRow data={data}/>
                  <div className="ar-reason">
                    <span className="ar-reason-label">הסיבה: </span>
                    {data.reasonNode}
                  </div>

                  <div className="ar-metrics-row">
                    <MetricPill label="אקוויטי" result={data.metrics.equity.result}
                                active={currentMetric==='equity'}
                                onClick={()=>toggleMetric(streetKey,'equity')}/>
                    <MetricPill label="$EV" result={data.metrics.ev.result}
                                active={currentMetric==='ev'}
                                onClick={()=>toggleMetric(streetKey,'ev')}/>
                    <MetricPill label="דירוג יד" result={data.metrics.rank.result}
                                active={currentMetric==='rank'}
                                onClick={()=>toggleMetric(streetKey,'rank')}/>
                  </div>

                  {currentMetric==='equity' && <EquityPanel street={streetKey} data={data.metrics.equity}/>}
                  {currentMetric==='ev' && <EVPanel street={streetKey}/>}
                  {currentMetric==='rank' && <RankPanel street={streetKey}/>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TermModal termKey={termKey} onClose={()=>setTermKey(null)}/>
    </div>
  );
}

function DecisionRow({ data }) {
  const playerTone = data.isCorrect ? 'positive' : 'negative';
  return (
    <div className="ar-decision-grid">
      <div className={`ar-decision tone-${playerTone}`}>
        <div className="ar-decision-label">הפעולה שלך</div>
        <div className="ar-decision-value">{data.playerDecision}</div>
      </div>
      <div className="ar-decision tone-gold">
        <div className="ar-decision-label">המלצת אנליסט</div>
        <div className="ar-decision-value">{data.analystDecision}</div>
      </div>
    </div>
  );
}

function MetricPill({ label, result, active, onClick }) {
  return (
    <button className={`ar-pill ${active?'active':''}`} onClick={onClick}>
      <span className="ar-pill-icon">?</span>
      <span className="ar-pill-label">{label}</span>
      <span className="ar-pill-result">{result}</span>
    </button>
  );
}

// ===== Equity panels (per-street, with rich loss breakdown) =====
function EquityPanel({ street, data }) {
  return (
    <div className="ar-panel">
      <div className="ar-stats-row">
        <div className="ar-stat win">
          <div className="ar-stat-label">{data.isShowdown ? 'תוצאת showdown' : 'סיכוי ניצחון 🏆'}</div>
          <div className="ar-stat-value">{data.winPct}</div>
        </div>
        <div className={`ar-stat ${data.warn ? 'warn' : 'lose'}`}>
          <div className="ar-stat-label">{data.isShowdown ? 'תיאורטי לפני חשיפה' : 'סיכוי הפסד ⚠️'}</div>
          <div className="ar-stat-value">{data.losePct}</div>
        </div>
      </div>

      {street==='preflop' && (
        <>
          <div className="ar-warning-banner">⚠️ את <Term k="underdog">underdog</Term> ברוב המקרים — שקלי <Term k="fold">fold</Term>!</div>
          <div className="ar-breakdown-title">מה מנצח את T♦7♠ פרה-פלופ:</div>
          <ul className="ar-breakdown">
            <BreakdownItem
              title={<><Term k="pocket-pair">זוג כיס</Term> גבוה</>}
              pct="~5% מהידיים"
              detail={<>הידיים: <strong>88, 99, TT, JJ, QQ, KK, AA</strong> — את <Term k="underdog">underdog</Term> של ~80%. תרחיש קטסטרופלי.</>}
            />
            <BreakdownItem
              title="שני קלפים גבוהים מ-10"
              pct="~6% מהידיים"
              detail={<><strong>AK, AQ, AJ, KQ, KJ, QJ</strong> — שני קלפים שיכולים להפוך לזוג גבוה. <Term k="underdog">underdog</Term> של 60-65%.</>}
            />
            <BreakdownItem
              title={<><Term k="dominated">דומיננטיות</Term> (קלף שלך + <Term k="kicker">kicker</Term> חזק)</>}
              pct="~7% מהידיים"
              detail={<>ידיים שמכילות <strong>T או 7 עם <Term k="kicker">kicker</Term> גבוה משלך</strong>: AT, KT, QT, JT, A7, K7, Q7, J7. את <Term k="dominated">dominated</Term>.</>}
            />
            <BreakdownItem
              title={<>קלף גבוה אחד עם <Term k="kicker">kicker</Term> סביר</>}
              pct="~30% מהידיים"
              detail={<>כל יד עם A, K, Q או J ו-<Term k="kicker">kicker</Term> בטווח הביניים. <Term k="underdog">underdog</Term> של 52-58%.</>}
            />
            <BreakdownItem positive
              title={<>ידיים שאת <Term k="favorite">favorite</Term> מולן</>}
              pct="~52% מהידיים"
              detail={<>קלפים נמוכים שלא חופפים אליך. אבל הסך מטה את ה<Term k="equity">אקוויטי</Term> ל-38%.</>}
            />
          </ul>
        </>
      )}

      {street==='flop' && (
        <>
          <div className="ar-warning-banner">⚠️ <Term k="coin-flip">Coin flip</Term> עם נטייה קלה לרעתך</div>
          <div className="ar-breakdown-title">מה גובר על <Term k="one-pair">זוג</Term> שביעיות:</div>
          <ul className="ar-breakdown">
            <BreakdownItem
              title={<>ליריב יש K (<Term k="top-pair">זוג עליון</Term>)</>}
              pct="~24% מהידיים"
              detail={<>Kings שנותרו: <InlineCard card="Kh"/> <InlineCard card="Kd"/> <InlineCard card="Kc"/>. <Term k="top-pair">זוג עליון</Term> מלכים. <Term k="underdog">underdog</Term> של ~80% (יש לך 5 <Term k="outs">outs</Term> ל-<Term k="trips">trips</Term> או <Term k="two-pair">two pair</Term>).</>}
            />
            <BreakdownItem
              title={<><Term k="pocket-pair">זוג כיס</Term> גבוה מ-7</>}
              pct="~3% מהידיים"
              detail={<><strong>88, 99, TT, JJ, QQ, AA</strong>. <Term k="overpair">Overpair</Term> מוביל אותך נטו.</>}
            />
            <BreakdownItem
              title={<><Term k="set">Set</Term> (<Term k="pocket-pair">זוג כיס</Term> שמתחבר ללוח)</>}
              pct="פחות מ-1%"
              detail={<>פוקט 55 → <Term k="set">set</Term> של חמישיות. נדיר אבל קטלני — <Term k="underdog">underdog</Term> של ~95%.</>}
            />
            <BreakdownItem
              title={<><Term k="flush-draw">דרא לפלאש</Term> (2 ספייד ביד היריב)</>}
              pct="~10% מהידיים"
              detail={<>על הלוח 2 ספייד (<InlineCard card="Ks"/><InlineCard card="5s"/>). 2 ספייד נוספים → <Term k="flush-draw">flush draw</Term> עם ~36% להשלים.</>}
            />
            <BreakdownItem positive
              title="ידיים שאת לפחות מובילה"
              pct="~63% מהידיים"
              detail={<>כל יד שלא מכילה K, לא <Term k="pocket-pair">זוג כיס</Term> גבוה ולא <Term k="draw">דרא</Term>.</>}
            />
          </ul>
        </>
      )}

      {street==='turn' && (
        <>
          <div className="ar-breakdown-title">מה יכול לגבור על KK + 77:</div>
          <ul className="ar-breakdown">
            <BreakdownItem
              title={<>ליריב יש K (<Term k="trips">Trips</Term> Kings)</>}
              pct="~9% מהידיים"
              detail={<>Kings שנותרו: <InlineCard card="Kh"/> <InlineCard card="Kd"/>. KKK + 77 = <Term k="full-house">full house</Term>.</>}
            />
            <BreakdownItem
              title={<>ליריב יש 7 (<Term k="full-house">Full House</Term>)</>}
              pct="~9% מהידיים"
              detail={<>7s שנותרו: <InlineCard card="7c"/> <InlineCard card="7d"/>. עם 7 ביד — תיקו. רק עם שני 7s → <Term k="full-house">full house</Term> אמיתי.</>}
            />
            <BreakdownItem
              title={<><Term k="pocket-pair">זוג כיס</Term> מ-8 ומעלה</>}
              pct="~3% מהידיים"
              detail={<><strong>88, 99, TT, JJ, QQ</strong>. KK + (8-Q) עדיף על KK + 77.</>}
            />
            <BreakdownItem
              title={<><Term k="flush-draw">דרא לפלאש</Term> שמשלים בריבר</>}
              pct="~7% מהידיים"
              detail={<>על הלוח 2 ספייד. 2 ספייד ביד יריב → <Term k="flush-draw">flush draw</Term> עם ~20% להשלים.</>}
            />
            <BreakdownItem positive
              title="ידיים שאת מובילה מולן"
              pct="~72% מהידיים"
              detail={<>הרוב המוחלט — <Term k="two-pair">שני זוגות</Term> KK77 לוקחת את ה<Term k="pot">סיר</Term>.</>}
            />
          </ul>
        </>
      )}

      {street==='river' && (
        <>
          <div className="ar-breakdown-title">מה היה מנצח את KK + 77:</div>
          <ul className="ar-breakdown">
            <BreakdownItem
              title={<>ליריב K (<Term k="trips">Trips</Term> Kings)</>}
              pct="~9%"
              detail={<>Kings שנותרו: <InlineCard card="Kh"/> <InlineCard card="Kd"/>. KKK + KK = <Term k="full-house">full house</Term> מלכים מלאים.</>}
            />
            <BreakdownItem
              title={<>ליריב J (<Term k="two-pair">Two Pair</Term> Ks & Js)</>}
              pct="~13%"
              detail={<>Js שנותרו: <InlineCard card="Jc"/> <InlineCard card="Jh"/> <InlineCard card="Jd"/>. KK + JJ גובר על KK + 77.</>}
            />
            <BreakdownItem
              title={<><Term k="flush">פלאש</Term> (2 ספייד ביד היריב)</>}
              pct="~4%"
              detail={<>על הלוח 3 ספייד (<InlineCard card="Ks"/><InlineCard card="5s"/><InlineCard card="Js"/>). יש לך רק <InlineCard card="7s"/>. 2 ספייד מתוך 9 → <Term k="flush">flush</Term>.</>}
            />
            <BreakdownItem
              title={<><Term k="pocket-pair">זוג כיס</Term> גבוה (88-QQ)</>}
              pct="~2%"
              detail={<>JJ אסור (J♠ על הלוח). שאר נותנים <Term k="two-pair">שני זוגות</Term> גבוהים יותר.</>}
            />
            <li className="ar-breakdown-item ar-breakdown-highlight">
              <div className="ar-breakdown-header">
                <div className="ar-breakdown-title-row">
                  <span className="ar-breakdown-marker positive">⊳</span>
                  בפועל מה היה לבוט
                </div>
                <span className="ar-breakdown-pct" style={{color: C.gold}}>
                  <InlineCard card="6s"/> <InlineCard card="5h"/>
                </span>
              </div>
              <div className="ar-breakdown-detail" style={{background:'rgba(201,168,76,0.08)', padding:8, borderRadius:4, marginTop:4}}>
                KK (מהלוח) + 55 = <Term k="two-pair">שני זוגות</Term> מלכים וחמישיות. <strong>שלך KK77 הייתה צריכה לנצח</strong> כי 7 &gt; 5. שווה לבדוק את לוגיקת ה-<Term k="showdown">showdown</Term>.
              </div>
            </li>
          </ul>
        </>
      )}

      <div className="ar-formula-block">
        <div className="ar-formula-label">נוסחה</div>
        <div className="ar-formula-code">Equity = Wins / Total Simulations × 100</div>
      </div>
    </div>
  );
}

function BreakdownItem({ title, pct, detail, positive=false }) {
  return (
    <li className="ar-breakdown-item">
      <div className="ar-breakdown-header">
        <div className="ar-breakdown-title-row">
          <span className={`ar-breakdown-marker ${positive?'positive':''}`}>{positive?'⊳':'▸'}</span>
          {title}
        </div>
        <span className={`ar-breakdown-pct ${positive?'positive':''}`}>{pct}</span>
      </div>
      <div className="ar-breakdown-detail">{detail}</div>
    </li>
  );
}

function EVPanel({ street }) {
  const data = {
    preflop: {
      formula:`EV = (38% × $20) − (62% × $20)\n   = $7.60 − $12.40\n   = -$4.80 → reverse implied: -$1.20`,
      detail: <>ה-<Term k="call">call</Term> עולה $20 לתוך <Term k="pot">סיר</Term> של $20. <Term k="pot-odds">Pot odds</Term> מצדיקים בקושי, אבל <Term k="reverse-implied-odds">reverse implied odds</Term> משלימים: עם יד חלשה ש"מצליחה" — לעיתים קרובות עדיין מפסידה.</>,
      value:'-$1.20',
    },
    flop: {
      formula:`EV(Check) = 0  (לא הושקע כסף)\nEV(See Turn for free) = +$0.40`,
      detail: <><Term k="check">Check</Term> עולה $0. אבל לראות את הטרן בחינם — אם יביא <Term k="two-pair">two pair</Term> או <Term k="trips">trips</Term>, את משדרגת.</>,
      value:'+$0.40',
    },
    turn: {
      formula:`EV = (72% × $80) − (28% × $20)\n   = $57.60 − $5.60\n   = +$52.00 → adj: +$8.60`,
      detail: <>עם 72% <Term k="equity">אקוויטי</Term>, ה-<Term k="call">call</Term> של $20 לתוך <Term k="pot">סיר</Term> $80 רווחי בענק. גם אחרי <Term k="variance">variance</Term> ו-<Term k="implied-odds">implied odds</Term>.</>,
      value:'+$8.60',
    },
    river: {
      formula:`EV = 50% × Pot − 50% × 0\n   = 0.5 × $120\n   = +$60`,
      detail: <>תיקו = חצי מה<Term k="pot">סיר</Term>. סיר $120 → רווח $60. למרות שמתמטית היית צריכה לקחת הכל.</>,
      value:'+$60',
    },
  }[street];

  return (
    <div className="ar-panel">
      <div className="ar-formula-label">חישוב $<Term k="ev">EV</Term></div>
      <div className="ar-formula-code">{data.formula}</div>
      <div className="ar-simple-result">
        <div className="ar-simple-detail">{data.detail}</div>
        <div className="ar-simple-value">{data.value}</div>
      </div>
    </div>
  );
}

function RankPanel({ street }) {
  const data = {
    preflop: {
      detail: <>אין צירוף — היד נשענת על ה<Term k="high-card">קלף הגבוה</Term> (10) בלבד. הצורה החלשה ביותר.</>,
      value: 'High Card',
    },
    flop: {
      detail: <><Term k="one-pair">זוג</Term> שביעיות (<InlineCard card="7s"/> ביד + <InlineCard card="7h"/> בלוח) עם <Term k="kicker">kicker</Term> עשירייה.</>,
      value: 'One Pair',
    },
    turn: {
      detail: <><Term k="two-pair">שני זוגות</Term> — מלכים ושביעיות. <InlineCard card="Ks"/><InlineCard card="Kc"/> מהלוח + <InlineCard card="7s"/><InlineCard card="7h"/>.</>,
      value: 'Two Pair',
    },
    river: {
      detail: <><Term k="two-pair">שני זוגות</Term> — מלכים ושביעיות, <Term k="kicker">kicker</Term> J. ליריב: מלכים וחמישיות.</>,
      value: 'Two Pair',
    },
  }[street];

  return (
    <div className="ar-panel">
      <div className="ar-formula-label">דירוג</div>
      <div className="ar-simple-result">
        <div className="ar-simple-detail">{data.detail}</div>
        <div className="ar-simple-value">{data.value}</div>
      </div>
    </div>
  );
}

// ===== CSS (single string, scoped via .ar-* prefix) =====
const CSS = `
.ar-root {
  background: ${C.bgFelt};
  min-height: 100vh;
  font-family: ${FONT};
  color: ${C.cream};
  direction: rtl;
  padding-bottom: 24px;
  box-sizing: border-box;
}
.ar-root * { box-sizing: border-box; }

.ar-header {
  position: sticky; top: 0; z-index: 10;
  background: ${C.bgFelt};
  border-bottom: 1px solid ${C.goldSoft};
  padding: 14px 16px 12px;
}
.ar-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ar-header-title { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
.ar-hand-id { color: ${C.creamMute}; font-size: 13px; font-weight: normal; margin-right: 8px; }
.ar-close-btn {
  background: transparent; border: 1px solid ${C.goldSoft};
  color: ${C.cream}; padding: 5px 12px; border-radius: 4px;
  font-family: ${FONT}; font-size: 13px; cursor: pointer;
}
.ar-header-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ar-player-section { display: flex; flex-direction: column; gap: 4px; }
.ar-label-tiny { font-size: 11px; color: ${C.creamMute}; }
.ar-player-cards { display: flex; gap: 4px; direction: ltr; }

.ar-card {
  width: 30px; height: 42px; border-radius: 4px;
  background: #fbf8ee; display: flex; flex-direction: column;
  align-items: center; justify-content: center; font-weight: bold;
  box-shadow: 0 1px 3px rgba(0,0,0,0.4); line-height: 1;
}
.ar-card.red { color: #c0392b; }
.ar-card.black { color: #1a1a1a; }
.ar-card-rank { font-size: 13px; }
.ar-card-suit { font-size: 14px; }

.ar-result-badge {
  padding: 6px 14px; border: 1px solid ${C.gold};
  border-radius: 20px; color: ${C.gold}; font-size: 13px;
  font-weight: bold; background: rgba(0,0,0,0.2); white-space: nowrap;
}

.ar-body { padding: 12px 12px 8px; }
.ar-meta {
  display: flex; justify-content: space-between;
  padding: 6px 10px; margin-bottom: 10px;
  font-size: 12px; color: ${C.creamMute};
  border-bottom: 1px solid ${C.divider};
}
.ar-meta-value { color: ${C.cream}; direction: ltr; display: inline-block; }

.ar-acc {
  margin-bottom: 8px; background: ${C.bgPanel};
  border: 1px solid ${C.divider}; border-radius: 8px;
  overflow: hidden; transition: border-color 0.2s;
}
.ar-acc.active { border-color: ${C.gold}; }
.ar-acc-head {
  width: 100%; background: transparent; border: none;
  padding: 13px 14px; font-family: ${FONT}; color: ${C.cream};
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; text-align: right;
}
.ar-acc.active .ar-acc-head { background: ${C.goldGlow}; }
.ar-acc-head-label { display: flex; align-items: center; gap: 10px; }
.ar-chevron {
  color: ${C.creamDim}; font-size: 18px;
  transition: transform 0.25s, color 0.25s; display: inline-block;
}
.ar-acc.active .ar-chevron { transform: rotate(90deg); color: ${C.gold}; }
.ar-street-name { font-size: 16px; font-weight: bold; }

.ar-thumbs { display: flex; gap: 3px; direction: ltr; }
.ar-thumb {
  width: 18px; height: 24px; border-radius: 2px;
  background: #fbf8ee; display: flex;
  align-items: center; justify-content: center;
  font-size: 9px; font-weight: bold; line-height: 1;
  font-family: ${FONT};
}
.ar-thumb.red { color: #c0392b; }
.ar-thumb.black { color: #1a1a1a; }
.ar-thumb-empty {
  width: 18px; height: 24px; border-radius: 2px;
  border: 1px dashed ${C.creamMute}; opacity: 0.3;
}

.ar-acc-body {
  border-top: 1px solid ${C.divider};
  padding: 13px 14px;
}

.ar-decision-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ar-decision {
  background: ${C.bgPanelDeep}; padding: 9px 11px;
  border-radius: 6px; border: 1px solid ${C.divider};
}
.ar-decision-label { font-size: 11px; color: ${C.creamMute}; margin-bottom: 4px; }
.ar-decision-value { font-size: 16px; font-weight: bold; }
.ar-decision.tone-positive .ar-decision-value { color: ${C.positive}; }
.ar-decision.tone-negative .ar-decision-value { color: ${C.negative}; }
.ar-decision.tone-gold .ar-decision-value { color: ${C.gold}; }

.ar-reason {
  margin-top: 10px; padding: 9px 11px;
  background: ${C.bgPanelDeep}; border-right: 2px solid ${C.gold};
  color: ${C.creamDim}; font-size: 13px; line-height: 1.6;
  border-radius: 3px;
}
.ar-reason-label { color: ${C.gold}; font-weight: bold; }

.ar-metrics-row { margin-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
.ar-pill {
  padding: 7px 11px 7px 9px; background: transparent;
  color: ${C.cream}; border: 1px solid ${C.gold};
  border-radius: 20px; font-family: ${FONT}; font-size: 13px;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.15s;
}
.ar-pill-icon {
  width: 17px; height: 17px; border-radius: 50%;
  background: ${C.goldSoft}; color: ${C.gold};
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: bold; line-height: 1; flex-shrink: 0;
}
.ar-pill.active { background: ${C.gold}; color: ${C.bgFelt}; }
.ar-pill.active .ar-pill-icon { background: rgba(13,40,24,0.4); color: ${C.bgFelt}; }
.ar-pill-label { font-weight: bold; }
.ar-pill-result { opacity: 0.85; font-size: 12px; direction: ltr; }

.ar-panel {
  margin-top: 11px; background: ${C.bgPanelDeep};
  border: 1px solid ${C.goldSoft}; border-radius: 6px;
  padding: 12px;
}

.ar-stats-row { display: flex; gap: 8px; margin-bottom: 11px; }
.ar-stat {
  flex: 1; background: rgba(0,0,0,0.25);
  padding: 9px 11px; border-radius: 6px;
  border: 1px solid ${C.divider};
}
.ar-stat.win { border-color: rgba(127,176,105,0.4); }
.ar-stat.lose { border-color: rgba(217,119,87,0.4); }
.ar-stat.warn { border-color: rgba(232,176,74,0.5); background: rgba(232,176,74,0.08); }
.ar-stat-label { font-size: 11px; color: ${C.creamMute}; margin-bottom: 3px; }
.ar-stat-value { font-size: 21px; font-weight: bold; direction: ltr; }
.ar-stat.win .ar-stat-value { color: ${C.positive}; }
.ar-stat.lose .ar-stat-value { color: ${C.negative}; }
.ar-stat.warn .ar-stat-value { color: ${C.warning}; }

.ar-warning-banner {
  background: rgba(232,176,74,0.12);
  border: 1px solid rgba(232,176,74,0.3);
  color: ${C.warning}; padding: 7px 11px;
  border-radius: 5px; font-size: 13px; font-weight: bold;
  margin-bottom: 11px;
}

.ar-breakdown-title {
  font-size: 13px; color: ${C.gold}; font-weight: bold;
  margin-bottom: 7px; padding-bottom: 5px;
  border-bottom: 1px solid ${C.divider};
}
.ar-breakdown { list-style: none; padding: 0; margin-bottom: 11px; }
.ar-breakdown-item { padding: 7px 0; border-bottom: 1px dashed ${C.divider}; }
.ar-breakdown-item:last-child { border-bottom: none; }
.ar-breakdown-header {
  display: flex; justify-content: space-between;
  align-items: center; gap: 8px; margin-bottom: 4px;
}
.ar-breakdown-title-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: bold; color: ${C.cream}; flex: 1;
}
.ar-breakdown-marker { color: ${C.negative}; font-weight: bold; }
.ar-breakdown-marker.positive { color: ${C.positive}; }
.ar-breakdown-pct {
  color: ${C.negative}; font-size: 13px; font-weight: bold;
  direction: ltr; white-space: nowrap;
}
.ar-breakdown-pct.positive { color: ${C.positive}; }
.ar-breakdown-detail {
  font-size: 12px; color: ${C.creamDim};
  line-height: 1.6; padding-right: 14px;
}

.ar-inline-card {
  display: inline-flex; background: #fbf8ee;
  padding: 1px 5px; border-radius: 3px;
  font-weight: bold; font-size: 11px; margin: 0 1px;
  direction: ltr; vertical-align: 1px;
}
.ar-inline-card.red { color: #c0392b; }
.ar-inline-card.black { color: #1a1a1a; }

.ar-formula-block {
  margin-top: 8px; padding-top: 9px;
  border-top: 1px solid ${C.divider};
}
.ar-formula-label { font-size: 11px; color: ${C.creamMute}; margin-bottom: 6px; }
.ar-formula-code {
  background: #000; color: ${C.gold};
  padding: 8px 10px; border-radius: 4px;
  font-family: ${FONT_MONO}; font-size: 12px;
  direction: ltr; text-align: left; line-height: 1.5;
  white-space: pre-wrap;
}

.ar-simple-result {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 12px; margin-top: 9px;
}
.ar-simple-detail { font-size: 12px; color: ${C.creamDim}; line-height: 1.6; flex: 1; }
.ar-simple-value { font-size: 22px; font-weight: bold; color: ${C.gold}; direction: ltr; white-space: nowrap; }

/* ===== Term (clickable yellow + dashed) ===== */
.ar-term {
  color: ${C.gold};
  text-decoration: underline dashed;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  cursor: pointer;
  font-weight: 500;
  padding: 0 2px;
  border-radius: 2px;
  transition: background 0.15s;
}
.ar-term:active { background: rgba(201,168,76,0.2); }

/* ===== Term Modal ===== */
.ar-modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 200; display: flex;
  align-items: center; justify-content: center;
  padding: 20px;
  animation: arFadeBg 0.2s ease-out;
}
@keyframes arFadeBg { from { opacity: 0; } to { opacity: 1; } }

.ar-modal {
  background: ${C.bgPanel};
  border: 1px solid ${C.gold};
  border-radius: 12px;
  padding: 22px 20px 20px;
  max-width: 340px;
  width: 100%;
  position: relative;
  direction: rtl;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  animation: arPop 0.25s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes arPop {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.ar-modal-close {
  position: absolute; top: 8px; left: 10px;
  background: transparent; border: none;
  color: ${C.creamMute}; font-size: 24px;
  cursor: pointer; width: 32px; height: 32px;
  border-radius: 50%; line-height: 1;
}
.ar-modal-icon { color: ${C.gold}; font-size: 22px; margin-bottom: 4px; }
.ar-modal h3 {
  color: ${C.gold}; font-family: ${FONT};
  font-size: 17px; margin: 0 0 11px 0;
  padding-left: 30px;
}
.ar-modal p {
  color: ${C.cream}; font-family: ${FONT};
  font-size: 14px; line-height: 1.65; margin: 0;
}
.ar-modal-example {
  margin-top: 11px; padding: 9px 11px;
  background: ${C.bgPanelDeep};
  border-right: 2px solid ${C.gold};
  border-radius: 3px;
  color: ${C.creamDim};
  font-size: 13px; line-height: 1.6;
}
.ar-example-label {
  color: ${C.gold}; font-weight: bold; font-size: 11px;
  letter-spacing: 0.5px;
  margin-bottom: 4px; display: block;
}

/* Animations */
.ar-acc { animation: arFadeIn 0.4s ease-out backwards; }
.ar-acc:nth-child(2) { animation-delay: 0.05s; }
.ar-acc:nth-child(3) { animation-delay: 0.10s; }
.ar-acc:nth-child(4) { animation-delay: 0.15s; }
.ar-acc:nth-child(5) { animation-delay: 0.20s; }
@keyframes arFadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;
