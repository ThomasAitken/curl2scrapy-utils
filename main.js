(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const curlField = $('#curl');
const scrapyField = $('#scrapy');
const parseField = $('#parse');
const btn = $('#btn');
const hideBtn = $('.hide-me');
const copyBtn = $('.copy-me');

const { ArgumentParser } = require('argparse');
const curlParser = new ArgumentParser({
    description: 'Basic arg parser for curl command'
});
curlParser.add_argument('command')
curlParser.add_argument('url')
curlParser.add_argument('-d', '--data')
curlParser.add_argument('-b', '--data-binary', '--data-raw', { default: null })
curlParser.add_argument('-X', { default: '' })
curlParser.add_argument('-H', '--header', { action: 'append', default: [] })
curlParser.add_argument('--compressed', { action: 'store_true' })
curlParser.add_argument('-k','--insecure', { action: 'store_true' })
curlParser.add_argument('--user', '-u', { default: [] })
curlParser.add_argument('-i','--include', { action: 'store_true' })
curlParser.add_argument('-s','--silent', { action: 'store_true' })

function normaliseNewlines(multilineCurl) {
    return multilineCurl.replace(" \\\n", " ");
}

// Create header from string.
function extractHeader(str){
    return str.split(/: (.+)/)
}

// Extracting cookies from headers
function parseCookies(str){
    if (str == null){return null};
    return str.split(';')
        .map(function(x){return x.split(/=(.+)/)})
        .reduce(function(acc, v){acc[v[0].trim()] = v[1]; return acc}, {})
}

function extractParams(totalUrl) {
    let components = totalUrl.split("?");
    if (components.length === 1) {
        return { url: components[0], params: null};
    }
    let queryString = components[1];
    let paramsObj = {};
    var pairs = queryString.split('&');
    for(const p of pairs){
        let split = p.split('=');
        paramsObj[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
    }
    return {url: components[0], params: paramsObj};
}

function isForm(headers) {
    let contentType = headers['Content-Type'] || headers['content-type'];
    if (contentType === 'application/x-www-form-urlencoded') {
        return true;
    }
    return false;
}

function getCurlObject(curlText){
    let method = "GET";
    let tokens = shlex.split(normaliseNewlines(curlText));
    let parsedArgs = curlParser.parse_args(tokens);
    let totalUrl = extractParams(parsedArgs.url);
    let url = totalUrl.url;
    let params = totalUrl.params;
    let postData = parsedArgs.data || parsedArgs.data_binary;
    if (postData) {
        postData = JSON.parse(postData);
        method = "POST";
    }
    let headers = parsedArgs.header.map(extractHeader).reduce(
        function(acc, v){acc[v[0].trim()] = v[1]; return acc}, {});
    if (headers === {}) {
        headers = null;
    }
    let cookies = parseCookies(headers.Cookie || headers.cookie || null);
    delete headers.Cookie;
    delete headers.cookie;

    let isFormVar = isForm(headers);

    return {
        "url": url,
        "params": params,
        "method": method,
        "data": postData,
        "isForm": isFormVar,
        "headers": headers,
        "cookies": cookies
    }
};

// All together.
function curl2scrapyCode(curlText){
    let curlObject = getCurlObject(curlText);

    let headersText = curlObject.headers ? JSON.stringify(curlObject.headers, null, 4) : null;
    let cookieText = curlObject.cookies ? JSON.stringify(curlObject.cookies, null, 4) : null;
    let dataText = curlObject.data ? JSON.stringify(curlObject.data, null, 4) : null;
    let paramsText = curlObject.params ? JSON.stringify(curlObject.params, null, 4) : null;
    
    let requestText = 'Request';
    let importJson = false;
    if (curlObject.isForm) {
        requestText = 'FormRequest';
    } else {
        if (curlObject.data) {
            importJson = true;
        }
    }

    let result = 'from scrapy.http import [[requestText]]\n'
                + (importJson ? 'import json\n' : '')
                + (paramsText ? 'from urllib.parse import urlencode\n' : '')
                + '\n'
                + (paramsText ? 'base_url = "[[url]]"\n' : 'url = "[[url]]"\n')
                + (paramsText ? '\nparams = [[params]]\n' : '')
                + (headersText ? '\nheaders = [[headers]]\n' : '')
                + (cookieText ? '\ncookies = [[cookies]]\n' : '')
                + (dataText && !curlObject.isForm ? '\npayload = [[data]]\n' : '')
                + (curlObject.isForm ? '\nformdata = [[data]]\n': '')
                + '\nrequest = [[requestText]](\n'
                + (paramsText ? '    url=base_url+"?"+urlencode(params),\n' : '    url=url,\n')
                + '    callback=self.cb_name,\n'
                + (curlObject.method === "POST" ? '    method="POST",\n' : '')
                + (headersText ? '    headers=headers,\n' : '')
                + (cookieText ? '    cookies=cookies,\n' : '')
                + (dataText && !curlObject.isForm ? '    body=json.dumps(payload),\n' : '')
                + (curlObject.isForm ? '    formdata=formdata,\n' : '')
                + ')\n'

    result = result.replace(/\[\[requestText\]\]/g, requestText)
    .replace('[[url]]', curlObject.url)
    .replace('[[params]]', paramsText)
    .replace('[[headers]]', headersText)
    .replace('[[cookies]]', cookieText)
    .replace('[[data]]', dataText)
    .replace('[[method]]', curlObject.method)

    scrapyField.val(result);
};

function curl2scrapyParse(curlText){
    let curlObject = getCurlObject(curlText);

    let headersText = curlObject.headers ? JSON.stringify(curlObject.headers, null) : null;
    let cookieText = curlObject.cookies ? JSON.stringify(curlObject.cookies, null) : null;
    let dataText = curlObject.data ? JSON.stringify(curlObject.data, null) : null;
    let paramsText = curlObject.params ? JSON.stringify(curlObject.params, null) : null;

    let result = 'testmaster parse "[[url]]" '
                + (paramsText ? "--params='[[params]]' ": '')
                + (curlObject.method === "POST" ? '--method=POST ' : '')
                + (curlObject.isForm ? "--form ": '')
                + (headersText ? "--headers='[[headers]]' " : '')
                + (cookieText ? "--cookies='[[cookies]]' " : '')
                + (dataText ? "--data='[[data]]' " : '')
                + '--spider=[SPIDER_NAME] '
                + '-c [CALLBACK_NAME]'

    result = result.replace('[[url]]', curlObject.url)
    result = result.replace('[[params]]', paramsText)
    .replace('[[method]]', curlObject.method)
    .replace('[[headers]]', headersText)
    .replace('[[cookies]]', cookieText)
    .replace('[[data]]', dataText)

    parseField.val(result);
};

// Translate on paste function + callback
function handlePaste (e) {
    var clipboardData, pastedData;

    // Get pasted data via clipboard API
    clipboardData = e.clipboardData || window.clipboardData;
    pastedData = clipboardData.getData('Text');

    curl2scrapyCode(pastedData);
    curl2scrapyParse(pastedData);
}
document.getElementById('curl').addEventListener('paste', handlePaste);

// // Ctrl-Enter pressed
curlField.keydown(function(e) {
  if (e.ctrlKey && e.keyCode == 13) {
    curl2scrapyCode($(this).val());
    curl2scrapyParse($(this).val());
  }
});

// Button click
btn.click(function(e){
    curl2scrapyCode(curlField.val());
    curl2scrapyParse(curlField.val());
});

hideBtn.click(function(e){
    if ($(this).hasAttr("id", "hide-scrapy")) {
        if ($("#form2").hasAttr("hidden")) {
            $("#form2").removeAttr("hidden");
            $("#hide-scrapy").text("hide me");
        } else {
            $("form2").attr("hidden", "");
            $("#hide-scrapy").text("unhide me");
        }
    } else {
        if ($("#form3").hasAttr("hidden")) {
            $("#form3").removeAttr("hidden");
            $("#hide-parse").text("hide me");
        } else {
            $("form3").attr("hidden", "");
            $("#hide-parse").text("unhide me");
        }
    }
});

copyBtn.click(function(e){
    let copyText = "";
    if ($(this).hasAttr("id", "copy-scrapy")) {
        copyText = $("#scrapy").text();
    } else {
        copyText = $("#parse").text();
    }
    copyText.select();
    copyText.setSelectionRange(0, 99999); /* For mobile devices */
    
    navigator.clipboard.writeText(copyText.value);
});

},{"argparse":2}],2:[function(require,module,exports){
(function (process){(function (){
// Port of python's argparse module, version 3.9.0:
// https://github.com/python/cpython/blob/v3.9.0rc1/Lib/argparse.py

'use strict'

// Copyright (C) 2010-2020 Python Software Foundation.
// Copyright (C) 2020 argparse.js authors

/*
 * Command-line parsing library
 *
 * This module is an optparse-inspired command-line parsing library that:
 *
 *     - handles both optional and positional arguments
 *     - produces highly informative usage messages
 *     - supports parsers that dispatch to sub-parsers
 *
 * The following is a simple usage example that sums integers from the
 * command-line and writes the result to a file::
 *
 *     parser = argparse.ArgumentParser(
 *         description='sum the integers at the command line')
 *     parser.add_argument(
 *         'integers', metavar='int', nargs='+', type=int,
 *         help='an integer to be summed')
 *     parser.add_argument(
 *         '--log', default=sys.stdout, type=argparse.FileType('w'),
 *         help='the file where the sum should be written')
 *     args = parser.parse_args()
 *     args.log.write('%s' % sum(args.integers))
 *     args.log.close()
 *
 * The module contains the following public classes:
 *
 *     - ArgumentParser -- The main entry point for command-line parsing. As the
 *         example above shows, the add_argument() method is used to populate
 *         the parser with actions for optional and positional arguments. Then
 *         the parse_args() method is invoked to convert the args at the
 *         command-line into an object with attributes.
 *
 *     - ArgumentError -- The exception raised by ArgumentParser objects when
 *         there are errors with the parser's actions. Errors raised while
 *         parsing the command-line are caught by ArgumentParser and emitted
 *         as command-line messages.
 *
 *     - FileType -- A factory for defining types of files to be created. As the
 *         example above shows, instances of FileType are typically passed as
 *         the type= argument of add_argument() calls.
 *
 *     - Action -- The base class for parser actions. Typically actions are
 *         selected by passing strings like 'store_true' or 'append_const' to
 *         the action= argument of add_argument(). However, for greater
 *         customization of ArgumentParser actions, subclasses of Action may
 *         be defined and passed as the action= argument.
 *
 *     - HelpFormatter, RawDescriptionHelpFormatter, RawTextHelpFormatter,
 *         ArgumentDefaultsHelpFormatter -- Formatter classes which
 *         may be passed as the formatter_class= argument to the
 *         ArgumentParser constructor. HelpFormatter is the default,
 *         RawDescriptionHelpFormatter and RawTextHelpFormatter tell the parser
 *         not to change the formatting for help text, and
 *         ArgumentDefaultsHelpFormatter adds information about argument defaults
 *         to the help.
 *
 * All other classes in this module are considered implementation details.
 * (Also note that HelpFormatter and RawDescriptionHelpFormatter are only
 * considered public as object names -- the API of the formatter objects is
 * still considered an implementation detail.)
 */

const SUPPRESS = '==SUPPRESS=='

const OPTIONAL = '?'
const ZERO_OR_MORE = '*'
const ONE_OR_MORE = '+'
const PARSER = 'A...'
const REMAINDER = '...'
const _UNRECOGNIZED_ARGS_ATTR = '_unrecognized_args'


// ==================================
// Utility functions used for porting
// ==================================
const assert = require('assert')
const util = require('util')
const fs = require('fs')
const sub = require('./lib/sub')
const path = require('path')
const repr = util.inspect

function get_argv() {
    // omit first argument (which is assumed to be interpreter - `node`, `coffee`, `ts-node`, etc.)
    return process.argv.slice(1)
}

function get_terminal_size() {
    return {
        columns: +process.env.COLUMNS || process.stdout.columns || 80
    }
}

function hasattr(object, name) {
    return Object.prototype.hasOwnProperty.call(object, name)
}

function getattr(object, name, value) {
    return hasattr(object, name) ? object[name] : value
}

function setattr(object, name, value) {
    object[name] = value
}

function setdefault(object, name, value) {
    if (!hasattr(object, name)) object[name] = value
    return object[name]
}

function delattr(object, name) {
    delete object[name]
}

function range(from, to, step=1) {
    // range(10) is equivalent to range(0, 10)
    if (arguments.length === 1) [ to, from ] = [ from, 0 ]
    if (typeof from !== 'number' || typeof to !== 'number' || typeof step !== 'number') {
        throw new TypeError('argument cannot be interpreted as an integer')
    }
    if (step === 0) throw new TypeError('range() arg 3 must not be zero')

    let result = []
    if (step > 0) {
        for (let i = from; i < to; i += step) result.push(i)
    } else {
        for (let i = from; i > to; i += step) result.push(i)
    }
    return result
}

function splitlines(str, keepends = false) {
    let result
    if (!keepends) {
        result = str.split(/\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029]/)
    } else {
        result = []
        let parts = str.split(/(\r\n|[\n\r\v\f\x1c\x1d\x1e\x85\u2028\u2029])/)
        for (let i = 0; i < parts.length; i += 2) {
            result.push(parts[i] + (i + 1 < parts.length ? parts[i + 1] : ''))
        }
    }
    if (!result[result.length - 1]) result.pop()
    return result
}

function _string_lstrip(string, prefix_chars) {
    let idx = 0
    while (idx < string.length && prefix_chars.includes(string[idx])) idx++
    return idx ? string.slice(idx) : string
}

function _string_split(string, sep, maxsplit) {
    let result = string.split(sep)
    if (result.length > maxsplit) {
        result = result.slice(0, maxsplit).concat([ result.slice(maxsplit).join(sep) ])
    }
    return result
}

function _array_equal(array1, array2) {
    if (array1.length !== array2.length) return false
    for (let i = 0; i < array1.length; i++) {
        if (array1[i] !== array2[i]) return false
    }
    return true
}

function _array_remove(array, item) {
    let idx = array.indexOf(item)
    if (idx === -1) throw new TypeError(sub('%r not in list', item))
    array.splice(idx, 1)
}

// normalize choices to array;
// this isn't required in python because `in` and `map` operators work with anything,
// but in js dealing with multiple types here is too clunky
function _choices_to_array(choices) {
    if (choices === undefined) {
        return []
    } else if (Array.isArray(choices)) {
        return choices
    } else if (choices !== null && typeof choices[Symbol.iterator] === 'function') {
        return Array.from(choices)
    } else if (typeof choices === 'object' && choices !== null) {
        return Object.keys(choices)
    } else {
        throw new Error(sub('invalid choices value: %r', choices))
    }
}

// decorator that allows a class to be called without new
function _callable(cls) {
    let result = { // object is needed for inferred class name
        [cls.name]: function (...args) {
            let this_class = new.target === result || !new.target
            return Reflect.construct(cls, args, this_class ? cls : new.target)
        }
    }
    result[cls.name].prototype = cls.prototype
    // fix default tag for toString, e.g. [object Action] instead of [object Object]
    cls.prototype[Symbol.toStringTag] = cls.name
    return result[cls.name]
}

function _alias(object, from, to) {
    try {
        let name = object.constructor.name
        Object.defineProperty(object, from, {
            value: util.deprecate(object[to], sub('%s.%s() is renamed to %s.%s()',
                name, from, name, to)),
            enumerable: false
        })
    } catch {}
}

// decorator that allows snake_case class methods to be called with camelCase and vice versa
function _camelcase_alias(_class) {
    for (let name of Object.getOwnPropertyNames(_class.prototype)) {
        let camelcase = name.replace(/\w_[a-z]/g, s => s[0] + s[2].toUpperCase())
        if (camelcase !== name) _alias(_class.prototype, camelcase, name)
    }
    return _class
}

function _to_legacy_name(key) {
    key = key.replace(/\w_[a-z]/g, s => s[0] + s[2].toUpperCase())
    if (key === 'default') key = 'defaultValue'
    if (key === 'const') key = 'constant'
    return key
}

function _to_new_name(key) {
    if (key === 'defaultValue') key = 'default'
    if (key === 'constant') key = 'const'
    key = key.replace(/[A-Z]/g, c => '_' + c.toLowerCase())
    return key
}

// parse options
let no_default = Symbol('no_default_value')
function _parse_opts(args, descriptor) {
    function get_name() {
        let stack = new Error().stack.split('\n')
            .map(x => x.match(/^    at (.*) \(.*\)$/))
            .filter(Boolean)
            .map(m => m[1])
            .map(fn => fn.match(/[^ .]*$/)[0])

        if (stack.length && stack[0] === get_name.name) stack.shift()
        if (stack.length && stack[0] === _parse_opts.name) stack.shift()
        return stack.length ? stack[0] : ''
    }

    args = Array.from(args)
    let kwargs = {}
    let result = []
    let last_opt = args.length && args[args.length - 1]

    if (typeof last_opt === 'object' && last_opt !== null && !Array.isArray(last_opt) &&
        (!last_opt.constructor || last_opt.constructor.name === 'Object')) {
        kwargs = Object.assign({}, args.pop())
    }

    // LEGACY (v1 compatibility): camelcase
    let renames = []
    for (let key of Object.keys(descriptor)) {
        let old_name = _to_legacy_name(key)
        if (old_name !== key && (old_name in kwargs)) {
            if (key in kwargs) {
                // default and defaultValue specified at the same time, happens often in old tests
                //throw new TypeError(sub('%s() got multiple values for argument %r', get_name(), key))
            } else {
                kwargs[key] = kwargs[old_name]
            }
            renames.push([ old_name, key ])
            delete kwargs[old_name]
        }
    }
    if (renames.length) {
        let name = get_name()
        deprecate('camelcase_' + name, sub('%s(): following options are renamed: %s',
            name, renames.map(([ a, b ]) => sub('%r -> %r', a, b))))
    }
    // end

    let missing_positionals = []
    let positional_count = args.length

    for (let [ key, def ] of Object.entries(descriptor)) {
        if (key[0] === '*') {
            if (key.length > 0 && key[1] === '*') {
                // LEGACY (v1 compatibility): camelcase
                let renames = []
                for (let key of Object.keys(kwargs)) {
                    let new_name = _to_new_name(key)
                    if (new_name !== key && (key in kwargs)) {
                        if (new_name in kwargs) {
                            // default and defaultValue specified at the same time, happens often in old tests
                            //throw new TypeError(sub('%s() got multiple values for argument %r', get_name(), new_name))
                        } else {
                            kwargs[new_name] = kwargs[key]
                        }
                        renames.push([ key, new_name ])
                        delete kwargs[key]
                    }
                }
                if (renames.length) {
                    let name = get_name()
                    deprecate('camelcase_' + name, sub('%s(): following options are renamed: %s',
                        name, renames.map(([ a, b ]) => sub('%r -> %r', a, b))))
                }
                // end
                result.push(kwargs)
                kwargs = {}
            } else {
                result.push(args)
                args = []
            }
        } else if (key in kwargs && args.length > 0) {
            throw new TypeError(sub('%s() got multiple values for argument %r', get_name(), key))
        } else if (key in kwargs) {
            result.push(kwargs[key])
            delete kwargs[key]
        } else if (args.length > 0) {
            result.push(args.shift())
        } else if (def !== no_default) {
            result.push(def)
        } else {
            missing_positionals.push(key)
        }
    }

    if (Object.keys(kwargs).length) {
        throw new TypeError(sub('%s() got an unexpected keyword argument %r',
            get_name(), Object.keys(kwargs)[0]))
    }

    if (args.length) {
        let from = Object.entries(descriptor).filter(([ k, v ]) => k[0] !== '*' && v !== no_default).length
        let to = Object.entries(descriptor).filter(([ k ]) => k[0] !== '*').length
        throw new TypeError(sub('%s() takes %s positional argument%s but %s %s given',
            get_name(),
            from === to ? sub('from %s to %s', from, to) : to,
            from === to && to === 1 ? '' : 's',
            positional_count,
            positional_count === 1 ? 'was' : 'were'))
    }

    if (missing_positionals.length) {
        let strs = missing_positionals.map(repr)
        if (strs.length > 1) strs[strs.length - 1] = 'and ' + strs[strs.length - 1]
        let str_joined = strs.join(strs.length === 2 ? '' : ', ')
        throw new TypeError(sub('%s() missing %i required positional argument%s: %s',
            get_name(), strs.length, strs.length === 1 ? '' : 's', str_joined))
    }

    return result
}

let _deprecations = {}
function deprecate(id, string) {
    _deprecations[id] = _deprecations[id] || util.deprecate(() => {}, string)
    _deprecations[id]()
}


// =============================
// Utility functions and classes
// =============================
function _AttributeHolder(cls = Object) {
    /*
     *  Abstract base class that provides __repr__.
     *
     *  The __repr__ method returns a string in the format::
     *      ClassName(attr=name, attr=name, ...)
     *  The attributes are determined either by a class-level attribute,
     *  '_kwarg_names', or by inspecting the instance __dict__.
     */

    return class _AttributeHolder extends cls {
        [util.inspect.custom]() {
            let type_name = this.constructor.name
            let arg_strings = []
            let star_args = {}
            for (let arg of this._get_args()) {
                arg_strings.push(repr(arg))
            }
            for (let [ name, value ] of this._get_kwargs()) {
                if (/^[a-z_][a-z0-9_$]*$/i.test(name)) {
                    arg_strings.push(sub('%s=%r', name, value))
                } else {
                    star_args[name] = value
                }
            }
            if (Object.keys(star_args).length) {
                arg_strings.push(sub('**%s', repr(star_args)))
            }
            return sub('%s(%s)', type_name, arg_strings.join(', '))
        }

        toString() {
            return this[util.inspect.custom]()
        }

        _get_kwargs() {
            return Object.entries(this)
        }

        _get_args() {
            return []
        }
    }
}


function _copy_items(items) {
    if (items === undefined) {
        return []
    }
    return items.slice(0)
}


// ===============
// Formatting Help
// ===============
const HelpFormatter = _camelcase_alias(_callable(class HelpFormatter {
    /*
     *  Formatter for generating usage messages and argument help strings.
     *
     *  Only the name of this class is considered a public API. All the methods
     *  provided by the class are considered an implementation detail.
     */

    constructor() {
        let [
            prog,
            indent_increment,
            max_help_position,
            width
        ] = _parse_opts(arguments, {
            prog: no_default,
            indent_increment: 2,
            max_help_position: 24,
            width: undefined
        })

        // default setting for width
        if (width === undefined) {
            width = get_terminal_size().columns
            width -= 2
        }

        this._prog = prog
        this._indent_increment = indent_increment
        this._max_help_position = Math.min(max_help_position,
                                      Math.max(width - 20, indent_increment * 2))
        this._width = width

        this._current_indent = 0
        this._level = 0
        this._action_max_length = 0

        this._root_section = this._Section(this, undefined)
        this._current_section = this._root_section

        this._whitespace_matcher = /[ \t\n\r\f\v]+/g // equivalent to python /\s+/ with ASCII flag
        this._long_break_matcher = /\n\n\n+/g
    }

    // ===============================
    // Section and indentation methods
    // ===============================
    _indent() {
        this._current_indent += this._indent_increment
        this._level += 1
    }

    _dedent() {
        this._current_indent -= this._indent_increment
        assert(this._current_indent >= 0, 'Indent decreased below 0.')
        this._level -= 1
    }

    _add_item(func, args) {
        this._current_section.items.push([ func, args ])
    }

    // ========================
    // Message building methods
    // ========================
    start_section(heading) {
        this._indent()
        let section = this._Section(this, this._current_section, heading)
        this._add_item(section.format_help.bind(section), [])
        this._current_section = section
    }

    end_section() {
        this._current_section = this._current_section.parent
        this._dedent()
    }

    add_text(text) {
        if (text !== SUPPRESS && text !== undefined) {
            this._add_item(this._format_text.bind(this), [text])
        }
    }

    add_usage(usage, actions, groups, prefix = undefined) {
        if (usage !== SUPPRESS) {
            let args = [ usage, actions, groups, prefix ]
            this._add_item(this._format_usage.bind(this), args)
        }
    }

    add_argument(action) {
        if (action.help !== SUPPRESS) {

            // find all invocations
            let invocations = [this._format_action_invocation(action)]
            for (let subaction of this._iter_indented_subactions(action)) {
                invocations.push(this._format_action_invocation(subaction))
            }

            // update the maximum item length
            let invocation_length = Math.max(...invocations.map(invocation => invocation.length))
            let action_length = invocation_length + this._current_indent
            this._action_max_length = Math.max(this._action_max_length,
                                               action_length)

            // add the item to the list
            this._add_item(this._format_action.bind(this), [action])
        }
    }

    add_arguments(actions) {
        for (let action of actions) {
            this.add_argument(action)
        }
    }

    // =======================
    // Help-formatting methods
    // =======================
    format_help() {
        let help = this._root_section.format_help()
        if (help) {
            help = help.replace(this._long_break_matcher, '\n\n')
            help = help.replace(/^\n+|\n+$/g, '') + '\n'
        }
        return help
    }

    _join_parts(part_strings) {
        return part_strings.filter(part => part && part !== SUPPRESS).join('')
    }

    _format_usage(usage, actions, groups, prefix) {
        if (prefix === undefined) {
            prefix = 'usage: '
        }

        // if usage is specified, use that
        if (usage !== undefined) {
            usage = sub(usage, { prog: this._prog })

        // if no optionals or positionals are available, usage is just prog
        } else if (usage === undefined && !actions.length) {
            usage = sub('%(prog)s', { prog: this._prog })

        // if optionals and positionals are available, calculate usage
        } else if (usage === undefined) {
            let prog = sub('%(prog)s', { prog: this._prog })

            // split optionals from positionals
            let optionals = []
            let positionals = []
            for (let action of actions) {
                if (action.option_strings.length) {
                    optionals.push(action)
                } else {
                    positionals.push(action)
                }
            }

            // build full usage string
            let action_usage = this._format_actions_usage([].concat(optionals).concat(positionals), groups)
            usage = [ prog, action_usage ].map(String).join(' ')

            // wrap the usage parts if it's too long
            let text_width = this._width - this._current_indent
            if (prefix.length + usage.length > text_width) {

                // break usage into wrappable parts
                let part_regexp = /\(.*?\)+(?=\s|$)|\[.*?\]+(?=\s|$)|\S+/g
                let opt_usage = this._format_actions_usage(optionals, groups)
                let pos_usage = this._format_actions_usage(positionals, groups)
                let opt_parts = opt_usage.match(part_regexp) || []
                let pos_parts = pos_usage.match(part_regexp) || []
                assert(opt_parts.join(' ') === opt_usage)
                assert(pos_parts.join(' ') === pos_usage)

                // helper for wrapping lines
                let get_lines = (parts, indent, prefix = undefined) => {
                    let lines = []
                    let line = []
                    let line_len
                    if (prefix !== undefined) {
                        line_len = prefix.length - 1
                    } else {
                        line_len = indent.length - 1
                    }
                    for (let part of parts) {
                        if (line_len + 1 + part.length > text_width && line) {
                            lines.push(indent + line.join(' '))
                            line = []
                            line_len = indent.length - 1
                        }
                        line.push(part)
                        line_len += part.length + 1
                    }
                    if (line.length) {
                        lines.push(indent + line.join(' '))
                    }
                    if (prefix !== undefined) {
                        lines[0] = lines[0].slice(indent.length)
                    }
                    return lines
                }

                let lines

                // if prog is short, follow it with optionals or positionals
                if (prefix.length + prog.length <= 0.75 * text_width) {
                    let indent = ' '.repeat(prefix.length + prog.length + 1)
                    if (opt_parts.length) {
                        lines = get_lines([prog].concat(opt_parts), indent, prefix)
                        lines = lines.concat(get_lines(pos_parts, indent))
                    } else if (pos_parts.length) {
                        lines = get_lines([prog].concat(pos_parts), indent, prefix)
                    } else {
                        lines = [prog]
                    }

                // if prog is long, put it on its own line
                } else {
                    let indent = ' '.repeat(prefix.length)
                    let parts = [].concat(opt_parts).concat(pos_parts)
                    lines = get_lines(parts, indent)
                    if (lines.length > 1) {
                        lines = []
                        lines = lines.concat(get_lines(opt_parts, indent))
                        lines = lines.concat(get_lines(pos_parts, indent))
                    }
                    lines = [prog].concat(lines)
                }

                // join lines into usage
                usage = lines.join('\n')
            }
        }

        // prefix with 'usage:'
        return sub('%s%s\n\n', prefix, usage)
    }

    _format_actions_usage(actions, groups) {
        // find group indices and identify actions in groups
        let group_actions = new Set()
        let inserts = {}
        for (let group of groups) {
            let start = actions.indexOf(group._group_actions[0])
            if (start === -1) {
                continue
            } else {
                let end = start + group._group_actions.length
                if (_array_equal(actions.slice(start, end), group._group_actions)) {
                    for (let action of group._group_actions) {
                        group_actions.add(action)
                    }
                    if (!group.required) {
                        if (start in inserts) {
                            inserts[start] += ' ['
                        } else {
                            inserts[start] = '['
                        }
                        if (end in inserts) {
                            inserts[end] += ']'
                        } else {
                            inserts[end] = ']'
                        }
                    } else {
                        if (start in inserts) {
                            inserts[start] += ' ('
                        } else {
                            inserts[start] = '('
                        }
                        if (end in inserts) {
                            inserts[end] += ')'
                        } else {
                            inserts[end] = ')'
                        }
                    }
                    for (let i of range(start + 1, end)) {
                        inserts[i] = '|'
                    }
                }
            }
        }

        // collect all actions format strings
        let parts = []
        for (let [ i, action ] of Object.entries(actions)) {

            // suppressed arguments are marked with None
            // remove | separators for suppressed arguments
            if (action.help === SUPPRESS) {
                parts.push(undefined)
                if (inserts[+i] === '|') {
                    delete inserts[+i]
                } else if (inserts[+i + 1] === '|') {
                    delete inserts[+i + 1]
                }

            // produce all arg strings
            } else if (!action.option_strings.length) {
                let default_value = this._get_default_metavar_for_positional(action)
                let part = this._format_args(action, default_value)

                // if it's in a group, strip the outer []
                if (group_actions.has(action)) {
                    if (part[0] === '[' && part[part.length - 1] === ']') {
                        part = part.slice(1, -1)
                    }
                }

                // add the action string to the list
                parts.push(part)

            // produce the first way to invoke the option in brackets
            } else {
                let option_string = action.option_strings[0]
                let part

                // if the Optional doesn't take a value, format is:
                //    -s or --long
                if (action.nargs === 0) {
                    part = action.format_usage()

                // if the Optional takes a value, format is:
                //    -s ARGS or --long ARGS
                } else {
                    let default_value = this._get_default_metavar_for_optional(action)
                    let args_string = this._format_args(action, default_value)
                    part = sub('%s %s', option_string, args_string)
                }

                // make it look optional if it's not required or in a group
                if (!action.required && !group_actions.has(action)) {
                    part = sub('[%s]', part)
                }

                // add the action string to the list
                parts.push(part)
            }
        }

        // insert things at the necessary indices
        for (let i of Object.keys(inserts).map(Number).sort((a, b) => b - a)) {
            parts.splice(+i, 0, inserts[+i])
        }

        // join all the action items with spaces
        let text = parts.filter(Boolean).join(' ')

        // clean up separators for mutually exclusive groups
        text = text.replace(/([\[(]) /g, '$1')
        text = text.replace(/ ([\])])/g, '$1')
        text = text.replace(/[\[(] *[\])]/g, '')
        text = text.replace(/\(([^|]*)\)/g, '$1', text)
        text = text.trim()

        // return the text
        return text
    }

    _format_text(text) {
        if (text.includes('%(prog)')) {
            text = sub(text, { prog: this._prog })
        }
        let text_width = Math.max(this._width - this._current_indent, 11)
        let indent = ' '.repeat(this._current_indent)
        return this._fill_text(text, text_width, indent) + '\n\n'
    }

    _format_action(action) {
        // determine the required width and the entry label
        let help_position = Math.min(this._action_max_length + 2,
                                     this._max_help_position)
        let help_width = Math.max(this._width - help_position, 11)
        let action_width = help_position - this._current_indent - 2
        let action_header = this._format_action_invocation(action)
        let indent_first

        // no help; start on same line and add a final newline
        if (!action.help) {
            let tup = [ this._current_indent, '', action_header ]
            action_header = sub('%*s%s\n', ...tup)

        // short action name; start on the same line and pad two spaces
        } else if (action_header.length <= action_width) {
            let tup = [ this._current_indent, '', action_width, action_header ]
            action_header = sub('%*s%-*s  ', ...tup)
            indent_first = 0

        // long action name; start on the next line
        } else {
            let tup = [ this._current_indent, '', action_header ]
            action_header = sub('%*s%s\n', ...tup)
            indent_first = help_position
        }

        // collect the pieces of the action help
        let parts = [action_header]

        // if there was help for the action, add lines of help text
        if (action.help) {
            let help_text = this._expand_help(action)
            let help_lines = this._split_lines(help_text, help_width)
            parts.push(sub('%*s%s\n', indent_first, '', help_lines[0]))
            for (let line of help_lines.slice(1)) {
                parts.push(sub('%*s%s\n', help_position, '', line))
            }

        // or add a newline if the description doesn't end with one
        } else if (!action_header.endsWith('\n')) {
            parts.push('\n')
        }

        // if there are any sub-actions, add their help as well
        for (let subaction of this._iter_indented_subactions(action)) {
            parts.push(this._format_action(subaction))
        }

        // return a single string
        return this._join_parts(parts)
    }

    _format_action_invocation(action) {
        if (!action.option_strings.length) {
            let default_value = this._get_default_metavar_for_positional(action)
            let metavar = this._metavar_formatter(action, default_value)(1)[0]
            return metavar

        } else {
            let parts = []

            // if the Optional doesn't take a value, format is:
            //    -s, --long
            if (action.nargs === 0) {
                parts = parts.concat(action.option_strings)

            // if the Optional takes a value, format is:
            //    -s ARGS, --long ARGS
            } else {
                let default_value = this._get_default_metavar_for_optional(action)
                let args_string = this._format_args(action, default_value)
                for (let option_string of action.option_strings) {
                    parts.push(sub('%s %s', option_string, args_string))
                }
            }

            return parts.join(', ')
        }
    }

    _metavar_formatter(action, default_metavar) {
        let result
        if (action.metavar !== undefined) {
            result = action.metavar
        } else if (action.choices !== undefined) {
            let choice_strs = _choices_to_array(action.choices).map(String)
            result = sub('{%s}', choice_strs.join(','))
        } else {
            result = default_metavar
        }

        function format(tuple_size) {
            if (Array.isArray(result)) {
                return result
            } else {
                return Array(tuple_size).fill(result)
            }
        }
        return format
    }

    _format_args(action, default_metavar) {
        let get_metavar = this._metavar_formatter(action, default_metavar)
        let result
        if (action.nargs === undefined) {
            result = sub('%s', ...get_metavar(1))
        } else if (action.nargs === OPTIONAL) {
            result = sub('[%s]', ...get_metavar(1))
        } else if (action.nargs === ZERO_OR_MORE) {
            let metavar = get_metavar(1)
            if (metavar.length === 2) {
                result = sub('[%s [%s ...]]', ...metavar)
            } else {
                result = sub('[%s ...]', ...metavar)
            }
        } else if (action.nargs === ONE_OR_MORE) {
            result = sub('%s [%s ...]', ...get_metavar(2))
        } else if (action.nargs === REMAINDER) {
            result = '...'
        } else if (action.nargs === PARSER) {
            result = sub('%s ...', ...get_metavar(1))
        } else if (action.nargs === SUPPRESS) {
            result = ''
        } else {
            let formats
            try {
                formats = range(action.nargs).map(() => '%s')
            } catch (err) {
                throw new TypeError('invalid nargs value')
            }
            result = sub(formats.join(' '), ...get_metavar(action.nargs))
        }
        return result
    }

    _expand_help(action) {
        let params = Object.assign({ prog: this._prog }, action)
        for (let name of Object.keys(params)) {
            if (params[name] === SUPPRESS) {
                delete params[name]
            }
        }
        for (let name of Object.keys(params)) {
            if (params[name] && params[name].name) {
                params[name] = params[name].name
            }
        }
        if (params.choices !== undefined) {
            let choices_str = _choices_to_array(params.choices).map(String).join(', ')
            params.choices = choices_str
        }
        // LEGACY (v1 compatibility): camelcase
        for (let key of Object.keys(params)) {
            let old_name = _to_legacy_name(key)
            if (old_name !== key) {
                params[old_name] = params[key]
            }
        }
        // end
        return sub(this._get_help_string(action), params)
    }

    * _iter_indented_subactions(action) {
        if (typeof action._get_subactions === 'function') {
            this._indent()
            yield* action._get_subactions()
            this._dedent()
        }
    }

    _split_lines(text, width) {
        text = text.replace(this._whitespace_matcher, ' ').trim()
        // The textwrap module is used only for formatting help.
        // Delay its import for speeding up the common usage of argparse.
        let textwrap = require('./lib/textwrap')
        return textwrap.wrap(text, { width })
    }

    _fill_text(text, width, indent) {
        text = text.replace(this._whitespace_matcher, ' ').trim()
        let textwrap = require('./lib/textwrap')
        return textwrap.fill(text, { width,
                                     initial_indent: indent,
                                     subsequent_indent: indent })
    }

    _get_help_string(action) {
        return action.help
    }

    _get_default_metavar_for_optional(action) {
        return action.dest.toUpperCase()
    }

    _get_default_metavar_for_positional(action) {
        return action.dest
    }
}))

HelpFormatter.prototype._Section = _callable(class _Section {

    constructor(formatter, parent, heading = undefined) {
        this.formatter = formatter
        this.parent = parent
        this.heading = heading
        this.items = []
    }

    format_help() {
        // format the indented section
        if (this.parent !== undefined) {
            this.formatter._indent()
        }
        let item_help = this.formatter._join_parts(this.items.map(([ func, args ]) => func.apply(null, args)))
        if (this.parent !== undefined) {
            this.formatter._dedent()
        }

        // return nothing if the section was empty
        if (!item_help) {
            return ''
        }

        // add the heading if the section was non-empty
        let heading
        if (this.heading !== SUPPRESS && this.heading !== undefined) {
            let current_indent = this.formatter._current_indent
            heading = sub('%*s%s:\n', current_indent, '', this.heading)
        } else {
            heading = ''
        }

        // join the section-initial newline, the heading and the help
        return this.formatter._join_parts(['\n', heading, item_help, '\n'])
    }
})


const RawDescriptionHelpFormatter = _camelcase_alias(_callable(class RawDescriptionHelpFormatter extends HelpFormatter {
    /*
     *  Help message formatter which retains any formatting in descriptions.
     *
     *  Only the name of this class is considered a public API. All the methods
     *  provided by the class are considered an implementation detail.
     */

    _fill_text(text, width, indent) {
        return splitlines(text, true).map(line => indent + line).join('')
    }
}))


const RawTextHelpFormatter = _camelcase_alias(_callable(class RawTextHelpFormatter extends RawDescriptionHelpFormatter {
    /*
     *  Help message formatter which retains formatting of all help text.
     *
     *  Only the name of this class is considered a public API. All the methods
     *  provided by the class are considered an implementation detail.
     */

    _split_lines(text/*, width*/) {
        return splitlines(text)
    }
}))


const ArgumentDefaultsHelpFormatter = _camelcase_alias(_callable(class ArgumentDefaultsHelpFormatter extends HelpFormatter {
    /*
     *  Help message formatter which adds default values to argument help.
     *
     *  Only the name of this class is considered a public API. All the methods
     *  provided by the class are considered an implementation detail.
     */

    _get_help_string(action) {
        let help = action.help
        // LEGACY (v1 compatibility): additional check for defaultValue needed
        if (!action.help.includes('%(default)') && !action.help.includes('%(defaultValue)')) {
            if (action.default !== SUPPRESS) {
                let defaulting_nargs = [OPTIONAL, ZERO_OR_MORE]
                if (action.option_strings.length || defaulting_nargs.includes(action.nargs)) {
                    help += ' (default: %(default)s)'
                }
            }
        }
        return help
    }
}))


const MetavarTypeHelpFormatter = _camelcase_alias(_callable(class MetavarTypeHelpFormatter extends HelpFormatter {
    /*
     *  Help message formatter which uses the argument 'type' as the default
     *  metavar value (instead of the argument 'dest')
     *
     *  Only the name of this class is considered a public API. All the methods
     *  provided by the class are considered an implementation detail.
     */

    _get_default_metavar_for_optional(action) {
        return typeof action.type === 'function' ? action.type.name : action.type
    }

    _get_default_metavar_for_positional(action) {
        return typeof action.type === 'function' ? action.type.name : action.type
    }
}))


// =====================
// Options and Arguments
// =====================
function _get_action_name(argument) {
    if (argument === undefined) {
        return undefined
    } else if (argument.option_strings.length) {
        return argument.option_strings.join('/')
    } else if (![ undefined, SUPPRESS ].includes(argument.metavar)) {
        return argument.metavar
    } else if (![ undefined, SUPPRESS ].includes(argument.dest)) {
        return argument.dest
    } else {
        return undefined
    }
}


const ArgumentError = _callable(class ArgumentError extends Error {
    /*
     *  An error from creating or using an argument (optional or positional).
     *
     *  The string value of this exception is the message, augmented with
     *  information about the argument that caused it.
     */

    constructor(argument, message) {
        super()
        this.name = 'ArgumentError'
        this._argument_name = _get_action_name(argument)
        this._message = message
        this.message = this.str()
    }

    str() {
        let format
        if (this._argument_name === undefined) {
            format = '%(message)s'
        } else {
            format = 'argument %(argument_name)s: %(message)s'
        }
        return sub(format, { message: this._message,
                             argument_name: this._argument_name })
    }
})


const ArgumentTypeError = _callable(class ArgumentTypeError extends Error {
    /*
     * An error from trying to convert a command line string to a type.
     */

    constructor(message) {
        super(message)
        this.name = 'ArgumentTypeError'
    }
})


// ==============
// Action classes
// ==============
const Action = _camelcase_alias(_callable(class Action extends _AttributeHolder(Function) {
    /*
     *  Information about how to convert command line strings to Python objects.
     *
     *  Action objects are used by an ArgumentParser to represent the information
     *  needed to parse a single argument from one or more strings from the
     *  command line. The keyword arguments to the Action constructor are also
     *  all attributes of Action instances.
     *
     *  Keyword Arguments:
     *
     *      - option_strings -- A list of command-line option strings which
     *          should be associated with this action.
     *
     *      - dest -- The name of the attribute to hold the created object(s)
     *
     *      - nargs -- The number of command-line arguments that should be
     *          consumed. By default, one argument will be consumed and a single
     *          value will be produced.  Other values include:
     *              - N (an integer) consumes N arguments (and produces a list)
     *              - '?' consumes zero or one arguments
     *              - '*' consumes zero or more arguments (and produces a list)
     *              - '+' consumes one or more arguments (and produces a list)
     *          Note that the difference between the default and nargs=1 is that
     *          with the default, a single value will be produced, while with
     *          nargs=1, a list containing a single value will be produced.
     *
     *      - const -- The value to be produced if the option is specified and the
     *          option uses an action that takes no values.
     *
     *      - default -- The value to be produced if the option is not specified.
     *
     *      - type -- A callable that accepts a single string argument, and
     *          returns the converted value.  The standard Python types str, int,
     *          float, and complex are useful examples of such callables.  If None,
     *          str is used.
     *
     *      - choices -- A container of values that should be allowed. If not None,
     *          after a command-line argument has been converted to the appropriate
     *          type, an exception will be raised if it is not a member of this
     *          collection.
     *
     *      - required -- True if the action must always be specified at the
     *          command line. This is only meaningful for optional command-line
     *          arguments.
     *
     *      - help -- The help string describing the argument.
     *
     *      - metavar -- The name to be used for the option's argument with the
     *          help string. If None, the 'dest' value will be used as the name.
     */

    constructor() {
        let [
            option_strings,
            dest,
            nargs,
            const_value,
            default_value,
            type,
            choices,
            required,
            help,
            metavar
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            nargs: undefined,
            const: undefined,
            default: undefined,
            type: undefined,
            choices: undefined,
            required: false,
            help: undefined,
            metavar: undefined
        })

        // when this class is called as a function, redirect it to .call() method of itself
        super('return arguments.callee.call.apply(arguments.callee, arguments)')

        this.option_strings = option_strings
        this.dest = dest
        this.nargs = nargs
        this.const = const_value
        this.default = default_value
        this.type = type
        this.choices = choices
        this.required = required
        this.help = help
        this.metavar = metavar
    }

    _get_kwargs() {
        let names = [
            'option_strings',
            'dest',
            'nargs',
            'const',
            'default',
            'type',
            'choices',
            'help',
            'metavar'
        ]
        return names.map(name => [ name, getattr(this, name) ])
    }

    format_usage() {
        return this.option_strings[0]
    }

    call(/*parser, namespace, values, option_string = undefined*/) {
        throw new Error('.call() not defined')
    }
}))


const BooleanOptionalAction = _camelcase_alias(_callable(class BooleanOptionalAction extends Action {

    constructor() {
        let [
            option_strings,
            dest,
            default_value,
            type,
            choices,
            required,
            help,
            metavar
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            default: undefined,
            type: undefined,
            choices: undefined,
            required: false,
            help: undefined,
            metavar: undefined
        })

        let _option_strings = []
        for (let option_string of option_strings) {
            _option_strings.push(option_string)

            if (option_string.startsWith('--')) {
                option_string = '--no-' + option_string.slice(2)
                _option_strings.push(option_string)
            }
        }

        if (help !== undefined && default_value !== undefined) {
            help += ` (default: ${default_value})`
        }

        super({
            option_strings: _option_strings,
            dest,
            nargs: 0,
            default: default_value,
            type,
            choices,
            required,
            help,
            metavar
        })
    }

    call(parser, namespace, values, option_string = undefined) {
        if (this.option_strings.includes(option_string)) {
            setattr(namespace, this.dest, !option_string.startsWith('--no-'))
        }
    }

    format_usage() {
        return this.option_strings.join(' | ')
    }
}))


const _StoreAction = _callable(class _StoreAction extends Action {

    constructor() {
        let [
            option_strings,
            dest,
            nargs,
            const_value,
            default_value,
            type,
            choices,
            required,
            help,
            metavar
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            nargs: undefined,
            const: undefined,
            default: undefined,
            type: undefined,
            choices: undefined,
            required: false,
            help: undefined,
            metavar: undefined
        })

        if (nargs === 0) {
            throw new TypeError('nargs for store actions must be != 0; if you ' +
                        'have nothing to store, actions such as store ' +
                        'true or store const may be more appropriate')
        }
        if (const_value !== undefined && nargs !== OPTIONAL) {
            throw new TypeError(sub('nargs must be %r to supply const', OPTIONAL))
        }
        super({
            option_strings,
            dest,
            nargs,
            const: const_value,
            default: default_value,
            type,
            choices,
            required,
            help,
            metavar
        })
    }

    call(parser, namespace, values/*, option_string = undefined*/) {
        setattr(namespace, this.dest, values)
    }
})


const _StoreConstAction = _callable(class _StoreConstAction extends Action {

    constructor() {
        let [
            option_strings,
            dest,
            const_value,
            default_value,
            required,
            help
            //, metavar
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            const: no_default,
            default: undefined,
            required: false,
            help: undefined,
            metavar: undefined
        })

        super({
            option_strings,
            dest,
            nargs: 0,
            const: const_value,
            default: default_value,
            required,
            help
        })
    }

    call(parser, namespace/*, values, option_string = undefined*/) {
        setattr(namespace, this.dest, this.const)
    }
})


const _StoreTrueAction = _callable(class _StoreTrueAction extends _StoreConstAction {

    constructor() {
        let [
            option_strings,
            dest,
            default_value,
            required,
            help
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            default: false,
            required: false,
            help: undefined
        })

        super({
            option_strings,
            dest,
            const: true,
            default: default_value,
            required,
            help
        })
    }
})


