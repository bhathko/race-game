export const CHARACTERS = {
  bear: {
    name: "Bear",
    idle: { path: "assets/characters/bear/bear-idle.png", frames: 6 },
    walk: { path: "assets/characters/bear/bear-walk.png", frames: 8 },
  },
  cat: {
    name: "Cat",
    idle: { path: "assets/characters/cat/cat-idle.png", frames: 6 },
    walk: { path: "assets/characters/cat/cat-walk.png", frames: 8 },
  },
  fox: {
    name: "Fox",
    idle: { path: "assets/characters/fox/fox-idle.png", frames: 6 },
    walk: { path: "assets/characters/fox/fox-walk.png", frames: 8 },
  },
  mouse: {
    name: "Mouse",
    idle: { path: "assets/characters/mouse/mouse-idle.png", frames: 6 },
    walk: { path: "assets/characters/mouse/mouse-walk.png", frames: 8 },
  },
  panda: {
    name: "Panda",
    idle: { path: "assets/characters/panda/panda-idle.png", frames: 6 },
    walk: { path: "assets/characters/panda/panda-walk.png", frames: 8 },
  },
  rabbit: {
    name: "Rabbit",
    idle: { path: "assets/characters/rabbit/rabbit-idle.png", frames: 6 },
    walk: { path: "assets/characters/rabbit/rabbit-walk.png", frames: 8 },
  },
  sheep: {
    name: "Sheep",
    idle: { path: "assets/characters/sheep/sheep-idle.png", frames: 6 },
    walk: { path: "assets/characters/sheep/sheep-walk.png", frames: 8 },
  },
  turtle: {
    name: "Turtle",
    idle: { path: "assets/characters/turtle/turtle-idle.png", frames: 6 },
    walk: { path: "assets/characters/turtle/turtle-walk.png", frames: 8 },
  },
} as const;

export const ITEMS = {
  tree: { path: "assets/item/tree-idle.png", cols: 12, rows: 4, width: 48, height: 48 },
  trophy: { path: "assets/item/gold-trophy.png" },
  ground: { path: "assets/item/ground.png", unit: 16 },
  grass: { path: "assets/item/grass.png", unit: 16 },
  sound: { path: "assets/sound/sound.mp3" },
} as const;
