// src/platform.js
// 平台相关接口：网络请求、AES加密解密、MD5 哈希等。
import fetch from "@system.fetch";
import crypto from "@system.crypto";

// 网络请求接口
export async function httpRequest(options) {
  // options 示例：
  // {
  //   method: "GET" | "POST" | ...,
  //   url: string,
  //   headers: object,
  //   body: string 或 Buffer,
  // }
  // 返回 Promise，解析后返回响应对象：
  // { status: number, headers: object, body: string 或 Buffer }
  try{
    const response = await fetch.fetch({
      url: options.url,
      method: options.method,
      header: options.headers,
      data: options.body,
    })

    const result = response.data;

    return {
      status: result.code,
      headers: result.headers,
      body: result.data,
    };
  }
  catch(error){
    return{
      code: error.code,
      message: error.data,
    };
  };
}

// AES CBC 模式加密
export async function aesEncryptCBC(plaintext, key, iv) {
  // 对于 AES 加密，调用 system.crypto.encrypt
  // 需要传入经过 base64 编码后的密钥和初始向量
  const encKey = crypto.btoa(key);
  const encIv = crypto.btoa(iv);
  return new Promise((resolve, reject) => {
    crypto.encrypt({
      data: plaintext,
      algo: "AES",
      key: encKey,
      options: { transformation: "AES/CBC/PKCS7Padding", iv: encIv },
      success: function (res) {
        // 返回的 res.data 为加密后的二进制数据（字符串形式）
        resolve(res.data);
      },
      fail: function (err, code) {
        reject(new Error(`aesEncryptCBC fail: ${code}: ${err}`));
      },
    });
  });
}

// AES CBC 模式解密
export async function aesDecryptCBC(ciphertext, key, iv) {
  const encKey = crypto.btoa(key);
  const encIv = crypto.btoa(iv);
  return new Promise((resolve, reject) => {
    crypto.decrypt({
      data: ciphertext,
      algo: "AES",
      key: encKey,
      options: { transformation: "AES/CBC/PKCS7Padding", iv: encIv },
      success: function (res) {
        resolve(res.data);
      },
      fail: function (err, code) {
        reject(new Error(`aesDecryptCBC fail: ${code}: ${err}`));
      },
    });
  });
}

// AES ECB 模式加密
export async function aesEncryptECB(plaintext, key) {
  const encKey = crypto.btoa(key);
  return new Promise((resolve, reject) => {
    crypto.encrypt({
      data: plaintext,
      algo: "AES",
      key: encKey,
      options: { transformation: "AES/ECB/PKCS7Padding" },
      success: function (res) {
        resolve(res.data);
      },
      fail: function (err, code) {
        reject(new Error(`aesEncryptECB fail: ${code}: ${err}`));
      },
    });
  });
}

// AES ECB 模式解密
export async function aesDecryptECB(ciphertext, key) {
  const encKey = crypto.btoa(key);
  return new Promise((resolve, reject) => {
    crypto.decrypt({
      data: ciphertext,
      algo: "AES",
      key: encKey,
      options: { transformation: "AES/ECB/PKCS7Padding" },
      success: function (res) {
        resolve(res.data);
      },
      fail: function (err, code) {
        reject(new Error(`aesDecryptECB fail: ${code}: ${err}`));
      },
    });
  });
}

// MD5 哈希函数
export async function md5Hash(data) {
  // 调用 crypto.hashDigest 接口生成 MD5 摘要
  // 此接口同步返回字符串，我们将其封装为 async 函数
  return Promise.resolve(crypto.hashDigest({ data: data, algo: "MD5" }));
}

// Base64 解码函数
export async function base64Atob(str) {
  return Promise.resolve(crypto.atob(str));
}

// Base64 编码函数
export async function base64Btoa(str) {
  return Promise.resolve(crypto.btoa(str));
}