const _StoreFalseAction = _callable(class _StoreFalseAction extends _StoreConstAction {

    constructor() {
        let [
            option_strings,
            dest,
            default_value,
            required,
            help
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            default: true,
            required: false,
            help: undefined
        })

        super({
            option_strings,
            dest,
            const: false,
            default: default_value,
            required,
            help
        })
    }
})


const _AppendAction = _callable(class _AppendAction extends Action {

    constructor() {
        let [
            option_strings,
            dest,
            nargs,
            const_value,
            default_value,
            type,
            choices,
            required,
            help,
            metavar
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            nargs: undefined,
            const: undefined,
            default: undefined,
            type: undefined,
            choices: undefined,
            required: false,
            help: undefined,
            metavar: undefined
        })

        if (nargs === 0) {
            throw new TypeError('nargs for append actions must be != 0; if arg ' +
                        'strings are not supplying the value to append, ' +
                        'the append const action may be more appropriate')
        }
        if (const_value !== undefined && nargs !== OPTIONAL) {
            throw new TypeError(sub('nargs must be %r to supply const', OPTIONAL))
        }
        super({
            option_strings,
            dest,
            nargs,
            const: const_value,
            default: default_value,
            type,
            choices,
            required,
            help,
            metavar
        })
    }

    call(parser, namespace, values/*, option_string = undefined*/) {
        let items = getattr(namespace, this.dest, undefined)
        items = _copy_items(items)
        items.push(values)
        setattr(namespace, this.dest, items)
    }
})


