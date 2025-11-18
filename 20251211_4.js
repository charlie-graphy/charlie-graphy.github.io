// [수정] HTML이 모두 로드된 후 스크립트가 실행되도록 $(document).ready로 감쌉니다.
$(document).ready(function() {

    // --- 1. DOM 요소 캐싱 ---
    const $ch4StoryIntro = $('#ch4-story-intro');
    const $ch4StartBtn = $('#ch4-start-btn');
    const $ch4IntroSkipBtn = $('#ch4-intro-skip-btn');
    const $canvas = $('#memory-drop-canvas');
    let ctx = null; 
    
    // [수정] 터치 이벤트의 기준이 될 컨테이너 캐싱
    const $ch4Container = $('#chapter4-container'); 
    
    const $hud = $('#ch4-hud');
    const $scoreEl = $('#ch4-score');
    const $nextPreviewCanvas = $('<canvas id="ch4-next-canvas"></canvas>');
    const $nextPreviewContainer = $('#ch4-next-preview');
    // const $skipBtn = $('#ch4-skip-btn'); // [삭제]
    const $ch4PauseBtn = $('#ch4-pause-btn'); // [신규] 일시정지 버튼

    // --- 2. 게임 설정 ---
    const COLS = 6;
    const ROWS = 12;
    let BLOCK_SIZE = 50; // 화면 크기에 따라 변경됩니다.
    const WIN_SCORE = 1000; // 1000점
    const CONNECT_COUNT = 3; 
    
    let NEXT_BLOCK_SIZE = 40; 
    let nextCtx = null;

    // 모바일 제스처 민감도
    const TAP_MAX_DURATION = 250; 
    const TAP_MAX_TRAVEL = 20;
    const LONG_PRESS_DURATION = 300; 
    const SOFT_DROP_SPEED = 60; 

    // [수정] 이미지 리소스 (새 URL 적용)
    const iconImages = {};
    
    // [신규] 1단계 아이템 목록 (6개)
    const level1Items = [
        { id: 1, src: "https://lh3.googleusercontent.com/d/1puP6vCGR6hOr-16YXD6_AH36mw0bNi_-" }, // 1. 라디오
        { id: 2, src: "https://lh3.googleusercontent.com/d/1mSsn1P22ZaczrdwiIfm4GTdZ0hocQVmF" }, // 2. 자전거
        { id: 3, src: "https://lh3.googleusercontent.com/d/1VPfKC1rXUjK1lQKousZkYn-fshDwJSr4" }, // 3. 매화
        { id: 4, src: "https://lh3.googleusercontent.com/d/1BFnO3cdznUWnwnS_z5MqWAXnUlg_REfL" }, // 4. 농구공
        { id: 5, src: "https://lh3.googleusercontent.com/d/1FeSVXFq7k4r70dRif8nTjzrbBJ4hN27a" }, // 5. 라피에검
        { id: 6, src: "https://lh3.googleusercontent.com/d/12elMJDIyD3E9JlmMnZAR06OoA-VB4O8f" }  // 6. 물고기모양 돌
    ];
    
    // [신규] 2단계 아이템 목록 (7개) - 1단계 목록 + 7번째 아이템
    const level2Items = [
        ...level1Items,
        { id: 7, src: "https://lh3.googleusercontent.com/d/18pxFW7L7LnmWdJ_VArV9BlnevX4yTUmR" } // 7. 원고
    ];
    
    // [신규] 이미지 로드 함수 (개별 로드)
    function loadIconImage(icon) {
        if (!iconImages[icon.id]) {
            iconImages[icon.id] = new Image();
            iconImages[icon.id].src = icon.src;
        }
    }
    
    // [수정] 2단계 목록(7개)에 있는 모든 이미지를 미리 로드
    level2Items.forEach(icon => loadIconImage(icon));


    // --- 3. 게임 상태 변수 ---
    let board = [];
    let currentPiece = null; 
    let nextPiece = null;
    let score = 0;
    let gameOver = false;
    let isPaused = false; 
    let gameLoopId = null; 
    let lastDropTime = 0;
    let dropInterval = 1000;
    let isCheckingConnections = false;
    let particles = []; 
    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let longPressTimer = null; 
    let softDropInterval = null; 
    let winConfirmationShown = false; 
    
    // [신규] 현재 게임에서 사용할 아이템 목록 (기본값: 1단계)
    let currentItemSet = level1Items;
    
    // [신규] Puyo Puyo 스타일 "흔들림" 효과를 위한 프레임 카운터
    let animationFrameCounter = 0;

    // --- 4. 메인 함수 (초기화, 중지) ---

    initChapter4Game = function() {
        // [수정] 챕터 4 진입 시, 팝업이 잘 보이도록 패딩 0 클래스(ch4-intro-visible)를 붙입니다.
        $ch4Container.addClass('ch4-intro-visible');

        if ($canvas.length === 0) {
            console.error("챕터 4 캔버스를 찾을 수 없습니다.");
            return; 
        }
        ctx = $canvas.get(0).getContext('2d');
        
        $canvas.hide();
        $hud.hide();
        $ch4PauseBtn.hide(); 

        $nextPreviewContainer.empty().append($nextPreviewCanvas);
        nextCtx = $nextPreviewCanvas.get(0).getContext('2d');

        board = createEmptyBoard();
        score = 0;
        gameOver = false;
        isPaused = false;
        dropInterval = 1000;
        particles = [];
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
        
        $ch4StartBtn.off().on('click', startChapter4Game); 
        $ch4IntroSkipBtn.off().on('click', skipChapter4); 
        $ch4PauseBtn.off().on('click', showPauseModal); 
    };
    
    function startChapter4Game() {
        $ch4StoryIntro.fadeOut(300, function() {
            
            // [수정] 게임이 '진짜' 시작되면, 패딩 0 클래스를 제거해서 캔버스가 중앙에 오도록 합니다.
            $ch4Container.removeClass('ch4-intro-visible');

            // 1. 캔버스 크기를 화면에 맞게 계산하고 설정
            calculateAndSetCanvasSize(); 
            
            // 2. 다른 UI 요소들 나타나게 함
            $hud.fadeIn(300);
            $ch4PauseBtn.fadeIn(300); 
            
            // 3. 캔버스가 fadeIn 완료되면 게임 시작
            $canvas.fadeIn(300, function() {
                
                // --- 4. 게임 시작 로직 ---
                board = createEmptyBoard();
                score = 0;
                gameOver = false;
                isPaused = false;
                isCheckingConnections = false;
                dropInterval = 1000;
                particles = [];
                winConfirmationShown = false; 
                animationFrameCounter = 0; // [신규] 애니메이션 카운터 리셋
                $scoreEl.text(score); 

                // [수정] 게임 시작 시 항상 1단계(6개) 아이템으로 리셋
                currentItemSet = level1Items;
                
                nextPiece = createNewPiece();
                currentPiece = createNewPiece();
                drawNextPiece(); 
                
                $(document).off('.memorydrop').on('keydown.memorydrop', handleInput);

                // [수정] 터치 리스너를 $canvas가 아닌 $ch4Container에 등록
                $ch4Container.off('.memorydrop');
                $ch4Container.on('touchstart.memorydrop', handleTouchStart);
                $ch4Container.on('touchend.memorydrop', handleTouchEnd);
                $ch4Container.on('touchcancel.memorydrop', handleTouchEnd); 

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
        $ch4Container.off('.memorydrop'); // [수정] $canvas -> $ch4Container
        $(window).off('.memorydrop-resize'); 
        
        $ch4PauseBtn.off('click', showPauseModal); 
        
        if (longPressTimer) clearTimeout(longPressTimer);
        if (softDropInterval) clearInterval(softDropInterval);
        longPressTimer = null;
        softDropInterval = null;
        
        $ch4StoryIntro.hide(); 
    };

    // --- 4.5 캔버스 크기 계산 함수 ---
    
    function calculateAndSetCanvasSize() {
        const $container = $canvas.parent(); // #chapter4-container
        const $hud = $('#ch4-hud');
        // [삭제] $skipBtn은 이제 레이아웃에 영향을 주지 않음

        // 다른 UI 요소가 보여야 정확한 높이 계산 가능
        $hud.show(); 
        
        const containerWidth = $container.width();
        const containerHeight = $container.height();
        
        // [수정] $hud.outerHeight(true)가 버튼 높이까지 포함하여 계산함
        const hudHeight = $hud.outerHeight(true) || 60; 
        
        // [수정] 캔버스 크기를 키우기 위해 상하 여백을 10px로 최소화
        const topPadding = ($container.css('padding-top') ? parseInt($container.css('padding-top'), 10) : 10);
        const bottomMargin = 10; 
        
        const availableWidth = containerWidth;
        // [수정] 사용 가능한 높이 재계산 (skipBtn 관련 변수 제거)
        const availableHeight = containerHeight - topPadding - hudHeight - bottomMargin;

        const sizeFromWidth = Math.floor(availableWidth / COLS);
        const sizeFromHeight = Math.floor(availableHeight / ROWS);

        BLOCK_SIZE = Math.min(sizeFromWidth, sizeFromHeight);
        BLOCK_SIZE = Math.max(20, Math.min(50, BLOCK_SIZE)); 

        const canvasWidth = BLOCK_SIZE * COLS;
        const canvasHeight = BLOCK_SIZE * ROWS;
        
        $canvas.attr('width', canvasWidth);
        $canvas.attr('height', canvasHeight);
        
        // [수정] 캔버스 크기를 CSS 박스(60px)에 맞추고
        // NEXT_BLOCK_SIZE를 캔버스 크기에 맞춰 역산합니다. (유저 요청)
        const nextCanvasSize = 60; // CSS와 동일하게 60px
        $nextPreviewCanvas.attr('width', nextCanvasSize);
        $nextPreviewCanvas.attr('height', nextCanvasSize);
        
        // 캔버스(60px) 안에 블록 2개가 들어가야 하므로, 
        // 블록 하나 크기는 2.5로 나눈 값 (24px)
        NEXT_BLOCK_SIZE = Math.floor(nextCanvasSize / 2.5); // 24px
    }

    // --- [신규] 4.6 일시정지/재개 로직 ---
    
    function pauseGame() {
        isPaused = true;
        
        // 롱 프레스가 진행 중이었다면 즉시 중지
        if (longPressTimer) clearTimeout(longPressTimer);
        if (softDropInterval) clearInterval(softDropInterval);
        longPressTimer = null;
        softDropInterval = null;
    }

    function resumeGame() {
        isPaused = false;
        gameOver = false; // [오류 수정] gameOver 상태도 함께 해제
        
        // [수정] 터치 리스너를 $ch4Container에 다시 등록
        $(document).off('.memorydrop').on('keydown.memorydrop', handleInput);
        $ch4Container.off('.memorydrop');
        $ch4Container.on('touchstart.memorydrop', handleTouchStart);
        $ch4Container.on('touchend.memorydrop', handleTouchEnd);
        $ch4Container.on('touchcancel.memorydrop', handleTouchEnd);

        lastDropTime = Date.now(); // [중요] 멈춘 시간만큼 블록이 떨어지지 않도록 시간 초기화
        gameLoop(); // 게임 루프 재시작
    }

    function showPauseModal() {
        if (gameOver) return; // 게임오버/클리어 시엔 팝업 안 뜸
        
        pauseGame(); // 팝업이 뜨는 즉시 게임 정지

        if (typeof showModal === 'function') {
            showModal("일시 정지<br>어떻게 하시겠습니까?", {
                showStart: true, startText: '계속하기', 
                onStart: () => {
                    hideModal(); // 모달 닫고
                    resumeGame(); // 게임 재개
                },
                showSkip: true, skipText: '그만하기', 
                onSkip: skipChapter4, // '넘어가기' 함수 호출
                hideClose: false, // 바깥 클릭 시 닫기
                onClose: () => {
                    resumeGame(); // 바깥 클릭해도 게임 재개
                }
            });
        }
    }


    // --- 5. 게임 루프 및 핵심 로직 ---

    function gameLoop() {
        // [수정] isPaused가 true이거나 gameOver가 true이면 루프 중단
        if (isPaused || gameOver) {
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            gameLoopId = null;
            return;
        }
        
        // [신규] 애니메이션 카운터 업데이트
        animationFrameCounter = (animationFrameCounter + 1) % 360; // 360 프레임마다 반복
        
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
        if (isPaused || !currentPiece) return;
        const testPiece = { ...currentPiece, y: currentPiece.y + 1 };
        
        if (!checkCollision(testPiece)) {
            currentPiece.y++;
        } else {
            placePieceOnBoard(); 
        }
    }

    async function placePieceOnBoard() {
        if (!currentPiece) return;

        // [버그 수정] 조각이 착지하는 순간, 진행 중이던 모든 롱프레스/소프트드롭 타이머를 강제 종료
        if (longPressTimer) clearTimeout(longPressTimer);
        if (softDropInterval) clearInterval(softDropInterval);
        longPressTimer = null;
        softDropInterval = null;

        currentPiece.pieces.forEach(p => {
            const boardX = currentPiece.x + p.x;
            const boardY = currentPiece.y + p.y;
            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                board[boardY][boardX] = p.id;
            }
        });
        
        currentPiece = null;
        applyGravityToBoard();
        if (!isPaused) drawGame(); // 정지 상태에서 그리지 않음
        await sleep(100); 

        if (isPaused) return; // 중력 적용 직후 정지됐다면 연산 중지

        isCheckingConnections = true; 
        let chainCount = 0;
        let connectionsFound = true;
        
        while (connectionsFound) {
            if (isPaused) { // 연쇄 도중 정지됐다면 중단
                isCheckingConnections = false;
                return;
            }
            
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
                
                if (!isPaused) drawGame(); 
                await sleep(300); 

                if (isPaused) { // 대기 후 정지됐다면 중단
                    isCheckingConnections = false;
                    return;
                }

                applyGravityToBoard();
                if (!isPaused) drawGame(); 
                await sleep(300);
                connectionsFound = true; 
            } else {
                connectionsFound = false;
            }
        }
        
        isCheckingConnections = false; 

        if (isPaused) return; // 다음 블록 나오기 전 정지

        currentPiece = nextPiece;
        nextPiece = createNewPiece();
        drawNextPiece();
        
        // [수정] 게임 오버 로직 변경
        if (checkCollision(currentPiece)) {
            gameOver = true;
            stopChapter4Game();
            
            // 이미 목표 점수를 달성했다면(winConfirmationShown), 
            // 게임 오버 대신 '챕터 스킵/클리어' 팝업을 띄웁니다.
            if (winConfirmationShown) {
                skipChapter4(); // "기억 조각 발견!" 팝업 호출
            } else {
                showGameOverModal(); // 1000점 전에 게임 오버되면 "GAME OVER" 팝업 호출
            }
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
        
        // 1. 픽셀 아트 뭉개짐 방지 (기존 코드)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 2. 캔버스 전체 지우기 (기존 코드)
        ctx.clearRect(0, 0, $canvas.attr('width'), $canvas.attr('height'));
        
        // 3. 캔버스 배경색 칠하기 (기존 코드)
        ctx.fillStyle = 'rgba(0, 5, 20, 0.7)';
        ctx.fillRect(0, 0, $canvas.attr('width'), $canvas.attr('height'));

        // --- [핵심 수정] 배경 점선 그리드 그리기 ---
        const canvasWidth = $canvas.attr('width');
        const canvasHeight = $canvas.attr('height');

        ctx.save(); // 4. 현재 스타일 저장 (중요: 점선이 다른 그림에 영향 안 주게)
        
        // 5. 점선 스타일 설정 (HUD 라벨 색상 #9ab 기반)
        ctx.strokeStyle = 'rgba(150, 171, 187, 0.2)'; // 20% 투명도
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]); // 3px 그리고 4px 건너뛰는 점선

        ctx.beginPath(); // 6. 선 그리기 시작

        // 7. 세로 점선 그리기 (COLS - 1 개)
        for (let x = 1; x < COLS; x++) {
            const xPos = x * BLOCK_SIZE;
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, canvasHeight);
        }
        
        // 8. 가로 점선 그리기 (ROWS - 1 개)
        for (let y = 1; y < ROWS; y++) {
            const yPos = y * BLOCK_SIZE;
            ctx.moveTo(0, yPos);
            ctx.lineTo(canvasWidth, yPos);
        }
        
        ctx.stroke(); // 9. 모든 점선 한번에 그리기
        
        ctx.restore(); // 10. 저장했던 스타일 복원 (점선 끄기)
        // --- [핵심 수정] 끝 ---

        
        // 11. 보드 위의 블록들 그리기 (기존 코드)
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const id = board[y][x];
                if (id > 0) {
                    drawBlock(ctx, x, y, id, BLOCK_SIZE, 0, 0, true);
                }
            }
        }
        
        // 12. 현재 조작 중인 블록 그리기 (기존 코드)
        if (currentPiece) {
            currentPiece.pieces.forEach(p => {
                drawBlock(ctx, currentPiece.x + p.x, currentPiece.y + p.y, p.id, BLOCK_SIZE, 0, 0, true);
            });
        }
        
        // 13. 파티클 그리기 (기존 코드)
        drawParticles();
    }

    function drawNextPiece() {
        if (!nextCtx || !nextPiece) return;
        
        // [수정] "NEXT" 박스도 픽셀 아트가 뭉개지지 않도록 비활성화
        nextCtx.imageSmoothingEnabled = true;
        nextCtx.imageSmoothingQuality = 'high';
        
        const canvasWidth = $nextPreviewCanvas.attr('width');
        const canvasHeight = $nextPreviewCanvas.attr('height');
        
        nextCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        
        // [수정] 60px 캔버스에 24px 블록 2개를 중앙 정렬
        const startX = (canvasWidth / 2) - NEXT_BLOCK_SIZE; // (60 / 2) - 24 = 6
        const startY = (canvasHeight / 2) - (NEXT_BLOCK_SIZE / 2); // (60 / 2) - (24 / 2) = 18
        
        // [수정] 흔들림 효과(false)를 끈 상태(기본값)로 drawBlock 호출
        drawBlock(nextCtx, 0, 0, nextPiece.pieces[0].id, NEXT_BLOCK_SIZE, startX, startY);
        drawBlock(nextCtx, 1, 0, nextPiece.pieces[1].id, NEXT_BLOCK_SIZE, startX, startY);
    }

 // [수정] 둥근 사각형 클리핑 + 비율 유지 + 'Math.floor'로 반올림 오류 방지
    function drawBlock(targetCtx, x, y, id, size, offsetX = 0, offsetY = 0, enableBobbing = false) {
        let drawX = (x * size) + offsetX;
        let drawY = (y * size) + offsetY;

        // [삭제] 흔들림 로직은 제거된 상태입니다.
        
        targetCtx.save(); // 1. 캔버스 상태 저장

        // 2. 둥근 사각형 클리핑 경로 생성 (기존과 동일)
        const radius = size * 0.25; 
        const width = size;
        const height = size;

        targetCtx.beginPath();
        targetCtx.moveTo(drawX + radius, drawY);
        targetCtx.lineTo(drawX + width - radius, drawY);
        targetCtx.quadraticCurveTo(drawX + width, drawY, drawX + width, drawY + radius);
        targetCtx.lineTo(drawX + width, drawY + height - radius);
        targetCtx.quadraticCurveTo(drawX + width, drawY + height, drawX + width - radius, drawY + height);
        targetCtx.lineTo(drawX + radius, drawY + height);
        targetCtx.quadraticCurveTo(drawX, drawY + height, drawX, drawY + height - radius);
        targetCtx.lineTo(drawX, drawY + radius);
        targetCtx.quadraticCurveTo(drawX, drawY, drawX + radius, drawY);
        targetCtx.closePath();
        
        targetCtx.clip(); // 3. 클리핑 마스크 적용

        // --- [핵심 수정] 이미지 찌그러짐 방지 (기존과 동일) ---
        const img = iconImages[id];
        
        if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
            
            const imgWidth = img.naturalWidth;
            const imgHeight = img.naturalHeight;
            const ratio = Math.min(size / imgWidth, size / imgHeight);

            const renderWidth = imgWidth * ratio;
            const renderHeight = imgHeight * ratio;
            
            // [수정] 소수점 좌표를 방지하기 위해 Math.floor() 적용
            const renderX = Math.floor(drawX + (size - renderWidth) / 2);
            const renderY = Math.floor(drawY + (size - renderHeight) / 2);

            targetCtx.drawImage(img, renderX, renderY, renderWidth, renderHeight);

        } else {
            // 8. 대체 색상 그리기
            const colors = [
                '#7ECFFF', // 1. 라디오 (하늘 파랑)
                '#9FFFD9', // 2. 자전거 (라임 민트)
                '#FFB5C8', // 3. 매화 (코랄 핑크)
                '#FFF5A5', // 4. 농구공 (레몬 옐로우)
                '#C4AFF', // 5. 라피에검 (바이올렛)
                '#8EF4FF', // 6. 물고기 돌 (아쿠아 블루)
                '#E6B6FF'  // 7. 원고 (연퍼플)
            ];
            targetCtx.fillStyle = colors[id - 1] || 'grey';
            targetCtx.fillRect(drawX, drawY, size, size);
        }
        // --- [핵심 수정] 끝 ---

        targetCtx.restore(); // 9. 클리핑 해제
    }

    function createExplosion(x, y, id) {
        const centerX = (x + 0.5) * BLOCK_SIZE;
        const centerY = (y + 0.5) * BLOCK_SIZE;
        // [수정] 7가지 아이템 색상 팔레트 적용
        const colors = [
            '#7ECFFF', // 1. 라디오 (하늘 파랑)
            '#9FFFD9', // 2. 자전거 (라임 민트)
            '#FFB5C8', // 3. 매화 (코랄 핑크)
            '#FFF5A5', // 4. 농구공 (레몬 옐로우)
            '#C4A8FF', // 5. 라피에검 (바이올렛)
            '#8EF4FF', // 6. 물고기 돌 (아쿠아 블루)
            '#E6B6FF'  // 7. 원고 (연퍼플)
        ];
        const color = colors[id - 1] || 'white';

        // [수정] Puyo Puyo 스타일로 "팡!" 터지는 느낌
        for (let i = 0; i < 25; i++) { // 15 -> 25개 (더 풍성하게)
            particles.push({
                x: centerX, y: centerY,
                vx: (Math.random() - 0.5) * 12, // 8 -> 12 (더 빠르고 넓게)
                vy: (Math.random() - 0.5) * 12, // 8 -> 12
                size: Math.random() * (BLOCK_SIZE / 15) + 3, // 20 -> 15 (더 큰 입자)
                color: color,
                life: 40 // 30 -> 40 (더 오래 남음)
            });
            
            // [추가] 5개의 '섬광' 입자를 추가해서 "팡!"하는 느낌 강조
            if (i < 5) {
                particles.push({
                    x: centerX, y: centerY,
                    vx: (Math.random() - 0.5) * 6, // 섬광은 멀리 안 퍼짐
                    vy: (Math.random() - 0.5) * 6,
                    size: Math.random() * (BLOCK_SIZE / 10) + 4, // 섬광은 더 큼
                    color: '#FFFFFF', // 흰색!
                    life: 20 // 섬광은 짧게
                });
            }
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
        // [수정] iconSources 대신 currentItemSet을 사용
        const id1 = currentItemSet[Math.floor(Math.random() * currentItemSet.length)].id;
        const id2 = currentItemSet[Math.floor(Math.random() * currentItemSet.length)].id;
        return {
            x: Math.floor(COLS / 2) - 1, y: 0,
            pieces: [ { id: id1, x: 0, y: 0 }, { id: id2, x: 1, y: 0 } ], 
            rotation: 0 
        };
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
        if (isPaused || !currentPiece || isCheckingConnections) return;
        
        let testPiece = JSON.parse(JSON.stringify(currentPiece));
        while (!checkCollision({ ...testPiece, y: testPiece.y + 1 })) {
            testPiece.y++;
        }
        currentPiece = testPiece;
        placePieceOnBoard();
    }


    // --- 5.5 키보드/터치 입력 핸들러 ---
    
    function handleInput(e) {
        if (isPaused || gameOver || !currentPiece || isCheckingConnections) return;
        
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
                // drawGame(); // [오류 수정] 불필요한 중복 호출 제거
                return;
            case "ArrowUp":
                rotatePiece(testPiece);
                moved = true;
                break;
            case " ":
                // 하드 드롭(Hard Drop)을 위한 로직
                hardDrop();
                // drawGame(); // [오류 수정] 불필요한 중복 호출 제거
                return;
        }

        if (moved) {
            if (!checkCollision(testPiece)) {
                currentPiece = testPiece;
            }
            drawGame();
        }
    }


    function updateScoreAndEnergy(points, chain) {
        score += points;
        $scoreEl.text(score);
        
        // [수정] winConfirmationShown 플래그를 추가하여 팝업이 한 번만 뜨도록 함
        if (score >= WIN_SCORE && !gameOver && !winConfirmationShown) {
            winConfirmationShown = true; // [신규] 팝업을 띄웠다고 체크
            showWinConfirmation();
        }

        if (score > WIN_SCORE * 0.7) { dropInterval = 400; } 
        else if (score > WIN_SCORE * 0.4) { dropInterval = 700; }
    }

    function showWinConfirmation() {
        gameOver = true; // [수정] pause가 아니라 gameOver 플래그를 세움
        
        // 롱 프레스/터치 입력을 막음
        if (longPressTimer) clearTimeout(longPressTimer);
        if (softDropInterval) clearInterval(softDropInterval);
        $(document).off('.memorydrop'); // [오류 수정] 리스너를 팝업 전에 제거
        $ch4Container.off('.memorydrop'); // [수정] $canvas -> $ch4Container

        if (typeof showModal === 'function') {
            showModal("목표 점수 달성!<br>어떻게 하시겠습니까?", {
                showStart: true, startText: '조각 발견하기', 
                onStart: winGame, 
                
                showSkip: true, skipText: '계속 하기', 
                onSkip: () => {
                    hideModal(); 

                    // [수정] 2단계(7개) 아이템 목록으로 변경
                    currentItemSet = level2Items;
                    
                    resumeGame(); // 수정된 resumeGame이 게임을 재개시킴
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
            content: `“10년의 기억이 모여 빛이되었습니다.
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
        // [수정] 스킵할 때도 패딩 0 클래스를 제거합니다.
        $ch4Container.removeClass('ch4-intro-visible');

        stopChapter4Game();
        
        const chapter4Reward = {
            title: "🌌",
            content: `“10년의 기억이 모여 빛이 되었습니다.
            <br><br>
            이 빛은 우리가 함께 만든 은하.
            <br><br>
            이제 마지막 항해를 시작합니다.”`
        };

        function showChapter4ClearPopup() {
            showModal("챕터 4 '연결' 클리어!<br>다음 여정을 준비하세요.", {
                 showNext: true, nextChapterNum: 5,
                 showMap: true, hideClose: false, onClose: hideModal
             });
        }
        
        if (typeof showModal === 'function' && typeof showFragmentModal === 'function') {
            showModal("기억 조각 발견!<br>확인하시겠습니까?", {
                showStart: true, startText: '확인하기',
                onStart: () => {
                    showFragmentModal(chapter4Reward.title, chapter4Reward.content, () => {
                        showChapter4ClearPopup();
                    });
                },
                showSkip: true, skipText: '넘어가기',
                onSkip: () => {
                    showChapter4ClearPopup();
                },
                hideClose: false,
                onClose: hideModal 
            });
        }
    }


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- 6. 터치 핸들러 로직 (롱 프레스 / 탭) ---

    function handleTouchStart(e) {
        // [수정] 팝업이나 버튼을 눌렀을 때는 게임 조작이 안 되도록 막음
        const $target = $(e.target);
        if ($target.is('button') || $target.closest('.modal-overlay').length > 0 || $target.is('#ch4-pause-btn')) {
            return;
        }

        if (isPaused || gameOver || isCheckingConnections) return;
        e.preventDefault(); 
        
        const touch = e.touches[0] || e.originalEvent.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
        
        if (softDropInterval) clearInterval(softDropInterval);
        if (longPressTimer) clearTimeout(longPressTimer);

        longPressTimer = setTimeout(() => {
            softDropInterval = setInterval(() => {
                handleInput({ key: "ArrowDown" });
            }, SOFT_DROP_SPEED);
            
            longPressTimer = null; 
        }, LONG_PRESS_DURATION);
    }

    function handleTouchEnd(e) {
        // [수정] 팝업이나 버튼을 눌렀을 때는 게임 조작이 안 되도록 막음
        const $target = $(e.target) || $(e.srcElement);
         if ($target.is('button') || $target.closest('.modal-overlay').length > 0 || $target.is('#ch4-pause-btn')) {
            return;
        }

        if (isPaused || gameOver || isCheckingConnections || touchStartX === 0) return;
        e.preventDefault();
        
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

        if (duration < LONG_PRESS_DURATION) {
            
            if (duration < TAP_MAX_DURATION && 
                Math.abs(deltaX) < TAP_MAX_TRAVEL && 
                Math.abs(deltaY) < TAP_MAX_TRAVEL) {
                
                // [수정] 캔버스 기준이 아닌, '전체 화면' 기준으로 터치 영역을 계산
                const screenWidth = $(window).width();
                const tapX = touchEndX; 

                if (tapX < screenWidth * 0.4) {
                    // 왼쪽 40% 탭 = 왼쪽 이동
                    handleInput({ key: "ArrowLeft" });
                } else if (tapX > screenWidth * 0.6) {
                    // 오른쪽 40% 탭 = 오른쪽 이동
                    handleInput({ key: "ArrowRight" });
                } else {
                    // 중앙 20% 탭 = 회전 (유지)
                    handleInput({ key: "ArrowUp" });
                }
            }
        }

        touchStartX = 0;
        touchStartY = 0;
    }
    
    // --- 7. 화면 크기 변경 핸들러 ---
    
    function handleResize() {
        if (gameOver || !ctx) return; 

        pauseGame(); // [수정] 게임 정지
        
        if (typeof showModal === 'function' && typeof goToMap === 'function') {
            showModal("화면 크기가 변경되었습니다.<br>게임을 다시 시작해야 합니다.", {
                showStart: true, startText: '재시작', 
                onStart: () => {
                    // [수정] stop/start 대신 init/start를 호출하여 완전히 리셋
                    stopChapter4Game(); // 리스너 등 완전 정리
                    initChapter4Game(); // 재 초기화
                    startChapter4Game(); // 게임 시작
                },
                showSkip: true, skipText: '지도로 가기', 
                onSkip: goToMap,
                hideClose: true
            });
        }
    }

}); // $(document).ready 래퍼 닫기