(function (root, factory) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const api = factory(node ? require('./escape-proa-puzzles.js') : root.EscapeProaPatioPuzzles);
  if (node) module.exports = api;
  else { root.EscapeProaPatio = api; api.start(document); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Puzzles) {
  'use strict';
  const IDS = ['emblem', 'pipes', 'shadows'];
  const WIDTH = 1280, HEIGHT = 720, WORLD_WIDTH = 1910, GROUND = 606;
  const KEY = 'escape-proa:completo:v3';
  const WAYPOINTS = [352, 700, 1030, 1300, 1510, 1030, 650, 260];
  const OBJECTS = [
    [{id:'emblem',x:258,y:439,w:76,h:32,hitW:80,hitH:48,target:205,label:'Libro de proyectos sobre el banco'}, {id:'pipes',x:690,y:414,w:100,h:70,hitW:100,hitH:70,target:610,label:'Canilla del cantero'}, {id:'shadows',x:1070,y:410,w:120,h:48,hitW:120,hitH:48,target:990,label:'Etiqueta del cantero'}],
    [{id:'emblem',x:1408,y:265,w:76,h:105,hitW:76,hitH:105,target:1330,label:'Cartel de la mascota escolar'}, {id:'pipes',x:1259,y:258,w:178,h:94,hitW:178,hitH:94,target:1180,label:'Experimento de espejos en la vitrina'}, {id:'shadows',x:920,y:378,w:110,h:62,hitW:110,hitH:62,target:850,label:'Partitura sobre la repisa'}],
    [{id:'emblem',x:1280,y:373,w:76,h:58,hitW:76,hitH:58,target:1205,label:'Robot sobre el escritorio'}, {id:'pipes',x:495,y:365,w:88,h:54,hitW:88,hitH:54,target:420,label:'Pantalla de materias'}, {id:'shadows',x:872,y:365,w:88,h:54,hitW:88,hitH:54,target:795,label:'Pantalla de discos'}]
  ];
  const OBJECT_TYPES = [
    {emblem:{symbol:'▤',type:'pregunta sobre proyectos'},pipes:{symbol:'⌇',type:'riego del cantero'},shadows:{symbol:'?',type:'palabra incompleta'}},
    {emblem:{symbol:'?',type:'pregunta sobre proyectos'},pipes:{symbol:'✦',type:'luz desviada'},shadows:{symbol:'♪',type:'pequeña orquesta'}},
    {emblem:{symbol:'▣',type:'ruta del robot'},pipes:{symbol:'⌁',type:'conexiones de PROA'},shadows:{symbol:'◎',type:'discos enlazados'}}
  ];
  const DIALOGUES = {
    intro: ['Un pequeño gato gris se encuentra perdido en un lugar desconocido.', 'Para encontrar la salida, necesitará tu ayuda.', 'Resuelve los acertijos, consigue las llaves y acompáñalo a través de cada habitación.', '¡Su aventura comienza ahora!'],
    room: ['¡Felicidades! Has superado la primera habitación. ¡Sigamos adelante!'], middle: ['¡Muy bien! Una habitación más superada. ¡Ya falta menos!'], last: ['¡Lo lograste! Has encontrado el camino hacia la salida.'], final: ['Después de atravesar tantas habitaciones, resolver acertijos y encontrar las llaves, el pequeño gato finalmente llegó a la salida. Había recorrido un camino largo en un lugar desconocido, sin saber qué le esperaba del otro lado.', 'Uy, hola. ¿Estás perdido? No pasa nada, ahora ya estás conmigo.', 'El gato ya no tenía que seguir buscando una salida ni recorrer solo aquel lugar desconocido.', 'Alguien lo había encontrado y estaba dispuesto a cuidarlo.', 'Quizás había comenzado su aventura por accidente, pero gracias a todo lo que había superado, su historia terminaba de una manera que nunca habría imaginado: con un lugar seguro, compañía y un nuevo hogar.', 'Y así, aquel pequeño gato gris descubrió que, a veces, el final de una aventura puede ser también el comienzo de una nueva vida.']
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const exitGround = x => GROUND + 42 * Math.sin(Math.PI * clamp((x - 1535) / 235, 0, 1));
  const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
  const solvedCount = snapshot => IDS.filter(id => Puzzles.isSolved(snapshot, id)).length;
  function newSnapshot(sound = true, room = 0) {
    return {version:3,room,phase:'explore',cat:{x:260,dir:1,waypoint:0,wait:1.8},camera:{x:0,mode:'follow'},dialog:{id:'intro',page:0,chars:0},activePuzzle:null,inspection:null,sound:Boolean(sound),puzzles:Puzzles.newPuzzleSnapshot(room)};
  }
  function advanceInspection(inspection, catX, dt, room=0) {
    if (!inspection) return null;
    const object = OBJECTS[room].find(item => item.id === inspection.id);
    if (!object || !finite(catX,0,WORLD_WIDTH) || !finite(dt,0,1)) return null;
    if (inspection.stage === 'approach') return Math.abs(catX-object.target) <= 1.5 ? {id:inspection.id,stage:'gesture',elapsed:0} : inspection;
    const elapsed = Math.min(1.5,inspection.elapsed + dt);
    return elapsed >= 1.5 ? {id:inspection.id,stage:'open',elapsed} : {id:inspection.id,stage:'gesture',elapsed};
  }
  function sanitizeGameSnapshot(raw) {
    if (!raw || raw.version !== 3 || !Number.isInteger(raw.room) || raw.room < 0 || raw.room > 2 || !['explore','unlock','depart','ending','sleep','review'].includes(raw.phase) || !raw.cat || !finite(raw.cat.x,0,WORLD_WIDTH) || ![1,-1].includes(raw.cat.dir) || !Number.isInteger(raw.cat.waypoint) || !finite(raw.cat.waypoint,0,WAYPOINTS.length-1) || !finite(raw.cat.wait,0,10) || !raw.camera || !finite(raw.camera.x,0,WORLD_WIDTH-WIDTH) || !['follow','free'].includes(raw.camera.mode) || typeof raw.sound !== 'boolean' || (raw.activePuzzle !== null && !IDS.includes(raw.activePuzzle))) return null;
    const puzzles = Puzzles.sanitizePuzzleSnapshot(raw.puzzles,raw.room);
    if (!puzzles) return null;
    let dialog = null;
    if (raw.dialog !== null) {
      const d = raw.dialog;
      if (!d || !Object.hasOwn(DIALOGUES,d.id) || !Number.isInteger(d.page) || !finite(d.page,0,DIALOGUES[d.id].length-1) || !Number.isInteger(d.chars) || !finite(d.chars,0,DIALOGUES[d.id][d.page].length)) return null;
      dialog = {id:d.id,page:d.page,chars:d.chars};
    }
    let inspection = null;
    if (raw.inspection !== undefined && raw.inspection !== null) {
      const value = raw.inspection;
      if (!value || !IDS.includes(value.id) || !['approach','gesture'].includes(value.stage) || !finite(value.elapsed,0,1.5)) return null;
      const object = OBJECTS[raw.room].find(item=>item.id===value.id);
      inspection = value.stage === 'gesture' && Math.abs(raw.cat.x-object.target)>1.5 ? {id:value.id,stage:'approach',elapsed:0} : {id:value.id,stage:value.stage,elapsed:value.elapsed};
    }
    if ((dialog && raw.activePuzzle) || (inspection && (dialog || raw.activePuzzle || raw.phase !== 'explore'))) return null;
    const all = solvedCount(puzzles) === 3;
    if (['room','middle','last','final'].includes(dialog?.id) && !all) return null;
    if (raw.phase !== 'explore' && (!all || (dialog && raw.phase !== 'ending') || raw.activePuzzle || inspection)) return null;
    const phase = raw.phase === 'explore' && all && !dialog && !raw.activePuzzle && !inspection ? 'unlock' : raw.phase;
    return {version:3,room:raw.room,phase,cat:{x:raw.cat.x,dir:raw.cat.dir,waypoint:raw.cat.waypoint,wait:raw.cat.wait},camera:{x:raw.camera.x,mode:raw.camera.mode},dialog,activePuzzle:raw.activePuzzle,inspection,sound:raw.sound,puzzles};
  }
  function advanceDialogue(dialog) {
    const text = DIALOGUES[dialog.id][dialog.page];
    if (dialog.chars < text.length) return {...dialog,chars:text.length};
    return dialog.page + 1 < DIALOGUES[dialog.id].length ? {id:dialog.id,page:dialog.page+1,chars:0} : null;
  }

  function focusAfterDialogue(doc, phase) {
    const target = phase === 'explore' ? doc.querySelector('#hotspots [data-puzzle]') : doc.getElementById('pause');
    target?.focus({preventScroll:true});
  }

  async function start(doc) {
    const $ = id => doc.getElementById(id);
    const canvas = $('world'), ctx = canvas.getContext('2d');
    const stage = $('stage'), hotspotButtons = Array.from(doc.querySelectorAll('[data-puzzle]'));
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let state = null, saved = null, assets = null, puzzleUI = null, ready = false, paused = false;
    let velocity = 0, walkDistance = 0, idleTime = 0, turnTime = 0, sequenceTime = 0, arrivalTime = null, lastFrame = performance.now(), saveElapsed = 0, textElapsed = 0, solvedExitTimer = 0;
    let drag = null, switching = false, resumeFocus = null, soundPreference = true, hoveredId = null;
    const cameraKeys = new Set();
    const paths = new Map();
    const notice = text => { $('notice').textContent = text; };
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) { try { saved = sanitizeGameSnapshot(JSON.parse(raw)); } catch (_) { saved = null; } }
      if (raw && !saved) notice('No se pudo recuperar la partida anterior. Podés empezar una nueva.');
    } catch (_) { notice('El navegador no permite guardar en esta pestaña. Podés jugar igual.'); }
    soundPreference = saved ? saved.sound : true;
    const audio = createAudio(notice);
    function persist() {
      if (!state) return;
      state.puzzles = puzzleUI ? puzzleUI.getSnapshot() : state.puzzles;
      try { sessionStorage.setItem(KEY,JSON.stringify(state)); saved = sanitizeGameSnapshot(state); }
      catch (_) { notice('No se pudo guardar. Podés seguir jugando; evitá recargar esta pestaña.'); }
    }
    function inputBlocked() { return !state || paused || doc.hidden || Boolean(state.dialog) || Boolean(state.activePuzzle) || Boolean(state.inspection) || state.phase !== 'explore'; }
    function refresh() {
      const playing = Boolean(state);
      doc.body.dataset.mode = playing ? 'playing' : 'welcome';
      $('hud').hidden = !playing; $('start-screen').hidden = playing;
      $('pause-screen').hidden = !playing || !paused || state.phase === 'review';
      $('review-screen').hidden = !playing || state.phase !== 'review';
      $('hotspots').hidden = !playing || state.phase !== 'explore' || paused || Boolean(state.dialog) || Boolean(state.activePuzzle) || Boolean(state.inspection);
      $('dialogue').hidden = !playing || !state.dialog || paused;
      stage.classList.toggle('conversing',playing && Boolean(state.dialog));
      stage.inert = Boolean(playing && state.activePuzzle);
      $('follow').hidden = !playing || state.phase !== 'explore' || Boolean(state.activePuzzle) || Boolean(state.dialog) || paused;
      $('follow').disabled = !playing || state.camera.mode === 'follow';
      $('follow').textContent = playing && state.camera.mode === 'free' ? 'Seguir al gato' : 'Siguiendo al gato';
      $('pause').textContent = paused ? 'Continuar' : 'Pausar'; $('pause').setAttribute('aria-pressed',String(paused));
      $('sound').textContent = soundPreference ? 'Sonido: sí' : 'Sonido: no'; $('sound').setAttribute('aria-pressed',String(soundPreference));
      $('continue').hidden = !saved; $('continue').disabled = !ready || !saved; $('new-game').disabled = !ready;
      if (playing) {
        const count = solvedCount(state.puzzles);
        const room = ['patio','pasillo','taller'][state.room];
        const scene = ['ending','sleep','review'].includes(state.phase) ? 'biblioteca' : room;
        $('room-label').textContent = ['PATIO · LA ÚLTIMA LUZ','PASILLO · EL CAMINO','TALLER · LA SALIDA'][state.room]; $('progress').textContent = count + ' / 3'; $('progress').setAttribute('aria-label',count+' de 3 mecanismos resueltos');
        canvas.setAttribute('aria-label',scene[0].toUpperCase()+scene.slice(1)+' al atardecer. El gato camina automáticamente. Usá las flechas para mirar y Tab para explorar un objeto.');
        $('hotspots').setAttribute('aria-label','Objetos del '+room);
        const reward=['caja de materiales','vitrina de proyectos','cajón de herramientas'][state.room];
        $('objective-text').textContent = state.phase === 'explore' ? (count === 3 ? 'Los tres cierres están libres.' : state.inspection ? 'El gato investiga el '+room+'.' : state.camera.mode === 'free' ? 'El gato espera mientras mirás el '+room+'.' : 'Recorré el '+room+' y prestá atención a los detalles.') : state.phase === 'unlock' ? 'La '+reward+' se abre. Acompañalo a buscar la llave.' : state.phase === 'depart' ? 'La llave está con él. La puerta lo espera.' : 'El gato encontró compañía en la biblioteca.';
        $('controls-help').textContent = state.dialog ? 'Clic / Enter / Espacio · completar la frase y avanzar' : state.phase === 'explore' ? '← → o arrastrar · mirar el '+room+' · Tab y Enter · observar' : 'El gato continúa su camino.';
      } else $('controls-help').textContent = 'Una aventura para mirar, pensar y acompañar.';
      puzzleUI?.setPaused(paused || doc.hidden);
      audio.setActive(playing && !paused && !doc.hidden && state.phase !== 'review');
      updateDialogue();
    }
    function updateDialogue() {
      if (!state || !state.dialog) return;
      const d = state.dialog, text = DIALOGUES[d.id][d.page]; $('speaker').textContent = d.id === 'final' && d.page === 1 ? 'Alumno' : 'Narrador';
      $('dialogue-visual').textContent = text.slice(0,d.chars);
      if ($('dialogue-readable').textContent !== text) $('dialogue-readable').textContent = text;
    }
    function setDialogue(id) {
      state.dialog = {id,page:0,chars:reducedMotion.matches ? DIALOGUES[id][0].length : 0}; textElapsed = 0;
      refresh(); $('dialogue').focus({preventScroll:true}); persist();
    }
    function advance() {
      if (!state?.dialog || paused || doc.hidden) return;
      const previousId = state.dialog.id;
      state.dialog = advanceDialogue(state.dialog);
      if (state.dialog && reducedMotion.matches) state.dialog.chars = DIALOGUES[state.dialog.id][state.dialog.page].length;
      textElapsed = 0;
      if (!state.dialog && ['room','middle','last'].includes(previousId)) { state.phase = 'unlock'; state.camera.mode = 'follow'; sequenceTime = 0; arrivalTime = null; audio.cue('chest'); }
      if (!state.dialog && previousId === 'final') { state.phase='sleep'; sequenceTime=0; }
      refresh(); if (!state.dialog) focusAfterDialogue(doc,state.phase); persist();
    }
    function activate(snapshot) {
      if (!snapshot) return;
      solvedExitTimer=0;
      switching = true;
      puzzleUI.close(); puzzleUI.setRoom(snapshot.room); puzzleUI.restore(snapshot.puzzles);
      state = clone(snapshot); paused = false; cameraKeys.clear(); velocity = 0; turnTime = 0; sequenceTime = 0; arrivalTime = null; idleTime = 0;
      switching = false;
      notice('');
      soundPreference = state.sound; audio.setEnabled(soundPreference); audio.unlock();
      const active = state.activePuzzle; state.activePuzzle = null; refresh();
      $('exit-fade').classList.toggle('visible',state.phase === 'review');
      if (state.phase === 'review') $('replay').focus({preventScroll:true});
      else if (active) {openPuzzle(active);if(solvedCount(state.puzzles)===3 && Puzzles.isSolved(state.puzzles,active))solvedExitTimer=1.8;}
      else if (state.dialog) $('dialogue').focus({preventScroll:true});
      persist();
    }
    function openPuzzle(id) {
      if (!state || paused || doc.hidden || state.dialog || state.activePuzzle || state.phase !== 'explore') return;
      state.activePuzzle = id; cameraKeys.clear(); velocity = 0;
      state.camera.x = clamp(OBJECTS[state.room].find(o=>o.id===id).x-WIDTH/2,0,WORLD_WIDTH-WIDTH);
      refresh(); puzzleUI.open(id); persist();
    }
    function inspectObject(id) {
      if (inputBlocked() || !OBJECTS[state.room].some(object=>object.id===id)) return;
      if (Puzzles.isSolved(state.puzzles,id)) { openPuzzle(id); return; }
      state.inspection={id,stage:'approach',elapsed:0}; state.camera.mode='follow'; state.cat.wait=0; cameraKeys.clear(); velocity=0;
      refresh(); persist();
    }
    function inspectAt(x) {
      if (inputBlocked()) return;
      state.camera.mode = 'free'; state.camera.x = clamp(x,0,WORLD_WIDTH-WIDTH); velocity = 0; refresh();
    }
    puzzleUI = Puzzles.createPuzzleUI($('puzzle-panel'),{
      onChange(snapshot) { if (state && !switching) { state.puzzles = snapshot; persist(); } },
      onSolved(id,snapshot) { if (!state || switching) return; state.puzzles = snapshot; if(solvedCount(snapshot)===3)solvedExitTimer=1.8; notice('Un cierre de la '+['caja','vitrina','cajón'][state.room]+' quedó libre.'); refresh(); persist(); },
      onSound(cue) { audio.cue(cue); },
      onClose() {
        if (!state || switching) return;
        solvedExitTimer=0;
        const closedId = state.activePuzzle;
        state.activePuzzle = null; state.cat.wait = 4; velocity = 0; refresh();
        if (state.phase === 'explore' && solvedCount(state.puzzles) === 3 && !state.dialog) {state.phase='unlock';state.camera.mode='follow';sequenceTime=0;arrivalTime=null;audio.cue('chest');refresh();}
        else if (closedId) hotspotButtons.find(button=>button.dataset.puzzle===closedId)?.focus({preventScroll:true});
        persist();
      }
    });
    $('new-game').addEventListener('click',()=>activate(newSnapshot(soundPreference)));
    $('continue').addEventListener('click',()=>{ if (saved) activate(sanitizeGameSnapshot(saved)); });
    $('replay').addEventListener('click',()=>activate(newSnapshot(soundPreference)));
    $('retry').addEventListener('click',()=>location.reload());
    $('dialogue').addEventListener('click',advance);
    $('follow').addEventListener('click',()=>{ if (!inputBlocked()) { state.camera.mode='follow'; refresh(); persist(); } });
    function togglePause() {
      if (!state || state.phase === 'review') return;
      paused = !paused; cameraKeys.clear(); velocity = 0;
      if (paused) resumeFocus = doc.activeElement;
      refresh(); persist();
      if (paused && !state.activePuzzle) $('resume').focus();
      else if (!paused && resumeFocus && !state.activePuzzle) resumeFocus.focus({preventScroll:true});
    }
    $('pause').addEventListener('click',togglePause); $('resume').addEventListener('click',togglePause);
    $('sound').addEventListener('click',()=>{ soundPreference=!soundPreference; if (state) state.sound=soundPreference; audio.setEnabled(soundPreference); audio.unlock(); refresh(); persist(); });
    $('music-volume').addEventListener('input',event=>audio.setMusicVolume(Number(event.target.value)/100));
    $('effects-volume').addEventListener('input',event=>audio.setEffectsVolume(Number(event.target.value)/100));
    $('menu').addEventListener('click',()=>{ if (!state) return; persist(); state=null; paused=false; cameraKeys.clear(); puzzleUI.close(); stage.inert=false; refresh(); $('continue').focus(); });
    $('fullscreen').addEventListener('click',async()=>{
      try { if (doc.fullscreenElement) await doc.exitFullscreen(); else await doc.documentElement.requestFullscreen(); }
      catch (_) { notice('El navegador no pudo abrir la pantalla completa. Podés seguir en esta ventana.'); }
    });
    doc.addEventListener('fullscreenchange',()=>{ $('fullscreen').textContent=doc.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa'; });
    hotspotButtons.forEach(button=>{
      button.addEventListener('click',()=>inspectObject(button.dataset.puzzle));
      button.addEventListener('focus',()=>{
        hoveredId=button.dataset.puzzle;
        if (inputBlocked()) return;
        const object=OBJECTS[state.room].find(o=>o.id===button.dataset.puzzle);
        if (object.x<state.camera.x+60 || object.x>state.camera.x+WIDTH-60) inspectAt(object.x-WIDTH/2);
      });
      button.addEventListener('blur',()=>{ if(doc.activeElement!==button) hoveredId=null; });
      button.addEventListener('pointerenter',()=>{ hoveredId=button.dataset.puzzle; });
      button.addEventListener('pointerleave',()=>{ hoveredId=null; });
    });
    canvas.addEventListener('pointerdown',event=>{
      if (inputBlocked() || event.button!==0) return;
      drag={start:event.clientX,camera:state.camera.x}; canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove',event=>{
      if (!drag || inputBlocked()) return;
      const delta=(event.clientX-drag.start)*WIDTH/canvas.getBoundingClientRect().width;
      if (Math.abs(delta)>3) inspectAt(drag.camera-delta);
    });
    const release=()=>{ if (drag) persist(); drag=null; };
    canvas.addEventListener('pointerup',release); canvas.addEventListener('pointercancel',release);
    doc.addEventListener('keydown',event=>{
      if (!state || state.activePuzzle) return;
      if (state.dialog && !paused && ['Enter',' '].includes(event.key) && (!event.target.closest('button,a') || event.target.closest('#dialogue'))) { event.preventDefault(); if (!event.repeat) advance(); return; }
      if (event.key==='Escape' && !event.repeat) { event.preventDefault(); togglePause(); return; }
      if (inputBlocked()) return;
      if (['ArrowLeft','ArrowRight','a','d','A','D'].includes(event.key)) { event.preventDefault(); cameraKeys.add(event.key.toLowerCase()); state.camera.mode='free'; refresh(); }
    });
    doc.addEventListener('keyup',event=>cameraKeys.delete(event.key.toLowerCase()));
    window.addEventListener('blur',()=>{ cameraKeys.clear(); drag=null; persist(); });
    doc.addEventListener('visibilitychange',()=>{ cameraKeys.clear(); drag=null; lastFrame=performance.now(); refresh(); persist(); });
    window.addEventListener('pagehide',persist);

    try {
      const images=await Promise.all(['patio-atardecer','gato-caminar-6','gato-reposo','gato-investigar','pasillo-atardecer-v2','taller-atardecer','biblioteca-atardecer','final-libertad','alumno','gato-girar','gato-giro-puerta','gato-caminar-espalda'].map(name=>new Promise((resolve,reject)=>{
        const image=new Image(); image.onload=()=>resolve(image); image.onerror=()=>reject(new Error('No se pudo cargar '+name)); image.src='../../static/escape-proa/'+name+'.png';
      })));
      assets={backgrounds:[images[0],images[4],images[5]],ending:images[6],finale:images[7],student:cutout(images[8]),turn:calibrate(images[9],4,1),doorTurn:calibrate(images[10],4,1,null,[0,650,1198,1687,2172]),backWalk:calibrate(images[11],4,1),walk:calibrate(images[1],6,1),idle:calibrate(images[2],4,1),inspect:calibrate(images[3],4,1)};
      ready=true; $('loading-status').textContent='Podés tomarte tu tiempo.'; refresh();
    } catch (error) {
      $('loading-status').textContent='No se pudieron cargar los recursos del patio. Volvé a cargar la página.'; $('retry').hidden=false;
      console.error('Escape PROA:',error); return;
    }
    function cutout(image) {
      const c=doc.createElement('canvas');c.width=image.width;c.height=image.height;const cctx=c.getContext('2d',{willReadFrequently:true});cctx.drawImage(image,0,0);const data=cctx.getImageData(0,0,c.width,c.height);let left=c.width,right=0,top=c.height,bottom=0;
      for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(data.data[i+3]<200)data.data[i+3]=0;else{left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}}
      cctx.putImageData(data,0,0);return {image:c,sx:left,sy:top,w:right-left,h:bottom-top};
    }
    function calibrate(image,cols,rows,rowCuts=null,colCuts=null) {
      const helper=doc.createElement('canvas'); helper.width=image.width; helper.height=image.height;
      const hctx=helper.getContext('2d',{willReadFrequently:true}); hctx.drawImage(image,0,0);
      const pixels=hctx.getImageData(0,0,image.width,image.height).data;
      const frames=[];
      for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) {
        const x0=colCuts ? colCuts[col] : Math.round(col*image.width/cols),x1=colCuts ? colCuts[col+1] : Math.round((col+1)*image.width/cols),y0=rowCuts ? rowCuts[row] : Math.round(row*image.height/rows),y1=rowCuts ? rowCuts[row+1] : Math.round((row+1)*image.height/rows);
        let left=x1,right=x0,top=y1,bottom=y0;
        for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++) if(pixels[(y*image.width+x)*4+3]>=160) {left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
        if(right<=left || bottom<=top) throw new Error('Fotograma de gato vacío.');
        frames.push({sx:left,sy:top,w:right-left,h:bottom-top,bx:left-x0,by:top-y0});
      }
      const neutral=frames[0];
      return {image,frames,scale:76/neutral.h,anchorX:neutral.bx+neutral.w/2};
    }
    function approach(target,dt,speed) {
      const distance=target-state.cat.x;
      if(turnTime>0){turnTime=Math.max(0,turnTime-dt);velocity=0;return false;}
      if(Math.abs(distance)>1.5 && Math.sign(distance)!==state.cat.dir){state.cat.dir=Math.sign(distance);turnTime=reducedMotion.matches?0:.45;velocity=0;return false;}
      const targetSpeed=Math.sign(distance)*Math.min(speed,Math.sqrt(90*Math.abs(distance)));
      velocity+=(targetSpeed-velocity)*(1-Math.exp(-dt*7));
      if(Math.abs(distance)<1.5) {state.cat.x=target;velocity=0;return true;}
      state.cat.dir=distance>=0?1:-1;
      const step=velocity*dt;
      const actualStep=Math.sign(step)===Math.sign(distance)?Math.sign(step)*Math.min(Math.abs(step),Math.abs(distance)):0;
      state.cat.x+=actualStep; walkDistance+=Math.abs(actualStep); return false;
    }
    function update(dt) {
      idleTime+=dt;
      if(!state || paused || doc.hidden) return;
      if(state.activePuzzle && solvedExitTimer>0){solvedExitTimer-=dt;if(solvedExitTimer<=0){solvedExitTimer=0;puzzleUI.close();}}
      if(state.dialog) {
        if(reducedMotion.matches) state.dialog.chars=DIALOGUES[state.dialog.id][state.dialog.page].length;
        else {
          textElapsed+=dt;
          const text=DIALOGUES[state.dialog.id][state.dialog.page];
          while(textElapsed>=.035 && state.dialog.chars<text.length) {textElapsed-=.035;const char=text[state.dialog.chars++];if(state.dialog.chars%2===0 && /[\p{L}\p{N}]/u.test(char)) audio.cue(state.dialog.id==='final' && state.dialog.page===1 ? 'student' : 'voice');if(/[.,!?:]/.test(char))textElapsed-=.11;}
        }
        updateDialogue();
      } else if(!state.activePuzzle && state.phase==='explore') {
        if(state.inspection) {
          const object=OBJECTS[state.room].find(item=>item.id===state.inspection.id);
          if(state.inspection.stage==='approach' && approach(object.target,dt,140)) state.cat.dir=1;
          const next=advanceInspection(state.inspection,state.cat.x,dt,state.room);
          state.inspection=next;
          if(next?.stage==='gesture') { state.cat.x=object.target; state.cat.dir=1; velocity=0; }
          if(next?.stage==='open') { const id=next.id; state.inspection=null; openPuzzle(id); }
        }
        else if(state.camera.mode==='free') {
          velocity=0;
          const axis=(cameraKeys.has('arrowright')||cameraKeys.has('d')?1:0)-(cameraKeys.has('arrowleft')||cameraKeys.has('a')?1:0);
          state.camera.x=clamp(state.camera.x+axis*300*dt,0,WORLD_WIDTH-WIDTH);
        } else if(state.cat.wait>0) {state.cat.wait=Math.max(0,state.cat.wait-dt);velocity=0;}
        else if(approach(WAYPOINTS[state.cat.waypoint],dt,72)) {state.cat.wait=1.2+(state.cat.waypoint%3)*.35;state.cat.waypoint=(state.cat.waypoint+1)%WAYPOINTS.length;}
      } else if(state.phase==='unlock') {
        sequenceTime+=dt;
        if(approach(1585,dt,90)) { if(arrivalTime===null) {arrivalTime=sequenceTime;audio.cue('key');} if(sequenceTime-arrivalTime>1.1 && sequenceTime>2.5) {state.phase='depart';sequenceTime=0;arrivalTime=null;audio.cue('door');refresh();persist();} }
      } else if(state.phase==='depart') {
        sequenceTime+=dt;
        if(approach(state.room===2?1776:1797,dt,85)) {
          if(arrivalTime===null) arrivalTime=sequenceTime;
          if(sequenceTime-arrivalTime>2.35) $('exit-fade').classList.add('visible');
          if(sequenceTime-arrivalTime>3.55) { if(state.room<2) { const room=state.room+1; const sound=state.sound; state=newSnapshot(sound,room); state.dialog=null; puzzleUI.setRoom(room); puzzleUI.restore(state.puzzles); sequenceTime=0; arrivalTime=null; $('exit-fade').classList.remove('visible'); refresh(); persist(); } else {state.phase='ending'; state.camera.x=0; $('exit-fade').classList.remove('visible'); setDialogue('final');} }
        }
      } else if(state.phase==='sleep') { sequenceTime+=dt; if(sequenceTime>7.2){state.phase='review';refresh();$('replay').focus();persist();} } else velocity=0;
      if(state.camera.mode==='follow' && ['explore','unlock','depart'].includes(state.phase) && !state.activePuzzle && !state.dialog) {
        const target=clamp(state.cat.x-WIDTH*.43,0,WORLD_WIDTH-WIDTH);
        state.camera.x+=(target-state.camera.x)*(1-Math.exp(-dt*(reducedMotion.matches?20:3)));
      }
      saveElapsed+=dt;
      if(saveElapsed>.8) {saveElapsed=0;persist();refresh();}
      audio.tick(dt,Math.abs(velocity)>2,['ending','sleep'].includes(state.phase),walkDistance,state.phase==='explore' && !state.dialog && !state.activePuzzle && !state.inspection && Math.abs(velocity)<=2,Boolean(state.dialog || state.activePuzzle));
    }
    function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
    function screw(x,y){rect(x-3,y-3,6,6,'#292b34');rect(x-2,y-2,3,2,'#b4aaa0');rect(x,y,1,2,'#656262');}
    function wood(x,y,w,h){rect(x+6,y+5,w,h,'#272334');rect(x,y,w,h,'#513b30');rect(x+4,y+4,w-8,h-8,'#976a44');for(let n=0;n<7;n++){const yy=y+10+n*(h-18)/7;rect(x+5,yy,w-10,2,n%2?'#72513b':'#ac7b4d');rect(x+10+(n*19)%Math.max(1,w-35),yy+3,18,1,'#5f4738');}screw(x+10,y+10);screw(x+w-10,y+10);screw(x+10,y+h-10);screw(x+w-10,y+h-10);}
    function shape(path,color,stroke) {
      const key=path+'|'+color+'|'+(stroke||'');
      if(paths.has(key))return paths.get(key);
      const c=doc.createElement('canvas');c.width=c.height=64;const cctx=c.getContext('2d');
      const p=new Path2D(path);cctx.fillStyle=color;cctx.fill(p);if(stroke){cctx.strokeStyle=stroke;cctx.lineWidth=2;cctx.stroke(p);}paths.set(key,c);return c;
    }
    function leaf(x,y,size,turn=0,crop=null,color='#23483e') {
      const image=shape(Puzzles.ART.leafPath,color);
      ctx.save();ctx.translate(x+size/2,y+size/2);ctx.rotate(turn*Math.PI/2);
      if(crop)ctx.drawImage(image,crop[0],crop[1],32,32,-size/2,-size/2,size,size);
      else ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();
    }
    function drawEmblemInBench(snapshot) {
      const x=220,y=425;ctx.save();ctx.fillStyle='#30332888';ctx.beginPath();ctx.ellipse(x+38,y+25,43,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#554338';ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x+33,y+2);ctx.lineTo(x+39,y+5);ctx.lineTo(x+69,y+1);ctx.lineTo(x+76,y+19);ctx.lineTo(x+41,y+26);ctx.lineTo(x+35,y+23);ctx.lineTo(x+4,y+27);ctx.closePath();ctx.fill();ctx.fillStyle='#e3d1ab';ctx.beginPath();ctx.moveTo(x+4,y+8);ctx.lineTo(x+33,y+4);ctx.lineTo(x+39,y+7);ctx.lineTo(x+66,y+4);ctx.lineTo(x+71,y+18);ctx.lineTo(x+41,y+22);ctx.lineTo(x+35,y+20);ctx.lineTo(x+7,y+23);ctx.closePath();ctx.fill();ctx.strokeStyle='#ad9872';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+36,y+5);ctx.lineTo(x+39,y+21);ctx.moveTo(x+10,y+12);ctx.lineTo(x+30,y+9);ctx.moveTo(x+45,y+11);ctx.lineTo(x+62,y+9);ctx.stroke();if(Puzzles.isSolved(snapshot,'emblem'))rect(x+42,y+15,16,2,'#d0aa59');ctx.restore();
    }
    function drawPipesInPlanter(snapshot,time) {
      const x=650,y=386;rect(x-4,y+48,88,8,'#504a3e');rect(x+14,y+55,6,22,'#647c72');rect(x+65,y+55,6,22,'#647c72');rect(x-4,y-4,88,64,'#5a554a');rect(x,y,80,56,'#7b806f');rect(x+3,y+3,74,50,'#475a55');
      rect(x-13,y+11,10,7,'#8fa7a0');rect(x-17,y+4,5,15,'#647d77');rect(x-21,y+2,13,4,'#d7c58e');rect(x+79,y+26,13,5,'#859b91');rect(x+90,y+26,5,12,'#859b91');
      const values=Puzzles.isSolved(snapshot,'pipes')?[3,2,1,0]:snapshot.pipes.map(p=>p.value);
      const trace=Puzzles.tracePipes(values);
      rect(x+36,y+15,8,4,'#a8b2a1');rect(x+36,y+37,8,4,'#a8b2a1');
      snapshot.pipes.forEach((piece,i)=>{
        const bx=x+14+(i%2)*30,by=y+6+Math.floor(i/2)*22;
        rect(bx,by,22,22,'#344946');ctx.save();ctx.translate(bx+11,by+11);ctx.rotate(values[i]*Math.PI/2);ctx.lineJoin='miter';
        ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(0,0);ctx.lineTo(0,-11);ctx.strokeStyle='#293e40';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle='#a8b2a1';ctx.lineWidth=4;ctx.stroke();
        if(trace.cells.some(c=>c.index===i)){ctx.strokeStyle='#75b7b0';ctx.lineWidth=2;ctx.stroke();}
        ctx.restore();
      });
      if(Puzzles.isSolved(snapshot,'pipes')){const drop=(time*22)%18;rect(x+91,y+38+drop,3,5,'#9dd5cd');}
    }
    function drawShadowsInWall(snapshot) {
      const x=1010,y=387;rect(x+56,y+39,7,30,'#5a4a34');rect(x+58,y+40,3,28,'#a27c4c');rect(x,y,120,46,'#594331');rect(x+4,y+4,112,38,'#bd9a6a');rect(x+7,y+8,106,2,'#d4b887');ctx.fillStyle='#44382e';ctx.font='bold 12px monospace';ctx.fillText(Puzzles.isSolved(snapshot,'shadows')?'DESPEÑADEROS':'NUESTRO LUGAR',x+8,y+28,104);
    }
    function drawRoomMechanisms(room,snapshot,time) {
      if(room===1){
        const ordered=Puzzles.isSolved(snapshot,'emblem'), lit=Puzzles.isSolved(snapshot,'pipes'), playing=Puzzles.isSolved(snapshot,'shadows');
        rect(1370,213,76,105,'#75583e');rect(1374,217,68,97,'#d5c7a5');rect(1378,221,60,89,'#f0ddba');rect(1373,216,4,4,'#624d3c');rect(1439,216,4,4,'#624d3c');
        ctx.fillStyle='#344f49';ctx.font='bold 8px monospace';ctx.fillText('MASCOTA',1382,236);ctx.fillText('PROA',1394,248);ctx.fillStyle='#5d806c';ctx.beginPath();ctx.arc(1408,279,10,0,Math.PI*2);ctx.fill();[[-12,-8],[-4,-15],[5,-15],[13,-8]].forEach(([dx,dy])=>{ctx.beginPath();ctx.arc(1408+dx,279+dy,4,0,Math.PI*2);ctx.fill();});if(ordered)rect(1381,301,54,3,'#b49652');
        ctx.save();ctx.translate(-72,-56);
        rect(1242,267,178,94,'#3e3732');rect(1247,272,168,84,'#7e7660');rect(1253,278,156,72,'#263e45');
        const spots=[[1,0],[1,1],[0,1],[0,2]],mirrorValues=lit?[1,0,0,1]:snapshot.pipes.map(piece=>piece.value),ray=Puzzles.traceMirrors(mirrorValues);
        rect(1261,283,6,10,'#f5d585');rect(1400,335,6,10,lit?'#ffe99f':'#64746b');ctx.save();ctx.strokeStyle='#ffe6a1';ctx.shadowColor='#ffc65c';ctx.shadowBlur=5;ctx.lineWidth=2;ctx.beginPath();ray.points.forEach(([px,py],index)=>{const rx=1267+px*133/300,ry=279+py*70/300;if(index)ctx.lineTo(rx,ry);else ctx.moveTo(rx,ry);});ctx.stroke();ctx.restore();
        spots.forEach(([col,row],index)=>{const x=1267+(col+.5)*133/3,y=279+(row+.5)*70/3;ctx.strokeStyle='#d3ebdc';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x-11,y+(mirrorValues[index]%2?-6:6));ctx.lineTo(x+11,y+(mirrorValues[index]%2?6:-6));ctx.stroke();});
        ctx.restore();
        rect(865,402,110,5,'#584638');rect(875,349,92,53,'#665546');rect(879,351,84,47,'#e7d6ae');for(let i=0;i<5;i++)rect(884,360+i*5,74,1,'#9c876b');['♪','●','♣','✦'].forEach((mark,index)=>{ctx.fillStyle=playing?'#ae7832':'#594e45';ctx.font='12px monospace';ctx.fillText(mark,885+index*17,380+(playing&&!reducedMotion.matches?Math.sin(time*3+index)*2:0));});
      } else if(room===2){
        const robot=Puzzles.isSolved(snapshot,'emblem'), linked=Puzzles.isSolved(snapshot,'pipes'), disks=Puzzles.isSolved(snapshot,'shadows');
        ctx.fillStyle='#273a3888';ctx.beginPath();ctx.ellipse(1280,398,37,5,0,0,Math.PI*2);ctx.fill();rect(1260,365,40,27,'#2c4749');rect(1263,368,34,20,robot?'#b9d1b0':'#789c9b');rect(1267,372,26,10,'#29454b');rect(1272,375,4,4,robot?'#f6e39d':'#bfd6b5');rect(1284,375,4,4,robot?'#f6e39d':'#bfd6b5');rect(1278,356,4,10,'#a7b69a');rect(1274,354,12,3,'#d4bd82');rect(1261,390,38,5,'#3a4d48');rect(1267,392,6,5,'#c8b88e');rect(1287,392,6,5,'#c8b88e');
        rect(451,338,88,54,'#18333a');rect(454,341,82,48,'#314e51');['PROG.','ROBOT','TEST'].forEach((label,index)=>{ctx.fillStyle=linked?'#f1cf7c':'#c1d7c4';ctx.font='8px monospace';ctx.fillText(label,458,353+index*12);rect(500,347+index*12,5,5,'#d8c78e');rect(527,347+index*12,5,5,'#d8c78e');if(linked){ctx.strokeStyle='#e9c871';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(505,349+index*12);ctx.lineTo(527,349+index*12);ctx.stroke();}});
        rect(828,338,88,54,'#18333a');rect(831,341,82,48,'#29444a');[20,14,8].forEach((radius)=>{ctx.strokeStyle=disks?'#f0d27a':'#a1bab2';ctx.lineWidth=2;ctx.beginPath();ctx.arc(872,365,radius,0,Math.PI*2);ctx.stroke();});rect(870,343,4,5,disks?'#fff0a2':'#b8a77d');
      }
    }
    function drawKey(keyX,keyY) {
      ctx.strokeStyle='#f1d488';ctx.lineWidth=4;ctx.beginPath();ctx.arc(keyX,keyY,7,0,Math.PI*2);ctx.moveTo(keyX+5,keyY+5);ctx.lineTo(keyX+21,keyY+21);ctx.lineTo(keyX+25,keyY+17);ctx.moveTo(keyX+15,keyY+15);ctx.lineTo(keyX+19,keyY+11);ctx.stroke();
    }
    function drawBox(snapshot) {
      const x=1600,y=575,w=120,h=66,count=solvedCount(snapshot);
      if(state?.room===1){
        const opened=state.phase==='unlock'||state.phase==='depart';
        rect(x-7,y-142,142,145,'#382e29');rect(x,y-136,w,130,'#806148');rect(x+8,y-128,w-16,112,'#344b48');rect(x+10,y-18,w-20,7,'#604738');
        if(opened){rect(x+12,y-120,96,90,'#465a50');rect(x+11,y-36,98,6,'#9c7955');rect(x-17,y-129,19,111,'#956b4b');rect(x+118,y-129,19,111,'#956b4b');}else{rect(x+8,y-128,w-16,112,'#8fb2ad88');rect(x+58,y-128,4,112,'#75543f');}
        for(let i=0;i<3;i++){const open=Puzzles.isSolved(snapshot,IDS[i]);rect(x+17+i*31,y-50,12,open?8:26,open?'#d9c88d':'#5f5146');}
        if(count===3&&state.phase==='unlock'){let keyX=x+60,keyY=y-57;if(arrivalTime!==null){const t=clamp((sequenceTime-arrivalTime)/.7,0,1);keyX+=(state.cat.x+29-keyX)*t;keyY+=(GROUND-48-keyY)*t;}drawKey(keyX,keyY);}return;
      }
      if(state?.room===2){
        rect(x-8,y-102,141,105,'#25262f');wood(x,y-96,w,90);rect(x+10,y-79,w-20,28,'#3b4b51');rect(x+10,y-43,w-20,27,'#3b4b51');
        for(let i=0;i<3;i++){const open=Puzzles.isSolved(snapshot,IDS[i]);rect(x+21+i*30,y-73,10,open?7:18,open?'#c2bd94':'#93816a');}
        if(count===3&&state.phase==='unlock')drawKey(x+60,y-105-Math.min(35,sequenceTime*22));return;
      }
      rect(x-7,y,139,8,'#29253666');wood(x,y-h,w,h);
      const opening=state?.phase==='unlock'?clamp(sequenceTime/.9,0,1):state && ['depart','review'].includes(state.phase)?1:0;
      wood(x-3,y-h-18-opening*33,w+6,23);
      for(let i=0;i<3;i++){const open=Puzzles.isSolved(snapshot,IDS[i]);rect(x+20+i*31,y-h+6,10,open?7:27,'#3a3937');rect(x+22+i*31,y-h+6+(open?-6:0),5,open?9:21,open?'#c2bd94':'#aaa185');}
      if(count===3 && state && state.phase==='unlock'){
        let keyX=x+60,keyY=y-h-23-Math.min(38,sequenceTime*22);
        if(arrivalTime!==null){const t=clamp((sequenceTime-arrivalTime)/.7,0,1);keyX+=(state.cat.x+29-keyX)*t;keyY+=(GROUND-48-keyY)*t;}
        drawKey(keyX,keyY);
      }
    }
    function drawDoor(open) {
      if(state?.room===2){
        // La abertura pertenece al fondo del taller; la hoja cubre su interior hasta abrirse.
        if(open)return;
        const x=1662,y=189,w=171,h=329;
        rect(x,y,w,h,'#183b34');rect(x+6,y+5,w-12,h-5,'#295548');
        rect(x+15,y+16,w-30,122,'#1d443a');rect(x+20,y+21,w-40,112,'#365d4f');
        rect(x+15,y+150,w-30,158,'#1b4038');rect(x+20,y+155,w-40,148,'#30594b');
        rect(x+24,y+26,5,101,'#527164');rect(x+w-29,y+26,4,101,'#172f2c');
        rect(x+24,y+160,5,138,'#486c5b');rect(x+w-29,y+160,4,138,'#172f2c');
        rect(x+w-29,y+164,7,17,'#c99e5d');return;
      }
      const x=1718,y=161,w=159,h=344;
      rect(x-7,y-7,w+14,h+7,'#153332');rect(x,y,w,h,'#274a3e');
      if(open){rect(x+4,y+4,w-8,h-4,'#202535');rect(x+w-26,y+4,22,h-4,'#345343');rect(x+8,y+h-7,w-16,7,'#c2a279');}
      else{rect(x+9,y+12,w-18,h-24,'#1f4039');rect(x+20,y+27,w-40,127,'#2d5142');rect(x+20,y+176,w-40,134,'#29483d');rect(x+26,y+32,w-52,4,'#486450');rect(x+124,y+167,8,17,'#b69a67');}
    }
    function drawCat(time) {
      const cat=state ? state.cat : {x:260,dir:1,wait:2};
      if(state?.phase==='depart' && arrivalTime!==null) {
        const t=Math.max(0,sequenceTime-arrivalTime), turning=t<.8;
        const sheet=turning ? assets.doorTurn : assets.backWalk;
        const index=reducedMotion.matches ? (turning?3:0) : turning ? Math.min(3,Math.floor(t/.8*4)) : Math.floor((t-.8)*5)%4;
        const frame=sheet.frames[index], depth=clamp((t-.8)/1.55,0,1), scale=sheet.scale*(1-.16*depth);
        const ground=GROUND-102*depth;
        ctx.fillStyle='#27243166';ctx.beginPath();ctx.ellipse(cat.x,ground+2,36*(1-.3*depth),6,0,0,Math.PI*2);ctx.fill();
        ctx.drawImage(sheet.image,frame.sx,frame.sy,frame.w,frame.h,Math.round(cat.x-frame.w*scale/2),Math.round(ground-frame.h*scale),frame.w*scale,frame.h*scale);
        return;
      }
      const walking=state && !paused && !doc.hidden && !state.dialog && !state.activePuzzle && Math.abs(velocity)>2;
      const gesturing=state?.inspection?.stage==='gesture';
      const sheet=turnTime>0?assets.turn:walking?assets.walk:gesturing?assets.inspect:assets.idle;
      const turnFrame=Math.min(3,Math.floor((.45-turnTime)/.45*4));
      let index=turnTime>0?(cat.dir<0?turnFrame:3-turnFrame):walking?(reducedMotion.matches?0:Math.floor(walkDistance/9)%6):0;
      if(gesturing){const t=state.inspection.elapsed;index=reducedMotion.matches?0:t<.3?0:t<.6?1:2+Math.floor((t-.6)*6)%2;}
      else if(!walking && turnTime<=0 && !reducedMotion.matches){const t=time%7;index=t>3.8&&t<4?1:0;}
      const frame=sheet.frames[index],scale=sheet.scale;
      const departing=state && (state.phase==='depart'||state.phase==='review');
      const ground=departing?exitGround(cat.x):GROUND;
      ctx.fillStyle='#27243166';ctx.beginPath();ctx.ellipse(cat.x+1,ground+2,36,6,0,0,Math.PI*2);ctx.fill();
      ctx.save();ctx.translate(Math.round(cat.x),Math.round(ground));ctx.scale(turnTime>0?1:cat.dir,1);
      ctx.drawImage(sheet.image,frame.sx,frame.sy,frame.w,frame.h,(walking?-frame.w/2:frame.bx-sheet.anchorX)*scale,-frame.h*scale,frame.w*scale,frame.h*scale);
      ctx.restore();
    }
    function draw(time) {
      const camera=state?state.camera.x:0,snapshot=state?state.puzzles:Puzzles.INITIAL_PUZZLES;
      ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,WIDTH,HEIGHT);
      ctx.save();ctx.translate(-Math.round(camera),0);ctx.drawImage(assets.backgrounds[state ? state.room : 0],0,0,WORLD_WIDTH,HEIGHT);
      if(state && ['ending','sleep','review'].includes(state.phase)){ctx.drawImage(assets.ending,0,0,WIDTH,HEIGHT); if(state.phase==='ending'){const student=assets.student;ctx.drawImage(student.image,student.sx,student.sy,student.w,student.h,790,210,student.w/student.h*390,390);ctx.save();ctx.translate(410,600);const f=assets.idle.frames[0],sc=assets.idle.scale;ctx.drawImage(assets.idle.image,f.sx,f.sy,f.w,f.h,(f.bx-assets.idle.anchorX)*sc,-f.h*sc,f.w*sc,f.h*sc);ctx.restore();}else if(state.phase==='sleep'){const img=assets.finale,sw=Math.min(img.width,img.height*WIDTH/HEIGHT),sh=sw*HEIGHT/WIDTH;const zoom=reducedMotion.matches?1:1+Math.min(sequenceTime,4)*.006;ctx.save();ctx.globalAlpha=clamp(sequenceTime/.8,0,1);ctx.drawImage(img,(img.width-sw/zoom)/2,(img.height-sh/zoom)/2,sw/zoom,sh/zoom,0,0,WIDTH,HEIGHT);ctx.restore();}} else { drawDoor(Boolean(state && state.phase==='depart')); if(!state || state.room===0){drawEmblemInBench(snapshot);drawPipesInPlanter(snapshot,time);drawShadowsInWall(snapshot);} else drawRoomMechanisms(state.room,snapshot,time); drawBox(snapshot);drawCat(time); }
      if(state?.inspection?.stage==='gesture' && !reducedMotion.matches) {
        const object=OBJECTS[state.room].find(item=>item.id===state.inspection.id);
        if(object){
          const glow=.3+.2*Math.sin(time*5);
          ctx.save();ctx.globalAlpha=glow;ctx.strokeStyle='#f8d797';ctx.lineWidth=3;
          ctx.strokeRect(object.x-object.w/2-3,object.y-object.h/2-3,object.w+6,object.h+6);ctx.restore();
          const sparkle=(Math.floor(time*6)%3)*5;rect(state.cat.x+31,GROUND-39-sparkle,3,3,'#f3d49c');rect(state.cat.x+37,GROUND-34-sparkle,2,2,'#fff0c6');
        }
      }
      if(state && state.room>0 && state.phase==='explore') for(const object of OBJECTS[state.room]) {
        if(Puzzles.isSolved(snapshot,object.id)) {
          const x=object.x+object.w/2-8,y=object.y-object.h/2+8;
          rect(x-8,y-3,16,6,'#f0d18b');rect(x-3,y-8,6,16,'#f0d18b');rect(x-2,y-2,4,4,'#fff4cc');
        }
      }
      if(hoveredId && state?.phase==='explore' && !state.inspection) {
        const object=OBJECTS[state.room].find(item=>item.id===hoveredId);
        if(object){ctx.save();ctx.strokeStyle='#f0d18b';ctx.shadowColor='#f0d18b';ctx.shadowBlur=7;ctx.lineWidth=2;ctx.strokeRect(object.x-object.w/2,object.y-object.h/2,object.w,object.h);ctx.restore();}
      }
      if(!reducedMotion.matches)for(let i=0;i<12;i++){const x=110+(i*151+time*(6+i%3))%1730,y=250+(i*29)%250+Math.sin(time*.5+i)*5;rect(x,y,2,2,'#ebc88c55');}
      ctx.restore();
      if(state?.phase==='sleep' && sequenceTime>4){
        const progress=clamp((sequenceTime-4)/3,0,1),radius=Math.hypot(WIDTH/2,HEIGHT*.6)*(1-progress);
        ctx.save();ctx.fillStyle='#090a10';ctx.beginPath();ctx.rect(0,0,WIDTH,HEIGHT);ctx.moveTo(WIDTH/2+radius,HEIGHT*.6);ctx.arc(WIDTH/2,HEIGHT*.6,radius,0,Math.PI*2,true);ctx.fill('evenodd');ctx.restore();
      }
      OBJECTS[state ? state.room : 0].forEach(object=>{const button=hotspotButtons.find(b=>b.dataset.puzzle===object.id),type=OBJECT_TYPES[state ? state.room : 0][object.id];const solved=Boolean(state && Puzzles.isSolved(snapshot,object.id));button.classList.toggle('is-solved',solved);const aria=solved ? object.label+' · acertijo resuelto' : 'Investigar '+object.label+' · '+type.type;const symbol=solved ? '✓' : type.symbol;const label=object.label+(solved ? ' · Resuelto' : '');if(button.getAttribute('aria-label')!==aria)button.setAttribute('aria-label',aria);const symbolNode=button.querySelector('.hotspot-symbol'),labelNode=button.querySelector('.hotspot-label');if(symbolNode.textContent!==symbol)symbolNode.textContent=symbol;if(labelNode.textContent!==label)labelNode.textContent=label;button.style.left=(object.x-camera)/WIDTH*100+'%';button.style.top=object.y/HEIGHT*100+'%';button.style.width=object.hitW/WIDTH*100+'%';button.style.height=object.hitH/HEIGHT*100+'%';button.style.minWidth='44px';button.style.minHeight='44px';});
    }
    function frame(now) {
      const dt=Math.min((now-lastFrame)/1000,.05);lastFrame=now;
      if(!doc.hidden){update(dt);draw(idleTime);}
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function createAudio(notice) {
    let context=null,mix=null,effectsMix=null,wind=null,music=null,musicFailed=false,endingMusic=false,enabled=true,active=false,beat=0,lastStepDistance=0,idleForMeow=0,musicLevel=.3,effectsLevel=1;
    function tone(frequency,duration,type='sine',gain=.02,delay=0,isMusic=false) {
      if(!context || !enabled || !active || context.state!=='running')return;
      const at=context.currentTime+delay,osc=context.createOscillator(),g=context.createGain();
      osc.type=type;osc.frequency.value=frequency;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(gain,at+.025);g.gain.exponentialRampToValueAtTime(.0001,at+duration);osc.connect(g);g.connect(isMusic?mix:effectsMix);osc.start(at);osc.stop(at+duration+.03);
    }
    function meow() {
      if(!context || !enabled || !active || context.state!=='running')return;
      const at=context.currentTime,osc=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
      osc.type='triangle';osc.frequency.setValueAtTime(470,at);osc.frequency.exponentialRampToValueAtTime(620,at+.13);osc.frequency.exponentialRampToValueAtTime(390,at+.46);
      filter.type='lowpass';filter.frequency.value=1300;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.012,at+.07);gain.gain.exponentialRampToValueAtTime(.0001,at+.48);
      osc.connect(filter);filter.connect(gain);gain.connect(effectsMix);osc.start(at);osc.stop(at+.5);
    }
    function water() {
      if(!context || !enabled || !active || context.state!=='running')return;
      const at=context.currentTime, buffer=context.createBuffer(1,context.sampleRate*.45,context.sampleRate), samples=buffer.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*.15;
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
      source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1050;filter.Q.value=.7;
      gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(.045,at+.06);gain.gain.exponentialRampToValueAtTime(.0001,at+.45);
      source.connect(filter);filter.connect(gain);gain.connect(effectsMix);source.start(at);source.stop(at+.46);
    }
    function sync(){
      if(!context)return;
      mix.gain.setTargetAtTime(enabled && active ? .7 : 0,context.currentTime,.08);
      if(!active||!enabled)context.suspend().catch(()=>{});else context.resume().catch(()=>{});
      if(music){
        if(enabled && active && !endingMusic && !musicFailed){const playing=music.play();if(playing)playing.catch(error=>{if(error.name!=='AbortError')musicFailed=true;});}
        else music.pause();
      }
    }
    return {
      unlock(){if(!enabled)return;try{if(!context){const AC=window.AudioContext||window.webkitAudioContext;if(!AC){notice('Este navegador no ofrece sonido. Podés jugar igual.');return;}context=new AC();mix=context.createGain();mix.gain.value=0;mix.connect(context.destination);effectsMix=context.createGain();effectsMix.gain.value=effectsLevel;effectsMix.connect(mix);const buffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate),channel=buffer.getChannelData(0);for(let i=0;i<channel.length;i++)channel[i]=(Math.random()*2-1)*.016;wind=context.createBufferSource();wind.buffer=buffer;wind.loop=true;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=340;wind.connect(filter);filter.connect(effectsMix);wind.start();if(typeof Audio!=='undefined'){music=new Audio('../../static/escape-proa/musica-midnight.mp3');music.loop=true;music.volume=.12*musicLevel;music.addEventListener('error',()=>{musicFailed=true;});}else musicFailed=true;}sync();}catch(_){notice('No se pudo activar el sonido. Podés jugar igual.');}},
      setEffectsVolume(value){effectsLevel=clamp(value,0,1);if(effectsMix)effectsMix.gain.setTargetAtTime(effectsLevel,context.currentTime,.03);},setMusicVolume(value){musicLevel=clamp(value,0,1);},setEnabled(value){enabled=value;sync();},setActive(value){if(active!==value){active=value;sync();}},
      cue(cue){if(Array.isArray(cue)){const f={note1:523.25,note2:587.33,note3:659.25,note4:783.99};cue.forEach((note,index)=>tone(f[note],.2,'sine',.02,index*.27));}else if(cue==='water')water();else if(cue==='voice')tone(260,.055,'triangle',.026);else if(cue==='student')tone(365,.055,'triangle',.026);else if(cue==='move')tone(164,.07,'triangle',.025);else if(cue==='note1')tone(523.25,.24,'sine',.025);else if(cue==='note2')tone(587.33,.24,'sine',.025);else if(cue==='note3')tone(659.25,.24,'sine',.025);else if(cue==='note4')tone(783.99,.3,'sine',.025);else if(cue==='sample'){[523.25,587.33,659.25,783.99].forEach((note,index)=>tone(note,.2,'sine',.02,index*.27));}else if(cue==='blocked'){tone(130.81,.12,'triangle',.012);}else if(cue==='chest'){tone(110,.24,'triangle',.025);tone(164.81,.34,'triangle',.018,.12);}else if(cue==='solved'){[261.63,329.63,392,523.25].forEach((n,i)=>tone(n,.65,'triangle',.018,i*.1));tone(523.25,1.2,'sine',.014,.4);tone(659.25,1,'sine',.01,.45);}else if(cue==='key'){tone(659.25,1.1,'sine',.04);tone(880,1.4,'sine',.02,.1);}else if(cue==='door')tone(82.4,.8,'triangle',.045);},
      tick(dt,walking,warm,distance,idle,quiet){if(!enabled||!active||!context)return;if(music && !musicFailed){const target=(quiet ? .055 : .12)*musicLevel;const next=music.volume+(target-music.volume)*(1-Math.exp(-dt*3));if(Math.abs(next-music.volume)>.0001)music.volume=next;}if(endingMusic!==warm){endingMusic=warm;sync();}beat-=dt;if((musicFailed||warm)&&beat<=0){beat=2.5;const chords=warm?[[261.63,329.63,392],[220,261.63,329.63],[174.61,220,261.63],[196,246.94,392]]:[[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66],[164.81,220,261.63]],chord=chords[Math.floor(context.currentTime/10)%4];chord.forEach((n,i)=>tone(n,3.5,'sine',.014*musicLevel,i*.12,true));tone(chord[1]*2,1.5,'triangle',.008*musicLevel,.9,true);}if(!walking)lastStepDistance=distance;else if(distance-lastStepDistance>=27){lastStepDistance=distance;tone(96,.06,'triangle',.012);}if(idle){idleForMeow+=dt;if(idleForMeow>=14){idleForMeow=0;meow();}}}
    };
  }
  return {DIALOGUES,newSnapshot,sanitizeGameSnapshot,advanceDialogue,advanceInspection,solvedCount,exitGround,focusAfterDialogue,start};
}));
