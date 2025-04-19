(function (global) {
    'use strict';

    /**
     * URLSearchParams 构造函数
     * 支持以下几种初始化方式：
     * 1. 字符串形式（可以以 "?" 开头）
     * 2. 可迭代数组，每个元素必须为 [key, value] 数组
     * 3. 对象（遍历对象的自有属性）
     *
     * @param {string|Iterable|Object} [init]
     */
    function URLSearchParams(init) {
        this._entries = [];

        if (init == null) return;

        if (typeof init === 'string') {
            // 如果字符串以 ? 开头，则去除
            if (init.charAt(0) === '?') {
                init = init.slice(1);
            }
            // 按 & 分割成各个键值对
            var pairs = init.split('&');
            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i];
                if (pair === '') continue;
                var idx = pair.indexOf('=');
                var key, value;
                if (idx > -1) {
                    key = pair.substring(0, idx);
                    value = pair.substring(idx + 1);
                } else {
                    key = pair;
                    value = '';
                }
                try {
                    key = decodeURIComponent(key.replace(/\+/g, ' '));
                } catch (e) {
                    // 如果解码失败，原样使用
                }
                try {
                    value = decodeURIComponent(value.replace(/\+/g, ' '));
                } catch (e) {
                    // 如果解码失败，原样使用
                }
                this.append(key, value);
            }
        } else if (typeof init === 'object' && typeof init[Symbol.iterator] === 'function') {
            // 如果是可迭代对象（例如数组），每个元素都必须为 [key, value]
            for (var item of init) {
                if (!Array.isArray(item) || item.length !== 2) {
                    throw new TypeError('Each element of initializer is not an array with 2 elements');
                }
                this.append(item[0], item[1]);
            }
        } else if (typeof init === 'object') {
            // 如果是普通对象，遍历对象的自有属性
            for (var key in init) {
                if (Object.prototype.hasOwnProperty.call(init, key)) {
                    this.append(key, init[key]);
                }
            }
        }
    }

    /**
     * append(name, value)
     * 添加一个新的键值对到内部存储中
     * @param {string} name 
     * @param {string} value 
     */
    URLSearchParams.prototype.append = function (name, value) {
        this._entries.push([String(name), String(value)]);
    };

    /**
     * delete(name)
     * 删除指定 key 对应的所有键值对
     * @param {string} name 
     */
    URLSearchParams.prototype.delete = function (name) {
        name = String(name);
        this._entries = this._entries.filter(function (entry) {
            return entry[0] !== name;
        });
    };

    /**
     * get(name)
     * 返回第一个匹配到的 key 对应的 value，如果不存在则返回 null
     * @param {string} name 
     * @returns {string|null}
     */
    URLSearchParams.prototype.get = function (name) {
        name = String(name);
        for (var i = 0; i < this._entries.length; i++) {
            if (this._entries[i][0] === name) {
                return this._entries[i][1];
            }
        }
        return null;
    };

    /**
     * getAll(name)
     * 返回所有匹配到的 key 对应的 value 数组
     * @param {string} name 
     * @returns {string[]}
     */
    URLSearchParams.prototype.getAll = function (name) {
        name = String(name);
        var values = [];
        for (var i = 0; i < this._entries.length; i++) {
            if (this._entries[i][0] === name) {
                values.push(this._entries[i][1]);
            }
        }
        return values;
    };

    /**
     * has(name)
     * 判断是否存在指定的 key
     * @param {string} name 
     * @returns {boolean}
     */
    URLSearchParams.prototype.has = function (name) {
        return this.get(name) !== null;
    };

    /**
     * set(name, value)
     * 将指定 key 对应的第一个值更新为 value，并删除其它重复的键
     * @param {string} name 
     * @param {string} value 
     */
    URLSearchParams.prototype.set = function (name, value) {
        name = String(name);
        value = String(value);
        var found = false;
        for (var i = 0; i < this._entries.length; i++) {
            if (this._entries[i][0] === name) {
                if (!found) {
                    this._entries[i][1] = value;
                    found = true;
                } else {
                    // 删除其它重复项
                    this._entries.splice(i, 1);
                    i--;
                }
            }
        }
        if (!found) {
            this.append(name, value);
        }
    };

    /**
     * toString()
     * 返回序列化后的查询字符串（编码后的形式）
     * @returns {string}
     */
    URLSearchParams.prototype.toString = function () {
        return this._entries
            .map(function (entry) {
                return encodeURIComponent(entry[0]) + '=' + encodeURIComponent(entry[1]);
            })
            .join('&');
    };

    /**
     * sort()
     * 按照键的字母顺序排序所有的参数
     */
    URLSearchParams.prototype.sort = function () {
        this._entries.sort(function (a, b) {
            if (a[0] < b[0]) return -1;
            if (a[0] > b[0]) return 1;
            return 0;
        });
    };

    /**
     * forEach(callback, [thisArg])
     * 遍历所有的键值对，并执行回调
     */
    URLSearchParams.prototype.forEach = function (callback, thisArg) {
        for (var i = 0; i < this._entries.length; i++) {
            callback.call(thisArg, this._entries[i][1], this._entries[i][0], this);
        }
    };

    // 以下方法实现迭代协议
    URLSearchParams.prototype.keys = function () {
        var keys = [];
        for (var i = 0; i < this._entries.length; i++) {
            keys.push(this._entries[i][0]);
        }
        return keys[Symbol.iterator] ? keys[Symbol.iterator]() : { next: function () { return { done: true }; } };
    };

    URLSearchParams.prototype.values = function () {
        var values = [];
        for (var i = 0; i < this._entries.length; i++) {
            values.push(this._entries[i][1]);
        }
        return values[Symbol.iterator] ? values[Symbol.iterator]() : { next: function () { return { done: true }; } };
    };

    URLSearchParams.prototype.entries = function () {
        var entries = [];
        for (var i = 0; i < this._entries.length; i++) {
            entries.push([this._entries[i][0], this._entries[i][1]]);
        }
        return entries[Symbol.iterator] ? entries[Symbol.iterator]() : { next: function () { return { done: true }; } };
    };

    if (typeof Symbol !== 'undefined' && Symbol.iterator) {
        URLSearchParams.prototype[Symbol.iterator] = URLSearchParams.prototype.entries;
    }

    // 挂载到全局对象上（例如 window、globalThis 或 node 中的 global），并支持 CommonJS 导出
    if (!global.URLSearchParams) {
        global.URLSearchParams = URLSearchParams;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = URLSearchParams;
    }
})(typeof global !== "undefined" ? global : (typeof window !== "undefined" ? window : this));