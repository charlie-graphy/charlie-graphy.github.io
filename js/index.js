//쿠키 설정 함수
function setCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// 쿠키 가져오기 함수
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

// 페이지 로드 시 쿠키 확인 후 모달 표시 여부 결정
$(document).ready(function(){
    var popupClosed = getCookie('popupClosed');
    if (!popupClosed) {
        //$('#modal').css('display','flex');
	 	$('#modal').remove();
    }

	 // 'X' 닫기 버튼 클릭 시 모달 닫기
	 $('#closeX').on('click', function(e){
	 	$('#modal').hide();
	 });
	
	 // '닫기' 버튼 클릭 시 모달 닫기
	 $('#closeBtn').on('click', function(e){
	 	$('#modal').hide();
	 });
	
	 // '오늘 하루동안만 닫기' 버튼 클릭 시 모달 닫고 쿠키 설정
	 $('#closeToday').on('click', function(e){
	     setCookie('popupClosed', 'true', 1); // 1일 동안 쿠키 설정
	 	$('#modal').hide();
	 });
	
	 // 모달 외부 클릭 시 모달 닫기 (선택 사항)
	 $('#closeToday').on('click', function(e){
	 	if (e.target == $('#modal')) {
	 		$('#modal').hide();
	     }
	 });
});