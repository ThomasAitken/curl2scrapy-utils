import shlex from 'shlex';
import { ArgumentParser } from 'argparse';
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

    return result;
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

    return result;
};

export { getCurlObject, curl2scrapyCode, curl2scrapyParse };
