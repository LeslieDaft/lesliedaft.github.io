(() => {
  const line = (speaker, text) => ({speaker, text});
  const narrator = text => line('Story', text);
  const ari = text => line('Ari', text);
  const mira = text => line('Mira', text);
  const bram = text => line('Bram', text);
  const quiz = (question, options, answer) => ({question, options, answer});
  const recall = (question, ...answers) => ({question, answers});
  const npc = (name, lines, key, requires, blocked) => ({kind:'npc', name, lines, key, requires, blocked});
  const relic = (name, key, lines, requires, blocked) => ({kind:'relic', name, key, lines, requires, blocked});
  const chest = (name, text) => ({kind:'chest', name, key:name, lines:[narrator(text)]});
  const gate = (name, next, requires, blocked, lines = []) => ({kind:'gate', name, next, requires, blocked, lines});
  const enemy = (name, form, pattern, key, lines = [], requires, blocked) =>
    ({kind:'enemy', name, foe:{form, pattern}, key, lines, requires, blocked});
  const boss = (name, form, pattern, requires, blocked, lines) =>
    ({kind:'boss', name, foe:{form, pattern}, requires, blocked, lines});

  // Lettered markers place actors on paths while keeping all routes visible here.
  const layouts = {
    square: [
      '########################',
      '#***.++++.***.++++.**..#',
      '#....++++.....++++.....#',
      '#....a.............b...#',
      '#....::::::::::::::::..#',
      '#..::::....,,....::::..#',
      '#..:....+++++++.....:..#',
      '#c.:....+++++++.....:.d#',
      '#..:................:..#',
      '#..::::::..::::::::::..#',
      '#.....*....@.....*.....#',
      '#...e............f.....#',
      '#,,.......***........,,#',
      '########################'
    ],
    channels: [
      '########################',
      '#..a...~~~....b........#',
      '#......~~~.............#',
      '#...:::===::::::::::...#',
      '#...:..~~~.+++++...:...#',
      '#...:..~~~.+++++...:...#',
      '#c..:..~~~.........:...#',
      '#...:..~~~~~~~~~~~~=~~~#',
      '#...:...,,...,,....:..d#',
      '#...::::::::::.:::::...#',
      '#....f.......:.........#',
      '#...@........:.....e...#',
      '#**........**...,,.....#',
      '########################'
    ],
    terraces: [
      '########################',
      '#^....a.........b.....^#',
      '#^....::::::::::::::::^#',
      '#^^^^.:.^^^^^^^^^^^^:.^#',
      '#^....:.^..........^:..#',
      '#^.c..:...^^^^^....^:..#',
      '#^....::::^...^..::d:..#',
      '#......::.^.e....:..:..#',
      '#..^^^^^:.^^^^^^^:..:..#',
      '#.......:........:..:..#',
      '#..::::::..::::::::::..#',
      '#..:....f..:..,,.......#',
      '#..@....**.:.....**....#',
      '########################'
    ],
    grove: [
      '########################',
      '#.*......a......*......#',
      '#...#..::::::#####..b..#',
      '#...#..:...............#',
      '#...####.######...#....#',
      '#.......c...d.....#....#',
      '#.#####:::.....####....#',
      '#......:...##..........#',
      '#...::::...##..::::::..#',
      '#...:......##..:....:..#',
      '#.###..*...##..:....:..#',
      '#.e....@...:::::...f:..#',
      '#...........**.........#',
      '########################'
    ],
    keep: [
      '########################',
      '#..a...#....b......#...#',
      '#..:...#...........#...#',
      '#..:::::::::::::::..c..#',
      '####+..#.......#..+#####',
      '#......#.#####.#.......#',
      '#......#.#...#.#.......#',
      '#.........d............#',
      '#......#.#...#.#.......#',
      '####+..#..::::.#..+#####',
      '#.....::::::::::::.....#',
      '#..e...#....@......#f..#',
      '#......#...........#...#',
      '########################'
    ],
    crater: [
      '########################',
      '#^a..........b........^#',
      '#^^::^^^^^^......^^::^^#',
      '#...::....::::::::::...#',
      '#....:.^^^...^^^.:..c..#',
      '#..d.:.....*.....:.....#',
      '#....::::..*..::::.....#',
      '#^^.....:..*..:.....^^^#',
      '#^^.....:::~:::.....^^^#',
      '#..e......:~:.........f#',
      '#..:::::::===::::::::..#',
      '#.........~@~..........#',
      '#.........~~~..........#',
      '########################'
    ],
    platform: [
      '########################',
      '#~~~a...=....b.~~~~~~~~#',
      '#~~~....=......~c..~~~~#',
      '#~~.....=......~...~~~~#',
      '#~~..:::=====:::===~~~~#',
      '#~~~...~..d...~~...~~~~#',
      '#~~~...~......~~...~~~~#',
      '#~~~===~~~===~~~===~~~~#',
      '#~~~...~~~...~~~...~~~~#',
      '#~~~.e.~~~...~~~.f.~~~~#',
      '#~~~...===...===...~~~~#',
      '#~~~~~~..@....~~~~~~~~~#',
      '#~~~~~~.......~~~~~~~~~#',
      '########################'
    ],
    ice: [
      '########################',
      '#a..,,,,,,...,,...b,,,##',
      '#..^^^::^^...,,...^,,,##',
      '#..^..::.^...,,...^,,,##',
      '#..^..::.^...^^..^^,,,##',
      '#.....::.....^c.....,,##',
      '#.....::::::::::::::,,##',
      '##..^..,.....,,,....,,##',
      '##..^..,.....,,,....,,##',
      '##..^^.:^^^^^^^^^^..d.##',
      '##e.,..::::.::::::::..##',
      '##........:@:.....f...##',
      '##..*..*...........*..##',
      '########################'
    ],
    vault: [
      '########################',
      '##a......::.........b.##',
      '##.+++++.::..+++++....##',
      '##.+++++.::..+...+.c..##',
      '##...........+........##',
      '#######.:::::+.+++++..##',
      '##...d..:.@..+........##',
      '##..***.:.........**..##',
      '##...::.:.++++++......##',
      '##...:..:.++++++..::..##',
      '##e..:..:...f.....:...##',
      '##...::::.........:...##',
      '##........********....##',
      '########################'
    ],
    sleep: [
      '########################',
      '#^^^^^^^^^^^^^^^^^^^^^^#',
      '#^.........a..........^#',
      '#^....~....:....~.....^#',
      '#^...~~~...:...~~~....^#',
      '#^....~....:....~.....^#',
      '#^b...:...::::..:....c^#',
      '#^....:..:....:.:.....^#',
      '#^....::::....:::.....^#',
      '#^........:..:........^#',
      '#^d........::.......e.^#',
      '#^........f@..........^#',
      '#^^^^^^^^^^^^^^^^^^^^^^#',
      '########################'
    ]
  };

  function region(name, theme, layout, objective, placements, mirror = false) {
    const actors = [];
    const tiles = layouts[layout].map((source, y) => {
      const row = mirror ? [...source].reverse().join('') : source;
      return row.replace(/[a-f]/g, (marker, x) => {
        const actor = placements[marker];
        if (actor) actors.push({...actor, x, y});
        return '.';
      });
    });
    return {name, theme, objective, tiles, actors};
  }

  window.CHAPTERS = [
    {
      title:'The Second Toll', theme:'meadow',
      tagline:'A lantern festival opens a road to a day that should be gone.',
      intro:[narrator('Every year, Bellmead lights a hundred lanterns. Ari promised to light the first and has already missed breakfast.'),
        mira('I saved you a honey cake. Bram ate it. If we hurry, we can still get our lantern in the air.'),
        bram('On a completely separate subject, the mayor is asking for us at the green.')],
      quiz:[],
      maps:[
        region('Bellmead Festival', 'meadow', 'square', 'Ask Mayor Tansy about the stalled festival, then follow the old road.', {
          a:npc('Mayor Tansy',[line('Mayor Tansy','The bell has gone silent. Take my blue ribbon. The groundskeeper tied its twin to the old road.'),
            line('Mayor Tansy','He also found this photograph in a bottle. The date’s in the hundred years our books skip. Is that you in the square?'),
            ari('That’s my coat. I’ve never been to that square in my life.'),
            mira('Pocket it. We’ll fetch the bell rope and have another look when we get back.')],'ribbon'),
          b:gate('Old Road',1,['ribbon'],'Ask Mayor Tansy for the blue ribbon that marks the festival road.'),
          c:npc('Pastry Judge',[line('Pastry Judge','Never let anyone tell you cake cannot be a valid breakfast.')]),
          d:npc('Kite Maker',[line('Kite Maker','It’s odd. The sky is clear, but that old road smells like rain.')]),
          e:chest('Brass Kite Tail','Someone folded a kite tail out of little brass fish.'),
          f:enemy('Ribbon Beetle','beetle','rush',undefined,[bram('Hey! That beetle is making off with the prize ribbon.')])
        }),
        region('Willowford', 'meadow', 'channels', 'Free the jammed sluice, recover the bell rope, and cross to the drowned village.', {
          a:relic('Bell Rope','rope',[narrator('The groundskeeper’s red bell rope has caught on the sluice wheel.'),
            ari('I can reach it now. It’s still dry. How is it still dry?')],['sluice'],'The Sluice Crab has wedged the wheel shut.'),
          b:gate('Drowned Lane',2,['rope'],'We need the bell rope before crossing.'),
          c:enemy('Sluice Crab','crab','ward','sluice',[mira('It’s using the sluice crank as a claw. Take care when it draws that claw back.')]),
          d:enemy('Pond Sprout','slime','swarm'),
          e:chest('Fisher’s Lantern','There is no oil inside, but its little flame stays lit.'),
          f:npc('Ferry Keeper',[line('Ferry Keeper','See the roofs below the water? On festival day you can almost hear people singing down there.')])
        }),
        region('Drowned Bell Tower','water','keep','Tie the red rope to the underwater bell and stop whatever is holding back the village.', {
          a:relic('Drowned Bell','toll',[narrator('Ari pulls the red rope. The bell tolls once underwater. Windows glow and the drowned village rises around the tower.'),
            narrator('As the bell goes still, a second toll answers from deep below.'),
            bram('Two tolls. You only pulled the rope once.')]),
          b:boss('Mossback Warden','golem','focus',['toll'],'The bell is silent. The way to the warden is still bound to the drowned hour.',[
            narrator('The stone warden sets its feet in the street. Behind it, a child catches the first festival lantern.'),
            ari('Move. They deserve to finish their day.')]),
          e:chest('Dry Festival Match','This matchbox looks as if it came from the stall this morning.')
        })
      ],
      ending:[narrator('The returned villagers eat supper with Bellmead beneath a hundred lanterns.'),
        mira('There are no names in the books for these people. Whoever took them took the pages, too.'),
        bram('Then we’ll write new ones. Give me a pencil.'),
        narrator('That night a letter washes ashore, dated thirty years into the missing century. It smells of sea salt.')]
    },
    {
      title:'The Town on the Tide', theme:'coast',
      tagline:'Sail to an old harbor that only exists at low tide.',
      intro:[narrator('The letter is signed by a harbor captain named Ione. She asks someone to keep a light on until morning.'),
        bram('She addressed that to us. It’s older than my grandmother.'),
        mira('We got a reply once. Let’s see if we can send one.')],
      quiz:[quiz('Where did Ari ring the festival bell?',['In the mayor’s attic','Underwater','At the ferry dock'],1),
        quiz('How many tolls did you hear after pulling the rope once?',['Two','Three','One'],0),
        recall('What color was the rope you freed from the sluice?', 'red')],
      maps:[
        region('Gullmarket','coast','square','Borrow a skiff from Ione’s grandson and leave through the seaside lane.', {
          a:npc('Ferrin',[line('Ferrin','That is my gran’s seal. Take her skiff, the Wren. It always brings someone home.'),bram('Even if they haven’t been born yet?')],'wren'),
          b:gate('Seaside Lane',1,['wren'],'Ferrin has the only skiff that can make the crossing.'),
          c:npc('Oyster Seller',[line('Oyster Seller','Don’t eat anything you caught in two different centuries.')]),
          d:enemy('Market Gull','bird','gale'),
          e:chest('Painted Compass','The little silver pointer leans toward the harbor.'),
          f:npc('Net Mender',[line('Net Mender','Time changes our coast faster than the sea does, these days.')])
        }, true),
        region('Vanishing Sandbanks','coast','platform','Win back the prism from the Mirror Ray and reach the lighthouse.', {
          a:enemy('Mirror Ray','wisp','counter','prism',[narrator('A lantern prism is glowing inside the ray.'),mira('It throws a flash back when it braces. Wait for it to uncoil.')]),
          b:gate('Lighthouse Landing',2,['prism'],'The light won’t work without its prism.'),
          c:enemy('Drift Crab','crab','ward'),
          d:npc('Stranded Fisher',[line('Stranded Fisher','I watched the tide go out, then watched the year go with it.')]),
          e:chest('Pearl Button','The keeper used spare buttons to mark a safe channel.'),
          f:enemy('Foam Hopper','slime','rush')
        }),
        region('Ione’s Lighthouse','coast','terraces','Light the lighthouse, then protect the harbor from the reef beast.', {
          a:relic('Lighthouse Lantern','light',[narrator('Mira slots in the prism. The beam sweeps the reef and every boat from the lost night lights a starboard lamp.'),mira('There’s your answer, Captain Ione.')]),
          b:boss('Reef Crown','serpent','pierce',['light'],'Light the reef before facing the beast.',[
            narrator('The reef begins to uncoil. A crown of coral rises higher than the lantern room.')]),
          c:enemy('Landing Crustling','crab','ward'),
          e:chest('Ione’s Brass Whistle','Its echoes are just sharp enough to cut through the surf.')
        },true)
      ],
      ending:[line('Captain Ione','You kept the light on. From my deck it looked like a star had come down to show us the channel.'),
        narrator('She trades the party a shard of glass. It shows a tree with a green ribbon around one branch.'),
        mira('The crack in the glass just healed itself.'),
        bram('Put it in a padded pocket. I’d rather that habit stay with the glass.')]
    },
    {
      title:'The Glasswood Road', theme:'glass',
      tagline:'Find a living tree in a forest where nothing can change.',
      intro:[mira('The green ribbon in Ione’s glass belongs to a forester called Sedge. I found him in an old woodcut.'),
        bram('We’ve argued with a tide. Now we’re going to argue with trees.'),
        ari('Not all of them. Look. One’s still dropping leaves.')],
      quiz:[recall('What was the name of the skiff you borrowed?', 'Wren'),
        quiz('What did you put in the lighthouse lantern?',['A lantern prism','A white pearl','A brass compass'],0),
        quiz('What did Ione give you after the rescue?',['A copper hook','A glass shard','Her old sail'],1)],
      maps:[
        region('Copperleaf Camp','meadow','grove','Learn what froze the forest and follow Sedge’s trail.', {
          a:npc('Sedge',[line('Sedge','Shake the branch with my green ribbon and say the name of the seed. Yew. Can you remember a word that short?'),
            bram('Tell me again after I’ve had lunch.')],'yew'),
          b:gate('Glasswood Trail',1,['yew'],'Sedge knows how to save a seed.'),
          c:npc('Little Woodcutter',[line('Little Woodcutter','My dad’s halfway through a sneeze. He’s been that way since breakfast.')]),
          d:enemy('Copper Hornet','moth','swarm'),
          e:chest('Wooden Birdcall','It sounds like rain tapping a hollow branch.')
        }),
        region('Brittle Canopy','glass','terraces','Reach the ribbon tree. Free the seed and carry it to the forest heart.', {
          a:relic('Ribbon Tree','seed',[narrator('Ari shakes the green ribbon and says “yew.” One brown seed drops into his hand.')],['moth'],'The Prism Moth keeps landing on the ribbon branch. Drive it away first.'),
          b:gate('Root Hollow',2,['seed'],'The old tree needs its seed.'),
          c:enemy('Prism Moth','moth','counter','moth',[mira('It sees us in every branch. Let it make the first move.')]),
          d:enemy('Glass Cicada','beetle','pierce'),
          e:chest('Unbroken Acorn','It blends in perfectly among the beads of glass.')
        }),
        region('Glasswood Heart','glass','crater','Plant the yew seed in live soil, then defeat the guardian that has grown around the hollow.', {
          a:boss('White Briar','root','drain',['planted'],'The briar is brittle glass. Plant the yew seed to bring it into the present.',[
            narrator('The white briar unfolds and bends young branches over the clearing.'),
            mira('That’s the tree protecting this place. Let’s show it the new growth is here to stay.')]),
          b:relic('Pocket of Earth','planted',[narrator('The seed cracks in the warm soil, and leaves sweep over the forest in a single breath.')]),
          c:enemy('Needle Newt','serpent','pierce'),
          e:chest('Forester’s Whittle','A tiny wooden fox sits inside the earth at the old tree’s roots.')
        })
      ],
      ending:[narrator('The woodcutter sneezes. Every tree shivers. A whole camp breaks into laughter.'),
        line('Sedge','That root you fought? Its oldest ring is as thin as a hair. There’s a new soft ring underneath it.'),
        mira('Something breathed when we planted the seed. I felt it through my boots.'),
        narrator('Under the live bark lies a train ticket punched with a triangle.')]
    },
    {
      title:'The Mountain Engine', theme:'ember',
      tagline:'Get a mountain railway moving before a whole town misses its morning.',
      intro:[narrator('The punched ticket leads to a railway terminus above the furnaces of Cinderpass.'),
        bram('A train through a mountain. Finally, a sensible way to travel.'),
        narrator('A thin curl of steam hangs frozen above the engine.')],
      quiz:[quiz('What color ribbon marked the tree in the Glasswood?',['Green','Gold','Red'],0),
        recall('What kind of seed did you plant?', 'yew', 'yew seed'),
        quiz('What shape was punched on the ticket from the roots?',['A star','A triangle','A crescent'],1)],
      maps:[
        region('Cinderpass Station','ember','keep','Get a boiler permit from the engineer before entering the switchyard.', {
          a:npc('Engineer Doss',[line('Engineer Doss','Here’s the permit. The superintendent won’t start a train unless you give the furnace a copper coal.'),
            bram('I miss when trains just needed a ticket.')],'boiler'),
          b:npc('Station Teashop',[line('Station Teashop','If you save the day, give me five minutes to finish the pastry glaze.')]),
          c:gate('Upper Switchyard',1,['boiler'],'The switchyard foreman needs Doss’s permit.'),
          d:enemy('Clinker Rat','beetle','rush'),
          e:chest('Punch Tongs','The tongs make a triangle in a stack of paper.'),
          f:npc('Parcel Clerk',[line('Parcel Clerk','That white case has been waiting a hundred years. You’d think they would reply to one letter.')])
        },true),
        region('Upper Switchyard','ember','terraces','Drive the foreman off the switch, unhook the passenger line, then head to the furnace.', {
          a:gate('Furnace Elevator',2,['track'],'Set the passenger tracks before going down to the furnace.'),
          b:relic('Track Switch','track',[narrator('Bram throws the switch. The entire mountain rings like a rail struck with a hammer.'),bram('Passenger track is free.')],['foreman'],'The slag foreman is gripping the switch.'),
          c:enemy('Slag Foreman','golem','ash','foreman',[narrator('Rail spikes glow in its arms. It regards the party as three maintenance requests.')]),
          d:enemy('Boiler Gnat','moth','swarm'),
          f:chest('Tin Timecard','The only stamps are “In” and “Still In.”')
        }),
        region('Copper Furnace','ember','crater','Place the copper coal in the engine, then break the crust that seals the furnace mouth.', {
          a:boss('Heart of Slag','golem','ash',['coal'],'The furnace needs its copper coal before you can clear the crust.',[
            narrator('The ancient furnace peels its brick face back from the engine. Fire pushes through its seams.')]),
          b:relic('Copper Coal','coal',[narrator('Ari places the copper coal in the firebox. It turns silver at the edges.'),mira('Here comes the part where it starts to move.')]),
          c:enemy('Soot Coil','serpent','ash'),
          e:chest('Emergency Tea Tin','The previous engineer took great care wrapping this in felt.')
        },true)
      ],
      ending:[narrator('The engine comes up to steam. The passenger coach rolls out to find its town still waiting.'),
        bram('Doss gave me the real engine whistle. She said never blow it indoors.'),
        mira('The mountain answered our steam with a pulse. It’s the same pitch as the bell under the water.'),
        narrator('Two short blasts salute the dawn. High above, a sail answers with two gold flares.')]
    },
    {
      title:'A Sail Above the Weather', theme:'sky',
      tagline:'Chase a skyship through a storm that hangs motionless in the clouds.',
      intro:[narrator('A yellow sail hangs high over Cinderpass. A rope ladder drops to the platform.'),
        bram('The good news is it has no boiler. The bad news is I can see the ground through the floor.'),
        ari('Keep looking up, then. There’s a whole fleet stuck in that cloud.')],
      quiz:[recall('What kind of coal did you put in the firebox?', 'copper', 'copper coal'),
        quiz('What did Engineer Doss give Bram after the train moved?',['A brass lantern','A new timecard','The engine whistle'],2),
        quiz('Which track did Bram free at the switch?',['The passenger track','The quarry spur','The ore line'],0)],
      maps:[
        region('Kitewright’s Mooring','sky','square','Get the captain’s favor before climbing onto the yellow sailship.', {
          a:npc('Captain Vale',[line('Captain Vale','I got a fleet caught in a cloud with no wind. Take my yellow sail up and open the weather valve. You’re crew now.')],'crew'),
          b:gate('Yellow Sailship',1,['crew'],'Sign on with Captain Vale before you board.'),
          c:npc('Cloud Cook',[line('Cloud Cook','Everything tastes better up here except tea. Hard to get a boil going.')]),
          d:enemy('Ropewing','bird','gale'),
          f:chest('Deck of Sky Cards','All the queens are wearing aviator goggles.')
        }),
        region('Fleet in the Cloud','sky','platform','Recover the storm vane from the cloud lanes, then cross to the weatherworks.', {
          a:gate('Weatherworks Platform',2,['vane'],'The weather valve handle was lost. Find the storm vane.'),
          b:enemy('Wind Skater','bird','gale'),
          c:relic('Storm Vane','vane',[narrator('Mira unhooks the blue vane from the ship’s rail. Its ribbons all point toward the same island.')],['kite'],'A squall kite has tangled the vane in its tail.'),
          d:enemy('Squall Kite','bird','gale','kite',[mira('It’s banking toward the mainmast. Leave yourself room.')]),
          e:npc('Gale Watcher',[line('Gale Watcher','I’ve been counting the thunder. Every time it rolls, something under us beats twice.')]),
          f:chest('Silver Cloud Hook','A tether hook with a blade that can cut through frozen rain.')
        },true),
        region('Weatherworks','sky','platform','Open the weather valve so the fleet can escape, then ground the storm guardian.', {
          a:relic('Weather Valve','valve',[narrator('Mira seats the blue vane on the valve. Wind streams along the yellow sail.'),
            narrator('A deep heartbeat runs ahead of the thunder.'),mira('That isn’t an echo. It’s coming faster.')]),
          b:boss('Thunder Albatross','bird','gale',['valve'],'Open the weather valve to bring the albatross down to the deck.',[
            narrator('The albatross fills the gaps between the platforms with wings bright as a thunderhead.')]),
          d:enemy('Cloud Strider','wisp','focus'),
          f:chest('Cloud Compass','The needle shivers when the heartbeat sounds.')
        })
      ],
      ending:[line('Captain Vale','Every crew made it out. If you ever need a ship, open that yellow sail.'),
        narrator('A fitting from the weather valve opens. Inside are a white mitten and a postal address carved in ice.'),
        bram('Who sends a single mitten?'),ari('Somebody who had to let go with the other hand.')]
    },
    {
      title:'The Winter Post', theme:'frost',
      tagline:'Take a lost mail route over the peaks on the longest night of the year.',
      intro:[narrator('The ice address leads to a shuttered post office. Behind the counter, a winter guide is knitting her second scarf.'),
        mira('Excuse me. We think we found someone’s mitten.'),
        narrator('The guide drops her knitting.')],
      quiz:[recall('What color was Captain Vale’s sail?', 'yellow'),
        quiz('Which tool did you fit on the weather valve?',['A storm vane','A gearwheel','A bronze crank'],0),
        quiz('What came out of the valve fitting?',['A blue cap','A white mitten','A small bell'],1)],
      maps:[
        region('Driftpost','frost','square','Show the mitten to the winter guide and take the mail sled.', {
          a:npc('Guide Osa',[line('Guide Osa','My brother left without that mitten. Load his three parcels and my red scarf onto the sled. He’ll see you coming.')],'mail'),
          b:gate('Snow Road',1,['mail'],'Osa has the sled and packages.'),
          c:npc('Foot warmer',[line('Foot warmer','One silver for warm boots, two for boots that remember what summer was like.')]),
          d:enemy('Frostbill','bird','pierce'),
          e:chest('Snow Globe','The snow has settled at a slant, as if on a hillside.')
        },true),
        region('The Frozen Route','frost','ice','Find the postmarker, then follow it to Osa’s brother.', {
          a:gate('North Pass',2,['witness'],'The road splits. Read the postmarker before going higher.'),
          b:relic('Green Postmarker','witness',[narrator('The route marker points to North Pass. An arrow on the back points down and reads “Whatever you do, don’t follow the second set of hoofprints.”')],['stag'],'An ice stag is pinning the marker in place with its hooves.'),
          c:enemy('Ice Stag','knight','pierce','stag',[narrator('The stag’s antlers split into sharp blue branches in the cold.')]),
          d:enemy('Snowcap','slime','ward'),
          e:chest('Waxed Envelope','Osa tied some dry tinder inside a waxed envelope.')
        }),
        region('North Pass','frost','terraces','Signal the mail coach with the red scarf. Hold the pass against the whiteout.', {
          a:relic('Signal Pole','scarf',[narrator('Ari ties the red scarf high on the pole. Two lanterns wink back through the snow.')]),
          b:boss('Rime Herald','knight','pierce',['scarf'],'The ridge is lost to the whiteout. Signal with Osa’s red scarf.',[
            narrator('A frost knight unbuckles itself from the front of the frozen coach. The wind quiets as it raises the polearm.')]),
          c:enemy('Snowglass Midge','moth','swarm'),
          e:chest('Winter Post Badge','The third hook on the back is wrapped in red wool.')
        },true)
      ],
      ending:[line('Postman Hedd','I had parcels for three families. You saved two villages when you brought me home.'),
        narrator('In the last parcel is a sealed invitation addressed to the year itself.'),
        mira('Somebody counted the years like an inventory. I want to meet whoever kept that ledger.'),
        ari('Back at the pass, the second hoofprints started after the coach had already stopped.')]
    },
    {
      title:'The Calendar Thief', theme:'dusk',
      tagline:'Chase a living calendar through the old capital’s lantern markets.',
      intro:[narrator('The invitation takes the party to Suncourt, where last year’s dusk has been held over for a banquet.'),
        bram('It says there’s supper. Say what you like about missing years, nobody skimps on supper at the palace.'),
        narrator('A young thief darts through the garden with a book that is trying to leap out of its own binding.')],
      quiz:[quiz('What did Ari hoist above the pass?',['A red scarf','A green flag','A white mitten'],0),
        quiz('Where did you find Postman Hedd?',['East Fork','North Pass','The lower station'],1),
        recall('How many parcels went on the sled?', 'three', '3', 'three parcels', '3 parcels')],
      maps:[
        region('Suncourt Lantern Market','dusk','square','Talk to the thief under the balcony and get into the watch quarter.', {
          a:npc('Kess',[line('Kess','I borrowed the calendar because it wrote my name under “erase.” Its silver seal broke off in the garden.'),
            mira('We’ve been finding the people who fell off those pages. Get behind us.')],'kess'),
          b:gate('Watch Quarter',1,['kess'],'Find Kess first. Only she knows what to look for.'),
          c:npc('Rooftop Seamstress',[line('Rooftop Seamstress','There’s a seam in everything if you know where to look. This sunset has two.')]),
          d:enemy('Sunset Imp','wisp','focus'),
          f:chest('Lantern Crown','Wearing this crown traditionally means you owe everyone soup.')
        }),
        region('Hanging Gardens','dusk','grove','Find the silver seal and recover the calendar from the palace gallery.', {
          a:gate('Palace Gallery',2,['silver'],'The gate only opens for a silver seal.'),
          b:relic('Silver Seal','silver',[narrator('A silver wax stamp lies in the grass. It bears the shape of an open eye.')],['hound'],'The Gilt Hound is guarding its prize.'),
          c:enemy('Gilt Hound','knight','rush','hound',[bram('That would be a lot friendlier if it had a tail instead of a spear.')]),
          d:enemy('Garden Lumen','wisp','focus'),
          e:chest('Suncourt Favor','Three daisy petals are pressed between glass.')
        },true),
        region('Palace Gallery','dusk','vault','Use the silver seal to open the ledger, then take back the stolen dusk.', {
          a:relic('Living Calendar','unsealed',[narrator('Ari presses the silver seal into the calendar. A list of days unrolls down the hall.'),
            mira('I found our festival, Ione’s harbor, the Glasswood. Each one is marked with an eye.'),
            narrator('For a moment, the eyes blink in order, matching the rhythm of a heartbeat.')]),
          b:boss('The Hour Bailiff','knight','counter',['unsealed'],'Open the calendar to make the bailiff answer.',[
            line('The Hour Bailiff','The court requests that all unrecorded citizens stay forgotten. You can stop adding pages now.')]),
          c:enemy('Gutter Shade','wisp','drain'),
          e:chest('Banquet Place Card','Your name is already written on the back.')
        })
      ],
      ending:[narrator('Kess opens the sunset gates. Every lantern in town rises at once.'),
        line('Kess','The ledger has a map in the back. Something underneath Suncourt reached all the way out to the villages.'),
        mira('These lines look like roads, but they run in pairs. They’re roots. Or veins.'),
        bram('I’m asking for an early breakfast next time.')]
    },
    {
      title:'The Archives Below', theme:'marsh',
      tagline:'Drain a flooded archive where the first record of the Last Hour is carved in stone.',
      intro:[narrator('The ledger map follows a rope of drowned stones out into the marsh.'),
        ari('Do those posts look as if they were pulled out of a mouth?'),
        mira('Let’s keep going and assume somebody wanted to build a very unpopular fence.')],
      quiz:[recall('Who was running through the market with the calendar?', 'Kess'),
        quiz('What shape was stamped into the silver seal?',['A leaf','A mountain','An open eye'],2),
        quiz('Which object listed the returned days?',['The Living Calendar','The invitation','The harbor map'],0)],
      maps:[
        region('Reed Village','marsh','channels','Learn the path under the marsh, then open the sluice gate.', {
          a:npc('Mudkeeper Renn',[line('Mudkeeper Renn','That’s an old map. Go down river with a reed token. The lock opens when it hears the frogs.')],'reed'),
          b:gate('Sluice Gate',1,['reed'],'Ask Renn for a reed token to open the sluice.'),
          c:npc('Frog Caller',[line('Frog Caller','Sometimes a frog sings before it opens its mouth. I don’t think that’s a frog.')]),
          d:enemy('Reed Snapper','crab','counter'),
          e:chest('Stone Frog','A carving with a slightly worried expression.')
        }),
        region('Drowned Stacks','water','channels','Recover the bronze dial, drain the reading room, and reach the mural vault.', {
          a:relic('Drain Wheel','drained',[narrator('Bram slides the bronze dial onto the wheel. Water spills back into the marsh in two long breaths.')],['dial'],'The wheel is missing a bronze dial.'),
          b:gate('Mural Vault',2,['drained'],'The way into the vault is under water.'),
          c:enemy('Bell Eel','serpent','drain','dial',[narrator('A large eel glides over the bronze dial, humming a two-note tune.')]),
          d:enemy('Silting Wisp','wisp','drain'),
          e:chest('Tarred Index','The clerk coated the card with tar so the writing would outlast the floods.'),
          f:npc('Sump Keeper',[line('Sump Keeper','When the water is low, there’s a carving of a man listening at a door. He has a thousand ears.')])
        },true),
        region('Mural Vault','marsh','vault','Read the wall record, then keep the archive custodian from sealing the vault again.', {
          a:relic('Oldest Mural','mural',[narrator('The mural depicts an ancient shape asleep beneath a circle of people. Its title is carved in three languages.'),
            mira('The Last Hour. They hid a century around it, so there was no time left for it to move through.'),
            narrator('There are nine fresh scratches where the resting shape used to be. Its head has turned.')]),
          b:boss('Silt Custodian','golem','ward',['mural'],'Read the oldest mural to unlock the vault’s custodian.',[
            line('Silt Custodian','You were told it was erased. You were never told there was nothing living inside it.')]),
          c:enemy('Script Beetle','beetle','swarm'),
          e:chest('Mural Rubbing','The charcoal went dark as it passed over the eye.')
        },true)
      ],
      ending:[mira('We think we’ve been giving time back. We’ve been giving it to all of them, including the thing underneath.'),
        ari('There’s a town on the last dated stretch of the map. We should see how many people are still there.'),
        narrator('In the distance, the frogs go quiet together. One heartbeat passes through the floor.')]
    },
    {
      title:'The Last Unwritten Day', theme:'dusk',
      tagline:'Reach a town frozen on the eve of the decision that erased a century.',
      intro:[narrator('A near-invisible road leads to Morrowhall. The town’s clock leaves empty space where midnight ought to be.'),
        bram('I thought we were going to save a whole century. I didn’t figure we’d have to tell it what it cost.'),
        ari('Then we should start by listening.')],
      quiz:[quiz('What phrase was carved as the sleeping shape’s title?',['The Last Hour','The Second Sun','The Deep Year'],0),
        quiz('What did you fit onto the drain wheel?',['A silver spoon','A stone key','A bronze dial'],2),
        recall('Which animal’s call opened the marsh lock?', 'frog', 'frogs', 'frog call')],
      maps:[
        region('Morrowhall Square','dusk','square','Get the iron key from the keeper of the town clock.', {
          a:npc('Clockkeeper Neris',[line('Clockkeeper Neris','You need the first seal. Here’s the observatory key. Before you go, look at these faces. They know what’s coming.'),
            narrator('Ari takes the key and looks around. This is the square in the photograph from Bellmead.'),
            ari('There’s the photographer. He’s about to take my picture.')],'iron'),
          b:gate('Observatory Road',1,['iron'],'Neris holds the iron key to the road gate.'),
          c:npc('Young Lantern Carrier',[line('Young Lantern Carrier','I can see all the lights you brought back from here. Ione’s is the furthest.')]),
          d:npc('Morrowhall Carpenter',[line('Morrowhall Carpenter','The last thing I made for my family was a door. I hadn’t hung it yet.')]),
          e:chest('Unhung Door Hinge','There is a fresh pencil mark beside the screw holes.'),
          f:enemy('Hour Shard','wisp','focus')
        },true),
        region('Still Observatory','dusk','vault','Recover the seal, then take the gallery road to the town clock.', {
          a:relic('First Seal','firstseal',[narrator('Mira lifts the first seal from the observation desk. It has been split into a gold half and a plain half.'),mira('The plain half is cold. The gold half is beating.')],['sentinel'],'A sentinel is bolted to the observatory desk.'),
          b:gate('Clock Gallery',2,['firstseal'],'Bring the halves of the first seal to Neris.'),
          c:enemy('Meridian Sentinel','knight','counter','sentinel',[narrator('The sentinel’s sundial gives it time to anticipate one more blow.')]),
          d:enemy('Escapement Shade','wisp','drain'),
          e:chest('Midnight Chart','All of the stars around midnight have no names.')
        }),
        region('Morrowhall Clock','dusk','keep','Fit the two halves and face the guardian of the century’s final crossing.', {
          a:relic('Split Clock','clock',[narrator('Ari seats the two halves and picks up the keeper’s stopped wristwatch. A photographer across the square presses a button.'),
            narrator('Ari takes the print, rolls it into a bottle and drops it through the plain half of the seal. The splash sounds like the Bellmead creek.'),
            ari('There. Now we’ll know where to start.')]),
          b:boss('First Keeper','knight','focus',['clock'],'Seat the split seal so both faces of the clock can turn.',[
            line('First Keeper','The lock cost us our names. If you open it, you will fight the power for which we paid them.'),
            ari('I’m looking at the people who paid. I’m asking what they want now.')]),
          e:chest('Morrowhall Penny','Both faces show the town square, with the clock at different hours.')
        },true)
      ],
      ending:[line('Clockkeeper Neris','If you restore the last day, the whole thing will wake. It could fit all the years before us in a single breath.'),
        bram('If we leave it sleeping?'),line('Clockkeeper Neris','Our children get no tomorrow. We agreed to disappear when it was our only chance. You three have given us another one.'),
        mira('I’m going to bring them back. If time has made something so powerful it can swallow a century, time can give us what we need to stop it.'),
        ari('We’ll bring the whole last day. Every minute.')]
    },
    {
      title:'The Last Hour', theme:'void',
      tagline:'Bring a century home and face the ancient power it kept asleep.',
      intro:[narrator('The clock strikes a silent midnight. A road lies open beneath Morrowhall. Every tree beside it leans in toward a single dark mountain.'),
        bram('Ari. That isn’t a mountain.'),
        narrator('It rises a little. Far below the road, something draws a breath.')],
      quiz:[quiz('How did the halves of the first seal look?',['Both gold','One gold, one plain','One gold, one blue'],1),
        quiz('What was missing from Morrowhall’s clock face?',['Noon','The second hand','Midnight'],2),
        recall('Who gave you the observatory key?', 'Neris', 'Clockkeeper Neris')],
      maps:[
        region('The Road Beneath Midnight','dusk','terraces','Gather the stories from the crossroads and carry them into the dark.', {
          a:npc('Captain Ione',[line('Captain Ione','The harbor sent its light. Osa sent red wool. You gave us those days. Take them with you.'),
            narrator('Ari takes the bundle. The light inside makes the wet road look just like a street in Bellmead.')],'witnesses'),
          b:gate('Outside Time',1,['witnesses'],'Carry the people’s memories before going down.'),
          c:npc('Kess',[line('Kess','The calendar finally has a blank page. It’s for tomorrow.')]),
          d:enemy('Hollow Minute','wisp','drain'),
          e:chest('Warm Festival Lantern','Its paper is warm with the heat of the first day.')
        }),
        region('Outside Time','void','platform','Open the buried road by breaking both hourweights.', {
          a:gate('Chamber of First Sleep',2,['outerweight','innerweight'],'Two hourweights are tied to this door. Break both.'),
          b:enemy('Outer Hourweight','golem','ward','outerweight',[narrator('A chain passes through its shoulders and keeps going into the dark.')]),
          c:enemy('Inner Hourweight','knight','counter','innerweight',[narrator('A figure presses its ear to the first link. It draws a blade every time the breathing below stops.')]),
          e:npc('Memory of the Groundskeeper',[line('Memory of the Groundskeeper','When the big bell rang back, I thought I could feel it behind my eyelids.')]),
          f:chest('Broken Chain Link','The iron is warm along only one edge.')
        },true),
        region('Chamber of First Sleep','void','sleep','Restore the last day at the altar, then face what stirs.', {
          a:boss('The Last Hour','final','focus',['lastday'],'It lies still. Decide when to restore the last day at the altar.',[
            narrator('What looked like the hall’s roof is an eyelid. It has been closed since before anyone gave this valley a name.'),
            narrator('A pulse pushes beneath the floor. At the edge of the chamber, the stone pillars grow old enough to fall.'),
            mira('It can do that in its sleep.'),bram('Then get ready for the next heartbeat.')]),
          b:npc('The Festival Bell',[narrator('A bell that has no rope holds an echo of the day you found Bellmead again.')]),
          c:npc('The Winter Watch',[narrator('A stopped pocket watch ticks once when you hold it close.')]),
          d:chest('The First Photograph','Three adventurers stand in an old square. The side facing the sun is still warm.'),
          e:npc('The Harbor Light',[narrator('The frozen beam of Ione’s lighthouse is pointing to the altar.')]),
          f:relic('Last Day Altar','lastday',[ari('For everybody who never got the next morning.'),
            narrator('The party lays their memories on the altar. Streets, summers, children, and kettles on the fire rush back into the world.'),
            narrator('All at once the chamber falls silent. Even the last of the breathing has stopped.'),
            narrator('A seam opens in the floor. Just beneath it, something slowly takes its first breath in a hundred years.')])
        })
      ],
      ending:[narrator('The Last Hour comes apart across a hundred years. Every piece catches the light of a different morning.'),
        narrator('In Bellmead, a girl lets go of the festival lantern. Her great-grandmother, born on the last day of the missing century, lifts it just before the flame touches the grass.'),
        mira('Can you hear it?'),bram('Just one bell.'),
        ari('One is enough.'),narrator('The lanterns rise. This time all of them come home.')]
    },
  ];
})();
