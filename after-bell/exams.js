// Stable, local question bank. These quizzes never send answers off the device.
const q = (id, prompt, choices, answer, explanation) => Object.freeze({id,prompt,choices:Object.freeze(choices),answer,explanation});
export const QUESTION_BANK = Object.freeze({
  teacher: Object.freeze([
    q('vale-01','Solve 3x − 7 = 20. What is x?',['7','9','11','13'],1,'Add 7 to get 3x = 27, then divide by 3.'),
    q('vale-02','What is 3/4 + 5/6 in simplest form?',['8/10','1 1/12','1 7/12','1 5/12'],2,'Use twelfths: 9/12 + 10/12 = 19/12 = 1 7/12.'),
    q('vale-03','A $60 jacket is discounted 25%. What is its sale price before tax?',['$15','$35','$40','$45'],3,'25% of $60 is $15. Subtract $15 from $60.'),
    q('vale-04','Blue and red counters have a ratio of 3:5. There are 32 counters total. How many are blue?',['12','15','20','24'],0,'There are 8 ratio parts. Each part has 4 counters, so blue has 3 × 4 = 12.'),
    q('vale-05','What is −4² + 6? There are no parentheses around −4.',['22','−10','10','−22'],1,'The exponent comes before the leading minus: −(4 × 4) + 6 = −10.'),
    q('vale-06','A triangle has angles of 42° and 68°. What is its third angle?',['60°','68°','70°','110°'],2,'Triangle angles total 180°. Subtract 42° + 68° = 110°.'),
    q('vale-07','A rectangular prism is 8 cm long, 3 cm wide, and 5 cm high. What is its volume?',['16 cm³','40 cm³','79 cm³','120 cm³'],3,'Volume is length × width × height: 8 × 3 × 5 = 120 cm³.'),
    q('vale-08','What is the median of 4, 11, 7, 2, and 16?',['7','8','11','16'],0,'Put them in order: 2, 4, 7, 11, 16. The middle number is 7.'),
    q('vale-09','A fair six-sided die is rolled once. What is the probability of rolling a number greater than 4?',['1/6','1/3','1/2','2/3'],1,'The favorable outcomes are 5 and 6: 2 out of 6, or 1/3.'),
    q('vale-10','Solve 2(x + 3) = 18. What is x?',['3','5','6','9'],2,'Divide by 2 to get x + 3 = 9, then subtract 3.'),
    q('vale-11','An experiment changes the amount of sunlight while keeping water and soil the same. Which is the independent variable?',['Plant height','Amount of water','Type of soil','Amount of sunlight'],3,'The independent variable is the factor the experimenter deliberately changes.'),
    q('vale-12','Which energy change mainly happens in a battery-powered flashlight?',['Chemical → electrical → light','Light → chemical → electrical','Sound → electrical → light','Thermal → nuclear → light'],0,'The battery stores chemical energy, which supplies electricity and then light (plus heat).'),
    q('vale-13','A sealed container holds 50 g of ice. All the ice melts without anything entering or leaving. What is the water’s mass?',['25 g','50 g','75 g','100 g'],1,'Changing state does not change the mass in a closed system.'),
    q('vale-14','In a food chain, grass → rabbit → fox, which organism is the producer?',['The rabbit','The fox','The grass','All three'],2,'Grass makes its own food using sunlight. Rabbits and foxes are consumers.'),
    q('vale-15','A 200 g object occupies 50 cm³. What is its density?',['0.25 g/cm³','2 g/cm³','10 g/cm³','4 g/cm³'],3,'Density = mass ÷ volume = 200 ÷ 50 = 4 g/cm³.'),
    q('vale-16','Which observation is the best evidence of a chemical change?',['A new substance forms','A sheet of paper is cut','Ice changes to liquid','A metal rod bends'],0,'Chemical changes produce new substances; the other choices describe physical changes.'),
    q('vale-17','A cart travels 24 meters in 6 seconds at a constant speed. What is its speed?',['3 m/s','4 m/s','6 m/s','144 m/s'],1,'Speed = distance ÷ time = 24 ÷ 6 = 4 meters per second.'),
    q('vale-18','Which is a balanced force situation?',['A bicycle speeds up','A ball changes direction','A book rests still on a desk','A dropped stone speeds up'],2,'The desk’s upward force balances the book’s weight, so it does not accelerate.'),
    q('vale-19','Which statement correctly describes evaporation?',['It occurs only at 100°C','Gas changes into liquid','Liquid becomes solid','Liquid particles escape into gas'],3,'Evaporation is the change from liquid to gas at a liquid’s surface.'),
    q('vale-20','Two plants get equal light and soil. Plant A receives fertilizer; plant B does not. What is plant B’s role?',['Control for comparison','Independent variable','Measured result','Proof that fertilizer works'],0,'The untreated plant provides a comparison so the fertilizer’s effect can be examined.'),
    q('vale-21','What is 0.00042 written in scientific notation?',['4.2 × 10⁻³','4.2 × 10⁻⁴','42 × 10⁻⁴','4.2 × 10⁴'],1,'Move the decimal four places right to get 4.2, so the exponent is −4.'),
    q('vale-22','A car uses 3 gallons to travel 84 miles. At the same rate, how far can it travel on 5 gallons?',['112 miles','126 miles','140 miles','168 miles'],2,'84 ÷ 3 = 28 miles per gallon. Then 28 × 5 = 140 miles.'),
    q('vale-23','What is the value of 2³ × 2⁴?',['14','32','64','128'],3,'With the same base, add exponents: 2⁷ = 128.'),
    q('vale-24','Which equation has a solution of x = −3?',['2x + 5 = −1','2x − 5 = −1','x + 7 = 10','3x = 9'],0,'Substitute −3: 2(−3) + 5 = −6 + 5 = −1.'),
    q('vale-25','A map uses 1 cm to represent 4 km. Two places are 3.5 cm apart on the map. What is the actual distance?',['7 km','14 km','16 km','28 km'],1,'Multiply 3.5 cm by 4 km per centimeter to get 14 km.'),
    q('vale-26','An object has 12 N pushing right and 7 N pushing left. What is the net force?',['19 N left','19 N right','5 N right','5 N left'],2,'Opposite forces subtract: 12 − 7 = 5 N toward the stronger, rightward force.'),
    q('vale-27','Which is an inherited trait rather than a learned skill?',['Riding a bicycle','Playing a trumpet','Speaking French','Natural eye color'],3,'Natural eye color is influenced by inherited genes. The other choices require learning.'),
    q('vale-28','Why does Earth have seasons?',['Its axis is tilted as it orbits the Sun','Earth is much closer to the Sun in summer','The Sun becomes hotter in summer','Earth stops rotating in winter'],0,'The tilted axis changes sunlight angle and day length during Earth’s orbit.'),
    q('vale-29','What is the slope of a line through (1, 2) and (4, 11)?',['2','3','4','9'],1,'Slope = change in y ÷ change in x = (11 − 2) ÷ (4 − 1) = 3.'),
    q('vale-30','A square has an area of 81 cm². What is its perimeter?',['18 cm','27 cm','36 cm','81 cm'],2,'The side length is √81 = 9 cm. Its perimeter is 4 × 9 = 36 cm.')
  ]),
  band: Object.freeze([
    q('reed-01','In 4/4 time, how many beats does a dotted quarter note receive?',['1','1½','2','3'],1,'A dot adds half the original value: 1 + ½ = 1½ quarter-note beats.'),
    q('reed-02','How many eighth notes fill one complete measure of 3/4 time?',['3','4','6','8'],2,'Each beat contains two eighth notes. Three quarter-note beats contain six.'),
    q('reed-03','Which major key has exactly one sharp in its key signature?',['C major','F major','D major','G major'],3,'G major has one sharp: F-sharp.'),
    q('reed-04','In common 6/8 meter, a bar is usually felt as two main beats. Which note gets one main beat?',['Dotted quarter','Quarter','Half','Eighth'],0,'Each main beat groups three eighth notes, equal to a dotted quarter note.'),
    q('reed-05','A half note tied to a quarter note lasts how many beats in 4/4 time?',['2','3','4','6'],1,'A tie joins the same pitch into one sound: 2 + 1 = 3 beats.'),
    q('reed-06','On a piano, which pair of white-key notes is a half step apart?',['C and D','F and G','E and F','A and B'],2,'E–F has no intervening key. The other listed pairs have a black key between them.'),
    q('reed-07','Which major key signature contains B-flat and E-flat only?',['F major','E-flat major','G major','B-flat major'],3,'B-flat major has exactly two flats: B-flat and E-flat.'),
    q('reed-08','Which symbol means gradually get louder?',['Crescendo','Decrescendo','Fermata','Staccato'],0,'A crescendo asks the player to increase volume gradually.'),
    q('reed-09','What does a fermata over a note usually ask you to do?',['Play it very quietly','Hold it longer than its written value','Play it an octave higher','Shorten it sharply'],1,'A fermata extends the note or rest beyond its usual duration.'),
    q('reed-10','Which instrument uses a double reed?',['Clarinet','Flute','Oboe','Trumpet'],2,'An oboe produces sound with two reed blades vibrating together.'),
    q('reed-11','At quarter note = 120, approximately how long is one quarter-note beat?',['2 seconds','1 second','¼ second','½ second'],3,'120 beats per minute means 2 beats per second, so each beat lasts ½ second.'),
    q('reed-12','How many sixteenth notes have the same total duration as one quarter note?',['4','2','6','8'],0,'A sixteenth note is one quarter of a quarter note’s duration.'),
    q('reed-13','In 4/4 time, which rhythm fills exactly one measure?',['Half + quarter','Dotted half + quarter','Quarter + eighth + half','Whole + quarter'],1,'A dotted half gets 3 beats and a quarter gets 1: 4 beats total.'),
    q('reed-14','What is the relative minor key of C major?',['C minor','E minor','A minor','D minor'],2,'A minor shares C major’s key signature, with no sharps or flats.'),
    q('reed-15','How many letter-name steps, including both ends, are in the interval C up to G?',['3','4','6','5'],3,'Count C, D, E, F, G: five letter names, so it is a fifth.'),
    q('reed-16','What does a natural sign do to a note?',['Cancels a sharp or flat on that note','Raises it two half steps','Always lowers it one octave','Doubles its duration'],0,'A natural restores the unaltered pitch of the note’s letter name.'),
    q('reed-17','Which tempo marking normally indicates the fastest speed?',['Largo','Presto','Andante','Adagio'],1,'Presto means very fast. Largo and adagio are slow; andante is a walking pace.'),
    q('reed-18','Which note is enharmonically equivalent to F-sharp on an equal-tempered piano?',['F-flat','G-sharp','G-flat','E-flat'],2,'F-sharp and G-flat are the same piano key with different names.'),
    q('reed-19','Which dynamic marking is louder: p, mp, mf, or f?',['p','mp','mf','f'],3,'Forte (f) means loud; the other listed markings are quieter.'),
    q('reed-20','A dotted half note lasts how many quarter-note beats?',['3','2','4','1½'],0,'A half note lasts 2 beats. Its dot adds 1 more, for 3.'),
    q('reed-21','Which major scale pattern is correct, using W for whole step and H for half step?',['W H W W H W W','W W H W W W H','H W W H W W W','W W W H W W H'],1,'A major scale follows whole, whole, half, whole, whole, whole, half.'),
    q('reed-22','Which note is the leading tone (seventh scale degree) in C major?',['A','G','B','D'],2,'C major is C D E F G A B. B is the seventh degree, one half step below C.'),
    q('reed-23','In treble clef, which note is on the second line from the bottom?',['E','B','D','G'],3,'Treble-clef lines from bottom to top are E, G, B, D, F.'),
    q('reed-24','In bass clef, which note is on the second line from the bottom?',['B','G','D','F'],0,'Bass-clef lines from bottom to top are G, B, D, F, A.'),
    q('reed-25','A B-flat clarinet plays its written C. What concert pitch sounds?',['C','B-flat','D','A'],1,'A B-flat clarinet sounds a whole step lower than its written pitch.'),
    q('reed-26','What does staccato generally mean?',['Slide between notes','Gradually slow down','Play notes short and detached','Hold notes smoothly together'],2,'Staccato asks for a shortened, detached articulation.'),
    q('reed-27','Which major key has the sharps F-sharp and C-sharp only?',['A major','G major','C major','D major'],3,'D major’s key signature contains two sharps: F-sharp and C-sharp.'),
    q('reed-28','In 4/4 time, a quarter rest followed by six eighth notes uses how many beats?',['4','3','5','7'],0,'The quarter rest takes 1 beat and six eighth notes take 3, totaling 4.'),
    q('reed-29','Which interval spans exactly twelve half steps?',['Perfect fifth','Octave','Major third','Perfect fourth'],1,'An octave contains twelve semitones (half steps).'),
    q('reed-30','Which percussion instrument commonly plays a definite pitch?',['Snare drum','Bass drum','Timpani','Crash cymbals'],2,'Timpani can be tuned to particular notes; the other listed instruments normally have indefinite pitch.')
  ])
});

