// Per-night narration. Plays before customers arrive — the day-1 entry is a
// proper prologue from the grandchild's POV; days 2–7 are short atmospheric
// beats that frame each night.

export const DAY_NARRATION = {
  1: {
    speaker: '나',
    lines: [
      '할머니가 돌아가신 지 일주일이 지났다.',
      '이 산골 마을의 작은 소바집을… 나에게 남기셨다.',
      '오늘부터 내가 영업을 한다.',
      '할머니가 어떤 손님들과, 어떤 밤들을 보내셨는지…',
      '나는 아무것도 알지 못한다.',
      '…노렌을 걸었다. 첫 손님이 온다.',
    ],
  },
  2: {
    speaker: '두 번째 밤',
    lines: [
      '두 번째 밤. 어제 그 손님이… 오늘도 올까.',
    ],
  },
  3: {
    speaker: '세 번째 밤',
    lines: [
      '비가 부슬부슬 내리기 시작했다.',
      '카운터 위 라디오가 조용히 울린다.',
    ],
  },
  4: {
    speaker: '네 번째 밤',
    lines: [
      '산속 깊은 곳에서…',
      '거만한 발걸음 소리가 들린다.',
    ],
  },
  5: {
    speaker: '다섯 번째 밤',
    lines: [
      '새벽 안개. 검은 그림자가 카운터에 앉는다.',
      '…할머니, 이 손님도 단골이셨나요?',
    ],
  },
  6: {
    speaker: '여섯 번째 밤',
    lines: [
      '산을 가르는 폭우.',
      '오늘 밤은… 모두가 모일 것 같다.',
    ],
  },
  7: {
    speaker: '마지막 밤',
    lines: [
      '비가 그쳤다. 달빛이 카운터에 떨어진다.',
      '오늘은 어떤 손님도 오지 않는다.',
      '…단 한 사람을 빼고는.',
    ],
  },
};
