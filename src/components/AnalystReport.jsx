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
// Reverse map for "K♠" → "s" so we accept both internal formats.
const SYM_TO_SUIT = { '♠':'s', '♥':'h', '♦':'d', '♣':'c' };
function parseCard(c) {
  if(!c || typeof c!=='string' || c.length<2) return null;
  const last = c.slice(-1);
  let suit;
  // Format "K♠" — last char is a unicode suit symbol
  if(SYM_TO_SUIT[last]) suit = SYM_TO_SUIT[last];
  // Format "Ks" — last char is a letter
  else suit = last.toLowerCase();
  return { rank: c.slice(0,-1).toUpperCase(), suit, sym: SUIT_SYM[suit]||last, color: SUIT_COLOR[suit]||'#000' };
}

// ===== DEMO DATA — fallback אם לא נשלחו props אמיתיים =====
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

// ============================================================================
// buildStreetsFromHand — translator: real game data → streets data structure
// ============================================================================
// Input:
//   playerHand: ["K♠","2♥"]  (rank+suit format)
//   community:  ["K♠","7♥","5♠","K♣","J♠"]  (up to 5)
//   actions:    [{action:"call", round:"preflop"}, ...]
//   resultData: { won, tied, type:"fold"|"showdown", pe, be }  // pe=playerEval, be=botEval
//   reachedStage: "preflop"|"flop"|"turn"|"river"|"showdown"
//   evaluators: { analyzeContext } — passed in to avoid circular dep
// Output: streets object compatible with AnalystReport
// ----------------------------------------------------------------------------
export function buildStreetsFromHand({ playerHand, community, actions, resultData, reachedStage, analyzeContext }) {
  const streets = {};
  const stageBoardLen = { preflop:0, flop:3, turn:4, river:5 };
  const stageOrder = ['preflop','flop','turn','river'];
  const reachedIdx = stageOrder.indexOf(reachedStage === 'showdown' ? 'river' : reachedStage);

  for(const stage of stageOrder) {
    const stageIdx = stageOrder.indexOf(stage);
    if(stageIdx > reachedIdx && reachedStage !== 'showdown') {
      // השלב לא הגיע — לא מציגים אותו (אקורדיון יראה אבל יהיה ריק)
      streets[stage] = null;
      continue;
    }

    const visibleBoard = community.slice(0, stageBoardLen[stage]);
    const ctx = analyzeContext(playerHand, visibleBoard);
    const action = actions.find(a => a.round === stage);
    streets[stage] = buildStageData({ stage, playerHand, visibleBoard, ctx, action, resultData });
  }

  return streets;
}

// Build a single stage entry
function buildStageData({ stage, playerHand, visibleBoard, ctx, action, resultData }) {
  const playerDecision = action ? ACTION_LABELS[action.action] : '—';
  const { recommendation, isCorrect, reasonText } = analyzeDecision({ stage, ctx, action });

  // Equity: ctx.strength is 0–100 — use as approximation of win chance
  // (לא Monte Carlo אמיתי, אבל heuristic סביר על בסיס strength)
  const equityPct = Math.max(15, Math.min(92, Math.round(ctx.strength)));
  const losePct = 100 - equityPct;
  const warn = equityPct < 50;

  // EV very rough heuristic — סימן ועוצמה לפי strength + action
  const evResult = computeEV({ ctx, action, stage, equityPct });

  // Hand rank from analyzeContext
  const rankResult = ctx.current.name;

  return {
    playerDecision,
    analystDecision: recommendation,
    isCorrect,
    reasonText, // string, will be rendered with simple text (no Term components)
    handStr: playerHand.join(' '),
    boardStr: visibleBoard.join(' '),
    metrics: {
      equity: { result: `${equityPct}%`, winPct: `${equityPct}%`, losePct: `${losePct}%`, warn, isShowdown: stage==='river' && resultData?.type!=='fold' },
      ev:   { result: evResult.label, formula: evResult.formula, detail: evResult.detail, value: evResult.label },
      rank: { result: rankResult, detail: ctx.potential || '—' },
    },
    // Loss breakdown is generated dynamically based on hand strength category
    breakdown: buildBreakdown({ stage, ctx, playerHand, visibleBoard }),
  };
}

