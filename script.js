// Dream Vending Machine v1.1 — 純前端、無需 API/資料庫
// 每局先鎖定抽取結果，重播完全相同的故事。
const $ = (selector) => document.querySelector(selector);
const screens = { home: $('#screen-home'), draw: $('#screen-draw'), story: $('#screen-story') };
const question = $('#question'), choices = $('#choices'), stepTag = $('#home-step'), back = $('#choice-back');
const stage = $('#stage'), bubble = $('#story-bubble'), partnerUse = $('#partner-use');
const storyTitle = $('#story-title'), caption = $('#stage-caption'), endingOverlay = $('#ending-overlay');
const progressFill = $('#progress-fill'), storyTime = $('#story-time');
const TOTAL = 16000, DRAW_TIME = 3600;
const state = { step: 0, location: 'random', mood: 'random', dream: null, serial: 0, timers: [], interval: null };
const random = (items) => items[Math.floor(Math.random() * items.length)];
const locationNames = { forest:'森林裡的小木屋', castle:'雲之城堡', ruins:'神祕遺跡' };
const moods = { funny:'搞笑', warm:'溫馨', random:'隨機' };

// 六種事件 × 三組短對話 × 兩種結局；所有台詞都和角色相容。
const events = {
  forest: [
    { id:'lantern', name:'怕黑的小燈精靈', partner:'小燈精靈', art:'prop-lantern',
      lines:[['咦？你怎麼一直發抖？','因為天黑了！我可是燈欸！'],['小燈，你為什麼躲起來？','我正在練習勇敢……先等一下。'],['這裡的燈怎麼會說話？','噓！不要告訴黑暗我在這裡！']],
      endings:{funny:['小燈精靈鑽進扭蛋，堅持搭便車回家。','我的車票呢？我怕黑車廂！'],warm:['小夢陪小燈坐了一會兒，整間木屋暖暖亮起。','原來有人陪，就沒那麼害怕了。']} },
    { id:'mushroom', name:'偷偷散步的蘑菇', partner:'小蘑菇', art:'prop-mushroom',
      lines:[['等等，那個蘑菇是不是動了？','沒有喔，我只是在換位置！'],['蘑菇也會散步嗎？','噓，我只是去買飲料。'],['你要去哪裡呀？','我去看看森林外面有沒有更軟的土。']],
      endings:{funny:['蘑菇被抓包後，立刻假裝自己是盆栽。','我是盆栽，盆栽不會講話。'],warm:['蘑菇送給小夢一張手寫的森林晚安票。','下次再一起散步，好不好？']} }
  ],
  castle: [
    { id:'cloud', name:'忘記飛的雲朵', partner:'小雲', art:'prop-cloud',
      lines:[['你怎麼坐在地上？','我忘記怎麼飛了……'],['你不是雲嗎？','對啊！所以我也覺得很奇怪！'],['要不要先試著跳一下？','我昨天就試過了，還跌倒。']],
      endings:{funny:['小雲宣布放棄飛行，決定靠兩隻不存在的腳走路。','用走的比較踏實！'],warm:['小夢輕輕推了一下，小雲慢慢飄回天空。','呀！我又記起來了！謝謝你！']} },
    { id:'guard', name:'想放假的守衛', partner:'小守衛', art:'prop-guard',
      lines:[['你怎麼坐在城堡門口？','我今天不想值班。'],['守衛不需要站好嗎？','我正在認真守護休息時間！'],['你在等誰呀？','等我的午休……已經三小時了。']],
      endings:{funny:['守衛舉起小旗子，宣布整座城堡今天公休。','通知一下：今天誰都不用上班！'],warm:['小夢幫忙站了三秒，守衛開心地轉了一圈。','你真是全城堡最棒的代班！']} }
  ],
  ruins: [
    { id:'statue', name:'愛打哈欠的石像', partner:'小石像', art:'prop-statue',
      lines:[['石像怎麼突然打哈欠？','站太久了，腿有點痠。'],['你不是應該一動也不動？','我已經站了九十九年了耶。'],['石像也會想睡覺嗎？','會啊，只是沒人發現我閉眼。']],
      endings:{funny:['石像伸個懶腰，決定再站一百年。','再站一下就好，真的。'],warm:['石像把一枚小小通行章送給小夢。','謝謝你陪老石頭說話。']} },
    { id:'pebble', name:'迷路的小精靈石', partner:'小精靈石', art:'prop-pebble',
      lines:[['你怎麼一直在轉圈圈？','我找不到自己的家啦！'],['你記得家在哪嗎？','好像在有很多石頭的地方……'],['你怎麼跑來這裡的？','我滾太快，結果忘了停！']],
      endings:{funny:['小石頭決定不找家了，跟著小夢一起旅行。','反正你走到哪，我就滾到哪！'],warm:['小夢把小石頭送回祭壇，遺跡亮起溫暖的光。','我到家了！這次一定記住路！']} }
  ]
};
const introductions = { forest:'這間小木屋好安靜喔……', castle:'雲朵踩起來，居然軟軟的。', ruins:'這裡藏著什麼故事呢？' };
const drawLines = ['這次會抽到什麼夢呢？','嘿嘿，我幫你偷偷挑一顆！','先說好，我也不知道裡面是什麼喔。'];

