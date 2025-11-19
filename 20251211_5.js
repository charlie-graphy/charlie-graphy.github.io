// [수정] HTML이 모두 로드된 후 스크립트가 실행되도록 $(document).ready로 감쌉니다.
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
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let isConnected = false;
let messageRef = null;

$(document).ready(function() {

    // --- 1. 챕터 5 DOM 요소 캐싱 ---
    const $ch5Container = $('#chapter5-container');
    const $ch5ViewToggle = $('#ch5-view-toggle');
    
    // 별자리 뷰
    const $ch5UniverseWrapper = $('#ch5-universe-wrapper');
    const $ch5Constellation = $('#ch5-constellation');
    const $canvas = $('#ch5-starfield-canvas');
    
    // [수정] 목록 뷰 (캐러셀)
    const $ch5ListViewWrapper = $('#ch5-list-view-wrapper');
    const $ch5ListTrack = $('#ch5-list-track');
    const $ch5ListPrev = $('#ch5-list-prev');
    const $ch5ListNext = $('#ch5-list-next');
    const $ch5ListCounter = $('#ch5-list-counter');

    const $ch5WriteBtn = $('#ch5-write-btn');

    let ctx = null;
    let stars = []; // 배경 별 배열
    const STAR_COUNT = 500; // 배경에 그릴 별 개수
    const UNIVERSE_SIZE = 3000; // 우주 공간 크기 (px)

    // 작성 폼 모달
    const $formModal = $('#ch5-form-modal');
    const $form = $('#ch5-guestbook-form');
    const $starSelector = $('#ch5-star-selector');
    const $selectedStarInput = $('#ch5-selected-star');
    const $inputName = $('#ch5-input-name');
    const $inputMessage = $('#ch5-input-message');
    const $submitBtn = $('#ch5-form-submit-btn');

    // 상세 보기 모달
    const $messageModal = $('#ch5-message-modal');
    const $messageIcon = $('#ch5-message-modal-icon');
    const $messageAuthor = $('#ch5-message-modal-author');
    const $messageText = $('#ch5-message-modal-text');

    // --- 2. 챕터 5 설정 및 상태 변수 ---
    const STAR_DESIGNS = [
        'https://lh3.googleusercontent.com/d/1jeWf4rvz31POee3PRhbXvKoCBSx26ICD', // 이미지 1
        'https://lh3.googleusercontent.com/d/1HL7UH15Ew5vW0FPprUc6iN-sEJX2a5Rp', // 이미지 2
        'https://lh3.googleusercontent.com/d/1HM0HUpTYH9rnjYBmXzxSmClbApb1NirW', // 이미지 3
        'https://lh3.googleusercontent.com/d/1zhDmPKRZ-yMqGzuGA4lnXlvzr7NoO3_p', // 이미지 4
        'https://lh3.googleusercontent.com/d/1CQLw-S6Szqq8bXFDVIKQO3xBYPZQ0Y4K',  // 이모지 5
        'https://lh3.googleusercontent.com/d/1EGaQboR4NZBcK8uXxbVcjw0yPWgl_NWe' // 이미지 6
    ];
    let ch5AnimationId = null;
    
    // 별자리 뷰 드래그
    let isCh5Dragging = false;
    let ch5DragStartPos = { x: 0, y: 0 };
    
    // [신규] 캐러셀(목록 뷰) 상태
    let ch5MessageList = []; // 모든 메시지 데이터 (최신순)
    let ch5CurrentIndex = 0; // 현재 보고있는 슬라이드 인덱
    let ch5TouchStartX = 0; // 스와이프 시작 X좌표


    // --- 3. [핵심] 챕터 5 게임 초기화 함수 (전역 할당) ---
    initChapter5Game = function() {
    	// 1. 캔버스 설정
        if ($canvas.length > 0) {
            ctx = $canvas.get(0).getContext('2d');
            $canvas.get(0).width = UNIVERSE_SIZE;
            $canvas.get(0).height = UNIVERSE_SIZE;
        } else {
            console.error("챕터 5 캔버스를 찾을 수 없습니다.");
        }

        // 2. 우주 공간 보이기
        $ch5Container.addClass('game-started');
        
        $ch5UniverseWrapper.css('display', ''); // CSS의 기본값(block)으로 복원
        $ch5ListViewWrapper.css('display', '');  // CSS의 기본값(none)으로 복원
        
        // $ch5UniverseWrapper.show(); // [버그 수정] 삭제! (CSS가 제어하도록)
        $ch5WriteBtn.fadeIn(300);
        $ch5ViewToggle.fadeIn(300);
        
        $ch5Constellation.empty();
        $ch5ListTrack.empty();

        // 3. 배경 별 생성 및 그리기
        createStarfield();
        drawStarfield();

        // 4. 별 디자인 선택 UI 생성 (한 번만)
        if ($starSelector.children().length === 0) {
            populateStarSelector();
        }
        
        // 5. 뷰 토글 상태 초기화
        $ch5Container.removeClass('list-view-active');
        $ch5ViewToggle.find('.ch5-toggle-btn').removeClass('active');
        $ch5ViewToggle.find('[data-view="universe"]').addClass('active');

        // 6. 캐러셀 상태 초기화
        ch5MessageList = [];
        ch5CurrentIndex = 0;
        updateCarouselState(); // 카운터, 버튼 숨기기

        // 7. 이벤트 리스너 설정
        setupChapter5Listeners();

        // 8. [PLACEHOLDER] 파이어베이스에서 메시지 로드
        loadMessagesFromFirebase();

        // 9. 화면 중앙에서 시작
        $ch5Container.scrollLeft((UNIVERSE_SIZE - $ch5Container.width()) / 2);
        $ch5Container.scrollTop((UNIVERSE_SIZE - $ch5Container.height()) / 2);
    };

    // --- 4. 챕터 5 게임 중지 함수 (전역 할당) ---
    stopChapter5Game = function() {
        if (ch5AnimationId) {
            cancelAnimationFrame(ch5AnimationId);
            ch5AnimationId = null;
        }
        $ch5Container.removeClass('game-started list-view-active'); // [수정]
        $ch5UniverseWrapper.hide();
        $ch5WriteBtn.hide();
        $ch5ViewToggle.hide(); // [신규] 뷰 토글 숨기기
        $ch5ListViewWrapper.hide(); // [수정]
        
        $formModal.fadeOut(300);
        $messageModal.fadeOut(300);

        // 이벤트 리스너 제거
        $ch5Container.off('.ch5game');
        $ch5WriteBtn.off('click');
        $form.off('submit');
        $starSelector.off('click');
        $formModal.find('.ch5-close-btn').off('click');
        $messageModal.find('.ch5-close-btn').off('click');
        $ch5Constellation.off('click.ch5game');
        $ch5ListTrack.off('.ch5game'); // [수정]
        $ch5ListPrev.off('click'); // [신규]
        $ch5ListNext.off('click'); // [신규]
        $ch5ViewToggle.off('click');
    };

    // --- 5. 배경 별 캔버스 로직 ---
    function createStarfield() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * UNIVERSE_SIZE,
                y: Math.random() * UNIVERSE_SIZE,
                radius: Math.random() * 1.5 + 0.5, // 0.5 ~ 2.0
                opacity: Math.random() * 0.5 + 0.3, // 0.3 ~ 0.8
                opacityChange: (Math.random() - 0.5) * 0.015 // 깜빡임 속도
            });
        }
    }

    function drawStarfield() {
        if (!ctx) return;
        
        ctx.clearRect(0, 0, UNIVERSE_SIZE, UNIVERSE_SIZE);

        stars.forEach(star => {
            // 1. 깜빡임 (투명도 조절)
            star.opacity += star.opacityChange;
            if (star.opacity > 0.8 || star.opacity < 0.3) {
                star.opacityChange *= -1; // 방향 전환
            }
            
            // 2. 별 그리기
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.fill();
        });
        
        // [수정] ch5AnimationId가 null이 아닐 때만 (즉, 목록 뷰가 아닐 때만) 재귀 호출
        if (!$ch5Container.hasClass('list-view-active')) {
            ch5AnimationId = requestAnimationFrame(drawStarfield);
        } else {
            ch5AnimationId = null;
        }
    }
    
    // --- 6. 챕터 5 이벤트 리스너 설정 ---
    function setupChapter5Listeners() {
        // 1. '별 띄우기' 버튼 클릭
        $ch5WriteBtn.off('click').on('click', function() {
            $form[0].reset(); // 폼 초기화
            $starSelector.children().removeClass('selected');
            $starSelector.children().first().addClass('selected'); // 기본값
            $selectedStarInput.val(STAR_DESIGNS[0]);
            $formModal.css('display', 'flex').hide().fadeIn(300);
        });

        // 2. 작성 폼 닫기 버튼
        $formModal.find('.ch5-close-btn').off('click').on('click', function() {
            $formModal.fadeOut(300);
        });
        
        // 3. 메시지 상세 폼 닫기 버튼
        $messageModal.find('.ch5-close-btn').off('click').on('click', function() {
            $messageModal.fadeOut(300);
        });

	     // 4. 별 디자인 선택
	     $starSelector.off('click').on('click', '.ch5-star-option', function() {
	         const $this = $(this);
	         $starSelector.children().removeClass('selected');
	         $this.addClass('selected');
	         // [수정] data-star-index 값을 저장
	         $selectedStarInput.val($this.data('star-index'));
	     });

        // 5. 폼 제출
        $form.off('submit').on('submit', function(e) {
            e.preventDefault();
            handleFormSubmit();
        });

        // 6. 별 클릭 (이벤트 위임)
        $ch5Constellation.off('click.ch5game').on('click.ch5game', '.ch5-star', function() {
            showMessageDetail($(this));
        });

        // [수정] 7. 목록 뷰 (캐러셀) - 카드 클릭
        $ch5ListTrack.off('click.ch5game').on('click.ch5game', '.ch5-list-slide-content', function() {
            showMessageDetail($(this));
        });

        // 8. 별자리 뷰 - 드래그-스크롤
        $ch5Container.off('.ch5game');
        $ch5Container.on('pointerdown.ch5game', function(e) {
            // [수정] 목록 뷰일 때는 드래그-스크롤 방지
            if ($ch5Container.hasClass('list-view-active')) return;
            
            // 버튼이나 모달 클릭 시 드래그 방지
            if ($(e.target).is('button, input, textarea, .modal-overlay, .modal-content, .ch5-star')) {
                 isCh5Dragging = false; return;
            }
            isCh5Dragging = true;
            ch5DragStartPos.x = e.clientX;
            ch5DragStartPos.y = e.clientY;
            $ch5Container.css('cursor', 'grabbing');
        }).on('pointermove.ch5game', function(e) {
        	$ch5Scanner.css({ display: 'block', left: `${e.clientX}px`, top: `${e.clientY}px` });
            
            if (isCh5Dragging) {
                // [수정] 가로 이동(deltaX) 계산 및 적용 로직 모두 제거
                const deltaY = e.clientY - ch5DragStartPos.y;
                
                $ch5Container.scrollTop($ch5Container.scrollTop() - deltaY);
                
                // Y 좌표만 업데이트하여 가로 드래그를 막음
                ch5DragStartPos.y = e.clientY;
            }
        }).on('pointerup.ch5game pointerleave.ch5game', function() {
            isCh5Dragging = false;
            $ch5Container.css('cursor', 'grab');
        });

     // 9. 뷰 토글 버튼 클릭
        $ch5ViewToggle.off('click').on('click', '.ch5-toggle-btn', function() {
            // ... (기존 뷰 토글 로직) ...
            const $this = $(this);
            if ($this.hasClass('active')) return;
            const view = $this.data('view');
            $ch5ViewToggle.find('.ch5-toggle-btn').removeClass('active');
            $this.addClass('active');

            if (view === 'list') {
                $ch5Container.addClass('list-view-active');
                if (ch5AnimationId) cancelAnimationFrame(ch5AnimationId);
                ch5AnimationId = null;
                updateCarouselState(); // [신규] 목록 뷰 상태 업데이트
            } else {
                $ch5Container.removeClass('list-view-active');
                if (!ch5AnimationId) {
                    drawStarfield();
                }
            }
        });
        
        // [신규] 10. 캐러셀 버튼 클릭
        $ch5ListPrev.off('click').on('click', () => goToSlide(ch5CurrentIndex - 1));
        $ch5ListNext.off('click').on('click', () => goToSlide(ch5CurrentIndex + 1));

        // [신규] 11. 캐러셀 터치 스와이프
        $ch5ListTrack.off('.ch5game')
            .on('touchstart.ch5game', handleTouchStart)
            .on('touchend.ch5game', handleTouchEnd);
    }
    
    // [신규] 12. 캐러셀 스와이프 핸들러
    function handleTouchStart(e) {
        ch5TouchStartX = e.touches[0].clientX;
    }
    
    function handleTouchEnd(e) {
        if (ch5TouchStartX === 0) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - ch5TouchStartX;

        if (deltaX < -50) { // 왼쪽으로 50px 이상 스와이프 (다음)
            goToSlide(ch5CurrentIndex + 1);
        } else if (deltaX > 50) { // 오른쪽으로 50px 이상 스와이프 (이전)
            goToSlide(ch5CurrentIndex - 1);
        }
        ch5TouchStartX = 0; // 리셋
    }

    // --- 7. 별 디자인 선택 UI 생성 ---
    function populateStarSelector() {
        $starSelector.empty();
        STAR_DESIGNS.forEach((star, index) => {
            // [수정] data-star-index를 사용하고 index를 저장
            const $option = $(`<span class="ch5-star-option" data-star-index="${index}"></span>`); 
            
            // 이미지/텍스트 조건부 처리 (이전 수정 로직 유지)
            if (star.startsWith('http')) {
                $option.empty().append($('<img>', { src: star, alt: 'star image' }));
            } else {
                $option.text(star);
            }
            
            if (index === 0) $option.addClass('selected');
            $starSelector.append($option);
        });
    }


    // --- 8. [PLACEHOLDER] 파이어베이스 연동 로직 ---

    /**
     * [FIREBASE PLACEHOLDER]
     * 파이어베이스에서 메시지(별) 목록을 불러옵니다.
     */
    function loadMessagesFromFirebase() {
        console.log("Firebase 'getDocs' Placeholder: 로딩 시작...");
        
        // --- [수정] 시뮬레이션을 위한 20개의 메시지 생성 (X 좌표 고정) ---
        const LATEST_TIMESTAMP = Date.now(); 
        const dummyMessages = [];
        
        // X 좌표 계산 범위 (5% ~ 90%)
        const X_RANGE = 85; 
        
        for (let i = 0; i < 20; i++) {
            // [수정] X 좌표를 여기서 한 번만 무작위로 생성하여 저장합니다.
            const randomX = Math.random() * X_RANGE + 5; 

            dummyMessages.push({
                id: `msg${20 - i}`, 
                name: `Traveler_${20 - i}`, 
                message: `Message #${20 - i} in the chronological path.`, 
                star: i % 5, 
                x: `${randomX}%`, // [핵심] X 좌표 저장 (고정)
                // Y 좌표는 저장하지 않습니다!
                timestamp: LATEST_TIMESTAMP - (i * 10000) 
            });
        }
        // -----------------------------------------------------

        // [수정] 최신순(timestamp 내림차순)으로 정렬합니다.
        ch5MessageList = dummyMessages.sort((a, b) => b.timestamp - a.timestamp);
        
        displayMessages(ch5MessageList);
    }

    /**
     * [FIREBASE PLACEHOLDER]
     * 사용자가 작성한 새 메시지(별)를 파이어베이스에 저장합니다.
     */
    function handleFormSubmit() {
        const newStarData = {
            name: $inputName.val().trim(),
            message: $inputMessage.val().trim(),
            star: $selectedStarInput.val(), 
            timestamp: Date.now() 
        };
        
        if (!newStarData.name || !newStarData.message) {
            alert("별 이름과 메시지를 모두 입력해주세요.");
            return;
        }

        console.log("Firebase 'addDoc' Placeholder: 저장 데이터", newStarData);
        $submitBtn.prop('disabled', true).text('전송 중...');

        // --- 시뮬레이션: 0.5초 후 성공 ---
        setTimeout(() => {
            const simulatedId = `dummy-${Date.now()}`;
            const tempRandomX = Math.random() * 85 + 5; 
            newStarData.x = `${tempRandomX}%`;
            
            // [수정] 새 데이터를 데이터 배열 *맨 앞(최신)*에 추가
            ch5MessageList.unshift(newStarData);
            
            // [수정] displayMessages를 다시 호출하여 양쪽 뷰를 '새로고침'합니다.
            displayMessages(ch5MessageList);
            
            
            $formModal.fadeOut(300);
            $submitBtn.prop('disabled', false).text('우주로 띄우기');
            
            // [수정] 새 글을 썼으니 1페이지(인덱스 0)로 이동
            goToSlide(0);
        }, 500);
        // --- 시뮬레이션 끝 ---
    }


    // --- 9. UI 표시 로직 ---
    /**
     * (DB에서) 불러온 모든 메시지를 양쪽 뷰에 표시합니다.
     */
    function displayMessages(messages) {
        $ch5Constellation.empty();
        $ch5ListTrack.empty();
        
        // [신규] 별을 묶는 그룹 크기 (한 수직 슬롯에 3개의 별 배치)
        const GROUP_SIZE = 3; 
        const total = messages.length;
        const totalSlots = Math.ceil(total / GROUP_SIZE); // 총 수직 슬롯 개수
        
        const padding = 5; // Y좌표 상하 여백 (5% ~ 95% 범위 사용)
        const availableRange = 90; // 95 - 5 = 90%

        messages.forEach((msg, i) => {
            
            let messageY;
            
            // 1. [그룹 로직] 메시지가 적을 때와 많을 때를 분리 처리
            if (total <= GROUP_SIZE) { 
                // 별이 3개 이하일 때는 넓게 펼치기 (기존 로직 사용)
                messageY = padding + (i / (total - 1)) * availableRange;
            } else {
                // 별이 4개 이상일 때 그룹화 시작
                const slotIndex = Math.floor(i / GROUP_SIZE);
                
                // Base Y: 그룹의 기준선 Y 좌표 (그룹 인덱스 기반)
                const baseY = padding + (slotIndex / (totalSlots - 1)) * availableRange;
                
                // Slot Height: 한 그룹이 차지하는 수직 공간
                const slotHeight = availableRange / totalSlots;

                // Y Noise: 슬롯 내에서 무작위로 분산 (슬롯 높이의 80% 내에서 무작위 값 추가)
                const yNoise = Math.random() * slotHeight * 0.8;
                
                messageY = baseY + yNoise; // Base Y + 무작위 노이즈
            }
            
            // 2. X 좌표는 저장된 값(msg.x)을 사용합니다.
            const savedX = msg.x || `${Math.random() * 85 + 5}%`;
            
            // 3. 메시지 데이터 변환 및 할당
            const designIndex = parseInt(msg.star);
            const designString = STAR_DESIGNS[designIndex] || STAR_DESIGNS[0];
            
            const data = { 
                ...msg, 
                star: designString,
                x: savedX,   // [핵심] 저장된 X 좌표 사용
                y: `${messageY}%`  // [핵심] 그룹화된 Y 좌표 사용
            }; 
            const id = msg.id;
            
            addStarToUniverse(id, data);
            addMessageToCarousel(id, data, false);
        });
        
        // [신규] 모든 메시지 로드 후, 캐러셀 상태 최종 업데이트
        goToSlide(0);
    }
    
    /**
     * 메시지(별) 1개를 우주 공간에 추가합니다.
     * @param {string} id - 문서 ID
     * @param {object} data - 메시지 데이터 (name, message, star, x, y)
     */
    function addStarToUniverse(id, data) {
        const $star = $(`<div class="ch5-star" id="star-${id}"></div>`);
        
        // --- [수정] 이미지일 경우 <img> 태그 삽입 ---
        if (data.star.startsWith('http')) {
            $star.empty().append($('<img>', { src: data.star, alt: 'star image' }));
            $star.css('font-size', '0'); // 이미지이므로 이모지 텍스트 폰트 크기는 0으로 설정
        } else {
            $star.text(data.star); // 이모지일 경우 텍스트 사용
            $star.css({
                 'background-image': 'none', 
                 'font-size': '2.5em' // [수정] 이모지 폰트 크기 명확히 복원
            });
        }
        // --- [수정] 끝 ---

        // 닉네임 라벨 (절대 크기로 설정했으므로 font-size:0에 영향을 받지 않음)
        $star.append(`<span class="ch5-star-name">${data.name}</span>`); 
        
        $star.css({
            top: data.y,  
            left: data.x, 
            'animation-delay': `${Math.random() * -3}s`
        });
        $star.data('messageData', data);
        $ch5Constellation.append($star);
    }

    /**
     * [수정] 메시지 1개를 캐러셀 목록 뷰에 추가합니다.
     */
    function addMessageToCarousel(id, data, atTop = false) {
        const messageHtml = data.message.replace(/\n/g, '<br>');
        const $slide = $(`<div class="ch5-list-slide" data-message-id="${id}"></div>`); 
        
        let iconHtml;
        // --- [수정] 이미지일 경우 <img> 태그 삽입 ---
        if (data.star.startsWith('http')) {
            iconHtml = `<span class="ch5-list-item-icon image-icon"><img src="${data.star}" alt="star icon"></span>`;
        } else {
            iconHtml = `<span class="ch5-list-item-icon">${data.star}</span>`;
        }
        // --- [수정] 끝 ---
        
        const $content = $(`
            <div class="ch5-list-slide-content">
                ${iconHtml}
                <span class="ch5-list-item-name">${data.name}</span>
                <p class="ch5-list-item-message">${messageHtml}</p>
            </div>
        `);
        
        $content.data('messageData', data);
        $slide.append($content);
        
        if (atTop) {
            $ch5ListTrack.prepend($slide);
        } else {
            $ch5ListTrack.append($slide);
        }
    }
    
    /**
     * 캐러셀을 특정 인덱스로 이동시킵니다.
     */
    function goToSlide(index) {
        const total = ch5MessageList.length;
        if (total === 0) {
            updateCarouselState(); 
            return;
        }
        
        // [신규] 1. 래핑(wrap-around)이 발생하는지 체크
        let isWrapping = false;

        // [수정] 무한 순환(Loop) 로직
        if (index < 0) { 
            index = total - 1; // 0 -> total - 1
            isWrapping = true; // 래핑 발생!
        } else if (index >= total) { 
            index = 0; // total - 1 -> 0
            isWrapping = true; // 래핑 발생!
        }

        ch5CurrentIndex = index;
        
        // ... (이전의 너비 계산 로직은 그대로 둡니다) ...
        const slideWidth = $ch5ListViewWrapper.width();
        const containerWidth = $ch5Container.width() > 0 ? $ch5Container.width() : $(window).width();
        const calculatedWidth = Math.min(containerWidth, 400);
        const validSlideWidth = (slideWidth > 0) ? slideWidth : calculatedWidth;
        const offset = -ch5CurrentIndex * validSlideWidth;
        
        
        // [신규] 2. 래핑(isWrapping=true)일 경우, CSS transition을 'none'으로 설정
        if (isWrapping) {
            $ch5ListTrack.css('transition', 'none'); // '휘리릭' 애니메이션 끔
        }
        
        // 3. (애니메이션이 꺼졌든 켜졌든) 즉시 위치 이동
        $ch5ListTrack.css('transform', `translateX(${offset}px)`);
        
        // [신규] 4. 래핑이었을 경우, 아주 잠깐(0초) 뒤에 transition을 다시 켬
        // (이래야 다음 '일반' 이동(예: 2->3) 시 애니메이션이 다시 작동합니다)
        if (isWrapping) {
            setTimeout(function() {
                // ''(빈 값)으로 설정하면 20251211.css 파일의 원래 transition 값으로 복구됨
                $ch5ListTrack.css('transition', ''); 
            }, 0); // 0초 뒤에 바로 실행
        }
        
        updateCarouselState(); // 버튼 및 카운터 업데이트
    }
    
    /**
     * [신규] 캐러셀의 현재 상태 (버튼, 카운터)를 업데이트합니다.
     */
    function updateCarouselState() {
        const total = ch5MessageList.length;
        
        if (total === 0) {
            $ch5ListCounter.hide();
            $ch5ListPrev.hide();
            $ch5ListNext.hide();
        } else {
            // [요청] (현재 / 총 개수) 표시
            $ch5ListCounter.text(`(${ch5CurrentIndex + 1} / ${total})`).show();
            
            // [수정] 1개 '초과'일 때 항상 버튼 표시 (무한 캐러셀)
            const showButtons = total > 1;
            $ch5ListPrev.toggle(showButtons);
            $ch5ListNext.toggle(showButtons);
        }
    }

    /**
     * 클릭한 별 (또는 목록)의 상세 메시지 팝업을 띄웁니다.
     * @param {jQuery} $element - 클릭된 .ch5-star 또는 .ch5-list-item 요소
     */
    function showMessageDetail($element) {
        const data = $element.data('messageData');
        if (!data) return;

        // --- [수정] 이미지일 경우 <img> 태그 삽입 ---
        if (data.star.startsWith('http')) {
            $messageIcon.empty().append($('<img>', { src: data.star, alt: 'star icon' }));
            $messageIcon.css({
                'font-size': '0',
                'width': '40px', // 이미지 크기 지정 (컨테이너 크기)
                'height': '40px',
                'background-image': 'none' // 이전 CSS 스타일 초기화
            });
        } else {
            $messageIcon.text(data.star).empty().css({
                'font-size': '2.5em', 
                'width': 'auto',
                'height': 'auto',
                'background-image': 'none' // 이전 CSS 스타일 초기화
            });
        }
        // --- [수정] 끝 ---

        $messageAuthor.text(`- ${data.name} -`);
        $messageText.html(data.message.replace(/\n/g, '<br>'));

        $messageModal.css('display', 'flex').hide().fadeIn(300);
    }
});