
import assert from "assert";
import { getCurlObject, curl2scrapyCode, curl2scrapyParse } from './nonbrowser_utils.js';

// var assert = require("assert");

let curlExample1 = `
curl 'https://www.michaelhill.com.au/' \
  -H 'authority: www.michaelhill.com.au' \
  -H 'sec-ch-ua: "Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9' \
  -H 'sec-fetch-site: none' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-user: ?1' \
  -H 'sec-fetch-dest: document' \
  -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
  --compressed
`
let curlObject1 = {
    url: "https://www.michaelhill.com.au/",
    params: null,
    method: "GET",
    data: null,
    isForm: false,
    headers: {
        "authority": "www.michaelhill.com.au",
        "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
        "sec-ch-ua-mobile": "?0",
        "upgrade-insecure-requests": "1",
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "sec-fetch-site": "none",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
    },
    cookies: null
}

let scrapyCode1 = String.raw`from scrapy.http import Request

url = "https://www.michaelhill.com.au/"

headers = {
    "authority": "www.michaelhill.com.au",
    "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
    "sec-ch-ua-mobile": "?0",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "sec-fetch-site": "none",
    "sec-fetch-mode": "navigate",
    "sec-fetch-user": "?1",
    "sec-fetch-dest": "document",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
}

request = Request(
    url=url,
    callback=self.cb_name,
    headers=headers,
)
`;

let scrapyParse1 = String.raw`testmaster parse "https://www.michaelhill.com.au/" --headers='{"authority":"www.michaelhill.com.au","sec-ch-ua":"\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"","sec-ch-ua-mobile":"?0","upgrade-insecure-requests":"1","user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9","sec-fetch-site":"none","sec-fetch-mode":"navigate","sec-fetch-user":"?1","sec-fetch-dest":"document","accept-language":"en-GB,en-US;q=0.9,en;q=0.8"}' --spider=[SPIDER_NAME] -c [CALLBACK_NAME]`;

let curlExample2 = String.raw`
curl 'https://www.woolworths.com.au/apis/ui/browse/category' \
  -H 'authority: www.woolworths.com.au' \
  -H 'sec-ch-ua: "Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'content-type: application/json' \
  -H 'request-id: |6822503f181248ad84d21fadecbbcc60.e100278ac5cd4f7c' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36' \
  -H 'request-context: appId=cid-v1:099a45be-5030-453c-b870-6f6cb4dacdb8' \
  -H 'origin: https://www.woolworths.com.au' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-dest: empty' \
  -H 'referer: https://www.woolworths.com.au/shop/browse/fruit-veg/fruit/organic-fruit' \
  -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
  -H 'cookie: AKA_A2=A; bff_region=syd2; bm_sz=E0867DA424FA2B2F151AB21E1326DE45~YAAQVR42F+0CgKt8AQAAkkRJwA3SAE/zrgIYhL+Z4qYoSTBEn49jfx9f38efPWskWLy55Ni9DaOLYn6skObBd1TLONqSzjdhV9oN07L1poXKWzg1nxndSgQVPCFYvN4Vw3NkDK3HdcEWZMbRZnwQ8if6DnrwqWUTDBVrGWJhOqOIcQotq7kkdbLSzU/9n5QS3LM7qjt7OEM19XnorSx1RSPsPuw1DJ82jg8wILGTNG/b7rDq4JB5RjDm1bqaLCpHBjrU/THa0clJ/7cwk3wjolcf5qukMy0J87/WnNfSNC7AsCJVwkeusJVE~3687993~3486004; rxVisitor=1635313599728V0L3GJ2T2V0FCGOUD28SRECUS8Q6KGPH; INGRESSCOOKIE=1635313600.769.67.313471; w-rctx=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA; wow-auth-token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA; prodwow-auth-token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA; akaalb_woolworths.com.au=~op=www_woolworths_com_au_ZoneA:PROD-ZoneA|www_woolworths_com_au_BFF_SYD_Launch:WOW-BFF-SYD2|~rv=36~m=PROD-ZoneA:0|WOW-BFF-SYD2:0|~os=43eb3391333cc20efbd7f812851447e6~id=05e0c998601abd19f6c33a36ec51078b; bm_mi=2EF7C18EBA9A2DEA91731956402705BA~Jld/Oe78DLoovLtBrHUtoQA7lsaUrGdZOVk86DE9j8fpz2a1Gt5WNn7n00rfVervCjvm/RipBx4gmS9wodiz1lBWT1ZCqt2mAwxlKdCQKtNgCDNX+uJOk7zX2wvQYVGLZZuRMeN34qCXrKF10AfLWxQvv1oU6bt4bleuEPRk2wGEvjKqESey128Dlgu+Q/fEO36aahk88WWns9A0N5gdnCY6wisbbci3VwpH+pdXBokFvHXPamzibRbQ8xZ1LBS2p/Ok+Tz0YoXy/kIJV0Udqg==; at_check=true; AMCVS_4353388057AC8D357F000101%40AdobeOrg=1; AMCV_4353388057AC8D357F000101%40AdobeOrg=870038026%7CMCIDTS%7C18928%7CMCMID%7C20113066842827932023914855275307523778%7CMCAAMLH-1635918400%7C8%7CMCAAMB-1635918400%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1635320800s%7CNONE%7CvVersion%7C5.0.0; dtSa=-; ai_user=fptucQ6rCsHYlozrhbCsqA|2021-10-27T05:46:40.403Z; mboxEdgeCluster=36; _abck=8D550B87C6E0E60D7BB667D9690789A7~0~YAAQVR42FysDgKt8AQAAL0xJwAZs5+Hus3XOP9N9DsWIlKRoGuHFUQnAxHE0DhnOnEMhYRBAElTuTYBfmJqzoBcDVl1mQ5RPWmJ+2kUOBRMe1ZlsLWQEFE7EwTuoyxkjkgh9dkoz8SXleKh4yBDGt+ix8kbEQByCcr1/FujaMuznUXBAL/eHHoZ+BUwpxVdejiekShZ6bGWwxekRrEVpIeYHnIupvKYjHKFEw5wvJt3fZGHspvTj21FpcZDoNBCyWY/AEN6IU6B0xXnlXIlnRx4N0/Vx3MdCRie/q8Mf5YNRl3rkuAFEMydZXJf3IfGqRRI7mD9zM3JblgPCNSoCIwQPAPnM5HmBHtXmh3h2QCpti1rxiS4b3EG8+dixlDKgbgG9ByGK4t+CxEy1NhVq3YmYhVKYAZY3BCqQqeBP~-1~||-1||~-1; ak_bmsc=98E6CE381E4B39EB21C72F66D667B9BD~000000000000000000000000000000~YAAQVR42FzwDgKt8AQAAvU1JwA2BQY7fKt2QzMipJ0jiP62PafXwZh4znNb/TqGPjs1lIFdoP/cru216MYb97mJofMSQxaXtprvUyH+ByIkTP1lCDy4lPvbS8fCOyNeqsrQMGIKrCJSRletW9uCmd2hrC5cxA6ef3gG3vPKaZ1od1AioV4fLwTBCmzffad3JE5kiy2WGbBSBOxmeyhhMmJ4g0as5WdkOMZAqe02u2qujDGQNzuJPeGLcT4IS5fS/pSy3mqCsHDixoxmwUWp2JtQPLmJJpvaF2NKsMPKBll55HZ4x7QrdlUSA+ZANDhb5BGb+PBIvSbTIOB4JPKIhSrHZnm3afQLHbik/XsmHVA+vOQ1Ojk+xdDFlolBrX15JuS0JE70rj1wh2u3l4y2ANJqxHbcNedEAheaNdHoDhY2fkzJprdny7/pLYcmwaTZMxNulOvmNRz8dC17HFoyffJU2nGQUCRS5TwNsHUvr/ot6iRxktJJAcgIqGC3umlnRHElDCfaNW/UNmGlgA9LqPp3KCendxghB0/xSSgAmzmGd; s_cc=true; IR_gbd=woolworths.com.au; IR_7464=1635313605948%7C0%7C1635313605948%7C%7C; aam_uuid=19677677515815171023959559883546949406; mbox=session#ef8d6469b650457db89ff10fd599080f#1635315461|PC#ef8d6469b650457db89ff10fd599080f.36_0#1698558407; _uetsid=45561f2036e911ec87215b9fbf1a5e7c; _uetvid=45567bc036e911ec8918171441050da9; _fbp=fb.2.1635313606086.300757719; dtCookie=v_4_srv_4_sn_A30C4ED42FD4A9F5444A8C25B2EFCC51_app-3A5cc956099f88e4b7_0_app-3Af908d76079915f06_1_ol_0_perc_100000_mul_1; _ga=GA1.3.982835938.1635313606; _gid=GA1.3.1859085090.1635313606; _gat_gtag_UA_38610140_9=1; _gcl_au=1.1.557218123.1635313606; RT="z=1&dm=www.woolworths.com.au&si=b7db7392-c516-486a-852b-4d1262d35b96&ss=kv93ht0u&sl=1&tt=1o7&rl=1&ld=1oa&nu=1uy5ch17&cl=5e0"; utag_main=v_id:017cc04958d00002653ff88ef3b803069001e06100bd0$_sn:1$_se:11$_ss:0$_st:1635315406549$ses_id:1635313604818%3Bexp-session$_pn:1%3Bexp-session$vapi_domain:woolworths.com.au$dc_visit:1$dc_event:5%3Bexp-session$dc_region:ap-southeast-2%3Bexp-session; s_sq=%5B%5BB%5D%5D; bm_sv=D348AFECC9A6232DD62389AA4E8CD0DA~7ouWBcsF1QnWTRw2tagILKAd8q0Iu6+DJ7qDgYuzUENgqFyHpsOCk3y0IlrFTfUmEKGl42m6+PkRoF5TTYJ2vnzFxRTMsQKjXPIbzq7L9aRMRkyLi86Dv0x4iAbdTcfX2XGaW5axyYXD/wrrqBh6CauHwSGm+jO2CrM37+UkRP0=; ai_session=cuD6AF1xpG+SDTJSdhBHIy|1635313600526|1635313606868; dtLatC=3; rxvt=1635315406963|1635313599729; dtPC=4$313599725_232h57vEOLRLTCRJHKRLMHOCLKKKTSCCOKLHSKP-0e0' \
  --data-raw '{"categoryId":"1-A90F8053","pageNumber":1,"pageSize":24,"sortType":"TraderRelevance","url":"/shop/browse/fruit-veg/fruit/organic-fruit","location":"/shop/browse/fruit-veg/fruit/organic-fruit","formatObject":"{\"name\":\"Organic Fruit\"}","isSpecial":false,"isBundle":false,"isMobile":false,"filters":[],"token":""}' \
  --compressed
`

