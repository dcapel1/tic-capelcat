/* InformàTICa · Portal educatiu estàtic. Sense llibreries ni serveis de tercers. */
(() => {
  'use strict';
  const resources = Array.isArray(window.INFORMATICA_RECURSOS) ? window.INFORMATICA_RECURSOS : [];
  const labels = {
    inicial: '1r i 2n', mitja: '3r i 4t', superior: '5è i 6è'
  };
  const categoryLabels = {
    matematiques: {label:'Matemàtiques',icon:'🔢'},
    logica: {label:'Lògica',icon:'🧩'},
    creativitat: {label:'Dibuix i creativitat',icon:'🎨'},
    mecanografia: {label:'Mecanografia',icon:'⌨️'},
    programacio: {label:'Programació',icon:'🧱'},
    robotica: {label:'Robòtica',icon:'🤖'},
    seguretat: {label:'Seguretat digital',icon:'🛡️'},
    disseny3d: {label:'Disseny 3D',icon:'🧊'},
    especials: {label:'Especials',icon:'🌟'},
    ciencies: {label:'Ciències',icon:'🔬'},
    catala: {label:'Català',icon:'📖'},
    castella: {label:'Castellà',icon:'🔤'},
    angles: {label:'Anglès',icon:'🇬🇧'},
    medi: {label:'Coneixement del medi',icon:'🌱'},
    geografia: {label:'Geografia',icon:'🌍'}
  };
  const categoryOrder = ['matematiques','logica','creativitat','mecanografia','programacio','robotica','ciencies','medi','catala','castella','angles','geografia','seguretat','disseny3d','especials'];
  const state = { cycle:null,category:'totes',device:'tots',query:'' };
  const el = id => document.getElementById(id);
  const search = el('cerca');
  const section = el('explora');
  const grid = el('resource-grid');
  const categoryRoot = el('categories');
  const shortcut = document.querySelector('.shortcut');
  const sanitize = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const escape = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const safeHref = url => /^https:\/\/[^\s<>"']+$/i.test(url) ? url : '#';
  const cycleFilter = item => !state.cycle || item.cicles.includes(state.cycle);
  const searchFilter = item => {
    if (!state.query.trim()) return true;
    const words = sanitize(state.query).split(/\s+/).filter(Boolean);
    const categories = item.categories.map(id=>categoryLabels[id]?.label || id).join(' ');
    const haystack = sanitize([item.nom,item.descripcio,item.proveidor,categories,item.cicles.map(k=>labels[k]).join(' ')].join(' '));
    return words.every(word => haystack.includes(word));
  };
  const itemFilter = item => cycleFilter(item)
    && (state.category === 'totes' || item.categories.includes(state.category))
    && (state.device === 'tots' || state.device === 'tablet' && item.dispositiu === 'both' || state.device === 'pc' && ['pc','both'].includes(item.dispositiu))
    && searchFilter(item);
  function setRoute(cycle) {
    const url = cycle ? '#cicle-' + cycle : '#inici';
    try { history.replaceState(null,'',url); } catch { location.hash = url; }
  }
  function selectCycle(cycle, scroll = true) {
    if (!Object.hasOwn(labels,cycle)) return;
    state.cycle = cycle;
    state.category = 'totes'; state.device = 'tots'; state.query=''; search.value='';
    setRoute(cycle); render();
    if (scroll) section.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function goHome() {
    state.cycle=null;state.category='totes';state.device='tots';state.query='';search.value='';
    setRoute(null);render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function allCategoryOptions() {
    const base = resources.filter(cycleFilter);
    return categoryOrder.filter(k=>base.some(x=>x.categories.includes(k)));
  }
  function renderCategories() {
    const list=allCategoryOptions();
    if (state.category !== 'totes' && !list.includes(state.category)) state.category='totes';
    categoryRoot.replaceChildren();
    const options = [{id:'totes',label:'Totes les activitats',icon:'✨'},...list.map(id=>({id,...categoryLabels[id]}))];
    for (const opt of options) {
      const btn=document.createElement('button');
      btn.type='button';btn.className='chip'+(state.category===opt.id?' active':'');
      btn.setAttribute('aria-pressed',String(state.category===opt.id));
      btn.innerHTML='<span class="chip-icon" aria-hidden="true">'+escape(opt.icon)+'</span>'+escape(opt.label);
      btn.addEventListener('click',()=>{state.category=opt.id;render();});
      categoryRoot.append(btn);
    }
  }
  function card(item) {
    const anchor=document.createElement('a');
    anchor.className='resource-card';
    anchor.href=safeHref(item.url);
    anchor.target='_blank';anchor.rel='noopener noreferrer';
    anchor.setAttribute('aria-label',`Obre ${item.nom} en una pestanya nova`);
    const badges = item.dispositiu === 'pc'
      ? '<span class="device-tag">💻 Ordinador</span>'
      : '<span class="device-tag">📱💻 Tauleta i PC</span>';
    const keyboard = item.teclat ? '<span class="device-tag keyboard">⌨️ Teclat</span>' : '';
    const account = item.avis_compte ? '<span class="device-tag account">👤 Pot demanar compte</span>' : '';
    const category=item.categories[0];
    anchor.innerHTML=`
      <div class="resource-illustration tone-${escape(item.estil)}"><span class="illustration-bubble"></span><span class="resource-emoji" aria-hidden="true">${escape(item.icona)}</span></div>
      <div class="resource-content">
        <div class="resource-kicker">${escape(categoryLabels[category]?.label||category)}</div>
        <h3 class="resource-name">${escape(item.nom)}</h3>
        <p class="resource-desc">${escape(item.descripcio)}</p>
        <div class="resource-tags">${badges}${keyboard}${account}</div>
        <div class="resource-footer"><span class="resource-provider">${escape(item.proveidor)}</span><span class="resource-open">Obrir activitat <span aria-hidden="true">↗</span></span></div>
      </div>`;
    return anchor;
  }
  function render() {
    const query = state.query.trim();
    const searchingGlobally = !state.cycle && !!query;
    document.body.classList.toggle('search-mode',searchingGlobally);
    section.hidden=!(state.cycle||searchingGlobally);
    document.querySelectorAll('[data-cycle]').forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.cycle===state.cycle)));
    for (const c of Object.keys(labels)) {
      const n=resources.filter(x=>x.cicles.includes(c)).length;
      document.querySelector(`[data-count="${c}"]`).textContent=`${n} activitats`;
    }
    el('neteja-cerca').hidden=!query;
    shortcut.hidden=!!query;
    if (section.hidden) return;
    el('explore-kicker').textContent=searchingGlobally?'CERCA A TOTS ELS CICLES':'EL TEU ESPAI DE JOCS';
    el('explore-title').textContent=searchingGlobally?'Això és el que hem trobat 🔎':`Activitats de ${labels[state.cycle]} ✨`;
    el('explore-subtitle').textContent=searchingGlobally?'Busca recursos per a tots els cursos.':'Tria una matèria i comença a descobrir activitats.';
    el('canvia-cicle').hidden=searchingGlobally;
    renderCategories();
    document.querySelectorAll('[data-device]').forEach(btn=>{
      const pressed=state.device===btn.dataset.device;
      btn.classList.toggle('active',pressed);btn.setAttribute('aria-pressed',String(pressed));
    });
    const matches=resources.filter(itemFilter).sort((a,b)=>a.ordre-b.ordre);
    grid.replaceChildren(...matches.map(card));
    el('no-results').hidden=matches.length!==0;
    el('result-count').textContent=matches.length===1?'1 activitat':`${matches.length} activitats`;
  }
  document.querySelectorAll('[data-cycle]').forEach(btn=>btn.addEventListener('click',()=>selectCycle(btn.dataset.cycle)));
  el('torna-inici').addEventListener('click',goHome);
  el('marca').addEventListener('click',e=>{e.preventDefault();goHome();});
  el('canvia-cicle').addEventListener('click',()=>el('tria-cicle').scrollIntoView({behavior:'smooth',block:'start'}));
  document.querySelectorAll('[data-device]').forEach(btn=>btn.addEventListener('click',()=>{state.device=btn.dataset.device;render();}));
  function resetFilters(){state.category='totes';state.device='tots';state.query='';search.value='';render();}
  el('neteja-filtres').addEventListener('click',resetFilters);
  el('empty-reset').addEventListener('click',resetFilters);
  el('neteja-cerca').addEventListener('click',()=>{state.query='';search.value='';render();search.focus();});
  search.addEventListener('input',()=>{
    state.query=search.value;
    // A la portada, el cercador mostra directament els resultats sense triar cicle.
    render();
  });
  search.addEventListener('keydown',event=>{if(event.key==='Escape'){state.query='';search.value='';render();search.blur();}});
  document.addEventListener('keydown',event=>{
    if ((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k') {event.preventDefault();search.focus();search.select();}
  });
  function routeFromHash() {
    const match=location.hash.match(/^#cicle-(inicial|mitja|superior)$/);
    if(match){state.cycle=match[1];state.category='totes';state.device='tots';render();if(document.readyState !== 'loading') requestAnimationFrame(()=>section.scrollIntoView({behavior:'instant',block:'start'}));}
  }
  window.addEventListener('hashchange',routeFromHash);
  if (!resources.length) {
    // L'error s'indica també a la portada en lloc de mostrar una interfície buida.
    el('cycles-title').textContent='No s’ha pogut carregar el catàleg';
    document.querySelectorAll('[data-cycle]').forEach(b=>b.disabled=true);
  } else {routeFromHash();render();}
})();
