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

function getIdx(){
	
}

function sendMessage(msg){	
	const newPostRef = database.ref('posts').push(); // 새로운 게시글 생성
    newPostRef.set({
      content: msg,
      timestamp: new Date().toISOString()
    });
}

function readMessage(){	
	database.ref('posts').on('value', function(snapshot) {
		const posts = snapshot.val();
		const $board = $('#board');
		
        if(posts){
        	Object.keys(posts).forEach(function(key){
        		const post = posts[key];
        		//조회 ${post.content} ${key}
        	});
        }
    });
}