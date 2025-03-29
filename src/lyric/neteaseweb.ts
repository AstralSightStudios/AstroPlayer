import { LyricLine, LyricLineSplit } from "./lyric";

export function parseFromNeteaseWebLyrics(lyricsStr: string): LyricLine[] {
    const result: { lyrics: LyricLine[] } = { lyrics: [] };
    // 按行拆分歌词文本
    const lines = lyricsStr.split('\n');
    // 匹配时间标签格式，如 [00:03.35]s
    const timeReg = /\[(\d{2}):(\d{2}\.\d{2})\]/g;

    lines.forEach(line => {
        if (!line.trim()) return;

        let match;
        const times: number[] = [];

        while ((match = timeReg.exec(line)) !== null) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);
            // 转换为毫秒单位
            const timeMs = (minutes * 60 + seconds) * 1000;
            times.push(timeMs);
        }

        const text = line.replace(timeReg, '').trim();

        times.forEach(time => {
            const spilted: Array<LyricLineSplit> = [
                {
                    text: text,
                    time: time,
                }
            ]
            const lyricLine: LyricLine = {
                text: text,
                time: time,
                spilted
            };
            result.lyrics.push(lyricLine);
        });
    });

    // 按时间戳升序排序
    result.lyrics.sort((a, b) => a.time - b.time);
    return result.lyrics;
}