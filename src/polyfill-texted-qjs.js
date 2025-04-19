(function (global) {
    "use strict";

    // 如果全局已存在 TextEncoder 则不做处理
    if (typeof global.TextEncoder === "undefined") {
        /**
         * TextEncoder polyfill（仅支持 "utf-8" 编码）
         * @constructor
         * @param {string} [encoding='utf-8'] 目前只支持 "utf-8"
         */
        function TextEncoder(encoding) {
            if (encoding && String(encoding).toLowerCase() !== "utf-8") {
                throw new TypeError("Only utf-8 encoding is supported");
            }
            this.encoding = "utf-8";
        }

        /**
         * 将字符串转换为 Uint8Array（UTF‑8 编码）
         * @param {string} inputStr 要编码的字符串
         * @returns {Uint8Array}
         */
        TextEncoder.prototype.encode = function (inputStr) {
            var bytes = [];
            for (var i = 0; i < inputStr.length; i++) {
                var codeUnit = inputStr.charCodeAt(i);
                // ASCII: 单字节直接输出
                if (codeUnit < 0x80) {
                    bytes.push(codeUnit);
                }
                // 两字节编码
                else if (codeUnit < 0x800) {
                    bytes.push(0xc0 | (codeUnit >> 6));
                    bytes.push(0x80 | (codeUnit & 0x3f));
                }
                // 可能为代理项
                else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
                    // 若存在对应低代理
                    if (i + 1 < inputStr.length) {
                        var nextCodeUnit = inputStr.charCodeAt(i + 1);
                        if (nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff) {
                            // 转换成 Unicode code point
                            var codePoint = ((codeUnit - 0xd800) << 10) + (nextCodeUnit - 0xdc00) + 0x10000;
                            bytes.push(0xf0 | (codePoint >> 18));
                            bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
                            bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
                            bytes.push(0x80 | (codePoint & 0x3f));
                            i++; // 跳过低代理
                            continue;
                        }
                    }
                    // 无效/孤立的高代理，输出替换字符 U+FFFD（EF BF BD）
                    bytes.push(0xef, 0xbf, 0xbd);
                }
                // 孤立的低代理
                else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
                    bytes.push(0xef, 0xbf, 0xbd);
                }
                // 三字节编码
                else {
                    bytes.push(0xe0 | (codeUnit >> 12));
                    bytes.push(0x80 | ((codeUnit >> 6) & 0x3f));
                    bytes.push(0x80 | (codeUnit & 0x3f));
                }
            }
            return new Uint8Array(bytes);
        };

        global.TextEncoder = TextEncoder;
    }

    // 如果全局已存在 TextDecoder 则不做处理
    if (typeof global.TextDecoder === "undefined") {
        /**
         * TextDecoder polyfill（仅支持 "utf-8" 编码）
         * @constructor
         * @param {string} [encoding='utf-8'] 目前只支持 "utf-8"
         */
        function TextDecoder(encoding) {
            if (encoding && String(encoding).toLowerCase() !== "utf-8") {
                throw new TypeError("Only utf-8 encoding is supported");
            }
            this.encoding = "utf-8";
        }

        /**
         * 将 Uint8Array 或 ArrayBuffer 按 UTF‑8 解码为字符串
         * @param {(Uint8Array|ArrayBuffer)} input 要解码的数据
         * @param {Object} [options] 保留参数（目前未实现 ignoreBOM 及 fatal）
         * @returns {string}
         */
        TextDecoder.prototype.decode = function (input, options) {
            var bytes;
            if (input instanceof ArrayBuffer) {
                bytes = new Uint8Array(input);
            } else if (input instanceof Uint8Array) {
                bytes = input;
            } else {
                throw new TypeError("The provided value is not of type '(ArrayBuffer or Uint8Array)'");
            }

            var output = "";
            for (var i = 0; i < bytes.length;) {
                var byte1 = bytes[i++];

                // 单字节 (0xxxxxxx)
                if (byte1 < 0x80) {
                    output += String.fromCharCode(byte1);
                }
                // 双字节 (110xxxxx 10xxxxxx)
                else if ((byte1 & 0xe0) === 0xc0) {
                    var byte2 = bytes[i++];
                    var codePoint = ((byte1 & 0x1f) << 6) | (byte2 & 0x3f);
                    output += String.fromCharCode(codePoint);
                }
                // 三字节 (1110xxxx 10xxxxxx 10xxxxxx)
                else if ((byte1 & 0xf0) === 0xe0) {
                    var byte2 = bytes[i++];
                    var byte3 = bytes[i++];
                    var codePoint = ((byte1 & 0x0f) << 12) |
                        ((byte2 & 0x3f) << 6) |
                        (byte3 & 0x3f);
                    output += String.fromCharCode(codePoint);
                }
                // 四字节 (11110xxx 10xxxxxx 10xxxxxx 10xxxxxx) 解码为 surrogate pair
                else if ((byte1 & 0xf8) === 0xf0) {
                    var byte2 = bytes[i++];
                    var byte3 = bytes[i++];
                    var byte4 = bytes[i++];
                    var codePoint = ((byte1 & 0x07) << 18) |
                        ((byte2 & 0x3f) << 12) |
                        ((byte3 & 0x3f) << 6) |
                        (byte4 & 0x3f);
                    codePoint -= 0x10000;
                    // 生成一对 surrogate
                    output += String.fromCharCode((codePoint >> 10) + 0xd800,
                        (codePoint & 0x3ff) + 0xdc00);
                }
                // 非法的 UTF-8 序列则输出替换字符
                else {
                    output += "\uFFFD";
                }
            }
            return output;
        };

        global.TextDecoder = TextDecoder;
    }
})(typeof global !== "undefined" ? global : (typeof window !== "undefined" ? window : this));