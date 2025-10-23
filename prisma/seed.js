import { PrismaClient } from '@prisma/client';
import { USERS } from './mock.js';
import { PRODUCTS } from './mock.js';

const prisma = new PrismaClient();

async function main() {
  // 기존 데이터 삭제
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  // deleteMany() : where 필터를 넣지않고 명령하면 저장된 모든 데이터를 지움

  // Mock 데이터 삽입
  await prisma.user.createMany({
    data: USERS,
    // 전송 할 데이터를 data 값으로 넣어줌
    skipDuplicates: true,
    // 데이터 삽입 작업 시 uuid 기준으로 중복 데이터가 있을 경우 Skip 하라는 옵션 명령어
  });
  await prisma.product.createMany({
    data: PRODUCTS,
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    // 입력 과정이 끝나면, $disconnect를 사용하여 서버와의 연결을 종료시킴
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.log(e); // 1. 에러를 출력하고
    await prisma.$disconnect(); // 2. 서버와의 연결을 종료 한 뒤
    process.exit(1); // 3. seed.js 프로세서도 종료
    // process = 현재 작업중인 seed.js 자체를 의미
    // process.exit = seed.js 를 종료시킴
  });
