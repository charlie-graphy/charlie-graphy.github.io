(function () {    
    'use strict';
    // ------------------------------------------------------- //
    // Calendar
    // ------------------------------------------------------ //
	jQuery(function() {
		// page is ready
		jQuery('#calendar').fullCalendar({
			themeSystem: 'bootstrap4',
			// emphasizes business hours
			businessHours: false,
			defaultView: 'month',
			// event dragging & resizing
			editable: false,
			// header
			header: {
				left: 'prev',
				center: 'title',
				right: 'next'
			},
			locale: 'ko',
			events: [
				{
					title: '렛미플라이 - 김해',
					description: '노인 남원 役 | 김태한<br>선희 役 | 방진의<br>청년 남원 役 | 안지환<br>정분 役 | 임예진',
					start: '2024-01-06 15:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '렛미플라이 - 세종',
					description: '노인 남원 役 | 김도빈<br>선희 役 | 윤공주<br>청년 남원 役 | 안지환<br>정분 役 | 임예진',
					start: '2024-01-12 19:30',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '한국뮤지컬어워즈',
					description: '조연상(남자) 노미네이트',
					start: '2024-01-15 19:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">첫 공연(프리뷰)</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 김기리',
					start: '2024-01-17 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '렛미플라이 - 대구',
					description: '노인 남원 役 | 이형훈<br>선희 役 | 방진의<br>청년 남원 役 | 안지환<br>정분 役 | 임예진',
					start: '2024-01-18 19:30',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">프리뷰</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 오정택',
					start: '2024-01-19 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">프리뷰</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 안창용',
					start: '2024-01-21 14:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '바톤콘서트',
					description: "이종석 안지환 정우연<br><p class='event'>- 안지환 Setlist -<br><font style='font-weight:normal'>뮤지컬 &lt;Dear Evan Hansen> - For Forever<br>뮤지컬 <와일드 그레이> - 안개<br>뮤지컬 <나르치스와 골드문트> - 깊은 바다에 잠긴 그대<br>존박 - I'm Your Man</font></p>",
					start: '2024-01-23 20:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">커튼콜 데이</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 안창용',
					start: '2024-01-24 16:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">커튼콜 데이</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 김기리',
					start: '2024-01-24 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '렛미플라이 - 울산',
					description: '노인 남원 役 | 이형훈<br>선희 役 | 윤공주<br>청년 남원 役 | 안지환<br>정분 役 | 임예진',
					start: '2024-01-27 17:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">커튼콜 데이</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 오정택',
					start: '2024-01-28 14:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '뮤이어 스테이지',
					description: '민찬홍 작곡가 음악 콘서트 게스트',
					start: '2024-01-29 19:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 11장 마지막 수업</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 오정택',
					start: '2024-01-30 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 2장 만남</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 안창용',
					start: '2024-01-31 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '바톤콘서트',
					description: "안지환 송상훈 이종석<br><p class='event'>- 안지환 Setlist -<br><font style='font-weight:normal'>뮤지컬 &lt;Dear Evan Hansen> - For Forever<br>뮤지컬 <와일드 그레이> - 안개<br>뮤지컬 <나르치스와 골드문트> - 깊은 바다에 잠긴 그대<br>자우림 - 샤이닝</font></p>",
					start: '2024-02-01 20:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '바톤콘서트',
					description: "최민우 정우연 안지환<br><p class='event'>- 안지환 Setlist -<font style='font-weight:normal'><br>뮤지컬 &lt;Dear Evan Hansen> - For Forever<br>뮤지컬 <와일드 그레이> - 안개<br>뮤지컬 <나르치스와 골드문트> - 깊은 바다에 잠긴 그대<br>뮤지컬 <비더슈탄트> - 질문들</font></p>",
					start: '2024-02-03 15:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '바톤콘서트',
					description: "김방언 안지환 변희상<br><p class='event'>- 안지환 Setlist -<font style='font-weight:normal'><br>뮤지컬 &lt;Dear Evan Hansen> - For Forever<br>뮤지컬 <와일드 그레이> - 안개<br>뮤지컬 <나르치스와 골드문트> - 깊은 바다에 잠긴 그대<br>HYNN(박혜원) - 시든 꽃에 물을 주듯</font></p> ",
					start: '2024-02-03 19:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 8장 수용</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 오정택',
					start: '2024-02-04 14:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 안창용',
					start: '2024-02-07 16:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 오정택',
					start: '2024-02-08 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '바톤콘서트',
					description: "안지환 권태하 변희상<br><p class='event'>- 안지환 Setlist -<font style='font-weight:normal'><br>뮤지컬 &lt;Dear Evan Hansen> - For Forever<br>뮤지컬 <와일드 그레이> - 안개<br>뮤지컬 <나르치스와 골드문트> - 깊은 바다에 잠긴 그대<br>아이유 - 밤편지</font></p>",
					start: '2024-02-09 14:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 오정택',
					start: '2024-02-11 18:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">럭키 드로우</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 오정택',
					start: '2024-02-15 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">럭키 드로우</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 안창용',
					start: '2024-02-18 18:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 온 더 로드 VER.</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 김기리',
					start: '2024-02-21 16:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 온 더 로드 VER.</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 안창용',
					start: '2024-02-21 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 편지 VER.</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 김기리',
					start: '2024-02-24 15:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">인생네컷 증정</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 오정택',
					start: '2024-02-27 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">인생네컷 증정</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 김기리',
					start: '2024-03-01 14:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">인생네컷 증정</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 오정택',
					start: '2024-03-02 15:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 다즐링 VER.</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 김기리',
					start: '2024-03-06 16:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">스페셜 커튼콜 데이 : 보름달 VER.</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 오정택',
					start: '2024-03-10 18:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">커튼콜 데이</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 안창용',
					start: '2024-03-13 16:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">커튼콜 데이 + 스페셜 커튼콜 : 온 더 로드 VER.(SPIN-OFF) (스페셜 게스트: 손유동)</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 김기리',
					start: '2024-03-13 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">커튼콜 데이 + 스페셜 커튼콜 : 11장 마지막 수업<br>(스페셜 게스트: 손유동, 김기택)</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 오정택',
					start: '2024-03-15 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 안창용',
					start: '2024-03-19 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 오정택',
					start: '2024-03-21 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 오정택',
					start: '2024-03-22 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 오정택',
					start: '2024-03-24 14:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">더블 적립</p>데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 오정택',
					start: '2024-03-24 18:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '렛미플라이 - 대만',
					description: '노인 남원 役 | 김태한<br>선희 役 | 윤공주<br>청년 남원 役 | 안지환<br>정분 役 | 나하나',
					start: '2024-03-26 19:30',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '렛미플라이 - 대만',
					description: '노인 남원 役 | 이형훈<br>선희 役 | 최수진<br>청년 남원 役 | 안지환<br>정분 役 | 나하나',
					start: '2024-03-27 19:30',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '렛미플라이 - 대만',
					description: '노인 남원 役 | 김도빈<br>선희 役 | 방진의<br>청년 남원 役 | 안지환<br>정분 役 | 임예진',
					start: '2024-03-28 19:30',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">자화상 데이</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 허영손<br>알폰스 벡 役 | 김기리',
					start: '2024-03-30 15:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">자화상 데이</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 안창용',
					start: '2024-03-30 19:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 안창용',
					start: '2024-04-02 16:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '데미안 役 | 조풍래<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 오정택',
					start: '2024-04-02 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '데미안 役 | 성연<br>싱클레어 役 | 안지환<br>크나우어 役 | 강은빈<br>알폰스 벡 役 | 김기리',
					start: '2024-04-04 20:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 안창용',
					start: '2024-04-06 15:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '헤르츠클란',
					description: '<p class="event">마지막 공연</p>데미안 役 | 김도빈<br>싱클레어 役 | 안지환<br>크나우어 役 | 김서환<br>알폰스 벡 役 | 김기리',
					start: '2024-04-06 19:00',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '오걸작-오선지 걸어가는 작곡가',
					description: '이지혜 작곡가 - 꼬까리 하우스<br>게스트<br>김건우 김경록 김지웅 신주원 안지환 이휘종 정자영',
					start: '2024-04-20 15:00',
					className: 'bg-blue',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">첫 공연(프리뷰)</p>토루 役 | 안지환<br>요시오 役 | 유희제<br>유우카 役 | 김보정<br>카즈에 役 | 김계림<br>타쿠지 役 | 장태민<br>마사미 役 | 김보나<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-05-17 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 도예준<br>유우카 役 | 김보정<br>카즈에 役 | 이아진<br>타쿠지 役 | 정명군<br>마사미 役 | 김보나<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-05-22 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 도예준<br>유우카 役 | 김보정<br>카즈에 役 | 오현서 <br>타쿠지 役 | 이형훈<br>마사미 役 | 최지혜<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-05-25 15:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 도예준<br>유우카 役 | 김보정<br>카즈에 役 | 오현서 <br>타쿠지 役 | 이형훈<br>마사미 役 | 최지혜<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-05-25 19:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 한수림<br>카즈에 役 | 이아진<br>타쿠지 役 | 정명군<br>마사미 役 | 김진이<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-05-26 14:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">지정 폴라 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 한수림<br>카즈에 役 | 김계림<br>타쿠지 役 | 이형훈<br>마사미 役 | 최지혜<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-05-31 16:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">지정 폴라 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 한수림<br>카즈에 役 | 김계림<br>타쿠지 役 | 이형훈<br>마사미 役 | 최지혜<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-05-31 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '토루 役 | 안지환<br>요시오 役 | 유희제<br>유우카 役 | 김보정<br>카즈에 役 | 이아진<br>타쿠지 役 | 이형훈<br>마사미 役 | 최지혜<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-06-04 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '혜화로운 공연생활 공부 방송 : 쇄골에 천사가 잠들고 있다',
					description: '안지환, 유희제, 김보정, 이형훈 배우 & 변영진 연출',
					start: '2024-06-04 22:30',
					className: 'bg-gray',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">더블 적립</p>토루 役 | 안지환<br>요시오 役 | 유희제<br>유우카 役 | 강연정<br>카즈에 役 | 김계림<br>타쿠지 役 | 장태민<br>마사미 役 | 김진이<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-06-06 15:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">더블 적립</p>토루 役 | 안지환<br>요시오 役 | 유희제<br>유우카 役 | 강연정<br>카즈에 役 | 김계림<br>타쿠지 役 | 장태민<br>마사미 役 | 김진이<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-06-06 19:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">더블 적립</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 강연정<br>카즈에 役 | 이아진<br>타쿠지 役 | 정명군<br>마사미 役 | 최지혜<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-06-09 15:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">스페셜 커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 강연정<br>카즈에 役 | 오현서<br>타쿠지 役 | 정명군<br>마사미 役 | 최지혜<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-06-12 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">첫 공연(프리뷰)</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-06-13 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">스페셜 커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 유희제<br>유우카 役 | 강연정<br>카즈에 役 | 오현서<br>타쿠지 役 | 정명군<br>마사미 役 | 김보나<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-06-15 15:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">프리뷰</p>김영운 役 | 김재범<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 박선영<br>이경신 役 | 임태현',
					start: '2024-06-16 18:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">더블 적립</p>토루 役 | 안지환<br>요시오 役 | 도예준<br>유우카 役 | 강연정<br>카즈에 役 | 이아진<br>타쿠지 役 | 이형훈<br>마사미 役 | 김보나<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-06-18 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">커튼콜 데이 & 프로필 엽서 5종 증정</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-06-19 16:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">더블 적립</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 한수림<br>카즈에 役 | 오현서<br>타쿠지 役 | 이형훈<br>마사미 役 | 김진이<br>쿄코 役 | 송희정<br>켄토 役 | 서진원',
					start: '2024-06-21 16:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">커튼콜 데이 & 프로필 엽서 5종 증정</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-06-22 15:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">커튼콜 데이 & 프로필 엽서 5종 증정</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 김경록<br>이경신 役 | 임태현',
					start: '2024-06-23 18:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">스페셜 커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 강연정<br>카즈에 役 | 김계림<br>타쿠지 役 | 이형훈<br>마사미 役 | 김진이<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-06-25 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">미공개 캐릭터 엽서 5종 증정</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 김경록<br>이경신 役 | 임태현',
					start: '2024-06-26 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">스페셜 커튼콜 데이</p>토루 役 | 안지환<br>요시오 役 | 도예준<br>유우카 役 | 김보정<br>카즈에 役 | 김계림<br>타쿠지 役 | 정명군<br>마사미 役 | 김보나<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-06-28 16:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">미공개 캐릭터 엽서 5종 증정</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 박선영<br>이경신 役 | 임태현',
					start: '2024-06-29 15:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">미공개 캐릭터 엽서 5종 증정</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 박선영<br>이경신 役 | 임태현',
					start: '2024-06-29 19:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">관객과의 대화</p>토루 役 | 안지환<br>요시오 役 | 유희제<br>유우카 役 | 강연정<br>카즈에 役 | 오현서<br>타쿠지 役 | 정명군<br>마사미 役 | 최지혜<br>쿄코 役 | 송희정<br>켄토 役 | 서진원',
					start: '2024-06-30 15:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">더블 적립</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 김경록<br>이경신 役 | 황두현',
					start: '2024-07-03 16:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">지정 폴라 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 한수림<br>카즈에 役 | 오현서<br>타쿠지 役 | 장태민<br>마사미 役 | 최지혜<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-07-04 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">더블 적립</p>김영운 役 | 김재범<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-07-05 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">지정 폴라 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 강연정<br>카즈에 役 | 오현서<br>타쿠지 役 | 이형훈<br>마사미 役 | 김보나<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-07-06 15:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">지정 폴라 데이</p>토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 한수림<br>카즈에 役 | 이아진<br>타쿠지 役 | 정명군<br>마사미 役 | 김진이<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-07-06 19:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">더블 적립</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-07-07 14:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">더블 적립</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-07-07 18:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">스페셜 커튼콜 데이 : M11. 그런 세상</p>김영운 役 | 김재범<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 김경록<br>이경신 役 | 임태현',
					start: '2024-07-09 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">스페셜 커튼콜 데이 : M1. 등등곡</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 김경록<br>이경신 役 | 임태현',
					start: '2024-07-11 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 강연정<br>카즈에 役 | 김계림<br>타쿠지 役 | 이형훈<br>마사미 役 | 김보나<br>쿄코 役 | 문경희<br>켄토 役 | 장용철',
					start: '2024-07-12 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '토루 役 | 안지환<br>요시오 役 | 도예준<br>유우카 役 | 김보정<br>카즈에 役 | 오현서<br>타쿠지 役 | 정명군<br>마사미 役 | 김보나<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-07-13 19:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">스페셜 커튼콜 데이 : M16. 그래도 가겠다</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 박선영<br>이경신 役 | 임태현',
					start: '2024-07-14 14:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '토루 役 | 안지환<br>요시오 役 | 도예준<br>유우카 役 | 강연정<br>카즈에 役 | 오현서<br>타쿠지 役 | 장태민<br>마사미 役 | 김보나<br>쿄코 役 | 문경희<br>켄토 役 | 서진원',
					start: '2024-07-16 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '토루 役 | 안지환<br>요시오 役 | 김바다<br>유우카 役 | 김보정<br>카즈에 役 | 이아진<br>타쿠지 役 | 정명군<br>마사미 役 | 김진이<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-07-17 20:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">인터파크 피크닉 #4</p>김영운 役 | 김재범<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 김경록<br>이경신 役 | 임태현',
					start: '2024-07-19 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">자석 오프너 버튼 랜덤 1종 증정</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-07-20 15:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">자석 오프너 버튼 랜덤 1종 증정</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-07-20 19:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '쇄골에 천사가 잠들고 있다',
					description: '<p class="event">마지막 공연</p>토루 役 | 안지환<br>요시오 役 | 유희제<br>유우카 役 | 김보정<br>카즈에 役 | 김계림<br>타쿠지 役 | 장태민<br>마사미 役 | 김보나<br>쿄코 役 | 송희정<br>켄토 役 | 장용철',
					start: '2024-07-21 15:00',
					className: 'bg-green',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">스페셜 커튼콜 데이 : M19. 영운</p>김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 박선영<br>이경신 役 | 임태현',
					start: '2024-07-23 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">스페셜 커튼콜 데이 : M9. 놀아보자</p>김영운 役 | 김재범<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 김경록<br>이경신 役 | 황두현',
					start: '2024-07-24 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">스페셜 커튼콜 데이 : M12. 태평성대</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-07-28 18:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 김경록<br>이경신 役 | 임태현',
					start: '2024-07-31 16:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '김영운 役 | 김재범<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 김경록<br>이경신 役 | 황두현',
					start: '2024-08-01 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 김경록<br>이경신 役 | 황두현',
					start: '2024-08-03 19:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 김경록<br>이경신 役 | 임태현',
					start: '2024-08-07 16:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '김영운 役 | 김자철<br>최윤 役 | 안지환<br>초 役 | 강찬<br>정진명 役 | 박선영<br>이경신 役 | 황두현',
					start: '2024-08-08 20:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '김영운 役 | 유승현<br>최윤 役 | 안지환<br>초 役 | 박준휘<br>정진명 役 | 김경록<br>이경신 役 | 황두현',
					start: '2024-08-10 15:00',
					className: 'bg-red',
					allDay: false
				},
				{
					title: '등등곡',
					description: '<p class="event">마지막 공연</p>김영운 役 | 김지철<br>최윤 役 | 안지환<br>초 役 | 김서환<br>정진명 役 | 박선영<br>이경신 役 | 임태현',
					start: '2024-08-11 14:00',
					className: 'bg-red',
					allDay: false
				}
			],
			eventClick: function(event, jsEvent, view) {
			        jQuery('.event-icon').html("<i class='fa fa-"+event.icon+"'></i>");
					jQuery('.event-title').html(event.title);
					jQuery('.event-body').html(event.description);
					jQuery('.event-date').html(event.start._i);
					jQuery('#modal-view-event').modal();
			},
		})
	});  
})(jQuery);