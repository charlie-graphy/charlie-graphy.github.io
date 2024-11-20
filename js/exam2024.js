let group = 0,
	progress = 0
	score = 100,
	name = "",
	answerlist = [],
	url = "";
const urlParams = new URL(location.href).searchParams;
loadScript("js/exam2024_msg.js");

$(document).ready(function(){
	group = urlParams.get('group');
	name = urlParams.get('name');
	score = urlParams.get('score');
	$(window).scrollTop(0);
    let isDragging = false;
	
	// loading page
	var counter = 0;
	var c = 0;
	var i = setInterval(function(){
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
		    		showContent(group);
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
		if(name == ""){
		  	$('.howtoCont').text("이름을 입력해주세요.");
			$('.modal').fadeIn(400).delay(400).fadeOut(400);
			return false;
		}
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

	    showTypeQuestion(group, progress);
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
		$('.progress .bar').css('width',(progress+1)*12.5+'%');
	});
	
	//문항선택
	$('.ing .choose ul').on('click', 'li', function(){
		progress+=1;
		$(this).addClass('act');
		$('.progress .bar').css('width',(progress+1)*12.5+'%');
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
		const xUrl = new URL('https://twitter.com/intent/tweet?text='+text+'&url='+encodeURIComponent(url));

        window.open(xUrl, '_blank');
	});

	//카카오톡 공유
	Kakao.init('44b5bc45b8dee34b194c72f77af3cf0e');
	$('.result .ktCopy').on('click', function(e){
		Kakao.Share.sendDefault({
		    objectType: 'feed',
		    content: {
		    	title: '2024 지환고사',
		    	description: groupCont[group]+'영역 '+name+'님의 점수는 '+$('.score').text(),
		    	imageUrl: 'https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FeB1Yj7%2Fbtrn8HKdp01%2FlZMtAuvo986os4dCkVoAOk%2Fimg.png',
		    	imageWidth: 1200,
		    	imageHeight: 630,
		    	link: { mobileWebUrl: url, webUrl: url }
		    },
		    buttons: [{
		    	title: '자세히 보기',
		        link: { mobileWebUrl: url, webUrl: url }
		    }]
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
	
	//다시하기
	$('.result .return').on('click', function(){
		progress = 0;
		answerlist = [];
		$('.progress .bar').css('width','12.5%');
		$('.ing .choose ul').empty();
		$('.inputCont input.name').val('');
		$("article.result").fadeOut("fast", function(){
			$("html, body").css('overflow','hidden');
			$(window).scrollTop(0);
		    $("article.intro").fadeIn();
        });
		//history.pushState(null, null, 'exam');
	});

	//해설지보기
	$('.result .review').on('click', function(){
		$('.divExamTt').text('2024 지환고사 : '+groupCont[group]+'영역 해설지');
		$('.divExam').empty();
		
		$('.divExam').append($('<ol>',{'type':'1'}));
		for(var i = 0 ; i < questionCont[group].length ; i++){
			$('.divExam ol').append($('<li>',{'text':questionCont[group][i]}));
			var $ul = $('<ul>');
			for(var j = 0 ; j < chooseCont[group][i].length; j++){
				$ul.append($('<li>',{'text':(j+1)+'. '+chooseCont[group][i][j]}));
			}
			$('.divExam ol').append($ul);
		}
		
		for(var i = 0 ; i < answerCont[group].length ; i++){
			$('.divExam ul:eq('+i+')').find('li').eq(answerCont[group][i]-1).addClass('bold');
			$('.divExam ul:eq('+i+')').append($('<li>',{'class':'comment','text':answerComment[group][i]}));
		}
		
		$('.divLayer').show();
		setTimeout(() => {
			$('.divExam').scrollTop(0);
			$(".layerCont").css({'transform':'translateY(0)','transition':'all ease .2s'});
		}, 10);
		$("html, body").css('overflow','hidden');
	});	
	//해설지 닫기
	$('.layerCont .b_handle').on('click', function(e){
		e.preventDefault();
		$("html, body").css('overflow-x','hidden');
		$("html, body").css('overflow-y','auto');
		$('.divLayer').hide();
		$(".layerCont").css({'transform':'translateY(100%)'});
	});
	//해설지 드래그해서 닫기
	let startY;
	$('.layerCont .b_handle, .divExamTt').on('touchstart', function(evt){
		if($(this).scrollTop() === 0) {
			startY = evt.originalEvent.changedTouches[0].pageY;
		}
	});
	
	$('.layerCont .b_handle, .divExamTt').on('touchmove', function (evt){
		var diff = evt.originalEvent.changedTouches[0].pageY - startY;
		if($(this).scrollTop() === 0 && diff > 0) {
			evt.preventDefault();
		}
	});
	$('.layerCont .b_handle, .divExamTt').on('touchend', function(evt){
		if ($(this).scrollTop() === 0) {
			var diff = evt.originalEvent.changedTouches[0].pageY - startY;

			if (diff > 75){
				$('.layerCont').css({
					transform: 'translateY(100%)'
				});
				setTimeout(function(){
					$('.layerCont .b_handle').trigger('click');
				}, 100);
				startY = 0;
			}
		}
	});
});
//문제유형
function showTypeQuestion(i, ii){
	//문제
	$('.ing .question .imgQ').empty();
	if(questionType[i][ii] == 2){//i=q
		$('.ing .question .imgQ').append($('<img>',{'src':'https://img.sbs.co.kr/news/pc/thumb_v2.png','style':'width:85%;margin-bottom:20;border:1px solid #aaa;'}));
		$('.ing .question').css('height','400px');
	}else{
		$('.ing .question').css('height','');
	}
}
//내용
function showIngData(idx){
	$('.ing .choose ul').empty();
	
	showTypeQuestion(group, idx);
	$('.ing .question span').text(questionCont[group][idx]);
	
	//선택
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
    	if(answerCont[group][j] != answerlist[j]) score-=12.5;
    }

    $('.rstName').text(name);
    $('.score').text(score+"점");
    url = "https://www.jeehwany.com/exam?group="+group+"&name="+name+"&score="+$('.score').text().substring(0,$('.score').text().length-1);
    
    var counter = 0;
    var c = 0;
    var i = setInterval(function(){
    	$(".loading .counter h3").text("채점중");
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
    showContent(group);
}
function showContent(idx){
	if(Number(idx) < 4){
    	$('.recommendCont .recTitle').text("2024년 지환 "+groupCont[idx]+"가\n궁금하다면?");
    }else $('.recommendCont .recTitle').text("2024년 지환 배우가\n궁금하다면?");
	$('.recommendCont .recCont2').empty();
	
	switch(Number(idx)){
		case 0:  //싱클레어
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/vIOaX/btsJfFZzl31/1WLxLqsrEkekz4fQq0BZxK/img.jpg');
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/uIDh-GDr5vo/maxresdefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'마지막 수업'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':'"듣고싶어요.\n내 안의 소리를"'})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/uIDh-GDr5vo")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/a0M5u8ueiks/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'보름달'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':'"우리 마음속에 남는 거지"'})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/a0M5u8ueiks")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/TgmCnvcGI4U/maxresdefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'편지'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':'"테를 늘리는 일이 얼마나 고통스러울지"'})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/TgmCnvcGI4U")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/9XxQQXTtQY8/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'수용'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':'"그건 엄청난 용기가 필요한 거라고"'})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/9XxQQXTtQY8")'}))));
			break;
		case 1: //토루
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/bH4XhJ/btsJg4DP6hD/snrlFkZEYB03rMw525pitK/img.jpg');
			break;
		case 2: //최윤
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/dDkEut/btsJgwgCN6t/3EeDEjmeyW6nwg26cUqTU1/img.jpg');
			break;
		case 3: //데이비
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/po8x9/btsJgGcbRKf/gCSLOItKcvx3H2DAo5DuXk/img.jpg');
			break;
		case 4: //안지환
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/bm3Egw/btsHDIKtOe8/JHRYYWiK44ExfL3HhEP6B0/img.jpg');
			break;
		default: break;
	}	
}
function loadScript(url) {
    const script = document.createElement("script");
    script.src = url;
    script.type = "text/javascript";
    script.defer = true;  // 필요한 경우 async 또는 defer 사용
    document.head.appendChild(script);
}