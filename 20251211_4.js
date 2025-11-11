// [수정] HTML이 모두 로드된 후 스크립트가 실행되도록 $(document).ready로 감쌉니다.
$(document).ready(function() {

    // --- 1. DOM 요소 캐싱 ---
    const $ch4StoryIntro = $('#ch4-story-intro');
    const $ch4StartBtn = $('#ch4-start-btn');
    const $ch4IntroSkipBtn = $('#ch4-intro-skip-btn');
    const $canvas = $('#memory-drop-canvas');
    let ctx = null; 
    
    const $hud = $('#ch4-hud');
    const $scoreEl = $('#ch4-score');
    const $nextPreviewCanvas = $('<canvas id="ch4-next-canvas"></canvas>');
    const $nextPreviewContainer = $('#ch4-next-preview');
    const $skipBtn = $('#ch4-skip-btn'); 

    // --- 2. 게임 설정 ---
    const COLS = 6;
    const ROWS = 12;
    let BLOCK_SIZE = 50; // 화면 크기에 따라 변경됩니다.
    const WIN_SCORE = 1500; 
    const CONNECT_COUNT = 3; 
    
    let NEXT_BLOCK_SIZE = 40; 
    let nextCtx = null;

    // 모바일 제스처 민감도
    const SWIPE_THRESHOLD_Y = 40; // 하단 스와이프(하드드롭)만 사용
    const TAP_MAX_DURATION = 250; 
    const TAP_MAX_TRAVEL = 20;
    
    // [신규] 롱 프레스 설정
    const LONG_PRESS_DURATION = 300; // 300ms (0.3초) 이상 누르면 롱 프레스로 간주
    const SOFT_DROP_SPEED = 60; // 60ms 마다 1칸씩 (빠른 하강 속도)

    // 이미지 리소스 (챕터 3 재활용)
    const iconImages = {};
    const iconSources = [
        { id: 1, src: "https://lh3.googleusercontent.com/d/1iV8cFHpJF8dbBrE9WuR8QL9bvCvcUTkt" }, // 라피에 검
        { id: 2, src: "https://lh3.googleusercontent.com/d/1E2X0OiY2Nx2WXZph0alj1vfHMrtleZBK" }, // 농구공
        { id: 3, src: "https://lh3.googleusercontent.com/d/1_48vHjQl3PZJZGNhgVDIO3rKNZZnpNak" }, // 라디오
        { id: 4, src: "https://lh3.googleusercontent.com/d/1fw0n2SsBAODWS_UQjB8gxbsJHXy3edc5" }, // 매화
        { id: 5, src: "https://lh3.googleusercontent.com/d/1dT3wFKqge3ADj8irrQs89JhRxiVSbYdy" }, // 자전거
        { id: 6, src: "https://lh3.googleusercontent.com/d/1wTMP8T9fQ422Qlue1Mrrrx8d2LkK7Bto" }  // 원고
    ];
    let imagesLoaded = 0;
    iconSources.forEach(icon => {
        iconImages[icon.id] = new Image();
        iconImages[icon.id].src = icon.src;
        iconImages[icon.id].onload = () => { imagesLoaded++; };
    });

    // --- 3. 게임 상태 변수 ---
    let board = [];
    let currentPiece = null; 
    let nextPiece = null;
    let score = 0;
    let gameOver = false;
    let gameLoopId = null; 
    let lastDropTime = 0;
    let dropInterval = 1000;
    let isCheckingConnections = false;
    let particles = []; 
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let longPressTimer = null; // [신규] 롱 프레스 타이머
    let softDropInterval = null; // [신규] 빠른 하강 인터벌

    // --- 4. 메인 함수 (초기화, 중지) ---

    initChapter4Game = function() {
        if ($canvas.length === 0) {
            console.error("챕터 4 캔버스를 찾을 수 없습니다.");
            return; 
        }
        ctx = $canvas.get(0).getContext('2d');
        
        $canvas.hide();
        $hud.hide();
        $skipBtn.hide();

        $nextPreviewContainer.empty().append($nextPreviewCanvas);
        nextCtx = $nextPreviewCanvas.get(0).getContext('2d');

        board = createEmptyBoard();
        score = 0;
        gameOver = false;
        dropInterval = 1000;
        particles = [];
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        
        $ch4StartBtn.off().on('click', startChapter4Game); 
        $ch4IntroSkipBtn.off().on('click', skipChapter4); 
        $skipBtn.off().on('click', skipChapter4);

        $ch4StoryIntro.hide().fadeIn(500);
    };
    
    function startChapter4Game() {
        $ch4StoryIntro.fadeOut(300, function() {
            
            // 1. 캔버스 크기를 화면에 맞게 계산하고 설정
            calculateAndSetCanvasSize(); 
            
            // 2. 다른 UI 요소들 나타나게 함
            $hud.fadeIn(300);
            $skipBtn.fadeIn(300);
            
            // 3. 캔버스가 fadeIn 완료되면 게임 시작
            $canvas.fadeIn(300, function() {
                
                // --- 4. 게임 시작 로직 ---
                board = createEmptyBoard();
                score = 0;
                gameOver = false;
                isCheckingConnections = false;
                dropInterval = 1000;
                particles = [];
                $scoreEl.text(score); 
                
                nextPiece = createNewPiece();
                currentPiece = createNewPiece();
                drawNextPiece(); 
                
                $(document).off('.memorydrop').on('keydown.memorydrop', handleInput);

                // 모바일 터치 이벤트 리스너
                $canvas.off('.memorydrop');
                $canvas.on('touchstart.memorydrop', handleTouchStart);
                $canvas.on('touchend.memorydrop', handleTouchEnd);
                $canvas.on('touchcancel.memorydrop', handleTouchEnd); 

                // 화면 크기 변경(회전) 감지 리스너
                $(window).off('.memorydrop-resize').on('resize.memorydrop-resize', handleResize);

                lastDropTime = Date.now();
                if (gameLoopId) cancelAnimationFrame(gameLoopId);
                gameLoop();
                
            }); 
        }); 
    }

    stopChapter4Game = function() {
        gameOver = true;
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        $(document).off('.memorydrop');
        $canvas.off('.memorydrop'); 
        $(window).off('.memorydrop-resize'); 
        
        // [신규] 모든 타이머와 인터벌 정리
        if (longPressTimer) clearTimeout(longPressTimer);
        if (softDropInterval) clearInterval(softDropInterval);
        longPressTimer = null;
        softDropInterval = null;
        
        $ch4StoryIntro.hide(); 
    };

    // --- 4.5 캔버스 크기 계산 함수 ---
    
    function calculateAndSetCanvasSize() {
        const $container = $canvas.parent(); 
        const $hud = $('#ch4-hud');
        const $skipBtn = $('#ch4-skip-btn');

        $hud.show(); 
        $skipBtn.show();
        
        const containerWidth = $container.width();
        const containerHeight = $container.height();
        
        const hudHeight = $hud.outerHeight(true) || 60; 
        const skipBtnHeight = $skipBtn.outerHeight(true) || 50; 
        // 챕터 컨테이너의 상단 여백
        const topPadding = ($container.css('padding-top') ? parseInt($container.css('padding-top'), 10) : 10); // 20 -> 10
        // 캔버스와 버튼 사이 여유 공간
        const bottomMargin = 5; // 10 -> 5
        
        const availableWidth = containerWidth;
        const availableHeight = containerHeight - hudHeight - skipBtnHeight - topPadding - bottomMargin;

        const sizeFromWidth = Math.floor(availableWidth / COLS);
        const sizeFromHeight = Math.floor(availableHeight / ROWS);

        BLOCK_SIZE = Math.min(sizeFromWidth, sizeFromHeight);
        BLOCK_SIZE = Math.max(20, Math.min(50, BLOCK_SIZE)); 

        const canvasWidth = BLOCK_SIZE * COLS;
        const canvasHeight = BLOCK_SIZE * ROWS;
        
        $canvas.attr('width', canvasWidth);
        $canvas.attr('height', canvasHeight);
        
        NEXT_BLOCK_SIZE = Math.floor(BLOCK_SIZE * 0.8); 
        $nextPreviewCanvas.attr('width', NEXT_BLOCK_SIZE * 2.5); 
        $nextPreviewCanvas.attr('height', NEXT_BLOCK_SIZE * 2.5);
    }

    // --- 5. 게임 루프 및 핵심 로직 ---

    function gameLoop() {
        if (gameOver) return;
        
        const now = Date.now();
        const delta = now - lastDropTime;

        if (!isCheckingConnections && delta > dropInterval) {
            dropPiece();
            lastDropTime = now;
        }
        
        drawGame(); 
        
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function dropPiece() {
        if (!currentPiece) return;
        const testPiece = { ...currentPiece, y: currentPiece.y + 1 };
        
        if (!checkCollision(testPiece)) {
            currentPiece.y++;
        } else {
            placePieceOnBoard(); 
        }
    }

    async function placePieceOnBoard() {
        if (!currentPiece) return;

        currentPiece.pieces.forEach(p => {
            const boardX = currentPiece.x + p.x;
            const boardY = currentPiece.y + p.y;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                board[boardY][boardX] = p.id;
            }
        });
        
        currentPiece = null;
        applyGravityToBoard();
        drawGame(); 
        await sleep(100); 

        isCheckingConnections = true; 
        let chainCount = 0;
        let connectionsFound = true;
        
        while (connectionsFound) {
            const connectedGroups = findConnections(); 
            
            if (connectedGroups.length > 0) {
                chainCount++;
                let piecesRemoved = 0;
                connectedGroups.forEach(group => {
                    piecesRemoved += group.size;
                    group.forEach(pos => {
                        createExplosion(pos.x, pos.y, board[pos.y][pos.x]); 
                        board[pos.y][pos.x] = 0;
                    });
                });
                
                const points = (piecesRemoved * 10) * chainCount;
                updateScoreAndEnergy(points, chainCount); 
                
                drawGame(); 
                await sleep(300); 
                applyGravityToBoard();
                drawGame(); 
                await sleep(300);
                connectionsFound = true; 
            } else {
                connectionsFound = false;
            }
        }
        
        isCheckingConnections = false; 
        currentPiece = nextPiece;
        nextPiece = createNewPiece();
        drawNextPiece();
        
        if (checkCollision(currentPiece)) {
            gameOver = true;
            stopChapter4Game();
            showGameOverModal();
        }
    }

    function findConnections() {
        const connectedGroups = [];
        const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const id = board[y][x];
                if (id === 0 || visited[y][x]) continue;

                const group = new Set();
                const queue = [{ x, y }];
                visited[y][x] = true;

                while (queue.length > 0) {
                    const { x: cx, y: cy } = queue.shift();
                    group.add(JSON.stringify({ x: cx, y: cy })); 

                    const neighbors = [
                        { x: cx, y: cy - 1 }, { x: cx, y: cy + 1 },
                        { x: cx - 1, y: cy }, { x: cx + 1, y: cy }
                    ];

                    neighbors.forEach(n => {
                        if (n.x >= 0 && n.x < COLS && n.y >= 0 && n.y < ROWS &&
                            !visited[n.y][n.x] && board[n.y][n.x] === id) 
                        {
                            visited[n.y][n.x] = true;
                            queue.push({ x: n.x, y: n.y });
                        }
                    });
                }

                if (group.size >= CONNECT_COUNT) {
                    const groupArray = Array.from(group).map(str => JSON.parse(str));
                    groupArray.size = group.size;
                    connectedGroups.push(groupArray);
                }
            }
        }
        return connectedGroups;
    }

    function applyGravityToBoard() {
        for (let x = 0; x < COLS; x++) {
            let emptyRow = ROWS - 1;
            for (let y = ROWS - 1; y >= 0; y--) {
                if (board[y][x] !== 0) {
                    if (y !== emptyRow) {
                        board[emptyRow][x] = board[y][x];
                        board[y][x] = 0;
                    }
                    emptyRow--;
                }
            }
        }
    }

    function checkCollision(piece) {
        if (!ctx) return true; 
        
        for (const p of piece.pieces) {
            const boardX = piece.x + p.x;
            const boardY = piece.y + p.y;
            if (boardX < 0 || boardX >= COLS) return true;
            if (boardY >= ROWS) return true;
            if (boardY < 0) continue; 
            if (board[boardY][boardX] !== 0) return true;
        }
        return false;
    }

    function drawGame() {
        if (!ctx) return; 
        
        ctx.clearRect(0, 0, $canvas.attr('width'), $canvas.attr('height'));
        ctx.fillStyle = 'rgba(0, 5, 20, 0.7)';
        ctx.fillRect(0, 0, $canvas.attr('width'), $canvas.attr('height'));

        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const id = board[y][x];
                if (id > 0) {
                    drawBlock(ctx, x, y, id, BLOCK_SIZE);
                }
            }
        }
        
        if (currentPiece) {
            currentPiece.pieces.forEach(p => {
                drawBlock(ctx, currentPiece.x + p.x, currentPiece.y + p.y, p.id, BLOCK_SIZE);
            });
        }
        
        drawParticles();
    }

    function drawNextPiece() {
        if (!nextCtx || !nextPiece) return;
        
        const canvasWidth = $nextPreviewCanvas.attr('width');
        const canvasHeight = $nextPreviewCanvas.attr('height');
        
        nextCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        const startX = (canvasWidth / 2) - NEXT_BLOCK_SIZE;
        const startY = (canvasHeight / 2) - (NEXT_BLOCK_SIZE / 2);
        
        drawBlock(nextCtx, 0, 0, nextPiece.pieces[0].id, NEXT_BLOCK_SIZE, startX, startY);
        drawBlock(nextCtx, 1, 0, nextPiece.pieces[1].id, NEXT_BLOCK_SIZE, startX, startY);
    }

    function drawBlock(targetCtx, x, y, id, size, offsetX = 0, offsetY = 0) {
        const drawX = (x * size) + offsetX;
        const drawY = (y * size) + offsetY;
        
        if (imagesLoaded === iconSources.length && iconImages[id]) {
            targetCtx.drawImage(iconImages[id], drawX, drawY, size, size);
        } else {
            const colors = ['#80deea', '#ce93d8', '#a5d6a7', '#90caf9', '#b39ddb', '#8c9eff'];
            targetCtx.fillStyle = colors[id - 1] || 'grey';
            targetCtx.fillRect(drawX, drawY, size, size);
        }
    }

    function createExplosion(x, y, id) {
        const centerX = (x + 0.5) * BLOCK_SIZE;
        const centerY = (y + 0.5) * BLOCK_SIZE;
        const colors = ['#80deea', '#ce93d8', '#a5d6a7', '#90caf9', '#b39ddb', '#8c9eff'];
        const color = colors[id - 1] || 'white';

        for (let i = 0; i < 15; i++) { 
            particles.push({
                x: centerX, y: centerY,
                vx: (Math.random() - 0.5) * 8, 
                vy: (Math.random() - 0.5) * 8, 
                size: Math.random() * (BLOCK_SIZE / 20) + 2, 
                color: color,
                life: 30 
            });
        }
    }

    function drawParticles() {
        if (!ctx) return;
        
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; 
            p.life--; 
            
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30; 
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
        ctx.globalAlpha = 1.0; 
    }

    function createEmptyBoard() {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    }

    function createNewPiece() {
        const id1 = iconSources[Math.floor(Math.random() * iconSources.length)].id;
        const id2 = iconSources[Math.floor(Math.random() * iconSources.length)].id;
        return {
            x: Math.floor(COLS / 2) - 1, y: 0,
            pieces: [ { id: id1, x: 0, y: 0 }, { id: id2, x: 1, y: 0 } ], 
            rotation: 0 
        };
    }

    // --- 5.5 키보드/터치 입력 핸들러 ---
    
    function handleInput(e) {
        if (gameOver || !currentPiece || isCheckingConnections) return;
        
        let testPiece = JSON.parse(JSON.stringify(currentPiece));
        let moved = false;
        
        switch (e.key) {
            case "ArrowLeft":
                testPiece.x--;
                moved = true;
                break;
            case "ArrowRight":
                testPiece.x++;
                moved = true;
                break;
            case "ArrowDown":
                // 롱 프레스(Soft Drop)를 위한 로직
                dropPiece();
                lastDropTime = Date.now();
                drawGame();
                return;
            case "ArrowUp":
                rotatePiece(testPiece);
                moved = true;
                break;
            case " ":
                // 하단 스와이프(Hard Drop)를 위한 로직
                hardDrop();
                drawGame();
                return;
        }

        if (moved) {
            if (!checkCollision(testPiece)) {
                currentPiece = testPiece;
            }
            drawGame();
        }
    }

    function rotatePiece(piece) {
        piece.rotation = (piece.rotation + 1) % 4;
        const p2 = piece.pieces[1];
        
        const [x, y] = [p2.x, p2.y];
        if (x === 1 && y === 0) { p2.x = 0; p2.y = 1; }
        else if (x === 0 && y === 1) { p2.x = -1; p2.y = 0; }
        else if (x === -1 && y === 0) { p2.x = 0; p2.y = -1; }
        else if (x === 0 && y === -1) { p2.x = 1; p2.y = 0; }
        
        if (checkCollision(piece)) {
            piece.x++;
            if (!checkCollision(piece)) return;
            piece.x -= 2;
            if (!checkCollision(piece)) return;
            piece.x++;
            
            rotatePiece(piece);
            rotatePiece(piece);
            rotatePiece(piece);
        }
    }

    function hardDrop() {
        if (!currentPiece || isCheckingConnections) return;
        
        let testPiece = JSON.parse(JSON.stringify(currentPiece));
        while (!checkCollision({ ...testPiece, y: testPiece.y + 1 })) {
            testPiece.y++;
        }
        currentPiece = testPiece;
        placePieceOnBoard();
    }

    function updateScoreAndEnergy(points, chain) {
        score += points;
        $scoreEl.text(score);
        
        if (score >= WIN_SCORE && !gameOver) {
            showWinConfirmation();
        }

        if (score > WIN_SCORE * 0.7) { dropInterval = 400; } 
        else if (score > WIN_SCORE * 0.4) { dropInterval = 700; }
    }

    function showWinConfirmation() {
        gameOver = true; 
        $(document).off('.memorydrop'); 
        $canvas.off('.memorydrop'); 

        if (typeof showModal === 'function') {
            showModal("목표 점수 달성!<br>어떻게 하시겠습니까?", {
                showStart: true, startText: '조각 발견하기', 
                onStart: winGame, 
                
                showSkip: true, skipText: '계속 하기', 
                onSkip: () => {
                    gameOver = false; 
                    $(document).on('keydown.memorydrop', handleInput); 
                    $canvas.on('touchstart.memorydrop', handleTouchStart); 
                    $canvas.on('touchend.memorydrop', handleTouchEnd);
                    $canvas.on('touchcancel.memorydrop', handleTouchEnd);
                    hideModal(); 
                },
                hideClose: true
            });
        }
    }

    function showGameOverModal() {
        if (typeof showModal === 'function') {
            showModal("GAME OVER<br>기억 연결에 실패했습니다...", {
                showStart: true, startText: '재시도', onStart: startChapter4Game,
                showSkip: true, skipText: '넘어가기', onSkip: skipChapter4,
                hideClose: true
            });
        }
    }

    function winGame() {
        gameOver = true; 
        stopChapter4Game(); 
        
        const chapter4Reward = {
            title: "🌌",
            content: `“10년의 기억이 모여 빛이 되었습니다.
            <br><br>
            이 빛은 우리가 함께 만든 은하.
            <br><br>
            이제 마지막 항해를 시작합니다.”`
        };
        
        if (typeof showModal === 'function' && typeof showFragmentModal === 'function') {
             showFragmentModal(chapter4Reward.title, chapter4Reward.content, () => {
                showModal("챕터 4 '연결' 클리어!<br>다음 여정을 준비하세요.", {
                     showNext: true, nextChapterNum: 5,
                     showMap: true, hideClose: false, onClose: hideModal
                 });
             });
        }
    }

    function skipChapter4() {
        stopChapter4Game();

        // 1. 보상 내용 정의
        const chapter4Reward = {
            title: "🌌",
            content: `“10년의 기억이 모여 빛이 되었습니다.
            <br><br>
            이 빛은 우리가 함께 만든 은하.
            <br><br>
            이제 마지막 항해를 시작합니다.”`
        };

        // 2. [신규] 최종 클리어 팝업을 함수로 분리 (중복 호출 방지)
        function showChapter4ClearPopup() {
            showModal("챕터 4 '연결' 클리어!<br>다음 여정을 준비하세요.", {
                 showNext: true, nextChapterNum: 5,
                 showMap: true, hideClose: false, onClose: hideModal
             });
        }

        // 3. [수정] 챕터 1과 동일하게 "기억 조각 발견!" 모달을 먼저 띄움
        if (typeof showModal === 'function' && typeof showFragmentModal === 'function') {
            showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                showStart: true, startText: '확인하기',
                onStart: () => {
                    // '확인하기' 누르면 -> 조각 팝업
                    showFragmentModal(chapter4Reward.title, chapter4Reward.content, () => {
                        // 조각 팝업 닫으면 -> 최종 클리어 팝업
                        showChapter4ClearPopup();
                    });
                },
                showSkip: true, skipText: '넘어가기',
                onSkip: () => {
                    // '넘어가기' 누르면 -> 조각 안 보고 바로 최종 클리어 팝업
                    showChapter4ClearPopup();
                },
                hideClose: false,
                onClose: hideModal // 모달 바깥 클릭 시 닫기
            });
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- [신규] 6. 터치 핸들러 로직 (롱 프레스 / 탭 / 스와이프) ---

    /**
     * 터치 시작 시: 롱 프레스 타이머 시작
     */
    function handleTouchStart(e) {
        if (gameOver || isCheckingConnections) return;
        e.preventDefault(); 
        
        const touch = e.touches[0] || e.originalEvent.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        
        // 기존 인터벌이 있다면 즉시 중지
        if (softDropInterval) clearInterval(softDropInterval);
        if (longPressTimer) clearTimeout(longPressTimer);

        // 롱 프레스 타이머 설정
        longPressTimer = setTimeout(() => {
            // 롱 프레스가 발동되면, "빠른 하강" 인터벌 시작
            softDropInterval = setInterval(() => {
                // "ArrowDown" 키 이벤트를 시뮬레이션
                handleInput({ key: "ArrowDown" });
            }, SOFT_DROP_SPEED);
            
            longPressTimer = null; // 타이머 실행 완료
        }, LONG_PRESS_DURATION);
    }

    /**
     * 터치 종료 시: 롱 프레스 / 탭 / 스와이프 판별
     */
    function handleTouchEnd(e) {
        if (gameOver || isCheckingConnections || touchStartX === 0) return;
        e.preventDefault();
        
        // 롱 프레스 타이머와 인터벌을 즉시 중지
        if (longPressTimer) clearTimeout(longPressTimer);
        if (softDropInterval) clearInterval(softDropInterval);
        longPressTimer = null;
        softDropInterval = null;

        const touch = e.changedTouches[0] || e.originalEvent.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const duration = Date.now() - touchStartTime;

        // 1. 롱 프레스(LONG_PRESS_DURATION)보다 짧게 눌렀을 경우에만 (탭/스와이프)
        if (duration < LONG_PRESS_DURATION) {
            
            // 2. 짧은 탭(Tap) 판별
            if (duration < TAP_MAX_DURATION && 
                Math.abs(deltaX) < TAP_MAX_TRAVEL && 
                Math.abs(deltaY) < TAP_MAX_TRAVEL) {
                
                const canvasWidth = $canvas.width();
                const tapX = touchEndX; // 터치가 끝난 지점의 X좌표

                // 요청사항: 탭 위치에 따른 좌/우 이동 및 중앙 탭(회전)
                if (tapX < canvasWidth * 0.4) {
                    // 왼쪽 40% 탭 = 왼쪽 이동
                    handleInput({ key: "ArrowLeft" });
                } else if (tapX > canvasWidth * 0.6) {
                    // 오른쪽 40% 탭 = 오른쪽 이동
                    handleInput({ key: "ArrowRight" });
                } else {
                    // 중앙 20% 탭 = 회전 (유지)
                    handleInput({ key: "ArrowUp" });
                }
            }
            // 3. 스와이프(Swipe) 판별 (하드 드롭만 남김)
            else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > SWIPE_THRESHOLD_Y) {
                // [유지] 아래로 스와이프 = 하드 드롭 (스페이스바)
                handleInput({ key: " " });
            }
            // (좌/우/위 스와이프는 이제 무시됨)
        }
        // (4. 롱 프레스의 경우는 이미 타이머/인터벌이 처리했으므로, 여기서는 아무것도 안 함)

        // 터치 시작점 초기화
        touchStartX = 0;
        touchStartY = 0;
    }
    
    // --- 7. 화면 크기 변경 핸들러 ---
    
    function handleResize() {
        // 게임이 진행 중일 때만 작동
        if (gameOver || !ctx) return; 

        // 타이머 즉시 중지
        if (longPressTimer) clearTimeout(longPressTimer);
        if (softDropInterval) clearInterval(softDropInterval);
        
        // 즉시 게임 중지
        stopChapter4Game();
        
        // 크기 변경으로 인한 재시작 알림
        if (typeof showModal === 'function' && typeof goToMap === 'function') {
            showModal("화면 크기가 변경되었습니다.<br>게임을 다시 시작해야 합니다.", {
                showStart: true, startText: '재시작', onStart: startChapter4Game,
                showSkip: true, skipText: '지도로 가기', onSkip: goToMap,
                hideClose: true
            });
        }
    }

}); // $(document).ready 래퍼 닫기