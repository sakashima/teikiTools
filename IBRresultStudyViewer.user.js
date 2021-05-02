// ==UserScript==
// @name         IBRresultStudyViewer
// @namespace    http://tampermonkey.net/
// @version      0.5.1
// @downloadURL  https://github.com/sakashima/teikiTools/blob/master/IBRresultStudyViewer.user.js
// @updateURL    https://github.com/sakashima/teikiTools/blob/master/IBRresultStudyViewer.user.js
// @description  騒乱イバラシティの決闘結果・練習戦結果に研究深度を載せる
// @author       @nrsr_cw
// @match        http://lisge.com/ib/k/*/*b3.html
// @match        http://lisge.com/ib/k/*/*b4.html
// @exclude      http://lisge.com/ib/k/1/*
// @icon         https://www.google.com/s2/favicons?domain=lisge.com
// @grant        none
// ==/UserScript==

(function($){
    'use strict';
    const vsIMG = $(document).find('img[src$="vs.png"]');
    const vsTable = vsIMG.parents('table').parent();

    const stdvPreCSS = '<style>'+
    '.stdvMainBtn{display:block;margin: 10px auto 14px; padding:12px; -webkit-appearance: none; background-color: #000; color: #FFF; text-align:center;font-size:16px; font-weight: 700; line-height: 1; border: 2px solid #DDBB00; border-radius:12px;}\n'+
    '.stdvSubBtn{display:block;margin: 0 auto;-webkit-appearance: none;color: #666; border:none;background:none;text-decoration:underline;}\n'+
    '.stdvMainBtn:hoverm,stdvSubBtn:hover{cursor: pointer;}\n'+
    '</style>';

    $('head').append(stdvPreCSS);
    let stdvArea = $('<div></div>',{
        "class": 'CENTER'
    });

    const btnElm = $('<button></button>',{
        text: '研究具合を表示する',
        "id": 'stdvMainBtn',
        "class": 'stdvMainBtn',
        type : 'button'
    });
    const btnElmcache = $('<button></button>', {
        text: 'キャッシュをクリアして表示',
        "id": 'stdvSubBtn',
        "class": 'stdvSubBtn',
        type: 'button'
    });

    btnElm.appendTo(stdvArea);
    btnElmcache.appendTo(stdvArea);
    stdvArea.insertAfter(vsTable);

    btnElm.on('click', function(){
        main();
    });
    btnElmcache.on('click', function(){
        main('reload');
    });

    /* メイン関数 */
    async function main(cache = 'default'){
        btnElm.prop('disable', true).text('取得中...');
        btnElmcache.prop('disable', true).remove();

        const stdvMainCSS = '<style>' +
            '.stdvMainArea{width: 80%; margin: 0 auto;padding: 40px 0;}'+
            '.stdvMainArea.is-hidden{display:none;}'+
            '.stdv_container{padding-bottom:0;position:relative;z-index:5;}' +
            '.stdv_container::before{content:"";display:block;width:110%;height:100%;position:absolute;top:10px;left:-5%;z-index:-5;border:3px solid #DDBB00}' +
            '.stdv_container.container1::before{border-color:#CC3333}' +
            '.stdv_container.container0{margin-bottom: 70px;}' +
            '.stdv_team_name_box{padding: 0.25em 0 0.5em;position:relative;font-size:20px;font-weight:700;text-align:center;}' +
            '.stdv_container.container0 .stdv_team_name_box{color:#DDBB00;}' +
            '.stdv_container.container1 .stdv_team_name_box{color:#CC3333;}' +
            '.stdv_team_name_box::before{content: "";display: block;width: 90%;height: 120%;position: absolute;top: -40%;left: 17%;z-index: -5;border: 6px solid #DDBB00;transform: perspective(25px) rotateY(1deg);background-color: #000;}' +
            '.stdv_container.container1 .stdv_team_name_box::before{border-color:#CC3333}' +
            '.stdv_charaName{padding: 0.75em 0 0.5em;position:sticky;top:0;left:0;z-index:10;font-size: 1.25em;text-align:center; color:#FFF;text-shadow: 1px 1px 0px #000,1px -1px 1px #000,-1px -1px 0px #000,1px -1px 0px #000,-1px 2px 0px #000;}' +
            '.stdv_container.container0 .stdv_charaName{background-color:#DDBB00;}' +
            '.stdv_container.container1 .stdv_charaName{background-color:#CC3333;}' +
            '.stdv_main_table{width:100%;border-collapse: collapse;}.stdv_study{width: 10%;}.stdv_skill{width: 90%;padding:0.65em 0;}' +
            '.stdv_main_table tr:not(:last-of-type) td{border-bottom: 1px solid #AAA;}' +
            '.stdv_study_wrap{display: flex; align-items: center; width: 100%;height: 100%; position:relative;}'+
            '.stdv_study.study3 .stdv_study_wrap{padding-left:6px;font-size:1.25em;font-weight:700;color:#CC6666;border-left: 12px solid #CC6666;box-sizing:border-box;}' +
            '.stdv_study.study3 + td{font-weight: 700;}' +
            '.stdv_study.study2 .stdv_study_wrap{padding-left:3px;font-weight:700;color:#CC3333;border-left: 6px solid #CC3333;box-sizing:border-box;}' +
            '.stdv_empty .td_empty{padding:0.65em 0;text-align: center;}'+
            '</style>'; //メインtableのCSS設定

        let baseArea = createArea(); // <div>作成
        let tableBox0 = $('<div></div>',{
            "id": 'stdv_container0',
            "class": 'stdv_container container0'
        });
        let tableBox1 = $('<div></div>',{
            "id": 'stdv_container1',
            "class": 'stdv_container container1'
        });
        let table0 = $('<table></table>',{
            "class": 'team1 stdv_main_table'
        });
        let table1 = $('<table></table>',{
            "class": 'team2 stdv_main_table'
        });
        $('head').append(stdvMainCSS); //メインCSSをheadに追加
        baseArea.append(tableBox0,tableBox1);
        stdvArea.append(baseArea); //<div>をエリアに挿入


        //更新回の取得（now,それ以外）
        const resultTime = await getResultTime(cache);

        //参加メンバーの基本情報を取得
        const characters = [getCharacters('left', resultTime), getCharacters('right', resultTime)];

        // Tableの中身作成（キャラごとのループ、要素作成）
        const tables = createTeamTableCell(characters, table0, table1, cache);
        tables.then( (data) => {
            $('.stdvMainArea').removeClass('is-hidden'); //エリアを表示
            btnElm.remove(); //ボタン要素を削除
            return data;
        });
    }

    function createArea(){
        // エリア作成
        let stdvMainArea = $('<div></div>',{
            "class": 'stdvMainArea is-hidden'
        });

        return stdvMainArea;
    }
    async function getResultTime(cacheText){
        let thisTime;
        let timeTemp;
        let resultTime = {};

        const locationBase = document.location.href;
        const locationHostName = document.location.protocol + '//' + document.location.hostname + '/';
        let hrefTimeBase = locationBase.replace(locationHostName, '');
        const match = /(\/[0-9]{1,}\/)|(\/[0-9]{1,}s\d\/)|(\/now\/)/g;
        let hrefTime = match.exec(hrefTimeBase);

        if(hrefTime[0].match('now')){
            // 最新の結果の場合
            let titleTxt = '';
            const resp = await fetch(locationHostName + 'ib/', {
                method: 'GET',
                cache: cacheText
            });
            const text = await resp.text();
            const data = new DOMParser().parseFromString(text, 'text/html');
            const body = $(data);
            titleTxt = body.find('.TTL').first().text();
            timeTemp = titleTxt.replace(/\D/g, '');
            thisTime = Number(timeTemp);
        }else{
            // それ以外
            timeTemp = hrefTime[0].replace(/\//g, '');
            if(timeTemp.match(/s/)){
                // 再更新前の結果
                let timeTempArr = timeTemp.split('s');
                thisTime = Number(timeTempArr[0]);
            }else {
                // 確定した結果
                thisTime = Number(timeTemp);
            }
        }
        thisTime -= 1;
        resultTime = setResultTime(resultTime, thisTime, locationHostName);
        return resultTime;
    }
    function setResultTime(resultTime, thisTime, locationHostName){
        resultTime.hrefBase = locationHostName + 'ib/k/' + thisTime + '/';
        resultTime.time = thisTime;

        return resultTime;
    }

    function getCharacters(position, time){
        let positionClass = '.';

        if(position === 'left'){
            positionClass += 'L6';
        }else if(position === 'right'){
            positionClass += 'R6';
        }

        const teamTable = vsTable.find(positionClass).next().next();
        const teamName = vsTable.find(positionClass).text();
        let tableCellNum;

        if(position === 'left'){
            tableCellNum = ':odd';
        }else if(position === 'right'){
            tableCellNum = ':even';
        }

        const teamTableCell = teamTable.find('td').not(tableCellNum);
        let teamMenbers = [];

        teamTableCell.each(function(index){
            // ここで参加メンバーの基本情報を取得
            teamMenbers[index] = {
                'url': time.hrefBase + $(this).find('a').attr('href'),
                'ENo': $(this).find('a').text(),
                'name': $(this).find('b').text(),
                'teamName': teamName,
            }
        });
        return teamMenbers;
    }

    function createTeamTableCell(teams, table0, table1, cacheText){
        return new Promise((resolve, reject) => {
            let tableTemp;
            const tableTempArr = [
                [],
                []
            ];
            for(let i = 0; i < teams.length; i++){
                // チームごとのループ
                let teamName = $('<p></p>',{
                    "class": 'stdv_team_name_box',
                    text: teams[i][0].teamName
                });
                teamName.addClass('stdv_team_name' + i);
                $('#stdv_container' + i).append(teamName.clone(true));
                fetchResults(teams[i], cacheText).then((result) => {
                    // 取り終わった結果を加工
                    result.forEach((table, index) => {
                        const mainActiveSkillTable = table.find('table:nth-of-type(2)');
                        const mainPassiveSkillTable = table.find('table:nth-of-type(3)');
                        if(i === 0){
                            tableTemp = table0.clone();
                            tableTemp.attr('id', 'stdv_id_'+ i + '_' + index);
                        }else {
                            tableTemp = table1.clone();
                            tableTemp.attr('id', 'stdv_id_'+ i + '_' + index);
                        }
                        let charaTR = $('<tr></tr>');
                        let charaName = $('<th></th>', {
                            "class": 'stdv_charaName',
                            colspan: 2,
                            text: teams[i][index].ENo + ' ' + teams[i][index].name
                        })
                        charaTR.append(charaName.clone(true));
                        tableTemp.append(charaTR.clone(true));

                        tableTemp.append(skillTableSearch(mainActiveSkillTable, 'アクティブスキル'));
                        tableTemp.append(skillTableSearch(mainPassiveSkillTable, 'パッシブスキル'));
                        tableTempArr[i].push(tableTemp.clone(true));
                        $('#stdv_container' + i).append(tableTemp);
                    });
                });
            }
            resolve(tableTempArr);
        });
    }
    function getMenbersTable(path, cacheText){
        // 該当のtableを取ってくる
        return fetch(path, {
            method: 'GET',
            cache: cacheText,
        })
        .then(resp => resp.text())
        .then((text) => {
            const body = new DOMParser().parseFromString(text, 'text/html');
            const data = $(body);
            const mainSkillArea = data.find('img[src$="t_skill.png"]').first().parent();
            return mainSkillArea;
        })
    }
    async function fetchResults(menbers, cacheText){
        // 結果を取り終わるまで待つ
        const promises = menbers.map((result) =>{
            return getMenbersTable(result.url, cacheText);
        });
        const responses = await Promise.all(promises);
        return responses.map((result) => {
            return result;
        });
    }

    function skillTableSearch(baseData, category){
        // テーブル内を検索する関数
        let temp = document.createDocumentFragment();
        baseData.find('tr').each(function(){
            let tr = $('<tr></tr>');
            if( $(this).find('td:first-of-type').children().length <= 0 ){
                // 何もしない
            }else {
                let study_temp = $(this).find('td:first-of-type').text();
                let study_data = study_temp.replace(/\D/g, '');
                let study_class = ''
                if(study_data === '3'){
                    study_class = ' study3';
                }else if(study_data === '2'){
                    study_class = ' study2';
                }else{
                    study_class = ' study1';
                }
                let td_study = $('<td></td>',{
                    "class": 'stdv_study' + study_class,
                });
                let td_skill = $('<td></td>',{
                    "class": 'stdv_skill',
                });
                let study_text = $('<span></span>', {
                    "class": 'stdv_study_wrap',
                    text : study_temp
                });

                td_study.append(study_text.clone(true));
                td_skill.text($(this).find('td:nth-of-type(2)').text());
                tr.append(td_study.clone(true), td_skill.clone(true));
                tr = tr[0];
                temp.append(tr);
            }
        });
        if(temp.childNodes.length <= 0){
            let tr= $('<tr></tr>', {
                "class": 'stdv_empty'
            });
            let td_empty = $('<td></td>', {
                colspan: 2,
                "class": 'td_empty',
                text: `${category}の研究はされていませんでした。`
            }); 
            tr.append(td_empty);
            tr = tr[0];
            temp.append(tr);
        }
        return temp.cloneNode(true);
    }

})(jQuery);