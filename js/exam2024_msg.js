const groupCont = ['싱클레어','토루','최윤','데이비','안지환'],
	questionType = [[1,2,1,1,1,1,1,1],[1,1,1,1,2,1,1,1],[1,1,1,1,1,1,2,1],[2,1,1,1,1,1,1,1]],//1t,2i-q(3개까지),3-t
	questionCont = [['<헤르츠클란> 8회차 관람 혜택에 있는 ‘Voice Letter’에서 지환 싱클레어는 누구에게 편지를 썼나요?','싱클레어의 욕망으로 옳은 것은?','‘8장.수용’에서 지환 싱클레어가 다친 크나우어에게 한 행동 중 옳은 것은?','다음 중 지환 싱클레어가 다즐링을 마시려고 할 때 한 행동 중 아닌 것은?','다음 중 싱클레어가 데미안에게 하는 말로 아닌 것은?','다음 중 싱클레어의 집안-학교 이름으로 옳은 것은?','지환 싱클레어가 크나우어의 수첩을 가져가서 취소하라고 말한다.\n 이때, 덧붙이는 말은?','“음주 ?회, 흡연 ?회, 무단 외출 ?회. 신성 모독 ?회.”\n\n다음 대사는 싱클레어가 퇴사하게 된 사유이다.\n 각 횟수의 총합을 구하세요.'],
					['다음 중 요시오가 토루에게 같이 보러 가자는 것으로 옳은 것은?','다음 중 토루의 풀네임으로 옳은 것은?','토루는 카즈에에게 각자 만의 시간을 갖자면서 농구 연습을 한다.\n 다음 중 지환 토루의 농구 연습으로 옳은 것은?','카즈에와 유우카는 오키나와 여행 허락을 받자 신나게 노래를 부른다.\n 토루에게 "창문을 열어보니?"라고 물었을 때, 이어질 지환 토루의 대사로 아닌 것은?','다음 중 사진 속 지환 토루의 표정으로 옳은 것은?','지환 토루가 오카자키의 패스 받는 걸 재현할 때 하는 말로 아닌 것은?','다음 중 토루가 살다 살다 처음 들은 소리로 옳은 것은?','“탕관이라는 것은, 현세에서의 OO, OO, OO 등을 씻어내는 의식입니다.”\n 다음 대사에서 빈칸에 들어갈 말로 옳은 것은?'],
					['다음 중 최윤이 부채를 쓰지 않고 부르는 넘버로 옳은 것은?','다음 중 지환 배우님이 한 등등곡 스페셜 커튼콜로 아닌 것은?','다음 중 지환 윤이 초한테 하는 말이 아닌 것은?','다음 중 ‘놀아보자’에서 지환 최윤이 진명이에게 하는 행동으로 아닌 것은?','다음 중 ‘어화둥둥’, ‘어화둥둥 Rep.’ 두 넘버에서 ‘어화둥둥’이 나온 횟수로 옳은 것은?','다음 중 지환 윤이 초에게 친구가 될 수 없겠다면서 하는 욕으로 옳은 것은?','다음 중 최윤이 갓을 쓰고 부르는 넘버로 옳은 것은?','다음 중 ‘뮤지컬 <등등곡> #이것저것 기타등등 (숏)인터뷰’ 영상에서 안지환 최윤의 2행시로 옳은 것은? (<a href="https://youtu.be/Rd7HsDNyMyU?start=18" target="_blank" style="color: darkblue;">힌트</a>)'],
					['데이비가 키우는 강아지인 ‘메이시’는 어떤 종과 섞인 잡종인가요?','다음 중 지환 데이비가 “내가 널 본다”라고 농담한 용어의 실제 뜻으로 옳은 것은?','마지막 독백 전에 지환 데이비가 벽에 있는 낙서를 어떻게 하는지 아닌 것을 고르세요.','“_시엔 자 딴 짓 좀 하지 말고.”\n“소시지 _개를 더 내놔야 하니까.”\n“빌어먹을 _파운드..”\n“__살이 되니까 풀려났어요!”\n위는 데이비들의 대사이다. 빈칸에 맞는 숫자의 총합을 구하세요.','?????','다음 중 지환 데이비가 벽에 쓰는 낙서로 아닌 것은?','다음 중 데이비가 도움이 필요하다며 찾아간 선생님으로 옳은 것은?','지환 데이비가 “이게 어떻게 공평해?” 다음 추가로 생긴 대사 중 옳은 것은?'],
					['안']],
	chooseCont = [[['데미안','싱클레어','크나우어','아버지'],['사랑하고 싶어요.','여행하고 싶어요.','듣고 싶어요.'],['크나우어의 옷을 털어준다.','크나우어의 치료해 준다.','같이 달을 보자고 한다.','크나우어를 혼낸다.'],['다즐링에 과자를 찍어 먹는다.','다즐링을 호호 불어 마신다.','데미안이 다 마셔서 마시지 못한다.','다즐링을 마시지 않는다.'],
					['아름다운 건 왜 우릴 스쳐 지나가는 걸까요?','내가 욕망을 억누른 채 살아간다고?','말재주 한 번 상당하시네.','좋아해요.'],['알폰스 - 에일리','헤일리히 - 에일리히 ','에일리히 - 헤일리히','에인리 - 할루치'],['귀엽게','멋있게','용감하게','진지하게'],['9','10','11','12']]
				,[['보름달','유성우','불꽃놀이','해돋이'],['우즈마키  토루','사카모토 토루','나카무라 토루','사카무라 토루'],['슛 연습','패스 연습','방어 연습','몸싸움 연습'],['오키나와 예!','죄송합니다!','짜잔!'],['애매한 표정','모호한 표정','평범한 표정'],
					['오카자키, 고맙다.','오카자키, 땡큐.','오카자키, 내가 해결 해볼게.','오카자키, 좋은 패스였다.'],['시금치 좋아하는 얼굴이에요.','시금치 닮았어요.','시금치랑 잘 어울리는 얼굴이에요.','시금치를 많이 먹고 자란 얼굴이에요.'],['미움, 분노, 괴로움','슬픔, 불안, 번뇌','번뇌, 아픔, 고통','고통, 미움, 후회']]
				,[['운파월래 ','놀아보자','다른 세상','어화둥둥 Rep.'],['다른 세상','그런 세상','그래도 가겠다','놀아보자'],['내가 그리 싫은 겐가?','내가 왜 싫지…','야..!','마..!'],['엉덩이를 때린다.','볼을 꼬집는다.','상투를 잡는다.','거꾸로 든 책을 원상태로 돌려준다.'],
					['9번','10번','11번','12번'],['제기랄','빌어먹을','우라질','염병할'],['상소문','태평성대','어화둥둥 Rep.'],['최첨단의 시대에 사는 제가\n윤이를 어떻게 표현할지..','최고로 멋진\n윤이로다','최수종 선배님의 사극 정신을 물려받아\n윤을 연기하겠나이다.','최고의 무대에서\n윤이 이름을 빛내리라!']]
				,[['리트리버','보더콜리','슈나우저'],['중환자실','집중치료실','응급실','방사선실'],['낙서를 그대로 둔다.','낙서에 X 표시를 한다.','낙서를 전부 지운다.',"그림만 지우고, 'DAD' 사이에 'E'를 넣어 'DEAD'로 만든다."],['22','24','29','30'],
					['','','',''],['DAD','카우보이 모자','메이시','아이스크림'],['데미안','해리스','스트라우드','헤지스'],['이게 맞아?','이게 말이 돼?','말도 안돼','이게 가능해?']]
				,[['안1답','2답','3답','4답']]],
	answerCont = [[4,3,1,4,2,3,2,3]
				,[3,2,4,3,1,2,1,3]
				,[3,1,4,3,2,3,2,4]
				,[2,1,2,3,3,3,2,1]
				,[1,'X']],
	answerComment = [['지환 싱클레어는 아버지께 구원을 바라며 편지를 썼습니다. (<a href="https://youtu.be/lRbJbSsWFJc?start=54" target="_blank">참고 영상</a>)','싱클레어는 자신의 내면의 소리를 듣고 싶다고 말했습니다. (<a href="https://youtu.be/uIDh-GDr5vo?start=62" target="_blank">참고 영상</a>)','지환 싱클레어는 크나우어의 상태를 살피며 크나우어의 옷을 털어주거나, 털어준 뒤 건네줍니다. (<a href="https://youtu.be/9XxQQXTtQY8?start=74" target="_blank">참고 영상</a>)','지환 싱클레어는 다즐링을 마시거나 못 마신 적은 있지만, 마시지 않은 적은 없습니다.'
						, '<i>“내가 욕망을 억누른 채 살아간다고?”</i> 는 싱클레어가 벡한테 하는 말입니다.','<i>“헤일리히에 입학한 에일리히라..”</i>\n- 알폰스 벡 대사 中','지환 싱클레어는 크나우어에게 멋있게 취소하라고 말합니다.','<i>“음주 5회, 흡연 3회, 무단 외출 2회. 신성 모독 1회.”</i>\n5+3+2+1 = 11'],
					['<i>“토루! 우리 다음 주에 불꽃축제 같이가자! 너 약속했다!”</i>\n- 요시오 대사 中','토루의 풀네임은 ‘사카모토 토루’ 입니다.','지환 토루는 <i>“적당히 해라.” </i>하면서 몸싸움 연습을 했습니다.','지환 토루는 “오키나와 예!” 따라 부르거나 날아간 비키니를 잡았을 때 “죄송합니다!” 라고 사과했습니다.'
						,'지환 토루가 요시오 사진을 보고 애매한 표정이라면서 짓습니다.', '토루는 오카자키한테 영어로 고맙다고 하지 않았습니다.','마사미가 시금치 좋아하는 얼굴이라고 말하고 초면에 이상한 말이라며 사과하자, 토루는 살다 살다 그런 얘기는 처음 들어봤다고 했습니다','<i>“탕관이라는 것은, 현세에서의 번뇌, 아픔, 고통 등을 씻어내는 의식입니다.”</i>\n- 토루 대사 中'],
					['‘다른 세상’ 넘버에서 최윤은 술병을 들고 있습니다.','지환 배우님이 <등등곡>에서 한 스페셜 커튼콜은 ‘등등곡, 놀아보자, 그런 세상, 태평성대, 그래도 가겠다’ 입니다.','지환 윤은 초에게 “마!”라고 한 적이 않습니다.','지환 윤은 진명이의 상투를 잡지 않습니다.'
						,'‘M7. 어화둥둥’ 넘버에서 4번, ‘M20. 어화둥둥 Rep.’ 넘버에서 7번.\n총 10번입니다.','<i>“이런, 우라질.. 그렇다면 우린 친구가 될 수 없겠네.”</i>\n- 지환 최윤 대사 中','‘태평성대’ 넘버에서만 유일하게 갓을 쓰고 있습니다. (<a href="https://youtu.be/c8RKNwIhoqk?start=91" target="_blank">참고 영상</a>)','최수종 선배님의 사극 정신을 물려받아\n윤을 연기하겠나이다. (<a href="https://youtu.be/Rd7HsDNyMyU?start=18" target="_blank">참고 영상</a>)'],
					['<i>“잡종이긴 한데, 보더콜리가 많이 섞였대”</i>\n-  데이비 대사 中','내가 널 본다고 농담한 용어는 ICU이고, 중환자실을 뜻합니다.','공연 중 지환 데이비는 벽에 그린 낙서에 X 표시 하지 않았습니다.','“9시엔 자 딴 짓 좀 하지 말고.”\n“소시지 2개를 더 내놔야 하니까.”\n“빌어먹을 5파운드..”\n“13살이 되니까 풀려났어요!”\n9+2+5+13 = 29'
						,'?????','지환 데이비는 벽에 DAD를 쓰고 아이스크림과 카우보이 모자 그림을 그립니다.','<i>“저는 해리스 선생님한테 찾아갔어요. 선생님, 저 도움이 필요해요!”</i>\n- 데이비 대사 中','<i>“이게 어떻게 공평해? 이게 맞아? 이게 맞냐고..”</i>\n- 지환 데이비 대사 中'],
					[]];
