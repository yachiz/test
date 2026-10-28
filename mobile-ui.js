/* Mobile reading layout; original desktop content is rebuilt when crossing 720px. */
(() => {
  'use strict';
  const mq=window.matchMedia('(max-width:720px)');
  let state=null,opener=null;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const header=document.createElement('header');header.className='mobile-app-header';header.hidden=true;
  const nav=document.createElement('nav');nav.className='mobile-bottom-nav';nav.setAttribute('aria-label','主要功能');nav.hidden=true;
  const dialog=document.createElement('dialog');dialog.className='mobile-info-sheet';dialog.setAttribute('aria-labelledby','mobile-sheet-title');
  dialog.innerHTML='<div class="mobile-sheet-top"><h2 id="mobile-sheet-title"></h2><button type="button" data-mobile-close aria-label="關閉資訊面板">關閉 ✕</button></div><div class="mobile-sheet-body"></div>';
  const sheetBody=dialog.querySelector('.mobile-sheet-body');
  document.querySelector('.shell').prepend(header);document.body.append(nav,dialog);
  const bins=document.createElement('div');bins.hidden=true;bins.className='mobile-content-store';document.body.append(bins);
  function close(){if(dialog.open)dialog.close();document.body.classList.remove('mobile-sheet-open');}
  dialog.addEventListener('close',()=>{document.body.classList.remove('mobile-sheet-open');if(opener?.isConnected)opener.focus({preventScroll:true});});
  dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('[data-mobile-close]'))close();});
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-photo]')&&dialog.contains(e.target))close();
  },true);
  function clear(){close();sheetBody.replaceChildren();bins.replaceChildren();document.body.removeAttribute('data-mobile-screen');header.hidden=true;nav.hidden=true;}
  function store(name,title,nodes){const panel=document.createElement('div');panel.dataset.mobilePanel=name;panel.dataset.title=title;nodes.filter(Boolean).forEach(n=>panel.append(n));bins.append(panel);return panel;}
  function open(name,button){
    const panel=document.querySelector(`[data-mobile-panel="${name}"]`);if(!panel)return;
    const previous=sheetBody.firstElementChild;if(previous)bins.append(previous);
    opener=button;dialog.querySelector('h2').textContent=panel.dataset.title;sheetBody.append(panel);dialog.showModal();document.body.classList.add('mobile-sheet-open');
  }
  function btn(name,label,sub){return `<button type="button" data-mobile-open="${name}"><strong>${label}</strong><small>${esc(sub)} ›</small></button>`;}
  function afterRender(next){
    state=next;if(!mq.matches)return;
    document.body.dataset.mobileScreen=state.view;header.hidden=false;nav.hidden=false;
    const day=state.group.days[0];
    header.innerHTML='<div class="mobile-brand">✦ AURORA ATLAS <span>北歐旅行手帳</span></div>'+(state.view==='day'?`<div class="mobile-date-control"><button type="button" data-mobile-day="${day-1}" ${day===1?'disabled':''} aria-label="前一天">‹</button><button type="button" data-mobile-open="days" aria-label="選擇行程日期"><strong>Day ${day} · ${esc(state.dayDate(day))}</strong><small>${esc(state.group.country)} ▾</small></button><button type="button" data-mobile-day="${day+1}" ${day===12?'disabled':''} aria-label="下一天">›</button></div>`:'');
    nav.innerHTML=[['overview','◫','總覽'],['day','◷','行程'],['photos','▧','相簿'],['more','☰','更多']].map(([id,icon,label])=>`<button type="button" ${id==='more'?'data-mobile-open="more"':`data-mobile-view="${id}"`} ${state.view===id||(id==='more'&&!['overview','day','photos'].includes(state.view))?'aria-current="page"':''}><span aria-hidden="true">${icon}</span>${label}</button>`).join('');
    const more=store('more','更多旅行工具',[]);more.className='mobile-menu-grid';more.innerHTML=[['food','♧ 美食與伴手禮'],['flights','✈ 航班資訊'],['aurora','✦ 極光實驗室'],['checklist','✓ 旅行清單']].map(([id,label])=>`<button type="button" data-mobile-view="${id}">${label}<span>›</span></button>`).join('');
    const days=store('days','選擇日期',[]);days.className='mobile-days-grid';days.innerHTML=state.groups.map(g=>`<button type="button" data-mobile-day="${g.days[0]}" ${g.id===state.current?'aria-current="date"':''}><strong>Day ${g.days[0]} · ${esc(state.dayDate(g.days[0]))}</strong><span>${esc(g.short)}</span></button>`).join('');
    const content=document.getElementById('content');
    if(state.view==='overview'){
      const map=content.querySelector('.journey-map');store('route','整趟旅程路線',[map]);
      const summary=document.createElement('div');summary.className='mobile-overview-tools';summary.innerHTML='<button type="button" data-mobile-open="route">⌖ 查看整趟路線 <span>三國城市與住宿位置 ›</span></button>';
      content.querySelector('.chapter-head').after(summary);
      return;
    }
    if(state.view!=='day')return;
    const weather=content.querySelector('.travel-weather'),map=content.querySelector('.journey-map'),flight=content.querySelector('.flight-section'),hint=content.querySelector('.oslo-route-hint'),hotel=content.querySelector('.hotel-card');
    store('weather','沿途天氣',[weather]);store('transport','今日交通與路線',[flight,hint,map]);if(hotel)store('hotel','今晚住宿',[hotel]);
    const tools=document.createElement('div');tools.className='mobile-day-tools';
    const count=weather?.querySelectorAll('.weather-card').length||0;
    tools.innerHTML=btn('weather','☁ 天氣',count+' 個城市')+btn('transport','⌖ 交通／地圖',flight?'含航班資訊':'今日移動路線')+(hotel?btn('hotel','⌂ 住宿',state.group.hotel):'');
    content.querySelector('.chapter-head').after(tools);
    content.querySelectorAll('.spot').forEach((spot,i)=>{
      const details=document.createElement('details');details.className='mobile-story';details.open=i===0;
      const summary=document.createElement('summary');summary.innerHTML=`<span class="mobile-story-number">${String(i+1).padStart(2,'0')}</span><span>${esc(state.group.spots[i].name.replace(/^[①②③④⑤⑥]\s*/,''))}</span><span class="mobile-story-toggle" aria-hidden="true"></span>`;
      spot.before(details);details.append(summary,spot);
      details.addEventListener('toggle',()=>{if(details.open)content.querySelectorAll('.mobile-story').forEach(other=>{if(other!==details)other.open=false;});});
    });
  }
  function goDay(day){if(day<1||day>12)return;const group=state.groups.find(g=>g.days.includes(day));if(group){close();window.navigate('day',group.id);}}
  document.addEventListener('click',e=>{
    const show=e.target.closest('[data-mobile-open]');if(show){open(show.dataset.mobileOpen,show);return;}
    const day=e.target.closest('[data-mobile-day]');if(day){goDay(Number(day.dataset.mobileDay));return;}
    const view=e.target.closest('[data-mobile-view]');if(view){close();window.navigate(view.dataset.mobileView);}
  });
  document.addEventListener('aurora-weather-updated',()=>{
    if(!mq.matches)return;
    const cards=document.querySelectorAll('[data-mobile-panel="weather"] .weather-card');const last=cards[cards.length-1];
    const temp=last?.querySelector('.weather-temperature')?.textContent?.trim(),city=last?.querySelector('.weather-city strong')?.textContent;
    const sub=document.querySelector('.mobile-day-tools [data-mobile-open="weather"] small');if(sub&&temp)sub.textContent=city+' '+temp+' ›';
  });
  mq.addEventListener('change',()=>{if(typeof window.render==='function')window.render();});
  window.AuroraMobile={beforeRender:clear,afterRender};
})();
