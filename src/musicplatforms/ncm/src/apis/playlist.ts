// src/apis/playlist.ts
/**
 * 歌单 - Playlist APIs
 */
import { eapiCryptoRequest, weapiCryptoRequest } from "./index";
import * as json from "json5"; // 假设使用 json5 处理 JSON

export const GetPlaylistInfo = weapiCryptoRequest(
    (playlist_id: any, offset: number = 0, total: boolean = true, limit: number = 1000): [string, any] => {
        return ["/weapi/v6/playlist/detail", {
            id: String(playlist_id),
            offset: String(offset),
            total: String(total).toLowerCase(),
            limit: String(limit),
            n: String(limit),
        }];
    }
);

export const GetPlaylistComments = weapiCryptoRequest(
    (playlist_id: string, offset: number = 0, limit: number = 20, beforeTime: number = 0): [string, any] => {
        return [`/v1/resource/comments/A_PL_0_${playlist_id}`, {
            rid: String(playlist_id),
            limit: String(limit),
            offset: String(offset),
            beforeTime: String(beforeTime * 1000),
        }];
    }
);

export const SetManipulatePlaylistTracks = weapiCryptoRequest(
    (trackIds: any, playlistId: any, op: string = "add", imme: boolean = true, e_r: boolean = true): [string, any] => {
        if (!Array.isArray(trackIds)) {
            trackIds = [trackIds];
        }
        return ["/weapi/v1/playlist/manipulate/tracks", {
            trackIds: JSON.stringify(trackIds),
            pid: String(playlistId),
            op: op,
            imme: String(imme).toLowerCase(),
        }];
    }
);

export const SetCreatePlaylist = eapiCryptoRequest(
    (name: string, privacy: boolean = false): [string, any] => {
        return ["/eapi/playlist/create", { name: String(name), privacy: String(privacy ? 1 : 0) }];
    }
);

export const SetRemovePlaylist = eapiCryptoRequest(
    (ids: any, selfFlag: boolean = true): [string, any] => {
        if (!Array.isArray(ids)) {
            ids = [ids];
        }
        return ["/eapi/playlist/remove", { ids: String(ids), self: String(selfFlag) }];
    }
);