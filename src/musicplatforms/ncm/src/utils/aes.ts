// src/utils/aes.ts
/**
 * 'Pythonic' AES / Rijndael 算法实现（含 CBC/ECB 支持）
 * 代码参考自 https://github.com/ricmoo/pyaes
 */

export const s_box: number[] = [
    0x63, 0x7C, 0x77, 0x7B, 0xF2, 0x6B, 0x6F, 0xC5,
    0x30, 0x01, 0x67, 0x2B, 0xFE, 0xD7, 0xAB, 0x76,
    0xCA, 0x82, 0xC9, 0x7D, 0xFA, 0x59, 0x47, 0xF0,
    0xAD, 0xD4, 0xA2, 0xAF, 0x9C, 0xA4, 0x72, 0xC0,
    0xB7, 0xFD, 0x93, 0x26, 0x36, 0x3F, 0xF7, 0xCC,
    0x34, 0xA5, 0xE5, 0xF1, 0x71, 0xD8, 0x31, 0x15,
    0x04, 0xC7, 0x23, 0xC3, 0x18, 0x96, 0x05, 0x9A,
    0x07, 0x12, 0x80, 0xE2, 0xEB, 0x27, 0xB2, 0x75,
    0x09, 0x83, 0x2C, 0x1A, 0x1B, 0x6E, 0x5A, 0xA0,
    0x52, 0x3B, 0xD6, 0xB3, 0x29, 0xE3, 0x2F, 0x84,
    0x53, 0xD1, 0x00, 0xED, 0x20, 0xFC, 0xB1, 0x5B,
    0x6A, 0xCB, 0xBE, 0x39, 0x4A, 0x4C, 0x58, 0xCF,
    0xD0, 0xEF, 0xAA, 0xFB, 0x43, 0x4D, 0x33, 0x85,
    0x45, 0xF9, 0x02, 0x7F, 0x50, 0x3C, 0x9F, 0xA8,
    0x51, 0xA3, 0x40, 0x8F, 0x92, 0x9D, 0x38, 0xF5,
    0xBC, 0xB6, 0xDA, 0x21, 0x10, 0xFF, 0xF3, 0xD2,
    0xCD, 0x0C, 0x13, 0xEC, 0x5F, 0x97, 0x44, 0x17,
    0xC4, 0xA7, 0x7E, 0x3D, 0x64, 0x5D, 0x19, 0x73,
    0x60, 0x81, 0x4F, 0xDC, 0x22, 0x2A, 0x90, 0x88,
    0x46, 0xEE, 0xB8, 0x14, 0xDE, 0x5E, 0x0B, 0xDB,
    0xE0, 0x32, 0x3A, 0x0A, 0x49, 0x06, 0x24, 0x5C,
    0xC2, 0xD3, 0xAC, 0x62, 0x91, 0x95, 0xE4, 0x79,
    0xE7, 0xC8, 0x37, 0x6D, 0x8D, 0xD5, 0x4E, 0xA9,
    0x6C, 0x56, 0xF4, 0xEA, 0x65, 0x7A, 0xAE, 0x08,
    0xBA, 0x78, 0x25, 0x2E, 0x1C, 0xA6, 0xB4, 0xC6,
    0xE8, 0xDD, 0x74, 0x1F, 0x4B, 0xBD, 0x8B, 0x8A,
    0x70, 0x3E, 0xB5, 0x66, 0x48, 0x03, 0xF6, 0x0E,
    0x61, 0x35, 0x57, 0xB9, 0x86, 0xC1, 0x1D, 0x9E,
    0xE1, 0xF8, 0x98, 0x11, 0x69, 0xD9, 0x8E, 0x94,
    0x9B, 0x1E, 0x87, 0xE9, 0xCE, 0x55, 0x28, 0xDF,
    0x8C, 0xA1, 0x89, 0x0D, 0xBF, 0xE6, 0x42, 0x68,
    0x41, 0x99, 0x2D, 0x0F, 0xB0, 0x54, 0xBB, 0x16,
];

