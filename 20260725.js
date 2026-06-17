// ==========================================
// 파이어베이스 설정값 및 초기화 오퍼레이션
// ==========================================
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
let isConnected = false;
let messageRef = null;
let receiptList = [];

/**
 * 24시간 표기 기준 정밀 포맷팅 함수 (YYYY.MM.DD HH:mm:ss)
 */
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

    /* ==========================================
       1. 네비게이션 및 라우팅 이벤트 제어 (위임식)
    ========================================== */
    $(document).on('click', '#btn-start', function(e) {
        e.preventDefault();
        switchSection('#sec-survey'); 
        showStep(1);                 
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
        
        $('.option-btn').removeClass('selected');
        $('#input-name').val('');
        $('#input-message').val('');
        $('#btn-archive-toggle').text('📋 보관함');
        switchSection('#sec-intro');
    });

    /* ==========================================
       2. 설문 선택 핸들러
    ========================================== */
    $(document).on('click', '.survey-step[data-step="1"] .option-btn', function() {
        $('.survey-step[data-step="1"] .option-btn').removeClass('selected');
        $(this).addClass('selected');
        orderData.q1 = $(this).data('value');
        nextStep(1);
    });

    $(document).on('click', '.survey-step[data-step="2"] .option-btn', function() {
        $('.survey-step[data-step="2"] .option-btn').removeClass('selected');
        $(this).addClass('selected');
        orderData.q2 = $(this).data('value');
        nextStep(2);
    });

    $(document).on('click', '.survey-step[data-step="3"] .option-btn', function() {
        $('.survey-step[data-step="3"] .option-btn').removeClass('selected');
        $(this).addClass('selected');
        orderData.q3 = $(this).data('value');
        nextStep(3);
    });

    $(document).on('click', '#btn-submit', function() {
        orderData.name = $('#input-name').val().trim() || "빵순이";
        orderData.message = $('#input-message').val().trim() || "맛있게 구워주세요!";
        
        if (!orderData.q1 || !orderData.q2 || !orderData.q3) {
            alert("모든 항목을 선택해 주세요!");
            showStep(1);
            return;
        }

        const exactTimeStr = get24HourDateTime();
        $('#current-date').text(exactTimeStr);

        const formattedMessage = orderData.message.replace(/\n/g, '<br>');
        $('#res-name').text(orderData.name);
        $('#res-q1').text(orderData.q1);
        $('#res-q2').text(orderData.q2);
        $('#res-q3').text(orderData.q3);
        $('#res-message').html(`"${formattedMessage}"`);

        saveReceiptToFirebase();
    });

    /* ==========================================
       3. 파이어베이스(Firebase DB) 라이브 연동
    ========================================== */
    function saveReceiptToFirebase() {
        const currentTime = Date.now();
        const newReceiptData = {
            name: orderData.name,
            q1: orderData.q1,
            q2: orderData.q2,
            q3: orderData.q3,
            message: orderData.message,
            timestamp: currentTime
        };

        $('#btn-submit').prop('disabled', true).text('발행 중...');

        if (!isConnected) {
            firebase.database().goOnline();
            isConnected = true;
        }

        if (messageRef) messageRef.off();
        messageRef = database.ref('BTH2026');

        const newPostRef = messageRef.push();
        newPostRef.set(newReceiptData)
        .then(() => {
            setTimeout(disconnect, 1000);
            $('#btn-submit').prop('disabled', false).text('영수증 발행하기');
            switchSection('#sec-result');
        })
        .catch(error => {
            $('#btn-submit').prop('disabled', false).text('영수증 발행하기');
            alert(`⚠️ 발행 오류`);
        });
    }

    function loadReceiptsFromFirebase() {
        if (!isConnected) {
            firebase.database().goOnline();
            isConnected = true;
        }

        if (messageRef) messageRef.off();
        messageRef = database.ref('BTH2026').orderByChild('timestamp').limitToLast(15);

        $('#archive-list').html('<p style="text-align:center; color:#A39485; padding:30px;">보관함을 열어보는 중...</p>');

        messageRef.once('value', function(snapshot) {
            const posts = snapshot.val();
            let loadedMessages = [];
            
            if (posts) {
                Object.keys(posts).forEach(function(key) {
                    const post = posts[key];
                    const writeFullDt = get24HourDateTime(post.timestamp);
                    
                    loadedMessages.push({
                        name: post.name || "빵순이",
                        q1: post.q1,
                        q2: post.q2,
                        q3: post.q3,
                        message: post.message,
                        date: writeFullDt,
                        timestamp: post.timestamp
                    });
                });
            }

            receiptList = loadedMessages.sort((a, b) => b.timestamp - a.timestamp);
            displayArchiveList(receiptList);
        });
    }

    // 💡 보관함 템플릿 내의 절취선 바코드 또한 고증 사양 일치 동기화
    function displayArchiveList(list) {
        const $archiveList = $('#archive-list');
        $archiveList.empty();

        if (list.length === 0) {
            $archiveList.append('<p style="text-align:center; color:#aaa; padding:20px;">보관된 주문서가 없습니다.</p>');
            return;
        }

        list.forEach(function(item) {
            const messageHtml = item.message.replace(/\n/g, '<br>');
            
            const receiptCardHtml = `
                <div class="archive-receipt-card">
                    <div class="receipt-header">
                        <h4>— BREAD RECEIPT —</h4>
                        <div class="pos-meta-info">
                            <span>[정상] 매출영수증</span>
                            <span>POS: 01-0024</span>
                        </div>
                        <p class="receipt-user-name">NAME : ${item.name}</p>
                        <p class="receipt-date">DATE : ${item.date}</p>
                        <div class="divider">-----------------------------------------</div>
                    </div>
                    
                    <div class="receipt-body">
                        <div class="receipt-row header-row">
                            <span>ITEM</span>
                            <span>QTY</span>
                        </div>
                        <div class="divider">-----------------------------------------</div>
                        
                        <div class="receipt-row">
                            <span>01 TEXTURE // ${item.q1}</span>
                            <span>1</span>
                        </div>
                        <div class="receipt-row">
                            <span>02 BAKING  // ${item.q2}</span>
                            <span>1</span>
                        </div>
                        <div class="receipt-row">
                            <span>03 FLAVOR  // ${item.q3}</span>
                            <span>1</span>
                        </div>
                        
                        <div class="divider">-----------------------------------------</div>
                        <div class="receipt-message-box">
                            <p class="msg-title">[ MEMO ]</p>
                            <p class="msg-content">"${messageHtml}"</p>
                        </div>
                    </div>

                    <div class="receipt-footer">
                        <div class="divider">-----------------------------------------</div>
                        <div class="barcode-area">
                            <div class="barcode">||||| | ||||| | ||| ||| |||||</div>
                            <p class="thank-you-msg">THANK YOU FOR YOUR TASTE</p>
                        </div>
                    </div>
                </div>
            `;
            $archiveList.append(receiptCardHtml);
        });
    }

    function disconnect() {
        if (messageRef) messageRef.off();
        firebase.database().goOffline();
        isConnected = false;
    }

    /* ==========================================
       4. 이미지 저장 기능
    ========================================== */
    $(document).on('click', '#btn-save-img', function() {
        const receiptElement = document.getElementById('receipt-paper');
        const originalBtnText = $(this).text();
        $(this).prop('disabled', true).text('생성 중...');

        html2canvas(receiptElement, {
            scale: 3, 
            backgroundColor: "#FFFFFF",
            useCORS: true
        }).then(function(canvas) {
            const imageURL = canvas.toDataURL("image/png");
            const $imgTag = $('<img>').attr({
                'src': imageURL,
                'alt': '빵 주문 영수증'
            });
            $('#captured-image-container').html($imgTag);
            $('#image-save-modal').css('display', 'flex');
            $('#btn-save-img').prop('disabled', false).text(originalBtnText);
        }).catch(function(error) {
            alert("오류가 발생했습니다.");
            $('#btn-save-img').prop('disabled', false).text(originalBtnText);
        });
    });

    $(document).on('click', '#btn-close-modal', function() {
        $('#image-save-modal').hide();
        $('#captured-image-container').empty();
    });

    /* ==========================================
       5. 유틸리티 헬퍼 팩
    ========================================== */
    function switchSection(targetSectionId) {
        $('.app-section').removeClass('active');
        $(targetSectionId).addClass('active');
    }

    function showStep(stepNumber) {
        $('.survey-step').removeClass('active');
        $(`.survey-step[data-step="${stepNumber}"]`).addClass('active');
        const percent = (stepNumber / 4) * 100;
        $('.progress-fill').css('width', percent + '%');
    }

    function nextStep(currentStep) {
        setTimeout(function() {
            showStep(currentStep + 1);
        }, 300);
    }
});

$(window).on('beforeunload', function(){
    firebase.database().goOffline();
});