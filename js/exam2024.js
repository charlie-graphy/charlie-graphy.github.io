let group = 0,
	progress = 0,
	name = "",
	groupCont = ['싱클레어','토루','최윤','데이비','안지환'],
	questionCont = [['싱1질문','2질문','3질문','4질문'],['토1질문','2질문']],
	chooseCont = [[['싱1답','2답','3답','4답'],['1-2답','2-2답','3-2답'],['싱1답','2답','3답','4답'],['1-2답','2-2답','3-2답']]
				,[['토1답','2답','3답','4답'],['1-2답','2-2답','3-2답']]];

$(document).ready(function(){
	  // loading page
	  var counter = 0;
	  var c = 0;
	  var i = setInterval(function(){
	      $(".loading .counter h3").html(c + "%");
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
		name = $('.inputCont').val();
		/*if(name == ""){
			alert("이름을 입력해주세요.");
			return false;
		}*/
	    $("article.intro").fadeOut("fast", function(){
		    $("article.ready").fadeIn();
        });
	    
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
		if(progress == questionCont[group].length) resultData();
		else showIngData(progress);
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
    $("article.ing").hide();
    $("article.result").show();
}