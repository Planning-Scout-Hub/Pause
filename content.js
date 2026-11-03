// ─────────────────────────────────────────────────────────────
//  DAILY CONTENT
//  The THEME of each day comes from what's happening in the sky
//  (see astro.js → themeFor). Food for thought and the journal idea
//  are then picked from that theme's list, so everything links up.
//  The Moon changes sign every 2–3 days, so give each theme at least
//  3 thoughts and 2–3 prompts to avoid repeats on consecutive days.
//  Facts rotate on their own, one per day.
//
//  Rule for thoughts and facts: only add things you have checked
//  against a reliable source (a museum, university, NASA, a journal…).
// ─────────────────────────────────────────────────────────────

export const THOUGHTS = {
  "Time": [
    {
      "text": "Every time you look at the night sky, you're looking into the past.",
      "more": "Sunlight is about eight minutes old when it reaches you. The light from many of the stars you can see left them decades, centuries or even thousands of years ago, so some of what you see tonight may have changed long since. Stranger still, physicists still argue about what time actually is. Most of the basic laws of physics work the same forwards and backwards, yet we only ever experience time moving one way.",
      "ask": "Which of today's worries would still matter by the time tonight's starlight reached another star?"
    },
    {
      "text": "Clocks on GPS satellites run faster than clocks on the ground, by about 38 microseconds a day.",
      "more": "Einstein's relativity predicts it: weaker gravity up there speeds time up, and the satellites' speed slows it a little, with the overall result that their clocks gain time. If engineers didn't correct for it, your phone's map would drift by kilometres every day. Time really does pass differently depending on where you are.",
      "ask": "Where in your life does time feel like it's moving too fast, and where too slow?"
    },
    {
      "text": "Saturn takes about 29.5 years to travel once around the Sun.",
      "more": "Astrologers call the moment Saturn returns to where it was when you were born your 'Saturn return', usually around ages 29 and 58, and link it to growing up and taking stock. Astronomically, it's simply one long, slow lap of a ringed giant.",
      "ask": "What would you like to have built in your life by the next time Saturn completes a lap?"
    }
  ],
  "The Body": [
    {
      "text": "Almost every atom of carbon, oxygen, calcium and iron in your body was made inside a star.",
      "more": "The universe began with mostly hydrogen and helium. Heavier elements were forged later, in the cores of stars and in their explosions, then scattered across space until some of them became a planet, and eventually you. You aren't entirely 'you' either: researchers estimate your body holds roughly as many bacterial cells as human ones.",
      "ask": "How would you treat your body today if you remembered it's partly made of old stars?"
    },
    {
      "text": "Your body is made of roughly 7 octillion atoms: a 7 followed by 27 zeros.",
      "more": "Most of your hydrogen atoms were made in the first minutes after the Big Bang, about 13.8 billion years ago. Nearly every atom in you has been part of other things before: oceans, rocks, plants, other animals. You are temporarily borrowing very old material.",
      "ask": "If your body is borrowed for a while, what's one way you'd like to look after it this week?"
    },
    {
      "text": "Your heart will beat around 3 billion times in an average lifetime, without you ever asking it to.",
      "more": "At about 100,000 beats a day, it keeps going through sleep, stress, joy and boredom. Most of the work that keeps you alive happens without any conscious effort at all: breathing, digesting, healing a cut.",
      "ask": "What has your body been quietly doing for you today that you haven't thanked it for?"
    }
  ],
  "Home": [
    {
      "text": "In 1990, Voyager 1 turned around and photographed Earth from about 6 billion kilometres away. We are less than a single pixel.",
      "more": "The photo became known as the 'Pale Blue Dot'. Everyone who has ever lived, every war, every love story and every bad day at work happened on that tiny speck, suspended in a sunbeam. As far as we know so far, it is still the only place in the universe with life on it.",
      "ask": "If you could see your current problem from 6 billion kilometres away, how big would it look?"
    },
    {
      "text": "Right now you're travelling around the Sun at about 30 kilometres per second. You have never once been still.",
      "more": "Earth spins, orbits the Sun, and the whole solar system circles the centre of the Milky Way at around 230 kilometres per second. 'Home' is a spaceship moving at speeds we can barely imagine, and yet the sofa still feels perfectly still.",
      "ask": "What makes a place feel like home to you, even when everything else is moving?"
    },
    {
      "text": "Some of the water in your glass may be older than the Sun.",
      "more": "In 2014, researchers concluded that up to half of the water on Earth probably formed as ice in interstellar space before our Sun was born. When you make tea, you may be boiling water older than the solar system.",
      "ask": "What's something old and familiar in your home that you've stopped noticing?"
    }
  ],
  "Laughter": [
    {
      "text": "Laughter is older than language. We were laughing long before we could explain why.",
      "more": "Great apes make laugh-like sounds when they're tickled or playing, which suggests laughter goes back to ancestors we share with them, millions of years before words. Even now, scientists still debate why humour exists at all, and why a species on a spinning rock finds a pun about noodles so irresistible.",
      "ask": "What made you laugh so hard you couldn't stop, and when did it last happen?"
    },
    {
      "text": "Near the centre of our galaxy floats a cloud of gas containing vast amounts of alcohol, and a chemical that tastes of raspberries.",
      "more": "Astronomers studying the cloud Sagittarius B2 have found ethyl alcohol, and in 2009 a team reported ethyl formate, the molecule that gives raspberries their flavour and rum its smell. The universe is very large, very old, and occasionally a little bit ridiculous.",
      "ask": "What's the most ridiculous thing that made you laugh recently?"
    },
    {
      "text": "The Sun is a fairly ordinary star. To us, it's everything.",
      "more": "Our galaxy holds somewhere between 100 and 400 billion stars, and the Sun is a medium-sized, middle-aged one. Being ordinary on a cosmic scale hasn't stopped it from being the reason for every sunrise, every summer and every plant on Earth.",
      "ask": "Where in your life could you stop trying to be extraordinary and simply enjoy shining?"
    }
  ],
  "Calm": [
    {
      "text": "Everything we can see, every star, planet and person, makes up only about 5% of the universe.",
      "more": "The other 95% is made of things scientists call 'dark matter' and 'dark energy'. We can measure their effects, but we still don't know what they actually are. Most of the universe, in other words, is a mystery we're living inside.",
      "ask": "If the universe can be 95% unsolved and still work, which part of your life could you let stay unsolved for now?"
    },
    {
      "text": "Space is completely silent. Sound needs air or water to travel, and there's almost none out there.",
      "more": "The biggest explosions in the universe, from exploding stars to colliding galaxies, happen in perfect silence. All the noise we know exists only on worlds with air, like this one.",
      "ask": "When did you last enjoy real silence, and how could you find a few minutes of it today?"
    },
    {
      "text": "If you could find a bathtub big enough, Saturn would float.",
      "more": "Saturn is mostly hydrogen and helium, and its average density is lower than water's. A planet about 95 times heavier than Earth would bob gently on the surface. Sometimes the biggest things are lighter than they look.",
      "ask": "What's weighing on you that might actually be lighter than it looks?"
    }
  ],
  "Change": [
    {
      "text": "If the whole history of the universe were squeezed into one year, all of recorded human history would happen in about the last 12 seconds.",
      "more": "Carl Sagan called this the 'Cosmic Calendar'. The Big Bang is midnight on 1 January. Dinosaurs only show up around Christmas. Every empire, every invention and every one of us fits into the final seconds before midnight on 31 December. Everything is changing, all the time, and we've only just arrived.",
      "ask": "What would you change if you remembered you only get a few cosmic seconds?"
    },
    {
      "text": "The Moon is slowly drifting away from Earth, about 3.8 centimetres every year.",
      "more": "Scientists measure this by bouncing lasers off mirrors left on the Moon by the Apollo astronauts. It's roughly the speed your fingernails grow. Even the things that seem most permanent above us are quietly changing.",
      "ask": "What's slowly drifting in your life, and do you want to let it go or pull it closer?"
    },
    {
      "text": "In about 5 billion years, the Sun will swell into a red giant. Every star you can see will eventually change or die.",
      "more": "Stars are born, burn and transform, and when they die they scatter the elements that make new planets and new life. Change isn't the universe going wrong; it's the universe working as it always has.",
      "ask": "What change are you resisting that might actually be part of how things are meant to work?"
    }
  ],
  "Small Wonders": [
    {
      "text": "Every single one of your ancestors, in an unbroken line back to the first living cell, survived long enough to pass life on.",
      "more": "Through ice ages, plagues, famines and wars, not one link in that chain broke. Billions of years of near misses led to you, reading this, on an ordinary day. The odds of being here are so small they're hard to calculate.",
      "ask": "What small, ordinary thing in your life would you call a miracle if you'd never seen it before?"
    },
    {
      "text": "A single teaspoon of healthy soil can hold more living microorganisms than there are people on Earth.",
      "more": "Bacteria, fungi and tiny creatures are recycling, breaking down and rebuilding the ground beneath your feet. A whole hidden world is working away every time you walk across a park.",
      "ask": "What tiny thing quietly keeps your life running that you rarely notice?"
    },
    {
      "text": "Every snowflake has six sides because of the way water molecules hold hands as they freeze.",
      "more": "Water molecules lock together in a hexagonal pattern when they freeze, and each crystal grows into its own design as it falls through different temperatures and humidity. Billions fall every winter, each with its own journey.",
      "ask": "What's a small, beautiful pattern you've noticed in your days lately?"
    }
  ],
  "Stories": [
    {
      "text": "Money, countries and companies exist mainly because enough humans agree to believe in them.",
      "more": "Historian Yuval Noah Harari argues that our ability to believe in shared stories is what lets millions of strangers cooperate. A banknote is paper; a border is an idea. We are the species that turned stories into reality, and we go on living inside them.",
      "ask": "Which story about your life have you believed for so long that you've forgotten it's a story?"
    },
    {
      "text": "On Mercury, a single day from sunrise to sunrise lasts longer than its whole year.",
      "more": "Mercury orbits the Sun in about 88 Earth days, but because of the way it spins, one full solar day there takes about 176 Earth days. Mercury, in astrology the planet of thinking and talking, lives by a very different clock from ours.",
      "ask": "What story are you telling yourself about how long something 'should' take?"
    },
    {
      "text": "Two spacecraft are carrying a golden record of Earth's music, greetings and sounds out of our solar system.",
      "more": "Launched in 1977, Voyager 1 and 2 carry Golden Records with greetings in 55 languages, music from around the world, and sounds like laughter, rain and a heartbeat. It's a message to strangers who may never exist, our story told just in case someone is listening.",
      "ask": "If you could add one sound or story from your life to that record, what would it be?"
    }
  ],
  "Fear": [
    {
      "text": "We've mapped the surface of Mars in more detail than the bottom of our own oceans.",
      "more": "As of the mid-2020s, only around a quarter of Earth's ocean floor had been mapped in high detail. Huge parts of our own planet are still unknown, and new species are found in the deep sea all the time. The unknown isn't just out in space; it's right here, under the waves.",
      "ask": "What's one unknown in your life you could look at with curiosity instead of fear?"
    },
    {
      "text": "66 million years ago, an asteroid about 10 km wide hit what is now Mexico. It ended the age of the dinosaurs, and made room for mammals like us.",
      "more": "The Chicxulub impact set off fires, tsunamis and years of darkness, and roughly three-quarters of plant and animal species disappeared. Small, furry mammals survived and spread into the space the dinosaurs left behind. One of the worst days in Earth's history is part of the reason you exist.",
      "ask": "What ending in your own life, painful at the time, quietly made room for something good?"
    },
    {
      "text": "The Sun turns about 4 million tonnes of itself into pure energy every single second, and it's been doing that for 4.6 billion years.",
      "more": "Deep in its core, hydrogen fuses into helium and a little mass becomes light. That light takes about eight minutes to reach you, and it's the energy behind almost all life on Earth. Our whole existence runs on a controlled explosion we orbit at a safe distance.",
      "ask": "What feels explosive in your life right now, and what would it look like to keep it at a safe, useful distance?"
    }
  ],
  "Kindness": [
    {
      "text": "Every one of the 8 billion people alive right now has an inner life as loud and complicated as yours.",
      "more": "Each stranger on the bus has their own worries, memories, favourite songs and private jokes, and to each of them you're just a background extra. Writer John Koenig coined a word for suddenly realising this: 'sonder'.",
      "ask": "Whose inner life have you not thought about in a while?"
    },
    {
      "text": "Any two people on Earth share about 99.9% of their DNA.",
      "more": "All the visible differences between humans come from a tiny fraction of our genetic code. Underneath, the person you find hardest to understand is almost exactly the same as you.",
      "ask": "Who would be easier to be kind to if you remembered how similar you really are?"
    },
    {
      "text": "If you go back far enough, everyone alive today has the same ancestors, and it may not be as far back as you think.",
      "more": "A 2004 mathematical model suggested that the most recent common ancestor of every person alive today may have lived only a few thousand years ago. We are, quite literally, one big family that forgot to keep in touch.",
      "ask": "Which 'distant relative' could you be a little kinder to today?"
    }
  ],
  "Curiosity": [
    {
      "text": "Nobody knows why it feels like anything to be you.",
      "more": "Scientists can measure brain activity in great detail, but no one can explain why all that electrical and chemical activity produces the experience of tasting coffee or missing someone. Philosopher David Chalmers called this 'the hard problem of consciousness'. You carry the biggest unsolved mystery in science around inside your head.",
      "ask": "What's something about your own mind that still surprises you?"
    },
    {
      "text": "On a dark night you can see the Andromeda Galaxy with your naked eye. The light hitting your eyes left it about 2.5 million years ago.",
      "more": "When that light set off, our own species didn't exist yet. Early human relatives were only just starting to make stone tools. It's the most distant thing most people can see without a telescope, and it's travelled all that way just to land on you.",
      "ask": "What's something you've been curious about for years but never actually looked into?"
    },
    {
      "text": "Scientists estimate Earth has about 8.7 million species, and most of them have never been named.",
      "more": "A 2011 study estimated that around 86% of species on land and 91% in the oceans are still undescribed. We share the planet with millions of neighbours we haven't even met yet.",
      "ask": "What's something right in front of you that you've never looked at closely?"
    }
  ],
  "Nature": [
    {
      "text": "There are more trees on Earth than stars in our galaxy.",
      "more": "A 2015 study estimated about 3 trillion trees on Earth. The Milky Way is thought to contain somewhere between 100 and 400 billion stars. We live on a planet so alive that its forests outnumber the stars around us.",
      "ask": "When did you last really look at a tree, not just walk past one?"
    },
    {
      "text": "Twice a day, the Moon's gravity lifts Earth's oceans and pulls them back.",
      "more": "The Moon and, to a lesser degree, the Sun pull on the oceans, creating the tides. At Full and New Moons, when the Sun, Moon and Earth line up, tides tend to be strongest. Every beach on Earth is breathing to the rhythm of a rock in the sky.",
      "ask": "What rhythm in your life do you tend to fight instead of follow?"
    }
  ],
  "The Self": [
    {
      "text": "Each of your eyes has a blind spot, and your brain quietly paints over it so you never notice.",
      "more": "Where the optic nerve leaves the eye there are no light-sensing cells at all. Your brain fills the gap with its best guess of what should be there. What you 'see' is partly a picture your brain has made for you.",
      "ask": "What might your mind be quietly painting over in your own life?"
    },
    {
      "text": "No two people have ever been found with the same fingerprints, not even identical twins.",
      "more": "Fingerprints form in the womb and are shaped by tiny differences in pressure and position, so even twins with the same DNA end up with different ones. Out of billions of humans, you carry a pattern that has never existed before.",
      "ask": "What's something about you that's as unique as your fingerprints?"
    },
    {
      "text": "Uranus spins on its side, tilted about 98 degrees, probably after a huge collision long ago.",
      "more": "While most planets spin roughly upright, Uranus rolls around the Sun like a ball, giving it seasons that last about 21 years. In astrology it's the planet of the unconventional, and it's been getting on perfectly well doing things differently for billions of years.",
      "ask": "Which 'sideways' part of you deserves more pride than embarrassment?"
    }
  ],
  "Rest": [
    {
      "text": "You'll spend about a third of your life asleep, and science still can't fully explain why we need it.",
      "more": "There are strong theories: sleep helps store memories, repair the body and clear waste from the brain. Yet every night we switch off our consciousness, hallucinate vivid stories, and wake up treating it as completely normal.",
      "ask": "If rest were part of your job description, what would you do differently this week?"
    },
    {
      "text": "Earth's spin is slowly slowing down. About 620 million years ago, a day was only around 22 hours long.",
      "more": "The Moon's pull on the tides acts like a gentle brake on Earth's rotation, lengthening our day by a tiny fraction of a second each century. Even the planet takes its time.",
      "ask": "What would change if you let yourself slow down by just a little?"
    }
  ],
  "Beginnings": [
    {
      "text": "The universe began about 13.8 billion years ago, and we still don't know what, if anything, came before.",
      "more": "Physics can describe the universe back to a tiny fraction of a second after the Big Bang, then the maths breaks down. Whether there even was a 'before' is still an open question. Everything, including you, started from a beginning that nobody fully understands.",
      "ask": "What would you begin today if you didn't need to know how it ends?"
    },
    {
      "text": "The hydrogen in your body was made in the first few minutes after the Big Bang.",
      "more": "When the universe was only minutes old, it cooled enough for the first simple nuclei to form. Some of those hydrogen atoms are now in your water, your cells and your breath. Part of you is as old as time itself.",
      "ask": "If part of you has been around since the very beginning, what's one new thing it deserves to try?"
    }
  ]
};

