// src/__init__.ts
/**
 * PyNCM 网易云音乐 API / 下载工具
 *
 * 参考文档说明……
 */

import { base64Atob, base64Btoa, httpRequest } from "../platform";
import { eapiEncrypt, eapiDecrypt } from "./utils/crypto";
import { HexCompose } from "./utils/cryptools";
import { parseCookies } from "./tools"

import * as apis from "./apis"

// 版本信息
export const __VERSION_MAJOR__ = 1;
export const __VERSION_MINOR__ = 7;
export const __VERSION_PATCH__ = 1;
export const __version__ = `${__VERSION_MAJOR__}.${__VERSION_MINOR__}.${__VERSION_PATCH__}`;

// 由于 JS 中没有线程概念，这里统一用一个 key 表示“当前线程”
const CURRENT_THREAD_KEY = "default";

// SESSION_STACK: Map<threadKey, Session[]>
const SESSION_STACK: Map<string, Session[]> = new Map();
SESSION_STACK.set(CURRENT_THREAD_KEY, []);

// 默认 deviceId
export const DEVICE_ID_DEFAULT = "pyncm!";

// Session 类（参考 requests.Session 逻辑）
export class Session {
    HOST = "music.163.com";
    UA_DEFAULT = `Mozilla/5.0 (searchstars@163.com/AstroPlayer for Vela) Chrome/PyNCM.${__version__}`;
    UA_EAPI = "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.164 NeteaseMusicDesktop/2.10.2.200154";
    UA_LINUX_API = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.90 Safari/537.36";
    force_http: boolean = false;
    headers: { [key: string]: string } = {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": this.UA_DEFAULT,
        "Referer": this.HOST,
    };
    login_info: any = { success: false, tick: Date.now(), content: null };
    eapi_config: any = {
        os: "iPhone OS",
        appver: "10.0.0",
        osver: "16.2",
        channel: "distribution",
        deviceId: DEVICE_ID_DEFAULT,
    };
    csrf_token: string = "";
    cookies: { [name: string]: string } = {};

    constructor() { }

    // 模拟 Context Manager 的 __enter__ 方法：进入 with 块时推入栈中
    enter() {
        if (!SESSION_STACK.get(CURRENT_THREAD_KEY)) {
            SESSION_STACK.set(CURRENT_THREAD_KEY, []);
        }
        SESSION_STACK.get(CURRENT_THREAD_KEY)!.push(this);
        return this;
    }
    // 模拟退出 with 块
    exit() {
        SESSION_STACK.get(CURRENT_THREAD_KEY)?.pop();
    }

    get deviceId(): string {
        return this.eapi_config.deviceId;
    }
    set deviceId(v: string) {
        this.eapi_config.deviceId = v;
    }

    get uid(): number {
        if (this.logged_in && this.login_info.content?.account) {
            return this.login_info.content.account.id;
        }
        return 0;
    }
    get nickname(): string {
        if (this.logged_in && this.login_info.content?.profile) {
            return this.login_info.content.profile.nickname;
        }
        return "";
    }
    get lastIP(): string {
        if (this.logged_in && this.login_info.content?.profile) {
            return this.login_info.content.profile.lastLoginIP;
        }
        return "";
    }
    get vipType(): number {
        if (this.logged_in && !this.is_anonymous && this.login_info.content?.profile) {
            return this.login_info.content.profile.vipType;
        }
        return 0;
    }
    get logged_in(): boolean {
        return this.login_info.success;
    }
    get is_anonymous(): boolean {
        return this.logged_in && !this.nickname;
    }