function switchScreen(name){
  Object.entries(screens).forEach(([key,element]) => { const active = key === name; element.hidden = !active; element.classList.toggle('is-active',active); });
}
function clearPlayback(){
  state.timers.forEach(clearTimeout); state.timers=[];
  if(state.interval) clearInterval(state.interval);
  state.interval=null;
}
function later(callback,ms){state.timers.push(setTimeout(callback,ms));}
function setStep(step){state.step=step;renderChoices();}
function chooseScene(location){state.location=location; $('#character-home').classList.remove('is-happy');void $('#character-home').offsetWidth;$('#character-home').classList.add('is-happy');setStep(1);}
function chooseMood(mood){state.mood=mood;setStep(2);}
function button(label,handler,primary=false){const el=document.createElement('button');el.type='button';el.className='choice'+(primary?' choice-primary':'');el.textContent=label;el.addEventListener('click',handler);return el;}
function renderChoices(){
  choices.replaceChildren();
  back.hidden = state.step===0;
  stepTag.textContent = `${String(state.step+1).padStart(2,'0')} / 03`;
  if(state.step===0){
    question.textContent='嗨嗨，我是小夢！你今天想去哪裡做夢呢？';
    [['🌲 森林小木屋','forest'],['☁ 雲之城堡','castle'],['🏛 神祕遺跡','ruins'],['✳ 交給命運','random']].forEach(([label,id]) => choices.append(button(label,()=>chooseScene(id))));
  } else if(state.step===1){
    question.textContent='好喔！那你希望這個夢是什麼感覺？';
    [['哈哈大笑','funny'],['暖暖的','warm'],['隨機就好','random']].forEach(([label,id]) => choices.append(button(label,()=>chooseMood(id))));
  } else {
    const locationText=state.location==='random'?'神祕地點':locationNames[state.location];
    question.textContent=`收到！${locationText} × ${moods[state.mood]}，準備好跟我去做夢了嗎？`;
    choices.append(button('開始抽夢！ ✳',newDream,true));
  }
}
back.addEventListener('click',()=>setStep(Math.max(0,state.step-1)));

function newDream(){
  clearPlayback();
  const world=state.location==='random'?random(Object.keys(locationNames)):state.location;
  const event=random(events[world]);
  const tone=state.mood==='random'?random(['funny','warm']):state.mood;
  state.serial++;
  state.dream={world,event,tone,exchange:random(event.lines),ending:event.endings[tone],number:state.serial};
  startDraw();
}
function startDraw(){
  clearPlayback();
  switchScreen('draw');
  $('#draw-line').textContent=random(drawLines);
  // 重啟 CSS 動畫，確保連續抽取也會正常播放。
  const panel=$('.draw-art');panel.style.animation='none';void panel.offsetWidth;panel.style.animation='';
  $('.draw-mascot').style.animation='none';$('.draw-machine').style.animation='none';$('.capsule-drop').style.animation='none';
  void $('.draw-mascot').offsetWidth;
  for(const sel of ['.draw-mascot','.draw-machine','.capsule-drop']) $(sel).style.animation='';
  later(playCurrentDream,DRAW_TIME);
}
function showBubble(text,partner=false){
  bubble.textContent=text;
  bubble.className='dialogue-float '+(partner?'from-partner':'from-hero');
  void bubble.offsetWidth;
  bubble.classList.add('is-visible');
}
function phase(name){stage.dataset.phase=name;}
function playCurrentDream(){
  if(!state.dream)return;
  clearPlayback();
  const {world,event,exchange,ending,number}=state.dream;
  switchScreen('story');
  endingOverlay.hidden=true;
  stage.dataset.world=world;
  $('#backdrop-use').setAttribute('href','#art-'+world);
  partnerUse.setAttribute('href','#'+event.art);
  storyTitle.textContent=locationNames[world];
  $('#story-number').textContent='DREAM '+String(number).padStart(3,'0');
  $('#ending-summary').textContent=ending[0];
  bubble.className='dialogue-float';bubble.textContent='';
  caption.textContent='慢慢走進夢裡……';phase('intro');progressFill.style.width='0%';
  // 移除再加回元素上的動畫，以重置每次重播的進場效果。
  const character=$('#story-character'); character.style.animation='none'; void character.offsetWidth;character.style.animation='';
  showBubble(introductions[world]);
  later(()=>{bubble.classList.remove('is-visible');},3200);
  later(()=>{phase('event'); caption.textContent='咦？遇見了'+event.partner+'！';},4000);
  later(()=>showBubble('小夢：'+exchange[0],false),4550);
  later(()=>showBubble(event.partner+'：'+exchange[1],true),7600);
  later(()=>{phase('ending');caption.textContent=ending[0];showBubble(event.partner+'：'+ending[1],true);},11200);
  later(()=>{bubble.classList.remove('is-visible');},14500);
  later(finishDream,TOTAL);
  const begin=performance.now();
  state.interval=setInterval(()=>{
    const elapsed=Math.min(TOTAL,performance.now()-begin);
    progressFill.style.width=`${elapsed/TOTAL*100}%`;
    const second=String(Math.floor(elapsed/1000)).padStart(2,'0');
    storyTime.textContent=`00:${second} / 00:16`;
  },80);
}
function finishDream(){
  clearPlayback();progressFill.style.width='100%';storyTime.textContent='00:16 / 00:16';
  endingOverlay.hidden=false;
}
$('#replay-btn').addEventListener('click',playCurrentDream);
$('#new-btn').addEventListener('click',newDream);
$('#home-btn').addEventListener('click',()=>{clearPlayback();switchScreen('home');setStep(2);});
renderChoices();switchScreen('home');