const _AppendConstAction = _callable(class _AppendConstAction extends Action {

    constructor() {
        let [
            option_strings,
            dest,
            const_value,
            default_value,
            required,
            help,
            metavar
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            const: no_default,
            default: undefined,
            required: false,
            help: undefined,
            metavar: undefined
        })

        super({
            option_strings,
            dest,
            nargs: 0,
            const: const_value,
            default: default_value,
            required,
            help,
            metavar
        })
    }

    call(parser, namespace/*, values, option_string = undefined*/) {
        let items = getattr(namespace, this.dest, undefined)
        items = _copy_items(items)
        items.push(this.const)
        setattr(namespace, this.dest, items)
    }
})


const _CountAction = _callable(class _CountAction extends Action {

    constructor() {
        let [
            option_strings,
            dest,
            default_value,
            required,
            help
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: no_default,
            default: undefined,
            required: false,
            help: undefined
        })

        super({
            option_strings,
            dest,
            nargs: 0,
            default: default_value,
            required,
            help
        })
    }

    call(parser, namespace/*, values, option_string = undefined*/) {
        let count = getattr(namespace, this.dest, undefined)
        if (count === undefined) {
            count = 0
        }
        setattr(namespace, this.dest, count + 1)
    }
})


const _HelpAction = _callable(class _HelpAction extends Action {

    constructor() {
        let [
            option_strings,
            dest,
            default_value,
            help
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            dest: SUPPRESS,
            default: SUPPRESS,
            help: undefined
        })

        super({
            option_strings,
            dest,
            default: default_value,
            nargs: 0,
            help
        })
    }

    call(parser/*, namespace, values, option_string = undefined*/) {
        parser.print_help()
        parser.exit()
    }
})