const ACTION_LABELS = {
  fold:  'Fold (פולד)',
  call:  'Call (קול)',
  raise: 'Raise (רייז)',
  check: 'Check (צ׳ק)',
};

// ----------------------------------------------------------------------------
// analyzeDecision — for each stage, given ctx and action, what should be done
// ----------------------------------------------------------------------------
function analyzeDecision({ stage, ctx, action }) {
  if(!action) {
    return { recommendation: '—', isCorrect: true, reasonText: 'לא בוצעה פעולה בשלב זה.' };
  }
  const a = action.action;
  const s = ctx.strength;
  const handName = ctx.current.name;

  // Pre-flop logic — based on hand strength
  if(stage === 'preflop') {
    if(s >= 60) {
      if(a === 'raise') return { recommendation:'Raise (רייז) ✓', isCorrect:true, reasonText:`עם ${handName} (יד חזקה) — רייז בפרה-פלופ הוא הצעד הנכון. בונה את הסיר מוקדם וצמצם יריבים שעלולים לפגוע בלוח.` };
      if(a === 'call')  return { recommendation:'Raise (רייז)', isCorrect:false, reasonText:`עם ${handName} (יד חזקה כל-כך), רייז היה עדיף על קול. קול מאפשר לכל היריבים להיכנס בזול ופותח לוח לא צפוי.` };
      return { recommendation:'Raise (רייז)', isCorrect:false, reasonText:`פולד עם ${handName} זה ויתור על אחת הידיים החזקות שיכולות להגיע. רייז כמעט תמיד.` };
    }
    if(s >= 30) {
      if(a === 'call')  return { recommendation:'Call (קול) ✓', isCorrect:true, reasonText:`יד בינונית (${handName}) מתאימה לקול — לראות פלופ בזול ולא להתחייב יותר מדי.` };
      if(a === 'raise') return { recommendation:'Call (קול)', isCorrect:false, reasonText:`רייז עם יד בינונית (${handName}) זה אגרסיבי מדי לפני שיש מידע על הלוח. קול בטוח יותר.` };
      return { recommendation:'Call (קול)', isCorrect:false, reasonText:`עם יד בינונית (${handName}) שווה לראות את הפלופ — אין סיבה לפולד מוקדם.` };
    }
    // Weak preflop hand
    if(a === 'fold')  return { recommendation:'Fold (פולד) ✓', isCorrect:true, reasonText:`עם יד חלשה כזו (${handName}) — פולד הוא חבר. חיסכון = רווח. אין סיבה לסכן כסף עם פוטנציאל נמוך.` };
    if(a === 'call')  return { recommendation:'Fold (פולד)', isCorrect:false, reasonText:`קול ביד חלשה (${handName}) מזמין סיר ארוך עם יד שולית. גם אם תפגעי בזוג, הוא לרוב יהיה מתחת ליד היריב.` };
    return { recommendation:'Fold (פולד)', isCorrect:false, reasonText:`רייז ביד חלשה זה בלוף יקר ללא בק-אפ. מסתיים לרוב בהפסד.` };
  }

  // Post-flop — generic: strength-based
  if(s >= 65) {
    if(a === 'raise') return { recommendation:'Raise (רייז) ✓', isCorrect:true, reasonText:`עם ${handName} (יד חזקה) — רייז מקבל ערך מיריבים חלשים יותר.` };
    if(a === 'call')  return { recommendation:'Raise (רייז)', isCorrect:false, reasonText:`עם ${handName}, רייז היה מקבל יותר ערך. קול פסיבי בעיקר עם יד חזקה כל-כך.` };
    return { recommendation:'Raise (רייז)', isCorrect:false, reasonText:`פולד עם ${handName} זה לוותר על יד מנצחת. כמעט תמיד יש כאן ערך.` };
  }
  if(s >= 40) {
    if(a === 'call')  return { recommendation:'Call (קול) ✓', isCorrect:true, reasonText:`עם ${handName} (יד סבירה) — קול מאפשר לראות את הקלף הבא בלי להתחייב יותר מדי.` };
    if(a === 'check') return { recommendation:'Check (צ׳ק) ✓', isCorrect:true, reasonText:`צ׳ק עם ${handName} זה תמרון נכון — שולטת בגודל הסיר ומגלה מידע על היריב.` };
    if(a === 'raise') return { recommendation:'Call (קול)', isCorrect:false, reasonText:`רייז עם ${handName} (יד בינונית) — נועז. שווה לראות עוד קלף לפני שמסלימה את הסיר.` };
    return { recommendation:'Call (קול)', isCorrect:false, reasonText:`פולד עם ${handName} ופוטנציאל לשיפור — מוקדם מדי. שווה עוד קלף.` };
  }
  // Weak post-flop
  if(a === 'fold')  return { recommendation:'Fold (פולד) ✓', isCorrect:true, reasonText:`עם ${handName} (יד חלשה) — פולד נכון. אין סיבה להמשיך להשקיע.` };
  if(a === 'check') return { recommendation:'Check (צ׳ק) ✓', isCorrect:true, reasonText:`צ׳ק עם ${handName} — חוסך כסף, מאפשר לראות עוד קלף בחינם.` };
  if(a === 'call')  return { recommendation:'Fold (פולד)', isCorrect:false, reasonText:`עם ${handName} בלי דרא — קול הוא לרוב הפסד. שווה לפולד.` };
  return { recommendation:'Fold (פולד)', isCorrect:false, reasonText:`רייז עם ${handName} זה בלוף יקר — אם היריב לא יפולד, את בצרות.` };
}

