'use strict';
window.SLAP_DATA = {
  slaps: [
    {id:'snap',name:'Snap Slap',cost:12,power:14,width:.25,speed:1.15,unlock:0,desc:'Fast, forgiving. Interrupts a counter stance.',tag:'BEATS COUNTERS'},
    {id:'hook',name:'Wide Hook',cost:22,power:28,width:.18,speed:1.35,unlock:0,desc:'Hits around a low guard. High guards block it.',tag:'BEATS LOW GUARD'},
    {id:'palm',name:'Power Palm',cost:31,power:38,width:.125,speed:1.55,unlock:0,desc:'Cracks a high guard. Dangerous into a counter.',tag:'BREAKS HIGH GUARD'},
    {id:'feint',name:'Feint Tap',cost:8,power:6,width:.30,speed:1.05,unlock:1,desc:'Low damage. On a clean hit, opens the next stance.',tag:'OPENS NEXT TURN'},
    {id:'backhand',name:'Backhand',cost:18,power:23,width:.17,speed:1.6,unlock:3,desc:'Ignores guards. Timing is fast; costs less stamina.',tag:'IGNORES GUARD'},
    {id:'upper',name:'Rising Slap',cost:25,power:33,width:.14,speed:1.4,unlock:5,desc:'Punishes high guards; low guards stop it cold.',tag:'HIGH GUARD PUNISH'}
  ],
  rivals: [
    {name:'Marty Mitts',title:'The neighborhood loudmouth',style:'Big tells. Little patience.',hp:115,power:14,speed:1450,skin:'#e9a775',hair:'#804434',shirt:'#65c9bf',guard:['open','low','high'],pattern:['left','right','brace'],purse:100,quote:'My mom says I have championship hands.',weakness:'Clear tells. Learn the gold defense window.'},
    {name:'Disco Duke',title:'The man with the golden sleeve',style:'High guard • rhythmic swings',hp:145,power:16,speed:1380,skin:'#a96d50',hair:'#242236',shirt:'#ca86df',guard:['high','high','open'],pattern:['right','left','right','brace'],purse:140,quote:'You cannot slap what you cannot groove.',weakness:'Power palms crack his high guard.'},
    {name:'Brenda Bricks',title:'The warehouse wall',style:'Low guard • punishing overheads',hp:175,power:20,speed:1420,skin:'#e1a787',hair:'#4a2c33',shirt:'#df7559',guard:['low','low','high'],pattern:['brace','left','brace','right'],purse:180,quote:'I move refrigerators for a warm-up.',weakness:'Wide hooks get around her low guard.'},
    {name:'Vinnie Velvet',title:'The counter artist',style:'Counter stance • quick hands',hp:185,power:22,speed:1250,skin:'#cb916e',hair:'#262335',shirt:'#738bd7',guard:['counter','open','counter','high'],pattern:['left','right','left','brace'],purse:220,quote:'Go on. Swing big. I dare you.',weakness:'Use a snap in counter stance; save heavy slaps.'},
    {name:'Captain Cheek',title:'The former champion',style:'Changing guards • first feints',hp:210,power:24,speed:1210,skin:'#9d6a4f',hair:'#c9c4bb',shirt:'#e4b05b',guard:['high','counter','low','open'],pattern:['right','brace','left'],feint:.24,purse:260,quote:'Your hands talk. Mine have a whole speech.',weakness:'Feints change the tell before the gold flash.'},
    {name:'Neon Nia',title:'The lightning palm',style:'Fast windups • double rhythm',hp:225,power:23,speed:1080,skin:'#b87b60',hair:'#de6ba5',shirt:'#51b9c9',guard:['counter','high','low'],pattern:['left','right','brace','right'],feint:.3,purse:310,quote:'Blink. See what happens.',weakness:'Watch the final shoulder tell, then commit.'},
    {name:'Big Al Atlas',title:'The immovable object',style:'Heavy hands • armored guard',hp:285,power:29,speed:1300,skin:'#e0a681',hair:'#563630',shirt:'#79926c',guard:['high','low','high','counter'],pattern:['brace','brace','right','left'],purse:360,quote:'They built the table around me.',weakness:'Backhands ignore his guards. Endurance helps.'},
    {name:'Silk Serrano',title:'The magician',style:'Frequent feints • baited counters',hp:265,power:28,speed:1050,skin:'#ba8262',hair:'#252235',shirt:'#d18bca',guard:['counter','counter','low','high'],pattern:['right','left','brace'],feint:.48,purse:420,quote:'The first hand you see is never the one.',weakness:'Do not defend early; a feint reverses direction.'},
    {name:'Ruby Riot',title:'The undefeated challenger',style:'Relentless pace • mixed guards',hp:300,power:31,speed:1000,skin:'#d49774',hair:'#c64548',shirt:'#ce555c',guard:['low','counter','high','open'],pattern:['brace','left','right','left'],feint:.36,purse:480,quote:'Nine rungs up. One very long fall.',weakness:'Perfect defense creates your strongest opening.'},
    {name:'KING PALM',title:'The world circuit champion',style:'Championship reads • huge power',hp:355,power:35,speed:970,skin:'#91604b',hair:'#211e30',shirt:'#e8bf5e',guard:['counter','high','low','counter','open'],pattern:['left','brace','right','brace','left'],feint:.43,purse:700,quote:'A belt is heavy. So are my hands.',weakness:'Every tool matters. Read guards and manage stamina.'}
  ],
  upgrades: [
    {id:'power',name:'POWER',desc:'+3 damage per upgrade',base:70},
    {id:'precision',name:'PRECISION',desc:'Wider attack & defense windows',base:65},
    {id:'chin',name:'CHIN',desc:'+18 maximum health',base:65},
    {id:'endurance',name:'ENDURANCE',desc:'+10 maximum stamina, faster recovery',base:60}
  ]
};
