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
    let orderData = { name: '', q1: '', q2: '', q3: '', message: '' };

    $(document).on('click', '#btn-start', function(e) {
        e.preventDefault();
        switchSection('#sec-survey');
        $('.receipt-scroll-container').scrollTop(0);
        
        orderData = { name: '', q1: '', q2: '', q3: '', message: '' };
        $('#input-name').val(''); 
        $('#input-message').val('');
        $('.receipt-opt-btn').removeClass('selected disabled-fade');
        
        $('.receipt-survey-block').not('[data-step="1"]').removeClass('active');
        $('.receipt-survey-block[data-step="1"]').addClass('active');
    });

    $(document).on('click', '#btn-archive-toggle', function(e) {
        e.preventDefault();
        if ($('#sec-archive').is(':visible')) {
            switchSection('#sec-intro');
            $(this).text('📋 보관함');
        } else {
            switchSection('#sec-archive');
            $(this).text('🏠 홈으로');
            loadReceiptsFromFirebase(); 
        }
    });

    $(document).on('click', '#btn-restart', function(e) {
        e.preventDefault();
        orderData = { name: '', q1: '', q2: '', q3: '', message: '' };
        $('.receipt-opt-btn').removeClass('selected disabled-fade');
        $('.receipt-survey-block').not('[data-step="1"]').removeClass('active'); 
        $('.receipt-survey-block[data-step="1"]').addClass('active');
        $('#input-name').val(''); 
        $('#input-message').val('');
        $('#btn-archive-toggle').text('📋 보관함');
        switchSection('#sec-intro');
    });

    /* ==========================================
       실시간 설문 선택 흐름 모션 (진동 제거 버전)
    ========================================== */
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
                    setTimeout(() => {
                        scrollToBottomSmooth(); 
                    }, 50);
                }, 350);
            }
        }
    });

    /* ==========================================
       모바일 키보드 가림 차단용 입력창 스크롤 포커스
    ========================================== */
    $(document).on('focus', '#input-name, #input-message', function() {
        setTimeout(() => {
            scrollToBottomSmooth();
        }, 300);
    });

    /* ==========================================
       최종 제출 및 로딩 카운트다운
    ========================================== */
    $(document).on('click', '#btn-submit', function(e) {
        e.preventDefault();
        orderData.name = $('#input-name').val().trim() || "빵순이";
        orderData.message = $('#input-message').val().trim() || "맛있게 구워주세요!";
        if (!orderData.q1 || !orderData.q2 || !orderData.q3) { alert("취향을 모두 선택해 주세요!"); return; }

        switchSection('#sec-loading');
        runFakeLoading(function() {
            renderFinalReceipt();
        });
    });

    function runFakeLoading(callback) {
        let progress = 0;
        const $progressBar = $('.loading-progress-bar');
        const $loadingText = $('#loading-text');
        
        const textPhrases = [
            "취향을 맛있게 반죽하는 중...",
            "오븐 온도를 감성 온도로 올리는 중...",
            "갓 구워진 취향 영수증 사출 중..."
        ];

        const interval = setInterval(function() {
            progress += 4;
            $progressBar.css('width', progress + '%');
            
            if (progress === 32) $loadingText.text(textPhrases[1]);
            if (progress === 68) $loadingText.text(textPhrases[2]);

            if (progress >= 100) {
                clearInterval(interval);
                callback();
            }
        }, 100);
    }

    function renderFinalReceipt() {
        const exactTimeStr = get24HourDateTime();
        const formattedMessage = orderData.message.replace(/\n/g, '<br>');
        const randomOrderNum = "ORD-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + Math.floor(1000 + Math.random() * 9000);

        const cleanReceiptHtml = `
            <div class="receipt-shadow-wrapper">
                <div id="receipt-paper" class="receipt-paper">
                    <div class="receipt-header">
                        <h4>— BREAD RECEIPT —</h4>
                        <div class="pos-meta-info"><span>[정상] 매출영수증</span><span>POS: 01-0024</span></div>
                        <p style="font-size:0.75rem; font-weight:700; color:#A39485; margin-top:4px;">${randomOrderNum}</p>
                        <p class="receipt-user-name">NAME : ${orderData.name}</p>
                        <p class="receipt-date">DATE : ${exactTimeStr}</p>
                        <div class="divider"></div>
                    </div>
                    <div class="receipt-body">
                        <div class="receipt-row header-row"><span>ITEM</span><span>QTY</span></div>
                        <div class="divider"></div>
                        <div class="receipt-row"><span>01 TEXTURE // ${orderData.q1}</span><span>1</span></div>
                        <div class="receipt-row"><span>02 BAKING  // ${orderData.q2}</span><span>1</span></div>
                        <div class="receipt-row"><span>03 FLAVOR  // ${orderData.q3}</span><span>1</span></div>
                        <div class="divider"></div>
                        <div class="receipt-message-box">
                            <p class="msg-title">[ MEMO ]</p>
                            <p class="msg-content">"${formattedMessage}"</p>
                        </div>
                    </div>
                    <div class="receipt-footer">
                        <div class="divider"></div>
                        
                        <div style="font-size:0.7rem; text-align:left; color:#A39485; line-height:1.4; margin-bottom:10px; font-family:inherit;">
                            <p>* 교환/환불: 마음이 변하기 전까지 가능</p>
                            <p>* 내 취향 칼로리: 맛있으면 0 kcal</p>
                        </div>
                        
                        <div class="barcode-area">
                            <div class="barcode">||||| | ||||| | |||| ||| |||||</div>
                            <p class="thank-you-msg">THANK YOU FOR YOUR TASTE</p>
                        </div>
                    </div>
                </div>
            </div>`;

        $('#final-receipt-target').html(cleanReceiptHtml);
        saveReceiptToFirebase();
    }

    function saveReceiptToFirebase() {
        const currentTime = Date.now();
        const newReceiptData = { name: orderData.name, q1: orderData.q1, q2: orderData.q2, q3: orderData.q3, message: orderData.message, timestamp: currentTime };
        if (!isConnected) { firebase.database().goOnline(); isConnected = true; }
        if (messageRef) messageRef.off(); messageRef = database.ref('BTH2026');
        const newPostRef = messageRef.push();
        newPostRef.set(newReceiptData).then(() => { setTimeout(disconnect, 1000); switchSection('#sec-result'); }).catch(() => { alert(`⚠️ 발행 오류`); });
    }

    function loadReceiptsFromFirebase() {
        if (!isConnected) { firebase.database().goOnline(); isConnected = true; }
        if (messageRef) messageRef.off(); messageRef = database.ref('BTH2026').orderByChild('timestamp').limitToLast(15);
        $('#archive-list').html('<p style="text-align:center; color:#A39485; padding:30px;">보관함을 열어보는 중...</p>');
        messageRef.once('value', function(snapshot) {
            const posts = snapshot.val(); let loadedMessages = [];
            if (posts) { Object.keys(posts).forEach(function(key) { const post = posts[key]; loadedMessages.push({ name: post.name || "빵순이", q1: post.q1, q2: post.q2, q3: post.q3, message: post.message, date: get24HourDateTime(post.timestamp), timestamp: post.timestamp }); }); }
            receiptList = loadedMessages.sort((a, b) => b.timestamp - a.timestamp); displayArchiveList(receiptList);
        });
    }

    function displayArchiveList(list) {
        const $archiveList = $('#archive-list'); $archiveList.empty();
        if (list.length === 0) { $archiveList.append('<p style="text-align:center; color:#aaa; padding:20px;">보관된 주문서가 없습니다.</p>'); return; }
        list.forEach(function(item) {
            const messageHtml = item.message.replace(/\n/g, '<br>');
            const receiptCardHtml = `
                <!-- 💡 UX 패치: 클릭이 가능한 카드임을 유저에게 알리기 위해 마우스 포인터 속성 유도 스타일 가미 -->
                <div class="archive-receipt-card-wrapper" style="cursor: pointer; width: 100%; max-width: 350px;">
                    <div class="archive-receipt-card">
                        <div class="receipt-header">
                            <h4>— BREAD RECEIPT —</h4>
                            <div class="pos-meta-info"><span>[정상] 매출영수증</span><span>POS: 01-0024</span></div>
                            <p class="receipt-user-name">NAME : ${item.name}</p>
                            <p class="receipt-date">DATE : ${item.date}</p>
                            <div class="divider"></div>
                        </div>
                        <div class="receipt-body">
                            <div class="receipt-row header-row"><span>ITEM</span><span>QTY</span></div>
                            <div class="divider"></div>
                            <div class="receipt-row"><span>01 TEXTURE // ${item.q1}</span><span>1</span></div>
                            <div class="receipt-row"><span>02 BAKING  // ${item.q2}</span><span>1</span></div>
                            <div class="receipt-row"><span>03 FLAVOR  // ${item.q3}</span><span>1</span></div>
                            <div class="divider"></div>
                            <div class="receipt-message-box">
                                <p class="msg-title">[ MEMO ]</p>
                                <p class="msg-content">"${messageHtml}"</p>
                            </div>
                        </div>
                        <div class="receipt-footer">
                            <div class="divider"></div>
                            <div style="font-size:0.7rem; text-align:left; color:#A39485; line-height:1.4; margin-bottom:10px; font-family:inherit;">
                                <p>* 교환/환불: 마음이 변하기 전까지 가능</p>
                                <p>* 내 취향 칼로리: 맛있으면 0 kcal</p>
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

    /* ==========================================
       💡 [대수리 핵심] 보관함 리스트 영수증 클릭 시 모달창 자동 사출 연동
    ========================================== */
    $(document).on('click', '.archive-receipt-card-wrapper', function(e) {
        e.preventDefault();
        
        // 클릭한 카드 노드 내부의 진짜 타겟인 '.archive-receipt-card' 포착
        const targetCard = $(this).find('.archive-receipt-card')[0];
        
        // 상단 가이드 텍스트 및 로딩 가이드 일시 전환
        $('#captured-image-container').html('<p style="font-size:0.85rem; color:#A39485; padding:20px;">보관된 취향 스캔 중...</p>');
        $('#image-save-modal').css('display', 'flex');

        // 가상 카메라 작동 (투명 크롭 유지 필수 캡처 규칙 적용)
        html2canvas(targetCard, { 
            scale: 3, 
            backgroundColor: null, 
            useCORS: true 
        }).then(function(canvas) {
            const imageURL = canvas.toDataURL("image/png");
            const $imgTag = $('<img>').attr({ 'src': imageURL, 'alt': '보관함 백업 영수증' });
            
            // 기존 가이드 문구를 지우고 완벽히 사출된 톱니 결 이미지를 렌더링
            $('#captured-image-container').html($imgTag);
        }).catch(function() { 
            alert("이미지 로드 중 오류가 발생했습니다."); 
            $('#image-save-modal').hide();
        });
    });

    function disconnect() { if (messageRef) messageRef.off(); firebase.database().goOffline(); isConnected = false; }

    /* 결과화면 이미지 저장 버튼 구문 */
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
    
    function scrollToBottomSmooth() { 
        const $container = $('.receipt-scroll-container'); 
        const scrollH = $container()[0].scrollHeight; 
        $container.animate({ scrollTop: scrollH }, 750); 
    }
});

$(window).on('beforeunload', function(){ firebase.database().goOffline(); });