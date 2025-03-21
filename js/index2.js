$(window).on("load", function() {
   	$(".loader").fadeOut(500, function() {
   		$(".main-content").addClass("show");
   	});
});
$(document).ready(function() {
    let zIndexCounter = 100; // 팝업창의 z-index 관리
    let popup = $(".side-popup");

    if($(window).width() > 900) $(".toggle-button").text("▲");
    else $(".toggle-button").text("▶");
    
    // 토글 버튼 클릭 시 펼치기/접기
    $(".toggle-button").click(function(e) {
    	if(popup.hasClass("open")) popup.removeClass("open");
    	else popup.addClass("open");
    	
    	if($(window).width() > 900) {
            if($(this).text() == "▲") $(this).text("▼");
            else $(this).text("▲")
    	}else{
            if($(this).text() == "▶") $(this).text("◀");
            else $(this).text("▶")
    	}
    });

    // 아이콘 클릭 시 내용 표시
    $(".side-popup .icon-list img").click(function() {
        let target = $(this).data("target");
        $(".popup-content").hide();
        $("#" + target).fadeIn();
    });

    // 창 크기 변경 시 스타일 조정
    $(window).resize(function() {
        if ($(window).width() > 900) {
            popup.css({
                left: "50%",
                top: "40%",
                transform: "translate(-50%, -50%)",
                width: "400px",
                height: "600px"
            }).show();
            popup.addClass("open");
            $(".toggle-button").text("▲");
        } else {
            popup.removeClass("open").css({
                top: "60px",
            	left: "",
            	transform: "none",
                right: "0",
                width: "250px",
                height: "410px"
            }).show();
            popup.addClass("open");
            $(".toggle-button").text("▶");
        }
    });
    
    // 메뉴 토글 기능
    $(".menu-toggle").click(function() {
        $(".menu").toggleClass("active");
    });

    // 시간 & 날짜 업데이트
    function updateTime() {
        let now = new Date();
        let timeString = now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false});
        let dateString = now.toLocaleDateString('ko-KR', {month: 'long',day: 'numeric', weekday: 'long'});
        $(".datetime").text(`${dateString} ${timeString}`);
    }
    setInterval(updateTime, 1000);
    updateTime();

    // 풀스크린 기능
    $(".fullscreen").click(function() {
        if(!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    // 다크모드 기능
    $(".darkmode").click(function(e) {
        if($(this).attr('data-YN') == 'N') {
        	$('body, button, span, div').not('.resize-handle').css({'background':'#1E1E1E','color':'white'});
        	$('header, div, button').css({'border-color':'rgba(255, 255, 255, 0.3)'});
        	$(this).removeClass('bx-moon').addClass('bxs-moon');
        	$(this).attr('data-YN','Y');
        }else{
        	$('body, button, span, div').not('.resize-handle').css({'background':'white','color':'#1E1E1E'});
        	$('header, div, button').css({'border-color':'rgba(0, 0, 0, 0.3)'});
        	$(this).removeClass('bxs-moon').addClass('bx-moon');
        	$(this).attr('data-YN','N');
        }
    });
    
    // 팝업창 열기
    $(".icon").click(function() {
    	if($(".window[data-id="+$(this).data("window")+"]").length == 0){
            let targetWindow = $("#templete").clone();
            
            if($(this).data("window") == 'games'){
            	targetWindow.css({'width':'382px','height':'585px'});
            	targetWindow.find('.resize-handle').remove();
            }
            $(".main-content").append(targetWindow);
            
            targetWindow.attr("data-id", $(this).data("window"));
            targetWindow.find(".title-bar span").text($(this).data("name"));
            targetWindow.find(".content iframe").attr("src", $(this).data("src"));
            
            targetWindow.fadeIn().css({
                top: "100px", 
                left: "15%", 
                "z-index": ++zIndexCounter // 선택한 팝업 맨 앞으로
            });
    	}
    });

    // 팝업창 닫기
    $(".main-content").on("click", ".close-btn", function(e){
    	$(this).closest(".window").remove();
    });

    // 팝업창 확대
    $(".main-content").on("click", ".max-btn", function(e){
    	if($(this).closest(".window").data("id") == "games"){
    		alert("현재 하고 있는 게임이 사라집니다.")
    	}
    	window.open($(this).closest(".window").data("id")+"2.html", "_self");
    });

    // 팝업창 이동 기능 (화면 내부 제한 + 클릭 시 맨 앞으로)
    $(".main-content").on("mousedown touchstart", ".window", function(e) {
        let win = $(this);
        let posX = e.pageX - win.offset().left;
        let posY = e.pageY - win.offset().top;

        // 클릭된 팝업이 맨 앞으로 오도록 설정
        win.css("z-index", ++zIndexCounter);

        $(document).on("mousemove touchmove", function(e) {
            let newX = e.pageX - posX;
            let newY = e.pageY - posY;

            // 화면 범위 제한
            let maxX = $(window).width() - win.outerWidth();
            let maxY = $(window).height() - win.outerHeight();

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max($('header').height(), Math.min(newY, maxY));

            win.css({ top: newY, left: newX });
        }).on("mouseup touchend", function() {
            $(document).off("mousemove touchmove");
        });
    });
    
    $(".main-content").on("mousedown touchstart", ".resize-handle", function(e) {
    	let win = $(this).parent();
    	e.preventDefault();
        e.stopPropagation(); // 클릭 시 팝업 확대 방지

        let startX = e.pageX || e.originalEvent.touches[0].pageX;
        let startY = e.pageY || e.originalEvent.touches[0].pageY;
        let startWidth = win.outerWidth();
        let startHeight = win.outerHeight();

        // 문서 전체에서 크기 조절 가능하도록 이벤트 설정
        $(document).on("mousemove touchmove", function(e) {
            let moveX = e.pageX || e.originalEvent.touches[0].pageX;
            let moveY = e.pageY || e.originalEvent.touches[0].pageY;

            let newWidth = Math.max(310, Math.min($(window).width() - win.offset().left, startWidth + (moveX - startX)));
            let newHeight = Math.max(200, Math.min($(window).height() - win.offset().top, startHeight + (moveY - startY)));

            win.css({ width: newWidth + "px", height: newHeight + "px" });
        }).on("mouseup touchend", function() {
            $(document).off("mousemove touchmove");
        });
    });
    
    $(window).on("resize", function(){
    	if($(window).width() > 900){
    		$(".menu").removeClass("active"); //메뉴 닫기
    		$(".icon-menu li.empty").hide();
    	}else $(".icon-menu li.empty").show();
    });
    
    $(".main-content").on("contextmenu, click", "img", function(e) {
		e.preventDefault();
		return false;
    });
});