// src/utils/crypto.ts
/**
 * Essential implementations of some of netease's security algorithms.
 * This version replaces native BigInt usage with the "big-integer" library,
 * which is required because our quickjs runtime does not support BigInt.
 */
import { aesEncryptCBC, aesDecryptCBC, aesEncryptECB, aesDecryptECB } from "../../platform";
import { HexCompose, HexDigest, HashHexDigest } from "./cryptools";
import { RandomString } from "./cryptools";

// Import the big-integer library
import bigInt, { BigInteger } from 'big-integer';
import { atobToUint8Array } from "./tinycryptojs";
import { md5 } from "./tinymd5";

// region secrets
export const WEAPI_RSA_PUBKEY: [BigInteger, BigInteger] = [
    // Note: The first value is provided as a hex string (without "0x") and parsed as base 16.
    bigInt("0e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7", 16),
    // The second number can be parsed using base 16 as well (removing the "0x" prefix).
    bigInt("10001", 16)
];
export const WEAPI_AES_KEY = "0CoJUm6Qyw8W8jud"; // For CBC mode
export const WEAPI_AES_IV = "0102030405060708";  // For CBC mode
export const LINUXAPI_AES_KEY = "rFgB&h#%2?^eDg:Q"; // For ECB mode
export const EAPI_DIGEST_SALT = "nobody%(url)suse%(text)smd5forencrypt";
export const EAPI_DATA_SALT = "%(url)s-36cd479b6b5-%(text)s-36cd479b6b5-%(digest)s";
export const EAPI_AES_KEY = "e82ckenh8dichen8"; // For ECB mode
// endregion

// region Cryptographic algorithms
const AES = { BLOCKSIZE: 128 >> 3 };

function PKCS7_pad(data, bs = AES.BLOCKSIZE) {
    const padLen = bs - (data.length % bs);
    return data + String.fromCharCode(padLen).repeat(padLen);
}

function PKCS7_unpad(data, bs = AES.BLOCKSIZE) {
    // 取最后一个字符（string
    const pad = data[data.length - 1];
    // 构造 [0,1,2,…,bs-1]，令 includes() 永远为 false，复刻原 hack 逻辑
    const range = Array.from({ length: bs }, (_, i) => i);
    if (!range.includes(pad)) {
        return data;   // hack: data isn't padded
    }
    return data.slice(0, -pad);
}


export async function AESEncrypt(data: string, key: string, iv: string = "", mode: number = 0xFE): Promise<string> {
    if (mode === 0xFE) {
        return await aesEncryptCBC(PKCS7_pad(data), key, iv);
    } else {
        return await aesEncryptECB(PKCS7_pad(data), key);
    }
}

export async function AESDecrypt(data: Uint8Array, key: string, iv: string = "", mode: number = 0xFE): Promise<string> {
    if (mode === 0xFE) {
        const decrypted = await aesDecryptCBC(data, key, iv);
        return PKCS7_unpad(new global.TextDecoder().decode(decrypted));
    } else {
        const decrypted = await aesDecryptECB(data, key);
        return PKCS7_unpad(new global.TextDecoder().decode(decrypted));
    }
}

// Util function for modular exponentiation using big-integer
// Although bigInt provides a modPow method, we wrap it here so the rest of the code remains similar.
function modPow(base: BigInteger, exp: BigInteger, mod: BigInteger): BigInteger {
    return base.modPow(exp, mod);
}

/**
 * RSA encryption re-implemented using the big-integer library.
 * Converts the data to a UTF-8 hex string (optionally reversing the input),
 * then computes m^e mod n.
 */