const _VersionAction = _callable(class _VersionAction extends Action {

    constructor() {
        let [
            option_strings,
            version,
            dest,
            default_value,
            help
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            version: undefined,
            dest: SUPPRESS,
            default: SUPPRESS,
            help: "show program's version number and exit"
        })

        super({
            option_strings,
            dest,
            default: default_value,
            nargs: 0,
            help
        })
        this.version = version
    }

    call(parser/*, namespace, values, option_string = undefined*/) {
        let version = this.version
        if (version === undefined) {
            version = parser.version
        }
        let formatter = parser._get_formatter()
        formatter.add_text(version)
        parser._print_message(formatter.format_help(), process.stdout)
        parser.exit()
    }
})


const _SubParsersAction = _camelcase_alias(_callable(class _SubParsersAction extends Action {

    constructor() {
        let [
            option_strings,
            prog,
            parser_class,
            dest,
            required,
            help,
            metavar
        ] = _parse_opts(arguments, {
            option_strings: no_default,
            prog: no_default,
            parser_class: no_default,
            dest: SUPPRESS,
            required: false,
            help: undefined,
            metavar: undefined
        })

        let name_parser_map = {}

        super({
            option_strings,
            dest,
            nargs: PARSER,
            choices: name_parser_map,
            required,
            help,
            metavar
        })

        this._prog_prefix = prog
        this._parser_class = parser_class
        this._name_parser_map = name_parser_map
        this._choices_actions = []
    }

    add_parser() {
        let [
            name,
            kwargs
        ] = _parse_opts(arguments, {
            name: no_default,
            '**kwargs': no_default
        })

        // set prog from the existing prefix
        if (kwargs.prog === undefined) {
            kwargs.prog = sub('%s %s', this._prog_prefix, name)
        }

        let aliases = getattr(kwargs, 'aliases', [])
        delete kwargs.aliases

        // create a pseudo-action to hold the choice help
        if ('help' in kwargs) {
            let help = kwargs.help
            delete kwargs.help
            let choice_action = this._ChoicesPseudoAction(name, aliases, help)
            this._choices_actions.push(choice_action)
        }

        // create the parser and add it to the map
        let parser = new this._parser_class(kwargs)
        this._name_parser_map[name] = parser

        // make parser available under aliases also
        for (let alias of aliases) {
            this._name_parser_map[alias] = parser
        }

        return parser
    }

    _get_subactions() {
        return this._choices_actions
    }

    call(parser, namespace, values/*, option_string = undefined*/) {
        let parser_name = values[0]
        let arg_strings = values.slice(1)

        // set the parser name if requested
        if (this.dest !== SUPPRESS) {
            setattr(namespace, this.dest, parser_name)
        }

        // select the parser
        if (hasattr(this._name_parser_map, parser_name)) {
            parser = this._name_parser_map[parser_name]
        } else {
            let args = {parser_name,
                        choices: this._name_parser_map.join(', ')}
            let msg = sub('unknown parser %(parser_name)r (choices: %(choices)s)', args)
            throw new ArgumentError(this, msg)
        }

        // parse all the remaining options into the namespace
        // store any unrecognized options on the object, so that the top
        // level parser can decide what to do with them

        // In case this subparser defines new defaults, we parse them
        // in a new namespace object and then update the original
        // namespace for the relevant parts.
        let subnamespace
        [ subnamespace, arg_strings ] = parser.parse_known_args(arg_strings, undefined)
        for (let [ key, value ] of Object.entries(subnamespace)) {
            setattr(namespace, key, value)
        }

        if (arg_strings.length) {
            setdefault(namespace, _UNRECOGNIZED_ARGS_ATTR, [])
            getattr(namespace, _UNRECOGNIZED_ARGS_ATTR).push(...arg_strings)
        }
    }
}))


_SubParsersAction.prototype._ChoicesPseudoAction = _callable(class _ChoicesPseudoAction extends Action {
    constructor(name, aliases, help) {
        let metavar = name, dest = name
        if (aliases.length) {
            metavar += sub(' (%s)', aliases.join(', '))
        }
        super({ option_strings: [], dest, help, metavar })
    }
})


const _ExtendAction = _callable(class _ExtendAction extends _AppendAction {
    call(parser, namespace, values/*, option_string = undefined*/) {
        let items = getattr(namespace, this.dest, undefined)
        items = _copy_items(items)
        items = items.concat(values)
        setattr(namespace, this.dest, items)
    }
})


// ==============
// Type classes
// ==============
const FileType = _callable(class FileType extends Function {
    /*
     *  Factory for creating file object types
     *
     *  Instances of FileType are typically passed as type= arguments to the
     *  ArgumentParser add_argument() method.
     *
     *  Keyword Arguments:
     *      - mode -- A string indicating how the file is to be opened. Accepts the
     *          same values as the builtin open() function.
     *      - bufsize -- The file's desired buffer size. Accepts the same values as
     *          the builtin open() function.
     *      - encoding -- The file's encoding. Accepts the same values as the
     *          builtin open() function.
     *      - errors -- A string indicating how encoding and decoding errors are to
     *          be handled. Accepts the same value as the builtin open() function.
     */

    constructor() {
        let [
            flags,
            encoding,
            mode,
            autoClose,
            emitClose,
            start,
            end,
            highWaterMark,
            fs
        ] = _parse_opts(arguments, {
            flags: 'r',
            encoding: undefined,
            mode: undefined, // 0o666
            autoClose: undefined, // true
            emitClose: undefined, // false
            start: undefined, // 0
            end: undefined, // Infinity
            highWaterMark: undefined, // 64 * 1024
            fs: undefined
        })

        // when this class is called as a function, redirect it to .call() method of itself
        super('return arguments.callee.call.apply(arguments.callee, arguments)')

        Object.defineProperty(this, 'name', {
            get() {
                return sub('FileType(%r)', flags)
            }
        })
        this._flags = flags
        this._options = {}
        if (encoding !== undefined) this._options.encoding = encoding
        if (mode !== undefined) this._options.mode = mode
        if (autoClose !== undefined) this._options.autoClose = autoClose
        if (emitClose !== undefined) this._options.emitClose = emitClose
        if (start !== undefined) this._options.start = start
        if (end !== undefined) this._options.end = end
        if (highWaterMark !== undefined) this._options.highWaterMark = highWaterMark
        if (fs !== undefined) this._options.fs = fs
    }

    call(string) {
        // the special argument "-" means sys.std{in,out}
        if (string === '-') {
            if (this._flags.includes('r')) {
                return process.stdin
            } else if (this._flags.includes('w')) {
                return process.stdout
            } else {
                let msg = sub('argument "-" with mode %r', this._flags)
                throw new TypeError(msg)
            }
        }

        // all other arguments are used as file names
        let fd
        try {
            fd = fs.openSync(string, this._flags, this._options.mode)
        } catch (e) {
            let args = { filename: string, error: e.message }
            let message = "can't open '%(filename)s': %(error)s"
            throw new ArgumentTypeError(sub(message, args))
        }

        let options = Object.assign({ fd, flags: this._flags }, this._options)
        if (this._flags.includes('r')) {
            return fs.createReadStream(undefined, options)
        } else if (this._flags.includes('w')) {
            return fs.createWriteStream(undefined, options)
        } else {
            let msg = sub('argument "%s" with mode %r', string, this._flags)
            throw new TypeError(msg)
        }
    }

    [util.inspect.custom]() {
        let args = [ this._flags ]
        let kwargs = Object.entries(this._options).map(([ k, v ]) => {
            if (k === 'mode') v = { value: v, [util.inspect.custom]() { return '0o' + this.value.toString(8) } }
            return [ k, v ]
        })
        let args_str = []
                .concat(args.filter(arg => arg !== -1).map(repr))
                .concat(kwargs.filter(([/*kw*/, arg]) => arg !== undefined)
                    .map(([kw, arg]) => sub('%s=%r', kw, arg)))
                .join(', ')
        return sub('%s(%s)', this.constructor.name, args_str)
    }

    toString() {
        return this[util.inspect.custom]()
    }
})

// ===========================
// Optional and Positional Parsing
// ===========================
const Namespace = _callable(class Namespace extends _AttributeHolder() {
    /*
     *  Simple object for storing attributes.
     *
     *  Implements equality by attribute names and values, and provides a simple
     *  string representation.
     */

    constructor(options = {}) {
        super()
        Object.assign(this, options)
    }
})

// unset string tag to mimic plain object
Namespace.prototype[Symbol.toStringTag] = undefined


