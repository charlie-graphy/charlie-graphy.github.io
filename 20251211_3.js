// --- 챕터 3: 확장 (숨은 그림 찾기) 로직 ---
// 이 파일은 20251211.js에서 initChapter3Game()과 stopChapter3Game() 함수를 호출합니다.

// 1. 챕터 3 내부에서 사용할 DOM 요소 캐싱
const $ch3Container = $('#chapter3-container'); // 챕터 3의 메인 컨테이너
const $ch3StoryIntro = $('#ch3-story-intro'); // 인트로 화면
const $ch3StartBtn = $('#ch3-start-btn'); // 탐색 시작 버튼
const $ch3IntroSkipBtn = $('#ch3-intro-skip-btn'); // 인트로 넘어가기 버튼
const $ch3Prompt = $('#ch3-prompt'); // 프롬프트 컨테이너
const $ch3PromptText = $('#ch3-prompt-text span'); // 프롬프트 텍스트
const $ch3MapWrapper = $('#ch3-map-wrapper'); // [수정] 맵 래퍼 캐싱
const $ch3MapArea = $('#ch3-map-area');
const $ch3FogLayer = $('#ch3-fog-layer');
const $ch3Scanner = $('#ch3-scanner');
const $ch3SkipBtn = $('#ch3-skip-btn'); // (인게임) 넘어가기 버튼
const $ch3MiniMap = $('#ch3-mini-map'); // 미니맵
const $ch3MiniMapViewport = $('#ch3-mini-map-viewport'); // 미니맵 시야

// 2. 챕터 3 데이터 (총 10개의 아이템)
const chapter3AllItems = [
    { name: "rapier", prompt: "라피에 검", x: 400, y: 500, img: "https://lh3.googleusercontent.com/d/1iV8cFHpJF8dbBrE9WuR8QL9bvCvcUTkt" },
    { name: "basketball", prompt: "농구공", x: 1500, y: 800, img: "https://lh3.googleusercontent.com/d/1E2X0OiY2Nx2WXZph0alj1vfHMrtleZBK" },
    { name: "radio", prompt: "라디오", x: 800, y: 2000, img: "https://lh3.googleusercontent.com/d/1_48vHjQl3PZJZGNhgVDIO3rKNZZnpNak" },
    { name: "fishstone", prompt: "물고기 돌", x: 2300, y: 1700, img: "https://lh3.googleusercontent.com/d/15dGFqHvAa7zLeCJOr8i9_q_PsBJ162R6" },
    { name: "plumblossom", prompt: "매화", x: 1200, y: 1200, img: "https://lh3.googleusercontent.com/d/1fw0n2SsBAODWS_UQjB8gxbsJHXy3edc5" },
    { name: "bicycle", prompt: "자전거", x: 200, y: 1500, img: "https://lh3.googleusercontent.com/d/1dT3wFKqge3ADj8irrQs89JhRxiVSbYdy" },
    { name: "fullmoon", prompt: "보름달", x: 1800, y: 300, img: "https://lh3.googleusercontent.com/d/1Xe2bpLmvkkgTkCCjj1KdTnnimXPmbLhP" },
    { name: "script", prompt: "원고", x: 600, y: 1000, img: "https://lh3.googleusercontent.com/d/1wTMP8T9fQ422Qlue1Mrrrx8d2LkK7Bto" },
    { name: "goldenbird", prompt: "금빛 새", x: 2100, y: 500, img: "https://lh3.googleusercontent.com/d/1mlFnB2d91WZO93sdbQSfOY7XhMSRIT6h" },
    { name: "sugarcube", prompt: "각설탕", x: 1000, y: 2300, img: "https://lh3.googleusercontent.com/d/1uyYBVKV3NwCQVqzQE_nodcZPllkOQcBS" }
];

// 3. 챕터 3 게임 설정
const NUM_ITEMS_TO_FIND = 4; // 찾아야 할 아이템 개수
const chapter3Reward = {
    title: "확장",
    content: `“우리가 탐험하지 않은 우주는 
사라져버린 시간과 같아서
그곳엔 무엇이 있는지도 모르고
그저 존재하지 않는 게 되어버려”
.
“보이지 않는다고 존재하지 않는 건 아니야.
단지 우리가 발견하지 못했을 뿐.”
.
“안개를 걷어내자 그곳엔 언제나
빛나고 있던 너의 우주가 있었다.”`
};

