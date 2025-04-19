// src/apis/track.ts
/**
 * 歌曲 - Track APIs
 */
import { RandomString } from "../utils/cryptools";
import { eapiCryptoRequest, weapiCryptoRequest } from "./index";
import * as json from "json5"; // 如有需要

export const GetTrackDetail = eapiCryptoRequest(
    (song_ids: any): [string, any] => {
        const ids = Array.isArray(song_ids) ? song_ids : [song_ids];
        return ["/weapi/v3/song/detail", {
            c: JSON.stringify(ids.map((id: any) => ({ id: String(id) })))
        }];
    }
);

export const GetTrackAudio = eapiCryptoRequest(
    (song_ids: any, bitrate: number = 320000, encodeType: string = "aac"): [string, any] => {
        const ids = Array.isArray(song_ids) ? song_ids : [song_ids];
        return ["/eapi/song/enhance/player/url", {
            ids: ids,
            encodeType: String(encodeType),
            br: String(bitrate),
        }];
    }
);

export const GetTrackAudioV1 = eapiCryptoRequest(
    (song_ids: any, level: string = "standard", encodeType: string = "flac"): [string, any] => {
        const ids = Array.isArray(song_ids) ? song_ids : [song_ids];
        return ["/eapi/song/enhance/player/url/v1", {
            ids: ids,
            encodeType: String(encodeType),
            level: String(level),
        }];
    }
);

export const GetTrackDownloadURL = eapiCryptoRequest(
    (song_ids: any, bitrate: number = 320000, encodeType: string = "aac"): [string, any] => {
        const ids = Array.isArray(song_ids) ? song_ids : [song_ids];
        return ["/eapi/song/enhance/download/url", {
            ids: ids,
            encodeType: "aac",
            br: String(bitrate),
        }];
    }
);

export const GetTrackDownloadURLV1 = eapiCryptoRequest(
    (song_id: number, level: string = "standard"): [string, any] => {
        return ["/eapi/song/enhance/download/url/v1", {
            id: `${song_id}_0`,
            level: String(level),
        }];
    }
);

export const GetTrackLyrics = weapiCryptoRequest(
    (song_id: string, lv: number = -1, tv: number = -1, rv: number = -1): [string, any] => {
        return ["/weapi/song/lyric", {
            id: String(song_id),
            lv: String(lv),
            tv: String(tv),
            rv: String(rv),
        }];
    }
);

export const GetTrackLyricsNew = eapiCryptoRequest(
    (song_id: string): [string, any] => {
        return ["/eapi/song/lyric/v1", {
            id: String(song_id),
            cp: false,
            lv: 0,
            tv: 0,
            rv: 0,
            kv: 0,
            yv: 0,
            ytv: 0,
            yrv: 0,
        }];
    }
);

export const GetTrackComments = weapiCryptoRequest(
    (song_id: string, offset: number = 0, limit: number = 20, beforeTime: number = 0): [string, any] => {
        return [`/weapi/v1/resource/comments/R_SO_4_${song_id}`, {
            rid: String(song_id),
            offset: String(offset),
            total: "true",
            limit: String(limit),
            beforeTime: String(beforeTime * 1000),
        }];
    }
);

export const SetLikeTrack = eapiCryptoRequest(
    (trackId: number, like: boolean = true, userid: number = 0, e_r: boolean = true): [string, any] => {
        return ["/eapi/song/like", {
            trackId: String(trackId),
            userid: String(userid),
            like: String(like).toLowerCase(),
            e_r: String(e_r).toLowerCase(),
        }];
    }
);

// 默认音频指纹匹配的 Session ID
const DEFAULT_AUDIO_MATCHER_SESSION_ID = RandomString(16);

export const GetMatchTrackByFP = weapiCryptoRequest(
    (audioFP: string, duration: number, sessionId: string = DEFAULT_AUDIO_MATCHER_SESSION_ID): [string, any] => {
        return ["/eapi/music/audio/match", {
            algorithmCode: "shazam_v2", // 貌似有三种？
            sessionId: sessionId,
            duration: Number(duration),
            from: "recognize-song",
            times: "1",
            decrypt: "1",
            rawdata: audioFP,
        }];
    }
);
