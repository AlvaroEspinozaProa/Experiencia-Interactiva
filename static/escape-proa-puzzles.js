(function (global) {
  'use strict';

  const IDS = { emblem: ['A', 'B', 'C', 'D'], pipes: ['P1', 'P2', 'P3', 'P4'], shadows: ['cat', 'pot', 'windmill'] };
  const ART = {
    leafPath: 'M32 5C18 14 14 28 17 43c3 10 10 15 15 16-4-13 1-25 13-34-5 10-8 20-13 29 12-3 19-13 18-27C49 17 42 9 32 5Z',
    ornamentPath: 'M4 12h12M4 4v12M48 4h12M55 4v14M48 60h12M48 48v12M4 52h15M4 48v12',
    shadowPaths: ['M9 49c4-9 9-14 17-15l2-13 5 2 2-8 5 3 4 13c7 2 11 8 12 18H9Z', 'M20 54h25l-3-25H23l-3 25Zm5-28c1-10 15-10 16 0H25Z', 'M30 54h5V28l15-10-12 16 17 4-18-1 8 16-12-15-10 15 8-17-18 1 17-5-12-15 15 10v27Z']
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  function shuffledDifferent(values, previous) {
    const result=[...values];for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    if(result.length>1 && previous && result.join('')===previous.join(''))result.push(result.shift());return result;
  }
  const mirrorSolution=[1,0,0,1];
  function initialMirrors(){const correctIndex=Math.floor(Math.random()*5);return mirrorSolution.map((value,index)=>index===correctIndex?value:1-value);}
  const INITIAL_PUZZLES = Object.freeze({ version: 1,
    emblem: [{ id: 'A', value: 1 }, { id: 'B', value: 3 }, { id: 'C', value: 2 }, { id: 'D', value: 1 }],
    pipes: [{ id: 'P1', value: 0 }, { id: 'P2', value: 1 }, { id: 'P3', value: 0 }, { id: 'P4', value: 1 }],
    shadows: [{ id: 'cat', position: 0 }, { id: 'pot', position: 2 }, { id: 'windmill', position: 1 }],
    steps: null, word: '', wordMissing:null, wordKeys:null, wordPuzzleVersion:2, mirrorVersion:2, timeline: ['Mascota Escolar','Reforestación del Patio','BiciSpot'], timelineSelected: null, robotSelected:null, connections:{programacion:null,robotica:null,testing:null,selected:null}, disks:null, solved: { emblem: false, pipes: false, shadows: false }, hints: { emblem: { elapsedMs: 0, shown: false }, pipes: { elapsedMs: 0, shown: false }, shadows: { elapsedMs: 0, shown: false } }
  });

  function validPieces(items, ids, key, max) {
    return Array.isArray(items) && items.length === ids.length && items.every((piece, index) => piece && typeof piece === 'object' && piece.id === ids[index] && Number.isFinite(piece[key]) && Number.isInteger(piece[key]) && piece[key] >= 0 && piece[key] <= max);
  }
  function sanitizePuzzleSnapshot(raw, room = 0) {
    if (!raw || typeof raw !== 'object' || raw.version !== 1 || !validPieces(raw.emblem, IDS.emblem, 'value', 3) || !validPieces(raw.pipes, IDS.pipes, 'value', 3) || !validPieces(raw.shadows, IDS.shadows, 'position', 2) || !raw.hints || typeof raw.hints !== 'object') return null;
    for (const id of ['emblem', 'pipes', 'shadows']) {
      const hint = raw.hints[id];
      if (!hint || typeof hint !== 'object' || !Number.isFinite(hint.elapsedMs) || hint.elapsedMs < 0 || typeof hint.shown !== 'boolean') return null;
    }
    if (!raw.solved || !['emblem','pipes','shadows'].every(id => typeof raw.solved[id] === 'boolean')) return null;
    let word=raw.word == null ? '' : raw.word;
    if(typeof word!=='string' || word.length>32) return null;
    let wordMissing=raw.wordMissing??null,wordKeys=raw.wordKeys??null;
    if(room===0 && raw.wordPuzzleVersion!==2 && wordMissing!==null){word='';wordMissing=null;wordKeys=null;}
    if(wordMissing!==null&&(!Array.isArray(wordMissing)||wordMissing.length!==5||new Set(wordMissing).size!==5||wordMissing.some(i=>!Number.isInteger(i)||i<0||i>=12)))return null;
    if(wordKeys!==null&&(!Array.isArray(wordKeys)||wordKeys.length<1||wordKeys.length>12||wordKeys.some(k=>typeof k!=='string'||!/^([A-Z]|Ñ)$/.test(k))))return null;
    if((wordMissing===null)!==(wordKeys===null))return null;
    if(wordMissing&&room===0){const remaining=[...wordKeys];for(const letter of wordMissing.map(i=>'DESPEÑADEROS'[i])){const index=remaining.indexOf(letter);if(index<0)return null;remaining.splice(index,1);}const available=[...wordKeys];for(const letter of word){const index=available.indexOf(letter);if(index<0)return null;available.splice(index,1);}if(word.length>5)return null;}
    const steps=raw.steps == null ? null : raw.steps;
    if (steps !== null && (!Array.isArray(steps) || steps.length>200 || steps.some(step=>!['↑','←','↓','→'].includes(step)))) return null;
    const timeline=raw.timeline == null ? ['Mascota Escolar','Reforestación del Patio','BiciSpot'] : raw.timeline;
    if(!Array.isArray(timeline) || timeline.length!==3 || new Set(timeline).size!==3 || !timeline.every(value=>['Mascota Escolar','Reforestación del Patio','BiciSpot'].includes(value)) || (raw.timelineSelected !== null && raw.timelineSelected !== undefined && (!Number.isInteger(raw.timelineSelected) || raw.timelineSelected<0 || raw.timelineSelected>2)) || (raw.robotSelected !== null && raw.robotSelected !== undefined && (!Number.isInteger(raw.robotSelected) || raw.robotSelected<0 || raw.robotSelected>4))) return null;
    const connections=raw.connections == null ? {programacion:null,robotica:null,testing:null,selected:null} : raw.connections;
    if(!connections || typeof connections!=='object' || !['programacion','robotica','testing'].every(key=>connections[key]===null || ['3','5','6'].includes(connections[key])) || (connections.selected!==null && connections.selected!==undefined && !['programacion','robotica','testing'].includes(connections.selected))) return null;
    const disks=raw.disks == null ? null : raw.disks;
    if(disks!==null && (!Array.isArray(disks) || disks.length!==3 || disks.some(value=>!Number.isInteger(value)||value<0||value>3))) return null;
    const mirrorValues=room===1 && raw.mirrorVersion!==2 && !raw.solved.pipes && raw.pipes.filter((piece,index)=>piece.value%2!==mirrorSolution[index]).length<3 ? initialMirrors() : raw.pipes.map(piece=>piece.value);
    return { version: 1, word, wordMissing:wordMissing&&[...wordMissing], wordKeys:wordKeys&&[...wordKeys], wordPuzzleVersion:2, mirrorVersion:2, steps: steps && [...steps], timeline:[...timeline], timelineSelected:raw.timelineSelected ?? null, robotSelected:raw.robotSelected ?? null, connections:{...connections,selected:connections.selected ?? null}, disks:disks && [...disks], solved: {...raw.solved},
      emblem: raw.emblem.map((piece) => ({ id: piece.id, value: piece.value })),
      pipes: raw.pipes.map((piece,index) => ({ id: piece.id, value: mirrorValues[index] })),
      shadows: raw.shadows.map((piece) => ({ id: piece.id, position: piece.position })),
      hints: Object.fromEntries(['emblem', 'pipes', 'shadows'].map((id) => [id, { elapsedMs: Math.min(30000, raw.hints[id].elapsedMs), shown: raw.hints[id].shown || raw.hints[id].elapsedMs >= 30000 }]))
    };
  }
  function tracePipes(values) {
    if (!Array.isArray(values) || values.length !== 4 || values.some((value) => !Number.isInteger(value) || value < 0 || value > 3)) return { cells: [], success: false };
    const turns = [['W', 'N'], ['N', 'E'], ['E', 'S'], ['S', 'W']];
    const step = { N: -2, E: 1, S: 2, W: -1 }, opposite = { N: 'S', E: 'W', S: 'N', W: 'E' };
    let index = 0, entry = 'W'; const cells = [];
    for (let count = 0; count < 4; count += 1) {
      const ports = turns[values[index]];
      if (!ports.includes(entry)) return { cells, success: false };
      const exit = ports[0] === entry ? ports[1] : ports[0];
      cells.push({ index, entry, exit });
      if (index === 1 && exit === 'E') return { cells, success: true };
      const next = index + step[exit];
      if (next < 0 || next > 3 || (exit === 'E' && index % 2 === 1) || (exit === 'W' && index % 2 === 0)) return { cells, success: false };
      index = next; entry = opposite[exit];
    }
    return { cells, success: false };
  }
  function traceMirrors(values) {
    const positions=[[1,0],[1,1],[0,1],[0,2]],directions=[[1,0],[0,1],[-1,0],[0,-1]];
    let x=-1,y=0,direction=0,points=[[0,50]],visited=new Set();
    for(let i=0;i<40;i++){
      x+=directions[direction][0];y+=directions[direction][1];
      if(x<0||x>2||y<0||y>2){points.push([Math.max(0,Math.min(300,x*100+50)),Math.max(0,Math.min(300,y*100+50))]);return {points,success:x===3&&y===2&&direction===0};}
      const mirror=positions.findIndex(([mx,my])=>mx===x&&my===y);
      if(mirror>=0){points.push([x*100+50,y*100+50]);const key=x+','+y+','+direction;if(visited.has(key))return {points,success:false};visited.add(key);direction=(values[mirror]%2?[1,0,3,2]:[3,2,1,0])[direction];}
    }
    return {points,success:false};
  }
  function isSolved(snapshot, id) { return Boolean(snapshot && snapshot.solved && snapshot.solved[id]); }
  const PATIO = {
    emblem: { title:'Emblema fragmentado', question:'Girá los cuatro azulejos hasta que la hoja y su orla queden continuas.', hint:'La punta de la hoja mira arriba y la orla no se corta en las esquinas.' },
    pipes: { title:'Riego del cantero', question:'Girá los codos de la maqueta para llevar agua desde la llave hasta el árbol.', hint:'Desde la llave de agua, bajá primero; el árbol recibe el agua desde la derecha.' },
    shadows: { title:'Sombras del atardecer', question:'Mové las figuras por sus rieles hasta que cada sombra quede sobre su silueta de tiza.', hint:'La sombra del gato debe quedar junto a la ventana; la maceta, junto al banco.' }
  };
  const HALLWAY = {
    emblem: { title:'Quiz de proyectos', question:'¿Cómo se eligió la mascota escolar de PROA?', choices:['Con una votación de la comunidad','La eligió una sola persona','Con un sorteo'], hint:'Buscá el proyecto Mascota Escolar en la sección Proyectos.' },
    pipes: { title:'Luz desviada', question:'Girá los espejos para que el haz llegue al receptor.', hint:'Seguí el rayo desde la lámpara: un espejo inclinado cambia su dirección.' },
    shadows: { title:'Pequeña orquesta', question:'Observá o escuchá la muestra y repetí la secuencia de símbolos.', hint:'Reproducí la muestra otra vez y seguí el orden de las luces o los nombres.' }
  };
  const WORKSHOP = {
    emblem:{title:'Robot de mesa',question:'Ordená las flechas y poné en marcha al robot para llegar a su base.',hint:'Observá el obstáculo junto al robot y buscá un camino libre antes de avanzar hacia la base.'},
    pipes:{title:'Conexiones de PROA',question:'Uní cada materia con su año. Elegí una materia y luego su destino.',hint:'Programación I está en 3.º; Robótica en 5.º; Testing Digital en 6.º.'},
    shadows:{title:'Discos enlazados',question:'Llevá las tres marcas a la meta de arriba. Cada botón gira dos aros.',hint:'Fijate en los nombres de cada botón: indican cuáles son los dos aros que giran juntos.'}
  };
  const patioShadowSolved = snapshot => snapshot.shadows.every((piece,index)=>piece.position === [2,0,1][index]);
  function newPuzzleSnapshot(room) {
    const state=clone(INITIAL_PUZZLES);
    if(room===0){do{state.pipes.forEach(piece=>piece.value=Math.floor(Math.random()*4));}while(tracePipes(state.pipes.map(piece=>piece.value)).success);}
    if(room===1){const values=initialMirrors();state.pipes.forEach((piece,index)=>piece.value=values[index]);}
    if(room===2){do{state.steps=shuffledDifferent(['→','↑','→','↑','→']);}while(state.steps.join('')==='↑↑→→→');const moves=[[1,1,0],[0,1,1],[1,0,1]];do{state.disks=[0,0,0];for(let i=0;i<4;i++){const move=moves[Math.floor(Math.random()*3)];state.disks=state.disks.map((value,index)=>(value+move[index])%4);}}while(state.disks.every(value=>value===0));}
    return state;
  }
  // Los tres acertijos de cada habitación.
  const ROOMS = [
    [
      {title:'Libro del patio', question:'¿En qué año se realizó Reforestación del Patio?', choices:['2023','2024','2025'], answer:'2024', hint:'Buscá Reforestación del Patio en la sección Proyectos.'},
      {title:'Palabra del patio', question:'Completá el nombre de la localidad donde está nuestra escuela:', word:'DESPEÑADEROS', pattern:'D E S P E Ñ A D E R O S', hint:'El nombre aparece en el encabezado de la página institucional.'},
      {title:'Camino de sombras', question:'Ordená los pasos para llegar a la llave.', steps:['→','↓','→','↑'], start:[0,1], target:[2,1], walls:[[1,1],[1,2]], hint:'La llave está en la misma fila que el gato.'}
    ],
    [
      {title:'Libro del pasillo', question:'¿Cómo se eligió la mascota escolar de PROA?', choices:['Con una votación de la comunidad','La eligió una sola persona','Con un sorteo'], answer:'Con una votación de la comunidad', hint:'Buscá Mascota Escolar en la sección Proyectos.'},
      {title:'Palabra del pasillo', question:'Completá una de las disciplinas que se aprende en la orientación:', word:'PROGRAMACION', pattern:'P _ _ G _ A M _ C _ Ó N', hint:'Consultá la descripción de la orientación en la página institucional.'},
      {title:'Ruta del pasillo', question:'Ordená los pasos para rodear la pared y llegar a la llave.', steps:['→','↓','→','↑','→'], start:[0,1], target:[3,1], walls:[[1,1],[1,2],[2,1]], hint:'La pared se rodea por arriba.'}
    ],
    [
      {title:'Libro del taller', question:'¿Qué proyecto figura con el año 2026?', choices:['BiciSpot','Reforestación del Patio','Mascota Escolar'], answer:'Mascota Escolar', hint:'Compará las fechas en la sección Proyectos.'},
      {title:'Palabra del taller', question:'Completá el segundo término de la orientación:', word:'SOFTWARE', pattern:'S _ _ T _ _ R E', hint:'Consultá la descripción de la orientación en la página institucional.'},
      {title:'Ruta del taller', question:'Ordená los pasos para atravesar el taller sin chocar con las paredes.', steps:['→','↓','→','↑','→','↓','↑','→'], start:[0,2], target:[4,2], walls:[[1,2],[1,3],[3,1],[3,2]], hint:'Primero buscá el pasillo libre sobre las paredes.'}
    ]
  ];
  const normalize = value => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  function tracePath(item, steps) {
    let [x,y]=item.start; const delta={'→':[1,0],'←':[-1,0],'↑':[0,-1],'↓':[0,1]};
    for(const step of steps){
      if(!delta[step]) return {x,y,valid:false};
      const nx=x+delta[step][0],ny=y+delta[step][1];
      if(nx<0||nx>4||ny<0||ny>3||item.walls.some(w=>w[0]===nx&&w[1]===ny)) return {x,y,valid:false};
      x=nx; y=ny;
    }
    return {x,y,valid:true,success:x===item.target[0]&&y===item.target[1]};
  }
  function correct(room, id, answer) {
    if(room===0 && id==='shadows' && typeof answer==='string') return normalize(answer)===normalize(ROOMS[0][1].word);
    const index=['emblem','pipes','shadows'].indexOf(id), item=ROOMS[room]?.[index];
    if (!item) return false;
    if (id !== 'shadows') return normalize(answer) === normalize(item.word || item.answer);
    return Array.isArray(answer) && tracePath(item,answer).success === true;
  }
  function createPuzzleUI(root, options) {
    let snapshot=clone(INITIAL_PUZZLES), active=null, room=0, paused=false, timer=null, focus=null, steps=[], robotResult=null, lastTick=performance.now(), noteOrder=['☀','●','♣','✦'], melody=['☀','●','♣','✦'], missing=[4,8], sourceOrder=['programacion','robotica','testing'], yearOrder=['3','5','6'], choiceOrder=[], robotRunning=false, robotRunId=0, diskChanged=[], connectionWrong=false, wrongElapsed=0;
    const notify=()=>options.onChange?.(clone(snapshot));
    const progress=()=>{if(!active)return; snapshot.hints[active].elapsedMs=0;lastTick=performance.now();notify();};
    function render(message='', focusStep=null) {
      const previousControls=Array.from(root.querySelectorAll('button, input, a'));
      const previousFocus=previousControls.indexOf(document.activeElement);
      const item=room===0 ? (active==='emblem'?ROOMS[0][0]:active==='shadows'?ROOMS[0][1]:PATIO.pipes) : room===1 && HALLWAY[active] ? HALLWAY[active] : room===2 && WORKSHOP[active] ? WORKSHOP[active] : ROOMS[room][['emblem','pipes','shadows'].indexOf(active)], solved=isSolved(snapshot,active);
      const position=item.steps ? tracePath(item,steps) : null;
      const trail=new Set();if(item.steps){trail.add(item.start.join(','));steps.forEach((_,i)=>{const p=tracePath(item,steps.slice(0,i+1));if(p.valid)trail.add(p.x+','+p.y);});}
      const grid=item.steps ? '<p>Ayudá al gato a llegar a la llave. Usá las flechas para avanzar una casilla; las paredes bloquean el paso.</p><div class="logic-grid" role="img" aria-label="Gato en columna '+(position.x+1)+', fila '+(position.y+1)+'; llave en columna '+(item.target[0]+1)+', fila '+(item.target[1]+1)+'; paredes: '+item.walls.map(w=>'columna '+(w[0]+1)+', fila '+(w[1]+1)).join('; ')+'">'+Array.from({length:20},(_,i)=>{const x=i%5,y=Math.floor(i/5);const cat=position.x===x&&position.y===y, key=item.target[0]===x&&item.target[1]===y, wall=item.walls.some(w=>w[0]===x&&w[1]===y), visited=trail.has(x+','+y);return '<span class="'+(cat?'board-cat':key?'board-key':wall?'board-wall':visited?'board-trail':'board-floor')+'" aria-hidden="true">'+(key?'🔑':!cat&&!wall&&visited?'•':'')+'</span>';}).join('')+'</div><p class="logic-position" aria-live="polite">Gato: columna '+(position.x+1)+', fila '+(position.y+1)+'. La llave está en columna '+(item.target[0]+1)+', fila '+(item.target[1]+1)+'.</p><p class="logic-legend">Casilla con ladrillos: pared. Los puntos marcan el camino recorrido; la llave indica la llegada.</p>'+(solved?'':'<div class="logic-directions" aria-label="Mover al gato"><button type="button" data-direction="↑" aria-label="Mover arriba">↑</button><div><button type="button" data-direction="←" aria-label="Mover a la izquierda">←</button><button type="button" data-direction="↓" aria-label="Mover abajo">↓</button><button type="button" data-direction="→" aria-label="Mover a la derecha">→</button></div></div><button type="button" data-undo>Deshacer paso</button> <button type="button" data-reset>Volver al inicio</button>') : '';
      const emblem = '<div class="emblem-board" role="group" aria-label="Azulejos del emblema">'+snapshot.emblem.map((piece,index)=>'<button type="button" class="emblem-piece" data-rotate="'+piece.id+'" style="--turn:'+piece.value+'" aria-label="Girar pieza '+piece.id+'; giro '+(piece.value+1)+' de 4"><span>'+piece.id+'</span><svg aria-hidden="true" viewBox="'+((index%2)*32)+' '+(Math.floor(index/2)*32)+' 32 32" style="width:80%;height:80%;transform:rotate(calc(var(--turn)*90deg))"><path d="'+ART.leafPath+'" fill="#e4cb85" stroke="#59442f" stroke-width="2"/><path d="'+ART.ornamentPath+'" fill="none" stroke="#e4cb85" stroke-width="2"/></svg></button>').join('')+'</div><p class="puzzle-caption">Cada clic gira un cuarto de vuelta.</p>';
      const water=tracePipes(snapshot.pipes.map(piece=>piece.value));
      const pipes = '<div class="irrigation-layout"><div class="irrigation-source">🚰 Canilla <span>→ entrada de agua</span></div><div class="pipes-board" role="group" aria-label="Girá los cuatro tramos de caño desde la canilla hasta el árbol">'+snapshot.pipes.map((piece,index)=>'<button type="button" class="pipe-piece '+(water.cells.some(cell=>cell.index===index)?'has-water':'')+'" data-pipe="'+piece.id+'" style="--turn:'+piece.value+'" aria-label="Girar caño '+piece.id+'; giro '+(piece.value+1)+' de 4"><svg viewBox="0 0 100 100" aria-hidden="true"><path class="pipe-outline" d="M0 50H50V0"/><path class="pipe-channel" d="M0 50H50V0"/></svg></button>').join('')+'</div><div class="irrigation-target">🌳 Árbol <span>← salida de agua</span></div></div><div class="water-status '+(water.success?'is-flowing':'')+'">'+(water.success?'¡El agua llega al árbol!':'El agua avanza por '+water.cells.length+' de 4 tramos conectados.')+'</div>';
      const shadows = '<div class="shadows-board" role="group" aria-label="Rieles de sombras">'+snapshot.shadows.map((piece,index)=>'<div class="shadow-rail"><strong>'+['Gato','Maceta','Molino'][index]+'</strong><span class="rail-track" aria-hidden="true">'+[0,1,2].map(position=>'<span class="shadow-slot">'+(position===[2,0,1][index]?'<svg viewBox="0 0 64 64" class="shadow-target"><path d="'+ART.shadowPaths[index]+'"/></svg>':'')+(position===piece.position?'<svg viewBox="0 0 64 64" class="shadow-figure"><path d="'+ART.shadowPaths[index]+'"/></svg>':'')+'</span>').join('')+'</span><span class="rail-buttons">'+[0,1,2].map(position=>'<button type="button" data-shadow="'+piece.id+'" data-position="'+position+'" aria-pressed="'+(piece.position===position)+'" aria-label="Mover '+['gato','maceta','molino'][index]+' a '+['la izquierda','el centro','la derecha'][position]+'">'+['◀','●','▶'][position]+'</button>').join('')+'</span><small>'+(piece.position===[2,0,1][index]?'Alineada':'Buscá la silueta punteada')+'</small></div>').join('')+'</div><p class="puzzle-caption">Mové cada figura hasta cubrir su silueta punteada.</p>';
      const mirrorValues=solved?[1,0,0,1]:snapshot.pipes.map(piece=>piece.value), beam=traceMirrors(mirrorValues), mirrorPositions=[[1,0],[1,1],[0,1],[0,2]];
      const mirrors = '<div class="mirror-experiment"><div class="mirror-lamp"><span aria-hidden="true">☀</span><small>LÁMPARA</small></div><div class="mirror-table" role="group" aria-label="Cuatro espejos. Giralos para desviar el haz de la lámpara al receptor."><svg class="mirror-rays" viewBox="0 0 300 300" aria-hidden="true"><path class="ray-glow" d="M'+beam.points.map(point=>point.join(' ')).join(' L')+'"/><path class="ray-core" d="M'+beam.points.map(point=>point.join(' ')).join(' L')+'"/></svg>'+snapshot.pipes.map((piece,index)=>'<button type="button" class="mirror-mount" style="--col:'+mirrorPositions[index][0]+';--row:'+mirrorPositions[index][1]+';--angle:'+(mirrorValues[index]%2?45:-45)+'deg" data-mirror="'+piece.id+'" '+(solved?'disabled':'')+' aria-label="Girar espejo '+(index+1)+', inclinado '+(mirrorValues[index]%2?'hacia abajo':'hacia arriba')+'"><span class="mirror-glass" aria-hidden="true"></span><small>'+(index+1)+'</small></button>').join('')+'</div><div class="mirror-target '+(beam.success?'is-lit':'')+'"><span aria-hidden="true">◉</span><small>RECEPTOR</small></div></div><p class="beam-status '+(beam.success?'is-lit':'')+'" aria-live="polite">'+(beam.success?'¡El receptor recibe la luz!':'Hacé clic en un espejo para girarlo y seguí el camino del haz.')+'</p>';
      const noteNames={'☀':'sol','●':'gota','♣':'hoja','✦':'estrella'};
      const orchestra = '<div class="orchestra-sample"><button type="button" data-sample>Escuchar muestra</button><output aria-live="polite">'+(snapshot.word || '— — — —')+'</output></div><div class="orchestra-board" role="group" aria-label="Símbolos de la orquesta">'+noteOrder.map(note=>'<button type="button" data-note="'+note+'" style="animation-delay:'+(melody.indexOf(note)*.27)+'s" aria-label="Tocar '+noteNames[note]+'">'+note+'<small>'+noteNames[note]+'</small></button>').join('')+'</div>';
      const robot=snapshot.steps || ['→','↑','→','↑','→'];
      const robotBoard='<div class="robot-grid" role="img" aria-label="Robot en columna '+((robotResult?.x??0)+1)+', fila '+((robotResult?.y??2)+1)+'; hay una caja a su derecha y la base está arriba a la derecha.">'+Array.from({length:12},(_,i)=>{const x=i%4,y=Math.floor(i/4);return '<span class="robot-cell '+(x===1&&y===2?'robot-obstacle':x===3&&y===0?'robot-base':'')+'">'+(x===1&&y===2?'<i aria-hidden="true"></i>':x===3&&y===0?'<i aria-hidden="true">⌂</i>':'')+'</span>';}).join('')+'<svg class="robot-sprite" viewBox="0 0 64 64" aria-hidden="true" style="left:'+(((robotResult?.x??0)+.5)*25)+'%;top:'+(((robotResult?.y??2)+.5)*100/3)+'%"><path d="M32 9V3M26 3h12" stroke="#e3c785" stroke-width="3"/><rect x="10" y="14" width="44" height="32" rx="8" fill="#759ca2" stroke="#263f48" stroke-width="4"/><rect x="16" y="20" width="32" height="16" rx="4" fill="#283e48"/><circle cx="24" cy="28" r="3" fill="#f7d982"/><circle cx="40" cy="28" r="3" fill="#f7d982"/><path d="M23 41h18" stroke="#d3e8df" stroke-width="3"/><rect x="13" y="47" width="38" height="9" rx="4" fill="#364b4d"/><circle cx="21" cy="52" r="3" fill="#c7b68c"/><circle cx="43" cy="52" r="3" fill="#c7b68c"/></svg></div><p class="robot-status" aria-live="polite">'+(robotRunning?'El robot está siguiendo las flechas…':'Ordená las flechas de izquierda a derecha y probá la ruta.')+'</p><div class="robot-cards" role="group" aria-label="Tarjetas de ruta">'+robot.map((move,index)=>'<button type="button" class="'+(snapshot.robotSelected===index?'is-selected':'')+'" data-robot="'+index+'" '+(robotRunning||solved?'disabled':'')+' aria-label="Paso '+(index+1)+': '+(move==='↑'?'arriba':'derecha')+'" aria-pressed="'+(snapshot.robotSelected===index)+'"><small>'+(index+1)+'</small>'+move+'</button>').join('')+'</div><button type="button" data-run-robot '+(robotRunning||solved?'disabled':'')+'>Probar ruta</button><p class="puzzle-caption">Elegí dos flechas para cambiar su lugar.</p>';
      const connectionNames={programacion:'Programación I',robotica:'Robótica',testing:'Testing Digital'};
      const connections='<div class="connections-board"><svg class="connection-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="connection-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10Z"/></marker></defs>'+sourceOrder.map((key,index)=>{const year=snapshot.connections[key],target=yearOrder.indexOf(year);return target<0?'':'<path d="M 37 '+(index*33.333+16.667)+' C 50 '+(index*33.333+16.667)+', 50 '+(target*33.333+16.667)+', 63 '+(target*33.333+16.667)+'" marker-end="url(#connection-arrow)"/>';}).join('')+'</svg><div class="connection-column">'+sourceOrder.map(key=>'<button type="button" class="'+(snapshot.connections.selected===key?'is-selected':'')+'" data-source="'+key+'" '+(solved||connectionWrong?'disabled':'')+' aria-pressed="'+(snapshot.connections.selected===key)+'">'+connectionNames[key]+' <small>'+((snapshot.connections[key]||'—')+'.º')+'</small></button>').join('')+'</div><div class="connection-column">'+yearOrder.map(year=>'<button type="button" data-year="'+year+'" '+(solved||connectionWrong?'disabled':'')+'>'+year+'.º año</button>').join('')+'</div></div><p class="puzzle-caption '+(connectionWrong?'connection-error':'')+'" aria-live="polite">'+(connectionWrong?'✕ Algunas conexiones no coinciden. Volvé a intentarlo.':snapshot.connections.selected?'Ahora elegí el año para '+connectionNames[snapshot.connections.selected]+'.':'Elegí una materia y después un año para unirlos con una flecha.')+'</p>';
      const disks=snapshot.disks || [1,3,2];
      const disksBoard='<div class="disk-goal">▼ META</div><div class="disks-board" role="img" aria-label="Tres aros. Posiciones: '+disks.map((value,index)=>['A','B','C'][index]+' '+['arriba','derecha','abajo','izquierda'][value]).join(', ')+'."><div class="disk disk-a '+(diskChanged.includes(0)?'is-moving':'')+'" style="--mark:'+disks[0]+'"><span>A</span></div><div class="disk disk-b '+(diskChanged.includes(1)?'is-moving':'')+'" style="--mark:'+disks[1]+'"><span>B</span></div><div class="disk disk-c '+(diskChanged.includes(2)?'is-moving':'')+'" style="--mark:'+disks[2]+'"><span>C</span></div></div><div class="disk-controls"><button type="button" data-disk="0" '+(solved?'disabled':'')+'>Girar A + B</button><button type="button" data-disk="1" '+(solved?'disabled':'')+'>Girar B + C</button><button type="button" data-disk="2" '+(solved?'disabled':'')+'>Girar A + C</button></div><p class="puzzle-caption">Cada botón gira los dos aros que nombra.</p>';
      const unusedLetters=[...(snapshot.wordKeys||[])];for(const letter of snapshot.word){const index=unusedLetters.indexOf(letter);if(index>=0)unusedLetters.splice(index,1);}
      const wordButtons=room===0&&active==='shadows' ? '<div class="word-keyboard" role="group" aria-label="Letras disponibles">'+unusedLetters.map(letter=>'<button type="button" data-fill-letter="'+letter+'" aria-label="Elegir letra '+letter+'">'+letter+'</button>').join('')+'</div><button type="button" data-fill-undo>Borrar última letra</button> <button type="button" data-fill-check>Comprobar</button>' : '';
      const controls=room===0 && active==='shadows' ? wordButtons : room===0 && active==='pipes' ? pipes : room===1 && active==='pipes' ? mirrors : room===1 && active==='shadows' ? orchestra : room===2 && active==='emblem' ? robotBoard : room===2 && active==='pipes' ? connections : room===2 && active==='shadows' ? disksBoard : item.steps ? grid : item.word ? '<form><label>Tu respuesta <input name="answer" autocomplete="off" maxlength="32" required></label><div class="word-keyboard" role="group" aria-label="Teclado en pantalla">'+['QWERTYUIOP','ASDFGHJKLÑ','ZXCVBNM'].map(row=>'<div class="word-keyboard-row">'+Array.from(row,letter=>'<button type="button" data-letter="'+letter+'" aria-label="Letra '+letter+'">'+letter+'</button>').join('')+'</div>').join('')+'<button type="button" data-backspace aria-label="Borrar la última letra">⌫ Borrar</button></div><button type="submit">Comprobar</button></form>' : '<div class="answer-options">'+choiceOrder.map(i=>'<button type="button" data-answer="'+i+'">'+item.choices[i]+'</button>').join('')+'</div>';
      const location=['Banco de la muestra','Mecanismo del pasillo','Mesa del taller'][room];
      const reference=(room===0||room===1)&&active==='emblem' ? '../../proyectos/' : (room===0&&active==='shadows')||(room===2&&active==='pipes') ? '../../institucional/' : null;
      root.innerHTML='<div class="puzzle-backdrop puzzle-backdrop--'+room+'"></div><div class="puzzle-body" role="document"><button class="puzzle-close" type="button" aria-label="Cerrar acertijo">×</button><button class="puzzle-hint-top" type="button" data-hint>Pista</button><p class="puzzle-kicker">Habitación '+(room+1)+' · '+location+'</p><h2 id="puzzle-title">'+item.title+'</h2><p class="puzzle-hint" '+(snapshot.hints[active].shown?'':'hidden')+'>'+item.hint+(reference?' <a href="'+reference+'" target="_blank" rel="noopener">Consultar la página de PROA</a>':'')+'</p><div class="puzzle-stage"><p>'+item.question+'</p>'+(item.pattern?'<p class="word-pattern">'+(room===0&&active==='shadows'?Array.from(item.word,(letter,index)=>(snapshot.wordMissing||[]).includes(index)?(snapshot.word[snapshot.wordMissing.indexOf(index)]||'_'):letter).join(' '):item.pattern)+'</p>':'')+(solved?controls+'<div class="puzzle-success"><span aria-hidden="true">✦</span><strong>Cierre liberado</strong><small>'+['emblem','pipes','shadows'].filter(id=>isSolved(snapshot,id)).length+' de 3 acertijos resueltos</small></div>':controls)+'</div><p class="puzzle-feedback" aria-live="polite">'+(solved?'¡Muy bien! ¡Un paso más cerca de la salida!':message)+'</p><div class="puzzle-actions">'+(solved?'<button type="button" data-close>Continuar</button>':'')+'</div></div>';
      if(solved) root.querySelectorAll('.puzzle-stage button, .puzzle-stage input, .puzzle-stage select, [data-hint]').forEach(control=>{control.disabled=true;});
      if(item.word && !solved && !(room===0&&active==='shadows')) root.querySelector('input[name="answer"]').value=snapshot.word;
      const controlsAfter=Array.from(root.querySelectorAll('button, input, a'));
      root.hidden=false; (solved ? root.querySelector('[data-close]') : (focusStep!==null && root.querySelector('[data-direction="'+focusStep+'"]')) || (previousFocus>=0 && controlsAfter[previousFocus]) || root.querySelector('.puzzle-close')).focus();
    }
    function submit(value) {
      if (correct(room,active,value)) { snapshot.solved[active]=true; notify(); options.onSound?.('solved'); options.onSolved?.(active,clone(snapshot)); render(); }
      else { root.querySelector('.puzzle-feedback').textContent='¡Uy! Esa no era. ¡Intentémoslo otra vez!'; }
    }
    function submitPatio() { snapshot.solved[active]=true; notify(); if(room===0&&active==='pipes') options.onSound?.('water'); options.onSound?.('solved'); options.onSolved?.(active,clone(snapshot)); render(); }
    function clearConnections() {snapshot.connections={programacion:null,robotica:null,testing:null,selected:null};connectionWrong=false;wrongElapsed=0;}
    function runRobot() {
      if(robotRunning)return;
      const run=++robotRunId,cards=[...(snapshot.steps||['→','↑','→','↑','→'])];
      let index=0,elapsed=0,last=performance.now(),finished=false,success=false;
      robotRunning=true;robotResult={x:0,y:2};render();
      function tick(){
        if(run!==robotRunId||active!=='emblem'||room!==2)return;
        const now=performance.now();if(!paused&&!document.hidden)elapsed+=Math.min(now-last,150);last=now;
        if(!finished&&elapsed>=700){
          elapsed=0;const move=cards[index++],x=robotResult.x+(move==='→'?1:0),y=robotResult.y-(move==='↑'?1:0);
          if(x>3||y<0||(x===1&&y===2)){finished=true;options.onSound?.('blocked');}
          else{robotResult={x,y};const sprite=root.querySelector('.robot-sprite');if(sprite){sprite.style.left=((x+.5)*25)+'%';sprite.style.top=((y+.5)*100/3)+'%';}options.onSound?.('move');if(index===cards.length){finished=true;success=x===3&&y===0;}}
        }
        if(finished&&elapsed>=1000){robotRunning=false;if(success)submitPatio();else render('El robot se detuvo. Cambiá el orden y volvé a probar.');return;}
        global.setTimeout(tick,100);
      }
      global.setTimeout(tick,100);
    }
    function moveDirection(direction) {
      if(active!=='shadows'||isSolved(snapshot,active)) return;
      const item=ROOMS[room][2], next=[...steps,direction];
      if(next.length>200){render('Volvé al inicio para continuar.',direction);return;}
      const path=tracePath(item,next);
      if(!path.valid){options.onSound?.('blocked');render('Por ahí hay una pared o el borde del mapa.',direction);return;}
      steps=next;snapshot.steps=[...steps];progress();options.onSound?.('move');
      if(path.success) submit(steps); else render('',direction);
    }
    root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.classList.contains('puzzle-close') || button.hasAttribute('data-close')) return api.close();if(isSolved(snapshot,active)||connectionWrong)return;if(button.hasAttribute('data-hint')){snapshot.hints[active].shown=true;root.querySelector('.puzzle-hint').hidden=false;notify();}else if(button.hasAttribute('data-rotate')){const piece=snapshot.emblem.find(entry=>entry.id===button.dataset.rotate);piece.value=(piece.value+1)%4;progress();snapshot.emblem.every(entry=>entry.value===0)?submitPatio():render();}else if(button.hasAttribute('data-pipe')){const piece=snapshot.pipes.find(entry=>entry.id===button.dataset.pipe);const before=tracePipes(snapshot.pipes.map(entry=>entry.value)).cells.length;piece.value=(piece.value+1)%4;progress();const flow=tracePipes(snapshot.pipes.map(entry=>entry.value));if(flow.cells.length>before&&!flow.success)options.onSound?.('water');flow.success?submitPatio():render();}else if(button.hasAttribute('data-shadow')){const piece=snapshot.shadows.find(entry=>entry.id===button.dataset.shadow);piece.position=Number(button.dataset.position);progress();patioShadowSolved(snapshot)?submitPatio():render();}else if(button.hasAttribute('data-mirror')){const piece=snapshot.pipes.find(entry=>entry.id===button.dataset.mirror);piece.value=(piece.value+1)%2;progress();traceMirrors(snapshot.pipes.map(entry=>entry.value)).success?submitPatio():render();}else if(button.hasAttribute('data-sample')){options.onSound?.(melody.map(note=>({'☀':'note1','●':'note2','♣':'note3','✦':'note4'})[note]));render('La muestra: '+melody.map(note=>({'☀':'sol','●':'gota','♣':'hoja','✦':'estrella'})[note]).join(', ')+'.');}else if(button.hasAttribute('data-note')){options.onSound?.({'☀':'note1','●':'note2','♣':'note3','✦':'note4'}[button.dataset.note]);snapshot.word=(snapshot.word+button.dataset.note).slice(-4);progress();snapshot.word===melody.join('')?submitPatio():render(snapshot.word.length===4?'La secuencia no coincidió; podés volver a escuchar la muestra.':'');}else if(button.hasAttribute('data-robot')){const index=Number(button.dataset.robot);if(snapshot.robotSelected===null){snapshot.robotSelected=index;render();}else if(snapshot.robotSelected===index){snapshot.robotSelected=null;render();}else{const selected=snapshot.robotSelected;const cards=snapshot.steps||['→','↑','→','↑','→'];[cards[selected],cards[index]]=[cards[index],cards[selected]];snapshot.steps=cards;snapshot.robotSelected=null;progress();render();}}else if(button.hasAttribute('data-run-robot')){runRobot();}else if(button.hasAttribute('data-source')){snapshot.connections.selected=button.dataset.source;progress();render();}else if(button.hasAttribute('data-year')){const source=snapshot.connections.selected;if(!source)return render('Elegí primero una materia.');Object.keys(snapshot.connections).forEach(key=>{if(snapshot.connections[key]===button.dataset.year)snapshot.connections[key]=null;});snapshot.connections[source]=button.dataset.year;snapshot.connections.selected=null;progress();if(snapshot.connections.programacion==='3'&&snapshot.connections.robotica==='5'&&snapshot.connections.testing==='6')submitPatio();else if(['programacion','robotica','testing'].every(key=>snapshot.connections[key]!==null)){connectionWrong=true;wrongElapsed=0;options.onSound?.('blocked');render();}else render();}else if(button.hasAttribute('data-disk')){const disks=snapshot.disks||[1,3,2], change=[[1,1,0],[0,1,1],[1,0,1]][Number(button.dataset.disk)];diskChanged=change.flatMap((value,index)=>value?[index]:[]);snapshot.disks=disks.map((value,index)=>(value+change[index])%4);progress();snapshot.disks.every(value=>value===0)?submitPatio():render();}else if(button.hasAttribute('data-letter') || button.hasAttribute('data-backspace')){const input=root.querySelector('input[name="answer"]');if(!input)return;input.value=button.hasAttribute('data-backspace') ? Array.from(input.value).slice(0,-1).join('') : (input.value+button.dataset.letter).slice(0,32);snapshot.word=input.value;progress();}else if(button.hasAttribute('data-direction')){moveDirection(button.dataset.direction);}else if(button.hasAttribute('data-undo')){steps.pop();snapshot.steps=[...steps];progress();render('Último paso deshecho.');}else if(button.hasAttribute('data-reset')){steps=[];snapshot.steps=[];progress();render('El gato volvió al inicio.');}else if(button.hasAttribute('data-answer')) submit(ROOMS[room][['emblem','pipes','shadows'].indexOf(active)].choices[Number(button.dataset.answer)]);});
    root.addEventListener('click',event=>{if(event.target.closest('button')?.hasAttribute('data-robot'))robotResult=null;},true);
    root.addEventListener('click',event=>{if(!event.target.closest('button')?.hasAttribute('data-sample'))return;global.setTimeout(()=>{if(active==='shadows'&&room===1&&!root.hidden)root.querySelector('.orchestra-board')?.classList.add('is-sampling');},0);},true);
    root.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button||room!==0||active!=='shadows'||isSolved(snapshot,active))return;
      if(button.hasAttribute('data-fill-letter')){if(snapshot.wordMissing && snapshot.word.length<snapshot.wordMissing.length && snapshot.wordKeys.filter(letter=>letter===button.dataset.fillLetter).length>Array.from(snapshot.word).filter(letter=>letter===button.dataset.fillLetter).length){snapshot.word+=button.dataset.fillLetter;progress();render();}}
      else if(button.hasAttribute('data-fill-undo')){snapshot.word=snapshot.word.slice(0,-1);progress();render();}
      else if(button.hasAttribute('data-fill-check')){const answer=Array.from(ROOMS[0][1].word,(letter,index)=>snapshot.wordMissing.includes(index)?snapshot.word[snapshot.wordMissing.indexOf(index)]||'':letter).join('');if(answer===ROOMS[0][1].word)submitPatio();else render('Todavía no coincide. Borrá letras y volvé a intentar.');}
    });
    root.addEventListener('input',event=>{if(event.target.name==='answer')snapshot.word=event.target.value.slice(0,32);progress();});
    root.addEventListener('submit',event=>{event.preventDefault();submit(event.target.elements.answer.value);});
    root.addEventListener('keydown',event=>{event.stopPropagation();const direction={ArrowUp:'↑',ArrowLeft:'←',ArrowDown:'↓',ArrowRight:'→'}[event.key];if(direction && root.querySelector('[data-direction]') && active==='shadows' && !isSolved(snapshot,active)){event.preventDefault();moveDirection(direction);return;}if(event.key==='Escape'){event.preventDefault();api.close();}else if(event.key==='Tab'){const elements=Array.from(root.querySelectorAll('button, input, a')).filter(el=>!el.disabled && !el.closest('[hidden]'));const i=elements.indexOf(document.activeElement);if((event.shiftKey&&i===0)||(!event.shiftKey&&i===elements.length-1)){event.preventDefault();elements[event.shiftKey?elements.length-1:0].focus();}}});
    const visibility=()=>{lastTick=performance.now();};
    document.addEventListener('visibilitychange',visibility);
    timer=global.setInterval(()=>{const now=performance.now(), elapsed=Math.max(0,now-lastTick);lastTick=now;if(!active||paused||document.hidden||isSolved(snapshot,active))return;if(connectionWrong){wrongElapsed+=elapsed;if(wrongElapsed>=1600){clearConnections();progress();render('Probá de nuevo.');}return;}const hint=snapshot.hints[active],before=Math.floor(hint.elapsedMs/1000);hint.elapsedMs=Math.min(30000,hint.elapsedMs+elapsed);if(hint.elapsedMs>=30000&&!hint.shown){hint.shown=true;root.querySelector('.puzzle-hint').hidden=false;notify();}else if(Math.floor(hint.elapsedMs/1000)!==before)notify();},250);
    const api={open(id){if(!IDS[id])return;focus=document.activeElement;active=id;if(room===2&&id==='pipes'&&!isSolved(snapshot,id)&&['programacion','robotica','testing'].every(key=>snapshot.connections[key]!==null))clearConnections();sourceOrder=shuffledDifferent(['programacion','robotica','testing'],sourceOrder);yearOrder=shuffledDifferent(['3','5','6'],yearOrder);const optionsForRoom=ROOMS[room][['emblem','pipes','shadows'].indexOf(id)];choiceOrder=shuffledDifferent((optionsForRoom.choices||[]).map((_,i)=>i),choiceOrder);if(room===1&&id==='shadows'&&!isSolved(snapshot,id)){noteOrder=shuffledDifferent(['☀','●','♣','✦'],noteOrder);melody=shuffledDifferent(['☀','●','♣','✦'],melody);snapshot.word='';notify();}if(room===0&&id==='shadows'&&!isSolved(snapshot,id)&&(!snapshot.wordMissing||!snapshot.wordKeys)){snapshot.word='';snapshot.wordMissing=shuffledDifferent(Array.from({length:ROOMS[0][1].word.length},(_,i)=>i)).slice(0,5).sort((a,b)=>a-b);const required=snapshot.wordMissing.map(i=>ROOMS[0][1].word[i]);const distractors=shuffledDifferent(Array.from('BCFGHILMTUV').filter(letter=>!required.includes(letter))).slice(0,4);snapshot.wordKeys=shuffledDifferent([...required,...distractors]);notify();}steps=id==='shadows' && snapshot.steps && tracePath(ROOMS[room][2],snapshot.steps).valid ? snapshot.steps.slice() : [];lastTick=performance.now();render();},close(){if(!active)return;if(connectionWrong){clearConnections();notify();}robotRunId++;robotRunning=false;robotResult=null;diskChanged=[];active=null;root.hidden=true;root.innerHTML='';focus?.focus();options.onClose?.();},setPaused(value){if(paused!==Boolean(value)){paused=Boolean(value);lastTick=performance.now();}},setRoom(value){connectionWrong=false;wrongElapsed=0;robotRunId++;robotRunning=false;robotResult=null;diskChanged=[];room=value;},getSnapshot(){return clone(snapshot);},restore(raw){const clean=sanitizePuzzleSnapshot(raw,room);if(!clean)return false;snapshot=clean;return true;},destroy(){global.clearInterval(timer);document.removeEventListener('visibilitychange',visibility);}};
    return api;
  }
  const api = { ROOMS, correct, INITIAL_PUZZLES, newPuzzleSnapshot, ART, sanitizePuzzleSnapshot, isSolved, tracePipes, traceMirrors, tracePath, createPuzzleUI };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.EscapeProaPatioPuzzles = api;
}(typeof globalThis !== 'undefined' ? globalThis : this));
