export const playerAvatars = {
    taylor: { id: 'player', name: 'Taylor', role: 'Club founder', avatar: 'taylor', shirt: '#f4eddb', skin: '#d9ab8c', hair: '#172238', accent: '#dfbb50', eye: '#533e2d', hairStyle: 'long', presentation: 'feminine', outfit: 'skort', shoe: '#263650', playStyle: 'curious all-court', goal: 'Make a club worth coming back to', quirk: 'A little feline flair' },
    arjan: { id: 'player', name: 'Arjan', role: 'Club founder', avatar: 'arjan', shirt: '#28383c', skin: '#bb825b', hair: '#202226', accent: '#c6c6bd', eye: '#4c3022', hairStyle: 'swept', presentation: 'masculine', outfit: 'shorts', shoe: '#f4eee2', playStyle: 'curious all-court', goal: 'Build a club people want to linger in', quirk: 'Always stops for one more rally' }
};
export const playerSpec = (id) => ({ ...playerAvatars[id] });
//# sourceMappingURL=PlayerAvatars.js.map