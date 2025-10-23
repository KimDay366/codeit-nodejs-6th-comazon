import express from 'express';
import { PrismaClient } from '@prisma/client';
import { assert } from 'superstruct';
import { CreateUser, UpdateUser, CreatProduct, UpdateProduct } from './structs.js';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
// postgres에 저장되어 있는 데이터 = 우리가 쓸 수 없음
// prisma client가 Progres 에서 가져 온 데이터를 우리가 사용 할 수 있게 변환 해 줌 = ORM 과정

// users GET all
// app.get('/users', async (req, res) => {
//   const users = await prisma.user.findMany();
//   // 객체 형태의 user 데이터

//   res.send(users);
// });

// user GET Filter
app.get('/users', async (req, res) => {
  const { offset = 0, limit = 0, order = 'newest' } = req.query;

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
  });

  res.send(users);
});

// users GET ID
app.get('/users/:id', async (req, res) => {
  // 다이나믹 URL = :id
  // 고정되지 않은 id같은 값을 URL로 써야 할 경우 쓰는 방식
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id },
    // shortEnd 문법 -> id:id = id 만 써도 됨
  });

  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: 'Cannot find given id' });
  }
});

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
app.post('/users', async (req, res) => {
  assert(req.body, CreateUser); //전달받은 데이터 검증을 진행
  const { userPreference, ...userFields } = req.body;

  const user = await prisma.user.create({
    data: {
      ...userFields,
      userPreference: {
        create: userPreference,
      },
    },
    include: {
      userPreference: true,
    },
  });
  // 별도의 model로 되어있기 때문에 create : userPreference로 값을 만들어서 사용

  res.status(201).send(user);
});

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

app.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  // 데이터 검증 심화 구문
  try {
    assert(data, UpdateUser);
  } catch (e) {
    console.log(e);
    return res.status(400).send();
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });

  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: 'Cannot find given id' });
  }
});

// users DELETE
app.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  const user = await prisma.user.delete({
    where: { id },
  });

  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: 'Cannot find given id' });
  }
});

// ===================== Product API Zone ============================

// product GET all
app.get('/products', async (req, res) => {
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
});

app.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'cannot find' });
  }
});

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

app.post('/products', async (req, res) => {
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
});

// product PATCH
app.patch('/products/:id', async (req, res) => {
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
});

// product DELETE
app.delete('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.delete({
    where: { id },
  });

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'cannot find' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
