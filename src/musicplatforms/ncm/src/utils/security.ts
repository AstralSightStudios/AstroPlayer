// src/utils/security.ts
/**
 * 实现部分 netease 的安全算法
 */

// region secrets
export const WEAPI_ABROAD_SBOX: number[] = [
    82, 9, 106, -43, 48, 54, -91, 56,
    -65, 64, -93, -98, -127, -13, -41, -5,
    124, -29, 57, -126, -101, 47, -1, -121,
    52, -114, 67, 68, -60, -34, -23, -53,
    84, 123, -108, 50, -90, -62, 35, 61,
    -18, 76, -107, 11, 66, -6, -61, 78,
    8, 46, -95, 102, 40, -39, 36, -78,
    118, 91, -94, 73, 109, -117, -47, 37,
    114, -8, -10, 100, -122, 104, -104, 22,
    -44, -92, 92, -52, 93, 101, -74, -110,
    108, 112, 72, 80, -3, -19, -71, -38,
    94, 21, 70, 87, -89, -115, -99, -124,
    -112, -40, -85, 0, -116, -68, -45, 10,
    -9, -28, 88, 5, -72, -77, 69, 6,
    -48, 44, 30, -113, -54, 63, 15, 2,
    -63, -81, -67, 3, 1, 19, -118, 107,
    58, -111, 17, 65, 79, 103, -36, -22,
    -105, -14, -49, -50, -16, -76, -26, 115,
    -106, -84, 116, 34, -25, -83, 53, -123,
    -30, -7, 55, -24, 28, 117, -33, 110,
    71, -15, 26, 113, 29, 41, -59, -119,
    111, -73, 98, 14, -86, 24, -66, 27,
    -4, 86, 62, 75, -58, -46, 121, 32,
    -102, -37, -64, -2, 120, -51, 90, -12,
    31, -35, -88, 51, -120, 7, -57, 49,
    -79, 18, 16, 89, 39, -128, -20, 95,
    96, 81, 127, -87, 25, -75, 74, 13,
    45, -27, 122, -97, -109, -55, -100, -17,
    -96, -32, 59, 77, -82, 42, -11, -80,
    -56, -21, -69, 60, -125, 83, -103, 97,
    23, 43, 4, 126, -70, 119, -42, 38,
    -31, 105, 20, 99, 85, 33, 12, 125,
];

export const WEAPI_ABROAD_KEY = 'fuck~#$%^&*(458';
export const WEAPI_ABROAD_IV: number[] = Array.from(WEAPI_ABROAD_KEY).map(c => c.charCodeAt(0)).slice(0, 64);
// 另外一个密钥
export const ID_XOR_KEY_1: Uint8Array = new global.TextEncoder().encode("3go8&$8*3*3h0k(2)2");
// endregion

// 模拟 JS 中的一些位运算行为
export function jint(v: number): number {
    return v | 0;
}
export function jls(v: number, bs: number): number {
    return jint(v << (bs & 0x1F));
}
export function jrs(v: number, bs: number): number {
    return jint(v >>> (bs & 0x1F));
}
export function jmask(v: number): number {
    return v & 0xFFFFFFFF;
}
export function jxor(v1: number, v2: number): number {
    return jint(jmask(v1) ^ jmask(v2));
}

// region 常用辅助函数
export function string_to_charcodes(e: string): number[] {
    return Array.from(e).map(c => c.charCodeAt(0));
}
export function char_to_hex(e: number): string {
    const c = "0123456789abcdef";
    return c[(e >> 4) & 15] + c[e & 15];
}
export function to_hex_string(e: number[]): string {
    return e.map(i => char_to_hex(i)).join("");
}
export function cast_to_signed(e: number): number {
    if (e < -128) return cast_to_signed(e + 256);
    if (e >= -128 && e <= 127) return e;
    if (e > 127) return cast_to_signed(e - 256);
    return e;
}
export function cast_to_multi_signed(b: number): number[] {
    return [
        cast_to_signed((b >> 24) & 255),
        cast_to_signed((b >> 16) & 255),
        cast_to_signed((b >> 8) & 255),
        cast_to_signed(b & 255)
    ];
}
export function wm_hex_to_ints_hb(e: string): number[] {
    const c: number[] = [];
    for (let r = 0; r < e.length; r += 2) {
        const h = jls(parseInt(e[r], 16), 4);
        const m = parseInt(e[r + 1], 16);
        c.push(cast_to_signed(h + m));
    }
    return c;
}
// endregion

// region core.js security
export function c_quote_int_as_hex(a: number[]): string {
    return '%' + a.map(i => char_to_hex(i)).join('%');
}
export function c_signed_xor(v1: number, v2: number): number {
    return jxor(cast_to_signed(v1), cast_to_signed(v2));
}
export function c_apply_sbox(src: number[], map: number[]): number[] {
    return src.map(i => map[((i >> 4) & 15) * 16 + (i & 15)]);
}
export function c_decrypt_abroad_message(hexstring: string): string {
    const source = wm_hex_to_ints_hb(hexstring);
    let result: number[] = [];
    let boxA: number[] = source.slice(0, 64);
    for (let i = 0; i < source.length; i += 64) {
        const box = source.slice(i, i + 64);
        const boxB = c_apply_sbox(c_apply_sbox(box, WEAPI_ABROAD_SBOX), WEAPI_ABROAD_SBOX);
        const boxC = boxB.map((val, i) => c_signed_xor(val, boxA[i]));
        const boxD = boxC.map((val, i) => cast_to_signed(val + (-boxA[i])));
        const boxE = boxD.map((val, i) => c_signed_xor(val, WEAPI_ABROAD_IV[i]));
        result = result.concat(boxE);
        boxA = source.slice(i, i + 64);
    }
    result = result.slice(0, result.length - 4);
    let quoted = c_quote_int_as_hex(result);
    return decodeURIComponent(quoted).trim();
}
// endregion