const _ActionsContainer = _camelcase_alias(_callable(class _ActionsContainer {

    constructor() {
        let [
            description,
            prefix_chars,
            argument_default,
            conflict_handler
        ] = _parse_opts(arguments, {
            description: no_default,
            prefix_chars: no_default,
            argument_default: no_default,
            conflict_handler: no_default
        })

        this.description = description
        this.argument_default = argument_default
        this.prefix_chars = prefix_chars
        this.conflict_handler = conflict_handler

        // set up registries
        this._registries = {}

        // register actions
        this.register('action', undefined, _StoreAction)
        this.register('action', 'store', _StoreAction)
        this.register('action', 'store_const', _StoreConstAction)
        this.register('action', 'store_true', _StoreTrueAction)
        this.register('action', 'store_false', _StoreFalseAction)
        this.register('action', 'append', _AppendAction)
        this.register('action', 'append_const', _AppendConstAction)
        this.register('action', 'count', _CountAction)
        this.register('action', 'help', _HelpAction)
        this.register('action', 'version', _VersionAction)
        this.register('action', 'parsers', _SubParsersAction)
        this.register('action', 'extend', _ExtendAction)
        // LEGACY (v1 compatibility): camelcase variants
        ;[ 'storeConst', 'storeTrue', 'storeFalse', 'appendConst' ].forEach(old_name => {
            let new_name = _to_new_name(old_name)
            this.register('action', old_name, util.deprecate(this._registry_get('action', new_name),
                sub('{action: "%s"} is renamed to {action: "%s"}', old_name, new_name)))
        })
        // end

        // raise an exception if the conflict handler is invalid
        this._get_handler()

        // action storage
        this._actions = []
        this._option_string_actions = {}

        // groups
        this._action_groups = []
        this._mutually_exclusive_groups = []

        // defaults storage
        this._defaults = {}

        // determines whether an "option" looks like a negative number
        this._negative_number_matcher = /^-\d+$|^-\d*\.\d+$/

        // whether or not there are any optionals that look like negative
        // numbers -- uses a list so it can be shared and edited
        this._has_negative_number_optionals = []
    }

    // ====================
    // Registration methods
    // ====================
    register(registry_name, value, object) {
        let registry = setdefault(this._registries, registry_name, {})
        registry[value] = object
    }

    _registry_get(registry_name, value, default_value = undefined) {
        return getattr(this._registries[registry_name], value, default_value)
    }

    // ==================================
    // Namespace default accessor methods
    // ==================================
    set_defaults(kwargs) {
        Object.assign(this._defaults, kwargs)

        // if these defaults match any existing arguments, replace
        // the previous default on the object with the new one
        for (let action of this._actions) {
            if (action.dest in kwargs) {
                action.default = kwargs[action.dest]
            }
        }
    }

    get_default(dest) {
        for (let action of this._actions) {
            if (action.dest === dest && action.default !== undefined) {
                return action.default
            }
        }
        return this._defaults[dest]
    }


    // =======================
    // Adding argument actions
    // =======================
    add_argument() {
        /*
         *  add_argument(dest, ..., name=value, ...)
         *  add_argument(option_string, option_string, ..., name=value, ...)
         */
        let [
            args,
            kwargs
        ] = _parse_opts(arguments, {
            '*args': no_default,
            '**kwargs': no_default
        })
        // LEGACY (v1 compatibility), old-style add_argument([ args ], { options })
        if (args.length === 1 && Array.isArray(args[0])) {
            args = args[0]
            deprecate('argument-array',
                sub('use add_argument(%(args)s, {...}) instead of add_argument([ %(args)s ], { ... })', {
                    args: args.map(repr).join(', ')
                }))
        }
        // end

        // if no positional args are supplied or only one is supplied and
        // it doesn't look like an option string, parse a positional
        // argument
        let chars = this.prefix_chars
        if (!args.length || args.length === 1 && !chars.includes(args[0][0])) {
            if (args.length && 'dest' in kwargs) {
                throw new TypeError('dest supplied twice for positional argument')
            }
            kwargs = this._get_positional_kwargs(...args, kwargs)

        // otherwise, we're adding an optional argument
        } else {
            kwargs = this._get_optional_kwargs(...args, kwargs)
        }

        // if no default was supplied, use the parser-level default
        if (!('default' in kwargs)) {
            let dest = kwargs.dest
            if (dest in this._defaults) {
                kwargs.default = this._defaults[dest]
            } else if (this.argument_default !== undefined) {
                kwargs.default = this.argument_default
            }
        }

        // create the action object, and add it to the parser
        let action_class = this._pop_action_class(kwargs)
        if (typeof action_class !== 'function') {
            throw new TypeError(sub('unknown action "%s"', action_class))
        }
        // eslint-disable-next-line new-cap
        let action = new action_class(kwargs)

        // raise an error if the action type is not callable
        let type_func = this._registry_get('type', action.type, action.type)
        if (typeof type_func !== 'function') {
            throw new TypeError(sub('%r is not callable', type_func))
        }

        if (type_func === FileType) {
            throw new TypeError(sub('%r is a FileType class object, instance of it' +
                                    ' must be passed', type_func))
        }

        // raise an error if the metavar does not match the type
        if ('_get_formatter' in this) {
            try {
                this._get_formatter()._format_args(action, undefined)
            } catch (err) {
                // check for 'invalid nargs value' is an artifact of TypeError and ValueError in js being the same
                if (err instanceof TypeError && err.message !== 'invalid nargs value') {
                    throw new TypeError('length of metavar tuple does not match nargs')
                } else {
                    throw err
                }
            }
        }

        return this._add_action(action)
    }

    add_argument_group() {
        let group = _ArgumentGroup(this, ...arguments)
        this._action_groups.push(group)
        return group
    }

    add_mutually_exclusive_group() {
        // eslint-disable-next-line no-use-before-define
        let group = _MutuallyExclusiveGroup(this, ...arguments)
        this._mutually_exclusive_groups.push(group)
        return group
    }

    _add_action(action) {
        // resolve any conflicts
        this._check_conflict(action)

        // add to actions list
        this._actions.push(action)
        action.container = this

        // index the action by any option strings it has
        for (let option_string of action.option_strings) {
            this._option_string_actions[option_string] = action
        }

        // set the flag if any option strings look like negative numbers
        for (let option_string of action.option_strings) {
            if (this._negative_number_matcher.test(option_string)) {
                if (!this._has_negative_number_optionals.length) {
                    this._has_negative_number_optionals.push(true)
                }
            }
        }

        // return the created action
        return action
    }

    _remove_action(action) {
        _array_remove(this._actions, action)
    }

    _add_container_actions(container) {
        // collect groups by titles
        let title_group_map = {}
        for (let group of this._action_groups) {
            if (group.title in title_group_map) {
                let msg = 'cannot merge actions - two groups are named %r'
                throw new TypeError(sub(msg, group.title))
            }
            title_group_map[group.title] = group
        }

        // map each action to its group
        let group_map = new Map()
        for (let group of container._action_groups) {

            // if a group with the title exists, use that, otherwise
            // create a new group matching the container's group
            if (!(group.title in title_group_map)) {
                title_group_map[group.title] = this.add_argument_group({
                    title: group.title,
                    description: group.description,
                    conflict_handler: group.conflict_handler
                })
            }

            // map the actions to their new group
            for (let action of group._group_actions) {
                group_map.set(action, title_group_map[group.title])
            }
        }

        // add container's mutually exclusive groups
        // NOTE: if add_mutually_exclusive_group ever gains title= and
        // description= then this code will need to be expanded as above
        for (let group of container._mutually_exclusive_groups) {
            let mutex_group = this.add_mutually_exclusive_group({
                required: group.required
            })

            // map the actions to their new mutex group
            for (let action of group._group_actions) {
                group_map.set(action, mutex_group)
            }
        }

        // add all actions to this container or their group
        for (let action of container._actions) {
            group_map.get(action)._add_action(action)
        }
    }

    _get_positional_kwargs() {
        let [
            dest,
            kwargs
        ] = _parse_opts(arguments, {
            dest: no_default,
            '**kwargs': no_default
        })

        // make sure required is not specified
        if ('required' in kwargs) {
            let msg = "'required' is an invalid argument for positionals"
            throw new TypeError(msg)
        }

        // mark positional arguments as required if at least one is
        // always required
        if (![OPTIONAL, ZERO_OR_MORE].includes(kwargs.nargs)) {
            kwargs.required = true
        }
        if (kwargs.nargs === ZERO_OR_MORE && !('default' in kwargs)) {
            kwargs.required = true
        }

        // return the keyword arguments with no option strings
        return Object.assign(kwargs, { dest, option_strings: [] })
    }

    _get_optional_kwargs() {
        let [
            args,
            kwargs
        ] = _parse_opts(arguments, {
            '*args': no_default,
            '**kwargs': no_default
        })

        // determine short and long option strings
        let option_strings = []
        let long_option_strings = []
        let option_string
        for (option_string of args) {
            // error on strings that don't start with an appropriate prefix
            if (!this.prefix_chars.includes(option_string[0])) {
                let args = {option: option_string,
                            prefix_chars: this.prefix_chars}
                let msg = 'invalid option string %(option)r: ' +
                          'must start with a character %(prefix_chars)r'
                throw new TypeError(sub(msg, args))
            }

            // strings starting with two prefix characters are long options
            option_strings.push(option_string)
            if (option_string.length > 1 && this.prefix_chars.includes(option_string[1])) {
                long_option_strings.push(option_string)
            }
        }

        // infer destination, '--foo-bar' -> 'foo_bar' and '-x' -> 'x'
        let dest = kwargs.dest
        delete kwargs.dest
        if (dest === undefined) {
            let dest_option_string
            if (long_option_strings.length) {
                dest_option_string = long_option_strings[0]
            } else {
                dest_option_string = option_strings[0]
            }
            dest = _string_lstrip(dest_option_string, this.prefix_chars)
            if (!dest) {
                let msg = 'dest= is required for options like %r'
                throw new TypeError(sub(msg, option_string))
            }
            dest = dest.replace(/-/g, '_')
        }

        // return the updated keyword arguments
        return Object.assign(kwargs, { dest, option_strings })
    }

    _pop_action_class(kwargs, default_value = undefined) {
        let action = getattr(kwargs, 'action', default_value)
        delete kwargs.action
        return this._registry_get('action', action, action)
    }

    _get_handler() {
        // determine function from conflict handler string
        let handler_func_name = sub('_handle_conflict_%s', this.conflict_handler)
        if (typeof this[handler_func_name] === 'function') {
            return this[handler_func_name]
        } else {
            let msg = 'invalid conflict_resolution value: %r'
            throw new TypeError(sub(msg, this.conflict_handler))
        }
    }

    _check_conflict(action) {

        // find all options that conflict with this option
        let confl_optionals = []
        for (let option_string of action.option_strings) {
            if (hasattr(this._option_string_actions, option_string)) {
                let confl_optional = this._option_string_actions[option_string]
                confl_optionals.push([ option_string, confl_optional ])
            }
        }

        // resolve any conflicts
        if (confl_optionals.length) {
            let conflict_handler = this._get_handler()
            conflict_handler.call(this, action, confl_optionals)
        }
    }

    _handle_conflict_error(action, conflicting_actions) {
        let message = conflicting_actions.length === 1 ?
            'conflicting option string: %s' :
            'conflicting option strings: %s'
        let conflict_string = conflicting_actions.map(([ option_string/*, action*/ ]) => option_string).join(', ')
        throw new ArgumentError(action, sub(message, conflict_string))
    }

    _handle_conflict_resolve(action, conflicting_actions) {

        // remove all conflicting options
        for (let [ option_string, action ] of conflicting_actions) {

            // remove the conflicting option
            _array_remove(action.option_strings, option_string)
            delete this._option_string_actions[option_string]

            // if the option now has no option string, remove it from the
            // container holding it
            if (!action.option_strings.length) {
                action.container._remove_action(action)
            }
        }
    }
}))


const _ArgumentGroup = _callable(class _ArgumentGroup extends _ActionsContainer {

    constructor() {
        let [
            container,
            title,
            description,
            kwargs
        ] = _parse_opts(arguments, {
            container: no_default,
            title: undefined,
            description: undefined,
            '**kwargs': no_default
        })

        // add any missing keyword arguments by checking the container
        setdefault(kwargs, 'conflict_handler', container.conflict_handler)
        setdefault(kwargs, 'prefix_chars', container.prefix_chars)
        setdefault(kwargs, 'argument_default', container.argument_default)
        super(Object.assign({ description }, kwargs))

        // group attributes
        this.title = title
        this._group_actions = []

        // share most attributes with the container
        this._registries = container._registries
        this._actions = container._actions
        this._option_string_actions = container._option_string_actions
        this._defaults = container._defaults
        this._has_negative_number_optionals =
            container._has_negative_number_optionals
        this._mutually_exclusive_groups = container._mutually_exclusive_groups
    }

    _add_action(action) {
        action = super._add_action(action)
        this._group_actions.push(action)
        return action
    }

    _remove_action(action) {
        super._remove_action(action)
        _array_remove(this._group_actions, action)
    }
})


const _MutuallyExclusiveGroup = _callable(class _MutuallyExclusiveGroup extends _ArgumentGroup {

    constructor() {
        let [
            container,
            required
        ] = _parse_opts(arguments, {
            container: no_default,
            required: false
        })

        super(container)
        this.required = required
        this._container = container
    }

    _add_action(action) {
        if (action.required) {
            let msg = 'mutually exclusive arguments must be optional'
            throw new TypeError(msg)
        }
        action = this._container._add_action(action)
        this._group_actions.push(action)
        return action
    }

    _remove_action(action) {
        this._container._remove_action(action)
        _array_remove(this._group_actions, action)
    }
})


