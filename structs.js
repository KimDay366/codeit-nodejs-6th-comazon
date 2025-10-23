import * as s from 'superstruct';
import isEmail from 'is-email'; // 특정 값이 이메일 형식인지 확인하는 라이브러리

// CreateUser : 데이터 등록 = 입력할 모든 값을 검사하여 객체로 내보냄
export const CreateUser = s.object({
  email: s.define('Email', isEmail),
  //s.define() : 특정 함수를 써서 값을 검사함. 앞에 쓴 'Email'은 개발자가 나중에 알아 보기 좋은 명칭 사용
  firstName: s.size(s.string(), 1, 30),
  // s.size() : 문자,숫자 등의 데이터가 사용자가 정한 숫자 내의 길의를 가지고 있는지 확인
  lastName: s.size(s.string(), 1, 30),
  address: s.string(),
});

// UpdateUser : 데이터 수정 = 옵셔널 하게 검사 할 수 있도록 셋팅
export const UpdateUser = s.partial(CreateUser);
// s.partial(CreateUser)
// = CreateUser 객체를 사용하되, 필요한 것 만 옵셔널하게 사용해서 데이터 검사 함

//이미 modeling 할때 선언한 enum의 상세 내역을 CATEGORIES로 다시 한번 저장
const CATEGORIES = [
  'FASHION',
  'BEAUTY',
  'SPORTS',
  'ELECTRONICS',
  'HOME_INTERIOR',
  'HOUSEHOLD_SUPPLIES',
  'KITCHENWARE',
];

export const CreatProduct = s.object({
  name: s.size(s.string(), 1, 60),
  description: s.string(),
  category: s.enums(CATEGORIES),
  // s.enums(CATEGORIES)
  // = 값은 enum인데, 그 중에서 사용할 내용은 CATEGORIES에 있음
  price: s.min(s.number(), 0),
  stock: s.min(s.integer(), 0),
  // s.min() = 최소값으로 유효성 검사, 둘 다 0 이상이면 됨
  // s.number() = 숫자면 다 가능함
  // s.integer() = 정수만 허용
});

export const UpdateProduct = s.partial(CreatProduct);
