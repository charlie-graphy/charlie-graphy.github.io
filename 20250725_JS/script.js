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

// 결과 팝업
const resultImageList = [
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjUw/MDAxNzUyMDI3MjY2ODE2.DK5dk7cTDIVzNVLAS2uptn0hc9XyTymomvGERhC5wpcg._Fnb38TdcejfPODU3uYFg9xT2jh24aCJgBsDJEKgNL4g.PNG/202050725-profile1.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTY2/MDAxNzUyMDI3MjY4MTcx.uskGIJNKAehY8-p_jFx8_WNwHmwbVYTvoEG71npnrC4g.8oD7t8co27YtanweRdwlFayZW-mADasXDu1u8q4A3vIg.JPEG/202050725-profile2.jpg?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTE0/MDAxNzUyMDI3MjY5NDY0.CYElku0op6_H_aegFCNG3VYRoi_ivdEudvAoGjJpXxEg.HitU6urXK2Jz17fjojBay7m0ohXtE-bbCp4HSCVBmnUg.PNG/202050725-profile3.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTM1/MDAxNzUyMDI3MjcwNzE4.umTN86GtkgcfIFXREpdNxfa9MYoRCppUhgtnK-UABYsg.sjpc5A9z5mUuwUYD3bVrIkCyCuS48FwWum5NnsMTPuog.PNG/202050725-profile4.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTMy/MDAxNzUyMDI3MjcyODYy.KRuaRQG8t24yFEaEW6aEME-6KrckDsFpFFfONpgsmRcg.twbJjFc-LMtkMTUn4tkaSRNqGuAFXox3EMO3W4dJSHgg.PNG/202050725-profile5.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjk4/MDAxNzUyMDI3Mjc0MTg1.--LZBDSCHCZjeVE8ZnOAqHbRP1CUkX1Ikl2yHuox0mYg.eujhW7CiB9Pw3fj58zXpNcZGrKd6ee2mnHjiuL82JRYg.PNG/202050725-profile6.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjMg/MDAxNzUyMDI3Mjc1Mzk2.vIUk8Vkr1b6d3eYuIzhnY9OSlmoPR4guPfhYagDstZog.R7ld0xQ7z5ACLsj3B_OkQAe4ZnMkultkgWz3LISq-oEg.PNG/202050725-profile7.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTI1/MDAxNzUyMDI3Mjc2NDU4.81F7DKoW9SrAS2LCMAQhmCc7yiT_UwQ7G44pDl5EjIwg.QLujjVeK5s_S5Pj2rF-doXK-gv0GtwOMmQkV0u_zbJsg.PNG/202050725-profile8.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTc1/MDAxNzUyMDI3Mjc3ODEw.H_tm8ssbx9-a9moO9tL0d0ax3m549zhQXtZtAd2dwSIg.lG8eUMMsxFW82MQf1_VWuW0lLCpFd3H2_7962Ehd6gUg.PNG/202050725-profile9.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTUg/MDAxNzUyMDI3Mjc4ODIw.AEYRbR8ws50dUrr8ITU1Y3K-fj2EkjMQorVDtJceSq8g.E0-chrkmPvdO59felvT5Ggwn1eFKY4ilzMrQoFXjsZ4g.PNG/202050725-profile10.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjEg/MDAxNzUyMDI3MjgwMTI4.T3ANQP--Ge5mWGRWheMm03p1pUjff-i8POwfO2pZLXEg.5mitg-VpwTHgT6aO1tBvzB2M9CYzQkKcG8r4zGX0bSYg.PNG/202050725-profile11.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTY1/MDAxNzUyMDI3MjgxNDI3.KMwk-QaduHuZWLuhdda6k-WaKoTLYFvlg0HSP8wjusMg.dpFpP9AKeD6blMLUGe1U4LRr1NUwBgwuWq9ahKj9X9wg.PNG/202050725-profile12.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjM4/MDAxNzUyMDI3MjgyNTQz.e0HX16ojLzWwbRZTIi5cF9L-ApZcZ2Qg1bDBO_EN1M0g.qJXEh5k-1W269ijF9Z_vYjSVjs_bRz2rBm0o6psTuTQg.PNG/202050725-profile13.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjM4/MDAxNzUyMDI3MjgyNTQz.e0HX16ojLzWwbRZTIi5cF9L-ApZcZ2Qg1bDBO_EN1M0g.qJXEh5k-1W269ijF9Z_vYjSVjs_bRz2rBm0o6psTuTQg.PNG/202050725-profile13.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjIg/MDAxNzUyMDI3Mjg1MzMw.sdxG3Dhj4CqdaeloMJd96dZfb8keDrk_gQDqsbAMZpkg.yIl-TNq_kB5TS6KlFKotCpOruB1YPpam9_YcVL6hm4Ig.PNG/202050725-profile15.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfOTkg/MDAxNzUyMDI3Mjg2ODg2.TZs1w4-2SQE7TZbeVEtsXFWY1d0vUPzP6WmH2_GIkXYg.iLqR_LGBzLCi_O72VfUlwypQCpu8Gh-1Y-ebPzF7bZMg.PNG/202050725-profile16.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTIg/MDAxNzUyMDI3MjkwMjgy.TdyeEHg7kXPHXHULDLrPZTS9GlHqomJSn1HWOtAcoDQg.grVmw68UYE7OvJ9TAi8Wyap9DLfARrMaTADAH8S_gx0g.PNG/202050725-profile17.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMTIg/MDAxNzUyMDI3MjkwMjgy.TdyeEHg7kXPHXHULDLrPZTS9GlHqomJSn1HWOtAcoDQg.grVmw68UYE7OvJ9TAi8Wyap9DLfARrMaTADAH8S_gx0g.PNG/202050725-profile17.png?type=w3840',
	'https://postfiles.pstatic.net/MjAyNTA3MDlfMjY5/MDAxNzUyMDI3MjkyNzAx.XZUUXgJ8ZZb9PbPsYhaUi_jxbLRp9HWwaK6-l2d38-8g.U8jrSJB8Pa_d-k2uyXjj2cGLnv3rL1hxY1pwG8dhoz8g.PNG/202050725-profile19.png?type=w3840'
];

