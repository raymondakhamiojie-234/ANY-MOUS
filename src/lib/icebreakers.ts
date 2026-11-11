export const ICEBREAKERS = [
  "What's your honest first impression of me? 👀",
  "What's one thing you like about me but never said out loud? ✨",
  "Rate my overall vibe from 1 to 10 🔥",
  "What song immediately reminds you of me? 🎵",
  "If we were stranded on a desert island, would we survive? 🏝️",
  "What is a secret talent or quirk you have that nobody knows? 🤫",
  "Do you have a secret crush on anyone right now? 💘",
  "What's the funniest or most memorable moment we ever had? 😂",
  "Describe me using only 3 emojis! 🎭",
  "What advice do you secretly think I need to hear? 💡",
  "What fictional character do I remind you of? 🎬",
  "Drop a completely anonymous confession, no judgment! 🙈",
  "What's one thing on your bucket list you're determined to do this year? ✈️",
  "Are you more chaotic good or lawful evil? 😈",
  "If you could ask me anything without me knowing who asked, what is it? 🔮",
  "What's the most embarrassing song in your playlist? 🎧",
  "Would we be friends if we met 5 years ago? 🤔",
  "What was your highlight of this past week? 🌟",
  "Give me an unpopular opinion you stand by 100%! 🍕",
  "What outfit or look of mine was your favorite? 👗"
];

export function getRandomIcebreaker(exclude?: string): string {
  const pool = exclude ? ICEBREAKERS.filter((q) => q !== exclude) : ICEBREAKERS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