export const inv_s_box: number[] = [
    0x52, 0x09, 0x6A, 0xD5, 0x30, 0x36, 0xA5, 0x38,
    0xBF, 0x40, 0xA3, 0x9E, 0x81, 0xF3, 0xD7, 0xFB,
    0x7C, 0xE3, 0x39, 0x82, 0x9B, 0x2F, 0xFF, 0x87,
    0x34, 0x8E, 0x43, 0x44, 0xC4, 0xDE, 0xE9, 0xCB,
    0x54, 0x7B, 0x94, 0x32, 0xA6, 0xC2, 0x23, 0x3D,
    0xEE, 0x4C, 0x95, 0x0B, 0x42, 0xFA, 0xC3, 0x4E,
    0x08, 0x2E, 0xA1, 0x66, 0x28, 0xD9, 0x24, 0xB2,
    0x76, 0x5B, 0xA2, 0x49, 0x6D, 0x8B, 0xD1, 0x25,
    0x72, 0xF8, 0xF6, 0x64, 0x86, 0x68, 0x98, 0x16,
    0xD4, 0xA4, 0x5C, 0xCC, 0x5D, 0x65, 0xB6, 0x92,
    0x6C, 0x70, 0x48, 0x50, 0xFD, 0xED, 0xB9, 0xDA,
    0x5E, 0x15, 0x46, 0x57, 0xA7, 0x8D, 0x9D, 0x84,
    0x90, 0xD8, 0xAB, 0x00, 0x8C, 0xBC, 0xD3, 0x0A,
    0xF7, 0xE4, 0x58, 0x05, 0xB8, 0xB3, 0x45, 0x06,
    0xD0, 0x2C, 0x1E, 0x8F, 0xCA, 0x3F, 0x0F, 0x02,
    0xC1, 0xAF, 0xBD, 0x03, 0x01, 0x13, 0x8A, 0x6B,
    0x3A, 0x91, 0x11, 0x41, 0x4F, 0x67, 0xDC, 0xEA,
    0x97, 0xF2, 0xCF, 0xCE, 0xF0, 0xB4, 0xE6, 0x73,
    0x96, 0xAC, 0x74, 0x22, 0xE7, 0xAD, 0x35, 0x85,
    0xE2, 0xF9, 0x37, 0xE8, 0x1C, 0x75, 0xDF, 0x6E,
    0x47, 0xF1, 0x1A, 0x71, 0x1D, 0x29, 0xC5, 0x89,
    0x6F, 0xB7, 0x62, 0x0E, 0xAA, 0x18, 0xBE, 0x1B,
    0xFC, 0x56, 0x3E, 0x4B, 0xC6, 0xD2, 0x79, 0x20,
    0x9A, 0xDB, 0xC0, 0xFE, 0x78, 0xCD, 0x5A, 0xF4,
    0x1F, 0xDD, 0xA8, 0x33, 0x88, 0x07, 0xC7, 0x31,
    0xB1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xEC, 0x5F,
    0x60, 0x51, 0x7F, 0xA9, 0x19, 0xB5, 0x4A, 0x0D,
    0x2D, 0xE5, 0x7A, 0x9F, 0x93, 0xC9, 0x9C, 0xEF,
    0xA0, 0xE0, 0x3B, 0x4D, 0xAE, 0x2A, 0xF5, 0xB0,
    0xC8, 0xEB, 0xBB, 0x3C, 0x83, 0x53, 0x99, 0x61,
    0x17, 0x2B, 0x04, 0x7E, 0xBA, 0x77, 0xD6, 0x26,
    0xE1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0C, 0x7D,
];

export function sub_bytes(s: number[][]): void {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            s[i][j] = s_box[s[i][j]];
        }
    }
}

export function inv_sub_bytes(s: number[][]): void {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            s[i][j] = inv_s_box[s[i][j]];
        }
    }
}

export function shift_rows(s: number[][]): void {
    // 第一行不变
    // 循环右移第一列，左移其他列
    [s[0][1], s[1][1], s[2][1], s[3][1]] = [s[1][1], s[2][1], s[3][1], s[0][1]];
    [s[0][2], s[1][2], s[2][2], s[3][2]] = [s[2][2], s[3][2], s[0][2], s[1][2]];
    [s[0][3], s[1][3], s[2][3], s[3][3]] = [s[3][3], s[0][3], s[1][3], s[2][3]];
}