$(document).ready(function () {
	history.replaceState(null, '', window.location.origin + window.location.pathname);

	preloadImages(resultImageList);
	
	function preloadImages(urls) {
		urls.forEach((url) => {
			const img = new Image();
			img.src = url;
		});
	}
	
	$('#introLogo').addClass('loaded');
	
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
	
	function getPotionResult(song, act, ene) {
		const avg = (song + act + ene) / 3;
		
		if (song >= 90 && act >= 90 && ene >= 90) return makeResult('레전드 포션', '“어떻게 이 모든 걸 다 잘하지?”라는 말이 절로 나오는 올라운더예요.', '🧪');
		if (song + act >= 180) return makeResult('울림 포션', '한 장면, 한 소절마다 마음을 흔드는 진한 울림이 있어요.', '🎶');
		if (song + ene >= 180) return makeResult('전율 포션', '진심이 담긴 노래와 에너지로 무대에 강렬한 전율을 선사해요.', '💫');
		if (act + ene >= 180) return makeResult('태양 포션', '터질 듯한 에너지와 몰입 연기로 무대를 장악하는 태양이에요.', '☀️');
		if (song >= 90 && act < 100 && ene < 100) return makeResult('노래 맛집 포션', '목소리 하나로 무대를 꽉 채우는 노래 맛집이에요.', '🎤');
		if (act >= 90 && song < 100 && ene < 100) return makeResult('눈빛 장인 포션', '한 번 보면 빠져드는 몰입 연기 장인이에요.', '🎭');
		if (ene >= 90 && song < 100 && act < 100) return makeResult('불꽃 폭발 포션', '뜨거운 에너지로 무대를 불태우는 타입이에요.', '⚡️');
		if (song === 0 && ene >= 90) return makeResult('존재감 포션', '어떤 장면에서도 단번에 눈을 사로잡는, 무대 위의 중심이에요', '👀');
		if (act === 0 && song >= 90) return makeResult('음유시인 포션', '감정을 담아 노래로 마음을 움직이는 음유시인이에요.', '🎧');
		if (ene === 0 && act >= 90) return makeResult('감정 연기 포션', '진심을 담은 연기로, 담백하지만 깊은 울림을 전해요.', '🎬');
		if (song <= 30 && act <= 30 && ene <= 30) return makeResult('미지의 포션', '감히 평가할 수 없는 미지의 영역이에요.', '🌀');
		if (song > act && ene >= 40 && ene <= 60) return makeResult('음색 천재 포션', '진심을 담은 목소리로 무대를 매력적으로 물들이는 음색 천재예요.', '🎵');
		if (act > ene && song <= 30) return makeResult('연기 천재 포션', '깊은 몰입과 섬세한 표현으로 무대를 압도하는 연기 천재예요.', '🎥');
		if (ene > song && ene > act && avg < 50) return makeResult('분위기 포션', '빛나는 에너지와 자연스럽게 스며드는 매력으로 무대를 채워요.', '🪞');
		if (song >= 40 && song <= 60 && act >= 40 && act <= 60 && ene >= 40 && ene <= 60) return makeResult('올라운더 포션', '무대 위 어디서든 빛나는 다재다능한 매력을 가진 존재예요.', '✨');
			
		return makeResult('올라운더 포션', '무대 위 어디서든 빛나는 다재다능한 매력을 가진 존재예요.', '✨');
	}

	// 결과 객체 생성 함수
	function makeResult(title, description, emoji) {
		return { title, description, emoji };
	}
	
	$('.result-btn').on('click', function () {
		const i = Math.floor(Math.random() * resultImageList.length);		
		const song = parseInt($('.slider').eq(0).val());
		const act = parseInt($('.slider').eq(1).val());
		const ene = parseInt($('.slider').eq(2).val());

		const result = getPotionResult(song, act, ene);

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
		if(!isConnected) {
			firebase.database().goOnline();
			isConnected = true;
		}
		
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
		  const ene = $('.slider').eq(2).val();
		  const avg = (parseInt(song) + parseInt(act) + parseInt(ene)) / 3;

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
		//window.location.assign("https://forms.gle/Na4bb5MYwZ7phLPD9","_blank")
	});
	
	// 연구 일지 전체보기/접기 텍스트 클릭 이벤트
	$('#toggleLog').on('click', function () {
		const isCollapsed = $('#logWrapper').toggleClass('log-collapsed').hasClass('log-collapsed');
		$(this).text(isCollapsed ? '전체보기 ▾' : '접기 ▴');
	});

	// log-author 클릭 시 팝업 띄우기
	$('.log-author').on('click', function () {
	  const $card = $(this).closest('.log-card');
	  const author = $(this).text().trim();
	  const content = $card.find('.log-content').text().trim();

	  $('#logPopupTitle').text(author + '의 연구 일지');
	  $('#logPopupContent').text("안알랴쥼");
	  $('#logPopup').fadeIn();
	});

	// 팝업 닫기
	$('#closeLogPopup').on('click', function () {
	  $('#logPopup').fadeOut();
	});

	$('.beaker-card').on('click', function () {
		const title = $(this).data('title')+' 비커';
	    const logs = [
	      '연구소 종료 후 공개 예정입니다.'
	    ];
		    
	    // 💖 하트 애니메이션
	    const $beaker = $(this).find('.beaker');
	    const $heart = $('<div class="beaker-heart">💖</div>');
	    $beaker.append($heart);
	    setTimeout(() => $heart.remove(), 1000);
	    openBeakerPopup(title, logs);
	});

	$('#beakerPopup .popup-close').on('click', function () {
	    $('#beakerPopup').fadeOut(200);
	  });
		
});

