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
let messageRef = null;

$(document).ready(function () {
	// 인터섹션 오브저버 대체 – fade 효과
	$('.fade-up, .fade-left, .fade-right').each(function () {
		const el = $(this);
		const observer = new IntersectionObserver(function (entries, obs) {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					el.addClass('visible');
					obs.unobserve(entry.target);
				}
			});
		}, { threshold: 0.2 });
		observer.observe(this);
	});
	
	// 스크롤 시 사이드 메뉴 노출
	$(window).on('scroll', function () {
		if ($(this).scrollTop() > 178) $('.side-menu').addClass('show');
		else $('.side-menu').removeClass('show');
	});
	
	// 스크롤 이동
	$('.cta-button, .side-menu a').on('click', function (e) {
		e.preventDefault();
		const targetId = $(this).attr('href') || $(this).data('target');
		const $target = $(targetId);
		if ($target.length) $('html, body').animate({ scrollTop: $target.offset().top }, 700);
	});
	
	// 플립 카드
	$('.flip-card').on('click', function () {
		$(this).toggleClass('flipped');
	});
	
	// 슬라이더 퍼센트 표시
	$('.slider').on('input', function () {
		const percent = $(this).val() + '%';
		$(this).closest('.slider-block').find('.percent-display').text(percent);
	});
	
	// 결과 팝업
	const resultImageList = [
		'https://blog.kakaocdn.net/dn/bm3Egw/btsHDIKtOe8/JHRYYWiK44ExfL3HhEP6B0/img.jpg',
		'https://blog.kakaocdn.net/dn/bpb0mG/btsMKDW3how/eF5FV41D8WPY4JtRAzrfrk/img.jpg',
		'https://blog.kakaocdn.net/dn/yI2Tw/btsMI7SwJgr/c1vW5mXQZQaWmDny0e15hK/img.jpg'
	];
	
	function getPotionResult(song, act, vis) {
		  const avg = (song + act + vis) / 3;

		  if (song === 100 && act < 100 && vis < 100) {
		    return makeResult('노래 맛집 포션', '목소리 하나로 무대를 꽉 채우는 노래 맛집이에요.', '🎤');
		  }
		  if (act === 100 && song < 100 && vis < 100) {
		    return makeResult('눈빛 장인 포션', '한 번 보면 빠져드는 몰입 연기 장인이에요.', '🎭');
		  }
		  if (vis === 100 && song < 100 && act < 100) {
		    return makeResult('불꽃 폭발 포션', '뜨거운 에너지로 무대를 불태우는 타입이에요.', '⚡️');
		  }
		  if (song + act >= 180) {
		    return makeResult('감성물결 포션', '노래와 연기가 만나 깊은 감동과 따뜻함을 전하는 무대예요.', '🎶');
		  }
		  if (song + vis >= 180) {
		    return makeResult('전율 포션', '진심 어린 노래와 에너지로 무대에 전율을 전하는 타입이에요.', '💫');
		  }
		  if (act + vis >= 180) {
		    return makeResult('무대태양 포션', '강렬한 연기와 활기찬 에너지로 무대를 빛내는 태양이에요.', '🎬');
		  }
		  if (song >= 90 && act >= 90 && vis >= 90) {
		    return makeResult('레전드 포션', '모든 영역에서 완벽함을 자랑하는 올라운더예요.', '🧪');
		  }
		  if (song === 0 && vis >= 90) {
		    return makeResult('시선강탈 포션', '존재만으로 무대를 사로잡는 매력적인 타입이에요.', '👀');
		  }
		  if (act === 0 && song >= 90) {
		    return makeResult('진심 보컬 포션', '감정을 담아 노래로 마음을 움직이는 음유시인이에요.', '🎧');
		  }
		  if (vis === 0 && act >= 90) {
		    return makeResult('순수 연기 포션', '오직 연기로 깊은 감동을 주는 진짜 배우예요.', '🎙');
		  }
		  if (song >= 40 && song <= 60 && act >= 40 && act <= 60 && vis >= 40 && vis <= 60) {
		    return makeResult('올라운더 포션', '무대 위 어디서든 빛나는 다재다능한 매력을 가진 존재예요.”', '⚖️');
		  }
		  if (song <= 30 && act <= 30 && vis <= 30) {
		    return makeResult('미지의 포션', '감히 평가할 수 없는, 미지의 영역이에요.', '🌀');
		  }
		  if (song > act && vis >= 40 && vis <= 60) {
		    return makeResult('보컬 집중 포션', '목소리에 집중된 에너지로 무대를 부드럽게 채우는 타입이에요.', '🎵');
		  }
		  if (act > vis && song <= 30) {
		    return makeResult('연기 집중 포션', '감정 표현에 뛰어난, 연기의 매력을 가진 타입이에요.', '🎥');
		  }
		  if (vis > song && vis > act && avg < 50) {
		    return makeResult('분위기 포션', '계속 생각나는 평양냉면처럼 시간이 지날수록 스며드는 타입이에요.', '🪞');
		  }

		  return makeResult('올라운더 포션', '무대 위 어디서든 빛나는 다재다능한 매력을 가진 존재예요.”', '⚖️');
	}

	// 결과 객체 생성 함수
	function makeResult(title, description, emoji) {
		return { title, description, emoji };
	}

	
	$('.result-btn').on('click', function () {
		const i = Math.floor(Math.random() * resultImageList.length);		
		const song = parseInt($('.slider').eq(0).val());
		const act = parseInt($('.slider').eq(1).val());
		const vis = parseInt($('.slider').eq(2).val());

		const result = getPotionResult(song, act, vis);

		// 팝업에 결과 삽입
		$('#resultImage').attr('src', resultImageList[i]);
		$('#resultText').text(`${result.emoji} ${result.title}`);
		$('#resultSubText').text(result.description);

		
		setTimeout(() => { $('#resultPopup').fadeIn(); }, 300);
	});
	
	$('#closePopup').on('click', function () {
		$('#resultPopup').fadeOut();
	});

	// 결과 카드 렌더링
	const resultCards = [];
	
	function readMessage(){
		firebase.database().goOnline();
		if(messageRef) messageRef.off(); // 이전 리스너 해제
		messageRef = database.ref('research'); // 새로운 리스너 추가

		$('#resultLoading').show(); // 🔹 로딩 표시 시작
		
		messageRef.on('value', function(snapshot) {
			const posts = snapshot.val();
			
	        if(posts){
	        	Object.keys(posts).forEach(function(key){
	        		const post = posts[key];
	        		resultCards.push({'category':post.content.category, 'nickname':post.content.nickname, 'content':post.content.message});
	        	});
	        }

			renderCards();
			$('#resultLoading').hide();  // 🔹 로딩 표시 종료
			disconnect();
	    });
	}
	
	
	function renderCards(filter = 'all') {
		const $container = $('#resultCards')
			, filtered = filter === 'all' ? resultCards : resultCards.filter(c => c.category === filter)
			, categoryNm = ['','언제, 어떻게 처음 알게 되었나요?','어떤 순간이 가장 강하게 기억에 남았나요?','마음을 지속하게 되는 이유는 무엇인가요?','어떤 존재인가요?'];
		$container.empty();
		
		filtered.forEach(card => {
			const $divBig = $('<div>',{'class':'result-card','data-category':card.category})
				, $divCate = $('<div>',{'class':'result-category','text':categoryNm[card.category]})
				, $divName = $('<div>',{'class':'result-nickname','text':card.nickname})
				, $divCont = $('<div>',{'class':'result-content','text':card.content});
			
			$container.prepend($divBig.append($divCate, $divName, $divCont));
		});
	}
	
	readMessage();
	
	$('.filter-btn').on('click', function () {
		$('.filter-btn').removeClass('active');
		$(this).addClass('active');
		const category = $(this).data('filter');
		
		$('.result-card').each(function () {
			const cardCategory = $(this).data('category');
			if (category === 'all' || cardCategory === category) $(this).show();
			else $(this).hide();
		});
	});

	function updateLiquidBackground() {
		  const song = $('.slider').eq(0).val();
		  const act = $('.slider').eq(1).val();
		  const vis = $('.slider').eq(2).val();
		  const avg = (parseInt(song) + parseInt(act) + parseInt(vis)) / 3;

		  // ✅ 파도 높이 vh 기준으로 조정
		  const minHeight = 30;
		  const maxHeight = 130;
		  const heightVh = minHeight + ((maxHeight - minHeight) * (avg / 100));
		  $('.wave-container').css('height', `${heightVh}vh`);
		  
		  // 파란 계열: 하늘색 → 진한 파랑
		  const skyBlue = [180, 220, 255];  // #b4dcff
		  const softBlue = [40, 130, 200];       // #2882c8

		  const r = Math.round(skyBlue[0] + (softBlue[0] - skyBlue[0]) * (avg / 100));
		  const g = Math.round(skyBlue[1] + (softBlue[1] - skyBlue[1]) * (avg / 100));
		  const b = Math.round(skyBlue[2] + (softBlue[2] - skyBlue[2]) * (avg / 100));

		  const fillColor = `rgba(${r}, ${g}, ${b}, 0.6)`;

		  $('#wavePath').attr('fill', fillColor);
	}

	// 슬라이더 변화에 반응
	$('.slider').on('input', updateLiquidBackground);

	// 초기 실행
	updateLiquidBackground();
	
	// 슬라이더 배경
	function updateSliderBackgrounds() {
		$('.slider').each(function () {
			const val = $(this).val();
			const max = $(this).attr('max') || 100;
			const percent = (val / max) * 100;
			
			let gradient;
			if ($(this).closest('.slider-block').index() === 0) gradient = `linear-gradient(to right, #a0e9ff ${percent}%, #e0e0e0 ${percent}%)`;
			else if ($(this).closest('.slider-block').index() === 1) gradient = `linear-gradient(to right, #ffc6ff ${percent}%, #e0e0e0 ${percent}%)`;
			else gradient = `linear-gradient(to right, #ffeaa7 ${percent}%, #e0e0e0 ${percent}%)`;

			$(this).css('background', gradient);
		});
	}
	
	// 슬라이더 값 바뀔 때마다 업데이트
	$('.slider').on('input change', updateSliderBackgrounds);
	// 최초 1회 실행
	updateSliderBackgrounds();

	//폼
	$('.form-submit-btn').on('click', function(e){
		e.preventDefault();
		const researchData= $("#research-form").serializeObject()
			, category = $('#category').val()
			, nickname = $('#nickname').val().trim()
			, message = $('#message').val().trim();

		if (!category || !nickname || !message) {
			showFormPopup("잠시만요!", "모든 항목을 빠짐없이 작성해 주세요.");
			return;
		}

		$('#closeFormPopup').hide();
		showFormPopup("제출 중입니다...", "잠시만 기다려 주세요.");
		sendMessage(researchData);
	});
});

