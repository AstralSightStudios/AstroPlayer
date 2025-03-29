export interface LyricLine {
    text: String
    additional?: String
    spilted: Array<LyricLineSplit>
    time: number
}

export interface LyricLineSplit {
    text: String
    time: number
}