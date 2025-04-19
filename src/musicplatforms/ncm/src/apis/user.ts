// src/apis/user.ts
/**
 * 用户 - User APIs
 */
import { weapiCryptoRequest } from "./index";

export const GetUserDetail = weapiCryptoRequest(
    (user_id: number = 0): [string, any] => {
        return ["/weapi/v1/user/detail/" + user_id, {}];
    }
);

export const GetUserPlaylists = weapiCryptoRequest(
    (user_id: any, offset: number = 0, limit: number = 1001): [string, any] => {
        return ["/weapi/user/playlist", {
            offset: String(offset),
            limit: String(limit),
            uid: String(user_id),
        }];
    }
);

export const GetUserAlbumSubs = weapiCryptoRequest(
    (limit: number = 30): [string, any] => {
        return ["/weapi/album/sublist", { limit: String(limit) }];
    }
);

export const GetUserArtistSubs = weapiCryptoRequest(
    (limit: number = 30): [string, any] => {
        return ["/weapi/artist/sublist", { limit: String(limit) }];
    }
);

export const SIGNIN_TYPE_MOBILE = 0; // 移动端签到 +4 EXP
export const SIGNIN_TYPE_WEB = 1;    // 网页端签到 +1 EXP

export const SetSignin = weapiCryptoRequest(
    (dtype: number = SIGNIN_TYPE_MOBILE): [string, any] => {
        return ["/weapi/point/dailyTask", { type: String(dtype) }];
    }
);

export const SetWeblog = weapiCryptoRequest(
    (logs: any): [string, any] => {
        return ["/weapi/feedback/weblog", { logs: JSON.stringify(logs) }];
    }
);
