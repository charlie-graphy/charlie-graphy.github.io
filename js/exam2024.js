let group = 0,
	progress = 0
	score = 100,
	name = "",
	answerlist = [],
	url = "",
	imgQ = [];
const urlParams = new URL(location.href).searchParams;
loadScript("js/exam2024_msg.js");
loadScript("js/exam2024_data.js");

$(window).on('resize orientationchange', function() {
	if(!$('.ready').is(':hidden') || !$('.ing').is(':hidden')){
	    if(window.matchMedia("(orientation: portrait)").matches) {// 세로일 때
			$("html, body").css({'overflow-y':'hidden'});
	    	$(window).scrollTop(0);
	    }else { // 가로일 때
			$("html, body").css({'overflow-y':'auto'});
	    }
	}
});

$(window).on('beforeunload', function() {
    disconnect();
});

$(document).ready(function(){
	$(window).trigger('resize');
	$(window).scrollTop(0);
	
	group = urlParams.get('group');
	name = urlParams.get('name');
	score = urlParams.get('score');
    let isDragging = false,
    	imgQList = ['img/q1.jpeg','img/q2.jpeg','img/q3.jpeg','img/q4.jpeg'];
    
    for(let i = 0; i < imgQList.length; i++) {
        imgQ[i] = $('<img>',{'class':'slide-in','src':imgQList[i],'style':'height:230px;margin-bottom:20;border:1px solid #aaa;'})
    }
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
					$('.titleText .group').attr('data-id',group);
					$('.titleText .group').text(groupCont[group]);
				    $('.score').text(score+"점");
				    url = "https://www.jeehwany.com/exam?group="+group+"&name="+name+"&score="+score;
		    		$("html, body").css({'overflow-x':'hidden','overflow-y':'auto'});
		    		showContent(group, score);
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
	    	$("html, body").css('overflow','hidden');
		    $("article.ready").fadeIn();
        });
	    
	    $('.ready .choose ul').empty();
		for(var i = 0 ; i < groupCont.length; i++){
			$li = $('<li>',{'text':groupCont[i]});
			$('.ready .choose ul').append($li);
		}
	});
	//메시지
	$('#msgIcon').on('click', function(){
		/*if(new Date().getHours() <= 12 && new Date().getMinutes() <= 11){
			$('.howtoCont').text("12:11 PM에 오픈됩니다.");
			$('.modal').fadeIn(400).delay(400).fadeOut(400);
			return false;
		}*/
		$('.msgCont').empty();
		$('#msgIcon').addClass('bi-envelope-open-heart');
		$('#msgIcon').removeClass('bi-envelope-heart');
		readMessage();
		$("article.intro").fadeOut("last", function(){
	    	$(window).scrollTop(0);
		    $("article.message").fadeIn();
			$(".msgCont").css({'overflow':'hidden auto','padding-bottom':'50px'});
        });
	});
	//영역선택
	$('.ready .choose ul').on('click', 'li', function(){
	    $("article.ing .group").text($(this).text());
	    $("article.ing .group").attr('data-id',$(this).index());
	    group = $(this).index();

	    showTypeQuestion(group, progress);
		$('.ing .question span').remove();
		$('.ing .question').append(('<span class="slide-in" style="margin:auto;">'+questionCont[group][progress]+'</span>'));
		for(var i = 0 ; i < chooseCont[group][progress].length; i++){
			$li = $('<li>',{'class':'slideIn','text':chooseCont[group][progress][i],'style':'color:black;background-color:white;opacity:1;'});
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
	//ing 뒤로가기
	$('.ing a.back').on('click', function(){
		$('.ing .choose ul').empty();
		$('.ing .choose .textCont').hide();
		$('textarea').val('');
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
	//msg 뒤로가기
	$('.message a.back').on('click', function(){
		$("article.message").fadeOut("fast", function(){
	    	$(window).scrollTop(0);
		    $("article.intro").fadeIn();
			$('#msgIcon').removeClass('bi-envelope-open-heart');
			$('#msgIcon').addClass('bi-envelope-heart');
			disconnect();
        });
	});
	
	//문항선택
	$('.ing .choose ul').on('click', 'li', function(){
		progress+=1;
		$(this).css({'color':'white','background-color':'#ffa205'});
		$('.progress .bar').css('width',(progress+1)*12.5+'%');
		answerlist.push($(this).index()+1);
		
		setTimeout(() => {
			if(progress == questionCont[group].length) resultData();
			else showIngData(progress);
		},300);
	});
	//textarea 완료
	$('.ing .choose .btnSucces').on('click', function(){
		progress+=1;
		$('.progress .bar').css('width',(progress+1)*12.5+'%');
		answerlist.push($('.ing .choose textarea').val());
		
		//전송
		if($('.ing .choose textarea').val() != ""){
			sendMessage($('.ing .choose textarea').val());
		}
		
		setTimeout(() => {
			if(progress == questionCont[group].length) resultData();
			else showIngData(progress);
		},300);
		setTimeout(() => { disconnect(); },1000);
	});

	//페이스북 공유
	$('.result .fbCopy').on('click', function(){
		const text = encodeURIComponent($('.ing .titleText').text().substring(1)+" - "+name+"님의 점수는 "+$('.score').text());
		var facebookUrl = `https://www.facebook.com/sharer/sharer.php?t=`+text+`&u=`+encodeURIComponent(url);

        window.open(facebookUrl, '_blank', 'width=600,height=400');
	});
	
	//x(트위터) 공유
	$('.result .xCopy').on('click', function(){
		const text = encodeURIComponent($('.ing .titleText').text().substring(1)+" - "+name+"님의 점수는 "+$('.score').text());
		const encodedUrl = encodeURIComponent("https://www.jeehwany.com/exam?group="+group+"&name="+encodeURIComponent(name)+"&score="+score);
		const xUrl = 'https://twitter.com/intent/tweet?text='+text+'&url='+encodedUrl;

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
		    	imageUrl: 'https://blog.kakaocdn.net/dn/b7SiG3/btsK8sqyQcF/AZfSza1WZz4SYqrYmQTvkK/img.png',
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
		$('.ing .choose .textCont').hide();
		$('.inputCont input.name, textarea').val('');
		$("article.result").fadeOut("fast", function(){
			$(window).scrollTop(0);
		    $("article.intro").fadeIn();
        });
		history.pushState(null, null, 'exam');
	});

	//해설지보기
	$('.result .review').on('click', function(){
		$('.divExamTt').text('2024 지환고사 : '+groupCont[group]+'영역 해설지');
		$('.divExam').empty();
		
		$('.divExam').append($('<ol>',{'type':'1','class':'q'}));
		for(var i = 0 ; i < questionCont[group].length ; i++){
			$('.divExam ol.q').append(('<li>'+questionCont[group][i]+'</li>'));
			var $ol = $('<ol>',{'type':'1','class':'c'});
			for(var j = 0 ; j < chooseCont[group][i].length; j++){
				$ol.append($('<li>',{'text':chooseCont[group][i][j]}));
			}
			$('.divExam ol.q').append($ol);
		}
		
		for(var i = 0 ; i < answerCont[group].length ; i++){
			$('.divExam ol.c:eq('+i+')').find('li').eq(answerCont[group][i]-1).addClass('bold');
			if(answerComment[group][i] != '') $('.divExam ol.c:eq('+i+')').append(('<li class="comment">'+answerComment[group][i]+'</li>'));
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
		$("html, body").css({'overflow-x':'hidden','overflow-y':'auto'});
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
		$('.ing .question .imgQ').append(imgQ[i]);
		$('.ing .question').attr('style','height:290px !important;');
	}else{
		$('.ing .question').css('height','');
	}
}
//내용
function showIngData(idx){
	$('.ing .choose ul').empty();
	$('.ing .choose .textCont').hide();
	
	showTypeQuestion(group, idx);
	$('.ing .question span').remove();
	$('.ing .question').append(('<span class="slide-in" style="margin:auto;">'+questionCont[group][idx]+'</span>'));

	//선택
	if(questionType[group][idx] == 3){ //a=t
		$('.ing .choose .textCont').show();
	}else {
		for(var i = 0 ; i < chooseCont[group][idx].length; i++){
			$li = $('<li>',{'class':'slide-in','text':chooseCont[group][idx][i],'style':'color:black;background-color:white;'});
			$('.ing .choose ul').append($li);
		}
	}
}
function resultData(){
	score = 100;
    $("article.ing").hide();
    $("article.loading").show();
    
    //채점
    for(var j = 0 ; j < answerlist.length ; j++){
    	if(answerCont[group][j] != 'X' && answerCont[group][j] != answerlist[j]) score-=12.5;
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
	    		$("html, body").css({'overflow-x':'hidden','overflow-y':'auto'});
	        	$("article.result").fadeIn();
	        });
	    }
	  }, 10);
    showContent(group, score);
}
function showContent(idx, sco){
	const scoreImg = [["https://blog.kakaocdn.net/dn/0Toir/btsK9jsNEGd/pkMBiipZaXbY243yXZVb1K/img.png","https://blog.kakaocdn.net/dn/bi935o/btsK8YvFtdQ/wHAOs9MSzSmBehV4nQ0NGK/img.png","https://blog.kakaocdn.net/dn/vEsgr/btsK74DxJQD/vK4kSqbF7cBOU8rbd6Nto0/img.png"]
						,["https://blog.kakaocdn.net/dn/DaOO5/btsK87sBAL1/DPdtoslXzsrF7rB5vfqvb0/img.png","https://blog.kakaocdn.net/dn/bcdden/btsK9PEPZzp/DObevEQPV3QiAfj13jW2s0/img.png","https://blog.kakaocdn.net/dn/c5AYfi/btsK9NtuhZY/wOee2YOn0WJEr9O1Rcj2d1/img.png"]
						,["https://blog.kakaocdn.net/dn/bGKiXd/btsK7dgLgGZ/68S9BWhbgC5PkcUF57Bx11/img.png","https://blog.kakaocdn.net/dn/ckC4r4/btsK8v8Cyri/5q4UzHWQZKdAKZ1Z5n2fg0/img.png","https://blog.kakaocdn.net/dn/Wa5P4/btsK9NAeW7i/j0kSdDK2UiOggOZI72AMzk/img.png"]
						,["https://blog.kakaocdn.net/dn/c4mJUP/btsK7OOpay1/D8yc0rjPTQVFu61xYG6dc0/img.png","https://blog.kakaocdn.net/dn/bD1rdE/btsK88ruMSK/G2aarZCPqybjBU1Ihu0Thk/img.png","https://blog.kakaocdn.net/dn/JFLCW/btsK9TN0FD8/3cURczPDYANJi1Vhz0ixKk/img.png"]
						,["https://blog.kakaocdn.net/dn/sc91k/btsK7DTXsUZ/ay7kjW9wdKCmHMtxKWOJH1/img.png","https://blog.kakaocdn.net/dn/v7g6e/btsK9PEP0sh/EX7YCPOFqkkMr20Jf4uEf1/img.png","https://blog.kakaocdn.net/dn/chBrpQ/btsK9xj7MKz/zQbmvXDTkuvGI7ceJzYcM1/img.png"]] 
	if(sco <= 40) $('.result .resultImgCont img').attr('src',scoreImg[idx][0]);
	else if(sco >= 41 && sco <= 75)  $('.result .resultImgCont img').attr('src',scoreImg[idx][1]);
	else $('.result .resultImgCont img').attr('src',scoreImg[idx][2]);
	
	if(Number(idx) < 4){
    	$('.recommendCont .recTitle').text("2024년 지환 "+groupCont[idx]+"가\n궁금하다면?");
    }else $('.recommendCont .recTitle').text("2024년 지환 배우가\n궁금하다면?");
	$('.recommendCont .recCont2 .page-content').empty();
	
	switch(Number(idx)){
		case 0:  //싱클레어
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/RMiPn/btsKPRD6ZCx/ksQjghTKATL9HQuHLktATK/img.jpg');
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/uIDh-GDr5vo/maxresdefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'마지막 수업'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/uIDh-GDr5vo")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/a0M5u8ueiks/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'보름달'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/a0M5u8ueiks")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/TgmCnvcGI4U/maxresdefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'편지'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/TgmCnvcGI4U")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/9XxQQXTtQY8/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'수용'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/9XxQQXTtQY8")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/fLc4WWo6VFI/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'온더로드'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/fLc4WWo6VFI")'}))));
			break;
		case 1: //토루
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/ZWGkK/btsKPQd0yUK/DzFzpTnisWP0B3394RJgF0/img.jpg');
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/rpj2LhxvAxc/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'커튼콜(1)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/rpj2LhxvAxc")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/pH44E1XJ4pg/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'커튼콜(2)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/pH44E1XJ4pg")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/BPWaUkE8Zlw/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'커튼콜(3)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/BPWaUkE8Zlw")'}))));
			break;
		case 2: //최윤
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/BDOPa/btsKQ8EQ2Uc/gDO4Xsae7XFdhCCzF3I3M1/img.jpg');
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/id7WpsHWCZQ/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'등등곡'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/id7WpsHWCZQ")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/pVwLQejFfMA/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'놀아보자'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/pVwLQejFfMA")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/_aMJZn7oX-s/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'그런 세상'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/_aMJZn7oX-s")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/c8RKNwIhoqk/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'태평성대'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/c8RKNwIhoqk")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/PcFz2DyieNk/maxresdefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'그래도 가겠다'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/PcFz2DyieNk")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/GMqSSWmBU88/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'어화둥둥'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/GMqSSWmBU88")'}))));
			break;
		case 3: //데이비
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/XlovM/btsKPhwoHGL/yiRgZiA40R4ELi8AGRdfbk/img.jpg');
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/DUgJ8V3XcIo/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'커튼콜(1)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/DUgJ8V3XcIo")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/eEonxsXG74g/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'커튼콜(2)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/eEonxsXG74g")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/moLr80ym83k/maxres2.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'캐릭터 티저'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtube.com/shorts/moLr80ym83k")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/7ZD3X-gYvwI/oardefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'데일리 킬롤로지'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtube.com/shorts/7ZD3X-gYvwI")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/l88EhZIT-FM/maxresdefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'하이라이트'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/l88EhZIT-FM")'}))));
			break;
		case 4: //안지환
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/bm3Egw/btsHDIKtOe8/JHRYYWiK44ExfL3HhEP6B0/img.jpg');
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/4LH1OidAlzk/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'바톤콘서트(1)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/4LH1OidAlzk")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/P8LTtJCeyKs/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'바톤콘서트(2)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/P8LTtJCeyKs")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/gkPDa2lO36A/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'퇴근길(1)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/gkPDa2lO36A")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi/yIdeZFx9xz8/maxresdefault.jpg")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'퇴근길(2)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/yIdeZFx9xz8")'}))));
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