$.fn.serializeObject = function() {
	  "use strict"
	  var result = {}
	  var extend = function(i, element) {
	    var node = result[element.name]
	    if("undefined" !== typeof node && node !== null){
	    	if($.isArray(node)) node.push(element.value);
	    	else result[element.name] = [node, element.value];
	    }else result[element.name] = element.value;
	  }

	  $.each(this.serializeArray(), extend);
	  return result;
}

function sendMessage(data){
	firebase.database().goOnline();
	if(messageRef) messageRef.off(); // 이전 리스너 해제
	messageRef = database.ref('research'); // 새로운 리스너 추가
	
	const newPostRef = database.ref('research').push();
	const currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    let parsedData;
    try {
    	parsedData = typeof data === "string" ? JSON.parse(data) : data;
    }catch(e){
    	console.error("JSON 파싱 오류:", e);
    	return;
    }
    
    newPostRef.set({
    	content: parsedData,
    	timestamp: currentTime
    }).then(() => {
        console.log("메시지 전송 완료");
        disconnect(); // 전송 후 연결 해제
        
        showFormPopup("제출 완료!", "연구 보고서가 성공적으로 저장되었습니다.");
		$('#closeFormPopup').show();
    	$("#research-form")[0].reset();
    }).catch(error => {
        console.error("메시지 전송 오류:", error);
    });
}
//연결을 종료하고 Firebase 오프라인 처리하는 함수
function disconnect(){
	if(messageRef) messageRef.off(); // 리스너 해제
	firebase.database().goOffline(); // Firebase 연결 끊기
}
function showFormPopup(title, message) {
	$('#formPopupTitle').text(title);
	$('#formPopupMessage').text(message);
	$('#formPopup').fadeIn();
}

$('#closeFormPopup').on('click', function () {
	$('#formPopup').fadeOut();
	if($('#formPopupTitle').text() == '제출 완료!') location.reload();
});