//비커 팝업 열기 함수
function openBeakerPopup(title, items) {
	$('#beakerPopupTitle').text(title);
	let bdLeft = "4px solid #";
	
	if(title == "노래 비커"){
		bdLeft +='a0e9ff';
	}else if(title == "연기 비커"){
		bdLeft +='ffc6ff';
	}else if(title == "에너지 비커"){
		bdLeft +='ffeaa7';
	}
	
	const $body = $('#beakerPopupBody');
	$body.empty(); // 기존 내용 제거
	
	$.each(items, function(index, item) {
		const $entry = $('<div class="log-entry"></div>');
		const $summary = $('<p class="log-summary"></p>').text(item);
		
		$entry.append($summary).css("border-left",bdLeft);
		$body.append($entry);
	});
	
	$('#beakerPopup').fadeIn(300); // 팝업 보이기
}

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
	if(!isConnected) {
		firebase.database().goOnline();
		isConnected = true;
	}
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
        setTimeout(disconnect, 1000); // 🔸 잠시 후 연결 종료
        
        showFormPopup("제출 완료!", "연구 보고서가 성공적으로 저장되었습니다.");
		$('#closeFormPopup').show();
    	$("#research-form")[0].reset();
    }).catch(error => {
        showFormPopup("제출 실패!", "연구 보고서 저장을 실패하였습니다.");
		$('#closeFormPopup').show();
        console.error("메시지 전송 오류:", error);
    });
}
//연결을 종료하고 Firebase 오프라인 처리하는 함수
function disconnect(){
	if(messageRef) messageRef.off(); // 리스너 해제
	firebase.database().goOffline(); // Firebase 연결 끊기
	isConnected = false;
	console.log('Firebase 연결 종료됨');
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
$(window).on('beforeunload', function(){
	firebase.database().goOffline();
});