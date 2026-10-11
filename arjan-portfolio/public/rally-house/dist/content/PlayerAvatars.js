export const playerAvatars = {
    taylor: { id: 'player', name: 'Taylor', role: 'Club founder', avatar: 'taylor', shirt: '#fffaf1', skin: '#ffe257', hair: '#202d91', accent: '#e8b947', eye: '#22245e', hairStyle: 'bob', presentation: 'feminine', outfit: 'skort', shoe: '#202d91', playStyle: 'curious all-court', goal: 'Make a club worth coming back to', quirk: 'A regal feline presence' },
    arjan: { id: 'player', name: 'Arjan', role: 'Club founder', avatar: 'arjan', shirt: '#28383c', skin: '#bb825b', hair: '#202226', accent: '#c6c6bd', eye: '#4c3022', hairStyle: 'swept', presentation: 'masculine', outfit: 'shorts', shoe: '#f4eee2', playStyle: 'curious all-court', goal: 'Build a club people want to linger in', quirk: 'Always stops for one more rally' }
};
export const playerSpec = (id) => ({ ...playerAvatars[id] });
