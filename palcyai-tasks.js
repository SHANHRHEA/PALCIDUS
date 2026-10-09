export function mountTaskBoard({api,isOwner}) {
 const $=id=>document.getElementById(id),escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let epoch=0,busy=false,request=null,selected=null,lastJobs=[],lastOwner=null,resultVersion='';
 const panel=document.createElement('section');panel.className='card';panel.id='executionBoard';
 panel.innerHTML=`<h2>Build a campaign</h2><p>Create a saved campaign and eight text assets for review. This builder uses priority-specific templates. It does not publish posts or send messages.</p><div class="inputgrid"><div><label for="campaignName">Campaign name</label><input id="campaignName" maxlength="120" value="Financial Discovery"></div><div><label for="campaignPriority">Main priority</label><select id="campaignPriority"><option value="complete">Complete financial discovery</option><option value="protection">Family protection</option><option value="cashflow">Cash flow</option><option value="debt">Debt reduction</option><option value="retirement">Retirement preparation</option><option value="firsthome">First home</option><option value="savings">Savings</option><option value="emergency">Emergency fund</option></select></div><div class="full"><label for="campaignAudience">Who is it for?</label><input id="campaignAudience" maxlength="300" value="People who requested financial education"></div></div><div class="toolbar"><button class="btn primary" id="buildCampaign">Build campaign drafts</button><button class="btn" id="refreshExecutions">Refresh work</button><a class="btn" href="https://cal.com/palcidus-patrick-3pee3f/30min" target="_blank" rel="noopener">Open your Cal.com booking page ↗</a></div><p id="campaignFeedback" role="status"></p><h3>Task engine</h3><p id="workerState">Sign in to read the worker status.</p><div id="executionList"></div><div id="executionResult"></div>`;
 $('command').prepend(panel);
 const another=document.createElement('button');another.className='btn';another.id='newCampaignBuild';another.textContent='Start another build';another.disabled=true;
 another.onclick=()=>{request=null;try{sessionStorage.removeItem('palcy-campaign-request');}catch{}$('campaignFeedback').textContent='Ready for a new build. Review the fields, then click Build campaign drafts.';another.disabled=true;};$('buildCampaign').after(another);
 const labels={queued:'Queued',running:'Running',retry_scheduled:'Retry scheduled',completed:'Drafts ready',failed:'Failed',cancelled:'Cancelled'};
 function elapsed(j){const start=Date.parse(j.started_at||j.created_at),end=j.completed_at?Date.parse(j.completed_at):Date.now();return Math.max(0,Math.round((end-start)/1000))+' seconds';}
 async function showJob(id){
   const current=epoch;selected=id;history.replaceState(null,'','#task-'+id);
   try{const r=await api({action:'execution_job',job_id:id});if(current!==epoch||!isOwner()||selected!==id)return;
     const version=JSON.stringify(r);if(version===resultVersion)return;resultVersion=version;
     const wrap=$('executionResult');wrap.replaceChildren();const heading=document.createElement('h3');heading.textContent=r.job.title+' — '+(labels[r.job.status]||r.job.status);wrap.append(heading);
     const summary=document.createElement('p');summary.textContent=r.job.result?.summary||'Waiting for the scheduled worker. Pending jobs are checked each minute.';wrap.append(summary);
     const timeline=document.createElement('ol');for(const event of r.events){const li=document.createElement('li');li.textContent=new Date(event.created_at).toLocaleString()+' — '+event.message;timeline.append(li);}wrap.append(timeline);
     for(const asset of r.artifacts){const card=document.createElement('details');card.className='card';const title=document.createElement('summary');title.textContent=asset.title;const body=document.createElement('pre');body.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit';body.textContent=asset.body;
       const download=document.createElement('button');download.className='btn';download.textContent='Download text';download.onclick=()=>{const blob=new Blob([asset.body],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='PALCYAI-'+asset.kind+'-'+asset.ordinal+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};card.append(title,body,download);wrap.append(card);}
     if(r.artifacts.length){const note=document.createElement('p');note.textContent='Review these drafts before use. No social account has published them and no recipients have been contacted.';wrap.append(note);}
   }catch(e){if(current===epoch)$('campaignFeedback').textContent=e.message;}
 }
 async function refresh(){
   if(!isOwner()||busy||document.hidden)return;busy=true;const current=epoch;
   try{const r=await api({action:'execution_jobs'});if(current!==epoch||!isOwner())return;lastJobs=r.jobs;
     another.disabled=!r.jobs.some(j=>['completed','cancelled','failed'].includes(j.status));
     const age=r.worker?Date.now()-Date.parse(r.worker.last_tick):Infinity;
     $('workerState').textContent=r.worker?(r.worker.paused?'Worker paused.':age<150000?'Scheduled worker responding.':'Worker heartbeat is late; queued work may be delayed.')+' Last check: '+new Date(r.worker.last_tick).toLocaleString():'Waiting for the first scheduled worker heartbeat.';
     $('executionList').innerHTML=r.jobs.length?r.jobs.map(j=>`<div class="item"><b>${escape(j.title)}</b> <span class="pill">${escape(labels[j.status]||j.status)}</span><p>${escape(elapsed(j))} · Attempt ${j.attempts}/3</p>${j.error?`<p>${escape(j.error)}</p>`:''}<button class="btn" data-result-job="${escape(j.id)}">Open progress and results</button>${['queued','retry_scheduled'].includes(j.status)?` <button class="btn" data-cancel-job="${escape(j.id)}">Cancel pending build</button>`:''}</div>`).join(''):'No campaign jobs yet. Build your first draft above.';
     if(selected)await showJob(selected);
   }catch(e){if(current===epoch)$('workerState').textContent='Could not refresh: '+e.message;}finally{busy=false;}
 }
 $('buildCampaign').onclick=async()=>{const button=$('buildCampaign');button.disabled=true;const current=epoch;
   try{const input={name:$('campaignName').value.trim(),priority:$('campaignPriority').value,audience:$('campaignAudience').value.trim()};if(!input.name)throw Error('Enter a campaign name.');const serialized=JSON.stringify(input),hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(serialized)),signature=Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
     if(!request){try{const saved=JSON.parse(sessionStorage.getItem('palcy-campaign-request'));if(saved?.signature===signature&&/^[0-9a-f-]{36}$/i.test(saved.id))request=saved;}catch{}}
     if(!request||request.signature!==signature)request={signature,id:crypto.randomUUID()};try{sessionStorage.setItem('palcy-campaign-request',JSON.stringify(request));}catch{}
     const r=await api({action:'enqueue_campaign',request_id:request.id,...input});if(current!==epoch||!isOwner())return;selected=r.job.id;$('campaignFeedback').textContent='Campaign saved in the queue. The worker checks pending jobs each minute. You can close this page and return later.';await refresh();
   }catch(e){if(current===epoch)$('campaignFeedback').textContent=e.message;}finally{button.disabled=!isOwner();}
 };
 panel.addEventListener('click',async e=>{const result=e.target.closest('[data-result-job]');if(result)await showJob(result.dataset.resultJob);const cancel=e.target.closest('[data-cancel-job]');if(cancel){try{await api({action:'cancel_execution',job_id:cancel.dataset.cancelJob});await refresh();}catch(e){$('campaignFeedback').textContent=e.message;}}});
 $('refreshExecutions').onclick=refresh;
 function authChanged(){if(lastOwner===isOwner())return;const wasOwner=lastOwner;lastOwner=isOwner();epoch++;selected=isOwner()&&/^#task-[0-9a-f-]{36}$/i.test(location.hash)?location.hash.slice(6):null;request=null;lastJobs=[];resultVersion='';another.disabled=true;if(wasOwner&&!isOwner()){try{sessionStorage.removeItem('palcy-campaign-request');}catch{}}$('executionList').replaceChildren();$('executionResult').replaceChildren();$('campaignFeedback').textContent='';$('workerState').textContent=isOwner()?'Loading scheduled worker status…':'Sign in to view private work.';$('buildCampaign').disabled=!isOwner();$('refreshExecutions').disabled=!isOwner();if(isOwner())refresh();}
 window.addEventListener('palcy-owner-session',authChanged);authChanged();setInterval(refresh,5000);
 const campaignView=$('campaigns');if(campaignView){const button=document.createElement('button');button.className='btn primary';button.textContent='Build campaign and view results';button.onclick=()=>{document.querySelector('[data-view="command"]').click();panel.scrollIntoView({behavior:'smooth'});};campaignView.prepend(button);}
 return {buildFromCommand(title){$('campaignName').value=title.trim().slice(0,120);const priority=['protection','cashflow','debt','retirement','firsthome','savings','emergency'].find(x=>title.toLowerCase().includes(x));$('campaignPriority').value=priority||'complete';document.querySelector('[data-view="command"]').click();panel.scrollIntoView({behavior:'smooth'});$('buildCampaign').click();}};
}

