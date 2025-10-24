import express from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { assert } from 'superstruct';
import {
  CreateUser,
  UpdateUser,
  CreatProduct,
  UpdateProduct,
  CreatOrder,
  UpdateOrder,
  SaveProduct,
} from './structs.js';
import { POST } from './constants.js';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
// postgres에 저장되어 있는 데이터 = 우리가 쓸 수 없음
// prisma client가 Progres 에서 가져 온 데이터를 우리가 사용 할 수 있게 변환 해 줌 = ORM 과정

// 유저가 없을때 처리 하는 내용 => 고차함수 asyncHandler()를 만들고 Get-id 함수마다 사용
// try {
//   const user = await prisma.user.findUniqueOrThrow({
//     where: { id },
//     include: {
//       userPreference: true,
//     },
//   });
// } catch (e) {
//   console.error(e);
//   if (e.code === 'P2025') {
//     // 존재하는 user가 없음
//     return res.status(404).send({ messege: 'Cannot find user' });
//   }
// }

function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      // 터미널에 에러 내용을 출력
      console.error(e);
      // console.error(`e.name : ${e.name}`);

      // Prisma에서 생성한 에러인지 확인 = True
      // console.log(e instanceof Prisma.PrismaClientKnownRequestError);

      // if 구문으로 에러 값을 적어서 여러 에러를 처리 가능!
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        res.sendStatus(404);
      } else if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        res.status(400).send({ message: e.message });
      } else if (e.name === 'StructError') {
        res.status(400).send({ message: e.message });
      } else {
        res.status(500).send({ message: e.mossage });
      }
    }
  };
}

// users GET all
// app.get('/users', async (req, res) => {
//   const users = await prisma.user.findMany();
//   // 객체 형태의 user 데이터

//   res.send(users);
// });

// user GET Filter
app.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 5, order = 'newest' } = req.query;

    let orderBy;
    // findMany 프로퍼티 명과 동일하게 변수 명을 사용함
    switch (order) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // console.log(offset);
    // console.log(limit);
    // console.log(order);

    const users = await prisma.user.findMany({
      orderBy,
      skip: parseInt(offset), // 0 : 1번부터 시작, N : N번부터 시작
      take: parseInt(limit), // 가지고 올 정보 갯수
      include: {
        userPreference: true,
        // user.userPreference; 하면 정의한 관계형 필드를 함께 볼 수 있음
        // 따라서 include 해서 해당 정보를 가져옴
      },
    });

    res.send(users);
  }),
);

// users GET ID
// app.get('/users/:id', async (req, res) => {
//   // 다이나믹 URL = :id
//   // 고정되지 않은 id같은 값을 URL로 써야 할 경우 쓰는 방식
//   const id = req.params.id;
//   const user = await prisma.user.findUnique({
//     where: { id },
//     // shortEnd 문법 -> id:id = id 만 써도 됨
//     include: {
//       userPreference: true,
//       // user.userPreference; 하면 정의한 관계형 필드를 함께 볼 수 있음
//       // 따라서 include 해서 해당 정보를 가져옴
//     },
//   });

//   if (user) {
//     res.send(user);
//   } else {
//     res.status(404).send({ message: 'Cannot find given id' });
//   }
// });

// 유저가 없는 경우에 대한 내용까지 처리
app.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    // findUniqueOrThrow : id로 값을 찾고, 만약 없으면 에러 코드를 내보냄
    const user = await prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        userPreference: true,
      },
    });

    res.send(user);
  }),
);

// users POST 기존
// app.post('/users', async (req, res) => {
//   const data = req.body;
//   const user = await prisma.user.create({
//     data,
//   });

//   res.status(201).send(user);
// });

// users POST 유효성 검사
// app.post('/users', async (req, res) => {
//   const data = req.body;
//   assert(data, CreateUser); //전달받은 데이터 검증을 진행
//   const user = await prisma.user.create({
//     data,
//   });

//   res.status(201).send(user);
// });