const ArgumentParser = _camelcase_alias(_callable(class ArgumentParser extends _AttributeHolder(_ActionsContainer) {
    /*
     *  Object for parsing command line strings into Python objects.
     *
     *  Keyword Arguments:
     *      - prog -- The name of the program (default: sys.argv[0])
     *      - usage -- A usage message (default: auto-generated from arguments)
     *      - description -- A description of what the program does
     *      - epilog -- Text following the argument descriptions
     *      - parents -- Parsers whose arguments should be copied into this one
     *      - formatter_class -- HelpFormatter class for printing help messages
     *      - prefix_chars -- Characters that prefix optional arguments
     *      - fromfile_prefix_chars -- Characters that prefix files containing
     *          additional arguments
     *      - argument_default -- The default value for all arguments
     *      - conflict_handler -- String indicating how to handle conflicts
     *      - add_help -- Add a -h/-help option
     *      - allow_abbrev -- Allow long options to be abbreviated unambiguously
     *      - exit_on_error -- Determines whether or not ArgumentParser exits with
     *          error info when an error occurs
     */

    constructor() {
        let [
            prog,
            usage,
            description,
            epilog,
            parents,
            formatter_class,
            prefix_chars,
            fromfile_prefix_chars,
            argument_default,
            conflict_handler,
            add_help,
            allow_abbrev,
            exit_on_error,
            debug, // LEGACY (v1 compatibility), debug mode
            version // LEGACY (v1 compatibility), version
        ] = _parse_opts(arguments, {
            prog: undefined,
            usage: undefined,
            description: undefined,
            epilog: undefined,
            parents: [],
            formatter_class: HelpFormatter,
            prefix_chars: '-',
            fromfile_prefix_chars: undefined,
            argument_default: undefined,
            conflict_handler: 'error',
            add_help: true,
            allow_abbrev: true,
            exit_on_error: true,
            debug: undefined, // LEGACY (v1 compatibility), debug mode
            version: undefined // LEGACY (v1 compatibility), version
        })

        // LEGACY (v1 compatibility)
        if (debug !== undefined) {
            deprecate('debug',
                'The "debug" argument to ArgumentParser is deprecated. Please ' +
                'override ArgumentParser.exit function instead.'
            )
        }

        if (version !== undefined) {
            deprecate('version',
                'The "version" argument to ArgumentParser is deprecated. Please use ' +
                "add_argument(..., { action: 'version', version: 'N', ... }) instead."
            )
        }
        // end

        super({
            description,
            prefix_chars,
            argument_default,
            conflict_handler
        })

        // default setting for prog
        if (prog === undefined) {
            prog = path.basename(get_argv()[0] || '')
        }

        this.prog = prog
        this.usage = usage
        this.epilog = epilog
        this.formatter_class = formatter_class
        this.fromfile_prefix_chars = fromfile_prefix_chars
        this.add_help = add_help
        this.allow_abbrev = allow_abbrev
        this.exit_on_error = exit_on_error
        // LEGACY (v1 compatibility), debug mode
        this.debug = debug
        // end

        this._positionals = this.add_argument_group('positional arguments')
        this._optionals = this.add_argument_group('optional arguments')
        this._subparsers = undefined

        // register types
        function identity(string) {
            return string
        }
        this.register('type', undefined, identity)
        this.register('type', null, identity)
        this.register('type', 'auto', identity)
        this.register('type', 'int', function (x) {
            let result = Number(x)
            if (!Number.isInteger(result)) {
                throw new TypeError(sub('could not convert string to int: %r', x))
            }
            return result
        })
        this.register('type', 'float', function (x) {
            let result = Number(x)
            if (isNaN(result)) {
                throw new TypeError(sub('could not convert string to float: %r', x))
            }
            return result
        })
        this.register('type', 'str', String)
        // LEGACY (v1 compatibility): custom types
        this.register('type', 'string',
            util.deprecate(String, 'use {type:"str"} or {type:String} instead of {type:"string"}'))
        // end

        // add help argument if necessary
        // (using explicit default to override global argument_default)
        let default_prefix = prefix_chars.includes('-') ? '-' : prefix_chars[0]
        if (this.add_help) {
            this.add_argument(
                default_prefix + 'h',
                default_prefix.repeat(2) + 'help',
                {
                    action: 'help',
                    default: SUPPRESS,
                    help: 'show this help message and exit'
                }
            )
        }
        // LEGACY (v1 compatibility), version
        if (version) {
            this.add_argument(
                default_prefix + 'v',
                default_prefix.repeat(2) + 'version',
                {
                    action: 'version',
                    default: SUPPRESS,
                    version: this.version,
                    help: "show program's version number and exit"
                }
            )
        }
        // end

        // add parent arguments and defaults
        for (let parent of parents) {
            this._add_container_actions(parent)
            Object.assign(this._defaults, parent._defaults)
        }
    }

    // =======================
    // Pretty __repr__ methods
    // =======================
    _get_kwargs() {
        let names = [
            'prog',
            'usage',
            'description',
            'formatter_class',
            'conflict_handler',
            'add_help'
        ]
        return names.map(name => [ name, getattr(this, name) ])
    }

    // ==================================
    // Optional/Positional adding methods
    // ==================================
    add_subparsers() {
        let [
            kwargs
        ] = _parse_opts(arguments, {
            '**kwargs': no_default
        })

        if (this._subparsers !== undefined) {
            this.error('cannot have multiple subparser arguments')
        }

        // add the parser class to the arguments if it's not present
        setdefault(kwargs, 'parser_class', this.constructor)

        if ('title' in kwargs || 'description' in kwargs) {
            let title = getattr(kwargs, 'title', 'subcommands')
            let description = getattr(kwargs, 'description', undefined)
            delete kwargs.title
            delete kwargs.description
            this._subparsers = this.add_argument_group(title, description)
        } else {
            this._subparsers = this._positionals
        }

        // prog defaults to the usage message of this parser, skipping
        // optional arguments and with no "usage:" prefix
        if (kwargs.prog === undefined) {
            let formatter = this._get_formatter()
            let positionals = this._get_positional_actions()
            let groups = this._mutually_exclusive_groups
            formatter.add_usage(this.usage, positionals, groups, '')
            kwargs.prog = formatter.format_help().trim()
        }

        // create the parsers action and add it to the positionals list
        let parsers_class = this._pop_action_class(kwargs, 'parsers')
        // eslint-disable-next-line new-cap
        let action = new parsers_class(Object.assign({ option_strings: [] }, kwargs))
        this._subparsers._add_action(action)

        // return the created parsers action
        return action
    }

    _add_action(action) {
        if (action.option_strings.length) {
            this._optionals._add_action(action)
        } else {
            this._positionals._add_action(action)
        }
        return action
    }

    _get_optional_actions() {
        return this._actions.filter(action => action.option_strings.length)
    }

    _get_positional_actions() {
        return this._actions.filter(action => !action.option_strings.length)
    }

    // =====================================
    // Command line argument parsing methods
    // =====================================
    parse_args(args = undefined, namespace = undefined) {
        let argv
        [ args, argv ] = this.parse_known_args(args, namespace)
        if (argv && argv.length > 0) {
            let msg = 'unrecognized arguments: %s'
            this.error(sub(msg, argv.join(' ')))
        }
        return args
    }

    parse_known_args(args = undefined, namespace = undefined) {
        if (args === undefined) {
            args = get_argv().slice(1)
        }

        // default Namespace built from parser defaults
        if (namespace === undefined) {
            namespace = new Namespace()
        }

        // add any action defaults that aren't present
        for (let action of this._actions) {
            if (action.dest !== SUPPRESS) {
                if (!hasattr(namespace, action.dest)) {
                    if (action.default !== SUPPRESS) {
                        setattr(namespace, action.dest, action.default)
                    }
                }
            }
        }

        // add any parser defaults that aren't present
        for (let dest of Object.keys(this._defaults)) {
            if (!hasattr(namespace, dest)) {
                setattr(namespace, dest, this._defaults[dest])
            }
        }

        // parse the arguments and exit if there are any errors
        if (this.exit_on_error) {
            try {
                [ namespace, args ] = this._parse_known_args(args, namespace)
            } catch (err) {
                if (err instanceof ArgumentError) {
                    this.error(err.message)
                } else {
                    throw err
                }
            }
        } else {
            [ namespace, args ] = this._parse_known_args(args, namespace)
        }

        if (hasattr(namespace, _UNRECOGNIZED_ARGS_ATTR)) {
            args = args.concat(getattr(namespace, _UNRECOGNIZED_ARGS_ATTR))
            delattr(namespace, _UNRECOGNIZED_ARGS_ATTR)
        }

        return [ namespace, args ]
    }

    _parse_known_args(arg_strings, namespace) {
        // replace arg strings that are file references
        if (this.fromfile_prefix_chars !== undefined) {
            arg_strings = this._read_args_from_files(arg_strings)
        }

        // map all mutually exclusive arguments to the other arguments
        // they can't occur with
        let action_conflicts = new Map()
        for (let mutex_group of this._mutually_exclusive_groups) {
            let group_actions = mutex_group._group_actions
            for (let [ i, mutex_action ] of Object.entries(mutex_group._group_actions)) {
                let conflicts = action_conflicts.get(mutex_action) || []
                conflicts = conflicts.concat(group_actions.slice(0, +i))
                conflicts = conflicts.concat(group_actions.slice(+i + 1))
                action_conflicts.set(mutex_action, conflicts)
            }
        }

        // find all option indices, and determine the arg_string_pattern
        // which has an 'O' if there is an option at an index,
        // an 'A' if there is an argument, or a '-' if there is a '--'
        let option_string_indices = {}
        let arg_string_pattern_parts = []
        let arg_strings_iter = Object.entries(arg_strings)[Symbol.iterator]()
        for (let [ i, arg_string ] of arg_strings_iter) {

            // all args after -- are non-options
            if (arg_string === '--') {
                arg_string_pattern_parts.push('-')
                for ([ i, arg_string ] of arg_strings_iter) {
                    arg_string_pattern_parts.push('A')
                }

            // otherwise, add the arg to the arg strings
            // and note the index if it was an option
            } else {
                let option_tuple = this._parse_optional(arg_string)
                let pattern
                if (option_tuple === undefined) {
                    pattern = 'A'
                } else {
                    option_string_indices[i] = option_tuple
                    pattern = 'O'
                }
                arg_string_pattern_parts.push(pattern)
            }
        }

        // join the pieces together to form the pattern
        let arg_strings_pattern = arg_string_pattern_parts.join('')

        // converts arg strings to the appropriate and then takes the action
        let seen_actions = new Set()
        let seen_non_default_actions = new Set()
        let extras

        let take_action = (action, argument_strings, option_string = undefined) => {
            seen_actions.add(action)
            let argument_values = this._get_values(action, argument_strings)

            // error if this argument is not allowed with other previously
            // seen arguments, assuming that actions that use the default
            // value don't really count as "present"
            if (argument_values !== action.default) {
                seen_non_default_actions.add(action)
                for (let conflict_action of action_conflicts.get(action) || []) {
                    if (seen_non_default_actions.has(conflict_action)) {
                        let msg = 'not allowed with argument %s'
                        let action_name = _get_action_name(conflict_action)
                        throw new ArgumentError(action, sub(msg, action_name))
                    }
                }
            }

            // take the action if we didn't receive a SUPPRESS value
            // (e.g. from a default)
            if (argument_values !== SUPPRESS) {
                action(this, namespace, argument_values, option_string)
            }
        }

        // function to convert arg_strings into an optional action
        let consume_optional = start_index => {

            // get the optional identified at this index
            let option_tuple = option_string_indices[start_index]
            let [ action, option_string, explicit_arg ] = option_tuple

            // identify additional optionals in the same arg string
            // (e.g. -xyz is the same as -x -y -z if no args are required)
            let action_tuples = []
            let stop
            for (;;) {

                // if we found no optional action, skip it
                if (action === undefined) {
                    extras.push(arg_strings[start_index])
                    return start_index + 1
                }

                // if there is an explicit argument, try to match the
                // optional's string arguments to only this
                if (explicit_arg !== undefined) {
                    let arg_count = this._match_argument(action, 'A')

                    // if the action is a single-dash option and takes no
                    // arguments, try to parse more single-dash options out
                    // of the tail of the option string
                    let chars = this.prefix_chars
                    if (arg_count === 0 && !chars.includes(option_string[1])) {
                        action_tuples.push([ action, [], option_string ])
                        let char = option_string[0]
                        option_string = char + explicit_arg[0]
                        let new_explicit_arg = explicit_arg.slice(1) || undefined
                        let optionals_map = this._option_string_actions
                        if (hasattr(optionals_map, option_string)) {
                            action = optionals_map[option_string]
                            explicit_arg = new_explicit_arg
                        } else {
                            let msg = 'ignored explicit argument %r'
                            throw new ArgumentError(action, sub(msg, explicit_arg))
                        }

                    // if the action expect exactly one argument, we've
                    // successfully matched the option; exit the loop
                    } else if (arg_count === 1) {
                        stop = start_index + 1
                        let args = [ explicit_arg ]
                        action_tuples.push([ action, args, option_string ])
                        break

                    // error if a double-dash option did not use the
                    // explicit argument
                    } else {
                        let msg = 'ignored explicit argument %r'
                        throw new ArgumentError(action, sub(msg, explicit_arg))
                    }

                // if there is no explicit argument, try to match the
                // optional's string arguments with the following strings
                // if successful, exit the loop
                } else {
                    let start = start_index + 1
                    let selected_patterns = arg_strings_pattern.slice(start)
                    let arg_count = this._match_argument(action, selected_patterns)
                    stop = start + arg_count
                    let args = arg_strings.slice(start, stop)
                    action_tuples.push([ action, args, option_string ])
                    break
                }
            }

            // add the Optional to the list and return the index at which
            // the Optional's string args stopped
            assert(action_tuples.length)
            for (let [ action, args, option_string ] of action_tuples) {
                take_action(action, args, option_string)
            }
            return stop
        }

        // the list of Positionals left to be parsed; this is modified
        // by consume_positionals()
        let positionals = this._get_positional_actions()

        // function to convert arg_strings into positional actions
        let consume_positionals = start_index => {
            // match as many Positionals as possible
            let selected_pattern = arg_strings_pattern.slice(start_index)
            let arg_counts = this._match_arguments_partial(positionals, selected_pattern)

            // slice off the appropriate arg strings for each Positional
            // and add the Positional and its args to the list
            for (let i = 0; i < positionals.length && i < arg_counts.length; i++) {
                let action = positionals[i]
                let arg_count = arg_counts[i]
                let args = arg_strings.slice(start_index, start_index + arg_count)
                start_index += arg_count
                take_action(action, args)
            }

            // slice off the Positionals that we just parsed and return the
            // index at which the Positionals' string args stopped
            positionals = positionals.slice(arg_counts.length)
            return start_index
        }

        // consume Positionals and Optionals alternately, until we have
        // passed the last option string
        extras = []
        let start_index = 0
        let max_option_string_index = Math.max(-1, ...Object.keys(option_string_indices).map(Number))
        while (start_index <= max_option_string_index) {

            // consume any Positionals preceding the next option
            let next_option_string_index = Math.min(
                // eslint-disable-next-line no-loop-func
                ...Object.keys(option_string_indices).map(Number).filter(index => index >= start_index)
            )
            if (start_index !== next_option_string_index) {
                let positionals_end_index = consume_positionals(start_index)

                // only try to parse the next optional if we didn't consume
                // the option string during the positionals parsing
                if (positionals_end_index > start_index) {
                    start_index = positionals_end_index
                    continue
                } else {
                    start_index = positionals_end_index
                }
            }

            // if we consumed all the positionals we could and we're not
            // at the index of an option string, there were extra arguments
            if (!(start_index in option_string_indices)) {
                let strings = arg_strings.slice(start_index, next_option_string_index)
                extras = extras.concat(strings)
                start_index = next_option_string_index
            }

            // consume the next optional and any arguments for it
            start_index = consume_optional(start_index)
        }

        // consume any positionals following the last Optional
        let stop_index = consume_positionals(start_index)

        // if we didn't consume all the argument strings, there were extras
        extras = extras.concat(arg_strings.slice(stop_index))

        // make sure all required actions were present and also convert
        // action defaults which were not given as arguments
        let required_actions = []
        for (let action of this._actions) {
            if (!seen_actions.has(action)) {
                if (action.required) {
                    required_actions.push(_get_action_name(action))
                } else {
                    // Convert action default now instead of doing it before
                    // parsing arguments to avoid calling convert functions
                    // twice (which may fail) if the argument was given, but
                    // only if it was defined already in the namespace
                    if (action.default !== undefined &&
                        typeof action.default === 'string' &&
                        hasattr(namespace, action.dest) &&
                        action.default === getattr(namespace, action.dest)) {
                        setattr(namespace, action.dest,
                                this._get_value(action, action.default))
                    }
                }
            }
        }

        if (required_actions.length) {
            this.error(sub('the following arguments are required: %s',
                       required_actions.join(', ')))
        }

        // make sure all required groups had one option present
        for (let group of this._mutually_exclusive_groups) {
            if (group.required) {
                let no_actions_used = true
                for (let action of group._group_actions) {
                    if (seen_non_default_actions.has(action)) {
                        no_actions_used = false
                        break
                    }
                }

                // if no actions were used, report the error
                if (no_actions_used) {
                    let names = group._group_actions
                        .filter(action => action.help !== SUPPRESS)
                        .map(action => _get_action_name(action))
                    let msg = 'one of the arguments %s is required'
                    this.error(sub(msg, names.join(' ')))
                }
            }
        }

        // return the updated namespace and the extra arguments
        return [ namespace, extras ]
    }

    _read_args_from_files(arg_strings) {
        // expand arguments referencing files
        let new_arg_strings = []
        for (let arg_string of arg_strings) {

            // for regular arguments, just add them back into the list
            if (!arg_string || !this.fromfile_prefix_chars.includes(arg_string[0])) {
                new_arg_strings.push(arg_string)

            // replace arguments referencing files with the file content
            } else {
                try {
                    let args_file = fs.readFileSync(arg_string.slice(1), 'utf8')
                    let arg_strings = []
                    for (let arg_line of splitlines(args_file)) {
                        for (let arg of this.convert_arg_line_to_args(arg_line)) {
                            arg_strings.push(arg)
                        }
                    }
                    arg_strings = this._read_args_from_files(arg_strings)
                    new_arg_strings = new_arg_strings.concat(arg_strings)
                } catch (err) {
                    this.error(err.message)
                }
            }
        }

        // return the modified argument list
        return new_arg_strings
    }

    convert_arg_line_to_args(arg_line) {
        return [arg_line]
    }

    _match_argument(action, arg_strings_pattern) {
        // match the pattern for this action to the arg strings
        let nargs_pattern = this._get_nargs_pattern(action)
        let match = arg_strings_pattern.match(new RegExp('^' + nargs_pattern))

        // raise an exception if we weren't able to find a match
        if (match === null) {
            let nargs_errors = {
                undefined: 'expected one argument',
                [OPTIONAL]: 'expected at most one argument',
                [ONE_OR_MORE]: 'expected at least one argument'
            }
            let msg = nargs_errors[action.nargs]
            if (msg === undefined) {
                msg = sub(action.nargs === 1 ? 'expected %s argument' : 'expected %s arguments', action.nargs)
            }
            throw new ArgumentError(action, msg)
        }

        // return the number of arguments matched
        return match[1].length
    }

    _match_arguments_partial(actions, arg_strings_pattern) {
        // progressively shorten the actions list by slicing off the
        // final actions until we find a match
        let result = []
        for (let i of range(actions.length, 0, -1)) {
            let actions_slice = actions.slice(0, i)
            let pattern = actions_slice.map(action => this._get_nargs_pattern(action)).join('')
            let match = arg_strings_pattern.match(new RegExp('^' + pattern))
            if (match !== null) {
                result = result.concat(match.slice(1).map(string => string.length))
                break
            }
        }

        // return the list of arg string counts
        return result
    }

    _parse_optional(arg_string) {
        // if it's an empty string, it was meant to be a positional
        if (!arg_string) {
            return undefined
        }

        // if it doesn't start with a prefix, it was meant to be positional
        if (!this.prefix_chars.includes(arg_string[0])) {
            return undefined
        }

        // if the option string is present in the parser, return the action
        if (arg_string in this._option_string_actions) {
            let action = this._option_string_actions[arg_string]
            return [ action, arg_string, undefined ]
        }

        // if it's just a single character, it was meant to be positional
        if (arg_string.length === 1) {
            return undefined
        }

        // if the option string before the "=" is present, return the action
        if (arg_string.includes('=')) {
            let [ option_string, explicit_arg ] = _string_split(arg_string, '=', 1)
            if (option_string in this._option_string_actions) {
                let action = this._option_string_actions[option_string]
                return [ action, option_string, explicit_arg ]
            }
        }

        // search through all possible prefixes of the option string
        // and all actions in the parser for possible interpretations
        let option_tuples = this._get_option_tuples(arg_string)

        // if multiple actions match, the option string was ambiguous
        if (option_tuples.length > 1) {
            let options = option_tuples.map(([ /*action*/, option_string/*, explicit_arg*/ ]) => option_string).join(', ')
            let args = {option: arg_string, matches: options}
            let msg = 'ambiguous option: %(option)s could match %(matches)s'
            this.error(sub(msg, args))

        // if exactly one action matched, this segmentation is good,
        // so return the parsed action
        } else if (option_tuples.length === 1) {
            let [ option_tuple ] = option_tuples
            return option_tuple
        }

        // if it was not found as an option, but it looks like a negative
        // number, it was meant to be positional
        // unless there are negative-number-like options
        if (this._negative_number_matcher.test(arg_string)) {
            if (!this._has_negative_number_optionals.length) {
                return undefined
            }
        }

        // if it contains a space, it was meant to be a positional
        if (arg_string.includes(' ')) {
            return undefined
        }

        // it was meant to be an optional but there is no such option
        // in this parser (though it might be a valid option in a subparser)
        return [ undefined, arg_string, undefined ]
    }

    _get_option_tuples(option_string) {
        let result = []

        // option strings starting with two prefix characters are only
        // split at the '='
        let chars = this.prefix_chars
        if (chars.includes(option_string[0]) && chars.includes(option_string[1])) {
            if (this.allow_abbrev) {
                let option_prefix, explicit_arg
                if (option_string.includes('=')) {
                    [ option_prefix, explicit_arg ] = _string_split(option_string, '=', 1)
                } else {
                    option_prefix = option_string
                    explicit_arg = undefined
                }
                for (let option_string of Object.keys(this._option_string_actions)) {
                    if (option_string.startsWith(option_prefix)) {
                        let action = this._option_string_actions[option_string]
                        let tup = [ action, option_string, explicit_arg ]
                        result.push(tup)
                    }
                }
            }

        // single character options can be concatenated with their arguments
        // but multiple character options always have to have their argument
        // separate
        } else if (chars.includes(option_string[0]) && !chars.includes(option_string[1])) {
            let option_prefix = option_string
            let explicit_arg = undefined
            let short_option_prefix = option_string.slice(0, 2)
            let short_explicit_arg = option_string.slice(2)

            for (let option_string of Object.keys(this._option_string_actions)) {
                if (option_string === short_option_prefix) {
                    let action = this._option_string_actions[option_string]
                    let tup = [ action, option_string, short_explicit_arg ]
                    result.push(tup)
                } else if (option_string.startsWith(option_prefix)) {
                    let action = this._option_string_actions[option_string]
                    let tup = [ action, option_string, explicit_arg ]
                    result.push(tup)
                }
            }

        // shouldn't ever get here
        } else {
            this.error(sub('unexpected option string: %s', option_string))
        }

        // return the collected option tuples
        return result
    }

    _get_nargs_pattern(action) {
        // in all examples below, we have to allow for '--' args
        // which are represented as '-' in the pattern
        let nargs = action.nargs
        let nargs_pattern

        // the default (None) is assumed to be a single argument
        if (nargs === undefined) {
            nargs_pattern = '(-*A-*)'

        // allow zero or one arguments
        } else if (nargs === OPTIONAL) {
            nargs_pattern = '(-*A?-*)'

        // allow zero or more arguments
        } else if (nargs === ZERO_OR_MORE) {
            nargs_pattern = '(-*[A-]*)'

        // allow one or more arguments
        } else if (nargs === ONE_OR_MORE) {
            nargs_pattern = '(-*A[A-]*)'

        // allow any number of options or arguments
        } else if (nargs === REMAINDER) {
            nargs_pattern = '([-AO]*)'

        // allow one argument followed by any number of options or arguments
        } else if (nargs === PARSER) {
            nargs_pattern = '(-*A[-AO]*)'

        // suppress action, like nargs=0
        } else if (nargs === SUPPRESS) {
            nargs_pattern = '(-*-*)'

        // all others should be integers
        } else {
            nargs_pattern = sub('(-*%s-*)', 'A'.repeat(nargs).split('').join('-*'))
        }

        // if this is an optional action, -- is not allowed
        if (action.option_strings.length) {
            nargs_pattern = nargs_pattern.replace(/-\*/g, '')
            nargs_pattern = nargs_pattern.replace(/-/g, '')
        }

        // return the pattern
        return nargs_pattern
    }

    // ========================
    // Alt command line argument parsing, allowing free intermix
    // ========================

    parse_intermixed_args(args = undefined, namespace = undefined) {
        let argv
        [ args, argv ] = this.parse_known_intermixed_args(args, namespace)
        if (argv.length) {
            let msg = 'unrecognized arguments: %s'
            this.error(sub(msg, argv.join(' ')))
        }
        return args
    }

    parse_known_intermixed_args(args = undefined, namespace = undefined) {
        // returns a namespace and list of extras
        //
        // positional can be freely intermixed with optionals.  optionals are
        // first parsed with all positional arguments deactivated.  The 'extras'
        // are then parsed.  If the parser definition is incompatible with the
        // intermixed assumptions (e.g. use of REMAINDER, subparsers) a
        // TypeError is raised.
        //
        // positionals are 'deactivated' by setting nargs and default to
        // SUPPRESS.  This blocks the addition of that positional to the
        // namespace

        let extras
        let positionals = this._get_positional_actions()
        let a = positionals.filter(action => [ PARSER, REMAINDER ].includes(action.nargs))
        if (a.length) {
            throw new TypeError(sub('parse_intermixed_args: positional arg' +
                                    ' with nargs=%s', a[0].nargs))
        }

        for (let group of this._mutually_exclusive_groups) {
            for (let action of group._group_actions) {
                if (positionals.includes(action)) {
                    throw new TypeError('parse_intermixed_args: positional in' +
                                        ' mutuallyExclusiveGroup')
                }
            }
        }

        let save_usage
        try {
            save_usage = this.usage
            let remaining_args
            try {
                if (this.usage === undefined) {
                    // capture the full usage for use in error messages
                    this.usage = this.format_usage().slice(7)
                }
                for (let action of positionals) {
                    // deactivate positionals
                    action.save_nargs = action.nargs
                    // action.nargs = 0
                    action.nargs = SUPPRESS
                    action.save_default = action.default
                    action.default = SUPPRESS
                }
                [ namespace, remaining_args ] = this.parse_known_args(args,
                                                                      namespace)
                for (let action of positionals) {
                    // remove the empty positional values from namespace
                    let attr = getattr(namespace, action.dest)
                    if (Array.isArray(attr) && attr.length === 0) {
                        // eslint-disable-next-line no-console
                        console.warn(sub('Do not expect %s in %s', action.dest, namespace))
                        delattr(namespace, action.dest)
                    }
                }
            } finally {
                // restore nargs and usage before exiting
                for (let action of positionals) {
                    action.nargs = action.save_nargs
                    action.default = action.save_default
                }
            }
            let optionals = this._get_optional_actions()
            try {
                // parse positionals.  optionals aren't normally required, but
                // they could be, so make sure they aren't.
                for (let action of optionals) {
                    action.save_required = action.required
                    action.required = false
                }
                for (let group of this._mutually_exclusive_groups) {
                    group.save_required = group.required
                    group.required = false
                }
                [ namespace, extras ] = this.parse_known_args(remaining_args,
                                                              namespace)
            } finally {
                // restore parser values before exiting
                for (let action of optionals) {
                    action.required = action.save_required
                }
                for (let group of this._mutually_exclusive_groups) {
                    group.required = group.save_required
                }
            }
        } finally {
            this.usage = save_usage
        }
        return [ namespace, extras ]
    }

    // ========================
    // Value conversion methods
    // ========================
    _get_values(action, arg_strings) {
        // for everything but PARSER, REMAINDER args, strip out first '--'
        if (![PARSER, REMAINDER].includes(action.nargs)) {
            try {
                _array_remove(arg_strings, '--')
            } catch (err) {}
        }

        let value
        // optional argument produces a default when not present
        if (!arg_strings.length && action.nargs === OPTIONAL) {
            if (action.option_strings.length) {
                value = action.const
            } else {
                value = action.default
            }
            if (typeof value === 'string') {
                value = this._get_value(action, value)
                this._check_value(action, value)
            }

        // when nargs='*' on a positional, if there were no command-line
        // args, use the default if it is anything other than None
        } else if (!arg_strings.length && action.nargs === ZERO_OR_MORE &&
              !action.option_strings.length) {
            if (action.default !== undefined) {
                value = action.default
            } else {
                value = arg_strings
            }
            this._check_value(action, value)

        // single argument or optional argument produces a single value
        } else if (arg_strings.length === 1 && [undefined, OPTIONAL].includes(action.nargs)) {
            let arg_string = arg_strings[0]
            value = this._get_value(action, arg_string)
            this._check_value(action, value)

        // REMAINDER arguments convert all values, checking none
        } else if (action.nargs === REMAINDER) {
            value = arg_strings.map(v => this._get_value(action, v))

        // PARSER arguments convert all values, but check only the first
        } else if (action.nargs === PARSER) {
            value = arg_strings.map(v => this._get_value(action, v))
            this._check_value(action, value[0])

        // SUPPRESS argument does not put anything in the namespace
        } else if (action.nargs === SUPPRESS) {
            value = SUPPRESS

        // all other types of nargs produce a list
        } else {
            value = arg_strings.map(v => this._get_value(action, v))
            for (let v of value) {
                this._check_value(action, v)
            }
        }

        // return the converted value
        return value
    }

    _get_value(action, arg_string) {
        let type_func = this._registry_get('type', action.type, action.type)
        if (typeof type_func !== 'function') {
            let msg = '%r is not callable'
            throw new ArgumentError(action, sub(msg, type_func))
        }

        // convert the value to the appropriate type
        let result
        try {
            try {
                result = type_func(arg_string)
            } catch (err) {
                // Dear TC39, why would you ever consider making es6 classes not callable?
                // We had one universal interface, [[Call]], which worked for anything
                // (with familiar this-instanceof guard for classes). Now we have two.
                if (err instanceof TypeError &&
                    /Class constructor .* cannot be invoked without 'new'/.test(err.message)) {
                    // eslint-disable-next-line new-cap
                    result = new type_func(arg_string)
                } else {
                    throw err
                }
            }

        } catch (err) {
            // ArgumentTypeErrors indicate errors
            if (err instanceof ArgumentTypeError) {
                //let name = getattr(action.type, 'name', repr(action.type))
                let msg = err.message
                throw new ArgumentError(action, msg)

            // TypeErrors or ValueErrors also indicate errors
            } else if (err instanceof TypeError) {
                let name = getattr(action.type, 'name', repr(action.type))
                let args = {type: name, value: arg_string}
                let msg = 'invalid %(type)s value: %(value)r'
                throw new ArgumentError(action, sub(msg, args))
            } else {
                throw err
            }
        }

        // return the converted value
        return result
    }

    _check_value(action, value) {
        // converted value must be one of the choices (if specified)
        if (action.choices !== undefined && !_choices_to_array(action.choices).includes(value)) {
            let args = {value,
                        choices: _choices_to_array(action.choices).map(repr).join(', ')}
            let msg = 'invalid choice: %(value)r (choose from %(choices)s)'
            throw new ArgumentError(action, sub(msg, args))
        }
    }

    // =======================
    // Help-formatting methods
    // =======================
    format_usage() {
        let formatter = this._get_formatter()
        formatter.add_usage(this.usage, this._actions,
                            this._mutually_exclusive_groups)
        return formatter.format_help()
    }

    format_help() {
        let formatter = this._get_formatter()

        // usage
        formatter.add_usage(this.usage, this._actions,
                            this._mutually_exclusive_groups)

        // description
        formatter.add_text(this.description)

        // positionals, optionals and user-defined groups
        for (let action_group of this._action_groups) {
            formatter.start_section(action_group.title)
            formatter.add_text(action_group.description)
            formatter.add_arguments(action_group._group_actions)
            formatter.end_section()
        }

        // epilog
        formatter.add_text(this.epilog)

        // determine help from format above
        return formatter.format_help()
    }

    _get_formatter() {
        // eslint-disable-next-line new-cap
        return new this.formatter_class({ prog: this.prog })
    }

    // =====================
    // Help-printing methods
    // =====================
    print_usage(file = undefined) {
        if (file === undefined) file = process.stdout
        this._print_message(this.format_usage(), file)
    }

    print_help(file = undefined) {
        if (file === undefined) file = process.stdout
        this._print_message(this.format_help(), file)
    }

    _print_message(message, file = undefined) {
        if (message) {
            if (file === undefined) file = process.stderr
            file.write(message)
        }
    }

    // ===============
    // Exiting methods
    // ===============
    exit(status = 0, message = undefined) {
        if (message) {
            this._print_message(message, process.stderr)
        }
        process.exit(status)
    }

    error(message) {
        /*
         *  error(message: string)
         *
         *  Prints a usage message incorporating the message to stderr and
         *  exits.
         *
         *  If you override this in a subclass, it should not return -- it
         *  should either exit or raise an exception.
         */

        // LEGACY (v1 compatibility), debug mode
        if (this.debug === true) throw new Error(message)
        // end
        this.print_usage(process.stderr)
        let args = {prog: this.prog, message: message}
        this.exit(2, sub('%(prog)s: error: %(message)s\n', args))
    }
}))


