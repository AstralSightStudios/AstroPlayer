// src/apis/artist.ts
/**
 * 艺术家 - Artist APIs
 */
import { weapiCryptoRequest } from "./index";

export const GetArtistAlbums = weapiCryptoRequest(
    (artist_id: string, offset: number = 0, total: boolean = true, limit: number = 1000): [string, any] => {
        return [`/weapi/artist/albums/${artist_id}`, {
            offset: String(offset),
            total: String(total).toLowerCase(),
            limit: String(limit),
        }];
    }
);

export const GetArtistTracks = weapiCryptoRequest(
    (artist_id: string, offset: number = 0, total: boolean = true, limit: number = 1000, order: string = "hot"): [string, any] => {
        return ["/weapi/v1/artist/songs", {
            id: String(artist_id),
            offset: String(offset),
            total: String(total).toLowerCase(),
            limit: String(limit),
            order: order,
        }];
    }
);

export const GetArtistDetails = weapiCryptoRequest(
    (artist_id: string): [string, any] => {
        return ["/weapi/artist/head/info/get", { id: String(artist_id) }];
    }
);