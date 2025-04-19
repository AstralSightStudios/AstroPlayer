// src/apis/index.ts
/**
 * PyNCM 网易云音乐 API 封装入口
 * 本模块提供各种 API 封装，以及编写新 API 所需的加密包装器
 */

import { GetCurrentSession } from "../ncm.ts";
import { httpRequest } from "../../platform";
import { eapiDecrypt, eapiEncrypt, LinuxApiEncrypt, weapiEncrypt, AbroadDecrypt } from "../utils/crypto.ts"
import { base64Btoa } from "../../platform";

/** 基础包装函数 */
function _BaseWrapper(requestFunc: (session: any, url: string, plain: any, method: string) => Promise<any>) {
    return function <T extends (...args: any[]) => [string, any, string?]>(apiFunc: T) {
        return async function (...args: Parameters<T>): Promise<any> {
            const session = GetCurrentSession();
            let ret = apiFunc(...args);
            let url = ret[0];
            let payload = ret[1];
            let method = String(ret.length >= 3 && ["POST", "GET"].includes(String(ret[2])) ? ret[2] : "POST");
            console.log(
                `TYPE=${requestFunc.name} API=${apiFunc.name} method=${method} url=${url} deviceId=${session.deviceId} payload=${JSON.stringify(payload)}`
            );
            const rsp = await requestFunc(session, url, payload, method);
            try {
                let txt = typeof rsp === "string" ? rsp : rsp.body;

                if (typeof (txt) === "object") {
                    return txt;
                }

                let obj = JSON.parse(txt);
                if (obj.abroad && obj.abroad === true) {
                    console.warn('Detected "abroad" payload. API response might differ in format!');
                    const real_payload = AbroadDecrypt(obj.result);
                    obj.result = JSON.parse(real_payload);
                    obj.abroad = true;
                }
                return obj;
            } catch (e) {
                console.error("Response is not valid JSON:", e, rsp);
                return rsp;
            }
        }
    }
}

export function weapiCryptoRequest(apiFunc: (...args: any[]) => [string, any, string?]) {
    const wrapper = _BaseWrapper(async (session, url, plain, method) => {
        const requestBody = { ...plain, csrf_token: session.csrf_token };
        const payload = JSON.stringify(requestBody);

        const response = await session.request(method, url.replace("/api/", "/weapi/"), { ...await weapiEncrypt(payload) });
        return response;
    });
    return wrapper(apiFunc);
}

export function eapiCryptoRequest(apiFunc: (...args: any[]) => [string, any, string?]) {
    const wrapper = _BaseWrapper(async (session, url, plain, method) => {
        // 1. 先把 header 对象 stringify 一次，得到带转义的字符串
        const headerObj = {
            ...session.eapi_config,
            requestId: String(Math.floor(Math.random() * (30000000 - 20000000) + 20000000)),
        };
        const headerStr = JSON.stringify(headerObj);

        // 2. 把 headerStr 当普通字符串插入 payload
        const payloadObj = {
            ...plain,
            header: headerStr,
        };

        // 3. 最终明文：对整个 payloadObj 再 stringify
        const dataStr = JSON.stringify(payloadObj);

        // 4. 调用 eapiEncrypt，传入替换过路径和整个 dataStr
        const digest = await eapiEncrypt(
            url.replace("/eapi/", "/api/"),
            dataStr
        );

        // 5. 发请求
        const headers = {
            "User-Agent": session.UA_EAPI,
            Referer: ""
        };
        const response = await session.request(method, url, { ...digest }, headers, true);
        const content = response.body;

        try {
            return await eapiDecrypt(content);
        } catch (e) {
            return content;
        }
    });

    return wrapper(apiFunc);
}

export { LinuxApiEncrypt } from "../utils/crypto.ts";

// 同时导出各 API 模块
import * as album from "./album";
import * as artist from "./artist";
import * as cloud from "./cloud";
import * as cloudsearch from "./cloudsearch";
import * as login from "./login";
import * as playlist from "./playlist";
import * as track from "./track";
import * as user from "./user";
import * as video from "./video";

export {
    album,
    artist,
    cloud,
    cloudsearch,
    login,
    playlist,
    track,
    user,
    video,
};