// users POST UserPreference 필드 추가
app.post(
  '/users',
  asyncHandler(async (req, res) => {
    assert(req.body, CreateUser); //전달받은 데이터 검증을 진행
    const { userPreference, ...userFields } = req.body;

    // console.log(userPreference);
    // userPreference model 에 사용할 정보
    //{"receiveEmail" : true} 출력

    // console.log(userFields);
    // User model 에 사용할 정보
    // {
    //   email: 'kimdaily11265@naver.com',
    //   firstName: 'daily',
    //   lastName: 'kim',
    //   address: 'seoul in korea'
    // }

    const user = await prisma.user.create({
      data: {
        // email. firstName, lastName.. 기존 값
        ...userFields,
        // 동시에 userPreference라는 데이터까지 함께 만듦
        // 왜냐면 두 개의 모델이 서로 "관계"에 있기 때문에
        userPreference: {
          create: userPreference,
        }, // 별도의 model로 되어있는 userPreference는  [create : userPreference => {"receiveEmail" : true} ] 로 값을 만들어서 사용
      },
      include: {
        userPreference: true,
      }, // 최종 return 결과를 볼 때 User만 표기하는데, 함꼐 만들어진 userPreference 까지 함께 보여달라고 하는 확인용 메세지
    });

    res.status(201).send(user);
  }),
);

app.post(
  '/users/:id/save',
  asyncHandler(async (req, res) => {
    assert(req.body, SaveProduct);
    const { id: userId } = req.params;
    const { productId } = req.body;
    const data = await prisma.user.update({
      where: { id: userId },
      data: {
        savedItems: {
          // savedItems 하려고 하는 Product를 연결하기 위하여 connect :{} 사용
          connect: {
            id: productId,
          },
        },
      },
      include: {
        savedItems: true,
      },
    });
    res.status(201).send(data);
  }),
);

// users PATCH
// app.patch('/users/:id', async (req, res) => {
//   const { id } = req.params;
//   const data = req.body;
//   const user = await prisma.user.update({
//     where: { id },
//     data,
//   });

//   if (user) {
//     res.send(user);
//   } else {
//     res.status(404).send({ message: 'Cannot find given id' });
//   }
// });

app.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 데이터 검증 심화 구문
    // try {
    //   assert(req.body, UpdateUser);
    // } catch (e) {
    //   console.log(e);
    //   return res.status(400).send();
    // }

    // 데이터 검증 간단 구문
    assert(req.body, UpdateUser);

    const { userPreference, ...userFields } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userFields,
        userPreference: {
          update: userPreference,
        },
      },
      include: {
        userPreference: true,
      },
    });

    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: 'Cannot find given id' });
    }
  }),
);

// users DELETE
app.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const user = await prisma.user.delete({
      where: { id },
    });

    if (user) {
      res.send(user);
    } else {
      res.status(404).send({ message: 'Cannot find given id' });
    }
  }),
);

// ===================== Product API Zone ============================

// product GET all
app.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { offset = 0, limit = 10, order = 'newest', category } = req.query;
    let orderBy;
    switch (order) {
      case 'priceLowest':
        orderBy = { price: 'asc' };
        break;
      case 'priceHighest':
        orderBy = { price: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }
    const where = category ? { category } : {};
    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    // 가져오는 갯수 설정이 있는 경우
    // const count = Number(req.query.count) || 10;

    // 가져오는 갯수 설정이 없는 경우
    //   const product = await prisma.product.findMany();

    res.send(products);
  }),
);

app.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const product = await prisma.product.findUniqueOrThrow({
      where: { id },
    });

    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: 'cannot find' });
    }
  }),
);

// product POST
// app.post('/products', async (req, res) => {
//   const data = req.body;
//   const product = await prisma.product.create({
//     data,
//   });

//   if (product) {
//     res.send(product);
//   } else {
//     res.status(404).send({ message: 'Cannot find given id' });
//   }
// });

app.post(
  '/products',
  asyncHandler(async (req, res) => {
    const data = req.body;
    assert(data, CreatProduct);
    const product = await prisma.product.create({
      data,
    });

    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: 'Cannot find given id' });
    }
  }),
);

