// ==UserScript==
// @name         IBRaddNextResult
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  イバラの各キャラの結果に次回へのリンクを追加する
// @author       @nrsr_cw
// @downloadURL  https://github.com/sakashima/teikiTools/blob/master/IBRaddNextResult.user.js
// @updateURL    https://github.com/sakashima/teikiTools/blob/master/IBRaddNextResult.user.js
// @match        http://lisge.com/ib/k/*/r*.html
// @exclude      http://lisge.com/ib/k/*/r*b*.html
// @exclude      http://lisge.com/ib/k/now/*
// @icon         https://www.google.com/s2/favicons?domain=lisge.com
// @grant        none
// ==/UserScript==

(function($) {
    'use strict';
    main();

    async function main(){
        const CSS = '<style>.adnxtl_wrap{margin-bottom: 0;display: inline-flex;justify-content: space-between;width: 100%;}</style>';
        $('head').append(CSS);

        const thisTime = getResultTime();

        const nowTime = await getIndexTime(thisTime.locationHostName);
        let nextTime = thisTime.time + 1;
        let nextHref = '';

        if(nowTime === nextTime){
            nextHref = 'now';
        }else{
            nextHref = nextTime;
        }
        const mainContainer = $('div.MXM');
        const prevResult = mainContainer.children('a.B').first();
        prevResult.addClass('adnxtl_prev');

        let nextResult = $('<a></a>' ,{
            "class": 'B adnxtl_next',
            href: `${thisTime.locationHostName}ib/k/${nextHref}/${thisTime.pathName}`,
            text: `${thisTime.time}:00～${nextTime}:00 >>`
        });
        const resultLinkWrap = $('<div></div>' ,{
            "class": 'adnxtl_wrap'
        });

        prevResult.wrap(resultLinkWrap);
        prevResult.after(nextResult);
    }
    async function getIndexTime(locationHostName){
        let titleTxt,timeTemp;

        const resp = await fetch(locationHostName + 'ib/', {
            method: 'GET',
        });
        const text = await resp.text();
        const data = new DOMParser().parseFromString(text, 'text/html');
        const body = $(data);

        titleTxt = body.find('.TTL').first().text();
        timeTemp = titleTxt.replace(/\D/g, '');
        return Number(timeTemp);
    }
    function getResultTime(){
        let timeTemp, thisTime;
        const locationBase = document.location.href;
        const locationHostName = document.location.protocol + '//' + document.location.hostname + '/';
        let hrefTimeBase = locationBase.replace(locationHostName, '');
        const match = /(\/[0-9]{1,}\/)|(\/[0-9]{1,}s\d\/)|(\/now\/)/g;
        let hrefTime = match.exec(hrefTimeBase);
        timeTemp = hrefTime[0].replace(/\//g, '');
            if(timeTemp.match(/\d(?=s)/)){
                // 再更新前の結果
                let timeTempArr = timeTemp.split('s');
                thisTime = Number(timeTempArr[0]);
            }else {
                // 確定した結果
                thisTime = Number(timeTemp);
            }
        const pathNameBase = document.location.pathname;
        let pathName = pathNameBase.split('/');

        return {'time':thisTime, 'locationHostName': locationHostName, 'pathName': pathName[4]};
    }
})(jQuery);