const TEACHERS = Object.freeze({teacher:{name:'Ms. Vale',subject:'Math & science'},band:{name:'Mr. Reed',subject:'Music theory'}});

function random(seed) {
  let n = seed >>> 0;
  return () => {n = (Math.imul(n,1664525) + 1013904223) >>> 0;return n / 4294967296;};
}
function shuffle(list, rng) {
  const result = list.slice();
  for(let i=result.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}

export function makeExam(teacherId, dayIndex) {
  if(!Object.hasOwn(QUESTION_BANK,teacherId))throw new RangeError('Unknown exam teacher.');
  if(!Number.isInteger(dayIndex)||dayIndex<0)throw new RangeError('Exam day must be a nonnegative integer.');
  const bank = QUESTION_BANK[teacherId];
  // Saturday and Sunday have no classes. The final Monday receives the sixth set.
  const schoolDay = Math.floor(dayIndex/7)*5 + Math.min(dayIndex%7,5);
  const rng = random((dayIndex+1)*7919+(teacherId==='band'?104729:65537));
  const indices = shuffle(Array.from({length:5},(_,i)=>(schoolDay*5+i)%bank.length),rng);
  const questions = indices.map(index=>{
    const source=bank[index],order=shuffle([0,1,2,3],rng);
    return {...source,choices:order.map(i=>source.choices[i]),answer:order.indexOf(source.answer)};
  });
  return {teacherId,teacherName:TEACHERS[teacherId].name,subject:TEACHERS[teacherId].subject,dayIndex,questions};
}

export function gradeExam(exam, answers) {
  const total=exam.questions.length;
  if(!total)throw new RangeError('Cannot grade an empty exam.');
  const correct=exam.questions.reduce((n,item,i)=>n+(Number.isInteger(answers?.[i])&&answers[i]===item.answer?1:0),0);
  const score=Math.round(correct/total*100);
  const letter=score>=90?'A':score>=80?'B':score>=70?'C':score>=60?'D':'F';
  return {score,letter,isA:score>=90,isBad:score<70,correct,total};
}

export function createExamUI({onComplete,onCancel}={}) {
  const $=id=>document.getElementById(id);
  const panel=$('examPanel'),next=$('examNext'),options=$('examOptions');
  if(!panel||!next||!options)throw new Error('Exam markup is missing.');
  let current=null,answers=[],index=0,result=null,previousFocus=null;
  const choiceLetters=['A','B','C','D'];

  function close() {
    panel.hidden=true;current=null;answers=[];result=null;
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  }
  function draw() {
    const item=current.questions[index];
    $('examProgress').textContent=`QUESTION ${index+1} / ${current.questions.length}`;
    $('examQuestion').textContent=item.prompt;
    options.replaceChildren();
    item.choices.forEach((choice,i)=>{
      const button=document.createElement('button');
      button.type='button';button.className='exam-choice';button.dataset.answer=String(i);
      button.setAttribute('aria-pressed',String(answers[index]===i));
      const letter=document.createElement('span');letter.className='exam-choice-letter';letter.textContent=choiceLetters[i];
      const text=document.createElement('span');text.textContent=choice;
      button.append(letter,text);button.addEventListener('click',()=>select(i));options.append(button);
    });
    next.textContent=index===current.questions.length-1?'Submit test':'Confirm & next →';
    next.disabled=answers[index]===undefined;
    $('examStatus').textContent=answers[index]===undefined?'Choose one answer. 1–4 also work.':'Answer selected. Press Enter or confirm to continue.';
  }
  function select(answer) {
    if(!current||result)return;
    answers[index]=answer;
    for(const button of options.children)button.setAttribute('aria-pressed',String(Number(button.dataset.answer)===answer));
    next.disabled=false;
    $('examStatus').textContent='Answer selected. Press Enter or confirm to continue.';
  }
  function showResult() {
    const graded=gradeExam(current,answers);
    result={...graded,teacherId:current.teacherId,teacherName:current.teacherName,subject:current.subject,dayIndex:current.dayIndex};
    $('examProgress').textContent='TEST COMPLETE';
    $('examQuestion').textContent=`Grade ${graded.letter} · ${graded.score}% (${graded.correct}/${graded.total})`;
    options.replaceChildren();
    const blocked=panel.dataset.perkBlocked==='true';
    $('examStatus').textContent=graded.isBad?'Principal referral: escape the office. Teacher protection is blocked on your next school day.':graded.isA?(blocked?'Excellent work. Your disciplinary record blocks tonight’s protection.':'Excellent work. This teacher will protect you tonight.'):'Test passed. Only an A earns teacher protection tonight.';
    current.questions.forEach((item,i)=>{
      const review=document.createElement('div');review.className=`exam-review ${answers[i]===item.answer?'correct':'incorrect'}`;
      const heading=document.createElement('strong');heading.textContent=`${i+1}. ${answers[i]===item.answer?'Correct':'Incorrect'} · ${item.prompt}`;
      const answer=document.createElement('p');answer.textContent=`Answer: ${item.choices[item.answer]}. ${item.explanation}`;
      review.append(heading,answer);options.append(review);
    });
    next.disabled=false;next.textContent=graded.isBad?'Go to the principal →':'Return to class →';next.focus({preventScroll:true});
  }
  function advance() {
    if(!current)return;
    if(result){const completed=result;close();onComplete?.(completed);return;}
    if(answers[index]===undefined)return;
    if(index===current.questions.length-1)showResult();
    else {index++;draw();options.querySelector('button')?.focus({preventScroll:true});}
  }
  next.addEventListener('click',advance);
  panel.addEventListener('keydown',event=>{
    if(!current)return;
    // Escape is intentionally left to the game's pause handler; it never cancels a test.
    if(event.key==='Escape')return;
    if(event.key>='1'&&event.key<='4'&&!result){event.preventDefault();event.stopPropagation();select(Number(event.key)-1);}
    else if(event.key==='Enter'&&event.target!==next){event.preventDefault();event.stopPropagation();advance();}
    else if(event.key==='Tab'){
      const buttons=[...panel.querySelectorAll('button:not(:disabled)')];
      const first=buttons[0],last=buttons.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  // onCancel is deliberately not bound to a control: leaving and retrying would reveal answers.
  void onCancel;
  return {
    open(exam,{perkBlocked=false}={}) {
      if(current)return false;
      previousFocus=document.activeElement;current=exam;answers=[];index=0;result=null;
      panel.dataset.perkBlocked=String(perkBlocked);panel.hidden=false;
      $('examTeacher').textContent=exam.teacherName||TEACHERS[exam.teacherId]?.name||'Class test';
      $('examSubject').textContent=exam.subject;
      $('examPerkNotice').textContent=perkBlocked?'Principal restriction: you can take this test, but an A cannot grant protection tonight.':'A: teacher protection tonight · D/F: principal and no protection on your next school day.';
      draw();options.querySelector('button')?.focus({preventScroll:true});return true;
    },
    close,
    get active(){return current!==null;}
  };
}
