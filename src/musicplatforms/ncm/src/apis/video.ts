// src/apis/video.ts
/**
 * 视频 - Video APIs
 */
import { weapiCryptoRequest } from "./index";

export const GetMVDetail = weapiCryptoRequest(
    (mv_id: string): [string, any] => {
        return ["/weapi/v1/mv/detail", { id: String(mv_id) }];
    }
);

export const GetMVResource = weapiCryptoRequest(
    (mv_id: string, res: number = 1080): [string, any] => {
        return ["/weapi/song/enhance/play/mv/url", { id: String(mv_id), r: String(res) }];
    }
);

export const GetMVComments = weapiCryptoRequest(
    (mv_id: string, offset: number = 0, limit: number = 20, total: boolean = false): [string, any] => {
        return [`/weapi/v1/resource/comments/R_MV_5_${mv_id}`, {
            rid: `R_MV_5_${mv_id}`,
            offset: String(offset),
            total: String(total).toLowerCase(),
            limit: String(limit),
        }];
    }
);
