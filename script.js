/* Dream Vending Machine — no server or external libraries required. */
const SCENES = {
  forest: { name: '森林裡的小木屋', emoji: '🌲', events: [
    { id:'lamp', name:'怕黑的小燈精靈', friend:'💡', lines:[['咦？誰在叫我？','是我啦！可以不要關燈嗎？'],['這盞燈怎麼在發抖？','因為我有點怕黑...'],['你不是一盞燈嗎？','燈也可以怕黑吧！']], endings:{funny:{text:'小燈精靈鑽進扭蛋裡，堅持要搭便車。',say:'這樣就不用一個人走夜路啦！',move:'bounce'},warm:{text:'小夢陪著小燈坐了一會兒，小屋變得暖暖亮亮。',say:'有你在，就不怕黑了。',move:'glow'}} },
    { id:'mushroom', name:'偷跑的蘑菇', friend:'🍄', lines:[['你剛剛是不是動了？','沒有！我一直很安靜！'],['蘑菇也會散步嗎？','偶爾需要透透氣嘛。'],['站住！','被發現了，嘿嘿。']], endings:{funny:{text:'蘑菇爬上木箱，假裝自己是一顆盆栽。',say:'我現在是裝飾品，請勿打擾。',move:'bounce'},warm:{text:'蘑菇送給小夢一張小小的森林晚安票。',say:'謝謝陪我走這一小段路。',move:'glow'}} }
  ]},
  castle: { name:'雲之城堡', emoji:'🏰', events:[
    {id:'cloud',name:'忘記飛的雲朵',friend:'☁️',lines:[['你怎麼待在地上？','我忘記怎麼飄了。'],['要不要試著跳一下？','我只有一點點勇氣。'],['你不是雲嗎？','我也覺得這件事很奇怪。']],endings:{funny:{text:'小雲決定改用走路，還向小夢借了一雙鞋。',say:'走路也很有前途！',move:'walk'},warm:{text:'小夢輕輕推了一下，小雲又慢慢飄了起來。',say:'啊！我想起來了！',move:'float'}}},
    {id:'guard',name:'想休假的小守衛',friend:'🛡️',lines:[['請問可以進城堡嗎？','可以，但我真的好想下班。'],['你在守護什麼呢？','其實我也不太清楚。'],['你看起來好累喔。','我已經站了整整八分鐘！']],endings:{funny:{text:'守衛宣布今天城堡公休，自己先去睡午覺。',say:'正式通知：今天不上班！',move:'bounce'},warm:{text:'小夢幫忙代班三秒，守衛開心得原地轉圈。',say:'這是我最幸福的三秒鐘！',move:'spin'}}}
  ]},
  ruins:{name:'神祕遺跡',emoji:'🏛️',events:[
    {id:'statue',name:'愛打哈欠的石像',friend:'🗿',lines:[['剛剛是誰打哈欠？','是我，站太久了。'],['石像也要睡覺嗎？','當然！石頭也會累。'],['你還好嗎？','我只是有點站到腳麻。']],endings:{funny:{text:'石像伸伸懶腰，決定再站一百年看看。',say:'好啦，繼續上班！',move:'bounce'},warm:{text:'石像送小夢一枚小小的遺跡通行章。',say:'謝謝你願意聽我說話。',move:'glow'}}},
    {id:'stone',name:'迷路的小精靈石',friend:'💎',lines:[['你一直轉圈做什麼？','我忘了自己的位置！'],['你在找什麼？','一個很像我的小石台。'],['需要我幫忙嗎？','拜託，我快繞暈了。']],endings:{funny:{text:'精靈石決定黏著小夢，一起開始新的旅程。',say:'太好了！以後你就是我的地圖。',move:'follow'},warm:{text:'小夢把精靈石放回祭壇，遺跡亮起柔和的小光。',say:'我終於回家了，謝謝你。',move:'glow'}}}
  ]}
};
const $ = (id)=>document.getElementById(id);
const timers = [];
let currentDream = null, runId = 0, started = 0, currentDuration = 0;
const random = a => a[Math.floor(Math.random()*a.length)];
function schedule(fn,ms,token){ const id=setTimeout(()=>{if(token===runId)fn();},ms);timers.push(id); }
function cancelRun(){runId++;timers.forEach(clearTimeout);timers.length=0; $('progress-bar').style.transition='none';$('progress-bar').style.width='0%';}
function selections(){return {scene:document.querySelector('input[name="scene"]:checked').value,tone:document.querySelector('input[name="tone"]:checked').value};}
function makeDream(){const {scene,tone}=selections();const sceneId=scene==='random'?random(Object.keys(SCENES)):scene;const event=random(SCENES[sceneId].events);const actualTone=tone==='random'?random(['funny','warm']):tone;return {sceneId,event,tone:actualTone,dialogue:random(event.lines),ending:event.endings[actualTone]};}
function showScreen(name){$('setup-screen').classList.toggle('hidden',name!=='setup');$('play-screen').classList.toggle('hidden',name!=='play');window.scrollTo({top:0,behavior:'instant'});}
function setSpeech(who,words){const s=$('speech');s.innerHTML='';const b=document.createElement('b');b.textContent=who;const span=document.createElement('span');span.textContent=words;s.append(b,span);s.classList.remove('hidden');s.classList.remove('pop');void s.offsetWidth;s.classList.add('pop');}
function hideSpeech(){$('speech').classList.add('hidden');}
function actorMood(mood){$('actor').dataset.mood=mood;}
function act(name){const actor=$('actor');actor.className='stage-actor mascot';void actor.offsetWidth;if(name)actor.classList.add('act-'+name);}
function friendAct(name){const f=$('friend');f.className='friend visible';void f.offsetWidth;if(name)f.classList.add('act-'+name);}
function stageClass(name){$('stage').className='stage stage-'+name;}
function progress(duration,token){started=performance.now();currentDuration=duration;$('progress-bar').style.transition='none';$('progress-bar').style.width='0%';void $('progress-bar').offsetWidth;$('progress-bar').style.transition=`width ${duration}ms linear`;$('progress-bar').style.width='100%';for(let second=0;second<=Math.ceil(duration/1000);second++){schedule(()=>{$('stage-clock').textContent=`00:${String(Math.min(second,Math.floor(duration/1000))).padStart(2,'0')}`;},second*1000,token);}}
function startNew(){currentDream=makeDream();startPlayback();}
function startPlayback(){if(!currentDream)return;cancelRun();const token=runId;showScreen('play');$('result-panel').classList.add('hidden');$('play-title').textContent='你的夢正在打包...';$('stage-chapter').textContent='販賣機啟動中';$('stage-label').textContent='小夢正在領取夢境';$('stage-vending-art').classList.remove('hidden');$('friend').className='friend';$('friend-emoji').textContent=currentDream.event.friend;stageClass('vending');act('idle');actorMood('normal');hideSpeech();$('stage-clock').textContent='00:00';progress(3600,token);
 schedule(()=>{act('bounce');setSpeech('小夢',random(['這次會拿到什麼呢？','希望是個有趣的夢！','拜託不要太奇怪...']));},550,token);
 schedule(()=>{$('stage-vending-art').classList.add('dispense');$('stage-chapter').textContent='扭蛋掉出來了！';},1800,token);
 schedule(()=>{$('stage-vending-art').classList.remove('dispense');playDream(token);},3600,token);
}
function playDream(token){const d=currentDream,sc=SCENES[d.sceneId];stageClass(d.sceneId);$('stage-vending-art').classList.add('hidden');$('stage-chapter').textContent='第一幕 · 抵達目的地';$('stage-label').textContent=sc.name;$('play-title').textContent=sc.name;hideSpeech();actorMood('normal');act('walk');$('friend').className='friend';progress(16000,token);
 schedule(()=>setSpeech('小夢',random(['這裡有什麼呢？','好像有點不一樣耶。','我是不是來錯地方了？'])),700,token);
 schedule(()=>{hideSpeech();$('stage-chapter').textContent='第二幕 · 奇怪的相遇';friendAct('bounce');actorMood('surprised');act('startle');},4000,token);
 schedule(()=>setSpeech('小夢',d.dialogue[0]),4650,token);
 schedule(()=>{friendAct('float');setSpeech(d.event.name,d.dialogue[1]);},7350,token);
 schedule(()=>{hideSpeech();$('stage-chapter').textContent='第三幕 · 意想不到的結局';actorMood(d.tone==='warm'?'happy':'surprised');act('bounce');friendAct(d.ending.move);},11000,token);
 schedule(()=>setSpeech(d.event.name,d.ending.say),12000,token);
 schedule(()=>{hideSpeech();finishDream();},16000,token);
}
function finishDream(){const d=currentDream;$('stage-chapter').textContent='夢境完成 ✳';$('result-title').textContent='夢境結束啦！';$('result-copy').textContent=`${SCENES[d.sceneId].name} · ${d.event.name}｜${d.ending.text}`;$('result-panel').classList.remove('hidden');$('result-panel').scrollIntoView({block:'nearest',behavior:'smooth'});}
function returnHome(){cancelRun();currentDream=null;$('stage-vending-art').classList.remove('dispense');showScreen('setup');}
$('dream-form').addEventListener('submit',e=>{e.preventDefault();startNew();});$('back-button').addEventListener('click',returnHome);$('reset-button').addEventListener('click',returnHome);$('brand').addEventListener('click',e=>{e.preventDefault();returnHome();});$('replay-button').addEventListener('click',startPlayback);$('again-button').addEventListener('click',startNew);
