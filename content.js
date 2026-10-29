// ─────────────────────────────────────────────────────────────
//  DAILY PAGES
//  Each day has ONE theme that ties all four sections together.
//  The site shows one day per calendar day and cycles through the list.
//  To add a day, copy one block { ... }, paste it at the end and edit it.
//
//  Rule for facts and food for thought: only add things you have checked
//  against a reliable source (a museum, university, NASA, a journal...).
// ─────────────────────────────────────────────────────────────

export const DAYS = [
  {
    theme: "Time",
    thought: {
      text: "Every time you look at the night sky, you're looking into the past.",
      more: "Sunlight is about eight minutes old when it reaches you. The light from many of the stars you can see left them decades, centuries or even thousands of years ago, so some of what you see tonight may have changed long since. Stranger still, physicists still argue about what time actually is. Most of the basic laws of physics work the same forwards and backwards, yet we only ever experience time moving one way.",
      ask: "Which of today's worries would still matter by the time tonight's starlight reached another star?",
    },
    joke: {
      setup: "Why did the man throw his clock out of the window?",
      punch: "He wanted to see time fly.",
      bonus: "Time flies like an arrow. Fruit flies like a banana.",
    },
    fact: {
      text: "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
      more: "The Great Pyramid of Giza was finished around 2560 BC. Cleopatra died in 30 BC, about 2,500 years later. The Apollo 11 Moon landing was in 1969, roughly 2,000 years after her. To Cleopatra, the pyramids were already ancient history.",
    },
    prompt: {
      text: "If you could go back in time and spend one hour inside any moment of your own life, not to change it but just to be there again, which hour would you choose? Describe it as if you're there right now.",
      why: "Reliving a good memory in rich detail is a form of savouring. It can lift your mood, and it often shows you what you value most.",
      starters: ["The hour I'd choose is…", "The first thing I notice is…", "What I didn't realise back then was…"],
    },
  },
  {
    theme: "The Body",
    thought: {
      text: "Almost every atom of carbon, oxygen, calcium and iron in your body was made inside a star.",
      more: "The universe began with mostly hydrogen and helium. Heavier elements were forged later, in the cores of stars and in their explosions, then scattered across space until some of them became a planet, and eventually you. You aren't entirely 'you' either: researchers estimate your body holds roughly as many bacterial cells as human ones.",
      ask: "How would you treat your body today if you remembered it's partly made of old stars?",
    },
    joke: {
      setup: "My body is a temple.",
      punch: "Ancient, crumbling, and probably haunted.",
      bonus: "I told my doctor I broke my arm in two places. He told me to stop going to those places.",
    },
    fact: {
      text: "Your body glows in the dark. You just can't see it.",
      more: "In 2009, Japanese researchers used ultra-sensitive cameras to show that the human body gives off a tiny amount of visible light, about 1,000 times weaker than our eyes can detect. The glow was brightest from the face and changed over the course of the day.",
    },
    prompt: {
      text: "What is one way you take care of your body every day? How does it make you feel? Then write your body a short thank-you note for something it did today that you didn't even notice.",
      why: "Body appreciation means paying attention to what your body does rather than how it looks. It's linked with a kinder, calmer relationship with yourself.",
      starters: ["Every day, I look after my body by…", "It makes me feel…", "Dear body, thank you for…"],
    },
  },
  {
    theme: "Home",
    thought: {
      text: "In 1990, Voyager 1 turned around and photographed Earth from about 6 billion kilometres away. We are less than a single pixel.",
      more: "The photo became known as the 'Pale Blue Dot'. Everyone who has ever lived, every war, every love story and every bad day at work happened on that tiny speck, suspended in a sunbeam. As far as we know so far, it is still the only place in the universe with life on it.",
      ask: "If you could see your current problem from 6 billion kilometres away, how big would it look?",
    },
    joke: {
      setup: "Why did the house go to the doctor?",
      punch: "It had window pains.",
      bonus: "I spent all weekend rearranging my furniture for better energy flow. Now the only thing flowing is my anxiety.",
    },
    fact: {
      text: "The oldest known wooden structure was built about 476,000 years ago, before our own species existed.",
      more: "In 2023, archaeologists working at Kalambo Falls in Zambia reported two logs joined together with a deliberately cut notch. They were dated to around 476,000 years old, which is older than Homo sapiens. That means an earlier human species was already shaping wood to build things.",
    },
    prompt: {
      text: "Write about a spot you go to, or would love to go to, when you need alone time. Describe it so well that a stranger could find it with their eyes closed: the sounds, the smells, the temperature of the air. Why is this a great spot?",
      why: "Picturing a safe, peaceful place in full sensory detail is a grounding technique. It gives you somewhere to go in your mind when real life gets loud.",
      starters: ["My spot is…", "When I close my eyes there, I can hear…", "It feels safe because…"],
    },
  },
  {
    theme: "Laughter",
    thought: {
      text: "Laughter is older than language. We were laughing long before we could explain why.",
      more: "Great apes make laugh-like sounds when they're tickled or playing, which suggests laughter goes back to ancestors we share with them, millions of years before words. Even now, scientists still debate why humour exists at all, and why a species on a spinning rock finds a pun about noodles so irresistible.",
      ask: "What made you laugh so hard you couldn't stop, and when did it last happen?",
    },
    joke: {
      setup: "I told my friend she should embrace her mistakes.",
      punch: "She hugged me.",
      bonus: "I have a joke about construction, but I'm still working on it.",
    },
    fact: {
      text: "Rats laugh when you tickle them.",
      more: "Neuroscientist Jaak Panksepp found that young rats make high-pitched ultrasonic chirps when tickled, too high for humans to hear without special equipment. The rats would chase the researcher's hand to be tickled again.",
    },
    prompt: {
      text: "Write about the last time you smiled when you didn't feel like it. Who or what got through to you, and how did they do it?",
      why: "Remembering what reaches you on a bad day builds a personal first-aid kit, a list of people and things you can turn to next time.",
      starters: ["I didn't feel like smiling because…", "Then…", "What got through to me was…"],
    },
  },
  {
    theme: "Calm",
    thought: {
      text: "Everything we can see, every star, planet and person, makes up only about 5% of the universe.",
      more: "The other 95% is made of things scientists call 'dark matter' and 'dark energy'. We can measure their effects, but we still don't know what they actually are. Most of the universe, in other words, is a mystery we're living inside.",
      ask: "If the universe can be 95% unsolved and still work, which part of your life could you let stay unsolved for now?",
    },
    joke: {
      setup: "I went on a silent retreat last month.",
      punch: "Nobody's said a word about it since.",
      bonus: "I tried meditation, but I kept getting distracted thinking about how good I'd be at meditation.",
    },
    fact: {
      text: "Sea otters sometimes hold paws while they rest so they don't drift apart.",
      more: "Sea otters often float on their backs in groups called rafts. Some wrap themselves in kelp to stay anchored, and some hold paws with a neighbour.",
    },
    prompt: {
      text: "What helps you feel calm when you're upset? Write it as a recipe for a future, stressed version of you: the ingredients, the amounts, the cooking time, and what to serve it with.",
      why: "Noticing which coping strategies actually work for you, and writing them down while you're calm, makes them much easier to reach when you're not.",
      starters: ["Ingredients:", "Method: first,", "Best served with…"],
    },
  },
  {
    theme: "Change",
    thought: {
      text: "If the whole history of the universe were squeezed into one year, all of recorded human history would happen in about the last 12 seconds.",
      more: "Carl Sagan called this the 'Cosmic Calendar'. The Big Bang is midnight on 1 January. Dinosaurs only show up around Christmas. Every empire, every invention and every one of us fits into the final seconds before midnight on 31 December. Everything is changing, all the time, and we've only just arrived.",
      ask: "What would you change if you remembered you only get a few cosmic seconds?",
    },
    joke: {
      setup: "My goal this year was to lose 10 kilos.",
      punch: "Only 15 to go.",
      bonus: "I set a goal to drink more water. Now I know where every toilet in the city is.",
    },
    fact: {
      text: "The Eiffel Tower was only supposed to stand for 20 years.",
      more: "It was built for the 1889 World's Fair in Paris, and many artists of the time hated it. It was given a permit for 20 years. One of the things that saved it was its usefulness as a giant antenna for radio communication.",
    },
    prompt: {
      text: "An important change I want to make for myself is… Finish that sentence, then write a postcard from yourself one year from now, after you've made the change. What does your life look like?",
      why: "Imagining your future self vividly can make long-term goals feel more real and more worth acting on today.",
      starters: ["An important change I want to make for myself is…", "Dear me, it's one year later and…", "The first small step was…"],
    },
  },
  {
    theme: "Small Wonders",
    thought: {
      text: "Every single one of your ancestors, in an unbroken line back to the first living cell, survived long enough to pass life on.",
      more: "Through ice ages, plagues, famines and wars, not one link in that chain broke. Billions of years of near misses led to you, reading this, on an ordinary day. The odds of being here are so small they're hard to calculate.",
      ask: "What small, ordinary thing in your life would you call a miracle if you'd never seen it before?",
    },
    joke: {
      setup: "Why did the scarecrow win an award?",
      punch: "He was outstanding in his field.",
      bonus: "I bought the world's worst thesaurus. Not only is it terrible, it's terrible.",
    },
    fact: {
      text: "Wombats produce cube-shaped poo.",
      more: "Researchers at Georgia Tech found that parts of the wombat's intestine stretch differently, moulding the droppings into cubes. Wombats leave them on rocks and logs to mark their territory, and cubes don't roll away.",
    },
    prompt: {
      text: "Write about something great that happened this week, big or small. Then give it the front-page newspaper headline it deserves.",
      why: "Gratitude writing trains your attention to notice good things, which we tend to forget much faster than bad ones. The headline makes you take the good moment seriously.",
      starters: ["Something great that happened this week was…", "It mattered because…", "HEADLINE:"],
    },
  },
  {
    theme: "Stories",
    thought: {
      text: "Money, countries and companies exist mainly because enough humans agree to believe in them.",
      more: "Historian Yuval Noah Harari argues that our ability to believe in shared stories is what lets millions of strangers cooperate. A banknote is paper; a border is an idea. We are the species that turned stories into reality, and we go on living inside them.",
      ask: "Which story about your life have you believed for so long that you've forgotten it's a story?",
    },
    joke: {
      setup: "I'm reading a horror story in braille. Something terrible is about to happen.",
      punch: "I can feel it.",
      bonus: "Why did Shakespeare only write in ink? Pencils confused him: 2B or not 2B.",
    },
    fact: {
      text: "The oldest known story in art is more than 51,000 years old.",
      more: "In 2024, researchers dated a cave painting in Sulawesi, Indonesia, to at least 51,200 years ago. It shows three human-like figures interacting with a wild pig, which makes it the oldest known example of a scene that tells a story.",
    },
    prompt: {
      text: "Which book or movie character would you invite to your house? Write the evening: what you'd cook, what they'd notice first about your home, and the one question you'd finally get to ask them.",
      why: "The characters we love often have qualities we want more of. Spending an imagined evening with one is a playful way to discover what you're longing for.",
      starters: ["I'd invite…", "The moment they walk in, they notice…", "Finally, I ask them…"],
    },
  },
  {
    theme: "Fear",
    thought: {
      text: "We've mapped the surface of Mars in more detail than the bottom of our own oceans.",
      more: "As of the mid-2020s, only around a quarter of Earth's ocean floor had been mapped in high detail. Huge parts of our own planet are still unknown, and new species are found in the deep sea all the time. The unknown isn't just out in space; it's right here, under the waves.",
      ask: "What's one unknown in your life you could look at with curiosity instead of fear?",
    },
    joke: {
      setup: "I used to be afraid of hurdles.",
      punch: "But I got over it.",
      bonus: "Why are ghosts such bad liars? You can see right through them.",
    },
    fact: {
      text: "Goosebumps are left over from our furrier ancestors.",
      more: "When you're cold or scared, tiny muscles make your hairs stand up. In furry animals this traps warm air or makes them look bigger to a threat, like a cat puffing up. We've lost most of the fur but kept the reflex.",
    },
    prompt: {
      text: "Write a letter to one of your fears as if it were an over-protective friend. Thank it for trying to keep you safe, then tell it, kindly but clearly, what you're going to do anyway.",
      why: "Turning a fear into a character puts a little distance between you and it, a technique used in narrative therapy. You stop being the fear and start talking to it.",
      starters: ["Dear Fear,", "I know you're only trying to…", "But this time, I'm going to…"],
    },
  },
  {
    theme: "Kindness",
    thought: {
      text: "Every one of the 8 billion people alive right now has an inner life as loud and complicated as yours.",
      more: "Each stranger on the bus has their own worries, memories, favourite songs and private jokes, and to each of them you're just a background extra. Writer John Koenig coined a word for suddenly realising this: 'sonder'.",
      ask: "Whose inner life have you not thought about in a while?",
    },
    joke: {
      setup: "I left a note on my friend's car to compliment her driving.",
      punch: "It said: 'Parking fine.'",
      bonus: "What do you call a group of strangers being kind to each other online? Fiction.",
    },
    fact: {
      text: "Vampire bats share food with friends who've had a bad night.",
      more: "A vampire bat can die if it goes about two or three nights without feeding. Bats that have fed will regurgitate blood to hungry roost-mates, and studies show they're more likely to share with bats that have shared with them before. Friendship, it turns out, is an excellent survival strategy.",
    },
    prompt: {
      text: "Think of someone who was kind to you and probably never knew how much it mattered. Write them the thank-you you never sent. (You don't have to send it.)",
      why: "Gratitude letters are among the most studied positive-psychology exercises, and they tend to boost the writer's mood, whether or not the letter is ever sent.",
      starters: ["Dear…", "You probably don't remember the time you…", "It mattered because…"],
    },
  },
  {
    theme: "Curiosity",
    thought: {
      text: "Nobody knows why it feels like anything to be you.",
      more: "Scientists can measure brain activity in great detail, but no one can explain why all that electrical and chemical activity produces the experience of tasting coffee or missing someone. Philosopher David Chalmers called this 'the hard problem of consciousness'. You carry the biggest unsolved mystery in science around inside your head.",
      ask: "What's something about your own mind that still surprises you?",
    },
    joke: {
      setup: "Why did the physicist break up with the biologist?",
      punch: "There was no chemistry.",
      bonus: "What do you call a dinosaur with a huge vocabulary? A thesaurus.",
    },
    fact: {
      text: "Göbekli Tepe, in Turkey, is roughly 6,000 years older than Stonehenge.",
      more: "Its huge carved stone pillars were raised around 9500 BC, before writing, before pottery and before the wheel. Its discovery made archaeologists rethink when humans started building monumental places together.",
    },
    prompt: {
      text: "If you could ask the universe one question and be sure of getting a true answer, what would you ask? Write the answer you're afraid of, and then the answer you hope for.",
      why: "Big questions often hide a personal worry or wish. Writing both possible answers lets you look at the fear and the hope side by side.",
      starters: ["My question would be…", "The answer I'm afraid of is…", "The answer I hope for is…"],
    },
  },
  {
    theme: "Nature",
    thought: {
      text: "There are more trees on Earth than stars in our galaxy.",
      more: "A 2015 study estimated about 3 trillion trees on Earth. The Milky Way is thought to contain somewhere between 100 and 400 billion stars. We live on a planet so alive that its forests outnumber the stars around us.",
      ask: "When did you last really look at a tree, not just walk past one?",
    },
    joke: {
      setup: "Why do trees hate riddles?",
      punch: "They're easily stumped.",
      bonus: "What did the tree say to autumn? Leaf me alone.",
    },
    fact: {
      text: "Sharks have existed for longer than trees.",
      more: "The earliest shark fossils are about 450 million years old. The first true trees appeared around 385 million years ago, so sharks had a head start of tens of millions of years.",
    },
    prompt: {
      text: "Go to a window, or step outside, and choose one living thing: a tree, a pigeon, a weed in a crack. Write its autobiography in ten sentences. How did it get here, what has it seen, and what does it think of you?",
      why: "Paying close attention to something in nature is a mindfulness practice that pulls you out of your head and into the present moment.",
      starters: ["I was born…", "From here, I've watched…", "I've noticed that you…"],
    },
  },
  {
    theme: "The Self",
    thought: {
      text: "Each of your eyes has a blind spot, and your brain quietly paints over it so you never notice.",
      more: "Where the optic nerve leaves the eye there are no light-sensing cells at all. Your brain fills the gap with its best guess of what should be there. What you 'see' is partly a picture your brain has made for you.",
      ask: "What might your mind be quietly painting over in your own life?",
    },
    joke: {
      setup: "I told my therapist I keep thinking I'm a deck of cards.",
      punch: "She said she'd deal with me later.",
      bonus: "My mirror and I get along really well. We see eye to eye.",
    },
    fact: {
      text: "You can't tickle yourself, because your brain sees it coming.",
      more: "Research led by neuroscientist Sarah-Jayne Blakemore showed that the brain predicts the sensations caused by your own movements and turns them down. When someone else tickles you, the brain can't predict it in the same way, so it feels much stronger.",
    },
    prompt: {
      text: "Write about your day in the third person, as a gentle narrator who is completely on your side. ('She woke up tired, but…')",
      why: "Psychologist Ethan Kross's research on 'distanced self-talk' suggests that thinking about yourself in the third person can make difficult feelings easier to handle.",
      starters: ["She woke up…", "What nobody noticed was…", "By the evening, she…"],
    },
  },
  {
    theme: "Rest",
    thought: {
      text: "You'll spend about a third of your life asleep, and science still can't fully explain why we need it.",
      more: "There are strong theories: sleep helps store memories, repair the body and clear waste from the brain. Yet every night we switch off our consciousness, hallucinate vivid stories, and wake up treating it as completely normal.",
      ask: "If rest were part of your job description, what would you do differently this week?",
    },
    joke: {
      setup: "I'm so good at sleeping…",
      punch: "I can do it with my eyes closed.",
      bonus: "Why did the pillow need a holiday? Everyone kept dumping their thoughts on it at night.",
    },
    fact: {
      text: "Dolphins sleep with half their brain at a time.",
      more: "One half of a dolphin's brain sleeps while the other stays awake, often with one eye open. This lets it keep coming up to breathe and watch out for danger. Some birds can do this too.",
    },
    prompt: {
      text: "Describe your perfect day of doing absolutely nothing productive, hour by hour. Then circle one tiny piece of it you could actually have this weekend.",
      why: "Many of us feel guilty about resting. Planning rest on purpose gives you permission to have it, and makes it more likely to happen.",
      starters: ["I'd wake up at…", "In the afternoon, I'd…", "The piece I can have this weekend is…"],
    },
  },
  {
    theme: "Beginnings",
    thought: {
      text: "The universe began about 13.8 billion years ago, and we still don't know what, if anything, came before.",
      more: "Physics can describe the universe back to a tiny fraction of a second after the Big Bang, then the maths breaks down. Whether there even was a 'before' is still an open question. Everything, including you, started from a beginning that nobody fully understands.",
      ask: "What would you begin today if you didn't need to know how it ends?",
    },
    joke: {
      setup: "I made a New Year's resolution to stop procrastinating.",
      punch: "I'll start properly next year.",
      bonus: "I was going to start a diet, but I have too much on my plate.",
    },
    fact: {
      text: "The first person convicted of speeding was going about 8 miles per hour.",
      more: "In 1896, Walter Arnold was caught driving at around 8 mph in Kent, England, where the limit was 2 mph. A policeman chased him down on a bicycle, and he was fined one shilling.",
    },
    prompt: {
      text: "Think of three goals you have for yourself this week: one for your body, one for your mind and one just for joy. Write them down, then write a first step for each one that takes less than five minutes.",
      why: "Breaking goals into tiny first steps makes them far less overwhelming, and small wins build momentum.",
      starters: ["For my body, this week I want to…", "For my mind…", "Just for joy…"],
    },
  },
];