module.exports = {
    ArgumentParser,
    ArgumentError,
    ArgumentTypeError,
    BooleanOptionalAction,
    FileType,
    HelpFormatter,
    ArgumentDefaultsHelpFormatter,
    RawDescriptionHelpFormatter,
    RawTextHelpFormatter,
    MetavarTypeHelpFormatter,
    Namespace,
    Action,
    ONE_OR_MORE,
    OPTIONAL,
    PARSER,
    REMAINDER,
    SUPPRESS,
    ZERO_OR_MORE
}

// LEGACY (v1 compatibility), Const alias
Object.defineProperty(module.exports, 'Const', {
    get() {
        let result = {}
        Object.entries({ ONE_OR_MORE, OPTIONAL, PARSER, REMAINDER, SUPPRESS, ZERO_OR_MORE }).forEach(([ n, v ]) => {
            Object.defineProperty(result, n, {
                get() {
                    deprecate(n, sub('use argparse.%s instead of argparse.Const.%s', n, n))
                    return v
                }
            })
        })
        Object.entries({ _UNRECOGNIZED_ARGS_ATTR }).forEach(([ n, v ]) => {
            Object.defineProperty(result, n, {
                get() {
                    deprecate(n, sub('argparse.Const.%s is an internal symbol and will no longer be available', n))
                    return v
                }
            })
        })
        return result
    },
    enumerable: false
})
// end

}).call(this)}).call(this,require('_process'))
},{"./lib/sub":3,"./lib/textwrap":4,"_process":28,"assert":6,"fs":5,"path":27,"util":31}],3:[function(require,module,exports){
// Limited implementation of python % string operator, supports only %s and %r for now
// (other formats are not used here, but may appear in custom templates)

'use strict'

const { inspect } = require('util')


module.exports = function sub(pattern, ...values) {
    let regex = /%(?:(%)|(-)?(\*)?(?:\((\w+)\))?([A-Za-z]))/g

    let result = pattern.replace(regex, function (_, is_literal, is_left_align, is_padded, name, format) {
        if (is_literal) return '%'

        let padded_count = 0
        if (is_padded) {
            if (values.length === 0) throw new TypeError('not enough arguments for format string')
            padded_count = values.shift()
            if (!Number.isInteger(padded_count)) throw new TypeError('* wants int')
        }

        let str
        if (name !== undefined) {
            let dict = values[0]
            if (typeof dict !== 'object' || dict === null) throw new TypeError('format requires a mapping')
            if (!(name in dict)) throw new TypeError(`no such key: '${name}'`)
            str = dict[name]
        } else {
            if (values.length === 0) throw new TypeError('not enough arguments for format string')
            str = values.shift()
        }

        switch (format) {
            case 's':
                str = String(str)
                break
            case 'r':
                str = inspect(str)
                break
            case 'd':
            case 'i':
                if (typeof str !== 'number') {
                    throw new TypeError(`%${format} format: a number is required, not ${typeof str}`)
                }
                str = String(str.toFixed(0))
                break
            default:
                throw new TypeError(`unsupported format character '${format}'`)
        }

        if (padded_count > 0) {
            return is_left_align ? str.padEnd(padded_count) : str.padStart(padded_count)
        } else {
            return str
        }
    })

    if (values.length) {
        if (values.length === 1 && typeof values[0] === 'object' && values[0] !== null) {
            // mapping
        } else {
            throw new TypeError('not all arguments converted during string formatting')
        }
    }

    return result
}

},{"util":31}],4:[function(require,module,exports){
// Partial port of python's argparse module, version 3.9.0 (only wrap and fill functions):
// https://github.com/python/cpython/blob/v3.9.0b4/Lib/textwrap.py

'use strict'

/*
 * Text wrapping and filling.
 */

// Copyright (C) 1999-2001 Gregory P. Ward.
// Copyright (C) 2002, 2003 Python Software Foundation.
// Copyright (C) 2020 argparse.js authors
// Originally written by Greg Ward <gward@python.net>

// Hardcode the recognized whitespace characters to the US-ASCII
// whitespace characters.  The main reason for doing this is that
// some Unicode spaces (like \u00a0) are non-breaking whitespaces.
//
// This less funky little regex just split on recognized spaces. E.g.
//   "Hello there -- you goof-ball, use the -b option!"
// splits into
//   Hello/ /there/ /--/ /you/ /goof-ball,/ /use/ /the/ /-b/ /option!/
const wordsep_simple_re = /([\t\n\x0b\x0c\r ]+)/

class TextWrapper {
    /*
     *  Object for wrapping/filling text.  The public interface consists of
     *  the wrap() and fill() methods; the other methods are just there for
     *  subclasses to override in order to tweak the default behaviour.
     *  If you want to completely replace the main wrapping algorithm,
     *  you'll probably have to override _wrap_chunks().
     *
     *  Several instance attributes control various aspects of wrapping:
     *    width (default: 70)
     *      the maximum width of wrapped lines (unless break_long_words
     *      is false)
     *    initial_indent (default: "")
     *      string that will be prepended to the first line of wrapped
     *      output.  Counts towards the line's width.
     *    subsequent_indent (default: "")
     *      string that will be prepended to all lines save the first
     *      of wrapped output; also counts towards each line's width.
     *    expand_tabs (default: true)
     *      Expand tabs in input text to spaces before further processing.
     *      Each tab will become 0 .. 'tabsize' spaces, depending on its position
     *      in its line.  If false, each tab is treated as a single character.
     *    tabsize (default: 8)
     *      Expand tabs in input text to 0 .. 'tabsize' spaces, unless
     *      'expand_tabs' is false.
     *    replace_whitespace (default: true)
     *      Replace all whitespace characters in the input text by spaces
     *      after tab expansion.  Note that if expand_tabs is false and
     *      replace_whitespace is true, every tab will be converted to a
     *      single space!
     *    fix_sentence_endings (default: false)
     *      Ensure that sentence-ending punctuation is always followed
     *      by two spaces.  Off by default because the algorithm is
     *      (unavoidably) imperfect.
     *    break_long_words (default: true)
     *      Break words longer than 'width'.  If false, those words will not
     *      be broken, and some lines might be longer than 'width'.
     *    break_on_hyphens (default: true)
     *      Allow breaking hyphenated words. If true, wrapping will occur
     *      preferably on whitespaces and right after hyphens part of
     *      compound words.
     *    drop_whitespace (default: true)
     *      Drop leading and trailing whitespace from lines.
     *    max_lines (default: None)
     *      Truncate wrapped lines.
     *    placeholder (default: ' [...]')
     *      Append to the last line of truncated text.
     */

    constructor(options = {}) {
        let {
            width = 70,
            initial_indent = '',
            subsequent_indent = '',
            expand_tabs = true,
            replace_whitespace = true,
            fix_sentence_endings = false,
            break_long_words = true,
            drop_whitespace = true,
            break_on_hyphens = true,
            tabsize = 8,
            max_lines = undefined,
            placeholder=' [...]'
        } = options

        this.width = width
        this.initial_indent = initial_indent
        this.subsequent_indent = subsequent_indent
        this.expand_tabs = expand_tabs
        this.replace_whitespace = replace_whitespace
        this.fix_sentence_endings = fix_sentence_endings
        this.break_long_words = break_long_words
        this.drop_whitespace = drop_whitespace
        this.break_on_hyphens = break_on_hyphens
        this.tabsize = tabsize
        this.max_lines = max_lines
        this.placeholder = placeholder
    }


    // -- Private methods -----------------------------------------------
    // (possibly useful for subclasses to override)

    _munge_whitespace(text) {
        /*
         *  _munge_whitespace(text : string) -> string
         *
         *  Munge whitespace in text: expand tabs and convert all other
         *  whitespace characters to spaces.  Eg. " foo\\tbar\\n\\nbaz"
         *  becomes " foo    bar  baz".
         */
        if (this.expand_tabs) {
            text = text.replace(/\t/g, ' '.repeat(this.tabsize)) // not strictly correct in js
        }
        if (this.replace_whitespace) {
            text = text.replace(/[\t\n\x0b\x0c\r]/g, ' ')
        }
        return text
    }

    _split(text) {
        /*
         *  _split(text : string) -> [string]
         *
         *  Split the text to wrap into indivisible chunks.  Chunks are
         *  not quite the same as words; see _wrap_chunks() for full
         *  details.  As an example, the text
         *    Look, goof-ball -- use the -b option!
         *  breaks into the following chunks:
         *    'Look,', ' ', 'goof-', 'ball', ' ', '--', ' ',
         *    'use', ' ', 'the', ' ', '-b', ' ', 'option!'
         *  if break_on_hyphens is True, or in:
         *    'Look,', ' ', 'goof-ball', ' ', '--', ' ',
         *    'use', ' ', 'the', ' ', '-b', ' ', option!'
         *  otherwise.
         */
        let chunks = text.split(wordsep_simple_re)
        chunks = chunks.filter(Boolean)
        return chunks
    }

    _handle_long_word(reversed_chunks, cur_line, cur_len, width) {
        /*
         *  _handle_long_word(chunks : [string],
         *                    cur_line : [string],
         *                    cur_len : int, width : int)
         *
         *  Handle a chunk of text (most likely a word, not whitespace) that
         *  is too long to fit in any line.
         */
        // Figure out when indent is larger than the specified width, and make
        // sure at least one character is stripped off on every pass
        let space_left
        if (width < 1) {
            space_left = 1
        } else {
            space_left = width - cur_len
        }

        // If we're allowed to break long words, then do so: put as much
        // of the next chunk onto the current line as will fit.
        if (this.break_long_words) {
            cur_line.push(reversed_chunks[reversed_chunks.length - 1].slice(0, space_left))
            reversed_chunks[reversed_chunks.length - 1] = reversed_chunks[reversed_chunks.length - 1].slice(space_left)

        // Otherwise, we have to preserve the long word intact.  Only add
        // it to the current line if there's nothing already there --
        // that minimizes how much we violate the width constraint.
        } else if (!cur_line) {
            cur_line.push(...reversed_chunks.pop())
        }

        // If we're not allowed to break long words, and there's already
        // text on the current line, do nothing.  Next time through the
        // main loop of _wrap_chunks(), we'll wind up here again, but
        // cur_len will be zero, so the next line will be entirely
        // devoted to the long word that we can't handle right now.
    }

    _wrap_chunks(chunks) {
        /*
         *  _wrap_chunks(chunks : [string]) -> [string]
         *
         *  Wrap a sequence of text chunks and return a list of lines of
         *  length 'self.width' or less.  (If 'break_long_words' is false,
         *  some lines may be longer than this.)  Chunks correspond roughly
         *  to words and the whitespace between them: each chunk is
         *  indivisible (modulo 'break_long_words'), but a line break can
         *  come between any two chunks.  Chunks should not have internal
         *  whitespace; ie. a chunk is either all whitespace or a "word".
         *  Whitespace chunks will be removed from the beginning and end of
         *  lines, but apart from that whitespace is preserved.
         */
        let lines = []
        let indent
        if (this.width <= 0) {
            throw Error(`invalid width ${this.width} (must be > 0)`)
        }
        if (this.max_lines !== undefined) {
            if (this.max_lines > 1) {
                indent = this.subsequent_indent
            } else {
                indent = this.initial_indent
            }
            if (indent.length + this.placeholder.trimStart().length > this.width) {
                throw Error('placeholder too large for max width')
            }
        }

        // Arrange in reverse order so items can be efficiently popped
        // from a stack of chucks.
        chunks = chunks.reverse()

        while (chunks.length > 0) {

            // Start the list of chunks that will make up the current line.
            // cur_len is just the length of all the chunks in cur_line.
            let cur_line = []
            let cur_len = 0

            // Figure out which static string will prefix this line.
            let indent
            if (lines) {
                indent = this.subsequent_indent
            } else {
                indent = this.initial_indent
            }

            // Maximum width for this line.
            let width = this.width - indent.length

            // First chunk on line is whitespace -- drop it, unless this
            // is the very beginning of the text (ie. no lines started yet).
            if (this.drop_whitespace && chunks[chunks.length - 1].trim() === '' && lines.length > 0) {
                chunks.pop()
            }

            while (chunks.length > 0) {
                let l = chunks[chunks.length - 1].length

                // Can at least squeeze this chunk onto the current line.
                if (cur_len + l <= width) {
                    cur_line.push(chunks.pop())
                    cur_len += l

                // Nope, this line is full.
                } else {
                    break
                }
            }

            // The current line is full, and the next chunk is too big to
            // fit on *any* line (not just this one).
            if (chunks.length && chunks[chunks.length - 1].length > width) {
                this._handle_long_word(chunks, cur_line, cur_len, width)
                cur_len = cur_line.map(l => l.length).reduce((a, b) => a + b, 0)
            }

            // If the last chunk on this line is all whitespace, drop it.
            if (this.drop_whitespace && cur_line.length > 0 && cur_line[cur_line.length - 1].trim() === '') {
                cur_len -= cur_line[cur_line.length - 1].length
                cur_line.pop()
            }

            if (cur_line) {
                if (this.max_lines === undefined ||
                    lines.length + 1 < this.max_lines ||
                    (chunks.length === 0 ||
                     this.drop_whitespace &&
                     chunks.length === 1 &&
                     !chunks[0].trim()) && cur_len <= width) {
                    // Convert current line back to a string and store it in
                    // list of all lines (return value).
                    lines.push(indent + cur_line.join(''))
                } else {
                    let had_break = false
                    while (cur_line) {
                        if (cur_line[cur_line.length - 1].trim() &&
                            cur_len + this.placeholder.length <= width) {
                            cur_line.push(this.placeholder)
                            lines.push(indent + cur_line.join(''))
                            had_break = true
                            break
                        }
                        cur_len -= cur_line[-1].length
                        cur_line.pop()
                    }
                    if (!had_break) {
                        if (lines) {
                            let prev_line = lines[lines.length - 1].trimEnd()
                            if (prev_line.length + this.placeholder.length <=
                                    this.width) {
                                lines[lines.length - 1] = prev_line + this.placeholder
                                break
                            }
                        }
                        lines.push(indent + this.placeholder.lstrip())
                    }
                    break
                }
            }
        }

        return lines
    }

    _split_chunks(text) {
        text = this._munge_whitespace(text)
        return this._split(text)
    }

    // -- Public interface ----------------------------------------------

    wrap(text) {
        /*
         *  wrap(text : string) -> [string]
         *
         *  Reformat the single paragraph in 'text' so it fits in lines of
         *  no more than 'self.width' columns, and return a list of wrapped
         *  lines.  Tabs in 'text' are expanded with string.expandtabs(),
         *  and all other whitespace characters (including newline) are
         *  converted to space.
         */
        let chunks = this._split_chunks(text)
        // not implemented in js
        //if (this.fix_sentence_endings) {
        //    this._fix_sentence_endings(chunks)
        //}
        return this._wrap_chunks(chunks)
    }

    fill(text) {
        /*
         *  fill(text : string) -> string
         *
         *  Reformat the single paragraph in 'text' to fit in lines of no
         *  more than 'self.width' columns, and return a new string
         *  containing the entire wrapped paragraph.
         */
        return this.wrap(text).join('\n')
    }
}


// -- Convenience interface ---------------------------------------------

function wrap(text, options = {}) {
    /*
     *  Wrap a single paragraph of text, returning a list of wrapped lines.
     *
     *  Reformat the single paragraph in 'text' so it fits in lines of no
     *  more than 'width' columns, and return a list of wrapped lines.  By
     *  default, tabs in 'text' are expanded with string.expandtabs(), and
     *  all other whitespace characters (including newline) are converted to
     *  space.  See TextWrapper class for available keyword args to customize
     *  wrapping behaviour.
     */
    let { width = 70, ...kwargs } = options
    let w = new TextWrapper(Object.assign({ width }, kwargs))
    return w.wrap(text)
}

function fill(text, options = {}) {
    /*
     *  Fill a single paragraph of text, returning a new string.
     *
     *  Reformat the single paragraph in 'text' to fit in lines of no more
     *  than 'width' columns, and return a new string containing the entire
     *  wrapped paragraph.  As with wrap(), tabs are expanded and other
     *  whitespace characters converted to space.  See TextWrapper class for
     *  available keyword args to customize wrapping behaviour.
     */
    let { width = 70, ...kwargs } = options
    let w = new TextWrapper(Object.assign({ width }, kwargs))
    return w.fill(text)
}

// -- Loosely related functionality -------------------------------------

let _whitespace_only_re = /^[ \t]+$/mg
let _leading_whitespace_re = /(^[ \t]*)(?:[^ \t\n])/mg

function dedent(text) {
    /*
     *  Remove any common leading whitespace from every line in `text`.
     *
     *  This can be used to make triple-quoted strings line up with the left
     *  edge of the display, while still presenting them in the source code
     *  in indented form.
     *
     *  Note that tabs and spaces are both treated as whitespace, but they
     *  are not equal: the lines "  hello" and "\\thello" are
     *  considered to have no common leading whitespace.
     *
     *  Entirely blank lines are normalized to a newline character.
     */
    // Look for the longest leading string of spaces and tabs common to
    // all lines.
    let margin = undefined
    text = text.replace(_whitespace_only_re, '')
    let indents = text.match(_leading_whitespace_re) || []
    for (let indent of indents) {
        indent = indent.slice(0, -1)

        if (margin === undefined) {
            margin = indent

        // Current line more deeply indented than previous winner:
        // no change (previous winner is still on top).
        } else if (indent.startsWith(margin)) {
            // pass

        // Current line consistent with and no deeper than previous winner:
        // it's the new winner.
        } else if (margin.startsWith(indent)) {
            margin = indent

        // Find the largest common whitespace between current line and previous
        // winner.
        } else {
            for (let i = 0; i < margin.length && i < indent.length; i++) {
                if (margin[i] !== indent[i]) {
                    margin = margin.slice(0, i)
                    break
                }
            }
        }
    }

    if (margin) {
        text = text.replace(new RegExp('^' + margin, 'mg'), '')
    }
    return text
}

module.exports = { wrap, fill, dedent }

},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
(function (global){(function (){
'use strict';

var objectAssign = require('object-assign');

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"object-assign":26,"util/":9}],7:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],8:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],9:[function(require,module,exports){
(function (process,global){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":8,"_process":28,"inherits":7}],10:[function(require,module,exports){
(function (global){(function (){
'use strict';

var possibleNames = [
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
];

var g = typeof globalThis === 'undefined' ? global : globalThis;

module.exports = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":12,"get-intrinsic":17}],12:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":16,"get-intrinsic":17}],13:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":17}],14:[function(require,module,exports){

var hasOwn = Object.prototype.hasOwnProperty;
var toString = Object.prototype.toString;

module.exports = function forEach (obj, fn, ctx) {
    if (toString.call(fn) !== '[object Function]') {
        throw new TypeError('iterator must be a function');
    }
    var l = obj.length;
    if (l === +l) {
        for (var i = 0; i < l; i++) {
            fn.call(ctx, obj[i], i, obj);
        }
    } else {
        for (var k in obj) {
            if (hasOwn.call(obj, k)) {
                fn.call(ctx, obj[k], k, obj);
            }
        }
    }
};


},{}],15:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],16:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":15}],17:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":16,"has":21,"has-symbols":18}],18:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":19}],19:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],20:[function(require,module,exports){
'use strict';

var hasSymbols = require('has-symbols/shams');

module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};

},{"has-symbols/shams":19}],21:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":16}],22:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],23:[function(require,module,exports){
'use strict';

