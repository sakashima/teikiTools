// ==UserScript==
// @name         IBRhpspPercentViewer
// @namespace    https://twitter.com/nrsr_cw
// @version      0.5.1
// @downloadURL  https://github.com/sakashima/teikiTools/blob/master/IBRhpspPercentViewer.user.js
// @updateURL    https://github.com/sakashima/teikiTools/blob/master/IBRhpspPercentViewer.user.js
// @description  イバラの戦闘行動画面で『自分ＨＰ○％以下』『自分ＳＰ○％以上・以下』の実際の値を表示するスクリプト
// @author       のりしろ nrsr_cw
// @match        http://lisge.com/ib/act_battle.php
// @grant        none

(function ($) {
    'use strict';

    $('head').append('<style>#IBRhsPV-MHP,#IBRhsPV-MHP::-webkit-outer-spin-button,#IBRhsPV-MHP::-webkit-inner-spin-button,#IBRhsPV-MSP::-webkit-outer-spin-button,#IBRhsPV-MSP,#IBRhsPV-MSP::-webkit-inner-spin-button{-webkit-appearance: none; -moz-appearance: textfield; margin: 0;}</style>');

    const ENoTemp = $('.SHIDARI').find('a[href*="/now/r"]').attr('href');
    const ENo = ENoTemp.replace(/[^0-9^]|\D/g, '');
    const inputField = '<tr><td colspan="2" style="padding: 0.25em 0;"><div style="width: 100%; display: flex; justify-content: center; align-items: center; font-size: 16px;"><div><span style="font-weight: bold; color: #D00;">MHP</span>  <input type="number" id="IBRhsPV-MHP" autocomplete="off" style="width: 9em; padding: 4px 4px 4px 8px; color: #FDD; font-size: 16px; letter-spacing: 0.05em; border-radius: 19px; box-sizing: border-box; background:rgba(128,128,128,0.2); border: 2px solid #C99; margin-right: 40px;"></div>\n<div><span style="font-weight: bold; color: #099">MSP</span>  <input type="number" id="IBRhsPV-MSP" autocomplete="off" style="width: 6em; padding: 4px 4px 4px 8px; color: #DFF; font-size: 16px; letter-spacing: 0.05em; border-radius: 19px; box-sizing: border-box; background:rgba(128,128,128,0.2); border: 2px solid #9CC";></div></div></td></tr>\n<tr><td colspan="2"><p>※MHP、MSPの初期値はプロフィールページの数値です。<br>※活力や体力などの付加効果や、各スキルで変化した値は手入力をお願いします。</p></td></tr>';

    const BGT = $('.BGT')[1];
    const viewAreaWrap = '<div class="IHSP_view_area_wrap" style="display: none; padding-left: 2.5em;"><span class="IHSP_text_box" style="background-image: linear-gradient(-1deg, #999933 10%, rgba(255,255,255,0) 15%)"><span class="IHSP_current" style="font-size: 16px; font-weight: 700;"></span><span style="font-size: 13px;"> / <span class="IHSP_max"></span></span></span></div>';
    let borderCSS = ['linear-gradient(-2deg, #C99 15%, rgba(255,255,255,0) 20%)',
        'linear-gradient(-1deg, #9CC 12%, rgba(255,255,255,0) 18%)',
        'linear-gradient(2deg, #C99 15%, rgba(255,255,255,0) 20%)',
        'linear-gradient(2deg, #9CC 15%, rgba(255,255,255,0) 20%)'
    ];

    $(BGT).parents('tbody').append(inputField);
    const IhspMHP = $('#IBRhsPV-MHP');
    const IhspMSP = $('#IBRhsPV-MSP');
    $('[name^="dt_joken"]').each(function () {
        $(this).addClass('IHSPV_selector');
        $(this).next().addClass('IHSPV_anyValue');
        $(viewAreaWrap).insertAfter($(this).parent());
        HPSPView($(this));
    });
    $('[name^="dt_cards"][name*="-1"]').each(function () {
        $(viewAreaWrap).insertAfter($(this));
        $(this).next().css({
            'display': 'inline-block',
            'padding-left': '0.5em'
        }).addClass('IHSPV_CardHP');
    });
    const IhspSelector = $('.IHSPV_selector');
    $.ajax({
        type: 'GET',
        url: '/ib/k/now/r' + ENo + '.html',
        dataType: 'html'
    }).done(function (data) {
        IhspMHP.val($('<div />').html(data).find('.CIMGJN1 div').first().text());
        IhspMSP.val($('<div />').html(data).find('.CIMGJN1 div').last().text());
        IhspSelector.each(function () {
            HPSPView($(this));
        });
        $('.IHSPV_CardHP').each(function () {
            cardHPView($(this));
        })
    });

    const basicChangeEvent = function (e) {
        IhspSelector.each(function () {
            HPSPView($(this));
        });
    }

    IhspMHP.on('blur', function (event) {
        basicChangeEvent();
        $('.IHSPV_CardHP').each(function () {
            cardHPView($(this));
        });
    });
    IhspMSP.on('blur', {
        name: 'blurMSP'
    }, basicChangeEvent);

    $('.IHSPV_anyValue').on('blur', function (event) {
        if ($(this).val().replace(/[^0-9^]|\D/g, '') !== '') {
            basicChangeEvent();
        }
    });
    IhspSelector.on('change', function (event) {
        HPSPView($(this));
    });
    $('[TP="BUT"]').on('click', {
        name: 'clickTpBUT'
    }, basicChangeEvent);
    $('input.BUT1').on('click', {
        name: 'clickInputBUT1'
    }, basicChangeEvent);

    function HPSPView(target) {
        let flg;
        let titleStyle;
        let targetVal = target.val();
        let thisAnyValue = $(target).parent().find('.IHSPV_anyValue').val().replace(/[^0-9^]|\D/g, '');
        let IHSPcurrent = $(target).parent().parent().find('.IHSP_current');
        let IHSPMax = $(target).parent().parent().find('.IHSP_max');

        if ((targetVal === '4' || targetVal === '5' || targetVal === '8') && thisAnyValue !== '' || targetVal === '16') {
            if ((IhspMSP.val() == '' && IhspMHP.val() == '')) {
                flg = false;
            } else if ((targetVal === '4' || targetVal === '8') && (IhspMSP.val() !== '')) {
                let lessGrater;
                let cssNum;
                if (targetVal === '4') {
                    lessGrater = '↓';
                    cssNum = 3;
                } else {
                    lessGrater = '↑';
                    cssNum = 1;
                }
                titleStyle = '<span style="color: #099">SP</span> : ';
                IHSPMax.text(IhspMSP.val());
                IHSPcurrent.html(titleStyle + Math.ceil(parseInt(IhspMSP.val()) / 100 * parseInt($(target).next().val())) + lessGrater);
                IHSPcurrent.parent().css('background-image', borderCSS[cssNum]);
                flg = true;
            } else if ((targetVal === '5' || targetVal === '16') && (IhspMHP.val() !== '')) {
                let hpNum;

                IHSPMax.text(IhspMHP.val());
                if (targetVal === '5') {
                    hpNum = parseInt($(target).next().val());
                } else {
                    hpNum = 25;
                }
                titleStyle = '<span style="color: #D00;">HP</span> : ';
                IHSPcurrent.html(titleStyle + Math.ceil(parseInt(IhspMHP.val()) / 100 * hpNum) + '↓');
                IHSPcurrent.parent().css('background-image', borderCSS[2]);
                flg = true;
            } else {
                flg = false;
            }
            if (flg === true) {
                target.parent().parent().find('.IHSP_view_area_wrap').css('display', 'inline-block');
            }
        } else {
            flg = false;
            target.parent().parent().find('.IHSP_view_area_wrap').css('display', 'none');
        }
    }

    function cardHPView(target) {
        let hpNum = 50;
        let IHPcurrent = $(target).find('.IHSP_current');

        $(target).find('.IHSP_max').text(IhspMHP.val());
        IHPcurrent.html('<span style="color: #D00;">HP</span> : ' + Math.ceil(parseInt(IhspMHP.val()) / 100 * hpNum) + '↓');
        IHPcurrent.parent().css('background-image', borderCSS[2]);
    }

})(jQuery);
// ==/UserScript==

