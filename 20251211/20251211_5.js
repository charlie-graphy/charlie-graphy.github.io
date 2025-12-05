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
    
    // 목록 뷰 (캐러셀)
    const $ch5ListViewWrapper = $('#ch5-list-view-wrapper');
    const $ch5ListTrack = $('#ch5-list-track');
    const $ch5ListPrev = $('#ch5-list-prev');
    const $ch5ListNext = $('#ch5-list-next');
    const $ch5ListCounter = $('#ch5-list-counter');

    const $ch5WriteBtn = $('#ch5-write-btn');
    const $ch5BackBtn = $('#ch5-back-btn');

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
    
	// 1. 별도 함수 정의
	function preloadChapter5Stars() {
		STAR_DESIGNS.forEach(url => {
			if (url.startsWith('http')) {
				const img = new Image();
				img.src = url;
			}
		});
	}
	
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
    
    // 캐러셀(목록 뷰) 상태
    let ch5DataLoaded = false;
    let ch5CinematicDone = false;
    let ch5MessageList = []; // 모든 메시지 데이터 (최신순)
    let ch5CurrentIndex = 0; // 현재 보고있는 슬라이드 인덱
    let ch5TouchStartX = 0; // 스와이프 시작 X좌표

	// --- 3. 챕터 5 게임 초기화 함수 (전역 할당) ---
    initChapter5Game = function() {
    	ch5DataLoaded = false;
        ch5CinematicDone = false;
        
        // 1. 👇 [핵심] 데이터 로딩을 즉시 시작합니다.
        // 데이터 로딩 완료 시 onDataLoaded 함수가 호출됩니다.
        loadMessagesFromFirebase(onDataLoaded);
        
        // --- 1. 시네마틱 종료 후, 실제 맵을 로드하는 함수 정의 ---
        function startChapter5Archive() {
            if ($canvas.length > 0) {
                ctx = $canvas.get(0).getContext('2d');
                $canvas.get(0).width = UNIVERSE_SIZE;
                $canvas.get(0).height = UNIVERSE_SIZE;
            } else console.error("챕터 5 캔버스를 찾을 수 없습니다.");

            $ch5Container.addClass('game-started');
            $ch5UniverseWrapper.css('display', '');
            $ch5ListViewWrapper.css('display', '');
            $ch5WriteBtn.fadeIn(300);
            $ch5ViewToggle.fadeIn(300);
            $ch5BackBtn.fadeIn(300);

            createStarfield();
            drawStarfield();

            if ($starSelector.children().length === 0) populateStarSelector();
            
            $ch5Container.removeClass('list-view-active');
            $ch5ViewToggle.find('.ch5-toggle-btn').removeClass('active');
            $ch5ViewToggle.find('[data-view="universe"]').addClass('active');

            ch5MessageList = [];
            ch5CurrentIndex = 0;
            updateCarouselState();

            setupChapter5Listeners();
            $ch5BackBtn.off('click').on('click', goToMap);

            $ch5Container.scrollLeft((UNIVERSE_SIZE - $ch5Container.width()) / 2);
            $ch5Container.scrollTop(0); 
        } 
        
        
        // --- 2. 시네마틱 연출 로직 (정적 배경 이미지 활용) ---
        const $storyOverlay = $('#story-overlay');
        const $storyTextContainer = $('#story-text-container');
        const cinematicText = [
        	"시간 여행을 함께 해주셔서 감사합니다. ",
            "10년의 여정, 여전히 우리는", "우리의 우주를 만들고 있습니다.",
            "함께 보낸 모든 기억들이 가장 소중한 별이 되어 이 은하를 채웁니다.",
            "우리의 우주에 당신의 순간들을", "별로 띄워주세요."
        ];
        
        $storyTextContainer.empty();
        
        // [FIX 1] #story-overlay에 고유 클래스 추가
        $storyOverlay.addClass('ch5-cinematic-active').css({
            'display': 'flex',
            'color': '#FFFFFF', 
            'opacity': 0 
        }).animate({opacity: 1}, 800); 

        // [FIX 2] 임시 스타일링 로직 제거 (CSS 클래스로 이동)
        $storyTextContainer.css({
            'z-index': '10' // 텍스트가 배경 이미지 위로 오도록만 설정
        });
        
        // --- 타이핑 관련 변수 정의 ---
        let lineIndex = 0;
        let charIndex = 0;
        let typingTimeout;
        
        // 타이핑 완료 후 최종 상태 (커서 표시, 클릭 대기)
        function showFinalState() {
            $('.story-cursor').css({'display': 'inline-block', 'opacity': '1'}).removeClass('blinking'); 
            
            $storyOverlay.off('click').on('click', function() {
        		$(this).off('click');
                $storyOverlay.animate({opacity: 0}, 1000, function() {
                    $(this).hide();
                    $storyTextContainer.css({'background': '', 'padding': '', 'border-radius': '', 'z-index': ''}).hide().fadeIn(1000);
                    startChapter5Archive(); 
                });
            });
        }

        // 타이핑 중단 및 전체 텍스트 표시
        function finishTyping() {
            if (typingTimeout) clearTimeout(typingTimeout);
            
            // 1. 현재 라인의 남은 텍스트 표시
            const currentLine = cinematicText[lineIndex];
            $storyTextContainer.find('p').last().append(currentLine.substring(charIndex));
            
            // 2. 남은 모든 줄 즉시 표시
            for (let i = lineIndex + 1; i < cinematicText.length; i++) {
                 $storyTextContainer.append(`<p>${cinematicText[i]}</p>`);
            }
            
            // 3. 타이핑 로직을 건너뛰고 최종 상태로 전환
            lineIndex = cinematicText.length; 
            showFinalState();
        }
        
        // 실제 한 글자씩 출력하는 함수
        function typeChar() {
            if (lineIndex < cinematicText.length) {
                const currentLine = cinematicText[lineIndex];
                
                // 새 문단 시작 시 <p> 태그 추가
                if (charIndex === 0)  $storyTextContainer.append('<p></p>'); 
                
                if (charIndex < currentLine.length) {
                    // 한 글자씩 출력
                    $storyTextContainer.find('p').last().append(currentLine.charAt(charIndex));
                    charIndex++;
                    typingTimeout = setTimeout(typeChar, 40); // 40ms 타이핑 속도
                } else {
                    // 줄 완료 후 잠시 멈춤
                    lineIndex++;
                    charIndex = 0;
                    typingTimeout = setTimeout(typeChar, 500);
                }
            } else showFinalState();
        }
        
        // --- Start Click Handler (Skip/Proceed) ---
        $storyOverlay.off('click').on('click', function() {
            if (lineIndex < cinematicText.length) { 
                // 1. 타이핑 중이면 즉시 완료
                finishTyping();
            } else { 
                // 2. 타이핑 완료 후면 최종 상태로 전환 (이벤트 제거 후 재실행)
                $storyOverlay.off('click').trigger('click'); 
            }
        });

        // 3. 시퀀스 시작
        typeChar();
    }; 

    // --- 4. 챕터 5 게임 중지 함수 (전역 할당) ---
    stopChapter5Game = function() {
        if (ch5AnimationId) {
            cancelAnimationFrame(ch5AnimationId);
            ch5AnimationId = null;
        }
        $ch5Container.removeClass('game-started list-view-active');
        $ch5UniverseWrapper.hide();
        $ch5WriteBtn.hide();
        $ch5ViewToggle.hide();
        $ch5ListViewWrapper.hide();
        
        $ch5BackBtn.hide();
        $ch5BackBtn.off('click');
        
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
        $ch5ListTrack.off('.ch5game');
        $ch5ListPrev.off('click');
        $ch5ListNext.off('click');
        $ch5ViewToggle.off('click');
        
        disconnect();
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
        
        // ch5AnimationId가 null이 아닐 때만 (즉, 목록 뷰가 아닐 때만) 재귀 호출
        if (!$ch5Container.hasClass('list-view-active')) ch5AnimationId = requestAnimationFrame(drawStarfield);
        else ch5AnimationId = null;
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

        // 7. 목록 뷰 (캐러셀) - 카드 클릭
        $ch5ListTrack.off('click.ch5game').on('click.ch5game', '.ch5-list-slide-content', function() {
            showMessageDetail($(this));
        });

        // 8. 별자리 뷰 - 드래그-스크롤
        $ch5Container.off('.ch5game');
        $ch5Container.on('pointerdown.ch5game', function(e) {
            // 목록 뷰일 때는 드래그-스크롤 방지
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
            if (isCh5Dragging) {
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
            const $this = $(this);
            if ($this.hasClass('active')) return;
            const view = $this.data('view');
            $ch5ViewToggle.find('.ch5-toggle-btn').removeClass('active');
            $this.addClass('active');

            if (view === 'list') {
                $ch5Container.addClass('list-view-active');
                if (ch5AnimationId) cancelAnimationFrame(ch5AnimationId);
                ch5AnimationId = null;
                updateCarouselState(); // 목록 뷰 상태 업데이트
            } else {
                $ch5Container.removeClass('list-view-active');
                if (!ch5AnimationId) {
                    drawStarfield();
                }
            }
        });
        
        // 10. 캐러셀 버튼 클릭
        $ch5ListPrev.off('click').on('click', () => goToSlide(ch5CurrentIndex - 1));
        $ch5ListNext.off('click').on('click', () => goToSlide(ch5CurrentIndex + 1));

        // 11. 캐러셀 터치 스와이프
        $ch5ListTrack.off('.ch5game')
            .on('touchstart.ch5game', handleTouchStart)
            .on('touchend.ch5game', handleTouchEnd);

        // 12. 메시지 상세 모달 텍스트 스크롤 감지 리스너
        $messageText.off('scroll.ch5fade').on('scroll.ch5fade', function() {
            handleFadeToggle(this);
        });
    }
    
    // 11. 캐러셀 스와이프 핸들러
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

    function handleFadeToggle(element) {
        const $el = $(element);
        const sh = $el.prop('scrollHeight'); // 요소의 전체 높이 (scrollHeight)
        const ch = $el.innerHeight(); // 현재 보이는 높이 (clientHeight)
        const st = $el.scrollTop(); // 현재 스크롤 위치 (scrollTop)
        
        // 스크롤 위치 + 보이는 높이 >= 전체 높이 (오차 1px 허용)
        const isAtBottom = (st + ch >= sh - 1); 

        if (isAtBottom) {
            $el.addClass('at-bottom');
        } else {
            $el.removeClass('at-bottom');
        }
    }
    // --- 7. 별 디자인 선택 UI 생성 ---
    function populateStarSelector() {
        $starSelector.empty();
        STAR_DESIGNS.forEach((star, index) => {
            const $option = $(`<span class="ch5-star-option" data-star-index="${index}"></span>`); 
            
            // 이미지/텍스트 조건부 처리 (이전 로직 유지)
            if (star.startsWith('http')) {
                $option.empty().append($('<img>', { src: star, alt: 'star image' }));
            } else {
                $option.text(star);
            }
            
            if (index === 0) $option.addClass('selected');
            $starSelector.append($option);
        });
    }

	// 데이터 로드가 완료되었을 때 호출
    function onDataLoaded() {
        ch5DataLoaded = true;
        checkAndFinalizeChapter5();
    }

    // 시네마틱 재생이 완료되었을 때 호출
    function onCinematicDone() {
        ch5CinematicDone = true;
        checkAndFinalizeChapter5();
    }

    // 최종 화면 렌더링 함수 (두 플래그가 모두 true일 때만 실행)
    function checkAndFinalizeChapter5() {
        if (ch5DataLoaded && ch5CinematicDone) {
            $ch5Constellation.empty(); 
            $ch5ListTrack.empty(); 
            displayMessages(ch5MessageList);
        }
    }
    
    // --- 8. [PLACEHOLDER] 파이어베이스 연동 로직 ---
    /**
     * [FIREBASE PLACEHOLDER]
     * 파이어베이스에서 메시지(별) 목록을 불러옵니다.
     */
    function loadMessagesFromFirebase() {
        console.log("Firebase 'getDocs' Placeholder: 로딩 시작...");
        
        if(!isConnected) {
			firebase.database().goOnline();
			isConnected = true;
		}
        
    	if(messageRef) messageRef.off(); // 이전 리스너 해제
    	messageRef = database.ref('10thDebutAnniversary'); // 새로운 리스너 추가
        
    	messageRef.once('value', function(snapshot) {
			const posts = snapshot.val();
	    	const X_RANGE = 85; // X 좌표 계산 범위 (5% ~ 90%) 
	        let dummyMessages = [];
	    	
	        if(posts){
	        	Object.keys(posts).forEach(function(key, index){
	        		const post = posts[key];
	    	    	const randomX = Math.random() * X_RANGE + 5; //X 좌표를 여기서 한 번만 무작위로 생성하여 저장합니다.
	        		
	        		dummyMessages.push({
	                    id: index, 
	                    name: post.name, 
	                    message: post.message, 
	                    star: post.star, 
	                    x: `${randomX}%`, 
	                    timestamp: post.timestamp 
	                });
	        		
	        	});
	        }
	        
	        ch5MessageList = dummyMessages.sort((a, b) => b.timestamp - a.timestamp); //내림차순 정렬
	        displayMessages(ch5MessageList);
	        
	        if (typeof onComplete === 'function') {
	            onComplete(); 
	        }
	    });
    }

    /**
     * [FIREBASE PLACEHOLDER]
     * 사용자가 작성한 새 메시지(별)를 파이어베이스에 저장합니다.
     */
    function handleFormSubmit() {
        const newStarData = {
            name: $inputName.val().trim(),
            message: $inputMessage.val().trim(),
            star: $selectedStarInput.val()
        };
        
        if (!newStarData.name || !newStarData.message) {
            alert("별 이름과 메시지를 모두 입력해주세요.");
            return;
        }
        
        // 1. 데이터 준비 및 timestamp 확정
        const currentTime = Date.now();
        newStarData.timestamp = currentTime;
        
        // X 좌표는 현재 세션에서만 사용할 임시 값으로 생성 (DB에 저장하지 않음)
        const tempRandomX = Math.random() * 85 + 5; 
        newStarData.x = `${tempRandomX}%`;

        console.log("Firebase 'addDoc' Placeholder: 저장 데이터", newStarData);
        $submitBtn.prop('disabled', true).text('전송 중...');

        if(!isConnected) {
    		firebase.database().goOnline();
    		isConnected = true;
    	}
    	if(messageRef) messageRef.off(); // 이전 리스너 해제
    	else messageRef = database.ref('10thDebutAnniversary'); // 새로운 리스너 추가
    	
    	const newPostRef = database.ref('10thDebutAnniversary').push();
        
        newPostRef.set(newStarData)
        .then(() => {
            console.log("메시지 전송 완료");

            // 성공 후 1초 뒤 연결 종료 호출
            setTimeout(disconnect, 1000);

            // 1. 로컬 데이터 준비 및 ID 할당
            newStarData.id = newPostRef.key; // DB가 생성한 고유 ID를 사용
            ch5MessageList.unshift(newStarData); // 로컬 배열에 추가
            
            // 2. UI 업데이트
            $submitBtn.prop('disabled', false).text('우주로 띄우기'); 
            $formModal.fadeOut(300);
            displayMessages(ch5MessageList); // 전체 목록 새로고침
            goToSlide(0); // 목록 뷰 1페이지로 이동

            // 3. 스크롤 및 강조 (별자리 뷰일 때만)
            if (!$ch5Container.hasClass('list-view-active') && typeof $ch5Container !== 'undefined') {
            	const containerW = $ch5Container.width();
                // X 좌표는 중앙에 배치하기 위해 컨테이너 폭의 절반을 는 로직은 유지
                const scrollLeftTarget = (tempRandomX / 100) * UNIVERSE_SIZE - (containerW / 2);
                
                $ch5Container.animate({
                    scrollLeft: scrollLeftTarget,
                    scrollTop: 0
                }, 1200, 'swing', function() {
                    const $newStar = $(`#star-${newStarData.id}`);
                    $newStar.addClass('new-star-highlight');
                    setTimeout(() => $newStar.removeClass('new-star-highlight'), 4000);
                });
            }
        }).catch(error => {
            console.error("메시지 전송 오류:", error);
            $submitBtn.prop('disabled', false).text('우주로 띄우기'); // 버튼 재활성화
            
            $formModal.fadeOut(300);
            if (typeof showModal === 'function') {
                 showModal(`⚠️ 전송 실패: 서버 연결 오류 [${error.code || 'UNKNOWN'}]`, {
                     showStart: true, startText: '다시 시도', onStart: () => {
                         $formModal.css('display', 'flex').hide().fadeIn(300); // 모달 닫고 폼을 다시 띄웁니다.
                     },
                     hideClose: false,
                     skipText: '취소', showSkip: true 
                 });
             }
        });
    }

    // --- 9. UI 표시 로직 ---
    /**
     * (DB에서) 불러온 모든 메시지를 양쪽 뷰에 표시합니다.
     */
    function displayMessages(messages) {
        $ch5Constellation.empty();
        $ch5ListTrack.empty();
        
        // 4개의 수평 레인(Lane) 정의 (비밀 규칙 - 중앙 집중형)
        const HORIZONTAL_LANES = [
            { minX: 5, maxX: 20 },  // Lane 0: 15% width (Outer Left)
            { minX: 20, maxX: 45 }, // Lane 1: 25% width (Inner Left, Wider)
            { minX: 45, maxX: 70 }, // Lane 2: 25% width (Inner Right, Wider)
            { minX: 70, maxX: 85 }  // Lane 3: 15% width (Outer Right)
        ];
        
        const total = messages.length;
        const padding = 4; // Y좌표 상단 여백 (4%)
        const availableRange = 20; // 밀도 유지 (20%)

        messages.forEach((msg, i) => {
            // 1. Y 좌표 계산 (시간순)
            let messageY;
            if (total === 1) {
                messageY = padding; 
            } else {
                messageY = padding + (i / (total - 1)) * availableRange;
            }
            
            // 2. X 좌표는 비밀 규칙(i % 4) 기반으로 위치 할당
            const laneIndex = i % 4; // 0, 1, 2, 3 순서로 레인 인덱스 할당
            const lane = HORIZONTAL_LANES[laneIndex];
            const xRange = lane.maxX - lane.minX;
            
            // 레인 내에서 무작위로 X 좌표 생성 
            const newX = Math.random() * xRange + lane.minX; 
            
            // 3. 메시지 데이터 변환 및 할당
            const designIndex = parseInt(msg.star);
            const designString = STAR_DESIGNS[designIndex] || STAR_DESIGNS[0];
            
            const data = { 
                ...msg, 
                star: designString,
                x: `${newX}%`,       // 규칙 기반 X 좌표 사용
                y: `${messageY}%`  
            }; 
            const id = msg.id;
            
            addStarToUniverse(id, data);
            addMessageToCarousel(id, data, false);
        });
        
        $ch5ListTrack.find('.ch5-list-item-message').each(function() {
            const $this = $(this);
            
            // 스크롤 리스너 직접 바인딩
            $this.off('scroll.ch5fade').on('scroll.ch5fade', function() {
                handleFadeToggle(this);
            });
        });
        
        // 모든 메시지 로드 후, 캐러셀 상태 최종 업데이트
        goToSlide(0);
    }
    
    function recheckAllFadeStates() {
        $ch5ListTrack.find('.ch5-list-item-message').each(function() {
            handleFadeToggle(this);
        });
        
        // 모달 텍스트도 혹시 열려있다면 재확인
        handleFadeToggle($('#ch5-message-modal-text')[0]);
    }
    /**
     * 메시지(별) 1개를 우주 공간에 추가합니다.
     * @param {string} id - 문서 ID
     * @param {object} data - 메시지 데이터 (name, message, star, x, y)
     */
    function addStarToUniverse(id, data) {
        const $star = $(`<div class="ch5-star" id="star-${id}"></div>`);
        
        // 이미지일 경우 <img> 태그 삽입
        if (data.star.startsWith('http')) {
            $star.empty().append($('<img>', { src: data.star, alt: 'star image' }));
            $star.css('font-size', '0'); // 이미지이므로 이모지 텍스트 폰트 크기는 0으로 설정
        } else {
            $star.text(data.star); // 이모지일 경우 텍스트 사용
            $star.css({
                 'background-image': 'none', 
                 'font-size': '2.5em' // 이모지 폰트 크기 명확히 복원
            });
        }

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
     * 메시지 1개를 캐러셀 목록 뷰에 추가합니다.
     */
    function addMessageToCarousel(id, data, atTop = false) {
        const messageHtml = data.message.replace(/\n/g, '<br>');
        const $slide = $(`<div class="ch5-list-slide" data-message-id="${id}"></div>`); 
        const writeDt = new Date(+new Date(data.timestamp) + 3240 * 10000).toISOString().replace("T", " ").replace(/\..*/, '');
        
        let iconHtml;
        if (data.star.startsWith('http')) iconHtml = `<span class="ch5-list-item-icon image-icon"><img src="${data.star}" alt="star icon"></span>`;
        else iconHtml = `<span class="ch5-list-item-icon">${data.star}</span>`;
        
        const $content = $(`
            <div class="ch5-list-slide-content" data-date="${writeDt}">
                ${iconHtml}
                <span class="ch5-list-item-name">${data.name}</span>
                <p class="ch5-list-item-message">${messageHtml}</p>
            </div>
        `);
        
        $content.data('messageData', data);
        $slide.append($content);
        
        if (atTop) $ch5ListTrack.prepend($slide);
        else $ch5ListTrack.append($slide);
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
        
        // 1. 래핑(wrap-around)이 발생하는지 체크
        let isWrapping = false;

        // 무한 순환(Loop) 로직
        if (index < 0) { 
            index = total - 1; // 0 -> total - 1
            isWrapping = true; // 래핑 발생!
        } else if (index >= total) { 
            index = 0; // total - 1 -> 0
            isWrapping = true; // 래핑 발생!
        }

        ch5CurrentIndex = index;
        
        const slideWidth = $ch5ListViewWrapper.width();
        const containerWidth = $ch5Container.width() > 0 ? $ch5Container.width() : $(window).width();
        const calculatedWidth = Math.min(containerWidth, 400);
        const validSlideWidth = (slideWidth > 0) ? slideWidth : calculatedWidth;
        const offset = -ch5CurrentIndex * validSlideWidth;
        
        
        // 2. 래핑(isWrapping=true)일 경우, CSS transition을 'none'으로 설정
        if (isWrapping) {
            $ch5ListTrack.css('transition', 'none'); // '휘리릭' 애니메이션 끔
        }
        
        // 3. (애니메이션이 꺼졌든 켜졌든) 즉시 위치 이동
        $ch5ListTrack.css('transform', `translateX(${offset}px)`);
        
        // 4. 래핑이었을 경우, 아주 잠깐(0초) 뒤에 transition을 다시 켬
        // (이래야 다음 '일반' 이동(예: 2->3) 시 애니메이션이 다시 작동합니다)
        if (isWrapping) {
            setTimeout(function() {
                $ch5ListTrack.css('transition', ''); 

                checkCurrentSlideFadeState();
            }, 0); // 0초 뒤에 바로 실행
        }else {
            // 👇 [수정/추가]: 일반 이동(애니메이션) 후 상태 체크
            // '300ms'는 CSS에서 transition 속성으로 설정된 시간과 일치해야 합니다.
            setTimeout(checkCurrentSlideFadeState, 350); 
        }
        
        updateCarouselState(); // 버튼 및 카운터 업데이트
    }
    
    // 현재 보이는 슬라이드 메시지 내용만 페이드 상태 체크
    function checkCurrentSlideFadeState() {
        // 현재 보이는 슬라이드 내의 .ch5-list-item-message 요소만 찾습니다.
        const $currentSlide = $ch5ListTrack.find('.ch5-list-slide').eq(ch5CurrentIndex);
        const $messageEl = $currentSlide.find('.ch5-list-item-message');
        
        if ($messageEl.length) {
        	$messageEl.scrollTop(0);
            handleFadeToggle($messageEl[0]);
        }
    }
    
    /**
     * 캐러셀의 현재 상태 (버튼, 카운터)를 업데이트합니다.
     */
    function updateCarouselState() {
        const total = ch5MessageList.length;
        
        if (total === 0) {
            $ch5ListCounter.hide();
            $ch5ListPrev.hide();
            $ch5ListNext.hide();
        } else {
            $ch5ListCounter.text(`(${ch5CurrentIndex + 1} / ${total})`).show(); // (현재 / 총 개수) 표시
            
            // 1개 '초과'일 때 항상 버튼 표시 (무한 캐러셀)
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
        const $messageText = $('#ch5-message-modal-text'); // 모달 텍스트 요소
        if (!data) return;

        // 이미지일 경우 <img> 태그 삽입 
        if (data.star.startsWith('http')) {
            $messageIcon.empty().append($('<img>', { src: data.star, alt: 'star icon' }));
            $messageIcon.css({
                'font-size': '0',
                'width': '35px', // 이미지 크기 지정 (컨테이너 크기)
                'height': '35px',
                'background-image': 'none'
            });
        } else {
            $messageIcon.text(data.star).empty().css({
                'font-size': '2.5em', 
                'width': 'auto',
                'height': 'auto',
                'background-image': 'none'
            });
        }

        $messageAuthor.text(`${data.name}`);
        $messageText.html(data.message.replace(/\n/g, '<br>'));
        
        $messageModal.css('display', 'flex').hide().fadeIn(300, function() { // 300ms 애니메이션 완료 후 실행
            $messageText.scrollTop(0);
            handleFadeToggle($messageText[0]);
        });
        
        // 1. 스크롤 리스너 바인딩
        $messageText.off('scroll.ch5fade').on('scroll.ch5fade', function() {
        	handleFadeToggle(this);
        });
        
        handleFadeToggle($messageText[0]);
    }

  //연결을 종료하고 Firebase 오프라인 처리하는 함수
  function disconnect(){
  	if(messageRef) messageRef.off(); // 리스너 해제
  	firebase.database().goOffline(); // Firebase 연결 끊기
  	isConnected = false;
  	console.log('Firebase 연결 종료됨');
  }	
  
  preloadChapter5Stars();
});
$(window).on('beforeunload', function(){
	firebase.database().goOffline();
});