var hasToStringTag = require('has-tostringtag/shams')();
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":11,"has-tostringtag/shams":20}],24:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = require('has-tostringtag/shams')();
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var GeneratorFunction;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	if (!getProto) {
		return false;
	}
	if (typeof GeneratorFunction === 'undefined') {
		var generatorFunc = getGeneratorFunc();
		GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
	}
	return getProto(fn) === GeneratorFunction;
};

},{"has-tostringtag/shams":20}],25:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = require('has-tostringtag/shams')();

var g = typeof globalThis === 'undefined' ? global : globalThis;
var typedArrays = availableTypedArrays();

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new g[typedArray]();
		if (Symbol.toStringTag in arr) {
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			toStrTags[typedArray] = descriptor.get;
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var anyTrue = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!anyTrue) {
			try {
				anyTrue = getter.call(value) === typedArray;
			} catch (e) { /**/ }
		}
	});
	return anyTrue;
};

module.exports = function isTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) {
		var tag = $slice($toString(value), 8, -1);
		return $indexOf(typedArrays, tag) > -1;
	}
	if (!gOPD) { return false; }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":10,"call-bind/callBound":11,"es-abstract/helpers/getOwnPropertyDescriptor":13,"foreach":14,"has-tostringtag/shams":20}],26:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],27:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))
},{"_process":28}],28:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],29:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],30:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBufferCopy === 'undefined') {
    return false;
  }

  if (typeof isSharedArrayBufferToString.working === 'undefined') {
    isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBufferCopy;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":23,"is-generator-function":24,"is-typed-array":25,"which-typed-array":32}],31:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = require('./support/types');

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))
},{"./support/isBuffer":29,"./support/types":30,"_process":28,"inherits":22}],32:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('foreach');
var availableTypedArrays = require('available-typed-arrays');
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = require('has-tostringtag/shams')();

var g = typeof globalThis === 'undefined' ? global : globalThis;
var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var toStrTags = {};
var gOPD = require('es-abstract/helpers/getOwnPropertyDescriptor');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		if (typeof g[typedArray] === 'function') {
			var arr = new g[typedArray]();
			if (Symbol.toStringTag in arr) {
				var proto = getPrototypeOf(arr);
				var descriptor = gOPD(proto, Symbol.toStringTag);
				if (!descriptor) {
					var superProto = getPrototypeOf(proto);
					descriptor = gOPD(superProto, Symbol.toStringTag);
				}
				toStrTags[typedArray] = descriptor.get;
			}
		}
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var foundName = false;
	forEach(toStrTags, function (getter, typedArray) {
		if (!foundName) {
			try {
				var name = getter.call(value);
				if (name === typedArray) {
					foundName = name;
				}
			} catch (e) {}
		}
	});
	return foundName;
};

var isTypedArray = require('is-typed-array');

module.exports = function whichTypedArray(value) {
	if (!isTypedArray(value)) { return false; }
	if (!hasToStringTag || !(Symbol.toStringTag in value)) { return $slice($toString(value), 8, -1); }
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"available-typed-arrays":10,"call-bind/callBound":11,"es-abstract/helpers/getOwnPropertyDescriptor":13,"foreach":14,"has-tostringtag/shams":20,"is-typed-array":25}]},{},[1]);
