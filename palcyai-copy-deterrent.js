// User-requested casual-copy deterrent. This is not access control or reliable copy protection.
(()=>{
 const editable=target=>target instanceof Element&&!!target.closest('input,textarea,select,[contenteditable="true"]');
 document.addEventListener('contextmenu',event=>{if(!editable(event.target))event.preventDefault();});
 document.addEventListener('copy',event=>{if(!editable(event.target))event.preventDefault();});
 document.addEventListener('dragstart',event=>{if(event.target instanceof HTMLImageElement)event.preventDefault();});
 document.addEventListener('keydown',event=>{if(editable(event.target))return;if(event.key==='F12'||((event.ctrlKey||event.metaKey)&&event.shiftKey&&['I','J','C'].includes(event.key.toUpperCase())))event.preventDefault();});
})();
