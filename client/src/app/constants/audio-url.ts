const COMPONENT_AUDIO_PATH = './assets/audio/';
export const SOUNDS = ['sims4-enraged.mp3', 'sims4-hysterical.mp3', 'sims4-mortified.mp3', 'sims4-very-embarrassed.mp3', 'sims4-very-tense.mp3'];

export const RAMDOM_AUDIO_URL = (sounds: string[]) => {
    return COMPONENT_AUDIO_PATH + sounds[Math.floor(Math.random() * sounds.length)];
};
