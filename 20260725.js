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
    let orderData = { q1: '', q2: '', q3: '', message: '' };

    /* ==========================================
       1. 네비게이션 제어
    ========================================== */
    $('#btn-start').on('click', function() {
        switchSection('#sec-survey'); 
        showStep(1);                 
    });

    $('#btn-archive-toggle').on('click', function() {
        if ($('#sec-archive').is(':visible')) {
            switchSection('#sec-intro');
            $(this).text('📋 보관함');
        } else {
            switchSection('#sec-archive');
            $(this).text('🏠 홈으로');
            loadReceiptsFromFirebase(); 
        }
    });

    $('#btn-restart').on('click', function() {
        orderData = { q1: '', q2: '', q3: '', message: '' };
        $('.option-btn').removeClass('selected');
        $('#input-message').val('');
        $('#btn-archive-toggle').text('📋 보관함');
        switchSection('#sec-intro');
    });

    /* ==========================================
       2. 설문 선택 핸들러
    ========================================== */
    $('.survey-step[data-step="1"] .option-btn').on('click', function() {
        $('.survey-step[data-step="1"] .option-btn').removeClass('selected');
        $(this).addClass('selected');
        orderData.q1 = $(this).data('value');
        nextStep(1);
    });

    $('.survey-step[data-step="2"] .option-btn').on('click', function() {
        $('.survey-step[data-step="2"] .option-btn').removeClass('selected');
        $(this).addClass('selected');
        orderData.q2 = $(this).data('value');
        nextStep(2);
    });

    $('.survey-step[data-step="3"] .option-btn').on('click', function() {
        $('.survey-step[data-step="3"] .option-btn').removeClass('selected');
        $(this).addClass('selected');
        orderData.q3 = $(this).data('value');
        nextStep(3);
    });

    $('#btn-submit').on('click', function() {
        orderData.message = $('#input-message').val().trim() || "맛있게 구워주세요!";
        
        if (!orderData.q1 || !orderData.q2 || !orderData.q3) {
            alert("주문 조건을 모두 선택해 주세요!");
            showStep(1);
            return;
        }

        const exactTimeStr = get24HourDateTime();
        $('#current-date').text(exactTimeStr);

        const formattedMessage = orderData.message.replace(/\n/g, '<br>');
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
            alert(`⚠️ 발행 실패 [${error.code || 'UNKNOWN'}]`);
        });
    }

    function loadReceiptsFromFirebase() {
        if (!isConnected) {
            firebase.database().goOnline();
            isConnected = true;
        }

        if (messageRef) messageRef.off();
        messageRef = database.ref('BTH2026');

        $('#archive-list').html('<p style="text-align:center; color:#888; padding:30px;">보관함을 불러오는 중...</p>');

        messageRef.once('value', function(snapshot) {
            const posts = snapshot.val();
            let loadedMessages = [];
            
            if (posts) {
                Object.keys(posts).forEach(function(key) {
                    const post = posts[key];
                    const writeFullDt = get24HourDateTime(post.timestamp);
                    
                    loadedMessages.push({
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
                        <h4>— BREAD ORDER RECEIPT —</h4>
                        <p class="receipt-date">DATE : ${item.date}</p>
                        <div class="divider">* * * * * * * * * * * * * * * * * * * * * *</div>
                    </div>
                    
                    <div class="receipt-body">
                        <div class="receipt-row header-row">
                            <span>MY TASTE</span>
                            <span>QTY</span>
                        </div>
                        <div class="divider">-----------------------------------------</div>
                        
                        <div class="receipt-row">
                            <span>01 . TEXTURE // ${item.q1}</span>
                            <span>1</span>
                        </div>
                        <div class="receipt-row">
                            <span>02 . BAKING  // ${item.q2}</span>
                            <span>1</span>
                        </div>
                        <div class="receipt-row">
                            <span>03 . FLAVOR  // ${item.q3}</span>
                            <span>1</span>
                        </div>
                        
                        <div class="divider">-----------------------------------------</div>
                        <div class="receipt-message-box">
                            <p class="msg-title">[ MEMO ]</p>
                            <p class="msg-content">"${messageHtml}"</p>
                        </div>
                    </div>

                    <div class="receipt-footer">
                        <div class="divider">* * * * * * * * * * * * * * * * * * * * * *</div>
                        <div class="barcode-area">
                            <div class="barcode">|| | ||| || |||| | ||| ||| | ||</div>
                            <p>THANK YOU FOR YOUR ORDER</p>
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
	    4. 이미지 저장 기능 (모바일 iOS/안드로이드 꾹 누르기 완벽 대응)
	 ========================================== */
	 $('#btn-save-img').on('click', function() {
	     const receiptElement = document.getElementById('receipt-paper');
	     
	     // 버튼 로딩 상태 표시
	     const originalBtnText = $(this).text();
	     $(this).prop('disabled', true).text('⏳ 이미지 생성 중...');
	
	     html2canvas(receiptElement, {
	         scale: 3, // 유저가 사진첩에서 확대해도 깨지지 않게 화질 대폭 상향 (기존 2에서 3으로)
	         backgroundColor: "#FFFFFF",
	         useCORS: true
	     }).then(function(canvas) {
	         // 캔버스를 데이터 이미지 URL로 변환
	         const imageURL = canvas.toDataURL("image/png");
	         
	         // 모달 안의 컨테이너를 비우고 진짜 <img> 태그를 동적으로 삽입
	         const $imgTag = $('<img>').attr({
	             'src': imageURL,
	             'alt': '빵 주문 영수증'
	         });
	         $('#captured-image-container').html($imgTag);
	         
	         // 모달 레이어를 부드럽게 띄우기
	         $('#image-save-modal').css('display', 'flex');
	         
	         // 버튼 상태 원상복구
	         $('#btn-save-img').prop('disabled', false).text(originalBtnText);
	     }).catch(function(error) {
	         console.error("캡처 에러:", error);
	         alert("이미지 생성 중 오류가 발생했습니다.");
	         $('#btn-save-img').prop('disabled', false).text(originalBtnText);
	     });
	 });
	
	 // 이미지 저장 모달 닫기 버튼 이벤트
	 $('#btn-close-modal').on('click', function() {
	     $('#image-save-modal').hide();
	     $('#captured-image-container').empty(); // 메모리 해제
	 });
    /* ==========================================
       5. 유틸리티 공통 팩
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

// 프로세스 종료 리커버리
$(window).on('beforeunload', function(){
    firebase.database().goOffline();
});