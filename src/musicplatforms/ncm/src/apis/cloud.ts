// src/apis/cloud.ts
/**
 * 我的音乐云盘 - Cloud APIs
 */
import { weapiCryptoRequest, eapiCryptoRequest } from "./index";

const BUCKET = "jd-musicrep-privatecloud-audio-public";

export const GetCloudDriveInfo = weapiCryptoRequest(
    (limit: number = 30, offset: number = 0): [string, any] => {
        return ["/weapi/v1/cloud/get", { limit: String(limit), offset: String(offset) }];
    }
);

export const GetCloudDriveItemInfo = weapiCryptoRequest(
    (song_ids: any[]): [string, any] => {
        const ids = Array.isArray(song_ids) ? song_ids : [song_ids];
        return ["/weapi/v1/cloud/get/byids", { songIds: ids }];
    }
);

export const GetNosToken = eapiCryptoRequest(
    (
        filename: string,
        md5: string,
        fileSize: string,
        ext: string,
        ftype: string = "audio",
        nos_product: number = 3,
        bucket: string = BUCKET,
        local: boolean = false
    ): [string, any] => {
        return ["/eapi/nos/token/alloc", {
            type: String(ftype),
            nos_product: String(nos_product),
            md5: String(md5),
            local: String(local).toLowerCase(),
            filename: String(filename),
            fileSize: String(fileSize),
            ext: String(ext),
            bucket: String(bucket),
        }];
    }
);

export async function SetUploadObject(
    stream: any,
    md5: string,
    fileSize: string,
    objectKey: string,
    token: string,
    offset: number = 0,
    compete: boolean = true,
    bucket: string = BUCKET,
    session?: any
): Promise<any> {
    // 直接通过 Session 的 request 方法发起请求
    const _session = session || (await import("../ncm")).GetCurrentSession();
    const url = `http://45.127.129.8/${bucket}/${encodeURIComponent(objectKey.replace(/\//g, "%2F"))}`;
    const response = await _session.request("POST", url, stream, {
        "x-nos-token": token,
        "Content-MD5": md5,
        "Content-Type": "cloudmusic",
        "Content-Length": String(fileSize),
    });
    return JSON.parse(response.body);
}

export const GetCheckCloudUpload = weapiCryptoRequest(
    (md5: string, ext: string = "", length: number = 0, bitrate: number = 0, songId: number = 0, version: number = 1): [string, any] => {
        return ["/eapi/cloud/upload/check", {
            songId: String(songId),
            version: String(version),
            md5: String(md5),
            length: String(length),
            ext: String(ext),
            bitrate: String(bitrate),
        }];
    }
);

export const SetUploadCloudInfo = weapiCryptoRequest(
    (resourceId: string, songid: string, md5: string, filename: string, song: string = ".", artist: string = ".", album: string = ".", bitrate: number = 128): [string, any] => {
        return ["/eapi/upload/cloud/info/v2", {
            resourceId: String(resourceId),
            songid: String(songid),
            md5: String(md5),
            filename: String(filename),
            song: String(song),
            artist: String(artist),
            album: String(album),
            bitrate: bitrate,
        }];
    }
);

export const SetPublishCloudResource = weapiCryptoRequest(
    (songid: string): [string, any] => {
        return ["/eapi/cloud/pub/v2", { songid: String(songid) }];
    }
);

export const SetRectifySongId = async (
    oldSongId: any,
    newSongId: any,
    session?: any
): Promise<any> => {
    const _session = session || (await import("../ncm")).GetCurrentSession();
    const response = await _session.request("GET", "/api/cloud/user/song/match", {
        songId: String(oldSongId),
        adjustSongId: String(newSongId),
    });
    return JSON.parse(response.body);
};
