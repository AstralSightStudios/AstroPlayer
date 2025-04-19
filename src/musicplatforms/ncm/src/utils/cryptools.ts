// src/utils/cryptools.ts

import { md5 } from "./tinymd5";

export const BASE62 = "PJArHa0dpwhvMNYqKnTbitWfEmosQ9527ZBx46IXUgOzD81VuSFyckLRljG3eC";
export const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function RandomString(_l: number, chars: string = BASE62): string {
    let result = "";
    for (let i = 0; i < _l; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function HexDigest(data: Uint8Array): string {
    return Array.from(data).map(d => d.toString(16).padStart(2, "0")).join("");
}

export function HexCompose(hexstr: string): Uint8Array {
    const arr: number[] = [];
    for (let i = 0; i < hexstr.length; i += 2) {
        arr.push(parseInt(hexstr.substr(i, 2), 16));
    }
    return new Uint8Array(arr);
}

export function HashHexDigest(text: string): string {
    return md5(text);
}