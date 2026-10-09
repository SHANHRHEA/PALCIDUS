// PALCYAI unified owner workspace. Private data is fetched only after server-verified owner authentication.
(async()=>{
  const $=id=>document.getElementById(id), safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const URL='https://yzeomkrvncewnrbvhuui.supabase.co', KEY='sb_publishable_ZnvYLFgr4w0TNrgplM6dLQ_sO9ThtD0';
  let sb,owner=false,busy=false,paused=false,latest=null;
  const maps={command:'actions',peos:'actions',business:'actions',brains:'agents',agents:'agents',council:'actions',leads:'leads',campaigns:'campaigns',funnels:'funnels',content:'campaigns',webinars:'campaigns',sales:'followups',jobs:'actions',omnichannel:'email',email:'email',voice:'voice',sms:'sms',whatsapp:'tools',calendar:'tools',workflows:'actions',automation:'tools',control:'actions',approvals:'approvals',slack:'tools',analytics:'tests',economics:'economics',knowledge:'skills',memory:'briefs',research:'briefs',engineering:'deployments',cto:'deployments',skillfactory:'skills',agentfactory:'agents',evaluations:'tests',security:'tools',vault:'tools',marketplace:'tools',saas:'tools',settings:'tools'};
  const task=document.createElement('section');task.className='card';task.id='liveConsole';task.innerHTML=`<h2>Chief in Command PALCYAI</h2><p id="liveStatus" role="status">Loading secure sign-in…</p><div id="ownerLogin"><label for="ownerEmail">Owner email</label><input id="ownerEmail" type="email" autocomplete="username" value="patrickpalcidus@gmail.com"><label for="ownerPassword">Password (optional if using a sign-in link)</label><input id="ownerPassword" type="password" autocomplete="current-password"><div class="toolbar"><button class="btn primary" id="loginPassword">Sign in</button><button class="btn" id="loginLink">Email me a sign-in link</button></div></div><div class="toolbar"><button class="btn" id="logoutOwner" hidden>Sign out</button><button class="btn" id="refreshCloud" disabled>Refresh live records</button><button class="btn" id="runSnapshot" disabled>Run system snapshot</button><button class="btn" id="runReadiness" disabled>Run connection report</button></div><p id="refreshTime" class="muted small">No live records loaded yet.</p><div id="runProgress" role="status"></div><div id="runOutput"></div><h3>Work and results</h3><div id="cloudJobs" class="list">Sign in to view saved work.</div>`;
  $('command').prepend(task);
  const modal=document.createElement('dialog');modal.id='liveModule';modal.style.cssText='width:min(1000px,94vw);max-height:88vh;overflow:auto;background:#0a1512;color:#edf5f2;border:1px solid #315247;border-radius:18px;padding:24px';modal.innerHTML='<button class="btn" id="closeLiveModule">Close</button><h2 id="liveModuleTitle"></h2><p id="liveModuleNote"></p><div id="liveModuleBody"></div>';document.body.appendChild(modal);$('closeLiveModule').onclick=()=>modal.close();
  document.querySelector('.nav [data-view="command"]').textContent='⌂ Chief in Command PALCYAI';
  const videoButton=document.createElement('button');videoButton.dataset.view='launchvideo';videoButton.textContent='▷ PALCYAI launch replay';document.querySelector('#nav').appendChild(videoButton);
  const videoView=document.createElement('section');videoView.id='launchvideo';videoView.className='view';videoView.innerHTML='<div class="card"><h2>PALCYAI launch replay</h2><p>Your supplied launch video. Play, pause, seek or replay here.</p><video id="launchVideo" controls playsinline preload="metadata" style="width:100%;max-height:72vh;background:#000" src="/palcyai-launch-v3.mp4"></video><div class="toolbar"><button class="btn" id="replayLaunch">Replay from start</button></div><p id="videoStatus" role="status"></p></div>';document.querySelector('.main').appendChild(videoView);
  $('replayLaunch').onclick=()=>{$('launchVideo').currentTime=0;$('launchVideo').play().catch(()=>{$('videoStatus').textContent='Press Play to start the video.';});};
  $('launchVideo').onerror=()=>{$('videoStatus').textContent='Video could not load. Check that the upload completed.';};
  const friendly={actions:'Saved work',leads:'Prospects',email:'Email delivery',sms:'SMS delivery',tools:'Connections',tests:'Recorded checks',agents:'Agent definitions',skills:'Skill definitions',campaigns:'Campaign records',funnels:'Funnel records',followups:'Follow-up records',approvals:'Approval records',voice:'Voice records',economics:'Usage and costs',briefs:'Recorded briefs',deployments:'Deployment evidence'};
  async function api(payload){
    if(!owner)throw Error('Sign in with the owner account first.');
    const {data,error}=await sb.auth.getSession();if(error||!data.session)throw Error('Sign in again.');
    const response=await fetch(URL+'/functions/v1/palcy-chief-command',{method:'POST',headers:{'Content-Type':'application/json',apikey:KEY,Authorization:'Bearer '+data.session.access_token},body:JSON.stringify(payload)});
    const result=await response.json();if(!response.ok)throw Error(result.error||'Request failed');return result;
  }
  function time(iso){return iso?new Date(iso).toLocaleString():'';}
  function duration(row){if(!row.started_at)return '';const end=row.completed_at?Date.parse(row.completed_at):Date.now();return Math.max(0,(end-Date.parse(row.started_at))/1000).toFixed(1)+'s';}
  function renderRows(rows,key){
    if(!rows.length)return '<p>No records returned. This does not prove that a provider is connected.</p>';
    return rows.map(r=>{
      const title=r.title||r.first_name||r.name||r.role||r.test_name||r.event_type||r.system_name||r.stage||r.action||r.task_type||r.agent_id||r.skill_id||'Record';
      const id=r.action_id||r.id||r.campaign_id||r.funnel_id||r.agent_id||r.skill_id||'';
      const status=r.status||r.result_status||'recorded';
      let contact='';
      if(key==='leads'){
        const phone=/^\+[1-9]\d{7,14}$/.test(r.phone||'')?`<a class="btn" href="tel:${safe(r.phone)}">Call ${safe(r.phone)}</a>`:'';
        const email=r.email?`<a class="btn" href="mailto:${encodeURIComponent(r.email)}">Email ${safe(r.email)}</a>`:'';
        contact=`<p>Priority: ${safe(r.selected_priority)} · Language: ${safe(r.language)}</p><div class="toolbar">${phone}${email}<button class="btn" data-brief-id="${safe(r.id)}">Build priority brief</button></div>`;
      }
      return `<div class="item"><b>${safe(title)}</b> <span class="pill">${safe(status)}</span><div class="meta">${safe(time(r.created_at||r.started_at||r.updated_at))} ${safe(duration(r))} · ${safe(id)}</div>${contact}<details><summary>View recorded details / result</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${safe(JSON.stringify(r,null,2))}</pre></details></div>`;
    }).join('');
  }
  async function refresh(){
    if(!owner||busy||document.hidden)return;busy=true;
    try{const r=await api({action:'dashboard'});latest=r;paused=r.controls?.paused===true;const actions=r.sections.find(s=>s.key==='actions');$('cloudJobs').innerHTML=actions.error?'<p>Work records could not be read.</p>':renderRows(actions.rows,'actions');$('feed').innerHTML=actions.error?'<p>Audit unavailable.</p>':actions.rows.slice(0,10).map(a=>`<div class="event"><b>${safe(a.title)}</b> · ${safe(a.status)}<div class="muted small">${safe(time(a.created_at))}</div></div>`).join('');$('approvalList').innerHTML=renderRows(r.sections.find(s=>s.key==='approvals')?.rows||[],'approvals');$('refreshTime').textContent='Live data read '+time(r.generated_at)+'. Refreshes every 15 seconds while this page is visible.';$('stopBtn').textContent=paused?'Resume new dispatches':'Pause new dispatches';$('liveStatus').textContent='Owner signed in · Supabase connected';}
    catch(e){$('liveStatus').textContent=e.message;$('refreshTime').textContent='Refresh failed. Previously displayed records may be stale.';}
    finally{busy=false;}
  }
  const pendingRuns=new Map();
  async function run(operation,extra={}){
    const key=JSON.stringify({operation,...extra});if(pendingRuns.get(key)?.running)return;
    let state=pendingRuns.get(key)||{id:crypto.randomUUID()};state.running=true;pendingRuns.set(key,state);
    showView('command');const start=performance.now();$('runOutput').textContent='';
    const tick=()=>{$('runProgress').textContent='Running '+operation.replaceAll('_',' ')+' · '+((performance.now()-start)/1000).toFixed(1)+' seconds';};tick();const timer=setInterval(tick,200);
    try{const r=await api({action:'run',operation,request_id:state.id,...extra});pendingRuns.delete(key);$('runOutput').innerHTML=`<h3>${safe(r.job.status)}</h3><p>Saved reference: ${safe(r.job.action_id)}</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${safe(JSON.stringify(r.job.result,null,2))}</pre>`;$('runProgress').textContent='Server result: '+r.job.status+' · '+duration(r.job);await refresh();}
    catch(e){$('runProgress').textContent=e.message+' · Retry keeps the same request reference.';}
    finally{clearInterval(timer);state.running=false;}
  }
  async function openModule(name,view){
    $('liveModuleTitle').textContent=name;const key=maps[view]||'tools';$('liveModuleNote').textContent='Loading '+(friendly[key]||key)+'…';$('liveModuleBody').textContent='';modal.showModal();
    try{const r=await api({action:'dataset',dataset:key});if(r.error)throw Error('This data source is unavailable.');$('liveModuleNote').textContent='Live '+(friendly[key]||key)+' · '+time(r.generated_at)+' · latest 50. Definitions and drafts do not prove execution.';$('liveModuleBody').innerHTML=renderRows(r.rows,key);}
    catch(e){$('liveModuleNote').textContent=e.message;}
  }
  // Every Open card now opens a real data drawer, replacing the original static toast.
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-open-item]');if(b){e.preventDefault();e.stopImmediatePropagation();openModule(b.dataset.openItem,b.closest('.view')?.id);}
    const lead=e.target.closest('[data-brief-id]');if(lead){modal.close();run('priority_brief',{lead_id:lead.dataset.briefId});}
  },true);
  for(const view of document.querySelectorAll('.view')){
    if(['command','launchvideo'].includes(view.id))continue;
    const bar=document.createElement('div');bar.className='notice';bar.style.marginBottom='16px';
    bar.innerHTML=`<button class="btn" data-live-view="${view.id}">View live ${safe(friendly[maps[view.id]]||'records')}</button> <span class="small">Records, saved results and connection state</span>`;view.prepend(bar);
    bar.querySelector('button').onclick=()=>openModule(view.querySelector('h2')?.textContent||view.id,view.id);
  }
  $('runCommand').textContent='Save command to cloud';$('runCommand').onclick=()=>run('command_plan',{title:$('commandInput').value});
  $('runSnapshot').onclick=()=>run('system_snapshot');$('runReadiness').onclick=()=>run('readiness_report');$('refreshCloud').onclick=refresh;
  $('testEndpoint').onclick=()=>run('readiness_report');$('saveEndpoint').onclick=()=>{$('endpointState').textContent='The verified project connection is fixed. Arbitrary endpoints are not used.';};$('endpointInput').value=URL+'/functions/v1/palcy-chief-command';$('endpointInput').readOnly=true;
  $('saveLead').textContent='Open live prospect records';$('saveLead').onclick=()=>openModule('Prospects','leads');
  $('emailTestBtn').textContent='View email delivery records';$('emailTestBtn').onclick=()=>openModule('Email delivery','email');
  $('stopBtn').onclick=async()=>{try{const r=await api({action:'pause',paused:!paused});$('commandResult').textContent=r.scope;await refresh();}catch(e){$('commandResult').textContent=e.message;}};
  let definitionKey=null;
  $('saveCreate').onclick=async()=>{const b=$('saveCreate');if(b.disabled)return;b.disabled=true;try{definitionKey ||= crypto.randomUUID();const r=await api({action:'save_definition',request_id:definitionKey,kind:$('createType').value,name:$('createName').value,description:$('createDesc').value});definitionKey=null;$('modal').classList.remove('open');$('commandResult').textContent=r.message||'Definition already saved.';await refresh();}catch(e){$('commandResult').textContent=e.message;}finally{b.disabled=false;}};
  for(const id of ['createName','createDesc'])$(id).addEventListener('input',()=>{definitionKey=null;});
  async function sessionChanged(session){
    owner=!!session&&session.user?.email?.toLowerCase()==='patrickpalcidus@gmail.com';
    if(session&&!owner)await sb.auth.signOut();
    $('ownerLogin').hidden=owner;$('logoutOwner').hidden=!owner;
    for(const id of ['refreshCloud','runSnapshot','runReadiness'])$(id).disabled=!owner;
    $('liveStatus').textContent=owner?'Owner signed in. Loading live records…':'Sign in to view private live records.';
    if(owner)await refresh();else{$('cloudJobs').textContent='Sign in to view saved work.';$('runOutput').textContent='';$('feed').textContent='Sign in for activity.';$('approvalList').textContent='Sign in for approvals.';$('liveModuleBody').textContent='';$('refreshTime').textContent='No live records loaded.';latest=null;}
  }
  try{
    const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.99.2');
    sb=createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    $('loginPassword').onclick=async()=>{try{const email=$('ownerEmail').value.trim().toLowerCase();if(email!=='patrickpalcidus@gmail.com')throw Error('Use the owner account.');const password=$('ownerPassword').value;const {error}=await sb.auth.signInWithPassword({email,password});$('ownerPassword').value='';if(error)throw error;}catch(e){$('liveStatus').textContent=e.message;}};
    $('loginLink').onclick=async()=>{const b=$('loginLink');b.disabled=true;try{if(location.protocol==='file:')throw Error('Use the published PALCYAI Brain link to sign in.');const email=$('ownerEmail').value.trim().toLowerCase();if(email!=='patrickpalcidus@gmail.com')throw Error('Use the owner account.');const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:'https://advisor-financial-insurance.pages.dev/palcyai-brain.html'}});if(error)throw error;$('liveStatus').textContent='Open the sign-in email in this browser, then return to PALCYAI Brain.';}catch(e){$('liveStatus').textContent=e.message;}finally{setTimeout(()=>b.disabled=false,60000);}};
    $('logoutOwner').onclick=async()=>{await sb.auth.signOut();await sessionChanged(null);};
    sb.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>sessionChanged(session),0);});
    const {data}=await sb.auth.getSession();await sessionChanged(data.session);
    setInterval(refresh,15000);
  }catch(e){$('liveStatus').textContent='Sign-in could not load: '+e.message;}
  if(location.hash){const view=location.hash.slice(1);if($(view)?.classList.contains('view'))showView(view);}
})();
