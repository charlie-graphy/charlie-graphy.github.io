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

		  // 조건 1 ~ 15 (위에서 정의한 순서대로 체크)
		  if (song === 100 && act < 100 && vis < 100) {
		    return makeResult('노래 요정 포션', '목소리 하나로 세상을 녹이는 천상의 보컬을 가졌어요.', '🎤');
		  }
		  if (act === 100 && song < 100 && vis < 100) {
		    return makeResult('몰입 연기 포션', '감정선을 꿰뚫는 깊은 연기로 모두를 빠져들게 해요.', '🎭');
		  }
		  if (vis === 100 && song < 100 && act < 100) {
		    return makeResult('비주얼 깡패 포션', '존재만으로 반짝이는, 모두의 시선을 사로잡는 아우라!', '✨');
		  }
		  if (song + act >= 180) {
		    return makeResult('무대 장인 포션', '무대 위 감정과 사운드의 완벽한 조합! 프로페셔널 그 자체.', '🎶');
		  }
		  if (song + vis >= 180) {
		    return makeResult('뮤직비디오 천재 포션', '듣기만 해도 좋고, 보기만 해도 설레는 감각적 매력의 결정체!', '💫');
		  }
		  if (act + vis >= 180) {
		    return makeResult('영화 주인공 포션', '카메라가 사랑할 수밖에 없는 얼굴과 연기력! 주인공의 자격.', '🎬');
		  }
		  if (song >= 90 && act >= 90 && vis >= 90) {
		    return makeResult('레전드 포션', '이 시대의 아이콘, 모든 영역에서 완성된 완전체 포션이에요!', '🧪');
		  }
		  if (song === 0 && vis >= 90) {
		    return makeResult('시선강탈 포션', '단 한 번의 등장만으로도 강렬한 인상을 남기는 비주얼 마스터.', '👀');
		  }
		  if (act === 0 && song >= 90) {
		    return makeResult('감성 싱어 포션', '감정을 노래에 담아 전달하는, 마음을 울리는 음유시인!', '🎧');
		  }
		  if (vis === 0 && act >= 90) {
		    return makeResult('목소리 배우 포션', '오직 연기로 감동을 주는 진짜 배우! 빛나는 내면의 힘.', '🎙');
		  }
		  if (song >= 40 && song <= 60 && act >= 40 && act <= 60 && vis >= 40 && vis <= 60) {
		    return makeResult('균형잡힌 포션', '어디 하나 치우침 없는 안정적인 매력, 조화의 미학!', '⚖️');
		  }
		  if (song <= 30 && act <= 30 && vis <= 30) {
		    return makeResult('감히 실험할 수 없다 포션', '당신의 포텐셜은 아직 베일에 싸여 있어요. 그 자체로 미스터리!', '🌀');
		  }
		  if (song > act && vis >= 40 && vis <= 60) {
		    return makeResult('보컬 집중형 포션', '목소리에 집중된 에너지! 음악으로 존재감을 빛내요.', '🎵');
		  }
		  if (act > vis && song <= 30) {
		    return makeResult('연기 집중형 포션', '표정 하나, 눈빛 하나로 말하는 감정 연기의 고수예요.', '🎥');
		  }
		  if (vis > song && vis > act && avg < 50) {
		    return makeResult('매력 포션', '아직은 은근한 분위기파! 시간이 지날수록 스며드는 스타일.', '🪞');
		  }

		  // 기본 fallback
		  return makeResult('균형잡힌 포션', '어디 하나 치우침 없는 안정적인 매력, 조화의 미학!', '⚖️');
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
	const resultCards = [
		{ category: "분류1", nickname: "연구원A", content: "새로운 기술 적용 결과 매우 우수함." },
		{ category: "분류2", nickname: "참여자B", content: "참여도가 높고 분석이 뛰어남." },
		{ category: "분류3", nickname: "지원자C", content: "정확한 데이터 기록으로 우수 사례로 분류됨." },
		{ category: "분류1", nickname: "테스터D", content: "예상치보다 높은 수치 기록." }
	];
	
	function renderCards(filter = 'all') {
		const $container = $('#resultCards');
		const filtered = filter === 'all' ? resultCards : resultCards.filter(c => c.category === filter);
		$container.empty();
		
		filtered.forEach(card => {
			const $divBig = $('<div>',{'class':'result-card','data-category':card.category})
				, $divCate = $('<div>',{'class':'result-category','text':card.category})
				, $divName = $('<div>',{'class':'result-nickname','text':card.nickname})
				, $divCont = $('<div>',{'class':'result-content','text':card.content});
			
			$container.append($divBig.append($divCate, $divName, $divCont));
		});
	}
	
	renderCards();
	
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

});