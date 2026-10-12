import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('./exams.js',import.meta.url),'utf8');
const {QUESTION_BANK,makeExam,gradeExam,createExamUI}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

// Independent expected responses catch an accidental shifted answer index or shuffle.
const expected={
  teacher:['9','1 7/12','$45','12','−10','70°','120 cm³','7','1/3','6',
    'Amount of sunlight','Chemical → electrical → light','50 g','The grass','4 g/cm³',
    'A new substance forms','4 m/s','A book rests still on a desk','Liquid particles escape into gas','Control for comparison',
    '4.2 × 10⁻⁴','140 miles','128','2x + 5 = −1','14 km','5 N right','Natural eye color',
    'Its axis is tilted as it orbits the Sun','3','36 cm'],
  band:['1½','6','G major','Dotted quarter','3','E and F','B-flat major','Crescendo',
    'Hold it longer than its written value','Oboe','½ second','4','Dotted half + quarter','A minor','5',
    'Cancels a sharp or flat on that note','Presto','G-flat','f','3','W W H W W W H','B','G','B','B-flat',
    'Play notes short and detached','D major','4','Octave','Timpani']
};
for(const teacherId of ['teacher','band']){
  const bank=QUESTION_BANK[teacherId];
  assert.equal(bank.length,30);
  assert.equal(new Set(bank.map(q=>q.id)).size,30);
  assert.equal(new Set(bank.map(q=>q.prompt)).size,30);
  bank.forEach((item,i)=>{
    assert.equal(item.choices.length,4);
    assert.equal(new Set(item.choices).size,4);
    assert.ok(Number.isInteger(item.answer)&&item.answer>=0&&item.answer<4);
    assert.equal(item.choices[item.answer],expected[teacherId][i],item.id);
    assert.ok(item.prompt&&item.explanation);
  });
  const used=new Set();
  for(const day of [0,1,2,3,4,7]){
    const exam=makeExam(teacherId,day);
    assert.deepEqual(exam,makeExam(teacherId,day),'reloads cannot change a paper');
    assert.equal(exam.teacherId,teacherId);assert.equal(exam.dayIndex,day);assert.equal(exam.questions.length,5);
    assert.equal(new Set(exam.questions.map(item=>item.id)).size,5);
    for(const item of exam.questions){
      assert.ok(!used.has(item.id),'the six first-week school-day papers do not repeat questions');used.add(item.id);
      const original=bank.find(q=>q.id===item.id);
      assert.equal(item.choices[item.answer],original.choices[original.answer]);
      assert.deepEqual([...item.choices].sort(),[...original.choices].sort());
    }
  }
  assert.equal(used.size,30);
  const exam=makeExam(teacherId,0);
  for(const [correct,score,letter,isA,isBad] of [[5,100,'A',true,false],[4,80,'B',false,false],
    [3,60,'D',false,true],[2,40,'F',false,true],[1,20,'F',false,true],[0,0,'F',false,true]]){
    const answers=exam.questions.map((item,i)=>i<correct?item.answer:(item.answer+1)%4);
    assert.deepEqual(gradeExam(exam,answers),{score,letter,isA,isBad,correct,total:5});
  }
  assert.equal(gradeExam(exam,[]).correct,0);
  assert.equal(gradeExam(exam,exam.questions.map(q=>String(q.answer))).correct,0,'string indices do not count');
  const changed=makeExam(teacherId,0);changed.questions[0].choices[0]='mutated';
  assert.notEqual(makeExam(teacherId,0).questions[0].choices[0],'mutated','papers are independent of the frozen bank');
}
assert.throws(()=>makeExam('guardian',0),RangeError);
for(const day of [-1,1.5,NaN,Infinity,'0'])assert.throws(()=>makeExam('teacher',day),RangeError);
assert.throws(()=>gradeExam({questions:[]},[]),RangeError);
// Percentage boundaries also hold if later papers contain more questions.
const ten={questions:Array.from({length:10},()=>({answer:0}))};
assert.equal(gradeExam(ten,[0,0,0,0,0,0,0,0,0,1]).letter,'A');
assert.equal(gradeExam(ten,[0,0,0,0,0,0,0,1,1,1]).letter,'C');
assert.equal(gradeExam(ten,[0,0,0,0,0,0,0,1,1,1]).isBad,false);