// ----------------------------------------------------------------------------
function computeEV({ ctx, action, stage, equityPct }) {
  // Heuristic EV (לא חישוב אמיתי) — אבל נותן סימן ועוצמה הגיוניים
  const a = action?.action;
  const equity = equityPct / 100;

  if(a === 'fold')  return { label: '$0.00', formula:'EV(Fold) = 0', detail:'פולד = ויתור על הסיר. אין השקעה נוספת ואין סיכוי לזכייה.' };
  if(a === 'check') {
    const v = (equity * 0.5).toFixed(2);
    return { label: `+$${v}`, formula:'EV(Check) = 0 ישיר\n+ ערך מידע (Information Value)', detail:'צ׳ק לא עולה כסף ומאפשר לראות עוד קלף. ערך תלוי בכמה אקוויטי יש.' };
  }
  // call / raise
  const cost = a === 'raise' ? 60 : 20;
  const win = a === 'raise' ? 100 : 60;
  const ev = (equity * win - (1-equity) * cost).toFixed(2);
  const label = parseFloat(ev) >= 0 ? `+$${ev}` : `-$${Math.abs(ev).toFixed(2)}`;
  const sign = parseFloat(ev) >= 0 ? 'רווחי' : 'מפסיד';
  return {
    label,
    formula: `EV = (${equityPct}% × $${win}) − (${100-equityPct}% × $${cost})\n   = $${(equity*win).toFixed(2)} − $${((1-equity)*cost).toFixed(2)}\n   = $${ev}`,
    detail: `${a==='raise'?'רייז':'קול'} עולה $${cost}. עם ${equityPct}% אקוויטי — ${sign} בטווח הארוך.`,
  };
}

