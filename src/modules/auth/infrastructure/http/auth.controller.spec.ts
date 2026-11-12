import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { setupApp } from '@/setup-app';
import { AuthModule } from '../../auth.module';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { NewUser, User } from '../../domain/entities/user.entity';
import { MAILER } from '@/modules/notifications/domain/mailer';

/** Repositorio en memoria: prueba el flujo completo sin base de datos. */
class InMemoryUsers implements UserRepository {
  users: User[] = [];
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async findById(id: string) {
    return this.users.find((u) => u.id === id) ?? null;
  }
  async create(data: NewUser) {
    const user: User = { id: `u${this.users.length + 1}`, role: 'CUSTOMER', createdAt: new Date(), ...data };
    this.users.push(user);
    return user;
  }
  tokens = new Map<string, { userId: string; expiresAt: Date; used: boolean }>();
  async updatePassword(id: string, passwordHash: string) { (await this.findById(id))!.passwordHash = passwordHash; }
  async createResetToken(userId: string, tokenHash: string, expiresAt: Date) { this.tokens.set(tokenHash, { userId, expiresAt, used: false }); }
  async consumeResetToken(tokenHash: string) {
    const t = this.tokens.get(tokenHash);
    if (!t || t.used || t.expiresAt < new Date()) return null;
    t.used = true; return this.findById(t.userId);
  }
  async updateProfile(id: string, data: Partial<Pick<User, 'name' | 'phone'>>) {
    const user = (await this.findById(id)) as User;
    Object.assign(user, data);
    return user;
  }
}

const mailer = { send: jest.fn().mockResolvedValue(undefined) };

describe('Auth (HTTP, repositorio en memoria)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-muy-largo';
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), AuthModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue(new InMemoryUsers())
      .overrideProvider(MAILER)
      .useValue(mailer)
      .compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(() => app.close());

  const body = { email: 'Ana@Correo.com ', name: 'Ana', password: 'Clave1234' };

  it('registra y regresa token sin exponer el hash', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send(body).expect(201);
    expect(res.body.data.user).toMatchObject({ email: 'ana@correo.com', role: 'CUSTOMER' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('no permite registrar el mismo correo dos veces', async () => {
    const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send(body).expect(409);
    expect(res.body.error.message).toBe('Ya existe una cuenta con ese correo');
  });

  it('rechaza contraseñas débiles con detalle de validación', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...body, email: 'otro@correo.com', password: 'corta' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('login con contraseña incorrecta da 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ana@correo.com', password: 'mala1234' })
      .expect(401);
  });

  it('login correcto y /me con el token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ana@correo.com', password: 'Clave1234' })
      .expect(200);
    token = res.body.data.accessToken;

    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(me.body.data.email).toBe('ana@correo.com');
  });

  it('/me sin token da 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('PATCH /me actualiza el teléfono', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '7221234567' })
      .expect(200);
    expect(res.body.data.phone).toBe('7221234567');
  });

  it('olvidé mi contraseña: responde igual exista o no el correo y manda el enlace', async () => {
    const r1 = await request(app.getHttpServer()).post('/api/v1/auth/forgot-password').send({ email: 'nadie@correo.com' }).expect(200);
    const r2 = await request(app.getHttpServer()).post('/api/v1/auth/forgot-password').send({ email: 'ana@correo.com' }).expect(200);
    expect(r1.body.data.message).toBe(r2.body.data.message);
    expect(mailer.send).toHaveBeenCalledTimes(1);
    expect(mailer.send.mock.calls[0][0].to).toBe('ana@correo.com');
  });

  it('restablece la contraseña con el token del correo y lo invalida', async () => {
    const link: string = mailer.send.mock.calls[0][0].text;
    const resetToken = new URL(link.match(/https?:\/\/\S+/)![0]).searchParams.get('token')!;
    await request(app.getHttpServer()).post('/api/v1/auth/reset-password').send({ token: resetToken, password: 'Nueva1234' }).expect(200);
    await request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'ana@correo.com', password: 'Nueva1234' }).expect(200);
    await request(app.getHttpServer()).post('/api/v1/auth/reset-password').send({ token: resetToken, password: 'Otra12345' }).expect(400);
  });
});
