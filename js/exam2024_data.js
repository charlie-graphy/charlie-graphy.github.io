const firebaseConfig = {
	    apiKey: "AIzaSyCmF81jQ27FLmyb1zZgT6pEboTpeFUUt-k",
	    authDomain: "ahnjeehwany.firebaseapp.com",
	    databaseURL: "https://ahnjeehwany-default-rtdb.firebaseio.com",
	    projectId: "ahnjeehwany",
	    storageBucket: "ahnjeehwany.firebasestorage.app",
	    messagingSenderId: "4142402443",
	    appId: "1:4142402443:web:773ee03ac4ff8631183d8e",
	    measurementId: "G-BWPFC2L1VG"
	  };
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let messageRef = database.ref('posts');

function sendMessage(msg){	
	const newPostRef = database.ref('posts').push();
	const currentTime = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    newPostRef.set({
      content: msg,
      timestamp: currentTime
    }).then(() => {
        console.log("메시지 전송 완료");
        disconnect(); // 전송 후 연결 해제
    }).catch(error => {
        console.error("메시지 전송 오류:", error);
    });
}

function readMessage(){
	firebase.database().goOnline();
	if(messageRef) messageRef.off(); // 이전 리스너 해제
	messageRef = database.ref('posts'); // 새로운 리스너 추가
	messageRef.on('value', function(snapshot) {
		const posts = snapshot.val();
		const $board = $('.msgCont');
		
        if(posts){
        	Object.keys(posts).forEach(function(key){
        		const post = posts[key];
        		const $tape = $('<div>',{'class':'tape','text':''});
        		const $cont = $('<div>',{'class':'msg','data-dt':post.timestamp}).append($('<p>'+post.content+'</p>'));
        		$board.append($('<div>',{'class':'postit slide-in'}).append($tape, $cont));
        	});
        }
    });
	
	setTimeout(() => { disconnect() },10000);
}

//연결을 종료하고 Firebase 오프라인 처리하는 함수
function disconnect(){
	if(messageRef) messageRef.off(); // 리스너 해제
	firebase.database().goOffline(); // Firebase 연결 끊기
}