/* Day navigation: horizontal one-finger swipes, leaving scroll and photos alone. */
(() => {
  'use strict';
  const pane=document.getElementById('content');
  if(!pane)return;
  const blocked='button,a,input,select,textarea,summary,.journey-map,.hotel-photo,.spot-photo,.food-picture,[data-photo]';
  let gesture=null,ignoreClickUntil=0;
  function mobile(){return window.matchMedia('(max-width:720px)').matches;}
  function activeDay(){const selected=document.querySelector('.mobile-daynav button.active[data-day]');return selected?Number(selected.dataset.day):null;}
  function swipeDirection(start,end){
    const dx=end.x-start.x,dy=end.y-start.y;
    return end.time-start.time<=900&&Math.abs(dx)>=65&&Math.abs(dx)>Math.abs(dy)*1.8?(dx<0?1:-1):0;
  }
  pane.addEventListener('touchstart',e=>{
    gesture=null;
    if(!mobile()||e.touches.length!==1||!activeDay()||(document.querySelector('.lightbox.show')||document.querySelector('dialog[open]'))||e.target.closest(blocked))return;
    const t=e.touches[0];
    // Keep the browser's edge back/forward gesture available.
    if(t.clientX<25||t.clientX>window.innerWidth-25)return;
    gesture={x:t.clientX,y:t.clientY,time:Date.now(),day:activeDay()};
  },{passive:true});
  pane.addEventListener('touchmove',e=>{
    if(!gesture)return;
    if(e.touches.length!==1){gesture=null;return;}
    const t=e.touches[0],dx=Math.abs(t.clientX-gesture.x),dy=Math.abs(t.clientY-gesture.y);
    if(dy>18&&dy>dx)gesture=null;
  },{passive:true});
  pane.addEventListener('touchcancel',()=>{gesture=null;},{passive:true});
  pane.addEventListener('touchend',e=>{
    const start=gesture;gesture=null;
    if(!start||e.touches.length||!mobile()||activeDay()!==start.day||(document.querySelector('.lightbox.show')||document.querySelector('dialog[open]')))return;
    const t=e.changedTouches[0];if(!t)return;
    const direction=swipeDirection(start,{x:t.clientX,y:t.clientY,time:Date.now()}),day=start.day+direction;
    if(!direction||day<1||day>12)return;
    const button=document.querySelector(`.mobile-daynav button[data-day="${day}"]`);
    if(button){ignoreClickUntil=Date.now()+400;button.click();}
  },{passive:true});
  pane.addEventListener('click',e=>{if(Date.now()<ignoreClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
})();