// // 4. 챕터 3 상태 변수
let ch3ItemsToFind = []; // 현재 게임에서 찾아야 할 아이템 (랜덤 4개)
let ch3CurrentItem = null; // 현재 제시된 아이템
let isCh3Dragging = false;
let ch3DragStartPos = { x: 0, y: 0 };
let ch3FoundItemsCount = 0; // 찾은 아이템 개수 카운터
let ch3MapSize = { w: 2400, h: 2500 }; // [수정] 맵 크기 (CSS와 동일하게)
let ch3MiniMapSize = { w: 80, h: 80 }; // 미니맵 크기 (CSS와 동일하게)

//5. [핵심] 챕터 3 게임 초기화 함수 (메인 JS에서 호출)
function initChapter3Game() {
 ch3FoundItemsCount = 0; // 게임 시작 시 초기화
 
 // [수정] 챕터 3 컨테이너를 '인트로' 상태로 되돌림 (padding 복구)
 $ch3Container.removeClass('game-started');

 // 맵 배경 이미지 설정
 const bgImgUrl = $ch3MapArea.data('background-img');
 const mapElement = $ch3MapArea.get(0);
 if (bgImgUrl) {
     mapElement.style.setProperty('--ch3-bg-image', `url(${bgImgUrl})`);
     mapElement.style.setProperty('--ch3-bg-size', 'cover');
     mapElement.style.setProperty('--ch3-bg-animation', 'none');
     mapElement.style.backgroundRepeat = 'no-repeat';
 }

 // 맵/미니맵 클리어
 $ch3MapArea.find('.ch3-item, .ch3-clear-spot').remove(); 
 $ch3MiniMap.find('.ch3-mini-map-item-dot').remove(); 

 // 맵 크기 갱신
 ch3MiniMapSize = { w: 80, h: 80 }; // [수정] JS가 80으로 값을 알게 함
 
//1. 10개의 아이템을 맵에 *랜덤으로* 배치
 const itemWidth = 80; // 아이템 너비 (CSS와 동일)
 const itemHeight = 80; // 아이템 높이 (CSS와 동일)

 chapter3AllItems.forEach(item => {
     // [수정] 하드코딩된 x, y 대신 랜덤 좌표 생성
     // (맵 크기 - 아이템 크기) 범위 내에서 랜덤 위치를 정합니다.
     const randomX = Math.floor(Math.random() * (ch3MapSize.w - itemWidth));
     const randomY = Math.floor(Math.random() * (ch3MapSize.h - itemHeight));

     // 메인 맵에 아이템 추가
     const $item = $(`<div class="ch3-item"></div>`);
     $item.css({
         left: `${randomX}px`, // 랜덤 X좌표 적용
         top: `${randomY}px`, // 랜덤 Y좌표 적용
         'background-image': `url(${item.img})`
     });
     $item.data('name', item.name);
     $ch3MapArea.append($item);
     
     // 미니맵에 '희미한 점' 추가 (새 랜덤 좌표 기준으로)
     addDotToMiniMap(randomX + (itemWidth / 2), randomY + (itemHeight / 2), item.name);
 });

 // 2. 10개 중 4개만 랜덤으로 골라서 "찾아야 할 목록" 생성
 const shuffledItems = [...chapter3AllItems].sort(() => 0.5 - Math.random());
 ch3ItemsToFind = shuffledItems.slice(0, NUM_ITEMS_TO_FIND); 

 //3. 맵 중앙 스크롤 (인트로 화면용)
 const screenWidth = $ch3Container.width();
 const screenHeight = $ch3Container.height();
 $ch3Container.scrollLeft((ch3MapSize.w - screenWidth) / 2);
 $ch3Container.scrollTop((ch3MapSize.h - screenHeight) / 2);

 // 4. 게임 요소는 모두 숨기고, 인트로 화면만 표시
 $ch3Prompt.hide();
 $ch3SkipBtn.hide();
 $ch3MapWrapper.hide(); // [수정] 맵 래퍼를 숨김 (레이아웃 버그 수정)
 $ch3MiniMap.hide(); 
 $ch3StoryIntro.hide().fadeIn(500); // 인트로 보이기

 // 5. 버튼 이벤트 핸들러 설정
 $ch3StartBtn.off().on('click', startChapter3Game);
 $ch3IntroSkipBtn.off().on('click', skipChapter3);
 $ch3SkipBtn.off().on('click', skipChapter3);
}