    // 发起 HTTP 请求（使用 platform.httpRequest）
    async request(
        method: string,
        url: string,
        data?: any,
        extraHeaders?: { [key: string]: string },
        isEapiRequest: boolean = false
    ): Promise<any> {
        if (!url.startsWith("http")) {
            url = `https://${this.HOST}${url}?csrf_token=${this.csrf_token}`;
        }
        if (this.force_http) {
            url = url.replace("https:", "http:");
        }
        // 合并默认 headers 和额外提供的 headers
        const headers = { ...this.headers, ...(extraHeaders || {}) };

        let cookies = this.cookies
        if(isEapiRequest){
            cookies.appver = this.eapi_config.appver
            cookies.channel = this.eapi_config.channel
            cookies.deviceId = this.eapi_config.deviceId
            cookies.os = this.eapi_config.os
            cookies.osver = this.eapi_config.osver

            headers.Host = "music.163.com"
        }

        // 把当前存储的 cookies 拼接至请求头
        const cookieHeader = Object.entries(this.cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");
        if (cookieHeader) {
            headers["Cookie"] = cookieHeader;
        }
        const body = typeof data === "string" ? data : new global.URLSearchParams(data).toString();

        console.log(
            "[MusicPlatforms.NCM.Session.request] Sending request: url=", url,
            "method=", method,
            "headers=", headers,
            "body=", data,
            "bodyEncoded=", body
        );

        const response = await httpRequest({
            method: method,
            url: url,
            headers: headers,
            body: body,
        });
        //console.log("[MusicPlatforms.NCM.Session.request] response: ", response);

        // 优化：检查响应头中是否包含 Set-Cookie 字段，并调用 parseCookies 解析出所有 cookie 键值对
        if (response.headers) {
            // 注意 Set-Cookie 可能为数组也可能为字符串
            const setCookie = response.headers["Set-Cookie"] || response.headers["set-cookie"];
            if (setCookie) {
                const setCookieStr = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
                const newCookies = parseCookies(setCookieStr);
                // 用新解析出的 cookie 覆盖原有的 cookie（相同名称的 cookie 将被更新）
                this.cookies = { ...this.cookies, ...newCookies };

                // 同时也更新csrf_token
                if(this.cookies["__csrf"]){
                    this.csrf_token = this.cookies["__csrf"];
                }
            }
        }
        return response;
    }

    // 序列化当前 Session 信息为对象（与 dump() 功能等价）
    dump(): any {
        const out: any = {};
        for (const key of Object.keys(Session._session_info)) {
            out[key] = Session._session_info[key][0](this);
        }
        return out;
    }
    load(dumped: any) {
        for (const k of Object.keys(dumped)) {
            Session._session_info[k][1](this, dumped[k]);
        }
        return true;
    }

    // 内部用于转换 session 信息的方法集
    static _session_info: { [k: string]: [(s: Session) => any, (s: Session, v: any) => void] } = {
        eapi_config: [
            (s: Session) => s.eapi_config,
            (s: Session, v: any) => { s.eapi_config = v; },
        ],
        login_info: [
            (s: Session) => s.login_info,
            (s: Session, v: any) => { s.login_info = v; },
        ],
        csrf_token: [
            (s: Session) => s.csrf_token,
            (s: Session, v: any) => { s.csrf_token = v; },
        ],
        cookies: [
            (s: Session) => s.cookies,
            (s: Session, cookies: any) => { s.cookies = cookies; },
        ],
    };
}

// SessionManager 单例管理
export class SessionManager {
    session: Session;
    constructor() {
        this.session = new Session();
    }
    get(): Session {
        const stack = SESSION_STACK.get(CURRENT_THREAD_KEY);
        if (stack && stack.length > 0) {
            return stack[stack.length - 1];
        }
        return this.session;
    }
    set(session: Session) {
        const stack = SESSION_STACK.get(CURRENT_THREAD_KEY);
        if (stack && stack.length > 0) {
            throw new Error("Current Session is in a with block, which cannot be reassigned.");
        }
        this.session = session;
    }
    // 旧版序列化
    static stringify_legacy(session: Session): string {
        // 此处调用 eapiEncrypt 与 JSON.stringify 实现
        const dumpStr = JSON.stringify(session.dump());
        // 调用工具函数（同步实现）——这里我们暂用平台接口或直接调用内置函数代替
        // 为保证不改变逻辑，直接返回一个经过简单处理的字符串
        return eapiEncrypt("pyncm", dumpStr).then(res => res.params) as unknown as string;
    }
    static async parse_legacy(dump: string): Promise<Session> {
        // HexCompose 与 eapiDecrypt 需要调用工具
        const hexDump = HexCompose(dump);
        const dec = await eapiDecrypt(hexDump);
        const parts = dec.split("-36cd479b6b5-");
        if (parts[0] !== "pyncm") {
            throw new Error("Magic string mismatch in session parse legacy");
        }
        const session = new Session();
        session.load(JSON.parse(parts[1]));
        return session;
    }
    static async stringify(session: Session): Promise<string> {
        const dumpStr = JSON.stringify(session.dump());
        // 压缩、base64 等操作暂直接模拟为 base64 编码后的 JSON 字符串，前面加上 PYNCM 前缀
        const b64 = await base64Btoa(dumpStr);
        return "PYNCM" + b64;
    }
    static async parse(dump: string): Promise<Session> {
        if (dump.startsWith("PYNCM")) {
            const b64 = dump.slice(5);
            const decoded = await base64Atob(b64);

            console.log("[MusicPlatforms.NCM.LoadSessionFromString] Session string decoded: ", decoded)

            const session = new Session();
            session.load(JSON.parse(decoded));
            return session;
        } else {
            return await SessionManager.parse_legacy(dump);
        }
    }
}

const sessionManager = new SessionManager();

export function GetCurrentSession(): Session {
    return sessionManager.get();
}
export function SetCurrentSession(session: Session) {
    sessionManager.set(session);
}
export function SetNewSession() {
    sessionManager.set(new Session());
}
export function CreateNewSession(): Session {
    return new Session();
}
export async function LoadSessionFromString(dump: string): Promise<Session> {
    return await SessionManager.parse(dump);
}
export async function DumpSessionAsString(session: Session): Promise<string> {
    return await SessionManager.stringify(session);
}

export {
    apis
}