let group = 0,
	progress = 0,
	name = "",
	answerlist = [];
const groupCont = ['싱클레어','토루','최윤','데이비','안지환'],
	questionCont = [['싱1질문','2질문','3질문','4질문'],['토1질문','2질문']],
	chooseCont = [[['싱1답','2답','3답','4답'],['1-2답','2-2답','3-2답'],['싱1답','2답','3답','4답'],['1-2답','2-2답','3-2답']]
				,[['토1답','2답','3답','4답'],['1-2답','2-2답','3-2답']]],
	answerCont = [[1,2,3,4],[1,2]];

$(document).ready(function(){
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
	        $('.loading').fadeOut("slow", function(){
		        $('.intro').fadeIn();
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
		    $("article.ready").fadeIn();
        });
	    
	    $(window).scrollTop(0);
	    $("html, body").css('overflow','hidden');
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
			$li = $('<li>',{'text':chooseCont[group][progress][i]});
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
		$("html, body").css('overflow-x','hidden');
		$("html, body").css('overflow-y','auto');
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
		
	});
	
	//x 공유
	$('.result .xCopy').on('click', function(){
		//현재 페이지의 URL을 가져옵니다.
        var url = encodeURIComponent("https://www.jeehwany.com/exam");
        var text = encodeURIComponent($('.ing .titleText').text().substring(1)+" - "+name+"님의 점수는 "+"점"); //텍스트
        //var hashtags = '&hashtags='+encodeURIComponent("example,webdevelopment"); // 해시태그 설정

        // 트위터 공유 URL을 생성합니다.
        var twitterUrl = 'https://x.com/intent/post?url='+url+'&text='+text;

        // 새로운 창으로 트위터 공유 링크를 엽니다.
        window.open(twitterUrl);
	});
	
	//URL 공유
	$('.result .urlCopy').on('click', function(){
		//Clipboard API를 사용하여 현재 URL 복사
        navigator.clipboard.writeText("https://www.jeehwany.com/exam")
        .then(function() {
        	$('.howtoCont').text('URL이 복사되었습니다.');
        }).catch(function() {
        	$('.howtoCont').text('URL 복사에 실패했습니다.');
        });
		$('.modal').fadeIn(400).delay(400).fadeOut(400);
	});
	
	//다시하기
	$('.result .return').on('click', function(){
		progress = 0
		$('.progress .bar').css('width','10%');
		$('.ing .choose ul').empty();
		$("article.result").fadeOut("fast", function(){
		    $("article.intro").fadeIn();
        });
	});
});
function showIngData(idx){
	$('.ing .choose ul').empty();
	$('.ing .question span').text(questionCont[group][idx]);
	for(var i = 0 ; i < chooseCont[group][idx].length; i++){
		$li = $('<li>',{'text':chooseCont[group][idx][i]});
		$('.ing .choose ul').append($li);
	}
}
function resultData(){
	let score = 100;
    $("article.ing").hide();
    $("article.loading").show();
    
    
    //채점
    for(var j = 0 ; j < answerlist.length ; j++){
    	if(answerCont[group][j] != answerlist[j]) score-=10;
    }

    $('.rstName').text(name);
    $('.score').text(score+"점");
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