//6. 실제 게임 시작 함수
function startChapter3Game() {
    $ch3StoryIntro.fadeOut(300, function() {
        $(this).hide();
        
        // [수정] 챕터 3 컨테이너를 '게임 시작' 상태로 변경 (padding 제거 등)
        $ch3Container.addClass('game-started');
        
        $ch3MapWrapper.show(); // [수정] 맵 래퍼를 보여줌
        $ch3Prompt.fadeIn(300);
        $ch3SkipBtn.fadeIn(300);
        $ch3MiniMap.fadeIn(300); 
        
        // [추가] 맵이 표시된 직후 스크롤을 (0, 0)으로 강제 이동
        setTimeout(function() {
            $ch3Container.scrollLeft(0);
            $ch3Container.scrollTop(0);
            updateMiniMapViewport(); // 스크롤 이동 후 미니맵 갱신
        }, 50); // 50ms 딜레이로 렌더링 보장
        
        setupChapter3Listeners(); // 게임 이벤트 리스너 시작
        nextCh3Item(); // 첫 번째 아이템 제시
    });
}

// 7. 챕터 3 게임 중지 함수 (메인 JS에서 호출)
function stopChapter3Game() {
    $ch3Container.off('.ch3game');
    $ch3MapArea.off('.ch3game');
    $ch3Scanner.hide();
    $ch3StoryIntro.hide();
    $ch3MiniMap.hide(); 
    
    // [수정] 챕터 3 컨테이너를 '인트로' 상태로 되돌림
    $ch3Container.removeClass('game-started');
    
    const mapElement = $ch3MapArea.get(0);
    mapElement.style.removeProperty('--ch3-bg-image');
    mapElement.style.removeProperty('--ch3-bg-size');
    mapElement.style.removeProperty('--ch3-bg-animation');
    mapElement.style.removeProperty('background-repeat');
}

// 8. 챕터 3 다음 아이템 제시
function nextCh3Item() {
    if (ch3FoundItemsCount >= NUM_ITEMS_TO_FIND) {
        clearChapter3(); return;
    }
    if (ch3ItemsToFind.length > 0) {
        ch3CurrentItem = ch3ItemsToFind.shift();
        $ch3PromptText.text(ch3CurrentItem.prompt);
        
        // [신규] 미니맵 타겟팅 로직
        $ch3MiniMap.find('.ch3-mini-map-item-dot').removeClass('target'); // 모든 점 깜빡임 끄기
        // 현재 아이템의 점만 깜빡이게
        $ch3MiniMap.find(`.ch3-mini-map-item-dot[data-name="${ch3CurrentItem.name}"]`).addClass('target');
        
    } else {
        clearChapter3();
    }
}

// 9. 챕터 3 클리어 (로직 동일)
function clearChapter3() {
    stopChapter3Game(); // 이벤트 리스너 제거
    
    showModal("신호를 다 찾았습니다!<br>기억의 조각을 발견했습니다!", {
        showStart: true,
        startText: '확인하기',
        onStart: () => {
            showFragmentModal(chapter3Reward.title, chapter3Reward.content, () => {
                showModal("챕터 3 '확장' 클리어!<br>다음 여정을 준비하세요.", {
                     showNext: true, nextChapterNum: 4,
                     showMap: true,
                     hideClose: false,
                     onClose: hideModal
                 });
            });
        },
        showSkip: true,
        skipText: '넘어가기',
        onSkip: () => {
             showModal("챕터 3 '확장' 클리어!<br>다음 여정을 준비하세요.", {
                 showNext: true, nextChapterNum: 4,
                 showMap: true,
                 hideClose: false,
                 onClose: hideModal
             });
        },
        hideClose: false,
        onClose: hideModal
    });
}

// 10. 챕터 3 스킵 함수 (로직 동일)
function skipChapter3() {
    showModal("기억 조각 발견!<br>확인하시겠습니까?", {
         showStart: true, startText: '확인하기',
         onStart: () => {
             showFragmentModal(chapter3Reward.title, chapter3Reward.content, () => {
                 showModal("챕터 3 '확장' 클리어!<br>다음 여정을 준비하세요.", {
                     showNext: true, nextChapterNum: 4,
                     showMap: true,
                     hideClose: false,
                     onClose: hideModal
                 });
             });
         },
         showSkip: true, skipText: '넘어가기',
         onSkip: () => {
             showModal("챕터 3 '확장' 클리어!<br>다음 여정을 준비하세요.", {
                 showNext: true, nextChapterNum: 4,
                 showMap: true,
                 hideClose: false,
                 onClose: hideModal
             });
         },
         hideClose: false,
         onClose: () => { /* No action */ }
    });
}


