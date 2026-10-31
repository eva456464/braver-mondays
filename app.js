'use strict';
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const samples = JSON.parse($('#sample-data').textContent);
  const currentProduct = () => config?.products?.find(p=>p.id===document.body.dataset.productId);
  let sampleIndex=0, config=null, pixelReady=false, pageTracked=false, selectedCheckout=null, selectedSample=null;
  let consent=null;
  try {const c=JSON.parse(localStorage.getItem('bravermondays_consent_v1') || localStorage.getItem('firstlead_consent_v1'));if(c && ['granted','denied'].includes(c.value) && Date.now()-c.at<180*86400000)consent=c.value;} catch {}
  const escape = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let dialogReturnFocus=null;
  function openDialog(id){if(!document.activeElement.closest('dialog'))dialogReturnFocus=document.activeElement;$$('dialog[open]').forEach(d=>d.close());const d=$(id);if(d&&!d.open)d.showModal();}
  $$('dialog').forEach(d=>d.addEventListener('close',()=>{if(!$('dialog[open]')&&dialogReturnFocus?.isConnected&&dialogReturnFocus.getClientRects().length)dialogReturnFocus.focus();}));
  $$('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>{a.closest('details').open=false;}));
  $$('.mobile-menu').forEach(menu=>menu.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.open=false;$('summary',menu).focus();}}));
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const b=d.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)d.close();}}));
  function showSample(){const s=samples[sampleIndex];$('#sample-image').src=s.image;$('#sample-image').alt=s.alt;$('#sample-caption').textContent=s.title;}
  $$('[data-sample]').forEach(b=>b.addEventListener('click',()=>{const trigger=document.createElement('button');trigger.dataset.emailSample=document.body.dataset.productId;trigger.hidden=true;document.body.append(trigger);trigger.click();trigger.remove();}));
  $('#sample-prev').addEventListener('click',()=>{sampleIndex=(sampleIndex+samples.length-1)%samples.length;showSample();});
  $('#sample-next').addEventListener('click',()=>{sampleIndex=(sampleIndex+1)%samples.length;showSample();});
  $('#sample-dialog').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){$('#sample-next').click();e.preventDefault();}if(e.key==='ArrowLeft'){$('#sample-prev').click();e.preventDefault();}});
  $$('[data-sample-download]').forEach(a=>a.addEventListener('click',()=>track('DownloadSample',{content_name:document.body.dataset.productId+' workbook sample'},true)));
  const previews=$$('[data-preview]');
  function activatePreview(i,focus=false){sampleIndex=i;previews.forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1;});const s=samples[i];$('#preview-image').src=s.image;$('#preview-image').alt=s.alt;$('#preview-panel').setAttribute('aria-labelledby',`preview-tab-${i}`);if(focus)previews[i].focus();}
  previews.forEach((b,i)=>b.addEventListener('click',()=>activatePreview(i)));
  const parts=$$('[data-part]');
  const explanations=['Name what you want to work on together. Make the purpose clear before discussing the detail.','Describe an event you can verify. Leave guesses about motives out of the opening.','Explain the effect on the work so the other person can understand why it matters.','Ask a genuine question. Leave space for information that could change your understanding.'];
  function activatePart(i,focus=false){parts.forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1;});$$('[data-sentence]').forEach((s,j)=>s.classList.toggle('active',i===j));$('#part-number').textContent=`0${i+1}`;$('#part-explanation').textContent=explanations[i];$('#opening-explanation').setAttribute('aria-labelledby',`part-tab-${i}`);if(focus)parts[i].focus();}
  parts.forEach((b,i)=>b.addEventListener('click',()=>activatePart(i)));
  function keyboardTabs(items,activate){items.forEach((b,i)=>b.addEventListener('keydown',e=>{let n=null;if(e.key==='ArrowRight')n=(i+1)%items.length;if(e.key==='ArrowLeft')n=(i+items.length-1)%items.length;if(e.key==='Home')n=0;if(e.key==='End')n=items.length-1;if(n!==null){e.preventDefault();activate(n,true);}}));}
  keyboardTabs(previews,activatePreview);keyboardTabs(parts,activatePart);
  const valueTabs=$$('[data-value-tab]'), valuePanels=$$('[data-value-panel]');
  function activateValue(i,focus=false){
    valueTabs.forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1;});
    valuePanels.forEach((p,j)=>{p.hidden=j!==i;p.classList.toggle('is-selected',j===i);});
    if(focus)valueTabs[i].focus();
  }
  if(valueTabs.length){$('.value-tabs').hidden=false;activateValue(0);valueTabs.forEach((b,i)=>b.addEventListener('click',()=>activateValue(i)));keyboardTabs(valueTabs,activateValue);}
  const moments=$$('[data-moment]');
  const momentStories=[
    {thought:'“How do I bring this up without sounding harsh?”',opening:'“The brief arrived a day after we agreed, so I moved the review.”',question:'“What affected the timing from your side?”',next:'Agree a realistic hand-off and when to flag a delay.'},
    {thought:'“How do I set expectations when we used to be peers?”',opening:'“With my new role, I’d like us to be clear about decisions and check-ins.”',question:'“What would help us work well with this change?”',next:'Clarify responsibilities and choose a time to check how it’s working.'},
    {thought:'“How do I push back without letting people down?”',opening:'“With the new request, we have three priorities and capacity for two.”',question:'“Which should come first, and what can move?”',next:'Agree the priority, the trade-off and who needs an update.'}
  ];
  function activateMoment(i,focus=false){if(!moments.length)return;moments.forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1;});const story=momentStories[i];['thought','opening','question','next'].forEach(key=>$('#moment-'+key).textContent=story[key]);const panel=$('#moment-panel');panel.setAttribute('aria-labelledby','moment-tab-'+i);panel.classList.remove('changing');requestAnimationFrame(()=>panel.classList.add('changing'));if(focus)moments[i].focus();}
  moments.forEach((b,i)=>b.addEventListener('click',()=>activateMoment(i)));
  keyboardTabs(moments,activateMoment);

  function checkoutProduct(){return selectedCheckout==='bundle'?config?.bundle:(config?.products?.find(p=>p.id===selectedCheckout)||currentProduct());}
  function checkoutReady(p){try{const url=new URL(p?.checkoutUrl);return !config.reviewMode && !!config.launchDeliveryDate && url.protocol==='https:' && (url.hostname==='gumroad.com'||url.hostname.endsWith('.gumroad.com')||url.hostname==='lemonsqueezy.com'||url.hostname.endsWith('.lemonsqueezy.com'));}catch{return false;}}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(!b)return;selectedCheckout=b.dataset.buy||document.body.dataset.productId;configureCheckout();openDialog('#checkout-dialog');});
  function configureCheckout(){
    const p=checkoutProduct(),link=$('#checkout-link'),active=checkoutReady(p);
    link.hidden=!active;$('#checkout-status').hidden=active;
    if(!p)return;
    $('#checkout-title').textContent=p.id==='bundle'?'The complete Braver Mondays collection':p.checkoutHeading;
    $('.order-line h3').textContent=p.title;
    $('.order-line strong').textContent='US$'+p.price+' · pre-order';
    $('.order-line img').src=p.image;
    $('.order-line p').textContent=p.id==='bundle'?'Three workbooks + three companion guides':'Workbook + companion guide';
    const facts=$('#checkout-dialog .check-list');facts.innerHTML='';
    [p.id==='bundle'?'All three independent workshops':p.workbookPages+'-page workbook + '+p.guidePages+'-page companion guide','Printable PDFs to keep and reuse',config?.launchDeliveryDate?'Delivery: '+config.launchDeliveryDate:'Delivery date will be confirmed before payment'].forEach(text=>{const li=document.createElement('li');li.textContent=text;facts.append(li);});
    if(active)link.href=p.checkoutUrl;else link.removeAttribute('href');
  }
  $('#checkout-link').addEventListener('click',e=>{const p=checkoutProduct();if(!checkoutReady(p)){e.preventDefault();return;}track('InitiateCheckout',{content_ids:[p.id],content_type:'product',num_items:p.id==='bundle'?3:1,value:p.price,currency:p.currency});});
  function sampleReady(){try{return !config.reviewMode&&new URL(config.sampleSignupEndpoint).protocol==='https:';}catch{return false;}}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-email-sample]');if(!b)return;e.preventDefault();selectedSample=b.dataset.emailSample;const p=config?.products.find(p=>p.id===selectedSample);$('#email-workshop').textContent=p?.title||'Workshop sample';const form=$('#sample-email-form');form.reset();[...form.elements].forEach(el=>el.disabled=!sampleReady());$('#email-result').textContent=sampleReady()?'Enter your email and we’ll send your sample.':'Email delivery is not connected yet. No email address is collected.';openDialog('#email-dialog');});
  $('#sample-email-form').addEventListener('submit',async e=>{
    e.preventDefault();if(!sampleReady()||!e.target.reportValidity())return;
    const form=e.target,button=$('button[type=submit]',form);button.disabled=true;$('#email-result').textContent='Requesting your sample…';
    try{const response=await fetch(config.sampleSignupEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.elements.email.value,productId:selectedSample,marketingConsent:form.elements.marketing.checked})});const result=await response.json();if(!response.ok||result.accepted!==true)throw Error('Not accepted');$('#email-result').textContent='Your request was received. Check your inbox for the sample or confirmation email.';track('Lead',{content_name:selectedSample+' sample'},false);form.reset();}catch{$('#email-result').textContent='We couldn’t send your request. Please try again. Your request has not been confirmed.';}finally{button.disabled=false;}
  });
  function renderTestimonials(){const container=$('#testimonial-quotes');if(!container)return;container.replaceChildren();(config.testimonials||[]).filter(t=>t.approved&&t.quote&&t.name).forEach(t=>{const figure=document.createElement('figure'),quote=document.createElement('blockquote'),caption=document.createElement('figcaption');quote.textContent=t.quote;caption.textContent=t.name+(t.role?' · '+t.role:'');figure.append(quote,caption);container.append(figure);});$('#testimonials').hidden=!container.childElementCount;}
  // Purchase is intentionally never emitted from a button or a client-controlled return URL.
  // Verified payment completion belongs to the checkout provider / server integration.
  function track(name,data={},custom=false){if(consent==='granted'&&pixelReady&&typeof window.fbq==='function')window.fbq(custom?'trackCustom':'track',name,data);}
  function startMeasurement(){if(!config?.metaPixelId||config.reviewMode||consent!=='granted'||!/^\d{5,25}$/.test(config.metaPixelId))return;if(!pixelReady){const n=window.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments);};n.push=n;n.loaded=true;n.version='2.0';n.queue=[];window._fbq=n;window.fbq('consent','grant');window.fbq('init',config.metaPixelId);const s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.append(s);pixelReady=true;}else window.fbq('consent','grant');if(!pageTracked){track('PageView');if(document.body.dataset.page==='product'){const p=currentProduct();track('ViewContent',{content_ids:[p.id],content_type:'product',content_name:p.title,value:p.price,currency:p.currency});}pageTracked=true;}}
  function saveConsent(value){consent=value;try{localStorage.setItem('bravermondays_consent_v1',JSON.stringify({value,at:Date.now()}));}catch{}$('#cookie-banner').hidden=true;if($('#cookie-dialog').open)$('#cookie-dialog').close();if(value==='granted')startMeasurement();else if(pixelReady)window.fbq('consent','revoke');}
  $$('[data-consent]').forEach(b=>b.addEventListener('click',()=>saveConsent(b.dataset.consent)));
  $$('[data-cookie-settings]').forEach(b=>b.addEventListener('click',()=>{const enabled=config?.metaPixelId&&!config.reviewMode;$('#cookie-explanation').textContent=enabled?'Optional advertising measurement helps us understand visits and workshop interest. It stays off unless you allow it. Your choice is saved on this device.':'Advertising tracking is not active in this preview. Your choice is saved on this device.';openDialog('#cookie-dialog');}));
  const angle=new URLSearchParams(location.search).get('angle');
  const angles={'missed-deadline':'A missed deadline needs a conversation. Find words that address the impact and leave room to understand what happened.','former-peer':'Leading people who used to be your peers? Prepare a conversation that makes expectations clear and leaves room for their view.','workload':'Another priority, the same team. Prepare to explain the capacity gap and ask for a decision you can work with.'};
  if(angles[angle]&&$('#campaign-intro')){$('#campaign-intro').textContent=angles[angle];activateMoment({'missed-deadline':0,'former-peer':1,'workload':2}[angle]);}
  const artWorkload='<svg viewBox="0 0 240 150" fill="none" aria-hidden="true"><rect x="35" y="23" width="170" height="108" rx="8" fill="#f7f4ec" stroke="#176f65" stroke-width="2"/><path d="M35 49h170M68 14v22M172 14v22" stroke="#176f65" stroke-width="3" stroke-linecap="round"/><path d="M56 72h34M104 72h34M152 72h30M56 95h34M104 95h34" stroke="#176f65" stroke-width="9" stroke-linecap="round"/><path d="m158 98 7 7 15-17" stroke="#b9523b" stroke-width="3" stroke-linecap="round"/></svg>';
  const artFeedback='<svg viewBox="0 0 240 150" fill="none" aria-hidden="true"><path d="M22 25h130v65H73L51 109V90H22V25Z" fill="#f7f4ec" stroke="#176f65" stroke-width="2"/><path d="M172 55h46v67h-27l-20 17v-17h-53v-16" stroke="#b9523b" stroke-width="2" fill="none"/><path d="M45 47h84M45 64h61" stroke="#176f65" stroke-width="5" stroke-linecap="round"/></svg>';
  function renderCatalog(filter='All'){if(!$('#catalog-grid')||!config)return;const products=config.products.filter(p=>filter==='All'||p.category===filter);$('#catalog-count').textContent=`${products.length} workshop${products.length===1?'':'s'}`;$('#catalog-grid').innerHTML=products.map(p=>{const planned=p.status==='planned';return `<article class="product-tile"><div class="product-art ${planned?escape(p.id):''}">${planned?(p.id==='workweek'?artWorkload:artFeedback):`<a href="${escape(p.path)}" aria-label="Explore ${escape(p.title)}"><img src="${escape(p.image)}" alt="${escape(p.title)} workbook cover" width="1200" height="849" loading="lazy"></a>`}</div><p class="tile-status">${escape(p.category)} · ${planned?'Planned topic':'PDF workshop'}</p><h2>${planned?escape(p.title):`<a href="${escape(p.path)}">${escape(p.title)}</a>`}</h2><p>${escape(p.description)}</p>${planned?'':`<p class="tile-format">${p.workbookPages}-page workbook + ${p.guidePages}-page guide<br>Examples, practice and reusable tools · About 60 minutes working independently</p>`}<div class="tile-bottom">${planned?'<span>Not yet available</span>':`<span>US$${p.price} launch pre-order · Standard US$${p.standardPrice}</span><a href="${escape(p.path)}">Explore workshop ↗</a>`}</div></article>`;}).join('');}
  $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});renderCatalog(b.dataset.filter);}));
  const choices=$$('[data-hours]');
  function updateCapacity(){const saved=choices.filter(x=>x.checked).reduce((n,x)=>n+Number(x.dataset.hours),0);const remaining=25-saved,gap=remaining-15;$('#capacity-demand').textContent=remaining+' h';$('#capacity-gap').textContent=gap?gap+' hours still need a decision':'The plan fits the 15 hours available';$('#capacity-result').classList.toggle('balanced',gap===0);$('#capacity-fill').style.width=(remaining/25*100)+'%';$('#capacity-note').textContent=gap?'Choose agreed changes below. Protect the 4.5-hour contingency already set aside.':'Scope, timing and ownership now fit. Confirm every agreement; if the peer cannot help, the 3-hour gap returns.';}
  choices.forEach(x=>x.addEventListener('change',updateCapacity));
  if(choices.length)updateCapacity();
  const decisions=$$('[data-decision]');
  const decisionContent=[
    {title:'Omar decides within the brief.',words:'“Choose a layout that makes the three milestone statuses, main risk and action owners easy to scan.”',reason:'The required content stays clear. The leader’s favourite layout does not have to be the only acceptable one.'},
    {title:'Omar recommends. Maya approves.',words:'“Bring me the proposed date, its impact and your recommendation before changing the agreed plan.”',reason:'Owning the draft does not mean owning every decision it describes. Name the approver and how to reach them.'},
    {title:'The commitment stays with Maya.',words:'“Do not make a new customer promise. Flag the request to me and continue the parts of the update within your brief.”',reason:'Retained responsibility needs a clear owner. Omar still owns the draft; Maya owns the customer commitment.'}
  ];
  function activateDecision(i,focus=false){decisions.forEach((b,j)=>{b.setAttribute('aria-selected',j===i);b.tabIndex=j===i?0:-1;});const d=decisionContent[i];['title','words','reason'].forEach(k=>$('#decision-'+k).textContent=d[k]);$('#decision-number').textContent='0'+(i+1);$('#decision-panel').setAttribute('aria-labelledby','decision-tab-'+i);if(focus)decisions[i].focus();}
  decisions.forEach((b,i)=>b.addEventListener('click',()=>activateDecision(i)));
  keyboardTabs(decisions,activateDecision);
  fetch('/braver-mondays/site-config.json', {cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Configuration unavailable');return r.json();}).then(c=>{config=c;configureCheckout();renderCatalog();renderTestimonials();if(config.metaPixelId&&!config.reviewMode){$('#cookie-banner').hidden=!!consent;startMeasurement();}}).catch(()=>{if($('#catalog-grid'))$('#catalog-grid').innerHTML='<p>Workshop details could not load. <a href="/braver-mondays/workshops/difficult-conversations/">Explore the first workshop</a>.</p>';});
  if('IntersectionObserver'in window){if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});$$('.reveal').forEach(el=>observer.observe(el));}const sticky=$('#mobile-purchase'),cta=$('.hero-actions');
    if(sticky&&cta){
      let pastHero=false,offerVisible=false,footerVisible=false;
      const updateSticky=()=>{sticky.hidden=!pastHero||offerVisible||footerVisible;};
      new IntersectionObserver(entries=>{const e=entries[0];pastHero=!e.isIntersecting&&e.boundingClientRect.top<0;updateSticky();},{threshold:0}).observe(cta);
      const offerButton=$('#offer [data-buy]');
      if(offerButton)new IntersectionObserver(entries=>{offerVisible=entries[0].isIntersecting;updateSticky();},{threshold:0}).observe(offerButton);
      new IntersectionObserver(entries=>{footerVisible=entries[0].isIntersecting;updateSticky();},{threshold:0}).observe($('footer'));
    }}
})();
