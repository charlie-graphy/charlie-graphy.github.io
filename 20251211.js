// 창의 모든 리소스(이미지 포함)가 로드되면 스크립트를 실행합니다.
$(window).on('load', function() {

    // 로딩 화면을 서서히 사라지게 합니다.
    $('#loader').fadeOut(500, function() {
        // 로딩 화면이 사라진 후, 조종석을 서서히 나타나게 합니다.
        $('.cockpit-container').fadeIn(500);
        // 오프닝 화면 로딩 후 상태 메시지 초기화
        $('#status-message').empty();
    });

    // --- DOM 요소 캐싱 ---
    const $cockpit = $('.cockpit-container');
    const $storyOverlay = $('#story-overlay'); // 스토리 오버레이 캐싱
    const $storyTextContainer = $('#story-text-container');
    const $storyCursor = $('.story-cursor');
    const $galaxyMap = $('.galaxy-map-container');

    // 챕터 컨테이너
    const $chapter1 = $('#chapter1-container');
    const $chapter2 = $('#chapter2-container'); // [신규] 챕터 2 컨테이너

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

    // 시 모달 (챕터 1)
    const $poemModal = $('#poem-modal');
    const $poemCloseBtn = $('.poem-close-btn');

    // [신규] 기억 조각 모달 (챕터 2)
    const $fragmentModal = $('#fragment-modal');
    const $fragmentTitle = $('#fragment-title');
    const $fragmentText = $('#fragment-text');
    const $fragmentCloseBtn = $('.fragment-close-btn');

    // --- 챕터 1 ---
    const $storyIntro = $('#story-intro');
    const $startGameBtn = $('#start-game-btn'); // 인트로 화면의 게임 시작 버튼
    const $skipGameBtn = $('#skip-game-btn');   // 인트로 화면의 넘어가기 버튼
    const $asteroidGame = $('#asteroid-game');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const $gameCountdown = $('#game-countdown'); // 카운트다운 요소 캐싱
    const $gameTimer = $('#game-timer'); // 타이머 표시 요소
    const $exitPortal = $('#exit-portal'); // 탈출 포탈

    // --- 챕터 2 ---
    const $puzzleHub = $('.puzzle-hub'); // 6개 카테고리 허브
    const $puzzleCategories = $('.puzzle-category'); // 6개 아이콘
    const $crosswordGameContainer = $('#crossword-game-container'); // 십자말풀이 게임 영역
    const $crosswordGrid = $('#crossword-grid'); // 십자말풀이 판
    const $crosswordCluesAcross = $('#clues-across'); // 가로 열쇠
    const $crosswordCluesDown = $('#clues-down'); // 세로 열쇠
    const $crosswordTitle = $('#crossword-title'); // 퀴즈 제목
    const $crosswordCheckBtn = $('#crossword-check-btn'); // 정답 확인 버튼
    const $crosswordBackBtn = $('#crossword-back-btn'); // 뒤로가기 버튼
    const $ch2GoMapBtn = $('#ch2-go-map-btn'); // 챕터 2 -> 지도가기 버튼


    // --- 오프닝 화면 기능 ---
    const correctPassword = "1211";

    function boardSpaceship() {
        const inputValue = $passwordInput.val();
        if (inputValue === correctPassword) {
            $statusMessage.css('color', '#55efc4').text('SYSTEM :: 승인 코드 확인. 이륙 시퀀스를 시작합니다...');
            $cockpit.css('animation', 'takeoff 2s forwards');
            setTimeout(function() {
                $cockpit.hide();
                showStoryOverlay(); // 스토리 오버레이 표시 함수 호출
            }, 2000); // After takeoff animation
        } else {
            $statusMessage.html('<span style="color: #ff4757;">ERROR :: 승인 코드가 일치하지 않습니다.</span>'); // ERROR :: 로 수정 및 힌트 완전 제거
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

    // --- 스토리 오버레이 로직 ---
    function showStoryOverlay() {
        // ... (이전 코드와 동일) ...
        const storyLines = [
            "시간여행자님, 우주선 탑승을 환영합니다.", "이제부터 10년의 시간을 거슬러 올라가,",
            "흩어진 기억의 조각들을 모으는 탐사를 시작합니다.", "모든 조각을 찾아 최종 목적지 '우주'에 도달하는 것이 우리의 임무입니다.",
            "준비되셨다면, 화면을 터치하여 항해를 시작해주십시오."
        ];
        let lineIndex = 0;
        let charIndex = 0;
        let typingTimeout;
        let isTyping = true; 
        let typingFinished = false;
        $storyTextContainer.empty(); 
        $storyCursor.hide().css('opacity', '0').removeClass('blinking');
        $storyOverlay.css('display', 'flex').animate({opacity: 1}, 1000);

        function typeWriter() {
            if (lineIndex < storyLines.length && isTyping) {
                const currentLine = storyLines[lineIndex];
                if (charIndex === 0) { $storyTextContainer.append('<p></p>'); }
                if (charIndex < currentLine.length) {
                    $storyTextContainer.find('p').last().append(currentLine.charAt(charIndex));
                    charIndex++;
                    typingTimeout = setTimeout(typeWriter, 50);
                } else {
                    lineIndex++;
                    charIndex = 0;
                    typingTimeout = setTimeout(typeWriter, 500);
                }
            } else if (!isTyping) { 
                clearTimeout(typingTimeout); 
                $storyTextContainer.empty();
                 storyLines.forEach(line => $storyTextContainer.append(`<p>${line}</p>`));
                 lineIndex = storyLines.length;
                 finishTyping();
            } else { 
                 finishTyping();
            }
        }

        function finishTyping() {
             isTyping = false;
             typingFinished = true;
             clearTimeout(typingTimeout);
             $storyCursor.css({'display': 'inline-block', 'opacity': '1'}).addClass('blinking'); 
             $storyOverlay.off('click').on('click', function() {
                 $(this).off('click');
                 $storyOverlay.animate({opacity: 0}, 1000, function() {
                     $(this).hide();
                     $galaxyMap.css('display', 'flex').hide().fadeIn(1000);
                 });
             });
        }
        $storyOverlay.off('click').on('click', function() {
            if (isTyping) {
                isTyping = false; 
                 typeWriter(); 
            }
        });
        typeWriter();
    }


    // --- 챕터 전환 및 시작 로직 ---
    function showChapter(chapterNum, chapterTitle, planetImgSrc) {
        $galaxyMap.fadeOut(500);

        $transitionTitle.text(chapterTitle);
        $transitionImage.attr('src', planetImgSrc).css('color', $(`#planet${chapterNum} img`).css('color'));
        $chapterTransition.css('display', 'flex').animate({opacity: 1}, 500);

        setTimeout(function() {
            $chapterTransition.animate({opacity: 0}, 500, function() {
                $(this).hide();
            });

            const $targetChapter = $(`#chapter${chapterNum}-container`);

            // 챕터 1 초기화
            if (chapterNum === 1) {
                $storyIntro.hide(); 
                $asteroidGame.hide();
                 $exitPortal.hide(); 
            }
            // 챕터 2 초기화
            if (chapterNum === 2) {
                $puzzleHub.show(); // 6개 아이콘 허브 표시
                $crosswordGameContainer.hide(); // 십자말풀이 게임 숨김
                // (클리어 상태에 따라 아이콘 비활성화 등 추가 가능)
            }

            $targetChapter.css('display', 'flex').animate({opacity: 1}, 1000, function() {
                 // 챕터 1 인트로
                if (chapterNum === 1) {
                    $storyIntro.fadeIn(500);
                    $startGameBtn.off().on('click', startCountdown); 
                    $skipGameBtn.off().on('click', function(){
                         showModal("기억 조각 발견!<br>확인하시겠습니까?", { 
                             showStart: true, startText: '확인하기', onStart: showPoem,
                             showSkip: true, skipText: '넘어가기', onSkip: showClearConfirmationPopup,
                             hideClose: false,
                             onClose: () => { $storyIntro.fadeIn(500); } 
                         });
                    });
                }
            });

        }, 1500);
    }

    // --- 항해 지도로 돌아가는 함수 ---
    function goToMap() {
        stopAsteroidGame(); 
        $('.chapter-container').fadeOut(500);
        $poemModal.fadeOut(300);
        $fragmentModal.fadeOut(300); // [신규] 조각 모달도 숨김
        $galaxyMap.fadeIn(1000);
    }

    // --- 특정 챕터로 바로 전환하는 함수 ---
    function transitionToChapter(chapterNum) {
        stopAsteroidGame(); 
         $('.chapter-container').fadeOut(500);
         $poemModal.fadeOut(300);
         $fragmentModal.fadeOut(300); // [신규] 조각 모달도 숨김

        if (chapterNum > 5) {
             showModal("모든 챕터를 클리어했습니다!");
             goToMap();
             return;
        }
        // [수정] 챕터 3 초과일 때 (4, 5)
        if (chapterNum > 3) {
            showModal(`Chapter ${chapterNum}은 아직 개발 중입니다.`);
            goToMap();
            return;
        }
        
        // [신규] 챕터 3 로직
        if (chapterNum === 3) {
            // (일단 개발 중 팝업, 나중에 챕터 3 만들면 됨)
            showModal(`Chapter 3은 아직 개발 중입니다.`);
            goToMap();
            return;
        }

        // 챕터 1, 2 로직
        const $nextPlanet = $(`#planet${chapterNum}`);
        if ($nextPlanet.length > 0) {
            const nextChapterTitle = $nextPlanet.data('title');
            const nextPlanetImgSrc = $nextPlanet.find('img').attr('src');
            showChapter(chapterNum, nextChapterTitle, nextPlanetImgSrc);
        } else {
            showModal("오류: 다음 챕터를 찾을 수 없습니다.");
            goToMap();
        }
    }

    // --- 클리어 확인 팝업 함수 (챕터 1) ---
    function showClearConfirmationPopup() {
        $exitPortal.hide();
        showModal("챕터 1 '이륙' 클리어!<br>다음 여정을 준비하세요.", { 
             showNext: true, // nextChapterNum이 없으므로 기본값 2로 이동
             showMap: true, 
             hideClose: false,
             onClose: goToMap
        });
    }


    // --- 항해 지도 버튼 ---
    $exploreBtn.on('click', function() {
        const $firstPlanet = $('#planet1');
        showChapter($firstPlanet.data('chapter'), $firstPlanet.data('title'), $firstPlanet.find('img').attr('src'));
    });

    $planets.on('click', function() {
        const chapterNum = $(this).data('chapter');
        const chapterTitle = $(this).data('title');
        const planetImgSrc = $(this).find('img').attr('src'); 

        // [수정] 챕터 1과 2는 showChapter 호출
        if (chapterNum === 1 || chapterNum === 2) {
            showChapter(chapterNum, chapterTitle, planetImgSrc);
        } else {
            // [수정] 챕터 3, 4, 5는 개발 중
            showModal(`Chapter ${chapterNum}은 아직 개발 중입니다.`);
        }
    });

    // --- 챕터 1: 게임 시작 카운트다운 ---
    function startCountdown() {
        // ... (이전 코드와 동일) ...
        $storyIntro.hide();
        $asteroidGame.fadeIn(500, function() {
            $gameCountdown.text('3').show().css('opacity', 1);
            let count = 2;
            let countdownTimeout;
            function doCountdown() {
                clearTimeout(countdownTimeout);
                 if (count >= 1) {
                    $gameCountdown.text(count);
                    count--;
                    countdownTimeout = setTimeout(doCountdown, 1000);
                } else if (count === 0){
                    $gameCountdown.text('START!');
                    setTimeout(function() {
                        $gameCountdown.fadeOut(500, function() {
                             $(this).text('');
                            initAsteroidGame();
                        });
                    }, 500);
                }
            }
            countdownTimeout = setTimeout(doCountdown, 1000);
        });
    }

    // --- 챕터 1: 별똥별 피하기 게임 로직 ---
    // ... (이전 코드와 동일) ...
    let player, asteroids, score, gameOver, animationFrameId, startTime, elapsedTime;
    const keys = {};
    const GOAL_TIME = 15;
    let touchLeft = false;
    let touchRight = false;
    const playerShipImage = new Image();
    playerShipImage.src = 'https://lh3.googleusercontent.com/d/1YGU4_zTLVyxGukLOLIaw1vgU03lmIoUt';
    let playerImageLoaded = false;
    playerShipImage.onload = () => { playerImageLoaded = true; };
    const asteroidImages = [];
    const asteroidImageUrls = [
        'https://lh3.googleusercontent.com/d/1pnDZFfBczAJKGdcjDj9VLQVs_6uWK8HF', 'https://lh3.googleusercontent.com/d/1jeWf4rvz31POee3PRhbXvKoCBSx26ICD',
        'https://lh3.googleusercontent.com/d/1q3t8hjSssd9qXD8z_RKKRIH17EMsnWZD', 'https://lh3.googleusercontent.com/d/11fwRvd-E0xb48Sr4YB0GiOKnzs3j_vF6'
    ];
    let asteroidImagesLoadedCount = 0;
    const totalAsteroidImages = asteroidImageUrls.length;
    let allAsteroidImagesLoaded = false;
    asteroidImageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            asteroidImagesLoadedCount++;
            if (asteroidImagesLoadedCount === totalAsteroidImages) {
                allAsteroidImagesLoaded = true;
            }
        };
        asteroidImages.push(img);
    });
    function initAsteroidGame() {
        canvas.width = $asteroidGame.width();
        canvas.height = $asteroidGame.height();
        player = {
            x: canvas.width / 2 - 25, y: canvas.height - 70,
            width: 50, height: 50, speed: 3.5, dx: 0, dy: 0
        };
        asteroids = [];
        score = 0; 
        gameOver = false;
        startTime = performance.now();
        elapsedTime = 0;
        $gameTimer.text(`남은 시간: ${GOAL_TIME}초`).show();
        $exitPortal.hide(); 
        for (let key in keys) { keys[key] = false; }
        touchLeft = false;
        touchRight = false;
        $(window).off('.asteroidGame').on('keydown.asteroidGame', function(e) { keys[e.key.toLowerCase()] = true; });
        $(window).on('keyup.asteroidGame', function(e) { keys[e.key.toLowerCase()] = false; });
        $(canvas).off('.asteroidTouch').on('touchstart.asteroidTouch touchmove.asteroidTouch', function(e) {
            e.preventDefault();
            touchLeft = false;
            touchRight = false;
            const touches = e.touches || e.originalEvent.touches;
            const canvasRect = canvas.getBoundingClientRect();
            for (let i = 0; i < touches.length; i++) {
                const touchX = touches[i].clientX - canvasRect.left;
                if (touchX < canvas.width / 2) { touchLeft = true; } else { touchRight = true; }
            }
        }).on('touchend.asteroidTouch touchcancel.asteroidTouch', function(e) {
             e.preventDefault();
            const touches = e.changedTouches || e.originalEvent.changedTouches;
             const canvasRect = canvas.getBoundingClientRect();
             for (let i = 0; i < touches.length; i++) {
                const touchX = touches[i].clientX - canvasRect.left;
                if (touchX < canvas.width / 2) { touchLeft = false; } else { touchRight = false; }
            }
             if (!e.touches || e.touches.length === 0) {
                 touchLeft = false;
                 touchRight = false;
             }
        });
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); }
        asteroidGameLoop();
    }
    function stopAsteroidGame() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        gameOver = true;
        $(window).off('.asteroidGame');
        $(canvas).off('.asteroidTouch');
    }
    function updateAsteroidGame() {
        if (gameOver) return;
        const currentTime = performance.now();
        elapsedTime = (currentTime - startTime) / 1000;
        const remainingTime = Math.max(0, GOAL_TIME - Math.floor(elapsedTime));
        $gameTimer.text(`남은 시간: ${remainingTime}초`);

        if (elapsedTime >= GOAL_TIME) {
            gameOver = true;
            stopAsteroidGame();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawPlayer();
            $exitPortal.fadeIn(500);
            $exitPortal.off().on('click', function() {
                 showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                     showStart: true, startText: '확인하기', onStart: showPoem,
                     showSkip: true, skipText: '넘어가기', onSkip: showClearConfirmationPopup,
                     hideClose: false,
                     onClose: () => { $exitPortal.show(); }
                 });
            });
            return;
        }
        let moveX = 0;
        let moveY = 0;
        if (keys['arrowleft']) moveX = -1;
        if (keys['arrowright']) moveX = 1;
        if (keys['arrowup']) moveY = -1;
        if (keys['arrowdown']) moveY = 1;
        if (touchLeft) moveX = -1;
        if (touchRight) moveX = 1;
        const length = Math.hypot(moveX, moveY);
        if (length > 0) {
            player.dx = (moveX / length) * player.speed;
            player.dy = (moveY / length) * player.speed;
        } else {
            player.dx = 0;
            player.dy = 0;
        }
        player.x += player.dx;
        player.y += player.dy;
        if (player.x < 0) player.x = 0;
        if (player.y < 0) player.y = 0;
        if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
        if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
        if (asteroids.length < 15 && Math.random() < 0.06 + elapsedTime * 0.005) {
             if (totalAsteroidImages > 0 && allAsteroidImagesLoaded) {
                const randomImageIndex = Math.floor(Math.random() * totalAsteroidImages);
                const randomImage = asteroidImages[randomImageIndex];
                let randomWidth, randomHeight;
                if (randomImage.naturalWidth > 0 && randomImage.naturalHeight > 0) {
                    const baseSize = 35 + Math.random() * 20;
                    const aspectRatio = randomImage.naturalWidth / randomImage.naturalHeight;
                    if(aspectRatio > 1) {
                        randomWidth = baseSize;
                        randomHeight = baseSize / aspectRatio;
                    } else {
                        randomHeight = baseSize;
                        randomWidth = baseSize * aspectRatio;
                    }
                } else {
                    randomWidth = 30 + Math.random() * 15;
                    randomHeight = 30 + Math.random() * 15;
                }
                asteroids.push({
                    x: Math.random() * (canvas.width - randomWidth), y: -randomHeight,
                    width: randomWidth, height: randomHeight,
                    speed: Math.random() * 4 + 3 + elapsedTime * 0.08, image: randomImage
                });
            } else {
                asteroids.push({
                    x: Math.random() * (canvas.width - 20), y: -20,
                    width: 25 + Math.random() * 10, height: 25 + Math.random() * 10,
                    speed: Math.random() * 4 + 3 + elapsedTime * 0.08
                });
            }
        }
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i];
            asteroid.y += asteroid.speed;
            const collisionPadding = player.width * 0.15;
            if (player.x + collisionPadding < asteroid.x + asteroid.width - collisionPadding &&
                player.x + player.width - collisionPadding > asteroid.x + collisionPadding &&
                player.y + collisionPadding < asteroid.y + asteroid.height - collisionPadding &&
                player.y + player.height - collisionPadding > asteroid.y + collisionPadding)
            {
                gameOver = true;
                stopAsteroidGame();
                showModal("충돌! 다시 시도하시겠습니까?", {
                    showStart: true, startText: '재시도', onStart: initAsteroidGame,
                    showSkip: true, skipText: '넘어가기', onSkip: () => {
                         showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                             showStart: true, startText: '확인하기', onStart: showPoem,
                             showSkip: true, skipText: '넘어가기', onSkip: showClearConfirmationPopup,
                             hideClose: false,
                             onClose: showClearConfirmationPopup
                         });
                    },
                    hideClose: true
                });
                return;
            }
            if (asteroid.y > canvas.height) {
                asteroids.splice(i, 1);
            }
        }
    }
    function drawPlayer() {
        if (playerImageLoaded) {
             ctx.drawImage(playerShipImage, player.x, player.y, player.width, player.height);
        } else {
             ctx.fillStyle = '#4facfe';
             ctx.shadowColor = '#00f2fe';
             ctx.shadowBlur = 10;
             ctx.fillRect(player.x, player.y, player.width, player.height);
             ctx.shadowBlur = 0;
        }
    }
    function drawAsteroids() {
        if (totalAsteroidImages > 0 && allAsteroidImagesLoaded) {
            asteroids.forEach(asteroid => {
                ctx.drawImage(asteroid.image, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
            });
        } else {
            ctx.fillStyle = '#feca57';
            asteroids.forEach(asteroid => {
                ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
            });
        }
    }
    function drawAsteroidGame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    // ... (Shake keyframes) ...
    $('head').append(`<style> @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } } </style>`);


    // --- 커스텀 팝업 모달 기능 ---
    function showModal(message, buttons = {}) {
        $modalText.html(message);
        $modalButtonContainer.empty();

        if (buttons.hideClose) {
            $modalCloseBtn.hide();
             $modal.off('click');
        } else {
            $modalCloseBtn.show();
            $modalCloseBtn.off().on('click', function() {
                hideModal();
                if (buttons.onClose) buttons.onClose();
            });
            $modal.off('click').on('click', function(event) {
                if ($(event.target).is($modal)) {
                    hideModal();
                    if (buttons.onClose) buttons.onClose();
                }
            });
        }

        if (buttons.showStart) {
            const btnText = buttons.startText || '게임 시작';
            const $startButton = $(`<button class="modal-action-btn modal-start-btn">${btnText}</button>`);
            $modalButtonContainer.append($startButton);
            $startButton.on('click', function() {
                hideModal();
                if(buttons.onStart) buttons.onStart();
                else startCountdown();
            });
        }
        
        // [수정] '다음 챕터' 버튼이 유연하게 작동하도록 수정
        if (buttons.showNext) {
            const nextChapter = buttons.nextChapterNum || 2; // 기본값 2, 챕터 2 클리어 시 3이 됨
            const $nextButton = $(`<button class="modal-action-btn modal-next-btn">다음 챕터로</button>`);
            $modalButtonContainer.append($nextButton);
            $nextButton.on('click', function() {
                hideModal();
                transitionToChapter(nextChapter); // 동적 챕터로 이동
            });
        }

        if (buttons.showMap) {
            const $mapButton = $('<button class="modal-action-btn modal-map-btn">지도 보기</button>');
            $modalButtonContainer.append($mapButton);
            $mapButton.on('click', function() {
                hideModal();
                goToMap();
            });
        }

        if (buttons.showSkip) {
            const skipBtnText = buttons.skipText || '넘어가기';
            const $skipButton = $(`<button class="modal-action-btn modal-skip-btn">${skipBtnText}</button>`);
            $modalButtonContainer.append($skipButton);
            $skipButton.on('click', function() {
                hideModal();
                 if(buttons.onSkip) buttons.onSkip();
            });
        }

        $modal.css('display', 'flex').hide().fadeIn(300);
    }

    function hideModal() {
        $modal.fadeOut(300);
    }

    // --- 시 모달 기능 (챕터 1) ---
    function showPoem() {
        $poemModal.css('display', 'flex').hide().fadeIn(300);
        $poemCloseBtn.on('click', function() {
            hidePoem(); 
            showClearConfirmationPopup();
        });
    }
    function hidePoem() {
        $poemModal.fadeOut(300);
    }
    $poemModal.on('click', function(event) {
        if ($(event.target).is($poemModal)) {
             // (외부 클릭 방지)
        }
    });

    // --- [신규] 기억 조각 모달 기능 (챕터 2) ---
    function showFragmentModal(title, content) {
        $fragmentTitle.text(title);
        $fragmentText.html(content.replace(/\n/g, '<br>')); // 줄바꿈(\n)을 <br>로 변환
        $fragmentModal.css('display', 'flex').hide().fadeIn(300);
    }
    function hideFragmentModal() {
        $fragmentModal.fadeOut(300);
    }
    // (닫기 버튼 이벤트는 정답 확인 로직에서 동적으로 바인딩)


    // --- 챕터 2: 십자말풀이 로직 ---

    let currentPuzzleId = null; // 현재 풀고 있는 퍼즐 ID 저장
    // [신규] 챕터 2 퍼즐 클리어 상태
    let puzzleCompletionStatus = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };

    // [샘플 데이터] 퀴즈 데이터 저장소
    const puzzleDataStore = {
        // --- 1번 퍼즐 (샘플) ---
        1: {
            title: "첫 번째 걸음",
            reward: `기억 조각 #1
            
"그의 첫 무대는 OO이었다."
이것은 3x3 샘플 텍스트입니다.
나중에 이 곳에 실제 가사나
명대사를 넣어주세요.`,
            gridSize: 3, // 3x3 그리드
            grid: [ [0, 1, 1], [0, 1, 0], [1, 1, 0] ],
            answers: [ [null, '배', '우'], [null, '무', null], ['데', '뷔', null] ],
            labels: [ [0, 1, 0], [0, 2, 0], [3, 0, 0] ],
            clues: {
                across: [ { num: 1, clue: "주인공을 연기하는 사람" } ],
                down: [ { num: 2, clue: "연극을 하는 장소" }, { num: 3, clue: "첫 공식 활동" } ]
            }
        },
        // --- [신규] 2번 퍼즐 (샘플) ---
        2: { 
            title: "두 번째 무대", 
            reward: `기억 조각 #2
            
이것은 4x4 샘플입니다.
이곳에 가사를 넣어주세요.
...`,
            gridSize: 4, // 4x4 그리드
            grid: [ 
                [1, 1, 1, 0], 
                [0, 0, 1, 0], 
                [0, 0, 1, 0], 
                [0, 0, 1, 0] 
            ],
            answers: [ 
                ['연', '극', '장', null], 
                [null, null, '배', null], 
                [null, null, '우', null], 
                [null, null, '님', null] 
            ],
            labels: [ [1, 0, 2, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0] ],
            clues: {
                across: [ { num: 1, clue: "연극을 하는 곳" } ],
                down: [ { num: 2, clue: "연기하는 사람 (존칭)" } ]
            }
        },
        // --- 3~6번 (개발 중) ---
        3: { title: "기억 조각 #3 (개발 중)", reward: "...", gridSize: 0, grid: [], answers: [], labels: [], clues: { across: [], down: [] } },
        4: { title: "기억 조각 #4 (개발 중)", reward: "...", gridSize: 0, grid: [], answers: [], labels: [], clues: { across: [], down: [] } },
        5: { title: "기억 조각 #5 (개발 중)", reward: "...", gridSize: 0, grid: [], answers: [], labels: [], clues: { across: [], down: [] } },
        6: { title: "기억 조각 #6 (개발 중)", reward: "...", gridSize: 0, grid: [], answers: [], labels: [], clues: { across: [], down: [] } }
    };

    // 6개 카테고리 아이콘 클릭 시
    $puzzleCategories.on('click', function() {
        const puzzleId = $(this).data('puzzle-id');
        currentPuzzleId = puzzleId; // 현재 퍼즐 ID 저장
        showCrosswordPuzzle(puzzleId);
    });

    // 십자말풀이 게임 표시 함수
    function showCrosswordPuzzle(id) {
        const puzzleData = puzzleDataStore[id];

        if (puzzleData.gridSize === 0) {
            showModal(`'${puzzleData.title}'은<br>아직 개발 중입니다.`);
            currentPuzzleId = null;
            return;
        }

        $puzzleHub.fadeOut(300, function() {
            $crosswordTitle.text(puzzleData.title);
            $crosswordGrid.empty();
            $crosswordCluesAcross.empty();
            $crosswordCluesDown.empty();
            $crosswordGrid.css('--grid-size', puzzleData.gridSize);

            for (let r = 0; r < puzzleData.gridSize; r++) {
                for (let c = 0; c < puzzleData.gridSize; c++) {
                    if (puzzleData.grid[r][c] === 1) {
                        const labelNum = puzzleData.labels[r][c];
                        const answer = puzzleData.answers[r][c];
                        let cellHtml = '<div class="cell">';
                        if (labelNum > 0) {
                            cellHtml += `<span class="cell-label">${labelNum}</span>`;
                        }
                        cellHtml += `<input class="cell-input" type="text" maxlength="1" data-row="${r}" data-col="${c}" data-answer="${answer}">`;
                        cellHtml += '</div>';
                        $crosswordGrid.append(cellHtml);
                    } else {
                        $crosswordGrid.append('<div class="cell empty"></div>');
                    }
                }
            }

            puzzleData.clues.across.forEach(clue => {
                $crosswordCluesAcross.append(`<li><b>${clue.num}</b>. ${clue.clue}</li>`);
            });
            puzzleData.clues.down.forEach(clue => {
                $crosswordCluesDown.append(`<li><b>${clue.num}</b>. ${clue.clue}</li>`);
            });

            $crosswordGameContainer.css('display', 'flex').hide().fadeIn(300);
        });
    }

    // [버그 수정] 한글 입력 오류 해결 (keyup -> input)
    $crosswordGrid.on('input', '.cell-input', function(e) {
        const $this = $(this);
        
        // 입력된 값이 1글자이고, 공백이 아닐 경우
        if ($this.val().length === 1 && $this.val().trim() !== '') {
            
            // (이후 로직은 방향키 등 고려하여 더 복잡하게 수정 가능)
            
            // 일단은 다음 input으로 이동
            const $next = $this.parent().next().find('.cell-input');
            if ($next.length) {
                $next.focus();
            } else {
                // 줄바꿈 (다음 줄 첫 번째 input)
                const $nextRow = $this.parent().parent().find('.cell-input').filter((i, el) => {
                     return $(el).data('row') > $this.data('row');
                }).first();
                if ($nextRow.length) {
                    $nextRow.focus();
                } else {
                     $(this).blur();
                }
            }
        }
    });

    // [기능 수정] 정답 확인 버튼 (새로운 팝업 플로우)
    $crosswordCheckBtn.on('click', function() {
        if (!currentPuzzleId) return;
        
        const puzzleData = puzzleDataStore[currentPuzzleId];
        let isAllCorrect = true;

        $crosswordGrid.find('.cell-input').each(function() {
            const $input = $(this);
            const userAnswer = $input.val().trim();
            const correctAnswer = $input.data('answer');
            if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                $input.css('color', '#008000'); // 정답 (녹색)
            } else {
                $input.css('color', '#ff0000'); // 오답 (빨간색)
                isAllCorrect = false;
            }
        });

        if (isAllCorrect) {
            // --- 1. 정답 플로우 ---
            puzzleCompletionStatus[currentPuzzleId] = true; // 클리어 상태 저장

            // 1-1. "기억 조각 발견" 팝업 (내용)
            showFragmentModal(puzzleData.title, puzzleData.reward);
            
            // 1-2. 내용 팝업의 닫기 버튼/외부 클릭 이벤트 바인딩
            const fragmentModalClickHandler = function(event) {
                // 닫기 버튼 또는 모달 배경 클릭 시
                if (!$(event.target).is($fragmentModal) && !$(event.target).is($fragmentCloseBtn)) {
                    return; // 모달 컨텐츠 클릭은 무시
                }
                
                hideFragmentModal(); // 내용 팝업 닫기
                $fragmentModal.off('click', fragmentModalClickHandler); // 이벤트 리스너 제거
                
                // 1-3. "클리어" 팝업
                // 모든 퍼즐을 클리어했는지 확인
                const allPuzzlesComplete = Object.values(puzzleCompletionStatus).every(status => status === true);

                let clearMessage = `'${puzzleData.title}' 탐색 완료!`;
                let clearPopupButtons = {
                    showSkip: true, skipText: '목록으로', onSkip: showPuzzleHub, // [수정] '허브로' -> '목록으로'
                    showMap: true,
                    hideClose: false,
                    onClose: showPuzzleHub
                };

                if (allPuzzlesComplete) {
                    // 6개 모두 클리어 (현재 2개만 샘플이라 false)
                    clearMessage = "챕터 2 '탐색' 클리어!<br>모든 기억 조각을 찾았습니다.";
                    clearPopupButtons = {
                        showNext: true, nextChapterNum: 3, // 다음 챕터 (3) 버튼
                        showMap: true,
                        hideClose: false,
                        onClose: goToMap // X 누르면 지도로
                    };
                }
                showModal(clearMessage, clearPopupButtons);
            };
            
            $fragmentModal.off('click').on('click', fragmentModalClickHandler);
            
        } else {
            // --- 2. 오답 플로우 ---
            showModal("오답!<br>붉은색 칸을 다시 확인해주세요.", {
                showStart: true, startText: '다시 풀기', onStart: () => {
                     $crosswordGrid.find('.cell-input').css('color', '#000');
                },
                hideClose: false
            });
        }
    });

    // 십자말풀이 게임 숨기고 허브 표시 함수
    function showPuzzleHub() {
        $crosswordGameContainer.fadeOut(300, function() {
            $puzzleHub.fadeIn(300);
            currentPuzzleId = null; // 현재 퍼즐 ID 리셋
        });
    }
    
    // 십자말풀이 '뒤로 가기' (목록으로) 버튼
    $crosswordBackBtn.on('click', showPuzzleHub);
    
    // 챕터 2 허브에서 지도로 가기 버튼
    $ch2GoMapBtn.on('click', goToMap);

});