import { MocoServer } from '../src/lib/mocolib';

describe('Contract tree can be build successfully', () => {
  it('test contract tree build', async () => {
    const stubServer = new MocoServer('contracts', 5001);
    await stubServer.buildContractMap();
    const data = stubServer.getContratMap();
    expect(data.size).toBe(11);
    expect(
      data
        .get('[b-api]should_return_weather_given_local_city_name')
        .getDescription(),
    ).toBe('[b-api]should_return_weather_given_local_city_name');
    expect(
      data.get('[b-api]should_return_weather_given_local_city_name').getTag(),
    ).toBe('b-api');
    expect(
      data
        .get('[b-api]should_return_weather_given_local_city_name')
        .getRequest(),
    ).toEqual({
      json: {
        query:
          '{getWeatherByCityName(city:"苏州"){temperature weather washIndex weatherId}}',
      },
      method: 'POST',
      uri: '/graphql',
    });
  });
});