export function inv_shift_rows(s: number[][]): void {
    [s[0][1], s[1][1], s[2][1], s[3][1]] = [s[3][1], s[0][1], s[1][1], s[2][1]];
    [s[0][2], s[1][2], s[2][2], s[3][2]] = [s[2][2], s[3][2], s[0][2], s[1][2]];
    [s[0][3], s[1][3], s[2][3], s[3][3]] = [s[1][3], s[2][3], s[3][3], s[0][3]];
}

export function add_round_key(s: number[][], k: number[][]): void {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            s[i][j] ^= k[i][j];
        }
    }
}

const xtime = (a: number) =>
    (a & 0x80) ? (((a << 1) ^ 0x1B) & 0xFF) : (a << 1);

export function mix_single_column(a: number[]): void {
    const t = a[0] ^ a[1] ^ a[2] ^ a[3];
    const u = a[0];
    a[0] ^= t ^ xtime(a[0] ^ a[1]);
    a[1] ^= t ^ xtime(a[1] ^ a[2]);
    a[2] ^= t ^ xtime(a[2] ^ a[3]);
    a[3] ^= t ^ xtime(a[3] ^ u);
}

export function mix_columns(s: number[][]): void {
    for (let i = 0; i < 4; i++) {
        mix_single_column(s[i]);
    }
}

export function inv_mix_columns(s: number[][]): void {
    for (let i = 0; i < 4; i++) {
        const u = xtime(xtime(s[i][0] ^ s[i][2]));
        const v = xtime(xtime(s[i][1] ^ s[i][3]));
        s[i][0] ^= u;
        s[i][1] ^= v;
        s[i][2] ^= u;
        s[i][3] ^= v;
    }
    mix_columns(s);
}

export const r_con: number[] = [
    0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40,
    0x80, 0x1B, 0x36, 0x6C, 0xD8, 0xAB, 0x4D, 0x9A,
    0x2F, 0x5E, 0xBC, 0x63, 0xC6, 0x97, 0x35, 0x6A,
    0xD4, 0xB3, 0x7D, 0xFA, 0xEF, 0xC5, 0x91, 0x39,
];

export function bytes2matrix(text: Uint8Array): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < text.length; i += 4) {
        result.push(Array.from(text.slice(i, i + 4)));
    }
    return result;
}

export function matrix2bytes(matrix: number[][]): Uint8Array {
    const result: number[] = [];
    for (const row of matrix) {
        result.push(...row);
    }
    return new Uint8Array(result);
}

export function xor_bytes(a: number[], b: number[]): Uint8Array {
    const result: number[] = [];
    for (let i = 0; i < a.length; i++) {
        result.push(a[i] ^ b[i]);
    }
    return new Uint8Array(result);
}

export function inc_bytes(a: Uint8Array): Uint8Array {
    const out = Array.from(a);
    for (let i = out.length - 1; i >= 0; i--) {
        if (out[i] === 0xFF) {
            out[i] = 0;
        } else {
            out[i]++;
            break;
        }
    }
    return new Uint8Array(out);
}

export function split_blocks(message: Uint8Array, block_size = 16, require_padding = true): Uint8Array[] {
    if (require_padding && message.length % block_size !== 0) {
        throw new Error("Message length not a multiple of block size");
    }
    const blocks: Uint8Array[] = [];
    for (let i = 0; i < message.length; i += block_size) {
        blocks.push(message.slice(i, i + block_size));
    }
    return blocks;
}

export class AES {
    static MODE_CBC = 0xFE;
    static MODE_ECB = 0xFF;
    static BLOCKSIZE = 16;
    static rounds_by_key_size: { [l: number]: number } = { 16: 10, 24: 12, 32: 14 };
    n_rounds: number;
    _key_matrices: number[][][];

    constructor(master_key: string) {
        const keyBytes = new global.TextEncoder().encode(master_key);
        if (!(keyBytes.length in AES.rounds_by_key_size)) {
            throw new Error("Invalid key length");
        }
        this.n_rounds = AES.rounds_by_key_size[keyBytes.length];
        this._key_matrices = this._expand_key(keyBytes);
    }