export const PROMPTS = {
  "Time": [
    {
      "text": "If you could go back in time and spend one hour inside any moment of your own life, not to change it but just to be there again, which hour would you choose? Describe it as if you're there right now.",
      "why": "Reliving a good memory in rich detail is a form of savouring. It can lift your mood, and it often shows you what you value most.",
      "starters": [
        "The hour I'd choose is…",
        "The first thing I notice is…",
        "What I didn't realise back then was…"
      ]
    },
    {
      "text": "Write a letter to yourself to open one year from today. What do you hope has changed, and what do you hope stays exactly the same?",
      "why": "Writing to your future self clarifies what matters to you now, and it often reveals that a lot of what you have is already worth keeping.",
      "starters": [
        "Dear me, one year from now…",
        "I hope by now…",
        "Please don't let go of…"
      ]
    }
  ],
  "The Body": [
    {
      "text": "What is one way you take care of your body every day? How does it make you feel? Then write your body a short thank-you note for something it did today that you didn't even notice.",
      "why": "Body appreciation means paying attention to what your body does rather than how it looks. It's linked with a kinder, calmer relationship with yourself.",
      "starters": [
        "Every day, I look after my body by…",
        "It makes me feel…",
        "Dear body, thank you for…"
      ]
    },
    {
      "text": "Do a slow scan from your toes to the top of your head. Write one sentence for each part of your body, as if it were telling you how its day went.",
      "why": "A body scan is a common mindfulness practice. Writing it down helps you notice tension and tiredness before they turn into bigger problems.",
      "starters": [
        "My feet say…",
        "My shoulders say…",
        "My head says…"
      ]
    }
  ],
  "Home": [
    {
      "text": "Write about a spot you go to, or would love to go to, when you need alone time. Describe it so well that a stranger could find it with their eyes closed: the sounds, the smells, the temperature of the air. Why is this a great spot?",
      "why": "Picturing a safe, peaceful place in full sensory detail is a grounding technique. It gives you somewhere to go in your mind when real life gets loud.",
      "starters": [
        "My spot is…",
        "When I close my eyes there, I can hear…",
        "It feels safe because…"
      ]
    },
    {
      "text": "Take a walk, in words, through a home from your childhood. Go room by room and write one memory for each room.",
      "why": "Revisiting places from your past through the senses can bring back memories you didn't know you still had, and help you understand where some of your habits come from.",
      "starters": [
        "I walk in through the front door and…",
        "In the kitchen…",
        "The room I remember most is…"
      ]
    }
  ],
  "Laughter": [
    {
      "text": "Write about the last time you smiled when you didn't feel like it. Who or what got through to you, and how did they do it?",
      "why": "Remembering what reaches you on a bad day builds a personal first-aid kit, a list of people and things you can turn to next time.",
      "starters": [
        "I didn't feel like smiling because…",
        "Then…",
        "What got through to me was…"
      ]
    },
    {
      "text": "Write about the last time you laughed until it hurt. Who was there, what was so funny, and how did you feel afterwards?",
      "why": "Recalling joyful moments in detail is a way of savouring them. It can lift your mood and remind you who brings out your lightest side.",
      "starters": [
        "The last time I laughed that hard…",
        "What made it so funny was…",
        "Afterwards I felt…"
      ]
    }
  ],
  "Calm": [
    {
      "text": "What helps you feel calm when you're upset? Write it as a recipe for a future, stressed version of you: the ingredients, the amounts, the cooking time, and what to serve it with.",
      "why": "Noticing which coping strategies actually work for you, and writing them down while you're calm, makes them much easier to reach when you're not.",
      "starters": [
        "Ingredients:",
        "Method: first,",
        "Best served with…"
      ]
    },
    {
      "text": "Describe your ideal calm morning in such detail that reading it back slows your breathing.",
      "why": "Detailed calming imagery is a relaxation technique: your body responds to vivid images almost as if they were real.",
      "starters": [
        "I wake up to…",
        "The light is…",
        "The first thing I drink is…"
      ]
    }
  ],
  "Change": [
    {
      "text": "An important change I want to make for myself is… Finish that sentence, then write a postcard from yourself one year from now, after you've made the change. What does your life look like?",
      "why": "Imagining your future self vividly can make long-term goals feel more real and more worth acting on today.",
      "starters": [
        "An important change I want to make for myself is…",
        "Dear me, it's one year later and…",
        "The first small step was…"
      ]
    },
    {
      "text": "Write about who you were five years ago and three things that changed you since. Which change are you proudest of surviving?",
      "why": "Looking back at how far you've come helps you trust that you can handle the changes still ahead.",
      "starters": [
        "Five years ago, I was…",
        "The three things that changed me were…",
        "I'm proudest of surviving…"
      ]
    }
  ],
  "Small Wonders": [
    {
      "text": "Write about something great that happened this week, big or small. Then give it the front-page newspaper headline it deserves.",
      "why": "Gratitude writing trains your attention to notice good things, which we tend to forget much faster than bad ones. The headline makes you take the good moment seriously.",
      "starters": [
        "Something great that happened this week was…",
        "It mattered because…",
        "HEADLINE:"
      ]
    },
    {
      "text": "Write down five tiny things you'd miss if they disappeared tomorrow, then say why for each one.",
      "why": "Imagining the absence of something small is a gratitude technique that makes ordinary things suddenly feel precious.",
      "starters": [
        "1.",
        "I'd miss it because…",
        "The one I'd miss most is…"
      ]
    }
  ],
  "Stories": [
    {
      "text": "Which book or movie character would you invite to your house? Write the evening: what you'd cook, what they'd notice first about your home, and the one question you'd finally get to ask them.",
      "why": "The characters we love often have qualities we want more of. Spending an imagined evening with one is a playful way to discover what you're longing for.",
      "starters": [
        "I'd invite…",
        "The moment they walk in, they notice…",
        "Finally, I ask them…"
      ]
    },
    {
      "text": "Write the opening paragraph of your life story as if it were a novel. Start with a sentence that would make a stranger keep reading.",
      "why": "Seeing your life as a story with a narrator, a setting and turning points can bring meaning to hard chapters and perspective to small ones.",
      "starters": [
        "It began on…",
        "Nobody expected that…",
        "Chapter one:"
      ]
    }
  ],
  "Fear": [
    {
      "text": "Write a letter to one of your fears as if it were an over-protective friend. Thank it for trying to keep you safe, then tell it, kindly but clearly, what you're going to do anyway.",
      "why": "Turning a fear into a character puts a little distance between you and it, a technique used in narrative therapy. You stop being the fear and start talking to it.",
      "starters": [
        "Dear Fear,",
        "I know you're only trying to…",
        "But this time, I'm going to…"
      ]
    },
    {
      "text": "Write about a time you were scared and did it anyway. What did your body feel like before, during and after?",
      "why": "Remembering your own past courage is evidence your mind can use next time fear shows up. It shifts the story from 'I can't' to 'I have before'.",
      "starters": [
        "I was scared because…",
        "In the moment, my body…",
        "Afterwards I realised…"
      ]
    }
  ],
  "Kindness": [
    {
      "text": "Think of someone who was kind to you and probably never knew how much it mattered. Write them the thank-you you never sent. (You don't have to send it.)",
      "why": "Gratitude letters are among the most studied positive-psychology exercises, and they tend to boost the writer's mood, whether or not the letter is ever sent.",
      "starters": [
        "Dear…",
        "You probably don't remember the time you…",
        "It mattered because…"
      ]
    },
    {
      "text": "Think of someone who annoyed you recently. Write them a kind note, imagining the hard day they might have been having. You won't send it.",
      "why": "Taking someone else's perspective is a core part of empathy, and it can loosen the grip of resentment, for your sake as much as theirs.",
      "starters": [
        "Maybe your day was…",
        "I didn't see that…",
        "What I'd like you to know is…"
      ]
    }
  ],
  "Curiosity": [
    {
      "text": "If you could ask the universe one question and be sure of getting a true answer, what would you ask? Write the answer you're afraid of, and then the answer you hope for.",
      "why": "Big questions often hide a personal worry or wish. Writing both possible answers lets you look at the fear and the hope side by side.",
      "starters": [
        "My question would be…",
        "The answer I'm afraid of is…",
        "The answer I hope for is…"
      ]
    },
    {
      "text": "List ten things you've always wondered about but never looked up. Then circle the one that says the most about you, and write why.",
      "why": "Curiosity is linked with wellbeing and connection. Your questions often reveal what you care about more than your answers do.",
      "starters": [
        "I've always wondered…",
        "The one I circled is…",
        "It says something about me because…"
      ]
    }
  ],
  "Nature": [
    {
      "text": "Go to a window, or step outside, and choose one living thing: a tree, a pigeon, a weed in a crack. Write its autobiography in ten sentences. How did it get here, what has it seen, and what does it think of you?",
      "why": "Paying close attention to something in nature is a mindfulness practice that pulls you out of your head and into the present moment.",
      "starters": [
        "I was born…",
        "From here, I've watched…",
        "I've noticed that you…"
      ]
    }
  ],
  "The Self": [
    {
      "text": "Write about your day in the third person, as a gentle narrator who is completely on your side. ('She woke up tired, but…')",
      "why": "Psychologist Ethan Kross's research on 'distanced self-talk' suggests that thinking about yourself in the third person can make difficult feelings easier to handle.",
      "starters": [
        "She woke up…",
        "What nobody noticed was…",
        "By the evening, she…"
      ]
    },
    {
      "text": "Write a list called 'Things that are completely, weirdly me'. Aim for twenty, no matter how small or silly.",
      "why": "Naming your own quirks with affection builds self-acceptance and a clearer sense of identity.",
      "starters": [
        "I always…",
        "I secretly love…",
        "Nobody knows that I…"
      ]
    }
  ],
  "Rest": [
    {
      "text": "Describe your perfect day of doing absolutely nothing productive, hour by hour. Then circle one tiny piece of it you could actually have this weekend.",
      "why": "Many of us feel guilty about resting. Planning rest on purpose gives you permission to have it, and makes it more likely to happen.",
      "starters": [
        "I'd wake up at…",
        "In the afternoon, I'd…",
        "The piece I can have this weekend is…"
      ]
    }
  ],
  "Beginnings": [
    {
      "text": "Think of three goals you have for yourself this week: one for your body, one for your mind and one just for joy. Write them down, then write a first step for each one that takes less than five minutes.",
      "why": "Breaking goals into tiny first steps makes them far less overwhelming, and small wins build momentum.",
      "starters": [
        "For my body, this week I want to…",
        "For my mind…",
        "Just for joy…"
      ]
    }
  ]
};

