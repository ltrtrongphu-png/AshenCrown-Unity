import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl=process.env.ASHEN_SMOKE_URL||'http://127.0.0.1:4173';
const artifactDir='artifacts/game-smoke/campaign-playthrough';
await mkdir(artifactDir,{recursive:true});

const browser=await chromium.launch({
  headless:true,
  args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']
});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage();
page.setDefaultTimeout(60000);
const pageErrors=[],consoleErrors=[],failedRequests=[],chapterLog=[];
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
page.on('requestfailed',request=>failedRequests.push({url:request.url(),failure:request.failure()?.errorText||'unknown'}));
page.on('response',response=>{
  if(response.status()>=400&&new URL(response.url()).origin===new URL(baseUrl).origin){
    failedRequests.push({url:response.url(),status:response.status()});
  }
});
let failure=null,finalState=null;
const screenshots=[];

const getState=()=>page.evaluate(()=>window.__ASHEN_TEST__?.status?.()||null);
const wait=(ms)=>page.waitForTimeout(ms);
async function clickFirstDialogueChoice(){
  await page.waitForFunction(()=>document.querySelector('#dialogue')?.classList.contains('show'));
  const buttons=page.locator('#choices button');
  const count=await buttons.count();
  assert.ok(count>0,'dialogue must have at least one actionable choice');
  const label=(await buttons.first().innerText()).trim();
  await buttons.first().click();
  await page.waitForFunction(()=>!document.querySelector('#dialogue')?.classList.contains('show'));
  await wait(100);
  return label;
}
async function stageAndInteract(expected){
  const staged=await page.evaluate(()=>window.__ASHEN_TEST__.stageNextStoryInteraction());
  assert.equal(staged?.ok,true,'a target should be available for the next objective: '+JSON.stringify(staged));
  assert.equal(staged.type,expected,'staged objective type should match campaign step');
  if(['ember','record','echo'].includes(expected)){
    assert.equal(staged.actual,expected,'the nearby interaction target must be the objective node');
  }
  await page.keyboard.press('g');
  await wait(120);
  return staged;
}
async function capture(name){
  const path=artifactDir+'/'+name;
  await page.screenshot({path,fullPage:false});
  screenshots.push(name);
}
async function assertLayoutFitsViewport(label){
  const bounds=await page.locator('#game').evaluate(canvas=>({
    x:canvas.getBoundingClientRect().x,y:canvas.getBoundingClientRect().y,
    width:canvas.getBoundingClientRect().width,height:canvas.getBoundingClientRect().height,
    viewportWidth:innerWidth,viewportHeight:innerHeight,documentWidth:document.documentElement.scrollWidth
  }));
  assert.ok(bounds.width>=300&&bounds.height>=300,label+': canvas too small '+JSON.stringify(bounds));
  assert.ok(bounds.documentWidth<=bounds.viewportWidth+2,label+': horizontal page overflow '+JSON.stringify(bounds));
}

