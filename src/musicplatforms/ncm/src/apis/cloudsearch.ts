// src/apis/cloudsearch.ts
/**
 * 网易云搜索 - Cloudsearch APIs
 */
import { eapiCryptoRequest } from "./index";

export const SONG = 1;
export const ALBUM = 10;
export const ARTIST = 100;
export const PLAYLIST = 1000;
export const USER = 1002;
export const MV = 1004;
export const LYRICS = 1006;
export const DJ = 1009;
export const VIDEO = 1014;

export const GetSearchResult = eapiCryptoRequest(
    (keyword: string, stype: number = SONG, limit: number = 30, offset: number = 0): [string, any] => {
        return ["/eapi/cloudsearch/pc", {
            s: String(keyword),
            type: String(stype),
            limit: String(limit),
            offset: String(offset),
        }];
    }
);