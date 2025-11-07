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