export const FACTS = [
  {
    "text": "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
    "more": "The Great Pyramid of Giza was finished around 2560 BC. Cleopatra died in 30 BC, about 2,500 years later. The Apollo 11 Moon landing was in 1969, roughly 2,000 years after her. To Cleopatra, the pyramids were already ancient history."
  },
  {
    "text": "Your body glows in the dark. You just can't see it.",
    "more": "In 2009, Japanese researchers used ultra-sensitive cameras to show that the human body gives off a tiny amount of visible light, about 1,000 times weaker than our eyes can detect. The glow was brightest from the face and changed over the course of the day."
  },
  {
    "text": "The oldest known wooden structure was built about 476,000 years ago, before our own species existed.",
    "more": "In 2023, archaeologists working at Kalambo Falls in Zambia reported two logs joined together with a deliberately cut notch. They were dated to around 476,000 years old, which is older than Homo sapiens. That means an earlier human species was already shaping wood to build things."
  },
  {
    "text": "Rats laugh when you tickle them.",
    "more": "Neuroscientist Jaak Panksepp found that young rats make high-pitched ultrasonic chirps when tickled, too high for humans to hear without special equipment. The rats would chase the researcher's hand to be tickled again."
  },
  {
    "text": "Sea otters sometimes hold paws while they rest so they don't drift apart.",
    "more": "Sea otters often float on their backs in groups called rafts. Some wrap themselves in kelp to stay anchored, and some hold paws with a neighbour."
  },
  {
    "text": "The Eiffel Tower was only supposed to stand for 20 years.",
    "more": "It was built for the 1889 World's Fair in Paris, and many artists of the time hated it. It was given a permit for 20 years. One of the things that saved it was its usefulness as a giant antenna for radio communication."
  },
  {
    "text": "Wombats produce cube-shaped poo.",
    "more": "Researchers at Georgia Tech found that parts of the wombat's intestine stretch differently, moulding the droppings into cubes. Wombats leave them on rocks and logs to mark their territory, and cubes don't roll away."
  },
  {
    "text": "The oldest known story in art is more than 51,000 years old.",
    "more": "In 2024, researchers dated a cave painting in Sulawesi, Indonesia, to at least 51,200 years ago. It shows three human-like figures interacting with a wild pig, which makes it the oldest known example of a scene that tells a story."
  },
  {
    "text": "Goosebumps are left over from our furrier ancestors.",
    "more": "When you're cold or scared, tiny muscles make your hairs stand up. In furry animals this traps warm air or makes them look bigger to a threat, like a cat puffing up. We've lost most of the fur but kept the reflex."
  },
  {
    "text": "Vampire bats share food with friends who've had a bad night.",
    "more": "A vampire bat can die if it goes about two or three nights without feeding. Bats that have fed will regurgitate blood to hungry roost-mates, and studies show they're more likely to share with bats that have shared with them before. Friendship, it turns out, is an excellent survival strategy."
  },
  {
    "text": "Göbekli Tepe, in Turkey, is roughly 6,000 years older than Stonehenge.",
    "more": "Its huge carved stone pillars were raised around 9500 BC, before writing, before pottery and before the wheel. Its discovery made archaeologists rethink when humans started building monumental places together."
  },
  {
    "text": "Sharks have existed for longer than trees.",
    "more": "The earliest shark fossils are about 450 million years old. The first true trees appeared around 385 million years ago, so sharks had a head start of tens of millions of years."
  },
  {
    "text": "You can't tickle yourself, because your brain sees it coming.",
    "more": "Research led by neuroscientist Sarah-Jayne Blakemore showed that the brain predicts the sensations caused by your own movements and turns them down. When someone else tickles you, the brain can't predict it in the same way, so it feels much stronger."
  },
  {
    "text": "Dolphins sleep with half their brain at a time.",
    "more": "One half of a dolphin's brain sleeps while the other stays awake, often with one eye open. This lets it keep coming up to breathe and watch out for danger. Some birds can do this too."
  },
  {
    "text": "The first person convicted of speeding was going about 8 miles per hour.",
    "more": "In 1896, Walter Arnold was caught driving at around 8 mph in Kent, England, where the limit was 2 mph. A policeman chased him down on a bicycle, and he was fined one shilling."
  }
];
