// 창의 모든 리소스(이미지 포함)가 로드되면 스크립트를 실행합니다.
$(window).on('load', function() {

    // 로딩 화면을 서서히 사라지게 합니다.
    $('#loader').fadeOut(500, function() {
        // 로딩 화면이 사라진 후, 조종석을 서서히 나타나게 합니다.
        $('.cockpit-container').fadeIn(500);
    });

    // --- DOM 요소 캐싱 ---
    const $cockpit = $('.cockpit-container');
    const $storyOverlay = $('#story-overlay'); // 스토리 오버레이 캐싱
    const $storyTextContainer = $('#story-text-container');
    const $storyCursor = $('.story-cursor');
    const $galaxyMap = $('.galaxy-map-container');

    // 챕터 컨테이너
    const $chapter1 = $('#chapter1-container');

    // 챕터 전환
    const $chapterTransition = $('#chapter-transition');
    const $transitionTitle = $('#transition-title');
    const $transitionImage = $('#transition-image'); // 전환 이미지 캐싱

    // 오프닝
    const $passwordInput = $('#password-input');
    const $enterButton = $('#enter-button');
    const $statusMessage = $('#status-message');

    // 항해 지도
    const $exploreBtn = $('#explore-btn');
    const $planets = $('.planet');

    // 모달
    const $modal = $('#custom-modal');
    const $modalText = $('#modal-text');
    const $modalCloseBtn = $('.modal-close-btn');
    const $modalButtonContainer = $('#modal-button-container');

    // 시 모달
    const $poemModal = $('#poem-modal');
    const $poemCloseBtn = $('.poem-close-btn');
    // const $poemModalButtonContainer = $('#poem-modal-button-container'); // 삭제


    // 챕터 1
    const $storyIntro = $('#story-intro');
    const $startGameBtn = $('#start-game-btn'); // 인트로 화면의 게임 시작 버튼
    const $skipGameBtn = $('#skip-game-btn');   // 인트로 화면의 넘어가기 버튼
    const $asteroidGame = $('#asteroid-game');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const $gameCountdown = $('#game-countdown'); // 카운트다운 요소 캐싱
    const $gameTimer = $('#game-timer'); // 타이머 표시 요소
    const $gameScore = $('#game-score'); // 점수판 (숨겨짐)
    const $exitPortal = $('#exit-portal'); // 탈출 포탈
    // const $memoryFoundMsg = $('#memory-found-msg'); // 기억 조각 발견 메시지 요소 제거


    // --- 오프닝 화면 기능 ---
    const correctPassword = "1211";

    function boardSpaceship() {
        const inputValue = $passwordInput.val();
        if (inputValue === correctPassword) {
            $statusMessage.css('color', '#55efc4').text('SYSTEM :: 승인 코드 확인. 이륙 시퀀스를 시작합니다...');
            $cockpit.css('animation', 'takeoff 2s forwards');
            setTimeout(function() {
                $cockpit.hide();
                // Show story overlay first
                showStoryOverlay(); // 스토리 오버레이 표시 함수 호출
            }, 2000); // After takeoff animation
        } else {
            // 힌트가 보이도록 상태 메시지 초기화 후 에러 메시지 표시
            $statusMessage.html('<span class="hint">HINT: 데뷔일</span>').css('color', '#ff4757').append(" SYSTEM :: ERROR. 승인 코드가 일치하지 않습니다.");
            $passwordInput.val("").focus();
        }
    }

    $('head').append(`
        <style>
            @keyframes takeoff {
                0% { transform: scale(1) rotate(0deg); opacity: 1; }
                20% { transform: scale(1.05) rotate(1deg); }
                40% { transform: scale(1.05) rotate(-1deg); }
                100% { transform: scale(5); opacity: 0; }
            }
        </style>
    `);

    $enterButton.on('click', boardSpaceship);
    $passwordInput.on('keyup', function(event) {
        if (event.key === 'Enter') {
            boardSpaceship();
        }
    });

    // --- 스토리 오버레이 로직 (타이핑 효과 + 클릭 대기) ---
    function showStoryOverlay() {
        const storyLines = [
            "시간여행자님, 우주선 탑승을 환영합니다.", // 수정된 텍스트
            "이제부터 10년의 시간을 거슬러 올라가,", // 수정된 텍스트
            "흩어진 기억의 조각들을 모으는 탐사를 시작합니다.", // 수정된 텍스트
            "모든 조각을 찾아 최종 목적지 '우주'에 도달하는 것이 우리의 임무입니다.", // 수정된 텍스트
            "준비되셨다면, 화면을 터치하여 항해를 시작해주십시오." // 수정된 텍스트
        ];
        let lineIndex = 0;
        let charIndex = 0;
        let typingTimeout;
        $storyTextContainer.empty(); // 이전 내용 비우기
        $storyCursor.hide(); // 커서 초기 숨김
        $storyOverlay.css('display', 'flex').animate({opacity: 1}, 1000);

        function typeWriter() {
            // 첫 줄 타이핑 효과 적용
            if (lineIndex < storyLines.length) {
                const currentLine = storyLines[lineIndex];
                if (charIndex === 0) {
                    // 새 줄 시작 시 p 태그 추가
                    $storyTextContainer.append('<p></p>');
                }
                if (charIndex < currentLine.length) {
                    // 현재 줄의 마지막 p 태그에 글자 추가
                    $storyTextContainer.find('p').last().append(currentLine.charAt(charIndex));
                    charIndex++;
                    typingTimeout = setTimeout(typeWriter, 50); // 타이핑 속도 (ms)
                } else {
                    // 다음 줄로 이동
                    lineIndex++;
                    charIndex = 0;
                    typingTimeout = setTimeout(typeWriter, 500); // 줄 바꿈 딜레이
                }
            } else {
                // 모든 텍스트 타이핑 완료
                $storyCursor.css({'display': 'inline-block', 'opacity': '1'}); // 커서 표시
                // 클릭/터치 이벤트 리스너 추가
                $storyOverlay.off('click').on('click', function() {
                    $(this).off('click'); // 이벤트 한번만 실행되도록 제거
                    clearTimeout(typingTimeout); // 혹시 모를 타임아웃 제거
                    $storyOverlay.animate({opacity: 0}, 1000, function() {
                        $(this).hide();
                        $galaxyMap.css('display', 'flex').hide().fadeIn(1000);
                    });
                });
            }
        }
        clearTimeout(typingTimeout); // 이전 타임아웃 클리어
        typeWriter(); // 타이핑 시작
    }


    // --- 챕터 전환 및 시작 로직 ---
    function showChapter(chapterNum, chapterTitle, planetImgSrc) { // 행성 이미지 소스 추가
        // 현재 화면(항해 지도)을 페이드 아웃
        $galaxyMap.fadeOut(500);

        // 챕터 전환 화면 설정 및 보여주기
        $transitionTitle.text(chapterTitle);
        $transitionImage.attr('src', planetImgSrc).css('color', $(`#planet${chapterNum} img`).css('color')); // 이미지 설정 및 그림자 색상 동기화
        $chapterTransition.css('display', 'flex').animate({opacity: 1}, 500);

        // 1.5초 후 챕터 전환 화면을 숨기고 실제 챕터 화면을 보여줌
        setTimeout(function() {
            $chapterTransition.animate({opacity: 0}, 500, function() {
                $(this).hide();
            });

            // 해당 챕터 컨테이너를 찾아서 보여줌
            const $targetChapter = $(`#chapter${chapterNum}-container`);

            // 챕터 1 초기화
            if (chapterNum === 1) {
                $storyIntro.hide(); // 인트로 숨김
                $asteroidGame.hide(); // 게임 숨김
                 $exitPortal.hide(); // 포탈 숨김
                 //$memoryFoundMsg.hide(); // 메시지 요소 제거됨
            }

            $targetChapter.css('display', 'flex').animate({opacity: 1}, 1000, function() {
                 // 챕터 1의 경우, 스토리 인트로 먼저 보여주기
                if (chapterNum === 1) {
                    $storyIntro.fadeIn(500); // 인트로 페이드인
                     // 인트로 화면의 버튼에 이벤트 바인딩
                    $startGameBtn.off().on('click', startCountdown); // 카운트다운 시작 함수 호출
                    $skipGameBtn.off().on('click', function(){
                         // 넘어가기 버튼 클릭 시 바로 기억 발견 팝업 표시
                         showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                             showStart: true, startText: '확인', onStart: showPoem, // 확인 버튼 누르면 시 보여주기
                             showSkip: true, skipText: '닫기', onSkip: () => goToNextChapter(1) // 닫기 버튼 누르면 다음 챕터로
                         });
                    });
                }
            });

        }, 1500);
    }

    // --- 다음 챕터로 이동하는 함수 ---
    function goToNextChapter(currentChapter) {
        stopAsteroidGame(); // 게임 루프 중지
        const $currentChapterContainer = $(`#chapter${currentChapter}-container`);
        // 현재 챕터를 페이드 아웃
        $currentChapterContainer.fadeOut(500, function() {
            // 항해 지도로 돌아가고, 다음 챕터가 열렸음을 알림
            $galaxyMap.fadeIn(1000);
            if (currentChapter < 5) {
                 showModal(`챕터 ${currentChapter} 클리어! <br> 다음 챕터로 진행할 수 있습니다.`);
            } else {
                 showModal("모든 챕터를 클리어했습니다!");
            }
        });
    }


    // 항해 시작 버튼 클릭 (가이드 항해)
    $exploreBtn.on('click', function() {
        const $firstPlanet = $('#planet1'); // 첫 번째 행성 요소 가져오기
        const chapterNum = $firstPlanet.data('chapter');
        const chapterTitle = $firstPlanet.data('title');
        const planetImgSrc = $firstPlanet.find('img').attr('src'); // 이미지 소스 가져오기
        showChapter(chapterNum, chapterTitle, planetImgSrc);
    });

    // 행성 클릭 (자유 탐사)
    $planets.on('click', function() {
        const chapterNum = $(this).data('chapter');
        const chapterTitle = $(this).data('title');
        const planetImgSrc = $(this).find('img').attr('src'); // 클릭된 행성의 이미지 소스

        if (chapterNum === 1) {
            showChapter(chapterNum, chapterTitle, planetImgSrc);
        } else {
            showModal(`Chapter ${chapterNum}은 아직 개발 중입니다.`);
        }
    });

    // --- 챕터 1: 게임 시작 카운트다운 ---
    function startCountdown() {
        $storyIntro.hide(); // 인트로 숨기기
        $asteroidGame.fadeIn(500, function() { // 게임 화면 표시
            $gameCountdown.text('3').fadeIn(100); // 3 표시

            let count = 2;
            const countdownInterval = setInterval(function() {
                if (count > 0) {
                    $gameCountdown.fadeOut(100, function() { $(this).text(count).fadeIn(100); });
                    count--;
                } else {
                    clearInterval(countdownInterval);
                    $gameCountdown.fadeOut(100, function() { $(this).text('START!').fadeIn(100).fadeOut(500, function() {
                        initAsteroidGame(); // 카운트다운 후 게임 초기화 및 시작
                    }); });
                }
            }, 1000); // 1초 간격
        });
    }

    // --- 챕터 1: 별똥별 피하기 게임 로직 ---
    let player, asteroids, score, gameOver, animationFrameId, startTime, elapsedTime;
    const keys = {}; // 키 상태 저장 객체 초기화
    const GOAL_TIME = 15; // 목표 시간 (초)
    let touchLeft = false; // 왼쪽 터치 상태
    let touchRight = false; // 오른쪽 터치 상태

    // 플레이어 우주선 이미지 로드
    const playerShipImage = new Image();
    playerShipImage.src = 'https://lh3.googleusercontent.com/d/1YGU4_zTLVyxGukLOLIaw1vgU03lmIoUt';
    // 플레이어 이미지 로드가 완료될 때까지 기다립니다.
    let playerImageLoaded = false;
    playerShipImage.onload = () => {
        playerImageLoaded = true;
    };


    // 장애물 이미지 (제공될 이미지 주소)
    const asteroidImages = [];
    // asteroidImages.push(new Image()); asteroidImages[0].src = 'YOUR_SMALL_ASTEROID_IMAGE_URL';
    // asteroidImages.push(new Image()); asteroidImages[1].src = 'YOUR_ICE_ASTEROID_IMAGE_URL';
    // asteroidImages.push(new Image()); asteroidImages[2].src = 'YOUR_METAL_ASTEROID_IMAGE_URL';

    // 모든 장애물 이미지 로드를 추적
    let asteroidImagesLoadedCount = 0;
    const totalAsteroidImages = 0; // 나중에 3으로 변경될 것
    // asteroidImages.forEach(img => {
    //     img.onload = () => {
    //         asteroidImagesLoadedCount++;
    //     };
    // });


    function initAsteroidGame() {
        // 게임 화면은 이미 표시됨 (카운트다운 후)

        // 캔버스 크기 설정
        canvas.width = $asteroidGame.width();
        canvas.height = $asteroidGame.height();

        // 플레이어 초기화
        player = {
            x: canvas.width / 2 - 25, // 이미지 크기에 맞춰 조정 (예: 50x50)
            y: canvas.height - 70, // 이미지 크기에 맞춰 조정
            width: 50, // 이미지 크기
            height: 50, // 이미지 크기
            speed: 3.5, // 난이도 조절: 속도 약간 줄임
            dx: 0, // 좌우 이동 속도
            dy: 0 // 상하 이동 속도
        };

        // 게임 상태 초기화
        asteroids = [];
        score = 0; // 점수는 이제 부가 정보
        gameOver = false;
        startTime = performance.now(); // 타이머 시작 시간 기록
        elapsedTime = 0; // 경과 시간 초기화
        $gameTimer.text(`남은 시간: ${GOAL_TIME}초`).show(); // 타이머 표시
        $exitPortal.hide(); // 포탈 숨김
        // $memoryFoundMsg.hide(); // 메시지 요소 제거됨

        // 키 상태 초기화 (재시작 시 중요)
        for (let key in keys) {
            keys[key] = false;
        }
        touchLeft = false;
        touchRight = false;


        // 키보드 이벤트 리스너 (이전에 바인딩된 것 해제 후 다시 바인딩)
        $(window).off('.asteroidGame').on('keydown.asteroidGame', function(e) { keys[e.key.toLowerCase()] = true; });
        $(window).on('keyup.asteroidGame', function(e) { keys[e.key.toLowerCase()] = false; });

        // 모바일 터치 이벤트 리스너 (캔버스 전체)
        $(canvas).off('.asteroidTouch').on('touchstart.asteroidTouch touchmove.asteroidTouch', function(e) {
            e.preventDefault();
            touchLeft = false;
            touchRight = false;
            const touches = e.touches || e.originalEvent.touches;
            const canvasRect = canvas.getBoundingClientRect();
            for (let i = 0; i < touches.length; i++) {
                const touchX = touches[i].clientX - canvasRect.left;
                if (touchX < canvas.width / 2) {
                    touchLeft = true;
                } else {
                    touchRight = true;
                }
            }
        }).on('touchend.asteroidTouch touchcancel.asteroidTouch', function(e) {
             e.preventDefault();
             // 터치가 끝나면 해당 방향 플래그만 false로 설정
            const touches = e.changedTouches || e.originalEvent.changedTouches;
             const canvasRect = canvas.getBoundingClientRect();
             for (let i = 0; i < touches.length; i++) {
                const touchX = touches[i].clientX - canvasRect.left;
                if (touchX < canvas.width / 2) {
                    touchLeft = false;
                } else {
                    touchRight = false;
                }
            }
            // 모든 터치가 끝났는지 확인 후 둘 다 false (선택적)
             if (!e.touches || e.touches.length === 0) {
                 touchLeft = false;
                 touchRight = false;
             }
        });


        // 게임 루프 시작
        // 이전 루프가 있다면 확실히 중지
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        asteroidGameLoop();
    }

    function stopAsteroidGame() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null; // ID 초기화
        }
        gameOver = true; // 게임 상태 확실히 종료
        // 이벤트 리스너 제거 (중요)
        $(window).off('.asteroidGame');
        $(canvas).off('.asteroidTouch');
    }


    function updateAsteroidGame() {
        if (gameOver) return;

        // 경과 시간 계산 및 표시
        const currentTime = performance.now();
        elapsedTime = (currentTime - startTime) / 1000; // 초 단위로 변환
        const remainingTime = Math.max(0, GOAL_TIME - Math.floor(elapsedTime));
        $gameTimer.text(`남은 시간: ${remainingTime}초`);

        // 목표 시간 달성 체크
        if (elapsedTime >= GOAL_TIME) {
            gameOver = true;
            stopAsteroidGame(); // 루프 및 리스너 중지

            // 이륙 성공 시각화
            ctx.clearRect(0, 0, canvas.width, canvas.height); // 화면 지우기
            drawPlayer(); // 마지막 위치에 플레이어 한번 그림

            // 성공 메시지 및 포탈 표시
            $exitPortal.fadeIn(500); // 포탈 나타내기

            // 포탈 클릭 시 기억 조각 발견 팝업 표시
            $exitPortal.off().on('click', function() {
                 $exitPortal.hide(); // 포탈 숨김
                 // 기억 발견 팝업 표시 (텍스트 수정)
                 showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                     showStart: true, startText: '확인', onStart: showPoem, // 확인 버튼 누르면 시 보여주기
                     showSkip: true, skipText: '닫기', onSkip: () => goToNextChapter(1) // 닫기 버튼 누르면 다음 챕터로
                 });
            });
            return; // 게임 종료
        }

        // --- 플레이어 이동 로직 수정 ---
        let moveX = 0;
        let moveY = 0;

        // 키보드 입력 처리 (방향키만 사용)
        if (keys['arrowleft']) moveX = -1;
        if (keys['arrowright']) moveX = 1;
        if (keys['arrowup']) moveY = -1;
        if (keys['arrowdown']) moveY = 1;

        // 모바일 터치 입력 처리 (좌우만)
        if (touchLeft) moveX = -1;
        if (touchRight) moveX = 1;

        // 대각선 이동 시 속도 보정
        const length = Math.hypot(moveX, moveY);
        if (length > 0) {
            player.dx = (moveX / length) * player.speed;
            player.dy = (moveY / length) * player.speed;
        } else {
            player.dx = 0;
            player.dy = 0;
        }

        player.x += player.dx;
        player.y += player.dy; // Y축 이동 추가

        // 화면 경계 처리 (상하좌우)
        if (player.x < 0) player.x = 0;
        if (player.y < 0) player.y = 0; // 위쪽 경계
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
        if (player.y + player.height > canvas.height) player.y = canvas.height - player.height; // 아래쪽 경계


        // 새로운 별똥별 생성 (난이도 상향: 생성 확률, 속도 증가)
        if (asteroids.length < 15 && Math.random() < 0.06 + elapsedTime * 0.005) { // 생성 확률 증가
            // if (totalAsteroidImages > 0) { // 장애물 이미지가 로드되었을 경우에만 이미지 사용
                // const randomImage = asteroidImages[Math.floor(Math.random() * totalAsteroidImages)];
                asteroids.push({
                    x: Math.random() * (canvas.width - 20),
                    y: -20,
                    width: 20 + Math.random() * 10, // 크기 랜덤
                    height: 20 + Math.random() * 10,
                    speed: Math.random() * 4 + 3 + elapsedTime * 0.08 // 속도 증가
                    // image: randomImage // 장애물 이미지 추가
                });
            // } else {
            //     // 이미지 없을 경우 기본 사각형
            //     asteroids.push({
            //         x: Math.random() * (canvas.width - 20),
            //         y: -20,
            //         width: 20 + Math.random() * 10,
            //         height: 20 + Math.random() * 10,
            //         speed: Math.random() * 4 + 3 + elapsedTime * 0.08
            //     });
            // }
        }

        // 별똥별 이동 및 충돌 체크
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            asteroid.y += asteroid.speed;

            // 충돌 체크 (판정 범위 약간 축소)
            const collisionPadding = 5; // 충돌 판정 여유 공간 (작을수록 판정 빡빡해짐)
            if (player.x + collisionPadding < asteroid.x + asteroid.width - collisionPadding &&
                player.x + player.width - collisionPadding > asteroid.x + collisionPadding &&
                player.y + collisionPadding < asteroid.y + asteroid.height - collisionPadding &&
                player.y + player.height - collisionPadding > asteroid.y + collisionPadding)
            {
                gameOver = true;
                stopAsteroidGame(); // 루프 및 리스너 중지
                // 실패 시에도 기억 발견 팝업 표시하도록 변경
                showModal("충돌! 다시 시도하시겠습니까?", {
                    showStart: true, startText: '재시도', onStart: initAsteroidGame,
                    showSkip: true, skipText: '넘어가기', onSkip: () => {
                         showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                             showStart: true, startText: '확인', onStart: showPoem,
                             showSkip: true, skipText: '닫기', onSkip: () => goToNextChapter(1)
                         });
                    },
                    hideClose: true
                });
                return; // 게임 종료
            }

            // 화면 아래로 벗어난 별똥별 제거
            if (asteroid.y > canvas.height) {
                asteroids.splice(i, 1);
            }
        }
    }

    // 플레이어 그리기 (임시 사각형 -> 우주선 이미지로 변경)
    function drawPlayer() {
        if (playerImageLoaded) { // 이미지가 로드된 경우에만 그림
            ctx.drawImage(playerShipImage, player.x, player.y, player.width, player.height);
        } else { // 이미지가 로드되지 않았다면 기본 사각형이라도 그림
             ctx.fillStyle = '#4facfe'; // 플레이어 색상
             ctx.shadowColor = '#00f2fe';
             ctx.shadowBlur = 10;
             ctx.fillRect(player.x, player.y, player.width, player.height);
             ctx.shadowBlur = 0; // 그림자 리셋
        }
    }

    // 별똥별 그리기 (임시 사각형 -> 소행성 이미지로 변경 예정)
    function drawAsteroids() {
        // if (totalAsteroidImages > 0 && asteroidImagesLoadedCount === totalAsteroidImages) {
        //     asteroids.forEach(asteroid => {
        //         ctx.drawImage(asteroid.image, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
        //     });
        // } else { // 이미지가 로드되지 않았다면 기본 사각형
            ctx.fillStyle = '#feca57'; // 별똥별 색상
            asteroids.forEach(asteroid => {
                ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
            });
        // }
    }

    function drawAsteroidGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // 매 프레임 캔버스 클리어
        drawPlayer();
        drawAsteroids();
    }

    function asteroidGameLoop() {
        if (!gameOver) {
            updateAsteroidGame();
            drawAsteroidGame();
            animationFrameId = requestAnimationFrame(asteroidGameLoop);
        }
    }

     $('head').append(`
        <style>
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            /* 이륙 성공 애니메이션을 위한 스타일 추가 가능 */
        </style>
    `);


    // --- 커스텀 팝업 모달 기능 ---
    function showModal(message, buttons = {}) {
        $modalText.html(message);
        $modalButtonContainer.empty(); // 버튼 컨테이너 비우기

        if (buttons.hideClose) {
            $modalCloseBtn.hide();
        } else {
            $modalCloseBtn.show();
        }

        if (buttons.showStart) {
            const btnText = buttons.startText || '게임 시작';
            const $startButton = $(`<button class="modal-action-btn modal-start-btn">${btnText}</button>`);
            $modalButtonContainer.append($startButton);
            $startButton.on('click', function() {
                hideModal();
                if(buttons.onStart) buttons.onStart();
                else startCountdown(); // 기본적으로 카운트다운 시작
            });
        }

        if (buttons.showSkip) {
            const skipBtnText = buttons.skipText || '넘어가기'; // 버튼 텍스트 옵션 추가
            const $skipButton = $(`<button class="modal-action-btn modal-skip-btn">${skipBtnText}</button>`);
            $modalButtonContainer.append($skipButton);
            $skipButton.on('click', function() {
                hideModal();
                 if(buttons.onSkip) buttons.onSkip(); // 스킵 시 실행할 콜백 추가
                 // 넘어가기 기본 동작 제거 (각 호출 시점에서 정의)
                 // else goToNextChapter(1);
            });
        }

        $modal.css('display', 'flex').hide().fadeIn(300);
    }

    function hideModal() {
        $modal.fadeOut(300);
    }
    $modalCloseBtn.on('click', hideModal);
    $modal.on('click', function(event) {
        // 모달 외부 클릭 시 닫히지 않도록 수정 (hideClose 옵션이 true일 때만)
        if ($(event.target).is($modal) && !$modalCloseBtn.is(':hidden')) {
             hideModal();
        }
    });

    // --- 시 모달 기능 ---
    function showPoem() {
        $poemModal.css('display', 'flex').hide().fadeIn(300);
    }
    function hidePoem() {
        $poemModal.fadeOut(300);
    }
    $poemCloseBtn.on('click', function() { // X 버튼 클릭 시 다음 챕터로 이동
        hidePoem();
        goToNextChapter(1);
    });
    // 시 모달 하단 닫기 버튼 로직 삭제
    $poemModal.on('click', function(event) {
        // 모달 외부 클릭 시 닫히지 않도록 수정
        if ($(event.target).is($poemModal)) {
             // 아무 동작 안 함
        }
    });

});

