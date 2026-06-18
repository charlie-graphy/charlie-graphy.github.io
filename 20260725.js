const firebaseConfig = {
    apiKey: "AIzaSyCmF81jQ27FLmyb1zZgT6pEboTpeFUUt-k",
    authDomain: "ahnjeehwany.firebaseapp.com",
    databaseURL: "https://ahnjeehwany-default-rtdb.firebaseio.com",
    projectId: "ahnjeehwany",
    storageBucket: "ahnjeehwany.firebasestorage.app",
    messagingSenderId: "4142402443",
    appId: "1:4142402443:web:773ee03ac4ff8631183d8e",
    measurementId: "G-BWPFC2L1VG"
};

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const database = firebase.database();
let isConnected = false;
let messageRef = null;
let receiptList = [];

function get24HourDateTime(timestamp) {
    const dateObj = timestamp ? new Date(timestamp) : new Date();
    const YYYY = dateObj.getFullYear();
    const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const DD = String(dateObj.getDate()).padStart(2, '0');
    const hh = String(dateObj.getHours()).padStart(2, '0');
    const mm = String(dateObj.getMinutes()).padStart(2, '0');
    const ss = String(dateObj.getSeconds()).padStart(2, '0');
    return `${YYYY}.${MM}.${DD} ${hh}:${mm}:${ss}`;
}

