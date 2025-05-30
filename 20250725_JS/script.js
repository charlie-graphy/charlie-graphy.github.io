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
	const resultTextList = [
		'에너지 폭발! 활동력 최강 실험가!',
		'침착하고 섬세한 분석왕!',
		'균형감 최고! 유연한 전천후 타입!'
	];
	const resultSubTextList = [
		'당신은 활발하고 긍정적인 에너지를 가진 연구원! 주변을 즐겁게 만드는 능력이 있어요.',
		'차분하고 분석적인 당신은 모든 실험에서 신뢰를 받는 중심 역할이에요.',
		'유연하고 센스 있는 당신은 언제나 독창적인 아이디어로 연구소를 놀라게 해요.'
	];
	
	$('.result-btn').on('click', function () {
		const i = Math.floor(Math.random() * resultImageList.length);
		$('#resultImage').attr('src', resultImageList[i]);
		$('#resultText').text(resultTextList[i]);
		$('#resultSubText').text(resultSubTextList[i]);
		
		setTimeout(() => { $('#resultPopup, #overlay').fadeIn(); }, 300);
	});
	
	$('#closePopup').on('click', function () {
		$('#resultPopup, #overlay').fadeOut();
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

});