let curlObject2 = {
    url: "https://www.woolworths.com.au/apis/ui/browse/category",
    params: null,
    method: "POST",
    isForm: false,
    data: { "categoryId":"1-A90F8053","pageNumber":1,"pageSize":24,"sortType":"TraderRelevance","url":"/shop/browse/fruit-veg/fruit/organic-fruit","location":"/shop/browse/fruit-veg/fruit/organic-fruit","formatObject":"{\"name\":\"Organic Fruit\"}","isSpecial":false,"isBundle":false,"isMobile":false,"filters":[],"token":"" },
    headers: {
        "authority": "www.woolworths.com.au",
        "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
        "accept": "application/json, text/plain, */*",
        "content-type": "application/json",
        "request-id": "|6822503f181248ad84d21fadecbbcc60.e100278ac5cd4f7c",
        "sec-ch-ua-mobile": "?0",
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
        "request-context": "appId=cid-v1:099a45be-5030-453c-b870-6f6cb4dacdb8",
        "origin": "https://www.woolworths.com.au",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "referer": "https://www.woolworths.com.au/shop/browse/fruit-veg/fruit/organic-fruit",
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
    },
    cookies: { "AKA_A2": "A", "bff_region": "syd2", "bm_sz": "E0867DA424FA2B2F151AB21E1326DE45~YAAQVR42F+0CgKt8AQAAkkRJwA3SAE/zrgIYhL+Z4qYoSTBEn49jfx9f38efPWskWLy55Ni9DaOLYn6skObBd1TLONqSzjdhV9oN07L1poXKWzg1nxndSgQVPCFYvN4Vw3NkDK3HdcEWZMbRZnwQ8if6DnrwqWUTDBVrGWJhOqOIcQotq7kkdbLSzU/9n5QS3LM7qjt7OEM19XnorSx1RSPsPuw1DJ82jg8wILGTNG/b7rDq4JB5RjDm1bqaLCpHBjrU/THa0clJ/7cwk3wjolcf5qukMy0J87/WnNfSNC7AsCJVwkeusJVE~3687993~3486004", "rxVisitor": "1635313599728V0L3GJ2T2V0FCGOUD28SRECUS8Q6KGPH", "INGRESSCOOKIE": "1635313600.769.67.313471", "w-rctx": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA", "wow-auth-token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA", "prodwow-auth-token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA", "akaalb_woolworths.com.au": "~op=www_woolworths_com_au_ZoneA:PROD-ZoneA|www_woolworths_com_au_BFF_SYD_Launch:WOW-BFF-SYD2|~rv=36~m=PROD-ZoneA:0|WOW-BFF-SYD2:0|~os=43eb3391333cc20efbd7f812851447e6~id=05e0c998601abd19f6c33a36ec51078b", "bm_mi": "2EF7C18EBA9A2DEA91731956402705BA~Jld/Oe78DLoovLtBrHUtoQA7lsaUrGdZOVk86DE9j8fpz2a1Gt5WNn7n00rfVervCjvm/RipBx4gmS9wodiz1lBWT1ZCqt2mAwxlKdCQKtNgCDNX+uJOk7zX2wvQYVGLZZuRMeN34qCXrKF10AfLWxQvv1oU6bt4bleuEPRk2wGEvjKqESey128Dlgu+Q/fEO36aahk88WWns9A0N5gdnCY6wisbbci3VwpH+pdXBokFvHXPamzibRbQ8xZ1LBS2p/Ok+Tz0YoXy/kIJV0Udqg==", "at_check": "true", "AMCVS_4353388057AC8D357F000101%40AdobeOrg": "1", "AMCV_4353388057AC8D357F000101%40AdobeOrg": "870038026%7CMCIDTS%7C18928%7CMCMID%7C20113066842827932023914855275307523778%7CMCAAMLH-1635918400%7C8%7CMCAAMB-1635918400%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1635320800s%7CNONE%7CvVersion%7C5.0.0", "dtSa": "-", "ai_user": "fptucQ6rCsHYlozrhbCsqA|2021-10-27T05:46:40.403Z", "mboxEdgeCluster": "36", "_abck": "8D550B87C6E0E60D7BB667D9690789A7~0~YAAQVR42FysDgKt8AQAAL0xJwAZs5+Hus3XOP9N9DsWIlKRoGuHFUQnAxHE0DhnOnEMhYRBAElTuTYBfmJqzoBcDVl1mQ5RPWmJ+2kUOBRMe1ZlsLWQEFE7EwTuoyxkjkgh9dkoz8SXleKh4yBDGt+ix8kbEQByCcr1/FujaMuznUXBAL/eHHoZ+BUwpxVdejiekShZ6bGWwxekRrEVpIeYHnIupvKYjHKFEw5wvJt3fZGHspvTj21FpcZDoNBCyWY/AEN6IU6B0xXnlXIlnRx4N0/Vx3MdCRie/q8Mf5YNRl3rkuAFEMydZXJf3IfGqRRI7mD9zM3JblgPCNSoCIwQPAPnM5HmBHtXmh3h2QCpti1rxiS4b3EG8+dixlDKgbgG9ByGK4t+CxEy1NhVq3YmYhVKYAZY3BCqQqeBP~-1~||-1||~-1", "ak_bmsc": "98E6CE381E4B39EB21C72F66D667B9BD~000000000000000000000000000000~YAAQVR42FzwDgKt8AQAAvU1JwA2BQY7fKt2QzMipJ0jiP62PafXwZh4znNb/TqGPjs1lIFdoP/cru216MYb97mJofMSQxaXtprvUyH+ByIkTP1lCDy4lPvbS8fCOyNeqsrQMGIKrCJSRletW9uCmd2hrC5cxA6ef3gG3vPKaZ1od1AioV4fLwTBCmzffad3JE5kiy2WGbBSBOxmeyhhMmJ4g0as5WdkOMZAqe02u2qujDGQNzuJPeGLcT4IS5fS/pSy3mqCsHDixoxmwUWp2JtQPLmJJpvaF2NKsMPKBll55HZ4x7QrdlUSA+ZANDhb5BGb+PBIvSbTIOB4JPKIhSrHZnm3afQLHbik/XsmHVA+vOQ1Ojk+xdDFlolBrX15JuS0JE70rj1wh2u3l4y2ANJqxHbcNedEAheaNdHoDhY2fkzJprdny7/pLYcmwaTZMxNulOvmNRz8dC17HFoyffJU2nGQUCRS5TwNsHUvr/ot6iRxktJJAcgIqGC3umlnRHElDCfaNW/UNmGlgA9LqPp3KCendxghB0/xSSgAmzmGd", "s_cc": "true", "IR_gbd": "woolworths.com.au", "IR_7464": "1635313605948%7C0%7C1635313605948%7C%7C", "aam_uuid": "19677677515815171023959559883546949406", "mbox": "session#ef8d6469b650457db89ff10fd599080f#1635315461|PC#ef8d6469b650457db89ff10fd599080f.36_0#1698558407", "_uetsid": "45561f2036e911ec87215b9fbf1a5e7c", "_uetvid": "45567bc036e911ec8918171441050da9", "_fbp": "fb.2.1635313606086.300757719", "dtCookie": "v_4_srv_4_sn_A30C4ED42FD4A9F5444A8C25B2EFCC51_app-3A5cc956099f88e4b7_0_app-3Af908d76079915f06_1_ol_0_perc_100000_mul_1", "_ga": "GA1.3.982835938.1635313606", "_gid": "GA1.3.1859085090.1635313606", "_gat_gtag_UA_38610140_9": "1", "_gcl_au": "1.1.557218123.1635313606", "RT": "\"z=1&dm=www.woolworths.com.au&si=b7db7392-c516-486a-852b-4d1262d35b96&ss=kv93ht0u&sl=1&tt=1o7&rl=1&ld=1oa&nu=1uy5ch17&cl=5e0\"", "utag_main": "v_id:017cc04958d00002653ff88ef3b803069001e06100bd0$_sn:1$_se:11$_ss:0$_st:1635315406549$ses_id:1635313604818%3Bexp-session$_pn:1%3Bexp-session$vapi_domain:woolworths.com.au$dc_visit:1$dc_event:5%3Bexp-session$dc_region:ap-southeast-2%3Bexp-session", "s_sq": "%5B%5BB%5D%5D", "bm_sv": "D348AFECC9A6232DD62389AA4E8CD0DA~7ouWBcsF1QnWTRw2tagILKAd8q0Iu6+DJ7qDgYuzUENgqFyHpsOCk3y0IlrFTfUmEKGl42m6+PkRoF5TTYJ2vnzFxRTMsQKjXPIbzq7L9aRMRkyLi86Dv0x4iAbdTcfX2XGaW5axyYXD/wrrqBh6CauHwSGm+jO2CrM37+UkRP0=", "ai_session": "cuD6AF1xpG+SDTJSdhBHIy|1635313600526|1635313606868", "dtLatC": "3", "rxvt": "1635315406963|1635313599729", "dtPC": "4$313599725_232h57vEOLRLTCRJHKRLMHOCLKKKTSCCOKLHSKP-0e0" }
};

let scrapyCode2 = String.raw`from scrapy.http import Request
import json

url = "https://www.woolworths.com.au/apis/ui/browse/category"

headers = {
    "authority": "www.woolworths.com.au",
    "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
    "accept": "application/json, text/plain, */*",
    "content-type": "application/json",
    "request-id": "|6822503f181248ad84d21fadecbbcc60.e100278ac5cd4f7c",
    "sec-ch-ua-mobile": "?0",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "request-context": "appId=cid-v1:099a45be-5030-453c-b870-6f6cb4dacdb8",
    "origin": "https://www.woolworths.com.au",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
    "referer": "https://www.woolworths.com.au/shop/browse/fruit-veg/fruit/organic-fruit",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
}

cookies = {
    "AKA_A2": "A",
    "bff_region": "syd2",
    "bm_sz": "E0867DA424FA2B2F151AB21E1326DE45~YAAQVR42F+0CgKt8AQAAkkRJwA3SAE/zrgIYhL+Z4qYoSTBEn49jfx9f38efPWskWLy55Ni9DaOLYn6skObBd1TLONqSzjdhV9oN07L1poXKWzg1nxndSgQVPCFYvN4Vw3NkDK3HdcEWZMbRZnwQ8if6DnrwqWUTDBVrGWJhOqOIcQotq7kkdbLSzU/9n5QS3LM7qjt7OEM19XnorSx1RSPsPuw1DJ82jg8wILGTNG/b7rDq4JB5RjDm1bqaLCpHBjrU/THa0clJ/7cwk3wjolcf5qukMy0J87/WnNfSNC7AsCJVwkeusJVE~3687993~3486004",
    "rxVisitor": "1635313599728V0L3GJ2T2V0FCGOUD28SRECUS8Q6KGPH",
    "INGRESSCOOKIE": "1635313600.769.67.313471",
    "w-rctx": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA",
    "wow-auth-token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA",
    "prodwow-auth-token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA",
    "akaalb_woolworths.com.au": "~op=www_woolworths_com_au_ZoneA:PROD-ZoneA|www_woolworths_com_au_BFF_SYD_Launch:WOW-BFF-SYD2|~rv=36~m=PROD-ZoneA:0|WOW-BFF-SYD2:0|~os=43eb3391333cc20efbd7f812851447e6~id=05e0c998601abd19f6c33a36ec51078b",
    "bm_mi": "2EF7C18EBA9A2DEA91731956402705BA~Jld/Oe78DLoovLtBrHUtoQA7lsaUrGdZOVk86DE9j8fpz2a1Gt5WNn7n00rfVervCjvm/RipBx4gmS9wodiz1lBWT1ZCqt2mAwxlKdCQKtNgCDNX+uJOk7zX2wvQYVGLZZuRMeN34qCXrKF10AfLWxQvv1oU6bt4bleuEPRk2wGEvjKqESey128Dlgu+Q/fEO36aahk88WWns9A0N5gdnCY6wisbbci3VwpH+pdXBokFvHXPamzibRbQ8xZ1LBS2p/Ok+Tz0YoXy/kIJV0Udqg==",
    "at_check": "true",
    "AMCVS_4353388057AC8D357F000101%40AdobeOrg": "1",
    "AMCV_4353388057AC8D357F000101%40AdobeOrg": "870038026%7CMCIDTS%7C18928%7CMCMID%7C20113066842827932023914855275307523778%7CMCAAMLH-1635918400%7C8%7CMCAAMB-1635918400%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1635320800s%7CNONE%7CvVersion%7C5.0.0",
    "dtSa": "-",
    "ai_user": "fptucQ6rCsHYlozrhbCsqA|2021-10-27T05:46:40.403Z",
    "mboxEdgeCluster": "36",
    "_abck": "8D550B87C6E0E60D7BB667D9690789A7~0~YAAQVR42FysDgKt8AQAAL0xJwAZs5+Hus3XOP9N9DsWIlKRoGuHFUQnAxHE0DhnOnEMhYRBAElTuTYBfmJqzoBcDVl1mQ5RPWmJ+2kUOBRMe1ZlsLWQEFE7EwTuoyxkjkgh9dkoz8SXleKh4yBDGt+ix8kbEQByCcr1/FujaMuznUXBAL/eHHoZ+BUwpxVdejiekShZ6bGWwxekRrEVpIeYHnIupvKYjHKFEw5wvJt3fZGHspvTj21FpcZDoNBCyWY/AEN6IU6B0xXnlXIlnRx4N0/Vx3MdCRie/q8Mf5YNRl3rkuAFEMydZXJf3IfGqRRI7mD9zM3JblgPCNSoCIwQPAPnM5HmBHtXmh3h2QCpti1rxiS4b3EG8+dixlDKgbgG9ByGK4t+CxEy1NhVq3YmYhVKYAZY3BCqQqeBP~-1~||-1||~-1",
    "ak_bmsc": "98E6CE381E4B39EB21C72F66D667B9BD~000000000000000000000000000000~YAAQVR42FzwDgKt8AQAAvU1JwA2BQY7fKt2QzMipJ0jiP62PafXwZh4znNb/TqGPjs1lIFdoP/cru216MYb97mJofMSQxaXtprvUyH+ByIkTP1lCDy4lPvbS8fCOyNeqsrQMGIKrCJSRletW9uCmd2hrC5cxA6ef3gG3vPKaZ1od1AioV4fLwTBCmzffad3JE5kiy2WGbBSBOxmeyhhMmJ4g0as5WdkOMZAqe02u2qujDGQNzuJPeGLcT4IS5fS/pSy3mqCsHDixoxmwUWp2JtQPLmJJpvaF2NKsMPKBll55HZ4x7QrdlUSA+ZANDhb5BGb+PBIvSbTIOB4JPKIhSrHZnm3afQLHbik/XsmHVA+vOQ1Ojk+xdDFlolBrX15JuS0JE70rj1wh2u3l4y2ANJqxHbcNedEAheaNdHoDhY2fkzJprdny7/pLYcmwaTZMxNulOvmNRz8dC17HFoyffJU2nGQUCRS5TwNsHUvr/ot6iRxktJJAcgIqGC3umlnRHElDCfaNW/UNmGlgA9LqPp3KCendxghB0/xSSgAmzmGd",
    "s_cc": "true",
    "IR_gbd": "woolworths.com.au",
    "IR_7464": "1635313605948%7C0%7C1635313605948%7C%7C",
    "aam_uuid": "19677677515815171023959559883546949406",
    "mbox": "session#ef8d6469b650457db89ff10fd599080f#1635315461|PC#ef8d6469b650457db89ff10fd599080f.36_0#1698558407",
    "_uetsid": "45561f2036e911ec87215b9fbf1a5e7c",
    "_uetvid": "45567bc036e911ec8918171441050da9",
    "_fbp": "fb.2.1635313606086.300757719",
    "dtCookie": "v_4_srv_4_sn_A30C4ED42FD4A9F5444A8C25B2EFCC51_app-3A5cc956099f88e4b7_0_app-3Af908d76079915f06_1_ol_0_perc_100000_mul_1",
    "_ga": "GA1.3.982835938.1635313606",
    "_gid": "GA1.3.1859085090.1635313606",
    "_gat_gtag_UA_38610140_9": "1",
    "_gcl_au": "1.1.557218123.1635313606",
    "RT": "\"z=1&dm=www.woolworths.com.au&si=b7db7392-c516-486a-852b-4d1262d35b96&ss=kv93ht0u&sl=1&tt=1o7&rl=1&ld=1oa&nu=1uy5ch17&cl=5e0\"",
    "utag_main": "v_id:017cc04958d00002653ff88ef3b803069001e06100bd0$_sn:1$_se:11$_ss:0$_st:1635315406549$ses_id:1635313604818%3Bexp-session$_pn:1%3Bexp-session$vapi_domain:woolworths.com.au$dc_visit:1$dc_event:5%3Bexp-session$dc_region:ap-southeast-2%3Bexp-session",
    "s_sq": "%5B%5BB%5D%5D",
    "bm_sv": "D348AFECC9A6232DD62389AA4E8CD0DA~7ouWBcsF1QnWTRw2tagILKAd8q0Iu6+DJ7qDgYuzUENgqFyHpsOCk3y0IlrFTfUmEKGl42m6+PkRoF5TTYJ2vnzFxRTMsQKjXPIbzq7L9aRMRkyLi86Dv0x4iAbdTcfX2XGaW5axyYXD/wrrqBh6CauHwSGm+jO2CrM37+UkRP0=",
    "ai_session": "cuD6AF1xpG+SDTJSdhBHIy|1635313600526|1635313606868",
    "dtLatC": "3",
    "rxvt": "1635315406963|1635313599729",
    "dtPC": "4$313599725_232h57vEOLRLTCRJHKRLMHOCLKKKTSCCOKLHSKP-0e0"
}

payload = {
    "categoryId": "1-A90F8053",
    "pageNumber": 1,
    "pageSize": 24,
    "sortType": "TraderRelevance",
    "url": "/shop/browse/fruit-veg/fruit/organic-fruit",
    "location": "/shop/browse/fruit-veg/fruit/organic-fruit",
    "formatObject": "{\"name\":\"Organic Fruit\"}",
    "isSpecial": false,
    "isBundle": false,
    "isMobile": false,
    "filters": [],
    "token": ""
}

request = Request(
    url=url,
    callback=self.cb_name,
    method="POST",
    headers=headers,
    cookies=cookies,
    body=json.dumps(payload),
)
`;

let scrapyParse2 = String.raw`testmaster parse "https://www.woolworths.com.au/apis/ui/browse/category" --method=POST --headers='{"authority":"www.woolworths.com.au","sec-ch-ua":"\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"","accept":"application/json, text/plain, */*","content-type":"application/json","request-id":"|6822503f181248ad84d21fadecbbcc60.e100278ac5cd4f7c","sec-ch-ua-mobile":"?0","user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36","request-context":"appId=cid-v1:099a45be-5030-453c-b870-6f6cb4dacdb8","origin":"https://www.woolworths.com.au","sec-fetch-site":"same-origin","sec-fetch-mode":"cors","sec-fetch-dest":"empty","referer":"https://www.woolworths.com.au/shop/browse/fruit-veg/fruit/organic-fruit","accept-language":"en-GB,en-US;q=0.9,en;q=0.8"}' --cookies='{"AKA_A2":"A","bff_region":"syd2","bm_sz":"E0867DA424FA2B2F151AB21E1326DE45~YAAQVR42F+0CgKt8AQAAkkRJwA3SAE/zrgIYhL+Z4qYoSTBEn49jfx9f38efPWskWLy55Ni9DaOLYn6skObBd1TLONqSzjdhV9oN07L1poXKWzg1nxndSgQVPCFYvN4Vw3NkDK3HdcEWZMbRZnwQ8if6DnrwqWUTDBVrGWJhOqOIcQotq7kkdbLSzU/9n5QS3LM7qjt7OEM19XnorSx1RSPsPuw1DJ82jg8wILGTNG/b7rDq4JB5RjDm1bqaLCpHBjrU/THa0clJ/7cwk3wjolcf5qukMy0J87/WnNfSNC7AsCJVwkeusJVE~3687993~3486004","rxVisitor":"1635313599728V0L3GJ2T2V0FCGOUD28SRECUS8Q6KGPH","INGRESSCOOKIE":"1635313600.769.67.313471","w-rctx":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA","wow-auth-token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA","prodwow-auth-token":"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYmYiOjE2MzUzMTM1OTksImV4cCI6MTYzNTMxNzE5OSwiaWF0IjoxNjM1MzEzNTk5LCJpc3MiOiJXb29sd29ydGhzIiwiYXVkIjoid3d3Lndvb2x3b3J0aHMuY29tLmF1Iiwic2lkIjoiMCIsInVpZCI6ImYyOTY4MDA3LWExMjYtNDhmYS04YjFmLTM2ZjA4OTg4YjNkYiIsIm1haWQiOiIwIiwiYXV0IjoiU2hvcHBlciIsImF1YiI6IjAiLCJhdWJhIjoiMCIsIm1mYSI6IjEifQ.jPncBqw4ZIVb1Izt1qSk9H2gj-XbqsX71Qlsh6lm8e3Kb3_NQY1Y7Ta6PdApUPNAPbzvKIgo7WCtSwwVHmYy-ZWaK1a4jMzV92J9310uzonqAIQolPU-6TtZ5-pKRoD0hT_0NRAyfSDGUnUPUKWwh_IGUbjNqIV8I1Px1abC3oLqATwp2NoqPOCHU_KoWWeg1dk1-n9MrHSqG8aU68JT1cgq4x88fSl07jZGXWzKujdIrhr9xIHFMrE_cpZmHw7KigZdAr5Pnw_FyaMPaxCxYRRVduuyHKraV59rwoLnz3ITHa5LFboq4Q7nmbhpMw6h55dhKH8zLUbYCx7loxqheA","akaalb_woolworths.com.au":"~op=www_woolworths_com_au_ZoneA:PROD-ZoneA|www_woolworths_com_au_BFF_SYD_Launch:WOW-BFF-SYD2|~rv=36~m=PROD-ZoneA:0|WOW-BFF-SYD2:0|~os=43eb3391333cc20efbd7f812851447e6~id=05e0c998601abd19f6c33a36ec51078b","bm_mi":"2EF7C18EBA9A2DEA91731956402705BA~Jld/Oe78DLoovLtBrHUtoQA7lsaUrGdZOVk86DE9j8fpz2a1Gt5WNn7n00rfVervCjvm/RipBx4gmS9wodiz1lBWT1ZCqt2mAwxlKdCQKtNgCDNX+uJOk7zX2wvQYVGLZZuRMeN34qCXrKF10AfLWxQvv1oU6bt4bleuEPRk2wGEvjKqESey128Dlgu+Q/fEO36aahk88WWns9A0N5gdnCY6wisbbci3VwpH+pdXBokFvHXPamzibRbQ8xZ1LBS2p/Ok+Tz0YoXy/kIJV0Udqg==","at_check":"true","AMCVS_4353388057AC8D357F000101%40AdobeOrg":"1","AMCV_4353388057AC8D357F000101%40AdobeOrg":"870038026%7CMCIDTS%7C18928%7CMCMID%7C20113066842827932023914855275307523778%7CMCAAMLH-1635918400%7C8%7CMCAAMB-1635918400%7C6G1ynYcLPuiQxYZrsz_pkqfLG9yMXBpb2zX5dvJdYQJzPXImdj0y%7CMCOPTOUT-1635320800s%7CNONE%7CvVersion%7C5.0.0","dtSa":"-","ai_user":"fptucQ6rCsHYlozrhbCsqA|2021-10-27T05:46:40.403Z","mboxEdgeCluster":"36","_abck":"8D550B87C6E0E60D7BB667D9690789A7~0~YAAQVR42FysDgKt8AQAAL0xJwAZs5+Hus3XOP9N9DsWIlKRoGuHFUQnAxHE0DhnOnEMhYRBAElTuTYBfmJqzoBcDVl1mQ5RPWmJ+2kUOBRMe1ZlsLWQEFE7EwTuoyxkjkgh9dkoz8SXleKh4yBDGt+ix8kbEQByCcr1/FujaMuznUXBAL/eHHoZ+BUwpxVdejiekShZ6bGWwxekRrEVpIeYHnIupvKYjHKFEw5wvJt3fZGHspvTj21FpcZDoNBCyWY/AEN6IU6B0xXnlXIlnRx4N0/Vx3MdCRie/q8Mf5YNRl3rkuAFEMydZXJf3IfGqRRI7mD9zM3JblgPCNSoCIwQPAPnM5HmBHtXmh3h2QCpti1rxiS4b3EG8+dixlDKgbgG9ByGK4t+CxEy1NhVq3YmYhVKYAZY3BCqQqeBP~-1~||-1||~-1","ak_bmsc":"98E6CE381E4B39EB21C72F66D667B9BD~000000000000000000000000000000~YAAQVR42FzwDgKt8AQAAvU1JwA2BQY7fKt2QzMipJ0jiP62PafXwZh4znNb/TqGPjs1lIFdoP/cru216MYb97mJofMSQxaXtprvUyH+ByIkTP1lCDy4lPvbS8fCOyNeqsrQMGIKrCJSRletW9uCmd2hrC5cxA6ef3gG3vPKaZ1od1AioV4fLwTBCmzffad3JE5kiy2WGbBSBOxmeyhhMmJ4g0as5WdkOMZAqe02u2qujDGQNzuJPeGLcT4IS5fS/pSy3mqCsHDixoxmwUWp2JtQPLmJJpvaF2NKsMPKBll55HZ4x7QrdlUSA+ZANDhb5BGb+PBIvSbTIOB4JPKIhSrHZnm3afQLHbik/XsmHVA+vOQ1Ojk+xdDFlolBrX15JuS0JE70rj1wh2u3l4y2ANJqxHbcNedEAheaNdHoDhY2fkzJprdny7/pLYcmwaTZMxNulOvmNRz8dC17HFoyffJU2nGQUCRS5TwNsHUvr/ot6iRxktJJAcgIqGC3umlnRHElDCfaNW/UNmGlgA9LqPp3KCendxghB0/xSSgAmzmGd","s_cc":"true","IR_gbd":"woolworths.com.au","IR_7464":"1635313605948%7C0%7C1635313605948%7C%7C","aam_uuid":"19677677515815171023959559883546949406","mbox":"session#ef8d6469b650457db89ff10fd599080f#1635315461|PC#ef8d6469b650457db89ff10fd599080f.36_0#1698558407","_uetsid":"45561f2036e911ec87215b9fbf1a5e7c","_uetvid":"45567bc036e911ec8918171441050da9","_fbp":"fb.2.1635313606086.300757719","dtCookie":"v_4_srv_4_sn_A30C4ED42FD4A9F5444A8C25B2EFCC51_app-3A5cc956099f88e4b7_0_app-3Af908d76079915f06_1_ol_0_perc_100000_mul_1","_ga":"GA1.3.982835938.1635313606","_gid":"GA1.3.1859085090.1635313606","_gat_gtag_UA_38610140_9":"1","_gcl_au":"1.1.557218123.1635313606","RT":"\"z=1&dm=www.woolworths.com.au&si=b7db7392-c516-486a-852b-4d1262d35b96&ss=kv93ht0u&sl=1&tt=1o7&rl=1&ld=1oa&nu=1uy5ch17&cl=5e0\"","utag_main":"v_id:017cc04958d00002653ff88ef3b803069001e06100bd0$_sn:1$_se:11$_ss:0$_st:1635315406549$ses_id:1635313604818%3Bexp-session$_pn:1%3Bexp-session$vapi_domain:woolworths.com.au$dc_visit:1$dc_event:5%3Bexp-session$dc_region:ap-southeast-2%3Bexp-session","s_sq":"%5B%5BB%5D%5D","bm_sv":"D348AFECC9A6232DD62389AA4E8CD0DA~7ouWBcsF1QnWTRw2tagILKAd8q0Iu6+DJ7qDgYuzUENgqFyHpsOCk3y0IlrFTfUmEKGl42m6+PkRoF5TTYJ2vnzFxRTMsQKjXPIbzq7L9aRMRkyLi86Dv0x4iAbdTcfX2XGaW5axyYXD/wrrqBh6CauHwSGm+jO2CrM37+UkRP0=","ai_session":"cuD6AF1xpG+SDTJSdhBHIy|1635313600526|1635313606868","dtLatC":"3","rxvt":"1635315406963|1635313599729","dtPC":"4$313599725_232h57vEOLRLTCRJHKRLMHOCLKKKTSCCOKLHSKP-0e0"}' --data='{"categoryId":"1-A90F8053","pageNumber":1,"pageSize":24,"sortType":"TraderRelevance","url":"/shop/browse/fruit-veg/fruit/organic-fruit","location":"/shop/browse/fruit-veg/fruit/organic-fruit","formatObject":"{\"name\":\"Organic Fruit\"}","isSpecial":false,"isBundle":false,"isMobile":false,"filters":[],"token":""}' --spider=[SPIDER_NAME] -c [CALLBACK_NAME]`

let curlExample3 = String.raw`
curl 'https://dpwmoiyhyw-dsn.algolia.net/1/indexes/*/queries?x-algolia-agent=Algolia%20for%20vanilla%20JavaScript%20(lite)%203.27.0%3Binstantsearch.js%202.10.2%3BMagento2%20integration%20(1.13.0)%3BJS%20Helper%202.26.0&x-algolia-application-id=DPWMOIYHYW' \
-H 'Connection: keep-alive' \
-H 'sec-ch-ua: "Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"' \
-H 'accept: application/json' \
-H 'sec-ch-ua-mobile: ?0' \
-H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36' \
-H 'content-type: application/x-www-form-urlencoded' \
-H 'Origin: https://www.bonds.com.au' \
-H 'Sec-Fetch-Site: cross-site' \
-H 'Sec-Fetch-Mode: cors' \
-H 'Sec-Fetch-Dest: empty' \
-H 'Accept-Language: en-GB,en-US;q=0.9,en;q=0.8' \
--data-raw '{"requests":[{"indexName":"prod_bonds_m2_bonds_products","params":"query=&hitsPerPage=12&maxValuesPerFacet=20&page=0&ruleContexts=%5B%22magento_filters%22%2C%22%22%2C%22magento-category-1782%22%5D&clickAnalytics=true&facets=%5B%22size%22%2C%22absorbency%22%2C%22colour_group%22%2C%22special_offer%22%2C%22range%22%2C%22shape%22%2C%22length%22%2C%22fabric%22%2C%22afl_team%22%2C%22price.AUD.group_0%22%5D&tagFilters=&facetFilters=%5B%22categories.level2%3AMen%20%2F%2F%2F%20Underwear%20%2F%2F%2F%20Trunks%22%5D&numericFilters=%5B%22visibility_catalog%3D1%22%5D"}],"apiKey":"ZjY3MzRhMGQyMjEzMGZhMjc2MWIxN2Q2MzJiMGZiMDhjNGE4Y2I5YzQ1OGEwZDUyNGFhOTYxZDY3YjU3NzJjOWF0dHJpYnV0ZXNUb1JldHJpZXZlPSU1QiUyMm5hbWUlMjIlMkMlMjJza3UlMjIlMkMlMjJtYW51ZmFjdHVyZXIlMjIlMkMlMjJjYXRlZ29yaWVzJTIyJTJDJTIyY29sb3IlMjIlMkMlMjJyYXRpbmdfc3VtbWFyeSUyMiUyQyUyMm1lZGlhX2dhbGxlcnklMjIlMkMlMjJhbHRfaW1hZ2UlMjIlMkMlMjJwYXJlbnRfc3R5bGUlMjIlMkMlMjJ2aWRlb191cmxfbXA0JTIyJTJDJTIydmlkZW9fdXJsX3N0cmVhbWluZyUyMiUyQyUyMmNvbWluZ19zb29uJTIyJTJDJTIycGVyc29uYWxpc2VkX2NvdmVyJTIyJTJDJTIyc2l6ZSUyMiUyQyUyMmFic29yYmVuY3klMjIlMkMlMjJjb2xvdXJfZ3JvdXAlMjIlMkMlMjJzcGVjaWFsX29mZmVyJTIyJTJDJTIycmFuZ2UlMjIlMkMlMjJzaGFwZSUyMiUyQyUyMmxlbmd0aCUyMiUyQyUyMmZhYnJpYyUyMiUyQyUyMmFmbF90ZWFtJTIyJTJDJTIyc29ydF9vcmRlcjIlMjIlMkMlMjJuZXdzX2Zyb21fZGF0ZSUyMiUyQyUyMm1vc3RfcG9wdWxhciUyMiUyQyUyMnBhdGglMjIlMkMlMjJtZXRhX3RpdGxlJTIyJTJDJTIybWV0YV9rZXl3b3JkcyUyMiUyQyUyMm1ldGFfZGVzY3JpcHRpb24lMjIlMkMlMjJwcm9kdWN0X2NvdW50JTIyJTJDJTIyb2JqZWN0SUQlMjIlMkMlMjJ1cmwlMjIlMkMlMjJ2aXNpYmlsaXR5X3NlYXJjaCUyMiUyQyUyMnZpc2liaWxpdHlfY2F0YWxvZyUyMiUyQyUyMmNhdGVnb3JpZXNfd2l0aG91dF9wYXRoJTIyJTJDJTIydGh1bWJuYWlsX3VybCUyMiUyQyUyMmltYWdlX3VybCUyMiUyQyUyMmltYWdlc19kYXRhJTIyJTJDJTIyaW5fc3RvY2slMjIlMkMlMjJ0eXBlX2lkJTIyJTJDJTIydmFsdWUlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X3RpZXIlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllciUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfZnJvbV9kYXRlJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfdG9fZGF0ZSUyMiUyQyUyMmhhbmVzX2xhYmVscyUyMiUyQyUyMmFzc29jaWF0ZWRfYW1vdW50JTIyJTJDJTIyYXNzb2NpYXRlZF9zd2F0Y2hlcyUyMiUyQyUyMnByaWNlX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF90aWVyX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZ3JvdXBfMF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX3RpZXJfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuc3BlY2lhbF9mcm9tX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5zcGVjaWFsX3RvX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlX2Zyb21fZnJvbSUyMiUyQyUyMmd0bV9kYXRhJTIyJTJDJTIycHJpY2VfcGVyX2l0ZW0lMjIlNUQ="}' \
--compressed
`;

let curlObject3 = {
    url: "https://dpwmoiyhyw-dsn.algolia.net/1/indexes/*/queries",
    params: {"x-algolia-agent": "Algolia for vanilla JavaScript (lite) 3.27.0;instantsearch.js 2.10.2;Magento2 integration (1.13.0);JS Helper 2.26.0", "x-algolia-application-id": "DPWMOIYHYW"},
    method: "POST",
    data: {"requests":[{"indexName":"prod_bonds_m2_bonds_products","params":"query=&hitsPerPage=12&maxValuesPerFacet=20&page=0&ruleContexts=%5B%22magento_filters%22%2C%22%22%2C%22magento-category-1782%22%5D&clickAnalytics=true&facets=%5B%22size%22%2C%22absorbency%22%2C%22colour_group%22%2C%22special_offer%22%2C%22range%22%2C%22shape%22%2C%22length%22%2C%22fabric%22%2C%22afl_team%22%2C%22price.AUD.group_0%22%5D&tagFilters=&facetFilters=%5B%22categories.level2%3AMen%20%2F%2F%2F%20Underwear%20%2F%2F%2F%20Trunks%22%5D&numericFilters=%5B%22visibility_catalog%3D1%22%5D"}],"apiKey":"ZjY3MzRhMGQyMjEzMGZhMjc2MWIxN2Q2MzJiMGZiMDhjNGE4Y2I5YzQ1OGEwZDUyNGFhOTYxZDY3YjU3NzJjOWF0dHJpYnV0ZXNUb1JldHJpZXZlPSU1QiUyMm5hbWUlMjIlMkMlMjJza3UlMjIlMkMlMjJtYW51ZmFjdHVyZXIlMjIlMkMlMjJjYXRlZ29yaWVzJTIyJTJDJTIyY29sb3IlMjIlMkMlMjJyYXRpbmdfc3VtbWFyeSUyMiUyQyUyMm1lZGlhX2dhbGxlcnklMjIlMkMlMjJhbHRfaW1hZ2UlMjIlMkMlMjJwYXJlbnRfc3R5bGUlMjIlMkMlMjJ2aWRlb191cmxfbXA0JTIyJTJDJTIydmlkZW9fdXJsX3N0cmVhbWluZyUyMiUyQyUyMmNvbWluZ19zb29uJTIyJTJDJTIycGVyc29uYWxpc2VkX2NvdmVyJTIyJTJDJTIyc2l6ZSUyMiUyQyUyMmFic29yYmVuY3klMjIlMkMlMjJjb2xvdXJfZ3JvdXAlMjIlMkMlMjJzcGVjaWFsX29mZmVyJTIyJTJDJTIycmFuZ2UlMjIlMkMlMjJzaGFwZSUyMiUyQyUyMmxlbmd0aCUyMiUyQyUyMmZhYnJpYyUyMiUyQyUyMmFmbF90ZWFtJTIyJTJDJTIyc29ydF9vcmRlcjIlMjIlMkMlMjJuZXdzX2Zyb21fZGF0ZSUyMiUyQyUyMm1vc3RfcG9wdWxhciUyMiUyQyUyMnBhdGglMjIlMkMlMjJtZXRhX3RpdGxlJTIyJTJDJTIybWV0YV9rZXl3b3JkcyUyMiUyQyUyMm1ldGFfZGVzY3JpcHRpb24lMjIlMkMlMjJwcm9kdWN0X2NvdW50JTIyJTJDJTIyb2JqZWN0SUQlMjIlMkMlMjJ1cmwlMjIlMkMlMjJ2aXNpYmlsaXR5X3NlYXJjaCUyMiUyQyUyMnZpc2liaWxpdHlfY2F0YWxvZyUyMiUyQyUyMmNhdGVnb3JpZXNfd2l0aG91dF9wYXRoJTIyJTJDJTIydGh1bWJuYWlsX3VybCUyMiUyQyUyMmltYWdlX3VybCUyMiUyQyUyMmltYWdlc19kYXRhJTIyJTJDJTIyaW5fc3RvY2slMjIlMkMlMjJ0eXBlX2lkJTIyJTJDJTIydmFsdWUlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X3RpZXIlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllciUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfZnJvbV9kYXRlJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfdG9fZGF0ZSUyMiUyQyUyMmhhbmVzX2xhYmVscyUyMiUyQyUyMmFzc29jaWF0ZWRfYW1vdW50JTIyJTJDJTIyYXNzb2NpYXRlZF9zd2F0Y2hlcyUyMiUyQyUyMnByaWNlX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF90aWVyX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZ3JvdXBfMF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX3RpZXJfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuc3BlY2lhbF9mcm9tX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5zcGVjaWFsX3RvX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlX2Zyb21fZnJvbSUyMiUyQyUyMmd0bV9kYXRhJTIyJTJDJTIycHJpY2VfcGVyX2l0ZW0lMjIlNUQ="},
    isForm: true,
    headers: {
        "Connection": "keep-alive",
        "sec-ch-ua": '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
        "accept": "application/json",
        "sec-ch-ua-mobile": "?0",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
        "content-type": "application/x-www-form-urlencoded",
        "Origin": "https://www.bonds.com.au",
        "Sec-Fetch-Site": "cross-site",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Dest": "empty",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8"
    },
    cookies: null
};

let scrapyCode3 = String.raw`from scrapy.http import FormRequest
from urllib.parse import urlencode

base_url = "https://dpwmoiyhyw-dsn.algolia.net/1/indexes/*/queries"

params = {
    "x-algolia-agent": "Algolia for vanilla JavaScript (lite) 3.27.0;instantsearch.js 2.10.2;Magento2 integration (1.13.0);JS Helper 2.26.0",
    "x-algolia-application-id": "DPWMOIYHYW"
}

headers = {
    "Connection": "keep-alive",
    "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"",
    "accept": "application/json",
    "sec-ch-ua-mobile": "?0",
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "content-type": "application/x-www-form-urlencoded",
    "Origin": "https://www.bonds.com.au",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8"
}

formdata = {
    "requests": [
        {
            "indexName": "prod_bonds_m2_bonds_products",
            "params": "query=&hitsPerPage=12&maxValuesPerFacet=20&page=0&ruleContexts=%5B%22magento_filters%22%2C%22%22%2C%22magento-category-1782%22%5D&clickAnalytics=true&facets=%5B%22size%22%2C%22absorbency%22%2C%22colour_group%22%2C%22special_offer%22%2C%22range%22%2C%22shape%22%2C%22length%22%2C%22fabric%22%2C%22afl_team%22%2C%22price.AUD.group_0%22%5D&tagFilters=&facetFilters=%5B%22categories.level2%3AMen%20%2F%2F%2F%20Underwear%20%2F%2F%2F%20Trunks%22%5D&numericFilters=%5B%22visibility_catalog%3D1%22%5D"
        }
    ],
    "apiKey": "ZjY3MzRhMGQyMjEzMGZhMjc2MWIxN2Q2MzJiMGZiMDhjNGE4Y2I5YzQ1OGEwZDUyNGFhOTYxZDY3YjU3NzJjOWF0dHJpYnV0ZXNUb1JldHJpZXZlPSU1QiUyMm5hbWUlMjIlMkMlMjJza3UlMjIlMkMlMjJtYW51ZmFjdHVyZXIlMjIlMkMlMjJjYXRlZ29yaWVzJTIyJTJDJTIyY29sb3IlMjIlMkMlMjJyYXRpbmdfc3VtbWFyeSUyMiUyQyUyMm1lZGlhX2dhbGxlcnklMjIlMkMlMjJhbHRfaW1hZ2UlMjIlMkMlMjJwYXJlbnRfc3R5bGUlMjIlMkMlMjJ2aWRlb191cmxfbXA0JTIyJTJDJTIydmlkZW9fdXJsX3N0cmVhbWluZyUyMiUyQyUyMmNvbWluZ19zb29uJTIyJTJDJTIycGVyc29uYWxpc2VkX2NvdmVyJTIyJTJDJTIyc2l6ZSUyMiUyQyUyMmFic29yYmVuY3klMjIlMkMlMjJjb2xvdXJfZ3JvdXAlMjIlMkMlMjJzcGVjaWFsX29mZmVyJTIyJTJDJTIycmFuZ2UlMjIlMkMlMjJzaGFwZSUyMiUyQyUyMmxlbmd0aCUyMiUyQyUyMmZhYnJpYyUyMiUyQyUyMmFmbF90ZWFtJTIyJTJDJTIyc29ydF9vcmRlcjIlMjIlMkMlMjJuZXdzX2Zyb21fZGF0ZSUyMiUyQyUyMm1vc3RfcG9wdWxhciUyMiUyQyUyMnBhdGglMjIlMkMlMjJtZXRhX3RpdGxlJTIyJTJDJTIybWV0YV9rZXl3b3JkcyUyMiUyQyUyMm1ldGFfZGVzY3JpcHRpb24lMjIlMkMlMjJwcm9kdWN0X2NvdW50JTIyJTJDJTIyb2JqZWN0SUQlMjIlMkMlMjJ1cmwlMjIlMkMlMjJ2aXNpYmlsaXR5X3NlYXJjaCUyMiUyQyUyMnZpc2liaWxpdHlfY2F0YWxvZyUyMiUyQyUyMmNhdGVnb3JpZXNfd2l0aG91dF9wYXRoJTIyJTJDJTIydGh1bWJuYWlsX3VybCUyMiUyQyUyMmltYWdlX3VybCUyMiUyQyUyMmltYWdlc19kYXRhJTIyJTJDJTIyaW5fc3RvY2slMjIlMkMlMjJ0eXBlX2lkJTIyJTJDJTIydmFsdWUlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X3RpZXIlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllciUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfZnJvbV9kYXRlJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfdG9fZGF0ZSUyMiUyQyUyMmhhbmVzX2xhYmVscyUyMiUyQyUyMmFzc29jaWF0ZWRfYW1vdW50JTIyJTJDJTIyYXNzb2NpYXRlZF9zd2F0Y2hlcyUyMiUyQyUyMnByaWNlX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF90aWVyX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZ3JvdXBfMF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX3RpZXJfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuc3BlY2lhbF9mcm9tX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5zcGVjaWFsX3RvX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlX2Zyb21fZnJvbSUyMiUyQyUyMmd0bV9kYXRhJTIyJTJDJTIycHJpY2VfcGVyX2l0ZW0lMjIlNUQ="
}

request = FormRequest(
    url=base_url+"?"+urlencode(params),
    callback=self.cb_name,
    method="POST",
    headers=headers,
    formdata=formdata,
)
`;

let scrapyParse3 = String.raw`testmaster parse "https://dpwmoiyhyw-dsn.algolia.net/1/indexes/*/queries" --params='{"x-algolia-agent":"Algolia for vanilla JavaScript (lite) 3.27.0;instantsearch.js 2.10.2;Magento2 integration (1.13.0);JS Helper 2.26.0","x-algolia-application-id":"DPWMOIYHYW"}' --method=POST --form --headers='{"Connection":"keep-alive","sec-ch-ua":"\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Google Chrome\";v=\"92\"","accept":"application/json","sec-ch-ua-mobile":"?0","User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36","content-type":"application/x-www-form-urlencoded","Origin":"https://www.bonds.com.au","Sec-Fetch-Site":"cross-site","Sec-Fetch-Mode":"cors","Sec-Fetch-Dest":"empty","Accept-Language":"en-GB,en-US;q=0.9,en;q=0.8"}' --data='{"requests":[{"indexName":"prod_bonds_m2_bonds_products","params":"query=&hitsPerPage=12&maxValuesPerFacet=20&page=0&ruleContexts=%5B%22magento_filters%22%2C%22%22%2C%22magento-category-1782%22%5D&clickAnalytics=true&facets=%5B%22size%22%2C%22absorbency%22%2C%22colour_group%22%2C%22special_offer%22%2C%22range%22%2C%22shape%22%2C%22length%22%2C%22fabric%22%2C%22afl_team%22%2C%22price.AUD.group_0%22%5D&tagFilters=&facetFilters=%5B%22categories.level2%3AMen%20%2F%2F%2F%20Underwear%20%2F%2F%2F%20Trunks%22%5D&numericFilters=%5B%22visibility_catalog%3D1%22%5D"}],"apiKey":"ZjY3MzRhMGQyMjEzMGZhMjc2MWIxN2Q2MzJiMGZiMDhjNGE4Y2I5YzQ1OGEwZDUyNGFhOTYxZDY3YjU3NzJjOWF0dHJpYnV0ZXNUb1JldHJpZXZlPSU1QiUyMm5hbWUlMjIlMkMlMjJza3UlMjIlMkMlMjJtYW51ZmFjdHVyZXIlMjIlMkMlMjJjYXRlZ29yaWVzJTIyJTJDJTIyY29sb3IlMjIlMkMlMjJyYXRpbmdfc3VtbWFyeSUyMiUyQyUyMm1lZGlhX2dhbGxlcnklMjIlMkMlMjJhbHRfaW1hZ2UlMjIlMkMlMjJwYXJlbnRfc3R5bGUlMjIlMkMlMjJ2aWRlb191cmxfbXA0JTIyJTJDJTIydmlkZW9fdXJsX3N0cmVhbWluZyUyMiUyQyUyMmNvbWluZ19zb29uJTIyJTJDJTIycGVyc29uYWxpc2VkX2NvdmVyJTIyJTJDJTIyc2l6ZSUyMiUyQyUyMmFic29yYmVuY3klMjIlMkMlMjJjb2xvdXJfZ3JvdXAlMjIlMkMlMjJzcGVjaWFsX29mZmVyJTIyJTJDJTIycmFuZ2UlMjIlMkMlMjJzaGFwZSUyMiUyQyUyMmxlbmd0aCUyMiUyQyUyMmZhYnJpYyUyMiUyQyUyMmFmbF90ZWFtJTIyJTJDJTIyc29ydF9vcmRlcjIlMjIlMkMlMjJuZXdzX2Zyb21fZGF0ZSUyMiUyQyUyMm1vc3RfcG9wdWxhciUyMiUyQyUyMnBhdGglMjIlMkMlMjJtZXRhX3RpdGxlJTIyJTJDJTIybWV0YV9rZXl3b3JkcyUyMiUyQyUyMm1ldGFfZGVzY3JpcHRpb24lMjIlMkMlMjJwcm9kdWN0X2NvdW50JTIyJTJDJTIyb2JqZWN0SUQlMjIlMkMlMjJ1cmwlMjIlMkMlMjJ2aXNpYmlsaXR5X3NlYXJjaCUyMiUyQyUyMnZpc2liaWxpdHlfY2F0YWxvZyUyMiUyQyUyMmNhdGVnb3JpZXNfd2l0aG91dF9wYXRoJTIyJTJDJTIydGh1bWJuYWlsX3VybCUyMiUyQyUyMmltYWdlX3VybCUyMiUyQyUyMmltYWdlc19kYXRhJTIyJTJDJTIyaW5fc3RvY2slMjIlMkMlMjJ0eXBlX2lkJTIyJTJDJTIydmFsdWUlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X3RpZXIlMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllciUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mb3JtYXRlZCUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfZnJvbV9kYXRlJTIyJTJDJTIycHJpY2UuQVVELnNwZWNpYWxfdG9fZGF0ZSUyMiUyQyUyMmhhbmVzX2xhYmVscyUyMiUyQyUyMmFzc29jaWF0ZWRfYW1vdW50JTIyJTJDJTIyYXNzb2NpYXRlZF9zd2F0Y2hlcyUyMiUyQyUyMnByaWNlX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmRlZmF1bHRfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5kZWZhdWx0X29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZGVmYXVsdF90aWVyX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuZ3JvdXBfMF9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfdGllcl9mcm9tJTIyJTJDJTIycHJpY2UuQVVELmdyb3VwXzBfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX3RpZXJfZm9ybWF0ZWRfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5ncm91cF8wX29yaWdpbmFsX2Zvcm1hdGVkX2Zyb20lMjIlMkMlMjJwcmljZS5BVUQuc3BlY2lhbF9mcm9tX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlLkFVRC5zcGVjaWFsX3RvX2RhdGVfZnJvbSUyMiUyQyUyMnByaWNlX2Zyb21fZnJvbSUyMiUyQyUyMmd0bV9kYXRhJTIyJTJDJTIycHJpY2VfcGVyX2l0ZW0lMjIlNUQ="}' --spider=[SPIDER_NAME] -c [CALLBACK_NAME]`;

describe('getCurlObject()', function() {
    it('it should translate the curl string to a convenient object', function() {
        assert.deepStrictEqual(getCurlObject(curlExample1), curlObject1);
        assert.deepStrictEqual(getCurlObject(curlExample2), curlObject2);
        assert.deepStrictEqual(getCurlObject(curlExample3), curlObject3);
    });
});

describe('translateToScrapy()', function() {
    it('it should translate the curl object to the equivalent Scrapy code', function() {
        assert.equal(curl2scrapyCode(curlExample1), scrapyCode1);
        assert.equal(curl2scrapyCode(curlExample2), scrapyCode2);
        assert.equal(curl2scrapyCode(curlExample3), scrapyCode3);
    });
});


describe('translateToScrapyParse()', function() {
    it('it should translate the curl object to the equivalent parse command', function() {
        assert.equal(curl2scrapyParse(curlExample1), scrapyParse1);
        assert.equal(curl2scrapyParse(curlExample2), scrapyParse2);
        assert.equal(curl2scrapyParse(curlExample3), scrapyParse3);
    });
});
