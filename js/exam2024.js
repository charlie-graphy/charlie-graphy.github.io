let group = 0,
	progress = 0
	score = 100,
	name = "",
	answerlist = [],
	url = "";
const groupCont = ['싱클레어','토루','최윤','데이비','안지환'],
	questionCont = [['싱1질문','2질문','3질문','4질문'],['토1질문','2질문']],
	chooseCont = [[['싱1답','2답','3답','4답'],['1-2답','2-2답','3-2답'],['싱1답','2답','3답','4답'],['1-2답','2-2답','3-2답']]
				,[['토1답','2답','3답','4답'],['1-2답','2-2답','3-2답']]],
	answerCont = [[1,2,3,4],[1,2]],
	answerComment = [['일','이','삼','사'],['가나다라마바사','나다라다']];
const urlParams = new URL(location.href).searchParams;

$(document).ready(function(){
	group = urlParams.get('group');
	name = urlParams.get('name');
	score = urlParams.get('score');
	$(window).scrollTop(0);
	let startY = 0;
    let isDragging = false;
	
	// loading page
	var counter = 0;
	var c = 0;
	var i = setInterval(function(){
		$(".loading .counter span").html(c + "%");
		$(".loading .counter hr").css("width", c + "%");
		counter++;
		c++;
		if(counter == 101) {
			clearInterval(i);
			$('.loading').fadeOut("fast", function(){
				if(name == "" || name == 'null') $('.intro').fadeIn();
				else{
					$('.rstName').text(name);
				    $('.score').text(score+"점");
				    url = "https://www.jeehwany.com/exam?group="+group+"&name="+name+"&score="+score;
		    		$("html, body").css('overflow-x','hidden');
		    		$("html, body").css('overflow-y','auto');
		        	$("article.result").fadeIn();
				}
			});
		}
	}, 10);
	  
	$('.inputCont input.name').on('input', function(){
	    var value = $(this).val();
        var newValue = value.replace(/[ \{\}\[\]\/?.,;:|\)*~`!^\_+┼<>@\#$%&\'\"\\\(\=₩“”-]/gi, '');
        if(value !== newValue) $(this).val(newValue);
	});
	//시작하기
	$('button.start').on('click', function(){
		name = $('.inputCont .name').val();
		/*if(name == ""){
		  	$('.howtoCont').text("이름을 입력해주세요.");
			$('.modal').fadeIn(400).delay(400).fadeOut(400);
			return false;
		}*/
	    $("article.intro").fadeOut("fast", function(){
	    	$(window).scrollTop(0);
		    $("article.ready").fadeIn();
        });
	    
	    $('.ready .choose ul').empty();
		for(var i = 0 ; i < groupCont.length; i++){
			$li = $('<li>',{'text':groupCont[i]});
			$('.ready .choose ul').append($li);
		}
	});
	//영역선택
	$('.ready .choose ul').on('click', 'li', function(){
	    $("article.ing .group").text($(this).text());
	    $("article.ing .group").attr('data-id',$(this).index());
	    group = $(this).index();

		$('.ing .question span').text(questionCont[group][progress]);
		for(var i = 0 ; i < chooseCont[group][progress].length; i++){
			$li = $('<li>',{'class':'slideIn','text':chooseCont[group][progress][i]});
			$('.ing .choose ul').append($li);
		}

	    $("article.ready").fadeOut("fast", function(){
		    $("article.ing").fadeIn();
        });
	});

	$('.ready a.back').on('click', function(){
		$("article.ready").fadeOut("fast", function(){
			$("article.intro").fadeIn();
        });
	});
	$('.ing a.back').on('click', function(){
		$('.ing .choose ul').empty();
		answerlist.pop();
	    if(progress == 0){
		    $("article.ing").fadeOut("fast", function(){
			    $("article.ready").fadeIn();
	        });
	    }else{
	    	showIngData(progress-1);
	    }
	    if(progress > 0 ) progress-=1;
		$('.progress .bar').css('width',(progress+1)*10+'%');
	});
	
	//문항선택
	$('.ing .choose ul').on('click', 'li', function(){
		progress+=1;
		$('.progress .bar').css('width',(progress+1)*10+'%');
		answerlist.push($(this).index()+1);
		if(progress == questionCont[group].length) resultData();
		else showIngData(progress);
	});
	

	//페이스북 공유
	$('.result .fbCopy').on('click', function(){
		const text = encodeURIComponent($('.ing .titleText').text().substring(1)+" - "+name+"님의 점수는 "+$('.score').text());
		var facebookUrl = `https://www.facebook.com/sharer/sharer.php?t=`+text+`&u=`+encodeURIComponent(url);

        window.open(facebookUrl, '_blank', 'width=600,height=400');
	});
	
	//x 공유
	$('.result .xCopy').on('click', function(){
		const text = encodeURIComponent($('.ing .titleText').text().substring(1)+" - "+name+"님의 점수는 "+$('.score').text());
        const xUrl = `https://x.com/intent/post?text=`+text+`&url=`+encodeURIComponent(url);

        window.open(xUrl, '_blank');
	});

	//카카오톡 공유
	Kakao.init('44b5bc45b8dee34b194c72f77af3cf0e');
	$('.result .ktCopy').on('click', function(){
		Kakao.Link.sendScrap({
			requestUrl: url, // 페이지 url
			templateId: 111536, // 메시지템플릿 번호
			templateArgs: { THUMB: 'https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FeB1Yj7%2Fbtrn8HKdp01%2FlZMtAuvo986os4dCkVoAOk%2Fimg.png', // 썸네일 주소 ${THUMB}
							TITLE: '2024 지환고사', // 제목 텍스트 ${TITLE}
							DESC: groupCont[group]+'영역 나의 점수는...', // 설명 텍스트 ${DESC}
			}
		});
	});
	
	//URL 공유
	$('.result .urlCopy').on('click', function(){
        navigator.clipboard.writeText(url)
        .then(function() {
        	$('.howtoCont').text('URL이 복사되었습니다.');
        }).catch(function() {
        	$('.howtoCont').text('URL 복사에 실패했습니다.');
        });
		$('.modal').fadeIn(400).delay(400).fadeOut(400);
	});
	
	//해설지보기
	$('.result .review').on('click', function(){
		$('.divExamTt').text('2024 지환고사 : '+groupCont[group]+'영역 해설지');
		$('.divExam').empty();
		
		for(var i = 0 ; i < questionCont[group].length ; i++){
			$('.divExam').append($('<div>',{'text':(i+1)+'. '+questionCont[group][i]}));
			var $ul = $('<ul>');
			for(var j = 0 ; j < chooseCont[group][i].length; j++){
				$ul.append($('<li>',{'text':(j+1)+'. '+chooseCont[group][i][j]}));
			}
			$('.divExam').append($ul);
		}
		
		for(var i = 0 ; i < answerCont[group].length ; i++){
			$('.divExam ul:eq('+i+')').find('li').eq(answerCont[group][i]-1).addClass('bold');
			$('.divExam ul:eq('+i+')').append($('<li>',{'class':'comment','text':answerComment[group][i]}));
		}
		
		$('.divLayer').show();
		setTimeout(() => {
			$(".layerCont").css({'transform':'translateY(0)','transition':'all ease .2s'});
		}, 10);
		$("html, body").css('overflow','hidden');
	});
	//해설지닫기
	$('.result .b_handle').on('click', function(e){
		e.preventDefault();
		$("html, body").css('overflow-x','hidden');
		$("html, body").css('overflow-y','auto');
		$('.divLayer').hide();
		$(".layerCont").css({'transform':'translateY(100%)'});
	});
	$('.result .divExam, .b_handle').on('touchstart', function(e) {
        if ($(this).scrollTop() === 0) { // 스크롤이 최상단인지 확인
            startY = e.touches[0].clientY;
            isDragging = true;
        }
    });
	$('.result .divExam, .b_handle').on('touchmove', function(e) {
        if (!isDragging) return;

        const currentY = e.touches[0].clientY;
        const diffY = currentY - startY;

        if (diffY > 0) { // 손가락을 아래로 끌었을 때
        	$(".layerCont").css({'transform':'translateY('+diffY+'px)'});
        }
    });
	$('.result .divExam, .b_handle').on('touchend', function(e) {
        if (!isDragging) return;

        isDragging = false;
        const endY = e.changedTouches[0].clientY;
        const diffY = endY - startY;

        if (diffY > 100) { // 일정 거리 이상 드래그한 경우 레이어 닫기
    		$("html, body").css('overflow-x','hidden');
    		$("html, body").css('overflow-y','auto');
    		$('.divLayer').hide();
    		$(".layerCont").css({'transform':'translateY(100%)'});
        } else { // 그렇지 않으면 원래 위치로 되돌리기
            $(".layerCont").css({'transform':'translateY(0)','transition':'all ease .2s'});
        }
    });
	
	//다시하기
	$('.result .return').on('click', function(){
		progress = 0;
		answerlist = [];
		$('.progress .bar').css('width','10%');
		$('.ing .choose ul').empty();
		$('.inputCont input.name').val('');
		$("article.result").fadeOut("fast", function(){
			$("html, body").css('overflow','hidden');
			$(window).scrollTop(0);
		    $("article.intro").fadeIn();
        });
	});
});
function showIngData(idx){
	$('.ing .choose ul').empty();
	$('.ing .question span').text(questionCont[group][idx]);
	for(var i = 0 ; i < chooseCont[group][idx].length; i++){
		$li = $('<li>',{'class':'slide-in','text':chooseCont[group][idx][i]});
		$('.ing .choose ul').append($li);
	}
}
function resultData(){
	score = 100;
    $("article.ing").hide();
    $("article.loading").show();
    
    //채점
    for(var j = 0 ; j < answerlist.length ; j++){
    	if(answerCont[group][j] != answerlist[j]) score-=10;
    }

    $('.rstName').text(name);
    $('.score').text(score+"점");
    url = "https://www.jeehwany.com/exam?group="+group+"&name="+name+"&score="+$('.score').text().substring(0,$('.score').text().length-1);
    
    var counter = 0;
    var c = 0;
    var i = setInterval(function(){
	      $(".loading .counter h3").text("채점중");
	      $(".loading .counter span").html(c + "%");
	      $(".loading .counter hr").css("width", c + "%");
	    counter++;
	    c++;
	    if(counter == 101) {
	        clearInterval(i);
	        $('.loading').fadeOut("slow", function(){
	    		$("html, body").css('overflow-x','hidden');
	    		$("html, body").css('overflow-y','auto');
	        	$("article.result").fadeIn();
	        });
	    }
	  }, 10);
}