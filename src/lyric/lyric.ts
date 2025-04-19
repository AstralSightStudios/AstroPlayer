export interface LyricLine {
    text: String // 歌词正文
    additional?: String // 附加词（显示在正文下方）
    spilted: Array<LyricLineSplit> // 切割后的逐词数据
    time: number // 展示时机（该歌词将在歌曲播放后的几毫秒后展示？）
}

export interface LyricLineSplit {
    text: String // 一个词（中文一个字，英文一个单词）
    time: number // 该词的展示时机（相对于父歌词开始展示的时机，单位毫秒，例如父歌词（整条）是2000ms展示，这是第二个词，将在2100ms展示，那这应该设置为100ms）
}