// ----------------------------------------------------------------------------
// buildBreakdown — generate "what beats your hand" list per stage based on ctx
// ----------------------------------------------------------------------------
function buildBreakdown({ stage, ctx, playerHand, visibleBoard }) {
  const items = [];
  const s = ctx.strength;
  const handName = ctx.current.name;

  // Pre-flop — uses ranks of hole cards
  if(stage === 'preflop') {
    if(s < 35) {
      // Weak hand
      items.push({ title:'זוג כיס גבוה', pct:'~5% מהידיים', detail:'88, 99, TT, JJ, QQ, KK, AA — יד בעלת זוג מובנה גוברת על קלפים גבוהים. underdog של ~80%.' });
      items.push({ title:'שני קלפים גבוהים', pct:'~6% מהידיים', detail:'AK, AQ, AJ, KQ, KJ, QJ — שני קלפים שיכולים להפוך לזוג גבוה. underdog של 60-65%.' });
      items.push({ title:'דומיננטיות (kicker חזק יותר)', pct:'~7% מהידיים', detail:'אם ליריב יש קלף שלך אבל kicker יותר טוב — גם אם תזכי בזוג, הוא ינצח.' });
      items.push({ title:'קלף גבוה אחד', pct:'~30% מהידיים', detail:'כל יד עם A, K, Q או J. underdog של 52-58%.' });
      items.push({ positive:true, title:'ידיים שאת favorite מולן', pct:'~52% מהידיים', detail:'קלפים נמוכים יותר משלך — שם את לרוב מובילה. אבל הסך מטה את האקוויטי.' });
    } else if(s < 60) {
      items.push({ title:'זוג כיס גבוה משלך', pct:'~3% מהידיים', detail:'זוגות גבוהים יותר מהקלף הגבוה ביד שלך — overpair.' });
      items.push({ title:'AK, AQ, AJ', pct:'~4% מהידיים', detail:'broadway hands עם פוטנציאל גבוה לזוג.' });
      items.push({ positive:true, title:'רוב הידיים האפשריות', pct:'~70% מהידיים', detail:'עם יד בינונית את עדיין לפני רוב הידיים האקראיות.' });
    } else {
      items.push({ title:'זוג כיס גבוה משלך', pct:'~1% מהידיים', detail:'רק זוגות גבוהים מאוד יכולים לעקוף יד פרימיום.' });
      items.push({ positive:true, title:'כמעט כל יד אחרת', pct:'~85% מהידיים', detail:'את עם יד פרימיום — favorite מול הרוב המכריע.' });
    }
    return items;
  }

  // Post-flop — based on what completed hand is
  const drawText = ctx.drawFlush ? 'דרא לפלאש' : ctx.drawStraight ? 'דרא לסטרייט' : null;

  if(s < 35) {
    items.push({ title:'כל זוג ביד היריב', pct:'מאוד שכיח', detail:`עם ${handName} כל זוג של היריב גובר עלייך. רק שיפור בקלף הבא יציל אותך.` });
    if(drawText) items.push({ positive:true, title:'יש לך ' + drawText, pct:'~30-35% להשלים', detail:'עוד יש פוטנציאל אם תפגעי בקלף הנכון.' });
    items.push({ title:'כל יד עם זוג מהלוח + kicker גבוה', pct:'שכיח', detail:'גם בלי יד "אמיתית", היריב יכול לקבל זוג מהקלפים הקהילתיים.' });
  } else if(s < 60) {
    items.push({ title:'זוג עליון יותר', pct:'~20% מהידיים', detail:`עם ${handName}, זוג גבוה יותר על הלוח גובר.` });
    items.push({ title:'שני זוגות', pct:'~6% מהידיים', detail:'אם ליריב 2 קלפים שמתחברים ללוח — שני זוגות מנצחים.' });
    items.push({ title:'שלישייה / set', pct:'~3% מהידיים', detail:'יריב עם זוג כיס שמתחבר לקלף בלוח — אסון.' });
    if(drawText) items.push({ title:`יריב עם ${drawText}`, pct:'~10-15%', detail:'גם אם הוא מאחורייך עכשיו, סיכוי לסגור.' });
    items.push({ positive:true, title:'ידיים שאת מובילה', pct:`~${100 - Math.round(s/2)}% מהידיים`, detail:'הרוב — יד שלך מספיק חזקה.' });
  } else {
    items.push({ title:'יד גבוהה יותר באותה קטגוריה', pct:'~10% מהידיים', detail:`למרות ${handName} יד חזקה, יריב עם kicker יותר טוב או עם אותו צירוף בערכים גבוהים יותר עדיין מנצח.` });
    items.push({ title:'צירוף יותר חזק (full house, flush)', pct:'~5% מהידיים', detail:'נדיר אבל אפשרי — שווה לוודא שהלוח לא מאיים.' });
    items.push({ positive:true, title:'ידיים שאת מובילה', pct:`~${Math.round(s)}% מהידיים`, detail:'יד חזקה — favorite ברורה מול רוב הידיים.' });
  }

  return items;
}

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

