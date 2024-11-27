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


$(document).ready(function(){
	group = urlParams.get('group');
	name = urlParams.get('name');
	score = urlParams.get('score');
	$(window).scrollTop(0);
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
		$('.ing .question span').remove();
		$('.ing .question').append($('<span>',{'class':'slide-in','text':questionCont[group][progress]}));
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
	//뒤로가기
	$('.ing a.back').on('click', function(){
		$('.ing .choose ul').empty();
		$('.ing .choose .textCont').hide();
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
		sendMessage($('.ing .choose textarea').val());
		
		setTimeout(() => {
			if(progress == questionCont[group].length) resultData();
			else showIngData(progress);
		},300);
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
		$('.ing .choose .textCont').hide();
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
			//$('.divExam ul:eq('+i+')').append($('<li>',{'class':'comment','text':answerComment[group][i]}));
			$('.divExam ul:eq('+i+')').append(('<li class="comment">'+answerComment[group][i]+'</li>'));
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
		$('.ing .question .imgQ').append(imgQ[i]);
		$('.ing .question').attr('style','height:330px !important;');
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
	$('.ing .question').append($('<span>',{'class':'slide-in','text':questionCont[group][idx]}));

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
	    		$("html, body").css('overflow-x','hidden');
	    		$("html, body").css('overflow-y','auto');
	        	$("article.result").fadeIn();
	        });
	    }
	  }, 10);
    showContent(group, score);
}
function showContent(idx, sco){
	const scoreImg = [["img/test.png","img/test.png","img/test.png"],["img/test.png","img/test.png","img/test.png"],["img/test.png","img/test.png","img/test.png"]
						,["img/test.png","img/test.png","img/test.png"],["img/test.png","img/test.png","img/test.png"]] 
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
			break;
		case 3: //데이비
			$('.recommendCont .recCont1 img').attr('src','https://blog.kakaocdn.net/dn/XlovM/btsKPhwoHGL/yiRgZiA40R4ELi8AGRdfbk/img.jpg');
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/DUgJ8V3XcIo/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'커튼콜(1)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/DUgJ8V3XcIo")'}))));
			$('.recommendCont .recCont2 .page-content').append($('<div>',{'class':'card','style':'background-image:url("https://i.ytimg.com/vi_webp/eEonxsXG74g/maxresdefault.webp")'}).append($('<div>',{'class':'content'}).append($('<div>',{'class':'title','text':'커튼콜(2)'}), $('<div>',{'class':'copy'}).append($('<span>',{'text':''})), $('<button>',{'class':'btn','text':'보러가기','onclick':'window.open("https://youtu.be/eEonxsXG74g")'}))));
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