    _expand_key(master_key: Uint8Array): number[][][] {
        let key_columns: number[][] = [];
        // 初始化 key_columns，每 4 字节一组
        for (let i = 0; i < master_key.length; i += 4) {
            key_columns.push(Array.from(master_key.slice(i, i + 4)));
        }
        const iteration_size = master_key.length / 4;
        let i = 1;
        while (key_columns.length < (this.n_rounds + 1) * 4) {
            let word = [...key_columns[key_columns.length - 1]];
            if (key_columns.length % iteration_size === 0) {
                // 循环左移
                word.push(word.shift()!);
                word = word.map(b => s_box[b]);
                word[0] ^= r_con[i];
                i++;
            } else if (master_key.length === 32 && key_columns.length % iteration_size === 4) {
                word = word.map(b => s_box[b]);
            }
            const prev_word = key_columns[key_columns.length - iteration_size];
            const newWord: number[] = [];
            for (let j = 0; j < 4; j++) {
                newWord.push(word[j] ^ prev_word[j]);
            }
            key_columns.push(newWord);
        }
        const matrices: number[][][] = [];
        for (let i = 0; i < key_columns.length / 4; i++) {
            matrices.push(key_columns.slice(4 * i, 4 * (i + 1)));
        }
        return matrices;
    }

    encrypt_block(plaintext: Uint8Array): Uint8Array {
        if (plaintext.length !== 16) {
            throw new Error("Plaintext block must be 16 bytes");
        }
        let plain_state = bytes2matrix(plaintext);
        add_round_key(plain_state, this._key_matrices[0]);
        for (let i = 1; i < this.n_rounds; i++) {
            sub_bytes(plain_state);
            shift_rows(plain_state);
            mix_columns(plain_state);
            add_round_key(plain_state, this._key_matrices[i]);
        }
        sub_bytes(plain_state);
        shift_rows(plain_state);
        add_round_key(plain_state, this._key_matrices[this._key_matrices.length - 1]);
        return matrix2bytes(plain_state);
    }

    decrypt_block(ciphertext: Uint8Array): Uint8Array {
        if (ciphertext.length !== 16) {
            throw new Error("Ciphertext block must be 16 bytes");
        }
        let cipher_state = bytes2matrix(ciphertext);
        add_round_key(cipher_state, this._key_matrices[this._key_matrices.length - 1]);
        inv_shift_rows(cipher_state);
        inv_sub_bytes(cipher_state);
        for (let i = this.n_rounds - 1; i > 0; i--) {
            add_round_key(cipher_state, this._key_matrices[i]);
            inv_mix_columns(cipher_state);
            inv_shift_rows(cipher_state);
            inv_sub_bytes(cipher_state);
        }
        add_round_key(cipher_state, this._key_matrices[0]);
        return matrix2bytes(cipher_state);
    }

    encrypt_ecb_nopadding(plaintext: Uint8Array): Uint8Array {
        const blocks = split_blocks(plaintext, 16, true);
        const encrypted = blocks.map(block => this.encrypt_block(block));
        return Uint8Array.from(encrypted.flat());
    }

    decrypt_ecb_nopadding(ciphertext: Uint8Array): Uint8Array {
        const blocks = split_blocks(ciphertext, 16, true);
        const decrypted = blocks.map(block => this.decrypt_block(block));
        return Uint8Array.from(decrypted.flat());
    }

    encrypt_cbc_nopadding(plaintext: Uint8Array, iv: Uint8Array): Uint8Array {
        if (iv.length !== 16) {
            throw new Error("IV must be 16 bytes");
        }
        const blocks = split_blocks(plaintext, 16, true);
        const result: number[] = [];
        let previous = iv;
        for (const block of blocks) {
            const xorBlock = xor_bytes(Array.from(block), Array.from(previous));
            const encrypted = this.encrypt_block(new Uint8Array(xorBlock));
            result.push(...Array.from(encrypted));
            previous = encrypted;
        }
        return new Uint8Array(result);
    }

    decrypt_cbc_nopadding(ciphertext: Uint8Array, iv: Uint8Array): Uint8Array {
        if (iv.length !== 16) {
            throw new Error("IV must be 16 bytes");
        }
        const blocks = split_blocks(ciphertext, 16, true);
        const result: number[] = [];
        let previous = iv;
        for (const block of blocks) {
            const decrypted = this.decrypt_block(block);
            const xored = xor_bytes(Array.from(previous), Array.from(decrypted));
            result.push(...Array.from(xored));
            previous = block;
        }
        return new Uint8Array(result);
    }
}  