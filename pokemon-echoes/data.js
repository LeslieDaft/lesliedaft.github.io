/* Authored campaign and combat content. All artwork is drawn locally by game.js. */
window.ECHO_DATA = {
  types: ['normal','grass','fire','water','electric','flying','bug','rock','ground','poison','ghost','psychic','ice','fighting'],
  moves: {
    tackle:      {name:'Tackle',type:'normal',power:40,pp:35,accuracy:1},
    quick:       {name:'Quick Attack',type:'normal',power:45,pp:25,accuracy:1,priority:true},
    slam:        {name:'Body Slam',type:'normal',power:75,pp:15,accuracy:.95,status:'paralyze',chance:.15},
    hyper:       {name:'Hyper Beam',type:'normal',power:110,pp:5,accuracy:.9},
    vine:        {name:'Vine Whip',type:'grass',power:45,pp:25,accuracy:1},
    razor:       {name:'Razor Leaf',type:'grass',power:65,pp:20,accuracy:.95},
    solar:       {name:'Solar Beam',type:'grass',power:100,pp:10,accuracy:.9},
    ember:       {name:'Ember',type:'fire',power:45,pp:25,accuracy:1,status:'burn',chance:.15},
    flame:       {name:'Flamethrower',type:'fire',power:80,pp:15,accuracy:1,status:'burn',chance:.15},
    blast:       {name:'Fire Blast',type:'fire',power:110,pp:5,accuracy:.85,status:'burn',chance:.2},
    water:       {name:'Water Gun',type:'water',power:45,pp:25,accuracy:1},
    bubble:      {name:'Bubble Beam',type:'water',power:65,pp:20,accuracy:1},
    surf:        {name:'Surf',type:'water',power:85,pp:15,accuracy:1},
    hydro:       {name:'Hydro Pump',type:'water',power:110,pp:5,accuracy:.85},
    spark:       {name:'Thunder Shock',type:'electric',power:45,pp:25,accuracy:1,status:'paralyze',chance:.15},
    bolt:        {name:'Thunderbolt',type:'electric',power:85,pp:15,accuracy:1,status:'paralyze',chance:.15},
    thunder:     {name:'Thunder',type:'electric',power:115,pp:5,accuracy:.8,status:'paralyze',chance:.2},
    gust:        {name:'Gust',type:'flying',power:45,pp:25,accuracy:1},
    wing:        {name:'Wing Attack',type:'flying',power:65,pp:20,accuracy:1},
    air:         {name:'Air Slash',type:'flying',power:85,pp:15,accuracy:.95},
    bug:         {name:'Bug Bite',type:'bug',power:55,pp:25,accuracy:1},
    silver:      {name:'Silver Wind',type:'bug',power:75,pp:15,accuracy:1},
    rock:        {name:'Rock Throw',type:'rock',power:50,pp:25,accuracy:.95},
    slide:       {name:'Rock Slide',type:'rock',power:80,pp:15,accuracy:.9},
    quake:       {name:'Earthquake',type:'ground',power:90,pp:10,accuracy:1},
    mud:         {name:'Mud Shot',type:'ground',power:55,pp:20,accuracy:.95},
    poison:      {name:'Poison Sting',type:'poison',power:40,pp:30,accuracy:1,status:'poison',chance:.35},
    sludge:      {name:'Sludge',type:'poison',power:75,pp:15,accuracy:1,status:'poison',chance:.25},
    lick:        {name:'Lick',type:'ghost',power:40,pp:25,accuracy:1,status:'paralyze',chance:.2},
    shadow:      {name:'Shadow Ball',type:'ghost',power:85,pp:15,accuracy:1},
    confusion:   {name:'Confusion',type:'psychic',power:55,pp:25,accuracy:1},
    psychic:     {name:'Psychic',type:'psychic',power:85,pp:15,accuracy:1},
    ice:         {name:'Ice Shard',type:'ice',power:50,pp:25,accuracy:1},
    beam:        {name:'Ice Beam',type:'ice',power:85,pp:15,accuracy:1},
    punch:       {name:'Brick Break',type:'fighting',power:75,pp:15,accuracy:1},
    recover:     {name:'Recover',type:'normal',power:0,pp:5,accuracy:1,heal:.4}
  },
  species: [
    {id:'bulbasaur',name:'Bulbasaur',type:'grass',hp:45,atk:49,def:49,speed:45,moves:['tackle','vine','poison','razor'],evolve:{level:16,to:'ivysaur'},color:'#57b993'},
    {id:'ivysaur',name:'Ivysaur',type:'grass',hp:60,atk:62,def:63,speed:60,moves:['razor','sludge','tackle','vine'],evolve:{level:28,to:'venusaur'},color:'#4cae9d'},
    {id:'venusaur',name:'Venusaur',type:'grass',hp:80,atk:82,def:83,speed:80,moves:['solar','sludge','razor','slam'],color:'#479e86'},
    {id:'charmander',name:'Charmander',type:'fire',hp:39,atk:52,def:43,speed:65,moves:['tackle','ember','quick','flame'],evolve:{level:16,to:'charmeleon'},color:'#ee9c54'},
    {id:'charmeleon',name:'Charmeleon',type:'fire',hp:58,atk:64,def:58,speed:80,moves:['flame','quick','punch','ember'],evolve:{level:28,to:'charizard'},color:'#d66b4b'},
    {id:'charizard',name:'Charizard',type:'fire',hp:78,atk:84,def:78,speed:100,moves:['blast','air','flame','punch'],color:'#e79a4e'},
    {id:'squirtle',name:'Squirtle',type:'water',hp:44,atk:48,def:65,speed:43,moves:['tackle','water','bubble','ice'],evolve:{level:16,to:'wartortle'},color:'#76bad4'},
    {id:'wartortle',name:'Wartortle',type:'water',hp:59,atk:63,def:80,speed:58,moves:['bubble','ice','slam','water'],evolve:{level:28,to:'blastoise'},color:'#819ac9'},
    {id:'blastoise',name:'Blastoise',type:'water',hp:79,atk:83,def:100,speed:78,moves:['hydro','beam','surf','slam'],color:'#6595bd'},
    {id:'pikachu',name:'Pikachu',type:'electric',hp:35,atk:55,def:40,speed:90,moves:['spark','quick','bolt','slam'],evolve:{level:24,to:'raichu'},color:'#f2cf4c'},
    {id:'raichu',name:'Raichu',type:'electric',hp:60,atk:90,def:55,speed:110,moves:['bolt','quick','thunder','punch'],color:'#e3a44e'},
    {id:'pidgey',name:'Pidgey',type:'flying',hp:40,atk:45,def:40,speed:56,moves:['tackle','gust','quick','wing'],evolve:{level:15,to:'pidgeotto'},color:'#b99b69'},
    {id:'pidgeotto',name:'Pidgeotto',type:'flying',hp:63,atk:60,def:55,speed:71,moves:['wing','quick','gust','slam'],evolve:{level:29,to:'pidgeot'},color:'#bf9e68'},
    {id:'pidgeot',name:'Pidgeot',type:'flying',hp:83,atk:80,def:75,speed:101,moves:['air','quick','wing','hyper'],color:'#c9a56f'},
    {id:'caterpie',name:'Caterpie',type:'bug',hp:45,atk:30,def:35,speed:45,moves:['tackle','bug','poison','quick'],evolve:{level:10,to:'butterfree'},color:'#90bb51'},
    {id:'butterfree',name:'Butterfree',type:'bug',hp:60,atk:55,def:60,speed:70,moves:['silver','confusion','gust','poison'],color:'#b9a8d3'},
    {id:'geodude',name:'Geodude',type:'rock',hp:40,atk:80,def:100,speed:20,moves:['tackle','rock','mud','punch'],evolve:{level:22,to:'graveler'},color:'#a8a69b'},
    {id:'graveler',name:'Graveler',type:'rock',hp:65,atk:95,def:115,speed:35,moves:['slide','quake','punch','slam'],color:'#9f998c'},
    {id:'onix',name:'Onix',type:'rock',hp:50,atk:65,def:120,speed:70,moves:['rock','mud','slide','slam'],color:'#a7adb2'},
    {id:'oddish',name:'Oddish',type:'grass',hp:45,atk:50,def:55,speed:30,moves:['vine','poison','razor','tackle'],evolve:{level:19,to:'gloom'},color:'#6196b1'},
    {id:'gloom',name:'Gloom',type:'grass',hp:60,atk:65,def:70,speed:40,moves:['razor','sludge','vine','slam'],evolve:{level:29,to:'vileplume'},color:'#7998bd'},
    {id:'vileplume',name:'Vileplume',type:'grass',hp:75,atk:80,def:85,speed:50,moves:['solar','sludge','razor','recover'],color:'#7e8cbd'},
    {id:'psyduck',name:'Psyduck',type:'water',hp:50,atk:52,def:48,speed:55,moves:['water','confusion','quick','bubble'],evolve:{level:25,to:'golduck'},color:'#edc96f'},
    {id:'golduck',name:'Golduck',type:'water',hp:80,atk:82,def:78,speed:85,moves:['surf','psychic','ice','punch'],color:'#6badd1'},
    {id:'gastly',name:'Gastly',type:'ghost',hp:30,atk:45,def:30,speed:80,moves:['lick','poison','confusion','shadow'],evolve:{level:21,to:'haunter'},color:'#9d7bba'},
    {id:'haunter',name:'Haunter',type:'ghost',hp:45,atk:60,def:45,speed:95,moves:['shadow','sludge','lick','psychic'],evolve:{level:30,to:'gengar'},color:'#9978b7'},
    {id:'gengar',name:'Gengar',type:'ghost',hp:60,atk:85,def:60,speed:110,moves:['shadow','psychic','sludge','recover'],color:'#8669a4'},
    {id:'eevee',name:'Eevee',type:'normal',hp:55,atk:55,def:50,speed:55,moves:['tackle','quick','slam','punch'],color:'#b98c63'},
    {id:'snorlax',name:'Snorlax',type:'normal',hp:120,atk:100,def:65,speed:30,moves:['slam','punch','quake','recover'],color:'#648e91'},
    {id:'lapras',name:'Lapras',type:'ice',hp:100,atk:85,def:80,speed:60,moves:['surf','beam','slam','ice'],color:'#80b9d0'}
  ],
  badges: [
    {id:'sprout',name:'Sprout Badge',color:'#94cc77'},
    {id:'tide',name:'Tide Badge',color:'#6db5e2'},
    {id:'cinder',name:'Cinder Badge',color:'#ec9d64'},
    {id:'current',name:'Current Badge',color:'#e8cf67'},
    {id:'crag',name:'Crag Badge',color:'#bea889'},
    {id:'veil',name:'Veil Badge',color:'#b29bdf'}
  ],
  intro: [
    'Every spring, the Aurora Beacon sends a ribbon of light over the Meridian region. Pokémon follow it home. This year, the sky has gone quiet.',
    'Professor Willow: "Someone removed the six resonance prisms from the Beacon. Without them, migrating Pokémon are getting lost. The local Gym Leaders have clues, but they only trust trainers who understand their partners."',
    'Your friend Rowan left ahead of you. A company called Team Relay says it can repair everything. Willow thinks their perfect promise is hiding something.',
    'Choose a partner, explore eight regions, earn six badges, and discover what Team Relay took from the sky. Your adventure saves automatically; export a backup from the menu to carry it to another device.'
  ],
  regions: [
    {
      id:'mossbank',name:'Mossbank Meadow',theme:'meadow',description:'Sunlit hedgerows, the first Gym, and a strange silence in the sky.',level:5,wild:['pidgey','caterpie','oddish','eevee','pikachu','bulbasaur'],
      story:[
        'Professor Willow waves from the field station. "A good trainer notices what a Pokémon needs. Heal at the green-roofed Center, buy supplies, then meet the four meadow trainers before challenging Fern."',
        'A Team Relay flyer promises: NO MORE LOST POKÉMON. NO MORE UNCERTAINTY. A child has drawn a question mark under it.',
        'Fern found a metal splinter near the Beacon. It bears the same symbol as Relay’s delivery vans. Win her trust and she will give it to you.'
      ],
      npcs:[
        {x:5,y:8,name:'Professor Willow',text:'Catch a few different types rather than raising only one partner. Grass beats Water and Rock; Fire beats Grass and Bug; Water beats Fire. Electric helps against Water and Flying. Heal for free at every Center.'},
        {x:17,y:15,name:'Rowan’s note',text:'I almost challenged Fern with only a Water Pokémon. Then I remembered she grows a garden for a living. Catching a Pidgey was the smarter idea. Meet you in Tideglass! — Rowan'}
      ],
      trainers:[
        {id:'mossbank-1',name:'Scout Pip',x:8,y:10,dialogue:['First adventure? Mine too. Let’s learn this together.','A Pokémon grows stronger from every real battle.'],team:[{species:'caterpie',level:5},{species:'pidgey',level:5}],reward:110},
        {id:'mossbank-2',name:'Gardener Lark',x:15,y:8,dialogue:['The grass is full of surprises. Watch which attacks work best.','Different types turn a difficult fight into an easy one.'],team:[{species:'oddish',level:6},{species:'caterpie',level:6}],reward:130},
        {id:'mossbank-3',name:'Courier Mina',x:21,y:12,dialogue:['I delivered Relay’s boxes. The labels said medical equipment, but they hummed.','The humming sounded like the old Beacon. That isn’t medical equipment.'],team:[{species:'eevee',level:6},{species:'pidgey',level:7}],reward:150},
        {id:'mossbank-4',name:'Rival Rowan',x:12,y:15,dialogue:['Willow asked us both to investigate. Let’s see whose team is ready.','All right. We’ll need both our teams before this is over.'],team:[{species:'pikachu',level:7},{species:'squirtle',level:7}],reward:180},
        {id:'mossbank-boss',name:'Gym Leader Fern',x:23,y:5,boss:true,badge:'sprout',dialogue:['Roots bend around obstacles. Can your team adapt, too?','You’ve earned the Sprout Badge and my trust. Take this splinter. Relay’s coastal warehouse uses the same alloy.'],team:[{species:'oddish',level:8},{species:'bulbasaur',level:8},{species:'butterfree',level:9}],reward:400}
      ]
    },
    {
      id:'tideglass',name:'Tideglass Harbor',theme:'coast',description:'A working harbor with missing shipments and a Water Gym on the pier.',level:9,wild:['psyduck','squirtle','pidgey','pikachu','eevee'],
      story:[
        'The harbor’s tide clock is six hours wrong. Dockworkers say every compass jumped when Relay’s ship arrived.',
        'Captain Brine closed the main pier until somebody explains the interference. Four trainers are checking the docks. Earn their reports, then challenge the Captain.',
        'A manifest lists six resonance prisms as obsolete salvage. The destination has been scratched out, but a soot mark points toward Cinderworks.'
      ],
      npcs:[
        {x:5,y:8,name:'Dockhand Ivo',text:'A healthy wild Pokémon is hard to catch. Lower its HP first, then throw a Poké Ball. Trainer Pokémon belong to their trainers and cannot be caught.'},
        {x:17,y:15,name:'Harbor medic',text:'Your Center heals HP and restores move PP. There is no fee. Team Relay tried to sell us a subscription for the same thing.'}
      ],
      trainers:[
        {id:'tideglass-1',name:'Deckhand Sol',x:8,y:10,dialogue:['Water reflects everything. Sometimes even a company’s secrets.','I saw Relay unloading a crystal case after midnight.'],team:[{species:'psyduck',level:9},{species:'squirtle',level:10}],reward:190},
        {id:'tideglass-2',name:'Lifeguard Mara',x:15,y:8,dialogue:['Speed helps on a rescue. It also helps in battle.','Pikachu’s fast, but a sturdy partner can take a hit and answer back.'],team:[{species:'pikachu',level:10},{species:'psyduck',level:10}],reward:210},
        {id:'tideglass-3',name:'Fisher Otis',x:21,y:12,dialogue:['The Pokémon stopped following the migration lights. That scares me more than a storm.','Relay’s engineer said the old Beacon was inefficient. It still got everyone home.'],team:[{species:'squirtle',level:10},{species:'pidgeotto',level:11},{species:'psyduck',level:10}],reward:230},
        {id:'tideglass-4',name:'Relay Inspector Vale',x:12,y:15,dialogue:['Private company business. Your badges don’t grant access.','Fine. The shipment went inland. I wasn’t told what was inside.'],team:[{species:'geodude',level:11},{species:'eevee',level:11}],reward:250},
        {id:'tideglass-boss',name:'Gym Leader Brine',x:23,y:5,boss:true,badge:'tide',dialogue:['A captain prepares for rough water. Show me more than one good attack.','The Tide Badge is yours. Relay bought every prism and sent them to the furnaces. Find Engineer Cora in Cinderworks.'],team:[{species:'psyduck',level:12},{species:'wartortle',level:12},{species:'lapras',level:13}],reward:520}
      ]
    },
    {
      id:'cinderworks',name:'Cinderworks Foundry',theme:'fire',description:'Warm brick lanes surround furnaces powered by stolen light.',level:13,wild:['charmander','geodude','onix','eevee','pidgeotto'],
      story:[
        'Cinderworks should smell like coal. Instead the air tastes like a thunderstorm. Behind the foundry walls, blue light pulses through old pipes.',
        'Engineer Cora wants the machinery stopped, but shutting it down abruptly could trap the workers. Her four crew leaders each guard a manual release.',
        'Team Relay is not destroying the prisms. It is building a machine that will make Pokémon follow commands broadcast from the Beacon.'
      ],
      npcs:[
        {x:5,y:8,name:'Engineer Cora',text:'Fire is strong against Grass and Bug, but Water and Rock resist it. Bring a balanced team. If a partner faints, switch to another; the battle is only over when your whole party is down.'},
        {x:17,y:15,name:'Foundry apprentice',text:'Relay calls its machine the Quiet Array. A town where no Pokémon ever wanders away sounds good until you realize none of them can choose to leave.'}
      ],
      trainers:[
        {id:'cinderworks-1',name:'Welder Jax',x:8,y:10,dialogue:['I can’t leave this valve unguarded. Prove you can handle the heat.','One manual release is open. Tell Cora I’m on her side.'],team:[{species:'charmander',level:13},{species:'geodude',level:14},{species:'charmander',level:14}],reward:280},
        {id:'cinderworks-2',name:'Boiler Tech Nia',x:15,y:8,dialogue:['Too much power breaks the system. So does too little.','A mixed team works like a good engine. Every part covers another.'],team:[{species:'onix',level:14},{species:'charmeleon',level:14}],reward:300},
        {id:'cinderworks-3',name:'Relay Guard Eno',x:21,y:12,dialogue:['The Array will solve every migration problem. Why interfere?','You’re saying the Pokémon should get a choice? I never thought about that.'],team:[{species:'pidgeotto',level:15},{species:'pikachu',level:14},{species:'geodude',level:14}],reward:320},
        {id:'cinderworks-4',name:'Shift Chief Ashby',x:12,y:15,dialogue:['Last release. Don’t waste your best move just because it looks impressive.','The stronger attacks have less PP. The Center will restore them before the leader.'],team:[{species:'charmeleon',level:15},{species:'onix',level:15},{species:'eevee',level:15}],reward:350},
        {id:'cinderworks-boss',name:'Gym Leader Cora',x:23,y:5,boss:true,badge:'cinder',dialogue:['The releases are open. One last test before I trust you with the shutdown.','Take the Cinder Badge. The furnace is safe, but the prisms already left. Relay’s signal tower in Voltspire is transmitting again.'],team:[{species:'charmeleon',level:16},{species:'graveler',level:16},{species:'charmeleon',level:17}],reward:650}
      ]
    },
    {
      id:'voltspire',name:'Voltspire Heights',theme:'city',description:'Rooftop antennas, bright signs, and a signal that nobody can ignore.',level:17,wild:['pikachu','eevee','pidgeotto','geodude','gastly'],
      story:[
        'Every radio in Voltspire plays the same three notes. Pokémon turn toward the central tower whenever the melody repeats.',
        'Gym Leader Tessa built the city’s public radio network. Relay has locked her out of it. Her technicians need four access keys before she can interrupt the broadcast.',
        'A familiar voice breaks through the static: Rowan is following a Relay convoy into Slatepass. Then the transmission cuts off.'
      ],
      npcs:[
        {x:5,y:8,name:'Radio host Jun',text:'Electric moves punish Water and Flying Pokémon. Rock-type Pokémon are not the same as Ground types, but Ground moves are very useful against Electric opponents.'},
        {x:17,y:15,name:'Tessa’s technician',text:'Trading a little HP for a free switch can be smart. A Pokémon that resists the opponent’s strongest move may win more safely than the one with the highest level.'}
      ],
      trainers:[
        {id:'voltspire-1',name:'Antenna Climber Dex',x:8,y:10,dialogue:['You need the first access key? Catch me at ground level.','The key’s yours. Tessa says an honest signal should work in both directions.'],team:[{species:'pikachu',level:17},{species:'pidgeotto',level:18},{species:'eevee',level:18}],reward:380},
        {id:'voltspire-2',name:'Street Performer Bea',x:15,y:8,dialogue:['The broadcast keeps interrupting my music. Let’s make a little noise.','I found a key behind Relay’s speaker truck. Put it to better use.'],team:[{species:'butterfree',level:18},{species:'pikachu',level:19},{species:'gloom',level:18}],reward:400},
        {id:'voltspire-3',name:'Relay Analyst Quill',x:21,y:12,dialogue:['Choice introduces error. The Array removes both.','Your team changed tactics. My model didn’t predict that.'],team:[{species:'gastly',level:19},{species:'pikachu',level:19},{species:'graveler',level:19}],reward:420},
        {id:'voltspire-4',name:'Tower Warden Lio',x:12,y:15,dialogue:['I guard the emergency switch. Show me you won’t make this worse.','That was careful battling. Here’s the final access key.'],team:[{species:'pidgeotto',level:20},{species:'raichu',level:20},{species:'onix',level:19}],reward:450},
        {id:'voltspire-boss',name:'Gym Leader Tessa',x:23,y:5,boss:true,badge:'current',dialogue:['Stay calm when the whole world is buzzing. Ready?','The Current Badge is yours. I stopped the broadcast, but its source is under Slatepass. Find Rowan before Relay does.'],team:[{species:'pikachu',level:20},{species:'raichu',level:21},{species:'graveler',level:20},{species:'raichu',level:21}],reward:780}
      ]
    },
    {
      id:'slatepass',name:'Slatepass Quarry',theme:'mountain',description:'Switchback paths wind around an old observatory and a sealed tunnel.',level:21,wild:['geodude','onix','graveler','pidgeotto','snorlax'],
      story:[
        'The quarry’s stone walls carry every sound. Deep below, the three-note signal keeps repeating even though Tessa shut down the tower.',
        'Rowan is safe, but Relay sealed the tunnel behind them. Gym Leader Flint knows an older route through the observatory. His four surveyors hold the passage markers.',
        'The observatory records prove the Beacon never controlled Pokémon. It showed them a path. Relay rewrote that discovery as an instruction manual.'
      ],
      npcs:[
        {x:5,y:8,name:'Rowan',text:'They nearly caught me, but my team got us out. Don’t try to win every fight with one partner. A Water or Grass Pokémon is a good answer to this quarry’s Rock teams.'},
        {x:17,y:15,name:'Observatory keeper',text:'The old inscription reads: "A light is a promise, never a leash." Relay copied the diagrams and left out those words.'}
      ],
      trainers:[
        {id:'slatepass-1',name:'Surveyor Tate',x:8,y:10,dialogue:['Steady feet, steady hands. The mountain rewards patience.','First passage marker. Watch the loose ground below the observatory.'],team:[{species:'geodude',level:21},{species:'onix',level:22},{species:'graveler',level:22}],reward:490},
        {id:'slatepass-2',name:'Ranger Suri',x:15,y:8,dialogue:['A team should be ready for the mountain and the sky.','Covering weaknesses matters more than collecting only strong-looking Pokémon.'],team:[{species:'pidgeotto',level:22},{species:'graveler',level:23},{species:'gloom',level:22}],reward:510},
        {id:'slatepass-3',name:'Relay Excavator Bram',x:21,y:12,dialogue:['We were promised the Array would prevent disasters.','Maybe we should have asked who gets to choose what counts as a disaster.'],team:[{species:'onix',level:23},{species:'graveler',level:23},{species:'haunter',level:23}],reward:540},
        {id:'slatepass-4',name:'Veteran Hollis',x:12,y:15,dialogue:['Rushing a fight is like rushing a climb. You miss the safe holds.','There’s no shame in visiting the Center before the hardest battle.'],team:[{species:'snorlax',level:24},{species:'graveler',level:24},{species:'golduck',level:23}],reward:560},
        {id:'slatepass-boss',name:'Gym Leader Flint',x:23,y:5,boss:true,badge:'crag',dialogue:['A strong foundation supports every choice you make. Show me yours.','You earned the Crag Badge. The old tunnel leads to Mistveil. Its library holds the Beacon’s real operating sequence.'],team:[{species:'onix',level:24},{species:'graveler',level:25},{species:'snorlax',level:24},{species:'graveler',level:25}],reward:920}
      ]
    },
    {
      id:'mistveil',name:'Mistveil Sanctuary',theme:'forest',description:'Lantern paths cross an ancient forest where memories seem to speak.',level:25,wild:['gastly','haunter','gloom','butterfree','eevee'],
      story:[
        'The tunnel opens into Mistveil. Lanterns glow without electricity, lit by the same resonance as the missing prisms.',
        'Gym Leader Selene protects the original Beacon archive. Relay’s director, Voss, was once her student. Four keepers challenge anyone seeking the restoration sequence.',
        'Voss lost a Pokémon during a migration storm years ago. He built the Array because he could not bear another goodbye. Selene says grief can explain a choice without making that choice right.'
      ],
      npcs:[
        {x:5,y:8,name:'Archive keeper Mira',text:'Ghost Pokémon are immune to Normal and Fighting attacks. Switch partners or choose a different move if an attack has no effect. Ghost attacks do not affect Normal Pokémon either.'},
        {x:17,y:15,name:'Selene’s journal',text:'Voss wrote: "If I could call them home, none would ever be lost." Below it, Selene wrote: "A call must leave room for no."'}
      ],
      trainers:[
        {id:'mistveil-1',name:'Lantern Keeper Edda',x:8,y:10,dialogue:['An unfamiliar shadow is not always an enemy.','First archive seal. Listen before deciding what a shadow means.'],team:[{species:'haunter',level:25},{species:'butterfree',level:26},{species:'gloom',level:26}],reward:600},
        {id:'mistveil-2',name:'Archivist Noel',x:15,y:8,dialogue:['History remembers outcomes. Good trainers remember choices.','Voss removed one line from the Beacon manual: partners may turn back.'],team:[{species:'golduck',level:26},{species:'haunter',level:27},{species:'vileplume',level:26}],reward:630},
        {id:'mistveil-3',name:'Rival Rowan',x:21,y:12,dialogue:['We’re almost there. One more battle to make sure neither of us is alone in this.','Your team has come so far. I’ll help evacuate the Beacon grounds while you face Voss.'],team:[{species:'raichu',level:27},{species:'wartortle',level:27},{species:'pidgeotto',level:27},{species:'haunter',level:27}],reward:660},
        {id:'mistveil-4',name:'Sanctuary Warden Orin',x:12,y:15,dialogue:['The last seal opens for a trainer who protects more than victory.','Take it. Your partners fight with you because they trust you.'],team:[{species:'snorlax',level:28},{species:'vileplume',level:28},{species:'haunter',level:28}],reward:690},
        {id:'mistveil-boss',name:'Gym Leader Selene',x:23,y:5,boss:true,badge:'veil',dialogue:['The final badge is a promise to listen. Let your team answer.','The Veil Badge completes your set. Take the restoration sequence to Aurora Spire. Break the Array, recover the prisms, and give the sky back.'],team:[{species:'haunter',level:28},{species:'vileplume',level:29},{species:'golduck',level:28},{species:'gengar',level:29}],reward:1100}
      ]
    },
    {
      id:'aurora',name:'Aurora Spire',theme:'ruins',description:'The stolen prisms circle a machine at the foot of the silent Beacon.',level:29,wild:['haunter','raichu','graveler','lapras','pidgeot'],
      story:[
        'The six prisms turn above the Quiet Array. Pokémon from every corner of Meridian stand facing the tower, waiting for a command that never ends.',
        'Rowan clears a path for the lost Pokémon while you climb. Four Relay officers guard the power feeds. Each one must fall before the central chamber opens.',
        'Voss watches from the Beacon. "If they can never leave the light," he says, "they can never be lost." The prisms grow brighter. There is still time to stop him.'
      ],
      npcs:[
        {x:5,y:8,name:'Rowan',text:'I’ve got the evacuation. You’ve got the team. Heal, stock up, and check everyone’s moves. Those officers trained to cover each other’s weaknesses.'},
        {x:17,y:15,name:'Relay engineer Vale',text:'I followed orders at the harbor. I’m done doing that. The four feeds keep Voss’s chamber locked. Disable their guards and the door will open.'}
      ],
      trainers:[
        {id:'aurora-1',name:'Relay Captain Quill',x:8,y:10,dialogue:['The model predicted resistance. It did not predict how far you would come.','Maybe the problem was treating living things as a model.'],team:[{species:'raichu',level:29},{species:'golduck',level:30},{species:'graveler',level:30},{species:'haunter',level:30}],reward:760},
        {id:'aurora-2',name:'Relay Captain Sable',x:15,y:8,dialogue:['Voss saved this company. We owe him loyalty.','Loyalty cannot mean letting somebody make their worst mistake.'],team:[{species:'gengar',level:30},{species:'vileplume',level:30},{species:'pidgeot',level:31},{species:'snorlax',level:30}],reward:800},
        {id:'aurora-3',name:'Relay Captain Ferris',x:21,y:12,dialogue:['We built a world without uncertainty. You want to throw it away?','A world without choice is not the same as a world without danger.'],team:[{species:'charizard',level:31},{species:'graveler',level:31},{species:'lapras',level:31},{species:'raichu',level:31}],reward:840},
        {id:'aurora-4',name:'Relay Deputy Arden',x:12,y:15,dialogue:['He really believed he was helping. That is why the rest of us followed.','The last feed is down. Make him listen.'],team:[{species:'venusaur',level:32},{species:'blastoise',level:32},{species:'gengar',level:32},{species:'pidgeot',level:32}],reward:880},
        {id:'aurora-boss',name:'Director Voss',x:23,y:5,boss:true,dialogue:['I waited for a partner who never came home. I will not let anyone feel that again. If you want me to shut it down, show me another way.','They keep choosing to stand beside you. Even when they could turn away. I forgot that was the part that made it matter. Take the prisms. I’ll stop the Array.'],team:[{species:'snorlax',level:32},{species:'charizard',level:33},{species:'lapras',level:33},{species:'gengar',level:33}],reward:1500}
      ]
    },
    {
      id:'beacon',name:'Beacon Summit',theme:'summit',description:'The sky opens above the league grounds as the first light returns.',level:34,wild:['pidgeot','lapras','snorlax','raichu','golduck'],
      story:[
        'With the Array silent, the Pokémon begin to move again. Some head home. Some stay beside the people who helped them. The prisms fit into the Beacon one by one.',
        'Champion Iris arrives with the regional league. Restoring the light requires a final ceremony: four league trials followed by the Champion’s challenge. Each battle adds a voice to the Beacon.',
        'You did not travel all this way to become somebody who gives perfect orders. You learned how to build a team that can answer together. Now let the whole region see it.'
      ],
      npcs:[
        {x:5,y:8,name:'Professor Willow',text:'The Beacon is ready. There is no rush: heal freely between the league trials, change your party, and return to earlier areas whenever you like. This is your story to finish.'},
        {x:17,y:15,name:'Director Voss',text:'I’ll help rebuild what I damaged. There is a flock over the valley already. They are not coming because I told them to. I think I finally understand the difference.'}
      ],
      trainers:[
        {id:'beacon-1',name:'League Trial: Fern & Brine',x:8,y:10,dialogue:['The first trial is balance. A team grows where its partners meet.','Two prisms are singing. Keep going.'],team:[{species:'venusaur',level:34},{species:'golduck',level:35},{species:'vileplume',level:34},{species:'blastoise',level:35}],reward:950},
        {id:'beacon-2',name:'League Trial: Cora & Tessa',x:15,y:8,dialogue:['The second trial is momentum. Find the right moment to change the plan.','Two more prisms are lit. Your team knows its rhythm.'],team:[{species:'charizard',level:35},{species:'raichu',level:35},{species:'graveler',level:35},{species:'pidgeot',level:35}],reward:1000},
        {id:'beacon-3',name:'League Trial: Flint & Selene',x:21,y:12,dialogue:['The third trial is patience. Strong teams make room for the unexpected.','The last two prisms answer. The Beacon can shine again.'],team:[{species:'snorlax',level:36},{species:'gengar',level:36},{species:'graveler',level:36},{species:'lapras',level:36}],reward:1050},
        {id:'beacon-4',name:'Rival Rowan: Final Promise',x:12,y:15,dialogue:['We started in the same meadow. No matter who wins, let’s keep exploring.','Promise kept. Now go win the last battle. I’m cheering for you.'],team:[{species:'raichu',level:36},{species:'blastoise',level:36},{species:'pidgeot',level:37},{species:'gengar',level:36}],reward:1100},
        {id:'beacon-boss',name:'Champion Iris',x:23,y:5,boss:true,dialogue:['Meridian has seen your courage. Let me see everything your partners have learned. This is the final battle.','You are Meridian’s new Champion. But the title is only a name for what your team has already become. Look up: the first migration lights are returning.'],team:[{species:'venusaur',level:37},{species:'charizard',level:37},{species:'blastoise',level:37},{species:'snorlax',level:38}],reward:2200}
      ]
    }
  ],
  outro:[
    'The Aurora Beacon shines. Across Meridian, wandering Pokémon look up, find the trail of light, and choose their own way home.',
    'Team Relay returns the stolen equipment. Voss stays to help restore the migration routes, this time alongside the people who know them best.',
    'Rowan meets you in Mossbank with two tickets for a train neither of you has taken. Professor Willow laughs. "A finished story is a very good place to begin another."',
    'CHAMPION OF MERIDIAN — Story complete. Your save is preserved. Explore freely, finish your collection, train your team, or export your adventure from the menu. Thank you for playing Pokémon: Echoes of Meridian.'
  ]
};