// 11. 챕터 3 이벤트 리스너 설정
function setupChapter3Listeners() {
    $ch3Container.off('.ch3game'); // 중복 방지
    $ch3MapArea.off('.ch3game');

    // 맵 스크롤 시 미니맵 시야 업데이트
    $ch3Container.on('scroll.ch3game', updateMiniMapViewport);

    // 1. 스캐너/드래그 (PC + 모바일)
    $ch3Container.on('pointerdown.ch3game', function(e) {
        if ($(e.target).is('.ch3-item') || $(e.target).is('#ch3-skip-btn')) {
             isCh3Dragging = false; return;
        }
        isCh3Dragging = true;
        ch3DragStartPos.x = e.clientX;
        ch3DragStartPos.y = e.clientY;
         $ch3Scanner.css({ display: 'block', left: `${e.clientX}px`, top: `${e.clientY}px` });
    }).on('pointermove.ch3game', function(e) {
        $ch3Scanner.css({ display: 'block', left: `${e.clientX}px`, top: `${e.clientY}px` });
        
        if (isCh3Dragging) {
            const deltaX = e.clientX - ch3DragStartPos.x;
            const deltaY = e.clientY - ch3DragStartPos.y;
            
            $ch3Container.scrollLeft($ch3Container.scrollLeft() - deltaX);
            $ch3Container.scrollTop($ch3Container.scrollTop() - deltaY);
            
            ch3DragStartPos.x = e.clientX;
            ch3DragStartPos.y = e.clientY;
            
            // [수정] 드래그할 때마다 미니맵 강제 업데이트! (모바일 버그 수정)
            updateMiniMapViewport(); 
        }
    }).on('pointerup.ch3game pointerleave.ch3game', function() {
        isCh3Dragging = false;
        $ch3Scanner.css('display', 'none'); 
    });

    // 2. 아이템 클릭
    $ch3MapArea.on('click.ch3game', '.ch3-item', function(e) {
        const $clickedItem = $(this);
        const itemName = $clickedItem.data('name');

        // [수정] 클릭한 아이템이 '현재 찾아야 할' 아이템인지 확인
        if (ch3CurrentItem && itemName === ch3CurrentItem.name) {
            // 정답!
            $clickedItem.addClass('found'); // (이미 찾은 아이템은 다시 클릭 안 되게)
            ch3FoundItemsCount++; // 찾은 아이템 개수 증가

            const itemPos = $clickedItem.position();
            const itemWidth = $clickedItem.width();
            const itemHeight = $clickedItem.height();
            const clearSpotX = itemPos.left + (itemWidth / 2);
            const clearSpotY = itemPos.top + (itemHeight / 2);

            // 안개 걷어내기
            const $clearSpot = $(`<div class="ch3-clear-spot"></div>`);
            $clearSpot.css({ left: `${clearSpotX}px`, top: `${clearSpotY}px` });
            
             const $revealedImage = $(`<div class="ch3-item-image-revealed"></div>`);
             $revealedImage.css('background-image', $clickedItem.css('background-image'));
             $clearSpot.append($revealedImage);
            $ch3MapArea.append($clearSpot);
            
            // [수정] 미니맵에 '찾았음' 표시 (깜빡임 끄고, found 켜기)
            $ch3MiniMap.find(`.ch3-mini-map-item-dot[data-name="${itemName}"]`).removeClass('target').addClass('found');
            
            //[신규] 남은 아이템들 위치 셔플!
            shuffleRemainingItems();
            
            // 다음 아이템 제시
            nextCh3Item();
        } else if (!ch3CurrentItem || !$clickedItem.hasClass('found')) {
            // 오답 (단, 이미 찾은 아이템(정답)을 다시 누른 경우는 제외)
            $clickedItem.css('animation', 'shake 0.5s');
            setTimeout(() => $clickedItem.css('animation', ''), 500);
        }
    });
}

// 12. 미니맵 시야(Viewport) 업데이트 함수
function updateMiniMapViewport() {
    // [수정] 버그 수정! ch3MiniMapSize.w/h가 0이 되는 문제 해결
    const ratioX = ch3MiniMapSize.w / ch3MapSize.w; 
    const ratioY = ch3MiniMapSize.h / ch3MapSize.h;
    
    const viewW = $ch3Container.width();
    const viewH = $ch3Container.height();
    const scrollL = $ch3Container.scrollLeft();
    const scrollT = $ch3Container.scrollTop();
    
    const markerW = viewW * ratioX;
    const markerH = viewH * ratioY;
    const markerL = scrollL * ratioX;
    const markerT = scrollT * ratioY;

    $ch3MiniMapViewport.css({
        width: `${markerW}px`,
        height: `${markerH}px`,
        left: `${markerL}px`,
        top: `${markerT}px`
    });
}