// product PATCH
app.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const data = req.body;
    const product = await prisma.product.update({
      where: { id },
      data,
    });

    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: 'cannot find' });
    }
  }),
);

// product DELETE
app.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const product = await prisma.product.delete({
      where: { id },
    });

    if (product) {
      res.send(product);
    } else {
      res.status(404).send({ message: 'cannot find' });
    }
  }),
);

// ===================== Order API Zone ============================

app.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const data = await prisma.order.findMany();
    res.send(data);
  }),
);

app.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    let total = 0;
    order.orderItems.forEach((orderItem) => {
      total += orderItem.unitPrice * orderItem.quantity;
    });
    order.total = total;
    res.send(order);
  }),
);

app.post(
  '/orders',
  asyncHandler(async (req, res) => {
    assert(req.body, CreatOrder);
    const { orderItems, ...orderProperties } = req.body;

    // === 재고가 충분한가? stock(재고)와 quentity(주문물량) 비교 ===

    // 1. order body에서 받아온 product Id들을 찾기
    const productIds = orderItems.map((orderItem) => orderItem.productId);

    // 2. orderItem 안에서 productId에 맞는 quentity(주문물량)를 내보냄
    function getQuantity(productId) {
      const orderItem = orderItems.find((orderItem) => orderItem.productId === productId);
      return orderItem.quantity;
    }

    // 3. Prisma 데이터에서 stock을 가져오기 위한 작업
    const products = await prisma.product.findMany({
      // 서버에서 where로 특정 아이디를 찾은 뒤, 그 아이디 안에서 productIds를 찾아옴
      where: { id: { in: productIds } },
    });

    // 4. stock(재고)이 quentity(주문물량)를 넘지 않는지 비교
    const isSufficientStock = products.every((product) => {
      const { id, stock } = product;
      return stock >= getQuantity(id);
    });

    // 5-1. 재고가 부족 한 경우, 조기종료
    if (!isSufficientStock) {
      return res.send(500).send({ message: 'Insufficient Stock' });
    }

    // 5-2. 재고가 있는 경우 해당 아이템을 찾아서, 데이터베이스에 있는 재고를 수정함
    // Promise.all을 사용해서, 각 Product가 여러개 일때 순차적 실행이 아니라 한번에 병렬로 실행되게 선언
    // await Promise.all(
    //   productIds.map((id) => {
    //     prisma.product.update({
    //       where: { id },
    //       data: { stock: { decrement: getQuantity(id) } },
    //       // stock: { decrement: getQuantity(id) }
    //       // stock = stock - getQuantity(id)
    //       // 즉, 기존 재고에서 주문 물량을 빼버림
    //     });
    //   }),
    // );

    // const order = await prisma.order.create({
    //   data: {
    //     ...orderProperties,
    //     orderItems: {
    //       create: orderItems,
    //     },
    //   },
    //   include: {
    //     orderItems: true,
    //   },
    // });

    // 위와 같이 요청 작업을 개별로 하면 서버 요청이 갑자기 중단 될 때 재고 수정만 이뤄지고, 오더는 실행 안될 수 있음

    // 따라서 transaction 하기 위해 변수에 배열로 값을 넣어서 작업을 선언함
    const queries = productIds.map((id) => {
      return prisma.product.update({
        where: { id },
        data: { stock: { decrement: getQuantity(id) } },
      });
    });

    // prisma에서 실행될 내용을 $transaction() 안에 배열로 전달, 순서 상관 없음
    const [order] = await prisma.$transaction([
      // 첫번째 배열 - 오더를 생성하는 작업
      prisma.order.create({
        data: {
          ...orderProperties,
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: true,
        },
      }),
      ...queries,
    ]);

    res.send(order);
  }),
);

app.patch(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    assert(req.body, UpdateOrder);
    const { id } = req.params;
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.send(order);
  }),
);

app.delete(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.delete({
      where: { id },
    });
    res.send(204);
  }),
);

app.listen(POST || 3000, () => console.log('Server Started'));
