export function parseCookies(header: string): { [key: string]: string } {
    const cookie: { [key: string]: string } = {};
    const attrNames = new Set([
        "max-age",
        "expires",
        "path",
        "domain",
        "secure",
        "httponly",
    ]);
    // 按分号拆分，注意 cookie 值中可能包含空格，故每个 token先 trim
    const parts = header.split(";");
    for (let part of parts) {
        part = part.trim();
        if (!part) continue;
        const eqIndex = part.indexOf("=");
        if (eqIndex < 0) {
            // 如果没有 '='，直接跳过
            continue;
        }
        const key = part.substring(0, eqIndex).trim();
        const value = part.substring(eqIndex + 1).trim();
        // 如果 key 不在属性名列表中，则认为是 cookie 键值对
        if (!attrNames.has(key.toLowerCase())) {
            // 更新时后面出现的同名 cookie 会覆盖前面的
            cookie[key] = value;
        }
    }
    return cookie;
}