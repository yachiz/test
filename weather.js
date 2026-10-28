/* Open-Meteo weather. Dates and day boundaries always use the destination timezone. */
(() => {
  'use strict';
  const CITIES = {
    taipei:['桃園・台北',25.0797,121.2342,'Asia/Taipei'],
    bangkok:['曼谷',13.69,100.7501,'Asia/Bangkok'],
    stockholm:['斯德哥爾摩',59.3293,18.0693,'Europe/Stockholm'],
    lulea:['露利亞',65.5848,22.1567,'Europe/Stockholm'],
    kemi:['凱米',65.7364,24.5637,'Europe/Helsinki'],
    rovaniemi:['羅瓦涅米',66.5039,25.7294,'Europe/Helsinki'],
    saariselka:['薩利色爾卡',68.4167,27.4167,'Europe/Helsinki'],
    kirkenes:['基爾克內斯',69.7271,30.0452,'Europe/Oslo'],
    karasjok:['卡拉紹克',69.4719,25.5112,'Europe/Oslo'],
    alta:['阿爾塔',69.9689,23.2717,'Europe/Oslo'],
    tromso:['特羅姆瑟',69.6492,18.9553,'Europe/Oslo'],
    oslo:['奧斯陸',59.9139,10.7522,'Europe/Oslo']
  };
  const DAYS = {1:['taipei','bangkok'],2:['bangkok','stockholm'],3:['stockholm','lulea','kemi'],4:['kemi','rovaniemi'],5:['rovaniemi','saariselka'],6:['saariselka','kirkenes'],7:['kirkenes','karasjok','alta'],8:['alta','tromso'],9:['tromso'],10:['tromso','oslo'],11:['oslo'],12:['bangkok','taipei']};
  const PREFIX = 'auroraWeather-v1:';
  const memory = new Map(), inFlight = new Map(), transient = new Map();
  const DAY_MS = 86400000;
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const finite = x => typeof x === 'number' && Number.isFinite(x);
  const fmt = (x,unit='°') => finite(x)?`${Math.round(x)}${unit}`:'—';
  function dateAt(now,tz) {
    const parts = new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const p = Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return `${p.year}-${p.month}-${p.day}`;
  }
  function tripDate(day) {return new Date(Date.UTC(2026,10,2+day)).toISOString().slice(0,10);}
  function modeFor(date,tz,now=new Date()) {const today=dateAt(now,tz);return date<today?'history':date===today?'today':'forecast';}
  function weatherInfo(code,night=false) {
    if(code===0)return [night?'🌙':'☀️',night?'晴夜':'晴朗'];
    if(code===1||code===2)return ['🌤️','晴時多雲'];
    if(code===3)return ['☁️','陰天'];
    if(code===45||code===48)return ['🌫️','霧'];
    if([51,53,55].includes(code))return ['🌦️','毛毛雨'];
    if([56,57,66,67].includes(code))return ['🌨️','凍雨'];
    if([61,63,65,80,81,82].includes(code))return ['🌧️','下雨'];
    if([71,73,75,77,85,86].includes(code))return ['🌨️','降雪'];
    if([95,96,99].includes(code))return ['⛈️','雷雨'];
    return ['🌡️','天氣資料'];
  }
  function placeholder(day) {
    return `<section class="travel-weather" aria-label="各站天氣"><div class="weather-heading"><h3>沿途天氣</h3><span>${tripDate(day).slice(5).replace('-','/')} · 各地當地日期</span></div><div class="weather-grid">${DAYS[day].map(key=>`<article class="weather-card" data-weather-city="${key}" aria-label="${CITIES[key][0]}天氣"><div class="weather-city"><strong>${CITIES[key][0]}</strong><span class="weather-badge">載入中</span></div><p class="weather-message" role="status">正在取得天氣…</p></article>`).join('')}</div><div class="weather-source"><span>°C · <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · 開啟頁面時更新，每 15 分鐘檢查</span><details><summary>資料說明</summary><p>目前溫度與歷史天氣為模式估計，非現場氣象站實測。預報最遠約 16 天；降水機率包含雨與雪，非獨立降雪機率。日期過後改用歷史最高／最低溫及降水量，完整資料到齊後保留，不再自動更新。</p></details></div></section>`;
  }
  function readCache(key) {
    if(memory.has(key))return memory.get(key);
    try {const v=JSON.parse(localStorage.getItem(PREFIX+key));if(v&&finite(v.savedAt)&&v.data){memory.set(key,v);return v;}}catch(_){}
    return null;
  }
  function saveCache(key,data,final=false) {
    const v={data,savedAt:Date.now(),final};memory.set(key,v);
    try {localStorage.setItem(PREFIX+key,JSON.stringify(v));}catch(_){}
    return v;
  }
  async function fetchJson(url) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),14000);
    try {const r=await fetch(url,{signal:controller.signal,cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const json=await r.json();if(json.error)throw new Error(json.reason||'Weather unavailable');return json;}finally{clearTimeout(timer);}
  }
  function parseData(json,date,mode) {
    const d=json.daily,index=d?.time?.indexOf(date);
    if(index===undefined||index<0||!finite(d.temperature_2m_max?.[index])||!finite(d.temperature_2m_min?.[index]))return null;
    if(mode==='history') {
      const times=json.hourly?.time||[],temps=json.hourly?.temperature_2m||[];
      const indices=times.map((t,i)=>t.startsWith(date)?i:-1).filter(i=>i>=0);
      // Do not freeze a partial day while the archive is still being assembled.
      if(indices.length<23||!times[indices[indices.length-1]].endsWith('23:00')||indices.some(i=>!finite(temps[i])))return null;
    }
    const out={mode,date,high:d.temperature_2m_max[index],low:d.temperature_2m_min[index],feelsHigh:d.apparent_temperature_max?.[index]??null,feelsLow:d.apparent_temperature_min?.[index]??null,code:d.weather_code?.[index]??null,prob:d.precipitation_probability_max?.[index]??null,snow:d.snowfall_sum?.[index]??null,rain:d.precipitation_sum?.[index]??null};
    const cur=json.current;
    if(mode==='today'&&cur?.time?.startsWith(date)&&finite(cur.temperature_2m)){out.current=cur.temperature_2m;out.feels=cur.apparent_temperature;out.code=cur.weather_code;out.night=cur.is_day===0;out.validTime=cur.time;}
    return out;
  }
  async function getWeather(city,date,mode,now=new Date()) {
    const c=CITIES[city],key=`${city}:${date}:${mode}`,cached=readCache(key);
    const ttl=mode==='today'?15*60000:60*60000;
    if(cached&&(cached.final||Date.now()-cached.savedAt<ttl))return {...cached,stale:false};
    const prior=transient.get(key);
    if(prior&&Date.now()-prior.at<5*60000)return prior.result;
    if(inFlight.has(key))return inFlight.get(key);
    const work=(async()=>{
      const today=dateAt(now,c[3]);
      const ahead=Math.round((Date.parse(date)-Date.parse(today))/DAY_MS);
      if(mode==='forecast'&&ahead>15)return {state:'future'};
      const q=new URLSearchParams({latitude:c[1],longitude:c[2],timezone:c[3],start_date:date,end_date:date,daily:'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,snowfall_sum'});
      let host;
      if(mode==='history'){host='https://archive-api.open-meteo.com/v1/archive';q.set('models','ecmwf_ifs');q.set('hourly','temperature_2m');}
      else {host='https://api.open-meteo.com/v1/forecast';q.set('daily',q.get('daily')+',precipitation_probability_max');if(mode==='today')q.set('current','temperature_2m,apparent_temperature,weather_code,is_day');}
      try {
        const json=await fetchJson(host+'?'+q),data=parseData(json,date,mode);
        if(!data){const result={state:mode==='history'?'pending':'empty'};transient.set(key,{at:Date.now(),result});return result;}
        return {...saveCache(key,data,mode==='history'),stale:false};
      }catch(_) {
        const result=cached?{...cached,stale:true}:{state:navigator.onLine===false?'offline':mode==='history'?'pending':'error'};
        transient.set(key,{at:Date.now(),result});return result;
      }
    })();
    inFlight.set(key,work);
    try{return await work;}finally{inFlight.delete(key);}
  }
  function cardHTML(city,result) {
    const c=CITIES[city],d=result.data;
    if(!d){
      const messages={future:['尚未開放','尚未進入預報範圍，接近出發日後自動顯示。'],pending:['歷史整理中','完整歷史資料尚未取得，稍後開啟會再查詢。'],offline:['離線','連線後即可取得天氣資料。'],empty:['資料待更新','這一天的天氣資料尚未完整。'],error:['暫時無法取得','天氣服務暫時無法連線，稍後會重試。']};
      const [badge,msg]=messages[result.state]||messages.error;
      return `<div class="weather-city"><strong>${c[0]}</strong><span class="weather-badge">${badge}</span></div><p class="weather-message" role="status">${msg}</p>`;
    }
    const [icon,label]=weatherInfo(d.code,d.night),current=finite(d.current),history=d.mode==='history';
    const status=history?'歷史紀錄':d.mode==='today'?'今日天氣':'當日預報';
    const updated=new Intl.DateTimeFormat('zh-TW',{timeZone:c[3],month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(result.savedAt));
    return `<div class="weather-city"><strong>${c[0]}</strong><span class="weather-badge ${history?'is-history':''}">${status}</span></div><div class="weather-main"><span class="weather-icon" aria-hidden="true">${icon}</span><div><div class="weather-temperature">${current?fmt(d.current):fmt(d.low)+' <span>–</span> '+fmt(d.high)}</div><p>${label}${current?' · 目前溫度':history?' · 當日低／高溫':' · 預報低／高溫'}</p></div></div><div class="weather-metrics">${current?`<span>最低 ${fmt(d.low)} ／ 最高 ${fmt(d.high)}</span><span>體感 ${fmt(d.feels)}</span>`:`<span>體感 ${fmt(d.feelsLow)} ～ ${fmt(d.feelsHigh)}</span>`}${history?`<span>降水 ${finite(d.rain)?d.rain.toFixed(1)+' mm':'—'}</span>`:`<span>雨／雪降水機率 ${fmt(d.prob,'%')}</span>`}<span>${history?'降雪':'預估降雪'} ${finite(d.snow)?d.snow.toFixed(1)+' cm':'—'}</span></div><p class="weather-stamp">${result.stale?'離線或連線異常・上次資料 · ':''}${history?'模式估計・已保留':d.validTime?'資料時間 '+esc(d.validTime.slice(11)):'取得 '+updated}${history?'':' · 當地時間'}</p>`;
  }
  let generation=0;
  async function load() {
    const region=document.querySelector('.travel-weather');if(!region)return;
    const day=Number(region.dataset.weatherDay);if(!DAYS[day])return;
    const token=++generation,date=tripDate(day);
    await Promise.all(DAYS[day].map(async city=>{
      const mode=modeFor(date,CITIES[city][3]);
      const result=await getWeather(city,date,mode);
      if(token!==generation||!region.isConnected)return;
      const card=region.querySelector(`[data-weather-city="${city}"]`);
      if(card){card.innerHTML=cardHTML(city,result);document.dispatchEvent(new Event('aurora-weather-updated'));}
    }));
  }
  window.AuroraWeather={placeholder:day=>placeholder(day).replace('class="travel-weather"',`class="travel-weather" data-weather-day="${day}"`),load};
  setInterval(()=>{if(!document.hidden)load();},15*60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
  window.addEventListener('online',()=>{transient.clear();load();});
})();
