// Presentation-only guidance. All verification still uses the existing action.
export function initializeGuide(doc=document){
  const dialog=doc.getElementById('proofGuide'),opener=doc.getElementById('learn');
  const primary=doc.getElementById('loadExample'),example=doc.getElementById('guideExample');
  const close=()=>{if(typeof dialog.close==='function')dialog.close();else {dialog.removeAttribute('open');opener.focus();}};
  opener.addEventListener('click',()=>{
    if(dialog.open)return;
    if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');
  });
  dialog.addEventListener('close',()=>opener.focus());
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab'||!dialog.open)return;
    const controls=[...dialog.querySelectorAll('button:not(:disabled), a[href], [tabindex="0"]')];
    const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&(doc.activeElement===first||doc.activeElement===dialog)){
      event.preventDefault();last?.focus();
    }else if(!event.shiftKey&&(doc.activeElement===last||doc.activeElement===dialog)){
      event.preventDefault();first?.focus();
    }
  });
  dialog.querySelectorAll('[data-close-guide]').forEach(button=>button.addEventListener('click',close));
  const sync=()=>{example.disabled=primary.disabled;};
  new window.MutationObserver(sync).observe(primary,{attributes:true,attributeFilter:['disabled']});sync();
  example.addEventListener('click',async()=>{
    if(primary.disabled)return;
    close();await primary.onclick();
    const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    doc.getElementById('receiptPanel').scrollIntoView?.({behavior:reduce?'auto':'smooth',block:'start'});
  });
}
