let progress = 0;
let name = "";
let groupCont = ['싱클레어','토루','최윤','데이비','안지환'];
let questionCont = ['1질문','2질문','3질문','4질문','5질문','6질문','7질문','8질문','9질문'];
let chooseCont = [['1답','2답','3답','4답'],['1-2답','2-2답','3-2답']];
$(document).ready(function(){
	$('.ing .question span').text(questionCont[progress]);
	for(var i = 0 ; i < chooseCont[progress].length; i++){
		$li = $('<li>',{'text':chooseCont[progress][i]});
		$('.ing .choose ul').append($li);
	}
	$('.inputCont input.name').on('input', function(){
	    var value = $(this).val();
        var newValue = value.replace(/[ \{\}\[\]\/?.,;:|\)*~`!^\_+┼<>@\#$%&\'\"\\\(\=₩“”-]/gi, '');
        if(value !== newValue) $(this).val(newValue);
	});
	//시작하기
	$('button.start').on('click', function(){
		name = $('.inputCont').val();
	    $("article.intro").hide();
	    $("article.ready").show();
	    
	    $("html, body").css('overflow','hidden');
	    $('.ready .choose ul').empty();
		for(var i = 0 ; i < groupCont.length; i++){
			$li = $('<li>',{'text':groupCont[i]});
			$('.ready .choose ul').append($li);
		}
	});
	//영역선택
	$('.ready .choose ul').on('click', 'li', function(){
	    $("article.ready").hide();
	    $("article.ing .group").text($(this).text());
	    $("article.ing .group").attr('data-id',$(this).index());
	    $("article.ing").show();
	});

	$('.ready a.back').on('click', function(){
		$("article.intro").show();
		$("article.ready").hide();
		$("html, body").css('overflow-x','hidden');
		$("html, body").css('overflow-y','auto');
	});
	$('.ing a.back').on('click', function(){
	    if(progress == 0){
		    $("article.ready").show();
		    $("article.ing").hide();
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
		if(progress == questionCont.length) resultData();
		else showIngData(progress);
	});
});
function showIngData(idx){
	$('.ing .choose ul').empty();
	$('.ing .question span').text(questionCont[idx]);
	for(var i = 0 ; i < chooseCont[idx].length; i++){
		$li = $('<li>',{'text':chooseCont[idx][i]});
		$('.ing .choose ul').append($li);
	}
}
function resultData(){
    $("article.ing").hide();
    $("article.result").show();
}