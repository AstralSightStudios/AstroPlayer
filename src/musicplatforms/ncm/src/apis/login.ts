// src/apis/login.ts
/**
 * 登录、CSRF 相关 APIs
 */
import { base64Btoa } from "../../platform";
import { eapiCryptoRequest, weapiCryptoRequest } from "./index";
import { HashHexDigest } from "../utils/cryptools";
import { eapiDecrypt } from "../utils/crypto";
// 此处 logger 简单使用 console
const logger = console;

export class LoginFailedException extends Error { }

export function WriteLoginInfo(response: any, session: any) {
    session.login_info = { tick: Date.now(), content: response };
    if (session.login_info.content.code !== 200) {
        session.login_info.success = false;
        throw new LoginFailedException(JSON.stringify(session.login_info.content));
    }
    session.login_info.success = true;
    session.csrf_token = session.cookies?.["__csrf"] || "";
}

export const LoginLogout = weapiCryptoRequest((): [string, any] => {
    return ["/weapi/logout", {}];
});

export const LoginRefreshToken = eapiCryptoRequest((): [string, any] => {
    return ["/eapi/login/token/refresh", {}];
});

export const LoginQrcodeUnikey = weapiCryptoRequest((dtype: number = 1): [string, any] => {
    return ["/weapi/login/qrcode/unikey", { type: String(dtype) }];
});

export const LoginQrcodeCheck = weapiCryptoRequest((unikey: string, type: number = 1): [string, any] => {
    return ["/weapi/login/qrcode/client/login", { key: String(unikey), type: type }];
});

export const LoginTypeSwitch = weapiCryptoRequest((): [string, any] => {
    return ["/weapi/logout", {}];
});

export const GetCurrentLoginStatus = weapiCryptoRequest((): [string, any] => {
    return ["/weapi/w/nuser/account/get", {}];
});

export function LoginViaCookie(MUSIC_U: string = "", kwargs: any = {}): Promise<any> {
    const session = require("../ncm").GetCurrentSession();
    // 将传入的 COOKIE 信息合并到当前的 cookies 对象中
    session.cookies = { ...session.cookies, "MUSIC_U": MUSIC_U, ...kwargs };
    return GetCurrentLoginStatus().then((resp: any) => {
        WriteLoginInfo(resp, session);
        return { code: 200, result: session.login_info };
    });
}


export const LoginViaCellphone = eapiCryptoRequest(
    (phone: string = "",
        password: string = "",
        passwordHash: string = "",
        captcha: string = "",
        ctcode: number = 86,
        remeberLogin: boolean = true,
        session?: any): [string, any] => {
        const path = "/eapi/w/login/cellphone";
        session = session || require("../ncm").GetCurrentSession();
        if (password) {
            passwordHash = HashHexDigest(password);
        }
        if (!(passwordHash || captcha)) {
            throw new LoginFailedException("未提供密码或验证码");
        }
        const auth_token = !captcha ? { password: String(passwordHash) } : { captcha: String(captcha) };
        return [
            path,
            {
                type: "1",
                phone: String(phone),
                remember: String(remeberLogin).toLowerCase(),
                countrycode: String(ctcode),
                checkToken: "",
                ...auth_token,
            },
        ];
    }
);
export const LoginViaEmail = eapiCryptoRequest(
    (email: string = "", password: string = "", passwordHash: string = "", remeberLogin: boolean = true, session?: any): [string, any] => {
        const path = "/eapi/login";
        session = session || require("../ncm").GetCurrentSession();
        if (password) {
            passwordHash = HashHexDigest(password);
        }
        if (!passwordHash) {
            throw new LoginFailedException("未提供密码");
        }
        const auth_token = { password: String(passwordHash) };
        return [
            path,
            {
                type: "1",
                username: String(email),
                remember: String(remeberLogin).toLowerCase(),
                ...auth_token,
            },
        ];
    }
);

export const SetSendRegisterVerifcationCodeViaCellphone = weapiCryptoRequest(
    (cell: string, ctcode: number = 86): [string, any] => {
        return ["/weapi/sms/captcha/sent", { cellphone: String(cell), ctcode: ctcode }];
    }
);

export const GetRegisterVerifcationStatusViaCellphone = weapiCryptoRequest(
    (cell: string, captcha: string, ctcode: number = 86): [string, any] => {
        return ["/weapi/sms/captcha/verify", { cellphone: String(cell), captcha: String(captcha), ctcode: ctcode }];
    }
);

export const SetRegisterAccountViaCellphone = weapiCryptoRequest(
    (cell: string, captcha: string, nickname: string, password: string): [string, any] => {
        return ["/weapi/w/register/cellphone", {
            captcha: String(captcha),
            nickname: String(nickname),
            password: HashHexDigest(password),
            phone: String(cell),
        }];
    }
);

export const CheckIsCellphoneRegistered = weapiCryptoRequest(
    (cell: string, prefix: number = 86): [string, any] => {
        return ["/eapi/cellphone/existence/check", { cellphone: cell, countrycode: prefix }];
    }
);