export function RSAEncrypt(data: string, n: BigInteger, e: BigInteger, reverse: boolean = true): Uint8Array {
    const arr = Array.from(data);
    const m_str = reverse ? arr.reverse().join("") : arr.join("");
    // Convert string to UTF-8 encoded bytes and then to a hexadecimal string.
    const hex = new global.TextEncoder().encode(m_str).reduce((acc, cur) =>
        acc + cur.toString(16).padStart(2, "0"), ""
    );
    // Convert the hex string to a big integer (base 16)
    const m = bigInt(hex, 16);
    // Perform RSA encryption: compute m^e mod n.
    const r = modPow(m, e, n);
    let r_hex = r.toString(16);
    // Ensure the hexadecimal string is 256 characters long, padding with zeros on the left if necessary.
    while (r_hex.length < 256) {
        r_hex = "0" + r_hex;
    }
    return HexCompose(r_hex);
}
// endregion

// region API-specific crypto routines
export async function weapiEncrypt(params: string, aes_key2?: string): Promise<{ params: string; encSecKey: string }> {
    console.log("[MusicPlatforms.NCM.Utils.Crypto.weapiEncrypt] params=", params)

    aes_key2 = aes_key2 || RandomString(16);
    // First encryption using WEAPI_AES_KEY and WEAPI_AES_IV in CBC mode.
    const first_encrypted = await AESEncrypt(params, WEAPI_AES_KEY, WEAPI_AES_IV, 0xFE);
    //const first_b64 = await base64Btoa(new global.TextDecoder().decode(first_encrypted));
    const first_b64 = first_encrypted;
    // Second encryption using aes_key2 and WEAPI_AES_IV in CBC mode.
    const second_encrypted = await AESEncrypt(first_b64, aes_key2, WEAPI_AES_IV, 0xFE);
    //const second_b64 = await base64Btoa(new global.TextDecoder().decode(second_encrypted));
    const second_b64 = second_encrypted;
    // RSA encrypt aes_key2 to generate encSecKey.
    const encSecKey = HexDigest(RSAEncrypt(aes_key2, WEAPI_RSA_PUBKEY[0], WEAPI_RSA_PUBKEY[1]));
    return {
        params: second_b64,
        encSecKey: encSecKey,
    };
}

export function AbroadDecrypt(result: string): string {
    // Call the security module’s c_decrypt_abroad_message function.
    const { c_decrypt_abroad_message } = require("./security");
    return c_decrypt_abroad_message(result);
}

export async function eapiEncrypt(
    url: string,
    params: string | Record<string, unknown>
): Promise<{ params: string }> {

    // ① 把入参转换成“紧凑 JSON”——不带任何空白
    let text =
        typeof params === "string"
            ? JSON.stringify(JSON.parse(params))     // 若已是字符串，先 parse 再 stringify 去掉多余空格
            : JSON.stringify(params);                // 若是对象，直接 stringify

    // ② 只给缺失空格的位置补 **一个** 空格；不会重复插入
    text = text
        .replace(/:(?=\S)/g, ": ")   // 冒号后紧跟非空白 → 补空格
        .replace(/,(?=\S)/g, ", ");  // 逗号后紧跟非空白 → 补空格

    // ③ 计算 digest
    const digest = HashHexDigest(
        EAPI_DIGEST_SALT
            .replace("%(url)s", url)
            .replace("%(text)s", text)
    );

    // ④ 拼 composite
    const composite = EAPI_DATA_SALT
        .replace("%(url)s", url)
        .replace("%(text)s", text)
        .replace("%(digest)s", digest);

    // ⑤ AES‑ECB 加密
    const encryptedB64 = await AESEncrypt(composite, EAPI_AES_KEY, "", 0xFF);

    console.log(`encryptedB64: ${encryptedB64}`)

    return { params: HexDigest(atobToUint8Array(encryptedB64)) };
}

export async function eapiDecrypt(cipher: Uint8Array): Promise<string> {
    if (!cipher) return "";
    return await AESDecrypt(cipher, EAPI_AES_KEY, "", 0xFF);
}

export function LinuxApiEncrypt(params: string): { eparams: string } {
    const encrypted = AESEncrypt(params, LINUXAPI_AES_KEY, "", 0xFF);
    return { eparams: HexDigest(encrypted as unknown as Uint8Array) };
}
// endregion