// src/apis/album.ts
/**
 * 专辑 - Album APIs
 */
import { weapiCryptoRequest } from "./index";

// 采用 weapiCryptoRequest 包装器
export const GetAlbumInfo = weapiCryptoRequest((album_id: string): [string, any] => {
    return [`/weapi/v1/album/${album_id}`, {}];
});

export const GetAlbumComments = weapiCryptoRequest(
    (
        album_id: string,
        offset: number = 0,
        limit: number = 20,
        beforeTime: number = 0
    ): [string, any] => {
        return [`/weapi/v1/resource/comments/R_AL_3_${album_id}`, {
            rid: `R_AL_3_${album_id}`,
            offset: String(offset),
            total: "true",
            limit: String(limit),
            beforeTime: String(beforeTime * 1000),
        }];
    }
);