$(document).ready(function() {
    let orderData = { name: '', q1: '', q2: '', q3: '', message: '', signature: '' };
    
    const canvas = document.getElementById('signature-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
    const day = String(date.getDate()).padStart(2, '0');

    // 화면에 출력할 형식 설정
    const today = `${year}${month}${day}`;
    let isDrawing = false;

    $('#live-receipt-box .pos-meta-info span:eq(0)').text('ORD-'+today+'-');
    
    if (ctx) {
        ctx.strokeStyle = "#2E2016"; 
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
    }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    if (canvas) {
        canvas.addEventListener('mousedown', (e) => { isDrawing = true; const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); });
        canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; e.preventDefault(); const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); });
        canvas.addEventListener('mouseup', () => isDrawing = false);
        canvas.addEventListener('mouseleave', () => isDrawing = false);

        canvas.addEventListener('touchstart', (e) => { isDrawing = true; const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }, {passive: true});
        canvas.addEventListener('touchmove', (e) => { if (!isDrawing) return; e.preventDefault(); const pos = getPos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }, {passive: false});
        canvas.addEventListener('touchend', () => isDrawing = false);
    }
    
    $(document).on('click', '#btn-clear-sig', function(e) {
        e.preventDefault();
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    $(document).on('click', '#btn-start', function(e) {
        e.preventDefault();
        switchSection('#sec-survey');
        $('.receipt-scroll-container').scrollTop(0);
        
        orderData = { name: '', q1: '', q2: '', q3: '', message: '' };
        $('#input-name').removeClass('input-error').val(''); 
        $('#input-message').removeClass('input-error').val('');
        $('.error-text').hide(); 
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        $('.receipt-opt-btn').removeClass('selected disabled-fade');
        
        $('.receipt-survey-block').not('[data-step="1"]').removeClass('active');
        $('.receipt-survey-block[data-step="1"]').addClass('active');
    });

    $(document).on('click', '#btn-archive-toggle', function(e) {
        e.preventDefault();
        if ($('#sec-archive').is(':visible')) {
            switchSection('#sec-intro');
            $(this).text('보관함');
        } else {
            switchSection('#sec-archive');
            $(this).text('홈으로');
            loadReceiptsFromFirebase(); 
        }
    });

    $(document).on('click', '#btn-restart', function(e) {
        e.preventDefault();
        orderData = { name: '', q1: '', q2: '', q3: '', message: '', signature: '' };
        $('.receipt-opt-btn').removeClass('selected disabled-fade');
        $('.receipt-survey-block').not('[data-step="1"]').removeClass('active'); 
        $('.receipt-survey-block[data-step="1"]').addClass('active');
        $('#input-name').removeClass('input-error').val(''); 
        $('#input-message').removeClass('input-error').val('');
        $('.error-text').hide(); 
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        $('#btn-archive-toggle').text('보관함');
        switchSection('#sec-intro');
    });

    $(document).on('click', '.receipt-survey-block .receipt-opt-btn', function(e) {
        e.preventDefault(); e.stopPropagation();
        const $currentBlock = $(this).closest('.receipt-survey-block');
        const currentStep = parseInt($currentBlock.data('step'));
        const chosenValue = $(this).attr('data-value') || $(this).text().split(' ')[0];

        if (!$(this).hasClass('selected')) {
            $currentBlock.find('.receipt-opt-btn').removeClass('selected').addClass('disabled-fade');
            $(this).removeClass('disabled-fade').addClass('selected');
            
            if (currentStep === 1) orderData.q1 = chosenValue;
            if (currentStep === 2) orderData.q2 = chosenValue;
            if (currentStep === 3) orderData.q3 = chosenValue;
            
            const nextStep = currentStep + 1;
            const $nextBlock = $(`.receipt-survey-block[data-step="${nextStep}"]`);
            
            if ($nextBlock.length > 0 && !$nextBlock.hasClass('active')) {
                setTimeout(() => { 
                    $nextBlock.addClass('active'); 
                    setTimeout(() => { scrollToBottomSmooth(); }, 50);
                }, 350);
            }
        }
    });

    $(document).on('focus', '#input-name, #input-message', function() {
        $(this).removeClass('input-error');
        if ($(this).attr('id') === 'input-name') $('#error-name').hide();
        if ($(this).attr('id') === 'input-message') $('#error-message').hide();
        setTimeout(() => { scrollToBottomSmooth(); }, 300);
    });

    $(document).on('click', '#btn-submit', function(e) {
        e.preventDefault();
        
        $('#input-name').removeClass('input-error');
        $('#input-message').removeClass('input-error');
        $('.error-text').hide(); 

        const typedName = $('#input-name').val().trim();
        const typedMessage = $('#input-message').val().trim();

        if (!typedName) {
            $('#input-name').addClass('input-error').focus();
            $('#error-name').show(); 
            scrollToBottomSmooth();
            return;
        }

        if (!typedMessage) {
            $('#input-message').addClass('input-error').focus();
            $('#error-message').show(); 
            scrollToBottomSmooth();
            return;
        }

        if (!orderData.q1 || !orderData.q2 || !orderData.q3) { alert("취향 선택이 빠져있습니다!"); return; }

        orderData.name = typedName;
        orderData.message = typedMessage;

        let isBlank = true;
        if (canvas) {
            const buffer = document.createElement('canvas');
            buffer.width = canvas.width; buffer.height = canvas.height;
            if (canvas.toDataURL() !== buffer.toDataURL()) { isBlank = false; }
        }
        orderData.signature = isBlank ? "" : canvas.toDataURL("image/png");

        switchSection('#sec-loading');
        
        if (!isConnected) { firebase.database().goOnline(); isConnected = true; }
        database.ref('BTH2026').once('value', function(snapshot) {
            const totalCount = snapshot.numChildren();
            const currentOrderNum = totalCount + 1; 
            
            runFakeLoading(function() {
                renderFinalReceipt(currentOrderNum); 
            });
        });
    });

    function runFakeLoading(callback) {
        let progress = 0;
        const $progressBar = $('.loading-progress-bar');
        const $loadingText = $('#loading-text');
        const textPhrases = ["취향을 맛있게 반죽하는 중...", "오븐 온도를 감성 온도로 올리는 중...", "갓 구워진 취향 영수증 출력 중..."];
        const interval = setInterval(function() {
            progress += 4; $progressBar.css('width', progress + '%');
            if (progress === 32) $loadingText.text(textPhrases[1]);
            if (progress === 68) $loadingText.text(textPhrases[2]);
            if (progress >= 100) { clearInterval(interval); callback(); }
        }, 100);
    }

    function renderFinalReceipt(currentOrderNum) {
        const exactTimeStr = get24HourDateTime();
        const formattedMessage = orderData.message.replace(/\n/g, '<br>');
        
        const paddedOrderStr = String(currentOrderNum).padStart(4, '0');
        const serialStr = "ORD-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + paddedOrderStr;

        const sigSectionHtml = orderData.signature ? `
            <div class="divider"></div>
            <div style="margin: 5px 0;">
                <p style="font-size:0.7rem; font-weight:700; color:#A39485; text-align:left;">CUSTOMER SIGNATURE :</p>
                <img src="${orderData.signature}" class="receipt-signature-img" alt="친필서명">
            </div>` : "";

        const cleanReceiptHtml = `
            <div class="receipt-shadow-wrapper">
                <div id="receipt-paper" class="receipt-paper">
                    <div class="receipt-header">
                        <h4>— BREAD RECEIPT —</h4>
                        <div class="pos-meta-info"><span style="font-weight:700;">${serialStr}</span><span>POS: 92-0725</span></div>
                        <p class="receipt-user-name">NAME : ${orderData.name}</p>
                        <p class="receipt-date">DATE : ${exactTimeStr}</p>
                        <div class="divider"></div>
                    </div>
                    <div class="receipt-body">
                        <div class="receipt-row header-row"><span>MENU</span></div>
                        <div class="divider"></div>
                        <div class="receipt-row"><span>01 TEXTURE // ${orderData.q1}</span></div>
                        <div class="receipt-row"><span>02 BAKING  // ${orderData.q2}</span></div>
                        <div class="receipt-row"><span>03 FLAVOR  // ${orderData.q3}</span></div>
                        <div class="divider"></div>
                        <div class="receipt-message-box">
                            <p class="msg-title">[ MEMO ]</p>
                            <p class="msg-content">${formattedMessage}</p>
                        </div>
                    </div>
                    <div class="receipt-footer">
                        ${sigSectionHtml}
                        <div class="divider"></div>
                        <div style="font-size:0.7rem; text-align:left; color:#A39485; line-height:1.4; margin-bottom:10px; font-family:inherit;">
                        	<p>* CASHIER : 깨비사랑단</p>
                        	<p>* 교환/환불 : 불가능(평쟌해야함)</p>
                        </div>
                        <div class="barcode-area">
                            <div class="barcode">||||| | ||||| | |||| ||| |||||</div>
                            <p class="thank-you-msg">THANK YOU FOR YOUR TASTE</p>
                        </div>
                    </div>
                </div>
            </div>`;

        $('#final-receipt-target').html(cleanReceiptHtml);
        
        orderData.orderNo = currentOrderNum;
        saveReceiptToFirebase();
    }

    function saveReceiptToFirebase() {
        const currentTime = Date.now();
        const newReceiptData = { 
            name: orderData.name, 
            q1: orderData.q1, 
            q2: orderData.q2, 
            q3: orderData.q3, 
            message: orderData.message, 
            signature: orderData.signature, 
            orderNo: orderData.orderNo, 
            timestamp: currentTime 
        };
        const newPostRef = database.ref('BTH2026').push();
        newPostRef.set(newReceiptData).then(() => { setTimeout(disconnect, 1000); switchSection('#sec-result'); }).catch(() => { alert(`⚠️ 발행 오류`); });
    }

    function loadReceiptsFromFirebase() {
        if (!isConnected) { firebase.database().goOnline(); isConnected = true; }
        if (messageRef) messageRef.off(); messageRef = database.ref('BTH2026').orderByChild('timestamp').limitToLast(15);
        $('#archive-list').html('<p style="text-align:center; color:#A39485; padding:30px;">보관함을 열어보는 중...</p>');
        messageRef.once('value', function(snapshot) {
            const posts = snapshot.val(); let loadedMessages = [];
            if (posts) { Object.keys(posts).forEach(function(key) { const post = posts[key]; loadedMessages.push({ name: post.name || "빵순이", q1: post.q1, q2: post.q2, q3: post.q3, message: post.message, signature: post.signature || "", orderNo: post.orderNo || 0, date: get24HourDateTime(post.timestamp), timestamp: post.timestamp }); }); }
            receiptList = loadedMessages.sort((a, b) => b.timestamp - a.timestamp); displayArchiveList(receiptList);
        });
    }

    function displayArchiveList(list) {
        const $archiveList = $('#archive-list'); $archiveList.empty();
        if (list.length === 0) { $archiveList.append('<p style="text-align:center; color:#aaa; padding:20px;">보관된 주문서가 없습니다.</p>'); return; }
        list.forEach(function(item, index) {
            const messageHtml = item.message.replace(/\n/g, '<br>');
            const archiveSigHtml = item.signature ? `
                <div class="divider"></div>
                <div style="margin: 5px 0;">
                    <p style="font-size:0.7rem; font-weight:700; color:#A39485; text-align:left;">CUSTOMER SIGNATURE :</p>
                    <img src="${item.signature}" class="receipt-signature-img" alt="보관서명">
                </div>` : "";
            
            const calculatedNo = list.length - index;
            const paddedArchiveNo = String(calculatedNo).padStart(4, '0');
            const archiveSerialStr = "ORD-" + item.date.split(' ')[0].replace(/\./g,"") + "-" + paddedArchiveNo;

            const receiptCardHtml = `
                <div class="archive-receipt-card-wrapper" style="cursor: pointer; width: 100%; max-width: 350px;">
                    <div class="archive-receipt-card">
                        <div class="receipt-header">
                            <h4>— BREAD RECEIPT —</h4>
                            <div class="pos-meta-info"><span style="font-weight:700;">${archiveSerialStr}</span><span>POS: 92-0725</span></div>
                            <p class="receipt-user-name">NAME : ${item.name}</p>
                            <p class="receipt-date">DATE : ${item.date}</p>
                            <div class="divider"></div>
                        </div>
                        <div class="receipt-body">
                            <div class="receipt-row header-row"><span>MENU</span></div>
                            <div class="divider"></div>
                            <div class="receipt-row"><span>01 TEXTURE // ${item.q1}</span></div>
                            <div class="receipt-row"><span>02 BAKING  // ${item.q2}</span></div>
                            <div class="receipt-row"><span>03 FLAVOR  // ${item.q3}</span></div>
                            <div class="divider"></div>
                            <div class="receipt-message-box">
                                <p class="msg-title">[ MEMO ]</p>
                                <p class="msg-content">${messageHtml}</p>
                            </div>
                        </div>
                        <div class="receipt-footer">
                            ${archiveSigHtml}
                            <div class="divider"></div>
                            <div style="font-size:0.7rem; text-align:left; color:#A39485; line-height:1.4; margin-bottom:10px; font-family:inherit;">
                                <p>* CASHIER : 깨비사랑단</p>
                                <p>* 교환/환불 : 불가능(평쟌해야함)</p>
                            </div>
                            <div class="barcode-area">
                                <div class="barcode">||||| | ||||| | |||| ||| |||||</div>
                                <p class="thank-you-msg">THANK YOU FOR YOUR TASTE</p>
                            </div>
                        </div>
                    </div>
                </div>`;
            $archiveList.append(receiptCardHtml);
        });
    }

    $(document).on('click', '.archive-receipt-card-wrapper', function(e) {
        e.preventDefault();
        const targetCard = $(this).find('.archive-receipt-card')[0];
        if (!targetCard) return;
        $('#captured-image-container').html('<p style="font-size:0.85rem; color:#A39485; padding:20px;">보관된 친필 영수증 채취 중...</p>');
        $('#image-save-modal').css('display', 'flex');

        html2canvas(targetCard, { scale: 3, backgroundColor: null, useCORS: true }).then(function(canvas) {
            const imageURL = canvas.toDataURL("image/png");
            const $imgTag = $('<img>').attr({ 'src': imageURL, 'alt': '보관함 백업 영수증' });
            $('#captured-image-container').html($imgTag);
        }).catch(function() { alert("이미지 로드 오류"); $('#image-save-modal').hide(); });
    });

    function disconnect() { if (messageRef) messageRef.off(); firebase.database().goOffline(); isConnected = false; }

    $(document).on('click', '#btn-save-img', function() {
        const receiptElement = document.getElementById('receipt-paper');
        const originalBtnText = $(this).text(); $(this).prop('disabled', true).text('생성 중...');
        
        html2canvas(receiptElement, { scale: 3, backgroundColor: null, useCORS: true }).then(function(canvas) {
            const imageURL = canvas.toDataURL("image/png");
            const $imgTag = $('<img>').attr({ 'src': imageURL, 'alt': '빵 주문 영수증' });
            $('#captured-image-container').html($imgTag); $('#image-save-modal').css('display', 'flex'); $('#btn-save-img').prop('disabled', false).text(originalBtnText);
        }).catch(function() { alert("오류가 발생했습니다."); $('#btn-save-img').prop('disabled', false).text(originalBtnText); });
    });

    $(document).on('click', '#btn-close-modal', function() { $('#image-save-modal').hide(); $('#captured-image-container').empty(); });
    function switchSection(targetSectionId) { $('.app-section').removeClass('active'); $(targetSectionId).addClass('active'); }
    function scrollToBottomSmooth() { const $container = $('.receipt-scroll-container'); const scrollH = $container()[0].scrollHeight; $container.animate({ scrollTop: scrollH }, 750); }
});

$(window).on('beforeunload', function(){ firebase.database().goOffline(); });