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


function sendMessage(msg){
	firebase.initializeApp(firebaseConfig);
	var db = firebase.database();
	
	firebase.database().ref('2024/').set(msg);	
}