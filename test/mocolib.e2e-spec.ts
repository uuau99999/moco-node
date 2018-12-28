import { MocoServer } from '../src/lib/mocolib';
import * as _request from 'supertest';

const request = _request('http://localhost:5001');

describe('can givenStub successfully', () => {
  let stubServer: MocoServer | null = null;
  beforeAll(async () => {
    stubServer = await new MocoServer('contracts', 5001);
    await stubServer.start();
  });

  afterAll(() => {
    stubServer.stop();
  });

  it('can givenStub with POST request', async done => {
    stubServer.givenStub('[b-api]should_return_weather_given_local_city_name');

    request
      .post('/graphql')
      .send({
        query:
          '{getWeatherByCityName(city:"苏州"){temperature weather washIndex weatherId}}',
      })
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, response) => {
        if (err) {
          done(err);
        }
        expect(response.body).toEqual({
          data: {
            getWeatherByCityName: {
              temperature: '20℃~27℃',
              weather: '多云',
              washIndex: '洗车指数:较不宜',
              weatherId: ['01', '01', '01'],
            },
          },
        });
        done();
      });
  });

  it('can givenStub with POST request and headers', async done => {
    stubServer.givenStub(
      '[b-api]should_return_service_cities_when_guest_select_service_cities',
    );

    request
      .post('/graphql')
      .set({
        Authorization: 'Bearer jwt-token-username-chenqian',
        jwtSecret: '_SEMS_JWT_SECRET_201805260909999',
        'Content-Type': 'application/json;charset=UTF-8',
      })
      .send({
        query:
          '{serviceCities { popular { code name longitude latitude } coming { code name longitude latitude } } }',
      })
      .expect(200)
      .end((err, response) => {
        if (err) {
          done(err);
        }
        expect(response.body).toEqual({
          data: {
            serviceCities: {
              popular: [
                {
                  code: '5810',
                  name: '广州',
                  longitude: '23.129112',
                  latitude: '113.264385',
                },
                {
                  code: '5811',
                  name: '深圳',
                  longitude: '22.547',
                  latitude: '114.085947',
                },
              ],
              coming: [
                {
                  code: '5812',
                  name: '杭州',
                  longitude: '30.245853',
                  latitude: '120.209947',
                },
              ],
            },
          },
        });
        done();
      });
  });

  it('can givenStub with GET request', async done => {
    stubServer.givenStub(
      '[b-beauty]user_can_get_order_detail_which_need_to_sync_from_platform',
    );

    request
      .get('/orders/beauty-order-id_4')
      .set({
        Authorization: 'Bearer jwt-token-username-chenqian',
        jwtSecret: '_SEMS_JWT_SECRET_201805260909999',
        'Content-Type': 'application/json;charset=UTF-8',
      })
      .expect(200)
      .end((err, response) => {
        if (err) {
          done(err);
        }
        expect(response.header['content-type']).toEqual(
          'application/json; charset=utf-8',
        );
        expect(response.body).toEqual({
          id: 'beauty-transaction-id_4',
          platformOrderId: 'beauty-order-id_4',
          platformOrderNo: '201811232058430001',
          user: {
            id: 'user-id-chenqian',
            name: null,
          },
          outlet: {
            id: 'outlet-001',
            name: '白石洲洗车店',
          },
          amount: 45.0,
          discountAmount: null,
          settleAmount: 45.0,
          orderStatus: 'COMPLETED',
          orderedDate: '2018-11-23 14:20:10',
          expiredDate: '2018-11-23 14:20:10',
          canceledDate: null,
          orderItems: [
            {
              id: 'order-item-001',
              orderId: 'beauty-transaction-id_4',
              voucher: {
                id: 'c08af471ec4d11e8b843001c4291208e',
                name: '标准洗车',
                description: '盛大标准洗车、适用于本APP所有洗车店',
                price: null,
                validDays: null,
                count: null,
              },
              voucherCode: '210ZXCQC11281410451234567',
              voucherStatus: 'USABLE',
              verifiedDate: null,
              effectiveDate: '2018-11-28 14:10:45',
              expiredDate: '2019-05-27 14:10:45',
            },
            {
              id: 'order-item-002',
              orderId: 'beauty-transaction-id_4',
              voucher: {
                id: 'c08af471ec4d11e8b843001c4291208e',
                name: '标准洗车',
                description: '盛大标准洗车、适用于本APP所有洗车店',
                price: null,
                validDays: null,
                count: null,
              },
              voucherCode: '210ZXCQC11281410451234567',
              voucherStatus: 'USABLE',
              verifiedDate: null,
              effectiveDate: '2018-11-28 14:10:45',
              expiredDate: '2019-05-27 14:10:45',
            },
          ],
        });
        done();
      });
  });

  it('can givenStub with GET request url with Chinese character', async done => {
    stubServer.givenStub(
      '[b-support]should_return_weather_given_local_city_name',
    );
    request.get(encodeURI('/weather/苏州')).end((err, response) => {
      if (err) {
        done(err);
      }
      expect(response.body).toEqual({
        temperature: '20℃~27℃',
        washIndex: '较不宜',
        weather: '多云',
        weatherId: ['01', '01', '01'],
      });
      done();
    });
  });
});
