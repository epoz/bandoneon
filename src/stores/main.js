import { defineStore } from 'pinia';
import { useSettingsStore } from './settings';

import CHORDS from './chords.json';
import INSTRUMENTS from './instruments';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const useStore = defineStore('main', {
    state: () => ({
        showColors: false,
        chords:
            (window.localStorage.getItem('chords') &&
                JSON.parse(window.localStorage.getItem('chords'))) ||
            JSON.parse(JSON.stringify(CHORDS)),
        showEnharmonics: false,
        side: 'right',
        direction: 'open',
        tonic: null,
        chordType: null,
        scaleType: null,
    }),

    getters: {
        allNotes: () => NOTES,

        availableScaleTypes: () => ['major', 'minor', 'chromatic'],

        availableChordTypes: () => ['M', 'm', '7', 'dim', 'm7', 'M7'],

        chordNotes(state) {
            if (
                state.side &&
                state.direction &&
                state.tonic &&
                state.chordType
            ) {
                return state.chords[`${state.side}-${state.direction}`][
                    state.tonic + state.chordType
                ];
            }
            return [];
        },

        keyPositions(state) {
            const settings = useSettingsStore();

            if (!settings.instrument) return [];
            const keys =
                INSTRUMENTS[settings.instrument][
                    state.side + '-' + state.direction
                ];
            if (!keys) return [];

            const positions = [];
            let offsetX = 0;
            let offsetY = 0;

            // Center
            const cols = Math.max(...keys.map((row) => row.length));
            const rows = keys.reduce(
                (acc, row) => acc + (row.length > 0 ? 1 : 0),
                0
            );
            if (cols < 9) offsetX += 39 * (9 - cols);
            if (rows < 6) offsetY -= 32 * (6 - rows);

            for (let row = 0; row < keys.length; row++) {
                for (let col = 0; col < keys[row].length; col++) {
                    let tonal = keys[row][col];
                    if (tonal) {
                        const x = offsetX + col * 79 + 40 - (row % 2) * 40;
                        const y =
                            offsetY +
                            row * 64 +
                            30 * (1 - Math.sin(((x / 320) * Math.PI) / 2));
                        positions.push([x, y, tonal]);
                    }
                }
            }

            return positions;
        },
    },

    actions: {
        setTonic(tonic) {
            if (!tonic) {
                this.tonic = null;
                this.chordType = null;
                this.scaleType = null;
            } else if (NOTES.includes(tonic)) {
                this.tonic = tonic;
                if (!this.scaleType && !this.chordType) {
                    this.chordType = 'M';
                }
            }
        },

        setScaleType(scaleType) {
            if (this.chordType) this.chordType = null;
            if (!this.tonic) this.tonic = 'C';
            this.scaleType = scaleType;
        },

        setChordType(chordType) {
            if (this.scaleType) this.scaleType = null;
            if (!this.tonic) this.tonic = 'C';
            this.chordType = chordType;
        },

        saveUserChord(notes) {
            if (!this.tonic || !this.chordType) return;

            const chordName = `${this.tonic}${this.chordType}`;

            if (this.side === 'left') {
                this.chords['left-open'][chordName] = notes;
                this.chords['left-close'][chordName] = notes;
            } else {
                this.chords['right-open'][chordName] = notes;
                this.chords['right-close'][chordName] = notes;
            }

            window.localStorage.setItem('chords', JSON.stringify(this.chords));
        },

        resetUserChords() {
            this.chords = JSON.parse(JSON.stringify(CHORDS));
            window.localStorage.removeItem('chords');
        },
    },
});
