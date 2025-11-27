// [수정] HTML이 모두 로드된 후 스크립트가 실행되도록 $(document).ready로 감쌉니다.
$(document).ready(function() {

    // --- 1. 챕터 3 내부에서 사용할 DOM 요소 캐싱 ---
    // (이제 이 시점에는 HTML 요소들이 모두 로드되어 있습니다!)
    const $ch3Container = $('#chapter3-container');
    const $ch3StoryIntro = $('#ch3-story-intro');
    const $ch3StartBtn = $('#ch3-start-btn');
    const $ch3IntroSkipBtn = $('#ch3-intro-skip-btn');
    const $ch3Prompt = $('#ch3-prompt');
    const $ch3PromptText = $('#ch3-prompt-text span');
    const $ch3MapWrapper = $('#ch3-map-wrapper');
    const $ch3MapArea = $('#ch3-map-area');
    const $ch3FogLayer = $('#ch3-fog-layer'); // (안개는 현재 미사용)
    const $ch3Scanner = $('#ch3-scanner');
    const $ch3SkipBtn = $('#ch3-skip-btn');
    const $ch3MiniMap = $('#ch3-mini-map');
    const $ch3MiniMapViewport = $('#ch3-mini-map-viewport');

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
    const NUM_ITEMS_TO_FIND = 4;
    const chapter3Reward = {
        title: "🌕",
        content: `“어쩌면 새로운 별을 발견하게 될지도 모르지”
.
.
“가자. 우리 달에 첫 발을 내딛는 거야
.
여긴 우리가 제일 처음 도착한 곳이야
그러니까 아직 모든 것들의 이름이 없대
우선 여긴 뭐라고 부를까?”
.
.
“이 달에서 가장 화창하게 살 것 같은 이름이야”`
    };

    // 4. 챕터 3 상태 변수
    let ch3ItemsToFind = [];
    let ch3CurrentItem = null;
    let isCh3Dragging = false;
    let ch3DragStartPos = { x: 0, y: 0 };
    let ch3FoundItemsCount = 0;
    let ch3MapSize = { w: 2400, h: 2500 };
    let ch3MiniMapSize = { w: 80, h: 80 };

    // 5. [핵심] 챕터 3 게임 초기화 함수 (전역 할당)
    initChapter3Game = function() {
     ch3FoundItemsCount = 0;
     
     $ch3Container.removeClass('game-started');

     const bgImgUrl = $ch3MapArea.data('background-img');
     const mapElement = $ch3MapArea.get(0);
     if (bgImgUrl) {
         mapElement.style.setProperty('--ch3-bg-image', `url(${bgImgUrl})`);
         mapElement.style.setProperty('--ch3-bg-size', 'cover');
         mapElement.style.setProperty('--ch3-bg-animation', 'none');
         mapElement.style.backgroundRepeat = 'no-repeat';
     }

     $ch3MapArea.find('.ch3-item, .ch3-clear-spot').remove(); 
     $ch3MiniMap.find('.ch3-mini-map-item-dot').remove(); 

     ch3MiniMapSize = { w: 80, h: 80 };
     
     const itemWidth = 80;
     const itemHeight = 80;

     chapter3AllItems.forEach(item => {
         const randomX = Math.floor(Math.random() * (ch3MapSize.w - itemWidth));
         const randomY = Math.floor(Math.random() * (ch3MapSize.h - itemHeight));

         const $item = $(`<div class="ch3-item"></div>`);
         $item.css({
             left: `${randomX}px`,
             top: `${randomY}px`,
             'background-image': `url(${item.img})`
         });
         $item.data('name', item.name);
         $ch3MapArea.append($item);
         
         addDotToMiniMap(randomX + (itemWidth / 2), randomY + (itemHeight / 2), item.name);
     });

     const shuffledItems = [...chapter3AllItems].sort(() => 0.5 - Math.random());
     ch3ItemsToFind = shuffledItems.slice(0, NUM_ITEMS_TO_FIND); 

     const screenWidth = $ch3Container.width();
     const screenHeight = $ch3Container.height();
     $ch3Container.scrollLeft((ch3MapSize.w - screenWidth) / 2);
     $ch3Container.scrollTop((ch3MapSize.h - screenHeight) / 2);

     $ch3Prompt.hide();
     $ch3SkipBtn.hide();
     $ch3MapWrapper.hide();
     $ch3MiniMap.hide(); 
     $ch3StoryIntro.hide().fadeIn(500);

     // [핵심] 이제 $ch3StartBtn이 정상적으로 찾아집니다.
     $ch3StartBtn.off().on('click', startChapter3Game);
     $ch3IntroSkipBtn.off().on('click', skipChapter3);
     $ch3SkipBtn.off().on('click', skipChapter3);
    }

    // 6. 실제 게임 시작 함수
    function startChapter3Game() {
        $ch3StoryIntro.fadeOut(300, function() {
            $(this).hide();
            
            $ch3Container.addClass('game-started');
            
            $ch3MapWrapper.show();
            $ch3Prompt.fadeIn(300);
            $ch3SkipBtn.fadeIn(300);
            $ch3MiniMap.fadeIn(300); 
            
            setTimeout(function() {
                $ch3Container.scrollLeft(0);
                $ch3Container.scrollTop(0);
                updateMiniMapViewport(); 
            }, 50); 
            
            setupChapter3Listeners(); 
            nextCh3Item(); 
        });
    }

    // 7. 챕터 3 게임 중지 함수 (전역 할당)
    stopChapter3Game = function() {
        $ch3Container.off('.ch3game');
        $ch3MapArea.off('.ch3game');
        $ch3Scanner.hide();
        $ch3StoryIntro.hide();
        $ch3MiniMap.hide(); 
        
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
            
            $ch3MiniMap.find('.ch3-mini-map-item-dot').removeClass('target');
            $ch3MiniMap.find(`.ch3-mini-map-item-dot[data-name="${ch3CurrentItem.name}"]`).addClass('target');
            
        } else {
            clearChapter3();
        }
    }

    // 9. 챕터 3 클리어
    function clearChapter3() {
        stopChapter3Game(); 
        
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

    // 10. 챕터 3 스킵 함수
    function skipChapter3() {
        // [수정] 스킵 시에도 stopChapter3Game()을 호출해서 이벤트 리스너를 제거
        stopChapter3Game(); 
        
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
        $ch3Container.off('.ch3game');
        $ch3MapArea.off('.ch3game');

        $ch3Container.on('scroll.ch3game', updateMiniMapViewport);

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
                
                updateMiniMapViewport(); 
            }
        }).on('pointerup.ch3game pointerleave.ch3game', function() {
            isCh3Dragging = false;
            $ch3Scanner.css('display', 'none'); 
        });

        $ch3MapArea.on('click.ch3game', '.ch3-item', function(e) {
            const $clickedItem = $(this);
            const itemName = $clickedItem.data('name');

            if (ch3CurrentItem && itemName === ch3CurrentItem.name) {
                $clickedItem.addClass('found'); 
                ch3FoundItemsCount++; 

                const itemPos = $clickedItem.position();
                const itemWidth = $clickedItem.width();
                const itemHeight = $clickedItem.height();
                const clearSpotX = itemPos.left + (itemWidth / 2);
                const clearSpotY = itemPos.top + (itemHeight / 2);

                const $clearSpot = $(`<div class="ch3-clear-spot"></div>`);
                $clearSpot.css({ left: `${clearSpotX}px`, top: `${clearSpotY}px` });
                
                 const $revealedImage = $(`<div class="ch3-item-image-revealed"></div>`);
                 $revealedImage.css('background-image', $clickedItem.css('background-image'));
                 $clearSpot.append($revealedImage);
                $ch3MapArea.append($clearSpot);
                
                $ch3MiniMap.find(`.ch3-mini-map-item-dot[data-name="${itemName}"]`).removeClass('target').addClass('found');
                
                shuffleRemainingItems();
                
                nextCh3Item();
            } else if (!ch3CurrentItem || !$clickedItem.hasClass('found')) {
                $clickedItem.css('animation', 'shake 0.5s');
                setTimeout(() => $clickedItem.css('animation', ''), 500);
            }
        });
    }

    // 12. 미니맵 시야(Viewport) 업데이트 함수
    function updateMiniMapViewport() {
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

    // 13. 미니맵에 '초기 점' 찍는 함수
    function addDotToMiniMap(centerX, centerY, itemName) { 
        const ratioX = ch3MiniMapSize.w / ch3MapSize.w;
        const ratioY = ch3MiniMapSize.h / ch3MapSize.h;
        
        const dotL = centerX * ratioX;
        const dotT = centerY * ratioY;

        const $dot = $(`<div class="ch3-mini-map-item-dot"></div>`);
        $dot.css({
            left: `${dotL}px`,
            top: `${dotT}px`
        });
        
        $dot.attr('data-name', itemName); 
        
        $ch3MiniMap.append($dot);
    }

    // 14. [신규] 남은 아이템 위치 셔플 함수
    function shuffleRemainingItems() {
        console.log('Shuffling remaining items... (Avoiding found items)'); 
        
        const itemWidth = 80; 
        const itemHeight = 80;
        const minDistance = Math.max(itemWidth, itemHeight); 

        const ratioX = ch3MiniMapSize.w / ch3MapSize.w;
        const ratioY = ch3MiniMapSize.h / ch3MapSize.h;

        const $foundItems = $ch3MapArea.find('.ch3-item.found');
        const foundPositions = [];
        $foundItems.each(function() {
            const pos = $(this).position();
            foundPositions.push({
                x: pos.left + (itemWidth / 2),
                y: pos.top + (itemHeight / 2)
            });
        });

        const $remainingItems = $ch3MapArea.find('.ch3-item:not(.found)');

        $remainingItems.each(function() {
            const $item = $(this);
            const itemName = $item.data('name');
            
            let randomX, randomY;
            let newCenterX, newCenterY;
            let isSafe = false;
            let attempts = 0;
            const maxAttempts = 50; 

            while (!isSafe && attempts < maxAttempts) {
                randomX = Math.floor(Math.random() * (ch3MapSize.w - itemWidth));
                randomY = Math.floor(Math.random() * (ch3MapSize.h - itemHeight));
                newCenterX = randomX + (itemWidth / 2);
                newCenterY = randomY + (itemHeight / 2);
                
                isSafe = true; 
                
                for (const foundPos of foundPositions) {
                    const distance = Math.hypot(newCenterX - foundPos.x, newCenterY - foundPos.y);
                    
                    if (distance < minDistance) {
                        isSafe = false; 
                        break; 
                    }
                }
                attempts++;
            } 

            if (attempts >= maxAttempts) {
                 console.warn(`Could not find a safe spot for ${itemName}. Placing anyway.`);
            }

            $item.css({
                left: `${randomX}px`,
                top: `${randomY}px`
            });

            const $dot = $ch3MiniMap.find(`.ch3-mini-map-item-dot[data-name="${itemName}"]`);
            if ($dot.length > 0) {
                const dotL = newCenterX * ratioX;
                const dotT = newCenterY * ratioY;
                
                $dot.css({
                    left: `${dotL}px`,
                    top: `${dotT}px`
                });
            }
        });
    }

}); // [수정] document.ready 래퍼 닫기