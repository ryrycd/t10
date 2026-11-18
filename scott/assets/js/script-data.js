// Single source of truth for the spoken script (AJ reads it). v4, Nov 18: rebuilt on AJ's own draft.
// Each entry is one click of the deck: the presenter clicks Next, the deck plays that beat (matched by id),
// and the script page highlights this text. Deleting an entry here removes that click from the deck too.
// Sources: ScottHarris/research/*.md, AJ's Nov 5 call with Scott, and the Schneider/PTC news (Oct 2026).
window.SCRIPT = [
  { id: "standby", cue: "Standby: the empty SolidWorks window stays up while the room settles. Then click and start.", say: "" },
  { id: "name", say: "Scott Harris started out as a mechanical engineer." },
  { id: "graph", say: "He designed jet engine parts at Pratt & Whitney, by hand, on graph paper." },
  { id: "clicked", say: "Then he spent ten years at Computervision, building 3D design software. He kind of took over the job of the guy who left to start PTC." },
  { id: "pc", say: "There he saw how slow the gorillas of the industry were to move to ordinary PCs. So he and a few colleagues left and started SolidWorks, the monkey of the industry." },
  { id: "sold", say: "Three years later, Dassault bought it for $310 million." },
  { id: "blobs", say: "He also brought 3D design to kids with Cosmic Blobs, a game he created to get the next generation up to speed." },
  { id: "onshape", say: "In 2012, he regrouped with the original SolidWorks team. Design software still sucked, so they built Onshape." },
  { id: "collab", say: "It completely changed how engineers work together. In 2019, that same PTC bought it for $470 million." },
  { id: "schneider", cue: "Lean on “billion.”", say: "And last month, Schneider Electric agreed to buy PTC, Onshape and all, for $22.6 billion." },
  { id: "dogs", say: "But Scott couldn’t have done any of it without his two golden retrievers, Pico and Echo. He even prototyped a dog-door latch that opens for Pico’s Bluetooth collar." },
  { id: "pico", say: "When I asked him what he wanted to bring to Babson, he said he and Pico had a long discussion about it." },
  { id: "welcome", cue: "Click, then say it. Start clapping yourself; the room will follow.", say: "Please welcome Scott Harris!" },
];