try{
  await page.addInitScript(()=>window.addEventListener('ashen:game-ready',()=>{
    document.documentElement.dataset.ashenGameReady='true';
  },{once:true}));
  await page.goto(baseUrl+'/play.html?e2e=1',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.documentElement.dataset.ashenGameReady==='true',null,{timeout:60000});
  const tutorialKeys=await page.locator('.tutorial-grid').innerText();
  assert.match(tutorialKeys,/G\s*Interact/i,'tutorial must map G to interaction');
  assert.doesNotMatch(tutorialKeys,/E\s+Interact/i,'E must not be documented as interaction because it opens inventory');
  const localeCases=[
    {code:'en',interaction:'Interact',correct:'Press G',wrong:'Press E'},
    {code:'vi',interaction:'Tương tác',correct:'Nhấn G',wrong:'Nhấn E'},
    {code:'ja',interaction:'調べる',correct:'Gキーを押して',wrong:'Eキーを押して'},
    {code:'ko',interaction:'상호작용',correct:'G 키를 눌러',wrong:'E 키를 눌러'},
    {code:'zh',interaction:'互动',correct:'按 G',wrong:'按 E'}
  ];
  for(const locale of localeCases){
    await page.locator('#playLanguageSelect').selectOption(locale.code);
    await page.waitForFunction(({interaction})=>document.querySelector('.tutorial-grid')?.innerText.includes(interaction),locale);
    await page.waitForFunction(({correct})=>document.querySelector('#questSteps')?.innerText.includes(correct),locale);
    const tutorialText=await page.locator('.tutorial-grid').innerText();
    const questText=await page.locator('#questSteps').innerText();
    assert.ok(tutorialText.includes(locale.interaction),locale.code+' tutorial should use the selected language');
    assert.ok(questText.includes(locale.correct),locale.code+' quest hint should use the real G interaction key');
    assert.equal(questText.includes(locale.wrong),false,locale.code+' quest hint must not tell players to use the inventory key');
  }
  await page.locator('#playLanguageSelect').selectOption('en');
  await page.waitForFunction(()=>document.querySelector('.tutorial-grid')?.innerText.includes('Interact'));
  await page.locator('#tutorialStart').evaluate(button=>button.click());
  await page.waitForFunction(()=>typeof window.__ASHEN_TEST__?.status==='function',null,{timeout:15000});
  await page.waitForFunction(()=>{
    const s=window.__ASHEN_TEST__.status();
    return s.playerModelLoaded&&s.npcRosterLoaded&&s.npcProductionModelCount===3&&s.villagerProductionModelCount===10;
  },null,{timeout:90000});
  assert.equal(await page.evaluate(()=>window.__ASHEN_TEST__.suppressAmbientSpawns()),true,
    'the local E2E run should make ambient shade spawning deterministic');
  await assertLayoutFitsViewport('desktop initial layout');

  // Exercise the main UI surfaces before the long campaign.
  await page.keyboard.press('i');
  await page.waitForFunction(()=>document.querySelector('#inventoryMenu')?.classList.contains('show'));
  assert.ok(await page.locator('#inventoryGrid').count());
  await page.locator('#closeInventory').click();
  await page.keyboard.press('m');
  await page.waitForFunction(()=>document.querySelector('#worldMap')?.classList.contains('show'));
  assert.equal(await page.locator('#mapWorld .map-node').count(),5,'world map should show five world/region cards');
  await page.locator('#closeMap').click();
  await page.keyboard.press('j');
  await page.waitForFunction(()=>document.querySelector('#journal')?.classList.contains('open'));
  await page.locator('#journal [data-tab="campaign"]').click();
  const journalText=await page.locator('#journalBody').innerText();
  assert.match(journalText,/Chapter|chapter|The Last Ember/i,'campaign journal tab should render campaign content');
  await page.keyboard.press('j');
  await page.keyboard.press('o');
  await page.waitForFunction(()=>document.querySelector('#systemMenu')?.classList.contains('show'));
  assert.equal(await page.locator('#systemMenu').getAttribute('data-page'),'settings');
  assert.ok(await page.locator('#qualitySetting').count(),'settings should expose render quality');
  assert.ok(await page.locator('#uiScaleSetting').count(),'settings should expose UI scale');
  await page.locator('#qualitySetting').selectOption('performance');
  await page.locator('#qualitySetting').selectOption('auto');
  await page.locator('#systemClose').click();
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.querySelector('#pause')?.classList.contains('show'));
  await page.locator('#resume').click();
  await assertLayoutFitsViewport('desktop after UI interactions');
  await capture('play-ui-desktop.png');

  // Responsive check is confined to /play; no landing-page files are touched.
  await page.setViewportSize({width:390,height:844});
  await wait(450);
  await assertLayoutFitsViewport('mobile gameplay');
  assert.equal(await page.locator('.touch-controls').evaluate(el=>getComputedStyle(el).display==='flex'),true,
    'touch controls must be visible at the narrow mobile breakpoint');
  await page.keyboard.press('i');
  await page.waitForFunction(()=>document.querySelector('#inventoryMenu')?.classList.contains('show'));
  const inventoryBox=await page.locator('#inventoryMenu .inventory-card').boundingBox();
  assert.ok(inventoryBox&&inventoryBox.x>=0&&inventoryBox.width<=390+1,'inventory modal should fit a mobile viewport: '+JSON.stringify(inventoryBox));
  await page.locator('#closeInventory').click();
  const mobileStateBeforeParry=await getState();
  await page.locator('.touch-controls button[data-action="parry"]').dispatchEvent('pointerdown',{
    pointerId:41,pointerType:'touch',button:0,clientX:340,clientY:770
  });
  const mobileStateAfterParry=await getState();
  assert.ok(mobileStateAfterParry.stamina<mobileStateBeforeParry.stamina,
    'touch PARRY button must consume stamina');
  assert.ok(mobileStateAfterParry.parryWindow>0,
    'touch PARRY button must open a parry window');
  await page.setViewportSize({width:1440,height:900});
  await wait(350);

  let state=await getState();
  assert.equal(state.chapter,1,'new local session should start in Chapter 1');
  assert.equal(state.quest,0,'new local session should begin at the first story objective');
  assert.equal(state.map,'sanctuary');
  const questSteps=await page.locator('#questSteps').innerText();
  assert.match(questSteps,/Press G to hear/i,'quest journal should use the actual interaction key');
  assert.doesNotMatch(questSteps,/Press E to hear/i,'quest steps must not confuse interaction with inventory');

  for(let chapter=1;chapter<=10;chapter++){
    state=await getState();
    assert.equal(state.chapter,chapter,'chapter order must stay sequential');
    assert.equal(state.map,chapter===1||chapter===10?'sanctuary':chapter<=3?'hollow':chapter<=5?'crownlands':chapter<=7?'choir':'glass');
    const entry={chapter,title:null,objectives:[],bossInitialHp:null,bossFinalHp:null,choices:[],completed:false};

    // 1) Speak with Lyra and select a route.
    assert.equal(state.quest,0,'chapter should begin at Lyra');
    let target=await stageAndInteract('npc-lyra-intro');
    let choice=await clickFirstDialogueChoice();
    entry.choices.push({stage:'opening',label:choice});
    state=await getState();
    assert.equal(state.quest,1,'Lyra opening choice should unlock the ember trail');

    // 2) Collect the per-chapter ember quota using the real G interaction handler.
    let guard=0;
    while((state=await getState()).quest===1){
      assert.ok(guard++<6,'ember loop should be bounded by the per-region node budget');
      const before=state.chapterGathered;
      target=await stageAndInteract('ember');
      entry.objectives.push({type:'ember',before,after:(await getState()).chapterGathered});
      state=await getState();
      assert.ok(state.chapterGathered>before||state.quest===2,'ember interaction must advance progress');
    }
    assert.equal(state.quest,2,'ember quota should advance to the evidence quest');
    assert.ok(state.chapterGathered>=state.requiredEmbers,'chapter ember requirement should be met');

    // 3) Recover the chapter's unique record and ask Orren to validate a route.
    assert.equal(state.recordFound,false,'fresh chapter record should not be pre-completed');
    await stageAndInteract('record');
    state=await getState();
    assert.equal(state.recordFound,true,'interacting with the record marker should set the chapter record');
    await stageAndInteract('npc-orren-route');
    choice=await clickFirstDialogueChoice();
    entry.choices.push({stage:'route',label:choice});
    state=await getState();
    assert.equal(state.quest,3,'Orren route choice should unlock memory echoes');

    // 4) Recover required echoes. The final real interaction should spawn the chapter Warden.
    guard=0;
    while((state=await getState()).echoes<state.requiredEchoes){
      assert.equal(state.quest,3,'echoes can only be collected in the echo stage');
      assert.ok(guard++<6,'echo loop should be bounded by the per-region node budget');
      const before=state.echoes;
      await stageAndInteract('echo');
      state=await getState();
      entry.objectives.push({type:'echo',before,after:state.echoes});
      assert.ok(state.echoes>before,'echo interaction must advance progress');
      if(chapter===1&&state.echoes===1){
        const blocker=await page.evaluate(()=>window.__ASHEN_TEST__.startAmbientStoryBlocker());
        assert.equal(blocker.ok,true,'a wandering shade should be active to cover the competing-encounter edge case');
        assert.equal(blocker.isBoss,false,'the injected blocker must be an ordinary shade, not a Warden');
      }
    }
    if(chapter===1){
      state=await getState();
      assert.equal(state.echoes,state.requiredEchoes,'the final echo should be collected before resolving the blocker');
      assert.equal(state.encounterActive,true,'the ordinary shade should still be alive after the final echo');
      assert.equal(state.bossEncounter,false,'the Warden should wait while the ordinary shade is active');
      let blockerGuard=0;
      while((state=await getState()).encounterActive&&!state.bossEncounter){
        assert.ok(blockerGuard++<10,'ordinary shade should be defeatable with the actual attack path');
        const before=state.encounterHp;
        const aligned=await page.evaluate(()=>window.__ASHEN_TEST__.alignAnyEncounterAttack());
        assert.equal(aligned.ok,true,'align the player with the active wandering shade');
        await page.keyboard.press('f');
        await wait(420);
        state=await getState();
        if(state.encounterActive&&!state.bossEncounter){
          assert.ok(state.encounterHp<before,'F should damage the shade before the story Warden can appear');
        }
      }
      state=await getState();
      assert.equal(state.bossEncounter,true,'the mandatory Warden should spawn after the competing shade is defeated');
    }
    await page.waitForFunction(()=>window.__ASHEN_TEST__.status().bossEncounter===true,null,{timeout:12000});
    state=await getState();
    assert.ok(state.recordFound&&state.echoes>=state.requiredEchoes,'warden spawn must respect evidence and echo gates');
    assert.equal(state.wardenDefeated,false);
    assert.equal(state.encounterActive,true);
    await page.waitForFunction(()=>window.__ASHEN_TEST__.status().bossModelLoaded===true,null,{timeout:60000});
    await page.waitForFunction(()=>window.__ASHEN_TEST__.status().bossVisualAttached===true,null,{timeout:15000});

    // Chapter 1 exercises two campaign soft-lock regressions: reloading while a
    // Warden is mandatory, and dying while that encounter is active.
    if(chapter===1){
      const flushed=await page.evaluate(()=>window.__ASHEN_TEST__.flushLocalSave());
      assert.equal(flushed.encrypted,true,'pre-reload chapter state must be written as encrypted local save');
      assert.equal(flushed.chapter,1);
      assert.equal(flushed.quest,3);
      await page.reload({waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForFunction(()=>document.documentElement.dataset.ashenGameReady==='true',null,{timeout:60000});
      await page.waitForFunction(()=>{
        const s=window.__ASHEN_TEST__?.status?.();
        return s?.chapter===1&&s?.quest===3&&s?.recordFound&&s?.echoes>=s?.requiredEchoes
          &&s?.bossEncounter===true&&s?.saveEncrypted===true;
      },null,{timeout:90000});
      await page.waitForFunction(()=>window.__ASHEN_TEST__.status().bossVisualAttached===true,null,{timeout:30000});
      state=await getState();
      assert.equal(state.wardenDefeated,false,'Warden must resume when reloading mid-chapter');
      assert.equal(state.bossEncounter,true,'reload must restore the mandatory Warden encounter');
      assert.equal(state.bossVisualAttached,true,'resumed encounter must use the production boss model');
      const deathTriggered=await page.evaluate(()=>window.__ASHEN_TEST__.triggerPlayerDeath());
      assert.equal(deathTriggered,true,'test should trigger the same zero-HP recovery path as a real death');
      await page.waitForFunction(()=>{
        const s=window.__ASHEN_TEST__.status();
        return s.hp===s.maxHp&&s.quest===3&&s.wardenDefeated===false
          &&s.bossEncounter===true&&s.bossVisualAttached===true;
      },null,{timeout:15000});
      state=await getState();
      assert.equal(state.bossEncounter,true,'dying during a Warden fight must not soft-lock the chapter');
      assert.equal(state.wardenDefeated,false,'respawning a Warden must not mark it defeated');
    }

    const stagedCombat=await page.evaluate(()=>window.__ASHEN_TEST__.prepareCampaignBossFight());
    assert.equal(stagedCombat.ok,true,'a real campaign Warden must be active before combat');
    entry.bossInitialHp=stagedCombat.hp;

    // 5) Attack via the real keyboard handler; E2E grants temporary invulnerability only
    // on localhost so the test can exercise all ten story gates without repeated resets.
    guard=0;
    while((state=await getState()).quest===3){
      assert.ok(guard++<100,'Warden must be defeatable with the real attack path; hit budget exceeded');
      const before=state.bossHp;
      assert.ok(before>0,'active Warden should have positive HP');
      const aligned=await page.evaluate(()=>window.__ASHEN_TEST__.alignCampaignAttack());
      assert.equal(aligned.ok,true,'attack staging must keep the real boss within range');
      await page.keyboard.press('f');
      await page.waitForFunction(()=>window.__ASHEN_TEST__.status().attackCooldown<=0.04,null,{timeout:2500}).catch(()=>{});
      await wait(80);
      state=await getState();
      if(state.quest===3)assert.ok(state.bossHp<before,'F key attack should deal damage through the real combat handler; before='+before+', after='+state.bossHp);
    }
    state=await getState();
    assert.equal(state.quest,4,'defeating the Warden should unlock the chapter choice');
    assert.equal(state.wardenDefeated,true,'real Warden death must persist its story flag');
    entry.bossFinalHp=state.bossHp;

    // 6) Return to Lyra, make a chapter choice, and return to the Sanctuary.
    await stageAndInteract('npc-lyra-choice');
    choice=await clickFirstDialogueChoice();
    entry.choices.push({stage:'ending',label:choice});
    state=await getState();
    assert.equal(state.quest,5,'ending choice should mark the chapter complete');
    if(chapter<10){
      assert.equal(state.map,'sanctuary','chapters 1–9 should return home after their choice');
      await capture('chapter-'+String(chapter).padStart(2,'0')+'-complete.png');
      if(chapter===1){
        // A living merchant must be targetable, open the real shop, sell gear,
        // persist the purchase, and allow that gear to be equipped from Inventory.
        const beforeShop=await getState();
        const merchant=await page.evaluate(()=>window.__ASHEN_TEST__.stageMerchant('merchant_01'));
        assert.equal(merchant.ok,true,'nearby merchant must be found and interactable: '+JSON.stringify(merchant));
        assert.ok(merchant.coins>=55,'first chapter Warden rewards should fund the starter armor');
        assert.ok(merchant.level>=1,'starter armor should be unlocked');
        await page.keyboard.press('g');
        await page.waitForFunction(()=>document.querySelector('#shopMenu')?.classList.contains('show'));
        assert.match(await page.locator('#shopTitle').innerText(),/Elen/,'the merchant name should appear in the shop');
        assert.equal(await page.locator('#shopGrid .shop-card').count(),3,'merchant should show all three stocked items');
        const buyButton=page.locator('#shopGrid button[data-buy="0"]');
        assert.equal(await buyButton.isDisabled(),false,'starter armor should be purchasable after the first Warden');
        await buyButton.click();
        const afterPurchase=await getState();
        assert.equal(afterPurchase.inventoryCount,beforeShop.inventoryCount+1,'shop purchase should add exactly one inventory item');
        assert.ok(afterPurchase.coins<merchant.coins,'shop purchase should spend Ashen');
        assert.equal(afterPurchase.quest,5,'shopping must not reset campaign progress');
        await page.locator('#shopMenu .shop-close').click();
        await page.keyboard.press('i');
        await page.waitForFunction(()=>document.querySelector('#inventoryMenu')?.classList.contains('show'));
        const armorButton=page.locator('#inventoryGrid .inventory-item button').filter({hasText:'EQUIP'}).first();
        await armorButton.click();
        assert.match(await page.locator('.equip-slot[data-slot="armor"]').innerText(),/Hearthguard Coat/,
          'armor purchased from the merchant should be equipable');
        await page.locator('#closeInventory').click();
        const saveFlush=await page.evaluate(()=>window.__ASHEN_TEST__.flushLocalSave());
        assert.equal(saveFlush.encrypted,true,'merchant purchase and equipment should be saved in encrypted local state');
        const afterEquip=await getState();
        assert.equal(afterEquip.chapter,1);
        assert.equal(afterEquip.quest,5);
      }
      const home=await stageAndInteract('npc-next-expedition');
      choice=await clickFirstDialogueChoice();
      entry.choices.push({stage:'next-expedition',label:choice});
      state=await getState();
      assert.equal(state.chapter,chapter+1,'beginning next expedition should advance exactly one chapter');
      assert.equal(state.quest,0,'new chapter should begin at objective 0');
      assert.equal(state.chaptersComplete,chapter,'completed-chapter count should increment once');
    }else{
      assert.equal(state.map,'sanctuary','final chapter should close at the Sanctuary');
      await stageAndInteract('npc-legacy-home');
      choice=await clickFirstDialogueChoice();
      entry.choices.push({stage:'legacy-home',label:choice});
      state=await getState();
      assert.equal(state.chapter,10);
      assert.equal(state.quest,5);
      assert.equal(state.chaptersComplete,10,'finale should mark all ten chapters completed');
      assert.equal(state.legacyHome,true,'final home choice should persist');
      entry.completed=true;
      if(await page.locator('#systemMenu').evaluate(el=>el.classList.contains('show')))await page.locator('#systemClose').click();
      await capture('chapter-10-legacy-complete.png');
    }
    entry.title=await page.evaluate(ch=>window.ASHEN_CAMPAIGN?.[ch-1]?.title||('Chapter '+ch),chapter);
    chapterLog.push(entry);
    await writeFile(artifactDir+'/campaign-progress.json',JSON.stringify({chapterLog,state},null,2));
  }

  // Local encryption persistence: reload after the finale and verify the complete save survives.
  await page.waitForFunction(()=>window.__ASHEN_TEST__.status().saveEncrypted===true,null,{timeout:10000});
  await capture('ten-chapter-finale-before-reload.png');
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.documentElement.dataset.ashenGameReady==='true',null,{timeout:60000});
  await page.waitForFunction(()=>{
    const s=window.__ASHEN_TEST__?.status?.();
    return s?.chapter===10&&s?.quest===5&&s?.chaptersComplete===10&&s?.legacyHome===true&&s?.saveEncrypted===true;
  },null,{timeout:90000});
  finalState=await getState();
  await capture('ten-chapter-finale-after-reload.png');

  assert.equal(finalState.chapter,10);
  assert.equal(finalState.quest,5);
  assert.equal(finalState.chaptersComplete,10);
  assert.equal(finalState.legacyHome,true);
  assert.equal(finalState.saveEncrypted,true);
  assert.equal(pageErrors.length,0,'no uncaught browser errors during the full campaign');
  assert.equal(consoleErrors.length,0,'no browser console errors during the full campaign');
  assert.equal(failedRequests.length,0,'no same-origin request failures during the full campaign');

}catch(error){
  failure=String(error?.stack||error);
  try{
    finalState=await getState();
    await page.screenshot({path:artifactDir+'/campaign-failure.png',fullPage:false});
    screenshots.push('campaign-failure.png');
  }catch{}
}finally{
  finalState ||= await getState().catch(()=>null);
  await writeFile(artifactDir+'/campaign-diagnostics.json',JSON.stringify({
    baseUrl,completedChapters:chapterLog.filter(x=>x.completed||x.chapter<10&&x.objectives.length>0&&x.choices.some(c=>c.stage==='ending')).length,
    chapterLog,finalState,failure,pageErrors,consoleErrors,failedRequests,screenshots
  },null,2));
  await browser.close();
}
if(failure){console.error(failure);process.exitCode=1;}
else console.log('Campaign playthrough passed: all 10 chapters, 10 wardens, UI checks, encrypted save reload and no browser/request errors.');
