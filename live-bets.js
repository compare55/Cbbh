(function(){
'use strict';
const path=(location.pathname.split('/').pop()||'').toLowerCase();
const gameMap={'slot.html':'Slot','aviator.html':'Aviator','color.html':'Color','dragon-tiger.html':'Dragon Tiger','seven-up-down.html':'7 Up Down','pappu.html':'Pappu','e-sabong.html':'E-Sabong'};
const game=gameMap[path]; if(!game)return;
let clientId=localStorage.getItem('jiowinAnonBetId');
if(!clientId){const bytes=new Uint8Array(12);if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);clientId='anon-'+Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('jiowinAnonBetId',clientId);}
const style=document.createElement('style');
style.textContent=`
#liveBetBoard{position:fixed;z-index:9998;right:10px;bottom:12px;width:min(310px,calc(100vw - 20px));max-height:48vh;overflow:hidden;background:rgba(14,19,31,.98);color:#f7f8fc;border:1px solid #39445a;border-radius:13px;box-shadow:0 8px 28px #0007;font:12px/1.35 Arial,sans-serif;backdrop-filter:blur(8px)}
#liveBetBoard .lb-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px;background:linear-gradient(110deg,#202a3d,#172033);font-weight:800;letter-spacing:.35px}
#liveBetBoard .lb-live{color:#69e3a3;white-space:nowrap}#liveBetBoard .lb-total{padding:7px 10px;color:#e8c879;border-bottom:1px solid #303a4e;font-weight:700}
#liveBetBoard .lb-section{padding:7px 10px;background:#182235;color:#d8e3f7;font-weight:800;font-size:10px;letter-spacing:.35px;display:flex;justify-content:space-between;gap:8px}
#liveBetBoard .lb-tag{padding:2px 5px;border-radius:5px;background:#39445a;color:#dce7fa;font-size:9px;white-space:nowrap}
#liveBetBoard .lb-demo-tag{background:#59451c;color:#ffe4a1}#liveBetBoard .lb-list{overflow:auto;max-height:calc(48vh - 128px)}
#liveBetBoard .lb-row{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:7px 10px;border-bottom:1px solid #263044;min-height:28px;box-sizing:border-box}
#liveBetBoard .lb-row.lb-new{animation:lbPulse 850ms ease-out}#liveBetBoard .lb-row span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
#liveBetBoard .lb-row b{white-space:nowrap;color:#8ff0b8}#liveBetBoard .lb-empty{padding:10px;color:#b8c1d1}
#liveBetBoard .lb-note{font-size:10px;line-height:1.4;color:#aab6ca;padding:7px 10px;border-top:1px solid #303a4e}
@keyframes lbPulse{0%{background:#3a4c3f}100%{background:transparent}}
@media(max-width:600px){#liveBetBoard{right:7px;bottom:7px;width:min(285px,calc(100vw - 14px));max-height:42vh}#liveBetBoard .lb-list{max-height:calc(42vh - 128px)}}
@media(prefers-reduced-motion:reduce){#liveBetBoard .lb-row.lb-new{animation:none}}
`;
document.head.appendChild(style);
const board=document.createElement('section');board.id='liveBetBoard';
board.innerHTML='<div class="lb-head"><span>BET ACTIVITY</span><span class="lb-live">● UPDATING</span></div><div class="lb-total">Real submitted bets: ₹0</div><div class="lb-section"><span>DEMO ACTIVITY</span><span class="lb-tag lb-demo-tag">SIMULATED · 50 ENTRIES</span></div><div class="lb-list lb-demo-list"></div><div class="lb-section"><span>REAL USER SUBMISSIONS</span><span class="lb-tag">SERVER FEED</span></div><div class="lb-list lb-real-list"><div class="lb-empty">No real user bet submissions yet.</div></div><div class="lb-note">Demo activity is simulated for preview only. Real user submissions are listed separately and are not independently verified as paid wagers.</div>';
document.body.appendChild(board);
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const names=Array.from({length:50},(_,i)=>'DemoUser'+String(i+1).padStart(2,'0'));
const selections={'Slot':['Spin'],'Aviator':['Cash Out','Aviator'],'Color':['Red','Green','Violet'],'Dragon Tiger':['Dragon','Tiger','Tie'],'7 Up Down':['7 Up','7 Down','7'],'Pappu':['Pappu'],'E-Sabong':['Meron','Wala','Draw']};
const amounts=[10,20,30,50,100,200,25,75,150,40];
const demoBets=names.map((name,i)=>({name,amount:amounts[i%amounts.length],selection:selections[game][i%selections[game].length],stamp:0}));
function renderDemo(newIndex=-1){const list=board.querySelector('.lb-demo-list');list.innerHTML=demoBets.map((b,i)=>'<div class="lb-row'+(i===newIndex?' lb-new':'')+'"><span>'+esc(b.name)+' · '+esc(b.selection)+'</span><b>₹'+Number(b.amount).toLocaleString('en-IN')+'</b></div>').join('');}
async function refresh(){try{const r=await fetch('/api/live-bets?game='+encodeURIComponent(game),{cache:'no-store'});if(!r.ok)return;const d=await r.json();const bets=Array.isArray(d.bets)?d.bets:[];const total=bets.reduce((sum,b)=>sum+Math.max(0,Number(b.amount)||0),0);board.querySelector('.lb-total').textContent='Real submitted bets: ₹'+total.toLocaleString('en-IN');board.querySelector('.lb-real-list').innerHTML=bets.length?bets.slice(0,50).map(b=>'<div class="lb-row"><span>'+esc(b.player||'Guest')+' · '+esc(b.selection||'Bet')+'</span><b>₹'+Math.max(0,Number(b.amount)||0).toLocaleString('en-IN')+'</b></div>').join(''):'<div class="lb-empty">No real user bet submissions yet.</div>';}catch(e){}}
window.reportLiveBet=function(selection,amount){amount=Number(amount);if(!Number.isInteger(amount)||amount<1)return;fetch('/api/live-bets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({game,selection:String(selection).slice(0,80),amount,clientId})}).then(()=>refresh()).catch(()=>{});};
renderDemo();refresh();setInterval(refresh,3000);
// Simulated activity rotates to keep the preview lively; the section remains clearly marked as demo.
setInterval(()=>{const i=Math.floor(Math.random()*demoBets.length);const item=demoBets[i];item.amount=amounts[Math.floor(Math.random()*amounts.length)];item.selection=selections[game][Math.floor(Math.random()*selections[game].length)];demoBets.splice(i,1);demoBets.unshift(item);renderDemo(0);},4500);
})();
