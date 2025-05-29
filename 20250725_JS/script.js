document.addEventListener('DOMContentLoaded', () => {
  const fadeEls = document.querySelectorAll('.fade-up, .fade-left, .fade-right');
  const menu = document.querySelector('.side-menu');

  const options = {
    threshold: 0.2
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, options);

  fadeEls.forEach(el => observer.observe(el));

  // 스크롤 내리면 메뉴 나타남
  window.addEventListener('scroll', () => {
	// 처음 로드할 때도 실행
	  if (window.scrollY > 178) menu.classList.add('show'); 
	  else menu.classList.remove('show');
  });
  
  document.querySelectorAll('.cta-button, .side-menu a').forEach(btn => {
	  btn.addEventListener('click', e => {
	    e.preventDefault();
	    const targetId = btn.getAttribute('href') || btn.dataset.target;
	    const targetEl = document.querySelector(targetId);

	    if (targetEl) {
	      const top = targetEl.offsetTop;
	      window.scrollTo({top,behavior: 'smooth'});
	    }
	  });
	});

  // 플립 카드 클릭 이벤트
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('flipped');
    });
  });
  
  // 모든 슬라이더에 퍼센트 실시간 반영
  document.querySelectorAll('.slider').forEach(slider => {
	  const wrapper = slider.closest('.slider-block');
	  const percentDisplay = wrapper.querySelector('.percent-display');

	  slider.addEventListener('input', () => {
	    percentDisplay.textContent = `${slider.value}%`;
	  });
  });

  // 결과 팝업 로직
  document.querySelector('.result-btn').addEventListener('click', function () {
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
    
    // 랜덤 결과 선택
    const i = Math.floor(Math.random() * resultImageList.length);
    document.getElementById('resultImage').src = resultImageList[i];
    document.getElementById('resultText').textContent = resultTextList[i];
    document.getElementById('resultSubText').textContent = resultSubTextList[i];

    // 팝업 표시
    setTimeout(function() {
        document.getElementById('resultPopup').style.display = 'block';
        document.getElementById('overlay').style.display = 'block';
	}, 300);
  });

  // 팝업 닫기
  document.getElementById('closePopup').addEventListener('click', function () {
    document.getElementById('resultPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
  });

  const resultCards = [
	  { category: "분류1", nickname: "연구원A", content: "새로운 기술 적용 결과 매우 우수함." },
	  { category: "분류2", nickname: "참여자B", content: "참여도가 높고 분석이 뛰어남." },
	  { category: "분류3", nickname: "지원자C", content: "정확한 데이터 기록으로 우수 사례로 분류됨." },
	  { category: "분류1", nickname: "테스터D", content: "예상치보다 높은 수치 기록." },
	];

	function renderCards(filter = "all") {
	  const container = document.getElementById("resultCards");
	  container.innerHTML = "";
	  const filtered = filter === "all" ? resultCards : resultCards.filter(card => card.category === filter);
	  filtered.forEach(card => {
	    const cardEl = document.createElement("div");
	    cardEl.className = "result-card";
	    cardEl.innerHTML = `
	      <div class="result-category">${card.category}</div>
	      <div class="result-nickname">${card.nickname}</div>
	      <div class="result-content">${card.content}</div>
	    `;
	    cardEl.setAttribute("data-category", card.category)
	    container.appendChild(cardEl);
	  });
	}

	renderCards();

	const filterButtons = document.querySelectorAll('.filter-btn');
	const resultCards2 = document.querySelectorAll('.result-card');

	filterButtons.forEach(button => {
	  button.addEventListener('click', () => {
	    // 버튼 활성화 상태 조정
	    filterButtons.forEach(btn => btn.classList.remove('active'));
	    button.classList.add('active');

	    const category = button.dataset.filter;
	    resultCards2.forEach(card => {
	      if (category === 'all' || card.dataset.category === category) {
	        card.style.display = 'block';
	      } else {
	        card.style.display = 'none';
	      }
	    });
	  });
	});
	
  
});
