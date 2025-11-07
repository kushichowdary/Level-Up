// Creates and plays a simple sound for task completion
export const playCompletionSound = () => {
    // Check if AudioContext is available
    if (typeof window === 'undefined' || !window.AudioContext) {
        return;
    }

    const audioContext = new window.AudioContext();
    
    // Create a sequence of notes for a more pleasant sound
    const notes = [
        { freq: 523.25, duration: 0.05, delay: 0 },      // C5
        { freq: 783.99, duration: 0.05, delay: 0.05 },   // G5
        { freq: 1046.50, duration: 0.1, delay: 0.1 }     // C6
    ];

    notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);

        // Fade out to prevent clicks
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + note.delay);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + note.delay + note.duration);

        oscillator.start(audioContext.currentTime + note.delay);
        oscillator.stop(audioContext.currentTime + note.delay + note.duration);
    });

    // Close the context after a short delay to free up resources
    setTimeout(() => {
        if (audioContext.state !== 'closed') {
            audioContext.close();
        }
    }, 500);
};

export const playLevelUpSound = () => {
    if (typeof window === 'undefined' || !window.AudioContext) {
        return;
    }

    const audioContext = new window.AudioContext();
    const masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.setValueAtTime(0.2, audioContext.currentTime);

    const notes = [
        { freq: 261.63, delay: 0 },      // C4
        { freq: 329.63, delay: 0.1 },    // E4
        { freq: 392.00, delay: 0.2 },    // G4
        { freq: 523.25, delay: 0.3 },    // C5
        { freq: 659.25, delay: 0.4 },    // E5
        { freq: 783.99, delay: 0.5 },    // G5
        { freq: 1046.50, delay: 0.6 }    // C6
    ];

    notes.forEach(note => {
        const oscillator = audioContext.createOscillator();
        oscillator.connect(masterGain);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.delay);
        oscillator.start(audioContext.currentTime + note.delay);
        oscillator.stop(audioContext.currentTime + note.delay + 0.15);
    });

    // Add a final "shimmer" sound
    const shimmerOscillator = audioContext.createOscillator();
    const shimmerGain = audioContext.createGain();
    shimmerOscillator.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmerOscillator.type = 'sawtooth';
    shimmerOscillator.frequency.setValueAtTime(1046.50, audioContext.currentTime + 0.7);
    shimmerGain.gain.setValueAtTime(0.2, audioContext.currentTime + 0.7);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 1.2);
    shimmerOscillator.start(audioContext.currentTime + 0.7);
    shimmerOscillator.stop(audioContext.currentTime + 1.2);


    setTimeout(() => {
        if (audioContext.state !== 'closed') {
            audioContext.close();
        }
    }, 1500);
};