//13. 미니맵에 '초기 점' 찍는 함수
function addDotToMiniMap(centerX, centerY, itemName) { 
    // [수정] 버그 수정! ch3MiniMapSize.w/h가 0이 되는 문제 해결
    const ratioX = ch3MiniMapSize.w / ch3MapSize.w;
    const ratioY = ch3MiniMapSize.h / ch3MapSize.h;
    
    // [수정] 중앙 좌표를 기준으로 점 위치 계산
    const dotL = centerX * ratioX;
    const dotT = centerY * ratioY;

    // 점 생성 및 추가
    const $dot = $(`<div class="ch3-mini-map-item-dot"></div>`);
    $dot.css({
        left: `${dotL}px`,
        top: `${dotT}px`
    });
    
    // [수정] .data() 대신 .attr()을 사용해야 미니맵 셔플이 작동합니다
    $dot.attr('data-name', itemName); 
    
    $ch3MiniMap.append($dot);
}

/**
 * [신규] 남은 아이템 위치 셔플 함수
 * 'found' 클래스가 없는 모든 아이템의 맵/미니맵 위치를
 * "찾은" 아이템과 겹치지 않게 재배치합니다.
 */
function shuffleRemainingItems() {
    console.log('Shuffling remaining items... (Avoiding found items)'); 
    
    const itemWidth = 80; 
    const itemHeight = 80;
    // [신규] 겹쳤다고 판단할 최소 거리 (아이템 너비/높이)
    const minDistance = Math.max(itemWidth, itemHeight); 

    const ratioX = ch3MiniMapSize.w / ch3MapSize.w;
    const ratioY = ch3MiniMapSize.h / ch3MapSize.h;

    // 1. "찾은" 아이템들의 *현재* 중앙 위치 목록을 가져옴
    const $foundItems = $ch3MapArea.find('.ch3-item.found');
    const foundPositions = [];
    $foundItems.each(function() {
        const pos = $(this).position(); // { top: Y, left: X }
        foundPositions.push({
            // 중앙 좌표를 저장
            x: pos.left + (itemWidth / 2),
            y: pos.top + (itemHeight / 2)
        });
    });

    // 2. "아직 찾지 못한" 아이템들을 루프
    const $remainingItems = $ch3MapArea.find('.ch3-item:not(.found)');

    $remainingItems.each(function() {
        const $item = $(this);
        const itemName = $item.data('name');
        
        let randomX, randomY;
        let newCenterX, newCenterY;
        let isSafe = false;
        let attempts = 0;
        const maxAttempts = 50; // 무한 루프 방지

        // 3. "안전한" (겹치지 않는) 위치를 찾을 때까지 (or 50번 시도할 때까지) 반복
        while (!isSafe && attempts < maxAttempts) {
            // 새 랜덤 좌표 생성
            randomX = Math.floor(Math.random() * (ch3MapSize.w - itemWidth));
            randomY = Math.floor(Math.random() * (ch3MapSize.h - itemHeight));
            newCenterX = randomX + (itemWidth / 2);
            newCenterY = randomY + (itemHeight / 2);
            
            isSafe = true; // 일단 안전하다고 가정
            
            // 4. 모든 "찾은" 아이템 위치와 거리 비교
            for (const foundPos of foundPositions) {
                const distance = Math.hypot(newCenterX - foundPos.x, newCenterY - foundPos.y);
                
                if (distance < minDistance) {
                    isSafe = false; // 겹침!
                    break; // 이 위치는 실패. for 루프 중단.
                }
            }
            attempts++;
        } // while 루프: isSafe가 true가 아니면 (겹쳤으면) 다시 시도

        if (attempts >= maxAttempts) {
             console.warn(`Could not find a safe spot for ${itemName}. Placing anyway.`);
        }

        // 5. "안전한" (또는 50번 시도한) 위치로 아이템 이동
        $item.css({
            left: `${randomX}px`,
            top: `${randomY}px`
        });

        // 6. 미니맵 점도 이동
        const $dot = $ch3MiniMap.find(`.ch3-mini-map-item-dot[data-name="${itemName}"]`);
        if ($dot.length > 0) {
            // [수정] addDotToMiniMap과 동일하게 중앙 좌표 기준으로 계산
            const dotL = newCenterX * ratioX;
            const dotT = newCenterY * ratioY;
            
            $dot.css({
                left: `${dotL}px`,
                top: `${dotT}px`
            });
        }
    });
}