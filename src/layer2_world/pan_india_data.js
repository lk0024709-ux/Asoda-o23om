/* ============================================================================
   Layer 2 — Streaming & World: Pan-India Open-World Registry (12 City Hubs)
   Defines the Fast-Travel Highway Graph, Landmarks, Interiors, Street Food,
   Festival Events, Conservation Lore, and Regional NPCs across India.
   ============================================================================ */

export const CITY_HUBS = {
  ratanpur: {
    id: "ratanpur",
    name: "Ratanpur",
    subtitle: "Heritage Crossroads · Tutorial Safehouse",
    region: "Rajasthan",
    regionColor: "#f97316",
    act: "Act 1",
    mapPos: { x: 33, y: 41 },
    highwayLinks: ["jaipur", "udaipur", "ahmedabad"],
    hasWater: false,
    raga: "bhupali",
    theme: {
      groundMat: "earthDesert",
      daySky: 0x82bde6,
      fogTint: 0xebd1a7,
      fogDensity: 0.0038
    },
    festival: {
      name: "Haveli Deepotsav",
      desc: "Warm brass diyas & marigold torans glow across Chandni Bazaar after sunset."
    },
    spawn: { x: 0, z: 24, yaw: Math.PI },
    foodStall: {
      name: "Raju's Chai Tapri",
      x: 16, z: 12,
      dish: "Masala Chai & Teekha Samosa",
      stamina: 45,
      spice: 38,
      quote: "Garama garam samosa! Arre Aarav babu, chai piyo aur Professor sahab ki khoj shuru karo!"
    },
    landmarks: [
      {
        id: "ratanpur_haveli",
        name: "Professor Vikram's Ancestral Haveli",
        type: "safehouse",
        x: 0, z: -2, radius: 13,
        photoPoints: 120,
        lore: "Built in 1894 from golden sandstone, this family haveli holds Grandfather Vikram's desk and the torn first page of the Mewar Bahi-Khata."
      },
      {
        id: "ganesh_mandir",
        name: "Shri Ganesh Mandir",
        type: "temple",
        x: -28, z: -18, radius: 12,
        photoPoints: 100,
        lore: "A beloved crossroads temple where traders paused to ring the brass ghanta before journeying between Mewar and Amber."
      },
      {
        id: "chandni_bazaar",
        name: "Chandni Bazaar & Gully Courtyard",
        type: "bazaar",
        x: 26, z: -14, radius: 12,
        photoPoints: 80,
        lore: "Narrow sandstone lanes filled with brassware, spices, block-printed fabrics, and friendly evening gully cricket."
      }
    ],
    friendlyHome: { x: 24, z: 22, owner: "Chachi Meera", quote: "Chappal bahar utaro beta! Welcome inside our humble pol home." },
    npcs: [
      {
        id: "raju_chai", name: "Raju (Chaiwala)", role: "vendor", x: 14, z: 14,
        greeting: "Arre Aarav bhai! Professor sahab ke bare mein kuch pata chala? Before he vanished, he was sketching Jantar Mantar sundials!"
      },
      {
        id: "pandit_sharma", name: "Pandit Sharma", role: "priest", x: -24, z: -10,
        greeting: "Namaste beta! Ring the temple bell and help me find our Missing Laddu prasad — the rooftop monkeys are up to mischief again!"
      },
      {
        id: "bazaar_kabir", name: "Kabir (Gully Captain)", role: "local", x: 26, z: -8,
        greeting: "Jugaad lagao, babu! Play a quick over of Gully Cricket with us and I'll tell you which Jaipur archivist met Professor Vikram."
      }
    ]
  },

  jaipur: {
    id: "jaipur",
    name: "Jaipur",
    subtitle: "The Pink City",
    region: "Rajasthan",
    regionColor: "#f97316",
    act: "Act 1",
    mapPos: { x: 38, y: 36 },
    highwayLinks: ["ratanpur", "udaipur", "gwalior"],
    hasWater: true,
    waterArea: { x: -46, z: 34, w: 46, d: 38, deepColor: 0x165b73, shallowColor: 0x3596a8 },
    raga: "yaman",
    theme: {
      groundMat: "earthDesert",
      daySky: 0x7cb8e4,
      fogTint: 0xf0c2a8,
      fogDensity: 0.0036
    },
    festival: {
      name: "Jaipur Diwali Illumination",
      desc: "Pink terracotta facades shimmer with golden Diwali diya chains & glowing lanterns."
    },
    spawn: { x: 0, z: 28, yaw: Math.PI },
    foodStall: {
      name: "Johari Bazaar Kachori Corner",
      x: 20, z: 18,
      dish: "Pyaaz Kachori & Mirchi Vada",
      stamina: 55,
      spice: 62,
      quote: "Asli Jaipur pyaaz kachori! Careful sahab, mirchi vada is full teekha!"
    },
    landmarks: [
      {
        id: "hawa_mahal",
        name: "Hawa Mahal (Palace of Winds)",
        type: "monument",
        x: 0, z: -22, radius: 14,
        photoPoints: 150,
        viewpoint: { x: 0, y: 15.5, z: -20 },
        lore: "Built in 1799 with 953 honeycomb jharokha lattice windows engineered to channel cool Venturi breezes through royal chambers."
      },
      {
        id: "jantar_mantar",
        name: "Jantar Mantar Observatory",
        type: "observatory",
        x: 34, z: -12, radius: 14,
        photoPoints: 160,
        lore: "UNESCO World Heritage astronomical observatory housing the monumental Samrat Yantra stone sundial — key to decoding the Bahi-Khata."
      },
      {
        id: "amber_fort",
        name: "Amber Fort & Sheesh Mahal",
        type: "fort",
        x: -36, z: -30, radius: 16,
        photoPoints: 180,
        lore: "Hilltop Rajput citadel rising above Maota Lake, famed for the glittering Sheesh Mahal (Hall of Mirrors) lit by a single candle."
      },
      {
        id: "jaipur_city_palace",
        name: "City Palace Archive (Chandra Mahal)",
        type: "archive",
        x: 32, z: 24, radius: 13,
        photoPoints: 140,
        lore: "Royal complex uniting Rajput and Mughal craft — Mubarak Mahal and Chandra Mahal guard rare Mewar trade manuscripts."
      },
      {
        id: "jal_mahal",
        name: "Jal Mahal (Water Palace)",
        type: "monument",
        x: -46, z: 34, radius: 15,
        photoPoints: 140,
        lore: "Five-story sandstone palace resting gracefully in Man Sagar Lake, with four submerged levels cooling the royal pavilion."
      },
      {
        id: "patrika_gate",
        name: "Patrika Gate & Albert Hall Promenade",
        type: "monument",
        x: -2, z: 48, radius: 12,
        photoPoints: 120,
        lore: "Vibrant nine-arched ceremonial gateway hand-painted with Rajasthan's historic forts, temples, and folk traditions."
      }
    ],
    friendlyHome: { x: 26, z: 4, owner: "Photographer Farhan", quote: "Shoes off on the charpai rug, Aarav! My darkroom has photos of Hawa Mahal." },
    npcs: [
      {
        id: "guide_dev", name: "Astronomer Devraj", role: "guide", x: 26, z: -10,
        greeting: "Welcome to Jantar Mantar! Notice how the Samrat Yantra shadow points directly to the royal archive? Professor Vikram decoded that!"
      },
      {
        id: "photo_farhan", name: "Farhan (Bazaar Photographer)", role: "ally", x: -12, z: -8,
        greeting: "Arre yaar! Press F for Photo Mode and capture Hawa Mahal or Patrika Gate — your Conservation Journal will expose those builders!"
      },
      {
        id: "rickshaw_banti", name: "Banti (Auto Ustad)", role: "race", x: 10, z: 24,
        greeting: "Marwari business, sahab — speed and precision! Hop in your Auto-Rickshaw (V) for the Pink City Rickshaw Time Trial!"
      }
    ]
  },

  udaipur: {
    id: "udaipur",
    name: "Udaipur",
    subtitle: "The City of Lakes",
    region: "Rajasthan",
    regionColor: "#f97316",
    act: "Act 2",
    mapPos: { x: 29, y: 46 },
    highwayLinks: ["ratanpur", "jaipur", "ahmedabad"],
    hasWater: true,
    waterArea: { x: -24, z: 0, w: 86, d: 112, deepColor: 0x0b526e, shallowColor: 0x1e9db8 },
    raga: "desh",
    theme: {
      groundMat: "earthDesert",
      daySky: 0x7abde8,
      fogTint: 0xe6cda6,
      fogDensity: 0.0034
    },
    festival: {
      name: "Gangaur Boat Procession",
      desc: "Dharohar folk lanterns glow along Bagore Ki Haveli while ceremonial boats drift on Lake Pichola."
    },
    spawn: { x: 26, z: 18, yaw: -Math.PI / 2 },
    foodStall: {
      name: "Ambrai Rooftop Rasoi",
      x: 24, z: 28,
      dish: "Dal Baati Churma & Gatte",
      stamina: 65,
      spice: 48,
      quote: "Khamma Ghani! Fresh ghee-dipped Dal Baati Churma overlooking Lake Pichola!"
    },
    landmarks: [
      {
        id: "udaipur_city_palace",
        name: "Udaipur City Palace & Crystal Gallery",
        type: "monument",
        x: 42, z: -6, radius: 16,
        photoPoints: 180,
        lore: "Towering Makrana marble and granite palace overlooking Lake Pichola, crowned with golden domes and lake-facing jharokhas."
      },
      {
        id: "jag_mandir",
        name: "Jag Mandir Island Palace",
        type: "island",
        x: -26, z: -18, radius: 14,
        photoPoints: 170,
        lore: "17th-century island sanctuary inside Lake Pichola where Boatman Shambhu discovered secret ledger carvings."
      },
      {
        id: "lake_palace",
        name: "Taj Lake Palace (Jag Niwas)",
        type: "island",
        x: -22, z: 24, radius: 13,
        photoPoints: 170,
        lore: "Luminous white marble pleasure palace floating like a lotus upon Lake Pichola's reflection."
      },
      {
        id: "jagdish_temple",
        name: "Jagdish Temple",
        type: "temple",
        x: 34, z: -34, radius: 12,
        photoPoints: 130,
        lore: "1651 Maru-Gurjara Vishnu temple featuring intricately sculpted pillars and evening brass aarti bells."
      },
      {
        id: "saheliyon_bari",
        name: "Saheliyon-ki-Bari Lotus Courtyard",
        type: "meditation",
        x: 38, z: 36, radius: 12,
        photoPoints: 120,
        lore: "Serene royal fountain garden with marble lotus pools — meditate here to restore full stamina."
      },
      {
        id: "sajjangarh",
        name: "Sajjangarh (Monsoon Palace) Ridge",
        type: "monument",
        x: -74, z: -4, radius: 16,
        photoPoints: 150,
        lore: "Hilltop marble palace crowning the Aravalli range to watch monsoon clouds sweep over Mewar."
      }
    ],
    friendlyHome: { x: 26, z: -22, owner: "Bagore Ki Haveli Artisan", quote: "Remove your shoes before stepping onto our Dharohar dance courtyard!" },
    npcs: [
      {
        id: "shambhu_boatman", name: "Shambhu (Lake Boatman)", role: "ally", x: 20, z: 6,
        greeting: "Khamma Ghani Aarav! Press V near the ghat to board my wooden boat — let's row to Jag Mandir before the conglomerate dredgers ruin the lakebed!"
      },
      {
        id: "conservation_meera", name: "Dr. Meera (Lake Activist)", role: "quest", x: 24, z: -12,
        greeting: "The builders are illegally excavating Pichola's historic stones! Help with our Lake Cleanup & rally the citizens!"
      }
    ]
  },

  ahmedabad: {
    id: "ahmedabad",
    name: "Ahmedabad",
    subtitle: "The Living Heritage City",
    region: "Gujarat",
    regionColor: "#eab308",
    act: "Act 2.5",
    mapPos: { x: 24, y: 54 },
    highwayLinks: ["udaipur", "ratanpur", "orchha"],
    hasWater: false,
    raga: "khamaj",
    theme: {
      groundMat: "earthDesert",
      daySky: 0x8cc2e6,
      fogTint: 0xeed9b7,
      fogDensity: 0.0038
    },
    festival: {
      name: "Manek Chowk Night Bazaar",
      desc: "By dusk, historic jewelry lanes transform into Gujarat's glowing open-air street food paradise."
    },
    spawn: { x: 0, z: 28, yaw: Math.PI },
    foodStall: {
      name: "Manek Chowk Heritage Thali",
      x: 18, z: 16,
      dish: "Royal Gujarati Thali & Fafda-Jalebi",
      stamina: 60,
      spice: 28,
      quote: "Kem cho, bhai! Sweet-savory Gujarati Thali — best fuel for walking the old-city pols!"
    },
    landmarks: [
      {
        id: "adalaj_vav",
        name: "Adalaj Stepwell (Vav)",
        type: "stepwell",
        x: 0, z: -18, radius: 15,
        photoPoints: 180,
        lore: "Five-story subterranean carved sandstone stepwell built in 1498 — cool microclimate chambers hide a Mewar-Gujarat merchant seal."
      },
      {
        id: "sidi_saiyyed",
        name: "Sidi Saiyyed Mosque (Tree of Life Jali)",
        type: "monument",
        x: -32, z: 6, radius: 12,
        photoPoints: 170,
        lore: "World-renowned intricate stone lattice (jali) carving depicting intertwining palm fronds — Ahmedabad's iconic emblem."
      },
      {
        id: "sabarmati_ashram",
        name: "Sabarmati Ashram",
        type: "meditation",
        x: 34, z: -8, radius: 13,
        photoPoints: 150,
        lore: "Peaceful whitewashed riverfront sanctuary of Mahatma Gandhi; quiet reflection restores clarity and stamina."
      },
      {
        id: "manek_chowk",
        name: "Manek Chowk & Historic Pols",
        type: "bazaar",
        x: 24, z: 22, radius: 12,
        photoPoints: 120,
        lore: "Centuries-old gated neighborhood clusters (pols) with carved wooden facades and vibrant night food stalls."
      }
    ],
    friendlyHome: { x: -24, z: 24, owner: "Seth Harshadbhai", quote: "Aavo, aavo! Leave your footwear at the wooden otla before entering our pol house." },
    npcs: [
      {
        id: "critic_kiran", name: "Kiranben (Food Critic)", role: "quest", x: 14, z: 18,
        greeting: "Kem cho! Walk the Old City Pols and taste Manek Chowk's finest Gujarati Thali — I know the merchant family from your grandfather's ledger!"
      },
      {
        id: "historian_patel", name: "Architect Jatin Patel", role: "ally", x: -6, z: -4,
        greeting: "Descend the Adalaj Stepwell (E) — the third pavilion holds the merchant trade map pointing east toward Kashi!"
      }
    ]
  },

  varanasi: {
    id: "varanasi",
    name: "Varanasi",
    subtitle: "The Spiritual Capital",
    region: "Uttar Pradesh",
    regionColor: "#a855f7",
    act: "Act 3",
    mapPos: { x: 64, y: 40 },
    highwayLinks: ["gwalior", "khajuraho"],
    hasWater: true,
    waterArea: { x: 34, z: 0, w: 64, d: 120, deepColor: 0x16536b, shallowColor: 0x3b8ea5 },
    raga: "bhairav",
    theme: {
      groundMat: "cobblestone",
      daySky: 0x99bfe0,
      fogTint: 0xecd0aa,
      fogDensity: 0.004
    },
    festival: {
      name: "Evening Dashashwamedh Ganga Aarti",
      desc: "Seven ceremonial multi-tier brass fire lamps illuminate the sacred ghats as glowing diyas float down the Ganges."
    },
    spawn: { x: -10, z: 18, yaw: Math.PI / 2 },
    foodStall: {
      name: "Famous Blue Lassi & Kachori Gali",
      x: -22, z: 14,
      dish: "Clay-Kulhad Pomegranate Blue Lassi",
      stamina: 65,
      spice: 10,
      quote: "Har Har Mahadev! Cool clay-cup lassi topped with rabri and saffron — zero teekha, pure bliss!"
    },
    landmarks: [
      {
        id: "dashashwamedh_ghat",
        name: "Dashashwamedh Ghat (Ganga Aarti)",
        type: "temple",
        x: 2, z: 0, radius: 14,
        photoPoints: 180,
        lore: "Ancient stepped riverfront where timeless fire ceremonies greet the sacred Ganges every twilight."
      },
      {
        id: "kashi_vishwanath",
        name: "Kashi Vishwanath Golden Shikhara",
        type: "archive",
        x: -26, z: -12, radius: 14,
        photoPoints: 190,
        lore: "Revered Shiva shrine crowned in gleaming gold — its historic library safeguards the third fragment of the Bahi-Khata."
      },
      {
        id: "assi_ghat",
        name: "Assi Ghat Morning Yoga Terrace",
        type: "meditation",
        x: 2, z: 36, radius: 12,
        photoPoints: 130,
        lore: "Southernmost sunrise ghat famous for dawn yoga, classical flute recitals, and drifting river boats."
      },
      {
        id: "sarnath_stupa",
        name: "Sarnath Dhamek Stupa",
        type: "monument",
        x: -36, z: -40, radius: 14,
        photoPoints: 170,
        lore: "Massive 5th-century cylindrical brick-and-stone Buddhist stupa marking the site of Buddha's first sermon."
      }
    ],
    friendlyHome: { x: -24, z: 28, owner: "Banarasi Silk Weaver", quote: "Namaskar! Please slip off your shoes before viewing our handloom silk." },
    npcs: [
      {
        id: "priest_tripathi", name: "Acharya Tripathi", role: "ally", x: -16, z: -6,
        greeting: "Har Har Mahadev, Aarav! Help us complete the Ghat Cleanup on Dashashwamedh and I shall open the Kashi archive for you."
      },
      {
        id: "boatman_raghu", name: "Mallaha Raghu", role: "quest", x: 6, z: 8,
        greeting: "Board the river boat (V) for Boatman's Request — glide past the Aarti flames on Ma Ganga!"
      }
    ]
  },

  khajuraho: {
    id: "khajuraho",
    name: "Khajuraho",
    subtitle: "UNESCO Chandela Temple Group",
    region: "Madhya Pradesh",
    regionColor: "#ef4444",
    act: "Act 4",
    mapPos: { x: 54, y: 45 },
    highwayLinks: ["varanasi", "orchha", "gwalior"],
    hasWater: false,
    raga: "yaman",
    theme: {
      groundMat: "grassGarden",
      daySky: 0x80bce4,
      fogTint: 0xe6cda6,
      fogDensity: 0.0036
    },
    festival: {
      name: "Khajuraho Light & Sound Show",
      desc: "Vibrant amber, magenta, and sapphire architectural spotlights dance across soaring Chandela temple spires at dusk."
    },
    spawn: { x: 0, z: 32, yaw: Math.PI },
    foodStall: {
      name: "Bundela Courtyard Dhaba",
      x: 24, z: 22,
      dish: "Indori Poha & Jalebi",
      stamina: 50,
      spice: 30,
      quote: "Namaste! Warm Bundelkhandi snacks before the evening Light & Sound Show!"
    },
    landmarks: [
      {
        id: "kandariya_mahadeva",
        name: "Kandariya Mahadeva Nagara Temple",
        type: "temple",
        x: 0, z: -12, radius: 16,
        photoPoints: 190,
        lore: "Masterpiece of Chandela Nagara architecture featuring clustered soaring spires symbolizing Mount Kailash."
      },
      {
        id: "jain_group",
        name: "Eastern Jain Parshvanatha Shrine",
        type: "monument",
        x: -32, z: -6, radius: 13,
        photoPoints: 150,
        lore: "Finely carved sandstone Jain sanctuary preserving ancient merchant guild patronage inscriptions."
      }
    ],
    friendlyHome: { x: 28, z: 8, owner: "Sculptor Madhav", quote: "Chappal utariye! Come see my sandstone chisel sketches." },
    npcs: [
      {
        id: "curator_ananya", name: "Curator Ananya", role: "ally", x: 10, z: 10,
        greeting: "The Chandela guild marks on Kandariya Mahadeva align with Orchha's Jahangir Mahal! Inspect the plinth (E) to triangulate the ledger route."
      }
    ]
  },

  orchha: {
    id: "orchha",
    name: "Orchha",
    subtitle: "Riverside Bundela Forts on the Betwa",
    region: "Madhya Pradesh",
    regionColor: "#ef4444",
    act: "Act 4",
    mapPos: { x: 48, y: 44 },
    highwayLinks: ["khajuraho", "gwalior", "ahmedabad", "hampi"],
    hasWater: true,
    waterArea: { x: -34, z: 0, w: 54, d: 112, deepColor: 0x165e68, shallowColor: 0x3ba09d },
    raga: "desh",
    theme: {
      groundMat: "earthDesert",
      daySky: 0x82bde2,
      fogTint: 0xe6cda6,
      fogDensity: 0.0036
    },
    festival: {
      name: "Betwa Cenotaph Lanterns",
      desc: "Golden lanterns reflect off the tranquil Betwa waters beneath Orchha's royal chhatris."
    },
    spawn: { x: 14, z: 24, yaw: Math.PI },
    foodStall: {
      name: "Betwa Riverside Tapri",
      x: 18, z: 16,
      dish: "Bundeli Bhutte Ka Kees & Chai",
      stamina: 50,
      spice: 35,
      quote: "Garama garam corn kees by the Betwa river — fresh from the fort market!"
    },
    landmarks: [
      {
        id: "jahangir_mahal",
        name: "Jahangir Mahal",
        type: "fort",
        x: 24, z: -14, radius: 16,
        photoPoints: 180,
        lore: "Symmetric Bundela Rajput palace crowned with eight sandstone chhatris overlooking the Betwa river valley."
      },
      {
        id: "ram_raja_temple",
        name: "Ram Raja Temple",
        type: "temple",
        x: -2, z: -26, radius: 13,
        photoPoints: 150,
        lore: "Unique palace-temple where Lord Rama is revered as King, famed for its glowing yellow-and-pink spires."
      }
    ],
    friendlyHome: { x: 22, z: 24, owner: "Bundela Chronicler", quote: "Welcome inside — kindly slip off your shoes at the doorway." },
    npcs: [
      {
        id: "bundela_elder", name: "Thakur Raghubir", role: "ally", x: 10, z: -4,
        greeting: "Bundela and Mewar kings protected the hidden Deccan trade stepwell! Head south via our highway toward Hampi to stop the excavation!"
      }
    ]
  },

  gwalior: {
    id: "gwalior",
    name: "Gwalior",
    subtitle: "Blue-Tiled Citadel & Birthplace of Tansen",
    region: "Madhya Pradesh",
    regionColor: "#ef4444",
    act: "Act 4",
    mapPos: { x: 46, y: 38 },
    highwayLinks: ["jaipur", "varanasi", "orchha", "khajuraho"],
    hasWater: false,
    raga: "malkauns",
    theme: {
      groundMat: "earthDesert",
      daySky: 0x7cb6e0,
      fogTint: 0xe6caa0,
      fogDensity: 0.0038
    },
    festival: {
      name: "Tansen Music Festival",
      desc: "Classical sitar and vocal ragas resonate from the illuminated Tansen Pavilion beneath Man Mandir's blue tiles."
    },
    spawn: { x: 0, z: 30, yaw: Math.PI },
    foodStall: {
      name: "Sarafa Bedai & Gajak Stall",
      x: 20, z: 18,
      dish: "Crispy Bedai & Morena Gajak",
      stamina: 55,
      spice: 42,
      quote: "Gwalior ki shaan! Crunchy bedai and sweet sesame gajak for the fort climb!"
    },
    landmarks: [
      {
        id: "man_mandir",
        name: "Gwalior Fort & Man Mandir Palace",
        type: "fort",
        x: 0, z: -18, radius: 18,
        photoPoints: 190,
        lore: "Celebrated as 'the pearl among fortresses in Hind', adorned with brilliant turquoise-blue, green, and gold ceramic tilework."
      },
      {
        id: "tansen_pavilion",
        name: "Tansen Music Festival Pavilion",
        type: "meditation",
        x: -30, z: 10, radius: 12,
        photoPoints: 150,
        lore: "Tribute to Miyan Tansen, legend of Hindustani classical music — pausing here restores spirit and stamina."
      }
    ],
    friendlyHome: { x: 26, z: 6, owner: "Ustad Iqbal (Sitarist)", quote: "Aadaab! Leave shoes at the door and listen to Raga Darbari." },
    npcs: [
      {
        id: "ustad_iqbal", name: "Ustad Iqbal", role: "ally", x: -22, z: 12,
        greeting: "Sangeet connects all of Bharat, Aarav! My musicians will testify beside you at the Southern Public Heritage Hearing."
      }
    ]
  },

  hampi: {
    id: "hampi",
    name: "Hampi",
    subtitle: "Vijayanagara Boulders & Stone Chariot",
    region: "South India",
    regionColor: "#22c55e",
    act: "Act 5",
    mapPos: { x: 38, y: 74 },
    highwayLinks: ["orchha", "mysore", "madurai"],
    hasWater: false,
    raga: "bhupali",
    theme: {
      groundMat: "earthDesert",
      daySky: 0x7cb8e4,
      fogTint: 0xebcfa2,
      fogDensity: 0.0036
    },
    festival: {
      name: "Hampi Utsav Heritage Glow",
      desc: "Golden lamps bathe the granite boulders and Vittala Stone Chariot in warm Vijayanagara splendor."
    },
    spawn: { x: 0, z: 30, yaw: Math.PI },
    foodStall: {
      name: "Hampi Bazaar Banana-Leaf Stall",
      x: 20, z: 20,
      dish: "Bisi Bele Bath & Filter Kaapi",
      stamina: 60,
      spice: 52,
      quote: "Namaskara! Steaming Karnataka Bisi Bele Bath and frothy brass-tumbler Filter Kaapi!"
    },
    landmarks: [
      {
        id: "stone_chariot",
        name: "Vittala Temple & Iconic Stone Chariot",
        type: "monument",
        x: 0, z: -14, radius: 15,
        photoPoints: 220,
        lore: "16th-century granite Garuda shrine sculpted as a ceremonial temple chariot with carved stone wheels and musical pillars."
      },
      {
        id: "virupaksha_temple",
        name: "Virupaksha Temple Gopuram",
        type: "temple",
        x: -34, z: -18, radius: 15,
        photoPoints: 180,
        lore: "Unbroken sacred temple active since the 7th century, towering over the ancient pillared Hampi Bazaar."
      },
      {
        id: "hampi_excavation_site",
        name: "Conglomerate Illegal Dig Site",
        type: "climax",
        x: 34, z: -16, radius: 14,
        photoPoints: 200,
        lore: "The hidden Deccan stepwell documented in Professor Vikram's Bahi-Khata — threatened by illegal machinery until Aarav documents the proof!"
      }
    ],
    friendlyHome: { x: -24, z: 20, owner: "Archaeologist Kavya", quote: "Namaskara! Slip off your sandals and examine our Vijayanagara rubbings." },
    npcs: [
      {
        id: "kavya_hampi", name: "Dr. Kavya (Hampi Conservator)", role: "ally", x: 24, z: -8,
        greeting: "Namaskara Aarav! Photograph the illegal excavation site (F) and inspect the Bahi-Khata marker (E) — then bring your evidence to Madurai or Mysore for the Public Hearing!"
      }
    ]
  },

  madurai: {
    id: "madurai",
    name: "Madurai",
    subtitle: "Temple City of 14 Colorful Gopurams",
    region: "South India",
    regionColor: "#22c55e",
    act: "Act 5 Climax",
    mapPos: { x: 46, y: 89 },
    highwayLinks: ["hampi", "mysore", "kochi"],
    hasWater: false,
    raga: "khamaj",
    theme: {
      groundMat: "cobblestone",
      daySky: 0x76b8e6,
      fogTint: 0xeed5b5,
      fogDensity: 0.0035
    },
    festival: {
      name: "Chithirai Gopuram Illumination",
      desc: "Meenakshi's vivid sculpted towers glow with brass lamps and jasmine garlands."
    },
    spawn: { x: 0, z: 32, yaw: Math.PI },
    foodStall: {
      name: "Madurai Jigarthanda & Idli Shop",
      x: 22, z: 18,
      dish: "Chilled Madurai Jigarthanda & Ghee Dosa",
      stamina: 65,
      spice: 34,
      quote: "Vanakkam! Famous Madurai Jigarthanda — cools down any spice heat immediately!"
    },
    landmarks: [
      {
        id: "meenakshi_temple",
        name: "Meenakshi Amman Temple (Colorful Gopurams)",
        type: "temple",
        x: 0, z: -18, radius: 18,
        photoPoints: 220,
        lore: "Crowned by 14 multi-colored sculpted Dravidian gopuram gateways celebrating Tamil art, devotion, and heritage."
      },
      {
        id: "nayakkar_palace",
        name: "Thirumalai Nayakkar Palace (Public Hearing Hall)",
        type: "hearing",
        x: 34, z: 0, radius: 15,
        photoPoints: 180,
        lore: "Monumental 17th-century Indo-Saracenic colonnaded courtyard — venue of the Act 5 Public Heritage Conservation Hearing!"
      }
    ],
    friendlyHome: { x: -28, z: 18, owner: "Tamil Poet Sundaram", quote: "Vanakkam! Please leave footwear outside our jasmine-scented courtyard." },
    npcs: [
      {
        id: "judge_lakshmi", name: "Commissioner Lakshmi (Heritage Tribunal)", role: "hearing", x: 26, z: 4,
        greeting: "Vanakkam Aarav! Whenever you have gathered your evidence and allies from across Bharat, interact with the Hearing Podium (E) to present Professor Vikram's Bahi-Khata!"
      }
    ]
  },

  mysore: {
    id: "mysore",
    name: "Mysore",
    subtitle: "The Illuminated Royal City",
    region: "South India",
    regionColor: "#22c55e",
    act: "Act 5 Climax",
    mapPos: { x: 39, y: 84 },
    highwayLinks: ["hampi", "madurai", "kochi"],
    hasWater: false,
    raga: "yaman",
    theme: {
      groundMat: "grassGarden",
      daySky: 0x7cbbe6,
      fogTint: 0xe6d4b5,
      fogDensity: 0.0035
    },
    festival: {
      name: "Mysore Palace 100,000-Bulb Illumination",
      desc: "Press T to switch to Night and watch Amba Vilas Palace ignite in dazzling golden festival bloom!"
    },
    spawn: { x: 0, z: 34, yaw: Math.PI },
    foodStall: {
      name: "Devaraja Market Mysore Pak Stall",
      x: 24, z: 22,
      dish: "Melt-in-Mouth Ghee Mysore Pak & Coffee",
      stamina: 65,
      spice: 12,
      quote: "Namaskara! Royal Mysore Pak warm from the kadhai — pure energy for Chamundi Hills!"
    },
    landmarks: [
      {
        id: "mysore_palace",
        name: "Mysore Palace (Amba Vilas)",
        type: "hearing",
        x: 0, z: -18, radius: 18,
        photoPoints: 220,
        lore: "Resplendent Indo-Saracenic royal palace crowned by pink domes and glowing golden night illumination — alternate venue for the Public Hearing."
      },
      {
        id: "chamundi_hills",
        name: "Chamundi Hills Temple Steps",
        type: "temple",
        x: -38, z: -20, radius: 15,
        photoPoints: 160,
        lore: "Sacred granite hilltop shrine overlooking Mysore; climb its storied steps for panoramic views and Samman."
      }
    ],
    friendlyHome: { x: 30, z: -4, owner: "Sandalwood Artisan Rao", quote: "Namaskara! Slip off your shoes and smell fresh Mysore sandalwood." },
    npcs: [
      {
        id: "curator_srinivas", name: "Director Srinivas", role: "hearing", x: 12, z: 4,
        greeting: "Namaskara Aarav! Press T for Night to see Mysore Palace glow, or step up to the Palace Hearing Podium (E) when ready to defend Bharat's heritage!"
      }
    ]
  },

  kochi: {
    id: "kochi",
    name: "Kochi",
    subtitle: "Backwaters & Chinese Fishing Nets",
    region: "South India",
    regionColor: "#22c55e",
    act: "Act 5",
    mapPos: { x: 38, y: 90 },
    highwayLinks: ["mysore", "madurai"],
    hasWater: true,
    waterArea: { x: -34, z: 0, w: 68, d: 120, deepColor: 0x0b5d56, shallowColor: 0x269b8a },
    raga: "desh",
    theme: {
      groundMat: "grassGarden",
      daySky: 0x7ac3e2,
      fogTint: 0xd9e8d8,
      fogDensity: 0.0036
    },
    festival: {
      name: "Fort Kochi Backwater Lanterns",
      desc: "Warm coastal lanterns reflect on emerald Kerala backwaters beneath the iconic cantilevered fishing nets."
    },
    spawn: { x: 16, z: 20, yaw: -Math.PI / 2 },
    foodStall: {
      name: "Fort Kochi Spice & Appam Cafe",
      x: 22, z: 16,
      dish: "Lacy Appam, Coconut Stew & Sulaimani Tea",
      stamina: 65,
      spice: 40,
      quote: "Namaskaram! Fresh Kerala appam and aromatic spiced Sulaimani tea by the backwaters!"
    },
    landmarks: [
      {
        id: "chinese_nets",
        name: "Fort Kochi Chinese Fishing Nets (Cheena Vala)",
        type: "monument",
        x: 2, z: -6, radius: 14,
        photoPoints: 180,
        lore: "14th-century cantilevered teakwood shore-operated fishing nets silhouetted against Malabar sunsets."
      },
      {
        id: "mattancherry_palace",
        name: "Mattancherry Palace & Jew Town Synagogue",
        type: "monument",
        x: 32, z: -18, radius: 15,
        photoPoints: 180,
        lore: "Historic Kochi maritime heritage linking Kerala murals, spice merchants, and the 1568 Paradesi Synagogue."
      }
    ],
    friendlyHome: { x: 26, z: 28, owner: "Captain Mathew", quote: "Namaskaram! Shoes off on the veranda — welcome to Fort Kochi!" },
    npcs: [
      {
        id: "fisherman_joseph", name: "Joseph (Backwater Captain)", role: "ally", x: 10, z: 4,
        greeting: "Namaskaram Aarav! Hop into our Kerala kettuvallam boat (V) to explore the backwaters — Kochi stands with you at the Heritage Hearing!"
      }
    ]
  }
};

export const CITY_ORDER = [
  "ratanpur",
  "jaipur",
  "udaipur",
  "ahmedabad",
  "varanasi",
  "khajuraho",
  "orchha",
  "gwalior",
  "hampi",
  "madurai",
  "mysore",
  "kochi"
];
