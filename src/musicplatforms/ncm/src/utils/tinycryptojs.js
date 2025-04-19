// src/utils/tinycryptojs.js
/**
 * 使用纯JS实现部分加密算法
 * 场景：不能使用async的特殊操作（原生接口必须异步）、原生接口未实现的加密方案、经过魔改的加密方案
*/

export function utf8ToBytes(str) {
  var bytes = [];
  for (var i = 0, len = str.length; i < len; i++) {
    var code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    }
  }
  return bytes;
}

// --- WordArray 模拟 ---
// 按 crypto-js 的方式，将字符串（先 UTF-8 编码）转换为对象 { words: number[], sigBytes: number }
// 每个 32 位 word 保存 4 字节，高位在前（即：每个 word 内字节顺序为： byte0<<24 | byte1<<16 | byte2<<8 | byte3 ）
export function utf8StringToWordArray(str) {
  var bytes = utf8ToBytes(str);
  var words = [];
  var sigBytes = bytes.length;
  for (var i = 0; i < sigBytes; i++) {
    var wordIndex = (i / 4) | 0;
    var byteOffset = 3 - (i % 4);
    // 初始化
    if (typeof words[wordIndex] === "undefined") {
      words[wordIndex] = 0;
    }
    words[wordIndex] |= bytes[i] << (byteOffset * 8);
  }
  return { words: words, sigBytes: sigBytes };
}

// 将 WordArray 格式的数据恢复为字节数组（只处理有效 sigBytes 部分）
export function wordArrayToBytes(wa) {
  var bytes = [];
  for (var i = 0; i < wa.sigBytes; i++) {
    var word = wa.words[i >>> 2];
    var byte = (word >> (24 - (i % 4) * 8)) & 0xff;
    bytes.push(byte);
  }
  return bytes;
}

// 将字节数组转换为 32 位字数组（小端序），用以 MD5 内部处理
function bytesToWordsLittleEndian(bytes) {
  var words = [];
  for (var i = 0; i < bytes.length; i++) {
    words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << ((i % 4) * 8));
  }
  return words;
}

// 对字节数组进行填充：先加 0x80，再补 0，直到数据长度对 64 取余等于 56，最后附上原长度（以 bit 为单位，小端序 64 位）
function padBytes(bytes) {
  var origLen = bytes.length;
  var padded = bytes.slice();
  padded.push(0x80);
  while ((padded.length % 64) !== 56) {
    padded.push(0);
  }
  var bitLen = origLen * 8;
  for (var i = 0; i < 8; i++) {
    padded.push((bitLen >>> (8 * i)) & 0xff);
  }
  return padded;
}

// --- Base64 编码 ---
// 将一个字节数组转换为 Base64 编码字符串
export function base64Encode(bytes) {
  var base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var result = "";
  for (var i = 0; i < bytes.length; i += 3) {
    var b1 = bytes[i];
    var b2 = (i + 1 < bytes.length) ? bytes[i + 1] : 0;
    var b3 = (i + 2 < bytes.length) ? bytes[i + 2] : 0;
    var triplet = (b1 << 16) | (b2 << 8) | b3;
    result += base64chars[(triplet >> 18) & 0x3F];
    result += base64chars[(triplet >> 12) & 0x3F];
    result += (i + 1 < bytes.length) ? base64chars[(triplet >> 6) & 0x3F] : "=";
    result += (i + 2 < bytes.length) ? base64chars[triplet & 0x3F] : "=";
  }
  return result;
}

export function atobToUint8Array(base64) {
  // Base64 解码映射表
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // 去除可能的填充符号（=）
  const cleanBase64 = base64.replace(/=+$/, "");

  // 存储解码后的字节数组
  const bytes = [];

  for (let i = 0; i < cleanBase64.length; i += 4) {
    // 取出每4个字符，对应成3个字节
    const chunk =
      (chars.indexOf(cleanBase64[i]) << 18) |
      (chars.indexOf(cleanBase64[i + 1]) << 12) |
      (chars.indexOf(cleanBase64[i + 2] || "A") << 6) |
      (chars.indexOf(cleanBase64[i + 3] || "A"));

    bytes.push((chunk >> 16) & 0xff);
    if (cleanBase64[i + 2] !== undefined) {
      bytes.push((chunk >> 8) & 0xff);
    }
    if (cleanBase64[i + 3] !== undefined) {
      bytes.push(chunk & 0xff);
    }
  }

  return new Uint8Array(bytes);
}