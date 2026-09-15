import { Vec3 } from '../rendering/Math3D.js';
export const palette = { cream: '#fff1de', paper: '#fffdf7', sage: '#76aa83', sageDark: '#416d59', sageLight: '#b9d6ad', wood: '#c58a5b', woodDark: '#895c43', peach: '#f0a17b', blue: '#78b5c0', gold: '#e6c65f', terracotta: '#d97961', ink: '#294f43', court: '#72a47f', line: '#fff9ed', sky: '#faf4e8', pink: '#eca7aa', mint: '#a8d5b3' };
export const destinations = {
    entrance: new Vec3(-11.9, 0, 8.8), reception: new Vec3(-9, 0, 3.5), cafe: new Vec3(-9, 0, -4.5), cafeTable: new Vec3(-6.5, 0, -4.5), courtSouth: new Vec3(1.0, 0, 5.0), courtNorth: new Vec3(1.0, 0, -5.0), courtBench: new Vec3(6.3, 0, 2.7), lounge: new Vec3(8.5, 0, 4), proshop: new Vec3(9, 0, -6), bonsai: new Vec3(10, 0, 2.5), water: new Vec3(-5.5, 0, 5.8), stringing: new Vec3(9.2, 0, -2.3), training: new Vec3(-9.5, 0, .2), clubBoard: new Vec3(3.0, 0, -7.3),
    warmup: new Vec3(-9.3, 0, 1.6), westWater: new Vec3(-10.2, 0, -2.2), lobbySeat: new Vec3(-11.9, 0, 6.9), gearWall: new Vec3(9.5, 0, .3), spectatorBench: new Vec3(1.0, 0, 7.5), equipmentTrolley: new Vec3(-1.4, 0, -7.5)
};
export const memberData = [
    { id: 'coach', name: 'Coach Contessa', role: 'Head coach', shirt: '#75a985', skin: '#dca884', hair: '#4f3a31', accent: '#fff0d7', eye: '#506c61', hairStyle: 'bun', presentation: 'feminine', outfit: 'skort', shoe: '#fff8ed', playStyle: 'calm technician', goal: 'Help everyone leave with one useful cue', quirk: 'Never rushes a correction', likes: ['quiet mornings', 'clean footwork', 'sencha'] },
    { id: 'mika', name: 'Lucresia', role: 'Member', shirt: '#f0a078', skin: '#cf9270', hair: '#473029', accent: '#ffe0bc', eye: '#5b6658', hairStyle: 'ponytail', presentation: 'feminine', outfit: 'skirt', shoe: '#fffaf0', playStyle: 'all-court learner', goal: 'Prepare earlier on the forehand', quirk: 'Counts clean rallies under her breath', likes: ['crosscourt rhythm', 'matcha', 'sunny windows'] },
    { id: 'leo', name: 'Leo', role: 'Member', shirt: '#6faec0', skin: '#dfb38d', hair: '#40372f', accent: '#f4e9d8', eye: '#405d63', hairStyle: 'crop', presentation: 'masculine', outfit: 'shorts', shoe: '#f7fbf5', playStyle: 'counterpuncher', goal: 'Recover faster after wide balls', quirk: 'Tests every grip in the pro shop', likes: ['long rallies', 'fresh overgrips', 'bonsai'] },
    { id: 'nia', name: 'Barbara', role: 'Club host', shirt: '#d77f76', skin: '#a96d55', hair: '#2f2726', accent: '#ffd9d3', eye: '#4a5f50', hairStyle: 'bob', presentation: 'feminine', outfit: 'host', shoe: '#fff2e7', playStyle: 'social doubles', goal: 'Keep the morning calm without making it quiet', quirk: 'Remembers everyone’s usual drink', likes: ['people-watching', 'organization', 'oat matcha'] }
];
export const schedules = {
    coach: [
        { start: 0, destination: 'cafe', activity: 'Opening tea', animation: 'drink' },
        { start: 495, destination: 'clubBoard', activity: 'Reading the court sheet', animation: 'watch' },
        { start: 515, destination: 'courtNorth', activity: 'Setting the first basket', animation: 'coachFeed' },
        { start: 540, destination: 'courtNorth', activity: 'Coaching Lucresia', animation: 'coachFeed' },
        { start: 610, destination: 'westWater', activity: 'Quick water break', animation: 'drink' },
        { start: 625, destination: 'courtBench', activity: 'Watching Leo warm up', animation: 'watch' },
        { start: 680, destination: 'cafeTable', activity: 'Writing one-line lesson notes', animation: 'sit' },
        { start: 725, destination: 'equipmentTrolley', activity: 'Restocking the trolley', animation: 'idle' },
        { start: 780, destination: 'courtNorth', activity: 'Afternoon block', animation: 'coachFeed' },
        { start: 865, destination: 'spectatorBench', activity: 'Watching the social court', animation: 'sit' },
        { start: 925, destination: 'warmup', activity: 'Demonstrating a split step', animation: 'stretch' },
        { start: 1000, destination: 'courtNorth', activity: 'Evening lesson', animation: 'coachFeed' },
        { start: 1090, destination: 'cafeTable', activity: 'Last tea of the day', animation: 'sit' },
        { start: 1180, destination: 'clubBoard', activity: "Writing tomorrow's sheet", animation: 'watch' },
        { start: 1265, destination: 'entrance', activity: 'Leaving late, as usual', animation: 'idle' }
    ],
    mika: [
        { start: 0, destination: 'entrance', activity: 'On the way in', animation: 'idle' },
        { start: 505, destination: 'reception', activity: 'Checking in', animation: 'talk' },
        { start: 515, destination: 'training', activity: 'Warming up', animation: 'stretch' },
        { start: 535, destination: 'courtSouth', activity: 'Working on forehand timing', animation: 'watch' },
        { start: 610, destination: 'cafe', activity: 'Post-session matcha', animation: 'drink' },
        { start: 645, destination: 'lounge', activity: 'Watching the next session', animation: 'sit' },
        { start: 720, destination: 'warmup', activity: 'Stretching out the session', animation: 'stretch' },
        { start: 790, destination: 'courtSouth', activity: 'A few extra reps', animation: 'watch' },
        { start: 870, destination: 'westWater', activity: 'Water and a towel', animation: 'drink' },
        { start: 905, destination: 'spectatorBench', activity: 'Watching Leo serve', animation: 'sit' },
        { start: 980, destination: 'courtSouth', activity: 'Evening hit', animation: 'watch' },
        { start: 1060, destination: 'lobbySeat', activity: 'Sitting with her shoes off', animation: 'sit' },
        { start: 1140, destination: 'cafe', activity: 'One last cup', animation: 'drink' },
        { start: 1225, destination: 'entrance', activity: 'Heading home', animation: 'idle' }
    ],
    leo: [
        { start: 0, destination: 'lounge', activity: 'Taking a recovery break', animation: 'sit' },
        { start: 520, destination: 'proshop', activity: 'Comparing fresh grips', animation: 'idle' },
        { start: 565, destination: 'courtBench', activity: "Watching Lucresia's lesson", animation: 'watch' },
        { start: 625, destination: 'courtSouth', activity: 'Hitting a few easy balls', animation: 'watch' },
        { start: 700, destination: 'bonsai', activity: 'Checking the new bonsai growth', animation: 'watch' },
        { start: 748, destination: 'gearWall', activity: 'Trying on shoes he does not need', animation: 'idle' },
        { start: 820, destination: 'courtNorth', activity: 'Serve practice', animation: 'watch' },
        { start: 890, destination: 'westWater', activity: 'Cooling down', animation: 'drink' },
        { start: 930, destination: 'lounge', activity: 'Recovering with the ceiling fan', animation: 'sit' },
        { start: 1010, destination: 'courtNorth', activity: 'Evening hit', animation: 'watch' },
        { start: 1090, destination: 'gearWall', activity: 'Back at the shoe shelf', animation: 'idle' },
        { start: 1165, destination: 'spectatorBench', activity: 'Watching the last rally', animation: 'sit' },
        { start: 1245, destination: 'entrance', activity: 'Out the door', animation: 'idle' }
    ],
    nia: [
        { start: 0, destination: 'reception', activity: 'Checking members in', animation: 'talk' },
        { start: 535, destination: 'cafe', activity: 'Preparing the usual orders', animation: 'drink' },
        { start: 590, destination: 'reception', activity: 'Reviewing the next booking', animation: 'talk' },
        { start: 650, destination: 'lounge', activity: 'Straightening the lounge', animation: 'idle' },
        { start: 715, destination: 'cafeTable', activity: 'Taking five with the regulars', animation: 'sit' },
        { start: 762, destination: 'lobbySeat', activity: 'Greeting the afternoon arrivals', animation: 'talk' },
        { start: 830, destination: 'cafe', activity: 'The afternoon rush, such as it is', animation: 'drink' },
        { start: 900, destination: 'reception', activity: "Booking tomorrow's courts", animation: 'talk' },
        { start: 965, destination: 'lobbySeat', activity: 'Sitting down for once', animation: 'sit' },
        { start: 1040, destination: 'cafe', activity: 'Evening orders', animation: 'drink' },
        { start: 1125, destination: 'spectatorBench', activity: 'Watching the evening hit', animation: 'sit' },
        { start: 1205, destination: 'lounge', activity: 'Tidying before close', animation: 'idle' },
        { start: 1275, destination: 'reception', activity: 'Locking up', animation: 'talk' }
    ]
};
export const drills = {
    spacing: { name: 'Contact spacing', fit: 'spacing', progress: 3, description: 'Give the ball room beside you. Set the feet before reaching.' },
    dropFeed: { name: 'Drop-feed timing', fit: 'forehand timing', progress: 5, description: 'Strip away movement. Feel the turn happen before the bounce.' },
    crosscourt: { name: 'Crosscourt rhythm', fit: 'rally consistency', progress: 3, description: 'Build an unhurried ball. Recover to a visible target every time.' },
    movement: { name: 'Movement + recovery', fit: 'footwork', progress: 3, description: 'Two-ball pattern. Wide first ball, calm recovery, neutral second ball.' },
    shadowPrep: { name: 'Shadow preparation', fit: 'forehand timing', progress: 4, description: 'No ball at first. Split, turn, set, then add a gentle feed.' }
};
export const conversationLines = {
    coach: ['“The good swing is usually the one you have time to feel.”', '“One cue at a time. The body remembers clarity.”', '“Watch the feet before you watch the racket.”'],
    mika: ['“I can feel when I turn early. The whole point feels slower.”', '“Can we keep the next block simple? I want the rhythm.”', '“That last rally felt different. In a good way.”'],
    leo: ['“I keep buying grips when what I need is recovery footwork.”', '“Ten clean balls is more satisfying than one ridiculous winner.”', '“The lounge might be my second home at this point.”'],
    nia: ['“A club feels alive when people have a reason to linger.”', '“Contessa pretends not to care about matcha. I know the order.”', '“I left the 11:30 court open. It felt like someone would want it.”']
};
export const relationshipTiers = [
    { min: 0, label: 'New face' }, { min: 20, label: 'Familiar' }, { min: 40, label: 'Club regular' }, { min: 60, label: 'Club friend' }, { min: 80, label: 'Close friend' }, { min: 95, label: 'Trusted person' }
];
