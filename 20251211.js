// 호출할 함수들을 전역 변수로 미리 선언
let showModal, hideModal, showFragmentModal, hideFragmentModal, transitionToChapter, goToMap, showPoem, showClearConfirmationPopup, stopAsteroidGame, initChapter3Game, stopChapter3Game, initChapter4Game, stopChapter4Game, initChapter5Game, stopChapter5Game;

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
    const $storyOverlay = $('#story-overlay');
    const $storyTextContainer = $('#story-text-container');
    const $storyCursor = $('.story-cursor');
    const $galaxyMap = $('.galaxy-map-container');
    const $chapter1 = $('#chapter1-container');
    const $chapter2 = $('#chapter2-container');
    const $chapter3 = $('#chapter3-container');
    const $chapter4 = $('#chapter4-container');
    const $chapter5 = $('#chapter5-container');
    const $chapterTransition = $('#chapter-transition');
    const $transitionTitle = $('#transition-title');
    const $transitionImage = $('#transition-image');
    const $passwordInput = $('#password-input');
    const $enterButton = $('#enter-button');
    const $statusMessage = $('#status-message');
    const $exploreBtn = $('#explore-btn');
    const $planets = $('.planet');
    const $modal = $('#custom-modal');
    const $modalText = $('#modal-text');
    const $modalButtonContainer = $('#modal-button-container');
    const $poemModal = $('#poem-modal');
    const $poemCloseBtn = $('.poem-close-btn');
    const $fragmentModal = $('#fragment-modal');
    const $fragmentTitle = $('#fragment-title');
    const $fragmentText = $('#fragment-text');
    const $fragmentCloseBtn = $('.fragment-close-btn');
    const $selectFragmentModal = $('#select-fragment-modal');
    const $selectFragmentList = $('#select-fragment-list');
    const $selectedFragmentText = $('#selected-fragment-text');
    const $selectFragmentCloseBtn = $('.select-fragment-close-btn');
    const $storyIntro = $('#story-intro');
    const $startGameBtn = $('#start-game-btn');
    const $skipGameBtn = $('#skip-game-btn');
    const $asteroidGame = $('#asteroid-game');
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const $gameCountdown = $('#game-countdown');
    const $gameTimer = $('#game-timer');
    const $exitPortal = $('#exit-portal');
    const $puzzleHub = $('.puzzle-hub');
    const $puzzleCategories = $('.puzzle-category');
    const $crosswordGameContainer = $('#crossword-game-container');
    const $crosswordGrid = $('#crossword-grid');
    const $crosswordCluesAcross = $('#clues-across');
    const $crosswordCluesDown = $('#clues-down');
    const $crosswordTitle = $('#crossword-title');
    const $crosswordCheckBtn = $('#crossword-check-btn');
    const $crosswordBackBtn = $('#crossword-back-btn');
    const $ch2SkipBtn = $('#ch2-skip-btn');
    const $mapArea = $('.map-area');

    let currentChapterNum = 1;
    
    // --- 오프닝 화면 기능 ---
    const correctPassword = "1211";
    function boardSpaceship() {
        const inputValue = $passwordInput.val();
        if (inputValue === correctPassword) {
            $statusMessage.css('color', '#55efc4').text('SYSTEM :: 승인 코드 확인. 곧 이륙합니다...');
            $cockpit.css('animation', 'takeoff 1.5s forwards');
            setTimeout(function() {
                $cockpit.hide();
                showStoryOverlay();
            }, 1500);
        } else {
            $statusMessage.html('<span style="color: #ff4757;">ERROR :: 승인 코드가 일치하지 않습니다.</span>');
            $passwordInput.val("").focus();
        }
    }
    $('head').append(`<style> @keyframes takeoff { 0% { transform: scale(1) rotate(0deg); opacity: 1; } 20% { transform: scale(1.05) rotate(1deg); } 40% { transform: scale(1.05) rotate(-1deg); } 100% { transform: scale(5); opacity: 0; } } </style>`);
    $enterButton.on('click', boardSpaceship);
    $passwordInput.on('keyup', function(event) { if (event.key === 'Enter') { boardSpaceship(); } });

    // --- 스토리 오버레이 로직 ---
    function showStoryOverlay() { // function (지역 함수)
        const storyLines = ["안녕하세요.", "우주선 탑승을 환영합니다.", "이제부터 10년의 시간을 거슬러 올라가,", "흩어진 기억의 조각들을 모으는 탐사를 시작합니다.", "모든 조각을 찾아 최종 목적지 '우주'에 도달하는 것이 우리의 임무입니다.", "준비되셨다면, 화면을 터치하여", "항해를 시작해주십시오."];
        let lineIndex = 0, charIndex = 0, typingTimeout, isTyping = true, typingFinished = false;
        $storyTextContainer.empty(); 
        $storyCursor.hide().css('opacity', '0').removeClass('blinking'); 
        $storyOverlay.css('display', 'flex').animate({opacity: 1}, 1000);
        
        function typeWriter() { 
        	if (lineIndex < storyLines.length && isTyping) {
        		const currentLine = storyLines[lineIndex]; 
        		
        		if (charIndex === 0) $storyTextContainer.append('<p></p>');
        		
        		if (charIndex < currentLine.length) { 
        			$storyTextContainer.find('p').last().append(currentLine.charAt(charIndex)); 
        			charIndex++; 
        			typingTimeout = setTimeout(typeWriter, 40); 
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
        	} else finishTyping();
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
                	$storyCursor.css({'display': 'none', 'opacity': '0'}).removeClass('blinking'); 
        		});
        	}); 
        }
        
        $storyOverlay.off('click').on('click', function() { 
        	if (isTyping) { isTyping = false; typeWriter(); } 
        }); 
        
        typeWriter();
    }

    // --- 챕터 전환 및 시작 로직 ---
    function showChapter(chapterNum, chapterTitle, planetImgSrc) { // [유지] function (지역 함수)
    	currentChapterNum = chapterNum;
        $galaxyMap.fadeOut(500);
        
        // 1. 챕터 제목을 0.5초 동안 띄웁니다.
        $transitionTitle.text(chapterTitle); 
        $transitionImage.attr('src', planetImgSrc).css('color', $(`#planet${chapterNum} img`).css('color')); 
        $chapterTransition.css('display', 'flex').animate({opacity: 1}, 500, function() {
            
            // 2. 챕터 제목이 '다 뜬 직후' (0.5초 뒤)에 검은 화면 대기 없이 '바로' 다음 로직을 실행합니다.
            
            // 2a. 챕터 컨테이너를 미리 찾고 게임 로직 초기화
            const $targetChapter = $(`#chapter${chapterNum}-container`);
            if (chapterNum === 1) { $storyIntro.hide(); $asteroidGame.hide(); $exitPortal.hide(); }
            if (chapterNum === 2) { $puzzleHub.show(); $crosswordGameContainer.hide(); updatePuzzleHubUI(); }
            if (chapterNum === 3) { initChapter3Game();}
            if (chapterNum === 4) { 
                $('#ch4-story-intro').hide();
                initChapter4Game(); 
            }
            if (chapterNum === 5) { initChapter5Game(); }

            // 2b. 새 챕터가 1초에 걸쳐 '서서히' 나타나게 합니다. (Cross-fade In)
            $targetChapter.css('display', 'flex').animate({opacity: 1}, 1000, function() {
                 // 챕터 화면이 완전히 나타난 '후에' 인트로 팝업을 띄움
                 if (chapterNum === 1) { 
                     $storyIntro.fadeIn(500); 
                     $startGameBtn.off().on('click', startCountdown); 
                     $skipGameBtn.off().on('click', function(){ 
                         showModal("기억 조각 발견!<br>확인하시겠습니까?", { 
                             showStart: true, startText: '확인하기', onStart: showPoem, 
                             showSkip: true, skipText: '넘어가기', onSkip: showClearConfirmationPopup, 
                             hideClose: false, onClose: hideModal 
                         }); 
                     }); 
                 } else if (chapterNum === 4) {
                     $('#ch4-story-intro').fadeIn(500);
                 }
            });
            
            // 2c. '동시에' 챕터 제목이 0.5초에 걸쳐 '서서히' 사라지게 합니다. (Cross-fade Out)
            $chapterTransition.animate({opacity: 0}, 500, function() { $(this).hide(); });

        });
    }

    // --- 항해 지도로 돌아가는 함수 ---
    goToMap = function() {
        stopAsteroidGame();
        stopChapter3Game();
        stopChapter4Game();
        stopChapter5Game();
        
        $('.chapter-container').fadeOut(500);
        $poemModal.fadeOut(300);
        $fragmentModal.fadeOut(300);
        $selectFragmentModal.fadeOut(300);
        
        const $targetPlanet = $(`#planet${currentChapterNum}`);
        
        // 2. 맵을 먼저 화면에 띄우고(fadeIn)
        $galaxyMap.fadeIn(1000, function() {
            // 3. 맵이 나타난 '후에' 스크롤 위치를 계산하고 애니메이션 실행
            if ($targetPlanet.length > 0 && $mapArea.length > 0) {
                const planetOffsetLeft = $targetPlanet.closest('.planet-orbit').position().left;
                const planetWidth = $targetPlanet.closest('.planet-orbit').outerWidth();
                const mapAreaWidth = $mapArea.width();
                const targetScrollLeft = planetOffsetLeft - (mapAreaWidth / 2) + (planetWidth / 2);
                
                // 맵이 다 보인 후에 스크롤 시작
                $mapArea.animate({ scrollLeft: targetScrollLeft }, 500); 
            }
        });
    }

    // --- 특정 챕터로 바로 전환하는 함수 ---
    transitionToChapter = function(chapterNum) {
        stopAsteroidGame();
        stopChapter3Game();
        stopChapter4Game();
        $('.chapter-container').fadeOut(500);
        $poemModal.fadeOut(300);
        $fragmentModal.fadeOut(300);
        $selectFragmentModal.fadeOut(300);

        if (chapterNum > 5) { showModal("모든 챕터를 클리어했습니다!"); goToMap(); return; }
        const $nextPlanet = $(`#planet${chapterNum}`); if ($nextPlanet.length > 0) { showChapter(chapterNum, $nextPlanet.data('title'), $nextPlanet.find('img').attr('src')); } else { showModal("오류: 다음 챕터를 찾을 수 없습니다."); goToMap(); }
    }

    // --- 클리어 확인 팝업 함수 (챕터 1) ---
    showClearConfirmationPopup = function() {
        $exitPortal.hide();
        showModal("챕터 1 '이륙' 클리어!<br>다음 여정을 준비하세요.", {
            showNext: true,
            showMap: true,
            hideClose: false,
            onClose: hideModal
        });
    }


    // --- 항해 지도 버튼 ---
    $exploreBtn.on('click', function() { const $firstPlanet = $('#planet1'); showChapter($firstPlanet.data('chapter'), $firstPlanet.data('title'), $firstPlanet.find('img').attr('src')); });
    $planets.on('click', function() { 
        const chapterNum = $(this).data('chapter'); 
        if (chapterNum === 1 || chapterNum === 2 || chapterNum === 3 || chapterNum === 4 || chapterNum === 5) { 
            showChapter(chapterNum, $(this).data('title'), $(this).find('img').attr('src')); 
        } else { 
            showModal(`Chapter ${chapterNum}은 아직 개발 중입니다.`); 
        } 
    });

    // --- 챕터 1: 게임 시작 카운트다운 ---
    function startCountdown() { $storyIntro.hide(); $asteroidGame.fadeIn(500, function() { $gameCountdown.text('3').show().css('opacity', 1); let count = 2; let countdownTimeout; function doCountdown() { clearTimeout(countdownTimeout); if (count >= 1) { $gameCountdown.text(count); count--; countdownTimeout = setTimeout(doCountdown, 1000); } else if (count === 0){ $gameCountdown.text('START!'); setTimeout(function() { $gameCountdown.fadeOut(500, function() { $(this).text(''); initAsteroidGame(); }); }, 500); } } countdownTimeout = setTimeout(doCountdown, 1000); }); }

    // --- 챕터 1: 별똥별 피하기 게임 로직 ---
    let player, asteroids, score, gameOver, animationFrameId, startTime, elapsedTime;
    const keys = {}; const GOAL_TIME = 15; let touchLeft = false; let touchRight = false;
    const playerShipImage = new Image(); playerShipImage.src = 'https://lh3.googleusercontent.com/d/1YGU4_zTLVyxGukLOLIaw1vgU03lmIoUt'; let playerImageLoaded = false; playerShipImage.onload = () => { playerImageLoaded = true; };
    const asteroidImages = []; const asteroidImageUrls = [ 'https://lh3.googleusercontent.com/d/1pnDZFfBczAJKGdcjDj9VLQVs_6uWK8HF', 'https://lh3.googleusercontent.com/d/1jeWf4rvz31POee3PRhbXvKoCBSx26ICD', 'https://lh3.googleusercontent.com/d/1q3t8hjSssd9qXD8z_RKKRIH17EMsnWZD', 'https://lh3.googleusercontent.com/d/11fwRvd-E0xb48Sr4YB0GiOKnzs3j_vF6' ]; let asteroidImagesLoadedCount = 0; const totalAsteroidImages = asteroidImageUrls.length; let allAsteroidImagesLoaded = false; asteroidImageUrls.forEach(url => { const img = new Image(); img.src = url; img.onload = () => { asteroidImagesLoadedCount++; if (asteroidImagesLoadedCount === totalAsteroidImages) { allAsteroidImagesLoaded = true; } }; asteroidImages.push(img); });
    
    function initAsteroidGame() {
        canvas.width = $asteroidGame.width(); canvas.height = $asteroidGame.height();
        player = { x: canvas.width / 2 - 25, y: canvas.height - 70, width: 50, height: 50, speed: 3.5, dx: 0, dy: 0 };
        asteroids = []; score = 0; gameOver = false; startTime = performance.now(); elapsedTime = 0;
        $gameTimer.text(`남은 시간: ${GOAL_TIME}초`).show(); $exitPortal.hide();
        for (let key in keys) { keys[key] = false; } touchLeft = false; touchRight = false;
        $(window).off('.asteroidGame').on('keydown.asteroidGame', function(e) { keys[e.key.toLowerCase()] = true; });
        $(window).on('keyup.asteroidGame', function(e) { keys[e.key.toLowerCase()] = false; });
        $(canvas).off('.asteroidTouch').on('touchstart.asteroidTouch touchmove.asteroidTouch', function(e) { e.preventDefault(); touchLeft = false; touchRight = false; const touches = e.touches || e.originalEvent.touches; const canvasRect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touchX = touches[i].clientX - canvasRect.left; if (touchX < canvas.width / 2) { touchLeft = true; } else { touchRight = true; } } }).on('touchend.asteroidTouch touchcancel.asteroidTouch', function(e) { e.preventDefault(); const touches = e.changedTouches || e.originalEvent.changedTouches; const canvasRect = canvas.getBoundingClientRect(); for (let i = 0; i < touches.length; i++) { const touchX = touches[i].clientX - canvasRect.left; if (touchX < canvas.width / 2) { touchLeft = false; } else { touchRight = false; } } if (!e.touches || e.touches.length === 0) { touchLeft = false; touchRight = false; } });
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); }
        asteroidGameLoop();
    }
    
    // 전역 변수에 할당
    stopAsteroidGame = function() {
        if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
        gameOver = true;
        $(window).off('.asteroidGame'); $(canvas).off('.asteroidTouch');
    }
    
    function updateAsteroidGame() {
        if (gameOver) return;
        const currentTime = performance.now(); elapsedTime = (currentTime - startTime) / 1000; const remainingTime = Math.max(0, GOAL_TIME - Math.floor(elapsedTime)); $gameTimer.text(`남은 시간: ${remainingTime}초`);
        
        if (elapsedTime >= GOAL_TIME) {
            gameOver = true; stopAsteroidGame(); ctx.clearRect(0, 0, canvas.width, canvas.height); drawPlayer(); $exitPortal.fadeIn(500);
            $exitPortal.off().on('click', function() {
                showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                    showStart: true, startText: '확인하기', onStart: showPoem,
                    showSkip: true, skipText: '넘어가기', onSkip: showClearConfirmationPopup,
                    hideClose: false,
                    onClose: hideModal
                 });
             });
            return;
        }
        
        let moveX = 0, moveY = 0; if (keys['arrowleft']) moveX = -1; if (keys['arrowright']) moveX = 1; if (keys['arrowup']) moveY = -1; if (keys['arrowdown']) moveY = 1; if (touchLeft) moveX = -1; if (touchRight) moveX = 1; const length = Math.hypot(moveX, moveY); if (length > 0) { player.dx = (moveX / length) * player.speed; player.dy = (moveY / length) * player.speed; } else { player.dx = 0; player.dy = 0; } player.x += player.dx; player.y += player.dy;
        if (player.x < (-player.width / 2)) player.x = (-player.width / 2); if (player.y < 0) player.y = 0; if (player.x > canvas.width - (player.width / 2)) player.x = canvas.width - (player.width / 2); if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
        
        if (asteroids.length < 15 && Math.random() < 0.06 + elapsedTime * 0.005) {
            if (totalAsteroidImages > 0 && allAsteroidImagesLoaded) {
                const randomImageIndex = Math.floor(Math.random() * totalAsteroidImages); const randomImage = asteroidImages[randomImageIndex]; let randomWidth, randomHeight; if (randomImage.naturalWidth > 0 && randomImage.naturalHeight > 0) { const baseSize = 35 + Math.random() * 20; const aspectRatio = randomImage.naturalWidth / randomImage.naturalHeight; if(aspectRatio > 1) { randomWidth = baseSize; randomHeight = baseSize / aspectRatio; } else { randomHeight = baseSize; randomWidth = baseSize * aspectRatio; } } else { randomWidth = 30 + Math.random() * 15; randomHeight = 30 + Math.random() * 15; } asteroids.push({ x: Math.random() * (canvas.width - randomWidth), y: -randomHeight, width: randomWidth, height: randomHeight, speed: Math.random() * 4 + 3 + elapsedTime * 0.08, image: randomImage });
            } else {
                asteroids.push({ x: Math.random() * (canvas.width - 20), y: -20, width: 25 + Math.random() * 10, height: 25 + Math.random() * 10, speed: Math.random() * 4 + 3 + elapsedTime * 0.08 });
            }
        }
        
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const asteroid = asteroids[i]; asteroid.y += asteroid.speed;
            const collisionPadding = player.width * 0.25;
            if (player.x + collisionPadding < asteroid.x + asteroid.width - collisionPadding && player.x + player.width - collisionPadding > asteroid.x + collisionPadding && player.y + collisionPadding < asteroid.y + asteroid.height - collisionPadding && player.y + player.height - collisionPadding > asteroid.y + collisionPadding) {
                gameOver = true; stopAsteroidGame();
                showModal("충돌! 다시 시도하시겠습니까?", {
                    showStart: true, startText: '재시도', onStart: initAsteroidGame,
                    showSkip: true, skipText: '넘어가기', onSkip: () => {
                        showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                            showStart: true, startText: '확인하기', onStart: showPoem,
                            showSkip: true, skipText: '넘어가기', onSkip: showClearConfirmationPopup,
                            hideClose: false,
                            onClose: hideModal
                        });
                    },
                    hideClose: true
                });
                return;
            }
            if (asteroid.y > canvas.height) { asteroids.splice(i, 1); }
        }
    }
    
    function drawPlayer() { if (playerImageLoaded) { ctx.drawImage(playerShipImage, player.x, player.y, player.width, player.height); } else { ctx.fillStyle = '#4facfe'; ctx.shadowColor = '#00f2fe'; ctx.shadowBlur = 10; ctx.fillRect(player.x, player.y, player.width, player.height); ctx.shadowBlur = 0; } }
    function drawAsteroids() { if (totalAsteroidImages > 0 && allAsteroidImagesLoaded) { asteroids.forEach(asteroid => { ctx.drawImage(asteroid.image, asteroid.x, asteroid.y, asteroid.width, asteroid.height); }); } else { ctx.fillStyle = '#feca57'; asteroids.forEach(asteroid => { ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height); }); } }
    function drawAsteroidGame() { ctx.clearRect(0, 0, canvas.width, canvas.height); drawPlayer(); drawAsteroids(); }
    function asteroidGameLoop() { if (!gameOver) { updateAsteroidGame(); drawAsteroidGame(); animationFrameId = requestAnimationFrame(asteroidGameLoop); } }
    $('head').append(`<style> @keyframes shake { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } } </style>`);


    // --- 공통 모달 기능 (전역 변수에 할당) ---
    showModal = function(message, buttons = {}) {
        $modalText.html(message);
        $modalButtonContainer.empty();
        const defaultOnClose = buttons.onClose !== undefined ? buttons.onClose : hideModal;
        
        // 모든 이전 모달 닫기 핸들러를 강제로 제거합니다.
        $modal.off('click');
        
        if (buttons.hideClose) {
            //$modal.off('click');
        } else {
            $modal.off('click').on('click', function(event) {
                if ($(event.target).is($modal)) {
                     if(defaultOnClose) defaultOnClose();
                     else hideModal();
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
        if (buttons.showNext) { 
        	const nextChapter = buttons.nextChapterNum || 2; 
        	let $nextButton;
        	if(buttons.nextChapterNum == 5) $nextButton = $(`<button class="modal-action-btn modal-next-btn">우주로</button>`);
        	else $nextButton = $(`<button class="modal-action-btn modal-next-btn">다음 챕터로</button>`); 
        	$modalButtonContainer.append($nextButton); 
        	$nextButton.on('click', function() { 
        		hideModal(); 
        		transitionToChapter(nextChapter); 
        	}); 
        }
        if (buttons.showMap) { 
        	const $mapButton = $(`<button class="modal-action-btn modal-map-btn">지도 보기</button>`); 
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
        if (buttons.showSkipThemed) {
            const skipBtnText = buttons.skipText || '더 탐색하기';
            const puzzleId = buttons.puzzleId || 1; 
            const colorVarName = categoryColorVars[puzzleId] || '--category-color-1';
            const $skipButton = $(`<button class="modal-action-btn modal-themed-btn">${skipBtnText}</button>`);
            $skipButton.css('--btn-theme-color', `var(${colorVarName})`); 
            
            $modalButtonContainer.append($skipButton);
            $skipButton.on('click', function() { hideModal(); if(buttons.onSkip) buttons.onSkip(); });
        }
        if (buttons.showSkip2) { const skipBtnText2 = buttons.skipText2 || '넘어가기2'; const $skipButton2 = $(`<button class="modal-action-btn modal-skip-btn">${skipBtnText2}</button>`); $modalButtonContainer.append($skipButton2); $skipButton2.on('click', function() { hideModal(); if(buttons.onSkip2) buttons.onSkip2(); }); }
        
        $modal.css('display', 'flex').hide().fadeIn(300);
    }
    
    // 전역 변수에 할당
    hideModal = function() { $modal.fadeOut(300); }

    // 시 모달 기능 (전역 변수에 할당)
    showPoem = function() {
        $poemModal.css('display', 'flex').hide().fadeIn(300);
        $poemCloseBtn.off().on('click', function() {
            hidePoem();
            showClearConfirmationPopup();
        });
        $poemModal.off('click').on('click', function(event) {
             if ($(event.target).is($poemModal)) { /* no action */ }
        });
    }
    function hidePoem() { $poemModal.fadeOut(300); }

    // --- 챕터 2 모달 함수 ---
    showFragmentModal = function(title, content, onCloseCallback) {
        $fragmentTitle.text(title); $fragmentText.html(content.replace(/\n/g, '<br>')); $fragmentModal.css('display', 'flex').hide().fadeIn(300);
        $fragmentCloseBtn.off().on('click', function() { hideFragmentModal(); if (onCloseCallback) onCloseCallback(); });
        $fragmentModal.off('click').on('click', function(event) { if ($(event.target).is($fragmentModal)) { hideFragmentModal(); if (onCloseCallback) onCloseCallback(); } });
    }
    
    // 역 변수에 할당
    hideFragmentModal = function() { $fragmentModal.fadeOut(300); }

    // (내부 호출용)
    function showSelectFragmentPopup() {
        $selectFragmentList.empty(); $selectedFragmentText.empty().hide();
        for (let i = 1; i <= 6; i++) {
            const puzzleData = puzzleDataStore[i];
            if (puzzleData.title.endsWith('(개발 중)')) continue;
            const $button = $(`<button class="modal-action-btn">${puzzleData.title}</button>`);
             $button.css('border-color', `var(${categoryColorVars[i]})`); $button.css('color', `var(${categoryColorVars[i]})`);
            $button.on('click', function() {
                $selectedFragmentText.html(puzzleData.reward.replace(/\n/g, '<br>')).fadeIn(200);
                $selectedFragmentText.scrollTop(0);
                $selectFragmentList.find('button').css({'opacity': '1', 'background-color': 'transparent'});
                $(this).css({'opacity': '1', 'background-color': 'rgba(255, 255, 255, 0.1)'});
                 $selectedFragmentText.parent().css('border-color', `var(${categoryColorVars[i]})`);
                 $selectedFragmentText.parent().find('h3').css('color', `var(${categoryColorVars[i]})`);
                 $selectFragmentCloseBtn.css('color', `var(${categoryColorVars[i]})`);
            });
            $selectFragmentList.append($button);
        }
        $selectFragmentCloseBtn.off().on('click', function() { hideSelectFragmentPopup(); showChapter2AllClearPopup(); });
        $selectFragmentModal.off('click').on('click', function(event) { if ($(event.target).is($selectFragmentModal)) { hideSelectFragmentPopup(); showChapter2AllClearPopup(); } });
        $selectFragmentModal.css('display', 'flex').hide().fadeIn(300);
         $selectedFragmentText.parent().css('border-color', '#ffd180'); $selectedFragmentText.parent().find('h3').css('color', '#ffd180'); $selectedFragmentText.prev('p').css('color', '#ccc'); $selectFragmentCloseBtn.css('color', '#ffd180');
    }
    function hideSelectFragmentPopup() { $selectFragmentModal.fadeOut(300); }

     // (내부 호출용)
     function showChapter2IndividualClearPopup(puzzleData, puzzleId) {
         showModal(`'${puzzleData.title}' 탐색 완료!`, {
        	 showSkipThemed: true, skipText: '더 탐색하기', onSkip: showPuzzleHub, puzzleId: puzzleId,
             showSkip2: true, skipText2: '넘어가기', onSkip2: showChapter2AllClearPopup,
             hideClose: false,
             onClose: hideModal
         });
     }

     // (내부 호출용)
     function showChapter2AllClearPopup() {
         let clearMessage = "챕터 2 '탐색' 클리어!<br>다음 여정을 준비하세요.";
         let clearPopupButtons = {
             showNext: true, nextChapterNum: 3,
             showMap: true,
             hideClose: false,
             onClose: hideModal
         };
         showModal(clearMessage, clearPopupButtons);
     }


    // --- 챕터 2: 십자말풀이 로직 ---
    let currentPuzzleId = null;
    let puzzleCompletionStatus = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };

    const categoryColorVars = {
        1: '--category-color-1', 2: '--category-color-2', 3: '--category-color-3',
        4: '--category-color-4', 5: '--category-color-5', 6: '--category-color-6'
    };

    // 퀴즈 데이터 저장소 (내용은 그대로)
    const puzzleDataStore = {
        1: {
            title: "우정", reward: `“내가 너무 늦게 왔지? 
벌써 다 녹아버린 아이스크림
나처럼 울면서 여기 있네
시간은 변해도 바다는 변하지 않는다고”
.
“펜싱을 할 때 처음으로 느꼈어 
나는 살아있어 너무나 분명히”
.
“탕관이라는 것은, 
현세에서의 번뇌, 아픔, 고통 등을
씻어내는 의식입니다.”`,
			gridSize: { rows: 6, cols: 6 },
			grid: [ 
				[1, 1, 1, 1, 1, 0], 
				[0, 0, 1, 0, 0, 1], 
				[0, 1, 1, 0, 0, 1], 
				[0, 0, 0, 1, 0, 0], 
				[1, 1, 1, 1, 0, 1], 
				[0, 0, 0, 1, 0, 1] ],
			answers: [ 
				['장', '례', '지', '도', '사', null], 
				[null, null, '키', null, null, '농'], 
				[null, '바', '다', null, null, '구'], 
				[null, null, null, '립', null, null], 
				['매', '그', '너', '스', null, '수'], 
				[null, null, null, '틱', null, '학'] ],
			labels: [ 
				[1, 0, 2, 0, 0, 0], 
				[0, 0, 0, 0, 0, 3], 
				[0, 4, 0, 0, 0, 0], 
				[0, 0, 0, 5, 0, 0], 
				[6, 0, 0, 0, 0, 7], 
				[0, 0, 0, 0, 0, 0] ],
			clues: { 
				across: [ { num: 1, clue: "토루의 직업" }, 
					{ num: 4, clue: "전리농에서 학생들이 가고 싶은 곳" }, 
					{ num: 6, clue: "비더슈탄트에서 지환 배우의 역할명" } 
				], down: [ { num: 2, clue: "펜싱의 어원" }, 
					{ num: 3, clue: "토루가 잘하는 스포츠 혹은 전설의 리틀 ㅇㅇ단" }, 
					{ num: 5, clue: "요시오가 토루에게 발라달라는 것" }, 
					{ num: 7, clue: "다인이가 제일 잘하는 과목" } ] }
        },
        2: {
            title: "사랑", reward: `“수줍은 인사에 싹을 틔워 
마주한 눈빛에 잎이 나서
어느새 훌쩍 자라난 꽃봉오리”
.
“너를 원해, 다른 네가 아니라
널 사랑해, 널 사랑해
있는 그대로의 너”
.
“봐 세상은 변해가 불가능한 건 없어”
.
“하루하루 살다 보면 알게 될까
살아내며 버티던 나날
어느 날 갑자기 당신을 만나
진짜 날 찾았죠 그 마음 변함없어요”`,
			gridSize: { rows: 6, cols: 6 },
			grid: [ 
				[0, 1, 0, 1, 1, 1], 
				[0, 1, 0, 0, 1, 0], 
				[0, 1, 0, 0, 1, 1], 
				[0, 0, 1, 1, 0, 0], 
				[0, 0, 1, 1, 0, 0], 
				[1, 1, 1, 1, 0, 0] ],
			answers: [ 
				[null, '다', null, '우', '물', '정'], 
				[null, '비', null, null, '고', null], 
				[null, '드' ,null, null, '기', '차'], 
				[null, null, '라', '수', null, null], 
				[null, null, '디', '내', null, null], 
				['꽃', '봉', '오', '리', null, null] ],
			labels: [ 
				[0, 1, 0, 2, 3, 0], 
				[0, 0, 0, 0, 0, 0], 
				[0, 0, 0, 0, 4, 0], 
				[0, 0, 5, 6, 0, 0], 
				[0, 0, 0, 0, 0, 0], 
				[7, 0, 0, 0, 0, 0] ],
			clues: { 
				across: [ { num: 2, clue: "고대가 말하는 해시태그의 다른 말" }, 
					{ num: 4, clue: "남원이가 서울을 가기위한 교통수단" }, 
					{ num: 7, clue: "석구 솔로 넘버 제목" } 
				], down: [ { num: 1, clue: "석영이의 별명(한국대 법대 ㅇㅇㅇ)" }, 
					{ num: 3, clue: "석구가 잡아 먹은 것 혹은 석영이가 주운 돌 모양" }, 
					{ num: 5, clue: "남원이가 정분이에게 준 것" }, 
					{ num: 6, clue: "석영이 농활 간 지역" } ] }
        },
        3: { 
        	title: "예술", reward: `“안개는 기억해 태양에 닿던 느낌
날아오르던 그 자유로움”
.
“사람은 가고 시는 남아
널 위로해 줄 거야”
.
“깡패들 시켜서 폭력을 쓰는 사람은 
그 깡패보다 나은 걸까요? 
아니면 못한 걸까요?”`,
			gridSize: { rows: 6, cols: 6 },
			grid: [ 
				[0, 1, 0, 1, 0, 0], 
				[0, 1, 0, 1, 1, 0], 
				[1, 1, 0, 1, 0, 1], 
				[0, 0, 1, 0, 0, 1], 
				[0, 1, 1, 1, 1, 0], 
				[0, 0, 1, 0, 0, 0] ],
			answers: [ 
				[null, '빗', null, '정', null, null], 
				[null, '방', null, '비', '극', null], 
				['거', '울' ,null, '공', null, '원'], 
				[null, null, '프', null, null, '고'], 
				[null, '낙', '랑', '파', '라', null], 
				[null, null, '스', null, null, null] ],
			labels: [
				[0, 1, 0, 2, 0, 0], 
				[0, 0, 0, 3, 0, 0], 
				[4, 0, 0, 0, 0, 5], 
				[0, 0, 6, 0, 0, 0], 
				[0, 7, 0, 0, 0, 0], 
				[0, 0, 0, 0, 0, 0] ],
			clues: { 
				across: [ { num: 3, clue: "로스가 다시 읽고 있는 것. 그리스 ㅇㅇ" }, 
					{ num: 4, clue: "ㅇㅇ은 그림이 아니야.(mirror)" }, 
					{ num: 7, clue: "이상과 동림이 만난 장소" } 
				], down: [ { num: 1, clue: "비 오는 날 이상과 동림이 세는 것" }, 
					{ num: 2, clue: "아덤의 직업" }, 
					{ num: 5, clue: "와일드가 가장 먼저 로스에게 보여주는 것" }, 
					{ num: 6, clue: "로스가 와일드한테 함께 가자는 나라" } ] }
        },
        4: { 
        	title: "사람", reward: `“고마워 정말 고마워 할머니
내 곁에 있어줘서 키워줘서
나를 사랑해줘서”
.
“그 언젠가 잠에 들었다가 
나비가 되는 꿈을 꾸었지”
.
“미친 듯이 페달을 밟아
밤거리를 달렸어요.
별을 향해.
내가 결코 닿을 수 없는 곳으로.”`,
			gridSize: { rows: 6, cols: 6 },
			grid: [ 
				[0, 0, 0, 0, 1, 1], 
				[0, 0, 1, 1, 0, 1], 
				[1, 0, 0, 0, 0, 1], 
				[1, 1, 1, 1, 0, 0], 
				[1, 0, 0, 0, 0, 1], 
				[0, 0, 0, 1, 1, 1] ],
			answers: [ 
				[null, null, null, null, '상', '소'], 
				[null, null, '안', '녕', null, '시'], 
				['장', null ,null, null, null, '지'], 
				['기', '축', '사', '화', null, null], 
				['준', null, null, null, null, '과'], 
				[null, null, null, '자', '전', '거'] ],
			labels: [ 
				[0, 0, 0, 0, 1, 2], 
				[0, 0, 3, 0, 0, 0], 
				[4, 0, 0, 4, 0, 0], 
				[5, 0, 0, 0, 0, 0], 
				[0, 0, 0, 0, 0, 6], 
				[0, 0, 0, 7, 0, 0] ],
			clues: { 
				across: [ { num: 1, clue: "최윤이 임금에게 올린 것" }, 
					{ num: 3, clue: "마지막 ㅇㅇ은 여기 구내과병원에서" }, 
					{ num: 5, clue: "등등곡에서 동인들이 화를 입은 사건" }, 
					{ num: 7, clue: "데이비가 8살 소녀에게 빼앗은 것" } 
				], down: [ { num: 2, clue: "데이비가 친구들이 놀러오면 2개를 내놔야 하는 것" }, 
					{ num: 4, clue: "구내과병원에서 지환 배우의 역할명" }, 
					{ num: 6, clue: "최윤이 사흘만에 치른 시험" } ] }
        },
        5: { 
        	title: "내면", reward: `“내 이름은 수증기라는 뜻이야,
수증기처럼 사라져야지”
.
“깊은 울음 깊은 어둠
그 속에서 글을 쓰네
나의 눈물 나의 분노
그 속에 묻혀 있던
괴물 같은 기억, 괴물 같은 나”
.
“마지막 순간 당신의 얼굴을 조각한다면
내 삶의 끝은 어디일까요
어머니”`,
			gridSize: { rows: 6, cols: 6 },
			grid: [ 
				[1, 1, 1, 1, 0, 0], 
				[1, 0, 0, 0, 1, 1], 
				[0, 1, 1, 0, 1, 0], 
				[0, 0, 1, 0, 0, 0], 
				[0, 0, 0, 0, 0, 0], 
				[0, 1, 1, 1, 1, 1] ],
			answers: [ 
				['레', '이', '몬', '드', null, null], 
				['네', null, null, null, '이', '반'], 
				[null, '금', '발', null, '별', null], 
				[null, null, '작', null, null, null], 
				[null, null, null, null, null, null], 
				[null, '라', '비', '린', '토', '스'] ],
			labels: [ 
				[1, 0, 0, 0, 0, 0], 
				[0, 0, 0, 0, 2, 0], 
				[0, 3, 4, 0, 0, 0], 
				[6, 0, 0, 0, 0, 0], 
				[0, 0, 0, 0, 0, 0], 
				[0, 5, 0, 0, 0, 0] ],
			clues: { 
				across: [ { num: 1, clue: "아가사에서 지환 배우의 역할명" }, 
					{ num: 2, clue: "스메르가 가장 따르는 형제" }, 
					{ num: 3, clue: "골드문트의 머리" }, 
					{ num: 5, clue: "아가사가 알려준 미궁의 다른 말" } 
				], down: [ { num: 1, clue: "골드문트가 함께 떠나자고 한 인물" }, 
					{ num: 2, clue: "골드문트가 어려워하는 순간" }, 
					{ num: 4, clue: "스메르가 자주 겪는 간질 증상" } ] }
        },
        6:  { 
        	title: "성장", reward: `“가늘고 길게 가늘고 길게 가늘고 길게 롱런”
.
“내 심장이 뜨겁게 뛰고 있어
나 살아있는 지금 이 순간
붙잡지 않으면
이 또한 지나가리라”
.
“아름다운 건 왜 우릴 스쳐 지나갈까요?”`,
			gridSize: { rows: 6, cols: 6 },
			grid: [ 
				[1, 1, 1, 1, 0, 1], 
				[0, 0, 1, 0, 0, 1], 
				[0, 0, 1, 0, 0, 1], 
				[1, 0,0, 1, 1, 0], 
				[1, 0, 0, 0, 0, 0], 
				[1, 1, 1, 1, 1, 0] ],
			answers: [ 
				['온', '더', '로', '드', null, '공'], 
				[null, null, '망', null, null, '무'], 
				[null, null ,'스', null, null, '원'], 
				['예', null, null, '캄', '프', null], 
				['술', null, null, null, null, null], 
				['가', '늘', '고', '길', '게', null] ],
			labels: [ 
				[1, 0, 2, 0, 0, 3], 
				[0, 0, 0, 0, 0, 0], 
				[0, 0, 0, 0, 0, 0], 
				[4, 0, 0, 5, 0, 0], 
				[0, 0, 0, 0, 0, 0], 
				[6, 0, 0, 0, 0, 0] ],
			clues: { 
				across: [ { num: 1, clue: "싱클레어가 읽고 좋아한다는 책" }, 
					{ num: 5, clue: "데미안이 만든 특별활동반" }, 
					{ num: 6, clue: "진기한이 원하는 삶의 목표(롱런)" } 
				], down: [ { num: 2, clue: "선호가 머무르는 다방" }, 
					{ num: 3, clue: "장선호의 직업 혹은 진기한이 준비하는 것" }, 
					{ num: 4, clue: "선호가 과거에서 만난 사람들" } ] }
        }
    };

    // 퍼즐 허브 UI 업데이트 함수
    function updatePuzzleHubUI() {
        $puzzleCategories.each(function() {
            const $category = $(this); const puzzleId = $category.data('puzzle-id'); const categoryData = puzzleDataStore[puzzleId];
            $category.find('.puzzle-title').text(categoryData.title);
             if (categoryData.title.endsWith('(개발 중)')) { $category.css({'opacity': '0.5', 'cursor': 'not-allowed'}); } else { $category.css({'opacity': '1', 'cursor': 'pointer'}); }
            if (puzzleCompletionStatus[puzzleId]) { $category.css('border-color', '#55efc4'); $category.addClass('cleared'); } else { $category.css('border-color', '#ffd180'); $category.removeClass('cleared'); }
        });
    }

    // 6개 카테고리 아이콘 클릭 시
    $puzzleCategories.on('click', function() {
        const puzzleId = $(this).data('puzzle-id');
        if (puzzleDataStore[puzzleId].title.endsWith('(개발 중)')) { showModal("아직 준비 중인 기억 조각입니다.", {showSkip: true, skipText: '확인'}); return; }
        currentPuzzleId = puzzleId; showCrosswordPuzzle(puzzleId);
    });

    // 십자말풀이 게임 표시 함수
    function showCrosswordPuzzle(id) {
        const puzzleData = puzzleDataStore[id];
         if (!puzzleData || (!puzzleData.gridSize || (typeof puzzleData.gridSize === 'object' && (!puzzleData.gridSize.rows || !puzzleData.gridSize.cols))) || !puzzleData.grid) { const title = puzzleData ? puzzleData.title : `퍼즐 #${id}`; showModal(`'${title}'은(는)<br>아직 데이터가 준비되지 않았습니다.`); currentPuzzleId = null; return; }
        const colorVarName = categoryColorVars[id] || '--category-color-1';
         $crosswordGameContainer.get(0).style.setProperty('--current-category-color', `var(${colorVarName})`);
        $puzzleHub.fadeOut(300, function() {
            $crosswordTitle.text(puzzleData.title); $crosswordGrid.empty(); $crosswordCluesAcross.empty(); $crosswordCluesDown.empty();
             const rows = (typeof puzzleData.gridSize === 'object') ? puzzleData.gridSize.rows : puzzleData.gridSize; const cols = (typeof puzzleData.gridSize === 'object') ? puzzleData.gridSize.cols : puzzleData.gridSize;
            $crosswordGrid.css('--grid-cols', cols); $crosswordGrid.css('--grid-rows', rows);
            for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { if (!puzzleData.grid[r] || puzzleData.grid[r][c] === undefined) { console.error(`Invalid grid data at [${r}, ${c}] for puzzle ${id}`); $crosswordGrid.append('<div class="cell empty">?</div>'); continue; } if (puzzleData.grid[r][c] === 1) { const labelNum = puzzleData.labels[r] ? puzzleData.labels[r][c] : 0; const answer = (puzzleData.answers[r] && puzzleData.answers[r][c]) ? puzzleData.answers[r][c] : ''; let cellHtml = '<div class="cell">'; if (labelNum > 0) { cellHtml += `<span class="cell-label">${labelNum}</span>`; } cellHtml += `<input class="cell-input" type="text" maxlength="1" data-row="${r}" data-col="${c}" data-answer="${answer}">`; cellHtml += '</div>'; $crosswordGrid.append(cellHtml); } else { $crosswordGrid.append('<div class="cell empty"></div>'); } } }
            if (puzzleData.clues && puzzleData.clues.across) { puzzleData.clues.across.forEach(clue => { if (clue && clue.num !== undefined && clue.clue !== undefined) { $crosswordCluesAcross.append(`<li><b>${clue.num}</b>. ${clue.clue}</li>`); } }); } if (puzzleData.clues && puzzleData.clues.down) { puzzleData.clues.down.forEach(clue => { if (clue && clue.num !== undefined && clue.clue !== undefined) { $crosswordCluesDown.append(`<li><b>${clue.num}</b>. ${clue.clue}</li>`); } }); }
            $crosswordGrid.find('.cell-input').css('color', '#000'); $crosswordGameContainer.css('display', 'flex').hide().fadeIn(300); $chapter2.scrollTop(0);
        });
    }

    // "다음 칸으로 이동" 로직
    function moveToNextCell($currentInput) {
        let currentCellIndex = $crosswordGrid.find('.cell-input').index($currentInput);
        let $nextInput = $crosswordGrid.find('.cell-input').eq(currentCellIndex + 1);
        if ($nextInput.length > 0) {
            $nextInput.focus();
        } else {
            $currentInput.blur();
        }
    }

    // 각 입력 칸마다 개별 타이머를 저장할 변수
    let inputTimer = null; 

    $crosswordGrid.on('input', '.cell-input', function(e) {
        if (e.originalEvent && e.originalEvent.isComposing) { return; }
        if (inputTimer) { clearTimeout(inputTimer); }
        const $this = $(this);
        const text = $this.val();
        if (text.length === 1) {
            inputTimer = setTimeout(function() {
                const currentText = $this.val();
                if (currentText.length === 1) {
                    const charCode = currentText.charCodeAt(0);
                    const isCompleteHangul = (charCode >= 0xAC00 && charCode <= 0xD7A3);
                    const isAlphabet = (charCode >= 0x0041 && charCode <= 0x005A) || (charCode >= 0x0061 && charCode <= 0x007A);
                    const isNumber = (charCode >= 0x0030 && charCode <= 0x0039);
                    if (isCompleteHangul || isAlphabet || isNumber) {
                        moveToNextCell($this);
                    }
                }
            }, 300);
        }
    });
    
    // 정답 확인 버튼
    $crosswordCheckBtn.on('click', function() {
        if (!currentPuzzleId) return;
        const puzzleData = puzzleDataStore[currentPuzzleId];
        if (!puzzleData || (!puzzleData.gridSize || (typeof puzzleData.gridSize === 'object' && (!puzzleData.gridSize.rows || !puzzleData.gridSize.cols))) || !puzzleData.grid) { console.error(`Cannot check answers for invalid puzzle data (ID: ${currentPuzzleId})`); return; }
        let isAllCorrect = true;
        $crosswordGrid.find('.cell-input').each(function() {
            const $input = $(this);
            const userAnswer = $input.val().trim();
            const correctAnswer = $input.data('answer');
            if (userAnswer === '') {
                isAllCorrect = false;
                $input.css('background-color', 'rgba(255, 0, 0, 0.2)');
                if (correctAnswer !== '') $input.css('color', '#ff0000');
                return;
            } else {
                $input.css('background-color', '');
            }
            if (userAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                $input.css('color', '#008000');
            } else {
                $input.css('color', '#ff0000');
                isAllCorrect = false;
            }
        });

        if (isAllCorrect) {
            puzzleCompletionStatus[currentPuzzleId] = true;
            showModal("정답!<br>기억의 조각을 발견했습니다!", {
                showStart: true,
                startText: '확인하기',
                onStart: () => {
                    showFragmentModal(puzzleData.title, puzzleData.reward, () => {
                        const allPuzzlesComplete = Object.values(puzzleCompletionStatus).every(status => status === true);
                        if (allPuzzlesComplete) {
                            showChapter2AllClearPopup();
                        } else {
                            showChapter2IndividualClearPopup(puzzleData, currentPuzzleId);
                        }
                    });
                },
                showSkip: true,
                skipText: '넘어가기',
                onSkip: () => {
                    const allPuzzlesComplete = Object.values(puzzleCompletionStatus).every(status => status === true);
                    if (allPuzzlesComplete) {
                        showChapter2AllClearPopup();
                    } else {
                        showChapter2IndividualClearPopup(puzzleData);
                    }
                },
                hideClose: false,
                onClose: hideModal
            });
        } else {
            showModal("오답!<br>붉은색 칸이나 빈칸을 확인해주세요.", {
                showStart: true,
                startText: '다시 풀기',
                onStart: () => {
                    $crosswordGrid.find('.cell-input').css('background-color', '');
                },
                hideClose: false
            });
        }
    });

    // 십자말풀이 게임 숨기고 허브 표시 함수
    function showPuzzleHub() { $crosswordGameContainer.fadeOut(300, function() { $puzzleHub.fadeIn(300); updatePuzzleHubUI(); currentPuzzleId = null; $chapter2.scrollTop(0); }); }
    // 십자말풀이 '뒤로 가기' (목록으로) 버튼
    $crosswordBackBtn.on('click', showPuzzleHub);
    // 챕터 2 허브 "넘어가기" 버튼 이벤트 핸들러
    $ch2SkipBtn.on('click', function() { showModal("기억 조각 발견!<br>확인하시겠습니까?", { showStart: true, startText: '확인하기', onStart: showSelectFragmentPopup, showSkip: true, skipText: '넘어가기', onSkip: showChapter2AllClearPopup, hideClose: false, onClose: () => { /* No action */ } }); });

});