// ===== Streets data — מבוטל. כעת מגיע מ-props. =====

// ===== Main Component =====
export default function AnalystReport({ onExit, hand=DEMO_HAND, streets: streetsProp=null }) {
  // אם לא נשלחו streets מבחוץ — fallback לדמו הסטטי (היד T♦7♠ מההסקרינים)
  const streets = streetsProp || DEMO_STREETS_FALLBACK;

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
          const data = streets[streetKey];
          const isActive = activeStreet === streetKey;
          const visibleBoard = hand.boardCards.slice(0, STREET_BOARD_COUNT[streetKey]);
          const currentMetric = activeMetric[streetKey] || null;

          // אקורדיון לא לחיץ אם אין נתונים (השלב לא הגיע)
          const hasData = !!data;

          return (
            <div key={streetKey} className={`ar-acc ${isActive?'active':''} ${!hasData?'ar-acc-disabled':''}`}>
              <button className="ar-acc-head" onClick={()=>hasData && toggleStreet(streetKey)} disabled={!hasData}>
                <div className="ar-acc-head-label">
                  <span className="ar-chevron">›</span>
                  <span className="ar-street-name">{STREET_LABELS[streetKey]}</span>
                  {!hasData && <span className="ar-stage-not-reached">לא הגעת לשלב הזה</span>}
                </div>
                <div className="ar-thumbs">
                  {[0,1,2,3,4].map(i => (
                    i < STREET_BOARD_COUNT[streetKey]
                      ? <MiniCard key={i} card={visibleBoard[i]}/>
                      : <div key={i} className="ar-thumb-empty"/>
                  ))}
                </div>
              </button>

              {isActive && hasData && (
                <div className="ar-acc-body">
                  <DecisionRow data={data}/>
                  <div className="ar-reason">
                    <span className="ar-reason-label">הסיבה: </span>
                    {/* Render reasonText with auto-detected terms (from existing TERM_DEFS_AR keys) */}
                    <ReasonText text={data.reasonText}/>
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

                  {currentMetric==='equity' && <EquityPanel street={streetKey} data={data.metrics.equity} breakdown={data.breakdown} handStr={data.handStr}/>}
                  {currentMetric==='ev'     && <EVPanel data={data.metrics.ev}/>}
                  {currentMetric==='rank'   && <RankPanel data={data.metrics.rank}/>}
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

// Auto-highlight known terms in reason text (heuristic — Hebrew + English keys map to terms)
const TERM_INLINE_MAP = {
  'offsuit':'offsuit', 'kicker':'kicker', 'suit':'suit',
  'fold':'fold', 'call':'call', 'raise':'raise', 'check':'check',
  'underdog':'underdog', 'favorite':'favorite', 'dominated':'dominated',
  'flush':'flush', 'overpair':'overpair', 'set':'set', 'trips':'trips',
  'two pair':'two-pair', 'value bet':'value-bet', 'showdown':'showdown',
  'pot odds':'pot-odds', 'implied odds':'implied-odds', 'variance':'variance',
  'יד שולית':'marginal-hand', 'סיר ארוך':'long-pot', 'סיר':'pot',
  'פולד':'fold', 'קול':'call', 'רייז':'raise', 'צ׳ק':'check',
  'זוג כיס':'pocket-pair', 'זוג עליון':'top-pair', 'שני זוגות':'two-pair',
  'דרא לפלאש':'flush-draw', 'דרא':'draw', 'אאוטס':'outs',
  'פוט אודס':'pot-odds', 'פלאש':'flush', 'אקוויטי':'equity',
  'בלוף':'value-bet', 'בק-אפ':'draw',
};
function ReasonText({ text }) {
  if(!text) return null;
  // Build sorted list of phrases (longest first to avoid sub-matches)
  const phrases = Object.keys(TERM_INLINE_MAP).sort((a,b)=>b.length-a.length);
  const parts = [];
  let remaining = text;
  let safety = 0;
  while(remaining.length > 0 && safety++ < 200) {
    let foundIdx = -1, foundPhrase = null;
    for(const p of phrases) {
      const i = remaining.toLowerCase().indexOf(p.toLowerCase());
      if(i !== -1 && (foundIdx === -1 || i < foundIdx)) {
        foundIdx = i;
        foundPhrase = p;
      }
    }
    if(foundIdx === -1) { parts.push(remaining); break; }
    if(foundIdx > 0) parts.push(remaining.slice(0, foundIdx));
    const original = remaining.slice(foundIdx, foundIdx + foundPhrase.length);
    parts.push(<Term key={parts.length} k={TERM_INLINE_MAP[foundPhrase]}>{original}</Term>);
    remaining = remaining.slice(foundIdx + foundPhrase.length);
  }
  return <>{parts.map((p,i) => typeof p === 'string' ? <span key={i}>{p}</span> : p)}</>;
}

// ===== Fallback demo data (used only when no streets prop passed) =====
const DEMO_STREETS_FALLBACK = {
  preflop: {
    playerDecision:'Call (קול)', analystDecision:'Fold (פולד) ✓', isCorrect:false,
    reasonText: 'T♦7♠ offsuit היא יד חלשה — שני קלפים שלא מתחברים, ללא צמד וללא suit משותף. ה-kicker נמוך מדי כדי לתת לקלף הגבוה ערך, וה-call כאן מזמין אותך לסיר ארוך עם יד שולית.',
    handStr: 'T♦ 7♠',
    metrics: {
      equity:{ result:'38%', winPct:'38%', losePct:'62%', warn:true },
      ev:{ result:'-1.20$', formula:'EV = (38% × $20) − (62% × $20)\n   = $7.60 − $12.40\n   = -$4.80', detail:'pot odds מצדיקים בקושי, reverse implied odds משלימים.' },
      rank:{ result:'High Card', detail:'אין צירוף — הקלף הגבוה (10) בלבד.' },
    },
    breakdown: [
      { title:'זוג כיס גבוה', pct:'~5% מהידיים', detail:'88, 99, TT, JJ, QQ, KK, AA — underdog של ~80%.' },
      { title:'שני קלפים גבוהים מ-10', pct:'~6% מהידיים', detail:'AK, AQ, AJ, KQ, KJ, QJ — underdog של 60-65%.' },
      { title:'דומיננטיות (kicker חזק יותר)', pct:'~7% מהידיים', detail:'AT, KT, QT, JT, A7, K7, Q7, J7 — את dominated.' },
      { title:'קלף גבוה אחד', pct:'~30% מהידיים', detail:'A, K, Q או J עם kicker סביר. underdog של 52-58%.' },
      { positive:true, title:'ידיים שאת favorite מולן', pct:'~52% מהידיים', detail:'קלפים נמוכים שלא חופפים אליך.' },
    ],
  },
  // (השלבים האחרים יתגלגלו מ-buildStreetsFromHand — fallback לא חובה)
};

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

// ===== Equity panel — דינמי על בסיס breakdown מהשלב =====
function EquityPanel({ street, data, breakdown=[], handStr }) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  return (
    <div className="ar-panel">
      <div className="ar-stats-row">
        <div className="ar-stat win">
          <div className="ar-stat-label">{data.isShowdown ? 'תוצאת showdown' : 'סיכוי ניצחון 🏆'}</div>
          <div className="ar-stat-value">{data.winPct}</div>
        </div>
        <div className={`ar-stat ${data.warn ? 'warn' : 'lose'}`}>
          <div className="ar-stat-label">{data.warn ? 'סיכוי הפסד ⚠️' : 'סיכוי הפסד'}</div>
          <div className="ar-stat-value">{data.losePct}</div>
        </div>
      </div>

      {data.warn && (
        <div className="ar-warning-banner">
          ⚠️ את <Term k="underdog">underdog</Term> ברוב המקרים — שקלי <Term k="fold">fold</Term>!
        </div>
      )}

      {breakdown.length > 0 && (
        <div className={`ar-breakdown-toggle-wrap ${breakdownOpen?'open':''}`}>
          <button
            className="ar-breakdown-toggle"
            onClick={(e)=>{e.stopPropagation(); setBreakdownOpen(o=>!o);}}
            aria-expanded={breakdownOpen}
          >
            <span className="ar-breakdown-toggle-chevron">›</span>
            <span className="ar-breakdown-toggle-label">
              מה גובר על <RenderHandCards handStr={handStr}/>
            </span>
          </button>
          {breakdownOpen && (
            <ul className="ar-breakdown">
              {breakdown.map((item, i) => (
                <BreakdownItem key={i} {...item}/>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="ar-formula-block">
        <div className="ar-formula-label">נוסחה</div>
        <div className="ar-formula-code">Equity = Wins / Total Simulations × 100</div>
      </div>
    </div>
  );
}

// Render "9♦ 8♠" as actual visual cards inside the button label
function RenderHandCards({ handStr }) {
  if(!handStr) return <>היד</>;
  const cards = handStr.split(' ').filter(Boolean);
  if(cards.length === 0) return <>היד</>;
  return (
    <span className="ar-handstr-cards">
      {cards.map((c, i) => <InlineCard key={i} card={c}/>)}
    </span>
  );
}

function BreakdownItem({ title, pct, detail, positive=false }) {
  return (
    <li className="ar-breakdown-item">
      <div className="ar-breakdown-header">
        <div className="ar-breakdown-title-row">
          <span className={`ar-breakdown-marker ${positive?'positive':''}`}>{positive?'⊳':'▸'}</span>
          <ReasonText text={title}/>
        </div>
        <span className={`ar-breakdown-pct ${positive?'positive':''}`}>{pct}</span>
      </div>
      <div className="ar-breakdown-detail">
        <ReasonText text={detail}/>
      </div>
    </li>
  );
}

function EVPanel({ data }) {
  return (
    <div className="ar-panel">
      <div className="ar-formula-label">חישוב $<Term k="ev">EV</Term></div>
      <div className="ar-formula-code">{data.formula}</div>
      <div className="ar-simple-result">
        <div className="ar-simple-detail"><ReasonText text={data.detail}/></div>
        <div className="ar-simple-value">{data.value || data.result}</div>
      </div>
    </div>
  );
}

function RankPanel({ data }) {
  return (
    <div className="ar-panel">
      <div className="ar-formula-label">דירוג</div>
      <div className="ar-simple-result">
        <div className="ar-simple-detail"><ReasonText text={data.detail || ''}/></div>
        <div className="ar-simple-value">{data.result}</div>
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
.ar-acc-disabled { opacity: 0.5; }
.ar-acc-disabled .ar-acc-head { cursor: not-allowed; }
.ar-stage-not-reached {
  font-size: 11px; color: ${C.creamMute};
  margin-right: 6px; font-style: italic;
}
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

/* Collapsible breakdown button */
.ar-breakdown-toggle-wrap {
  margin-bottom: 11px;
  border: 1px solid ${C.goldSoft};
  border-radius: 6px;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s;
}
.ar-breakdown-toggle-wrap.open {
  border-color: ${C.gold};
  background: rgba(201,168,76,0.05);
}
.ar-breakdown-toggle {
  width: 100%;
  background: transparent;
  border: none;
  padding: 11px 13px;
  display: flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  font-family: ${FONT};
  color: ${C.gold};
  font-size: 14px;
  font-weight: bold;
  text-align: right;
  direction: rtl;
  transition: background 0.15s;
}
.ar-breakdown-toggle:active { background: rgba(201,168,76,0.08); }
.ar-breakdown-toggle-chevron {
  display: inline-block;
  font-size: 18px;
  color: ${C.gold};
  transition: transform 0.25s;
  flex-shrink: 0;
  width: 14px;
  text-align: center;
}
.ar-breakdown-toggle-wrap.open .ar-breakdown-toggle-chevron {
  transform: rotate(90deg);
}
.ar-breakdown-toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}
.ar-handstr-cards {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  direction: ltr;
}
.ar-breakdown-toggle-wrap .ar-breakdown {
  margin: 0;
  padding: 0 13px 11px 13px;
  border-top: 1px solid ${C.divider};
  padding-top: 10px;
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