// Minimal DOM exercises the actual UI lifecycle: confirmation, result review,
// close-before-callback, keyboard support, blocked perk notice, and no Escape retake.
class Element {
  constructor(id='',tagName='DIV'){this.id=id;this.tagName=tagName;this.children=[];this.dataset={};this.attributes={};this.events={};this.hidden=false;this.disabled=false;this.isConnected=true;this.textContent='';}
  setAttribute(name,value){this.attributes[name]=value;}
  addEventListener(name,callback){(this.events[name]??=[]).push(callback);}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;}
  focus(){document.activeElement=this;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){
    const descendants=this.children.flatMap(child=>[child,...child.querySelectorAll(selector)]);
    return descendants.filter(child=>child.tagName==='BUTTON'&&(!selector.includes(':not(:disabled)')||!child.disabled));
  }
  emit(name,event={}){for(const callback of this.events[name]||[])callback({target:this,preventDefault(){},stopPropagation(){},...event});}
}
const ids=['examPanel','examNext','examOptions','examProgress','examQuestion','examStatus','examTeacher','examSubject','examPerkNotice'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element(id,id==='examNext'?'BUTTON':'DIV')]));
elements.examPanel.append(elements.examOptions,elements.examNext);
const oldFocus=new Element('view','CANVAS');
globalThis.document={activeElement:oldFocus,getElementById:id=>elements[id],createElement:tag=>new Element('',tag.toUpperCase())};
let completed;
const ui=createExamUI({onComplete:result=>{assert.equal(ui.active,false);assert.equal(elements.examPanel.hidden,true);completed=result;}});
const exam=makeExam('teacher',0);
assert.equal(ui.open(exam,{perkBlocked:true}),true);assert.equal(ui.active,true);
assert.match(elements.examPerkNotice.textContent,/cannot grant protection/);
assert.equal(ui.open(makeExam('band',0)),false,'cannot replace an active test');
elements.examNext.emit('click');assert.match(elements.examProgress.textContent,/1 \/ 5/,'empty answers cannot advance');
elements.examPanel.emit('keydown',{key:'Escape'});assert.equal(ui.active,true,'Escape does not cancel an attempt');
for(let i=0;i<5;i++){
  elements.examPanel.emit('keydown',{key:String(exam.questions[i].answer+1)});
  assert.equal(elements.examNext.disabled,false);
  elements.examPanel.emit('keydown',{key:'Enter',target:elements.examOptions.children[exam.questions[i].answer]});
}
assert.equal(completed,undefined,'result explanation must remain until the continue button');
assert.match(elements.examQuestion.textContent,/Grade A · 100%/);
assert.match(elements.examStatus.textContent,/blocks tonight/);
assert.equal(elements.examOptions.children.length,5,'all explanations are available after grading');
assert.equal(ui.active,true);
elements.examNext.emit('click');
assert.equal(completed.teacherId,'teacher');assert.equal(completed.isA,true);assert.equal(completed.dayIndex,0);
assert.equal(document.activeElement,oldFocus);
const badExam=makeExam('band',1);ui.open(badExam);
for(let i=0;i<5;i++){
  elements.examOptions.children[(badExam.questions[i].answer+1)%4].emit('click');elements.examNext.emit('click');
}
assert.match(elements.examStatus.textContent,/Principal referral/);
assert.match(elements.examNext.textContent,/principal/);
elements.examNext.emit('click');assert.equal(completed.isBad,true);assert.equal(completed.teacherId,'band');
console.log('Exam bank, first-week rotation, grading, and UI lifecycle checks passed.');
